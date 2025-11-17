// front/Scripts/atividades.Professor.js
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

  if (!form || !lista || !resolucoesPainel) {
    console.error("[AtividadesProf] Elementos principais não encontrados.");
    return;
  }

  function lerUsuarioStorage() {
    const keys = ["usuarioProfessor", "usuarioAluno", "usuario"];
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        if (obj && typeof obj === "object") return obj;
      } catch {}
    }
    return null;
  }

  let usuario = lerUsuarioStorage();
  console.log("[AtividadesProf] usuario localStorage:", usuario);

  if (usuario && usuario.materia && materiaEl) {
    const target = String(usuario.materia).trim();
    let matched = false;

    Array.from(materiaEl.options).forEach(opt => {
      if (!matched && opt.value && opt.value.toLowerCase() === target.toLowerCase()) {
        materiaEl.value = opt.value;
        matched = true;
      }
    });

    if (!matched) {
      const op = document.createElement("option");
      op.value = usuario.materia;
      op.textContent = usuario.materia;
      op.selected = true;
      materiaEl.insertBefore(op, materiaEl.firstChild);
    }

    materiaEl.disabled = true;
  }

  async function carregarTarefas() {
    lista.innerHTML = "<p>Carregando atividades...</p>";

    try {
      const params = new URLSearchParams();
      if (turmaEl.value) params.set("turma", turmaEl.value);
      if (subSalaEl.value) params.set("subSala", subSalaEl.value);
      if (materiaEl.value) params.set("materia", materiaEl.value);

      const res = await fetch(`${baseUrl}/api/atividades?${params.toString()}`, {
        credentials: "include"
      });

      const atividades = await res.json();

      if (!Array.isArray(atividades) || atividades.length === 0) {
        lista.innerHTML = "<p>Nenhuma atividade postada ainda.</p>";
        resolucoesPainel.innerHTML = "<p>Selecione uma atividade para visualizar as resoluções.</p>";
        return;
      }

      lista.innerHTML = "";

      for (const a of atividades) {
        let count = 0;

        try {
          const resCount = await fetch(`${baseUrl}/api/resolucoes/${a._id}`, {
            credentials: "include"
          });
          const resol = await resCount.json();
          count = Array.isArray(resol) ? resol.length : 0;
        } catch {}

        const artigo = document.createElement("article");
        artigo.className = "tarefa";

        artigo.innerHTML = `
          <div class="tarefa-info">
            <b>Turma:</b> ${a.turma}
            <b>Sub-sala:</b> ${a.subSala}
            <b>Matéria:</b> ${a.materia}
          </div>
          <h3>${a.titulo}</h3>
          <p>${a.descricao || ""}</p>
          ${a.arquivoPath ? `<a href="${a.arquivoPath}" target="_blank">📎 ${a.arquivoNome}</a>` : ""}
          <div class="botoes-atividade">
            <button class="btn-resolucoes" data-id="${a._id}">
              Visualizar resoluções (${count})
            </button>
            <button class="btn-excluir" data-id="${a._id}">Excluir</button>
          </div>
        `;

        lista.appendChild(artigo);
      }

      document.querySelectorAll(".btn-excluir").forEach((btn) => {
        btn.addEventListener("click", async function () {
          if (confirm("Deseja excluir esta atividade?")) {
            await excluirTarefa(this.dataset.id);
          }
        });
      });

      document.querySelectorAll(".btn-resolucoes").forEach((btn) => {
        btn.addEventListener("click", () => carregarResolucoes(btn.dataset.id));
      });

    } catch (err) {
      console.error(err);
      lista.innerHTML = "<p>Erro ao carregar atividades.</p>";
    }
  }

  async function excluirTarefa(id) {
    try {
      const res = await fetch(`${baseUrl}/api/atividades/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        alert("Atividade excluída!");
        carregarTarefas();
      } else {
        alert("Erro ao excluir atividade.");
      }

    } catch (err) {
      alert("Erro ao excluir.");
    }
  }

  async function carregarResolucoes(atividadeId) {
    resolucoesPainel.innerHTML = "<p>Carregando resoluções...</p>";

    try {
      const res = await fetch(`${baseUrl}/api/resolucoes/${atividadeId}`, {
        credentials: "include"
      });

      const resolucoes = await res.json();

      if (!Array.isArray(resolucoes) || resolucoes.length === 0) {
        resolucoesPainel.innerHTML = "<p>Nenhuma resolução enviada.</p>";
        return;
      }

      resolucoesPainel.innerHTML = "";

      resolucoes.forEach((r) => {
        const card = document.createElement("div");
        card.className = "resolucao-card";

        card.innerHTML = `
          <h4>Aluno: ${r.nomeAluno}</h4>
          <p><b>RA:</b> ${r.raAluno}</p>
          <p><b>Turma:</b> ${r.turma} | <b>Sub:</b> ${r.subSala}</p>
          ${r.observacao ? `<p><b>Obs:</b> ${r.observacao}</p>` : ""}
          ${r.arquivoPath ? `<a href="${r.arquivoPath}" target="_blank">📎 ${r.arquivoNome}</a>` : ""}
        `;

        resolucoesPainel.appendChild(card);
      });

    } catch (err) {
      resolucoesPainel.innerHTML = "<p>Erro ao carregar resoluções.</p>";
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("turma", turmaEl.value);
    fd.append("subSala", subSalaEl.value);
    fd.append("materia", materiaEl.value);
    fd.append("titulo", tituloEl.value.trim());
    fd.append("descricao", descricaoEl.value.trim());
    if (arquivoEl.files[0]) fd.append("arquivo", arquivoEl.files[0]);

    const res = await fetch(`${baseUrl}/api/atividades`, {
      method: "POST",
      body: fd,
      credentials: "include"
    });

    const data = await res.json();

    if (res.ok) {
      alert("Atividade postada!");
      form.reset();
      carregarTarefas();
    } else {
      alert(data.error || "Erro ao postar.");
    }
  });

  carregarTarefas();
});
