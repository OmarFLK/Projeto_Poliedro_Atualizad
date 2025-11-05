require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Aluno = require('./models/alunos');
const Professor = require('./models/professores');
const authRoutes = require('./rotas/auth'); 

const app = express();

//Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

//Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log(' MongoDB conectado'))
  .catch(err => console.error(' Erro ao conectar MongoDB:', err));

//Rotas principais
app.get('/', (req, res) => {
  res.send('Servidor rodando');
});

// Rotas de autenticação (aluno e professor)
app.use('/auth', authRoutes); 

//Exemplo: CRUD básico de alunos (opcional)
app.post('/alunos', async (req, res) => {
  try {
    const aluno = await Aluno.create(req.body);
    res.status(201).json(aluno);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

app.get('/alunos', async (req, res) => {
  const alunos = await Aluno.find();
  res.json(alunos);
});

//Inicializar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Servidor rodando na porta ${PORT}`));
