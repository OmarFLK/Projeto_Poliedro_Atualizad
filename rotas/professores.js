const express = require('express');
const router = express.Router();
const Professor = require('../models/professores');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

/*LISTAR PROFESSORES */
router.get('/', async (req, res) => {
  try {
    const profs = await Professor.find({}, "nome email materia avatar").lean();
    return res.json(profs);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar professores" });
  }
});

/*CRIAR PROFESSOR */
router.post('/', upload.single('avatar'), async (req, res) => {
  try {
    const { nome, email, senha, materia } = req.body;

    if (!nome || !email || !senha)
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });

    const hashed = await bcrypt.hash(senha, 10);

    const novo = new Professor({
      nome,
      email,
      senha: hashed,
      materia: materia || ''
    });

    if (req.file) {
      novo.avatar = `/uploads/${req.file.filename}`;
    }

    await novo.save();

    return res.status(201).json({ ok: true, professor: novo });

  } catch (err) {
    return res.status(500).json({ error: 'Erro ao criar professor' });
  }
});

/*ATUALIZAR PROFESSOR */
router.put('/:id', upload.single('avatar'), async (req, res) => {
  try {
    const id = req.params.id;
    const { senha } = req.body;

    const prof = await Professor.findById(id);
    if (!prof) return res.status(404).json({ error: 'Professor não encontrado' });

    if (senha && senha.length >= 6) {
      prof.senha = await bcrypt.hash(senha, 10);
    }

    if (req.file) {
      prof.avatar = `/uploads/${req.file.filename}`;
    }

    await prof.save();

    const usuario = {
      id: prof._id,
      nome: prof.nome,
      email: prof.email,
      materia: prof.materia || '',
      avatar: prof.avatar || ''
    };

    return res.json({ ok: true, usuario });

  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar professor' });
  }
});

/*EXCLUIR PROFESSOR */
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const prof = await Professor.findById(id);
    if (!prof) return res.status(404).json({ error: 'Professor não encontrado' });

    await Professor.findByIdAndDelete(id);

    return res.json({ ok: true, message: 'Professor excluído' });

  } catch (err) {
    return res.status(500).json({ error: 'Erro ao excluir professor' });
  }
});

/* NOVA ROTA: BUSCAR PROFESSOR POR ID= */
router.get('/:id', async (req, res) => {
  try {
    const prof = await Professor.findById(req.params.id)
      .select("nome email materia avatar")
      .lean();

    if (!prof)
      return res.status(404).json({ error: "Professor não encontrado" });

    return res.json(prof);

  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar professor" });
  }
});

module.exports = router;
