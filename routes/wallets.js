const express = require('express');
const con = require('../lib/db');
const auth = require('../tools/auth');
const router = express.Router();

router.get('/lako/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;
    con.query('SELECT * FROM kasszak WHERE id = ?', [id], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a kassza lekérdezése közben a szerver oldalon.' });
        }
        return res.json(results);
    });
});

router.get('/leszamolatlan', auth.authenticateToken, (req, res) => {
    const query = `
        SELECT lakok.id
        FROM lakok
        INNER JOIN kasszak ON lakok.kassza_id = kasszak.id
        WHERE kasszak.leszamolva = 0
    `;

    con.query(query, function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a lakók lekérdezése közben a szerver oldalon.' });
        }
        if (results.length === 0) {
            return res.status(204).json({ message: 'Nincs leszámolatlan kasszával rendelkező lakó.' });
        }
        return res.json(results);
    });
});

router.get('/tartozas', auth.authenticateToken, (req, res) => {
    const query = `
        SELECT lakok.id
        FROM lakok
        INNER JOIN kasszak ON lakok.kassza_id = kasszak.id
        WHERE kasszak.egyenleg < 0
    `;

    con.query(query, function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a lakók lekérdezése közben a szerver oldalon.' });
        }
        if (results.length === 0) {
            return res.status(204).json({ message: 'Nincs tartozással rendelkező lakó.' });
        }
        return res.json(results);
    });
});


router.post('/', auth.authenticateToken, (req, res) => {
    const query = 'INSERT INTO kasszak (egyenleg, leszamolva) VALUES (?, ?)';
    const values = [0, 0];
    con.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a kassza létrehozása közben.' + err });
        }

        const newId = result.insertId;
        const selectQuery = 'SELECT * FROM kasszak WHERE id = ?';
        con.query(selectQuery, [newId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba történt a kassza adatainak lekérdezése közben.' + err });
            }
            res.status(201).json(result[0]);
        });
    });
});

router.put('/lako/:id', auth.authenticateToken, (req, res) => {
    console.log(req.body, req.params);
    const { id } = req.params;
    const { leszamolva } = req.body;

    if (!id || typeof leszamolva === 'undefined') {
        return res.status(400).json({ error: 'Hiányzó vagy érvénytelen paraméterek.' });
    }

    const query = 'UPDATE kasszak SET leszamolva = ? WHERE id = ?';
    const values = [leszamolva, id];

    con.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a kassza adatainak frissítése közben.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nem található kassza a megadott ID-val.' });
        }

        res.status(200).json({ message: 'Kassza adatai sikeresen frissítve.' });
    });
});

router.put('/tomegesLeszamolas', auth.authenticateToken, (req, res) => {
    const { leszamolva } = req.body;

    if (typeof leszamolva === 'undefined') {
        return res.status(400).json({ error: 'Hiányzó vagy érvénytelen paraméterek.' });
    }

    const query = 'UPDATE kasszak SET leszamolva = ?';
    const values = [leszamolva];

    con.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a kassza adatainak frissítése közben.' });
        }

        res.status(200).json({
            message: 'Minden kassza adatai sikeresen frissítve.',
            affectedRows: result.affectedRows
        });
    });
});

router.put('/tomegesNullazas', auth.authenticateToken, (req, res) => {

    const query = 'UPDATE kasszak SET egyenleg = 0';

    con.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a kassza adatainak frissítése közben.' });
        }

        res.status(200).json({
            message: 'Minden kassza adatai sikeresen frissítve.',
            affectedRows: result.affectedRows
        });
    });
});



module.exports = router;