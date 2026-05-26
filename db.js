const mysql = require('mysql2/promise');

const conexao = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'loja',
    port: process.env.DB_PORT || 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('Pool de conexão do MySQL configurado via db.js!');

module.exports = conexao;
