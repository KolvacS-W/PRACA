import { SVGGen } from "./index.js";
/**
 * @classdesc a basic input class template. Not used directly.
 * @class
 */
export class Input {

    params = {};

    /**
     * constructor
     * @param {object} vals - an object with base parameters (description, default, explanation, type, variableName). All are optional.
     */
    constructor(vals = undefined) {
        this.setParameters(vals);
        if (vals) {
            if (!vals['inputtype']) {
                this.setParameter('inputtype', this.constructor.name);
            }
        }
    }

    /**
     * static method to create an Input object with a description
     * @param {string} val - the description
     * @returns {Input}
     */
    static description(val) {
        var toRet = new Input();
        toRet.setParameter('description', val);
        return (toRet);
    }

    /**
     * static method to create an Input object with a default value
     * @param {any} val - the default value
     * @returns {Input}
     */
    static default(val) {
        var toRet = new Input();
        toRet.setParameter('default', val);
        return (toRet);
    }

    /**
     * method to set the description of the input
     * @param {string} val - the description
     * @returns {Input}
     */
    description(val) {
        this.setParameter('description', val);
        return (this);
    }

    /**
     * method to get the description of the input
     * @returns {string}
     */
    getDescription() {
        if (this.params['description']) {
            return (this.params['description']);
        } else if (this.params['variableName']) {
            return (this.params['variableName']);
        } else {
            return ("");
        }
    }

    /**
     * method to set the default value of the input
     * @param {any} val - the default value
     * @returns {Input}
     */
    default(val) {
        this.setParameter('default', val);
        return (this);
    }

    /**
     * method to get the default value of the input
     * @returns {any}
     */
    getDefault() {
        return (this.params['default']);
    }

    /**
     * method to set the explanation of the input
     * @param {string} val - the explanation
     * @returns {Input}
     */
    explanation(val) {
        this.setParameter('explanation', val);
        return (this);
    }

    /**
     * method to get the explanation of the input
     * @returns {string}
     */
    getExplanation() {
        return (this.params['explanation']);
    }

    /**
     * method to set the type of the input
     * @param {string} val - the type
     * @returns {Input}
     */
    type(val) {
        this.setParameter('type', val);
        // update the defaultValue to the type
        this.setParameter('default', this.params['default']);
        return (this);
    }

    /**
     * method to get the type of the input
     * @returns {string}
     */
    getType() {
        return (this.params['type']);
    }

    /**
     * method to get the value of the input
     * @returns {any}
     */
    value() {
        return (this.params['default']);
    }

    /**
     * method to set the variable name of the input
     * @param {string} val - the variable name
     * @returns {Input}
     */
    name(val) {
        this.setParameter('variableName', val);
        return (this);
    }

    /**
     * method to set a parameter of the input
     * @param {string} key - the parameter name
     * @param {any} value - the parameter value
     * @returns {Input}
     */
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

    /**
     * method to set multiple parameters of the input
     * @param {object} params - an object with parameter names and values
     * @returns {Input}
     */
    setParameters(params) {
        if (params) {
            Object.keys(params).forEach(name => {
                this.setParameter(name, params[name]);
            });
        }
        return (this);
    }

    /**
     * static method to get the type of the input
     * @param {any} defaultValue - the default value
     * @param {string} type - the type
     * @returns {string}
     */
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

    /**
     * static method to convert the default value to the type
     * @param {any} defaultValue - the default value
     * @param {string} type - the type
     * @returns {any}
     */
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

    /**
     * static method to reconstitute an Input object from a JSON string or object
     * @param {string|object} inJSON - the JSON string or object
     * @returns {Input}
     */
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
     * method to convert the input to a string      
     * @returns {string}
     */
    toString() {
        return `${this.params.description}: ${this.params.default} ${this.params.explanation} (${this.params.type})`;
    }

    /**
     * method to clone the input
     * @returns {Input}
     */
    clone() {
        let clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
        return (clone);
    }

    /**
     * method to convert the input to a JSON object
     * @returns {object}
     */
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

/**
 * @classdesc a computed input class template. Not used directly.
 * @class
 * @augments Input
 */
export class ComputedInput extends Input {

    /**
     * constructor
     * @param {object} params - an object with base parameters (description, default, explanation, type, variableName). All are optional.
     */
    constructor(params) {
        super(params);
        //this.inputtype = "ComputedInput";
    }

    /**
     * method to compute the input
     */
    async compute() {
        //
    }

    /**
     * static method to reconstitute a ComputedInput object from a JSON string or object
     * @param {string|object} inJSON - the JSON string or object
     * @returns {ComputedInput}
     */
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

/**
 * @classdesc a random choice input class template. Not used directly.
 * @class
 * @augments ComputedInput
 */
export class RandomChoiceInput extends ComputedInput {

    /**
     * constructor
     * @param {object} params - an object with base parameters (description, default, explanation, type, variableName). All are optional.
     */
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


    /**
     * method to set the choices of the input
     * @param {array} val - the choices
     * @returns {RandomChoiceInput}
     */
    choices(val) {
        this.setParameter('choices', val);
        return (this);
    }

    /**
     * method to get the choices of the input
     * @returns {array}
     */
    getChoices() {
        return (this.params['choices']);
    }

    /**
     * static method to create a RandomChoiceInput object with a choices parameter
     * @param {array} val - the choices
     * @returns {RandomChoiceInput}
     */
    static choices(val) {
        var toRet = new RandomChoiceInput();
        toRet.setParameter('choices', val);
        return (toRet);
    }

    /**
     * static method to create a RandomChoiceInput object with a description parameter
     * @param {string} val - the description
     * @returns {RandomChoiceInput}
     */
    static description(val) {
        var toRet = new RandomChoiceInput();
        toRet.setParameter('description', val);
        return (toRet);
    }

    /**
     * method to compute the input
     */
    async compute() {
        if (this.params['choices'] && this.params['choices'].length == 0) {
            this.setParameter('default', undefined);
        } else {
            this.setParameter('default', Input.convert(this.params['choices'][(Math.floor(Math.random() * this.params['choices'].length))]));
        }
    }

    /**
     * static method to reconstitute a RandomChoiceInput object from a JSON string or object
     * @param {string|object} inJSON - the JSON string or object
     * @returns {RandomChoiceInput}
     */
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

    /**
     * method to convert the input to a JSON object
     * @returns {object}
     */
    toJSON() {
        var toRet = super.toJSON();
        if (this.params['choices']) {
            toRet['choices'] = this.params['choices'].map((x) => x);
        }
        return (toRet);
    }
}

/**
 * @classdesc a LLM choice input class template. Not used directly.
 * @class
 * @augments RandomChoiceInput
 */
export class LLMChoiceInput extends RandomChoiceInput {


    /**
     * constructor
     * @param {object} params - an object with base parameters (description, default, explanation, type, variableName). All are optional.
     */
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

    /**
     * method to set the LLM of the input
     * @param {object} val - the LLM
     * @returns {LLMChoiceInput}
     */
    llm(val) {
        this.setParameter('llm', val);
        return (this);
    }

    /**
     * method to get the LLM of the input
     * @returns {object}
     */
    getLLM() {
        return (this.params['llm']);
    }

    /**
     * static method to create a LLMChoiceInput object with a description parameter
     * @param {string} val - the description
     * @returns {LLMChoiceInput}
     */
    static description(val) {
        var toRet = new LLMChoiceInput();
        toRet.setParameter('description', val);
        return (toRet);
    }


    /**
     * static method to reconstitute a LLMChoiceInput object from a JSON string or object
     * @param {string|object} inJSON - the JSON string or object
     * @returns {LLMChoiceInput}
     */
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

    /**
     * method to compute the input
     */
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

    /**
     * method to convert the input to a JSON object
     * @returns {object}
     */
    toJSON() {
        var toRet = super.toJSON();
        toRet['llm'] = this.params['llm'];
        return (toRet);
    }
}

/**
 * @classdesc a image input class template. Not used directly.
 * @class
 * @augments ComputedInput
 */
export class ImageInput extends ComputedInput {

    /**
     * constructor
     * @param {object} params - an object with base parameters (description, default, explanation, type, variableName). All are optional.
     */
    constructor(params) {
        //console.log("STATIC INPUT",description, defaultValue, explanation, type);
        super(params);
        if (!this.params['llm']) {
            this.llm = { 'llm': 'OpenAI', 'model': 'gpt-4o' };
        }
        //this.inputtype = "LLMChoiceInput";
    }

    /**
     * method to set the LLM of the input
     * @param {object} val - the LLM
     * @returns {ImageInput}
     */
    llm(val) {
        this.setParameter('llm', val);
        return (this);
    }

    /**
     * method to get the LLM of the input
     * @returns {object}
     */
    getLLM() {
        return (this.params['llm']);
    }

    /**
     * method to set the URL of the input
     * @param {string} val - the URL
     * @returns {ImageInput}
     */
    url(val) {
        this.setParameter('url', val);
        return (this);
    }

    /**
     * method to get the URL of the input
     * @returns {string}
     */
    getURL() {
        return (this.params['url']);
    }

    /**
     * static method to create a ImageInput object with a URL parameter
     * @param {string} val - the URL
     * @returns {ImageInput}
     */
    static URL(val) {
        var toRet = new ImageInput();
        toRet.setParameter('url', val);
        return (toRet);
    }

    /**
     * static method to reconstitute a ImageInput object from a JSON string or object
     * @param {string|object} inJSON - the JSON string or object
     * @returns {ImageInput}
     */
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

    /**
     * method to compute the input
     */
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

    /**
     * method to convert the input to a JSON object
     * @returns {object}
     */
    toJSON() {
        var toRet = super.toJSON();
        toRet['url'] = this.params['url'];
        toRet['llm'] = this.params['llm'];
        return (toRet);
    }
}

/**
 * @classdesc a static input class template. Not used directly.
 * @class
 * @augments Input
 */
export class StaticInput extends Input {

    /**
     * constructor
     * @param {object} params - an object with base parameters (description, default, explanation, type, variableName). All are optional.
     */
    constructor(params = undefined) {
        //console.log("STATIC INPUT",description, defaultValue, explanation, type);
        super(params);
        // this.inputtype = "StaticInput";

    }

    /**
     * static method to create a StaticInput object with a description parameter
     * @param {string} val - the description
     * @returns {StaticInput}
     */
    static description(val) {
        var toRet = new StaticInput();
        toRet.setParameter('description', val);
        return (toRet);
    }


    /**
     * static method to create a StaticInput object with a default value
     * @param {any} val - the default value
     * @returns {StaticInput}
     */
    static default(val) {
        var toRet = new StaticInput();
        toRet.setParameter('default', val);
        return (toRet);
    }

    /**
     * static method to reconstitute a StaticInput object from a JSON string or object
     * @param {string|object} inJSON - the JSON string or object
     * @returns {StaticInput}
     */
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


/**
 * @classdesc a context input class template. Not used directly.
 * @class
 * @augments Input
 */
export class ContextInput extends Input {

    /**
     * constructor
     * @param {object} params - an object with base parameters (description, default, explanation, type, variableName). All are optional.
     */
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

    /**
     * method to set the context of the input
     * @param {object} val - the context
     * @returns {ContextInput}
     */
    context(val) {
        if (typeof val == SVGGen) {
            this.setParameter('context', val.svgString);
        } else {
            this.setParameter('context', val.toString());
        }
        return (this);
    }

    /**
     * method to get the context of the input
     * @returns {object}
     */
    value() {
        return (this.params['context']);
    }

    /**
     * static method to create a ContextInput object with a context parameter
     * @param {object} val - the context
     * @returns {ContextInput}
     */
    static context(val, annotate = false) {
        var toRet = new ContextInput();
        toRet.setParameter('context', val);
        toRet.setParameter('annotate', annotate);
        return (toRet);
    }

    /**
     * method to convert the input to a JSON object
     * @returns {object}
     */
    toJSON() {
        var toRet = super.toJSON();
        toRet['context'] = this.params['context'];
        toRet['annotate'] = this.params['annotate']
        return (toRet);
    }

    /**
     * static method to reconstitute a ContextInput object from a JSON string or object
     * @param {string|object} inJSON - the JSON string or object
     * @returns {ContextInput}
     */
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
            'annotate': inJSON.annotate,
            'variableName': inJSON.variableName
        });
        return (toRet);
    }
}