export class AnthropicGen {

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

export class OpenAIGen {

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

export class GroqGen {

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