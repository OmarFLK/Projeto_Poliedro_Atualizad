require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Aluno = require('./alunos');
const Professor = require('./professores');

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado');

  //SENHA DO ALUNO
  const pass = await bcrypt.hash('123456', 10); // <- para trocar a senha do aluno
  await Aluno.create({
    ra: '2024001',
    nome: 'João Silva',
    senha: pass,
    email: 'joao@exemplo.com'
  });

  //SENHA DO PROFESSOR
  const ppass = await bcrypt.hash('prof123', 10); // <- para trocar a senha do prof
  await Professor.create({
    email: 'prof@poliedro.com',
    nome: 'Prof. Silva',
    senha: ppass
  });

  console.log('Seed finalizado');
  mongoose.disconnect();
}

run().catch(e => {
  console.error(e);
  mongoose.disconnect();
});
