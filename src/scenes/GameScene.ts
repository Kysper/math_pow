import { Container } from 'pixi.js';
import { MathBlock } from '../entities/MathBlock';

export class GameScene extends Container {
    private mathBlocks: MathBlock[] = [];

    constructor() {
        super();
    }

    public spawnMathProblem(expression: string, [x, y]: [number, number]): void {
        const block = new MathBlock(expression);
        block.x = x;
        block.y = y;

        this.addChild(block);
        this.mathBlocks.push(block);
    }

    public getMathProblems(): MathBlock[] {
        return this.mathBlocks;
    }

    public generateMathProblem(operator: string, minNumber: number, maxNumber: number) {

        const num1 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
        const num2 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
        switch (operator) {
            case "+":
                return new MathBlock(`${num1} + ${num2}`);
            case "-":
                return new MathBlock(`${num1} - ${num2}`);
            case "*":
                return new MathBlock(`${num1} * ${num2}`);
            case "/":
                return new MathBlock(`${num1} / ${num2}`);
        }

    }

    public destroyMathProblem(index: number): void {
        const block = this.mathBlocks[index];
        this.removeChild(block);
        this.mathBlocks.splice(index, 1);
    }
}