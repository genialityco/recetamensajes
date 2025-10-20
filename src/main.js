import * as PIXI from "pixi.js";
import { GlowFilter } from "pixi-filters";



console.log("🧙‍♂️ Potion Mixer Initialized!");
// --- PIXI APP ---
const app = new PIXI.Application();
await app.init({
  resizeTo: window,
  background: "#101018",
  antialias: true,
});
document.body.appendChild(app.canvas);

// --- BOWL SPRITE ---
let bowlTexture;
try {
  bowlTexture = await PIXI.Assets.load("/bowl.png");
} catch (e) {
  console.warn("⚠️ No local bowl found, using remote image.");
  bowlTexture = await PIXI.Assets.load("https://i.imgur.com/92J67G8.png");
}

const bowl = new PIXI.Sprite(bowlTexture);
bowl.anchor.set(0.5);
bowl.x = app.screen.width / 2;
bowl.y = app.screen.height * 0.75;
bowl.scale.set(0.6);
app.stage.addChild(bowl);

// --- GLOW EFFECT ---
const glow = new GlowFilter({
  distance: 20,
  outerStrength: 2,
  innerStrength: 0,
  color: 0x00ffff,
  quality: 0.5,
});
bowl.filters = [glow];

// --- INGREDIENTS ---
const ingredients = [];

/**
 * Adds an ingredient (bubble) to the scene.
 * @param {Object} data - { name, message }
 */
function addIngredient(data = {}) {
  const { name = "Anon", message = "Hello world!" } = data;

  // Container for everything
  const bubble = new PIXI.Container();

  // 🫧 Circle (Pixi v8 syntax)
  const gfx = new PIXI.Graphics();
  const radius = 20 + Math.random() * 15;
  gfx.circle(0, 0, radius);
  gfx.fill({
    color: 0xffffff * Math.random(),
    alpha: 0.9,
  });
  gfx.filters = [
    new GlowFilter({
      color: 0xffcc00,
      outerStrength: 2,
      innerStrength: 0,
      distance: 15,
    }),
  ];
  bubble.addChild(gfx);

  // 👤 Name (above)
  const nameText = new PIXI.Text({
    text: name,
    style: {
      fontFamily: "Arial",
      fontSize: 14,
      fill: 0xffffff,
      align: "center",
      fontWeight: "bold",
      dropShadow: true,
      dropShadowDistance: 1,
    },
  });
  nameText.anchor.set(0.5, 1);
  nameText.y = -radius - 8;
  bubble.addChild(nameText);

  // 💬 Message (below name)
  const msgText = new PIXI.Text({
    text: message,
    style: {
      fontFamily: "Arial",
      fontSize: 12,
      fill: 0xddddff,
      wordWrap: true,
      wordWrapWidth: radius * 3,
      align: "center",
    },
  });
  msgText.anchor.set(0.5, 0);
  msgText.y = radius + 6;
  bubble.addChild(msgText);

  // Start pos
  bubble.x = Math.random() * app.screen.width;
  bubble.y = -50;
  bubble.alpha = 0.95;

  app.stage.addChild(bubble);
  ingredients.push({ sprite: bubble, vy: 2 + Math.random() * 2 });
}

// --- ANIMATION LOOP ---
app.ticker.add(() => {
  for (const obj of ingredients) {
    obj.sprite.y += obj.vy;
    obj.sprite.x += Math.sin(obj.sprite.y / 30) * 1.2;

    // Fade out when reaching bowl
    if (obj.sprite.y > bowl.y - 20) {
      obj.sprite.alpha *= 0.95;
      obj.vy *= 0.8;
      if (obj.sprite.alpha < 0.05) {
        app.stage.removeChild(obj.sprite);
      }
    }
  }
});

// --- TEST MESSAGE BUTTON ---
const testButton = document.createElement("button");
testButton.innerText = "📩 Add Test Message";
testButton.style.cssText = `
  position:fixed;
  top:20px; left:20px;
  padding:10px 15px;
  font-size:14px;
  background:#00aaff;
  color:white;
  border:none;
  border-radius:8px;
  cursor:pointer;
`;
document.body.appendChild(testButton);

const sampleNames = ["Ana", "Luis", "Carla", "Pedro", "Sofía"];
const sampleMessages = [
  "¡Esto está genial!",
  "Saludos desde Medellín!",
  "💡 Qué buena idea!",
  "🔥 Increíble evento!",
  "🤖 Amo este robot!",
];

testButton.onclick = () => {
  const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
  const message =
    sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
  addIngredient({ name, message, timestamp: Date.now() });
};

// --- RESIZE ---
window.addEventListener("resize", () => {
  bowl.x = app.screen.width / 2;
  bowl.y = app.screen.height * 0.75;
});
