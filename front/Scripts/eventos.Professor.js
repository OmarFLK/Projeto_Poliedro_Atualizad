document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = window.location.origin.replace(/:\d+$/, ":3000");
  const form = document.getElementById("eventForm");
  const listaEventos = document.getElementById("lista-eventos");
  const btnLimpar = document.getElementById("limpar-evento");

  async function carregarEventos() {
    listaEventos.innerHTML = "<p>Carregando eventos...</p>";

    try {
      const res = await fetch(`${baseUrl}/api/eventos`, {
        credentials: "include"
      });

      const eventos = await res.json();

      if (!Array.isArray(eventos) || eventos.length === 0) {
        listaEventos.innerHTML = "<p>Nenhum evento publicado ainda.</p>";
        return;
      }

      listaEventos.innerHTML = "";

      eventos.forEach((e) => {
        const card = document.createElement("div");
        card.className = "event-card";

        card.innerHTML = `
          <h3>${e.titulo}</h3>
          <p><b>Data:</b> ${new Date(e.data).toLocaleDateString("pt-BR")}</p>
          ${e.horario ? `<p><b>Horário:</b> ${e.horario}</p>` : ""}
          ${e.local ? `<p><b>Local:</b> ${e.local}</p>` : ""}
          <p><b>Turma:</b> ${e.turma}</p>
          <p><b>Professor:</b> ${e.professor}</p>
          <p>${e.descricao}</p>
          ${
            e.arquivoPath
              ? `<a href="${e.arquivoPath}" target="_blank" rel="noopener">📎 ${e.arquivoNome}</a>`
              : ""
          }
          <button class="btn-excluir" data-id="${e._id}">Excluir</button>
        `;

        listaEventos.appendChild(card);
      });

      document.querySelectorAll(".btn-excluir").forEach((btn) => {
        btn.addEventListener("click", async function () {
          if (!confirm("Deseja excluir este evento?")) return;

          const id = this.dataset.id;

          await fetch(`${baseUrl}/api/eventos/${id}`, {
            method: "DELETE",
            credentials: "include"
          });

          carregarEventos();
        });
      });

    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      listaEventos.innerHTML = "<p>Erro ao carregar eventos.</p>";
    }
  }

  // ENVIAR EVENTO
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("titulo", form.title.value);
    fd.append("data", form.date.value);
    fd.append("horario", form.hora.value);
    fd.append("local", form.local.value);
    fd.append("descricao", form.description.value);
    fd.append("turma", form.turma.value);
    fd.append("professor", form.professor.value);
    if (form.arquivo.files[0]) fd.append("arquivo", form.arquivo.files[0]);

    try {
      const res = await fetch(`${baseUrl}/api/eventos`, {
        method: "POST",
        body: fd,
        credentials: "include"
      });

      if (res.ok) {
        alert("Evento postado com sucesso!");
        form.reset();
        carregarEventos();
      } else {
        alert("Erro ao postar evento.");
      }
    } catch (err) {
      console.error("Erro ao enviar evento:", err);
      alert("Erro de conexão com o servidor.");
    }
  });

  btnLimpar.addEventListener("click", () => form.reset());

  carregarEventos();
});
