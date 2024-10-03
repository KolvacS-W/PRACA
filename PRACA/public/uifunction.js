document.addEventListener('click', function(event) {
    const rect = document.body.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    window.parent.postMessage({ type: 'CLICK_COORDINATES', x: x, y: y }, '*');
});

window.newobjID = 1;

window.currentreuseableSVGElementList = '${JSON.stringify(currentreuseableSVGElementList)}';
// Define create_canvas and make it globally accessible
function create_canvas(canvas_color) {
    const canvasContainer = document.getElementById('canvasContainer');
    // Clear all contents of canvasContainer
    while (canvasContainer.firstChild) {
        canvasContainer.removeChild(canvasContainer.firstChild);
    }
    canvasContainer.style.backgroundColor = canvas_color;
    return canvasContainer;
}
function setBackground(color) {
  window.canvas = new whole_canvas(color)
}
function renderObj(object, coord = { x: 50, y: 50 }, scale = 1, tl = null, tr = null, bl = null, br = null) {
  object.placeObj(window.canvas, coord, scale, tl, tr, bl, br)
}

async function saveSVG(svgString, name = '') {
    // Logic to name instance and store its svg code
    if (!name) {
        name = 'newobj' + window.newobjID.toString(); // Default to "newobj" + newobjID
        window.newobjID = window.newobjID + 1; // Increment the newobjID for the next object
    }

    const codename = name;

    // Send the message to update the reusable element list
    window.parent.postMessage({
        type: 'UPDATE_REUSEABLE',
        codename: codename,
        codetext: svgString // Passing the svgString here
    }, '*');
    
    console.log('Sent UPDATE_REUSEABLE message with codename:', codename);

    // Wait for the confirmation after sending the message
    await new Promise((resolve) => {
        const messageHandler = (event) => {
            if (event.data.type === 'UPDATE_REUSEABLE_CONFIRMED' && event.data.codename === codename) {
                window.currentreuseableSVGElementList = event.data.reuseableSVGElementList;
                console.log('Received UPDATE_REUSEABLE_CONFIRMED:', window.currentreuseableSVGElementList);
                window.removeEventListener('message', messageHandler);
                resolve(); // Resolve the promise to continue execution
            }
        };
        window.addEventListener('message', messageHandler);
    });
}
