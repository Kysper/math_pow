export class AutoPlay {
  public enabled = false;
  private answer: number = 0;
  private intervalMs = 600;

  public setAnswer(answer: number) {
    this.answer = answer;
  }

  public getAnswer() {
    return this.answer;
  }

  public getInvervalMs() {
    return this.intervalMs;
  }

  public toggle(key: string): void {
    if (key !== 'a') return;

    this.enabled = !this.enabled;
    console.log(`AutoPlay: ${this.enabled ? 'Enabled' : 'Disabled'}`);
  }

}