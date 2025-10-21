// src/ui/recipeModal.js

// 💡 Preload del pergamino para que aparezca nítido
(() => {
  const img = new Image();
  img.src = "/pergamino-01.png";
})();

// ========== Estilos (pergamino + tipografía manuscrita) ==========
const style = document.createElement("style");
style.textContent = `
  /* Importamos ambas fuentes */
  @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&family=Shadows+Into+Light+Two&display=swap');

  :root {
    --pm-bg: rgba(10, 12, 18, 0.55);
    --pm-txt: #2b1a08; /* tono tinta café oscuro */
    --pm-sub: #3f2a11;
    --pm-brd: rgba(0,0,0,.2);
    --pm-shadow: 0 20px 50px rgba(0,0,0,.5);
  }

  .pm-overlay, .pm-modal-backdrop {
    position: fixed; inset: 0;
    display: none; place-items: center;
    z-index: 9998;
    background: radial-gradient(90% 90% at 50% 50%, var(--pm-bg), rgba(10,12,18,.75));
    backdrop-filter: blur(8px);
  }

  .pm-overlay[aria-hidden="false"],
  .pm-modal-backdrop[aria-hidden="false"] {
    display: grid;
  }

  /* =================== Overlay (Cargando) =================== */
  .pm-card {
    border: 1px solid var(--pm-brd);
    border-radius: 16px;
    color: #eaeafb;
    font-family: system-ui, sans-serif;
    animation: pm-pop .22s ease-out both;
    box-shadow: var(--pm-shadow);
    background: rgba(30,30,40,.85);
  }

  .pm-center {
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }

  .pm-spin {
    width: 18px; height: 18px; border-radius: 50%;
    border: 3px solid rgba(255,255,255,.2);
    border-top-color: #7dd3fc;
    animation: pm-spin 1s linear infinite;
  }

  /* =================== Modal (Receta - 95vw con scroll) =================== */
  .pm-modal {
    width: 95vw;
    height: 95vh; 
    max-width: 95vw;
    max-height: 95vh;
    border-radius: 12px; 
    border: 1px solid var(--pm-brd);
    box-shadow: var(--pm-shadow); 
    
    background: url("/pergamino-01.png") center/cover no-repeat;
    
    padding: clamp(30px, 5vmin, 60px); 
    
    color: var(--pm-txt);
    /* Aplicamos Shadows Into Light Two como fuente principal para el cuerpo */
    font-family: 'Shadows Into Light Two', cursive;
    font-size: 3vmin; 
    line-height: 1.4;
    position: relative;
    animation: pm-pop .25s ease-out both;
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

  .pm-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 2vmin; 
    flex-shrink: 0;
  }

  .pm-title {
    /* Mantenemos Dancing Script para el título para más elegancia */
    font-family: 'Dancing Script', cursive;
    font-size: 6vmin; 
    font-weight: 700;
    margin: 0;
    text-shadow: 1px 1px 3px rgba(0,0,0,.35);
    flex-shrink: 0;
  }

  .pm-btn {
    background: rgba(60, 50, 40, 0.4);
    color: var(--pm-txt);
    border: 1px solid rgba(0,0,0,0.3);
    border-radius: 8px;
    padding: 8px 16px;
    font-family: 'Shadows Into Light Two', cursive; /* Usamos Shadows para el botón */
    font-size: 2vmin; 
    font-weight: 600;
    transition: background .2s ease;
    flex-shrink: 0;
  }
  .pm-btn:hover {
    background: rgba(100, 80, 60, 0.5);
  }

  .pm-sub {
    font-size: 3vmin; 
    margin-bottom: 3vmin;
    font-style: italic;
    color: var(--pm-sub);
    flex-shrink: 0;
  }

  .pm-section-title {
    margin-top: 3vmin;
    font-weight: 700;
    font-size: 4vmin; 
    border-bottom: 2px dashed rgba(0,0,0,0.4);
    padding-bottom: 8px;
    flex-shrink: 0;
  }
  
  .pm-ul {
    margin: 1vmin 0 0 4vmin;
    padding: 0;
    list-style-type: "🌿";
    flex-grow: 1; 
    flex-shrink: 0; 
    display: block; 
  }
  
  .pm-ul li {
    /* AUMENTO DE ESPACIO VERTICAL AQUÍ */
    margin: 3vmin 0; 
    font-size: 4vmin; 
    line-height: 1.2;
    padding-left: 0.5vmin;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  @keyframes pm-pop {
    from { opacity: 0; transform: translateY(8px) scale(.97); }
    to { opacity: 1; transform: none; }
  }

  @keyframes pm-spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

// ========== DOM ==========
let overlayEl, backdropEl;

export function initRecipeModal() {
  // Overlay (Preparando...)
  overlayEl = document.createElement("div");
  overlayEl.className = "pm-overlay";
  overlayEl.setAttribute("role", "status");
  overlayEl.setAttribute("aria-hidden", "true");
  overlayEl.innerHTML = `
    <div class="pm-card pm-center" aria-live="polite">
      <div class="pm-spin" aria-hidden="true"></div>
      <div>
        <div class="pm-title" style="font-family:system-ui;font-size:18px;">Preparando receta final…</div>
        <div class="pm-sub" style="color:#b8b9d4;font-size:14px;">Danos un momento mientras mezclamos la pócima ✨</div>
      </div>
    </div>
  `;
  document.body.appendChild(overlayEl);

  // Modal (Receta en pergamino) - Estructura optimizada
  backdropEl = document.createElement("div");
  backdropEl.className = "pm-modal-backdrop";
  backdropEl.setAttribute("aria-hidden", "true");
  backdropEl.innerHTML = `
    <div class="pm-modal" role="dialog" aria-modal="true" aria-labelledby="pm-rec-title">
      <div class="pm-content-wrapper">
        <div class="pm-row">
          <h2 id="pm-rec-title" class="pm-title">Receta</h2>
          <button id="pm-rec-close" class="pm-btn" type="button">Cerrar</button>
        </div>
        <p id="pm-rec-desc" class="pm-sub"></p>
        <div class="pm-section-title">Ingredientes</div>
        <ul id="pm-rec-ings" class="pm-ul"></ul>
      </div>
    </div>
  `;
  document.body.appendChild(backdropEl);

  // Cierre
  backdropEl.addEventListener("click", (ev) => {
    if (ev.target === backdropEl) closeRecipeModal();
  });
  document
    .getElementById("pm-rec-close")
    .addEventListener("click", closeRecipeModal);
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
  message = "Preparando receta final…"
) {
  if (!overlayEl) return;
  const titleEl = overlayEl.querySelector(".pm-title");
  if (titleEl) titleEl.textContent = message;
  overlayEl.setAttribute("aria-hidden", visible ? "false" : "true");
}

export function openRecipeModal(recipe) {
  if (!backdropEl) return;
  document.documentElement.style.overflow = "hidden";

  const title = document.getElementById("pm-rec-title");
  const desc = document.getElementById("pm-rec-desc");
  const list = document.getElementById("pm-rec-ings");

  if (title) title.textContent = recipe?.title || "Receta";
  if (desc) desc.textContent = recipe?.description || "";
  if (list) {
    list.innerHTML = "";
    (recipe?.ingredients || []).forEach((i) => {
      const li = document.createElement("li");
      // Formato con cantidad en negrita para mejor visibilidad
      li.innerHTML = `<span>${i?.qty ? `<strong>${i.qty}</strong> ` : ""}${
        i?.name || ""
      }</span>`;
      list.appendChild(li);
    });
  }

  backdropEl.setAttribute("aria-hidden", "false");
}

export function closeRecipeModal() {
  if (!backdropEl) return;
  backdropEl.setAttribute("aria-hidden", "true");
  document.documentElement.style.overflow = "";
}
