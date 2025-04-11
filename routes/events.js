const express = require('express');
const con = require('../lib/db');
const auth = require('../tools/auth');
const router = express.Router();

router.get('/', auth.authenticateToken, (req, res) => {
    con.query('SELECT * FROM esemenyek', function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt az események lekérdezése közben.' });
        }
        return res.json(results);
    });
});

router.get('/foglalkozasok', auth.authenticateToken, (req, res) => {
    con.query('SELECT * FROM esemenyek where foglalkozas = 1', function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a foglalkozások lekérdezése közben.' });
        }
        return res.json(results);
    });
});

router.post('/', auth.authenticateToken, (req, res) => {
    const { nev, szoveg, bejegyzo_id, datum_kezdet, datum_veg, foglalkozas, szin } = req.body;
    if (!nev || !datum_kezdet || !datum_veg || !bejegyzo_id) {
        return res.status(400).json({ error: 'Hiányzó vagy érvénytelen paraméterek.' });
    }

    let formattedStartDate, formattedEndDate;

    try {
        const startDate = new Date(datum_kezdet);
        const endDate = new Date(datum_veg);

        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({ error: 'Érvénytelen dátumformátum.' });
        }

        formattedStartDate = startDate.toISOString().slice(0, 19).replace('T', ' ');
        formattedEndDate = endDate.toISOString().slice(0, 19).replace('T', ' ');
    } catch (err) {
        return res.status(400).json({ error: 'Hiba a dátumok feldolgozása közben.' });
    }

    const query = 'INSERT INTO esemenyek (nev, szoveg, bejegyzo_id, datum_kezdet, datum_veg, foglalkozas, szin) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [nev, szoveg, bejegyzo_id, formattedStartDate, formattedEndDate, foglalkozas, szin];

    con.query(query, values, (err, results) => {
        if (err) {
            console.error('Hiba történt az esemény létrehozása közben:', err.message);
            return res.status(500).json({ error: 'Hiba történt az esemény létrehozása közben.' });
        }
        
        return res.status(201).json({
            message: 'Az esemény sikeresen létrehozva.',
        });
    });
});


router.get('/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;

    con.query('SELECT * FROM esemenyek WHERE id = ?', [id], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt az események lekérdezése közben.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Az adott azonosítóval nem található esemény.' });
        }
        return res.json(results[0]);
    });
});

router.delete('/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;

    con.query('SELECT foglalkozas FROM esemenyek WHERE id = ?', [id], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt az esemény adatainak lekérdezésekor.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Az adott azonosítóval nem található esemény.' });
        }

        const foglalkozas = results[0].foglalkozas;

        if (foglalkozas === 1) {
            con.query('DELETE FROM resztvevok WHERE esemeny_id = ?', [id], function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Hiba történt a résztvevők törlésekor.' });
                }

                con.query('DELETE FROM esemenyek WHERE id = ?', [id], function (err, results) {
                    if (err) {
                        return res.status(500).json({ error: 'Hiba történt az esemény törlése közben.' });
                    }
                    return res.status(200).json({ message: 'Az esemény és a résztvevők sikeresen törölve.' });
                });
            });
        } else {
            con.query('DELETE FROM esemenyek WHERE id = ?', [id], function (err, results) {
                if (err) {
                    return res.status(500).json({ error: 'Hiba történt az esemény törlése közben.' });
                }
                return res.status(200).json({ message: 'Esemény sikeresen törölve.' });
            });
        }
    });
});


router.put('/:id', auth.authenticateToken, (req, res) => {
    const { id } = req.params;
    const { nev, szoveg, bejegyzo_id, datum_kezdet, datum_veg, foglalkozas, szin } = req.body;

    if (!nev || !datum_kezdet || !datum_veg || !bejegyzo_id) {
        return res.status(400).json({ error: 'Hiányzó vagy érvénytelen paraméterek.' });
    }

    const query = 'UPDATE esemenyek SET nev = ?, szoveg = ?, bejegyzo_id = ?, datum_kezdet = ?, datum_veg = ?, foglalkozas = ?, szin = ? WHERE id = ?';
    const values = [nev, szoveg, bejegyzo_id, datum_kezdet, datum_veg, foglalkozas, szin, id];

    con.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt az esemény frissítése közben.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nem található esemény a megadott ID-val.' });
        }
        res.status(200).json({ message: 'Esemény adatai sikeresen frissítve.' });
    });
});


module.exports = router;
