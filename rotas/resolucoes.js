const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resolucao = require('../models/Resolucao');

//fazendo a criação da pasta uploads/resolucoes, caso não exista (achei melhor assim)
fs.mkdirSync(path.join(__dirname, '../uploads/resolucoes'), { recursive: true });

// Configuração do Multer (para uploads de resolução)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/resolucoes')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname || ''));
  }
});
const upload = multer({ storage });

/*GET - Listar resoluções por atividade*/
router.get('/:atividadeId', async (req, res) => {
  try {
    const { atividadeId } = req.params;
    const lista = await Resolucao.find({ atividadeId }).sort({ createdAt: -1 });
    res.json(lista);
  } catch (e) {
    console.error('Erro ao listar resoluções:', e);
    res.status(500).json({ error: 'Erro ao listar resoluções' });
  }
});

/*POST - Enviar resolução do aluno */
router.post('/', upload.single('arquivo'), async (req, res) => {
  try {
    console.log('-----------------------------------');
    console.log('BODY recebido:', req.body);
    console.log('FILE recebido:', req.file);
    console.log('-----------------------------------');

    const { atividadeId, alunoId, nomeAluno, raAluno, link, observacao } = req.body;

    if (!atividadeId || !alunoId || !nomeAluno || !raAluno) {
      return res.status(400).json({ error: 'atividadeId, alunoId, nomeAluno e raAluno são obrigatórios' });
    }

    const resolucao = await Resolucao.create({
      atividadeId,
      alunoId,
      nomeAluno,
      raAluno,
      link: link || '',
      observacao: observacao || '',
      arquivoPath: req.file ? `/uploads/resolucoes/${req.file.filename}` : '',
      arquivoNome: req.file ? req.file.originalname : ''
    });

    res.status(201).json(resolucao);
  } catch (e) {
    console.error('Erro ao salvar resolução:', e);
    res.status(500).json({ error: 'Erro ao enviar resolução' });
  }
});

module.exports = router;
