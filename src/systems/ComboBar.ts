import { Container, Graphics, Text, TextStyle } from "pixi.js";

export class ComboBar extends Container {
  private barBacking: Graphics;
  private barFill: Graphics;
  private multiplierText: Text;
  
  private maxTimer = 3500; // Time window to hit the next answer (3.5 seconds)
  private currentTimer = 0;
  private currentComboCount = 0;
  private multiplier = 1;

  private barWidth = 24;
  private barHeight = 250;

  constructor() {
    super();

    // 1. Draw backing plate frame using official PixiJS v8 syntax guide guides
    this.barBacking = new Graphics()
      .rect(0, 0, this.barWidth, this.barHeight)
      .fill({ color: '#E0E0E0', alpha: 0.5 })
      .stroke({ color: '#FFFFFF', width: 3 });

    // 2. Initialize the visual color fill graphics meter
    this.barFill = new Graphics();

    // 3. Human-crafted, emoji-free arcade typography text
    this.multiplierText = new Text({
      text: '1x',
      style: new TextStyle({
        fontFamily: 'Arial Rounded MT Bold, sans-serif',
        fontSize: 22,
        fill: '#FF70A6',
        stroke: { color: '#FFFFFF', width: 4 },
        dropShadow: {
          alpha: 0.1,
          angle: Math.PI / 2,
          blur: 2,
          color: '#4A3E56',
          distance: 3
        }
      })
    });
    this.multiplierText.anchor.set(0.5);
    this.multiplierText.position.set(this.barWidth / 2, -25); 

    // --- CRITICAL FIX: Added barFill right inside the layout children arrays ---
    this.addChild(this.barBacking, this.barFill, this.multiplierText);

    // Position neatly on the right side edge border area
    this.x = window.innerWidth - 60;
    this.y = window.innerHeight / 2 - this.barHeight / 2;
    
    this.updateFillMeter();
  }

  public registerSuccess(): number {
    this.currentComboCount++;
    this.currentTimer = this.maxTimer; 

    // Raise multiplier tier level every 2 correct answers
    this.multiplier = 1 + Math.floor(this.currentComboCount / 2);
    
    this.multiplierText.text = `${this.multiplier}x`;
    this.multiplierText.scale.set(1.3);

    return this.multiplier;
  }

  public update(elapsedMS: number): void {
    if (this.currentComboCount > 0) {
      this.currentTimer -= elapsedMS;

      // Smoothly return scale back to baseline over frames
      if (this.multiplierText.scale.x > 1.0) {
        this.multiplierText.scale.x -= 0.05;
        this.multiplierText.scale.y -= 0.05;
      }

      // Break combo string if time window expires entirely
      if (this.currentTimer <= 0) {
        this.resetCombo();
      }

      this.updateFillMeter();
    }
  }

  private updateFillMeter(): void {
    this.barFill.clear();
    if (this.currentComboCount === 0 || this.currentTimer <= 0) return;

    // Calculate fluid level height percentage remaining
    const ratio = Math.max(0, Math.min(1, this.currentTimer / this.maxTimer));
    const activeHeight = this.barHeight * ratio;

    // Safety check: Prevent PixiJS v8 batch compiler crash on zero-height drawing metrics
    if (activeHeight <= 1) return;

    // Arcade color tiers based on how high the combo multiplier scales
    const colors = ['#70D6FF', '#FFD670', '#FF9770', '#FF70A6', '#B5179E'];
    const colorIndex = Math.min(this.multiplier - 1, colors.length - 1);
    const chosenColor = colors[colorIndex];

    // PixiJS v8 standard structure: shape bounds defined then painted via fill() payload object
    this.barFill
      .rect(0, this.barHeight - activeHeight, this.barWidth, activeHeight)
      .fill({ color: chosenColor });
  }

  public resetCombo(): void {
    this.currentComboCount = 0;
    this.currentTimer = 0;
    this.multiplier = 1;
    this.multiplierText.text = '1x';
    this.multiplierText.scale.set(1);
    this.barFill.clear();
  }
}