

await initializeAndSetApiKey().then(({ llm, api_key }) => {
    console.log('set llm and key', llm, api_key)
});

setBackground('pink')

var simple = CSPYCompiler.compile(SimpleHouse,"prompt");
saveClass(simple)

console.log('check DB', ObjectDatabase.getJSONString())
var inst1 = new simple("red",30);

//save svg to UI, with name
// Call getSVG, and pass a callback that calls saveSVG with the desired name
var svg1 = await inst1.getSVG((svgString) => saveSVG(svgString));

saveInstance(inst1)
console.log('check DB', ObjectDatabase.getJSONString())

// //save svg to UI, no name 
// var inst2 = inst1.update("brown",60)
// var svg2 =await inst2.getSVG((svgString) => saveSVG(svgString));
// console.log('inst2:', inst2)

// //don't save svg to UI
// var inst3 = inst1.update("green","circle")
// var svg3 =await inst3.getSVG((svgString) => saveSVG(svgString));
// console.log('inst3:', inst3)

renderSvg(svg1, {x:50, y: 50}, 0.5)