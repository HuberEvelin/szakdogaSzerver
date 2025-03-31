const express = require('express');
const con = require('../lib/db');
const auth = require('../tools/auth');
const router = express.Router();

router.get('/', auth.authenticateToken, (req, res) => {
    con.query('SELECT * FROM penzmozgasok', function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a tranzakciók lekérdezése közben.' });
        }
        return res.json(results);
    });
});

router.get('/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;

    con.query('SELECT * FROM penzmozgasok WHERE kassza_id = ?', [id], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a tranzakciók lekérdezése közben.' });
        }
        return res.json(results);
    });
});

router.post('/', auth.authenticateToken, (req, res) => {
    const { valtozas, bejegyzo_id, kassza_id, komment } = req.body;

    if (!valtozas || !bejegyzo_id || !kassza_id) {
        return res.status(400).json({ error: 'Hiányzó kötelező adatok.' });
    }

    const parsedValtozas = Number(valtozas);
    const parsedBejegyzoId = Number(bejegyzo_id);
    const parsedKasszaId = Number(kassza_id);
    

    if (isNaN(parsedValtozas) || isNaN(parsedBejegyzoId) || isNaN(parsedKasszaId)) {
        return res.status(400).json({ error: 'Érvénytelen szám értékek a bemeneti adatokban.' });
    }

    const datum = new Date();
    const formattedDate = datum.toISOString().slice(0, 19).replace('T', ' ');


    con.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: 'Tranzakció kezdése sikertelen.' });
        }

        const insertTransactionQuery = `
            INSERT INTO penzmozgasok (valtozas, bejegyzo_id, kassza_id, datum, komment)
            VALUES (?, ?, ?, ?, ?)
        `;
        con.query(insertTransactionQuery, [parsedValtozas, parsedBejegyzoId, parsedKasszaId, formattedDate, komment || null], (err, results) => {
            if (err) {
                return con.rollback(() => {
                    console.log(err);
                    res.status(500).json({ error: 'Hiba történt az új tranzakció mentése közben.' });
                });
            }

            // Kassza egyenlegének frissítése
            const updateBalanceQuery = `
                UPDATE kasszak
                SET egyenleg = egyenleg + ?
                WHERE id = ?
            `;
            con.query(updateBalanceQuery, [parsedValtozas, parsedKasszaId], (err, results) => {
                if (err) {
                    return con.rollback(() => {
                        res.status(500).json({ error: 'Hiba történt a kassza egyenlegének frissítése közben.' });
                    });
                }

                // Tranzakció véglegesítése
                con.commit((err) => {
                    if (err) {
                        return con.rollback(() => {
                            res.status(500).json({ error: 'Tranzakció véglegesítése sikertelen.' });
                        });
                    }
                    res.status(200).json({ message: 'Tranzakció sikeresen elmentve és kassza frissítve.' });
                });
            });
        });
    });
});



module.exports = router;