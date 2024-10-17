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
        return JSON.parse(JSON.stringify(this.prototype,null,2));
    }
}


// create an input class that can hold an input value "name", an optional explanation, an optional default value, and an optional type

class Input {
    /**
     * 
     * @param {string} description 
     * @param {any} defaultValue 
    * @param {string} explanation 
     * @param {string} type 
     */
    constructor(description, defaultValue=undefined, explanation="", type="string") {
        this.description = description;
        this.explanation = explanation;
        this.defaultValue = Input.convert(defaultValue,type);
        this.type = type;
        this.inputtype = "Input";

    }

    static convert(defaultValue,type) {
        if (defaultValue) {
            if (typeof defaultValue === 'string' || defaultValue instanceof String) {
                if (type == 'int') {
                    return(parseInt(defaultValue))
                } else if (type == 'boolean') {
                    if ((/true/i).test(defaultValue)) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (type == 'float') {
                    return(parseFloat(defaultValue));
                } else if (type == 'JSON') {
                    return(JSON.parse(defaultValue));
                } 
            }
        }
        return(defaultValue);
    }
    static reconstitute(inJSON) {
        return(new Input(inJSON.description,inJSON.defaultValue,inJSON.explanation,inJSON.type));
    }
    /**
     * 
     * @returns {string}
     */
    toString() {
        return `${this.description}: ${this.defaultValue} ${this.explanation} (${this.type})`;
    }

    clone() {
        let clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
        return(clone);
    }
}

class ComputedInput extends Input {
    constructor(description, defaultValue=undefined, explanation="", type="string") {
        super(description, defaultValue, explanation, type);
        this.inputtype = "ComputedInput";
    }

    compute() {
        //
    }
}


class RandomChoiceInput extends ComputedInput {
    /**
     * 
     * @param {string} description 
     * @param {array} choices
     * @param {string} type
     */
    constructor(description, choices=[], type="string") {
        super(description,undefined,"",type);
        this.choices = choices;
        this.inputtype = "RandomChoiceInput";
    }


    compute() {
        if (this.choices.length == 0) {
            return undefined;
        }
        this.defaultValue = Input.convert(this.choices[(Math.floor(Math.random() * this.choices.length))]);
    }
}

class LLMInput extends ComputedInput {

    /**
     * 
     * @param {string} description 
     * @param {any} defaultValue 
     * @param {string} explanation 
    * @param {string} type 
    */
    constructor(description, explanation="", type="JSON") {
        //console.log("STATIC INPUT",description, defaultValue, explanation, type);
        super(description, defaultValue, explanation, type);
        this.inputtype = "LLMInput";
    }

    execute() {

    }
}


class StaticInput extends Input {
    /**
     * 
     * @param {string} description 
     * @param {any} defaultValue 
     * @param {string} explanation 
    * @param {string} type 
    */
    constructor(description, defaultValue=undefined, explanation="", type="string") {
        //console.log("STATIC INPUT",description, defaultValue, explanation, type);
        super(description, defaultValue, explanation, type);
        this.inputtype = "StaticInput";

    }

    static reconstitute(inJSON) {
        return(new StaticInput(inJSON.description,inJSON.defaultValue,inJSON.explanation,inJSON.type));
    }
}




class ContextInput extends Input {

    constructor(description, contextObject) {
        if (typeof contextObject == SVGGen) {
            if (contextObject.svgString) {
                contextObject = contextObject.svgString;
            } else {
                throw new Error("contextObject does not seem to have an svgString (make sure you have called getSVG() on it before passing it to the ContextInput)");
            }
        } else {
            // assume it is a string
            contextObject = contextObject.toString();
        }
        super(description, contextObject, "", "svg_string");
        this.inputtype = "ContextInput";

    }

    static reconstitute(inJSON) {
        return(new ContextInput(inJSON.description,inJSON.defaultValue));
    }
}


// demo script for command line usage
//const input = new Input("name", "the name of the house", "John Doe", "string");
//CSPYCompiler.log(input.toString());




// create a prompt class that holds a string prompt
class Prompt {
    /**
     * 
     * @param {string} prompt 
     */
    constructor(prompt) {
        this.prompt = prompt;
    }       

    /**
     * 
     * @returns {string}
     */
    toString() {
        return `${this.prompt}`;
    }
}


class AnthropicGen {

    // make as singleton pattern
    static instance = undefined;
    static apiKey = undefined;
    static model = "claude-3-5-sonnet-20240620";
    //static model = "claude-3-haiku-20240307";

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
        return(AnthropicGen.instance);
    }

    static setModel(model) {
        AnthropicGen.model = model;
    }

    async loadKey() {
        try {
            // Use fetch to read the file instead of require('fs')
            AnthropicGen.apiKey = process.env.CSPY_KEY;
            if (AnthropicGen.apiKey) {
                return;
            }
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
    async generate(prompt,callback) {
        if (!AnthropicGen.apiKey) {
            throw new Error("AnthropicGen API key not set");
        }
        //CSPYCompiler.log("using model: " + AnthropicGen.model);

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
        headers: {
          "x-api-key": AnthropicGen.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: AnthropicGen.model,
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
          const genresp = data.content[0].text;
          callback(genresp);
        });
    }

    /**
     * 
     * @param {string} prompts 
     * @returns {string}
     */
    async generateMultiturn(prompts,callback) {
        if (!AnthropicGen.apiKey) {
            throw new Error("AnthropicGen API key not set");
        }
        //CSPYCompiler.log("using model: " + AnthropicGen.model);

        var messages = [];
        var genresp = undefined;

        while (prompts.length > 0) {
            //console.log("****",prompts);
            var prompt = prompts.shift();

            messages.push({role:"user",content:[{type:"text",text:prompt}]});

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
                model: AnthropicGen.model,
                max_tokens: 2048,
                messages: messages,
                }),
            });

            var json = await response.json();
            genresp = json.content[0].text;
            CSPYCompiler.log(genresp);
            messages.push({role: "assistant",content: [{ type: "text", text: genresp },],});
        }
        callback(genresp);
    }
}   

class OpenAIGen {

    // make as singleton pattern
    static instance = undefined;
    static apiKey = undefined;
    static model = "gpt-4o-mini";

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
        return(OpenAIGen.instance);
    }

    static setModel(model) {
        OpenAIGen.model = model;
    }

    async loadKey() {
        try {
            // Use fetch to read the file instead of require('fs')
            OpenAIGen.apiKey = process.env.OAI_CSPY_KEY;
            if (OpenAIGen.apiKey) {
                return;
            }
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
    async generate(prompt,callback) {
        if (!OpenAIGen.apiKey) {
            throw new Error("OpenAIGen API key not set");
        }
        //CSPYCompiler.log("using model: " + OpenAIGen.model);

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
        headers: {
                "authorization": "Bearer " + OpenAIGen.apiKey,
                "content-type": "application/json",
        },
        body: JSON.stringify({
          model: OpenAIGen.model,
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
          var genresp = data.choices[0].message.content;
          if (genresp.startsWith("```svg")) {
            genresp = genresp.slice(6);
          }
          if (genresp.startsWith("```")) {
            genresp = genresp.slice(3);
          }
          if (genresp.endsWith("```")) {
            genresp = genresp.slice(0, -3);
          }
          callback(genresp);
        });
    }

    /**
     * 
     * @param {string} prompts 
     * @returns {string}
     */
    async generateMultiturn(prompts,callback) {
        if (!OpenAIGen.apiKey) {
            throw new Error("OpenAIGen API key not set");
        }
        //CSPYCompiler.log("using model: " + OpenAIGen.model);

        var messages = [];
        var genresp = undefined;

        while (prompts.length > 0) {
            //console.log("****",prompts);
            var prompt = prompts.shift();

            messages.push({role:"user",content:[{type:"text",text:prompt}]});

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
                model: OpenAIGen.model,
                max_tokens: 2048,
                messages: messages,
                }),
            });

            var json = await response.json();
            genresp = json.choices[0].message.content;
            CSPYCompiler.log(genresp);
            messages.push({role: "assistant",content: [{ type: "text", text: genresp },],});
        }
        if (genresp.startsWith("```svg")) {
            genresp = genresp.slice(6);
          }
          if (genresp.startsWith("```")) {
            genresp = genresp.slice(3);
          }
          if (genresp.endsWith("```")) {
            genresp = genresp.slice(0, -3);
          }
        callback(genresp);
    }
}   

class GroqGen {

    // make as singleton pattern
    static instance = undefined;
    static apiKey = undefined;
    static model = "llama-3.2-90b-text-preview";

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
        return(GroqGen.instance);
    }

    static setModel(model) {
        GroqGen.model = model;
    }

    async loadKey() {
        try {
            // Use fetch to read the file instead of require('fs')
            GroqGen.apiKey = process.env.GROQ_CSPY_KEY;
            if (GroqGen.apiKey) {
                return;
            }
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
    async generate(prompt,callback) {
        if (!GroqGen.apiKey) {
            throw new Error("GroqGen API key not set");
        }
        //CSPYCompiler.log("using model: " + GroqGen.model);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
        headers: {
                "authorization": "Bearer " + GroqGen.apiKey,
                "content-type": "application/json",
        },
        body: JSON.stringify({
          model: GroqGen.model,
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
          callback(genresp);
        });
    }

    /**
     * 
     * @param {string} prompts 
     * @returns {string}
     */
    async generateMultiturn(prompts,callback) {
        if (!GroqGen.apiKey) {
            throw new Error("GroqGen API key not set");
        }
        //CSPYCompiler.log("using model: " + GroqGen.model);

        var messages = [];
        var genresp = undefined;

        while (prompts.length > 0) {
            //console.log("****",prompts);
            var prompt = prompts.shift();

            messages.push({role:"user",content:[{type:"text",text:prompt}]});

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
                model: GroqGen.model,
                max_tokens: 2048,
                messages: messages,
                }),
            });

            var json = await response.json();
            console.log(json);
            genresp = json.choices[0].message.content;
            CSPYCompiler.log(genresp);
            messages.push({role: "assistant",content: genresp });
            console.log(messages);
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
        callback(genresp);
    }
}  
class SVGGen {

    svgString = undefined;

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

    /**
     * 
     * @returns {SVGGen}
     */
    clone() {
        if (!this.svgString) {
            this.getSVG();
        }
        let clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
        return(clone);
    }

    setSVG(svgString) {
        //CSPYCompiler.log("****" + svgString)
        this.svgString = svgString;
    }


    instToJSON() {
        var toRet = JSON.parse(JSON.stringify(this.constructor.prototype,null,2));
        var props = Object.getOwnPropertyNames(this);
        props.forEach((propName) => {
            toRet[propName] = this[propName];
        });
        return toRet;
    }

    static toJSON() {
        return JSON.parse(JSON.stringify(this.prototype,null,2));
    }

    getClassName() {

        return this.constructor.name;
      
       }
}

/**
 * Compiler class, will generate the right class based on compiler options
 */
class CSPYCompiler {


    static logEnable = true;

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
     * @param {...string} propNames 
     * @returns {class}
     */
    static createPromptClass(...propNames){
        return class extends SVGGen {

            constructor(...propValues){
                super();
                propNames.forEach((name, idx) => {
                    if (propValues[idx] == undefined) {
                        this[name] = this.inputs[name].defaultValue;
                        return;
                    } else {
                        //console.log(name,idx,propValues[idx]);
                        this[name] = propValues[idx];
                        var tp = this.inputs[name];
                        this.inputs[name].defaultValue = Input.convert(propValues[idx],tp.type);
                    }
                });
            }

            async getSVG(callback = undefined) {
                if (this.svgString) {
                    CSPYCompiler.log("Returning cached SVG");
                    return super.getSVG();
                }
                this.svgString = "";
                CSPYCompiler.log("Generating SVG...");

                const props = Object.keys(this.inputs);
                //console.log(this.inputs);
                var propPromptString = "";
                var contextPromptString = undefined;

                props.forEach(prop => {
                    var tProp = this.inputs[prop];
                    if (!tProp) {
                        return;
                    }
                    
                    if (tProp instanceof StaticInput) {
                        propPromptString += `The ${prop} should be ${tProp.defaultValue}\n`;
                    } else if (tProp instanceof ContextInput) {
                        if (!contextPromptString) {
                            contextPromptString = "";
                        }
                        contextPromptString += `\n\nUse the following SVG as a starting point:\n ${tProp.defaultValue}\n`;
                    } else if (tProp instanceof ComputedInput) {
                        tProp.compute();
                        propPromptString += `The ${prop} should be ${tProp.defaultValue}\n`;
                    } else {
                        CSPYCompiler.log(prop,typeof tProp);
                    }
                   });
                   
                var prompt = "Generate an SVG object for " + this.prompt + "\n";
                if (propPromptString != "") {
                    prompt = prompt + "The SVG should have the following properties:\n" + propPromptString;
                }
                prompt = prompt + "\nLabel the parts of the object as an SVG id so they are easier to update.\n";
                if (contextPromptString) {
                    prompt = prompt + contextPromptString;
                }
                prompt = prompt + 
                    "\nThe response should be entirely in SVG format, "+
                    "there should be no other text before or after the SVG code.";
                

                CSPYCompiler.log(prompt);
                if (this.llm == 'OpenAI') {
                    var genresp = await OpenAIGen.getInstance().generate(prompt, (resp) => {
                        this.setSVG(resp);
                    });
                } else if (this.llm == "Groq") {
                    var genresp = await GroqGen.getInstance().generate(prompt, (resp) => {
                        this.setSVG(resp);
                    });
                } else {
                    var genresp = await AnthropicGen.getInstance().generate(prompt, (resp) => {
                        this.setSVG(resp);
                    });
                }
                return super.getSVG(callback);
            }

            update(...propValues) {
                var toRet = this.clone();
                var iputs = {};
                var toRetPNames = [];
                const props = Object.keys(this.inputs);
                var idx = 0;
                props.forEach((prop) => {
                    var tProp = this.inputs[prop];
                    tProp = tProp.clone();
                    tProp.defaultValue = Input.convert(propValues[idx],tProp.type);
                    iputs[prop] = tProp;
                    toRetPNames.push(prop);
                    idx++;
                });
                toRet.inputs = iputs;
                toRet.propNames = toRetPNames;
                // the clone should now have a contextinput, so
                
                toRet.inputs['contextString'] = new ContextInput("starter SVG",this.svgString);
                toRet.svgString = undefined;
                return toRet;
            }

        }
    }

     /**
     * 
     * @param {...string} propNames 
     * @returns {class}
     */
     static createTemplateClass(...propNames){
        return class extends SVGGen {

            constructor(...propValues){
                super();
                propNames.forEach((name, idx) => {
                    if (propValues[idx] == undefined) {
                        this[name] = this.inputs[name].defaultValue;
                        return;
                    } else {
                        //console.log(name,idx,propValues[idx]);
                        this[name] = propValues[idx];
                        var tp = this.inputs[name];
                        this.inputs[name].defaultValue = Input.convert(propValues[idx],tp.type);
                    }
                });
            }

            async getSVG(callback = undefined) {
                if (this.svgString) {
                    CSPYCompiler.log("Returning cached SVG");
                    return super.getSVG(callback);
                }
                if (this.svgTemplate) {
                    this.fillTemplate();
                    return super.getSVG(callback);
                }

                this.svgString = "";
                  
                CSPYCompiler.log("Generating SVG...");

                

                var prompt = "Generate an SVG object for '" + this.prompt + 
                    "'. For the following properties, replace the value with a javascript template in the same name.\n" +
                    "\nLabel the parts of the object so they are easier to update. " +
                    "For example, if I ask for a 'black hole' with a 'radius' of 10, you might return "+
                    "'<circle r='${radius}' id='hole' color='black'/>'.\n" +
                    "\nThe response should be entirely in SVG format, "+
                    "there should be no other text before or after the SVG code." +
                    "The properties I am interested in templatizing are: \n";
                    
                prompt = "write me svg code to create a svg image of " + this.prompt + 
                ". Make the svg image as detailed as possible and as close to the description as possible.\n" + 
                "Furthermore, process the generated svg code into a svg code template, with the given a list " +
                "of parameter names, make the returned svg code a template with certain parameters as text placeholders made by ${parameter name}. " +
                "For example, parameter list: roof height, window color; resulting javascript template:\n" +
                "<svg viewBox=\"0 0 200 200\">\n<rect x=\"50\" y=\"70\" width=\"100\" height=\"80\" fill=\"brown\" /> <!-- House body -->\n<polygon points=\"50,70 100,{roof_height} 150,70\" fill=\"red\" /> <!-- Roof -->\n<rect x=\"65\" y=\"90\" width=\"20\" height=\"20\" fill=\"{window_color}\" /> <!-- Window 1 -->\nrect x=\"115\" y=\"90\" width=\"20\" height=\"20\" fill=\"{window_color}\" /> <!-- Window 2 -->\n<rect x=\"90\" y=\"120\" width=\"20\" height=\"30\" fill=\"black\" /> <!-- Door -->\n</svg>." +
                "Notice that only one parameter name and nothing else can be inside ${}. Replace the whole parameter "+
                "(e.g., fill = \"#e0d0c0\" to fill = \"${parameter name}\") instead of just part of it (e.g., "+
                "fill = \"#e0d0c0\" to fill = \"#${parameter name}\"). Return svg code template for this parameter list:\n\n";
              
                const props = Object.keys(this.inputs);
                var contextPromptString = undefined;
                props.forEach(prop => {
                    var tProp = this.inputs[prop];
                    if (!tProp) {
                        return;
                    }
                    
                    if (tProp instanceof StaticInput) {
                        prompt += `variable name: ${prop} which encodes the ${tProp.description}\n`;
                    } else if (tProp instanceof ContextInput) {
                        if (!contextPromptString) {
                            contextPromptString = "";
                        }
                        contextPromptString += `\n\nUse the following SVG as a starting point:\n ${tProp.defaultValue}\n`;
                    } else if (tProp instanceof ComputedInput) {
                        //tProp.compute();
                        prompt += `variable name: ${prop} which encodes the ${tProp.description}\n`;
                    } 
                   });
                
                CSPYCompiler.log(this.inputs);

                prompt = prompt + "\n" +" Do not include any background in generated svg. "+
                "The svg code template must be able to satisfy the requirements of the parameters by simply replacing the placeholders, instead of other manual modifications (e.g., 'window number' can be modified by simply replacing {window number} to some data, instead of needing to repeat window element manually)" +
                "Make sure do not include anything other than the final svg code template in your response.";

                if (contextPromptString) {
                    prompt = prompt + "\n\n" + contextPromptString;
                }

                CSPYCompiler.log(prompt);
                if (this.llm == 'OpenAI') {
                    var genresp = await OpenAIGen.getInstance().generate(prompt, (resp) => {
                        this.setTemplate(resp);
                    });
                } else if (this.llm == "Groq") {
                    var genresp = await GroqGen.getInstance().generate(prompt, (resp) => {
                        this.setTemplate(resp);
                    });
                } else {
                    var genresp = await AnthropicGen.getInstance().generate(prompt, (resp) => {
                        this.setTemplate(resp);
                    });
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
                String.prototype.interpolate = function(params) {
                    const names = Object.keys(params);
                    const vals = Object.values(params);
                    return new Function(...names, `return \`${this}\`;`)(...vals);
                  }
                
                  //console.log(this.inputs);
                  const props = Object.keys(this.inputs);
                  const tvals = {};
                  props.forEach((prop) => {
                    var tProp = this.inputs[prop];
                    if (tProp instanceof ComputedInput) {
                        tProp.compute();
                    } 
                    //console.log(prop,tProp.defaultValue);
                    tvals[prop] = tProp.defaultValue;
                  });
                const template = this.svgTemplate;
                //CSPYCompiler.log("****",tvals);
                this.svgString = template.interpolate(tvals);
                //return this.svgString;
            }

            update(...propValues) {
                var toRet = this.clone();
                var iputs = {};
                var toRetPNames = [];
                const props = Object.keys(this.inputs);
                var idx = 0;
                props.forEach((prop) => {
                    var tProp = this.inputs[prop];
                    tProp = tProp.clone();
                    tProp.defaultValue = Input.convert(propValues[idx],tProp.type);
                    iputs[prop] = tProp;
                    toRetPNames.push(prop);
                    idx++;
                });
                toRet.inputs = iputs;
                toRet.propNames = toRetPNames;
                toRet.svgTemplate = this.svgTemplate;
                toRet.svgString = undefined;
                return toRet;
            }
        }
    }

    /**
         * 
         * @param {...string} propNames 
         * @returns {class}
         */
    static createCodeClass(...propNames){
        return class extends SVGGen {

            constructor(...propValues){
                super();
                propNames.forEach((name, idx) => {
                    if (propValues[idx] == undefined) {
                        this[name] = this.inputs[name].defaultValue;
                        return;
                    } else {
                        //console.log(name,idx,propValues[idx]);
                        this[name] = propValues[idx];
                        var tp = this.inputs[name];
                        this.inputs[name].defaultValue = Input.convert(propValues[idx],tp.type);
                    }
                });
            }

            async getSVG(callback = undefined) {
                if (this.svgString) {
                    CSPYCompiler.log("Returning cached SVG");
                    return super.getSVG(callback);
                }
                if (typeof this.fillTemplateInternal === "function") {
                    CSPYCompiler.log("Returning cached function");
                    this.fillTemplate();
                    return super.getSVG(callback);
                }

                var p1 = "We will be constructing an image of a " + this.prompt + "using simple SVG constructs."+
                "Describe the process by which we would construct the image. Include details "+
                "about determining the placement and size of each part relative to others. "+
                "Do this step by step. We will want the parameterize the following features:\n";

                var p2 = "Use the step by step instructions to construct a javascript function "+
                "called fillTemplate. fillTemplate will accept an argument of an object "+
                "that holds the parameters. For example {'a':5,'b':'red'}\n"+
                "The output of fillTemplate will be an SVG stringthat generates the image using SVG. The javascript function should not use "+
                "browser features or external libraries. It should work by concatenating text "+
                "to build the SVG. Return the javascript function and nothing else. There should "+
                "be no text before or after the function. You should expect the dictionary object that "+
                "is fed to fillTemplate to have the following: "

                const props = Object.keys(this.inputs);
                var contextPromptString = undefined;
                props.forEach(prop => {
                    var tProp = this.inputs[prop];
                    if (!tProp) {
                        return;
                    }
                    
                    if (tProp instanceof StaticInput) {
                        p1 += `variable name: ${prop} which encodes the ${tProp.description}\n`;
                        p2 += `variable name: ${prop} which encodes the ${tProp.description}\n`;
                    } else if (tProp instanceof ContextInput) {
                        if (!contextPromptString) {
                            contextPromptString = "";
                        }
                        contextPromptString += `\n\nUse the following SVG as a starting point:\n ${tProp.defaultValue}\n`;
                    } else if (tProp instanceof ComputedInput) {
                        p1 += `variable name: ${prop} which encodes the ${tProp.description}\n`;
                        p2 += `variable name: ${prop} which encodes the ${tProp.description}\n`;
                    }
                   });
                
                    
                this.svgString = "";
        
                //CSPYCompiler.log(prompt);
                CSPYCompiler.log(p1);
                CSPYCompiler.log(p2);
                if (this.llm == 'OpenAI') {
                    var genresp = await OpenAIGen.getInstance().generateMultiturn([p1,p2], (resp) => {
                        this.setTemplate(resp);
                        });
                } else if (this.llm == 'Groq') {
                    var genresp = await GroqGen.getInstance().generateMultiturn([p1,p2], (resp) => {
                        this.setTemplate(resp);
                        });
                } else {
                    var genresp = await AnthropicGen.getInstance().generateMultiturn([p1,p2], (resp) => {
                    this.setTemplate(resp);
                    });
                }
                //this.setTemplate("function fillTemp(props) { CSPYCompiler.log('yay!');}");
                //return this.fillTemplate();
                return super.getSVG(callback);
            }

            fillTemplate() {
                const props = Object.keys(this.inputs);
                var tVals = {};
                props.forEach(prop => {
                    var tProp = this.inputs[prop];
                    if (!tProp) {
                        return;
                    }
                    
                    if (tProp instanceof StaticInput) {
                        tVals[prop] = tProp.defaultValue;
                    }

                    if (tProp instanceof ComputedInput) {
                        tProp.compute();
                        tVals[prop] = tProp.defaultValue;
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
                var func = eval("var fillTemplateInternal="+templateString+"\nfillTemplateInternal;");
                this.fillTemplateInternal = func;
                this.javascriptString = templateString;
                //CSPYCompiler.log(func);
                this.fillTemplate();
            }


            update(...propValues) {
                var toRet = this.clone();
                var iputs = {};
                var toRetPNames = [];
                const props = Object.keys(this.inputs);
                var idx = 0;
                props.forEach((prop) => {
                    var tProp = this.inputs[prop];
                    tProp = tProp.clone();
                    tProp.defaultValue = Input.convert(propValues[idx],tProp.type);
                    iputs[prop] = tProp;
                    toRetPNames.push(prop);
                    idx++;
                });
                toRet.inputs = iputs;
                toRet.propNames = toRetPNames;
                // the clone should now have a contextinput, so
                toRet.svgString = undefined;
                return toRet;
            }
        }
    }

    /**
     * 
     * @param {...string} propNames 
     * @returns {class}
     */
    static createLayoutClass(...propNames){
        return class extends CSPY {
    
            constructor(...propValues){
                super();
                propNames.forEach((name, idx) => {
                    if (propValues[idx] == undefined) {
                        this[name] = this.inputs[name].defaultValue;
                        return;
                    } else {
                        this[name] = propValues[idx];
                        var tp = this.inputs[name];
                        this.inputs[name].defaultValue = Input.convert(propValues[idx],tp.type);
                    }
                });
            }
    
            async getlayoutboxes(callback = undefined) {
                if (this.layoutBoxes) {
                    CSPYCompiler.log("Returning cached layout boxes");
                    if (callback) {
                        await callback(this.layoutBoxes);
                    }
                    return this.layoutBoxes;
                }
    
                if (typeof this.generateLayoutInternal === "function") {
                    CSPYCompiler.log("Using cached function");
                    this.generateLayout();
                    if (callback) {
                        await callback(this.layoutBoxes);
                    }
                    return this.layoutBoxes;
                }
    
                // Construct prompts for the LLM
                var p1 = "Imagine you are given a canvas with width and height set to 100. We will be constructing a layout of elements of this canvas according to this description:  " + this.prompt +
                " The layout is consisted of numerious non-overlapping boxes specifying the coordinate of the top left, top right, botton left, bottom right position of each element. Each coordinate woule be like : {x: number, y: number}" +
                " Describe how to programmatically create such a layout with javascript functions. " +
                " Do this step by step. We will want to parameterize the following features:\n";
    
                var p2 = "Use the step-by-step instructions to construct a JavaScript function " +
                " called generateLayout. generateLayout will accept an argument of an object " +
                " that holds the parameters. For example {'a':5,'b':'up to down'}\n" +
                " The output of generateLayout will be an array of objects, each representing a layout box of the 4 coordinate location for an element described above. Make sure the boxes of the generated layout will not overlap with each other. Example output: " +
                `{
                    "topLeft": {
                        "x": 0,
                        "y": 0
                    },
                    "topRight": {
                        "x": 3,
                        "y": 0
                    },
                    "bottomLeft": {
                        "x": 0,
                        "y": 8
                    },
                    "bottomRight": {
                        "x": 3,
                        "y": 8
                    }
                }`+
                " The JavaScript function should not use browser features or external libraries. It should work by computing and returning the array of objects. Return the JavaScript function and nothing else. There should " +
                " be no text before or after the function. You should expect the dictionary object that " +
                " is fed to generateLayout to have the following: ";
    
                // Collect properties and construct prompts
                const props = Object.keys(this.inputs);
                props.forEach(prop => {
                    var tProp = this.inputs[prop];
                    if (!tProp) {
                        return;
                    }
                    
                    if (tProp instanceof StaticInput || tProp instanceof ComputedInput) {
                        p1 += `variable name: ${prop} which encodes the ${tProp.description}\n`;
                        p2 += `variable name: ${prop} which encodes the ${tProp.description}\n`;
                    }
                });
    
                CSPYCompiler.log(p1);
                CSPYCompiler.log(p2);
    
                // Generate code using the specified LLM
                if (this.llm == 'OpenAI') {
                    await OpenAIGen.getInstance().generateMultiturn([p1,p2], (resp) => {
                        this.setLayoutFunction(resp);
                    });
                } else if (this.llm == 'Groq') {
                    await GroqGen.getInstance().generateMultiturn([p1,p2], (resp) => {
                        this.setLayoutFunction(resp);
                    });
                } else {
                    await AnthropicGen.getInstance().generateMultiturn([p1,p2], (resp) => {
                        this.setLayoutFunction(resp);
                    });
                }
    
                this.generateLayout();
                if (callback) {
                    await callback(this.layoutBoxes);
                }
                return this.layoutBoxes;
            }
    
            generateLayout() {
                const props = Object.keys(this.inputs);
                var tVals = {};
                props.forEach(prop => {
                    var tProp = this.inputs[prop];
                    if (!tProp) {
                        return;
                    }
                    
                    if (tProp instanceof StaticInput || tProp instanceof ComputedInput) {
                        tVals[prop] = tProp.defaultValue;
                    }
                });
                this.layoutBoxes = this.generateLayoutInternal(tVals);
            }
    
            setLayoutFunction(functionString) {
                CSPYCompiler.log(functionString);
                var func = eval("var generateLayoutInternal=" + functionString + "\ngenerateLayoutInternal;");
                this.generateLayoutInternal = func;
                this.javascriptString = functionString;
                this.generateLayout();
            }
    
            update(...propValues) {
                var toRet = this.clone();
                var iputs = {};
                var idx = 0;
                const props = Object.keys(this.inputs);
                props.forEach((prop) => {
                    var tProp = this.inputs[prop];
                    tProp = tProp.clone();
                    tProp.defaultValue = Input.convert(propValues[idx],tProp.type);
                    iputs[prop] = tProp;
                    idx++;
                });
                toRet.inputs = iputs;
                toRet.layoutBoxes = undefined;
                return toRet;
            }
        }
    }
    

    static compileGeneric(newclass,inpr,tempInst,props) {
        var prompt = tempInst["prompt"];
        newclass.prototype.prompt = prompt;
        newclass.prototype.properties = props;
        newclass.prompt = prompt;
        newclass.properties = props;
        newclass.prototype.className = tempInst.getClassName();
        newclass.className = tempInst.getClassName();
        var inputs = {};
        for (var i = 0; i < props.length; i++) {
           var iput = tempInst[props[i]];
           if (iput instanceof Input) {
             inputs[props[i]] = iput.clone();
           }
        }
        newclass.inputs = inputs;
        newclass.prototype.inputs = inputs;

        //CSPYCompiler.log(inputs);
        return newclass;

    }

    static compileLayout(inpr, llm="Anthropic") {
        var tempInst = new inpr();
        // Extract properties from the input class
        var props = Object.getOwnPropertyNames(tempInst);
        props = props.filter(prop => prop !== "prompt");
        var newclass = this.createLayoutClass(...props);
        newclass.prototype['compiler'] = "layoutcompiler";
        newclass.prototype['llm'] = llm;
        return this.compileGeneric(newclass, inpr, tempInst, props);
    }
    
    static compilePrompt(inpr,llm="Anthropic") {
        var tempInst = new inpr();
        // read all properties of tempInst and load into an array
        var props = Object.getOwnPropertyNames(tempInst);
        props = props.filter(prop => prop !== "prompt");
        var newclass = this.createPromptClass(...props);
        newclass.prototype['compiler'] = "prompt";
        newclass.prototype['llm'] = llm;
        return this.compileGeneric(newclass,inpr,tempInst,props);
    }

    static compileTemplate(inpr,llm="Anthropic") {
        var tempInst = new inpr();
        // read all properties of tempInst and load into an array
        var props = Object.getOwnPropertyNames(tempInst);
        props = props.filter(prop => prop !== "prompt");
        var newclass = this.createTemplateClass(...props);
        newclass.prototype['compiler'] = "template";
        newclass.prototype['llm'] = llm;
        return this.compileGeneric(newclass,inpr,tempInst,props);
        
    }

    static compileChat(inpr,llm="Anthropic") {
        return SVGGen;
    }

    static compileCode(inpr,llm="Anthropic") {
        var tempInst = new inpr();
        // read all properties of tempInst and load into an array
        var props = Object.getOwnPropertyNames(tempInst);
        props = props.filter(prop => prop !== "prompt");
        var newclass = this.createCodeClass(...props);
        newclass.prototype['compiler'] = "code";
        newclass.prototype['llm'] = llm;
        return this.compileGeneric(newclass,inpr,tempInst,props);
    }

    static compileMixed(inpr,llm="Anthropic") {
        return SVGGen;
    }

    static compileFromJSON(inJSON) {
        var outtype = "prompt";
        var llm = "Anthropic";
        if (inJSON.compiler) {
            outtype = inJSON.compiler;
        }
        if (inJSON.llm) {
            llm = inJSON.llm;
        }
        var inputNames = inJSON.inputs.keys();

    }

    static compile(inpr,outtype="prompt",llm="Anthropic") {
        // check if inpr is a function
        if (!inpr instanceof CSPY) {
            throw new Error("Object does not extend CSPY");
        }

        if (outtype == "prompt") {
            return this.compilePrompt(inpr,llm);
        } else if (outtype == "template") {
            return this.compileTemplate(inpr,llm);
        } else if (outtype == "chat") {
            return this.compileChat(inpr,llm);
        } else if (outtype == "code") {
            return this.compileCode(inpr,llm);
        } else if (outtype == "mixed") {
            return this.compileMixed(inpr,llm);
        }else if (outtype == "layoutcompiler") {
            return this.compileLayout(inpr, llm);
        }
    }
}