const express = require('express');
const con = require('../lib/db');
const auth = require('../tools/auth');
const router = express.Router();


router.get('/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;

    con.query('SELECT * FROM resztvevok WHERE esemeny_id = ?', [id], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a résztvevők lekérdezése közben.' });
        }
        return res.json(results);
    });
});

module.exports = router;