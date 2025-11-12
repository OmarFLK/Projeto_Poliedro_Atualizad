const mongoose = require("mongoose");

const EventoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  data: { type: Date, required: true },
  horario: { type: String },
  local: { type: String },
  descricao: { type: String, required: true },
  turma: { type: String, required: true },
  professor: { type: String, required: true },
  arquivoNome: { type: String },
  arquivoPath: { type: String },
  criadoEm: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Evento", EventoSchema);
