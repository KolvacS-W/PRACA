var savedsvg = "<svg width=\"400\" height=\"300\" viewBox=\"0 0 400 300\" xmlns=\"http://www.w3.org/2000/svg\">\n<rect x=\"50\" y=\"100\" width=\"300\" height=\"150\" fill=\"#CCCCCC\" />\n<rect x=\"40\" y=\"80\" width=\"320\" height=\"20\" fill=\"brown\" />\n<rect id=\"mybrick1\" x=\"300\" y=\"40\" width=\"30\" height=\"40\" fill=\"#888888\" />\n<rect id=\"mybrick2\" x=\"280\" y=\"140\" width=\"40\" height=\"60\" stroke=\"yellow\" fill=\"white\" />\n<rect x=\"80\" y=\"140\" width=\"40\" height=\"60\" stroke=\"yellow\" fill=\"white\" />\n<rect x=\"180\" y=\"140\" width=\"40\" height=\"60\" stroke=\"yellow\" fill=\"white\" />\n<rect x=\"170\" y=\"150\" width=\"60\" height=\"100\" fill=\"yellow\" />\n</svg>"

console.log('in class code')
class SimpleHouse extends CSPY {
    prompt = new Prompt("a modern farmhouse with numerous energy-efficient windows");
    roof_color = new StaticInput("roof color");
    window_number = new StaticInput("number of windows, from 2-8");
    mybrick_color = new StaticInput('color of mybrick')
    context = new ContextInput("starting context", savedsvg)
}

var apiKey = ''

setBackground('lightgreen')

const ag = new AnthropicGen(apiKey);
// await ag.loadKey();

var simple = CSPYCompiler.compile(SimpleHouse,"code");

console.log('A')
var inst1 = new simple("red",3, "green");
console.log('B')

//save svg to UI, no name
var svg1 = await inst1.getSVG((svgString) => saveSVG(svgString));

//save svg to UI, no name 
var inst2 = inst1.update("brown",5, "orange")
var svg2 =await inst2.getSVG((svgString) => saveSVG(svgString));
console.log('inst2:', inst2)

renderSvg(svg1, {x:50, y: 50}, 0.8)