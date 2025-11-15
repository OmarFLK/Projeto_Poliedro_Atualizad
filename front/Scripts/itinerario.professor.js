// matérias
const materias = [
  "Português","Matemática","Biologia","Física","Química","Geografia",
  "História","Filosofia","Sociologia","Artes","Educação Física","Inglês"
];

// horários padrão
const HORARIOS_PADRAO = [
  { inicio:"07:00", fim:"07:50", segunda:"", terca:"", quarta:"", quinta:"", sexta:"" },
  { inicio:"07:50", fim:"08:40", segunda:"", terca:"", quarta:"", quinta:"", sexta:"" },
  { inicio:"08:40", fim:"09:00", segunda:"Intervalo", terca:"Intervalo", quarta:"Intervalo", quinta:"Intervalo", sexta:"Intervalo" },
  { inicio:"09:00", fim:"09:50", segunda:"", terca:"", quarta:"", quinta:"", sexta:"" },
  { inicio:"09:50", fim:"10:40", segunda:"", terca:"", quarta:"", quinta:"", sexta:"" },
  { inicio:"10:40", fim:"11:30", segunda:"", terca:"", quarta:"", quinta:"", sexta:"" },
  { inicio:"11:30", fim:"11:50", segunda:"Intervalo", terca:"Intervalo", quarta:"Intervalo", quinta:"Intervalo", sexta:"Intervalo" },
  { inicio:"11:50", fim:"12:40", segunda:"", terca:"", quarta:"", quinta:"", sexta:"" },
  { inicio:"12:40", fim:"13:30", segunda:"", terca:"", quarta:"", quinta:"", sexta:"" }
];

// elementos
const areaTabela = document.getElementById("areaTabela");
const anoSelect   = document.getElementById("anoSelect");
const subSelect   = document.getElementById("subSelect");
const btnCarregar = document.getElementById("btnCarregar");
const btnSalvar   = document.getElementById("btnSalvar");

const API = "http://localhost:3000/api/itinerario";

function selectMateria(valor) {
  const isIntervalo = valor === "Intervalo";
  let html = `<select class="${isIntervalo ? "intervalo-select" : ""}">`;

  html += `<option value="">-</option>`;
  html += `<option value="Intervalo" ${isIntervalo ? "selected" : ""}>Intervalo</option>`;

  materias.forEach(m => {
    html += `<option value="${m}" ${valor === m ? "selected" : ""}>${m}</option>`;
  });

  html += `</select>`;
  return html;
}

function montarTabela(data) {
  const horarios = (data && Array.isArray(data.horarios))
    ? data.horarios
    : HORARIOS_PADRAO;

  let html = `
    <table class="table-itinerario">
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

  horarios.forEach((bloco, index) => {
    const isIntervalo =
      bloco.segunda === "Intervalo" ||
      bloco.terca === "Intervalo" ||
      bloco.quarta === "Intervalo" ||
      bloco.quinta === "Intervalo" ||
      bloco.sexta === "Intervalo";

    html += `
      <tr class="${isIntervalo ? "intervalo" : ""}" data-index="${index}">
        <td>
          <input class="inicio" value="${bloco.inicio}">
          <span> ~ </span>
          <input class="fim" value="${bloco.fim}">
        </td>

        <td>${selectMateria(bloco.segunda)}</td>
        <td>${selectMateria(bloco.terca)}</td>
        <td>${selectMateria(bloco.quarta)}</td>
        <td>${selectMateria(bloco.quinta)}</td>
        <td>${selectMateria(bloco.sexta)}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  areaTabela.innerHTML = html;
}

// carregar
btnCarregar.addEventListener("click", async () => {
  const ano = anoSelect.value;
  const sub = subSelect.value;

  if (!ano || !sub) return alert("Selecione o ano e a subturma.");

  const res = await fetch(`${API}/${ano}/${sub}`);
  let data = null;

  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  montarTabela(data);
});

// salvar
btnSalvar.addEventListener("click", async () => {
  const ano = anoSelect.value;
  const sub = subSelect.value;

  if (!ano || !sub) return alert("Selecione ano e subturma.");

  const linhas = [...document.querySelectorAll(".table-itinerario tbody tr")];

  const horarios = linhas.map((linha, index) => {
    const inicio = linha.querySelector(".inicio").value;
    const fim = linha.querySelector(".fim").value;

    const selects = linha.querySelectorAll("select");
    return {
      inicio,
      fim,
      segunda: selects[0].value,
      terca:   selects[1].value,
      quarta:  selects[2].value,
      quinta:  selects[3].value,
      sexta:   selects[4].value
    };
  });

  const resposta = await fetch(`${API}/salvar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ano, subSala: sub, horarios })
  });

  const json = await resposta.json();
  if (json.ok) alert("Itinerário salvo com sucesso!");
  else alert("Erro ao salvar!");
});
