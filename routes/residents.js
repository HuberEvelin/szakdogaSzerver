const express = require('express');
const con = require('../lib/db');
const auth = require('../tools/auth');
const router = express.Router();

router.get('/', auth.authenticateToken, (req, res) => {
    con.query('SELECT * FROM lakok', function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a lakók lekérdezése közben.' });
        }
        return res.json(results);
    });
});

router.get('/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;

    con.query('SELECT * FROM lakok WHERE id = ?', [id], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a lakó adatainak lekérdezése közben.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Az adott azonosítóval nem található lakó.' });
        }
        return res.json(results[0]);
    });
});

router.put('/:id', auth.authenticateToken, (req, res) => {
    const { id } = req.params;
    const { nev, szuletesi_ido, szoba_id, kassza_id, nevnap } = req.body;

    // Ellenőrizzük, hogy van-e megadva adat frissítésre
    if (!nev && !szuletesi_ido && !szoba_id && !kassza_id && !nevnap) {
        return res.status(400).json({ error: 'Legalább egy mezőt meg kell adni a frissítéshez.' });
    }

    // SQL lekérdezés és értékek összeállítása dinamikusan
    let query = 'UPDATE lakok SET';
    const values = [];

    if (nev) {
        query += ' nev = ?,';
        values.push(nev);
    }
    if (szuletesi_ido) {
        query += ' szuletesi_ido = ?,';
        values.push(szuletesi_ido);
    }
    if (szoba_id) {
        query += ' szoba_id = ?,';
        values.push(szoba_id);
    }
    if (kassza_id) {
        query += ' kassza_id = ?,';
        values.push(kassza_id);
    }
    if (nevnap) {
        query += ' nevnap = ?,';
        values.push(nevnap);
    }

    // Utolsó vessző eltávolítása és WHERE feltétel hozzáadása
    query = query.slice(0, -1);
    query += ' WHERE id = ?';
    values.push(id);

    // Adatbázis művelet a lakó adatainak frissítéséhez
    con.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a lakó adatainak frissítése közben.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nem található lakó a megadott ID-val.' });
        }
        // Sikeres válasz visszaküldése
        res.status(200).json({ message: 'Lakó adatai sikeresen frissítve.' });
    });
});

router.post('/', auth.authenticateToken, (req, res) => {
    const { nev, szoba_id = -1, szuletesi_ido, kassza_id = -1, nevnap = null } = req.body;

    if (!nev || !szuletesi_ido) {
        return res.status(400).json({ error: 'A név és születési idő megadása kötelező.' });
    }

    const query = 'INSERT INTO lakok (nev, szuletesi_ido, szoba_id, kassza_id, nevnap) VALUES (?, ?, ?, ?, ?)';
    const values = [nev, szuletesi_ido, szoba_id, kassza_id, nevnap];

    con.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a lakó hozzáadása közben: ' + err });
        }

        const newResidentId = result.insertId;

        res.status(201).json({
            id: newResidentId,
            message: 'Az új lakó sikeresen hozzáadva.',
        });
    });
});


router.get('/szoba/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;

    con.query('SELECT * FROM lakok WHERE szoba_id = ?', [id], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a lakók lekérdezése közben.' });
        }
        return res.json(results);
    });
});

module.exports = router;