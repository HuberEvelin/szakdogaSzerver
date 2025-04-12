const express = require('express');
const auth = require('../tools/auth');
const router = express.Router();
const con = require('../lib/db');

router.get('/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;

    con.query('SELECT * FROM megjegyzesek WHERE lako_id = ?', [id], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a megjegyzések lekérdezése közben.' });
        }
        return res.json(results);
    });
});

router.delete('/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;
    if (!id) {
        return res.status(400).json({ error: 'Hiányzó id paraméter a megjegyzés törléséhez.' });
    }
    const query = 'DELETE FROM megjegyzesek WHERE id = ?';
    con.query(query, [id], function (err, results) {
        if (err) {
            console.error('SQL Hiba:', err);
            return res.status(500).json({ error: 'Hiba történt a megjegyzés törlése közben.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'A megadott azonosítóval nem található megjegyzés.' });
        }

        return res.status(200).json({ message: 'Sikeres törlés.', results });
    });
});


router.post('/', auth.authenticateToken, (req, res) => {
    const { lako_id, szoveg, bejegyzo_id } = req.body;

    if (!lako_id || !szoveg || !bejegyzo_id) {
        return res.status(400).json({ error: 'Hiányzó vagy érvénytelen paraméterek.' });
    }

    const datum = new Date();
    const formattedDate = datum.toISOString().slice(0, 19).replace('T', ' ');

    const query = 'INSERT INTO megjegyzesek (lako_id, datum, szoveg, bejegyzo_id) VALUES (?, ?, ?, ?)';
    const values = [lako_id, formattedDate, szoveg, bejegyzo_id];

    con.query(query, values, (err, results) => {
        if (err) {
            console.error('Hiba történt a megjegyzés létrehozása közben:', err.message);
            return res.status(500).json({ error: 'Hiba történt a megjegyzés létrehozása közben.' });
        }
        
        return res.status(201).json({
            message: 'A megjegyzés sikeresen létrehozva.',
            insertId: results.insertId,
        });
    });
});


module.exports = router;