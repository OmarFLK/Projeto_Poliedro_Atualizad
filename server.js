require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const Aluno = require('./models/alunos');
const Professor = require('./models/professores');
const authRoutes = require('./rotas/auth');
const atividadesRoutes = require('./rotas/atividades');
const resolucoesRoutes = require('./rotas/resolucoes');

const app = express();

// TESTE SIMPLES 
app.get('/teste', (req, res) => {
  console.log(' Rota /teste chamada');
  res.send('Rota teste funcionando ');
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api/resolucoes', resolucoesRoutes);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log(' MongoDB conectado'))
  .catch(err => console.error(' Erro ao conectar MongoDB:', err));

// Rotas principais
app.get('/', (req, res) => {
  res.send('Servidor rodando');
});

// Rotas de autenticação
app.use('/auth', authRoutes);
app.use('/api/atividades', atividadesRoutes);

// Inicializar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Servidor rodando na porta ${PORT}`));
