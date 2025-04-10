const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_kicsit_hosszabb';

module.exports = {

    isAuthenticated: function (req, res, next) {
    console.log(req);
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Bejelentkezés szükséges.' });
},

authenticateToken: function (req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    console.log(token);
    if (!token) return res.status(401).json({ message: 'Token not provided' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        console.log(token);
        if (err) {
            console.log('Token érvénytelen:', err.message);
            return res.status(401).json({ message: 'Token invalid' });
        } 
        req.user = decoded;
        next();
    });
}
}