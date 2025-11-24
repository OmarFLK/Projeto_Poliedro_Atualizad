
require("dotenv").config();
const mongoose = require("mongoose");
const Atividade = require("./models/Atividade");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const materiasMap = {
    "quimica": "Química",
    "química": "Química",
    "fisica": "Física",
    "física": "Física",
    "matematica": "Matemática",
    "matemática": "Matemática",
    "biologia": "Biologia",
    "portugues": "Português",
    "português": "Português",
    "historia": "História",
    "história": "História",
    "geografia": "Geografia",
    "filosofia": "Filosofia",
    "sociologia": "Sociologia",
    "educacao fisica": "Educação Física",
    "educação física": "Educação Física",
    "artes": "Artes",
    "ingles": "Inglês",
    "inglês": "Inglês"
  };

  const normalizarTurma = (txt) => {
    txt = txt.toLowerCase().replace(/\s/g, "");
    if (txt.includes("1")) return "1º Ano";
    if (txt.includes("2")) return "2º Ano";
    if (txt.includes("3")) return "3º Ano";
    return txt;
  };

  const normalizarSubSala = (txt) => {
    txt = txt.trim().toLowerCase().replace("sub", "").trim();
    return `Sub ${txt}`;
  };

  const normalizarMateria = (txt) => {
    const key = txt.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return materiasMap[key] || txt;
  };

  const atividades = await Atividade.find({});
  console.log(`Corrigindo ${atividades.length} atividades...`);

  for (const a of atividades) {
    const turma = normalizarTurma(a.turma);
    const subSala = normalizarSubSala(a.subSala);
    const materia = normalizarMateria(a.materia);

    await Atividade.findByIdAndUpdate(a._id, {
      turma,
      subSala,
      materia
    });
  }

  console.log("✔ NORMALIZAÇÃO FINALIZADA!");
  process.exit();
}

run();
