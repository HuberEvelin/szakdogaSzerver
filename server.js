const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const { router: userRoutes, passport } = require('./routes/user');
const morgan = require('morgan');
var fs = require('fs');
var path = require('path');

dotenv.config();

const app = express();

var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
app.use(morgan('tiny', { stream: accessLogStream }));

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        maxAge: 60000,
        sameSite: 'none'
    }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
    origin: 'http://localhost:8081',
    credentials: true
}));

app.use('/user', userRoutes);
app.use('/dolgozok', require('./routes/workers'));

app.use('/esemenyek', require('./routes/events'));
app.use('/resztvevok', require('./routes/attendees'));

app.use('/kassza', require('./routes/wallets'));
app.use('/penzmozgasok', require('./routes/transactions'));

app.use('/szobak', require('./routes/rooms'));
app.use('/reszlegek', require('./routes/sectors'));

app.use('/lakok', require('./routes/residents'));

app.use('/uzenofal', require('./routes/messages'));
app.use('/megjegyzesek', require('./routes/comments'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Valami hiba történt a szerveren.' });
});

app.listen(3000, () => console.log('Server is on port 3000.'));