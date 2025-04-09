const mysql = require('mysql');
 require('dotenv').config();
 
 const connection = mysql.createConnection({
    host: 'szakdogadb.c3aw24qy2rgf.eu-north-1.rds.amazonaws.com',
    user: 'admin',
    password: '03170828Admin',
    database: 'szakdoga'
 });
 
 connection.connect((err) => {
   if (err) {
     console.error('Error connecting to the database:', err.stack);
     return;
   }
   console.log('Connected to the database.');
 });
 
 module.exports = connection;