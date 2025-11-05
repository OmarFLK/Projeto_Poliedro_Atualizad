const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const professorSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true },
  nome: { type: String, required: true, trim: true },
  senha: { type: String, required: true },
  codigo: { type: String, trim: true } // se quiser um ID interno
}, { timestamps: true });

professorSchema.plugin(uniqueValidator);
professorSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Professor', professorSchema);
