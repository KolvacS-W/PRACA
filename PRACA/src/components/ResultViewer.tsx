import React, { useEffect, useRef, useState } from 'react';
import { Version} from '../types';
import '../App.css';

interface ResultViewerProps {
  usercode: {
    js: string;
  };
  classcode: {
    js: string;
  };
  api_key: string;
  llm: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  currentVersionId: string | null;
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  versions: Version[];
}


const ResultViewer: React.FC<ResultViewerProps> = ({ currentVersionId, setVersions, versions, iframeRef, api_key, llm}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // var currentreuseableSVGElementList = versions.find(version => version.id === currentVersionId)?.reuseableSVGElementList;
  //console.log('check svglist', currentreuseableSVGElementList)
  const [clickCoordinates, setClickCoordinates] = useState<{ x: number; y: number } | null>(null);
  const versionsRef = useRef(versions); // Create a ref for versions
  const [canvashtml, setCanvasHtml] = useState(''); //for final html of the canvas
  const [notification, setNotification] = useState<string | null>(null); // Notification for copying

  useEffect(() => {
    versionsRef.current = versions; // Update the ref whenever versions change
  }, [versions]);


  useEffect(() => {
    console.log('useeffect for coordinate click,' )
    // Clear sessionStorage on app refresh
    // window.addEventListener('beforeunload', clearSessionStorage);

    const handleIframeClick = (event: MessageEvent) => {
      if (event.data.type === 'CLICK_COORDINATES') {
        setClickCoordinates({ x: event.data.x, y: event.data.y });
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version =>
            version.id === currentVersionId
              ? { ...version, storedcoordinate: { x: event.data.x, y: event.data.y }}
              : version
          );
          return updatedVersions;
        });
        console.log('stored coordinates:', { x: event.data.x, y: event.data.y });
      }
    };

    window.addEventListener('message', handleIframeClick);

    return () => {
      window.removeEventListener('message', handleIframeClick);
    };
  }, []);
  
  useEffect(() => {
    console.log('useeffect for llm key', llm, api_key)
    const handleIframeMessage = (event: MessageEvent) => {
  
      if (event.data.type === 'GET_LLM_KEY') {
        console.log('GET_SVGPIECELIST returning', llm, api_key)
  
          iframeRef.current.contentWindow.postMessage(
            {
              type: 'RETURN_LLM_KEY',
              llm: llm,
              api_key: api_key
            },
            '*'
          );
  
      }
      
  
      // if (event.data.type === 'GET_AnnotatedPieceList') {
      //   console.log('GET_AnnotatedPieceList returning??', versionsRef.current.find(version => version.id === currentVersionId))
      //   const currentAnnotatedPieceList = versionsRef.current.find(version => version.id === currentVersionId)?.AnnotatedPieceList;
      //   if (currentAnnotatedPieceList) {
      //     iframeRef.current.contentWindow.postMessage(
      //       {
      //         type: 'RETURN_AnnotatedPieceList',
      //         currentAnnotatedPieceList: currentAnnotatedPieceList,
      //       },
      //       '*'
      //     );
      //     console.log('GET_AnnotatedPieceList returned')
      //   }
      // }
    };

    window.addEventListener('message', handleIframeMessage);
    
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };

  }, [llm, api_key]);

  const handleIframeLoad = () => {
    console.log('handleIframeLoad called')
    const handleIframeMessage = (event: MessageEvent) => {

    if (event.data.type === 'UPDATE_REUSEABLE') {
      const newElement = {
        codeName: event.data.codename,
        codeText: event.data.codetext,
        selected: false,
      };

      // Update the reusable element list and then check the updated list
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version => {
          if (version.id === currentVersionId) {
            const updatedreuseableSVGElementList = version.reuseableSVGElementList.map(element =>
              element.codeName === newElement.codeName ? newElement : element
            );

            if (!updatedreuseableSVGElementList.some(element => element.codeName === newElement.codeName)) {
              updatedreuseableSVGElementList.push(newElement);
            }

            return { ...version, reuseableSVGElementList: updatedreuseableSVGElementList };
          }
          return version;
        });

        // Now check if the `currentreuseableSVGElementList` has been updated correctly
        const currentreuseableSVGElementList = updatedVersions.find(version => version.id === currentVersionId)?.reuseableSVGElementList;

        console.log('check currentreuseableSVGElementList', currentreuseableSVGElementList, updatedVersions);

        if (currentreuseableSVGElementList && currentreuseableSVGElementList.some(element => element.codeName === event.data.codename)) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: 'UPDATE_REUSEABLE_CONFIRMED',
              codename: event.data.codename,
              reuseableSVGElementList: currentreuseableSVGElementList,
            },
            '*'
          );
          console.log(
            'posted UPDATE_REUSEABLE_CONFIRMED to iframe',
            currentreuseableSVGElementList,
            updatedVersions.find(version => version.id === currentVersionId)?.reuseableSVGElementList
          );
        }

        return updatedVersions;
      });
    }

    if (event.data.type === 'EMPTY_SVGPIECE') {
      // Empty the highlightedSVGPieceList of the current version
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version => {
          if (version.id === currentVersionId) {
            return { ...version, highlightedSVGPieceList: [] };
          }
          return version;
        });

        console.log('highlightedSVGPieceList emptied for version:', currentVersionId);
        return updatedVersions;
      });
    }

    if (event.data.type === 'REMOVE_SVGPIECE') {
      console.log('removing svg:', event.data.codetext)
      // Remove a specific SVG piece from the highlightedSVGPieceList by matching codeText
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version => {
          if (version.id === currentVersionId) {
            const updatedhighlightedSVGPieceList = version.highlightedSVGPieceList?.filter(
              element => element.codeText !== event.data.codetext
            ) || [];

            return { ...version, highlightedSVGPieceList: updatedhighlightedSVGPieceList };
          }
          return version;
        });
        // Now check if the `currenthighlightedSVGPieceList` has been updated correctly
        const currenthighlightedSVGPieceList = updatedVersions.find(version => version.id === currentVersionId)?.highlightedSVGPieceList;
            
        console.log('check currenthighlightedSVGPieceList', currenthighlightedSVGPieceList, updatedVersions);

        return updatedVersions;
      });
      
    }

    if (event.data.type === 'GET_SVGPIECELIST') {
      console.log('GET_SVGPIECELIST returning', versions.find(version => version.id === currentVersionId)?.previousSelectedSVGPieceList)
      const currenthighlightedSVGPieceList = versions.find(version => version.id === currentVersionId)?.previousSelectedSVGPieceList;
      if (currenthighlightedSVGPieceList) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'RETURN_SVGPIECELIST',
            currenthighlightedSVGPieceList: currenthighlightedSVGPieceList,
          },
          '*'
        );
        console.log('GET_SVGPIECELIST returned')
      }
    }

    if (event.data.type === 'UPDATE_SVGPIECE') {
      console.log('added svg:', event.data.codetext);
      const newElementBaseName = event.data.codename;
      let newElementName = newElementBaseName;
      const newElement = {
        codeName: newElementName,
        codeText: event.data.codetext,
        selected: false,
      };
    
      // Update the reusable SVG piece list and then check the updated list
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version => {
          if (version.id === currentVersionId) {
            const updatedhighlightedSVGPieceList = version.highlightedSVGPieceList?.slice() || [];
            const updatedpreviousSelectedSVGPieceList = version.previousSelectedSVGPieceList ? [...version.previousSelectedSVGPieceList] : []; 
    
            // Check if there are already elements with the same base name
            // the naming index is defined by previousSelectedSVGPieceList, which stores all the elements needed to be modified and not removed when user de-highlight
            const existingElements = updatedpreviousSelectedSVGPieceList.filter(element => element.codeName.startsWith(newElementBaseName));
    
            if (existingElements.length > 0) {
              // Find the biggest index after the underscore in the existing elements
              const maxIndex = existingElements
                .map(element => {
                  const parts = element.codeName.split('_');
                  return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 0;
                })
                .reduce((max, current) => Math.max(max, current), -1);
    
              // Set the new codename with the incremented index
              newElementName = `${newElementBaseName}_${maxIndex + 1}`;
              newElement.codeName = newElementName;
            } else {
              // No elements with the same base name, use basename_0
              newElementName = `${newElementBaseName}_0`;
              newElement.codeName = newElementName;
            }
    
            updatedhighlightedSVGPieceList.push(newElement);
            updatedpreviousSelectedSVGPieceList.push(newElement);
    
            return { 
              ...version, 
              highlightedSVGPieceList: updatedhighlightedSVGPieceList, 
              previousSelectedSVGPieceList: updatedpreviousSelectedSVGPieceList 
            };
          }
          return version;
        });
    
        // Now check if the `currenthighlightedSVGPieceList` has been updated correctly
        const currenthighlightedSVGPieceList = updatedVersions.find(version => version.id === currentVersionId)?.previousSelectedSVGPieceList;
    
        console.log('check highlighted SvgPieceList in update', updatedVersions.find(version => version.id === currentVersionId)?.highlightedSVGPieceList);
        console.log('check all previously selected SvgPieceList in update', currenthighlightedSVGPieceList);
    
        return updatedVersions;
      });
    }

    if (event.data.type === 'UPDATE_CANVASHTML') {
      // console.log('get UPDATE_CANVASHTML:', event.data.content);
      setCanvasHtml(event.data.content)
    }

    

    // if (event.data.type === 'GET_AnnotatedPieceList') {
    //   console.log('GET_AnnotatedPieceList returning??', versionsRef.current.find(version => version.id === currentVersionId))
    //   const currentAnnotatedPieceList = versionsRef.current.find(version => version.id === currentVersionId)?.AnnotatedPieceList;
    //   if (currentAnnotatedPieceList) {
    //     iframeRef.current.contentWindow.postMessage(
    //       {
    //         type: 'RETURN_AnnotatedPieceList',
    //         currentAnnotatedPieceList: currentAnnotatedPieceList,
    //       },
    //       '*'
    //     );
    //     console.log('GET_AnnotatedPieceList returned')
    //   }
    // }
  };

  // const saveVersionToHistory = (currentVersionId: string) => {
  //   setVersions((prevVersions) => {
  //     const updatedVersions = prevVersions.map((version) => {
  //       if (version.id === currentVersionId) {
  //         const historyVersion = { ...version, id: `${currentVersionId}-history` };
  //         return { ...version, history: historyVersion };
  //       }
  //       return version;
  //     });
  //     return updatedVersions;
  //   });
  // };

    window.addEventListener('message', handleIframeMessage);

    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDocument = iframe.contentDocument;

      if (iframeDocument) {
        // Clear existing content
        iframeDocument.open();
        iframeDocument.write('<!DOCTYPE html><html lang="en"><head></head><body></body></html>');
        iframeDocument.close();
        console.log('cleared', iframeDocument);

        // Create the new content
        const newDocument = iframeDocument;
        if (newDocument) {
          newDocument.open();

          if (true){
            newDocument.write(`
              <!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Fabric.js Library Example</title>
              </head>
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
                    width: 100%;
                    height: 100%;
                  }

                  #canvasSvg {
                    width: 100%;
                    height: 100%;
                  }

            </style>
            <body>
              <div id="canvasContainer">
              </div>

              <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/1.4.0/fabric.min.js"></script>
              <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
              <script src="/uifunction.js"></script>
              <script src="/main.js"></script>
            </body>
            </html>
          `);
          }
          newDocument.close();
        }
      }
      console.log('loaded', iframeDocument);
    }

    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }

  const handleCopy = () => {
    if (canvashtml) {
      navigator.clipboard.writeText(canvashtml)
        .then(() => {
          setNotification('Copied to clipboard!');
          setTimeout(() => setNotification(null), 2000); // Hide notification after 2 seconds
        })
        .catch(err => {
          setNotification('Failed to copy.');
          setTimeout(() => setNotification(null), 2000);
          console.error('Could not copy text: ', err);
        });
    }
  };

  return (
    <div
    ref={containerRef}
    className="result-viewer-div"
    style={{
      position: 'relative',
      width: '500px',
      height: '500px',
      backgroundColor: 'white', // Corrected color format
      borderRadius: '10px', // Units should be strings
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' // Corrected boxShadow
    }}
  >
      {/* Copy button at the top right */}
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10,
          padding: '5px 10px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Copy
      </button>

      {/* Notification */}
      {notification && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '10px',
            backgroundColor: '#000',
            color: '#fff',
            padding: '5px 10px',
            borderRadius: '4px',
            zIndex: 10,
            fontSize: '12px',
            opacity: 0.9
          }}
        >
          {notification}
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        title="result-viewer iframe"
        style={{ width: '100%', height: '100%', backgroundColor: 'white' }}
        sandbox="allow-scripts allow-same-origin allow-downloads" // Add allow-same-origin
        onLoad={handleIframeLoad} // Attach the onLoad handler
      />
    </div>
  );
};


export default ResultViewer;