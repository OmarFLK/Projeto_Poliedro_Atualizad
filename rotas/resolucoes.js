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

// ajustes iguais aos da atividade
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


// LISTAR RESOLUÇÕES DE UMA ATIVIDADE (PROFESSOR)
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

// LISTAR RESOLUÇÕES DO ALUNO
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

// ENVIAR OU REENVIAR
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
      turma: formatTurma(turma),
      subSala: formatSubSala(subSala),
      observacao: observacao || "",
      arquivoPath: req.file ? `/uploads/resolucoes/${req.file.filename}` : (existente ? existente.arquivoPath : ""),
      arquivoNome: req.file ? (req.file.originalname || "") : (existente ? existente.arquivoNome : "")
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
    console.error("Erro ao enviar resolução", e);
    res.status(500).json({ error: "Erro ao enviar resolução" });
  }
});


// EXCLUIR
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
    console.error("Erro ao excluir resolução", e);
    res.status(500).json({ error: "Erro ao excluir resolução" });
  }
});

module.exports = router;
