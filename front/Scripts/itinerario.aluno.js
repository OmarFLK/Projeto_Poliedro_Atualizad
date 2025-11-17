// API
const API = "http://localhost:3000/api/itinerario";

// elementos
const tabela = document.getElementById("tabelaAluno");
const turmaInfo = document.getElementById("turmaInfo");

// horários padrão
const horariosPadrao = [
  { inicio: "07:00", fim: "07:50" },
  { inicio: "07:50", fim: "08:40" },
  { inicio: "08:40", fim: "09:00", intervalo: true },
  { inicio: "09:00", fim: "09:50" },
  { inicio: "09:50", fim: "10:40" },
  { inicio: "10:40", fim: "11:30" },
  { inicio: "11:30", fim: "11:50", intervalo: true },
  { inicio: "11:50", fim: "12:40" },
  { inicio: "12:40", fim: "13:30" }
];

// monta tabela
function montarTabela(lista) {
  if (!tabela) {
    console.error("ERRO: elemento #tabelaAluno NÃO encontrado!");
    return;
  }

  let html = `
    <thead>
      <tr>
        <th>Horário</th>
        <th>Segunda</th>
        <th>Terça</th>
        <th>Quarta</th>
        <th>Quinta</th>
        <th>Sexta</th>
      </tr>
    </thead>
    <tbody>
  `;

  lista.forEach(bloco => {
    const horarioTexto = `${bloco.inicio} ~ ${bloco.fim}`;

    if (bloco.intervalo) {
      html += `
        <tr class="linha-intervalo">
          <td class="horario">${horarioTexto}</td>
          <td colspan="5" class="intervalo-texto">INTERVALO</td>
        </tr>
      `;
    } else {
      html += `
        <tr>
          <td class="horario">${horarioTexto}</td>
          <td>${bloco.segunda || "-"}</td>
          <td>${bloco.terca || "-"}</td>
          <td>${bloco.quarta || "-"}</td>
          <td>${bloco.quinta || "-"}</td>
          <td>${bloco.sexta || "-"}</td>
        </tr>
      `;
    }
  });

  html += "</tbody>";
  tabela.innerHTML = html;
}

// carregar itinerário
async function carregarItinerario() {
  let aluno = null;

  try {
    aluno = JSON.parse(localStorage.getItem("usuarioAluno") || "null");
  } catch {}

  if (!aluno) {
    montarTabela(horariosPadrao);
    return;
  }

  turmaInfo.textContent = `${aluno.turma} — ${aluno.subSala}`;

  try {
    const resp = await fetch(`${API}/${aluno.turma}/${aluno.subSala}`, {
      credentials: "include"
    });

    const data = await resp.json();

    if (!data || !Array.isArray(data.horarios)) {
      montarTabela(horariosPadrao);
      return;
    }

    montarTabela(data.horarios);

  } catch (err) {
    console.error("Erro ao buscar itinerário:", err);
    montarTabela(horariosPadrao);
  }
}

carregarItinerario();
