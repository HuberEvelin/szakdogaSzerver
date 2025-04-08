const express = require('express');
const con = require('../lib/db');
const auth = require('../tools/auth');
const router = express.Router();

router.post('/check', (req, res) => {
    const { kod } = req.body;

    if (!kod) {
        return res.status(400).json({ error: 'A kód nem lett megadva.' });
    }

    const checkCodeQuery = `
        SELECT * 
        FROM lakok 
        WHERE vendegkod = ?
    `;

    con.query(checkCodeQuery, [kod], (err, lakokResults) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt az adatbázis lekérdezése közben.' });
        }

        if (lakokResults.length === 0) {
            return res.status(404).json({ error: 'A megadott kód nem létezik.' });
        }

        const lakokData = lakokResults[0];
        const kodDatum = new Date(lakokData.kod_datum);
        const now = new Date();

        const hoursDifference = (now - kodDatum) / (1000 * 60 * 60);

        if (hoursDifference > 72) {
            const updateQuery = `
                UPDATE lakok 
                SET vendegkod = NULL, kod_datum = NULL 
                WHERE vendegkod = ?
            `;

            con.query(updateQuery, [kod], (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ error: 'Hiba történt az adatbázis frissítése közben.' });
                }

                return res.status(400).json({ error: 'A kód lejárt, és eltávolításra került.' });
            });
        } else {
            return res.status(200).json({ message: 'A kód érvényes és nincs lejárva.' });
        }
    });
});


router.post('/', (req, res) => {
    const { kod } = req.body;

    if (!kod) {
        return res.status(400).json({ error: 'A kód nem lett megadva.' });
    }

    const checkCodeQuery = `
        SELECT * 
        FROM lakok 
        WHERE vendegkod = ?
    `;

    con.query(checkCodeQuery, [kod], (err, lakokResults) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt az adatbázis lekérdezése közben.' });
        }

        if (lakokResults.length === 0) {
            return res.status(404).json({ error: 'A megadott kód nem létezik.' });
        }

        const lakoData = lakokResults[0];
        const kodDatum = new Date(lakoData.kod_datum);
        const now = new Date();

        const hoursDifference = (now - kodDatum) / (1000 * 60 * 60);

        if (hoursDifference > 72) {
            const updateQuery = `
                UPDATE lakok 
                SET vendegkod = NULL, kod_datum = NULL 
                WHERE vendegkod = ?
            `;

            con.query(updateQuery, [kod], (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ error: 'Hiba történt az adatbázis frissítése közben.' });
                }

                return res.status(400).json({ error: 'A kód lejárt, és eltávolításra került.' });
            });
        } else {
            if (!lakoData.kassza_id || lakoData.kassza_id === -1) {
                return res.status(400).json({ error: 'Érvénytelen kassza_id érték.' });
            }

            const kasszakQuery = `
                SELECT * 
                FROM kasszak 
                WHERE id = ?
            `;

            con.query(kasszakQuery, [lakoData.kassza_id], (kasszaErr, kasszaResults) => {
                if (kasszaErr) {
                    return res.status(500).json({ error: 'Hiba történt a kasszak lekérdezése közben.' });
                }

                const kasszaData = kasszaResults[0];

                const penzmozgasokQuery = `
                    SELECT * 
                    FROM penzmozgasok 
                    WHERE kassza_id = ?
                `;

                con.query(penzmozgasokQuery, [lakoData.kassza_id], (penzErr, penzResults) => {
                    if (penzErr) {
                        return res.status(500).json({ error: 'Hiba történt a penzmozgasok lekérdezése közben.' });
                    }

                    const szobakQuery = `
                        SELECT szobak.szobaszam, reszlegek.nev AS reszleg_nev
                        FROM szobak
                        JOIN reszlegek ON szobak.reszleg_id = reszlegek.id
                        WHERE szobak.id = ?
                    `;

                    con.query(szobakQuery, [lakoData.szoba_id], (szobaErr, szobaResults) => {
                        if (szobaErr) {
                            return res.status(500).json({ error: 'Hiba történt a szoba és részleg adatainak lekérdezése közben.' });
                        }

                        const szobaData = szobaResults[0];

                        const kommentekQuery = `
                            SELECT * 
                            FROM megjegyzesek 
                            WHERE lako_id = ?
                        `;

                        con.query(kommentekQuery, [lakoData.id], (kommentErr, kommentResults) => {
                            if (kommentErr) {
                                return res.status(500).json({ error: 'Hiba történt a kommentek lekérdezése közben.' });
                            }

                            return res.status(200).json({
                                lako: lakoData,
                                kassza: kasszaData,
                                penzmozgasok: penzResults,
                                kommentek: kommentResults,
                                szoba: szobaData 
                            });
                        });
                    });
                });
            });
        }
    });
});


router.post('/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ error: 'Az id nem lett megadva.' });
    }

    function generateCode(length = 10) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            code += characters[randomIndex];
        }
        return code;
    }

    const newCode = generateCode();
    const currentDate = new Date();

    const updateQuery = `
        UPDATE lakok 
        SET vendegkod = ?, kod_datum = ? 
        WHERE id = ?
    `;

    con.query(updateQuery, [newCode, currentDate, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt az adatok frissítése közben.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'A megadott id-hez nem tartozik lakó.' });
        }

        return res.status(200).json({
            message: 'Kód és dátum sikeresen frissítve.',
            vendegkod: newCode,
            kod_datum: currentDate
        });
    });
});

module.exports = router;



