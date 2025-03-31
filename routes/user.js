const express = require('express');
const router = express.Router();
const con = require('../lib/db');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    con.query('SELECT * FROM users WHERE id = ?', [id], function (err, results) {
        if (err) { return done(err); }
        if (results.length === 0) {
            return done(new Error('User not found'));
        }
        done(null, results[0]);
    });
});

passport.use(new LocalStrategy((username, password, cb) => {
    con.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) { return cb(err); }
        if (results.length === 0) {
            return cb(null, false, { message: 'Incorrect username or password.' });
        }

        const user = results[0];
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        if (user.password !== hashedPassword) {
            return cb(null, false, { message: 'Incorrect username or password.' });
        }

        return cb(null, user);
    });
}));

router.get('/current_user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(403).json({ error: 'Bejelentkezés szükséges.' });
    }
});

router.get('/login',
    function (req, res, next) {
        res.send('login page');
    });

router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.json({ message: 'Kijelentkezett.' });
    });
});

router.post('/login/password', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info.message });

        req.logIn(user, (err) => {
            if (err) return next(err);

            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

            return res.json({ message: 'Bejelentkezett.', token, user_id : user.id, dolgozo_id : user.dolgozo_id });
        });
    })(req, res, next);
});

module.exports = {router, passport};