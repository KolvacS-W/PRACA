var apiKey = ''
const ag = new AnthropicGen(apiKey);
// await ag.loadKey();

var simple = CSPYCompiler.compile(SimpleHouse,"template");
console.log(simple)
var inst1 = new simple("red","square");
//console.log(await inst1.getSVG());

var inst2 = inst1.update("brown","triangle")
console.log(await inst2.getSVG());