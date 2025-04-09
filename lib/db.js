const sql = require('mysql');

const config = {
    host: 'szakdogadb.c3aw24qy2rgf.eu-north-1.rds.amazonaws.com',
    user: 'admin',
    password: '03170828Admin',
    database: 'szakdoga'
};

sql.connect(config, (err) => {
    if (err) {
        console.error('Hiba az adatbázis kapcsolódás során:', err);
    } else {
        console.log('Sikeres kapcsolat az Azure SQL adatbázishoz!');
    }
});
