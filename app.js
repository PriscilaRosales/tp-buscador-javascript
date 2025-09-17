// 1)
const API_URL = "https://68c8b054ceef5a150f621527.mockapi.io/api/Clients";

const $ = (s) => document.querySelector(s);
const grid = $("#grid");
const loader = $("#loader");
const statusBox = $("#status");

const show = (el) => el && el.classList.remove("is-hidden");
const hide = (el) => el && el.classList.add("is-hidden");

// 2) 
document.addEventListener("DOMContentLoaded", () => {
  hide(statusBox);
  hide(loader);
  fetchAll();
});

// 3) Fetch 
async function fetchAll() {
  show(loader);
  hide(statusBox);
  grid.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}?page=1&limit=1000`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    console.log("🟢 Datos recibidos:", data); // <- verificá esto
    // Próximo paso: renderizar tarjetas con estos datos
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


