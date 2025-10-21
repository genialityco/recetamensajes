import * as PIXI from "pixi.js";
import { app, screen, stage } from "../app/pixiApp.js";

let bgImage;
let ambient;

export async function initBackground() {
  const bgImageTex = await PIXI.Assets.load("/src/assets/images/fondo_bowl.png");
  bgImage = new PIXI.Sprite(bgImageTex);
  bgImage.zIndex = -120;
  bgImage.anchor.set(0);
  stage().addChild(bgImage);

  ambient = new PIXI.Container();
  ambient.zIndex = -50;
  stage().addChild(ambient);

  for (let i = 0; i < 60; i++) spawnSparkle();
  fitCover();
}

function spawnSparkle() {
  const g = new PIXI.Graphics();
  const r = 1.5 + Math.random() * 2.5;
  g.circle(0, 0, r);
  g.fill({ color: 0x8fd3ff, alpha: 0.15 + Math.random() * 0.2 });
  g.x = Math.random() * screen().width;
  g.y = screen().height * (0.6 + Math.random() * 0.35);
  g.alpha = 0;
  g.vy = -(0.1 + Math.random() * 0.15);
  g.life = 200 + Math.random() * 200;
  ambient.addChild(g);
}

export function updateBackground(t) {
  // cover
  fitCover();

  // ambient
  for (let i = ambient.children.length - 1; i >= 0; i--) {
    const c = ambient.children[i];
    c.alpha = Math.min(0.4, (c.alpha || 0) + 0.01);
    c.y += c.vy;
    c.x += Math.sin((c.y + i) * 0.02) * 0.2;
    c.life--;
    if (c.life <= 0 || c.y < screen().height * 0.2) {
      ambient.removeChild(c);
      spawnSparkle();
    }
  }
}

function fitCover() {
  const tex = bgImage.texture;
  const w = screen().width,
    h = screen().height;
  const scale = Math.max(w / tex.width, h / tex.height);
  bgImage.scale.set(scale);
  bgImage.x = (w - tex.width * scale) / 2;
  bgImage.y = (h - tex.height * scale) / 2;
}
