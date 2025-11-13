const express = require('express');
const router = express.Router();
const Nota = require('../models/Nota');

// GET todas notas
router.get('/', async (req, res) => {
  try {
    const notas = await Nota.find().sort({ createdAt: -1 });
    res.json(notas);
  } catch (e) {
    console.error(e); res.status(500).json({ error: 'Erro ao buscar notas' });
  }
});

// GET notas por aluno
router.get('/aluno/:alunoId', async (req, res) => {
  try {
    const { alunoId } = req.params;
    const notas = await Nota.find({ alunoId }).sort({ ano: -1, semestre: 1 });
    res.json(notas);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao buscar notas do aluno' }); }
});

// POST criar ou atualizar nota
router.post('/', async (req, res) => {
  try {
    const { alunoId, alunoNome, materia, ano, semestre, turma, p1, p2, t1, t2, media } = req.body;
    if (!alunoId || !materia || !ano || !semestre) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    const filtro = { alunoId, materia, ano, semestre };
    const dados = { alunoId, alunoNome, materia, ano, semestre, turma, p1, p2, t1, t2, media, createdAt: new Date() };
    const nota = await Nota.findOneAndUpdate(filtro, dados, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.status(201).json(nota);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao salvar nota' }); }
});

// DELETE todas (dev only)
router.delete('/', async (req, res) => {
  try {
    await Nota.deleteMany({});
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao apagar notas' }); }
});

// DELETE ultima (dev)
router.delete('/ultima', async (req, res) => {
  try {
    const ultima = await Nota.findOne().sort({ createdAt: -1 });
    if (!ultima) return res.status(404).json({ error: 'Nenhuma nota' });
    await Nota.findByIdAndDelete(ultima._id);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao apagar ultima' }); }
});

module.exports = router;
