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

// --- 1) PIXI APP ---
await initApp();

// --- 2) Bowl virtual (coincide con tu arte) ---
const bowlArea = {
  centerX: () => screen().width * 0.52,
  rimY: () => screen().height * 0.68,
  spawnW: () => screen().width * 0.32,
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
const testButton = document.createElement("button");
testButton.innerText = "📩 Add Test Message";
testButton.style.cssText = `
  position:fixed; top:20px; right:20px; z-index:9998;
  padding:10px 15px; font-size:14px; background:#00aaff; color:white;
  border:none; border-radius:8px; cursor:pointer;
`;
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
  addLegendEntry(name, message);
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

  if (recipe && status === "ready") {
    openRecipeModal(recipe);
  } else {
    closeRecipeModal();
  }
});
