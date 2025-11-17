const API = "http://localhost:3000";

let user = null;

try {
  user = JSON.parse(localStorage.getItem("usuarioAluno") || "null");
} catch {
  user = null;
}

if (!user) {
  alert("Erro: faça login novamente.");
}

document.getElementById("campoNome").textContent = (user.nome || "—").split(" ")[0];
document.getElementById("campoSobrenome").textContent = (user.nome || "").split(" ").slice(1).join(" ");
document.getElementById("campoEmail").textContent = user.email || "—";
document.getElementById("campoRA").textContent = user.ra || "—";
document.getElementById("campoAno").textContent = user.turma || "—";
document.getElementById("campoSubSala").textContent = user.subSala || "—";

if (user.avatar) {
  document.getElementById("avatar-preview").src = user.avatar;
}

document.getElementById("avatar-upload").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById("avatar-preview").src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById("btnCancelar").addEventListener("click", () => {
  document.getElementById("avatar-preview").src = user.avatar || "Assets/LogoUsuario.png";
  document.getElementById("novaSenha").value = "";
  document.getElementById("confirmarSenha").value = "";
});

document.getElementById("btnSalvar").addEventListener("click", async () => {
  const novaSenha = document.getElementById("novaSenha").value.trim();
  const confirmarSenha = document.getElementById("confirmarSenha").value.trim();
  const avatarFile = document.getElementById("avatar-upload").files[0];

  if (!novaSenha && !avatarFile) {
    alert("Nada para salvar.");
    return;
  }

  if (novaSenha && novaSenha !== confirmarSenha) {
    alert("As senhas não coincidem.");
    return;
  }

  const formData = new FormData();
  if (avatarFile) formData.append("avatar", avatarFile);
  if (novaSenha) formData.append("senha", novaSenha);

  try {
    const res = await fetch(`${API}/api/alunos/${user.id}`, {
      method: "PUT",
      body: formData,
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao atualizar.");
      return;
    }

    localStorage.setItem("usuarioAluno", JSON.stringify(data.usuario));

    alert("Alterações salvas!");
    location.reload();

  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com o servidor.");
  }
});
