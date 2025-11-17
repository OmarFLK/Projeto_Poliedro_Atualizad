document.addEventListener('DOMContentLoaded', () => {
  const btnAluno = document.getElementById('btnAluno');
  const btnProfessor = document.getElementById('btnProfessor');
  const form = document.getElementById('loginForm');
  const loginBtn = document.getElementById('btnLogin');
  const chkAccept = document.getElementById('aceitarTermos');

  function tipoLogin() {
    return btnProfessor.classList.contains('active') ? 'professor' : 'aluno';
  }

  if (chkAccept) {
    chkAccept.addEventListener('change', () => {
      loginBtn.disabled = !chkAccept.checked;
    });
  }

  btnAluno.addEventListener('click', () => {
    btnAluno.classList.add('active');
    btnProfessor.classList.remove('active');
  });

  btnProfessor.addEventListener('click', () => {
    btnProfessor.classList.add('active');
    btnAluno.classList.remove('active');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!chkAccept.checked) {
      alert('Você precisa aceitar os termos antes de entrar.');
      return;
    }

    const emailOrRa = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const tipo = tipoLogin();

    if (!emailOrRa || !senha) {
      alert('Preencha todos os campos.');
      return;
    }

    const payload = tipo === 'aluno'
      ? { ra: emailOrRa, senha }
      : { email: emailOrRa, senha };

    const url = `${window.location.origin.replace(/:\d+$/, ':3000')}/auth/${tipo}/login`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Erro ao autenticar');
        return;
      }


      // salva separado
      if (tipo === 'aluno') {
        localStorage.removeItem('usuarioProfessor');
        localStorage.setItem('usuarioAluno', JSON.stringify(data.usuario));
        window.location.href = 'HomeAluno.html';
      } else {
        localStorage.removeItem('usuarioAluno');
        localStorage.setItem('usuarioProfessor', JSON.stringify(data.usuario));
        window.location.href = 'HomeProfessor.html';
      }

    } catch (err) {
      console.error(err);
      alert('Erro de conexão com o servidor.');
    }
  });
});
