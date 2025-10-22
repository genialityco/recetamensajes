// src/ui/recipeModal.js

// 💡 Preload de imágenes para que aparezcan nítidas
(() => {
  const imgs = [
    "/pergamino-01.png",
    "/LOGO_RECETA-GONDOLA.png",
    "/LOGOS_GONDOLA.png",
  ];
  imgs.forEach((src) => {
    const i = new Image();
    i.src = src;
  });
})();

// ========== Estilos (pergamino + tipografía manuscrita) ==========
const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&family=Shadows+Into+Light+Two&display=swap');

  :root {
    --pm-bg: rgba(10, 12, 18, 0.55);
    --pm-txt: #2b1a08;
    --pm-sub: #3f2a11;
    --pm-brd: rgba(0,0,0,.2);
    --pm-shadow: 0 20px 50px rgba(0,0,0,.5);

    /* Preparando (overlay) */
    --prep-glass: rgba(35, 38, 50, 0.65);
    --prep-glass-2: rgba(35, 38, 50, 0.85);
    --prep-border: rgba(255,255,255,.12);
    --prep-text: #e8eaf7;
    --prep-sub: #b9bfd8;
    --prep-accent: #8fd3fe;
  }

  .pm-overlay, .pm-modal-backdrop {
    position: fixed; inset: 0;
    display: none; place-items: center;
    z-index: 9998;
    background: radial-gradient(90% 90% at 50% 50%, var(--pm-bg), rgba(10,12,18,.75));
    backdrop-filter: blur(8px);
  }
  .pm-overlay[aria-hidden="false"], .pm-modal-backdrop[aria-hidden="false"] { display: grid; }

  /* ====== Card base (reutilizada) ====== */
  .pm-card {
    border: 1px solid var(--pm-brd);
    border-radius: 16px;
    color: #eaeafb;
    font-family: system-ui, sans-serif;
    animation: pm-pop .22s ease-out both;
    box-shadow: var(--pm-shadow);
    background: rgba(30,30,40,.85);
    padding: 16px 20px;
  }

  .pm-center { display: flex; align-items: center; justify-content: center; gap: 10px; }

  /* ====== Preparando (Overlay) mejorado ====== */
  .pm-prep {
    width: min(560px, 92vw);
    border-radius: 18px;
    border: 1px solid var(--prep-border);
    background:
      linear-gradient(180deg, var(--prep-glass), var(--prep-glass-2)),
      radial-gradient(120% 120% at 10% -10%, rgba(255,255,255,.08), transparent 50%),
      radial-gradient(120% 120% at 110% 120%, rgba(141, 198, 255, .08), transparent 50%);
    box-shadow: 0 18px 60px rgba(0,0,0,.55);
    padding: 18px 18px 16px;
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-areas:
      "icon text"
      "bar  bar";
    column-gap: 14px;
    row-gap: 10px;
    color: var(--prep-text);
  }

  .pm-prep-icon {
    grid-area: icon;
    display: grid; place-items: center;
    width: 40px; height: 40px;
    border-radius: 999px;
    position: relative;
    isolation: isolate;
  }

  /* Spinner con aro y brillo */
  .pm-spin {
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 3px solid rgba(255,255,255,.16);
    border-top-color: var(--prep-accent);
    animation: pm-spin 0.9s linear infinite;
    box-shadow: 0 0 24px rgba(143,211,254,.35);
  }
  .pm-spin::after {
    content: "";
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(143,211,254,.12), transparent 55%);
    filter: blur(4px);
    z-index: -1;
  }

  .pm-prep-texts {
    grid-area: text;
    display: flex; flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .pm-prep-title {
    font-size: 30px; font-weight: 700; letter-spacing: .2px;
    color: var(--prep-text);
  }
  .pm-prep-sub {
    font-size: 20px; line-height: 1.35; color: var(--prep-sub);
  }
  .pm-dots::after {
    content: "…";
    animation: pm-dots 1.8s steps(4,end) infinite;
    display: inline-block;
    overflow: hidden;
    width: 0ch;
  }

  /* Barra de progreso (decorativa/indicativa) */
  .pm-prep-bar {
    grid-area: bar;
    height: 6px;
    background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.05));
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 999px;
    position: relative;
    overflow: hidden;
  }
  .pm-prep-bar > span {
    position: absolute; inset: 0;
    transform: translateX(-60%);
    animation: pm-indet 1.7s ease-in-out infinite;
    background:
      linear-gradient(90deg, transparent, rgba(143,211,254,.35), transparent);
  }

  /* ===== Modal principal (pergamino) ===== */
  .pm-modal {
    position: relative;
    width: 95vw;
    height: 95vh;
    border-radius: 12px;
    border: 1px solid var(--pm-brd);
    box-shadow: var(--pm-shadow);
    background: url("/pergamino-01.png") center/cover no-repeat;
    padding: clamp(30px, 5vmin, 60px);
    color: var(--pm-txt);
    font-family: 'Shadows Into Light Two', cursive;
    font-size: 3vmin;
    line-height: 1.4;
    animation: pm-pop .25s ease-out both;
    overflow: hidden;
  }
  .pm-modal::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1), rgba(0,0,0,0.15));
    pointer-events: none;
  }

  .pm-content-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100%;
    overflow-y: auto;
    padding-right: 15px;
  }

  .pm-title {
    font-family: 'Dancing Script', cursive;
    font-size: 6vmin;
    font-weight: 700;
    margin: 0;
    text-shadow: 1px 1px 3px rgba(0,0,0,.35);
    margin-top: 50px;
  }

  .pm-sub {
    font-size: 3vmin;
    margin-bottom: 3vmin;
    font-style: italic;
    color: var(--pm-sub);
  }

  .pm-section-title {
    margin-top: 3vmin;
    font-weight: 700;
    font-size: 4vmin;
    border-bottom: 2px dashed rgba(0,0,0,0.4);
    display:flex; align-items:center; gap:12px; flex-wrap:wrap;
  }
  .pm-badge {
    font-size: 2.3vmin;
    border: 1px solid rgba(0,0,0,.25);
    background: rgba(255,255,255,.35);
    color: #2b1a08;
    border-radius: 999px;
    padding: .2em .6em;
  }

  /* Lista con marcador compatible */
  .pm-ul {
    margin: 1vmin 0 0 0;
    padding: 0 0 0 4vmin;
    list-style: none;
  }
  .pm-ul li {
    position: relative;
    margin: 0.5vmin 0;
    font-size: 4vmin;
    line-height: 1.2;
  }
  .pm-ul li::before {
    content: "🌿";
    position: absolute;
    left: -2.6vmin;
    top: 0;
    transform: translateX(-30%);
  }

  /* Preparación como párrafo (opcional) */
  .pm-prep-text {
    font-size: 3.2vmin;
    line-height: 1.35;
    white-space: pre-wrap;
  }

  /* ===== Logos en esquinas ===== */
  .pm-logo { position: absolute; top: 0; width: 250px; height: auto; object-fit: contain; filter: drop-shadow(0 2px 6px rgba(0,0,0,.25)); opacity: 0.98; pointer-events: none; }
  .pm-logo.left  { left: clamp(10px, 2vmin, 24px); }
  .pm-logo.right { right: clamp(10px, 2vmin, 24px); }

  /* ===== Botón cerrar ===== */
  .pm-close-btn {
    position: absolute;
    left: clamp(16px, 2.5vmin, 28px);
    bottom: clamp(28px, 2.5vmin, 28px);
    background: rgba(60, 50, 40, 0.6);
    color: var(--pm-txt);
    border: 1px solid rgba(0,0,0,0.3);
    border-radius: 10px;
    padding: 10px 20px;
    font-family: 'Shadows Into Light Two', cursive;
    font-size: 2.6vmin;
    font-weight: 600;
    transition: background .2s ease;
    z-index: 5;
  }
  .pm-close-btn:hover { background: rgba(100, 80, 60, 0.65); }

  /* ===== Anims ===== */
  @keyframes pm-pop { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
  @keyframes pm-spin { to { transform: rotate(360deg); } }
  @keyframes pm-dots { 0% { width: 0ch; } 50% { width: 1ch; } 100% { width: 3ch; } }
  @keyframes pm-indet { 0% { transform: translateX(-60%); } 50% { transform: translateX(0%); } 100% { transform: translateX(120%); } }
`;
document.head.appendChild(style);

// ========== DOM (singleton) ==========
let overlayEl,
  backdropEl,
  _initialized = false;

export function initRecipeModal() {
  if (_initialized) return; // ← evita duplicados
  _initialized = true;

  // Overlay (Preparando...)
  overlayEl = document.createElement("div");
  overlayEl.className = "pm-overlay";
  overlayEl.setAttribute("role", "status");
  overlayEl.setAttribute("aria-hidden", "true");
  overlayEl.innerHTML = `
    <div class="pm-prep" aria-live="polite">
      <div class="pm-prep-icon" aria-hidden="true">
        <div class="pm-spin"></div>
      </div>
      <div class="pm-prep-texts">
        <div class="pm-prep-title" id="pm-prep-overlay-title">Preparando ingredientes<span class="pm-dots"></span></div>
        <div class="pm-prep-sub">Danos un momento mientras preparamos la receta ✨</div>
      </div>
      <div class="pm-prep-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso de preparación">
        <span></span>
      </div>
    </div>
  `;
  document.body.appendChild(overlayEl);

  const BASE = import.meta?.env?.BASE_URL || "/";

  // Modal principal con logos y botón cerrar
  backdropEl = document.createElement("div");
  backdropEl.className = "pm-modal-backdrop";
  backdropEl.setAttribute("aria-hidden", "true");
  backdropEl.innerHTML = `
    <div class="pm-modal" role="dialog" aria-modal="true" aria-labelledby="pm-rec-title">
      <img class="pm-logo left"  src="${BASE}LOGO_RECETA-GONDOLA.png" alt="" />
      <img class="pm-logo right" src="${BASE}LOGOS_GONDOLA.png" alt="" />

      <div class="pm-content-wrapper">
        <h2 id="pm-rec-title" class="pm-title">Receta</h2>

        <div class="pm-section-title">
          <span>Ingredientes</span>
          <span class="pm-badge" id="pm-rec-count" aria-live="polite">0</span>
        </div>
        <ul id="pm-rec-ings" class="pm-ul"></ul>

        <div class="pm-section-title" id="pm-prep-section-title">Preparación</div>
        <p id="pm-rec-prep" class="pm-prep-text"></p>
      </div>
    </div>
  `;
  document.body.appendChild(backdropEl);

  backdropEl.addEventListener("click", (ev) => {
    if (ev.target === backdropEl) closeRecipeModal();
  });
  backdropEl
    .querySelector("#pm-rec-close")
    ?.addEventListener("click", closeRecipeModal);
  window.addEventListener("keydown", (ev) => {
    if (
      ev.key === "Escape" &&
      backdropEl.getAttribute("aria-hidden") === "false"
    ) {
      closeRecipeModal();
    }
  });
}

// ========== Helpers ==========
export function setOverlayVisible(
  visible,
  message = "Preparando ingredientes…"
) {
  if (!overlayEl) return;
  const titleEl = overlayEl.querySelector("#pm-prep-overlay-title");
  if (titleEl) titleEl.textContent = message;
  overlayEl.setAttribute("aria-hidden", visible ? "false" : "true");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Abre el modal con la receta (forma que guarda el admin)
export function openRecipeModal(recipe) {
  if (!backdropEl) return;

  // Oculta overlay si quedó activo
  if (overlayEl) overlayEl.setAttribute("aria-hidden", "true");
  document.documentElement.style.overflow = "hidden";

  // Nota: todo scopeado a backdropEl para evitar choques de IDs
  const title = backdropEl.querySelector("#pm-rec-title");
  const desc = backdropEl.querySelector("#pm-rec-desc");
  const list = backdropEl.querySelector("#pm-rec-ings");
  const count = backdropEl.querySelector("#pm-rec-count");
  const prepTitle = backdropEl.querySelector("#pm-prep-section-title");
  const prep = backdropEl.querySelector("#pm-rec-prep");

  // Título y descripción
  if (title) title.textContent = recipe?.title || "Receta";
  if (desc) desc.textContent = recipe?.description || "";

  // Ingredientes (array de {qty?, name} según admin)
  const items = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  if (list) {
    list.innerHTML = "";
    if (!items.length) {
      const li = document.createElement("li");
      li.textContent = "No hay ingredientes disponibles.";
      list.appendChild(li);
    } else {
      for (const it of items) {
        const qty = it?.qty ? `<strong>${escapeHtml(it.qty)}</strong> ` : "";
        const name = it?.name ? escapeHtml(it.name) : "";
        const li = document.createElement("li");
        li.innerHTML = `<span>${qty}${name}</span>`;
        list.appendChild(li);
      }
    }
  }
  if (count) count.textContent = String(items.length);

  // Preparación (opcional; string libre)
  const prepText = recipe?.preparation ? String(recipe.preparation) : "";
  if (prep) {
    if (prepText.trim()) {
      prepTitle?.removeAttribute("style");
      prep.textContent = prepText; // pre-wrap en CSS
    } else {
      prepTitle?.setAttribute("style", "display:none;");
      prep.textContent = "";
    }
  }

  backdropEl.setAttribute("aria-hidden", "false");
}

export function closeRecipeModal() {
  if (!backdropEl) return;
  backdropEl.setAttribute("aria-hidden", "true");
  document.documentElement.style.overflow = "";
}
