import { Container, Text, TextStyle } from "pixi.js";

interface CharacterParticle {
  graphic: Text;
  vx: number;
  vy: number;
  vRotation: number;
  isGrounded: boolean;
  isOldDebris?: boolean; // --- NEW: Flags letters left over from the previous round
}

export class ParticleSystem {
  public activeParticles: CharacterParticle[] = [];
  private sweptOffMemory: CharacterParticle[] = [];
  private floorHeight: number;
  private stage: Container;
  private cuteColors = ['#FF70A6', '#FF9770', '#FFD670', '#E9FF70', '#70D6FF', '#B5179E'];

  constructor(stage: Container, floorHeight: number) {
    this.stage = stage;
    this.floorHeight = floorHeight;
  }

  public createCharacterExplosion(x: number, y: number, textStr: string, baseStyle: any): void {
    const characters: string[] = textStr.split("");
    const letterSpacing = 30;
    const totalWidth = characters.length * letterSpacing;
    const startX = x - totalWidth / 2;

    const flatStyle = baseStyle instanceof TextStyle
      ? { fontFamily: baseStyle.fontFamily, fontSize: baseStyle.fontSize, fontWeight: baseStyle.fontWeight }
      : baseStyle;

    characters.forEach((char: string, index: number): void => {
      if (char.trim() === "") return;

      const charParticle = new Text({
        text: char,
        style: {
          fontFamily: 'Arial Rounded MT Bold, Comic Sans MS, sans-serif',
          fontSize: flatStyle?.fontSize || 42,
          fontWeight: 'bold',
          fill: this.cuteColors[Math.floor(Math.random() * this.cuteColors.length)],
          stroke: { color: '#FFFFFF', width: 8 },
          dropShadow: { alpha: 0.15, angle: Math.PI / 2, blur: 2, color: '#5C4D7D', distance: 5 }
        }
      });

      charParticle.anchor.set(0.5, 1.0);
      charParticle.x = startX + (index * letterSpacing);
      charParticle.y = y;
      charParticle.zIndex = 4;

      this.stage.addChild(charParticle);

      const angle = Math.random() * Math.PI - Math.PI;
      const speed = Math.random() * 4 + 3;
      const rotationSpeed = (Math.random() - 0.5) * 0.3;

      this.activeParticles.push({
        graphic: charParticle,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vRotation: rotationSpeed,
        isGrounded: false
      });
    });
  }

  public update(dt: number): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];

      if (!p.isGrounded) {
        p.vy += 0.2 * dt; // Gravity
        p.vx *= Math.pow(0.98, dt); // Drag

        p.graphic.x += p.vx * dt;
        p.graphic.y += p.vy * dt;
        if (p.vRotation) p.graphic.rotation += p.vRotation * dt;

        if (p.graphic.y >= this.floorHeight) {
          p.graphic.y = this.floorHeight;
          p.isGrounded = true;
          p.vx = 0;
          p.vy = 0;
          p.vRotation = 0;
        }

        // --- UPDATED SMART GARBAGE COLLECTION ---
        // If a piece goes off-screen:
        if (p.graphic.x < -120 || p.graphic.x > window.innerWidth + 120) {
          if (p.isOldDebris) {
            // A. If it's a left-over letter from the last round, destroy it permanently!
            this.stage.removeChild(p.graphic);
            p.graphic.destroy();
            this.activeParticles.splice(i, 1);
          } else {
            // B. If it's from the current round, save it to the victory pool
            p.graphic.visible = false;
            this.sweptOffMemory.push(p);
            this.activeParticles.splice(i, 1);
          }
        }
      }
    }
  }

  public triggerWinConfetti(): void {
    const totalCelebrationPool = [...this.activeParticles, ...this.sweptOffMemory];
    this.activeParticles = [];
    this.sweptOffMemory = [];

    totalCelebrationPool.forEach((p, index) => {
      p.isGrounded = false;
      p.graphic.visible = true;
      p.graphic.alpha = 1.0;

      const fireFromLeftCorner = index % 2 === 0;

      if (fireFromLeftCorner) {
        p.graphic.x = -20;
        p.graphic.y = this.floorHeight;
        p.vx = Math.random() * 12 + 10;
        p.vy = -(Math.random() * 14 + 14);
      } else {
        p.graphic.x = window.innerWidth + 20;
        p.graphic.y = this.floorHeight;
        p.vx = -(Math.random() * 12 + 10);
        p.vy = -(Math.random() * 14 + 14);
      }

      p.vRotation = (Math.random() - 0.5) * 1.5;
      this.activeParticles.push(p);
    });
  }

  // --- NEW METHOD: MARKS CURRENT PARTICLES AS DEBRIS FOR THE NEXT LEVEL ---
  // Call this inside index.ts right when clicking "Play Again" or starting a new game!
  public prepForNewLevel(): void {
    // Take everything currently sitting on the floor or screen sides
    this.activeParticles.forEach((p) => {
      p.isOldDebris = true;
    });

    // Dump old out-of-bounds history so it doesn't double-trigger the confetti loop
    this.sweptOffMemory.forEach((p) => {
      this.stage.removeChild(p.graphic);
      p.graphic.destroy();
    });
    this.sweptOffMemory = [];
  }
}