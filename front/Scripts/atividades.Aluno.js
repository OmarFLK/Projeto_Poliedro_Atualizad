// front/Scripts/atividades.Aluno.js
document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = window.location.origin.replace(/:\d+$/, ":3000");
  const listaAtividades = document.getElementById("lista-atividades");
  const listaResolucoes = document.getElementById("lista-resolucoes");

  // dados do aluno em teste; quando tiver login real, pegue do localStorage
  const aluno = {
    id: "690a63aa572e88232e5e6fe9",
    nome: "João Silva",
    ra: "2024001",
    turma: "3º ano",
    subSala: "Sub 1"
  };

  async function carregarAtividades() {
    listaAtividades.innerHTML = "<p>Carregando atividades...</p>";
    try {
      const res = await fetch(
        `${baseUrl}/api/atividades?turma=${encodeURIComponent(aluno.turma)}&subSala=${encodeURIComponent(aluno.subSala)}`
      );
      const atividades = await res.json();

      if (!Array.isArray(atividades) || atividades.length === 0) {
        listaAtividades.innerHTML = "<p>Nenhuma atividade disponível.</p>";
        return;
      }

      listaAtividades.innerHTML = "";
      atividades.forEach((a) => {
        const artigo = document.createElement("article");
        artigo.className = "tarefa";
        artigo.innerHTML = `
          <div class="tarefa-info">
            <b>Turma:</b> ${a.turma} | <b>Sub-sala:</b> ${a.subSala} | <b>Matéria:</b> ${a.materia}
          </div>
          <h3>${a.titulo}</h3>
          <p>${a.descricao || ""}</p>
          ${a.arquivoPath ? `<a href="${a.arquivoPath}" target="_blank" rel="noopener">📎 ${a.arquivoNome}</a>` : ""}
          <div class="upload-area">
            <textarea class="obs-input" placeholder="Observação (opcional)"></textarea>
            <input type="file" class="file-input" accept=".pdf,.doc,.docx,.txt" />
            <button class="btn-resolver" data-id="${a._id}">Enviar resolução</button>
          </div>
        `;
        listaAtividades.appendChild(artigo);
      });

      document.querySelectorAll(".btn-resolver").forEach((btn) => {
        btn.addEventListener("click", async function () {
          const card = this.closest(".tarefa");
          const obs = card.querySelector(".obs-input").value.trim();
          const fileInput = card.querySelector(".file-input");
          const arquivo = fileInput.files[0];

          if (!obs && !arquivo) {
            alert("Preencha uma observação ou envie um arquivo.");
            return;
          }

          const fd = new FormData();
          fd.append("atividadeId", this.dataset.id);
          fd.append("alunoId", aluno.id);
          fd.append("nomeAluno", aluno.nome);
          fd.append("raAluno", aluno.ra);
          // adiciona turma e subSala do aluno
          fd.append("turma", aluno.turma);
          fd.append("subSala", aluno.subSala);
          fd.append("observacao", obs);
          if (arquivo) fd.append("arquivo", arquivo);

          try {
            const res = await fetch(`${baseUrl}/api/resolucoes`, {
              method: "POST",
              body: fd,
            });

            if (res.ok) {
              alert("Resolução enviada com sucesso!");
              carregarResolucoes();
              fileInput.value = "";
              card.querySelector(".obs-input").value = "";
            } else {
              const data = await res.json().catch(() => ({}));
              alert("Erro ao enviar resolução." + (data.error ? ` (${data.error})` : ""));
            }
          } catch (err) {
            console.error("Erro ao enviar:", err);
            alert("Erro de conexão com o servidor.");
          }
        });
      });
    } catch (err) {
      console.error("Erro ao carregar atividades:", err);
      listaAtividades.innerHTML = "<p>Erro ao carregar atividades.</p>";
    }
  }

  async function carregarResolucoes() {
    listaResolucoes.innerHTML = "<p>Carregando resoluções...</p>";
    try {
      const res = await fetch(`${baseUrl}/api/resolucoes/aluno/${aluno.id}`);
      const resolucoes = await res.json();

      if (!Array.isArray(resolucoes) || resolucoes.length === 0) {
        listaResolucoes.innerHTML = "<p>Nenhuma resolução enviada ainda.</p>";
        return;
      }

      listaResolucoes.innerHTML = "";
      resolucoes.forEach((r) => {
        const atividade = r.atividadeId || {};
        const card = document.createElement("div");
        card.className = "resolucao-card";
        card.innerHTML = `
          <p><b>Atividade:</b> ${atividade.titulo || "Sem título"}</p>
          <p><b>Matéria:</b> ${atividade.materia || "—"}</p>
          <p><b>Turma:</b> ${atividade.turma || "—"} | <b>Sub-sala:</b> ${atividade.subSala || "—"}</p>
          <p><b>Observação:</b> ${r.observacao || "Nenhuma"}</p>
          ${r.arquivoPath ? `<a href="${r.arquivoPath}" target="_blank" rel="noopener">📄 ${r.arquivoNome}</a>` : ""}
          <button class="btn-excluir" data-id="${r._id}">Excluir</button>
        `;
        listaResolucoes.appendChild(card);
      });

      document.querySelectorAll(".btn-excluir").forEach((btn) => {
        btn.addEventListener("click", async function () {
          if (!confirm("Deseja excluir esta resolução?")) return;
          try {
            const res = await fetch(`${baseUrl}/api/resolucoes/${this.dataset.id}`, { method: "DELETE" });
            if (res.ok) {
              alert("Resolução excluída.");
              carregarResolucoes();
            } else {
              alert("Erro ao excluir resolução.");
            }
          } catch (err) {
            console.error("Erro ao excluir:", err);
            alert("Falha ao excluir resolução.");
          }
        });
      });
    } catch (err) {
      console.error("Erro ao carregar resoluções:", err);
      listaResolucoes.innerHTML = "<p>Erro ao carregar resoluções.</p>";
    }
  }

  carregarAtividades();
  carregarResolucoes();
});
