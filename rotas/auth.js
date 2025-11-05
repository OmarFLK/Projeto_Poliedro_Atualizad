const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Aluno = require('../models/alunos');
const Professor = require('../models/professores');

const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta';

// 🔹 Login Aluno (RA + senha)
router.post('/aluno/login', async (req, res) => {
  try {
    const { ra, senha } = req.body;
    if (!ra || !senha)
      return res.status(400).json({ error: 'RA e senha obrigatórios' });

    const aluno = await Aluno.findOne({ ra });
    if (!aluno) return res.status(401).json({ error: 'RA ou senha inválidos' });

    const match = await bcrypt.compare(senha, aluno.senha);
    if (!match) return res.status(401).json({ error: 'RA ou senha inválidos' });

    const token = jwt.sign(
      { id: aluno._id, tipo: 'aluno', ra: aluno.ra },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: { nome: aluno.nome, ra: aluno.ra, email: aluno.email }
    });
  } catch (error) {
  console.error('Erro no login do aluno:', error);
  res.status(500).json({ error: 'Erro no servidor', detalhe: error.message });
}

  }
);

// 🔹 Login Professor (email + senha)
router.post('/professor/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ error: 'Email e senha obrigatórios' });

    const prof = await Professor.findOne({ email });
    if (!prof)
      return res.status(401).json({ error: 'Email ou senha inválidos' });

    const match = await bcrypt.compare(senha, prof.senha);
    if (!match)
      return res.status(401).json({ error: 'Email ou senha inválidos' });

    const token = jwt.sign(
      { id: prof._id, tipo: 'professor', email: prof.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: { nome: prof.nome, email: prof.email }
    });
  } catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Erro no servidor' });
}

});

module.exports = router;
