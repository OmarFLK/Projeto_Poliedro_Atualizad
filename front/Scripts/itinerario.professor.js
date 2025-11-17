const API = "http://localhost:3000";

/* ELEMENTOS */
const anoSelect = document.getElementById("anoSelect");
const subSelect = document.getElementById("subSelect");
const btnCarregar = document.getElementById("btnCarregar");
const btnSalvar = document.getElementById("btnSalvar");
const areaTabela = document.getElementById("areaTabela");

/* HORÁRIOS PADRÃO */
const horariosPadrao = [
  { inicio: "07:00", fim: "07:50" },
  { inicio: "07:50", fim: "08:40" },
  { inicio: "08:40", fim: "09:00" },
  { inicio: "09:00", fim: "09:50" },
  { inicio: "09:50", fim: "10:40" },
  { inicio: "10:40", fim: "11:30" },
  { inicio: "11:30", fim: "11:50" },
  { inicio: "11:50", fim: "12:40" },
  { inicio: "12:40", fim: "13:30" }
];

/* MATÉRIAS */
const materias = [
  "", "INTERVALO", "Matemática", "Português", "Física", "Química",
  "Biologia", "História", "Geografia", "Inglês", "Artes",
  "Filosofia", "Sociologia", "Educação Física"
];

/* NORMALIZAR para o backend */
function normalizar(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

/* SELECT bonito */
function criarSelect(valorAtual, idx, dia) {
  let html = `<select class="cel-select" data-i="${idx}" data-dia="${dia}">`;
  materias.forEach(m => {
    html += `<option value="${m}" ${m === valorAtual ? "selected" : ""}>${m || "-"}</option>`;
  });
  html += "</select>";
  return html;
}

/* MONTAR TABELA */
function montarTabela(data) {
  let horarios = data.length ? data : horariosPadrao;

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

  horarios.forEach((h, idx) => {
    html += `
      <tr>
        <td class="horario-editar">
          <input type="time" class="hora-inicio" data-i="${idx}" value="${h.inicio}">
          ~
          <input type="time" class="hora-fim" data-i="${idx}" value="${h.fim}">
        </td>

        <td>${criarSelect(h.segunda || "", idx, "segunda")}</td>
        <td>${criarSelect(h.terca || "", idx, "terca")}</td>
        <td>${criarSelect(h.quarta || "", idx, "quarta")}</td>
        <td>${criarSelect(h.quinta || "", idx, "quinta")}</td>
        <td>${criarSelect(h.sexta || "", idx, "sexta")}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  areaTabela.innerHTML = html;

  aplicarEstiloIntervalo();
}

/* COLORIR INTERVALO */
function aplicarEstiloIntervalo() {
  document.querySelectorAll(".cel-select").forEach(sel => {
    if (sel.value === "INTERVALO") {
      sel.style.background = "#eef3ff";
      sel.style.fontWeight = "bold";
      sel.style.color = "#1a4e9b";
    } else {
      sel.style.background = "white";
      sel.style.fontWeight = "normal";
      sel.style.color = "black";
    }

    sel.addEventListener("change", aplicarEstiloIntervalo);
  });
}

/* BUSCAR */
async function carregarItinerario() {
  let anoOriginal = anoSelect.value;
  let subOriginal = subSelect.value;

  if (!anoOriginal || !subOriginal)
    return alert("Selecione ano e sub-sala.");

  const ano = normalizar(anoOriginal);
  const sub = normalizar(subOriginal);

  try {
    const res = await fetch(`${API}/api/itinerario/${ano}/${sub}`);
    const data = await res.json();

    montarTabela(data?.horarios || []);
  } catch (err) {
    console.error(err);
    montarTabela([]);
  }
}

/* SALVAR */
async function salvarItinerario() {
  let anoOriginal = anoSelect.value;
  let subOriginal = subSelect.value;

  if (!anoOriginal || !subOriginal)
    return alert("Selecione ano e sub-sala.");

  const ano = normalizar(anoOriginal);
  const sub = normalizar(subOriginal);

  const selects = [...document.querySelectorAll(".cel-select")];
  const horaInicio = [...document.querySelectorAll(".hora-inicio")];
  const horaFim = [...document.querySelectorAll(".hora-fim")];

  const horariosFinal = horariosPadrao.map((_, idx) => ({
    inicio: horaInicio[idx].value || "00:00",
    fim: horaFim[idx].value || "00:00",
    segunda: selects.find(s => s.dataset.i == idx && s.dataset.dia === "segunda")?.value || "",
    terca: selects.find(s => s.dataset.i == idx && s.dataset.dia === "terca")?.value || "",
    quarta: selects.find(s => s.dataset.i == idx && s.dataset.dia === "quarta")?.value || "",
    quinta: selects.find(s => s.dataset.i == idx && s.dataset.dia === "quinta")?.value || "",
    sexta: selects.find(s => s.dataset.i == idx && s.dataset.dia === "sexta")?.value || ""
  }));

  try {
    const res = await fetch(`${API}/api/itinerario/salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ano: anoOriginal,
        subSala: subOriginal,
        horarios: horariosFinal
      }),
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) return alert(data.error || "Erro ao salvar.");

    alert("Itinerário salvo com sucesso!");
  } catch (err) {
    console.error(err);
    alert("Erro ao salvar.");
  }
}

/* BOTÕES */
btnCarregar.addEventListener("click", carregarItinerario);
btnSalvar.addEventListener("click", salvarItinerario);
