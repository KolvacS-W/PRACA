var apiKey = ''

await initialize_LLM();

console.log('llm and key', llm, api_key, window.llm, window.api_key)
setBackground('lightblue')

const ag = new AnthropicGen(apiKey);
// await ag.loadKey();

var simple = CSPYCompiler.compile(SimpleHouse,"prompt");

console.log('A')
var inst1 = new simple("red","square");
console.log('B')
//save svg to UI, with name
// Call getSVG, and pass a callback that calls saveSVG with the desired name
var svg1 = await inst1.getSVG((svgString) => saveSVG(svgString, 'expname'));


//save svg to UI, no name 
var inst2 = inst1.update("brown","triangle")
var svg2 =await inst2.getSVG((svgString) => saveSVG(svgString));
console.log('inst2:', inst2)

// //don't save svg to UI
// var inst3 = inst1.update("green","circle")
// var svg3 =await inst3.getSVG((svgString) => saveSVG(svgString));
// console.log('inst3:', inst3)

renderSvg(svg1, {x:50, y: 50}, 0.5)