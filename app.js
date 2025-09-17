console.log("✅ app.js cargado");

const $ = (s) => document.querySelector(s);
const statusBox = $("#status");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM listo");
  if (statusBox) {
    statusBox.className = "notification is-info";
    statusBox.textContent = "JS conectado correctamente ✅";
  }
});

