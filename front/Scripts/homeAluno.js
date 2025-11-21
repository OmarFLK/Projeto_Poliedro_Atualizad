const API = "http://localhost:3000";

/*PEGAR ALUNO LOGADO*/
let user = null;

try {
  user = JSON.parse(localStorage.getItem("usuarioAluno") || "null");
} catch {
  user = null;
}

if (!user) {
  alert("Erro: faça login novamente.");
  window.location.href = "Login.html";
}

/*PREENCHE NOME NO TÍTULO*/
const welcomeTitle = document.getElementById("welcome-title");
if (welcomeTitle && user?.nome) {
  welcomeTitle.textContent = `Seja bem-vindo, ${user.nome}!`;
}

/*SANITIZAÇÃO */
function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

/*NORMALIZAÇÃO DE TURMA E SUBSALA (ESSENCIAL!) */
function normalizarTurma(t) {
  if (!t) return "";
  t = t.toString().trim();

  if (t === "1") return "1º Ano";
  if (t === "2") return "2º Ano";
  if (t === "3") return "3º Ano";

  return t; // caso já esteja correto
}

function normalizarSubSala(s) {
  if (!s) return "";
  s = s.toString().trim();
  return `Sub ${s}`;
}

const turmaNormal = encodeURIComponent(normalizarTurma(user.turma));
const subNormal = encodeURIComponent(normalizarSubSala(user.subSala));

/*FUNÇÃO PARA PREENCHER CARDS */
function setCardHtml(id, html, fallback = "Nenhuma informação encontrada.") {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = html ? html : `<p class="card-title">${fallback}</p>`;
}

/* 1) ÚLTIMA ATIVIDADE DO ALUNO */
async function carregarUltimaAtividadeAluno() {
  try {
    const req = await fetch(
      `${API}/api/atividades?turma=${turmaNormal}&subSala=${subNormal}`
    );

    const lista = await req.json();

    if (!Array.isArray(lista) || lista.length === 0) {
      setCardHtml("atividade-body", "", "Nenhuma atividade para sua turma.");
      return;
    }

    const ultima = lista.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    const titulo = escapeHtml(ultima.titulo);
    const turmaLabel = escapeHtml(ultima.turma);
    const subSalaLabel = escapeHtml(ultima.subSala);
    const descricao = escapeHtml(ultima.descricao || "");

    const descCurta =
      descricao.length > 190 ? descricao.slice(0, 190) + "..." : descricao;

    setCardHtml(
      "atividade-body",
      `
        <p class="card-label">Criação Recente:</p>
        <p class="card-title">${titulo}</p>

        <div class="card-info">
          <p><strong>Turma:</strong> ${turmaLabel} • ${subSalaLabel}</p>
        </div>

        <p class="card-label" style="margin-top:15px;">Descrição:</p>
        <p class="card-title" style="font-size:1rem; font-weight:500;">
          ${descCurta || "Sem descrição."}
        </p>
      `
    );

  } catch (err) {
    console.error("Erro atividade aluno:", err);
    setCardHtml("atividade-body", "", "Erro ao carregar atividade.");
  }
}

/*2) ÚLTIMO EVENTO DO ALUNO */
async function carregarUltimoEventoAluno() {
  try {
    const req = await fetch(`${API}/api/eventos`);
    const lista = await req.json();

    if (!Array.isArray(lista) || lista.length === 0) {
      setCardHtml("evento-body", "", "Nenhum evento disponível.");
      return;
    }

    const turmaAluno = normalizarTurma(user.turma).toLowerCase();
    const subAluno = normalizarSubSala(user.subSala).toLowerCase();

    const eventosFiltrados = lista.filter(ev => {
      const turmaEvento = (ev.turma || "").toLowerCase();
      const subEvento = (ev.subSala || "").toLowerCase();

      const geralTurma = turmaEvento === "" || turmaEvento === "todas";
      const geralSub = subEvento === "" || subEvento === "todas";

      const turmaOK = geralTurma || turmaEvento === turmaAluno;
      const subOK = geralSub || subEvento === subAluno;

      return turmaOK && subOK;
    });

    if (eventosFiltrados.length === 0) {
      setCardHtml("evento-body", "", "Nenhum evento para sua turma.");
      return;
    }

    const ultimo = eventosFiltrados.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    const titulo = escapeHtml(ultimo.titulo);
    const local = escapeHtml(ultimo.local || "Não informado");
    const data = ultimo.data
      ? new Date(ultimo.data).toLocaleDateString("pt-BR")
      : "Sem data";
    const hora = ultimo.horario ? ` • ${ultimo.horario}` : "";
    const descricao = escapeHtml(ultimo.descricao || "Sem descrição.");

    setCardHtml(
      "evento-body",
      `
        <p class="card-label">Último evento:</p>
        <p class="card-title"><strong>${titulo}</strong></p>

        <p class="card-info"><strong>Local:</strong> ${local}</p>
        <p class="card-info"><strong>Data:</strong> ${data}${hora}</p>

        <p class="card-label" style="margin-top:10px;">Descrição:</p>
        <p class="card-title" style="font-size:1rem; font-weight:500; line-height:1.4;">
          ${descricao}
        </p>
      `
    );

  } catch (err) {
    console.error("Erro evento aluno:", err);
    setCardHtml("evento-body", "", "Erro ao carregar evento.");
  }
}

/*3) ÚLTIMA MENSAGEM DO ALUNO */
async function carregarUltimaMensagemAluno() {
  try {
    const req = await fetch(
      `${API}/api/mensagens?tipo=aluno&toUser=${user.id}`
    );

    const msgs = await req.json();

    if (!Array.isArray(msgs) || msgs.length === 0) {
      setCardHtml("mensagem-body", "", "Nenhuma mensagem recebida.");
      return;
    }

    const ultima = msgs.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    let remetente = "Usuário";

    try {
      if (ultima.fromModel === "Aluno") {
        const r = await fetch(`${API}/api/alunos/${ultima.fromUser}`);
        const dados = await r.json();
        remetente = dados.nome || "Aluno";
      } else if (ultima.fromModel === "Professor") {
        const r = await fetch(`${API}/api/professores/${ultima.fromUser}`);
        const dados = await r.json();
        remetente = dados.nome || "Professor";
      }
    } catch (err) {
      console.warn("Erro ao buscar remetente:", err);
    }

    setCardHtml(
      "mensagem-body",
      `
        <p class="card-label">Última mensagem recebida:</p>
        <p class="card-info">De: <strong>${escapeHtml(remetente)}</strong></p>
        
        <p class="card-title" style="font-size:1rem; line-height:1.4; margin-top: 8px;">
          ${escapeHtml(ultima.texto || ultima.conteudo || "Mensagem sem texto.")}
        </p>
      `
    );

  } catch (err) {
    console.error("Erro mensagem aluno:", err);
    setCardHtml("mensagem-body", "", "Erro ao carregar mensagem.");
  }
}

/*INICIAR */
document.addEventListener("DOMContentLoaded", () => {
  carregarUltimaAtividadeAluno();
  carregarUltimoEventoAluno();
  carregarUltimaMensagemAluno();
});
