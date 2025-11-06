// front/Scripts/atividades.Professor.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-tarefa");
  const lista = document.getElementById("lista-tarefas");
  const baseUrl = window.location.origin.replace(/:\d+$/, ":3000");

  if (!form || !lista) {
    console.error("Elementos do formulário ou lista não encontrados.");
    return;
  }

  // === EVENTO DE ENVIO ===
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const turma = document.getElementById("turma").value;
    const subSala = document.getElementById("subSala").value;
    const materia = document.getElementById("materia").value;
    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const arquivo = document.getElementById("arquivo").files[0];

    if (!turma || !subSala || !materia || !titulo) {
      alert("Preencha todos os campos obrigatórios!");
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
        alert("Atividade postada com sucesso!");
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

  // === FUNÇÃO: CARREGAR ATIVIDADES ===
  async function carregarTarefas() {
    lista.innerHTML = "<p>Carregando atividades...</p>";

    try {
      const res = await fetch(`${baseUrl}/api/atividades`);
      const atividades = await res.json();

      if (!Array.isArray(atividades) || atividades.length === 0) {
        lista.innerHTML = "<p>Nenhuma atividade postada ainda.</p>";
        return;
      }

      lista.innerHTML = "";
      atividades.forEach((a) => {
        const artigo = document.createElement("article");
        artigo.className = "tarefa";
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
              ? `<a href="${a.arquivoPath}" target="_blank" rel="noopener">📎 ${a.arquivoNome || "Arquivo"}</a>`
              : ""
          }
          <button class="btn-excluir" data-id="${a._id}">Excluir</button>
        `;
        lista.appendChild(artigo);
      });

      // Eventos de exclusão
      document.querySelectorAll(".btn-excluir").forEach((btn) => {
        btn.addEventListener("click", async function () {
          const id = this.dataset.id;
          if (confirm("Deseja excluir esta atividade?")) {
            await excluirTarefa(id);
          }
        });
      });
    } catch (err) {
      console.error("Erro ao carregar atividades:", err);
      lista.innerHTML = "<p>Erro ao carregar atividades.</p>";
    }
  }

  // === FUNÇÃO: EXCLUIR ATIVIDADE ===
  async function excluirTarefa(id) {
    try {
      const res = await fetch(`${baseUrl}/api/atividades/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Atividade excluída com sucesso!");
        carregarTarefas();
      } else {
        alert("Erro ao excluir a atividade.");
      }
    } catch (err) {
      console.error("Erro ao excluir atividade:", err);
      alert("Falha ao excluir atividade.");
    }
  }

  // Carrega lista ao abrir página
  carregarTarefas();
});
