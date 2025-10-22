import { db } from "../firebase/config.js";
import {
  ref,
  onChildAdded,
  get,
  child,
  update,
  onValue,
} from "firebase/database";

/* ---------- Helpers ---------- */
function domReady() {
  return new Promise((res) => {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    )
      res();
    else document.addEventListener("DOMContentLoaded", res, { once: true });
  });
}
function byId(id) {
  const el = document.getElementById(id);
  if (!el) console.error(`[admin] No se encontró #${id} en el DOM`);
  return el;
}
function flash(el, txt = "OK") {
  if (!el) return;
  const old = el.textContent;
  el.textContent = txt;
  setTimeout(() => (el.textContent = old), 1200);
}
const toISO = (ts) => (ts ? new Date(ts).toLocaleString() : "");

/* ---------- Estado ---------- */
let allMsgs = []; // {id, from, name, message, ts}

/* ---------- Boot ---------- */
(async function boot() {
  await domReady();

  // Captura de elementos
  const $copyPlain = byId("copyPlain");
  const $countPill = byId("countPill");
  const $lockPill = byId("lockPill");

  const $btnLock = byId("btnLock");
  const $btnIdle = byId("btnIdle");
  const $btnPrep = byId("btnPrep");
  const $btnClear = byId("btnClear");
  const $btnReset = byId("btnReset");
  const $btnQRMode = byId("btnQRMode");

  const $recTitle = byId("recTitle");
  const $recDesc = byId("recDesc");
  const $recIngredients = byId("recIngredients");
  const $recPreparation = byId("recPreparation");
  const $btnPublish = byId("btnPublish");

  if (!$copyPlain || !$btnPublish) {
    console.error("[admin] Faltan elementos requeridos en el DOM.");
    return;
  }

  /* ----- Utils ----- */
  function normalizeMsg(id, v) {
    return {
      id,
      from: String(v?.from ?? "").trim(),
      name: String(v?.name ?? v?.friendName ?? "").trim(),
      message: String(v?.message ?? "").trim(),
      ts: typeof v?.ts === "number" ? v.ts : Date.now(),
    };
  }
  function sortByRecent(list) {
    const s = [...list];
    s.sort((a, b) => b.ts - a.ts);
    return s;
  }
  function updateCount() {
    if ($countPill) $countPill.textContent = `${allMsgs.length} mensajes`;
  }

  // Construir texto IA:
  //   "Ana - Mauro: ¡Esto está genial!, Pedro - Val: Me gustó..., ..."
  //   + PROMPT al final.
  function buildPromptText() {
    if (!allMsgs.length) {
      return "No hay mensajes para analizar todavía.";
    }
    const pieces = sortByRecent(allMsgs).map((m) => {
      const from = m.from || "Anon";
      const name = m.name || "—";
      const msg = m.message || "…";
      return `${from} - ${name}: ${msg}`;
    });
    const mensajePlano = pieces.join(", ");
    const prompt =
      "A partir de los siguientes mensajes, identifica 5 ideas centrales o más repetidas y redáctalas en forma de receta de cocina con el siguiente formato exacto, decorada con emojis relacionados con la emoción o el contenido del texto: " +
      "Titulo: ---titulo--- 🍽️. " +
      "Descripcion: ---descripcion--- ✨. " +
      "Lista de ingredientes: muestra la cantidad y el nombre de cada ingrediente en viñetas o guiones, agregando un emoji culinario o emocional por ingrediente. " +
      "Preparacion: escribe solo la preparación en un solo párrafo, combinando las ideas como si fueran ingredientes de una receta, sin saltos de línea ni numeraciones adicionales, y utiliza algunos emojis coherentes para reforzar el tono del texto.";

    const texto = `${mensajePlano}${
      /[.!?]$/.test(mensajePlano) ? "" : "."
    }${prompt}`;
    return texto;
  }

  async function copyPlain() {
    const text = buildPromptText();
    try {
      await navigator.clipboard.writeText(text);
      flash($copyPlain, "¡Copiado!");
    } catch (e) {
      console.warn("[admin] Clipboard API falló, intenta Ctrl+C", e);
    }
  }

  /* ----- Controls (RTDB) ----- */
  const controlsRef = ref(db, "controls");

  // Helpers QR
  const labelForQR = (mode) =>
    mode === "mini"
      ? "QR: Mini"
      : mode === "hidden"
      ? "QR: Oculto"
      : "QR: Modal";

  async function setQRMode(mode /* 'modal' | 'mini' | 'hidden' */) {
    await update(controlsRef, { qrMode: mode, updatedAt: Date.now() });
  }

  onValue(controlsRef, (snap) => {
    const c = snap.val() || {};
    const locked = !!c.locked;
    if ($lockPill) {
      $lockPill.textContent = locked
        ? "Envíos bloqueados"
        : "Envíos habilitados";
      $lockPill.style.borderColor = locked ? "#ef4444" : "#2a2b45";
    }
    // Reflejar estado actual del QR en el botón
    const qrMode = c.qrMode || "modal"; // default: modal
    if ($btnQRMode) $btnQRMode.textContent = labelForQR(qrMode);
  });

  async function setLocked(locked) {
    await update(controlsRef, { locked, updatedAt: Date.now() });
  }
  async function setStatus(status) {
    await update(controlsRef, { status, updatedAt: Date.now() });
  }
  async function clearRecipe() {
    await update(controlsRef, {
      recipe: null,
      status: "idle",
      locked: false,
      updatedAt: Date.now(),
    });
  }
  async function publishRecipe() {
    const title = ($recTitle?.value || "").trim();
    const description = ($recDesc?.value || "").trim();
    const preparation = ($recPreparation?.value || "").trim();
    const ingredients = ($recIngredients?.value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/\s+/);
        const qtyMaybe = parts[0];
        if (
          /\d/.test(qtyMaybe) ||
          /cdtas?|tazas?|gr|g|ml|porciones?/i.test(qtyMaybe)
        ) {
          return { qty: qtyMaybe, name: parts.slice(1).join(" ") || qtyMaybe };
        }
        return { name: line };
      });

    const recipe = { title, description, ingredients, preparation };
    await update(controlsRef, {
      recipe,
      status: "ready",
      locked: true,
      updatedAt: Date.now(),
    });
  }

  // Reinicio total
  async function resetAll({ archive = true } = {}) {
    await update(ref(db, "controls"), {
      status: "resetting",
      locked: true,
      updatedAt: Date.now(),
    });

    if (archive) {
      const snap = await get(ref(db, "potionMessages"));
      const data = snap.val() || {};
      const count = Object.keys(data).length;
      const now = Date.now();
      await update(ref(db), {
        [`archives/${now}/messages`]: data,
        [`archives/${now}/meta`]: { count, at: now },
      });
    }

    await update(ref(db), {
      potionMessages: null,
      "controls/recipe": null,
      "controls/status": "idle",
      "controls/locked": false,
      "controls/updatedAt": Date.now(),
    });

    // Limpia memoria local
    allMsgs = [];
    updateCount();
  }

  /* ----- Carga inicial + live ----- */
  async function loadAllOnce() {
    const snap = await get(child(ref(db), "potionMessages"));
    const val = snap.val() || {};
    allMsgs = Object.entries(val).map(([id, v]) => normalizeMsg(id, v));
    updateCount();
  }
  function listenLive() {
    const r = ref(db, "potionMessages");
    onChildAdded(r, (snap) => {
      const id = snap.key;
      const msg = normalizeMsg(id, snap.val());
      if (!allMsgs.find((x) => x.id === id)) {
        allMsgs.push(msg);
        updateCount();
      }
    });
  }

  /* ----- Eventos ----- */
  $copyPlain?.addEventListener("click", () => copyPlain());

  byId("btnLock")?.addEventListener("click", async () => {
    try {
      const snap = await get(controlsRef);
      const locked = !!snap.val()?.locked;
      await setLocked(!locked);
      flash(byId("btnLock"), locked ? "Desbloqueado" : "Bloqueado");
    } catch (e) {
      console.error(e);
      flash(byId("btnLock"), "Error");
    }
  });
  $btnIdle?.addEventListener("click", async () => {
    try {
      await setStatus("idle");
      flash($btnIdle, "OK");
    } catch (e) {
      console.error(e);
      flash($btnIdle, "Error");
    }
  });
  $btnPrep?.addEventListener("click", async () => {
    try {
      await setStatus("preparing");
      flash($btnPrep, "OK");
    } catch (e) {
      console.error(e);
      flash($btnPrep, "Error");
    }
  });
  $btnClear?.addEventListener("click", async () => {
    try {
      await clearRecipe();
      flash($btnClear, "Limpiado");
    } catch (e) {
      console.error(e);
      flash($btnClear, "Error");
    }
  });
  $btnReset?.addEventListener("click", async () => {
    const ok = confirm(
      "Esto reiniciará el caldero: archivará, borrará mensajes y limpiará la receta. ¿Continuar?"
    );
    if (!ok) return;
    try {
      await resetAll({ archive: true });
      flash($btnReset, "¡Reiniciado!");
    } catch (e) {
      console.error(e);
      flash($btnReset, "Error");
    }
  });

  byId("btnPublish")?.addEventListener("click", async () => {
    try {
      await publishRecipe();
      flash($btnPublish, "¡Publicado!");
    } catch (e) {
      console.error(e);
      flash($btnPublish, "Error");
    }
  });

  // Alternar QR: modal ↔ mini (si quieres ciclo con 'hidden', cambia el next)
  $btnQRMode?.addEventListener("click", async () => {
    try {
      const snap = await get(controlsRef);
      const cur = snap.val()?.qrMode || "hidden";
      const order = ["modal", "mini", "hidden"];
      const next = order[(order.indexOf(cur) + 1) % order.length];
      await setQRMode(next);
      flash($btnQRMode, labelForQR(next)); // feedback rápido
    } catch (e) {
      console.error(e);
      flash($btnQRMode, "Error");
    }
  });

  /* ----- Arranque ----- */
  try {
    await loadAllOnce();
    listenLive();
    console.log("[admin] listo ✅");
  } catch (e) {
    console.error("[admin] error al iniciar:", e);
  }
})();
