document.addEventListener('DOMContentLoaded', initAtividadesAluno);

async function initAtividadesAluno() {
  const lista = document.getElementById('lista-tarefas-aluno');
  if (!lista) return;

  const aluno = safeParse(localStorage.getItem('usuario')) || {};
  const token = localStorage.getItem('token') || '';

  if (!aluno || !aluno.ra) {
    lista.textContent = 'Erro: aluno não autenticado.';
    return;
  }
  if (!aluno.turma || !aluno.subSala) {
    renderAvisoPerfilIncompleto(lista);
    console.warn('Perfil incompleto:', aluno);
    return;
  }

  // Base da API
  const baseUrl = window.location.origin.replace(/:\d+$/, ':3000');
  const url = `${baseUrl}/api/atividades?turma=${encodeURIComponent(aluno.turma)}&subSala=${encodeURIComponent(aluno.subSala)}`;
  
  console.log('Buscando atividades em:', url);

  try {
    // FETCH DIRETO
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const atividades = await res.json();

    if (!res.ok || !Array.isArray(atividades) || atividades.length === 0) {
      lista.innerHTML = '<p style="text-align:center;color:#888;">Nenhuma atividade disponível para sua turma.</p>';
      console.warn('Nenhuma atividade encontrada ou erro na resposta:', atividades);
      return;
    }

    //Renderiza lista normalmente
    lista.innerHTML = '';
    renderLista(lista, atividades, aluno, baseUrl);
  } catch (err) {
    console.error('Erro ao carregar atividades:', err);
    lista.textContent = 'Erro ao carregar atividades.';
  }
}

/* helpers */
function safeParse(str) { try { return JSON.parse(str); } catch { return null; } }

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

function makeP(text, color, align) {
  const p = document.createElement('p');
  p.textContent = text;
  if (color) p.style.color = color;
  if (align) p.style.textAlign = align;
  return p;
}

function renderAvisoPerfilIncompleto(container) {
  container.innerHTML = `
    <div style="
      background:#fff7da; border:1px solid #ffe08a; color:#6b5800;
      padding:16px; border-radius:10px; text-align:center; max-width:700px; margin:20px auto;">
      Seu perfil ainda não contém <b>turma</b> ou <b>sub-sala</b>.<br/>
      Peça para o administrador atualizar seus dados antes de acessar as atividades.
    </div>
  `;
}

function renderLista(container, atividades, aluno, baseUrl) {
  atividades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  atividades.forEach(a => {
    const card = renderTarefa(a, aluno, baseUrl);
    container.appendChild(card);
  });
}

function renderTarefa(a, aluno, baseUrl) {
  const card = makeEl('div', 'tarefa');
  const info = makeEl('div', 'tarefa-info');
  info.innerHTML = `<b>Turma:</b> ${a.turma} &nbsp; <b>Sub-sala:</b> ${a.subSala} &nbsp; <b>Matéria:</b> ${a.materia}`;
  card.appendChild(info);

  card.appendChild(makeEl('div', 'tarefa-titulo', a.titulo || ''));
  if (a.descricao) card.appendChild(makeEl('div', 'tarefa-desc', a.descricao));

  if (a.arquivoPath) {
    const link = document.createElement('a');
    link.className = 'tarefa-arquivo';
    link.href = a.arquivoPath;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = `📎 ${a.arquivoNome || 'Arquivo'}`;
    card.appendChild(link);
  }

  const area = makeEl('div', 'resolucao-area');
  area.appendChild(makeEl('h4', null, 'Enviar resolução'));

  const form = makeEl('form', 'form-resolucao');
  form.dataset.atividadeId = a._id;

  const obs = document.createElement('textarea');
  obs.name = 'observacao';
  obs.placeholder = 'Adicione observações ou um link (opcional)';
  form.appendChild(obs);

  const file = document.createElement('input');
  file.type = 'file';
  file.name = 'arquivo';
  form.appendChild(file);

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Enviar';
  form.appendChild(btn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await enviarResolucao({
      baseUrl,
      atividadeId: form.dataset.atividadeId,
      aluno,
      observacao: obs.value.trim(),
      arquivo: file.files[0] || null,
      onOk: () => { alert('Resolução enviada com sucesso!'); form.reset(); },
      onFail: (msg) => alert(msg || 'Erro ao enviar resolução.')
    });
  });

  area.appendChild(form);
  card.appendChild(area);

  return card;
}

async function enviarResolucao({ baseUrl, atividadeId, aluno, observacao, arquivo, onOk, onFail }) {
  const fd = new FormData();
  fd.append('atividadeId', atividadeId);
  fd.append('alunoId', aluno._id || aluno.id || '');
  fd.append('nomeAluno', aluno.nome || '');
  fd.append('raAluno', aluno.ra || '');
  fd.append('observacao', observacao || '');
  if (arquivo) fd.append('arquivo', arquivo);

  try {
    const res = await fetch(`${baseUrl}/api/resolucoes`, { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok) onOk && onOk(data);
    else onFail && onFail(data.error);
  } catch (e) {
    console.error(e);
    onFail && onFail('Erro de conexão.');
  }
}
