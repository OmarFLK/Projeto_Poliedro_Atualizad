/* ====== dados de exemplo (turmas e alunos) ====== */
const defaultRooms = [
  // 1º ano
  { id: "1-1", label: "1º Ano  - Subturma 1", type: "room" },
  { id: "1-2", label: "1º Ano  - Subturma 2", type: "room" },
  { id: "1-3", label: "1º Ano  - Subturma 3", type: "room" },
  // 2º ano
  { id: "2-1", label: "2º Ano  - Subturma 1", type: "room" },
  { id: "2-2", label: "2º Ano  - Subturma 2", type: "room" },
  { id: "2-3", label: "2º Ano  - Subturma 3", type: "room" },
  // 3º ano
  { id: "3-1", label: "3º Ano  - Subturma 1", type: "room" },
  { id: "3-2", label: "3º Ano  - Subturma 2", type: "room" },
  { id: "3-3", label: "3º Ano  - Subturma 3", type: "room" }
];

const defaultPeople = [
  { id: "Maria Oliveira", label: "Maria Oliveira", type: "person" },
  { id: "João Santos", label: "João Santos", type: "person" }
];

/* elementos DOM */
const roomsList = document.getElementById("roomsList");
const peopleList = document.getElementById("peopleList");
const chatMessages = document.getElementById("chatMessages");
const chatTitle = document.getElementById("chatTitle");
const activeBadge = document.getElementById("activeBadge");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");

let currentConversation = null;
let messages = JSON.parse(localStorage.getItem("messages_v2")) || {};

/* monta listas */
function buildLists() {
  roomsList.innerHTML = "";
  defaultRooms.forEach(r => {
    const div = document.createElement("div");
    div.className = "room-item";
    div.dataset.id = r.id;
    div.dataset.type = r.type;
    div.textContent = r.label;
    roomsList.appendChild(div);
  });

  peopleList.innerHTML = "";
  defaultPeople.forEach(p => {
    const div = document.createElement("div");
    div.className = "room-item";
    div.dataset.id = p.id;
    div.dataset.type = p.type;
    div.textContent = p.label;
    peopleList.appendChild(div);
  });
}

/* util: hora atual */
function timeNow() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* carregar mensagens */
function loadConversation(id) {
  chatMessages.innerHTML = "";
  const conv = messages[id] || [];
  conv.forEach(m => {
    const el = document.createElement("div");
    el.className = `msg ${m.sender === "professor" ? "prof" : "aluno"}`;
    el.innerHTML = `<div class="text">${escapeHtml(m.text)}</div><div class="time" aria-hidden="true">${m.time}</div>`;
    chatMessages.appendChild(el);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* selecionar conversa */
function selectConversation(id, label, type) {
  currentConversation = id;
  chatTitle.textContent = label;
  activeBadge.textContent = (type === "room") ? "Sala" : "Privado";
  document.querySelectorAll(".room-item").forEach(el =>
    el.classList.toggle("active", el.dataset.id === id)
  );
  loadConversation(id);
}

/* enviar mensagem */
function sendMessage(text) {
  if (!currentConversation) return;
  const msg = { sender: "professor", text: text, time: timeNow() };
  if (!messages[currentConversation]) messages[currentConversation] = [];
  messages[currentConversation].push(msg);
  localStorage.setItem("messages_v2", JSON.stringify(messages));
  loadConversation(currentConversation);
}

/* eventos */
roomsList.addEventListener("click", (ev) => {
  const node = ev.target.closest(".room-item");
  if (!node) return;
  selectConversation(node.dataset.id, node.textContent, node.dataset.type);
});

peopleList.addEventListener("click", (ev) => {
  const node = ev.target.closest(".room-item");
  if (!node) return;
  selectConversation(node.dataset.id, node.textContent, node.dataset.type);
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = chatInput.value.trim();
  if (!val || !currentConversation) return;
  sendMessage(val);
  chatInput.value = "";
  chatInput.focus();
});

searchInput.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll(".room-item").forEach(el => {
    const text = el.textContent.toLowerCase();
    el.style.display = text.includes(q) ? "" : "none";
  });
});

refreshBtn.addEventListener("click", () => {
  if (currentConversation) loadConversation(currentConversation);
});

/* escape HTML */
function escapeHtml(str){
  return str.replace(/[&<>"'`=\/]/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'
  })[s]);
}

/* inicialização */
(function init(){
  buildLists();
  const firstRoom = document.querySelector(".room-item");
  if (firstRoom) {
    selectConversation(firstRoom.dataset.id, firstRoom.textContent, firstRoom.dataset.type);
  }
})();
