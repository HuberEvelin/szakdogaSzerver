const express = require('express');
const con = require('../lib/db');
const auth = require('../tools/auth');
const router = express.Router();

router.get('/', auth.authenticateToken, (req, res) => {
    con.query('SELECT * FROM dolgozok', function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a dolgozók lekérdezése közben.' });
        }
        return res.json(results);
    });
});

module.exports = router;