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
      // CORREÇÃO AQUI ↓↓↓
      const res = await fetch(`${baseUrl}/api/notasalunos/aluno/${aluno.id}`);

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
    const ctx = document.getElementById(canvasId).getContext("2d");

    if (!lista.length) {
      ctx.font = "16px Arial";
      ctx.fillText("Sem dados suficientes", 20, 40);
      return;
    }

    const materias = lista.map(n => n.materia);
    const medias = lista.map(n => n.media ?? 0);

    if (semestre === 1 && chart1) chart1.destroy();
    if (semestre === 2 && chart2) chart2.destroy();

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
