require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Rotas
const authRoutes = require("./rotas/auth");
const atividadesRoutes = require("./rotas/atividades");
const resolucoesRoutes = require("./rotas/resolucoes");
const notasRoutes = require('./rotas/notas');
const eventosRoutes = require("./rotas/eventos");
const notasalunosRoutes = require('./rotas/notasalunos'); 
const itinerarioRoutes = require("./rotas/itinerario");
const alunosRoutes = require('./rotas/alunos');
const professoresRoutes = require('./rotas/professores');

const app = express();

//CORS COM COOKIES
app.use(cors({
  origin: "http://127.0.0.1:5500",
  credentials: true               
}));

// MIDDLEWARES ESSENCIAIS
app.use(cookieParser());           // habilita leitura de cookies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//ARQUIVOS ESTÁTICOS
app.use(express.static(path.join(__dirname, "front")));
app.use("/Assets", express.static(path.join(__dirname, "Assets")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

//TESTE
app.get("/teste", (req, res) => {
  console.log("Rota /teste chamada");
  res.send("Rota teste funcionando corretamente");
});

// MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB conectado com sucesso"))
.catch((err) => console.error("Erro ao conectar MongoDB:", err));

// API 
app.use("/auth", authRoutes);
app.use("/api/atividades", atividadesRoutes);
app.use("/api/resolucoes", resolucoesRoutes);
app.use('/api/notas', notasRoutes);
app.use("/api/eventos", eventosRoutes);
app.use('/api/professores', professoresRoutes);
app.use('/api/notasalunos', notasalunosRoutes);
app.use('/api/alunos', alunosRoutes);
app.use("/api/itinerario", itinerarioRoutes);

//PÁGINA INICIAL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "front", "Login.html"));
});


app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

//SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
