// Orquestrador principal en JS
import { initApp, onTick, screen } from "./app/pixiApp.js";
import { addLegendEntry, initLegend } from "./ui/legend.js";
import { initBackground, updateBackground } from "./scene/background.js";
import { initSteam, updateSteam, relayoutSteam } from "./scene/steam.js";
import {
  loadIngredientTextures,
  addIngredient,
  updateIngredients,
} from "./ingredients/ingredients.js";
import { listenPotionMessages } from "./firebase/realtime.js";
import { initQRModal, setQRMode } from "./ui/qrModal.js";

// RTDB para leer /controls (estado de receta)
import { db } from "./firebase/config.js";
import { ref as dbRef, onValue } from "firebase/database";

// ⬇️ NUEVO: UI del overlay + modal (separado en módulo)
import {
  initRecipeModal,
  setOverlayVisible,
  openRecipeModal,
  closeRecipeModal,
} from "./ui/recipeModal.js";
import { initSound } from "./audio/sound.js";

// --- 1) PIXI APP ---
await initApp();

initSound();

initRecipeModal();
initQRModal();

// --- 2) Bowl virtual (coincide con tu arte) ---
const bowlArea = {
  centerX: () => screen().width * 0.52,
  rimY: () => screen().height * 0.68,
  spawnW: () => screen().width * 0.45,
};
const getBowlArea = () => bowlArea;

// --- 3) UI (leyenda) ---
initLegend();

// --- 4) Escena: fondo + vapor ---
await initBackground();
initSteam(getBowlArea);

// --- 5) Ingredientes ---
await loadIngredientTextures();

// --- 6) Firebase RTDB ---
listenPotionMessages(getBowlArea);

// --- 7) Loop de animación ---
let t = 0;
onTick(() => {
  t += 0.016;
  updateBackground(t);
  updateSteam(t);
  updateIngredients(getBowlArea());
});

// --- 8) Resize/layout ---
function layout() {
  relayoutSteam(); // steamLayer a (0,0)
}
layout();
window.addEventListener("resize", layout);

// --- 9) Botón de prueba (opcional) ---
// --- 9) Botón de prueba (casi invisible) ---
const testButton = document.createElement("button");
testButton.innerText = "📩";
testButton.title = "Agregar mensaje de prueba"; // aparece solo al pasar el mouse
testButton.style.cssText = `
  position:fixed; top:14px; right:14px; z-index:9998;
  padding:4px 6px;
  font-size:12px;
  background:#00aaff;
  color:white;
  border:none;
  border-radius:50%;
  opacity:0.08;
  cursor:pointer;
  transition:opacity 0.3s ease;
`;
testButton.onmouseenter = () => (testButton.style.opacity = "0.3");
testButton.onmouseleave = () => (testButton.style.opacity = "0.08");
document.body.appendChild(testButton);


const sampleFrom = ["Ana", "Luis", "Carla", "Pedro", "Sofía"];
const sampleFriends = ["Mauro", "Dani", "Val", "Nico", "Sara"];
const sampleMessages = [
  "¡Esto está genial!",
  "Saludos desde Medellín!",
  "💡 Qué buena idea!",
  "🔥 Increíble evento!",
  "🤖 Amo este robot!",
];
testButton.onclick = () => {
  const from = sampleFrom[Math.floor(Math.random() * sampleFrom.length)];
  const friend =
    sampleFriends[Math.floor(Math.random() * sampleFriends.length)];
  const name = `${from} \u2192 ${friend}`;
  const message =
    sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
  addIngredient({ name, message, bowlArea: getBowlArea() });
  addLegendEntry(name, message,true);
};

/* =========================================================
   Overlay “Preparando…” + Modal de Receta (separado en ./ui/recipeModal.js)
   ========================================================= */

// Inicializa el overlay + modal (el modal ya usa /src/assets/pergamino-01.png internamente)
initRecipeModal();

// Suscripción a /controls
const controlsRef = dbRef(db, "controls");
onValue(controlsRef, (snap) => {
  const c = snap.val() || {};
  const status = c.status || "idle";
  const locked = !!c.locked;
  const recipe = c.recipe || null;

  // === NUEVO: manejar estado del QR ===
  // valores esperados: "modal" | "mini" | "hidden" (por defecto "hidden" si no existe)
  const qrMode = c.qrMode || "hidden";
  setQRMode(qrMode);

  // --- tu overlay "Preparando..." existente ---
  const isResetting = status === "resetting";
  const isPreparing = status === "preparing";
  const shouldOverlay = (locked || isPreparing || isResetting) && !recipe;
  setOverlayVisible(
    shouldOverlay,
    isResetting
      ? "Reiniciando caldero…"
      : isPreparing
      ? "Preparando receta final…"
      : "Cerrando caldero…"
  );

  // --- modal de receta ---
  if (recipe && status === "ready") {
    openRecipeModal(recipe);
  } else {
    closeRecipeModal();
  }
});

/* =========================================================
   Música de fondo (loop)
   ========================================================= */

// Crear y configurar el audio
const bgMusic = new Audio("/musica_fondo.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4; // volumen moderado (0.0–1.0)
bgMusic.preload = "auto";

// ⚠️ Importante: los navegadores bloquean autoplay sin interacción,
// así que esperamos un clic o toque antes de reproducir.
const tryPlay = () => {
  bgMusic.play().catch(() => {}); // silencioso si falla
  document.removeEventListener("click", tryPlay);
  document.removeEventListener("touchstart", tryPlay);
};

// Reintenta reproducir en la primera interacción
document.addEventListener("click", tryPlay);
document.addEventListener("touchstart", tryPlay);

// También intenta reproducir automáticamente si el navegador lo permite
bgMusic.play().catch(() => {
  console.warn("Autoplay bloqueado, se activará al tocar la pantalla.");
});
