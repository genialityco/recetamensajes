import * as PIXI from "pixi.js";
import { addLayer, screen } from "../app/pixiApp.js";
import { KawaseBlurFilter } from "@pixi/filter-kawase-blur";

let steamLayer;
const steams = [];
let bowlArea;

export function initSteam(getBowlArea) {
  bowlArea = getBowlArea(); // ✅ obtenemos el objeto real
  steamLayer = addLayer(6, [new KawaseBlurFilter(2, 2, true)]);

  const steamOffsets = [0, -screen().width * 0.14, screen().width * 0.14];
  for (const offset of steamOffsets) {
    for (let i = 0; i < 8; i++) spawnSteam(offset);
  }
}


function spawnSteam(offsetX = 0) {
  const g = new PIXI.Graphics();
  g.circle(0, 0, 12 + Math.random() * 20);
  g.fill({ color: 0xffffff, alpha: 0.07 + Math.random() * 0.07 });
  g.x = bowlArea.centerX() + offsetX + (Math.random() * 40 - 20);
  g.y = bowlArea.rimY() - 8 + Math.random() * 10;

  const vy = -(0.25 + Math.random() * 0.3);
  const life = 180 + Math.random() * 160;

  steams.push({ g, vy, life });
  steamLayer.addChild(g);
}

export function updateSteam(t) {
  for (let i = steams.length - 1; i >= 0; i--) {
    const s = steams[i];
    s.g.y += s.vy;
    s.g.x += Math.sin((t + i) * 0.9) * 0.2;
    s.life--;
    if (s.life < 40) s.g.alpha *= 0.97;
    if (s.life <= 0) {
      const xOffset = s.g.x - bowlArea.centerX();
      steamLayer.removeChild(s.g);
      steams.splice(i, 1);
      spawnSteam(xOffset);
    }
  }
}

export function relayoutSteam() {
  // mantener anclado al (0,0) del canvas
  steamLayer.x = 0;
  steamLayer.y = 0;
}
