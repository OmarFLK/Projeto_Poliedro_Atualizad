const API_BASE = "http://localhost:3000";

function apiGet(url) {
  return fetch(API_BASE + url, { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error(res.status + " GET " + url);
      return res.json();
    });
}

function apiPostJson(url, data) {
  return fetch(API_BASE + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data)
  }).then(res => {
    if (!res.ok) throw new Error(res.status + " POST " + url);
    return res.json();
  });
}

document.addEventListener("DOMContentLoaded", () => {

  const sidebar = document.getElementById("sidebar");
  const muralList = document.getElementById("mural-list");
  const profList = document.getElementById("prof-list");

  const chatMensagens = document.getElementById("chat-mensagens");
  const chatTitle = document.getElementById("chat-title");
  const placeholder = document.getElementById("placeholder");

  const chatInput = document.getElementById("chatInput");
  const btnSend = document.getElementById("btnSend");
  const btnRefresh = document.getElementById("btnRefresh");

  const chatMenuToggle = document.getElementById("chat-menu-toggle");

  let professoresCache = [];
  let current = null;
  let isSending = false;

  // CARREGAR ALUNO DO LOCALSTORAGE
  let usuarioAluno = null;
  try {
    usuarioAluno = JSON.parse(localStorage.getItem("usuarioAluno") || "null");
  } catch { usuarioAluno = null; }

  console.log("ALUNO LOGADO:", usuarioAluno);

  if (!usuarioAluno) {
    alert("Erro: aluno não encontrado no localStorage.");
    return;
  }

  init();
  async function init() {
    await carregarProfessores();
    renderizarMural();
    renderizarProfessores(professoresCache);

    showPlaceholder();
    ajustePaddingChat();

    window.addEventListener("resize", ajustePaddingChat);

    setupMobileDrawerToggle();
  }

  async function carregarProfessores() {
    try {
      const data = await apiGet("/api/professores");
      professoresCache = Array.isArray(data) ? data : [];
      console.log("PROFESSORES:", professoresCache);
    } catch (err) {
      console.error("Erro ao carregar professores:", err);
      professoresCache = [];
    }
  }

  function renderizarMural() {
    muralList.innerHTML = "";

    const ano = usuarioAluno.turma.match(/\d+/)?.[0] || "";

    const li = document.createElement("li");
    li.className = "mural-item";
    li.dataset.year = ano;
    li.innerHTML = `<div class="mural-title">${ano}º Ano</div><div style="opacity:.6">▸</div>`;

    li.addEventListener("click", () => {
      limparSelecoes();
      li.classList.add("selected");
      selecionarMural(Number(ano));

      if (window.innerWidth <= 900) sidebar.classList.remove("open");
    });

    muralList.appendChild(li);
  }

  function renderizarProfessores(list) {
    profList.innerHTML = "";

    list.forEach(p => {
      const avatar = p.avatar?.trim() ? p.avatar : "/Assets/LogoUsuario.png";

      const li = document.createElement("li");
      li.className = "aluno-item";
      li.dataset.id = p._id;

      li.innerHTML = `
        <img src="${avatar}" class="aluno-avatar" />
        <div class="aluno-info">
          <div class="nome">${p.nome}</div>
          <div class="meta">${p.materia || ""}</div>
        </div>
      `;

      li.addEventListener("click", () => {
        limparSelecoes();
        li.classList.add("selected");
        selecionarProfessor(p);

        if (window.innerWidth <= 900) sidebar.classList.remove("open");
      });

      profList.appendChild(li);
    });
  }

  function limparSelecoes() {
    document.querySelectorAll(".mural-item").forEach(e => e.classList.remove("selected"));
    document.querySelectorAll(".aluno-item").forEach(e => e.classList.remove("selected"));
  }

  function selecionarMural(ano) {
    current = { type: "mural", year: ano };
    chatTitle.textContent = `${ano}º Ano`;
    carregarMensagens();
  }

  function selecionarProfessor(prof) {
    current = { type: "professor", id: prof._id, nome: prof.nome };
    chatTitle.textContent = prof.nome;
    carregarMensagens();
  }

  async function carregarMensagens() {
    chatMensagens.innerHTML = "";
    placeholder.style.display = "none";

    if (!current) return showPlaceholder();

    let msgs = [];

    try {
      if (current.type === "mural") {
        msgs = await apiGet(`/api/mensagens?tipo=mural&year=${current.year}`);
      } else {
        const alunoId = usuarioAluno.id;
        msgs = await apiGet(`/api/mensagens?tipo=aluno&toUser=${current.id}&userId=${alunoId}`);
      }

      renderizarMensagens(msgs);
    } catch (err) {
      console.error(err);
      const erro = document.createElement("div");
      erro.className = "chat-placeholder";
      erro.textContent = "Erro ao carregar mensagens.";
      chatMensagens.appendChild(erro);
    }
  }


  function renderizarMensagens(msgs) {
    chatMensagens.innerHTML = "";

    if (!msgs || msgs.length === 0) {
      const vazio = document.createElement("div");
      vazio.className = "chat-placeholder";
      vazio.textContent = "Nenhuma mensagem ainda.";
      chatMensagens.appendChild(vazio);
      scrollBottom();
      return;
    }

    msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    msgs.forEach(m => {
      const row = document.createElement("div");
      const isDoAluno = m.fromUser === usuarioAluno.id;

      row.className = "msg-row " + (isDoAluno ? "msg-right" : "msg-left");

      const bubble = document.createElement("div");
      bubble.className = "msg-bubble";
      if (isDoAluno) bubble.classList.add("right");

      bubble.textContent = m.texto || "";

      const ts = document.createElement("div");
      ts.className = "msg-ts";
      ts.textContent = new Date(m.createdAt).toLocaleString([], {
        hour: "2-digit",
        minute: "2-digit"
      });

      row.appendChild(bubble);
      row.appendChild(ts);
      chatMensagens.appendChild(row);
    });

    scrollBottom();
  }

  function showPlaceholder() {
    chatMensagens.innerHTML = "";
    placeholder.style.display = "flex";
    chatTitle.textContent = "Selecione uma conversa";
  }

  // ---------------------------------------
  // ENVIAR MENSAGEM
  // ---------------------------------------
  btnSend.addEventListener("click", enviarMensagem);

  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isSending) enviarMensagem();
    }
  });

  async function enviarMensagem() {
    if (isSending || !current) return;

    const texto = chatInput.value.trim();
    if (!texto) return;

    isSending = true;

    try {
      if (current.type === "mural") {
        await apiPostJson("/api/mensagens", {
          tipo: "mural",
          year: current.year,
          texto,
          fromUser: usuarioAluno.id,
          fromType: "aluno",
          fromModel: "Aluno"
        });
      } else {
        await apiPostJson("/api/mensagens", {
          tipo: "aluno",
          toUser: current.id,
          texto,
          fromUser: usuarioAluno.id,
          fromType: "aluno",
          fromModel: "Aluno"
        });
      }

      chatInput.value = "";
      await carregarMensagens();

    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }

    isSending = false;
  }

  // ---------------------------------------
  // MOBILE GAVETA
  // ---------------------------------------
  function setupMobileDrawerToggle() {
    if (!chatMenuToggle) return;

    chatMenuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) sidebar.classList.remove("open");
    });
  }


  function scrollBottom() {
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
  }

  function ajustePaddingChat() {
    const footer = document.querySelector(".chat-footer");
    if (!footer) return;
    chatMensagens.style.paddingBottom = footer.offsetHeight + 20 + "px";
  }

});
