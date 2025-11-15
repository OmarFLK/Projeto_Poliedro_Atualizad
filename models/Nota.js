const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotaSchema = new Schema({
  alunoId: { type: String, required: true, index: true },
  alunoNome: { type: String },
  materia: { type: String, required: true },
  ano: { type: String, required: true },
  semestre: { type: String, required: true },
  turma: { type: String },
  p1: { type: Number },
  p2: { type: Number },
  t1: { type: Number },
  t2: { type: Number },
  media: { type: Number },
  createdAt: { type: Date, default: Date.now }
});



module.exports = mongoose.model('Nota', NotaSchema);
