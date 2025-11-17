const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Atividade = require('../models/Atividade');

// garanto pasta uploads
fs.mkdirSync(path.join(__dirname, '../uploads'), { recursive: true });

// multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname || ''));
  }
});
const upload = multer({ storage });

// padronização exata (já compatível com o que está no banco)
function formatTurma(t) {
  if (!t) return '';
  t = t.toString().trim().replace(/\s+/g, ' ');
  if (t.includes('1')) return '1º Ano';
  if (t.includes('2')) return '2º Ano';
  if (t.includes('3')) return '3º Ano';
  return t;
}

function formatSubSala(s) {
  if (!s) return '';
  s = s.toString().trim().replace(/\s+/g, ' ');
  s = s.replace(/sub\s*/i, '');
  return `Sub ${s}`;
}

function formatMateria(m) {
  if (!m) return '';
  m = m.toString().trim();

  const map = {
    "quimica": "Química",
    "química": "Química",
    "fisica": "Física",
    "física": "Física",
    "matematica": "Matemática",
    "matemática": "Matemática",
    "biologia": "Biologia",
    "portugues": "Português",
    "português": "Português",
    "historia": "História",
    "história": "História",
    "geografia": "Geografia",
    "filosofia": "Filosofia",
    "sociologia": "Sociologia",
    "educacao fisica": "Educação Física",
    "educação física": "Educação Física",
    "artes": "Artes",
    "ingles": "Inglês",
    "inglês": "Inglês"
  };

  const key = m
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return map[key] || m;
}



// ROTAS =========================================

// LISTAR ATIVIDADES — agora 100% correto
router.get('/', async (req, res) => {
  try {
    const filtro = {};

    if (req.query.turma) filtro.turma = formatTurma(req.query.turma);
    if (req.query.subSala) filtro.subSala = formatSubSala(req.query.subSala);
    if (req.query.materia) filtro.materia = formatMateria(req.query.materia);

    const lista = await Atividade.find(filtro).sort({ createdAt: -1 }).lean();
    return res.json(lista);
  } catch (e) {
    console.error('Erro ao listar atividades:', e);
    return res.status(500).json({ error: 'Erro ao listar atividades' });
  }
});


// CRIAR ATIVIDADE (agora salva 100% padronizado)
router.post('/', upload.single('arquivo'), async (req, res) => {
  try {
    const { turma, subSala, materia, titulo, descricao } = req.body;

    if (!turma || !subSala || !materia || !titulo) {
      return res.status(400).json({
        error: 'turma, subSala, materia e titulo são obrigatórios'
      });
    }

    const doc = await Atividade.create({
      turma: formatTurma(turma),
      subSala: formatSubSala(subSala),
      materia: formatMateria(materia),
      titulo: titulo.trim(),
      descricao: (descricao || '').trim(),
      arquivoPath: req.file ? `/uploads/${req.file.filename}` : '',
      arquivoNome: req.file ? req.file.originalname : ''
    });

    return res.status(201).json(doc);
  } catch (e) {
    console.error('Erro ao criar atividade:', e);
    return res.status(500).json({ error: 'Erro ao criar atividade' });
  }
});


// EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    const atividade = await Atividade.findById(req.params.id);
    if (!atividade) return res.status(404).json({ error: 'Atividade não encontrada' });

    if (atividade.arquivoPath) {
      const caminhoArquivo = path.join(process.cwd(), atividade.arquivoPath);
      fs.unlink(caminhoArquivo, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.warn('Erro ao apagar arquivo:', err.message);
        }
      });
    }

    await Atividade.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Atividade excluída com sucesso.' });
  } catch (e) {
    console.error('Erro ao excluir atividade:', e);
    return res.status(500).json({ error: 'Erro ao excluir atividade.' });
  }
});

module.exports = router;
