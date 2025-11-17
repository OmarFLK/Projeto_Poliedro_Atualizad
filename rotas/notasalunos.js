// rotas/notasalunos.js
const express = require('express');
const router = express.Router();
const Nota = require('../models/Nota');

// ============================
//  GET → NOTAS DE UM ALUNO
// ============================
router.get('/aluno/:id', async (req, res) => {
  try {
    const alunoId = req.params.id;

    const notas = await Nota.find({ alunoId }).sort({ materia: 1 });

    return res.json(notas);

  } catch (err) {
    console.error("Erro ao buscar notas do aluno:", err);
    return res.status(500).json({ error: "Erro ao buscar notas do aluno" });
  }
});

// ============================
// GET → NOTAS POR SALA (PROFESSOR)
// ============================
router.get('/sala', async (req, res) => {
  try {
    const { ano, subSala, materia, semestre } = req.query;

    const filtro = {};

    if (ano) filtro.ano = ano;
    if (subSala) filtro.turma = subSala;
    if (materia) filtro.materia = materia;
    if (semestre) filtro.semestre = semestre;

    const notas = await Nota.find(filtro);

    return res.json(notas);

  } catch (err) {
    console.error("Erro ao buscar notas da sala:", err);
    return res.status(500).json({ error: "Erro ao buscar notas da sala" });
  }
});

// ============================
// POST → CRIAR / ATUALIZAR NOTA
// ============================
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    // busca nota já existente
    let nota = await Nota.findOne({
      alunoId: body.alunoId,
      materia: body.materia,
      semestre: body.semestre,
      ano: body.ano
    });

    if (nota) {
      // atualiza
      nota.p1 = body.p1 ?? nota.p1;
      nota.p2 = body.p2 ?? nota.p2;
      nota.t1 = body.t1 ?? nota.t1;
      nota.t2 = body.t2 ?? nota.t2;
      nota.media = body.media ?? nota.media;
      nota.turma = body.turma ?? nota.turma;

      await nota.save();
      return res.json(nota);
    }

    // cria nova nota
    const nova = await Nota.create(body);
    return res.json(nova);

  } catch (err) {
    console.error("Erro ao salvar nota:", err);
    return res.status(500).json({ error: "Erro ao salvar nota" });
  }
});

module.exports = router;
