// src/ui/qrModal.js
// Modal minimal + "mini dock" en esquina inferior-izquierda.
// Estados: "hidden" | "modal" | "mini" controlados por setQRMode()

let $overlay,
  $modal,
  $canvasModal,
  $dock,
  $canvasDock,
  $linkModal,
  $linkDock,
  $closeBtn;
let qrReady = false;
let currentMode = "hidden";
const QR_LIB_URL =
  "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";

const appUrl = () => `${window.location.origin}/send.html`;

function ensureStyles() {
  if (document.getElementById("qrmodal-styles")) return;
  const style = document.createElement("style");
  style.id = "qrmodal-styles";
  style.textContent = `
    :root { --qrz: 10010; }
    .qr-overlay {
      position: fixed; inset: 0;
      background: rgba(8,10,15,0.6);
      backdrop-filter: blur(2px);
      display: none; align-items: center; justify-content: center;
      z-index: var(--qrz);
    }
    .qr-modal {
      width: min(92vw, 520px);
      background: #0e1220;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 20px 18px 18px;
      color: #e9eefb;
      box-shadow: 0 10px 30px rgba(0,0,0,0.45);
      position: relative;
    }
    .qr-title { font-weight: 800; font-size: 18px; margin: 0 32px 12px 0; }
    .qr-sub { margin: 0 0 16px; opacity: .85; font-size: 14px; line-height: 1.4; }
    .qr-box {
      display:grid; place-items:center;
      background: radial-gradient(120px 120px at 50% 40%, rgba(255,255,255,0.06), transparent 60%);
      border: 1px dashed rgba(255,255,255,0.15);
      border-radius: 16px; padding: 18px;
    }
    .qr-url { word-break: break-all; font-size: 12px; opacity: .8; margin-top: 10px; text-align: center; }
    .qr-close {
      position:absolute; top:10px; right:10px; width:32px; height:32px;
      border-radius: 8px; border:1px solid rgba(255,255,255,0.12);
      background:#13192a; color:#e9eefb; font-weight:700; cursor:pointer;
    }

    /* Dock mini inferior-izquierda */
    .qr-dock {
      position: fixed; left: 16px; bottom: 16px;
      display: none; z-index: calc(var(--qrz) - 2);
      background: rgba(14,18,32,0.9);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px; padding: 10px;
      box-shadow: 0 8px 22px rgba(0,0,0,0.35);
      color: #e9eefb;
    }
    .qr-dock .qr-url { margin-top: 6px; font-size: 11px; opacity: .8; max-width: 220px; }
  `;
  document.head.appendChild(style);
}

async function ensureQrLib() {
  if (window.QRCode) return true;
  try {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = QR_LIB_URL;
      s.async = true;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
    return !!window.QRCode;
  } catch {
    return false;
  }
}

function buildDom() {
  if ($overlay) return;

  // Overlay + modal
  $overlay = document.createElement("div");
  $overlay.className = "qr-overlay";
  $overlay.setAttribute("role", "dialog");
  $overlay.setAttribute("aria-modal", "true");

  $modal = document.createElement("div");
  $modal.className = "qr-modal";

  const $title = document.createElement("h3");
  $title.className = "qr-title";
  $title.textContent = "Escanea para enviar tu mensaje";

  const $sub = document.createElement("p");
  $sub.className = "qr-sub";
  $sub.textContent =
    "Escanéalo con la cámara de tu teléfono para ir a la pantalla de envío.";

  const $box = document.createElement("div");
  $box.className = "qr-box";

  $canvasModal = document.createElement("canvas");
  $canvasModal.width = 256;
  $canvasModal.height = 256;

  $linkModal = document.createElement("div");
  $linkModal.className = "qr-url";
  $linkModal.textContent = appUrl();

  $closeBtn = document.createElement("button");
  $closeBtn.className = "qr-close";
  $closeBtn.textContent = "×";
  $closeBtn.addEventListener("click", () => setQRMode("hidden"));

  $box.appendChild($canvasModal);
  $modal.append($closeBtn, $title, $sub, $box, $linkModal);
  $overlay.appendChild($modal);
  document.body.appendChild($overlay);

  $overlay.addEventListener("click", (e) => {
    if (e.target === $overlay) setQRMode("hidden");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $overlay.style.display === "flex")
      setQRMode("hidden");
  });

  // Dock mini
  $dock = document.createElement("div");
  $dock.className = "qr-dock";
  $canvasDock = document.createElement("canvas");
  $canvasDock.width = 128;
  $canvasDock.height = 128;

  $linkDock = document.createElement("div");
  $linkDock.className = "qr-url";
  $linkDock.textContent = appUrl();

  $dock.append($canvasDock, $linkDock);
  document.body.appendChild($dock);
}

async function renderQR() {
  const ok = await ensureQrLib();
  const url = appUrl();

  async function renderOne(target, sz) {
    if (!target) return;
    if (ok) {
      try {
        await window.QRCode.toCanvas(target, url, { width: sz, margin: 1 });
        return;
      } catch {}
    }
    // Fallback <img>
    const img = new Image();
    img.alt = "QR hacia la pantalla de envío";
    img.width = sz;
    img.height = sz;
    img.referrerPolicy = "no-referrer";
    img.src =
      "https://api.qrserver.com/v1/create-qr-code/?size=" +
      sz +
      "x" +
      sz +
      "&data=" +
      encodeURIComponent(url);
    target.replaceWith(img);
  }

  await Promise.all([
    renderOne($canvasModal, 256),
    renderOne($canvasDock, 128),
  ]);
  if ($linkModal) $linkModal.textContent = url;
  if ($linkDock) $linkDock.textContent = url;
  qrReady = true;
}

/* === API pública === */
export function initQRModal() {
  ensureStyles();
  buildDom();
  renderQR(); // una sola vez
}

export function setQRMode(mode /* "hidden" | "modal" | "mini" */) {
  if (!$overlay) initQRModal();
  if (!qrReady) renderQR();

  currentMode = mode;

  const showOverlay = mode === "modal";
  const showDock = mode === "mini";

  // Toggle displays
  $overlay.style.display = showOverlay ? "flex" : "none";
  $dock.style.display = showDock ? "block" : "none";

  // Accesibilidad
  $overlay.setAttribute("aria-hidden", String(!showOverlay));
  $dock.setAttribute("aria-hidden", String(!showDock));
}

// Helpers por compatibilidad
export function openQRModal() {
  setQRMode("modal");
}
export function closeQRModal() {
  setQRMode("hidden");
}
