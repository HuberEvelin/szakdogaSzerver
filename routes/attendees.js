const express = require('express');
const con = require('../lib/db');
const auth = require('../tools/auth');
const router = express.Router();

router.get('/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;

    con.query('SELECT lako_id FROM resztvevok WHERE esemeny_id = ?', [id], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a résztvevők lekérdezése közben.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Nem található résztvevő az adott eseményhez.' });
        }

        return res.json(results);
    });
});

router.post('/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;
    const { add, remove } = req.body;

    if (!add && !remove) {
        return res.status(400).json({ error: 'Hiányzik a hozzáadandó vagy eltávolítandó ID-k listája.' });
    }

    if (add && add.length > 0) {
        const insertQueries = add.map((lakoId) => {
            return new Promise((resolve, reject) => {
                con.query(
                    'INSERT INTO resztvevok (esemeny_id, lako_id) VALUES (?, ?)',
                    [id, lakoId],
                    (err, results) => {
                        if (err) {
                            return reject(`Hiba történt a hozzáadás során: ${err.message}`);
                        }
                        resolve(results);
                    }
                );
            });
        });

        Promise.all(insertQueries).catch((err) => {
            return res.status(500).json({ error: err });
        });
    }

    if (remove && remove.length > 0) {
        const deleteQueries = remove.map((lakoId) => {
            return new Promise((resolve, reject) => {
                con.query(
                    'DELETE FROM resztvevok WHERE esemeny_id = ? AND lako_id = ?',
                    [id, lakoId],
                    (err, results) => {
                        if (err) {
                            return reject(`Hiba történt a törlés során: ${err.message}`);
                        }
                        resolve(results);
                    }
                );
            });
        });

        Promise.all(deleteQueries).catch((err) => {
            return res.status(500).json({ error: err });
        });
    }

    return res.status(200).json({ message: 'Módosítások sikeresen mentve.' });
});



module.exports = router;