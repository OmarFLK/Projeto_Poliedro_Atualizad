// front/Scripts/atividades.Professor.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-tarefa");
  const lista = document.getElementById("lista-tarefas");
  const resolucoesPainel = document.getElementById("lista-resolucoes");
  const baseUrl = window.location.origin.replace(/:\d+$/, ":3000");

  if (!form || !lista || !resolucoesPainel) {
    console.error("Elementos principais não encontrados.");
    return;
  }

  // Envio de nova atividade
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const turma = document.getElementById("turma").value;
    const subSala = document.getElementById("subSala").value;
    const materia = document.getElementById("materia").value;
    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const arquivo = document.getElementById("arquivo").files[0];

    if (!turma || !subSala || !materia || !titulo) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const fd = new FormData();
    fd.append("turma", turma);
    fd.append("subSala", subSala);
    fd.append("materia", materia);
    fd.append("titulo", titulo);
    fd.append("descricao", descricao);
    if (arquivo) fd.append("arquivo", arquivo);

    try {
      const res = await fetch(`${baseUrl}/api/atividades`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (res.ok) {
        alert("Atividade postada com sucesso.");
        form.reset();
        carregarTarefas();
      } else {
        alert("Erro: " + (data.error || "Não foi possível criar a atividade."));
      }
    } catch (err) {
      console.error("Erro ao enviar atividade:", err);
      alert("Erro de conexão com o servidor.");
    }
  });

  // Carregar atividades
  async function carregarTarefas() {
    lista.innerHTML = "<p>Carregando atividades...</p>";

    try {
      const res = await fetch(`${baseUrl}/api/atividades`);
      const atividades = await res.json();

      if (!Array.isArray(atividades) || atividades.length === 0) {
        lista.innerHTML = "<p>Nenhuma atividade postada ainda.</p>";
        resolucoesPainel.innerHTML =
          "<p>Selecione uma atividade para visualizar as resoluções.</p>";
        return;
      }

      lista.innerHTML = "";

      for (const a of atividades) {
        const artigo = document.createElement("article");
        artigo.className = "tarefa";

        // contador de resoluções
        let count = 0;
        try {
          const resCount = await fetch(`${baseUrl}/api/resolucoes/${a._id}`);
          const resolucoes = await resCount.json();
          count = Array.isArray(resolucoes) ? resolucoes.length : 0;
        } catch (err) {
          console.warn("Erro ao contar resoluções:", err);
        }

        artigo.innerHTML = `
          <div class="tarefa-info">
            <b>Turma:</b> ${a.turma} &nbsp; 
            <b>Sub-sala:</b> ${a.subSala} &nbsp; 
            <b>Matéria:</b> ${a.materia}
          </div>
          <h3>${a.titulo}</h3>
          <p>${a.descricao || ""}</p>
          ${
            a.arquivoPath
              ? `<div><a href="${a.arquivoPath}" target="_blank" rel="noopener">📎 ${a.arquivoNome || "Arquivo"}</a></div>`
              : ""
          }
          <div class="botoes-atividade">
            <button class="btn-resolucoes" data-id="${a._id}">
              Visualizar resoluções (${count})
            </button>
            <button class="btn-excluir" data-id="${a._id}">Excluir</button>
          </div>
        `;

        lista.appendChild(artigo);
      }

      // Botões de exclusão
      document.querySelectorAll(".btn-excluir").forEach((btn) => {
        btn.addEventListener("click", async function () {
          const id = this.dataset.id;
          if (confirm("Deseja excluir esta atividade?")) {
            await excluirTarefa(id);
          }
        });
      });

      // Botões de visualização de resoluções
      document.querySelectorAll(".btn-resolucoes").forEach((btn) => {
        btn.addEventListener("click", async function () {
          const id = this.dataset.id;
          await carregarResolucoes(id);
        });
      });
    } catch (err) {
      console.error("Erro ao carregar atividades:", err);
      lista.innerHTML = "<p>Erro ao carregar atividades.</p>";
    }
  }

  // Excluir atividade
  async function excluirTarefa(id) {
    try {
      const res = await fetch(`${baseUrl}/api/atividades/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Atividade excluída com sucesso.");
        carregarTarefas();
      } else {
        alert("Erro ao excluir a atividade.");
      }
    } catch (err) {
      console.error("Erro ao excluir atividade:", err);
      alert("Falha ao excluir atividade.");
    }
  }

  // Carregar resoluções (ajuste: agora mostra turma e sub-sala do aluno)
  async function carregarResolucoes(atividadeId) {
    resolucoesPainel.innerHTML = "<p>Carregando resoluções...</p>";

    try {
      const res = await fetch(`${baseUrl}/api/resolucoes/${atividadeId}`);
      const resolucoes = await res.json();

      if (!Array.isArray(resolucoes) || resolucoes.length === 0) {
        resolucoesPainel.innerHTML =
          "<p>Nenhuma resolução enviada para esta atividade.</p>";
        return;
      }

      resolucoesPainel.innerHTML = "";
      resolucoes.forEach((r) => {
        const card = document.createElement("div");
        card.className = "resolucao-card";

        // agora pega direto turma/subSala do próprio documento de resolução
        const nome = r.nomeAluno || "Aluno desconhecido";
        const ra = r.raAluno || "Sem RA";
        const turma = r.turma || "—";
        const subSala = r.subSala || "—";

        card.innerHTML = `
          <h4>Aluno: ${nome}</h4>
          <p><b>RA:</b> ${ra}</p>
          <p><b>Turma:</b> ${turma} | <b>Sub-sala:</b> ${subSala}</p>
          ${r.observacao ? `<p><b>Observação:</b> ${r.observacao}</p>` : ""}
          ${
            r.link
              ? `<p><a href="${r.link}" target="_blank">Link enviado</a></p>`
              : ""
          }
          ${
            r.arquivoPath
              ? `<p><a href="${r.arquivoPath}" target="_blank" rel="noopener">📎 ${r.arquivoNome}</a></p>`
              : ""
          }
        `;

        resolucoesPainel.appendChild(card);
      });
    } catch (err) {
      console.error("Erro ao carregar resoluções:", err);
      resolucoesPainel.innerHTML =
        "<p>Erro ao carregar resoluções desta atividade.</p>";
    }
  }

  carregarTarefas();
});
