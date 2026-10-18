import { Container, Graphics, Text, TextStyle } from "pixi.js";

interface ScoreEntry {
  score: number;
  date: string;
}

export class Leaderboard extends Container {
  private STORAGE_KEY = "cute_math_shooter_high_scores";
  private panelBg: Graphics;
  private listContainer: Container;
  private onPlayAgainCallback: () => void;

  constructor(centerX: number, centerY: number, onPlayAgain: () => void) {
    super();
    this.onPlayAgainCallback = onPlayAgain;

    this.panelBg = new Graphics()
      .roundRect(-160, -180, 320, 370, 24)
      .fill({ color: "#F3CCFF", alpha: 0.95 }) 
      .stroke({ color: "#FFFFFF", width: 5 }); 

    const titleStyle = new TextStyle({
      fontFamily: 'Arial Rounded MT Bold, sans-serif',
      fontSize: 26,
      fill: '#4A3E56',
      fontWeight: 'bold',
      stroke: { color: '#FFFFFF', width: 4 }
    });

    // CLEANED: Title uses a traditional text layout header string
    const title = new Text({ text: "HIGH SCORES", style: titleStyle });
    title.anchor.set(0.5);
    title.position.set(0, -140);

    this.listContainer = new Container();
    this.listContainer.position.set(0, -90);

    this.addChild(this.panelBg, title, this.listContainer);

    const playAgainBtn = new Container();
    playAgainBtn.y = 150;

    const btnBg = new Graphics()
      .roundRect(-100, -22, 200, 44, 14)
      .fill({ color: '#70D6FF' }) 
      .stroke({ color: '#FFFFFF', width: 3 });

    // CLEANED: Button has simple, clean arcade text
    const btnTxt = new Text({
      text: 'PLAY AGAIN',
      style: new TextStyle({ 
        fontFamily: 'Arial Rounded MT Bold, sans-serif', 
        fontSize: 18, 
        fill: '#FFFFFF',
        stroke: { color: '#4A3E56', width: 3 }
      })
    });
    btnTxt.anchor.set(0.5);

    playAgainBtn.addChild(btnBg, btnTxt);
    playAgainBtn.eventMode = 'static';
    playAgainBtn.cursor = 'pointer';
    playAgainBtn.on('pointerdown', () => this.onPlayAgainCallback());

    this.addChild(playAgainBtn);
    this.position.set(centerX, centerY - 20);
    this.visible = false; 
  }

  private loadScores(): ScoreEntry[] {
    const rawData = localStorage.getItem(this.STORAGE_KEY);
    if (!rawData) return [];
    try { return JSON.parse(rawData); } catch { return []; }
  }

  public submitScore(newScore: number): boolean {
    if (newScore <= 0) return false;
    const scores = this.loadScores();
    const today = new Date();
    const dateString = `${today.getMonth() + 1}/${today.getDate()}`;
    
    scores.push({ score: newScore, date: dateString });
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 5);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(topScores));
    return topScores.some(entry => entry.score === newScore && entry.date === dateString);
  }

  public renderScores(): void {
    this.listContainer.removeChildren().forEach(child => child.destroy());
    const scores = this.loadScores();
    const rowStyle = new TextStyle({
      fontFamily: 'Arial Rounded MT Bold, sans-serif',
      fontSize: 18,
      fill: '#4A3E56',
      fontWeight: 'bold'
    });

    if (scores.length === 0) {
      const placeholder = new Text({ text: "No scores recorded yet.", style: rowStyle });
      placeholder.style.align = 'center';
      placeholder.anchor.set(0.5);
      placeholder.position.set(0, 70);
      this.listContainer.addChild(placeholder);
      return;
    }

    scores.forEach((entry, index) => {
      const rowContainer = new Container();
      rowContainer.y = index * 40;

      // CLEANED: Replaced medal emojis with traditional alphanumeric ranking dots
      const rankingPrefix = `${index + 1}. `;

      const leftText = new Text({ text: `${rankingPrefix}SCORE: ${entry.score}`, style: rowStyle });
      leftText.x = -120;

      const rightText = new Text({ text: entry.date, style: rowStyle });
      rightText.anchor.set(1, 0);
      rightText.x = 120;

      rowContainer.addChild(leftText, rightText);
      this.listContainer.addChild(rowContainer);
    });
  }
}