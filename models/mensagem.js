// models/mensagem.js
// eu defino o schema de mensagens (mural e privado)

const mongoose = require('mongoose');
const { Schema } = mongoose;

const fileSchema = new Schema({
  filename: String,
  originalname: String,
  mimeType: String,
  size: Number,
  url: String
}, { _id: false });

const mensagemSchema = new Schema({
  fromUser: { type: Schema.Types.ObjectId, refPath: 'fromModel', required: true }, // id do remetente
  fromModel: { type: String, enum: ['Aluno', 'Professor'], required: true }, // coleção de referência
  fromType: { type: String, enum: ['professor', 'aluno'], required: true }, // redundância útil
  toType: { type: String, enum: ['mural','aluno'], required: true }, // mural ou privado
  toYear: { type: Number }, // quando toType === 'mural'
  toUser: { type: Schema.Types.ObjectId }, // quando toType === 'aluno' (id do alvo)
  texto: { type: String, default: '' },
  file: { type: fileSchema, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Mensagem', mensagemSchema);
