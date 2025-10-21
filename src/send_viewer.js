// src/send_viewer.js
import { db } from "./firebase/config.js";
import { ref as dbRef, onValue } from "firebase/database";

import {
  initRecipeModalSend,
  setOverlayVisibleSend,
  openRecipeModalSend,
  closeRecipeModalSend,
} from "./ui/recipeModalSend.js";

// Inicializa overlay + modal (solo preparación)
initRecipeModalSend();

// Observa /controls
const controlsRef = dbRef(db, "controls");
onValue(controlsRef, (snap) => {
  const c = snap.val() || {};
  const status = c.status || "idle";
  const locked = !!c.locked;
  const recipe = c.recipe || null;

  const isResetting = status === "resetting";
  const isPreparing = status === "preparing";

  // Overlay si está bloqueado/preparando/resetting y aún no hay receta
  const shouldOverlay = (locked || isPreparing || isResetting) && !recipe;
  setOverlayVisibleSend(
    shouldOverlay,
    isResetting
      ? "Reiniciando caldero…"
      : isPreparing
      ? "Preparando receta final…"
      : "Cerrando caldero…"
  );

  // Modal (solo preparación) cuando hay receta lista
  if (recipe && status === "ready") {
    openRecipeModalSend(recipe);
  } else {
    closeRecipeModalSend();
  }
});
