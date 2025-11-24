document.addEventListener("DOMContentLoaded", () => {
  const aluno = JSON.parse(localStorage.getItem("usuarioAluno"));

  if (!aluno || !aluno.id) {
    document.getElementById("tabelaSem1").innerHTML =
      "<p class='no-notes'>Erro: aluno não logado.</p>";
    document.getElementById("tabelaSem2").innerHTML =
      "<p class='no-notes'>Erro: aluno não logado.</p>";
    return;
  }

  const baseUrl = window.location.origin.replace(/:\d+$/, ":3000");

  let chart1 = null;
  let chart2 = null;

  async function carregarNotas() {
    try {
      const res = await fetch(`${baseUrl}/api/notas/aluno/${aluno.id}`);


      const notas = await res.json();

      if (!Array.isArray(notas) || notas.length === 0) {
        document.getElementById("tabelaSem1").innerHTML =
          "<p class='no-notes'>Nenhuma nota lançada.</p>";
        document.getElementById("tabelaSem2").innerHTML =
          "<p class='no-notes'>Nenhuma nota lançada.</p>";
        return;
      }

      const sem1 = notas.filter(n => n.semestre === "1º Semestre");
      const sem2 = notas.filter(n => n.semestre === "2º Semestre");

      montarTabela("tabelaSem1", sem1);
      montarTabela("tabelaSem2", sem2);


      setTimeout(() => {
        montarGrafico("chartSem1", sem1, 1);
        montarGrafico("chartSem2", sem2, 2);
      }, 50);

      montarGrafico("chartSem1", sem1, 1);
      montarGrafico("chartSem2", sem2, 2);

    } catch (err) {
      console.error(err);
      document.getElementById("tabelaSem1").innerHTML =
        "<p class='no-notes'>Erro ao carregar notas.</p>";
      document.getElementById("tabelaSem2").innerHTML =
        "<p class='no-notes'>Erro ao carregar notas.</p>";
    }
  }

  function montarTabela(elementId, lista) {
    const div = document.getElementById(elementId);

    if (!lista.length) {
      div.innerHTML = "<p class='no-notes'>Sem notas neste semestre.</p>";
      return;
    }

    let html = `
      <table class="notas-table">
        <thead>
          <tr>
            <th>Matéria</th>
            <th>P1</th>
            <th>P2</th>
            <th>T1</th>
            <th>T2</th>
            <th>Média</th>
          </tr>
        </thead>
        <tbody>
    `;

    lista.forEach(n => {
      html += `
        <tr>
          <td>${n.materia}</td>
          <td>${n.p1 ?? "-"}</td>
          <td>${n.p2 ?? "-"}</td>
          <td>${n.t1 ?? "-"}</td>
          <td>${n.t2 ?? "-"}</td>
          <td><strong>${n.media?.toFixed(2) ?? "-"}</strong></td>
        </tr>`;
    });

    html += "</tbody></table>";

    div.innerHTML = html;
  }

  function montarGrafico(canvasId, lista, semestre) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (!Array.isArray(lista) || lista.length === 0) {
      // remove existing chart for this semester if present
      if (semestre === 1 && chart1) { chart1.destroy(); chart1 = null; }
      if (semestre === 2 && chart2) { chart2.destroy(); chart2 = null; }
      return;
    }

    const materias = lista.map(n => n.materia || "");
    const medias = lista.map(n => {
      if (typeof n.media === "number") return n.media;
      const vals = [n.p1, n.p2, n.t1, n.t2].filter(v => typeof v === "number");
      if (vals.length === 0) return 0;
      const sum = vals.reduce((a, b) => a + b, 0);
      return +(sum / vals.length);
    });


    if (semestre === 1 && chart1) { chart1.destroy(); chart1 = null; }
    if (semestre === 2 && chart2) { chart2.destroy(); chart2 = null; }

    const novo = new Chart(ctx, {
      type: "bar",
      data: {
        labels: materias,
        datasets: [{
          label: "Média",
          data: medias,
          backgroundColor: "#4b7bd6"
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 10 }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    if (semestre === 1) chart1 = novo;
    else chart2 = novo;
  }

  carregarNotas();
});
