document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = "http://localhost:3000";

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

  let graficoSub = null;
  let graficoAno = null;

  // =============================
  // NORMALIZAÇÃO
  // =============================
  function normalizarTurma(t) {
    if (!t) return "";
    t = t.toString().trim().toLowerCase();

    if (t.includes("1")) return "1º Ano";
    if (t.includes("2")) return "2º Ano";
    if (t.includes("3")) return "3º Ano";

    return t;
  }

  function normalizarSub(s) {
    if (!s) return "";
    s = s.toString().trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // =============================
  // PEGAR MATÉRIA DO PROFESSOR
  // =============================
  function carregarMateria() {
    try {
      const u = JSON.parse(localStorage.getItem("usuarioProfessor") || "null");
      if (u?.materia) {
        profMateria = u.materia;
        return;
      }
    } catch (e) { }
    profMateria = "";
  }

  carregarMateria();

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

  // =============================
  // CARREGAR TODOS ALUNOS
  // =============================
  async function carregarAlunos() {
    try {
      const res = await fetch(`${baseUrl}/api/alunos`, { credentials: "include" });
      alunos = await res.json();
      popularFiltros();
    } catch (err) {
      alunos = [];
      popularFiltros();
    }
  }

  // =============================
  // POPULAR SELECTS
  // =============================
  function popularFiltros() {
    const anos = [...new Set(
      alunos.map(a => normalizarTurma(a.turma)).filter(Boolean)
    )].sort((a, b) => {
      const na = parseInt(a);
      const nb = parseInt(b);
      return na - nb;
    });

    anoSelect.innerHTML =
      `<option value="">Ano</option>` +
      anos.map(a => `<option value="${a}">${a}</option>`).join("");

    const subs = [...new Set(
      alunos.map(a => normalizarSub(a.subSala)).filter(Boolean)
    )].sort();

    subSelect.innerHTML =
      `<option value="">Sub-sala</option>` +
      subs.map(s => `<option value="${s}">${s}</option>`).join("");
  }

  // =============================
  // FILTRAR ALUNOS
  // =============================
  function filtrar() {
    const anoSel = anoSelect.value;
    const subSel = subSelect.value;

    return alunos.filter(a => {
      const anoAluno = normalizarTurma(a.turma);
      const subAluno = normalizarSub(a.subSala);

      if (anoSel && anoAluno !== anoSel) return false;
      if (subSel && subAluno !== subSel) return false;

      return true;
    });
  }

  // =============================
  // CÁLCULO DA MÉDIA
  // =============================
  function calcularMedia(p1, p2, t1, t2) {
    const algum = Number.isFinite(p1) || Number.isFinite(p2) || Number.isFinite(t1) || Number.isFinite(t2);
    if (!algum) return NaN;

    const a = Number.isFinite(p1) ? p1 : 0;
    const b = Number.isFinite(p2) ? p2 : 0;
    const c = Number.isFinite(t1) ? t1 : 0;
    const d = Number.isFinite(t2) ? t2 : 0;

    return (a * 2 + b * 2 + c + d) / 6;
  }

  // =============================
  // RENDER TABELA
  // =============================
  function renderTabela(lista) {
    if (!lista.length) {
      tabelaSala.innerHTML = "<p>Nenhum aluno encontrado.</p>";
      return;
    }

    const linhas = lista.map(a => {
      const nota = notasExistentesMap[a._id] || {};

      const p1v = nota.p1 ?? "";
      const p2v = nota.p2 ?? "";
      const t1v = nota.t1 ?? "";
      const t2v = nota.t2 ?? "";

      const med = calcularMedia(
        p1v === "" ? undefined : Number(p1v),
        p2v === "" ? undefined : Number(p2v),
        t1v === "" ? undefined : Number(t1v),
        t2v === "" ? undefined : Number(t2v)
      );

      return `
      <tr data-id="${a._id}">
        <td>${a.nome}</td>
        <td>${a.ra}</td>
        <td><input class="p1" type="number" step="0.1" value="${p1v}"></td>
        <td><input class="p2" type="number" step="0.1" value="${p2v}"></td>
        <td><input class="t1" type="number" step="0.1" value="${t1v}"></td>
        <td><input class="t2" type="number" step="0.1" value="${t2v}"></td>
        <td class="media">${Number.isNaN(med) ? "-" : med.toFixed(2)}</td>
      </tr>`;
    }).join("");

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
      </div>`;

    tabelaSala.querySelectorAll("input").forEach(inp =>
      inp.addEventListener("input", atualizarMedias)
    );
  }

  function atualizarMedias() {
    tabelaSala.querySelectorAll("tbody tr").forEach(tr => {
      const id = tr.dataset.id;
      const ex = notasExistentesMap[id] || {};

      const p1Raw = tr.querySelector(".p1").value;
      const p2Raw = tr.querySelector(".p2").value;
      const t1Raw = tr.querySelector(".t1").value;
      const t2Raw = tr.querySelector(".t2").value;

      const p1 = p1Raw === "" ? ex.p1 : Number(p1Raw);
      const p2 = p2Raw === "" ? ex.p2 : Number(p2Raw);
      const t1 = t1Raw === "" ? ex.t1 : Number(t1Raw);
      const t2 = t2Raw === "" ? ex.t2 : Number(t2Raw);

      const med = calcularMedia(p1, p2, t1, t2);

      tr.querySelector(".media").textContent = Number.isNaN(med)
        ? "-"
        : med.toFixed(2);
    });
  }

  // =============================
  // BUSCAR NOTAS SALVAS
  // =============================
  async function buscarNotasSala(ano, subSala, semestre) {
    notasExistentesMap = {};

    try {
      const url = `${baseUrl}/api/notasalunos/sala?ano=${encodeURIComponent(ano)}&subSala=${encodeURIComponent(subSala)}&materia=${encodeURIComponent(profMateria)}&semestre=${encodeURIComponent(semestre)}`;

      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) return {};

      const notas = await res.json();
      notas.forEach(n => notasExistentesMap[n.alunoId] = n);

      return notasExistentesMap;
    } catch (e) {
      notasExistentesMap = {};
      return {};
    }
  }

  // =============================
  // SALVAR EM LOTE
  // =============================
  async function salvarEmLote() {
    const ano = anoSelect.value;
    const semestre = semestreSelect.value;
    const subSala = subSelect.value;

    if (!ano || !semestre || !subSala)
      return alert("Selecione ano, sub-sala e semestre.");

    const linhas = [...tabelaSala.querySelectorAll("tbody tr")];
    let enviados = 0;

    await buscarNotasSala(ano, subSala, semestre);

    for (const tr of linhas) {
      const id = tr.dataset.id;
      const aluno = alunos.find(a => a._id === id);
      if (!aluno) continue;

      const p1 = tr.querySelector(".p1").value;
      const p2 = tr.querySelector(".p2").value;
      const t1 = tr.querySelector(".t1").value;
      const t2 = tr.querySelector(".t2").value;

      const ex = notasExistentesMap[id] || {};

      if (!p1 && !p2 && !t1 && !t2 && !ex) continue;

      const body = {
        alunoId: id,
        alunoNome: aluno.nome,
        turma: aluno.subSala,
        materia: profMateria,
        ano,
        semestre
      };

      if (p1 !== "") body.p1 = Number(p1);
      if (p2 !== "") body.p2 = Number(p2);
      if (t1 !== "") body.t1 = Number(t1);
      if (t2 !== "") body.t2 = Number(t2);

      const mp1 = body.p1 ?? ex.p1;
      const mp2 = body.p2 ?? ex.p2;
      const mt1 = body.t1 ?? ex.t1;
      const mt2 = body.t2 ?? ex.t2;

      const med = calcularMedia(mp1, mp2, mt1, mt2);
      if (!Number.isNaN(med)) body.media = Number(med.toFixed(2));

      try {
        const res = await fetch(`${baseUrl}/api/notas`,{
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body)
        });

        if (res.ok) {
          const updated = await res.json();
          notasExistentesMap[id] = updated;
          enviados++;
        }
      } catch (err) { }
    }

    alert(`Salvo (${enviados})`);
    await buscarNotasSala(ano, subSala, semestre);
    renderTabela(filtrar());
    gerarGraficosAutomatica();
  }

  // GRÁFICOS
  function gerarGraficos(lista) {
    const mapaSub = {};
    const mapaAno = {};

    lista.forEach(a => {
      mapaSub[a.subSala] ||= { soma: 0, count: 0 };
      mapaAno[a.turma] ||= { soma: 0, count: 0 };
    });

    lista.forEach(a => {
      const n = notasExistentesMap[a._id];
      if (!n) return;

      const med = calcularMedia(n.p1, n.p2, n.t1, n.t2);

      if (!Number.isNaN(med)) {
        mapaSub[a.subSala].soma += med;
        mapaSub[a.subSala].count++;

        mapaAno[a.turma].soma += med;
        mapaAno[a.turma].count++;
      }
    });

    const labelsSub = Object.keys(mapaSub);
    const dataSub = labelsSub.map(s =>
      mapaSub[s].count ? +(mapaSub[s].soma / mapaSub[s].count).toFixed(2) : 0
    );

    const labelsAno = Object.keys(mapaAno);
    const dataAno = labelsAno.map(s =>
      mapaAno[s].count ? +(mapaAno[s].soma / mapaAno[s].count).toFixed(2) : 0
    );

    desenharGrafico("chartSub", labelsSub, dataSub, "Média por Sub-sala");
    desenharGrafico("chartAno", labelsAno, dataAno, "Média por Ano");
  }

  function desenharGrafico(id, labels, data, title) {
    const ctx = document.getElementById(id);
    if (!ctx) return;

    if (id === "chartSub" && graficoSub) graficoSub.destroy();
    if (id === "chartAno" && graficoAno) graficoAno.destroy();

    const chart = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{ data, backgroundColor: "#4285F4" }] },
      options: {
        plugins: { legend: { display: false }, title: { display: true, text: title } },
        responsive: true,
        maintainAspectRatio: false
      }
    });

    if (id === "chartSub") graficoSub = chart;
    if (id === "chartAno") graficoAno = chart;
  }

  function gerarGraficosAutomatica() {
    gerarGraficos(filtrar());
  }

  //BOTÃO BUSCAR
  btnBuscarSala.addEventListener("click", async () => {
    const ano = anoSelect.value;
    const sub = subSelect.value;
    const semestre = semestreSelect.value;

    if (!ano || !sub || !semestre)
      return alert("Selecione ano, sub-sala e semestre.");

    await buscarNotasSala(ano, sub, semestre);
    renderTabela(filtrar());
    gerarGraficosAutomatica();
  });

  btnSalvarLote.addEventListener("click", salvarEmLote);

  carregarAlunos();
});
