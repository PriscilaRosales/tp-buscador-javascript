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

// Avisos rápidos
function flashStatus(type = "is-info", text = "", ms = 2200) {
  statusBox.className = `notification ${type}`;
  statusBox.textContent = text;
  show(statusBox);
  setTimeout(() => hide(statusBox), ms);
}

// Modal de confirmación (Bulma)
function openConfirmModal(personName = "este perfil") {
  return new Promise((resolve) => {
    const modal = document.querySelector("#confirm-modal");
    const nameSpan = document.querySelector("#confirm-name");
    const btnOk = document.querySelector("#btn-confirm-delete");
    const btnCancel = document.querySelector("#btn-cancel-delete");
    const btnClose = document.querySelector("#confirm-close");
    const bg = modal.querySelector(".modal-background");

    let settled = false;
    const cleanup = () => {
      modal.classList.remove("is-active");
      btnOk.removeEventListener("click", onOk);
      btnCancel.removeEventListener("click", onCancel);
      btnClose.removeEventListener("click", onCancel);
      bg.removeEventListener("click", onCancel);
      document.removeEventListener("keydown", onEsc);
    };
    const onOk = () => { if (!settled) { settled = true; cleanup(); resolve(true); } };
    const onCancel = () => { if (!settled) { settled = true; cleanup(); resolve(false); } };
    const onEsc = (e) => { if (e.key === "Escape") onCancel(); };

    nameSpan.textContent = personName || "este perfil";
    modal.classList.add("is-active");

    btnOk.addEventListener("click", onOk);
    btnCancel.addEventListener("click", onCancel);
    btnClose.addEventListener("click", onCancel);
    bg.addEventListener("click", onCancel);
    document.addEventListener("keydown", onEsc);
  });
}

// --- Crear Cliente (modal + POST) ---

function openCreateModal() {
  const modal = document.querySelector("#create-modal");
  modal.classList.add("is-active");

  const close = () => modal.classList.remove("is-active");

  const btnClose = document.querySelector("#create-close");
  const btnCancel = document.querySelector("#btn-create-cancel");
  const bg = modal.querySelector(".modal-background");

  const onClose = () => {
    btnClose.removeEventListener("click", onClose);
    btnCancel.removeEventListener("click", onClose);
    bg.removeEventListener("click", onClose);
    modal.classList.remove("is-active");
  };

  btnClose.addEventListener("click", onClose);
  btnCancel.addEventListener("click", onClose);
  bg.addEventListener("click", onClose);
}

async function postClient(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function readCreateForm() {
  const form = document.querySelector("#create-form");
  const fd = new FormData(form);
  // Normalizamos campos mínimos del esquema que ya usas
  const name = (fd.get("name") || "").toString().trim();
  if (!name) throw new Error("El nombre es obligatorio");

  return {
    name,
    Job_title: (fd.get("Job_title") || "").toString().trim(),
    Country: (fd.get("Country") || "").toString().trim(),
    Email_address: (fd.get("Email_address") || "").toString().trim(),
    Phone_number: (fd.get("Phone_number") || "").toString().trim(),
    avatar: (fd.get("avatar") || "").toString().trim(),
  };
}

function hookCreateModalEvents() {
  // Abrir modal desde el botón del navbar
  const btnAdd = document.querySelector("#btn-add");
  btnAdd?.addEventListener("click", openCreateModal);

  // Guardar
  const btnSave = document.querySelector("#btn-create-save");
  btnSave?.addEventListener("click", async () => {
    try {
      btnSave.classList.add("is-loading");
      const payload = readCreateForm();

      // avatar por defecto si está vacío
      if (!payload.avatar) {
        payload.avatar = `https://i.pravatar.cc/128?u=${Date.now()}`;
      }

      const created = await postClient(payload);

      // Actualizar estado local y UI
      allClients = [created, ...allClients];
      fillFilterOptions(allClients);  // puede incorporar nuevos países/puestos
      applyFilters();                 // respeta filtros actuales al re-renderizar

      // Cerrar modal y feedback
      document.querySelector("#create-modal").classList.remove("is-active");
      document.querySelector("#create-form").reset();
      flashStatus("is-success", "Cliente creado correctamente.");
    } catch (err) {
      console.error(err);
      flashStatus("is-danger", err.message || "No se pudo crear el cliente.");
    } finally {
      btnSave.classList.remove("is-loading");
    }
  });
}

// --- Editar Cliente (modal + PUT) ---
function openEditModal() {
  const modal = document.querySelector("#edit-modal");
  modal.classList.add("is-active");

  const btnClose = document.querySelector("#edit-close");
  const btnCancel = document.querySelector("#btn-edit-cancel");
  const bg = modal.querySelector(".modal-background");

  const onClose = () => {
    btnClose.removeEventListener("click", onClose);
    btnCancel.removeEventListener("click", onClose);
    bg.removeEventListener("click", onClose);
    modal.classList.remove("is-active");
  };

  btnClose.addEventListener("click", onClose);
  btnCancel.addEventListener("click", onClose);
  bg.addEventListener("click", onClose);
}

function fillEditForm(client) {
  document.querySelector("#edit-id").value = client.id || "";
  document.querySelector("#edit-name").value = client.name || "";
  document.querySelector("#edit-job").value = client.Job_title || "";
  document.querySelector("#edit-country").value = client.Country || "";
  document.querySelector("#edit-email").value = client.Email_address || "";
  document.querySelector("#edit-phone").value = client.Phone_number || "";
  document.querySelector("#edit-avatar").value = client.avatar || "";
}

function readEditForm() {
  const fd = new FormData(document.querySelector("#edit-form"));
  const name = (fd.get("name") || "").toString().trim();
  if (!name) throw new Error("El nombre es obligatorio");

  return {
    id: (fd.get("id") || "").toString(),
    name,
    Job_title: (fd.get("Job_title") || "").toString().trim(),
    Country: (fd.get("Country") || "").toString().trim(),
    Email_address: (fd.get("Email_address") || "").toString().trim(),
    Phone_number: (fd.get("Phone_number") || "").toString().trim(),
    avatar: (fd.get("avatar") || "").toString().trim(),
  };
}

async function putClient(id, payload) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function hookEditEvents() {
  const btnSave = document.querySelector("#btn-edit-save");
  btnSave?.addEventListener("click", async () => {
    try {
      btnSave.classList.add("is-loading");
      btnSave.setAttribute("disabled", "true");

      const payload = readEditForm();
      const updated = await putClient(payload.id, payload);

      // actualizamos el estado local
      allClients = allClients.map(c =>
        String(c.id) === String(updated.id) ? updated : c
      );

      // refrescamos selects (por si cambió País o Puesto) y re-renderizamos
      fillFilterOptions(allClients);
      applyFilters();

      document.querySelector("#edit-modal").classList.remove("is-active");
      flashStatus("is-success", "Cliente actualizado correctamente.");
    } catch (err) {
      console.error(err);
      flashStatus("is-danger", err.message || "No se pudo actualizar el cliente.");
    } finally {
      btnSave.classList.remove("is-loading");
      btnSave.removeAttribute("disabled");
    }
  });
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
        <div class="card-image has-text-centered p-4">
          <figure class="image is-128x128 is-inline-block">
            <img class="is-rounded" src="${avatar}" alt="${name}">
          </figure>
        </div>

        <div class="card-content">
          <p class="title is-5 mb-1">${name}</p>
          ${job ? `<p class="subtitle is-6">${job}</p>` : ""}

          <div class="tags mb-3">
            ${job ? `<span class="tag is-link is-light">${job}</span>` : ""}
            ${country ? `<span class="tag is-info is-light">${country}</span>` : ""}
          </div>

          <div class="buttons are-small">
            <button class="button is-warning is-light btn-edit" data-id="${client.id}">
             <span class="icon"><i class="fas fa-pen"></i></span>
             <span>Editar</span>
            </button>


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

// Eliminar con confirm 
async function deleteClient(id, btnRef) {
  const client = allClients.find(c => String(c.id) === String(id));
  const ok = await openConfirmModal(client?.name);
  if (!ok) return;

  // feedback en el botón
  btnRef?.classList.add("is-loading");
  btnRef?.setAttribute("disabled", "true");

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    allClients = allClients.filter(c => String(c.id) !== String(id));
    applyFilters(); // re-render con los filtros actuales

    flashStatus("is-success", "Perfil eliminado correctamente.");
  } catch (err) {
    console.error("Error al eliminar:", err);
    flashStatus("is-danger", "No se pudo eliminar el perfil.");
    btnRef?.classList.remove("is-loading");
    btnRef?.removeAttribute("disabled");
  }
}

// Delegación de clicks en el grid
function attachGridEvents() {
  grid.addEventListener("click", (ev) => {
    // — Eliminar —
    const del = ev.target.closest(".btn-delete");
    if (del) {
      const id = del.dataset.id;
      if (id) deleteClient(id, del);
      return;
    }

    // — Editar —
    const edit = ev.target.closest(".btn-edit");
    if (edit) {
      const id = edit.dataset.id;
      if (!id) return;

      const client = allClients.find(c => String(c.id) === String(id));
      if (!client) return;

      fillEditForm(client);   // form con datos actuales
      openEditModal();        // abre el modal de edición
      return;
    }
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
  hookCreateModalEvents();  
  hookEditEvents();         
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
