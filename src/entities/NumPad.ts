import { Container, Graphics, Text, TextStyle } from "pixi.js";

export class NumPad extends Container {
  private onKeyTapCallback: (digit: string) => void;
  private btnColors = ['#FFCCD5', '#DDF2FD', '#F3CCFF', '#D8F3DC', '#C7E9B4'];

  constructor(onKeyTap: (digit: string) => void) {
    super();
    this.onKeyTapCallback = onKeyTap;

    // COMPACT STYLE: Made font size smaller for small mobile screens
    const btnStyle = new TextStyle({
      fontFamily: 'Arial Rounded MT Bold, sans-serif',
      fontSize: 18, 
      fill: '#4A3E56',
      fontWeight: 'bold',
      stroke: { color: '#FFFFFF', width: 3 }
    });

    const keypadLayout = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['',  '0', '']
    ];

    // COMPACT SPACING: Tightened from 65/55 down to 50/42
    const spacingX = 52;
    const spacingY = 44;
    const btnRadius = 18; // Shrunk button circle size from 24 down to 18

    keypadLayout.forEach((row, rowIndex) => {
      row.forEach((digit, colIndex) => {
        if (digit === '') return;

        const keyBtn = new Container();
        const xOffset = (colIndex - 1) * spacingX;
        const yOffset = rowIndex * spacingY;
        keyBtn.position.set(xOffset, yOffset);

        const randomColor = this.btnColors[Math.floor(Math.random() * this.btnColors.length)];
        const bg = new Graphics()
          .circle(0, 0, btnRadius)
          .fill({ color: randomColor })
          .stroke({ color: '#4A3E56', width: 2 });

        const txt = new Text({ text: digit, style: btnStyle });
        txt.anchor.set(0.5);

        keyBtn.addChild(bg, txt);
        this.addChild(keyBtn);

        keyBtn.eventMode = 'static';
        keyBtn.cursor = 'pointer';
        
        keyBtn.on('pointerdown', () => {
          keyBtn.scale.set(0.85);
          this.onKeyTapCallback(digit);
        });

        keyBtn.on('pointerup', () => keyBtn.scale.set(1.0));
        keyBtn.on('pointerupoutside', () => keyBtn.scale.set(1.0));
      });
    });

    // POSITION FIX: Centered horizontally, pushed lower towards the floor boundary line
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight - 250; 
    this.visible = false; 
  }
}