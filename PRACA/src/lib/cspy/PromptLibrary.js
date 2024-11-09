export class PromptLibrary {

    static prompts = {};

    static addPrompt(name, prompt) {
        this.prompts[name] = prompt;
    }

    static getPrompt(name) {
        return this.prompts[name];
    }
}
