import { timeStr, sanitizeText } from "../utils/time.js";

const LEGEND_MAX_ITEMS = 20;

let legendWrap, legendBody, legendEmpty, legendCollapseBtn, legendClearBtn;
let legendCollapsed = false;

export function initLegend() {
  const style = document.createElement("style");
  style.textContent = `
  :root { --legend-bg: rgba(20,22,38,.66); --legend-brd:#2a2b45; --legend-txt:#eaeafb; --legend-sub:#a6a9c8; }
  .legend-wrap { position: fixed; inset: auto 12px 12px auto; z-index: 10000; max-width: min(92vw, 380px); color: var(--legend-txt); font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
  .legend { background: var(--legend-bg); border: 1px solid var(--legend-brd); backdrop-filter: blur(10px); border-radius: 14px; padding: 10px 10px 6px 10px; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
  .legend-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px; }
  .legend-title { font-size:14px; font-weight:700; letter-spacing:.2px; }
  .legend-actions { display:flex; gap:6px; }
  .legend-btn { appearance:none; border:1px solid var(--legend-brd); background:#191b2d; color:#dfe3ff; border-radius:10px; padding:6px 10px; font-size:12px; cursor:pointer; }
  .legend-body { max-height: 44vh; overflow:auto; padding-right:2px; scrollbar-width: thin; scrollbar-color: #3b4366 transparent; }
  .legend-body::-webkit-scrollbar { width: 8px; }
  .legend-body::-webkit-scrollbar-thumb { background:#3b4366; border-radius:10px; }
  .legend-item { padding:8px; border-radius:10px; border:1px solid transparent; display:grid; grid-template-columns: 1fr auto; gap:4px 8px; align-items:start; background: rgba(255,255,255,0.02); animation: legendFade .28s ease-out both; }
  .legend-item + .legend-item { margin-top:6px; }
  .legend-name { font-weight:700; font-size:13px; line-height:1.2; }
  .legend-time { font-size:11px; color: var(--legend-sub); }
  .legend-msg { grid-column: 1 / -1; font-size:13px; color:#dde3ff; line-height:1.25; }
  .legend-empty { font-size:12px; color:var(--legend-sub); text-align:center; padding:10px 0; }
  .legend-collapsed .legend-body { display:none; }
  @keyframes legendFade { from { opacity:0; transform: translateY(4px);} to { opacity:1; transform:none;} }
  @media (max-width: 520px) { .legend-wrap { inset: auto auto 12px 12px; max-width: 94vw; } }
  `;
  document.head.appendChild(style);

  legendWrap = document.createElement("div");
  legendWrap.className = "legend-wrap";
  legendWrap.innerHTML = `
    <div class="legend">
      <div class="legend-head">
        <div class="legend-title">Leyenda de mensajes</div>
        <div class="legend-actions">
          <button class="legend-btn" id="legendCollapseBtn">Ocultar</button>
          <button class="legend-btn" id="legendClearBtn">Limpiar</button>
        </div>
      </div>
      <div class="legend-body" id="legendBody">
        <div class="legend-empty" id="legendEmpty">Aún no hay mensajes…</div>
      </div>
    </div>
  `;
  document.body.appendChild(legendWrap);

  legendBody = document.getElementById("legendBody");
  legendEmpty = document.getElementById("legendEmpty");
  legendCollapseBtn = document.getElementById("legendCollapseBtn");
  legendClearBtn = document.getElementById("legendClearBtn");

  legendCollapseBtn.onclick = () => {
    legendCollapsed = !legendCollapsed;
    legendWrap
      .querySelector(".legend")
      .classList.toggle("legend-collapsed", legendCollapsed);
    legendCollapseBtn.textContent = legendCollapsed ? "Mostrar" : "Ocultar";
  };
  legendClearBtn.onclick = clearLegend;
}

export function addLegendEntry(name, message) {
  const nm = sanitizeText(name, 40);
  const msg = sanitizeText(message, 160);
  const ts = timeStr();

  if (legendEmpty) legendEmpty.style.display = "none";

  const item = document.createElement("div");
  item.className = "legend-item";
  item.innerHTML = `
    <div class="legend-name">${nm}</div>
    <div class="legend-time">${ts}</div>
    <div class="legend-msg">${msg}</div>
  `;
  legendBody.prepend(item);

  const items = legendBody.querySelectorAll(".legend-item");
  if (items.length > LEGEND_MAX_ITEMS) items[items.length - 1].remove();
}

export function clearLegend() {
  legendBody.innerHTML = "";
  legendBody.appendChild(legendEmpty);
  legendEmpty.style.display = "block";
}
