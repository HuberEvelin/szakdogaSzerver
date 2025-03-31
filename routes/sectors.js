const express = require('express');
const con = require('../lib/db');
const auth = require('../tools/auth');
const router = express.Router();

router.get('/', auth.authenticateToken, (req, res) => {
    con.query('SELECT * FROM reszlegek', function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a részlegek lekérdezése közben.' });
        }
        return res.json(results);
    });
});

router.post('/', auth.authenticateToken, (req, res) => {
    const { nev } = req.body;
    if (!nev || nev.trim() === '') {
        return res.status(400).json({ error: 'A név nem lehet üres!' });
    }

    const query = 'INSERT INTO reszlegek (nev) VALUES (?)';
    const values = [nev];

    con.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a részleg létrehozása közben.' + err });
        }
        return res.status(201).json({ message: 'Részleg sikeresen létrehozva.', id: result.insertId });
    });
});

router.put('/:id', auth.authenticateToken, (req, res) => {
    const { id } = req.params;
    const { nev } = req.body;

    if (!nev || nev.trim() === '') {
        return res.status(400).json({ error: 'A név nem lehet üres!' });
    }

    const query = 'UPDATE reszlegek SET nev = ? WHERE id = ?';
    const values = [nev, id];

    con.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a részleg nevének frissítése közben.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nem található részleg a megadott ID-val.' });
        }
        res.status(200).json({ message: 'Részleg adatai sikeresen frissítve.' });
    });
});

router.delete('/:id', auth.authenticateToken, (req, res) => {
    const { id } = req.params;

    if (id === '-1') {
        return res.status(400).json({ error: 'Ez a részleg nem törölhető!' });
    }

    const updateRoomsQuery = 'UPDATE szobak SET reszleg_id = -1 WHERE reszleg_id = ?';
    const deleteSectionQuery = 'DELETE FROM reszlegek WHERE id = ?';

    con.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a tranzakció indításakor.' });
        }

        con.query(updateRoomsQuery, [id], (err, result) => {
            if (err) {
                return con.rollback(() => {
                    res.status(500).json({ error: 'Hiba történt a szobák frissítésekor.' });
                });
            }

            con.query(deleteSectionQuery, [id], (err, result) => {
                if (err) {
                    return con.rollback(() => {
                        res.status(500).json({ error: 'Hiba történt a részleg törlésekor.' });
                    });
                }

                con.commit(err => {
                    if (err) {
                        return con.rollback(() => {
                            res.status(500).json({ error: 'Hiba történt a tranzakció véglegesítésekor.' });
                        });
                    }
                    res.status(200).json({ message: 'Részleg és hozzá tartozó szobák sikeresen frissítve és törölve.' });
                });
            });
        });
    });
});

module.exports = router;
