document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = window.location.origin.replace(/:\d+$/, ":3000");
  const eventList = document.getElementById("eventList");

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function criarCard(evento) {
    const card = document.createElement("article");
    card.classList.add("event-card");

    card.innerHTML = `
      <h2 class="event-title">${evento.titulo}</h2>
      <p class="event-date">${formatDate(evento.data)}</p>
      ${evento.horario ? `<p><b>Horário:</b> ${evento.horario}</p>` : ""}
      ${evento.local ? `<p><b>Local:</b> ${evento.local}</p>` : ""}
      <p class="event-desc">${evento.descricao}</p>
      <p><b>Professor:</b> ${evento.professor}</p>
      ${
        evento.arquivoPath
          ? `<p><a href="${evento.arquivoPath}" target="_blank" rel="noopener">📎 ${evento.arquivoNome}</a></p>`
          : ""
      }
    `;

    return card;
  }

  async function carregarEventos() {
    eventList.innerHTML =
      "<p style='text-align:center;color:#888;'>Carregando eventos...</p>";

    try {
      // Pega a turma do aluno logado (salva no localStorage no login)
      const alunoLogado = JSON.parse(localStorage.getItem("usuario"));
      const turmaAluno = alunoLogado?.turma || "";

      // Busca os eventos filtrados pelo back-end
      const res = await fetch(
        `${baseUrl}/api/eventos?turma=${encodeURIComponent(turmaAluno)}`
      );
      const eventos = await res.json();

      if (!Array.isArray(eventos) || eventos.length === 0) {
        eventList.innerHTML =
          "<p style='text-align:center;color:#888;'>Nenhum evento disponível para sua turma.</p>";
        return;
      }

      eventList.innerHTML = "";
      eventos.forEach((ev) => eventList.appendChild(criarCard(ev)));
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      eventList.innerHTML =
        "<p style='text-align:center;color:red;'>Erro ao carregar eventos.</p>";
    }
  }

  carregarEventos();
});
