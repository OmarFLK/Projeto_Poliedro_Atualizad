// rotas/resolucoes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Resolucao = require("../models/Resolucao");

// garante pasta
fs.mkdirSync(path.join(__dirname, "../uploads/resolucoes"), { recursive: true });

// multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads/resolucoes")),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname || ""));
  },
});
const upload = multer({ storage });

// listar resoluções por atividade (professor)
router.get("/:atividadeId", async (req, res) => {
  try {
    const { atividadeId } = req.params;
    const lista = await Resolucao.find({ atividadeId }).sort({ createdAt: -1 });
    res.json(lista);
  } catch (e) {
    console.error("Erro ao listar resoluções:", e);
    res.status(500).json({ error: "Erro ao listar resoluções" });
  }
});

// listar resoluções de um aluno (aba direita do aluno)
router.get("/aluno/:alunoId", async (req, res) => {
  try {
    const { alunoId } = req.params;
    const resolucoes = await Resolucao.find({ alunoId })
      .populate("atividadeId", "titulo materia turma subSala")
      .sort({ createdAt: -1 });
    res.json(resolucoes);
  } catch (e) {
    console.error("Erro ao buscar resoluções do aluno:", e);
    res.status(500).json({ error: "Erro ao buscar resoluções do aluno" });
  }
});

// enviar ou reenviar resolução
router.post("/", upload.single("arquivo"), async (req, res) => {
  try {
    const { atividadeId, alunoId, nomeAluno, raAluno, observacao, turma, subSala } = req.body;

    if (!atividadeId || !alunoId || !nomeAluno || !raAluno) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    const existente = await Resolucao.findOne({ atividadeId, alunoId });

    const dados = {
      atividadeId,
      alunoId,
      nomeAluno,
      raAluno,
      // mantém turma/subSala atuais ou anteriores
      turma: (turma || (existente && existente.turma) || "").trim(),
      subSala: (subSala || (existente && existente.subSala) || "").trim(),
      observacao: observacao || "",
      arquivoPath: req.file ? `/uploads/resolucoes/${req.file.filename}` : (existente ? existente.arquivoPath : ""),
      arquivoNome: req.file ? (req.file.originalname || "") : (existente ? existente.arquivoNome : ""),
    };

    let resolucao;
    if (existente) {
      if (existente.arquivoPath && req.file) {
        const caminhoAntigo = path.join(__dirname, "..", existente.arquivoPath);
        if (fs.existsSync(caminhoAntigo)) fs.unlinkSync(caminhoAntigo);
      }
      resolucao = await Resolucao.findByIdAndUpdate(existente._id, dados, { new: true });
    } else {
      resolucao = await Resolucao.create(dados);
    }

    res.status(201).json(resolucao);
  } catch (e) {
    console.error("Erro ao salvar resolução:", e);
    res.status(500).json({ error: "Erro ao enviar resolução" });
  }
});

// excluir resolução
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const resolucao = await Resolucao.findById(id);
    if (!resolucao) return res.status(404).json({ error: "Resolução não encontrada." });

    if (resolucao.arquivoPath) {
      const caminhoArquivo = path.join(__dirname, "..", resolucao.arquivoPath);
      if (fs.existsSync(caminhoArquivo)) fs.unlinkSync(caminhoArquivo);
    }

    await Resolucao.findByIdAndDelete(id);
    res.json({ message: "Resolução excluída com sucesso." });
  } catch (e) {
    console.error("Erro ao excluir resolução:", e);
    res.status(500).json({ error: "Erro ao excluir resolução." });
  }
});

module.exports = router;
