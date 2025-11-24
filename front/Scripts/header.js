document.addEventListener("DOMContentLoaded", () => {
  let aluno = null;
  let prof = null;

  try { aluno = JSON.parse(localStorage.getItem("usuarioAluno") || "null"); } catch {}
  try { prof  = JSON.parse(localStorage.getItem("usuarioProfessor") || "null"); } catch {}

  const path = window.location.pathname.toLowerCase();

  let usuario = null;

  // prioridade
  if (path.includes("professor")) {
    usuario = prof || aluno;
  } else if (path.includes("aluno")) {
    usuario = aluno || prof;
  } else {
    usuario = prof || aluno;
  }

  const img = document.querySelector(".header-profile-img");
  if (!img) return;

  if (usuario && usuario.avatar) {

    // ajuste automático do caminho da foto
    let avatarPath = usuario.avatar;
    if (!avatarPath.startsWith("/uploads/")) {
      avatarPath = "/uploads/" + avatarPath;
    }

    img.style.transition = "opacity 150ms ease";
    img.style.opacity = 0;

    setTimeout(() => {
      img.src = avatarPath;
      img.style.opacity = 1;
    }, 120);

  } else {
    img.src = "Assets/LogoUsuario.png";
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const logout = document.getElementById("btnLogout");
  if (!logout) return;

  logout.addEventListener("click", () => {

    localStorage.removeItem("usuarioAluno");
    localStorage.removeItem("usuarioProfessor");

    document.cookie = "token=; Max-Age=0; path=/";

    window.location.href = "Login.html";
  });
});
function executarLogout() {
  localStorage.removeItem("usuarioProfessor");
  localStorage.removeItem("usuarioAluno");
  window.location.href = "Login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const btn1 = document.getElementById("btnLogout");
  const btn2 = document.getElementById("btnLogoutMobile");

  if (btn1) btn1.onclick = executarLogout;
  if (btn2) btn2.onclick = executarLogout;
});
