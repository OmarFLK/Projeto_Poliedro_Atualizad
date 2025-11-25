const API = "http://localhost:3000";

/* CARREGAR PROFESSOR LOGADO */
let user = null;

try {
  user = JSON.parse(localStorage.getItem("usuarioProfessor") || "null");
} catch {
  user = null;
}

if (!user) {
  alert("Erro: faça login novamente.");
}

/* preencher perfil */
document.getElementById("campoNome").textContent = user.nome || "—";
document.getElementById("campoEmail").textContent = user.email || "—";
document.getElementById("campoMateria").textContent = user.materia || "—";

if (user.avatar) {
  document.getElementById("avatar-preview").src = user.avatar;
}

let avatarFile = null;

/* upload avatar */
document.getElementById("avatar-upload").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  avatarFile = file;

  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById("avatar-preview").src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

/* cancelar perfil */
document.getElementById("btnCancelarPerfil").addEventListener("click", () => {
  document.getElementById("novaSenha").value = "";
  document.getElementById("confirmarSenha").value = "";
  document.getElementById("avatar-preview").src = user.avatar || "Assets/LogoUsuario.png";
});

/* SALVAR ALTERAÇÕES DO PERFIL */
document.getElementById("btnSalvarPerfil").addEventListener("click", async () => {
  if (!user.id) return alert("Erro: refaça o login.");

  const novaSenha = document.getElementById("novaSenha").value.trim();
  const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

  if (novaSenha || confirmarSenha) {
    if (novaSenha !== confirmarSenha) return alert("As senhas não coincidem.");
    if (novaSenha.length < 6) return alert("A senha precisa ter no mínimo 6 caracteres.");
  }

  const fd = new FormData();
  if (avatarFile) fd.append("avatar", avatarFile);
  if (novaSenha) fd.append("senha", novaSenha);

  try {
    const req = await fetch(`${API}/api/professores/${user.id}`, {
      method: "PUT",
      credentials: "include",
      body: fd
    });

    const res = await req.json();

    if (!req.ok) return alert(res.error || "Erro ao salvar.");

    localStorage.setItem("usuarioProfessor", JSON.stringify(res.usuario));
    alert("Perfil atualizado!");

  } catch (err) {
    console.error(err);
    alert("Erro de conexão.");
  }
});

/*CRIAR NOVO ALUNO*/
document.getElementById("formAluno").addEventListener("submit", async e => {
  e.preventDefault();

  const nome = document.getElementById("alunoNome").value.trim();
  const sobrenome = document.getElementById("alunoSobrenome").value.trim();
  const email = document.getElementById("alunoEmail").value.trim();
  const senha = document.getElementById("alunoSenha").value.trim();
  const senha2 = document.getElementById("alunoSenhaConfirm").value.trim();
  const turma = document.getElementById("alunoAno").value;
  const subSala = document.getElementById("alunoSubSala").value;

  if (!nome || !sobrenome) return alert("Digite nome e sobrenome.");
  if (senha.length < 6) return alert("A senha deve ter ao menos 6 caracteres.");
  if (senha !== senha2) return alert("As senhas não coincidem.");
  if (turma.includes("Selecione")) return alert("Selecione o ano.");
  if (subSala.includes("Selecione")) return alert("Selecione a sub-sala.");

  const body = {
    nome: nome + " " + sobrenome,
    email,
    senha,
    turma,
    subSala
  };

  try {
    const req = await fetch(`${API}/api/alunos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    const res = await req.json();

    if (!req.ok) return alert(res.error || "Erro ao criar aluno");

    alert(`Aluno criado com sucesso! RA: ${res.ra}`);
    e.target.reset();
    carregarAlunos();

  } catch (err) {
    console.error(err);
    alert("Erro ao conectar ao servidor.");
  }
});

/* CRIAR NOVO PROFESSOR */
document.getElementById("formProfessor").addEventListener("submit", async e => {
  e.preventDefault();

  const nome = document.getElementById("profNome").value.trim();
  const email = document.getElementById("profEmail").value.trim();
  const senha = document.getElementById("profSenha").value.trim();
  const senha2 = document.getElementById("profSenhaConfirm").value.trim();
  const materia = document.getElementById("profMateria").value;

  if (!nome) return alert("Digite o nome completo.");
  if (!email) return alert("Digite o email.");
  if (senha.length < 6) return alert("A senha deve ter ao menos 6 caracteres.");
  if (senha !== senha2) return alert("As senhas não coincidem.");
  if (materia.includes("Selecione")) return alert("Selecione a matéria.");

  const body = { nome, email, senha, materia };

  try {
    const req = await fetch(`${API}/api/professores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    const res = await req.json();

    if (!req.ok) return alert(res.error || "Erro ao criar professor");

    alert("Professor criado com sucesso!");
    e.target.reset();
    carregarProfessores();

  } catch (err) {
    console.error(err);
    alert("Erro ao conectar ao servidor.");
  }
});

/*FILTROS — CORRIGIDOS*/

const filtroAno = document.getElementById("filtro-ano");
const filtroSub = document.getElementById("filtro-sub"); // ID CORRETO DO HTML

function aplicarFiltros(lista) {
  let filtrada = lista;

  if (filtroAno.value !== "todas") {
    filtrada = filtrada.filter(a =>
      String(a.turma).includes(filtroAno.value)
    );
  }

  if (filtroSub.value !== "todas") {
    filtrada = filtrada.filter(a =>
      String(a.subSala).toLowerCase() === filtroSub.value.toLowerCase()
    );
  }

  return filtrada;
}

if (filtroAno) filtroAno.onchange = carregarAlunos;
if (filtroSub) filtroSub.onchange = carregarAlunos;

/* LISTAGEM — ALUNOS */
async function carregarAlunos() {
  try {
    const req = await fetch(`${API}/api/alunos`, { credentials: "include" });
    let alunos = await req.json();

    alunos = aplicarFiltros(alunos);

    renderAlunos(alunos);

  } catch (err) {
    console.error(err);
  }
}

function renderAlunos(list) {
  const ul = document.getElementById("lista-alunos");
  ul.innerHTML = "";

  list.forEach(a => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-left">
        <img src="${a.avatar || 'Assets/LogoUsuario.png'}" class="item-avatar">
        <div class="item-main">
          <div class="item-name">${escapeHtml(a.nome)}</div>
          <div class="item-meta">RA: ${escapeHtml(a.ra)} • ${a.turma} / ${a.subSala}</div>
        </div>
      </div>

      <button class="btn-trash" data-type="aluno" data-id="${a._id}">
        <svg viewBox="0 0 24 24"><path d="M9 3v1H4v2h16V4h-5V3H9zm-1 6v9h2V9H8zm6 0v9h2V9h-2z"/></svg>
        Excluir
      </button>
    `;
    ul.appendChild(li);
  });

  attachDeleteHandlers();
}

/* LISTAGEM — PROFESSORES */
async function carregarProfessores() {
  try {
    const req = await fetch(`${API}/api/professores`, { credentials: "include" });
    const profs = await req.json();

    renderProfessores(profs);

  } catch (err) {
    console.error(err);
  }
}

function renderProfessores(list) {
  const ul = document.getElementById("lista-professores");
  ul.innerHTML = "";

  list.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-left">
        <img src="${p.avatar || 'Assets/LogoUsuario.png'}" class="item-avatar">
        <div class="item-main">
          <div class="item-name">${escapeHtml(p.nome)}</div>
          <div class="item-meta">${escapeHtml(p.email)} • ${escapeHtml(p.materia)}</div>
        </div>
      </div>

      <button class="btn-trash" data-type="professor" data-id="${p._id}">
        <svg viewBox="0 0 24 24"><path d="M9 3v1H4v2h16V4h-5V3H9zm-1 6v9h2V9H8zm6 0v9h2V9h-2z"/></svg>
        Excluir
      </button>
    `;
    ul.appendChild(li);
  });

  attachDeleteHandlers();
}

/* EXCLUSÃO */
function attachDeleteHandlers() {
  document.querySelectorAll(".btn-trash").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;

      if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

      excluirUsuario(type, id);
    };
  });
}

async function excluirUsuario(type, id) {
  const url = type === "aluno"
    ? `${API}/api/alunos/${id}`
    : `${API}/api/professores/${id}`;

  try {
    const req = await fetch(url, {
      method: "DELETE",
      credentials: "include"
    });

    if (!req.ok) {
      const res = await req.json();
      return alert(res.error || "Erro ao excluir.");
    }

    if (type === "aluno") carregarAlunos();
    else carregarProfessores();

  } catch (err) {
    console.error(err);
    alert("Erro ao excluir usuário.");
  }
}

/* HELPERS */
function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  }[c]));
}

/* INIT*/
document.addEventListener("DOMContentLoaded", () => {
  carregarAlunos();
  carregarProfessores();
});
