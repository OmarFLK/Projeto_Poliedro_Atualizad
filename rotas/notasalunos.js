// rotas/alunos.js
const express = require('express');
const router = express.Router();
const Aluno = require('../models/alunos');

// GET /api/alunos  → lista todos os alunos
router.get('/', async (req, res) => {
  try {
    const alunos = await Aluno.find({}, "_id nome turma subSala email ra").sort({ nome: 1 });
    res.json(alunos);
  } catch (err) {
    console.error("Erro ao buscar alunos:", err);
    res.status(500).json({ error: "Erro ao buscar alunos" });
  }
});

module.exports = router;
