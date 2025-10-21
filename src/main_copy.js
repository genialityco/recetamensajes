// =============================
// PIXI + Filtros desde NPM
// =============================
import * as PIXI from "pixi.js";
import { GlowFilter } from "@pixi/filter-glow";
import { KawaseBlurFilter } from "@pixi/filter-kawase-blur";

// =============================
// Firebase Realtime
// =============================
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildAdded, remove } from "firebase/database";

// =============================
// ✅ FIREBASE CONFIG
// =============================
const firebaseConfig = {
  apiKey: "AIzaSyB0iYSMU7tuWyMw-q5h4VKSgCq5LTZJoM4",
  authDomain: "lenovo-experiences.firebaseapp.com",
  projectId: "lenovo-experiences",
  storageBucket: "lenovo-experiences.firebasestorage.app",
  messagingSenderId: "472633703949",
  appId: "1:472633703949:web:c424fcf34b2f983c779f44",
  measurementId: "G-HTNB9NGC2R",
  databaseURL: "https://lenovo-experiences-default-rtdb.firebaseio.com",
};

const fbApp = initializeApp(firebaseConfig);
const db = getDatabase(fbApp);

// =============================
// 🎮 PIXI APP
// =============================
console.log("🧙‍♂️ Potion Mixer++ Initialized!");

const app = new PIXI.Application();
await app.init({
  resizeTo: window,
  background: "#0b0c14",
  antialias: true,
});
document.body.appendChild(app.canvas);

// =============== LEYENDA (UI Overlay) ===============
const legendStyle = document.createElement("style");
legendStyle.textContent = `
  :root { --legend-bg: rgba(20,22,38,.66); --legend-brd:#2a2b45; --legend-txt:#eaeafb; --legend-sub:#a6a9c8; }
  .legend-wrap {
    position: fixed; inset: auto 12px 12px auto; /* bottom-right por defecto */
    z-index: 10000; max-width: min(92vw, 380px);
    color: var(--legend-txt); font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  }
  .legend {
    background: var(--legend-bg); border: 1px solid var(--legend-brd);
    backdrop-filter: blur(10px);
    border-radius: 14px; padding: 10px 10px 6px 10px; box-shadow: 0 10px 30px rgba(0,0,0,.35);
  }
  .legend-head {
    display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;
  }
  .legend-title { font-size:14px; font-weight:700; letter-spacing:.2px; }
  .legend-actions { display:flex; gap:6px; }
  .legend-btn {
    appearance:none; border:1px solid var(--legend-brd); background:#191b2d; color:#dfe3ff;
    border-radius:10px; padding:6px 10px; font-size:12px; cursor:pointer;
  }
  .legend-body {
    max-height: 44vh; overflow:auto; padding-right:2px;
    scrollbar-width: thin; scrollbar-color: #3b4366 transparent;
  }
  .legend-body::-webkit-scrollbar { width: 8px; }
  .legend-body::-webkit-scrollbar-thumb { background:#3b4366; border-radius:10px; }
  .legend-item {
    padding:8px; border-radius:10px; border:1px solid transparent;
    display:grid; grid-template-columns: 1fr auto; gap:4px 8px; align-items:start;
    background: rgba(255,255,255,0.02);
    animation: legendFade .28s ease-out both;
  }
  .legend-item + .legend-item { margin-top:6px; }
  .legend-name { font-weight:700; font-size:13px; line-height:1.2; }
  .legend-time { font-size:11px; color: var(--legend-sub); }
  .legend-msg { grid-column: 1 / -1; font-size:13px; color:#dde3ff; line-height:1.25; }
  .legend-empty { font-size:12px; color:var(--legend-sub); text-align:center; padding:10px 0; }
  .legend-collapsed .legend-body { display:none; }
  @keyframes legendFade { from { opacity:0; transform: translateY(4px);} to { opacity:1; transform:none;} }

  /* Variante: esquina inferior IZQUIERDA en pantallas estrechas para no tapar UI */
  @media (max-width: 520px) {
    .legend-wrap { inset: auto auto 12px 12px; max-width: 94vw; }
  }
`;
document.head.appendChild(legendStyle);

const legendWrap = document.createElement("div");
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

const legendBody = document.getElementById("legendBody");
const legendEmpty = document.getElementById("legendEmpty");
const legendCollapseBtn = document.getElementById("legendCollapseBtn");
const legendClearBtn = document.getElementById("legendClearBtn");

let legendCollapsed = false;
legendCollapseBtn.onclick = () => {
  legendCollapsed = !legendCollapsed;
  legendWrap
    .querySelector(".legend")
    .classList.toggle("legend-collapsed", legendCollapsed);
  legendCollapseBtn.textContent = legendCollapsed ? "Mostrar" : "Ocultar";
};
legendClearBtn.onclick = () => {
  legendBody.innerHTML = "";
  legendBody.appendChild(legendEmpty);
  legendEmpty.style.display = "block";
};

// =============== LEYENDA: Helpers ===============
const LEGEND_MAX_ITEMS = 20;

function timeStr(d = new Date()) {
  // hh:mm (24h)
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function sanitizeText(s, maxLen) {
  const t = String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > maxLen ? t.slice(0, maxLen - 1) + "…" : t;
}

function addLegendEntry(name, message) {
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

  // Limitar cantidad
  const items = legendBody.querySelectorAll(".legend-item");
  if (items.length > LEGEND_MAX_ITEMS) {
    items[items.length - 1].remove();
  }
}

// Para controlar el orden por zIndex
app.stage.sortableChildren = true;

// =============================
// 📐 Área virtual del bowl (coincide con tu imagen de fondo)
// Ajusta porcentajes si tu ilustración está en otra posición
// =============================
const bowlArea = {
  centerX: () => app.screen.width * 0.5,
  rimY: () => app.screen.height * 0.68, // borde superior aprox. del bowl en la imagen de fondo
  spawnW: () => app.screen.width * 0.32, // ancho horizontal de spawns
};

// =============================
// 🌌 BACKGROUND + AMBIENTE (con imagen)
// =============================
const bgImageTex = await PIXI.Assets.load("/images/fondo_bowl.png");
const bgImage = new PIXI.Sprite(bgImageTex);
bgImage.zIndex = -120;
bgImage.anchor.set(0);
app.stage.addChild(bgImage);

// cover helper (escala imagen para cubrir el viewport)
function fitCover(sprite, w, h) {
  const tex = sprite.texture;
  const scale = Math.max(w / tex.width, h / tex.height); // 👈 cambia a min() para "contain"
  sprite.scale.set(scale);
  // centrar la imagen dentro del canvas
  sprite.x = (w - tex.width * scale) / 2;
  sprite.y = (h - tex.height * scale) / 2;
}

// Chispas suaves (partículas ambiente)
const ambient = new PIXI.Container();
ambient.zIndex = -50;
app.stage.addChild(ambient);

function spawnSparkle() {
  const g = new PIXI.Graphics();
  const r = 1.5 + Math.random() * 2.5;
  g.circle(0, 0, r);
  g.fill({ color: 0x8fd3ff, alpha: 0.15 + Math.random() * 0.2 });
  g.x = Math.random() * app.screen.width;
  // zona de chispas cerca de la parte baja (donde están los bowls del arte)
  g.y = app.screen.height * (0.6 + Math.random() * 0.35);
  g.alpha = 0;
  g.vy = -(0.1 + Math.random() * 0.15);
  g.life = 200 + Math.random() * 200;
  ambient.addChild(g);
}
for (let i = 0; i < 60; i++) spawnSparkle();

// =============================
// ☁️ VAPOR SUAVE (3 salidas: centro, izquierda, derecha)
// =============================

// Contenedor y blur
const steamLayer = new PIXI.Container();
steamLayer.zIndex = 6;
steamLayer.filters = [new KawaseBlurFilter(2, 2, true)];
app.stage.addChild(steamLayer);

const steams = [];

// 🔥 Posiciones relativas de las 3 salidas (en px o % del ancho total)
const steamOffsets = [
  0, // centro
  -app.screen.width * 0.14, // izquierda
  app.screen.width * 0.14, // derecha
];

// Función para crear una partícula de humo
function spawnSteam(offsetX = 0) {
  const g = new PIXI.Graphics();
  g.circle(0, 0, 12 + Math.random() * 20);
  g.fill({ color: 0xffffff, alpha: 0.07 + Math.random() * 0.07 });

  // posición inicial según el offset lateral
  g.x = bowlArea.centerX() + offsetX + (Math.random() * 40 - 20);
  g.y = bowlArea.rimY() - 8 + Math.random() * 10;

  const vy = -(0.25 + Math.random() * 0.3);
  const life = 180 + Math.random() * 160;

  steams.push({ g, vy, life });
  steamLayer.addChild(g);
}

// Spawns iniciales distribuidos entre las 3 salidas
for (const offset of steamOffsets) {
  for (let i = 0; i < 8; i++) spawnSteam(offset);
}

// =============================
// 🍬 INGREDIENTES (Sprites de imagen)
// =============================
// Reemplaza con tus imágenes locales (ya las tienes en /images)
// Puedes añadir más rutas en este arreglo:
const ingredientImageURLs = [
  "/images/Tomato_with_Leaf.H03.png",
  "/images/chili_sauce.L16.png",
];

const ingredientTextures = {};
async function loadIngredientTextures() {
  for (const url of ingredientImageURLs) {
    try {
      ingredientTextures[url] = await PIXI.Assets.load(url);
    } catch (e) {
      console.error(`Error loading ingredient texture from ${url}:`, e);
      ingredientTextures[url] = PIXI.Texture.WHITE;
    }
  }
  console.log("✅ Ingredient textures loaded.");
}
await loadIngredientTextures();

const ingredients = [];

function addIngredient(data = {}) {
  const name = String(data.name ?? "Anon").slice(0, 28);
  const message = String(data.message ?? "Hello world!").slice(0, 140);

  const bubble = new PIXI.Container();

  // Selecciona una textura aleatoria
  const randomTextureURL =
    ingredientImageURLs[Math.floor(Math.random() * ingredientImageURLs.length)];
  const ingredientSpriteTexture = ingredientTextures[randomTextureURL];

  const ingredientSprite = new PIXI.Sprite(ingredientSpriteTexture);
  ingredientSprite.anchor.set(0.5);
  const baseScale = 0.6 + Math.random() * 0.4; // escala base
  ingredientSprite.scale.set(baseScale);

  // Filtro de brillo animable
  const glowFilter = new GlowFilter({
    distance: 8,
    outerStrength: 1.0,
    innerStrength: 0,
    color: 0x00ff88,
    quality: 0.5,
  });

  // Un blur muy suave + glow verde mágico
  ingredientSprite.filters = [new KawaseBlurFilter(1, 1, true), glowFilter];
  bubble.addChild(ingredientSprite);

  // Radio visual aproximado para ubicar textos
  const visualRadius = 30 * baseScale;

  // Nombre
  const nameText = new PIXI.Text({
    text: name,
    style: {
      fontFamily: "Inter, Arial",
      fontSize: 14,
      fill: 0xffffff,
      align: "center",
      fontWeight: "bold",
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowAlpha: 0.6,
      dropShadowDistance: 2,
    },
  });
  nameText.anchor.set(0.5, 1);
  nameText.y = -visualRadius - 10;
  bubble.addChild(nameText);

  // Mensaje
  const msgText = new PIXI.Text({
    text: message,
    style: {
      fontFamily: "Inter, Arial",
      fontSize: 12,
      fill: 0xdde3ff,
      wordWrap: true,
      wordWrapWidth: visualRadius * 2.8,
      align: "center",
      lineHeight: 16,
    },
  });
  msgText.anchor.set(0.5, 0);
  msgText.y = visualRadius + 8;
  bubble.addChild(msgText);

  // Spawn inicial
  const spread = bowlArea.spawnW();
  bubble.x = bowlArea.centerX() + (Math.random() * spread - spread / 2);
  bubble.y = -60;
  bubble.scale.set(0); // aparecerá con animación

  // Física simple
  const vx = (Math.random() - 0.5) * 0.8;
  const vy = 1.2 + Math.random() * 0.6;
  const rot = (Math.random() - 0.5) * 0.02;
  const rotV = (Math.random() - 0.5) * 0.03;
  const life = Math.random() * 100;

  bubble.zIndex = 3;
  app.stage.addChild(bubble);
  ingredients.push({
    sprite: bubble,
    vx,
    vy,
    rot,
    rotV,
    name,
    life,
    baseScale,
    glowFilter,
    glowPhase: Math.random() * Math.PI * 2,
  });
}

// =============================
// 🔊 LISTENER RTDB (concat nombres)
// =============================
const messagesRef = ref(db, "potionMessages");
onChildAdded(messagesRef, async (snap) => {
  const val = snap.val() || {};
  const from = String(val.from ?? "").trim();
  const friend = String(val.friendName ?? val.name ?? "").trim();

  // "TuNombre → NuevoAmigo"
  const displayName = [from, friend].filter(Boolean).join(" \u2192 ") || "Anon";
  const msg = String(val.message ?? "…").slice(0, 140);

  addIngredient({ name: displayName, message: msg });
  addLegendEntry(displayName, msg);
  try {
    await remove(snap.ref);
  } catch {}
});

// =============================
// 🔄 LOOP ANIMACIÓN
// =============================
let t = 0;
app.ticker.add(() => {
  t += 0.016;

  // Fondo: cover al tamaño actual
  fitCover(bgImage, app.screen.width, app.screen.height);

  // Chispas ambiente
  for (let i = ambient.children.length - 1; i >= 0; i--) {
    const c = ambient.children[i];
    c.alpha = Math.min(0.4, (c.alpha || 0) + 0.01);
    c.y += c.vy;
    c.x += Math.sin((c.y + i) * 0.02) * 0.2;
    c.life--;
    if (c.life <= 0 || c.y < app.screen.height * 0.2) {
      ambient.removeChild(c);
      spawnSparkle();
    }
  }

  // Vapor (movimiento + reaparición)
  for (let i = steams.length - 1; i >= 0; i--) {
    const s = steams[i];
    s.g.y += s.vy;
    s.g.x += Math.sin((t + i) * 0.9) * 0.2;
    s.life--;

    // desvanecer al final de la vida
    if (s.life < 40) s.g.alpha *= 0.97;

    // eliminar y volver a crear en la misma salida
    if (s.life <= 0) {
      const xOffset = s.g.x - bowlArea.centerX(); // guarda de qué salida era
      steamLayer.removeChild(s.g);
      steams.splice(i, 1);
      spawnSteam(xOffset);
    }
  }

  // Ingredientes: caída y “colisión” con el borde virtual rimY
  const gravity = 0.045;
  const rimY = bowlArea.rimY();

  for (let i = ingredients.length - 1; i >= 0; i--) {
    const obj = ingredients[i];
    const spr = obj.sprite;

    // Vida para animaciones
    obj.life += 0.06;
    obj.glowPhase += 0.08;

    // Spawn scale-in
    let currentScale = spr.scale.x;
    if (currentScale < obj.baseScale) {
      currentScale = Math.min(obj.baseScale, currentScale + 0.02);
      spr.scale.set(currentScale);
    }

    // Brillo/shimmer del ingrediente
    if (spr.alpha > 0.9) {
      const glowIntensity = 0.8 + Math.sin(obj.glowPhase) * 0.6;
      const glowDistance = 8 + Math.sin(obj.glowPhase * 1.3) * 4;

      obj.glowFilter.outerStrength = glowIntensity;
      obj.glowFilter.distance = glowDistance;

      const shimmer = 0.95 + Math.sin(obj.glowPhase * 2) * 0.05;
      spr.children[0].alpha = shimmer; // sprite del ingrediente es el primer hijo
    }

    // Física
    obj.vy += gravity;
    spr.x += obj.vx;
    spr.y += obj.vy;
    obj.rot += obj.rotV;
    spr.rotation = obj.rot;

    // Impacto contra la línea del bowl
    if (spr.y >= rimY) {
      obj.vy = -Math.abs(obj.vy) * 0.25; // rebote pequeño
      obj.vx *= 0.6;
      obj.glowFilter.outerStrength *= 0.98;
      spr.scale.x *= 0.985;
      spr.scale.y *= 0.985;
      spr.alpha *= 0.94;

      if (spr.alpha < 0.08) {
        app.stage.removeChild(spr);
        ingredients.splice(i, 1);
      }
    }

    // si se escapa por abajo sin tocar
    if (spr.y > app.screen.height + 200) {
      app.stage.removeChild(spr);
      ingredients.splice(i, 1);
    }
  }
});

// =============================
// 🪄 TEST BUTTON (opcional)
// =============================
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
  addIngredient({ name, message });
  addLegendEntry(name, message);
};

// =============================
// 📐 RESIZE / LAYOUT
// =============================
function layout() {
  fitCover(bgImage, app.screen.width, app.screen.height);
  steamLayer.x = 0;
  steamLayer.y = 0;
}
layout();
window.addEventListener("resize", layout);
