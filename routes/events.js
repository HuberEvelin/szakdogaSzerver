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

module.exports = router;
