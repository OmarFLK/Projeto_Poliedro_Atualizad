const professores = document.querySelectorAll('.professor-item');
const chatHeader = document.querySelector('.chat-header');
const chatMensagens = document.getElementById('chatMensagens');
const input = document.getElementById('mensagemInput');
const botao = document.getElementById('enviarMensagem');

professores.forEach((p) => {
  p.addEventListener('click', () => {
    document.querySelector('.professor-item.active')?.classList.remove('active');
    p.classList.add('active');
    chatHeader.textContent = p.querySelector('span').textContent;
    chatMensagens.innerHTML = `<div class="mensagem professor">Conversa iniciada com ${p.querySelector('span').textContent}.</div>`;
  });
});

botao.addEventListener('click', () => {
  const texto = input.value.trim();
  if (!texto) return;
  const msg = document.createElement('div');
  msg.classList.add('mensagem', 'aluno');
  msg.textContent = texto;
  chatMensagens.appendChild(msg);
  input.value = '';
  chatMensagens.scrollTop = chatMensagens.scrollHeight;
});

// Filtro de daltonismo
const daltonismoSelect = document.getElementById('daltonismo-select');
daltonismoSelect.addEventListener('change', () => {
  document.body.classList.remove('protanopia','deuteranopia','tritanopia');
  const val = daltonismoSelect.value;
  if (val) document.body.classList.add(val);
});
