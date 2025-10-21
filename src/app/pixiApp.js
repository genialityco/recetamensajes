// Inicializa PIXI y helpers comunes
import * as PIXI from "pixi.js";

export const app = new PIXI.Application();

export async function initApp() {
  await app.init({ resizeTo: window, background: "#0b0c14", antialias: true });
  document.body.appendChild(app.canvas);
  app.stage.sortableChildren = true;
  console.log("🧙‍♂️ Potion Mixer++ Initialized!");
}

export function onTick(fn) {
  app.ticker.add(fn);
}

export function addLayer(zIndex, filters = []) {
  const c = new PIXI.Container();
  c.zIndex = zIndex;
  if (filters.length) c.filters = filters;
  app.stage.addChild(c);
  return c;
}

export function screen() {
  return app.screen;
}

export function stage() {
  return app.stage;
}
