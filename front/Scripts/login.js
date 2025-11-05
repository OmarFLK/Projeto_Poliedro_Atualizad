
document.addEventListener('DOMContentLoaded', () => {
  const btnAluno = document.getElementById('btnAluno');
  const btnProfessor = document.getElementById('btnProfessor');
  const form = document.getElementById('loginForm');
  const loginBtn = document.getElementById('btnLogin');
  const chkAccept = document.getElementById('aceitarTermos');

  function tipoLogin() {
    return btnProfessor.classList.contains('active') ? 'professor' : 'aluno';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!chkAccept.checked) {
      document.getElementById('openTermsLink').click();
      return;
    }

    const emailOrRa = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const tipo = tipoLogin();

    const payload = tipo === 'aluno'
      ? { ra: emailOrRa, senha }      // aluno usa RA
      : { email: emailOrRa, senha }; // professor usa email

    const url = `${window.location.origin.replace(/:\d+$/, ':3000')}/auth/${tipo}/login`;
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erro ao autenticar');
        return;
      }

      // salva token e usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      // redireciona
      if (tipo === 'aluno') window.location.href = 'HomeAluno.html';
      else window.location.href = 'HomeProfessor.html';
    } catch (err) {
      console.error(err);
      alert('Erro de conexão com o servidor.');
    }
  });

  
  btnAluno.addEventListener('click', () => {
    btnAluno.classList.add('active');
    btnProfessor.classList.remove('active');
  });
  btnProfessor.addEventListener('click', () => {
    btnProfessor.classList.add('active');
    btnAluno.classList.remove('active');
  });

  // habilitar/desabilitar botão acessar conforme checkbox
  chkAccept.addEventListener('change', () => {
    loginBtn.disabled = !chkAccept.checked;
  });
});
