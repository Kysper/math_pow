import { Container, Text } from 'pixi.js';

export class MathBlock extends Container {

    public expression: string = '';
    public velocityX: number = 0;
    public velocityY: number = .5; // Fall speed
    public isStacked: boolean = false;
    public answer: number = 0;
    public currentTyped: string | undefined = undefined;

    private style: Text;

    constructor(expression: string) {
        super();
        this.expression = expression;

        this.style = new Text({
            text: expression,
            style: {
                fontFamily: 'Arial',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0xffffff,
                align: 'center'
            }
        });

        this.style.anchor.set(0.5);
        this.addChild(this.style);
    }

    public update() {
        if (!this.isStacked) {
            this.y += this.velocityY;
        } else {
            this.velocityX *= 0.1;
            this.x += this.velocityX;
        }
    }

    public getAnswer(): number {
        const [num1, operator, num2] = this.expression.split(' ');

        switch (operator) {
            case '+':
                return parseFloat(num1) + parseFloat(num2);
            case '-':
                return parseFloat(num1) - parseFloat(num2);
            case '*':
                return parseFloat(num1) * parseFloat(num2);
            case '/':
               return (parseFloat(num1) == 0 || parseFloat(num2) == 0) ? 0 : parseFloat(num1) / parseFloat(num2);
              
            default:
                return 0;
        }
    }

    public highlight() {
        this.style.style.fill = 0xff0000; // Change text color to red
    }
}
