const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "chave_super_secreta";

module.exports = function (req, res, next) {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ error: "Não autenticado" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

