export class Prompt {

    prompt = undefined;

    /**
     * 
     * @param {string} prompt 
     */
    constructor(prompt) {
        this.prompt = prompt;
        this.prompttype = this.constructor.name;
    }

    static prompt(val) {
        var toRet = new Prompt(val);
        return (toRet);
    }

    /**
     * 
     * @returns {string}
     */
    toString() {
        return `${this.prompt}`;
    }

    static reconstitute(inJSON) {
        if (typeof inJSON === 'string' || inJSON instanceof String) {
            inJSON = JSON.parse(inJSON);
        }
        return (new Prompt(inJSON.prompt));
    }

    toJSON() {
        var toRet = { 'prompt': this.prompt, 'prompttype': this.prompttype };
        return (toRet);
    }

    getPrompt(vals) {
        return (this.prompt);
    }
}

// create a prompt class that holds a string prompt
export class TemplatePrompt extends Prompt {

    rawprompt = undefined;

    /**
     * 
     * @param {string} prompt 
     */
    constructor(prompt) {
        super(prompt);
        this.rawprompt = prompt
    }

    static prompt(val) {
        var toRet = new TemplatePrompt(val);
        return (toRet);
    }


    getPrompt(vals) {
        if (this.rawprompt) {
            this.prompt = this.rawprompt.interpolate(vals);
        }
        return (this.prompt);
    }

    toJSON() {
        var toRet = super.toJSON();
        toRet['rawprompt'] = this.rawprompt;
        return (toRet);
    }
}