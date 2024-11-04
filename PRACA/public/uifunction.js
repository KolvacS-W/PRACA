//for intitial upload, where cspy is not loaded yet
// Function to dynamically load cspy.js
function loadCspyScript(callback) {
    // Check if the script is already loaded
    if (!document.querySelector(`script[src="/cspy.js"]`)) {
      const script = document.createElement('script');
      script.src = '/cspy.js';
      script.type = 'text/javascript';
      script.onload = callback; // Call the callback function once the script is loaded
      document.head.appendChild(script);
    } else {
      // If the script is already loaded, just call the callback
      callback();
    }
  }

//functions to set llm and apikey
async function initialize_LLM() {
    // Send message to parent window to request the LLM key
    window.parent.postMessage({
        type: 'GET_LLM_KEY'
    }, '*');

    // Wait for the response and return the received data
    const result = await new Promise((resolve) => {
        const messageHandler = (event) => {
            if (event.data && event.data.type === 'RETURN_LLM_KEY') {
                console.log('Received RETURN_LLM_KEY:', event.data.api_key, event.data.llm);
                // Remove the event listener once the data is received
                window.removeEventListener('message', messageHandler);
                // Resolve the promise with an object containing both values
                resolve({
                    llm: event.data.llm,
                    api_key: event.data.api_key
                });
            }
        };
        // Add the event listener to wait for the response
        window.addEventListener('message', messageHandler);
    });

    // Return the result (an object containing llm and api_key)
    return result;
}

let llm, api_key; // Declare variables in a wider scope

async function initializeAndSetApiKey() {

    // Call the initialize_LLM function and handle the returned values
    await initialize_LLM().then((result) => {
        llm = result.llm;
        api_key = result.api_key;

        // Set the API key based on the LLM value
        switch (llm) {
            case 'Anthropic':
                AnthropicGen.setApiKey(api_key);
                break;
            case 'OpenAI':
                OpenAIGen.setApiKey(api_key);
                break;
            case 'Groq':
                GroqGen.setApiKey(api_key);
                break;
            default:
                console.error(`Unknown LLM: ${llm}`);
        }
    });

    // Optionally return the values if needed elsewhere
    return { llm, api_key };
}

window.initializeAndSetApiKey = initializeAndSetApiKey;

document.addEventListener('click', function(event) {
    const rect = document.body.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    window.parent.postMessage({ type: 'CLICK_COORDINATES', x: x, y: y }, '*');
});

window.newobjID = 1;

window.currentreuseableSVGElementList = '${JSON.stringify(currentreuseableSVGElementList)}';
// Define create_canvas and make it globally accessible


if (!window.whole_canvas) {
    class whole_canvas {
        constructor(canvas_color) {
            this.canvasContainer = this.create_canvas(canvas_color);

            this.reuseablecodelist = [];;

            // Initialize backendhtmlString with the canvas container
            this.backendhtmlString = `
                                  <!DOCTYPE html>
                                  <html lang="en">
                                  <head>
                                      <meta charset="UTF-8">
                                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                      <title>Canvas and SVG</title>
                                      <style>
                                          html, body {
                                              margin: 0;
                                              padding: 0;
                                              width: 100%;
                                              height: 100%;
                                              display: flex;
                                              justify-content: center;
                                              align-items: center;
                                              overflow: hidden;
                                          }
                                          #canvasContainer {
                                              position: relative;
                                              width: 500px;
                                              height: 500px;
                                              background-color: ${canvas_color};
                                          }
                                      </style>
                                  </head>
                                  <body>
                                      <div id="canvasContainer"></div>
                                  </body>
                                  </html>`;
            console.log('Canvas created and backendhtmlString initialized');

            // Initialize the queue as a resolved Promise to maintain order
            this.drawQueue = Promise.resolve();
        }
        create_canvas(canvas_color) {
            console.log('document', document);
            const canvasContainer = document.getElementById('canvasContainer');
            
            // Clear all contents of canvasContainer
            while (canvasContainer.firstChild) {
                canvasContainer.removeChild(canvasContainer.firstChild);
            }
            
            // Set the background color of the canvasContainer
            canvasContainer.style.backgroundColor = canvas_color;
            
            console.log('create canvas', document);
            return canvasContainer;
        }
        
        // Method to get the full HTML including the canvas contents
        get_full_html() {
            // Clone the canvasContainer element to avoid modifying the actual DOM
            const clonedCanvasContainer = this.canvasContainer.cloneNode(true);
    
            // Serialize the cloned canvasContainer's content
            const serializer = new XMLSerializer();
            const canvasContent = serializer.serializeToString(clonedCanvasContainer);
    
            // Insert the canvas content into the backend HTML string
            const finalHtml = this.backendhtmlString.replace(
                '<div id="canvasContainer"></div>',
                canvasContent
            );
    
            return finalHtml;
        }
    }
    window.whole_canvas = whole_canvas;
}

function setBackground(color) {
  window.canvas = new whole_canvas(color)
}

//render single svg with a given layout (array of boxes)
function renderSingleSvgwithLayout(coordinatesArray, svgstring) {
    coordinatesArray.forEach((coordObj) => {
        const tl = coordObj.topLeft;
        const tr = coordObj.topRight;
        const bl = coordObj.bottomLeft;
        const br = coordObj.bottomRight;

        renderSvg(svgstring, null, null, tl, tr, bl, br);
    });
}


//render a single svg
function renderSvg(svgstring, coord = { x: 50, y: 50 }, scale = 1, tl = null, tr = null, bl = null, br = null) {
  placeSvg(svgstring, window.canvas, coord, scale, tl, tr, bl, br)
}

const sanitize_removeattributes = (svgString) => {
    // Parse the SVG string into a DOM object
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');

    if (svgElement) {
      // Check if the SVG element has width and height attributes but no viewBox
      const hasViewBox = svgElement.hasAttribute('viewBox');
      const widthAttr = svgElement.getAttribute('width');
      const heightAttr = svgElement.getAttribute('height');

      if (!hasViewBox && widthAttr && heightAttr) {
        // Set viewBox using the width and height attributes
        const width = parseFloat(widthAttr);
        const height = parseFloat(heightAttr);
        svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }

      // Remove the width and height attributes from the SVG element
      svgElement.removeAttribute('width');
      svgElement.removeAttribute('height');

      // Return the sanitized SVG string
      return new XMLSerializer().serializeToString(svgElement);
    }

    return svgString.trim(); // In case it's not valid SVG, return the original string
  };

function placeSvg(svgstring, canvas, coord = {
    x: 50,
    y: 50
}, scale = 1, tl = null, tr = null, bl = null, br = null) {
    const content = sanitize_removeattributes(svgstring);

    console.log('before:', svgstring)
    console.log('after:', content)

    // Create a DOMParser to parse the SVG content
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(content, 'image/svg+xml');

    // Extract and remove any <script> tag inside the SVG
    const scriptElements = svgDoc.getElementsByTagName('script');
    let scriptContent = '';
    if (scriptElements.length > 0) {
        scriptContent = scriptElements[0].textContent; // Extract script content
        scriptElements[0].parentNode.removeChild(scriptElements[0]); // Remove the script from the SVG
    }

    // Serialize the updated SVG without <script> and add to the canvas
    const serializer = new XMLSerializer();
    const svgElementStr = serializer.serializeToString(svgDoc.documentElement);
    // console.log('debugnow', content, svgElementStr)
    // Create an element from the parsed SVG
    const svgElement = createSVGElement(
        svgElementStr,
        coord,
        canvas.canvasContainer.offsetWidth,
        canvas.canvasContainer.offsetHeight,
        scale,
        tl,
        tr,
        bl,
        br
    );

    console.log(
        'svgelement placing',
        coord,
        canvas.canvasContainer.offsetWidth,
        canvas.canvasContainer.offsetHeight,
        scale,
        svgElement
    );

    // Append the SVG element to the canvas container
    // canvas.canvasContainer.canvasSvg.appendChild(svgElement);

    canvas.canvasContainer.appendChild(svgElement);
    window.parent.postMessage({
        type: 'UPDATE_CANVASHTML',
        content: window.canvas.get_full_html()
    }, '*');
    // Execute the script content manually, if any
    if (scriptContent) {
        try {
            eval(scriptContent); // Use eval to execute the extracted script
        } catch (e) {
            console.error('Error executing SVG script:', e);
        }
    }
    
}


function createSVGElement(
    svgContent,
    coord = {
        x: 50,
        y: 50
    },
    canvasWidth,
    canvasHeight,
    scale = 1,
    tl = null,
    tr = null,
    bl = null,
    br = null
) {
    const svgWrapper = document.createElement('div');
    svgWrapper.innerHTML = svgContent.trim();
    const svgElement = svgWrapper.firstElementChild;

    // Get the original dimensions of the SVG
    const viewBox = svgElement.viewBox.baseVal;
    const originalWidth = viewBox.width;
    const originalHeight = viewBox.height;

    // Functions to convert percentage to pixels
    const percentToPixelX = (percent) => (canvasWidth * percent) / 100;
    const percentToPixelY = (percent) => (canvasHeight * percent) / 100;

    // Collect specified corners
    const srcPts = [];
    const dstPts = [];

    // Map corners to source and destination points
    if (tl) {
        srcPts.push([0, 0]); // top-left corner of SVG
        dstPts.push([percentToPixelX(tl.x), percentToPixelY(tl.y)]);
    }
    if (tr) {
        srcPts.push([originalWidth, 0]); // top-right corner of SVG
        dstPts.push([percentToPixelX(tr.x), percentToPixelY(tr.y)]);
    }
    if (bl) {
        srcPts.push([0, originalHeight]); // bottom-left corner of SVG
        dstPts.push([percentToPixelX(bl.x), percentToPixelY(bl.y)]);
    }
    if (br) {
        srcPts.push([originalWidth, originalHeight]); // bottom-right corner of SVG
        dstPts.push([percentToPixelX(br.x), percentToPixelY(br.y)]);
    }

    if (srcPts.length > 0) {
        // Attempt to satisfy scale along with the specified corners
        let matrix;
        let scaleApplied = true;

        if (srcPts.length === 1) {
            // One corner specified
            // Apply scale and position the SVG at the specified corner
            const [dstX, dstY] = dstPts[0];
            const scaledWidth = originalWidth * scale;
            const scaledHeight = originalHeight * scale;

            // Adjust position based on the specified corner
            let translateX = dstX;
            let translateY = dstY;

            if (tl) {
                // No adjustment needed
            } else if (tr) {
                translateX -= scaledWidth;
            } else if (bl) {
                translateY -= scaledHeight;
            } else if (br) {
                translateX -= scaledWidth;
                translateY -= scaledHeight;
            }

            svgElement.style.position = 'absolute';
            svgElement.style.left = `${translateX}px`;
            svgElement.style.top = `${translateY}px`;
            svgElement.style.width = `${scaledWidth}px`;
            svgElement.style.height = `${scaledHeight}px`;
            svgElement.style.transform = ''; // No additional transform needed
        } else if (srcPts.length >= 2) {
            // Two or more corners specified
            // Calculate the transformation matrix including scale

            // First, compute the scaling factors implied by the specified corners
            // and compare them with the provided scale

            // Compute distances in source and destination
            const srcDistances = [];
            const dstDistances = [];

            for (let i = 0; i < srcPts.length - 1; i++) {
                for (let j = i + 1; j < srcPts.length; j++) {
                    const srcDx = srcPts[j][0] - srcPts[i][0];
                    const srcDy = srcPts[j][1] - srcPts[i][1];
                    const srcDistance = Math.hypot(srcDx, srcDy);
                    srcDistances.push(srcDistance);

                    const dstDx = dstPts[j][0] - dstPts[i][0];
                    const dstDy = dstPts[j][1] - dstPts[i][1];
                    const dstDistance = Math.hypot(dstDx, dstDy);
                    dstDistances.push(dstDistance);
                }
            }

            // Compute average scaling factor from specified corners
            let impliedScale = 0;
            let scaleCount = 0;
            for (let i = 0; i < srcDistances.length; i++) {
                if (srcDistances[i] !== 0) {
                    impliedScale += dstDistances[i] / srcDistances[i];
                    scaleCount++;
                }
            }
            if (scaleCount > 0) {
                impliedScale /= scaleCount;
            } else {
                impliedScale = scale;
            }

            // Compare implied scale with provided scale
            if (Math.abs(impliedScale - scale) > 0.01) {
                // Scale is in conflict, discard provided scale
                scaleApplied = false;
                scale = impliedScale;
            }

            // Recalculate destination points considering the scale
            const scaledSrcPts = srcPts.map(([x, y]) => [x * scale, y * scale]);

            if (srcPts.length === 2) {
                // Compute similarity transformation
                matrix = calculateSimilarityTransform(scaledSrcPts, dstPts);
            } else if (srcPts.length === 3) {
                // Compute affine transformation
                matrix = calculateAffineTransform(scaledSrcPts, dstPts);
            } else if (srcPts.length === 4) {
                // Compute projective transformation
                matrix = calculateProjectiveTransform(scaledSrcPts, dstPts);
            }

            svgElement.style.position = 'absolute';
            svgElement.style.left = '0px';
            svgElement.style.top = '0px';
            svgElement.style.transformOrigin = '0 0';
            svgElement.style.transform = `matrix3d(${matrix.join(',')})`;
            svgElement.style.width = `${originalWidth * scale}px`;
            svgElement.style.height = `${originalHeight * scale}px`;
        }
    } else {
        // No corners specified, use coord and scale
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;

        let leftPixel, topPixel, transform;

        if (coord) {
            leftPixel = percentToPixelX(coord.x);
            topPixel = percentToPixelY(coord.y);
            transform = 'translate(-50%, -50%)';
        } else {
            leftPixel = canvasWidth / 2;
            topPixel = canvasHeight / 2;
            transform = 'translate(-50%, -50%)';
        }

        svgElement.style.position = 'absolute';
        svgElement.style.left = `${leftPixel}px`;
        svgElement.style.top = `${topPixel}px`;
        svgElement.style.width = `${scaledWidth}px`;
        svgElement.style.height = `${scaledHeight}px`;
        svgElement.style.transform = transform;
    }

    return svgElement;
}

// Helper functions remain the same but with slight modifications

// Helper function to calculate the projective transformation matrix
function calculateProjectiveTransform(srcPts, dstPts) {
    // Calculates a 4x4 matrix for a projective transformation from srcPts to dstPts
    // srcPts and dstPts are arrays of [x, y] coordinates

    // Set up the linear system: Ah = b
    const A = [];
    const b = [];

    for (let i = 0; i < 4; i++) {
        const [x, y] = srcPts[i];
        const [X, Y] = dstPts[i];

        A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
        A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
        b.push(X);
        b.push(Y);
    }

    // Solve for h using least squares (A * h ≈ b)
    const h = solveLinearSystem(A, b);

    // Construct the 3x3 homography matrix
    const H = [
        h[0], h[1], h[2],
        h[3], h[4], h[5],
        h[6], h[7], 1
    ];

    // Convert the 3x3 homography matrix to a 4x4 matrix3d for CSS
    const matrix3d = [
        H[0], H[3], 0, H[6],
        H[1], H[4], 0, H[7],
        0, 0, 1, 0,
        H[2], H[5], 0, 1
    ];

    return matrix3d;
}
// Helper function to solve a linear system (A * x = b)
function solveLinearSystem(A, b) {
    // Use the Gaussian elimination method to solve the system
    const matrixSize = A.length;
    const augmentedMatrix = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < matrixSize; i++) {
        // Find the pivot row
        let maxRow = i;
        for (let k = i + 1; k < matrixSize; k++) {
            if (Math.abs(augmentedMatrix[k][i]) > Math.abs(augmentedMatrix[maxRow][i])) {
                maxRow = k;
            }
        }

        // Swap the pivot row with the current row
        [augmentedMatrix[i], augmentedMatrix[maxRow]] = [augmentedMatrix[maxRow], augmentedMatrix[i]];

        // Eliminate entries below the pivot
        for (let k = i + 1; k < matrixSize; k++) {
            const factor = augmentedMatrix[k][i] / augmentedMatrix[i][i];
            for (let j = i; j <= matrixSize; j++) {
                augmentedMatrix[k][j] -= factor * augmentedMatrix[i][j];
            }
        }
    }

    // Back substitution
    const x = new Array(matrixSize).fill(0);
    for (let i = matrixSize - 1; i >= 0; i--) {
        let sum = augmentedMatrix[i][matrixSize];
        for (let j = i + 1; j < matrixSize; j++) {
            sum -= augmentedMatrix[i][j] * x[j];
        }
        x[i] = sum / augmentedMatrix[i][i];
    }

    return x;
}
function calculateSimilarityTransform(srcPts, dstPts, scale) {
    // srcPts and dstPts are arrays of 2D points: [[x1, y1], [x2, y2]]

    const [x0, y0] = srcPts[0];
    const [x1, y1] = srcPts[1];
    const [X0, Y0] = dstPts[0];
    const [X1, Y1] = dstPts[1];

    // Source vector
    const dx1 = x1 - x0;
    const dy1 = y1 - y0;
    const srcLength = Math.hypot(dx1, dy1);

    // Destination vector
    const dx2 = X1 - X0;
    const dy2 = Y1 - Y0;
    const dstLength = Math.hypot(dx2, dy2);

    if (srcLength === 0 || dstLength === 0) {
        console.error('Cannot compute similarity transform with zero-length vectors.');
        return null;
    }

    // Compute scaling factor
    const impliedScale = dstLength / srcLength;

    // Compare implied scale with provided scale
    const usedScale = Math.abs(impliedScale - scale) < 0.01 ? scale : impliedScale;

    // Recalculate source points considering the used scale
    const scaledX0 = x0 * usedScale;
    const scaledY0 = y0 * usedScale;
    const scaledX1 = x1 * usedScale;
    const scaledY1 = y1 * usedScale;

    // Compute rotation angle
    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);
    const angle = angle2 - angle1;

    // Compute rotation matrix components
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Compute translation
    const tx = X0 - (scaledX0 * cosA - scaledY0 * sinA);
    const ty = Y0 - (scaledX0 * sinA + scaledY0 * cosA);

    // Construct the transformation matrix
    const matrix = [
        cosA * usedScale, sinA * usedScale, 0, 0,
        -sinA * usedScale, cosA * usedScale, 0, 0,
        0, 0, 1, 0,
        tx, ty, 0, 1
    ];

    return matrix;
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

function saveInstance(inst) {
    if (inst) {
      ObjectDatabase.addInstance(inst);
    }
    // modify the download button to show the number of classes and instances
    document.getElementById("download-db").innerHTML = "Download DB (" + ObjectDatabase.classNames.length + " classes, " + ObjectDatabase.instanceNames.length + " instances)";
  }

  function saveClass(compClass) {
    if (compClass) {
      ObjectDatabase.addClass(compClass);
    }
    // modify the download button to show the number of classes and instances
    document.getElementById("download-db").innerHTML = "Download DB (" + ObjectDatabase.classNames.length + " classes, " + ObjectDatabase.instanceNames.length + " instances)";
  }

  function downloadDB() {
    console.log('called download DB');

    // Get the JSON string from ObjectDatabase
    const text = ObjectDatabase.getJSONString();
    const name = "cspy-db.json";

    // Ensure the text is valid and not empty
    if (text) {
        try {
            // Create a Blob with the JSON string
            const blob = new Blob([text], { type: 'application/json' });

            // Create a link element
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = name;

            // Append the link to the body and click it to initiate the download
            document.body.appendChild(link);
            console.log('document.body', document.body)
            link.click();

            // Remove the link from the document
            document.body.removeChild(link);
            console.log('File downloaded successfully.');
        } catch (error) {
            console.error('Error during file download:', error);
        }
    } else {
        console.error('Failed to generate JSON string for download.');
    }
}

function uploadDB() {
    loadCspyScript(() => {
        console.log('cspy.js loaded successfully.');
        // Create a hidden file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';

        // Add it to the document
        document.body.appendChild(fileInput);

        // Handle file selection
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                try {
                    const text = await file.text();
                    console.log('ObjectDatabase', ObjectDatabase)
                    ObjectDatabase.parseJSONString(text);
                    var loadList = "";
                    var objects = ObjectDatabase.getObjects();
                    // loop over key/value pairs
                    for (var key in objects) {
                    loadList += "//" + key + "\n";
                    window[key] = objects[key];
                    }
                    console.log('loadList', loadList)
                } catch (error) {
                    console.error("Error loading database:", error);
                }
            }
            // Clean up
            document.body.removeChild(fileInput);
        });

        // Trigger file selection dialog
        fileInput.click();
    })

}


