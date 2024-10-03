var apiKey = ''

const ag = new AnthropicGen(apiKey);
// await ag.loadKey();

var simple = CSPYCompiler.compile(SimpleHouse,"template");

console.log('A')
var inst1 = new simple("red","square");
console.log('B')
//save svg to UI, with name
// Call getSVG, and pass a callback that calls saveSVG with the desired name
await inst1.getSVG((svgString) => saveSVG(svgString, 'expname'));


//save svg to UI, no name 
var inst2 = inst1.update("brown","triangle")
await inst2.getSVG((svgString) => saveSVG(svgString));
console.log('inst2:', inst2)

//don't save svg to UI
var inst3 = inst1.update("green","circle")
await inst3.getSVG();
console.log('inst3:', inst3)