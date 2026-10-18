import { Container, Graphics, Text, TextStyle } from "pixi.js";

export class GameMenu extends Container {
  public selectedOperators: Array<'+' | '-' | '*' | '/'> = ['+'];
  // --- NEW: Tracks if strict typing accuracy is active ---
  public isExpertMode = false; 
  private onStartCallback: () => void;

  constructor(centerX: number, centerY: number, onStart: () => void) {
    super();
    this.onStartCallback = onStart;

    const textStyle = new TextStyle({
      fontFamily: 'Arial Rounded MT Bold, sans-serif',
      fontSize: 24,
      fill: '#FFFFFF',
      stroke: { color: '#4A3E56', width: 4 }
    });

    const labelStyle = new TextStyle({
      fontFamily: 'Arial Rounded MT Bold, sans-serif',
      fontSize: 20,
      fill: '#4A3E56',
      fontWeight: 'bold'
    });

    // --- OPERATOR SELECTION ---
    const opTitle = new Text({ text: "CHOOSE YOUR OPERATORS:", style: labelStyle });
    opTitle.anchor.set(0.5);
    opTitle.position.set(centerX, centerY - 150);
    this.addChild(opTitle);

    const operatorsList: Array<'+' | '-' | '*' | '/'> = ['+', '-', '*', '/'];
    const buttonSpacing = 70;
    const startX = centerX - ((operatorsList.length - 1) * buttonSpacing) / 2;

    operatorsList.forEach((op, index) => {
      const opButton = new Container();
      opButton.position.set(startX + index * buttonSpacing, centerY - 100);

      const isActive = this.selectedOperators.includes(op);
      const bg = new Graphics()
        .roundRect(-25, -25, 50, 50, 15)
        .fill({ color: isActive ? '#70D6FF' : '#E0E0E0' })
        .stroke({ color: '#FFFFFF', width: 3 });

      const txt = new Text({ text: op, style: textStyle });
      txt.anchor.set(0.5);

      opButton.addChild(bg, txt);
      this.addChild(opButton);

      opButton.eventMode = 'static';
      opButton.cursor = 'pointer';
      opButton.on('pointerdown', () => {
        const opIndex = this.selectedOperators.indexOf(op);
        if (opIndex > -1) {
          if (this.selectedOperators.length > 1) {
            this.selectedOperators.splice(opIndex, 1);
            bg.clear().roundRect(-25, -25, 50, 50, 15).fill({ color: '#E0E0E0' }).stroke({ color: '#FFFFFF', width: 3 });
          }
        } else {
          this.selectedOperators.push(op);
          bg.clear().roundRect(-25, -25, 50, 50, 15).fill({ color: '#70D6FF' }).stroke({ color: '#FFFFFF', width: 3 });
        }
      });
    });

    // --- NEW: GAMEPLAY STYLE MODE SELECTOR ROW ---
    const modeTitle = new Text({ text: "GAMEPLAY STYLE:", style: labelStyle });
    modeTitle.anchor.set(0.5);
    modeTitle.position.set(centerX, centerY - 20);
    this.addChild(modeTitle);

    const modeBtnContainer = new Container();
    modeBtnContainer.position.set(centerX, centerY + 20);
    this.addChild(modeBtnContainer);

    // Draw long capsule pill background selector frame
    const modeBg = new Graphics()
      .roundRect(-140, -22, 280, 44, 15)
      .fill({ color: '#E0E0E0' })
      .stroke({ color: '#FFFFFF', width: 3 });

    // Active toggle highlights
    const highlightG = new Graphics();
    
    const drawHighlight = (isExpert: boolean) => {
      highlightG.clear();
      // Draw capsule slider on the left side for casual, right side for expert
      highlightG.roundRect(isExpert ? 2 : -138, -20, 136, 40, 12).fill({ color: '#FF70A6' });
    };
    drawHighlight(this.isExpertMode);

    const txtStyleSmall = new TextStyle({
      fontFamily: 'Arial Rounded MT Bold, sans-serif', fontSize: 16, fill: '#FFFFFF',
      stroke: { color: '#4A3E56', width: 3 }
    });

    const casualTxt = new Text({ text: "CASUAL", style: txtStyleSmall });
    casualTxt.anchor.set(0.5);
    casualTxt.position.set(-68, 0);

    const expertTxt = new Text({ text: "EXPERT", style: txtStyleSmall });
    expertTxt.anchor.set(0.5);
    expertTxt.position.set(68, 0);

    modeBtnContainer.addChild(modeBg, highlightG, casualTxt, expertTxt);

    modeBtnContainer.eventMode = 'static';
    modeBtnContainer.cursor = 'pointer';
    modeBtnContainer.on('pointerdown', (event) => {
      // Find where they clicked inside the button container box locally
      const localPos = modeBtnContainer.toLocal(event.global);
      
      // If clicked right side, activate expert. If left side, activate casual.
      this.isExpertMode = localPos.x > 0;
      drawHighlight(this.isExpertMode);
      console.log("Expert mode status:", this.isExpertMode);
    });

    // --- START GAME ACTION BUTTON ---
    const startBtn = new Container();
    const btnBg = new Graphics().roundRect(0, 0, 260, 60, 20).fill({ color: '#70D6FF' }).stroke({ color: '#FFFFFF', width: 4 });
    const btnText = new Text({ text: 'START GAME', style: textStyle });
    btnText.anchor.set(0.5);
    btnText.position.set(130, 30);
    startBtn.addChild(btnBg, btnText);
    startBtn.position.set(centerX - 130, centerY + 90);
    
    startBtn.eventMode = 'static';
    startBtn.cursor = 'pointer';
    startBtn.on('pointerdown', () => this.onStartCallback());
    this.addChild(startBtn);
  }
}
