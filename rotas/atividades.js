const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Atividade = require('../models/Atividade');

// garante que a pasta uploads existe
fs.mkdirSync(path.join(__dirname, '../uploads'), { recursive: true });

// configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname || ''));
  }
});
const upload = multer({ storage });

// função para normalizar campos de texto
const normalize = str => str ? str.trim().toLowerCase() : '';

// listar atividades com filtro
router.get('/', async (req, res) => {
  const { turma, subSala, materia } = req.query;

  try {
    const filtro = {};
    if (turma) filtro.turma = new RegExp(`^${normalize(turma)}$`, 'i');
    if (subSala) filtro.subSala = new RegExp(`^${normalize(subSala)}$`, 'i');
    if (materia) filtro.materia = new RegExp(`^${normalize(materia)}$`, 'i');

    const lista = await Atividade.find(filtro).sort({ createdAt: -1 });
    res.json(lista);
  } catch (e) {
    console.error('Erro ao listar atividades:', e);
    res.status(500).json({ error: 'Erro ao listar atividades' });
  }
});

// criar atividade (professor)
router.post('/', upload.single('arquivo'), async (req, res) => {
  try {
    const { turma, subSala, materia, titulo, descricao } = req.body;

    if (!turma || !subSala || !materia || !titulo) {
      return res.status(400).json({
        error: 'turma, subSala, materia e titulo são obrigatórios'
      });
    }

    const doc = await Atividade.create({
      turma: normalize(turma),
      subSala: normalize(subSala),
      materia,
      titulo,
      descricao,
      arquivoPath: req.file ? `/uploads/${req.file.filename}` : '',
      arquivoNome: req.file ? req.file.originalname : ''
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error('Erro ao criar atividade:', e);
    res.status(500).json({ error: 'Erro ao criar atividade' });
  }
});

// excluir atividade
router.delete('/:id', async (req, res) => {
  try {
    const atividade = await Atividade.findById(req.params.id);
    if (!atividade) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }

    if (atividade.arquivoPath) {
      const caminhoArquivo = path.join(process.cwd(), atividade.arquivoPath);
      fs.unlink(caminhoArquivo, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.warn('Erro ao apagar arquivo:', err.message);
        }
      });
    }

    await Atividade.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Atividade excluída com sucesso.' });
  } catch (e) {
    console.error('Erro ao excluir atividade:', e);
    res.status(500).json({ error: 'Erro ao excluir atividade.' });
  }
});

module.exports = router;
