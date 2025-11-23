const express = require('express');
const router = express.Router();
const Mensagem = require('../models/mensagem');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

function tryGetUserFromReq(req) {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      return jwt.verify(token, JWT_SECRET);
    }

    if (req.cookies && req.cookies.token) {
      return jwt.verify(req.cookies.token, JWT_SECRET);
    }
  } catch {
    return null;
  }
  return null;
}

// ===========================
// GET /api/mensagens
// ===========================
router.get('/', async (req, res) => {
  try {
    const tipo = req.query.tipo;
    if (!tipo) return res.status(400).json({ error: "tipo obrigatório" });

    // MURAL
    if (tipo === 'mural') {
      const year = Number(req.query.year);
      if (!year) return res.status(400).json({ error: "year obrigatório" });

      const msgs = await Mensagem.find({
        toType: 'mural',
        toYear: year
      }).sort({ createdAt: 1 }).lean();

      return res.json(msgs);
    }

    // PRIVADO
    if (tipo === 'aluno') {
      const toUser = req.query.toUser;
      const userId = req.query.userId;

      // devolve [] ao invés de erro (corrige HomeAluno)
      if (!toUser || !userId) return res.json([]);

      const msgs = await Mensagem.find({
        toType: 'aluno',
        $or: [
          { fromUser: userId, toUser: toUser },
          { fromUser: toUser, toUser: userId }
        ]
      }).sort({ createdAt: 1 }).lean();

      return res.json(msgs);
    }

    return res.status(400).json({ error: "tipo inválido" });

  } catch (err) {
    console.error("GET mensagens:", err);
    res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
});


// ===========================
// POST /api/mensagens
// ===========================
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const tokenUser = tryGetUserFromReq(req);

    const tipo = req.body.tipo;
    const texto = (req.body.texto || "").trim();
    if (!tipo) return res.status(400).json({ error: "tipo obrigatório" });

    let fromUser = null;
    let fromType = null;
    let fromModel = null;

    if (tokenUser && tokenUser.id) {
      fromUser = tokenUser.id;
      fromType = tokenUser.tipo;
      fromModel = tokenUser.tipo === "professor" ? "Professor" : "Aluno";
    } else {
      fromUser = req.body.fromUser;
      fromType = req.body.fromType;
      fromModel = req.body.fromModel;
      if (!fromUser || !fromType || !fromModel) {
        return res.status(400).json({ error: "dados de remetente obrigatórios" });
      }
    }

    // MURAL
    if (tipo === "mural") {
      if (fromType !== "professor") return res.status(403).json({ error: "apenas professores podem postar" });

      const year = Number(req.body.year);
      if (!year) return res.status(400).json({ error: "year obrigatório" });

      const m = new Mensagem({
        fromUser, fromModel, fromType,
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

    // PRIVADO
    if (tipo === "aluno") {
      const toUser = req.body.toUser;
      if (!toUser) return res.status(400).json({ error: "toUser obrigatório" });

      const m = new Mensagem({
        fromUser, fromModel, fromType,
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

    res.status(400).json({ error: "tipo inválido" });

  } catch (err) {
    console.error("POST mensagens:", err);
    res.status(500).json({ error: "Erro ao enviar mensagem" });
  }
});


module.exports = router;
