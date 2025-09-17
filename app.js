// 1) Api
const API_URL = "https://68c8b054ceef5a150f621527.mockapi.io/api/Clients";

const $ = (s) => document.querySelector(s);
const grid = $("#grid");
const loader = $("#loader");
const statusBox = $("#status");

const show = (el) => el && el.classList.remove("is-hidden");
const hide = (el) => el && el.classList.add("is-hidden");

let allClients = [];

// 2) Tarjetas
function renderCards(clients) {
  grid.innerHTML = ""; // Limpiamos el contenedor

  clients.forEach((client) => {
    const column = document.createElement("div");
    column.className = "column is-one-quarter-desktop is-half-tablet";

    const name = client.name ?? "Sin nombre";
    const avatar = client.avatar ?? `https://i.pravatar.cc/128?u=${client.id}`;
    const job = client.Job_title ?? "";
    const country = client.Country ?? "";

    column.innerHTML = `
      <div class="card">
        <!-- Avatar -->
        <div class="card-image has-text-centered p-4">
          <figure class="image is-128x128 is-inline-block">
            <img class="is-rounded" src="${avatar}" alt="${name}">
          </figure>
        </div>

        <!-- Contenido -->
        <div class="card-content">
          <p class="title is-5 mb-1">${name}</p>
          ${job ? `<p class="subtitle is-6">${job}</p>` : ""}

          <!-- Tags -->
          <div class="tags mb-3">
            ${job ? `<span class="tag is-link is-light">${job}</span>` : ""}
            ${country ? `<span class="tag is-info is-light">${country}</span>` : ""}
          </div>

          <!-- Botones (CRUD: aún deshabilitados) -->
          <div class="buttons are-small">
            <button class="button is-warning is-light" disabled title="Próximamente">
              <span class="icon"><i class="fas fa-pen"></i></span>
              <span>Editar</span>
            </button>
            <button class="button is-danger is-light" disabled title="Próximamente">
              <span class="icon"><i class="fas fa-trash"></i></span>
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(column);
  });
}

function fillFilterOptions(clients) {
  const countrySel = document.querySelector('#filter-country');
  const jobSel = document.querySelector('#filter-job');

  const countries = [...new Set(clients.map(c => c.Country).filter(Boolean))].sort();
  const jobs = [...new Set(clients.map(c => c.Job_title).filter(Boolean))].sort();

  countrySel.innerHTML = `<option value="">Todos los países</option>` +
    countries.map(c => `<option value="${c}">${c}</option>`).join('');

  jobSel.innerHTML = `<option value="">Todos los puestos</option>` +
    jobs.map(j => `<option value="${j}">${j}</option>`).join('');
}


// 3) Carga inicial
document.addEventListener("DOMContentLoaded", () => {
  hide(statusBox);
  hide(loader);
  fetchAll();
});

// 4) Fetch + estados
async function fetchAll() {
  show(loader);
  hide(statusBox);
  grid.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}?page=1&limit=1000`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    console.log("🟢 Datos recibidos:", data);

    allClients = data;           
    fillFilterOptions(data);     
    renderCards(data);

    if (!Array.isArray(data) || data.length === 0) {
      statusBox.className = "notification is-warning";
      statusBox.textContent = "Sin resultados";
      show(statusBox);
    }
  } catch (err) {
    console.error("🔴 Error:", err);
    statusBox.className = "notification is-danger";
    statusBox.textContent = "No se pudo cargar la información.";
    show(statusBox);
  } finally {
    hide(loader);
  }
}
