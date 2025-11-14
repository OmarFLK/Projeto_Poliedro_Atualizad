// front/Scripts/notas.professor.js
document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin.replace(/:\d+$/, ':3000');

  const anoSelect = document.getElementById('anoSelect');
  const subSelect = document.getElementById('subSelect');
  const materiaSelect = document.getElementById('materiaSelect');
  const semestreSelect = document.getElementById('semestreSelect');
  const btnBuscarSala = document.getElementById('btnBuscarSala');
  const btnSalvarLote = document.getElementById('btnSalvarLote');
  const tabelaSala = document.getElementById('tabelaSala');

  let alunos = [];
  let profMateria = '';

  // 1) tenta pegar matéria do localStorage
  function carregarMateria() {
    try {
      const u = JSON.parse(localStorage.getItem('usuario'));
      if (u?.materia) {
        profMateria = u.materia;
        return;
      }
    } catch (e) {}

    profMateria = '';
  }

  carregarMateria();

  // 2) trava o select com a matéria do professor
  function travarMateria() {
    if (profMateria) {
      materiaSelect.innerHTML = `<option value="${profMateria}">${profMateria}</option>`;
      materiaSelect.disabled = true;
    } else {
      materiaSelect.innerHTML = `<option value="">Erro: professor sem matéria</option>`;
      materiaSelect.disabled = true;
    }
  }

  travarMateria();

  // carrega alunos
  async function carregarAlunos() {
    try {
      const res = await fetch(`${baseUrl}/api/alunos`);
      alunos = await res.json();
      popularFiltros();
    } catch (err) {
      alunos = [];
      popularFiltros();
    }
  }

  function popularFiltros() {
    const anos = [...new Set(alunos.map(a => a.turma).filter(Boolean))].sort();
    anoSelect.innerHTML = `<option value="">Ano</option>` + anos.map(a => `<option>${a}</option>`).join('');

    const subs = [...new Set(alunos.map(a => a.subSala).filter(Boolean))].sort();
    subSelect.innerHTML = `<option value="">Sub-sala</option>` + subs.map(s => `<option>${s}</option>`).join('');
  }

  function filtrar() {
    const ano = anoSelect.value;
    const sub = subSelect.value;

    return alunos.filter(a => {
      if (ano && a.turma !== ano) return false;
      if (sub && a.subSala !== sub) return false;
      return true;
    });
  }

  function calcularMedia(p1,p2,t1,t2){
    return (p1*2 + p2*2 + t1 + t2) / 6;
  }

  function renderTabela(lista) {
    if (!lista.length) {
      tabelaSala.innerHTML = '<p>Nenhum aluno encontrado.</p>';
      return;
    }

    const linhas = lista.map(a => `
      <tr data-id="${a._id}">
        <td>${a.nome}</td>
        <td>${a.ra}</td>
        <td><input class="p1" type="number" min="0" max="10" step="0.1"></td>
        <td><input class="p2" type="number" min="0" max="10" step="0.1"></td>
        <td><input class="t1" type="number" min="0" max="10" step="0.1"></td>
        <td><input class="t2" type="number" min="0" max="10" step="0.1"></td>
        <td class="media">-</td>
      </tr>
    `).join('');

    tabelaSala.innerHTML = `
      <div class="table-wrap">
        <table class="tabela-notas">
          <thead>
            <tr>
              <th>Aluno</th>
              <th>RA</th>
              <th>P1</th>
              <th>P2</th>
              <th>T1</th>
              <th>T2</th>
              <th>Média</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
      <p class="nota-info">Edite as notas e clique em "Salvar em lote". Campos vazios serão preservados.</p>
    `;

    tabelaSala.querySelectorAll('input').forEach(inp =>
      inp.addEventListener('input', atualizarMedias)
    );
  }

  function atualizarMedias() {
    tabelaSala.querySelectorAll('tbody tr').forEach(tr => {
      const p1 = Number(tr.querySelector('.p1').value || 0);
      const p2 = Number(tr.querySelector('.p2').value || 0);
      const t1 = Number(tr.querySelector('.t1').value || 0);
      const t2 = Number(tr.querySelector('.t2').value || 0);

      const med = calcularMedia(p1,p2,t1,t2);
      tr.querySelector('.media').textContent = med.toFixed(2);
    });
  }

  async function salvarEmLote() {
    const ano = anoSelect.value;
    const semestre = semestreSelect.value;

    if (!ano || !semestre) return alert('Selecione ano e semestre.');

    const linhas = [...tabelaSala.querySelectorAll('tbody tr')];
    let enviados = 0;

    for (const tr of linhas) {
      const id = tr.dataset.id;
      const p1 = tr.querySelector('.p1').value;
      const p2 = tr.querySelector('.p2').value;
      const t1 = tr.querySelector('.t1').value;
      const t2 = tr.querySelector('.t2').value;

      if (!p1 && !p2 && !t1 && !t2) continue;

      const aluno = alunos.find(a => a._id === id);
      const media = calcularMedia(Number(p1||0),Number(p2||0),Number(t1||0),Number(t2||0));

      await fetch(`${baseUrl}/api/notas`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          alunoId: id,
          alunoNome: aluno.nome,
          turma: aluno.subSala,
          materia: profMateria,   // <— TRAVADO 100%
          ano,
          semestre,
          p1: Number(p1 || 0),
          p2: Number(p2 || 0),
          t1: Number(t1 || 0),
          t2: Number(t2 || 0),
          media: Number(media.toFixed(2))
        })
      });

      enviados++;
    }

    alert(`Salvo (${enviados})`);
  }

  btnBuscarSala.addEventListener('click', () => renderTabela(filtrar()));
  btnSalvarLote.addEventListener('click', salvarEmLote);

  (async ()=>{ await carregarAlunos(); })();
});
