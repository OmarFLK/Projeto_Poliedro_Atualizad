const express = require("express");
const router = express.Router();
const Itinerario = require("../models/Itinerario");

// função para normalizar textos
function normalizar(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")    // remove acentos
    .replace(/[^a-zA-Z0-9]/g, "")       // remove símbolos (inclui "º")
    .toLowerCase()
    .trim();
}

// GET itinerário por ano e subSala
router.get("/:ano/:subSala", async (req, res) => {
  try {
    console.log("[ITINERARIO] GET ->", req.params);

    const anoReq = normalizar(req.params.ano);
    const subReq = normalizar(req.params.subSala);

    // busca todos e encontra manualmente (mais confiável)
    const todos = await Itinerario.find({});
    const encontrado = todos.find(item =>
      normalizar(item.ano) === anoReq &&
      normalizar(item.subSala) === subReq
    );

    if (!encontrado) {
      console.log("[ITINERARIO] Nenhum encontrado após normalização.");
      return res.json({ horarios: null });
    }

    console.log("[ITINERARIO] Encontrado:", encontrado._id);
    return res.json(encontrado);

  } catch (err) {
    console.error("[ITINERARIO] ERRO:", err);
    return res.status(500).json({ error: "Erro interno ao buscar itinerário" });
  }
});

module.exports = router;
