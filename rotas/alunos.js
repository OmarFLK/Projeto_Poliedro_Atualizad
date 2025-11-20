const express = require('express');
const router = express.Router();
const Aluno = require('../models/alunos');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

/* LISTAR TODOS OS ALUNOS */
router.get('/', async (req, res) => {
  try {
    const alunos = await Aluno.find().lean();
    return res.json(alunos);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar alunos' });
  }
});

/*GERAR NOVO RA */
router.get('/novo-ra', async (req, res) => {
  try {
    const ultimo = await Aluno.findOne().sort({ ra: -1 }).lean();
    const novo = ultimo && ultimo.ra
      ? String(Number(ultimo.ra) + 1).padStart(5, '0')
      : '00001';

    return res.json({ ra: novo });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao gerar RA' });
  }
});

/* CRIAR ALUNO */
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, turma, subSala } = req.body;
    if (!nome || !senha || !turma || !subSala)
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });

    const ultimo = await Aluno.findOne().sort({ ra: -1 }).lean();
    const novoRa = ultimo && ultimo.ra
      ? String(Number(ultimo.ra) + 1).padStart(5, '0')
      : '00001';

    const hashed = await bcrypt.hash(senha, 10);

    const aluno = new Aluno({
      ra: novoRa,
      nome,
      senha: hashed,
      email: email || '',
      turma,
      subSala
    });

    await aluno.save();
    return res.status(201).json({ ok: true, ra: novoRa, aluno });

  } catch (err) {
    return res.status(500).json({ error: 'Erro ao criar aluno' });
  }
});

/* ATUALIZAR ALUNO */
router.put('/:id', upload.single('avatar'), async (req, res) => {
  try {
    const id = req.params.id;
    const aluno = await Aluno.findById(id);

    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

    if (req.body.senha && req.body.senha.length >= 6) {
      aluno.senha = await bcrypt.hash(req.body.senha, 10);
    }

    if (req.file) {
      aluno.avatar = `/uploads/${req.file.filename}`;
    }

    await aluno.save();

    const usuario = {
      id: aluno._id,
      nome: aluno.nome,
      ra: aluno.ra,
      email: aluno.email,
      turma: aluno.turma,
      subSala: aluno.subSala,
      avatar: aluno.avatar || ''
    };

    return res.json({ ok: true, usuario });

  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar aluno' });
  }
});

/* EXCLUIR ALUNO */
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const aluno = await Aluno.findById(id);
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

    await Aluno.findByIdAndDelete(id);

    return res.json({ ok: true, message: 'Aluno excluído' });

  } catch (err) {
    return res.status(500).json({ error: 'Erro ao excluir aluno' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const aluno = await Aluno.findById(req.params.id)
      .select("nome email avatar turma subSala ra")
      .lean();

    if (!aluno)
      return res.status(404).json({ error: "Aluno não encontrado" });

    return res.json(aluno);

  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar aluno" });
  }
});

module.exports = router;
