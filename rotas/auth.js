const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Aluno = require("../models/alunos");
const Professor = require("../models/professores");

const JWT_SECRET = process.env.JWT_SECRET || "chave_super_secreta";

// gero token JWT para login
function gerarToken(usuario) {
  return jwt.sign(usuario, JWT_SECRET, { expiresIn: "8h" });
}

// seto cookie de sessão
function enviarCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 8 * 60 * 60 * 1000,
  });
}

/* ========== LOGINS ========== */

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

/* ========== RECUPERAÇÃO DE SENHA ========== */

/*
  Roteiro:
  - POST /recover/send-code     -> envia (gera) o código para o email (procura aluno primeiro, depois professor)
  - POST /recover/validate-code -> valida código + expiração
  - POST /recover/reset-password -> seta nova senha (hash) e limpa código
*/

// helper: gerar código de 6 dígitos
function gerarCodigo6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// procura por email em aluno/professor e retorna { modelName, user }
async function encontrarUsuarioPorEmail(email) {
  if (!email) return null;
  const aluno = await Aluno.findOne({ email }).exec();
  if (aluno) return { tipo: "aluno", user: aluno };
  const prof = await Professor.findOne({ email }).exec();
  if (prof) return { tipo: "professor", user: prof };
  return null;
}

// POST /auth/recover/send-code
router.post("/recover/send-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email obrigatório" });

    const encontrado = await encontrarUsuarioPorEmail(email);
    if (!encontrado) return res.status(404).json({ error: "E-mail não cadastrado" });

    const { tipo, user } = encontrado;
    const codigo = gerarCodigo6();
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutos

    // salvo no documento correto
    if (tipo === "aluno") {
      user.resetCode = codigo;
      user.resetExpires = new Date(expires);
      await user.save();
    } else {
      user.resetCode = codigo;
      user.resetExpires = new Date(expires);
      await user.save();
    }

    // aqui você integraria com nodemailer / serviço real de e-mail
    // em dev, retorno o código para facilitar testes locais
    if (process.env.NODE_ENV !== "production") {
      return res.json({ success: true, message: "Código enviado (DEV)", codigo });
    }

    // em produção, retornar só success
    return res.json({ success: true, message: "Se o e-mail existir, enviamos instruções." });

  } catch (err) {
    console.error("Erro send-code:", err);
    return res.status(500).json({ error: "Erro no servidor" });
  }
});

// POST /auth/recover/validate-code
router.post("/recover/validate-code", async (req, res) => {
  try {
    const { email, codigo } = req.body;
    if (!email || !codigo) return res.status(400).json({ error: "Email e código obrigatórios" });

    const encontrado = await encontrarUsuarioPorEmail(email);
    if (!encontrado) return res.status(404).json({ error: "E-mail não cadastrado" });

    const { user } = encontrado;
    if (!user.resetCode || !user.resetExpires) {
      return res.status(400).json({ error: "Nenhum código solicitado para este e-mail" });
    }

    if (user.resetCode !== String(codigo).trim()) {
      return res.status(401).json({ error: "Código inválido" });
    }

    if (new Date() > new Date(user.resetExpires)) {
      return res.status(401).json({ error: "Código expirado. Requisite um novo." });
    }

    // tudo ok
    return res.json({ success: true, message: "Código válido" });

  } catch (err) {
    console.error("Erro validate-code:", err);
    return res.status(500).json({ error: "Erro no servidor" });
  }
});

// POST /auth/recover/reset-password
router.post("/recover/reset-password", async (req, res) => {
  try {
    const { email, novaSenha } = req.body;
    if (!email || !novaSenha) return res.status(400).json({ error: "Email e nova senha obrigatórios" });

    const encontrado = await encontrarUsuarioPorEmail(email);
    if (!encontrado) return res.status(404).json({ error: "E-mail não cadastrado" });

    const { tipo, user } = encontrado;

    if (!user.resetCode || !user.resetExpires) {
      return res.status(400).json({ error: "Nenhum código solicitado para este e-mail" });
    }

    if (new Date() > new Date(user.resetExpires)) {
      return res.status(401).json({ error: "Código expirado. Requisite um novo." });
    }

    // hash da nova senha
    const hashed = await bcrypt.hash(novaSenha, 10);
    user.senha = hashed;

    // limpo token depois de atualizar
    user.resetCode = null;
    user.resetExpires = null;

    await user.save();

    return res.json({ success: true, message: "Senha atualizada com sucesso" });

  } catch (err) {
    console.error("Erro reset-password:", err);
    return res.status(500).json({ error: "Erro no servidor" });
  }
});

module.exports = router;
