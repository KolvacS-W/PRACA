console.log('in class code')
// Define a class extending CSPY with desired properties
class SimpleLayout extends CSPY {
    prompt = new Prompt("A simple rectangular layout divided into random-shape sections");
    section_count = new StaticInput("number of sections", 4, "The number of sections to divide the layout into", "int");
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
