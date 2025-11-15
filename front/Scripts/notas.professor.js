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
  let notasExistentesMap = {};

  // gráficos ativos
  let graficoSub = null;
  let graficoAno = null;

  // carregar matéria do professor
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

  // travar select da matéria
  function travarMateria() {
    if (profMateria) {
      materiaSelect.innerHTML = `<option value="${profMateria}">${profMateria}</option>`;
      materiaSelect.disabled = true;
    } else {
      materiaSelect.innerHTML = `<option value="">Matéria não encontrada</option>`;
      materiaSelect.disabled = true;
    }
  }

  travarMateria();

  // carregar todos os alunos
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

  // popular ano e sub-sala
  function popularFiltros() {
    const anos = [...new Set(alunos.map(a => a.turma).filter(Boolean))].sort();
    anoSelect.innerHTML = `<option value="">Ano</option>` + anos.map(a => `<option>${a}</option>`).join('');

    const subs = [...new Set(alunos.map(a => a.subSala).filter(Boolean))].sort();
    subSelect.innerHTML = `<option value="">Sub-sala</option>` + subs.map(s => `<option>${s}</option>`).join('');
  }

  // filtrar lista de alunos pelo ano + sub-sala
  function filtrar() {
    const ano = anoSelect.value;
    const sub = subSelect.value;

    return alunos.filter(a => {
      if (ano && a.turma !== ano) return false;
      if (sub && a.subSala !== sub) return false;
      return true;
    });
  }

  // calcular média ponderada
  function calcularMedia(p1, p2, t1, t2) {
    const algum = Number.isFinite(p1) || Number.isFinite(p2) || Number.isFinite(t1) || Number.isFinite(t2);
    if (!algum) return NaN;

    const a = Number.isFinite(p1) ? p1 : 0;
    const b = Number.isFinite(p2) ? p2 : 0;
    const c = Number.isFinite(t1) ? t1 : 0;
    const d = Number.isFinite(t2) ? t2 : 0;

    return (a * 2 + b * 2 + c + d) / 6;
  }

  // desenhar tabela de notas
  function renderTabela(lista) {
    if (!lista.length) {
      tabelaSala.innerHTML = '<p>Nenhum aluno encontrado.</p>';
      return;
    }

    const linhas = lista.map(a => {
      const nota = notasExistentesMap[a._id];
      const p1v = nota?.p1 ?? '';
      const p2v = nota?.p2 ?? '';
      const t1v = nota?.t1 ?? '';
      const t2v = nota?.t2 ?? '';

      const med = calcularMedia(
        p1v === '' ? undefined : Number(p1v),
        p2v === '' ? undefined : Number(p2v),
        t1v === '' ? undefined : Number(t1v),
        t2v === '' ? undefined : Number(t2v)
      );

      const medText = Number.isNaN(med) ? '-' : med.toFixed(2);

      return `
      <tr data-id="${a._id}">
        <td>${a.nome}</td>
        <td>${a.ra}</td>
        <td><input class="p1" type="number" min="0" max="10" step="0.1" value="${p1v}"></td>
        <td><input class="p2" type="number" min="0" max="10" step="0.1" value="${p2v}"></td>
        <td><input class="t1" type="number" min="0" max="10" step="0.1" value="${t1v}"></td>
        <td><input class="t2" type="number" min="0" max="10" step="0.1" value="${t2v}"></td>
        <td class="media">${medText}</td>
      </tr>
    `;
    }).join('');

    tabelaSala.innerHTML = `
      <div class="table-wrap">
        <table class="tabela-notas">
          <thead>
            <tr>
              <th>Aluno</th>
              <th>RA</th>
              <th>P1 (2)</th>
              <th>P2 (2)</th>
              <th>T1 (1)</th>
              <th>T2 (1)</th>
              <th>Média Ponderada</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
      <p class="nota-info">Editar notas e clicar em "Salvar em lote".</p>
    `;

    tabelaSala.querySelectorAll('input').forEach(inp =>
      inp.addEventListener('input', atualizarMedias)
    );
  }

  // atualizar médias em cada linha
  function atualizarMedias() {
    tabelaSala.querySelectorAll('tbody tr').forEach(tr => {
      const id = tr.dataset.id;
      const existente = notasExistentesMap[id] || {};

      const p1Raw = tr.querySelector('.p1').value;
      const p2Raw = tr.querySelector('.p2').value;
      const t1Raw = tr.querySelector('.t1').value;
      const t2Raw = tr.querySelector('.t2').value;

      const p1 = p1Raw === '' ? existente.p1 : Number(p1Raw);
      const p2 = p2Raw === '' ? existente.p2 : Number(p2Raw);
      const t1 = t1Raw === '' ? existente.t1 : Number(t1Raw);
      const t2 = t2Raw === '' ? existente.t2 : Number(t2Raw);

      const med = calcularMedia(p1, p2, t1, t2);
      tr.querySelector('.media').textContent = Number.isNaN(med) ? '-' : med.toFixed(2);
    });
  }

  // buscar notas salvas do backend
  async function buscarNotasSala(ano, subSala, semestre) {
    notasExistentesMap = {};
    try {
      const url = `${baseUrl}/api/notas/sala?ano=${encodeURIComponent(ano)}&subSala=${encodeURIComponent(subSala)}&materia=${encodeURIComponent(profMateria)}&semestre=${encodeURIComponent(semestre)}`;
      const res = await fetch(url);
      if (!res.ok) return {};
      const notas = await res.json();
      notas.forEach(n => notasExistentesMap[n.alunoId] = n);
      return notasExistentesMap;
    } catch (e) {
      notasExistentesMap = {};
      return {};
    }
  }

  // salvar notas em lote
  async function salvarEmLote() {
    const ano = anoSelect.value;
    const semestre = semestreSelect.value;
    const subSala = subSelect.value;

    if (!ano || !semestre || !subSala) return alert('Selecione ano, sub-sala e semestre.');

    const linhas = [...tabelaSala.querySelectorAll('tbody tr')];
    let enviados = 0;

    await buscarNotasSala(ano, subSala, semestre);

    for (const tr of linhas) {
      const id = tr.dataset.id;
      const aluno = alunos.find(a => a._id === id);
      if (!aluno) continue;

      const p1Raw = tr.querySelector('.p1').value;
      const p2Raw = tr.querySelector('.p2').value;
      const t1Raw = tr.querySelector('.t1').value;
      const t2Raw = tr.querySelector('.t2').value;

      const existe = notasExistentesMap[id];

      if (!p1Raw && !p2Raw && !t1Raw && !t2Raw && !existe) continue;

      const body = {
        alunoId: id,
        alunoNome: aluno.nome,
        turma: aluno.subSala,
        materia: profMateria,
        ano,
        semestre
      };

      if (p1Raw !== '') body.p1 = Number(p1Raw);
      if (p2Raw !== '') body.p2 = Number(p2Raw);
      if (t1Raw !== '') body.t1 = Number(t1Raw);
      if (t2Raw !== '') body.t2 = Number(t2Raw);

      const existente = notasExistentesMap[id] || {};

      const p1 = body.p1 ?? existente.p1;
      const p2 = body.p2 ?? existente.p2;
      const t1 = body.t1 ?? existente.t1;
      const t2 = body.t2 ?? existente.t2;

      const med = calcularMedia(p1, p2, t1, t2);
      if (!Number.isNaN(med)) body.media = Number(med.toFixed(2));

      try {
        const res = await fetch(`${baseUrl}/api/notas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          const updated = await res.json();
          notasExistentesMap[id] = updated;
          enviados++;
        }
      } catch (err) {
        console.error('Erro ao salvar nota', err);
      }
    }

    alert(`Salvo (${enviados})`);

    const lista = filtrar();
    await buscarNotasSala(anoSelect.value, subSelect.value, semestreSelect.value);
    renderTabela(lista);
    gerarGraficosAutomatica(anoSelect.value, subSelect.value, semestreSelect.value);
  }

  // gerar dados para os gráficos
  function gerarGraficos(listaAlunos) {
    const mapaSub = {};
    const mapaAno = {};

    listaAlunos.forEach(a => {
      if (!mapaSub[a.subSala]) mapaSub[a.subSala] = { soma: 0, count: 0 };
      if (!mapaAno[a.turma]) mapaAno[a.turma] = { soma: 0, count: 0 };
    });

    listaAlunos.forEach(a => {
      const nota = notasExistentesMap[a._id];
      if (!nota) return;

      const p1 = nota.p1;
      const p2 = nota.p2;
      const t1 = nota.t1;
      const t2 = nota.t2;

      const med = calcularMedia(p1, p2, t1, t2);
      if (!Number.isNaN(med)) {
        mapaSub[a.subSala].soma += med;
        mapaSub[a.subSala].count++;

        mapaAno[a.turma].soma += med;
        mapaAno[a.turma].count++;
      }
    });

    const labelsSub = Object.keys(mapaSub).sort();
    const dataSub = labelsSub.map(k => mapaSub[k].count ? +(mapaSub[k].soma / mapaSub[k].count).toFixed(2) : 0);

    const labelsAno = Object.keys(mapaAno).sort();
    const dataAno = labelsAno.map(k => mapaAno[k].count ? +(mapaAno[k].soma / mapaAno[k].count).toFixed(2) : 0);

    desenharGraficoBar('chartSub', labelsSub, dataSub, 'Média por Sub-sala');
    desenharGraficoBar('chartAno', labelsAno, dataAno, 'Média por Ano');
  }

  // desenhar gráfico de barras
  function desenharGraficoBar(canvasId, labels, data, titulo) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (canvasId === 'chartSub' && graficoSub) graficoSub.destroy();
    if (canvasId === 'chartAno' && graficoAno) graficoAno.destroy();

    const config = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: titulo,
          data,
          backgroundColor: '#4285F4',
          borderColor: '#4285F4',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, title: { display: true, text: titulo } },
        scales: { y: { beginAtZero: false } }
      }
    };

    const chartInstance = new Chart(ctx.getContext('2d'), config);

    if (canvasId === 'chartSub') graficoSub = chartInstance;
    if (canvasId === 'chartAno') graficoAno = chartInstance;
  }

  // gerar gráficos automaticamente
  function gerarGraficosAutomatica(ano, subSala, semestre) {
    const lista = filtrar();
    gerarGraficos(lista);
  }

  // clique do botão Buscar
  btnBuscarSala.addEventListener('click', async () => {
    const ano = anoSelect.value;
    const sub = subSelect.value;
    const semestre = semestreSelect.value;

    if (!ano || !sub || !semestre) return alert('Selecione ano, sub-sala e semestre.');

    await buscarNotasSala(ano, sub, semestre);
    renderTabela(filtrar());
    gerarGraficosAutomatica(ano, sub, semestre);
  });

  btnSalvarLote.addEventListener('click', salvarEmLote);

  // carregar alunos ao abrir página
  (async () => { await carregarAlunos(); })();
});
