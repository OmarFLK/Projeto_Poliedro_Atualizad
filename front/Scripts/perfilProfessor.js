const API = "http://localhost:3000";

let user = null;

try {
  user = JSON.parse(localStorage.getItem("usuarioProfessor") || "null");
} catch {
  user = null;
}

if (!user) {
  alert("Erro: faça login novamente.");
}

let avatarFile = null;

document.getElementById("campoNome").textContent = user.nome || "—";
document.getElementById("campoEmail").textContent = user.email || "—";
document.getElementById("campoMateria").textContent = user.materia || "—";

if (user.avatar) {
  document.getElementById("avatar-preview").src = user.avatar;
}

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

document.getElementById("btnCancelarPerfil").addEventListener("click", () => {
  document.getElementById("novaSenha").value = "";
  document.getElementById("confirmarSenha").value = "";
  document.getElementById("avatar-preview").src = user.avatar || "Assets/LogoUsuario.png";
});

document.getElementById("btnSalvarPerfil").addEventListener("click", async () => {
  if (!user.id) {
    alert("Erro: refaça o login.");
    return;
  }

  const novaSenha = document.getElementById("novaSenha").value.trim();
  const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

  if (novaSenha || confirmarSenha) {
    if (novaSenha !== confirmarSenha) return alert("As senhas não coincidem.");
    if (novaSenha.length < 6) return alert("A senha precisa ter no mínimo 6 caracteres.");
  }

  const formData = new FormData();
  if (avatarFile) formData.append("avatar", avatarFile);
  if (novaSenha) formData.append("senha", novaSenha);

  try {
    const req = await fetch(`${API}/api/professores/${user.id}`, {
      method: "PUT",
      body: formData,
      credentials: "include"
    });

    const res = await req.json();

    if (!req.ok) {
      alert(res.error || "Erro ao salvar alterações.");
      return;
    }

    localStorage.setItem("usuarioProfessor", JSON.stringify(res.usuario));

    alert("Alterações salvas!");

  } catch (err) {
    console.error(err);
    alert("Erro de conexão com o servidor.");
  }
});
