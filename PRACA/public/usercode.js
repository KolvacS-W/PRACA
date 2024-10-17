

await initializeAndSetApiKey().then(({ llm, api_key }) => {
    console.log('set llm and key', llm, api_key)
});

setBackground('white')


// Compile the class using the layoutcompiler
var layoutClass = CSPYCompiler.compile(SimpleLayout, "layoutcompiler", llm);

// Create an instance with specific parameters
var layoutInstance = new layoutClass(5); // section_count = 5

// Get the layout boxes
console.log("******************* COMPILING *******************");
var boxes = await layoutInstance.getlayoutboxes();
console.log(boxes);


// function getRandomObjectFromArray(arr) {
//     if (arr.length === 0) {
//         return null; // Return null if the array is empty
//     }
//     const randomIndex = Math.floor(Math.random() * arr.length);
//     return arr[randomIndex];
// }


var fill = CSPYCompiler.compile(FillBlock,"prompt",llm);
// var wave = CSPYCompiler.compile(WaveBlock,"prompt",llm);
// var pattern = CSPYCompiler.compile(PatternBlock,"prompt",llm);

var inst1 = new fill();
//save svg to UI, with name
// Call getSVG, and pass a callback that calls saveSVG with the desired name
var svg1 = await inst1.getSVG((svgString) => saveSVG(svgString));

renderSingleSvgwithLayout(boxes, svg1)

// var inst2 = new wave();
// //save svg to UI, with name
// // // Call getSVG, and pass a callback that calls saveSVG with the desired name
// // var svg2 = await inst2.getSVG((svgString) => saveSVG(svgString));

// var inst3 = new pattern();
// //save svg to UI, with name
// // Call getSVG, and pass a callback that calls saveSVG with the desired name
// // var svg3 = await inst3.getSVG((svgString) => saveSVG(svgString));

// var elementarray = []
// for (var i = 1; i<3; i++){
//     var instfill = inst1.update();
//     console.log(instfill)
//     //save svg to UI, with name
//     // Call getSVG, and pass a callback that calls saveSVG with the desired name
//     var svgfill = await instfill.getSVG();;
//     //save svg to UI, with name
//     // Call getSVG, and pass a callback that calls saveSVG with the desired name
//     var instwave = inst2.update();
//     //save svg to UI, with name
//     // Call getSVG, and pass a callback that calls saveSVG with the desired name
//     var svgwave = await instwave.getSVG();;
//     //save svg to UI, with name
//     // Call getSVG, and pass a callback that calls saveSVG with the desired name
//     var instpattern = inst3.update();
//     //save svg to UI, with name
//     // Call getSVG, and pass a callback that calls saveSVG with the desired name
//     var svgpattern = await instpattern.getSVG();

//     elementarray.push(svgfill, svgwave, svgpattern)
// }

// for (var j = 1; j< 10; j++){

//     for (var k = 1; k<10; k++){
//         var svg = getRandomObjectFromArray(elementarray)
//         renderSvg(svg, {x:5*j, y:10+10*k}, 0.05*k)
//     }
// }
