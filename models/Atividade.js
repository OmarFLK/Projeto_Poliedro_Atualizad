const mongoose = require('mongoose');

const atividadeSchema = new mongoose.Schema({
  turma:     { type: String, required: true },
  subSala:   { type: String, required: true },
  materia:   { type: String, required: true },
  titulo:    { type: String, required: true },
  descricao: { type: String, default: '' },
  arquivoPath: { type: String, default: '' },
  arquivoNome: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Atividade', atividadeSchema);
