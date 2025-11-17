const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const alunoSchema = new mongoose.Schema({
  ra: { type: String, required: true, unique: true, trim: true },
  nome: { type: String, required: true, trim: true },
  senha: { type: String, required: true },
  email: { type: String, trim: true, default: '' },
  turma: { type: String, required: true },
  subSala: { type: String, required: true },
  avatar: { type: String, default: "" },

  // campos para recuperação de senha
  resetCode: { type: String, default: null },
  resetExpires: { type: Date, default: null }

}, { timestamps: true });

alunoSchema.plugin(uniqueValidator);
alunoSchema.index({ ra: 1 }, { unique: true });

module.exports = mongoose.model('Aluno', alunoSchema);
