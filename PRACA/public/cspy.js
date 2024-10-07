//import { PromptLibrary } from "./PromptLibrary.js";

// basic CSPY class that we will extend
class CSPY {
    constructor() {
    }

    // return a string reprsentation of the object, iterate over all properties
    toString() {
        return Object.entries(this).map(([key, value]) => `${key}: ${value}`).join("\n");
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
        this.defaultValue = defaultValue;
        this.type = type;
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
    }
}


class RandomChoiceInput extends Input {
    /**
     * 
     * @param {string} description 
     * @param {array} choices
     * @param {string} type
     */
    constructor(description, choices=[], type="string") {
        this.description = description;
        this.choices = choices;
        this.type = type;
    }

    /**
     * 
     * @returns {string}
     */
    toString() {
        return `${this.description}: ${this.choices} (${this.type})`;
    }

    /**
     * 
     */
    pickOne() {
        if (this.choices.length == 0) {
            return undefined;
        }
        return this.choices[(Math.floor(Math.random() * this.choices.length))];
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

    static toJSON() {
        return JSON.stringify(this.prototype,null,2);
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
                        this.inputs[name].defaultValue = propValues[idx];
                    }
                });
                console.log('check herehhh', this)
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
                    } else {
                        console.log(prop,typeof tProp);
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
                var genresp = await AnthropicGen.getInstance().generate(prompt, (resp) => {
                    this.setSVG(resp);
                });
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
                    tProp.defaultValue = propValues[idx];
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
                        this.inputs[name].defaultValue = propValues[idx];
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
                var genresp = await AnthropicGen.getInstance().generate(prompt, (resp) => {
                    this.setTemplate(resp);
                });
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
                
                  const props = Object.getOwnPropertyNames(this);
                  const tvals = {};
                  props.forEach(prop => {
                    if (prop == "prompt") {
                        return;
                    }
                    if (prop == "svgString") {
                        return;
                    }
                    if (prop == "svgTemplate") {
                        return;
                    }
                    tvals[prop] = this[prop];
                   });

                const template = this.svgTemplate;
                CSPYCompiler.log(tvals);
                this.svgString = template.interpolate(tvals);
                //return this.svgString;
            }

            update(...propValues) {
                var toRet = this.clone();
                propNames.forEach((name, idx) => {
                    toRet[name] = propValues[idx];
                });
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
                    this[name] = propValues[idx];
                });
            }

            async getSVG(callback=undefined) {
                if (this.svgString) {
                    CSPYCompiler.log("Returning cached SVG");
                    return super.getSVG(callback);
                }
                if (typeof this.fillTemplate === "function") {
                    return this.fillTemplate();
                }

                this.svgString = "";

                const props = Object.getOwnPropertyNames(this);

                var prompt = "Generate a javascript function called fillTemplate"+
                    " that returns SVG code for '" + 
                    this.prompt + 
                    "'. the argument to fillTemplate should be a object where the " +
                    " keys are the properties and values are the property values." +
                    "For example, we might run fillTemplate({'size':5,'color':'red'})\n"+
                    "\nIn the SVG, label the parts of the object so they are easier to update. " +
                    "\nThe response should be entirely javascript code, "+
                    "there should be no other text before or after the function.\n" +
                    "The properties I am interested in are: \n";
                    

                props.forEach(prop => {
                    if (prop == "prompt") {
                        return;
                    }
                    if (prop == "svgString") {
                        return;
                    }
                    if (prop == "svgTemplate") {
                        return;
                    }
                    prompt += `${prop}\n`;
                });
                                
                //CSPYCompiler.log(prompt);
                var genresp = await AnthropicGen.getInstance().generate(prompt, (resp) => {
                   this.setTemplate(resp);
                });
                //this.setTemplate("function fillTemp(props) { CSPYCompiler.log('yay!');}");
                //return this.fillTemplate();
                return super.getSVG(callback);
            }

            setTemplate(templateString) {
                //CSPYCompiler.log("****" + svgString)
                // eval the string and set
                CSPYCompiler.log(templateString);
                var func = eval("var fillTemp="+templateString+"\nfillTemp;");
                //CSPYCompiler.log(func);
                Object.getPrototypeOf(this).fillTemp = func;
                this.fillTemp([]);
                //this.svgTemplate = templateString;
            }

            update(...propValues) {
                var toRet = this.clone();
                propNames.forEach((name, idx) => {
                    toRet[name] = propValues[idx];
                });
                toRet.svgTemplate = this.svgTemplate;
                toRet.svgString = undefined;
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

    static compilePrompt(inpr) {
        var tempInst = new inpr();
        // read all properties of tempInst and load into an array
        var props = Object.getOwnPropertyNames(tempInst);
        props = props.filter(prop => prop !== "prompt");
        var newclass = this.createPromptClass(...props);
        newclass.prototype['compiler'] = "prompt";
        return this.compileGeneric(newclass,inpr,tempInst,props);
    }

    static compileTemplate(inpr) {
        var tempInst = new inpr();
        // read all properties of tempInst and load into an array
        var props = Object.getOwnPropertyNames(tempInst);
        props = props.filter(prop => prop !== "prompt");
        var newclass = this.createTemplateClass(...props);
        return this.compileGeneric(newclass,inpr,tempInst,props);
        newclass.prototype['compiler'] = "template";
    }

    static compileChat(inpr) {
        return SVGGen;
    }

    static compileCode(inpr) {
        var tempInst = new inpr();
        // read all properties of tempInst and load into an array
        var props = Object.getOwnPropertyNames(tempInst);
        props = props.filter(prop => prop !== "prompt");
        var newclass = this.createCodeClass(...props);
        newclass.prototype['compiler'] = "code";
        return this.compileGeneric(newclass,inpr,tempInst,props);
    }

    static compileMixed(inpr) {
        return SVGGen;
    }

    static compile(inpr,outtype="prompt") {
        // check if inpr is a function
        if (!inpr instanceof CSPY) {
            throw new Error("Object does not extend CSPY");
        }

        if (outtype == "prompt") {
            return this.compilePrompt(inpr);
        } else if (outtype == "template") {
            return this.compileTemplate(inpr);
        } else if (outtype == "chat") {
            return this.compileChat(inpr);
        } else if (outtype == "code") {
            return this.compileCode(inpr);
        } else if (outtype == "mixed") {
            return this.compileMixed(inpr);
        }
    }
}