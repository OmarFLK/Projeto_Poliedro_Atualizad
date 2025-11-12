require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

// Models
const Aluno = require("./models/alunos");
const Professor = require("./models/professores");

// Rotas
const authRoutes = require("./rotas/auth");
const atividadesRoutes = require("./rotas/atividades");
const resolucoesRoutes = require("./rotas/resolucoes");
const eventosRoutes = require("./rotas/eventos");

const app = express();

// Middleware padrão
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());

// Pasta pública para uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Teste rápido
app.get("/teste", (req, res) => {
  console.log("Rota /teste chamada");
  res.send("Rota teste funcionando corretamente");
});

// Conexão MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB conectado com sucesso"))
  .catch((err) => console.error("Erro ao conectar MongoDB:", err));

// Rota base
app.get("/", (req, res) => res.send("Servidor rodando normalmente 🚀"));

// Rotas principais
app.use("/auth", authRoutes);
app.use("/api/atividades", atividadesRoutes);
app.use("/api/resolucoes", resolucoesRoutes);
app.use("/api/eventos", eventosRoutes); // rota nova

// Middleware para rota inexistente
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Inicialização
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
