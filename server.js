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
    secret: 'titkoskod-nagyon-hosszu-es-biztonsagos',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        maxAge: 60000,
        sameSite: 'none'
    }
}));
app.use(passport.initialize());
app.use(passport.session({secret: 'titkoskod-nagyon-hosszu-es-biztonsagos'}));

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin === 'null' || origin.startsWith('http://') || origin.startsWith('https://')) {
            callback(null, true);
        } else {
            callback(new Error('Origin not allowed by CORS'));
        }
    },
    credentials: true
}));



const checkGuestCode = require('./tools/guestCodeChecker');
app.use(checkGuestCode);


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

app.use('/vendeg', require('./routes/guest'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Valami hiba történt a szerveren.' });
});

app.listen(8080, () => console.log('Server is on port: ' + 8080));