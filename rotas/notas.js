const express = require('express');
const router = express.Router();
const Nota = require('../models/Nota');

// Normaliza o campo "ano" para um padrão único
function normalizarAno(ano) {
  if (!ano) return "";
  let t = ano.toString().trim().toLowerCase();

  // tira símbolos estranhos e espaços a mais
  t = t.replace("º", "").replace("°", "").replace("ano", "").trim();

  if (t.startsWith("1")) return "1º Ano";
  if (t.startsWith("2")) return "2º Ano";
  if (t.startsWith("3")) return "3º Ano";

  // fallback: devolve string limpa
  return ano.toString().trim();
}

// GET todas notas
router.get('/', async (req, res) => {
  try {
    const notas = await Nota.find().sort({ createdAt: -1 });
    res.json(notas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar notas' });
  }
});

// GET notas por aluno
router.get('/aluno/:alunoId', async (req, res) => {
  try {
    const { alunoId } = req.params;
    const notas = await Nota.find({ alunoId }).sort({ ano: -1, semestre: 1 });
    res.json(notas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar notas do aluno' });
  }
});

// POST criar ou atualizar nota (atualiza somente campos informados)
router.post('/', async (req, res) => {
  try {
    let {
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

    // normaliza ano antes de salvar
    ano = normalizarAno(ano);

    // filtro agora inclui turma (sub-sala)
    const filtro = { alunoId, materia, ano, semestre, turma };

    // construir objeto de update apenas com campos definidos
    const setObj = {};
    if (typeof alunoNome !== 'undefined') setObj.alunoNome = alunoNome;
    if (typeof turma !== 'undefined') setObj.turma = turma;
    if (typeof ano !== 'undefined') setObj.ano = ano;
    if (typeof p1 !== 'undefined') setObj.p1 = p1;
    if (typeof p2 !== 'undefined') setObj.p2 = p2;
    if (typeof t1 !== 'undefined') setObj.t1 = t1;
    if (typeof t2 !== 'undefined') setObj.t2 = t2;
    if (typeof media !== 'undefined') setObj.media = media;

    // se nenhum campo foi enviado, não atualiza
    if (Object.keys(setObj).length === 0) {
      const existente = await Nota.findOne(filtro);
      if (existente) return res.json(existente);
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    const update = {
      $set: setObj,
      $setOnInsert: { createdAt: new Date() }
    };

    const nota = await Nota.findOneAndUpdate(
      filtro,
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao apagar notas' });
  }
});

// DELETE ultima (dev)
router.delete('/ultima', async (req, res) => {
  try {
    const ultima = await Nota.findOne().sort({ createdAt: -1 });
    if (!ultima) return res.status(404).json({ error: 'Nenhuma nota' });
    await Nota.findByIdAndDelete(ultima._id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao apagar ultima' });
  }
});

// GET notas por sala (ano + sub-sala + matéria + semestre)
router.get('/sala', async (req, res) => {
  try {
    let { ano, subSala, materia, semestre } = req.query;

    if (!ano || !subSala || !materia || !semestre) {
      return res.status(400).json({ error: "Filtros incompletos" });
    }

    // normaliza ano vindo da query pra bater com o salvo
    ano = normalizarAno(ano);

    const notas = await Nota.find({
      ano,
      materia,
      semestre,
      turma: subSala
    });

    res.json(notas);
  } catch (error) {
    console.error("Erro ao buscar notas da sala:", error);
    res.status(500).json({ error: "Erro ao buscar notas da sala" });
  }
});

module.exports = router;
