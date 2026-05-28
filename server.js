require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Sua API está funcionando e segura!');
});

app.get('/produtos', async (req, res) => {
    try {
        const [linhas] = await db.query('SELECT * FROM produtos');
        res.json(linhas);
    } catch (erro) {
        console.error('Erro na consulta:', erro);
        res.status(500).json({ erro: 'Erro interno ao buscar produtos no banco.' });
    }
});

app.get('/produtos/total-por-categoria', async (req, res) => {
    try {
        const sql = `
            SELECT 
                categoria,
                SUM(quantidade) AS total_itens,
                SUM(quantidade * valor) AS valor_total_estoque
            FROM produtos
            GROUP BY categoria
        `;
        const [linhas] = await db.query(sql);
        res.status(200).json(linhas);
    } catch (erro) {
        console.error('Erro ao gerar relatório por categoria:', erro);
        res.status(500).json({ erro: 'Erro interno ao calcular totais por categoria.' });
    }
});

app.post('/produtos', async (req, res) => {
    const { nome, quantidade, valor, categoria } = req.body;

    if (!nome || nome.trim() === '') {
        return res.status(400).json({ erro: 'O campo "nome" é obrigatório.' });
    }
    if (!valor || Number(valor) <= 0) {
        return res.status(400).json({ erro: 'O campo "valor" deve ser um número maior que zero.' });
    }
    if (quantidade === undefined || Number(quantidade) < 0) {
        return res.status(400).json({ erro: 'O campo "quantidade" não pode ser menor que zero.' });
    }
    if (!categoria || categoria.trim() === '') {
        return res.status(400).json({ erro: 'O campo "categoria" é obrigatório.' });
    }

    try {
        const sql = 'INSERT INTO produtos (nome, quantidade, valor, categoria) VALUES (?, ?, ?, ?)';
        const [resultado] = await db.query(sql, [nome, quantidade, valor, categoria]);

        res.status(201).json({
            mensagem: 'Produto cadastrado com sucesso!',
            id: resultado.insertId,
            nome,
            quantidade,
            valor,
            categoria
        });
    } catch (erro) {
        console.error('Erro ao cadastrar produto:', erro);
        res.status(500).json({ erro: 'Erro interno ao salvar o produto no banco.' });
    }
});

app.post('/produtos/:id/movimentacoes', async (req, res) => {
    const { id } = req.params;
    const { quantidade } = req.body;

    if (quantidade === undefined || Number(quantidade) <= 0) {
        return res.status(400).json({ erro: 'A quantidade deve ser maior que zero.' });
    }

    try {
        const [produtoExistente] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);

        if (produtoExistente.length === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }

        const sql = 'UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?';
        await db.query(sql, [Number(quantidade), id]);

        const [produtoAtualizado] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);

        res.status(200).json({
            mensagem: 'Movimentação registrada com sucesso!',
            produto: produtoAtualizado[0]
        });
    } catch (erro) {
        console.error('Erro ao registrar movimentação:', erro);
        res.status(500).json({ erro: 'Erro interno ao registrar movimentação.' });
    }
});

app.put('/produtos/:id/entrada', async (req, res) => {
    const { id } = req.params;
    const { quantidade } = req.body;

    if (quantidade === undefined || Number(quantidade) <= 0) {
        return res.status(400).json({ erro: 'A quantidade de entrada deve ser um número maior que zero.' });
    }

    try {
        const [produtoExistente] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);

        if (produtoExistente.length === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado no sistema.' });
        }

        const sql = 'UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?';
        await db.query(sql, [Number(quantidade), id]);

        const [produtoAtualizado] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);

        res.status(200).json({
            mensagem: 'Entrada de estoque registrada com sucesso!',
            produto: produtoAtualizado[0]
        });
    } catch (erro) {
        console.error('Erro ao registrar entrada:', erro);
        res.status(500).json({ erro: 'Erro interno ao atualizar o estoque.' });
    }
});

app.get('/movimentacoes/saidas', async (req, res) => {
    try {
        const sql = `
            SELECT 
                m.id,
                p.nome AS produto,
                m.quantidade,
                m.dt_saida
            FROM movimentacoes m
            JOIN produtos p ON p.id = m.id_produto
            WHERE m.dt_saida IS NOT NULL
            ORDER BY m.dt_saida DESC
        `;

        const [linhas] = await db.query(sql);
        res.status(200).json(linhas);

    } catch (erro) {
        console.error('Erro ao buscar saídas:', erro);
        res.status(500).json({ erro: 'Erro interno ao buscar saídas.' });
    }
});

app.get('/produtos/alertas-estoque', async (req, res) => {
    try {
        const sql = `
        SELECT
        id,
        nome,
        quantidade,
        CASE
	    WHEN quantidade = 0 THEN 'MÍNIMO'
      WHEN quantidade >= 100 THEN 'MÁXIMO'
    END AS status_estoque, 
    ROUND((quantidade / 100) * 100, 2) AS percentual_nivel
    FROM produtos
    WHERE quantidade = 0 OR quantidade >= 100;
        `;

        const [linhas] = await db.query(sql);

        if (0 === linhas.length) {
            return res.status(200).json({ mensagem: 'Nenhum produto em estado crítico.' });
        }

        res.status(200).json({
            total_alertas: linhas.length,
            produtos: linhas
        });

    } catch (erro) {
        console.error('Erro:', erro);
        res.status(500).json({ erro: 'Erro interno.' });
    }
});

app.get('/movimentacoes/relatorio', async (req, res) => {
    try {
        const sql = `
            SELECT 
                p.nome AS produto,
                SUM(CASE WHEN m.dt_entrada IS NOT NULL THEN m.quantidade ELSE 0 END) AS total_entradas,
                SUM(CASE WHEN m.dt_saida IS NOT NULL THEN m.quantidade ELSE 0 END) AS total_saidas
            FROM movimentacoes m
            JOIN produtos p ON p.id = m.id_produto
            GROUP BY p.nome
            ORDER BY p.nome
        `;

        const [linhas] = await db.query(sql);
        res.status(200).json(linhas);

    } catch (erro) {
        console.error('Erro ao gerar relatório:', erro);
        res.status(500).json({ erro: 'Erro interno ao gerar relatório.' });
    }
});

app.get('/produtos/volume', async (req, res) => {
    try {
        const sql = `
            SELECT
            p.nome,
            m.dt_entrada,
            m.dt_saida
            FROM movimentacoes m 
            INNER JOIN produtos p ON p.id = m.id_produto
            `;
            const [linhas] = await db.query(sql);
            res.status(200).json(linhas);

    } catch (erro) {
        console.error('Erro', erro);
        res.status(200).status.json({erro: err.message})
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});