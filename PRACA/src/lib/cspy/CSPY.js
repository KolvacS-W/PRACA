
// CSPY.js
import { AnthropicGen, OpenAIGen, GroqGen } from "./index.js";
import { Input, ComputedInput, RandomChoiceInput, LLMChoiceInput, ImageInput, StaticInput, ContextInput } from "./index.js";
import { Prompt, TemplatePrompt } from "./index.js";


// basic CSPY class that we will extend
export class CSPY {
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



export class SVGGen {

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
export class CSPYCompiler {


    static logEnable = true;

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

    // async annotateFunction(val) {
    //     // Implement the function for annotations as needed
    //     return `Annotated: ${val}`;
    // }

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

                for (const prop of props){
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
                        if (tProp.params.annotate) {
                            var annotatedContext = await this.annotateContext(val)
                            contextPromptString += `\n\nGenerate the svg starting with the existing svg: \n${val} and these supporting annotations matching code and visual contents: ${annotatedContext}\n`;
                        } else {
                            contextPromptString += `\n\nUse the following SVG as a starting point:\n ${val}\n`;
                        }
                    } else if (tProp instanceof ComputedInput) {

                        propPromptString += `The ${prop} should be ${val}\n`;
                    } else {
                        CSPYCompiler.log(prop, typeof tProp);
                    }
                };



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
                const genresp = await this.generateLLMResponse(prompt);
                return super.getSVG(callback);

            }

            async generateLLMResponse(prompt) {
                if (this.llm.llm === 'OpenAI') {
                    return OpenAIGen.getInstance().generate(prompt, (resp) => {
                        this.setSVG(resp);
                    }, this.llm);
                } else if (this.llm.llm === "Groq") {
                    return GroqGen.getInstance().generate(prompt, (resp) => {
                        this.setSVG(resp);
                    }, this.llm);
                } else {
                    return AnthropicGen.getInstance().generate(prompt, (resp) => {
                        this.setSVG(resp);
                    }, this.llm);
                }
            }
        
            // async renderTextToImage(textContent) {
            //     return new Promise((resolve, reject) => {
            //         // Create a canvas element
            //         const canvas = document.createElement('canvas');
            //         const width = 400;
            //         const height = 400;
            //         canvas.width = width;
            //         canvas.height = height;
            
            //         const context = canvas.getContext('2d');
            
            //         // Set background color (optional)
            //         context.fillStyle = '#FFFFFF';
            //         context.fillRect(0, 0, width, height);
            
            //         // Set text properties
            //         context.fillStyle = '#000000';
            //         context.font = '20px Arial';
            //         context.textBaseline = 'top';
            
            //         // Split the text into lines to fit the canvas
            //         const lines = this.wrapText(context, textContent, width - 40);
            
            //         // Draw the text
            //         let yPosition = 20;
            //         for (const line of lines) {
            //             context.fillText(line, 20, yPosition);
            //             yPosition += 30; // Line height
            //         }
            
            //         // Convert the canvas to a data URL
            //         const imageDataURL = canvas.toDataURL('image/png');

            //         // Save the image by triggering a download
            //         const link = document.createElement('a');
            //         link.href = imageDataURL;
            //         link.download = 'colored svg';
            //         document.body.appendChild(link);
            //         link.click();
            //         document.body.removeChild(link);
            
            //         resolve(imageDataURL);
            //     });
            // }
            
            // Helper function to wrap text

            async renderTextToImage(svgContent, filename = 'annotated_image.png') {
                return new Promise((resolve, reject) => {
                    try {
                        // Create a Blob from the SVG content
                        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                        const DOMURL = window.URL || window.webkitURL || window;
                        const svgUrl = DOMURL.createObjectURL(svgBlob);
            
                        const img = new Image();
                        img.onload = function () {
                            // Prepare the canvas for rendering
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const context = canvas.getContext('2d');
            
                            // Draw the SVG image onto the canvas
                            context.drawImage(img, 0, 0);
            
                            // Free up memory by revoking the object URL
                            DOMURL.revokeObjectURL(svgUrl);
            
                            // Convert the canvas to a data URL for the image
                            const imageDataURL = canvas.toDataURL('image/png');
            
                            // Save the image by triggering a download
                            const link = document.createElement('a');
                            link.href = imageDataURL;
                            link.download = filename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
            
                            // Resolve with the image data URL
                            resolve(imageDataURL);
                        };
            
                        img.onerror = function (e) {
                            // Provide detailed error information
                            console.error('Error loading SVG image:', e);
                            console.error('SVG content:', svgContent);
                            reject(new Error('Failed to load SVG image. Check SVG syntax and content.'));
                        };
            
                        // Set the source of the image to the SVG Blob URL
                        img.src = svgUrl;
                    } catch (error) {
                        console.error('Error in renderTextToImage function:', error);
                        reject(error);
                    }
                });
            }
            
            
            
            
            wrapText(context, text, maxWidth) {
                const words = text.split(' ');
                let lines = [];
                let currentLine = '';
            
                for (const word of words) {
                    const testLine = currentLine + word + ' ';
                    const metrics = context.measureText(testLine);
                    const testWidth = metrics.width;
            
                    if (testWidth > maxWidth && currentLine !== '') {
                        lines.push(currentLine.trim());
                        currentLine = word + ' ';
                    } else {
                        currentLine = testLine;
                    }
                }
                if (currentLine) {
                    lines.push(currentLine.trim());
                }
                return lines;
            }
            
            

            async annotateContext(val) {
                let llmResponse1 = '';

                // First, pass 'val' as a prompt to the LLM
                const prompt1 = `Modify the following svg code, make each group of different elements have distinct color. Do not use color code, but use text ("green", "blue") to add colors. Try to use completely distinct colors instead of similar colors. Make sure the color names you use are simple and are all formal html color names. Color the following svg code: \n\n${val}\n\nMake sure do not include anything other than the modified svg code in your response.`;

                if (this.llm.llm === 'OpenAI') {
                    // Generate annotations using OpenAI
                    llmResponse1 = await new Promise((resolve, reject) => {
                        OpenAIGen.getInstance().generate(prompt1, (resp) => {
                            resolve(resp);
                        }, this.llm);
                    });

                    // Render the annotations as an image and save it locally
                    const imageFilename = 'annotated_image.png';
                    await this.renderTextToImage(llmResponse1, imageFilename);

                    // Create another prompt with the image as input
                    const prompt2 = 'Return the :';

                    let llmResponse2 = '';
                    // Process the image with OpenAI
                    llmResponse2 = await new Promise((resolve, reject) => {
                        OpenAIGen.getInstance().processImage(prompt2, imageFilename, (resp) => {
                            resolve(resp);
                        }, this.llm);
                    });

                    // Return the final result
                    return llmResponse2;

                } else if (this.llm.llm === 'Anthropic') {
                    CSPYCompiler.log('llm: Anthropic')
                    // Generate annotations using Anthropic
                    llmResponse1 = await new Promise((resolve, reject) => {
                        AnthropicGen.getInstance().generate(prompt1, (resp) => {
                            console.log('llmResponse1', resp)
                            resolve(resp);
                        }, this.llm);
                    });
                    // Render the annotations as an image and get the data URL
                    const imageDataURL = await this.renderTextToImage(llmResponse1);

                    // Create another prompt with the image as input
                    const prompt2 = 'Look at the given svg image, tell me in detail: what color represent what part of the object? example response: lightgreen represent eyes, darkgreen represent nose, ..... Only include the colors and the represented contents in the response.';

                    let llmResponse2 = '';
                    // Process the image with Anthropic
                    llmResponse2 = await new Promise((resolve, reject) => {
                        AnthropicGen.getInstance().processImageDataURL(prompt2, imageDataURL, (resp) => {
                            resolve(resp);
                        }, this.llm);
                    });
                    console.log(llmResponse2)

                    // Create another prompt with the image as input
                    const prompt3 = 'Given a svg code with different colors for different elements: '+llmResponse1+' , and the information telling you the specific colors for each visual content: '+llmResponse2 + ' , return the specific svg element code for each visual content. Remove all the color attributes of element code in your response. Example response: eyes: element code.....; ears: element code.....';
                    ;

                    let llmResponse3 = '';
                    // Process the image with Anthropic
                    llmResponse3 = await new Promise((resolve, reject) => {
                        AnthropicGen.getInstance().generate(prompt3, (resp) => {
                            console.log('llmResponse3', resp)
                            resolve(resp);
                        }, this.llm);
                    });

                    // Return the final result
                    return llmResponse3;
                } else {
                    throw new Error(`Unsupported LLM: ${this.llm.llm}`);
                }
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

export class ObjectDatabase {

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