// 1) Api
const API_URL = "https://68c8b054ceef5a150f621527.mockapi.io/api/Clients";

const $ = (s) => document.querySelector(s);
const grid = $("#grid");
const loader = $("#loader");
const statusBox = $("#status");

const show = (el) => el && el.classList.remove("is-hidden");
const hide = (el) => el && el.classList.add("is-hidden");

// Estado para filtros
let allClients = [];

function flashStatus(type = "is-info", text = "", ms = 2200) {
  statusBox.className = `notification ${type}`;
  statusBox.textContent = text;
  show(statusBox);
  setTimeout(() => hide(statusBox), ms);
}

// 2) Tarjetas
function renderCards(clients) {
  grid.innerHTML = "";

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

          <!-- Botones -->
          <div class="buttons are-small">
            <!-- Editar: aún deshabilitado -->
            <button class="button is-warning is-light" disabled title="Próximamente">
              <span class="icon"><i class="fas fa-pen"></i></span>
              <span>Editar</span>
            </button>

            <!-- Eliminar (habilitado) -->
            <button class="button is-danger is-light btn-delete" data-id="${client.id}">
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

// Opciones dinámicas de filtros
function fillFilterOptions(clients) {
  const countrySel = document.querySelector('#filter-country');
  const jobSel = document.querySelector('#filter-job');

  const countries = [...new Set(clients.map(c => c.Country).filter(Boolean))].sort();
  const jobs =   [...new Set(clients.map(c => c.Job_title).filter(Boolean))].sort();

  countrySel.innerHTML = `<option value="">Todos los países</option>` +
    countries.map(c => `<option value="${c}">${c}</option>`).join('');

  jobSel.innerHTML = `<option value="">Todos los puestos</option>` +
    jobs.map(j => `<option value="${j}">${j}</option>`).join('');
}

// Aplicar filtros (nombre, país, puesto)
function applyFilters() {
  const q = (document.querySelector('#search-name')?.value || '').trim().toLowerCase();
  const country = document.querySelector('#filter-country')?.value || '';
  const job = document.querySelector('#filter-job')?.value || '';

  let filtered = allClients;

  if (q) filtered = filtered.filter(c => (c.name || '').toLowerCase().includes(q));
  if (country) filtered = filtered.filter(c => c.Country === country);
  if (job) filtered = filtered.filter(c => c.Job_title === job);

  if (filtered.length === 0) {
    statusBox.className = "notification is-warning";
    statusBox.textContent = "No se encontraron resultados con esos filtros.";
    show(statusBox);
  } else {
    hide(statusBox);
  }

  renderCards(filtered);
}

// Eliminar con confirm que incluye el nombre
async function deleteClient(id, btnRef) {
  const client = allClients.find(c => String(c.id) === String(id));
  const msg = client?.name
    ? `¿Seguro que quieres eliminar a ${client.name}?`
    : "¿Seguro que quieres eliminar este perfil?";
  const ok = confirm(msg);
  if (!ok) return;

  // feedback en el botón
  btnRef?.classList.add("is-loading");
  btnRef?.setAttribute("disabled", "true");

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Actualizando estado local
    allClients = allClients.filter(c => String(c.id) !== String(id));

    applyFilters(); // re-render con filtros actuales

    flashStatus("is-success", "Perfil eliminado correctamente.");
  } catch (err) {
    console.error("Error al eliminar:", err);
    flashStatus("is-danger", "No se pudo eliminar el perfil.");
    // reactivar botón si hubo error
    btnRef?.classList.remove("is-loading");
    btnRef?.removeAttribute("disabled");
  }
}

// Clicks en el grid
function attachGridEvents() {
  grid.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".btn-delete");
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    deleteClient(id, btn);
  });
}

// Eventos de filtros + burger
function setupFilterEvents() {
  const inputName = document.querySelector('#search-name');
  const selCountry = document.querySelector('#filter-country');
  const selJob = document.querySelector('#filter-job');
  const btnClear = document.querySelector('#btn-clear');

  inputName?.addEventListener('input', applyFilters);
  selCountry?.addEventListener('change', applyFilters);
  selJob?.addEventListener('change', applyFilters);

  btnClear?.addEventListener('click', () => {
    if (inputName) inputName.value = '';
    if (selCountry) selCountry.value = '';
    if (selJob) selJob.value = '';
    applyFilters();
  });

  // Navbar burger (móvil)
  const burger = document.querySelector('.navbar-burger');
  const menu = document.querySelector('#navMenu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('is-active');
      menu.classList.toggle('is-active');
    });
  }
}

// 3) Carga inicial
document.addEventListener("DOMContentLoaded", () => {
  hide(statusBox);
  hide(loader);
  setupFilterEvents();
  attachGridEvents();
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
