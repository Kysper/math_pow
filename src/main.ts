import { Application, Container, Graphics, Text, TextStyle, Point } from "pixi.js";
import { GameScene } from './scenes/GameScene';
import { GameMenu } from './scenes/GameMenu';
import { ParticleSystem } from './systems/ParticleSystem';
import { ComboBar } from './systems/ComboBar';
import { SweeperCart } from './entities/SweeperCart';
import { Leaderboard } from './utils/LeaderBoard';
import { NumPad } from './entities/NumPad';


enum GameState { MENU, PLAYING, GAMEOVER }
let currentStatus = GameState.MENU;

let gameTimer = 60;
let score = 0;
let spawnCount = 0;
let timeSinceLastSpawn = 0;
const spawnInterval = 2000;

const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 2;
const maxDistanceFromCenter = window.innerWidth - 400;
const floorHeight = window.innerHeight - 80;

(async () => {
  const app = new Application();
  await app.init({ background: "#FFF9E6", resizeTo: window });
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  app.stage.sortableChildren = true;

  // Setup distinct rendering containers to keep layers stratified
  const worldContainer = new Container();
  const overlayContainer = new Container();
  const uiContainer = new Container();

  app.stage.addChild(worldContainer);
  app.stage.addChild(overlayContainer);
  app.stage.addChild(uiContainer);

  const gameScene = new GameScene();
  worldContainer.addChild(gameScene);

  const particleEngine = new ParticleSystem(app.stage, floorHeight);
  let fadeBg: Graphics | null = null;

  const comboMeter = new ComboBar();
  comboMeter.visible = false;
  comboMeter.x = window.innerWidth - 70;
  comboMeter.y = window.innerHeight / 2 - 125;
  uiContainer.addChild(comboMeter);

  // --- NEW: INITIALIZE THE MOBILE NUMPAD ---
  // When a child taps an on-screen button, it passes its string number value 
  // directly into our shared processDigitInput logic engine below!
  const touchKeypad = new NumPad((digit) => {
    processDigitInput(digit);
  });
  touchKeypad.zIndex = 5; // Layered safely over background assets
  uiContainer.addChild(touchKeypad);

  const scoreboard = new Leaderboard(centerX, centerY, () => {
    currentStatus = GameState.MENU;
    gameTimer = 60;
    score = 0;
    spawnCount = 0;

    if (fadeBg) { overlayContainer.removeChild(fadeBg); fadeBg.destroy(); fadeBg = null; }

    sweeperCart.forceReset();
    scoreboard.visible = false;
    comboMeter.resetCombo();
    gameScene.visible = false;
    sweeperCart.visible = false;
    scoreDisplay.visible = false;
    comboMeter.visible = false;
    touchKeypad.visible = false; // Hide keypad on reset back to menu
    gameMenu.visible = true;
  });
  scoreboard.visible = false;
  uiContainer.addChild(scoreboard);

  const sweeperCart = new SweeperCart(particleEngine);
  sweeperCart.visible = false;
  worldContainer.addChild(sweeperCart);

  const groundDecor = new Graphics().roundRect(0, floorHeight, window.innerWidth, 120, 20).fill({ color: "#FFD3E8" }).stroke({ color: "#FFFFFF", width: 4 });
  worldContainer.addChild(groundDecor);

  const gameMenu = new GameMenu(centerX, centerY, () => {
    currentStatus = GameState.PLAYING;
    gameMenu.visible = false;
    gameScene.visible = true;
    scoreDisplay.visible = true;
    sweeperCart.visible = true;
    comboMeter.visible = true;
    touchKeypad.visible = true; // --- REVEAL TOUCH KEYPAD WHEN RAMPING UP GAMEPLAY ---
  });
  uiContainer.addChild(gameMenu);
  gameScene.visible = false;

  const scoreDisplay = new Text({
    text: 'SCORE: 0',
    style: new TextStyle({
      fontFamily: 'Arial Rounded MT Bold, sans-serif', fontSize: 32, fill: '#FF70A6',
      stroke: { color: '#FFFFFF', width: 6 },
      dropShadow: { alpha: 0.12, angle: Math.PI / 2, blur: 2, color: '#4A3E56', distance: 4 }
    })
  });
  scoreDisplay.position.set(30, 30);
  scoreDisplay.visible = false;
  uiContainer.addChild(scoreDisplay);

  // --- REFACTORED: SHARED DATA INPUT LOGIC ---
  // This central clearinghouse handles calculations for both physical keys and mobile thumb touches!
  function processDigitInput(digitString: string) {
    const activeBlocks = gameScene.getMathProblems();

    for (let i = activeBlocks.length - 1; i >= 0; i--) {
      const block = activeBlocks[i];

      const currentGlobalPos = block.toGlobal(new Point(0, 0));
      if (currentGlobalPos.y >= floorHeight - 20) {
        continue;
      }

      const expectedAnswer = block.getAnswer().toString();
      if (block.currentTyped === undefined) block.currentTyped = "";
      const nextAttempt = block.currentTyped + digitString;

      if (expectedAnswer === nextAttempt) {
        const blockAny = block as any;
        let textStr = blockAny.problemTextString || "? + ?";
        const style = typeof blockAny.getTextStyle === 'function' ? blockAny.getTextStyle() : {};
        const globalPos = block.toGlobal(new Point(0, 0));

        particleEngine.createCharacterExplosion(globalPos.x, globalPos.y, textStr, style);

        const currentMultiplier = comboMeter.registerSuccess();
        score += 10 * currentMultiplier;

        scoreDisplay.text = `SCORE: ${score}`;
        gameScene.destroyMathProblem(i);
      }
      else if (expectedAnswer.startsWith(nextAttempt)) {
        block.currentTyped = nextAttempt;
      }
      else {
        if (gameMenu.isExpertMode) {
          block.currentTyped = "";
        }
      }
    }
  }

  // Physical Computer Keyboard Event Routing
  window.addEventListener('keydown', (e) => {
    if (currentStatus !== GameState.PLAYING) return;
    if (e.key >= '0' && e.key <= '9') {
      processDigitInput(e.key); // Pass the raw key string into our unified input function
    }
  });

  // Ticker Updates Loop
  app.ticker.add((ticker) => {
    const dt = ticker.deltaTime;
    particleEngine.update(dt);

    if (currentStatus === GameState.PLAYING || currentStatus === GameState.GAMEOVER) {
      if (sweeperCart.visible) sweeperCart.update(dt);
      if (comboMeter.visible && currentStatus === GameState.PLAYING) comboMeter.update(ticker.elapsedMS);
    }

    if (currentStatus !== GameState.PLAYING) return;

    gameTimer -= ticker.elapsedMS / 1000;
    if (gameTimer <= 0) {
      currentStatus = GameState.GAMEOVER;

      particleEngine.triggerWinConfetti();
      sweeperCart.triggerVictorySequence();

      scoreboard.submitScore(score);
      scoreboard.renderScores();

      fadeBg = new Graphics().rect(0, 0, window.innerWidth, window.innerHeight).fill({ color: "#5C4D7D", alpha: 0.6 });
      overlayContainer.addChild(fadeBg);

      scoreboard.visible = true;
      touchKeypad.visible = false; // --- HIDE KEYPAD ON GAME OVER CELEBRATION SCREEN ---

      scoreDisplay.anchor.set(0.5);
      scoreDisplay.position.set(centerX, centerY - 220);
      scoreDisplay.text = `FINAL SCORE: ${score}`;

      gameScene.visible = false;
    }

    timeSinceLastSpawn += ticker.elapsedMS;
    if (timeSinceLastSpawn >= spawnInterval) {
      const op = gameMenu.selectedOperators[Math.floor(Math.random() * gameMenu.selectedOperators.length)];
      let num1 = Math.floor(Math.random() * 10);
      let num2 = Math.floor(Math.random() * 10);
      if (op === '-' && num2 > num1) { const temp = num1; num1 = num2; num2 = temp; }

      const problemStr = `${num1} ${op} ${num2}`;
      
      // --- FIXED: CHANGE centerY TO 80 ---
      // This forces equations to spawn at the very top of your phone screen!
      gameScene.spawnMathProblem(problemStr, [centerX + (Math.random() - 0.5) * maxDistanceFromCenter, 80]);

      const activeBlocks = gameScene.getMathProblems();
      if (activeBlocks.length > 0) {
        const latestBlock = activeBlocks[activeBlocks.length - 1] as any;
        latestBlock.problemTextString = problemStr;
        applyCuteBubbleStyling(latestBlock);
      }

      spawnCount++;
      timeSinceLastSpawn = 0;
    }

    gameScene.getMathProblems().forEach(block => block.update());
  });
})();

function applyCuteBubbleStyling(block: any): void {
  const textNode = block.children?.find((child: any) => child instanceof Text) as Text | undefined;
  if (!textNode) return;

  textNode.style = new TextStyle({
    fontFamily: 'Arial Rounded MT Bold, sans-serif',
    fontSize: 28,
    fontWeight: 'bold',
    fill: '#4A3E56',
    stroke: { color: '#FFFFFF', width: 4 },
  });
  textNode.anchor.set(0.5);

  const padX = 30; const padY = 15;
  const bubbleWidth = textNode.width + padX * 2;
  const bubbleHeight = textNode.height + padY * 2;

  const bubbleBackingColors = ['#FFCCD5', '#D8F3DC', '#C7E9B4', '#DDF2FD', '#F3CCFF'];
  const chosenColor = bubbleBackingColors[Math.floor(Math.random() * bubbleBackingColors.length)];

  const bubblePlate = new Graphics().roundRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 22).fill({ color: chosenColor }).stroke({ color: '#FFFFFF', width: 5 });
  block.addChildAt(bubblePlate, 0);
}