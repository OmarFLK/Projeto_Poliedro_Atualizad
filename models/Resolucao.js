const mongoose = require('mongoose');

const resolucaoSchema = new mongoose.Schema(
  {
    atividadeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Atividade', required: true, index: true },
    alunoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Aluno', required: true, index: true },

    nomeAluno: { type: String, required: true },
    raAluno: { type: String, required: true },

    // turma e subSala do aluno no momento do envio
    turma: { type: String, default: '' },
    subSala: { type: String, default: '' },

    link: { type: String, default: '' },
    observacao: { type: String, default: '' },

    arquivoPath: { type: String, default: '' },
    arquivoNome: { type: String, default: '' },
  },
  { timestamps: true }
);

// uma resolução por atividade por aluno
resolucaoSchema.index({ atividadeId: 1, alunoId: 1 }, { unique: true });

module.exports = mongoose.model('Resolucao', resolucaoSchema);
