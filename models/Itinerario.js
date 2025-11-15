const mongoose = require("mongoose");

const blocoSchema = new mongoose.Schema({
  ordem: Number,
  inicio: String,
  fim: String,
  segunda: String,
  terca: String,
  quarta: String,
  quinta: String,
  sexta: String
});

const itinerarioSchema = new mongoose.Schema({
  ano: { type: String, required: true },
  subSala: { type: String, required: true },
  horarios: [blocoSchema]
}, { timestamps: true });

module.exports = mongoose.model("Itinerario", itinerarioSchema);
