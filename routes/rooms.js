const express = require('express');
const con = require('../lib/db');
const auth = require('../tools/auth');
const router = express.Router();

router.get('/', auth.authenticateToken, (req, res) => {
    con.query('SELECT * FROM szobak', function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a szobák lekérdezése közben.' });
        }
        return res.json(results);
    });
});

router.post('/', auth.authenticateToken, (req, res) => {
    const { szobaszamString, reszleg_id } = req.body;
    let szobaszam = -1;

    try {
        szobaszam = parseInt(szobaszamString);
        if (isNaN(szobaszam)) {
            return res.status(400).json({ error: 'A szobaszám híbás típusú!' });
        }
    } catch (error) {
        return res.status(400).json({ error: 'A szobaszám híbás típusú!' });
    }

    if (!szobaszam || !reszleg_id) {
        return res.status(400).json({ error: 'Hiányos adatok!' });
    }

    if (isNaN(reszleg_id)) {
        return res.status(400).json({ error: 'Érvénytelen részleg ID!' });
    }

    const values = [reszleg_id, szobaszam];

    const noDuplicateRoomQuery = 'SELECT * FROM szobak WHERE reszleg_id = ? AND szobaszam = ?';

    con.query(noDuplicateRoomQuery, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a szoba létrehozása közben: ' + err });
        }
        if (result.length > 0) {
            return res.status(400).json({ error: 'Már létezik ebben a részlegben ilyen számú szoba!' });
        }

        const query = 'INSERT INTO szobak (reszleg_id, szobaszam) VALUES (?, ?)';
        con.query(query, values, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba történt a szoba létrehozása közben: ' + err });
            }
            return res.status(201).json({ message: 'Szoba sikeresen létrehozva.', id: result.insertId });
        });
    });
});

router.delete('/:id', auth.authenticateToken, (req, res) => {
    const { id } = req.params;

    if (id === '-1') {
        return res.status(400).json({ error: 'Ez a szoba nem törölhető!' });
    }

    const updateRoomsQuery = 'UPDATE lakok SET szoba_id = -1 WHERE szoba_id = ?';
    const deleteSectionQuery = 'DELETE FROM szobak WHERE id = ?';

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
                        res.status(500).json({ error: 'Hiba történt a szoba törlésekor.' });
                    });
                }

                con.commit(err => {
                    if (err) {
                        return con.rollback(() => {
                            res.status(500).json({ error: 'Hiba történt a tranzakció véglegesítésekor.' });
                        });
                    }
                    res.status(200).json({ message: 'Szoba és hozzá tartozó lakók sikeresen frissítve és törölve.' });
                });
            });
        });
    });
});

router.get('/:reszleg', auth.authenticateToken, (req, res) => {
    const reszleg = req.params.reszleg;

    con.query('SELECT * FROM szobak WHERE reszleg = ?', [reszleg], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a szobák lekérdezése közben.' });
        }
        return res.json(results);
    });
});

router.put('/', auth.authenticateToken, (req, res) => {
    const { id, szobaszam, reszleg_id } = req.body;

    if (id === -1) {
        return res.status(400).json({ error: 'A -1 azonosítójú szoba részleg azonosítója nem módosítható.' });
    }

    if (!id || !szobaszam || !reszleg_id) {
        return res.status(400).json({ error: 'Hiányzó adatok. Kérjük, adja meg a szobaszámot, részleg azonosítót és a szoba azonosítót.' });
    }

    const query = 'UPDATE szobak SET szobaszam = ?, reszleg_id = ? WHERE id = ?';
    con.query(query, [szobaszam, reszleg_id, id], function (err, results) {
        if (err) {
            console.error('SQL Error:', err);
            return res.status(500).json({ error: 'Hiba történt a szobák frissítése közben.' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'A megadott azonosítóval nem található szoba.' });
        }

        return res.json({ message: 'A szoba frissítése sikeresen megtörtént.', results });
    });
});




module.exports = router;