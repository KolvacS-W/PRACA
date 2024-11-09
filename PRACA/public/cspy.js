//import { PromptLibrary } from "./PromptLibrary.js";

// basic CSPY class that we will extend
class CSPY {
    constructor() {
    }

    // return a string reprsentation of the object, iterate over all properties
    toString() {
        return Object.entries(this).map(([key, value]) => `${key}: ${value}`).join("\n");
    }

    getClassName() {
        return this.constructor.name;
    }

    static toJSON() {
        return JSON.parse(JSON.stringify(this.prototype, null, 2));
    }
}


// create an input class that can hold an input value "name", an optional explanation, an optional default value, and an optional type

class Input {

    params = {};

    constructor(vals = undefined) {
        this.setParameters(vals);
        if (vals) {
            if (!vals['inputtype']) {
                this.setParameter('inputtype', this.constructor.name);
            }
        }
    }


    static description(val) {
        var toRet = new Input();
        toRet.setParameter('description', val);
        return (toRet);
    }

    description(val) {
        this.setParameter('description', val);
        return (this);
    }

    getDescription() {
        if (this.params['description']) {
            return (this.params['description']);
        } else if (this.params['variableName']) {
            return (this.params['variableName']);
        } else {
            return ("");
        }
    }

    default(val) {
        this.setParameter('default', val);
        return (this);
    }

    getDefault() {
        return (this.params['default']);
    }

    explanation(val) {
        this.setParameter('explanation', val);
        return (this);
    }

    getExplanation() {
        return (this.params['explanation']);
    }

    type(val) {
        this.setParameter('type', val);
        // update the defaultValue to the type
        this.setParameter('default', this.params['default']);
        return (this);
    }

    getType() {
        return (this.params['type']);
    }

    value() {
        return (this.params['default']);
    }

    name(val) {
        this.setParameter('variableName', val);
        return (this);
    }

    setParameter(key, value) {
        if (key == 'type') {
            value = Input.getType(this.params['default'], value);
            this.params[key] = value;
        } else if (key == 'default') {
            value = Input.convert(value, this.params['type']);
            this.params[key] = value;
            // if the type is undefined, set it to the type of the value
            if (!this.params['type']) {
                this.setParameter('type', undefined);
            }
        } else {
            this.params[key] = value;
        }
        return (this);
    }

    setParameters(params) {
        if (params) {
            Object.keys(params).forEach(name => {
                this.setParameter(name, params[name]);
            });
        }
        return (this);
    }

    static getType(defaultValue, type = undefined) {
        if (type) {
            return (type);
        } else {
            var ttype = typeof defaultValue;
            if (ttype == 'object') {
                ttype = 'string';
            }
            return (ttype);
        }
    }

    static convert(defaultValue, type) {
        if (defaultValue) {
            if (typeof defaultValue === 'string' || defaultValue instanceof String) {
                if (type == 'number') {
                    return (parseFloat(defaultValue))
                } else if (type == 'boolean') {
                    if ((/true/i).test(defaultValue)) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (type == 'JSON') {
                    return (JSON.parse(defaultValue));
                }
            }
        }
        return (defaultValue);
    }

    static reconstitute(inJSON) {
        if (typeof inJSON === 'string' || inJSON instanceof String) {
            inJSON = JSON.parse(inJSON);
        }
        var toRet = new Input({
            'description': inJSON.description,
            'default': inJSON.default,
            'explanation': inJSON.explanation,
            'type': inJSON.type,
            'variableName': inJSON.variableName
        });
        return (toRet);
    }

    /**
     * 
     * @returns {string}
     */
    toString() {
        return `${this.params.description}: ${this.params.default} ${this.params.explanation} (${this.params.type})`;
    }

    clone() {
        let clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
        return (clone);
    }

    toJSON() {
        var toRet = {
            'description': this.params.description,
            'default': this.params.default,
            'explanation': this.params.explanation,
            'type': this.params.type,
            'inputtype': this.params.inputtype,
            'variableName': this.params.variableName
        };
        return (toRet);
    }
}

class ComputedInput extends Input {
    constructor(params) {
        super(params);
        //this.inputtype = "ComputedInput";
    }

    async compute() {
        //
    }

    static reconstitute(inJSON) {
        if (typeof inJSON === 'string' || inJSON instanceof String) {
            inJSON = JSON.parse(inJSON);
        }
        var toRet = new ComputedInput({
            'description': inJSON.description,
            'default': inJSON.default,
            'explanation': inJSON.explanation,
            'type': inJSON.type,
            'variableName': inJSON.variableName
        });
        return (toRet);
    }

}


class RandomChoiceInput extends ComputedInput {

    constructor(params = undefined) {
        super(params);
        if (params) {
            if (!this.params['type']) {
                // try to infer the type
                if (this.params['choices']) {
                    var choices = this.params['choices'];
                    if (Array.isArray(choices)) {
                        if (choices.length > 0) {
                            this.setParameter('type', Input.getType(choices[0], this.params['type']));
                        }
                    }
                }
            }
        }
    }


    choices(val) {
        this.setParameter('choices', val);
        return (this);
    }

    getChoices() {
        return (this.params['choices']);
    }

    static choices(val) {
        var toRet = new RandomChoiceInput();
        toRet.setParameter('choices', val);
        return (toRet);
    }

    static description(val) {
        var toRet = new RandomChoiceInput();
        toRet.setParameter('description', val);
        return (toRet);
    }

    async compute() {
        if (this.params['choices'] && this.params['choices'].length == 0) {
            this.setParameter('default', undefined);
        } else {
            this.setParameter('default', Input.convert(this.params['choices'][(Math.floor(Math.random() * this.params['choices'].length))]));
        }
    }

    static reconstitute(inJSON) {
        if (typeof inJSON === 'string' || inJSON instanceof String) {
            inJSON = JSON.parse(inJSON);
        }
        var toRet = new RandomChoiceInput({
            'description': inJSON.description,
            'choices': inJSON.choices,
            'type': inJSON.type,
            'default': inJSON.default,
            'explanation': inJSON.explanation,
            'variableName': inJSON.variableName
        });
        return (toRet);
    }

    toJSON() {
        var toRet = super.toJSON();
        if (this.params['choices']) {
            toRet['choices'] = this.params['choices'].map((x) => x);
        }
        return (toRet);
    }
}

class LLMChoiceInput extends RandomChoiceInput {


    constructor(params = undefined) {
        super(params)
        //console.log("STATIC INPUT",description, defaultValue, explanation, type);
        if (params && params['llm']) {
            super.setParameter('llm', params['llm']);
        } else {
            super.setParameter('llm', GroqGen.getModels()[0]);
        }
        //this.inputtype = "LLMChoiceInput";
    }

    llm(val) {
        this.setParameter('llm', val);
        return (this);
    }

    getLLM() {
        return (this.params['llm']);
    }

    static description(val) {
        var toRet = new LLMChoiceInput();
        toRet.setParameter('description', val);
        return (toRet);
    }


    static reconstitute(inJSON) {
        if (typeof inJSON === 'string' || inJSON instanceof String) {
            inJSON = JSON.parse(inJSON);
        }
        var toRet = new LLMChoiceInput({
            'description': inJSON.description,
            'choices': inJSON.choices,
            'type': inJSON.type,
            'default': inJSON.default,
            'explanation': inJSON.explanation,
            'llm': inJSON.llm,
            'variableName': inJSON.variableName
        });
        return (toRet);
    }

    async compute() {
        //console.log("*********");
        if (!this.params['choices'] || this.params['choices'].length == 0) {
            // to to execute 
            var prompt = "Return a list for " + this.getDescription() + "." +
                " Return the list formatted as a javascript array " +
                " (e.g., ['a','b','c'] or [1,5,9]).\n" +
                " Do no return any additional text before or after the array.";

            console.log("prompt", prompt);
            var data = await GroqGen.getInstance().generate(prompt, (resp) => {
                console.log("resp", resp);
                this.params['choices'] = eval(resp);
            }, this.params['llm']);
            console.log("--------", this.params['choices']);
        }
        this.setParameter('default', Input.convert(this.params['choices'][(Math.floor(Math.random() * this.params['choices'].length))]));
    }

    toJSON() {
        var toRet = super.toJSON();
        toRet['llm'] = this.params['llm'];
        return (toRet);
    }
}


class ImageInput extends ComputedInput {

    constructor(params) {
        //console.log("STATIC INPUT",description, defaultValue, explanation, type);
        super(params);
        if (!this.params['llm']) {
            this.llm = { 'llm': 'OpenAI', 'model': 'gpt-4o' };
        }
        //this.inputtype = "LLMChoiceInput";
    }

    llm(val) {
        this.setParameter('llm', val);
        return (this);
    }

    getLLM() {
        return (this.params['llm']);
    }

    url(val) {
        this.setParameter('url', val);
        return (this);
    }

    getURL() {
        return (this.params['url']);
    }

    static URL(val) {
        var toRet = new ImageInput();
        toRet.setParameter('url', val);
        return (toRet);
    }

    static reconstitute(inJSON) {
        if (typeof inJSON === 'string' || inJSON instanceof String) {
            inJSON = JSON.parse(inJSON);
        }
        var toRet = new ImageInput({
            'description': inJSON.description,
            'default': inJSON.default,
            'explanation': inJSON.explanation,
            'type': inJSON.type,
            'url': inJSON.url,
            'llm': inJSON.llm,
            'variableName': inJSON.variableName
        });
        return (toRet);
    }

    async compute() {
        if (!this.params['default']) {
            // to to execute 
            //var prompt = "Visually describe the details of this image so that we can render a stylized SVG of it.";
            var prompt = "describe what's in the uploaded image";
            var data = await OpenAIGen.getInstance().processImage(prompt, this.params.url, (resp) => {
                this.setParameter('default', resp);
            }, this.params.llm);
        }
    }

    toJSON() {
        var toRet = super.toJSON();
        toRet['url'] = this.params['url'];
        toRet['llm'] = this.params['llm'];
        return (toRet);
    }
}

class StaticInput extends Input {

    constructor(params = undefined) {
        //console.log("STATIC INPUT",description, defaultValue, explanation, type);
        super(params);
        // this.inputtype = "StaticInput";

    }

    static description(val) {
        var toRet = new StaticInput();
        toRet.setParameter('description', val);
        return (toRet);
    }

    static reconstitute(inJSON) {
        if (typeof inJSON === 'string' || inJSON instanceof String) {
            inJSON = JSON.parse(inJSON);
        }
        var toRet = new StaticInput({
            'description': inJSON.description,
            'default': inJSON.default,
            'explanation': inJSON.explanation,
            'type': inJSON.type,
            'variableName': inJSON.variableName
        });
        return (toRet);
    }

}


class ContextInput extends Input {

    constructor(params = undefined) {
        super(params);
        if (params) {
            if (params.context) {
                if (typeof params.context == SVGGen) {
                    if (params.context.svgString) {
                        this.setParameter('context', params.context.svgString);
                    } else {
                        throw new Error("contextObject does not seem to have an svgString (make sure you have called getSVG() on it before passing it to the ContextInput)");
                    }
                } else {
                    // assume it is a string
                    this.setParameter('context', params.context.toString());
                }
            }
        }
        super.setParameter('type', 'svg_string');
    }

    context(val) {
        if (typeof val == SVGGen) {
            this.setParameter('context', val.svgString);
        } else {
            this.setParameter('context', val.toString());
        }
        return (this);
    }

    value() {
        return (this.params['context']);
    }

    static context(val) {
        var toRet = new ContextInput();
        toRet.setParameter('context', val);
        return (toRet);
    }

    toJSON() {
        var toRet = super.toJSON();
        toRet['context'] = this.params['context'];
        return (toRet);
    }

    static reconstitute(inJSON) {
        if (typeof inJSON === 'string' || inJSON instanceof String) {
            inJSON = JSON.parse(inJSON);
        }
        var toRet = new ContextInput({
            'description': inJSON.description,
            'default': inJSON.default,
            'explanation': inJSON.explanation,
            'type': inJSON.type,
            'context': inJSON.context,
            'variableName': inJSON.variableName
        });
        return (toRet);
    }
}


// demo script for command line usage
//const input = new Input("name", "the name of the house", "John Doe", "string");
//CSPYCompiler.log(input.toString());




// create a prompt class that holds a string prompt
class Prompt {

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
class TemplatePrompt extends Prompt {

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


class AnthropicGen {

    // make as singleton pattern
    static instance = undefined;
    static apiKey = undefined;
    static model = { 'llm': 'Anthropic', 'model': "claude-3-5-sonnet-latest" };

    static models = ["claude-3-5-sonnet-latest", "claude-3-opus-latest",
        "claude-3-sonnet-2024022", "claude-3-haiku-20240307"];
    //static model = "claude-3-haiku-20240307";

    static getModels() {
        // for each model in models
        var toRet = [];
        for (var i = 0; i < AnthropicGen.models.length; i++) {
            var model = AnthropicGen.models[i];
            toRet.push({ 'llm': 'Anthropic', 'model': model });
        }
        return toRet;
    }

    /**
     * 
     */
    constructor(key) {
        if (!AnthropicGen.instance) {
            AnthropicGen.instance = this;
        }
        if (key == undefined) {
            this.loadKey();
        } else {
            AnthropicGen.apiKey = key;
        }
        return (AnthropicGen.instance);
    }

    static setModel(model) {
        AnthropicGen.model = model;
    }

    async loadKey() {
        try {
            // Use fetch to read the file instead of require('fs')
            if (AnthropicGen.apiKey) {
                return;
            }
            AnthropicGen.apiKey = process.env.CSPY_KEY;
        } catch (err) {
            // do nothing, key is not set
        }
        try {
            // try to fetch from the .key file if running in browser
            await fetch('.key')
                .then(response => response.text())
                .then(key => {
                    AnthropicGen.apiKey = key.trim();
                    CSPYCompiler.log(AnthropicGen.apiKey);
                    return;
                })
                .catch(err => {
                    console.error('Error fetching API key:', err);
                });

        } catch (err) {

        }
        CSPYCompiler.log(AnthropicGen.apiKey);
    }

    /**
     * 
     * @returns {AnthropicGen}
     */
    static getInstance() {
        if (!AnthropicGen.instance) {
            AnthropicGen.instance = new AnthropicGen();
        }
        return AnthropicGen.instance;
    }

    /**
     * 
     * @param {string} apiKey 
     */
    static setApiKey(apiKey) {
        AnthropicGen.apiKey = apiKey;
    }

    /**
     * 
     * @param {string} prompt 
     * @returns {string}
     */
    async generate(prompt, callback, llm = undefined) {
        if (!AnthropicGen.apiKey) {
            throw new Error("AnthropicGen API key not set");
        }
        //CSPYCompiler.log("using model: " + AnthropicGen.model);

        if (!llm) {
            llm = AnthropicGen.model;
        }

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": AnthropicGen.apiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
                "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
                model: llm.model,
                max_tokens: 1024,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                        ],
                    },
                ],
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                try {
                    const genresp = data.content[0].text;
                    if (callback) {
                        callback(genresp);
                    }
                } catch (err) {
                    console.log(err, data);
                }
            });
    }

    /**
     * 
     * @param {string} prompts 
     * @returns {string}
     */
    async generateMultiturn(prompts, callback, llm = undefined) {
        if (!AnthropicGen.apiKey) {
            throw new Error("AnthropicGen API key not set");
        }
        //CSPYCompiler.log("using model: " + AnthropicGen.model);

        if (!llm) {
            llm = AnthropicGen.model;
        }

        var messages = [];
        var genresp = undefined;

        while (prompts.length > 0) {
            //console.log("****",prompts);
            var prompt = prompts.shift();

            messages.push({ role: "user", content: [{ type: "text", text: prompt }] });

            //console.log("---- PROMPTS")
            //console.log(prompts);

            //console.log("---- MESSAGES")
            //console.log(messages);



            var response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "x-api-key": AnthropicGen.apiKey,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                    "anthropic-dangerous-direct-browser-access": "true",
                },
                body: JSON.stringify({
                    model: llm.model,
                    max_tokens: 2048,
                    messages: messages,
                }),
            });

            try {
                var json = await response.json();
                genresp = json.content[0].text;
                CSPYCompiler.log(genresp);
                messages.push({ role: "assistant", content: [{ type: "text", text: genresp },], });
            } catch (err) {
                console.log(err, json);
            }
        }
        if (callback) {
            callback(genresp);
        }
    }
}

class OpenAIGen {

    // make as singleton pattern
    static instance = undefined;
    static apiKey = undefined;
    static model = { 'llm': 'OpenAI', 'model': "gpt-4o-mini" };

    static models = ["gpt-4o", "gpt-4o-mini", "o1-preview", "o1-mini",
        "gpt-4-turbo", "gpt-4-turbo-preview"];

    static getModels() {
        // for each model in models
        var toRet = [];
        for (var i = 0; i < OpenAIGen.models.length; i++) {
            var model = OpenAIGen.models[i];
            toRet.push({ 'llm': 'OpenAI', 'model': model });
        }
        return toRet;
    }

    /**
     * 
     */
    constructor(key) {
        if (!OpenAIGen.instance) {
            OpenAIGen.instance = this;
        }
        if (key == undefined) {
            this.loadKey();
        } else {
            OpenAIGen.apiKey = key;
        }
        return (OpenAIGen.instance);
    }

    static setModel(model) {
        OpenAIGen.model = model;
    }

    async loadKey() {
        try {
            // Use fetch to read the file instead of require('fs')
            if (OpenAIGen.apiKey) {
                return;
            }
            OpenAIGen.apiKey = process.env.OAI_CSPY_KEY;
        } catch (err) {
            // do nothing, key is not set
        }
        try {
            // try to fetch from the .key file if running in browser
            await fetch('.key.openai')
                .then(response => response.text())
                .then(key => {
                    OpenAIGen.apiKey = key.trim();
                    CSPYCompiler.log(OpenAIGen.apiKey);
                    return;
                })
                .catch(err => {
                    console.error('Error fetching API key:', err);
                });

        } catch (err) {

        }
        CSPYCompiler.log(OpenAIGen.apiKey);
    }

    /**
     * 
     * @returns {OpenAIGen}
     */
    static getInstance() {
        if (!OpenAIGen.instance) {
            OpenAIGen.instance = new OpenAIGen();
        }
        return OpenAIGen.instance;
    }

    /**
     * 
     * @param {string} apiKey 
     */
    static setApiKey(apiKey) {
        OpenAIGen.apiKey = apiKey;
    }

    /**
     * 
     * @param {string} prompt 
     * @returns {string}
     */
    async generate(prompt, callback, llm = undefined) {
        if (!OpenAIGen.apiKey) {
            throw new Error("OpenAIGen API key not set");
        }
        //CSPYCompiler.log("using model: " + OpenAIGen.model);

        if (!llm) {
            llm = OpenAIGen.model;
        }


        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "authorization": "Bearer " + OpenAIGen.apiKey,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: llm.model,
                max_tokens: 1024,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                        ],
                    },
                ],
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                //console.log(data.choices[0]);
                try {
                    var genresp = data.choices[0].message.content;
                    if (genresp.startsWith("```svg")) {
                        genresp = genresp.slice(6);
                    }
                    if (genresp.startsWith("```javascript")) {
                        genresp = genresp.slice(13);
                    }
                    if (genresp.startsWith("```")) {
                        genresp = genresp.slice(3);
                    }
                    if (genresp.endsWith("```")) {
                        genresp = genresp.slice(0, -3);
                    }

                    if (callback) {
                        callback(genresp);
                    }
                } catch (err) {
                    console.log(err, data);
                }

            });
    }

    /**
     * 
     * @param {string} prompt 
     * @returns {string}
     */
    async processImage(prompt, imageurl, callback, llm = undefined) {
        if (!OpenAIGen.apiKey) {
            throw new Error("OpenAIGen API key not set");
        }
        //CSPYCompiler.log("using model: " + OpenAIGen.model);

        if (!llm) {
            llm = OpenAIGen.model;
        }
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "authorization": "Bearer " + OpenAIGen.apiKey,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: llm.model,
                max_tokens: 2048,
                top_p: 1,
                frequency_penalty: 0,
                response_format: { type: 'text' },
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageurl
                                }
                            },
                            {
                                type: "text",
                                text: prompt
                            }
                        ],
                    },
                ],
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                //console.log(data.choices[0]);
                try {
                    var genresp = data.choices[0].message.content;

                    if (callback) {
                        callback(genresp);
                    }
                } catch (err) {
                    console.log(err, data);
                }

            });
    }

    /**
     * 
     * @param {string} prompts 
     * @returns {string}
     */
    async generateMultiturn(prompts, callback, llm = undefined) {
        if (!OpenAIGen.apiKey) {
            throw new Error("OpenAIGen API key not set");
        }
        //CSPYCompiler.log("using model: " + OpenAIGen.model);

        if (!llm) {
            llm = OpenAIGen.model;
        }

        var messages = [];
        var genresp = undefined;

        while (prompts.length > 0) {
            //console.log("****",prompts);
            var prompt = prompts.shift();

            messages.push({ role: "user", content: [{ type: "text", text: prompt }] });

            //console.log("---- PROMPTS")
            //console.log(prompts);

            //console.log("---- MESSAGES")
            //console.log(messages);



            var response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "authorization": "Bearer " + OpenAIGen.apiKey,
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    model: llm.model,
                    max_tokens: 2048,
                    messages: messages,
                }),
            });

            try {
                var json = await response.json();
                genresp = json.choices[0].message.content;
                CSPYCompiler.log(genresp);
                messages.push({ role: "assistant", content: [{ type: "text", text: genresp },], });
            } catch (err) {
                console.log(err, json);
            }
        }
        if (genresp.startsWith("```svg")) {
            genresp = genresp.slice(6);
        }
        if (genresp.startsWith("```javascript")) {
            genresp = genresp.slice(13);
        }
        if (genresp.startsWith("```")) {
            genresp = genresp.slice(3);
        }
        if (genresp.endsWith("```")) {
            genresp = genresp.slice(0, -3);
        }

        if (callback) {
            callback(genresp);
        }
    }
}

class GroqGen {

    // make as singleton pattern
    static instance = undefined;
    static apiKey = undefined;
    static model = { 'llm': 'Groq', 'model': "llama-3.2-90b-text-preview" };
    static models = ["llama-3.2-90b-text-preview", "llama-3.2-11b-text-preview", "llama-3.2-1b-preview", "mixtral-8x7b-32768"];

    static getModels() {
        // for each model in models
        var toRet = [];
        for (var i = 0; i < GroqGen.models.length; i++) {
            var model = GroqGen.models[i];
            toRet.push({ 'llm': 'Groq', 'model': model });
        }
        return toRet;
    }

    /**
     * 
     */
    constructor(key) {
        if (!GroqGen.instance) {
            GroqGen.instance = this;
        }
        if (key == undefined) {
            this.loadKey();
        } else {
            GroqGen.apiKey = key;
        }
        return (GroqGen.instance);
    }

    static setModel(model) {
        // fix to check that it's an object
        GroqGen.model = model;
    }

    async loadKey() {
        try {
            // Use fetch to read the file instead of require('fs')
            if (GroqGen.apiKey) {
                return;
            }
            GroqGen.apiKey = process.env.GROQ_CSPY_KEY;
        } catch (err) {
            // do nothing, key is not set
        }
        try {
            // try to fetch from the .key file if running in browser
            await fetch('.key.groq')
                .then(response => response.text())
                .then(key => {
                    GroqGen.apiKey = key.trim();
                    CSPYCompiler.log(GroqGen.apiKey);
                    return;
                })
                .catch(err => {
                    console.error('Error fetching API key:', err);
                });

        } catch (err) {

        }
        CSPYCompiler.log(GroqGen.apiKey);
    }

    /**
     * 
     * @returns {GroqGen}
     */
    static getInstance() {
        if (!GroqGen.instance) {
            GroqGen.instance = new GroqGen();
        }
        return GroqGen.instance;
    }

    /**
     * 
     * @param {string} apiKey 
     */
    static setApiKey(apiKey) {
        GroqGen.apiKey = apiKey;
    }

    /**
     * 
     * @param {string} prompt 
     * @returns {string}
     */
    async generate(prompt, callback, llm = undefined) {
        if (!GroqGen.apiKey) {
            throw new Error("GroqGen API key not set");
        }

        if (!llm) {
            llm = GroqGen.model;
        }
        //CSPYCompiler.log("using model: " + GroqGen.model);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "authorization": "Bearer " + GroqGen.apiKey,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: llm.model,
                max_tokens: 1024,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                        ],
                    },
                ],
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                //  console.log(data);
                // console.log(data.choices[0].message.content);
                try {
                    var genresp = data.choices[0].message.content;
                    if (genresp.startsWith("```svg")) {
                        genresp = genresp.slice(6);
                    }
                    if (genresp.startsWith("```javascript")) {
                        genresp = genresp.slice(13);
                    }
                    if (genresp.startsWith("```")) {
                        genresp = genresp.slice(3);
                    }
                    if (genresp.endsWith("```")) {
                        genresp = genresp.slice(0, -3);
                    }
                    if (callback) {
                        callback(genresp);
                    }
                } catch (err) {
                    console.log(err, data);
                }

            });
    }

    /**
     * 
     * @param {string} prompts 
     * @returns {string}
     */
    async generateMultiturn(prompts, callback, llm = undefined) {
        if (!GroqGen.apiKey) {
            throw new Error("GroqGen API key not set");
        }
        //CSPYCompiler.log("using model: " + GroqGen.model);

        if (!llm) {
            llm = GroqGen.model;
        }

        var messages = [];
        var genresp = undefined;

        while (prompts.length > 0) {
            //console.log("****",prompts);
            var prompt = prompts.shift();

            messages.push({ role: "user", content: [{ type: "text", text: prompt }] });

            //console.log("---- PROMPTS")
            //console.log(prompts);

            //console.log("---- MESSAGES")
            //console.log(messages);



            var response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "authorization": "Bearer " + GroqGen.apiKey,
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    model: llm.model,
                    max_tokens: 2048,
                    messages: messages,
                }),
            });

            try {
                var json = await response.json();
                console.log(json);
                genresp = json.choices[0].message.content;
                CSPYCompiler.log(genresp);
                messages.push({ role: "assistant", content: genresp });
                console.log(messages);
            } catch (err) {
                console.log(err, json);
            }

        }
        if (genresp.startsWith("```svg")) {
            genresp = genresp.slice(6);
        }
        if (genresp.startsWith("```javascript")) {
            genresp = genresp.slice(13);
        }
        if (genresp.startsWith("```")) {
            genresp = genresp.slice(3);
        }
        if (genresp.endsWith("```")) {
            genresp = genresp.slice(0, -3);
        }
        if (callback) {
            callback(genresp);
        }
    }
}
class SVGGen {

    svgString = undefined;

    //inputs = {};

    /**
     * 
     * @returns {string}
     */
    async getSVG(callback = undefined) {
        //CSPYCompiler.log(typeof this.svgString);
        if (callback) {
            await callback(this.svgString);
        }
        return this.svgString;
    }

    getInputKeys() {
        return (Object.keys(this.inputs));
    }

    setParameter(name, value) {
        // loop over inputs, find the one with the name, set the value
        //console.log("setParameter",name,value);
        if (this.inputs) {
            if (this.inputs[name]) {
                var inp = this.inputs[name];
                inp.default(Input.convert(value, inp.type));
            }
        }
        return (this);
    }

    setParameters(params) {
        if (params) {
            Object.keys(params).forEach(name => {
                this.setParameter(name, params[name]);
            });
        }
        return (this);
    }

    async calcComputedInputs(props) {
        // loop over all keys in inputs
        for (var prop in this.inputs) {
            var tProp = this.inputs[prop];
            if (tProp) {
                if (tProp instanceof ComputedInput) {
                    await tProp.compute();
                }
            }
        }
    }

    /**
     * 
     * @returns {SVGGen}
     */
    clone() {
        if (!this.svgString) {
            this.getSVG();
        }
        let clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
        return (clone);
    }

    setSVG(svgString) {
        //CSPYCompiler.log("****" + svgString)
        this.svgString = svgString;
    }


    instToJSON() {
        var toRet = JSON.parse(JSON.stringify(this.constructor.prototype, null, 2));
        var props = Object.getOwnPropertyNames(this);
        props.forEach((propName) => {
            toRet[propName] = this[propName];
        });
        return toRet;
    }

    static toJSON() {
        return JSON.parse(JSON.stringify(this.prototype, null, 2));
    }

    getClassName() {
        if (this.constructor.name) {
            return this.constructor.name;
        } else {
            return this['className'];
        }
    }

    static reconstitute(inJSON, svgClass = undefined) {
        var toRet = undefined;
        if (!svgClass) {
            // try to rebuild the class from the instance data
            var svgClass = CSPYCompiler.compileFromJSON(inJSON);
        }
        toRet = new svgClass();
        // violation of abstraction barrier?
        toRet.innerUpdate(inJSON);
        return toRet;
    }

    makeVariant(params) {
        // dummy
    }
}

/**
 * Compiler class, will generate the right class based on compiler options
 */
class CSPYCompiler {


    static logEnable = false;

    static strFunc = String.prototype.interpolate = function (params) {
        const names = Object.keys(params);
        const vals = Object.values(params);
        return new Function(...names, `return \`${this}\`;`)(...vals);
    }

    static setLogEnable(enable) {
        CSPYCompiler.logEnable = enable;
    }

    static log(msg) {
        if (CSPYCompiler.logEnable) {
            console.log(msg);
        }
    }

    /**
     * 
     * @returns {class}
     */
    static createPromptClass() {
        return class extends SVGGen {

            constructor(params = undefined) {
                super();
                this.setParameters(params);
            }


            async getSVG(callback = undefined) {
                if (this.svgString) {
                    return super.getSVG();
                }
                this.svgString = "";

                const props = this.getInputKeys();
                //console.log(this.inputs);
                var propPromptString = "";
                var contextPromptString = undefined;

                var interDict = {};

                await this.calcComputedInputs(props);

                props.forEach(prop => {
                    var tProp = this.inputs[prop];
                    if (!tProp) {
                        return;
                    }
                    var val = tProp.value();
                    interDict[prop] = val;

                    if (tProp instanceof StaticInput) {
                        propPromptString += `The ${prop} should be ${val}\n`;

                    } else if (tProp instanceof ContextInput) {
                        if (!contextPromptString) {
                            contextPromptString = "";
                        }
                        contextPromptString += `\n\nUse the following SVG as a starting point:\n ${val}\n`;
                    } else if (tProp instanceof ComputedInput) {

                        propPromptString += `The ${prop} should be ${val}\n`;
                    } else {
                        CSPYCompiler.log(prop, typeof tProp);
                    }
                });



                var prompt = "Generate an SVG object for " + this.prompt.getPrompt(interDict) + "\n";

                if (propPromptString != "") {
                    prompt = prompt + "The SVG should have the following properties:\n" + propPromptString;
                }
                prompt = prompt + "\nLabel the parts of the object as an SVG id so they are easier to update.\n";
                if (contextPromptString) {
                    prompt = prompt + contextPromptString;
                }
                prompt = prompt +
                    "\nThe response should be entirely in SVG format, " +
                    "there should be no other text before or after the SVG code.";


                CSPYCompiler.log(prompt);
                if (this.llm.llm == 'OpenAI') {
                    var genresp = await OpenAIGen.getInstance().generate(prompt, (resp) => {
                        this.setSVG(resp);
                    }, this.llm);
                } else if (this.llm.llm == "Groq") {
                    var genresp = await GroqGen.getInstance().generate(prompt, (resp) => {
                        this.setSVG(resp);
                    }, this.llm);
                } else {
                    var genresp = await AnthropicGen.getInstance().generate(prompt, (resp) => {
                        this.setSVG(resp);
                    }, this.llm);
                }
                return super.getSVG(callback);
            }

            innerUpdate(inJSON) {
                // should not be called except for reconstitution
                this.svgString = inJSON.svgString;
            }

            makeVariant(params = undefined) {
                console.log("makeVariant", params);
                var toRet = this.clone();
                var iputs = {};
                var toRetPNames = [];
                const props = this.getInputKeys();
                var idx = 0;
                props.forEach((prop) => {
                    var tProp = this.inputs[prop];
                    tProp = tProp.clone();
                    //tProp.defaultValue = Input.convert(propValues[idx],tProp.type);
                    iputs[prop] = tProp;
                    toRetPNames.push(prop);
                    idx++;
                });
                toRet.inputs = iputs;
                toRet.propNames = toRetPNames;
                // the clone should now have a contextinput, so

                toRet.inputs['contextString'] = new ContextInput({ description: "starter SVG", context: this.svgString });
                toRet.svgString = undefined;
                toRet.setParameters(params);
                return toRet;
            }

        }
    }

    /**
    * 
    * @param {...string} propNames 
    * @returns {class}
    */
    static createTemplateClass() {

        return class extends SVGGen {

            constructor(params = undefined) {
                super();
                this.setParameters(params);
            }


            async getSVG(callback = undefined) {
                if (this.svgString) {
                    CSPYCompiler.log("Returning cached SVG");
                    return super.getSVG(callback);
                }
                if (this.svgTemplate) {
                    CSPYCompiler.log("Filling template");
                    await this.calcComputedInputs(this.getInputKeys());
                    this.fillTemplate();
                    return super.getSVG(callback);
                }

                this.svgString = "";

                CSPYCompiler.log("Generating SVG...");

                const dProps = this.getInputKeys();
                var interDict = {};

                dProps.forEach(prop => {
                    var tProp = this.inputs[prop];
                    if (!tProp) {
                        return;
                    }
                    interDict[prop] = tProp.value();
                })


                var prompt = "Generate an SVG object for '" + this.prompt.getPrompt(interDict) +
                    "'. For the following properties, replace the value with a javascript template in the same name.\n" +
                    "\nLabel the parts of the object so they are easier to update. " +
                    "For example, if I ask for a 'black hole' with a 'radius' of 10, you might return " +
                    "'<circle r='${radius}' id='hole' color='black'/>'.\n" +
                    "\nThe response should be entirely in SVG format, " +
                    "there should be no other text before or after the SVG code." +
                    "The properties I am interested in templatizing are: \n";

                prompt = "write me svg code to create a svg image of " + this.prompt.getPrompt(interDict) +
                    ". Make the svg image as detailed as possible and as close to the description as possible.\n" +
                    "Furthermore, process the generated svg code into a svg code template, with the given a list " +
                    "of parameter names, make the returned svg code a template with certain parameters as text placeholders made by ${parameter name}. " +
                    "For example, parameter list: roof height, window color; resulting javascript template:\n" +
                    "<svg viewBox=\"0 0 200 200\">\n<rect x=\"50\" y=\"70\" width=\"100\" height=\"80\" fill=\"brown\" /> <!-- House body -->\n<polygon points=\"50,70 100,{roof_height} 150,70\" fill=\"red\" /> <!-- Roof -->\n<rect x=\"65\" y=\"90\" width=\"20\" height=\"20\" fill=\"{window_color}\" /> <!-- Window 1 -->\nrect x=\"115\" y=\"90\" width=\"20\" height=\"20\" fill=\"{window_color}\" /> <!-- Window 2 -->\n<rect x=\"90\" y=\"120\" width=\"20\" height=\"30\" fill=\"black\" /> <!-- Door -->\n</svg>." +
                    "Notice that only one parameter name and nothing else can be inside ${}. Replace the whole parameter " +
                    "(e.g., fill = \"#e0d0c0\" to fill = \"${parameter name}\") instead of just part of it (e.g., " +
                    "fill = \"#e0d0c0\" to fill = \"#${parameter name}\"). Return svg code template for this parameter list:\n\n";

                const props = this.getInputKeys();
                var contextPromptString = undefined;

                await this.calcComputedInputs(props);

                props.forEach(prop => {
                    var tProp = this.inputs[prop];
                    if (!tProp) {
                        return;
                    }

                    var desc = tProp.getDescription();
                    var val = tProp.value();
                    if (tProp instanceof StaticInput) {
                        prompt += `variable name: ${prop} which encodes the ${desc}\n`;
                    } else if (tProp instanceof ContextInput) {
                        if (!contextPromptString) {
                            contextPromptString = "";
                        }
                        contextPromptString += `\n\nUse the following SVG as a starting point:\n ${val}\n`;
                    } else if (tProp instanceof ComputedInput) {
                        //var v = await tProp.compute();
                        prompt += `variable name: ${prop} which encodes the ${desc}\n`;
                    }
                });

                CSPYCompiler.log(this.inputs);

                prompt = prompt + "\n" + " Do not include any background in generated svg. " +
                    "The svg code template must be able to satisfy the requirements of the parameters by simply replacing the placeholders, instead of other manual modifications (e.g., 'window number' can be modified by simply replacing {window number} to some data, instead of needing to repeat window element manually)\n" +
                    "Make sure do not include anything other than the final svg code template in your response.";

                if (contextPromptString) {
                    prompt = prompt + "\n\n" + contextPromptString;
                }

                CSPYCompiler.log(prompt);
                if (this.llm.llm == 'OpenAI') {
                    var genresp = await OpenAIGen.getInstance().generate(prompt, (resp) => {
                        this.setTemplate(resp);
                    }, this.llm);
                } else if (this.llm.llm == "Groq") {
                    var genresp = await GroqGen.getInstance().generate(prompt, (resp) => {
                        this.setTemplate(resp);
                    }, this.llm);
                } else {
                    var genresp = await AnthropicGen.getInstance().generate(prompt, (resp) => {
                        this.setTemplate(resp);
                    }, this.llm);
                }
                this.fillTemplate();
                return super.getSVG(callback);
            }

            setTemplate(templateString) {
                //CSPYCompiler.log("****" + svgString)
                CSPYCompiler.log(templateString);
                this.svgTemplate = templateString;
            }

            fillTemplate() {
                //console.log(this.inputs);
                const props = this.getInputKeys();
                const tvals = {};
                props.forEach((prop) => {
                    var tProp = this.inputs[prop];

                    //console.log(prop,tProp.defaultValue);
                    tvals[prop] = tProp.value();
                });
                const template = this.svgTemplate;
                //CSPYCompiler.log("****",tvals);
                this.svgString = template.interpolate(tvals);
                //return this.svgString;
            }

            makeVariant(params = undefined) {
                var toRet = this.clone();
                var iputs = {};
                var toRetPNames = [];
                const props = this.getInputKeys();
                var idx = 0;
                props.forEach((prop) => {
                    var tProp = this.inputs[prop];
                    tProp = tProp.clone();
                    //tProp.defaultValue = Input.convert(propValues[idx],tProp.type);
                    console.log(props, tProp.value());
                    iputs[prop] = tProp;
                    toRetPNames.push(prop);
                    idx++;
                });
                toRet.inputs = iputs;
                toRet.propNames = toRetPNames;
                toRet.svgTemplate = this.svgTemplate;
                toRet.svgString = undefined;
                toRet.setParameters(params);
                return toRet;
            }

            innerUpdate(inJSON) {
                // should not be called except for reconstitution
                this.svgString = inJSON.svgString;
                this.svgTemplate = inJSON.svgTemplate;
            }
        }
    }

    /**
         * 
         * @param {...string} propNames 
         * @returns {class}
         */
    static createCodeClass() {
        return class extends SVGGen {

            constructor(params = undefined) {
                super();
                this.setParameters(params);
            }



            async getSVG(callback = undefined) {
                if (this.svgString) {
                    CSPYCompiler.log("Returning cached SVG");
                    return super.getSVG(callback);
                }
                if (typeof this.fillTemplateInternal === "function") {
                    CSPYCompiler.log("Returning cached function");
                    await this.calcComputedInputs(this.getInputKeys());
                    this.fillTemplate();
                    return super.getSVG(callback);
                }

                const dProps = this.getInputKeys();
                var interDict = {};

                dProps.forEach(prop => {
                    var tProp = this.inputs[prop];
                    if (!tProp) {
                        return;
                    }
                    interDict[prop] = tProp.value();
                })

                var p1 = "We will be constructing an image of a " + this.prompt.getPrompt(interDict) + 
                    " using simple SVG constructs." +
                    "Describe the process by which we would construct the image. Include details " +
                    "about determining the placement and size of each part relative to others. " +
                    "Do this step by step. We will want the parameterize the following features:\n";

                var p2 = "Use the step by step instructions to construct a javascript function " +
                    "called fillTemplate. fillTemplate will accept an argument of an object " +
                    "that holds the parameters. For example {'a':5,'b':'red'}\n" +
                    "The output of fillTemplate will be an SVG stringthat generates the image using SVG. The javascript function should not use " +
                    "browser features or external libraries. It should work by concatenating text " +
                    "to build the SVG. Return the javascript function and nothing else. There should " +
                    "be no text before or after the function. You should expect the dictionary object that " +
                    "is fed to fillTemplate to have the following: "

                const props = this.getInputKeys();
                var contextPromptString = undefined;

                await this.calcComputedInputs(props);

                props.forEach(prop => {
                    var tProp = this.inputs[prop];
                    if (!tProp) {
                        return;
                    }

                    var desc = tProp.getDescription();
                    var val = tProp.value();

                    if (tProp instanceof StaticInput) {
                        p1 += `variable name: ${prop} which encodes the ${desc}\n`;
                        p2 += `variable name: ${prop} which encodes the ${desc}\n`;
                    } else if (tProp instanceof ContextInput) {
                        if (!contextPromptString) {
                            contextPromptString = "";
                        }
                        contextPromptString += `\n\nUse the following SVG as a starting point:\n ${val}\n`;
                    } else if (tProp instanceof ComputedInput) {
                        //var v = await tProp.compute();
                        p1 += `variable name: ${prop} which encodes the ${desc}\n`;
                        p2 += `variable name: ${prop} which encodes the ${desc}\n`;
                    }
                });


                this.svgString = "";

                //CSPYCompiler.log(prompt);
                CSPYCompiler.log(p1);
                CSPYCompiler.log(p2);
                if (this.llm.llm == 'OpenAI') {
                    var genresp = await OpenAIGen.getInstance().generateMultiturn([p1, p2], (resp) => {
                        this.setTemplate(resp);
                    }, this.llm);
                } else if (this.llm.llm == 'Groq') {
                    var genresp = await GroqGen.getInstance().generateMultiturn([p1, p2], (resp) => {
                        this.setTemplate(resp);
                    }, this.llm);
                } else {
                    var genresp = await AnthropicGen.getInstance().generateMultiturn([p1, p2], (resp) => {
                        this.setTemplate(resp);
                    }, this.llm);
                }
                //this.setTemplate("function fillTemp(props) { CSPYCompiler.log('yay!');}");
                //return this.fillTemplate();
                return super.getSVG(callback);
            }

            fillTemplate() {
                const props = this.getInputKeys();
                var tVals = {};
                props.forEach(prop => {
                    var tProp = this.inputs[prop];
                    if (!tProp) {
                        return;
                    }

                    if (tProp instanceof StaticInput) {
                        tVals[prop] = tProp.value();
                    }

                    if (tProp instanceof ComputedInput) {
                        tVals[prop] = tProp.value();
                    }
                });
                //console.log(tVals);
                this.svgString = this.fillTemplateInternal(tVals);
                //this.svgTemplate = templateString;
                //return(this.svgTemplate);
            }


            setTemplate(templateString) {
                //CSPYCompiler.log("****" + svgString)
                // eval the string and set
                CSPYCompiler.log(templateString);
                var func = eval("var fillTemplateInternal=" + templateString + "\nfillTemplateInternal;");
                this.fillTemplateInternal = func;
                this.javascriptString = templateString;
                //CSPYCompiler.log(func);
                this.fillTemplate();
            }


            makeVariant(params = undefined) {
                var toRet = this.clone();
                var iputs = {};
                var toRetPNames = [];
                const props = this.getInputKeys();
                var idx = 0;
                props.forEach((prop) => {
                    var tProp = this.inputs[prop];
                    tProp = tProp.clone();
                    //tProp.defaultValue = Input.convert(propValues[idx],tProp.type);
                    iputs[prop] = tProp;
                    toRetPNames.push(prop);
                    idx++;
                });
                toRet.inputs = iputs;
                toRet.propNames = toRetPNames;
                // the clone should now have a contextinput, so
                toRet.svgString = undefined;
                toRet.setParameters(params);
                return toRet;
            }

            innerUpdate(inJSON) {
                // should not be called except for reconstitution
                this.svgString = inJSON.svgString;
                this.setTemplate(inJSON.javascriptString);
                //this.svgTemplate = inJSON.svgTemplate;
            }
        }
    }

    static compileGeneric(newclass, inpr, tempInst, props) {
        //console.log("COMPILING!",props);
        var prompt = tempInst["prompt"];
        if (prompt == undefined) {
            prompt = inpr["prompt"];
        }

        //var sProps = [];

        var inputs = {};
        for (var i = 0; i < props.length; i++) {
            var iput = tempInst[props[i]];
            if (!iput) {
                iput = inpr[props[i]];
            }
            if (iput instanceof Input) {
                inputs[props[i]] = iput.clone();
                inputs[props[i]].name(props[i]);
                //newclass[props[i]] = function(val) {
                //    this.setParam(props[i],val);
                // }
                var key = props[i];
                //newclass.prototype[props[i]] = function(value) {
                //console.log("Key:",key,"Value:",value);
                //return this.setParameter(key,value);
                //}
                newclass.prototype[props[i]] = new Function("val", "return this.setParameter('" + key + "',val);");
                //sProps.push(props[i]);
            }
        }

        //console.log("SSSSSS Props",sProps);
        newclass.prototype.prompt = prompt;
        newclass.prompt = prompt;
        newclass.prototype.className = tempInst.getClassName();
        newclass.className = tempInst.getClassName();

        newclass.inputs = inputs;
        newclass.prototype.inputs = inputs;

        //CSPYCompiler.log(inputs);
        return newclass;

    }

    static compilePrompt(inpr, llm = undefined) {
        var tempInst = new inpr();
        // read all properties of tempInst and load into an array
        var props = Object.getOwnPropertyNames(tempInst);
        if (props.length == 0) {
            props = Object.getOwnPropertyNames(inpr);
        }
        var sProps = [];
        for (var i = 0; i < props.length; i++) {
            var iput = tempInst[props[i]];
            if (iput instanceof Input) {
                sProps.push(props[i]);
            }
        }
        props = sProps;

        //props = props.filter(prop => prop !== "prompt");
        var newclass = this.createPromptClass();
        newclass.prototype['compiler'] = "prompt";
        newclass.prototype['llm'] = CSPYCompiler.checkModel(llm);
        return this.compileGeneric(newclass, inpr, tempInst, props);
    }

    static compileTemplate(inpr, llm = undefined) {
        var tempInst = new inpr();
        // read all properties of tempInst and load into an array
        var props = Object.getOwnPropertyNames(tempInst);
        if (props.length == 0) {
            props = Object.getOwnPropertyNames(inpr);
        }
        //props = props.filter(prop => prop !== "prompt");
        var newclass = this.createTemplateClass();
        newclass.prototype['compiler'] = "template";
        newclass.prototype['llm'] = CSPYCompiler.checkModel(llm);
        return this.compileGeneric(newclass, inpr, tempInst, props);

    }

    static compileChat(inpr, llm = undefined) {
        return SVGGen;
    }

    static compileCode(inpr, llm = undefined) {
        var tempInst = new inpr();
        // read all properties of tempInst and load into an array
        var props = Object.getOwnPropertyNames(tempInst);
        if (props.length == 0) {
            props = Object.getOwnPropertyNames(inpr);
        }
        //props = props.filter(prop => prop !== "prompt");
        var newclass = this.createCodeClass();
        newclass.prototype['compiler'] = "code";
        newclass.prototype['llm'] = CSPYCompiler.checkModel(llm);
        return this.compileGeneric(newclass, inpr, tempInst, props);
    }

    static compileMixed(inpr, llm = undefined) {
        return SVGGen;
    }

    static compileInstanceFromJSON(inJSON, svgClass = undefined) {
        return SVGGen.reconstitute(inJSON, svgClass);
    }

    static compileFromJSON(inJSON) {

        // see if we already compiled this one
        var temp = {
            'compiler': inJSON.compiler,
            'llm': CSPYCompiler.checkModel(inJSON.llm),
            'inputs': inJSON.inputs,
            'prompt': inJSON.prompt,
            'className': inJSON.className
        };
        var hash = CSPYCompiler.hashCode(JSON.stringify(temp));
        if (CSPYCompiler.compileCache[hash]) {
            return (CSPYCompiler.compileCache[hash]);
        }

        var outtype = "prompt";
        var llm = undefined;

        if (inJSON.compiler) {
            outtype = inJSON.compiler;
        }
        if (inJSON.llm) {
            llm = CSPYCompiler.checkModel(inJSON.llm);
        }

        var prompt = undefined;
        if (inJSON.prompt) {
            prompt = Prompt.reconstitute(inJSON.prompt);
        }
        //inJSON.className = "Bob";
        var basis = eval(`class ${inJSON.className} extends CSPY {constructor() {super();}}\n${inJSON.className};`);
        basis.prototype.constructor['prompt'] = prompt;

        //basis['prompt'] = prompt;

        var iPuts = inJSON.inputs;
        Object.keys(iPuts).forEach((iKey) => {
            var iJSON = iPuts[iKey];
            var recon = eval(`${iJSON.inputtype}.reconstitute`);
            var iput = recon(iJSON);
            basis.prototype.constructor[iKey] = iput;
        });
        //console.log("*********",basis.prototype.constructor['prompt']);
        //console.log("***",basis);
        //console.log(toRet.prototype.constructor['prompt']); 
        return (CSPYCompiler.compile(basis, outtype, llm));
    }

    static compileCache = {};

    static hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    static defaultModel = AnthropicGen.model;

    static checkModel(llm = undefined) {
        // passed a string, expand to full model name
        if (llm == 'Anthropic') {
            llm = CSPYCompiler.defaultModel;
        } else if (llm == 'Groq') {
            llm = GroqGen.model;
        } else if (llm == 'OpenAI') {
            llm = OpenAIGen.model;
        }
        // llm definition undefined, or needs to be changed
        if (!llm) {
            llm = AnthropicGen.model
        }
        if (!llm.llm) {
            llm['llm'] = "Anthropic";
        }
        if (!llm.model) {
            if (llm['llm'] == 'Anthropic') {
                llm['model'] = AnthropicGen.model.model;
            } else if (llm['llm'] == 'Groq') {
                llm['model'] = GroqGen.model.model;
            } else if (llm['llm'] == 'OpenAI') {
                llm['model'] = OpenAIGen.model.model;
            }
        }
        return (llm);
    }

    static compile(inpr, outtype = "prompt", llm = undefined) {
        // check if inpr is a function
        if (!inpr instanceof CSPY) {
            throw new Error("Object does not extend CSPY");
        }

        llm = CSPYCompiler.checkModel(llm);

        var toRet = undefined;
        if (outtype == "prompt") {
            toRet = this.compilePrompt(inpr, llm);
        } else if (outtype == "template") {
            toRet = this.compileTemplate(inpr, llm);
        } else if (outtype == "chat") {
            toRet = this.compileChat(inpr, llm);
        } else if (outtype == "code") {
            toRet = this.compileCode(inpr, llm);
        } else if (outtype == "mixed") {
            toRet = this.compileMixed(inpr, llm);
        }
        var js = toRet.toJSON();
        var temp = {
            'compiler': js.compiler,
            'llm': js.llm,
            'inputs': js.inputs,
            'prompt': js.prompt,
            'className': js.className
        };
        var hash = CSPYCompiler.hashCode(JSON.stringify(temp));
        if (CSPYCompiler.compileCache[hash]) {
            return (CSPYCompiler.compileCache[hash]);
        } else {
            CSPYCompiler.compileCache[hash] = toRet;
        }
        return (toRet);
    }
}

class ObjectDatabase {

    static classes = [];

    static instances = [];

    static classNames = [];

    static instanceNames = [];

    static id = 0;

    static getObjects() {
        var toRet = {};
        for (var i = 0; i < ObjectDatabase.classes.length; i++) {
            toRet[ObjectDatabase.classNames[i]] = ObjectDatabase.classes[i];
        }
        for (var i = 0; i < ObjectDatabase.instances.length; i++) {
            toRet[ObjectDatabase.instanceNames[i]] = ObjectDatabase.instances[i];
        }
        return (toRet);
    }

    static addClass(cls, name = undefined) {
        ObjectDatabase.classes.push(cls);
        if (!name) {
            var tmp = new cls();
            name = tmp.getClassName();
            console.log(tmp.constructor);
        }
        ObjectDatabase.classNames.push(name);
    }

    static addInstance(inst, name = undefined) {
        ObjectDatabase.instances.push(inst);
        if (name == undefined) {
            name = inst.getClassName().toLowerCase() + "_" + ObjectDatabase.id++;
        }
        ObjectDatabase.instanceNames.push(name);
    }

    static getJSON() {
        var toRet = {};
        // create a new array from classes after running toJSON
        var jClasses = ObjectDatabase.classes.map((cls) => cls.toJSON());
        for (var i = 0; i < jClasses.length; i++) {
            var cName = ObjectDatabase.classNames[i];
            if (cName) {
                jClasses[i]['variableName'] = cName;
            }
        }
        var jInstances = ObjectDatabase.instances.map((inst) => inst.instToJSON());
        for (var i = 0; i < jInstances.length; i++) {
            var cName = ObjectDatabase.instanceNames[i];
            if (cName) {
                jInstances[i]['variableName'] = cName;
            }
        }
        toRet['classes'] = jClasses;
        toRet['instances'] = jInstances;
        return (toRet);
    }

    static getJSONString() {
        return (JSON.stringify(ObjectDatabase.getJSON(), null, 2));
    }

    static parseJSONString(jString) {
        var json = JSON.parse(jString);
        var jClasses = json['classes'];
        var jInstances = json[['instances']];
        if (jClasses) {
            jClasses.forEach((jClass) => {
                var compiled = CSPYCompiler.compileFromJSON(jClass);
                ObjectDatabase.classes.push(compiled);
                if (jClass['variableName']) {
                    ObjectDatabase.classNames.push(jClass['variableName']);
                } else {
                    ObjectDatabase.classNames.push(undefined);
                }
            });

        }
        if (jInstances) {
            jInstances.forEach((jInst) => {
                var compiled = CSPYCompiler.compileInstanceFromJSON(jInst);
                ObjectDatabase.instances.push(compiled);
                if (jInst['variableName']) {
                    ObjectDatabase.instanceNames.push(jInst['variableName']);
                } else {
                    ObjectDatabase.instanceNames.push(undefined);
                }
            });

        }
    }
}