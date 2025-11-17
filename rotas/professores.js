const express = require('express');
const router = express.Router();
const Professor = require('../models/professores');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// garante que /uploads existe
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// configura armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

//  CRIAR PROFESSOR  (com avatar opcional)
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

    // CORREÇÃO — agora salva a foto corretamente
    if (req.file) {
      novo.avatar = `/uploads/${req.file.filename}`;
    }

    await novo.save();

    return res.status(201).json({ ok: true, professor: novo });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao criar professor' });
  }
});



//ATUALIZAR PERFIL (avatar e/ou senha)

router.put('/:id', upload.single('avatar'), async (req, res) => {
  try {
    const id = req.params.id;
    const { senha } = req.body;

    const prof = await Professor.findById(id);
    if (!prof) return res.status(404).json({ error: 'Professor não encontrado' });

    // Atualiza senha se enviada
    if (senha && senha.length >= 6) {
      prof.senha = await bcrypt.hash(senha, 10);
    }

    // CORREÇÃO — agora salva a foto corretamente
    if (req.file) {
      prof.avatar = `/uploads/${req.file.filename}`;
    }

    await prof.save();

    // devolve os dados atualizados
    const usuario = {
      id: prof._id,
      nome: prof.nome,
      email: prof.email,
      materia: prof.materia || '',
      avatar: prof.avatar || ''
    };

    return res.json({ ok: true, usuario });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar professor' });
  }
});


module.exports = router;
