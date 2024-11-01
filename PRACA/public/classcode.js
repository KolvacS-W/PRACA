console.log('in class code')
// Define a class extending CSPY with desired properties
class SimpleLayout extends CSPY {
    prompt = new Prompt("boxes compose random size triangles");
    num_boxes = new Input("number of boxes on each triangle, 5-10")
    
}
class FillBlock extends CSPY {
    prompt = new Prompt("A black stroke square with a shape inside");
    shape_fill = new RandomChoiceInput("the black_colored shape inside the square", ['circle', 'triangle', 'diamond', 'star']);
}

// class WaveBlock extends CSPY {
//     prompt = new Prompt("A black stroke square with a black stroke wave inside");
//     type_wave = new RandomChoiceInput("the type of the wave, can be random shape", ['sin wave', 'cos wave']);
// }

// class PatternBlock extends CSPY {
//     prompt = new Prompt("A black stroke square with black stroke patterns inside");
//     patten = new RandomChoiceInput("the pattern in the square", ['grid', 'dots', 'lines']);
// }
