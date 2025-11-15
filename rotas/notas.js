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

// POST criar ou atualizar nota (atualiza somente campos informados)
router.post('/', async (req, res) => {
  try {
    const {
      alunoId,
      alunoNome,
      materia,
      ano,
      semestre,
      turma,
      p1,
      p2,
      t1,
      t2,
      media
    } = req.body;

    if (!alunoId || !materia || !ano || !semestre) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // filtro agora inclui turma (sub-sala)
    const filtro = { alunoId, materia, ano, semestre, turma };

    // construir objeto de update apenas com campos definidos (evitar sobrescrever com 0)
    const setObj = {};
    if (typeof alunoNome !== 'undefined') setObj.alunoNome = alunoNome;
    if (typeof turma !== 'undefined') setObj.turma = turma;
    if (typeof p1 !== 'undefined') setObj.p1 = p1;
    if (typeof p2 !== 'undefined') setObj.p2 = p2;
    if (typeof t1 !== 'undefined') setObj.t1 = t1;
    if (typeof t2 !== 'undefined') setObj.t2 = t2;
    if (typeof media !== 'undefined') setObj.media = media;

    // se nenhum campo numérico foi enviado, não atualiza (evita upsert vazio)
    if (Object.keys(setObj).length === 0) {
      // tenta retornar nota existente
      const existente = await Nota.findOne(filtro);
      if (existente) return res.json(existente);
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    const update = {
      $set: setObj,
      $setOnInsert: { createdAt: new Date() }
    };

    const nota = await Nota.findOneAndUpdate(filtro, update, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.status(201).json(nota);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao salvar nota' });
  }
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

// GET notas por sala (ano + sub-sala + matéria + semestre)
router.get('/sala', async (req, res) => {
  try {
    const { ano, subSala, materia, semestre } = req.query;

    if (!ano || !subSala || !materia || !semestre) {
      return res.status(400).json({ error: "Filtros incompletos" });
    }

    // turma no banco está sendo usada como "Sub-sala"
    const notas = await Nota.find({
      ano,
      materia,
      semestre,
      turma: subSala
    });

    // retornar array (cliente monta mapa por alunoId)
    res.json(notas);
  } catch (error) {
    console.error("Erro ao buscar notas da sala:", error);
    res.status(500).json({ error: "Erro ao buscar notas da sala" });
  }
});

module.exports = router;
