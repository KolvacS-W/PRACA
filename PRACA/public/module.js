// import the CSPY and Prompt and Input classes
import { CSPY, Prompt, Input, CSPYCompiler, AnthropicGen} from "./cspy/CSPY.js";

export function updateAPIKey() {
    // read api key from HTML dom object api-key
    try {
        var apiKey = document.getElementById("api-key").value;
        AnthropicGen.setApiKey(apiKey);
    } catch (err) {
        // not in browser
    }
}

export function printAPIKey() {
    console.log(AnthropicGen.apiKey);
}

export function getCompiledClass(txt,outtype="prompt") {
    try {
        console.log("module outtype:", outtype);
        console.log("foo:",txt);
        var result = eval(txt);
        return CSPYCompiler.compile(result,outtype);
    } catch (err) {
        alert(err);
    }
}