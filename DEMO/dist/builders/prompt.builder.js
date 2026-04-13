"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptBuilder = void 0;
class PromptBuilder {
    constructor() {
        this.sections = [];
    }
    withSystem(prompt) {
        this.sections.push(prompt);
        return this;
    }
    withDeveloper(prompt) {
        this.sections.push(prompt);
        return this;
    }
    withOutputFormat(prompt) {
        this.sections.push(prompt);
        return this;
    }
    withUserInput(input) {
        this.sections.push(input);
        return this;
    }
    build() {
        return this.sections.join("\n\n");
    }
}
exports.PromptBuilder = PromptBuilder;
