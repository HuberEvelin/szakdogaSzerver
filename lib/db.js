const sql = require('mssql');

// Konfigurációs objektum
const config = {
    user: 'AzureDbAdmin',
    password: '03170828Admin',
    server: 'szakdogadbszerver.database.windows.net',
    database: 'szakdoga',
    options: {
        encrypt: true,
        trustServerCertificate: false
    },
    port: 1433,
    secret: 'titok'
};

sql.connect(config, (err) => {
    if (err) {
        console.error('Hiba az adatbázis kapcsolódás során:', err);
    } else {
        console.log('Sikeres kapcsolat az Azure SQL adatbázishoz!');
    }
});
