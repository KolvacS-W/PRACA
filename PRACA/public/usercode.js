setBackground('lightblue')


var savedsvg1 = "<svg width=\"200\" height=\"200\" xmlns=\"http://www.w3.org/2000/svg\">\n  <!-- House body -->\n  <rect id=\"house_body\" x=\"50\" y=\"100\" width=\"100\" height=\"80\" fill=\"red\"/>\n  \n  <!-- Roof -->\n  <polygon id=\"roof\" points=\"50,100 100,50 150,100\" fill=\"brown\"/>\n  \n  <!-- Door -->\n  <rect id=\"door\" x=\"80\" y=\"140\" width=\"30\" height=\"40\" fill=\"saddlebrown\"/>\n  \n  <!-- Window -->\n  <rect id=\"window\" x=\"110\" y=\"120\" width=\"20\" height=\"20\" fill=\"lightblue\"/>\n  \n  <!-- Window frame -->\n  <line x1=\"120\" y1=\"120\" x2=\"120\" y2=\"140\" stroke=\"white\" stroke-width=\"2\"/>\n  <line x1=\"110\" y1=\"130\" x2=\"130\" y2=\"130\" stroke=\"white\" stroke-width=\"2\"/>\n</svg>"
var savedsvg2 = "<svg width=\"200\" height=\"200\" xmlns=\"http://www.w3.org/2000/svg\">\n  <!-- House body -->\n  <rect id=\"house_body\" x=\"50\" y=\"100\" width=\"100\" height=\"80\" fill=\"brown\"/>\n  \n  <!-- Roof -->\n  <polygon id=\"roof\" points=\"50,100 100,50 150,100\" fill=\"brown\"/>\n  \n  <!-- Door -->\n  <rect id=\"door\" x=\"80\" y=\"140\" width=\"30\" height=\"40\" fill=\"saddlebrown\"/>\n  \n  <!-- Window -->\n  <polygon id=\"window\" points=\"110,120 120,105 130,120\" fill=\"lightblue\"/>\n  \n  <!-- Window frame -->\n  <line x1=\"110\" y1=\"120\" x2=\"130\" y2=\"120\" stroke=\"white\" stroke-width=\"2\"/>\n  <line x1=\"120\" y1=\"105\" x2=\"120\" y2=\"120\" stroke=\"white\" stroke-width=\"2\"/>\n</svg>"
renderSvg(savedsvg1, {x:50, y: 50}, 0.5)

renderSvg(savedsvg2, {x:20, y: 20}, 0.5)

// await initializeAndSetApiKey().then(({ llm, api_key }) => {
//     console.log('set llm and key', llm, api_key)
// });

// setBackground('lightblue')


// var simple = CSPYCompiler.compile(SimpleHouse,"prompt",llm);

// console.log('A')
// var inst1 = new simple("red","square");
// console.log('B')
// //save svg to UI, with name
// // Call getSVG, and pass a callback that calls saveSVG with the desired name
// var svg1 = await inst1.getSVG((svgString) => saveSVG(svgString, 'expname'));


// //save svg to UI, no name 
// var inst2 = inst1.update("brown","triangle")
// var svg2 =await inst2.getSVG((svgString) => saveSVG(svgString));
// console.log('inst2:', inst2)

// // //don't save svg to UI
// // var inst3 = inst1.update("green","circle")
// // var svg3 =await inst3.getSVG((svgString) => saveSVG(svgString));
// // console.log('inst3:', inst3)

// renderSvg(svg1, {x:50, y: 50}, 0.5)