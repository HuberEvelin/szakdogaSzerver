const express = require('express');
const con = require('../lib/db');

const checkGuestCode = (req, res, next) => {
    const checkExpiredCodesQuery = `
        SELECT id, vendegkod, kod_datum 
        FROM lakok 
        WHERE vendegkod IS NOT NULL
    `;

    con.query(checkExpiredCodesQuery, (err, results) => {
        if (err) {
            console.error('Hiba történt a vendégkódok ellenőrzése közben:', err);
            return res.status(500).json({ error: 'Hiba történt a vendégkódok ellenőrzése közben.' });
        }

        const now = new Date();
        const expiredCodes = results.filter(record => {
            if (record.kod_datum) {
                const kodDatum = new Date(record.kod_datum);
                const hoursDifference = (now - kodDatum) / (1000 * 60 * 60);
                return hoursDifference > 72;
            }
            return false;
        });

        if (expiredCodes.length > 0) {
            const updateQuery = `
                UPDATE lakok 
                SET vendegkod = NULL, kod_datum = NULL 
                WHERE id = ?
            `;

            const promises = expiredCodes.map(record => {
                return new Promise((resolve, reject) => {
                    con.query(updateQuery, [record.id], updateErr => {
                        if (updateErr) {
                            console.error(`Hiba történt a vendégkód törlése közben: ${updateErr}`);
                            reject(updateErr);
                        } else {
                            resolve();
                        }
                    });
                });
            });

            Promise.all(promises)
                .then(() => {
                    console.log('Lejárt vendégkódok sikeresen törölve.');
                    next();
                })
                .catch(error => {
                    console.error('Hiba történt a vendégkódok törlése során:', error);
                    return res.status(500).json({ error: 'Hiba történt a vendégkódok törlése során.' });
                });
        } else {
            next();
        }
    });
};
module.exports = checkGuestCode;