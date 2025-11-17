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

/*GET — Buscar itinerário por ano e subSala*/
router.get("/:ano/:subSala", async (req, res) => {
  try {
    console.log("[ITINERARIO] GET ->", req.params);

    const anoReq = normalizar(req.params.ano);
    const subReq = normalizar(req.params.subSala);

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

/* POST — Salvar itinerário (CRIAR ou EDITAR)*/
router.post("/salvar", async (req, res) => {
  try {
    const { ano, subSala, horarios } = req.body;

    if (!ano || !subSala || !horarios) {
      return res.status(400).json({ error: "Dados incompletos para salvar" });
    }

    const anoNorm = normalizar(ano);
    const subNorm = normalizar(subSala);

    // buscar existente
    const todos = await Itinerario.find({});
    let existente = todos.find(item =>
      normalizar(item.ano) === anoNorm &&
      normalizar(item.subSala) === subNorm
    );

    if (existente) {
      // Atualizar
      existente.horarios = horarios;
      await existente.save();
      return res.json({ ok: true, mensagem: "Itinerário atualizado" });
    }

    // Criar novo
    const novo = new Itinerario({
      ano,
      subSala,
      horarios
    });

    await novo.save();

    return res.json({ ok: true, mensagem: "Itinerário criado" });

  } catch (err) {
    console.error("[ITINERARIO] ERRO AO SALVAR:", err);
    return res.status(500).json({ error: "Erro interno ao salvar itinerário" });
  }
});

module.exports = router;
