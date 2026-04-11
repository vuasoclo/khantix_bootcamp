export class PromptBuilder {
  private sections: string[] = [];

  withSystem(prompt: string): this {
    this.sections.push(prompt);
    return this;
  }

  withDeveloper(prompt: string): this {
    this.sections.push(prompt);
    return this;
  }

  withOutputFormat(prompt: string): this {
    this.sections.push(prompt);
    return this;
  }

  withUserInput(input: string): this {
    this.sections.push(input);
    return this;
  }

  build(): string {
    return this.sections.join("\n\n");
  }
}