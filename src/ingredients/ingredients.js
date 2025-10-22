import * as PIXI from "pixi.js";
import { stage, screen } from "../app/pixiApp.js";
import { GlowFilter } from "@pixi/filter-glow";
import { KawaseBlurFilter } from "@pixi/filter-kawase-blur";
import { playPop } from "../audio/sound.js";

const ingredientImageURLs = [
  "/images/Tomato_with_Leaf.H03.png",
  "/images/chili_sauce.L16.png",
  "/images/CEBOLLA.png",
  "/images/PIMIENTA.png",
  "/images/PIMENTON.png",
];

const ingredientTextures = {};
const ingredients = [];

export async function loadIngredientTextures() {
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

export function addIngredient({
  name = "Anon",
  message = "Hello world!",
  bowlArea,
}) {
  const nm = String(name).slice(0, 28);
  const msg = String(message).slice(0, 140);

  const bubble = new PIXI.Container();

  const randomTextureURL =
    ingredientImageURLs[Math.floor(Math.random() * ingredientImageURLs.length)];
  const ingredientSpriteTexture = ingredientTextures[randomTextureURL];

  const ingredientSprite = new PIXI.Sprite(ingredientSpriteTexture);
  ingredientSprite.anchor.set(0.5);
  const baseScale = 0.6 + Math.random() * 0.4;
  ingredientSprite.scale.set(baseScale);

  const glowFilter = new GlowFilter({
    distance: 8,
    outerStrength: 1.0,
    innerStrength: 0,
    color: 0x00ff88,
    quality: 0.5,
  });

  ingredientSprite.filters = [new KawaseBlurFilter(1, 1, true), glowFilter];
  bubble.addChild(ingredientSprite);

  const visualRadius = 30 * baseScale;

  const nameText = new PIXI.Text({
    text: nm,
    style: {
      fontFamily: "Inter, Arial",
      fontSize: 30,
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

  const msgText = new PIXI.Text({
    text: msg,
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

  const spread = bowlArea.spawnW();
  bubble.x = bowlArea.centerX() + (Math.random() * spread - spread / 2);
  bubble.y = -60;
  bubble.scale.set(0);

  const vx = (Math.random() - 0.5) * 0.8;
  const vy = 1.2 + Math.random() * 0.6;
  const rot = (Math.random() - 0.5) * 0.02;
  const rotV = (Math.random() - 0.5) * 0.03;

  bubble.zIndex = 3;
  stage().addChild(bubble);

  ingredients.push({
    sprite: bubble,
    vx,
    vy,
    rot,
    rotV,
    life: Math.random() * 100,
    baseScale,
    glowFilter,
    glowPhase: Math.random() * Math.PI * 2,
    popped: false,
  });
}

export function updateIngredients(bowlArea) {
  const gravity = 0.045;
  const rimY = bowlArea.rimY();

  for (let i = ingredients.length - 1; i >= 0; i--) {
    const obj = ingredients[i];
    const spr = obj.sprite;

    obj.life += 0.06;
    obj.glowPhase += 0.08;

    let currentScale = spr.scale.x;
    if (currentScale < obj.baseScale) {
      currentScale = Math.min(obj.baseScale, currentScale + 0.02);
      spr.scale.set(currentScale);
    }

    if (spr.alpha > 0.9) {
      const glowIntensity = 0.8 + Math.sin(obj.glowPhase) * 0.6;
      const glowDistance = 8 + Math.sin(obj.glowPhase * 1.3) * 4;
      obj.glowFilter.outerStrength = glowIntensity;
      obj.glowFilter.distance = glowDistance;
      const shimmer = 0.95 + Math.sin(obj.glowPhase * 2) * 0.05;
      spr.children[0].alpha = shimmer;
    }

    obj.vy += gravity;
    spr.x += obj.vx;
    spr.y += obj.vy;
    obj.rot += obj.rotV;
    spr.rotation = obj.rot;

    if (spr.y >= rimY) {
      if (!obj.popped) {
        obj.popped = true;
        try {
          playPop();
        } catch {}
      }

      obj.vy = -Math.abs(obj.vy) * 0.25;
      obj.vx *= 0.6;
      obj.glowFilter.outerStrength *= 0.98;
      spr.scale.x *= 0.985;
      spr.scale.y *= 0.985;
      spr.alpha *= 0.94;

      if (spr.alpha < 0.08) {
        spr.parent.removeChild(spr);
        ingredients.splice(i, 1);
      }
    }

    if (spr.y > screen().height + 200) {
      spr.parent.removeChild(spr);
      ingredients.splice(i, 1);
    }
  }
}
