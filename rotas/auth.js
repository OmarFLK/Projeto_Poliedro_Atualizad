const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Aluno = require("../models/alunos");
const Professor = require("../models/professores");

const JWT_SECRET = process.env.JWT_SECRET || "chave_super_secreta";

function gerarToken(usuario) {
  return jwt.sign(usuario, JWT_SECRET, { expiresIn: "8h" });
}

function enviarCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 8 * 60 * 60 * 1000,
  });
}

// ************ LOGIN ALUNO ************
router.post("/aluno/login", async (req, res) => {
  try {
    const { ra, senha } = req.body;

    if (!ra || !senha)
      return res.status(400).json({ error: "RA e senha obrigatórios" });

    const aluno = await Aluno.findOne({ ra });
    if (!aluno)
      return res.status(401).json({ error: "RA ou senha inválidos" });

    const match = await bcrypt.compare(senha, aluno.senha);
    if (!match)
      return res.status(401).json({ error: "RA ou senha inválidos" });

    const token = gerarToken({
      id: aluno._id,
      tipo: "aluno",
      turma: aluno.turma,
      subSala: aluno.subSala,
    });

    enviarCookie(res, token);

    return res.json({
      usuario: {
        id: aluno._id,
        nome: aluno.nome,
        ra: aluno.ra,
        email: aluno.email,
        turma: aluno.turma,
        subSala: aluno.subSala,
        avatar: aluno.avatar || "",
        tipo: "aluno"
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro no servidor" });
  }
});

// ************ LOGIN PROFESSOR ************
router.post("/professor/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha)
      return res.status(400).json({ error: "Email e senha obrigatórios" });

    const prof = await Professor.findOne({ email });
    if (!prof)
      return res.status(401).json({ error: "Email ou senha inválidos" });

    const match = await bcrypt.compare(senha, prof.senha);
    if (!match)
      return res.status(401).json({ error: "Email ou senha inválidos" });

    const token = gerarToken({
      id: prof._id,
      tipo: "professor",
      materia: prof.materia,
    });

    enviarCookie(res, token);

    return res.json({
      usuario: {
        id: prof._id,
        nome: prof.nome,
        email: prof.email,
        materia: prof.materia,
        avatar: prof.avatar || "",
        tipo: "professor"
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro no servidor" });
  }
});

// ************ LOGOUT ************
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ success: true });
});

module.exports = router;
