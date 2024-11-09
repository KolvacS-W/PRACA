var savedsvg = "<svg viewBox=\"0 0 200 200\">\n    <rect x=\"40\" y=\"80\" width=\"120\" height=\"90\" fill=\"red\" /> <!-- House body -->\n    <polygon points=\"40,80 100,50 160,80\" fill=\"red\" /> <!-- Roof -->\n    <rect x=\"55\" y=\"100\" width=\"25\" height=\"25\" fill=\"white\" stroke=\"black\" /> <!-- Window 1 -->\n    <rect x=\"120\" y=\"100\" width=\"25\" height=\"25\" fill=\"white\" stroke=\"black\" /> <!-- Window 2 -->\n    <rect x=\"85\" y=\"110\" width=\"30\" height=\"60\" fill=\"brown\" /> <!-- Door -->\n    <circle cx=\"90\" cy=\"140\" r=\"2\" fill=\"black\" /> <!-- Door knob -->\n    <rect x=\"55\" y=\"100\" width=\"25\" height=\"3\" fill=\"black\" /> <!-- Window frame 1 horizontal -->\n    <rect x=\"66\" y=\"100\" width=\"3\" height=\"25\" fill=\"black\" /> <!-- Window frame 1 vertical -->\n    <rect x=\"120\" y=\"100\" width=\"25\" height=\"3\" fill=\"black\" /> <!-- Window frame 2 horizontal -->\n    <rect x=\"131\" y=\"100\" width=\"3\" height=\"25\" fill=\"black\" /> <!-- Window frame 2 vertical -->\n</svg>"
console.log('in class code')

class SimpleHouse extends CSPY {
    prompt = new Prompt("A Simple House with fences and chimney");
    context = ContextInput.context(savedsvg).description('starting svg')
    color = StaticInput.description("house_color").default("blue")
    roof_height = StaticInput.description('roof_height, 10- 100')
}
// Define a class extending CSPY with desired properties
// class SimpleLayout extends CSPY {
//     prompt = new Prompt("boxes compose random size triangles");
//     num_boxes = new Input("number of boxes on each triangle, 5-10")
    
// }
// class FillBlock extends CSPY {
//     prompt = new Prompt("A black stroke square with a shape inside");
//     shape_fill = new RandomChoiceInput("the black_colored shape inside the square", ['circle', 'triangle', 'diamond', 'star']);
// }

// class WaveBlock extends CSPY {
//     prompt = new Prompt("A black stroke square with a black stroke wave inside");
//     type_wave = new RandomChoiceInput("the type of the wave, can be random shape", ['sin wave', 'cos wave']);
// }

// class PatternBlock extends CSPY {
//     prompt = new Prompt("A black stroke square with black stroke patterns inside");
//     patten = new RandomChoiceInput("the pattern in the square", ['grid', 'dots', 'lines']);
// }
