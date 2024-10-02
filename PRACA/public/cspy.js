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

            async getSVG() {
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

            async getSVG() {
                if (this.svgString) {
                    console.log("Returning cached SVG");
                    return super.getSVG();
                }
                if (this.svgTemplate) {
                    return this.fillTemplate();
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
                return this.fillTemplate();
            }

            setTemplate(templateString) {
                //console.log("****" + svgString)
                console.log(templateString);
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
                    tvals[prop] = this[prop];
                   });

                const template = this.svgTemplate;
                this.svgString = template.interpolate(tvals);
                return this.svgString;
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

window.addEventListener('message', function(event) {
    if (event.data.type === 'EXECUTE_CLASSCODE') {
        window._classcode = event.data.classcode.js;
    }

    if (event.data.type === 'EXECUTE_USERCODE') {
        if (!window._classcode) {
            console.error('Classcode not loaded');
            return;
        }

        const combinedCode = `${window._classcode}\n${event.data.usercode}`;

        // Create a script element
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = combinedCode;
        console.log('script created', script)
        document.body.appendChild(script);
    }
});

// window.addEventListener('message', function(event) {
//     console.log('listening to execute calls??')
//     if (event.data.type === 'EXECUTE_CLASSCODE') {
//         // Execute classcode.js
//         console.log('Executing classcode.js', event.data.classcode);
//         try {
//             (0, eval)(event.data.classcode.js); // Executes in global scope
//         } catch (e) {
//             console.error('Error executing classcode.js:', e);
//         }
//     }
// })
// window.addEventListener('message', function(event) {
//     if (event.data.type === 'EXECUTE_USERCODE') {

//         console.log('running user.js')
//         window.parent.postMessage({
//             type: 'LOAD_CACHEDOBJECT'
//         }, '*');

//         function recoverClassFromClassInfo(data) {
//             if (data === null || typeof data !== 'object') return data;

//             // Handle arrays that were mistakenly serialized as objects with numbered keys
//             if (isSerializedArray(data)) {
//                 return Object.values(data);
//             }

//             // Handle arrays recursively
//             if (Array.isArray(data)) {
//                 return data.map(item => recoverClassFromClassInfo(item));
//             }

//             if (data.classinfo) {
//                 // Log to see the recovery of classinfo
//                 console.log('Recovering', data.classinfo);

//                 // Check the classinfo property and restore the corresponding class
//                 let recoveredInstance;
//                 switch (data.classinfo) {
//                     case 'Rule': {
//                         recoveredInstance = new Rule();
//                         Object.assign(recoveredInstance, data);
//                         break;
//                     }
//                     case 'GeneratedObject': {
//                         const {
//                             objname = '', svgcode = '', templatecode = '', modifyobj = '', piecenames = '', piecenamemodify = '', parameters = '', abstract_params, parametercontents = '', abstractparametercontents = '', basic_prompt = '', annotated_pieces = ''
//                         } = data;
//                         const templatecodeInstance = recoverClassFromClassInfo(templatecode); // Recover the template properly
//                         const piecenamesInstance = recoverClassFromClassInfo(piecenames); // Recover the rule as well
//                         const piecenamemodifyInstance = recoverClassFromClassInfo(piecenamemodify); // Recover the rule as well
//                         const parametersInstance = recoverClassFromClassInfo(parameters); // Recover the rule as well
//                         const abstractparametercontentsInstance = recoverClassFromClassInfo(abstractparametercontents); // Recover the rule as well
//                         const abstract_paramsInstance = recoverClassFromClassInfo(abstract_params); // Recover the rule as well
//                         const parametercontentsInstance = recoverClassFromClassInfo(parametercontents); // Recover the rule as well

//                         const basic_promptInstance = recoverClassFromClassInfo(basic_prompt); // Recover the rule as well
//                         const annotated_piecesInstance = recoverClassFromClassInfo(annotated_pieces);
//                         recoveredInstance = new GeneratedObject(objname, svgcode, templatecodeInstance, piecenamesInstance, piecenamemodifyInstance, parametersInstance, abstract_paramsInstance, parametercontentsInstance, abstractparametercontentsInstance, basic_promptInstance, annotated_piecesInstance);
//                         Object.assign(recoveredInstance, data); // Assign any additional properties
//                         break;
//                     }

//                     case 'whole_canvas': {
//                         const canvas = new whole_canvas(data.canvas_color || '#FFFFFF');
//                         Object.assign(canvas, data);
//                         recoveredInstance = canvas;
//                         break;
//                     }
//                     default:
//                         recoveredInstance = data; // If no matching class, return the data as-is
//                         break;
//                 }

//                 // Remove the classinfo field after the object is recovered
//                 delete recoveredInstance.classinfo;

//                 // Recursively recover subobjects
//                 for (const key in recoveredInstance) {
//                     if (recoveredInstance.hasOwnProperty(key) && typeof recoveredInstance[key] === 'object') {
//                         recoveredInstance[key] = recoverClassFromClassInfo(recoveredInstance[key]);
//                     }
//                 }

//                 return recoveredInstance;
//             }

//             // If no classinfo is found, continue recursively recovering properties
//             for (const key in data) {
//                 if (data.hasOwnProperty(key) && typeof data[key] === 'object') {
//                     data[key] = recoverClassFromClassInfo(data[key]);
//                 }
//             }

//             return data;
//         }

//         // Helper function to check if an object was serialized as an array
//         function isSerializedArray(obj) {
//             if (typeof obj !== 'object' || obj === null) return false;

//             // Check if all keys are sequential numbers starting from 0
//             const keys = Object.keys(obj);
//             return keys.every((key, index) => Number(key) === index);
//         }




//         // No timeout, keep waiting for CACHEDOBJECT_LOADED indefinitely before executing user.js
//         (async function() {
//             console.log('Waiting for CACHEDOBJECT_LOADED event...');

//             window.cachedobjects = {}; // Declare as a reference to be assigned

//             // Wait for the cachedobjectsRef to be provided by the parent (React app)
//             await new Promise((resolve) => {
//                 const messageHandler = (event) => {
//                     if (event.data.type === 'SYNC_PREVIOUS_OBJECTS_REF') {
//                         console.log('Received cachedobjectsRef from parent:', event.data.cachedobjects);
//                         if (event.data.cachedobjects) {
//                             window.cachedobjects = recoverClassFromClassInfo(event.data.cachedobjects); // Directly assign the deserialized reference
//                         }
//                         resolve();
//                     }
//                 };

//                 // Keep listening for the CACHEDOBJECT_LOADED event
//                 window.addEventListener('message', messageHandler);
//             });

//             // // Post cachedobjects to parent for saving to cachedobjectslog
//             // window.parent.postMessage({ type: 'LOG_CACHEDOBJECTS', content: window.cachedobjects }, '*');


//             //   // Execute user.js only after CACHEDOBJECT_LOADED is received
//             // console.log('Executing user.js');
//             try {
//                 // (0, eval)(event.data.usercode);
//                 const asyncUserFunction = new Function(`
//                                           return (async () => {
//                                             ${event.data.usercode}
//                                           })();
//                                         `);

//                 await asyncUserFunction();
//             } catch (e) {
//                 console.error('Error executing usercode.js:', e);
//             }

//             // console.log('sending cachedobjects to window', window.cachedobjects.dog1.constructor.name)

//             // Replace promises with the string 'promise' before saving
//             //const cleanedCachedObjects = replacePromisesInObject(window.cachedobjects);

//             //console.log('sending cachedobjects to window 2', cleanedCachedObjects.dog1.constructor.name)

//             // Add a classinfo property to each object for serialization
//             function addClassInfo(obj) {
//                 if (obj === null || typeof obj !== 'object') return obj;

//                 // Clone the object and add the classinfo property
//                 const objectWithClassInfo = {
//                     ...obj,
//                     classinfo: obj.constructor.name
//                 };

//                 // Recursively process object properties
//                 for (const key in objectWithClassInfo) {
//                     if (objectWithClassInfo.hasOwnProperty(key) && typeof objectWithClassInfo[key] === 'object') {
//                         objectWithClassInfo[key] = addClassInfo(objectWithClassInfo[key]);
//                     }
//                 }

//                 return objectWithClassInfo;
//             }


//             // Serialize cachedobjects with class info before sending to the parent
//             const cachedObjectsWithClassInfo = addClassInfo(window.cachedobjects);

//             console.log('check cachedObjectsWithClassInfo', cachedObjectsWithClassInfo)

//             // Send serialized cached objects back to the parent window
//             window.parent.postMessage({
//                 type: 'SAVE_CACHEDOBJECTS',
//                 content: cachedObjectsWithClassInfo
//             }, '*');
//         })();
//     }
// })
