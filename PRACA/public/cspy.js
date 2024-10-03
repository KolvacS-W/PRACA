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
     * @param {string} name 
     * @param {any} defaultValue 
    * @param {string} explanation 
     * @param {string} type 
     */
    constructor(name, defaultValue=undefined, explanation="", type="string") {
        this.name = name;
        this.explanation = explanation;
        this.defaultValue = defaultValue;
        this.type = type;
    }

    /**
     * 
     * @returns {string}
     */
    toString() {
        return `${this.name}: ${this.explanation} (${this.type})`;
    }
}

class RandomChoiceInput extends Input {
    /**
     * 
     * @param {string} name 
     * @param {array} choices
     * @param {string} type
     */
    constructor(name, choices=[], type="string") {
        this.name = name;
        this.choices = choices;
        this.type = type;
    }

    /**
     * 
     * @returns {string}
     */
    toString() {
        return `${this.name}: ${this.choices} (${this.type})`;
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
//console.log(input.toString());




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
            console.log('key provided', AnthropicGen, AnthropicGen.apiKey)
        }
        return(AnthropicGen.instance);
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
                    console.log(AnthropicGen.apiKey);
                    return;
                })
                .catch(err => {
                    console.error('Error fetching API key:', err);
                });
             
        } catch (err) {

        }
        console.log(AnthropicGen.apiKey);
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
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
        headers: {
          "x-api-key": AnthropicGen.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
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
    getSVG() {
        console.log(typeof this.svgString);
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
        //console.log("****" + svgString)
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
                this[name] = propValues[idx];
                });
            }

            async getSVG(callback = () => {}) {
                if (this.svgString) {
                    console.log("Returning cached SVG");
                    return super.getSVG();
                }
                this.svgString = "";
                console.log("Generating SVG...");

                const props = Object.getOwnPropertyNames(this);
                var propPromptString = "";
                props.forEach(prop => {
                    if (prop == "prompt") {
                        return;
                    }
                    if (prop == "svgString") {
                        return;
                    }
                    propPromptString += `The ${prop} should be ${this[prop]}\n`;
                   });
                   
                var prompt = "";
                if (!this.contextString) {
                    prompt = "Generate an SVG object for " + this.prompt + "\n";
                    if (propPromptString != "") {
                        prompt = prompt + "The SVG should have the following properties:\n" + propPromptString;
                    }
                    prompt = prompt + "\nLabel the parts of the object so they are easier to update. "
                } else {
                    prompt = "This is an SVG for " + this.prompt + "\n";
                    prompt = prompt + "Modify the SVG so it has the following properties: ";
                    if (propPromptString != "") {
                        prompt = prompt + propPromptString;
                    }
                }

                prompt = prompt + 
                    "\nThe response should be entirely in SVG format, "+
                    "there should be no other text before or after the SVG code.";
                

                console.log(prompt);
                var genresp = await AnthropicGen.getInstance().generate(prompt, (resp) => {
                    this.setSVG(resp);
                });
                console.log('before callback', this.svgString)
                await callback(this.svgString);              
                return(this.svgString);
            }

            update(...propValues) {
                var toRet = this.clone();
                propNames.forEach((name, idx) => {
                    toRet[name] = propValues[idx];
                });
                toRet.contextString = toRet.svgString;
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
                this[name] = propValues[idx];
                });
            }

            async getSVG(callback = () => {}) {
                if (this.svgString) {
                    console.log("Returning cached SVG");
                    return super.getSVG();
                }
                if (this.svgTemplate) {
                    return await this.fillTemplate(callback);
                }

                this.svgString = "";
                  
                console.log("Generating SVG...");

                const props = Object.getOwnPropertyNames(this);

                var prompt = "Generate an SVG object for '" + this.prompt + 
                    "'. For the following properties, replace the value with a javascript template in the same name.\n" +
                    "\nLabel the parts of the object so they are easier to update. " +
                    "For example, if I ask for a 'black hole' with a 'radius' of 10, you might return "+
                    "'<circle r='${radius}' id='hole' color='black'/>'.\n" +
                    "\nThe response should be entirely in SVG format, "+
                    "there should be no other text before or after the SVG code." +
                    "The properties I am interested in templatizing are: \n";
                    
    
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
                                   
                console.log(prompt);
                var genresp = await AnthropicGen.getInstance().generate(prompt, (resp) => {
                    this.setTemplate(resp);
                });
                return await this.fillTemplate(callback);
            }

            setTemplate(templateString) {
                //console.log("****" + svgString)
                console.log(templateString);
                this.svgTemplate = templateString;
            }

            async fillTemplate(callback = () => {}) {
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
                    tvals[prop] = this[prop];
                   });

                const template = this.svgTemplate;
                this.svgString = template.interpolate(tvals);                
                await callback(this.svgString);
                return(this.svgString);
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

            async getSVG() {
                if (this.svgString) {
                    console.log("Returning cached SVG");
                    return super.getSVG();
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
                                
                //console.log(prompt);
                var genresp = await AnthropicGen.getInstance().generate(prompt, (resp) => {
                   this.setTemplate(resp);
                });
                //this.setTemplate("function fillTemp(props) { console.log('yay!');}");
                //return this.fillTemplate();
            }

            setTemplate(templateString) {
                //console.log("****" + svgString)
                // eval the string and set
                console.log(templateString);
                var func = eval("var fillTemp="+templateString+"\nfillTemp;");
                //console.log(func);
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
            inputs[props[i]] = iput;
           }
        }
        newclass.inputs = inputs;
        newclass.prototype.inputs = inputs;

        console.log(inputs);
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


