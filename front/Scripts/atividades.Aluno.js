// front/Scripts/atividades.Aluno.js
document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = window.location.origin.replace(/:\d+$/, ":3000");
  const listaAtividades = document.getElementById("lista-atividades");
  const listaResolucoes = document.getElementById("lista-resolucoes");

  // PEGA O ALUNO CERTO
  let aluno = null;
  try {
    aluno = JSON.parse(localStorage.getItem("usuarioAluno") || "null");
  } catch {
    aluno = null;
  }

  console.log("[Aluno] localStorage.usuarioAluno =", aluno);

  if (!aluno || !aluno.id) {
    listaAtividades.innerHTML = "<p>Faça login para ver suas atividades.</p>";
    listaResolucoes.innerHTML = "<p>Faça login para ver suas resoluções.</p>";
    return;
  }

  // CARREGAR ATIVIDADES DO ALUNO
  async function carregarAtividades() {
    listaAtividades.innerHTML = "<p>Carregando atividades...</p>";

    try {
      const query = `?turma=${encodeURIComponent(aluno.turma)}&subSala=${encodeURIComponent(aluno.subSala)}`;
      const res = await fetch(`${baseUrl}/api/atividades${query}`, {
        credentials: "include"
      });

      const atividades = await res.json();

      if (!Array.isArray(atividades) || atividades.length === 0) {
        listaAtividades.innerHTML = "<p>Nenhuma atividade disponível.</p>";
        return;
      }

      listaAtividades.innerHTML = "";

      atividades.forEach((a) => {
        const card = document.createElement("article");
        card.className = "tarefa";

        card.innerHTML = `
          <div class="tarefa-info">
            <b>Turma:</b> ${a.turma} | <b>Sub-sala:</b> ${a.subSala} | <b>Matéria:</b> ${a.materia}
          </div>
          <h3>${a.titulo}</h3>
          <p>${a.descricao || ""}</p>
          ${a.arquivoPath ? `<a href="${a.arquivoPath}" target="_blank">📎 ${a.arquivoNome}</a>` : ""}
          <div class="upload-area">
            <textarea class="obs-input" placeholder="Observação (opcional)"></textarea>
            <input type="file" class="file-input" />
            <button class="btn-resolver" data-id="${a._id}">Enviar resolução</button>
          </div>
        `;

        listaAtividades.appendChild(card);
      });

      // Envio da resolução
      document.querySelectorAll(".btn-resolver").forEach((btn) => {
        btn.addEventListener("click", async function () {
          const card = this.closest(".tarefa");
          const obs = card.querySelector(".obs-input").value.trim();
          const arquivo = card.querySelector(".file-input").files[0];

          if (!obs && !arquivo) {
            alert("Envie um arquivo ou escreva uma observação.");
            return;
          }

          const fd = new FormData();
          fd.append("atividadeId", this.dataset.id);
          fd.append("alunoId", aluno.id);
          fd.append("nomeAluno", aluno.nome);
          fd.append("raAluno", aluno.ra);
          fd.append("turma", aluno.turma);
          fd.append("subSala", aluno.subSala);
          fd.append("observacao", obs);
          if (arquivo) fd.append("arquivo", arquivo);

          const res = await fetch(`${baseUrl}/api/resolucoes`, {
            method: "POST",
            body: fd,
            credentials: "include"
          });

          if (res.ok) {
            alert("Resolução enviada!");
            carregarResolucoes();
          } else {
            alert("Erro ao enviar resolução.");
          }
        });
      });
    } catch (err) {
      console.error(err);
      listaAtividades.innerHTML = "<p>Erro ao carregar atividades.</p>";
    }
  }

  // CARREGAR RESOLUÇÕES DO PRÓPRIO ALUNO
  async function carregarResolucoes() {
    listaResolucoes.innerHTML = "<p>Carregando resoluções...</p>";

    try {
      const res = await fetch(`${baseUrl}/api/resolucoes/aluno/${aluno.id}`, {
        credentials: "include"
      });

      const lista = await res.json();

      if (!Array.isArray(lista) || lista.length === 0) {
        listaResolucoes.innerHTML = "<p>Nenhuma resolução enviada.</p>";
        return;
      }

      listaResolucoes.innerHTML = "";
      lista.forEach((r) => {
        const atividade = r.atividadeId || {};
        const card = document.createElement("div");
        card.className = "resolucao-card";

        card.innerHTML = `
          <p><b>Atividade:</b> ${atividade.titulo || "Sem título"}</p>
          <p><b>Matéria:</b> ${atividade.materia || "—"}</p>
          <p><b>Turma:</b> ${r.turma} | <b>Sub-sala:</b> ${r.subSala}</p>
          <p><b>Observação:</b> ${r.observacao || "Nenhuma"}</p>
          ${r.arquivoPath ? `<a href="${r.arquivoPath}" target="_blank">📄 ${r.arquivoNome}</a>` : ""}
        `;

        listaResolucoes.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      listaResolucoes.innerHTML = "<p>Erro ao carregar resoluções.</p>";
    }
  }

  carregarAtividades();
  carregarResolucoes();
});
