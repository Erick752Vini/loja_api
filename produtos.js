const express = require('express');
const router = express.Router();

module.exports = (conexao) => {
    
    router.get('/', (req, res) => {
        const sql = 'SELECT * FROM v_produto'; 
        conexao.query(sql, (erro, resultados) => {
            if (erro) {
                console.error('Erro ao buscar produtos:', erro);
                return res.status(500).json({ erro: 'Erro no banco de dados.' });
            }
            return res.status(200).json(resultados);
        });
    });

    router.post('/', (req, res) => {
        const { nome, valor, quantidade, categoria } = req.body;

        if (!nome || nome.trim() === '') {
            return res.status(400).json({ erro: 'O campo nome é obrigatório.' });
        }

        if (valor === undefined || isNaN(valor) || valor <= 0) {
            return res.status(400).json({ erro: 'O valor deve ser um número maior que zero.' });
        }

        if (quantidade === undefined || !Number.isInteger(quantidade) || quantidade < 0) {
            return res.status(400).json({ erro: 'A quantidade deve ser um número inteiro igual ou maior que zero.' });
        }

        if (!categoria || categoria.trim() === '') {
            return res.status(400).json({ erro: 'O campo categoria é obrigatório.' });
        }

        const sql = 'INSERT INTO produtos (nome, valor, quantidade, categoria) VALUES (?, ?, ?, ?)';
        
        conexao.query(sql, [nome, valor, quantidade, categoria], (erro, resultado) => {
            if (erro) {
                console.error('Erro ao inserir produto:', erro);
                return res.status(500).json({ erro: 'Erro ao salvar o produto no banco de dados.' });
            }
            
            return res.status(201).json({ 
                mensagem: 'Produto cadastrado com sucesso!', 
                id_produto: resultado.insertId 
            });
        });
    });

    return router;
};
