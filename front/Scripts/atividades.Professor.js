document.addEventListener("DOMContentLoaded", () => {

  const baseUrl = "http://localhost:3000";

  const form = document.getElementById("form-tarefa");
  const lista = document.getElementById("lista-tarefas");
  const resolucoesPainel = document.getElementById("lista-resolucoes");

  const turmaEl = document.getElementById("turma");
  const subSalaEl = document.getElementById("subSala");
  const materiaEl = document.getElementById("materia");
  const arquivoEl = document.getElementById("arquivo");
  const tituloEl = document.getElementById("titulo");
  const descricaoEl = document.getElementById("descricao");

  function lerUsuarioStorage() {
    try {
      return JSON.parse(localStorage.getItem("usuarioProfessor"));
    } catch {
      return null;
    }
  }

  let usuario = lerUsuarioStorage();

  // Predefinir matéria se existir
  if (usuario && usuario.materia) {
    materiaEl.value = usuario.materia;
    materiaEl.disabled = true;
  }

  async function carregarTarefas() {
    lista.innerHTML = "<p>Carregando atividades...</p>";

    try {
      const params = new URLSearchParams();
      if (turmaEl.value) params.append("turma", turmaEl.value);
      if (subSalaEl.value) params.append("subSala", subSalaEl.value);
      if (materiaEl.value) params.append("materia", materiaEl.value);

      const res = await fetch(`${baseUrl}/api/atividades?${params}`, { credentials: "include" });
      const atividades = await res.json();

      if (!atividades.length) {
        lista.innerHTML = "<p>Nenhuma atividade encontrada.</p>";
        resolucoesPainel.innerHTML = "<p>Selecione uma atividade para ver resoluções.</p>";
        return;
      }

      lista.innerHTML = "";

      for (const a of atividades) {
        const resCount = await fetch(`${baseUrl}/api/resolucoes/${a._id}`, { credentials: "include" });
        const resolucoes = await resCount.json();
        const count = resolucoes.length;

        const card = document.createElement("div");
        card.className = "tarefa";
        card.innerHTML = `
          <div><b>${a.turma}</b> — ${a.subSala} • ${a.materia}</div>
          <h3>${a.titulo}</h3>
          <p>${a.descricao}</p>
          ${a.arquivoPath ? `<a href="${a.arquivoPath}" target="_blank">📎 ${a.arquivoNome}</a><br>` : ""}
          <button class="btn-resolucoes" data-id="${a._id}">Resoluções (${count})</button>
          <button class="btn-excluir" data-id="${a._id}">Excluir</button>
        `;

        lista.appendChild(card);
      }

      document.querySelectorAll(".btn-resolucoes").forEach(btn => {
        btn.addEventListener("click", () => carregarResolucoes(btn.dataset.id));
      });

      document.querySelectorAll(".btn-excluir").forEach(btn => {
        btn.addEventListener("click", async () => {
          if (confirm("Excluir esta atividade?")) {
            await fetch(`${baseUrl}/api/atividades/${btn.dataset.id}`, {
              method: "DELETE",
              credentials: "include"
            });
            carregarTarefas();
          }
        });
      });

    } catch (e) {
      lista.innerHTML = "<p>Erro ao carregar atividades.</p>";
    }
  }

  async function carregarResolucoes(id) {
    resolucoesPainel.innerHTML = "<p>Carregando...</p>";

    try {
      const res = await fetch(`${baseUrl}/api/resolucoes/${id}`, { credentials: "include" });
      const dados = await res.json();

      if (!dados.length) {
        resolucoesPainel.innerHTML = "<p>Nenhuma resolução enviada.</p>";
        return;
      }

      resolucoesPainel.innerHTML = "";

      dados.forEach(r => {
        const div = document.createElement("div");
        div.className = "resolucao-card";

        div.innerHTML = `
          <h4>${r.nomeAluno}</h4>
          <p><b>RA:</b> ${r.raAluno}</p>
          <p><b>Turma:</b> ${r.turma} — ${r.subSala}</p>
          ${r.observacao ? `<p><b>Obs:</b> ${r.observacao}</p>` : ""}
          ${r.arquivoPath ? `<a href="${r.arquivoPath}" target="_blank">📎 ${r.arquivoNome}</a>` : ""}
        `;

        resolucoesPainel.appendChild(div);
      });

    } catch (e) {
      resolucoesPainel.innerHTML = "<p>Erro ao carregar resoluções.</p>";
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("turma", turmaEl.value);
    fd.append("subSala", subSalaEl.value);
    fd.append("materia", materiaEl.value);
    fd.append("titulo", tituloEl.value);
    fd.append("descricao", descricaoEl.value);
    if (arquivoEl.files[0]) fd.append("arquivo", arquivoEl.files[0]);

    const res = await fetch(`${baseUrl}/api/atividades`, {
      method: "POST",
      body: fd,
      credentials: "include"
    });

    const json = await res.json();

    if (res.ok) {
      alert("Atividade criada!");
      form.reset();
      carregarTarefas();
    } else {
      alert(json.error || "Erro ao criar atividade");
    }
  });

  carregarTarefas();
});
