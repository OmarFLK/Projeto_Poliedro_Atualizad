const API = "http://localhost:3000";

/* PEGAR PROFESSOR LOGADO */
let user = null;

try {
  user = JSON.parse(localStorage.getItem("usuarioProfessor") || "null");
} catch {
  user = null;
}

if (!user) {
  alert("Erro: faça login novamente.");
}

/* Preencher nome */
document.getElementById("welcome-title").textContent =
  `Seja bem-vindo, ${user.nome}!`;

/* Função de sanitização */
function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

/* Função genérica */
function setCardHtml(id, html, fallback = "Nenhuma informação encontrada.") {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = html ? html : `<p class="card-title">${fallback}</p>`;
}

/*1) ÚLTIMA ATIVIDADE */
async function carregarUltimaAtividade() {
  try {
    const req = await fetch(
      `${API}/api/atividades?materia=${encodeURIComponent(user.materia)}`,
      { credentials: "include" }
    );

    const lista = await req.json();
    const ultima = lista[0];

    if (!ultima) {
      setCardHtml("atividade-body", "", "Nenhuma atividade criada.");
      return;
    }

    const titulo = escapeHtml(ultima.titulo);
    const turma = escapeHtml(ultima.turma);
    const sub = escapeHtml(ultima.subSala);
    const descricao = escapeHtml(ultima.descricao);

    const descCurta =
      descricao.length > 190 ? descricao.slice(0, 190) + "..." : descricao;

    setCardHtml(
      "atividade-body",
      `
        <p class="card-label">Criação Recente:</p>
        <p class="card-title">${titulo}</p>

        <div class="card-info">
            <p><strong>Turma:</strong> ${turma} • ${sub}</p>
        </div>

        <p class="card-label" style="margin-top:15px;">Descrição:</p>
        <p class="card-title" style="font-size:1rem; font-weight:500;">
            ${descCurta}
        </p>
      `
    );

  } catch (err) {
    console.error("Erro atividade:", err);
    setCardHtml("atividade-body", "", "Erro ao carregar atividade.");
  }
}

/* 2) ÚLTIMO EVENTO (do professor) */
async function carregarUltimoEvento() {
  try {
    const req = await fetch(`${API}/api/eventos`, { credentials: "include" });
    const lista = await req.json();

    // filtra só eventos do professor logado
    const meusEventos = lista.filter(ev =>
      ev.professor?.toLowerCase() === user.nome.toLowerCase()
    );

    // ORDENA PELO createdAt (o campo verdadeiro do Mongo)
    const ultimo = meusEventos.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];

    if (!ultimo) {
      setCardHtml("evento-body", "", "Nenhum evento criado.");
      return;
    }

    const titulo = escapeHtml(ultimo.titulo);
    const local = escapeHtml(ultimo.local || "Não informado");
    const data = new Date(ultimo.data).toLocaleDateString("pt-BR");
    const hora = ultimo.horario ? ` • ${ultimo.horario}` : "";

    setCardHtml(
  "evento-body",
  `
    <p class="card-label">Último evento:</p>
    <p class="card-title"><strong>${titulo}</strong></p>

    <p class="card-info"><strong>Local:</strong> ${local}</p>
    <p class="card-info"><strong>Data:</strong> ${data}</p>

    <p class="card-label" style="margin-top:10px;">Descrição:</p>
    <p class="card-title" style="font-size:1rem; font-weight:500; line-height:1.4;">
      ${escapeHtml(ultimo.descricao || "Sem descrição.")}
    </p>
  `
);


  } catch (err) {
    console.error("Erro evento:", err);
    setCardHtml("evento-body", "", "Erro ao carregar evento.");
  }
}


/*3) ÚLTIMA MENSAGEM RECEBIDA (privado, com nome do remetente) */
async function carregarUltimaMensagem() {
  try {
    const req = await fetch(
      `${API}/api/mensagens/ultimas?userId=${user.id}`,
      { credentials: "include" }
    );

    const msgs = await req.json();

    if (!Array.isArray(msgs) || msgs.length === 0) {
      setCardHtml("mensagem-body", "", "Nenhuma mensagem recebida.");
      return;
    }

    const ultima = msgs[0];

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
    } catch {}

    setCardHtml(
      "mensagem-body",
      `
        <p class="card-label">Última mensagem recebida:</p>
        <p class="card-info">De: <strong>${escapeHtml(remetente)}</strong></p>
        
        <p class="card-title" style="font-size:1rem; line-height:1.4; margin-top: 8px;">
          ${escapeHtml(ultima.texto || "Mensagem sem texto.")}
        </p>
      `
    );

  } catch (err) {
    console.error("Erro msg:", err);
    setCardHtml("mensagem-body", "", "Erro ao carregar mensagem.");
  }
}


/*INICIAR*/
document.addEventListener("DOMContentLoaded", () => {
  carregarUltimaAtividade();
  carregarUltimoEvento();
  carregarUltimaMensagem();
});
