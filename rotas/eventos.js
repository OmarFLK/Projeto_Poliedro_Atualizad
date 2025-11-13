const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Evento = require("../models/Eventos");

// Configuração de upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// POST - Criar evento
router.post("/", upload.single("arquivo"), async (req, res) => {
  try {
    const { titulo, data, horario, local, descricao, turma, professor } = req.body;

    const evento = new Evento({
      titulo,
      data,
      horario,
      local,
      descricao,
      turma,
      professor,
      arquivoNome: req.file ? req.file.originalname : undefined,
      arquivoPath: req.file ? `/uploads/${req.file.filename}` : undefined,
    });

    await evento.save();
    res.status(201).json({ message: "Evento criado com sucesso!", evento });
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    res.status(500).json({ error: "Erro ao criar evento" });
  }
});

// GET - Listar eventos (com filtro por turma)
router.get("/", async (req, res) => {
  try {
    const { turma } = req.query;

    // Se veio a turma, filtra por ela ou eventos de "todas"
    const filtro = turma
      ? { $or: [{ turma }, { turma: "todas" }] }
      : {};

    const eventos = await Evento.find(filtro).sort({ data: -1 });
    res.json(eventos);
  } catch (error) {
    console.error("Erro ao listar eventos:", error);
    res.status(500).json({ error: "Erro ao listar eventos" });
  }
});

// DELETE - Excluir evento
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Evento.findByIdAndDelete(id);
    res.json({ message: "Evento excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    res.status(500).json({ error: "Erro ao excluir evento" });
  }
});

module.exports = router;
