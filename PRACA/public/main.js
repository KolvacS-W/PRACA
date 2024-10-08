
// Function to dynamically load an external script
function loadScript(src, callback) {
    const existingScript = document.querySelector(`script[src="${src}"]`);
    
    if (!existingScript) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        document.head.appendChild(script);
    } else {
        callback(); // Script already loaded, just execute the callback
    }
}

// Event listener for messages
window.addEventListener('message', function(event) {
    if (event.data.type === 'EXECUTE_CLASSCODE') {
        window._classcode = event.data.classcode.js;
    }

    if (event.data.type === 'EXECUTE_USERCODE') {
        if (!window._classcode) {
            console.error('Classcode not loaded');
            return;
        }

        const combinedCode = `${window._classcode}\n${event.data.usercode}`;

        // Load external script and then execute the combined code
        loadScript('/cspy.js', function() {
            // Create a script element to execute the combined code
            const script = document.createElement('script');
            script.type = 'module';
            script.textContent = combinedCode;
            console.log('Script created and executed', script);
            document.body.appendChild(script);
        });
    }
});


// window.addEventListener('message', function(event) {
//     console.log('listening to execute calls??')
//     if (event.data.type === 'EXECUTE_CLASSCODE') {
//         // Execute classcode.js
//         console.log('Executing classcode.js', event.data.classcode);
//         try {
//             (0, eval)(event.data.classcode.js); // Executes in global scope
//         } catch (e) {
//             console.error('Error executing classcode.js:', e);
//         }
//     }
// })
// window.addEventListener('message', function(event) {
//     if (event.data.type === 'EXECUTE_USERCODE') {

//         console.log('running user.js')
//         window.parent.postMessage({
//             type: 'LOAD_CACHEDOBJECT'
//         }, '*');

//         function recoverClassFromClassInfo(data) {
//             if (data === null || typeof data !== 'object') return data;

//             // Handle arrays that were mistakenly serialized as objects with numbered keys
//             if (isSerializedArray(data)) {
//                 return Object.values(data);
//             }

//             // Handle arrays recursively
//             if (Array.isArray(data)) {
//                 return data.map(item => recoverClassFromClassInfo(item));
//             }

//             if (data.classinfo) {
//                 // Log to see the recovery of classinfo
//                 console.log('Recovering', data.classinfo);

//                 // Check the classinfo property and restore the corresponding class
//                 let recoveredInstance;
//                 switch (data.classinfo) {
//                     case 'Rule': {
//                         recoveredInstance = new Rule();
//                         Object.assign(recoveredInstance, data);
//                         break;
//                     }
//                     case 'GeneratedObject': {
//                         const {
//                             objname = '', svgcode = '', templatecode = '', modifyobj = '', piecenames = '', piecenamemodify = '', parameters = '', abstract_params, parametercontents = '', abstractparametercontents = '', basic_prompt = '', annotated_pieces = ''
//                         } = data;
//                         const templatecodeInstance = recoverClassFromClassInfo(templatecode); // Recover the template properly
//                         const piecenamesInstance = recoverClassFromClassInfo(piecenames); // Recover the rule as well
//                         const piecenamemodifyInstance = recoverClassFromClassInfo(piecenamemodify); // Recover the rule as well
//                         const parametersInstance = recoverClassFromClassInfo(parameters); // Recover the rule as well
//                         const abstractparametercontentsInstance = recoverClassFromClassInfo(abstractparametercontents); // Recover the rule as well
//                         const abstract_paramsInstance = recoverClassFromClassInfo(abstract_params); // Recover the rule as well
//                         const parametercontentsInstance = recoverClassFromClassInfo(parametercontents); // Recover the rule as well

//                         const basic_promptInstance = recoverClassFromClassInfo(basic_prompt); // Recover the rule as well
//                         const annotated_piecesInstance = recoverClassFromClassInfo(annotated_pieces);
//                         recoveredInstance = new GeneratedObject(objname, svgcode, templatecodeInstance, piecenamesInstance, piecenamemodifyInstance, parametersInstance, abstract_paramsInstance, parametercontentsInstance, abstractparametercontentsInstance, basic_promptInstance, annotated_piecesInstance);
//                         Object.assign(recoveredInstance, data); // Assign any additional properties
//                         break;
//                     }

//                     case 'whole_canvas': {
//                         const canvas = new whole_canvas(data.canvas_color || '#FFFFFF');
//                         Object.assign(canvas, data);
//                         recoveredInstance = canvas;
//                         break;
//                     }
//                     default:
//                         recoveredInstance = data; // If no matching class, return the data as-is
//                         break;
//                 }

//                 // Remove the classinfo field after the object is recovered
//                 delete recoveredInstance.classinfo;

//                 // Recursively recover subobjects
//                 for (const key in recoveredInstance) {
//                     if (recoveredInstance.hasOwnProperty(key) && typeof recoveredInstance[key] === 'object') {
//                         recoveredInstance[key] = recoverClassFromClassInfo(recoveredInstance[key]);
//                     }
//                 }

//                 return recoveredInstance;
//             }

//             // If no classinfo is found, continue recursively recovering properties
//             for (const key in data) {
//                 if (data.hasOwnProperty(key) && typeof data[key] === 'object') {
//                     data[key] = recoverClassFromClassInfo(data[key]);
//                 }
//             }

//             return data;
//         }

//         // Helper function to check if an object was serialized as an array
//         function isSerializedArray(obj) {
//             if (typeof obj !== 'object' || obj === null) return false;

//             // Check if all keys are sequential numbers starting from 0
//             const keys = Object.keys(obj);
//             return keys.every((key, index) => Number(key) === index);
//         }




//         // No timeout, keep waiting for CACHEDOBJECT_LOADED indefinitely before executing user.js
//         (async function() {
//             console.log('Waiting for CACHEDOBJECT_LOADED event...');

//             window.cachedobjects = {}; // Declare as a reference to be assigned

//             // Wait for the cachedobjectsRef to be provided by the parent (React app)
//             await new Promise((resolve) => {
//                 const messageHandler = (event) => {
//                     if (event.data.type === 'SYNC_PREVIOUS_OBJECTS_REF') {
//                         console.log('Received cachedobjectsRef from parent:', event.data.cachedobjects);
//                         if (event.data.cachedobjects) {
//                             window.cachedobjects = recoverClassFromClassInfo(event.data.cachedobjects); // Directly assign the deserialized reference
//                         }
//                         resolve();
//                     }
//                 };

//                 // Keep listening for the CACHEDOBJECT_LOADED event
//                 window.addEventListener('message', messageHandler);
//             });

//             // // Post cachedobjects to parent for saving to cachedobjectslog
//             // window.parent.postMessage({ type: 'LOG_CACHEDOBJECTS', content: window.cachedobjects }, '*');


//             //   // Execute user.js only after CACHEDOBJECT_LOADED is received
//             // console.log('Executing user.js');
//             try {
//                 // (0, eval)(event.data.usercode);
//                 const asyncUserFunction = new Function(`
//                                           return (async () => {
//                                             ${event.data.usercode}
//                                           })();
//                                         `);

//                 await asyncUserFunction();
//             } catch (e) {
//                 console.error('Error executing usercode.js:', e);
//             }

//             // console.log('sending cachedobjects to window', window.cachedobjects.dog1.constructor.name)

//             // Replace promises with the string 'promise' before saving
//             //const cleanedCachedObjects = replacePromisesInObject(window.cachedobjects);

//             //console.log('sending cachedobjects to window 2', cleanedCachedObjects.dog1.constructor.name)

//             // Add a classinfo property to each object for serialization
//             function addClassInfo(obj) {
//                 if (obj === null || typeof obj !== 'object') return obj;

//                 // Clone the object and add the classinfo property
//                 const objectWithClassInfo = {
//                     ...obj,
//                     classinfo: obj.constructor.name
//                 };

//                 // Recursively process object properties
//                 for (const key in objectWithClassInfo) {
//                     if (objectWithClassInfo.hasOwnProperty(key) && typeof objectWithClassInfo[key] === 'object') {
//                         objectWithClassInfo[key] = addClassInfo(objectWithClassInfo[key]);
//                     }
//                 }

//                 return objectWithClassInfo;
//             }


//             // Serialize cachedobjects with class info before sending to the parent
//             const cachedObjectsWithClassInfo = addClassInfo(window.cachedobjects);

//             console.log('check cachedObjectsWithClassInfo', cachedObjectsWithClassInfo)

//             // Send serialized cached objects back to the parent window
//             window.parent.postMessage({
//                 type: 'SAVE_CACHEDOBJECTS',
//                 content: cachedObjectsWithClassInfo
//             }, '*');
//         })();
//     }
// })