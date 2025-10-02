// server.js - Versão Final com MySQL e senha correta

const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const cors = require("cors");

// --- 1. CONFIGURAÇÃO INICIAL ---
const app = express();
app.use(cors()); // Permite requisições de outras origens (nosso frontend)
app.use(express.json()); // Permite que o servidor entenda JSON

// --- 2. CONEXÃO COM O BANCO DE DADOS MYSQL ---
// As informações aqui foram atualizadas com a sua senha
const sequelize = new Sequelize("lamarka_db", "root", "323099", {
  host: "localhost",
  dialect: "mysql",
});

// --- 3. DEFINIÇÃO DO MODELO DA PEÇA (A "TABELA") ---
// O Sequelize usa este modelo para criar a tabela e interagir com ela
const Peca = sequelize.define(
  "Peca",
  {
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "O nome da peça não pode ser vazio.",
        },
      },
    },
    descricao: {
      type: DataTypes.STRING,
    },
    veiculo: {
      // Modelo/Marca do veículo
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "O veículo não pode ser vazio.",
        },
      },
    },
    ano: {
      type: DataTypes.STRING,
      validate: {
        isYearOrYearRange(value) {
          if (value && !/^\d{4}(-\d{4})?$/.test(value)) {
            throw new Error("O ano deve estar no formato YYYY ou YYYY-YYYY.");
          }
        },
      },
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "A quantidade não pode ser negativa.",
        },
      },
    },
    estoqueMinimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    localizacao: {
      // Prateleira/Setor
      type: DataTypes.STRING,
    },
    precoCompra: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "O preço de compra é obrigatório.",
        },
        min: {
          args: [0],
          msg: "O preço de compra não pode ser negativo.",
        },
      },
    },
    precoVenda: {
      type: DataTypes.FLOAT,
      validate: {
        min: {
          args: [0],
          msg: "O preço de venda não pode ser negativo.",
        },
      },
    },
  },
  {
    timestamps: true, // Adiciona os campos createdAt e updatedAt automaticamente
  }
);

// --- 3.6 DEFINIÇÃO DO MODELO DO CLIENTE ---
const Cliente = sequelize.define(
  "Cliente",
  {
    nome: { type: DataTypes.STRING, allowNull: false, unique: true },
    telefone: { type: DataTypes.STRING },
    endereco: { type: DataTypes.STRING },
  },
  {
    timestamps: true,
  }
);

// --- 3.5 DEFINIÇÃO DO MODELO DA VENDA ---
const Venda = sequelize.define(
  "Venda",
  {
    // Adicionamos uma chave estrangeira para Peca
    pecaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Pecas", key: "id" },
    },
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Nulo para vendas à vista
      references: { model: "Clientes", key: "id" },
    },
    pecaNome: { type: DataTypes.STRING, allowNull: false },
    quantidadeVendida: { type: DataTypes.INTEGER, allowNull: false },
    valorTotal: { type: DataTypes.FLOAT, allowNull: false },
    lucro: { type: DataTypes.FLOAT, allowNull: false },
    pago: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // Vendas são pagas por padrão
    },
  },
  {
    timestamps: true,
  }
);

// --- ASSOCIAÇÕES ---
Cliente.hasMany(Venda, { foreignKey: "clienteId" });
Venda.belongsTo(Cliente, { foreignKey: "clienteId" });
Peca.hasMany(Venda, { foreignKey: "pecaId", onDelete: "CASCADE" });
Venda.belongsTo(Peca, { foreignKey: "pecaId" });

// --- 4. DEFINIÇÃO DAS ROTAS DA API ---

// ROTA PARA CADASTRAR UMA NOVA PEÇA (CREATE)
app.post("/pecas", async (req, res) => {
  try {
    const novaPeca = await Peca.create(req.body);
    res.status(201).json(novaPeca);
  } catch (error) {
    // Sequelize validation errors are handled here
    if (error.name === "SequelizeValidationError") {
      return res
        .status(400)
        .json({ error: error.errors.map((err) => err.message) });
    }
    res.status(400).json({ error: error.message });
  }
});

// ROTA PARA BUSCAR TODAS AS PEÇAS (READ)
// Suporta filtros avançados via query string, ex: /pecas?veiculo=Ranger&nome=Farol
app.get("/pecas", async (req, res) => {
  try {
    const {
      nome,
      veiculo,
      ano,
      quantidadeMin,
      quantidadeMax,
      precoVendaMin,
      precoVendaMax,
      localizacao,
    } = req.query;
    const whereClause = {};

    if (nome) {
      whereClause.nome = { [Sequelize.Op.like]: `%${nome}%` };
    }
    if (veiculo) {
      whereClause.veiculo = { [Sequelize.Op.like]: `%${veiculo}%` };
    }
    if (ano) {
      whereClause.ano = { [Sequelize.Op.like]: `%${ano}%` }; // Partial match for year/year range
    }
    if (localizacao) {
      whereClause.localizacao = { [Sequelize.Op.like]: `%${localizacao}%` };
    }

    const parsedQuantidadeMin = parseInt(quantidadeMin, 10);
    const parsedQuantidadeMax = parseInt(quantidadeMax, 10);
    if (!isNaN(parsedQuantidadeMin) || !isNaN(parsedQuantidadeMax)) {
      whereClause.quantidade = {};
      if (!isNaN(parsedQuantidadeMin)) {
        whereClause.quantidade[Sequelize.Op.gte] = parsedQuantidadeMin;
      }
      if (!isNaN(parsedQuantidadeMax)) {
        whereClause.quantidade[Sequelize.Op.lte] = parsedQuantidadeMax;
      }
    }

    const parsedPrecoVendaMin = parseFloat(precoVendaMin);
    const parsedPrecoVendaMax = parseFloat(precoVendaMax);
    if (!isNaN(parsedPrecoVendaMin) || !isNaN(parsedPrecoVendaMax)) {
      whereClause.precoVenda = {};
      if (!isNaN(parsedPrecoVendaMin)) {
        whereClause.precoVenda[Sequelize.Op.gte] = parsedPrecoVendaMin;
      }
      if (!isNaN(parsedPrecoVendaMax)) {
        whereClause.precoVenda[Sequelize.Op.lte] = parsedPrecoVendaMax;
      }
    }

    const pecas = await Peca.findAll({ where: whereClause });
    res.json(pecas);
  } catch (error) {
    console.error("Erro na busca de peças:", error); // Adicionado log mais específico
    res
      .status(500)
      .json({ error: "Erro interno do servidor ao buscar peças." }); // Mensagem mais genérica para o cliente
  }
});

// ROTA PARA BUSCAR PEÇAS COM ESTOQUE BAIXO
app.get("/pecas/alertas-estoque", async (req, res) => {
  try {
    const pecas = await Peca.findAll({
      where: {
        // A quantidade é menor ou igual ao estoque mínimo definido
        // E o estoque mínimo é maior que zero para não listar tudo
        quantidade: { [Sequelize.Op.lte]: sequelize.col("estoqueMinimo") },
        estoqueMinimo: { [Sequelize.Op.gt]: 0 },
      },
      order: [["quantidade", "ASC"]],
    });
    res.json(pecas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA RELATÓRIO DE PEÇAS MAIS VENDIDAS
app.get("/relatorios/mais-vendidas", async (req, res) => {
  try {
    const maisVendidas = await Venda.findAll({
      attributes: [
        "pecaNome",
        [
          sequelize.fn("SUM", sequelize.col("quantidadeVendida")),
          "totalVendido",
        ],
      ],
      group: ["pecaNome"],
      order: [[sequelize.literal("totalVendido"), "DESC"]],
      limit: 10, // Top 10
    });
    res.json(maisVendidas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA RELATÓRIO DE PEÇAS MAIS LUCRATIVAS
app.get("/relatorios/mais-lucrativas", async (req, res) => {
  try {
    const maisLucrativas = await Venda.findAll({
      attributes: [
        "pecaNome",
        [sequelize.fn("SUM", sequelize.col("lucro")), "lucroTotal"],
      ],
      group: ["pecaNome"],
      order: [[sequelize.literal("lucroTotal"), "DESC"]],
      limit: 10, // Top 10
    });
    res.json(maisLucrativas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ROTAS PARA CLIENTES E FIADO ---

// Cadastrar novo cliente
app.post("/clientes", async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar todos os clientes
app.get("/clientes", async (req, res) => {
  try {
    const clientes = await Cliente.findAll({ order: [["nome", "ASC"]] });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar vendas fiado (não pagas) de um cliente
app.get("/clientes/:id/fiado", async (req, res) => {
  try {
    const vendas = await Venda.findAll({
      where: {
        clienteId: req.params.id,
        pago: false,
      },
      order: [["createdAt", "ASC"]],
    });
    res.json(vendas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quitar uma ou mais vendas
app.post("/vendas/quitar", async (req, res) => {
  const { vendaIds } = req.body;
  if (!vendaIds || !Array.isArray(vendaIds)) {
    return res.status(400).json({ error: "Formato de requisição inválido." });
  }
  try {
    const [affectedRows] = await Venda.update(
      { pago: true },
      { where: { id: vendaIds } }
    );
    res.json({ message: `${affectedRows} venda(s) quitada(s) com sucesso.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA ATUALIZAR UMA PEÇA (UPDATE) - Usado para estoque
app.put("/pecas/:id", async (req, res) => {
  try {
    const peca = await Peca.findByPk(req.params.id);
    if (peca) {
      await peca.update(req.body);
      res.json(peca);
    } else {
      res.status(404).json({ error: "Peça não encontrada" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ROTA PARA REGISTRAR UMA VENDA
app.post("/vendas", async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { pecaId, quantidadeVendida, precoVendaUnitario, clienteId } =
      req.body;

    const peca = await Peca.findByPk(pecaId, { transaction: t });

    if (!peca) {
      return res.status(404).json({ error: "Peça não encontrada." });
    }
    if (peca.quantidade < quantidadeVendida) {
      return res.status(400).json({ error: "Estoque insuficiente." });
    }
    // Validação para não permitir lucro negativo
    if (precoVendaUnitario < peca.precoCompra) {
      await t.rollback(); // Cancela a transação antes de sair
      return res
        .status(400)
        .json({
          error: "O preço de venda não pode ser menor que o preço de compra.",
        });
    }

    // Atualiza a quantidade da peça
    peca.quantidade -= quantidadeVendida;
    await peca.save({ transaction: t });

    // Cria o registro da venda
    const valorTotal = precoVendaUnitario * quantidadeVendida;
    const lucro = (precoVendaUnitario - peca.precoCompra) * quantidadeVendida;

    const novaVenda = await Venda.create(
      {
        pecaId: peca.id,
        pecaNome: peca.nome,
        quantidadeVendida,
        valorTotal,
        lucro,
        clienteId: clienteId || null,
        pago: !clienteId, // Se tem clienteId, não está pago. Se não, está pago.
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json(novaVenda);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
});

// ROTA PARA BUSCAR TODAS AS VENDAS
app.get("/vendas", async (req, res) => {
  try {
    const vendas = await Venda.findAll({ order: [["createdAt", "DESC"]] });
    res.json(vendas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA DELETAR UMA PEÇA (DELETE)
app.delete("/pecas/:id", async (req, res) => {
  try {
    const peca = await Peca.findByPk(req.params.id);
    if (peca) {
      await peca.destroy();
      res.json({ message: "Peça deletada com sucesso" });
    } else {
      res.status(404).json({ error: "Peça não encontrada" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 5. INICIALIZAÇÃO DO SERVIDOR ---
const PORT = 3000;
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate(); // Testa a conexão com o banco de dados
    console.log("Conexão com o banco de dados MySQL estabelecida com sucesso.");

    await sequelize.sync({ alter: true }); // Atualiza as tabelas com novas colunas sem apagar os dados.
    console.log("Banco de dados sincronizado.");

    console.log(`Servidor rodando na porta ${PORT}`);
  } catch (error) {
    console.error("Não foi possível conectar ao banco de dados:", error);
  }
});
