// rotas/mensagens.js
// ROTA COMPLETA, CORRIGIDA E SEM MISTURAR MENSAGENS ENTRE ALUNOS DIFERENTES

const express = require('express');
const router = express.Router();
const Mensagem = require('../models/mensagem');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta';


// ======================================================
// CONFIGURAÇÃO DE UPLOAD
// ======================================================

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });


// ======================================================
// JWT → tenta extrair usuário
// ======================================================

function tryGetUserFromReq(req) {
  try {
    // Authorization Header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      return jwt.verify(token, JWT_SECRET);
    }

    // Cookie
    if (req.cookies && req.cookies.token) {
      return jwt.verify(req.cookies.token, JWT_SECRET);
    }
  } catch {
    return null;
  }

  return null;
}


// ======================================================
// GET /api/mensagens
// mural: /api/mensagens?tipo=mural&year=1
// privado: /api/mensagens?tipo=aluno&toUser=<id>&userId=<idLogado>
// ======================================================

router.get('/', async (req, res) => {
  try {
    const tipo = req.query.tipo;

    if (!tipo) {
      return res.status(400).json({ error: "tipo obrigatório (mural | aluno)" });
    }

    // --------------------------------------------------
    // MURAL
    // --------------------------------------------------
    if (tipo === 'mural') {
      const year = Number(req.query.year);
      if (!year) return res.status(400).json({ error: "year obrigatório para mural" });

      const msgs = await Mensagem.find({
        toType: 'mural',
        toYear: year
      })
        .sort({ createdAt: 1 })
        .lean();

      return res.json(msgs);
    }

    // --------------------------------------------------
    // PRIVADO (aluno ↔ professor)
    // --------------------------------------------------
    if (tipo === 'aluno') {
      const toUser = req.query.toUser;   // contato da conversa (professor OU aluno)
      const userId = req.query.userId;   // usuário logado (aluno OU professor)

      if (!toUser || !userId) {
        return res.status(400).json({ error: "toUser e userId são obrigatórios" });
      }

      // 🔥 LÓGICA CORRETA — SOMENTE mensagens entre userId e toUser
      const msgs = await Mensagem.find({
        toType: 'aluno',
        $or: [
          { fromUser: userId, toUser: toUser },
          { fromUser: toUser, toUser: userId }
        ]
      })
        .sort({ createdAt: 1 })
        .lean();

      return res.json(msgs);
    }

    return res.status(400).json({ error: "tipo inválido" });

  } catch (err) {
    console.error("GET /api/mensagens erro:", err);
    return res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
});


// ======================================================
// POST /api/mensagens
// ======================================================

router.post('/', upload.single('file'), async (req, res) => {
  try {
    // tenta extrair do token
    const tokenUser = tryGetUserFromReq(req);

    const tipo = req.body.tipo;
    const texto = (req.body.texto || "").trim();

    if (!tipo) {
      return res.status(400).json({ error: "tipo obrigatório" });
    }

    // ------------------------------------------------------
    // IDENTIDADE DO REMETENTE
    // ------------------------------------------------------

    let fromUser = null;
    let fromType = null;
    let fromModel = null;

    if (tokenUser && tokenUser.id) {
      fromUser = tokenUser.id;
      fromType = tokenUser.tipo;
      fromModel = tokenUser.tipo === "professor" ? "Professor" : "Aluno";

    } else {
      // fluxo localStorage
      fromUser = req.body.fromUser;
      fromType = req.body.fromType;
      fromModel = req.body.fromModel;

      if (!fromUser || !fromType || !fromModel) {
        return res.status(400).json({
          error: "fromUser, fromType e fromModel são obrigatórios quando não há token"
        });
      }
    }


    // ------------------------------------------------------
    // MURAL → somente professor pode postar
    // ------------------------------------------------------

    if (tipo === "mural") {
      if (fromType !== "professor") {
        return res.status(403).json({ error: "Apenas professores podem postar no mural" });
      }

      const year = Number(req.body.year);
      if (!year) return res.status(400).json({ error: "year obrigatório para mural" });

      const m = new Mensagem({
        fromUser,
        fromModel,
        fromType,
        toType: "mural",
        toYear: year,
        texto
      });

      if (req.file) {
        m.file = {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`
        };
      }

      await m.save();
      return res.status(201).json({ mensagem: m });
    }


    // ------------------------------------------------------
    // PRIVADO → professor OU aluno enviam
    // ------------------------------------------------------

    if (tipo === "aluno") {
      const toUser = req.body.toUser;
      if (!toUser) {
        return res.status(400).json({ error: "toUser obrigatório para privado" });
      }

      const m = new Mensagem({
        fromUser,
        fromModel,
        fromType,
        toType: "aluno",
        toUser,
        texto
      });

      if (req.file) {
        m.file = {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`
        };
      }

      await m.save();
      return res.status(201).json({ mensagem: m });
    }


    return res.status(400).json({ error: "tipo inválido" });

  } catch (err) {
    console.error("POST /api/mensagens erro:", err);
    return res.status(500).json({ error: "Erro ao enviar mensagem" });
  }
});


module.exports = router;
