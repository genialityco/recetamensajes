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

// Helper espera
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 🔒 Evita navegación por si algo falla antes del listener principal
form.addEventListener("submit", (e) => e.preventDefault(), { once: true });

// Contador de caracteres
const updateCount = () => (charsEl.textContent = String(msgEl.value.length));
msgEl.addEventListener("input", updateCount);
updateCount();

// === SIN rate limit: se permite enviar varias veces ===
// Mantendremos solo un lock temporal mientras dura el retardo + push

// Estado de bloqueo (live) — con try/catch para no romper el módulo si hay error
let remotelyBlocked = false;
try {
  const controlsRef = ref(db, "controls");
  onValue(controlsRef, (snap) => {
    const c = snap.val() || {};
    const locked = !!c.locked;
    const status = c.status || "idle";
    remotelyBlocked = locked || status !== "idle";

    // Si NO estamos en medio de un envío manual, refleja el estado del backend
    if (!btn.dataset.sending) {
      btn.disabled = remotelyBlocked;
      btn.textContent = remotelyBlocked ? "Envíos deshabilitados" : "Enviar 🚀";
    }
  });
} catch (e) {
  console.warn("[send] No se pudo suscribir a /controls:", e);
}

// Listener principal de submit
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();

  // limpiar toast
  toast.textContent = "";
  toast.className = "toast";

  if (remotelyBlocked) {
    toast.textContent = "En este momento los envíos están deshabilitados.";
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
    // Bloqueamos SOLO este envío: permitimos múltiples posteriores
    btn.dataset.sending = "1";
    btn.disabled = true;
    btn.textContent = "Preparando…";

    // Aviso previo durante 2s ANTES de publicar
    toast.textContent = "Mira la pantalla!";
    toast.classList.remove("ok", "err");
    toast.classList.add("info");

    await wait(2000); // ⏳ Retardo deseado

    // Publicar tras el retardo
    await push(ref(db, "potionMessages"), {
      from,
      name,
      message,
      ts: serverTimestamp(),
    });

    // Limpieza UI
    msgEl.value = "";
    updateCount();
    toast.textContent = "¡Enviado! Deberías ver tu ingrediente en pantalla 😉";
    toast.classList.remove("err", "info");
    toast.classList.add("ok");
  } catch (err) {
    console.error(err);
    toast.textContent = "No se pudo enviar. Reintenta.";
    toast.classList.remove("ok", "info");
    toast.classList.add("err");
  } finally {
    // Liberamos el botón salvo que el backend lo haya bloqueado
    delete btn.dataset.sending;
    btn.disabled = remotelyBlocked;
    btn.textContent = remotelyBlocked ? "Envíos deshabilitados" : "Enviar 🚀";
  }
});
