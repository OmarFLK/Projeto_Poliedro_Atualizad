const mongoose = require('mongoose');

const resolucaoSchema = new mongoose.Schema({
  atividadeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Atividade', 
    required: true 
  },
  alunoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Aluno', 
    required: true 
  },
  nomeAluno: { 
    type: String, 
    required: true 
  },
  raAluno: { 
    type: String, 
    required: true 
  },
  link: { 
    type: String, 
    default: '' 
  },
  observacao: { 
    type: String, 
    default: '' 
  },
  arquivoPath: { 
    type: String, 
    default: '' 
  },
  arquivoNome: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Resolucao', resolucaoSchema);
