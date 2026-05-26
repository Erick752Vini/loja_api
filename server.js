const express = require('express');
const cors = require('cors');
const conexao = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API funcionando!');
});

const rotasProdutos = require('./produtos.js')(conexao);
app.use('/produtos', rotasProdutos);

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
