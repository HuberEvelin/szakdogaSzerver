const express = require('express');
const auth = require('../tools/auth');
const router = express.Router();
const con = require('../lib/db');

router.get('/posztok', auth.authenticateToken, (req, res) => {
    con.query('SELECT * FROM uzenofal_posztok', function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a posztok lekérdezése közben.' + err });
        }
        return res.json(results);
    });
});

router.post('/posztok', auth.authenticateToken, (req, res) => {
    const { bejegyzo_id, cim, szoveg } = req.body;
    const datum = new Date();
    const formattedDate = datum.toISOString().slice(0, 19).replace('T', ' ');

    const query = 'INSERT INTO uzenofal_posztok (bejegyzo_id, cim, szoveg, datum) VALUES (?, ?, ?, ?)';
    const values = [bejegyzo_id, cim, szoveg, formattedDate];
    con.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a poszt mentése közben.' });
        }
        return res.status(200).json("Sikeres mentés");
    });
});

router.delete('/posztok/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;
    
    const deletePostQuery = 'DELETE FROM uzenofal_posztok WHERE id = ?';
    const deleteCommentsQuery = 'DELETE FROM uzenofal_kommentek WHERE poszt_id = ?';

    con.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a tranzakció indításakor.' });
        }

        con.query(deletePostQuery, [id], (err, result) => {
            if (err) {
                return con.rollback(() => {
                    res.status(500).json({ error: 'Hiba történt a poszt törlésekor.' });
                });
            }

            con.query(deleteCommentsQuery, [id], (err, result) => {
                if (err) {
                    return con.rollback(() => {
                        res.status(500).json({ error: 'Hiba történt a kommentek törlésekor.' });
                    });
                }

                con.commit(err => {
                    if (err) {
                        return con.rollback(() => {
                            res.status(500).json({ error: 'Hiba történt a tranzakció véglegesítésekor.' });
                        });
                    }
                    res.status(200).json({ message: 'A poszt és a kommentjei sikeresen törölve.' });
                });
            });
        });
    });
});

router.get('/posztok/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;

    con.query('SELECT * FROM uzenofal_posztok WHERE id = ?', [id], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a poszt lekérdezése közben.' });
        }
        return res.json(results);
    });
});

router.get('/kommentek/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;

    con.query('SELECT * FROM uzenofal_kommentek WHERE poszt_id = ?', [id], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a poszt kommentjeinek lekérdezése közben.' });
        }
        return res.json(results);
    });
});

router.delete('/kommentek/:id', auth.authenticateToken, (req, res) => {
    const id = req.params.id;

    con.query('DELETE FROM uzenofal_kommentek WHERE id = ?', [id], function (err, results) {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a komment törlése közben.' });
        }
        return res.json(results);
    });
});

router.post('/kommentek/:id', auth.authenticateToken, (req, res) => {
    const poszt_id = req.params.id;
    const { bejegyzo_id, szoveg } = req.body;
    const datum = new Date();
    const formattedDate = datum.toISOString().slice(0, 19).replace('T', ' ');

    const query = 'INSERT INTO uzenofal_kommentek (bejegyzo_id, szoveg, datum, poszt_id) VALUES (?, ?, ?, ?)';
    const values = [bejegyzo_id, szoveg, formattedDate, poszt_id];
    con.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a komment mentése közben.' });
        }
        return res.status(200).json("Sikeres mentés");
    });
});


module.exports = router;