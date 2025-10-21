// src/firebase/realtime.js
import { ref, onChildAdded, remove, off } from "firebase/database";
import { db } from "./config.js";
import { addIngredient } from "../ingredients/ingredients.js";
import { addLegendEntry } from "../ui/legend.js";

/**
 * Escucha mensajes en RTDB y los inyecta en la escena + leyenda.
 * @param {() => {centerX:Function, rimY:Function, spawnW:Function}} getBowlArea
 * @returns {() => void} función para desuscribirse
 */
export function listenPotionMessages(getBowlArea) {
  const messagesRef = ref(db, "potionMessages");

  const handler = async (snap) => {
    const val = snap.val() || {};

    // Campos esperados desde send.js
    const from = String(val.from ?? "")
      .trim()
      .slice(0, 24);
    // usamos `name` y mantenemos fallback a `friendName` por compatibilidad
    const friend = String(val.name ?? val.friendName ?? "")
      .trim()
      .slice(0, 24);
    const message = String(val.message ?? "…")
      .trim()
      .slice(0, 140);

    if (!from && !friend && !message) return; // nada útil

    const displayName =
      [from, friend].filter(Boolean).join(" \u2192 ") || "Anon";

    // Añadir al caldero y a la leyenda
    addIngredient({ name: displayName, message, bowlArea: getBowlArea() });
    addLegendEntry(displayName, message);

    // Consumir mensaje (cola simple)
    // Comentado ay no se borra: así los mensajes permanecen en RTDB
    // try {
    //   await remove(snap.ref);
    // } catch {}
  };

  onChildAdded(messagesRef, handler);

  // devolver un "unsubscribe"
  return () => off(messagesRef, "child_added", handler);
}
