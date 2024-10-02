console.log('in class code')
// create a house class that extends CSPY
window.House = class House extends CSPY {

    prompt = new Prompt("A House");
    roof_color = new Input("roof color");
    color = new Input("house color");
}

window.VictorianHouse = class VictorianHouse extends House {
    prompt = new Prompt("A Victorian House");
}


window.SimpleHouse = class SimpleHouse extends CSPY {
    prompt = new Prompt("A Simple House with a triangular roof");
    house_color = new Input("house color");
    window_shape = new Input("Shape of the window, can be any SVG shape");
}
