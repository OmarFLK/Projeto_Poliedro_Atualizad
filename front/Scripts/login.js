document.addEventListener("DOMContentLoaded", () => {
  /* ELEMENTOS */
  const btnAluno = document.getElementById("btnAluno");
  const btnProfessor = document.getElementById("btnProfessor");
  const form = document.getElementById("loginForm");
  const loginBtn = document.getElementById("btnLogin");
  const chkAccept = document.getElementById("aceitarTermos");
  const openBtn = document.getElementById("openTermsLink");
  const overlay = document.getElementById("termsOverlay");
  const modal = overlay ? overlay.querySelector(".terms-modal") : null;
  const closeBtns = overlay ? overlay.querySelectorAll(".terms-close") : [];
  const acceptBtn = document.getElementById("termsBtnAccept");
  const termsContent = document.getElementById("termsContent");

  let lastFocus = null;

  /* ANIMAÇÃO DO LOGIN */
  const box = document.querySelector(".login-box");
  requestAnimationFrame(() => box.classList.add("enter"));

  /* FUNÇÃO — IDENTIFICAR TIPO DE LOGIN */
  function tipoLogin() {
    return btnProfessor.classList.contains("active") ? "professor" : "aluno";
  }

  /*BOTÕES DE ALUNO / PROFESSOR */
  btnAluno.addEventListener("click", () => {
    btnAluno.classList.add("active");
    btnProfessor.classList.remove("active");
    btnAluno.setAttribute("aria-pressed", "true");
    btnProfessor.setAttribute("aria-pressed", "false");
  });

  btnProfessor.addEventListener("click", () => {
    btnProfessor.classList.add("active");
    btnAluno.classList.remove("active");
    btnProfessor.setAttribute("aria-pressed", "true");
    btnAluno.setAttribute("aria-pressed", "false");
  });

  /* ACEITAR TERMOS → HABILITA BOTÃO "ACESSAR"*/
  if (chkAccept) {
    chkAccept.addEventListener("change", () => {
      loginBtn.disabled = !chkAccept.checked;
      loginBtn.setAttribute("aria-disabled", String(!chkAccept.checked));
    });
  }

  /*MODAL — ABRIR */
  function openModal(ev) {
    if (ev) ev.preventDefault();
    if (!overlay || !modal) return;

    lastFocus = document.activeElement;

    overlay.style.display = "flex";
    overlay.setAttribute("aria-hidden", "false");
    modal.classList.add("show");

    document.documentElement.style.overflow = "hidden";

    if (termsContent) termsContent.scrollTop = 0;
    if (acceptBtn) acceptBtn.disabled = true;

    setTimeout(() => modal.focus(), 40);
    setTimeout(() => checkTermsScroll(), 80);
  }

  /*MODAL — FECHAR*/
  function closeModal() {
    if (!overlay || !modal) return;

    modal.classList.remove("show");
    overlay.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");

    document.documentElement.style.overflow = "";

    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  /* MODAL — HABILITAR BOTÃO AO CHEGAR NO FINAL DO TEXTO */
  function checkTermsScroll() {
    if (!termsContent || !acceptBtn) return;

    const atBottom =
      Math.ceil(termsContent.scrollTop + termsContent.clientHeight) >=
      Math.floor(termsContent.scrollHeight - 6);

    const fits = termsContent.scrollHeight <= termsContent.clientHeight + 2;

    acceptBtn.disabled = !(atBottom || fits);
  }

  /*MODAL — EVENTOS */
  if (openBtn) openBtn.addEventListener("click", openModal);

  closeBtns.forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal();
    })
  );

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.getAttribute("aria-hidden") === "false") {
      closeModal();
    }
  });

  if (termsContent) {
    termsContent.addEventListener("scroll", checkTermsScroll, {
      passive: true,
    });
  }

  /*MODAL — ACEITAR */
  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
      if (acceptBtn.disabled) return;
      chkAccept.checked = true;
      chkAccept.dispatchEvent(new Event("change", { bubbles: true }));
      closeModal();
    });
  }

  /* FORM LOGIN (BACKEND)*/
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!chkAccept.checked) {
      alert("Você precisa aceitar os termos antes de entrar.");
      return;
    }

    const emailOrRa = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const tipo = tipoLogin();

    if (!emailOrRa || !senha) {
      alert("Preencha todos os campos.");
      return;
    }

    const payload =
      tipo === "aluno" ? { ra: emailOrRa, senha } : { email: emailOrRa, senha };

    const url = `${window.location.origin.replace(
      /:\d+$/,
      ":3000"
    )}/auth/${tipo}/login`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao autenticar");
        return;
      }

      // salva separado
      if (tipo === "aluno") {
        localStorage.removeItem("usuarioProfessor");
        localStorage.setItem("usuarioAluno", JSON.stringify(data.usuario));
        window.location.href = "HomeAluno.html";
      } else {
        localStorage.removeItem("usuarioAluno");
        localStorage.setItem("usuarioProfessor", JSON.stringify(data.usuario));
        window.location.href = "HomeProfessor.html";
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão com o servidor.");
    }
  });

  /* FOCUS-TRAP (ACESSIBILIDADE DO MODAL) */
  if (overlay) {
    overlay.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;

      const focusable = Array.from(
        overlay.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ========== EU JURO QUE COMIGO ESTA FUNCIONANDO, QUALQUER COISA É SÓ APAGAR ESSA MERDA AQUI, MAS TA TUDO FUNCIONANDO, NAO MEXE KKKKKKKKKKKKKKKKKKKKKK) ========== */

  const btnCancel = document.getElementById("termsBtnCancel");
  const btnOk = document.getElementById("termsBtnOk");

  // CANCELAR → apenas fecha o modal
  if (btnCancel) {
    btnCancel.addEventListener("click", (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  // Botao do OK, o checkbos, habilitar login pos OK e fechar o modal
  if (btnOk) {
    btnOk.addEventListener("click", (e) => {
      e.preventDefault();

      if (chkAccept) {
        chkAccept.checked = true;
        chkAccept.dispatchEvent(new Event("change", { bubbles: true }));
      }

      closeModal();
    });
  }
});
