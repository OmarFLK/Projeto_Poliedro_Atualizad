// rotas/mensagens.js
// eu gero rotas de listagem e envio de mensagens
const express = require('express');
const router = express.Router();
const Mensagem = require('../models/mensagem');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta';

// preparo uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// helper: tenta extrair usuário do JWT (cookie ou Authorization header)
function tryGetUserFromReq(req) {
  try {
    // 1) Authorization header "Bearer <token>"
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded; // { id, tipo, ... }
    }

    // 2) cookie 'token'
    if (req.cookies && req.cookies.token) {
      const decoded = jwt.verify(req.cookies.token, JWT_SECRET);
      return decoded;
    }
  } catch (err) {
    // se token inválido, retorno null (não faço throw)
    return null;
  }
  return null;
}

/*
  GET /api/mensagens?tipo=mural&year=1
  GET /api/mensagens?tipo=aluno&toUser=<id>&userId=<id opcional do requester>

  Nota: para compatibilidade com localStorage, o front pode enviar query param userId
  (id do professor logado) se quiser que o backend faça checagens adicionais.
*/
router.get('/', async (req, res) => {
  try {
    const tipo = req.query.tipo;
    if (!tipo) return res.status(400).json({ error: 'tipo obrigatório (mural|aluno)' });

    if (tipo === 'mural') {
      const year = Number(req.query.year);
      if (!year) return res.status(400).json({ error: 'year obrigatório para mural' });

      const msgs = await Mensagem.find({ toType: 'mural', toYear: year })
        .sort({ createdAt: 1 })
        .lean();
      return res.json(msgs);
    }

    if (tipo === 'aluno') {
      const toUser = req.query.toUser;
      if (!toUser) return res.status(400).json({ error: 'toUser obrigatório para tipo=aluno' });

      // se userId for enviado, é o id do requester (por exemplo, o professor logado no front)
      const userId = req.query.userId;

      // retorno: mensagens privadas envolvendo o aluno (toUser) OR mensagens enviadas por esse aluno
      const msgs = await Mensagem.find({
        toType: 'aluno',
        $or: [
          { toUser: toUser },
          { fromUser: toUser }
        ]
      }).sort({ createdAt: 1 }).lean();

      return res.json(msgs);
    }

    return res.status(400).json({ error: 'tipo inválido' });
  } catch (err) {
    console.error('GET /api/mensagens erro', err);
    return res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

/*
  POST /api/mensagens
  - aceita JSON com corpo:
    { tipo: 'mural'|'aluno', year?, toUser?, texto?, fromUser?, fromType?, fromModel? }
  - ou multipart/form-data com file + fields
  - se houver JWT: o remetente é extraído do token (prioridade)
  - se não houver JWT: o front deve enviar fromUser/fromType/fromModel no body (fluxo localStorage)
*/
router.post('/', upload.single('file'), async (req, res) => {
  try {
    // tento extrair do token (se existir)
    const tokenUser = tryGetUserFromReq(req);

    // pegar payload (suporta multipart e json)
    const tipo = req.body.tipo;
    const texto = (req.body.texto || req.body.text || '').trim();

    if (!tipo) return res.status(400).json({ error: 'tipo obrigatório' });

    // remetente a partir do token ou do body (localStorage)
    let fromUser = null;
    let fromType = null;
    let fromModel = null;

    if (tokenUser && tokenUser.id) {
      fromUser = tokenUser.id;
      fromType = tokenUser.tipo || (tokenUser.tipo === 'professor' ? 'professor' : 'aluno');
      fromModel = (fromType === 'professor') ? 'Professor' : 'Aluno';
    } else {
      // precisa vir do body
      fromUser = req.body.fromUser;
      fromType = req.body.fromType;
      fromModel = req.body.fromModel;
      if (!fromUser || !fromType || !fromModel) {
        return res.status(400).json({ error: 'Remetente obrigatório (fromUser/fromType/fromModel) quando não há token' });
      }
    }

    // MURAL — somente professor pode postar (validação leve)
    if (tipo === 'mural') {
      if (fromType !== 'professor') return res.status(403).json({ error: 'Apenas professores podem postar no mural' });

      const year = Number(req.body.year);
      if (!year) return res.status(400).json({ error: 'year obrigatório para mural' });

      const m = new Mensagem({
        fromUser,
        fromModel,
        fromType,
        toType: 'mural',
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

    // PRIVADO — professor ou aluno podem enviar (o front decide toUser)
    if (tipo === 'aluno') {
      const toUser = req.body.toUser;
      if (!toUser) return res.status(400).json({ error: 'toUser obrigatório para privado' });

      const m = new Mensagem({
        fromUser,
        fromModel,
        fromType,
        toType: 'aluno',
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

    return res.status(400).json({ error: 'tipo inválido' });
  } catch (err) {
    console.error('POST /api/mensagens erro', err);
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

module.exports = router;
