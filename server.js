const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const { router: userRoutes, passport } = require('./routes/user');
const morgan = require('morgan');
const cors = require('cors');
var fs = require('fs');
var path = require('path');

dotenv.config();

const app = express();

var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
app.use(morgan('tiny', { stream: accessLogStream }));

const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = ['https://localhost:8081']; 
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));

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