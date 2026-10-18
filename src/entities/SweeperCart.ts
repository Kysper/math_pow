import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { ParticleSystem } from "../systems/ParticleSystem";

interface ExhaustSmoke { graphic: Graphics; vx: number; vy: number; alphaDecay: number; growSpeed: number; }

export class SweeperCart extends Container {
  private speed = 4.5;
  private direction = 1;
  private minX = 50;
  private maxX: number;
  private particleEngine: ParticleSystem;

  private animationTime = 0;
  private loadWobble = 0;
  private smokeSpawnTimer = 0;
  private smokePuffs: ExhaustSmoke[] = [];

  private chassis: Graphics;
  private frontWheel: Graphics;
  private backWheel: Graphics;

  private isCelebrating = false;
  private targetCenterX: number;
  private speechBubble: Container | null = null;

  // --- REMOVED: playAgain parameters from constructor ---
  constructor(particleEngine: ParticleSystem) {
    super();
    this.particleEngine = particleEngine;
    this.maxX = window.innerWidth - 50;
    this.targetCenterX = window.innerWidth / 2;

    this.chassis = new Graphics()
      .roundRect(-45, -35, 90, 30, 12).fill({ color: "#FF70A6" }).stroke({ color: "#FFFFFF", width: 4 })
      .circle(0, -35, 8).fill({ color: "#FFD670" })
      .roundRect(-60, -15, 20, 15, 5).fill({ color: "#70D6FF" }).stroke({ color: "#FFFFFF", width: 2 })
      .roundRect(40, -15, 20, 15, 5).fill({ color: "#70D6FF" }).stroke({ color: "#FFFFFF", width: 2 });

    this.frontWheel = new Graphics().circle(0, 0, 14).fill({ color: "#4A3E56" }).stroke({ color: "#FFFFFF", width: 3 });
    this.backWheel = new Graphics().circle(0, 0, 14).fill({ color: "#4A3E56" }).stroke({ color: "#FFFFFF", width: 3 });

    this.frontWheel.position.set(30, 0);
    this.backWheel.position.set(-30, 0);

    this.addChild(this.chassis, this.frontWheel, this.backWheel);
    this.x = this.minX;
    this.y = window.innerHeight - 80;
  }

  public triggerVictorySequence(): void {
    this.isCelebrating = true;
    this.direction = this.x < this.targetCenterX ? 1 : -1;
    this.chassis.scale.x = this.direction;
    this.frontWheel.scale.x = this.direction;
    this.backWheel.scale.x = this.direction;
  }

  // Called by index.ts when resetting back to the menu loop
  public forceReset(): void {
    if (this.speechBubble) {
      this.removeChild(this.speechBubble);
      this.speechBubble.destroy({ children: true });
      this.speechBubble = null;
    }
    this.isCelebrating = false;
    this.direction = 1;
    this.chassis.scale.x = 1;
    this.frontWheel.scale.set(1);
    this.backWheel.scale.set(1);
    this.x = this.minX;
  }

  private spawnSmokePuff(): void {
    const smokeCircle = new Graphics().circle(0, 0, Math.random() * 4 + 6).fill({ color: "#FFFFFF", alpha: 0.85 }).stroke({ color: "#EBE6FF", width: 2 });
    smokeCircle.x = this.x - (this.direction * 45);
    smokeCircle.y = this.y - 20;
    smokeCircle.zIndex = 1;
    if (this.parent) this.parent.addChild(smokeCircle);

    this.smokePuffs.push({
      graphic: smokeCircle,
      vx: -this.direction * (Math.random() * 1.2 + 0.5),
      vy: -(Math.random() * 0.8 + 0.6),
      alphaDecay: Math.random() * 0.015 + 0.02,
      growSpeed: Math.random() * 0.03 + 0.04
    });
  }

  public update(dt: number): void {
    this.animationTime += 0.2 * dt;

    if (!this.isCelebrating) {
      this.x += this.speed * this.direction * dt;
      if (this.x >= this.maxX) { this.direction = -1; this.chassis.scale.x = -1; }
      else if (this.x <= this.minX) { this.direction = 1; this.chassis.scale.x = 1; }

      this.smokeSpawnTimer += dt;
      if (this.smokeSpawnTimer >= 8) { this.spawnSmokePuff(); this.smokeSpawnTimer = 0; }
    } else {
      const distanceToCenter = this.targetCenterX - this.x;

      if (Math.abs(distanceToCenter) > 4) {
        this.x += Math.sign(distanceToCenter) * this.speed * 0.8 * dt;
        const roll = Math.sin(this.animationTime) * 0.05;
        this.frontWheel.scale.set(this.direction * (1 - roll), 1 + roll);
        this.backWheel.scale.set(this.direction * (1 + roll), 1 - roll);
      } else {
        this.x = this.targetCenterX;
        this.frontWheel.scale.set(this.direction * 1, 1);
        this.backWheel.scale.set(this.direction * 1, 1);
        this.chassis.y = 0;

        if (!this.speechBubble) {
          this.showVictoryUI();
        }
      }
    }

    // Process smoke rings tracking
    for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
      const puff = this.smokePuffs[i];
      puff.graphic.x += puff.vx * dt; puff.graphic.y += puff.vy * dt;
      puff.graphic.scale.x += puff.growSpeed * dt; puff.graphic.scale.y += puff.growSpeed * dt;
      puff.graphic.alpha -= puff.alphaDecay * dt;
      if (puff.graphic.alpha <= 0) {
        if (this.parent) this.parent.removeChild(puff.graphic);
        puff.graphic.destroy(); this.smokePuffs.splice(i, 1);
      }
    }

    if (!this.isCelebrating) {
      const blowingRadius = 140;
      this.particleEngine.activeParticles.forEach((p) => {
        const dx = p.graphic.x - this.x; const dy = p.graphic.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < blowingRadius) {
          if (p.isGrounded) { p.isGrounded = false; p.vy = -(Math.random() * 2 + 3); this.loadWobble += 2.5; }
          const forceIntensity = (blowingRadius - distance) / blowingRadius;
          p.vx += this.direction * 0.7 * forceIntensity * dt; p.vy -= 0.15 * forceIntensity * dt;
          p.vRotation = this.direction * 0.25;
        }
      });

      this.loadWobble *= 0.9;
      this.chassis.y = Math.sin(this.animationTime * 2) * (1.5 + this.loadWobble);
    }
  }

  private showVictoryUI(): void {
    this.speechBubble = new Container();
    this.speechBubble.y = -100;
    this.speechBubble.zIndex = 20;

    const bubbleBg = new Graphics()
      .roundRect(-110, -30, 220, 60, 18).fill({ color: "#FFFFFF" }).stroke({ color: "#4A3E56", width: 4 })
      .poly([0, 30, -10, 30, 0, 42]).fill({ color: "#FFFFFF" }).stroke({ color: "#4A3E56", width: 4 });

    const textStyle = new TextStyle({
      fontFamily: 'Arial Rounded MT Bold, sans-serif',
      fontSize: 18,
      fill: '#B5179E',
      stroke: { color: '#FFFFFF', width: 3 }
    });

    // CLEANED: Text string is simple and professional
    const msg = new Text({ text: 'CONGRATS YOU WON!', style: textStyle });
    msg.anchor.set(0.5);

    this.speechBubble.addChild(bubbleBg, msg);
    this.addChild(this.speechBubble);
  }
}