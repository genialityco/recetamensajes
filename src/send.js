import { db } from "./firebase/config.js";
import { ref, push, serverTimestamp, onValue } from "firebase/database";

// --- DOM refs
const form = document.getElementById("msgForm");
const fromNameEl = document.getElementById("fromName");
const friendNameEl = document.getElementById("friendName");
const msgEl = document.getElementById("message");
const charsEl = document.getElementById("chars");
const btn = document.getElementById("sendBtn");
const toast = document.getElementById("toast");

// 🔒 Evita navegación por si algo falla antes del listener principal
form.addEventListener("submit", (e) => e.preventDefault(), { once: true });

// Contador de caracteres
const updateCount = () => (charsEl.textContent = String(msgEl.value.length));
msgEl.addEventListener("input", updateCount);
updateCount();

// Rate limit (5s)
let lastSent = 0;

// Estado de bloqueo (live) — con try/catch para no romper el módulo si hay error
try {
  const controlsRef = ref(db, "controls");
  onValue(controlsRef, (snap) => {
    const c = snap.val() || {};
    const locked = !!c.locked;
    const status = c.status || "idle";
    const blocked = locked || status !== "idle";
    btn.disabled = blocked;
    btn.textContent = blocked ? "Envíos deshabilitados" : "Enviar 🚀";
  });
} catch (e) {
  console.warn("[send] No se pudo suscribir a /controls:", e);
}

// Listener principal de submit (reemplaza el once anterior)
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  toast.textContent = "";
  toast.className = "toast";

  const now = Date.now();
  if (now - lastSent < 5000) {
    toast.textContent = "Espera unos segundos antes de enviar otro mensaje.";
    toast.classList.add("err");
    return;
  }

  const from = (fromNameEl.value ?? "").trim().slice(0, 24);
  const name = (friendNameEl.value ?? "").trim().slice(0, 24);
  const message = (msgEl.value ?? "").trim().slice(0, 140);

  if (!from || !name || !message) {
    toast.textContent = "Completa los tres campos.";
    toast.classList.add("err");
    return;
  }

  try {
    btn.disabled = true;

    await push(ref(db, "potionMessages"), {
      from,
      name,
      message,
      ts: serverTimestamp(),
    });

    lastSent = now;
    msgEl.value = "";
    updateCount();
    toast.textContent = "¡Enviado! Mira el caldero 😉";
    toast.classList.add("ok");
  } catch (err) {
    console.error(err);
    toast.textContent = "No se pudo enviar. Reintenta.";
    toast.classList.add("err");
  } finally {
    // si el admin bloqueó durante el envío, mantenemos el botón en el estado actual
    // (onValue lo re-sincroniza igual)
    if (!btn.disabled) btn.disabled = false;
  }
});
