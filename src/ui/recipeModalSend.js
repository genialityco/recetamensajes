// src/ui/recipeModalSend.js

// 💡 Preload del pergamino y los logos
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

// ===== Estilos (pergamino + manuscrita) =====
const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Shadows+Into+Light+Two&display=swap');

  :root {
    --pmu-bg: rgba(10, 12, 18, 0.55);
    --pmu-ink: #2b1a08;
    --pmu-ink-sub: #3f2a11;
    --pmu-brd: rgba(0,0,0,.2);
    --pmu-shadow: 0 20px 50px rgba(0,0,0,.5);
  }

  .pmu-overlay, .pmu-backdrop {
    position: fixed; inset: 0;
    display: none; place-items: center;
    z-index: 20000;
    background:
      linear-gradient(0deg, rgba(0,0,0,.35), rgba(0,0,0,.35)),
      radial-gradient(90% 90% at 50% 50%, var(--pmu-bg), rgba(10,12,18,.75));
    backdrop-filter: blur(8px);
  }
  .pmu-overlay[aria-hidden="false"],
  .pmu-backdrop[aria-hidden="false"] { display: grid; }

  /* Overlay "Preparando..." */
  .pmu-card {
    background: rgba(20, 22, 33, .9);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 14px;
    color: #eaeafb;
    padding: 16px 18px;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    box-shadow: var(--pmu-shadow);
    animation: pmu-pop .22s ease-out both;
    max-width: 92vw;
  }
  .pmu-center { display: flex; align-items: center; gap: 10px; }
  .pmu-spin {
    width: 18px; height: 18px; border-radius: 50%;
    border: 3px solid rgba(255,255,255,.25);
    border-top-color: #7dd3fc;
    animation: pmu-spin 1s linear infinite;
  }
  .pmu-title { font-weight: 800; font-size: 18px; margin: 0 0 2px; }
  .pmu-sub { font-size: 13px; color: #b8b9d4; margin: 0; }

  /* Modal pergamino */
  .pmu-modal {
    width: 95vw; height: 95vh;
    border: 1px solid var(--pmu-brd);
    border-radius: 12px;
    box-shadow: var(--pmu-shadow);
    background: url("/pergamino-01.png") center/cover no-repeat;
    padding: clamp(24px, 4vmin, 40px);
    position: relative;
    animation: pmu-pop .25s ease-out both;
    color: var(--pmu-ink);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .pmu-modal::after {
    content: "";
    position: absolute; inset: 0;
    border-radius: 12px;
    background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1), rgba(0,0,0,0.15));
    pointer-events: none;
  }

  /* Logos en esquinas */
  .pmu-logo {
    position: absolute;
    top: 2%;
    width: 150px;
    height: auto;
    object-fit: contain;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,.25));
    opacity: 0.98;
    pointer-events: none;
  }
  .pmu-logo.left  { left: clamp(10px, 2vmin, 24px); }
  .pmu-logo.right { right: clamp(10px, 2vmin, 24px); }

  .pmu-head { margin-top: 60px; margin-bottom: 2vmin; text-align: center; }
  .pmu-rec-title {
    margin: 0;
    font-family: 'Dancing+Script', cursive;
    font-size: clamp(22px, 5.2vmin, 36px);
    font-weight: 700;
    text-shadow: 1px 1px 3px rgba(0,0,0,.25);
    letter-spacing: .3px;
  }

  .pmu-body {
    position: relative;
    overflow: auto;
    flex: 1;
    padding-right: 8px;
    mask-image: linear-gradient(180deg, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
  }

  .pmu-prep-label {
    margin: 10px 0 8px;
    font-weight: 800;
    color: var(--pmu-ink-sub);
    font-size: clamp(16px, 3.8vmin, 22px);
    border-bottom: 2px dashed rgba(0,0,0,.25);
    padding-bottom: 6px;
    font-family: 'Shadows Into Light Two', cursive;
  }
  .pmu-prep {
    margin: 0;
    color: var(--pmu-ink);
    font-size: clamp(18px, 4.6vmin, 24px);
    line-height: 1.6;
    font-family: 'Shadows Into Light Two', cursive;
    white-space: pre-wrap;
  }

  @keyframes pmu-pop { from {opacity:0; transform: translateY(8px) scale(.97);} to {opacity:1; transform:none;} }
  @keyframes pmu-spin { to { transform: rotate(360deg); } }

  @media (prefers-reduced-motion: reduce) {
    .pmu-card, .pmu-modal { animation: none; }
    .pmu-spin { animation: none; }
  }
`;
document.head.appendChild(style);

// ===== DOM =====
let overlayEl, backdropEl;

export function initRecipeModalSend() {
  // Overlay
  overlayEl = document.createElement("div");
  overlayEl.className = "pmu-overlay";
  overlayEl.setAttribute("role", "status");
  overlayEl.setAttribute("aria-hidden", "true");
  overlayEl.innerHTML = `
    <div class="pmu-card pmu-center" aria-live="polite">
      <div class="pmu-spin" aria-hidden="true"></div>
      <div>
        <div class="pmu-title">Preparando receta final…</div>
        <p class="pmu-sub">Danos un momento mientras preparamos la cocina ✨</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlayEl);

  // Modal SOLO preparación (sin botón de cerrar, con logos)
  backdropEl = document.createElement("div");
  backdropEl.className = "pmu-backdrop";
  backdropEl.setAttribute("aria-hidden", "true");
  backdropEl.innerHTML = `
    <div class="pmu-modal" role="dialog" aria-modal="true" aria-labelledby="pmu-rec-title">
      <img class="pmu-logo left"  src="/LOGO_RECETA-GONDOLA.png" alt="">
      <img class="pmu-logo right" src="/LOGOS_GONDOLA.png" alt="">

      <div class="pmu-head">
        <h2 id="pmu-rec-title" class="pmu-rec-title">Receta</h2>
      </div>
      <div class="pmu-body">
        <div class="pmu-prep-label">Preparación</div>
        <p id="pmu-prep" class="pmu-prep"></p>
      </div>
    </div>
  `;
  document.body.appendChild(backdropEl);
}

// ===== API =====
export function setOverlayVisibleSend(
  visible,
  message = "Preparando receta final…"
) {
  if (!overlayEl) return;
  const titleEl = overlayEl.querySelector(".pmu-title");
  if (titleEl) titleEl.textContent = message;
  overlayEl.setAttribute("aria-hidden", visible ? "false" : "true");
}

export function openRecipeModalSend(recipe) {
  if (!backdropEl) return;
  document.documentElement.style.overflow = "hidden";

  const title = document.getElementById("pmu-rec-title");
  const prep = document.getElementById("pmu-prep");

  if (title) title.textContent = recipe?.title || "Receta";
  if (prep) prep.textContent = recipe?.preparation || "";

  backdropEl.setAttribute("aria-hidden", "false");
}

export function closeRecipeModalSend() {
  if (!backdropEl) return;
  backdropEl.setAttribute("aria-hidden", "true");
  document.documentElement.style.overflow = "";
}
