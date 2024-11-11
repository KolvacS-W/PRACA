
setBackground('pink')

var simple = CSPYCompiler.compile(SimpleHouse,"prompt");
saveClass(simple)

var inst1 = new simple();
inst1.color('red')
inst1.roof_height(50)
//save svg to UI, with name
// Call getSVG, and pass a callback that calls saveSVG with the desired name
var svg1 = await inst1.getSVG((svgString) => saveSVG(svgString));

saveInstance(inst1)


// // //save svg to UI, no name 
// var inst2 = inst1.makeVariant()
// inst2.color('green')
// inst2.roof_height(100)

// var svg2 =await inst2.getSVG((svgString) => saveSVG(svgString));
// console.log('inst2:', inst2)

// // //don't save svg to UI
// // var inst3 = inst1.update("green","circle")
// // var svg3 =await inst3.getSVG((svgString) => saveSVG(svgString));
// // console.log('inst3:', inst3)

// renderSvg(svg1, {x:50, y: 50}, 0.5)