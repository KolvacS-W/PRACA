var apiKey = 'xxx'

const ag = new AnthropicGen(apiKey);
// await ag.loadKey();

var simple = CSPYCompiler.compile(SimpleHouse,"template");

var inst1 = new simple("red","square");
console.log(await inst1.getSVG());
console.log('inst1:', inst1)

var inst2 = inst1.update("brown","triangle")
console.log(await inst2.getSVG());
console.log('inst2:', inst2)