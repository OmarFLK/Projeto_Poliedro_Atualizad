const API_BASE = "http://localhost:3000";

const savedToken = localStorage.getItem("token") || null;

function apiGet(url) {
  return fetch(API_BASE + url, { credentials: "include", headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : {} })
    .then(async res => {
      const text = await res.text();
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch(e){ body = text; }
      if (!res.ok) {
        const message = body && body.message ? body.message : `${res.status} ${res.statusText}`;
        throw new Error(`${message} - GET ${url}`);
      }
      return body;
    });
}

function apiPostJson(url, data) {
  const headers = { "Content-Type": "application/json" };
  if (savedToken) headers.Authorization = `Bearer ${savedToken}`;

  return fetch(API_BASE + url, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(data)
  }).then(async res => {
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch(e){ body = text; }
    if (!res.ok) {
      const message = (body && (body.message || body.error)) ? (body.message || body.error) : `${res.status} ${res.statusText}`;
      const err = new Error(`${message} - POST ${url}`);
      err.responseBody = body;
      throw err;
    }
    return body;
  });
}

document.addEventListener("DOMContentLoaded", () => {


  const sidebar = document.getElementById("sidebar");
  const chatMensagens = document.getElementById("chat-mensagens");
  const placeholder = document.getElementById("placeholder");
  const chatTitle = document.getElementById("chat-title");
  const chatSubtitle = document.getElementById("chat-subtitle");

  const alunosList = document.getElementById("alunos-list");
  const muralList = document.getElementById("mural-list");

  const chatInput = document.getElementById("chatInput");
  const btnSend = document.getElementById("btnSend");
  const btnRefresh = document.getElementById("btnRefresh");
  const sendForm = document.getElementById("sendForm");

  const searchInput = document.getElementById("search-input");
  const filterYear = document.getElementById("filter-year");
  const filterSub = document.getElementById("filter-sub");

  let chatMenuToggle = document.getElementById("chat-menu-toggle")
    || document.getElementById("menu-chat-toggle")
    || document.querySelector(".btn-menu");

 
  let alunosCache = [];
  let current = null;
  let isSending = false;

  // carrega professor do localStorage (fallback id ou _id)
  let usuarioProfessor = null;
  try { usuarioProfessor = JSON.parse(localStorage.getItem("usuarioProfessor") || "null"); } catch (e) { usuarioProfessor = null; }

  // ---------------- INIT ----------------
  init();
  async function init() {
    await loadAlunos();
    renderMural();
    renderAlunos(alunosCache);
    showPlaceholder();
    adjustChatPadding();

    window.addEventListener("resize", adjustChatPadding);

    setupChatSidebarMobileToggle();
  }

  async function loadAlunos() {
    try {
      const data = await apiGet("/api/alunos");
      alunosCache = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Erro ao carregar alunos:", err);
      alunosCache = [];
    }
  }

  function renderMural() {
    muralList.innerHTML = "";

    const items = [
      { year: 1, title: "1º Ano" },
      { year: 2, title: "2º Ano" },
      { year: 3, title: "3º Ano" }
    ];

    items.forEach(m => {
      const li = document.createElement("li");
      li.className = "mural-item";
      li.dataset.year = m.year;
      li.innerHTML = `<div class="mural-title">${m.title}</div><div style="opacity:.6">▸</div>`;

      li.addEventListener("click", () => {
        clearSelections();
        li.classList.add("selected");
        selectMural(m.year);

        if (window.innerWidth <= 900 && sidebar) sidebar.classList.remove("open");
      });

      muralList.appendChild(li);
    });
  }

  function renderAlunos(list) {
    alunosList.innerHTML = "";

    (list || []).forEach(a => {
      const avatar = a.avatar?.trim() ? a.avatar : "/Assets/LogoUsuario.png";

      const li = document.createElement("li");
      li.className = "aluno-item";
      li.dataset.id = a._id;

      li.innerHTML = `
        <img src="${avatar}" class="aluno-avatar" />
        <div class="aluno-info">
          <div class="nome">${a.nome}</div>
          <div class="meta">${a.turma} — ${a.subSala}</div>
        </div>
      `;

      li.addEventListener("click", () => {
        clearSelections();
        li.classList.add("selected");
        selectAluno(a);

        if (window.innerWidth <= 900 && sidebar) sidebar.classList.remove("open");
      });

      alunosList.appendChild(li);
    });

    if (!list || list.length === 0) {
      const none = document.createElement("div");
      none.style.color = "#6b7894";
      none.style.padding = "12px";
      none.textContent = "Nenhum aluno encontrado";
      alunosList.appendChild(none);
    }
  }

  function clearSelections() {
    document.querySelectorAll(".mural-item").forEach(x => x.classList.remove("selected"));
    document.querySelectorAll(".aluno-item").forEach(x => x.classList.remove("selected"));
  }

  function selectMural(year) {
    current = { type: "mural", year };
    chatTitle.textContent = `${year}º Ano`;
    chatSubtitle.textContent = "Mural da turma";
    loadCurrentMessages();
  }

  function selectAluno(aluno) {
    current = {
      type: "aluno",
      id: aluno._id,
      nome: aluno.nome,
      turma: aluno.turma,
      subSala: aluno.subSala
    };

    chatTitle.textContent = aluno.nome;
    chatSubtitle.textContent = `${aluno.turma} • ${aluno.subSala}`;
    loadCurrentMessages();
  }

  async function loadCurrentMessages() {
    try {
      chatMensagens.innerHTML = "";
      placeholder.style.display = "none";

      if (!current) return showPlaceholder();

      let msgs = [];

      if (current.type === "mural") {
        msgs = await apiGet(`/api/mensagens?tipo=mural&year=${current.year}`);
      } else {
        const idProf = usuarioProfessor?.id || usuarioProfessor?._id || "";
        msgs = await apiGet(`/api/mensagens?tipo=aluno&toUser=${current.id}&userId=${idProf}`);
      }

      renderMessages(msgs || []);
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);

      const div = document.createElement("div");
      div.className = "chat-placeholder";
      div.textContent = "Erro ao carregar mensagens.";
      chatMensagens.appendChild(div);

      scrollToBottom();
    }
  }

  function renderMessages(msgs) {
    chatMensagens.innerHTML = "";

    if (!msgs || msgs.length === 0) {
      const empty = document.createElement("div");
      empty.className = "chat-placeholder";
      empty.textContent = "Nenhuma mensagem ainda.";
      chatMensagens.appendChild(empty);
      scrollToBottom();
      return;
    }

    msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    msgs.forEach(m => {
      const isAluno = m.fromType === "aluno";
      const row = document.createElement("div");
      row.className = "msg-row " + (isAluno ? "msg-left" : "msg-right");

      const bubble = document.createElement("div");
      bubble.className = "msg-bubble";
      if (!isAluno) bubble.classList.add("right");

    
      bubble.textContent = m.texto || m.text || "";

      const ts = document.createElement("div");
      ts.className = "msg-ts";
      ts.textContent = new Date(m.createdAt)
        .toLocaleString([], { hour: "2-digit", minute: "2-digit" });

      row.appendChild(bubble);
      row.appendChild(ts);
      chatMensagens.appendChild(row);
    });

    setTimeout(scrollToBottom, 30);
  }

  function showPlaceholder() {
    chatMensagens.innerHTML = "";
    placeholder.style.display = "flex";
    chatTitle.textContent = "Selecione uma conversa";
    chatSubtitle.textContent = "";
    adjustChatPadding();
  }

  // envio via botão
  if (btnSend) btnSend.addEventListener("click", sendMessage);

  // envio via Enter (teclado) — previne double send
  if (chatInput) {
    chatInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!isSending) sendMessage();
      }
    });
  }

  // previne submit default do form (se houver)
  if (sendForm) {
    sendForm.addEventListener("submit", e => {
      e.preventDefault();
      if (!isSending) sendMessage();
    });
  }

  async function sendMessage() {
    if (isSending || !current) return;

    const texto = (chatInput.value || "").trim();
    if (!texto) return;

    isSending = true;

    // Eu: preparo remetente (se houver)
    const fromUser = usuarioProfessor?.id || usuarioProfessor?._id || null;

    try {
      if (current.type === "mural") {
        const payload = {
          tipo: "mural",
          year: current.year,
          texto,
          fromType: "professor",
          fromModel: "Professor"
        };
        if (fromUser) payload.fromUser = fromUser;

        await apiPostJson("/api/mensagens", payload);
      } else {
        const payload = {
          tipo: "aluno",
          toUser: current.id,
          texto,
          fromType: "professor",
          fromModel: "Professor"
        };
        if (fromUser) payload.fromUser = fromUser;

        await apiPostJson("/api/mensagens", payload);
      }

      chatInput.value = "";
      await loadCurrentMessages();
    } catch (err) {
      
      console.error("Erro ao enviar mensagem:", err, err.responseBody || "");
      
    } finally {
      isSending = false;
    }
  }

  if (btnRefresh) btnRefresh.addEventListener("click", () => {
    if (current) loadCurrentMessages();
  });

  if (searchInput) searchInput.addEventListener("input", filterAll);
  if (filterYear) filterYear.addEventListener("change", filterAll);
  if (filterSub) filterSub.addEventListener("change", filterAll);

  function filterAll() {
    const q = (searchInput?.value || "").toLowerCase().trim();
    const y = (filterYear?.value || "").toString().trim();
    const s = (filterSub?.value || "").toLowerCase().trim();

    const filtrados = (alunosCache || []).filter(a => {
      if (y) {
        const match = String(a.turma || "").match(/\d+/);
        const anoAluno = match ? match[0] : "";
        if (anoAluno !== y) return false;
      }

      if (s) {
        const subRaw = String(a.subSala || "").toLowerCase().replace(/\s+/g, '');
        if (!subRaw.includes(s.replace(/\s+/g, ''))) return false;
      }

      if (q && !String(a.nome || '').toLowerCase().includes(q)) return false;
      return true;
    });

    renderAlunos(filtrados);
  }

  function setupChatSidebarMobileToggle() {
    if (!chatMenuToggle || !sidebar) return;

    chatMenuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) {
        sidebar.classList.remove("open");
      }
    });
  }

  function scrollToBottom() {
    try { chatMensagens.scrollTop = chatMensagens.scrollHeight; } catch (e) { /* silent */ }
  }

  function adjustChatPadding() {
    const footer = document.querySelector(".chat-footer");
    if (!footer) return;
    chatMensagens.style.paddingBottom = (footer.offsetHeight || 80) + 20 + "px";
  }

}); 
