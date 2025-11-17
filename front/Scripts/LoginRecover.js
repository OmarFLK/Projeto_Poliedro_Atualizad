const API = "http://localhost:3000/auth/recover";

// telas
const etapaEmail = document.getElementById("etapaEmail");
const etapaCodigo = document.getElementById("etapaCodigo");
const etapaSenha = document.getElementById("etapaSenha");

// mensagens
const msgEmail = document.getElementById("msgEmail");
const msgCodigo = document.getElementById("msgCodigo");
const msgSenha = document.getElementById("msgSenha");

// forms
const formEmail = document.getElementById("formEmail");
const formCodigo = document.getElementById("formCodigo");
const formSenha = document.getElementById("formSenha");

// área do código visual
const blocoCodigo = document.getElementById("blocoCodigo");
const textoCodigo = document.getElementById("textoCodigo");
const btnCopiar = document.getElementById("btnCopiarCodigo");

let emailGuardado = null;

// -------- ETAPA 1 --------
formEmail.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("emailRec").value.trim();
  emailGuardado = email;

  msgEmail.style.color = "#333";
  msgEmail.textContent = "Processando...";

  const res = await fetch(`${API}/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();

  if (!res.ok) {
    msgEmail.style.color = "red";
    msgEmail.textContent = data.error || "Erro ao enviar código.";
    return;
  }

  msgEmail.textContent = "";
  
  // exibe o cartão com o código
  textoCodigo.textContent = data.codigo;
  blocoCodigo.classList.remove("hidden");

  etapaEmail.classList.add("hidden");
  etapaCodigo.classList.remove("hidden");
});

// botão copiar código
btnCopiar.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(textoCodigo.textContent);
    btnCopiar.textContent = "Copiado!";
    setTimeout(() => (btnCopiar.textContent = "Copiar código"), 1200);
  } catch (err) {
    alert("Não foi possível copiar.");
  }
});

// ------ Reenviar código ------
document.getElementById("btnReenviar").onclick = async () => {
  msgCodigo.textContent = "Reenviando...";

  const res = await fetch(`${API}/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailGuardado })
  });

  const data = await res.json();

  textoCodigo.textContent = data.codigo; // atualiza novo código
  
  msgCodigo.style.color = "green";
  msgCodigo.textContent = "Código reenviado!";
};

// -------- ETAPA 2 --------
formCodigo.addEventListener("submit", async (e) => {
  e.preventDefault();

  const codigo = document.getElementById("codigoRec").value.trim();

  const res = await fetch(`${API}/validate-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailGuardado, codigo })
  });

  const data = await res.json();

  if (!res.ok) {
    msgCodigo.style.color = "red";
    msgCodigo.textContent = data.error;
    return;
  }

  msgCodigo.textContent = "";
  etapaCodigo.classList.add("hidden");
  etapaSenha.classList.remove("hidden");
});

// -------- ETAPA 3 --------
formSenha.addEventListener("submit", async (e) => {
  e.preventDefault();

  const s1 = document.getElementById("senha1").value;
  const s2 = document.getElementById("senha2").value;

  if (s1 !== s2) {
    msgSenha.style.color = "red";
    msgSenha.textContent = "As senhas não coincidem.";
    return;
  }

  const res = await fetch(`${API}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailGuardado, novaSenha: s1 })
  });

  const data = await res.json();

  if (!res.ok) {
    msgSenha.style.color = "red";
    msgSenha.textContent = data.error;
    return;
  }

  msgSenha.style.color = "green";
  msgSenha.textContent = "Senha redefinida com sucesso!";

  setTimeout(() => {
    window.location.href = "Login.html";
  }, 1500);
});
