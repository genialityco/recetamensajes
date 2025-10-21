// src/audio/sounds.js
let unlocked = false;

// Prepara un <audio> base y permite polifonía clonando el nodo
const popBase = new Audio("/pop.mp3");
popBase.preload = "auto";
popBase.volume = 0.9;

// Desbloqueo por primera interacción (autoplay policies)
function unlock() {
  if (unlocked) return;
  // Intento de play/pause rápido para “primar” el audio
  popBase
    .play()
    .then(() => {
      popBase.pause();
      popBase.currentTime = 0;
      unlocked = true;
    })
    .catch(() => {
      // Si falla, igual marcamos la interacción y que el siguiente play lo resuelva
      unlocked = true;
    });
  window.removeEventListener("click", unlock);
  window.removeEventListener("touchstart", unlock);
}

export function initSound() {
  window.addEventListener("click", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
  // Si el navegador permite autoplay, genial:
  popBase
    .play()
    .then(() => {
      popBase.pause();
      popBase.currentTime = 0;
      unlocked = true;
    })
    .catch(() => {
      /* se desbloqueará con el primer click/touch */
    });
}

export function playPop() {
  // Si aún no está desbloqueado, igual intentamos (no rompe nada)
  const s = popBase.cloneNode(); // nuevo reproductor para permitir solapes
  s.volume = popBase.volume;
  s.play().catch(() => {
    /* ignorar bloqueo; se desbloqueará al tocar */
  });
}
