var apiKey = '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'
const ag = new AnthropicGen(apiKey);
// await ag.loadKey();

var simple = CSPYCompiler.compile(SimpleHouse,"template");
console.log(simple)
var inst1 = new simple("red","square");
//console.log(await inst1.getSVG());

var inst2 = inst1.update("brown","triangle")
console.log(await inst2.getSVG());