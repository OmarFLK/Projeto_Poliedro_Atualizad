// front/Scripts/notas.professor.js
document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = window.location.origin.replace(/:\d+$/, ":3000");

  // selects e elementos
  const alunoSelect = document.getElementById("alunoSelect");
  const visualizarAluno = document.getElementById("visualizarAluno");
  const visualizarAno = document.getElementById("visualizarAno");
  const btnVerAluno = document.getElementById("btnVerAluno");
  const filtroAno = document.getElementById("filtroAno");
  const filtroTurma = document.getElementById("filtroTurma");
  const anosForm = document.getElementById("ano");
  const turmaForm = document.getElementById("turma");
  const materiaForm = document.getElementById("materia");
  const btnSalvar = document.getElementById("btnSalvar");
  const form = document.getElementById("notaForm");
  const visualizacaoAluno = document.getElementById("visualizacaoAluno");
  const listaCharts = { sub: null, year: null, students: null };

  // carregar lista de alunos do servidor
  async function carregarAlunos() {
    alunoSelect.innerHTML = '<option value="">Carregando alunos...</option>';
    visualizarAluno.innerHTML = '<option value="">Carregando...</option>';
    try {
      const res = await fetch(`${baseUrl}/api/alunos`);
      if (!res.ok) throw new Error("Falha ao buscar alunos");
      const alunos = await res.json();
      if (!Array.isArray(alunos)) throw new Error("Resposta inválida de alunos");

      // ordena por nome
      alunos.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));

      const optAll = `<option value="">Selecione um aluno</option>`;
      alunoSelect.innerHTML = optAll + alunos.map(a => {
        const label = `${a.nome} — ${a.turma || ""} ${a.subSala ? `(${a.subSala})` : ""}`;
        return `<option value="${a._id}">${escapeHtml(label)}</option>`;
      }).join("");

      visualizarAluno.innerHTML = `<option value="">Selecione aluno</option>` + alunos.map(a => {
        return `<option value="${a._id}">${escapeHtml(a.nome)}</option>`;
      }).join("");

      // popula filtros de ano/turma com base nos alunos (se necessário)
      const turmas = Array.from(new Set(alunos.map(a => a.turma).filter(Boolean))).sort();
      filtroTurma.innerHTML = '<option value="">Todas</option>' + turmas.map(t => `<option>${escapeHtml(t)}</option>`).join('');
      turmaForm.innerHTML = '<option value="">Selecione a sub-sala</option>' + turmas.map(t => `<option>${escapeHtml(t)}</option>`).join('');
    } catch (err) {
      console.error("Erro ao carregar alunos", err);
      alunoSelect.innerHTML = '<option value="">Erro ao carregar</option>';
      visualizarAluno.innerHTML = '<option value="">Erro ao carregar</option>';
    }
  }

  // util
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
  }

  // calcular média (mesmos pesos que você usava)
  function calcularMedia(p1, p2, t1, t2) {
    // pesos: p1=2, p2=2, t1=1, t2=1 -> /6
    return (Number(p1 || 0) * 2 + Number(p2 || 0) * 2 + Number(t1 || 0) + Number(t2 || 0)) / 6;
  }

  // salvar/atualizar nota (POST /api/notas)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const alunoId = alunoSelect.value;
    if (!alunoId) { alert("Selecione um aluno."); return; }
    const alunoNome = alunoSelect.options[alunoSelect.selectedIndex].text.split(" — ")[0];
    const materia = materiaForm.value;
    const ano = anosForm.value;
    const semestre = document.getElementById("semestre").value;
    const turma = turmaForm.value;
    const p1 = parseFloat(document.getElementById("prova1").value || 0);
    const p2 = parseFloat(document.getElementById("prova2").value || 0);
    const t1 = parseFloat(document.getElementById("t1").value || 0);
    const t2 = parseFloat(document.getElementById("t2").value || 0);
    const media = Number(calcularMedia(p1, p2, t1, t2).toFixed(2));

    if (!materia || !ano || !semestre) { alert("Preencha ano, semestre e matéria."); return; }

    const payload = { alunoId, alunoNome, materia, ano, semestre, turma, p1, p2, t1, t2, media };

    try {
      const res = await fetch(`${baseUrl}/api/notas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Erro ao salvar nota");
      alert("Nota salva/atualizada com sucesso.");
      form.reset();
      carregarGraficos(); // atualiza gráficos após salvar
    } catch (err) {
      console.error("Erro ao salvar nota", err);
      alert("Erro ao salvar nota.");
    }
  });

  // visualizar notas de aluno (GET /api/notas/aluno/:alunoId)
  btnVerAluno.addEventListener("click", async (e) => {
    e.preventDefault();
    const alunoId = visualizarAluno.value;
    const anoFilter = visualizarAno.value;
    if (!alunoId) { alert("Selecione um aluno para visualizar."); return; }
    try {
      visualizacaoAluno.innerHTML = "<p>Carregando notas...</p>";
      const res = await fetch(`${baseUrl}/api/notas/aluno/${alunoId}`);
      if (!res.ok) throw new Error("Erro ao buscar notas");
      const notas = await res.json();
      // filtra por ano se escolhido
      const notasFiltradas = anoFilter ? notas.filter(n => n.ano === anoFilter) : notas;
      renderNotasAlunoView(notasFiltradas);
    } catch (err) {
      console.error("Erro ao carregar notas do aluno:", err);
      visualizacaoAluno.innerHTML = "<p style='color:red;'>Erro ao carregar notas do aluno.</p>";
    }
  });

  // renderiza as notas de um aluno separadas por semestre (simples)
  function renderNotasAlunoView(notas) {
    if (!Array.isArray(notas) || notas.length === 0) {
      visualizacaoAluno.innerHTML = "<p>Nenhuma nota cadastrada para este aluno.</p>";
      return;
    }
    // agrupar por semestre
    const sem1 = notas.filter(n => n.semestre && n.semestre.includes("1"));
    const sem2 = notas.filter(n => n.semestre && n.semestre.includes("2"));
    function tabelaHTML(lista) {
      if (!lista.length) return "<div class='no-notes'>Nenhuma nota</div>";
      const rows = lista.map(n => {
        const media = (n.media !== undefined && n.media !== null) ? Number(n.media).toFixed(2) : "-";
        return `<tr>
          <td>${escapeHtml(n.materia)}</td>
          <td>${n.p1 ?? "-"}</td>
          <td>${n.p2 ?? "-"}</td>
          <td>${n.t1 ?? "-"}</td>
          <td>${n.t2 ?? "-"}</td>
          <td><b>${media}</b></td>
        </tr>`;
      }).join("");
      return `<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;">
        <thead style="background:#f4f7fd"><tr><th>Matéria</th><th>P1</th><th>P2</th><th>T1</th><th>T2</th><th>Média</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
    }
    visualizacaoAluno.innerHTML = `
      <h3>1º Semestre</h3>${tabelaHTML(sem1)}
      <h3 style="margin-top:18px">2º Semestre</h3>${tabelaHTML(sem2)}
    `;
  }

  // carregar todos anos disponíveis nas notas (para filtros)
  async function carregarAnos() {
    try {
      const res = await fetch(`${baseUrl}/api/notas`);
      if (!res.ok) return;
      const todas = await res.json();
      const anos = Array.from(new Set(todas.map(n => n.ano))).sort();
      const options = '<option value="">Todos</option>' + anos.map(a => `<option>${escapeHtml(a)}</option>`).join("");
      filtroAno.innerHTML = options;
      visualizarAno.innerHTML = '<option value="">Todos</option>' + anos.map(a => `<option>${escapeHtml(a)}</option>`).join("");
    } catch (err) {
      console.warn("não foi possível carregar anos", err);
    }
  }

  // excluir ultima / todas (rotas já existem no backend)
  document.getElementById("excluirUltima").addEventListener("click", async () => {
    if (!confirm("Excluir última nota?")) return;
    try {
      const res = await fetch(`${baseUrl}/api/notas/ultima`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      alert("Última nota excluída");
      carregarGraficos();
    } catch (err) { console.error(err); alert("Erro ao excluir"); }
  });
  document.getElementById("excluirTodas").addEventListener("click", async () => {
    if (!confirm("Excluir todas as notas?")) return;
    try {
      const res = await fetch(`${baseUrl}/api/notas`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      alert("Todas notas excluídas");
      carregarGraficos();
    } catch (err) { console.error(err); alert("Erro ao excluir"); }
  });

  // --- gráficos simples (carrega todas notas e calcula médias) ---
  async function carregarGraficos() {
    try {
      const res = await fetch(`${baseUrl}/api/notas`);
      if (!res.ok) throw new Error("Erro ao buscar notas");
      const notas = await res.json();

      // média por turma (sub-sala)
      const mapTurma = {};
      notas.forEach(n => {
        const turma = n.turma || "Sem turma";
        if (!mapTurma[turma]) mapTurma[turma] = { sum:0, count:0 };
        mapTurma[turma].sum += (n.media ?? calcularMedia(n.p1,n.p2,n.t1,n.t2));
        mapTurma[turma].count += 1;
      });
      const labelsTurma = Object.keys(mapTurma);
      const dataTurma = labelsTurma.map(k => +(mapTurma[k].sum / mapTurma[k].count || 0).toFixed(2));

      // média geral por ano
      const mapAno = {};
      notas.forEach(n => {
        const ano = n.ano || "Todos";
        if (!mapAno[ano]) mapAno[ano] = { sum:0, count:0 };
        mapAno[ano].sum += (n.media ?? calcularMedia(n.p1,n.p2,n.t1,n.t2));
        mapAno[ano].count += 1;
      });
      const labelsAno = Object.keys(mapAno);
      const dataAno = labelsAno.map(k => +(mapAno[k].sum / mapAno[k].count || 0).toFixed(2));

      // média por aluno (top 10)
      const mapAluno = {};
      notas.forEach(n => {
        const nome = (n.alunoNome || n.aluno || "Sem nome").trim();
        if (!mapAluno[nome]) mapAluno[nome] = { sum:0, count:0 };
        mapAluno[nome].sum += (n.media ?? calcularMedia(n.p1,n.p2,n.t1,n.t2));
        mapAluno[nome].count += 1;
      });
      const alunosArr = Object.keys(mapAluno).map(k => ({ aluno:k, avg: mapAluno[k].sum / mapAluno[k].count }));
      alunosArr.sort((a,b) => b.avg - a.avg);
      const top = alunosArr.slice(0, 12);
      const labelsAlunos = top.map(t => t.aluno);
      const dataAlunos = top.map(t => +t.avg.toFixed(2));

      // desenhar charts (Chart.js)
      drawBar("chartSubTurma", labelsTurma, dataTurma, listaCharts, "sub");
      drawBar("chartAno", labelsAno, dataAno, listaCharts, "year", true);
      drawBar("chartAlunos", labelsAlunos, dataAlunos, listaCharts, "students");
    } catch (err) {
      console.error("Erro ao carregar gráficos:", err);
    }
  }

  function drawBar(canvasId, labels, data, chartStore, key, horizontal=false) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    const ctx = el.getContext("2d");
    if (chartStore[key]) chartStore[key].destroy();
    chartStore[key] = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{ label: "Média", data }] },
      options: { indexAxis: horizontal ? "y" : "x", responsive: true, scales: { y: { beginAtZero: true, max: 10 } }, plugins: { legend: { display: false } } }
    });
  }

  // inicialização
  (async function init() {
    await carregarAlunos();
    await carregarAnos();
    await carregarGraficos();
  })();
});
