const mysql = require('mysql2');

const conexao = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'loja',
    port: 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

conexao.getConnection((erro, conn) => {
    if (erro) {
        console.error('Erro ao conectar ao MySQL:', erro.message);
    } else {
        console.log('Conectado ao MySQL com sucesso via db.js!');
        conn.release(); 
    }
});

module.exports = conexao;
