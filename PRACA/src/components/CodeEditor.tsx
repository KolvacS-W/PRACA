import React, { useState, useEffect, useRef } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import ReactLoading from 'react-loading';
import { Version } from '../types';

interface CodeEditorProps {
  llm: string,
  classcode: {js: string},
  setClassCode: React.Dispatch<React.SetStateAction<{ js: string }>>;
  api_key: string;
  usercode: { js: string }; // user use
  currentVersionId: string | null;
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  versions: Version[];
  onRunUserCode: (usercode: { js: string }) => void; // Add this prop
}

const CustomCodeEditor: React.FC<CodeEditorProps> = ({
  llm,
  classcode,
  setClassCode,
  api_key,
  usercode,
  currentVersionId,
  setVersions,
  versions,
  onRunUserCode
}) => {
  const codecomponentRef = useRef<HTMLDivElement>(null);
  const [userjs, setuserJs] = useState(usercode.js);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showGenerateOption, setShowGenerateOption] = useState(false);
  const [showCoordcomplete, setShowCoordcomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [autocompletePositionbackup, setAutocompletePositionbackup] = useState({ top: 0, left: 0 });
  const [CoordcompletePosition, setCoordcompletePosition] = useState({ top: 0, left: 0 });
  const [hintKeywords, setHintKeywords] = useState('');
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const [boldOptions, setBoldOptions] = useState<string[]>([]);
  const version = currentVersionId !== null ? versions.find((version) => version.id === currentVersionId) : null;
  const loading = version ? version.loading : false;
  const [optionLevels, setOptionLevels] = useState<{ options: string[]; position: { top: number; left: number } }[]>([]);
  const [buttonchoice, setButtonchoice] = useState('');
  //for modifyobjwidget
  const [svgCodeText, setSvgCodeText] = useState('');//current svg str, used for highlights, dynamic
  const [initialSvgCodeText, setInitialSvgCodeText] = useState('');//current svg str, original
  const [showModifyObjWidget, setShowModifyObjWidget] = useState(true);
  const [currentSelectedSVG, setCurrentSelectedSVG] = useState(''); // State to store the current codeName
  const [showsvgstr, setShowSvgStr] = useState<string | null>(null); //to decide if showing svg str edit window
  //for checksvgpiecewidget
  const [showCheckSVGPieceWidget, setShowCheckSVGPieceWidget] = useState(false)
  const [svgCodeText_checkpiece, setSvgCodeText_checkpiece] = useState('');

  //for auto completion
  const handleUpGenerateprompt_word = `Given a word, give me 5 words that are a more abstract and general level of the given word. 
        The more abstract level of a word can be achieved by finding hypernyms of that word.
        For example, “motor vehicle” is one level more abstract than “car”, “self-propelled vehicle” is one level more abstract than “motor vehicle”, “wheeled vehicle” is one level more abstract than “self-propelled vehicle”; “color” is one level more abstract than “blue”.
        Make sure all 5 words in the response are on the same level; and include nothing but the 5 words separated by '\\n' (newline character) in the response. Make sure the generated contents are also in the semantic space of ${hintKeywords}. If there's no more suitable text to be generated, return "no further generation". Given word: `;
;
  const handleUpGenerateprompt_sentence = `Given a text, give me 5 text pieces that are a more abstract and general level of the given text piece.
        The more abstract level of a text can be achieved by removing details, descriptions, and modifiers of the text and making it more generalizable.
        For example, "two parrots with feathers" is 1 level more abstract than "two beautiful parrots with colorful feathers", "two parrots" is 1 level more abstract than "two parrots with feathers"
        Make sure all the 5 text pieces in the response are on the same level, and include nothing but the 5 text pieces separated by '\\n' (newline character) in the response. Make sure the generated contents are also in the semantic space of ${hintKeywords}. If there's no more suitable text to be generated, return "no further generation". Given text: `;
;
  const handleDownGenerateprompt_word = `Given a word, give me 5 words that are 1 level more specific than the given word. 
        The more specific level of a word can be achieved by finding hyponyms of that word.
        For example, “car” is one level more specific than “motor vehicle”, “motor vehicle” is one level more specific than self-propelled vehicle”, “self-propelled vehicle” is one level more specific than “wheeled vehicle”; "blue" is one level more specific than "color".
        Make sure all 5 words in the response are on the same level; and include nothing but the 5 words separated by '\\n' (newline character) in the response. Make sure the generated contents are also in the semantic space of ${hintKeywords}. If there's no more suitable text to be generated, return "no further generation". Given word: `;
  
  const handleDownGenerateprompt_sentence = `Given a text, give me 5 text pieces that are 1 level more specific than the given text piece.
        The more specific level of a text can be achieved by adding details, descriptions, categories, and modifiers of the text and making it more specific.
        For example, "two beautiful parrots with colorful feathers" is 1 level more specific than "two parrots with feathers", "two parrots with features" is 1 level more specific than "two parrots"
        Make sure all the 5 text pieces in the response are on the same level, and include nothing but the 5 text pieces separated by '\\n' (newline character) in the response. Make sure the generated contents are also in the semantic space of ${hintKeywords}. If there's no more suitable text to be generated, return "no further generation". Given text: `;
  
  const handleRightGenerateprompt_word = `Given a word, give me 5 words that each are a variation of the given word.
        The variation text should have same amount of details and same format as the original word.
        For example,
        "blue", "purple", or "red" are variations of "yellow".
        "cow" and "person" are not variations of each other because they are of different categories.
        Include nothing but the 5 text pieces separated by '\\n' (newline character) in the response. Make sure the generated contents are also in the semantic space of ${hintKeywords}. If there's no more suitable text to be generated, return "no further generation". Given text: `;

  const handleRightGenerateprompt_sentence = `Given a text, give me 5 text pieces that each are a variation of the given text piece.
        The variation text should have same amount of details and same format as the original text, with various different details, descriptions, categories, and modifiers of the text to make it somewhat different.
        For example "A white passenger plane with two wings and a tail." is an variation of "A small, red biplane with a propeller in the front."
        "blue", "purple", or "red" are variations of "yellow".
        "cow" and "a horse with brown color running" are not variations of each other because they have different amount of details.
        Make sure the generated text pieces have same amount of details and same format as the original text. Include nothing but the 5 text pieces separated by '\\n' (newline character) in the response. Make sure the generated contents are also in the semantic space of ${hintKeywords}. If there's no more suitable text to be generated, return "no further generation". Given text: `;


  useEffect(() => {
    // setbackendHtml(backendcode.html);
    setuserJs(usercode.js);
  }, [usercode]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (codecomponentRef.current && codecomponentRef.current.contains(event.target as Node)) {
        var clickedOutside = true;
          // Check if the click is inside the generate option widget
      const generateOptionWidget = document.getElementById('code-generate-option-widget');
      if (generateOptionWidget && generateOptionWidget.contains(event.target as Node)) {
        clickedOutside = false;
      }
      
        // Check if the click is inside any of the autocomplete widgets
        optionLevels.forEach((_, levelIndex) => {
          const widgetElement = document.getElementById(`autocomplete-widget-${levelIndex}`);
          if (widgetElement && widgetElement.contains(event.target as Node)) {
            clickedOutside = false;
          }
        });
      
        // Check if the click is inside the generate option widget
        if (widgetRef.current && widgetRef.current.contains(event.target as Node)) {
          clickedOutside = false;
        }
      
        // Check if the click is inside any of the autocomplete widgets
        const autocompleteWidgets = document.querySelectorAll('.autocomplete-widget');
        autocompleteWidgets.forEach((widget) => {
          if (widget.contains(event.target as Node)) {
            clickedOutside = false;
          }
        });
      
        // Check if the click is inside the coordinate widget (if it's shown)
        if (showCoordcomplete) {
          const coordWidgetElement = widgetRef.current;
          if (coordWidgetElement && coordWidgetElement.contains(event.target as Node)) {
            clickedOutside = false;
          }
        }
      
        // Check if the click is inside the modify object widget (if it's shown)
        if (showModifyObjWidget) {
          console.log('check showModifyObjWidget')
          const modifyObjWidgetElement = document.querySelector('.modify-obj-widget');
          if (modifyObjWidgetElement && modifyObjWidgetElement.contains(event.target as Node)) {
            clickedOutside = false;
          }
        }
            
        // If the click was outside all widgets, close the others
        if (clickedOutside) {
          console.log('Clicked outside');
          setOptionLevels([]);
          setShowAutocomplete(false);
          setShowGenerateOption(false);
          // setShowCoordcomplete(false);
          // setShowModifyObjWidget(false);
          setVersions(prevVersions => {
            const updatedVersions = prevVersions.map(version => {
              const updatedHighlightedSVGPieceList = [];
    
              if (version.id === currentVersionId) {
                // Check if there's already an entry with the same codeText and update it, or append a new one
                return { ...version, highlightedSVGPieceList: updatedHighlightedSVGPieceList, };
              }
              return version;
            });
            return updatedVersions;
          });
          setSvgCodeText('');
          setShowSvgStr(null);
        }
      }
      
    };  
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


//auto completion widgets
  const handleRightClick = (event: React.MouseEvent) => {
    event.preventDefault();
    const selection = window.getSelection();
    const word = selection?.toString().trim();
      if (word) {
      const cursorPosition = editorRef.current?.selectionStart || 0;
      const position = getCaretCoordinates(editorRef.current, cursorPosition - word.length);
      setHintKeywords(word);
      const rect = editorRef.current?.getBoundingClientRect();
      if (rect) {
        setAutocompletePosition({ top: position.top + 50, left: position.left });
        // const initialOptions = [word]; // You can replace this with an array of initial options if available
        // setOptionLevels([{ options: initialOptions, position }]);
        setShowGenerateOption(true);
      }
    }
  };

  const generatewithAPI = async (prompt: string, callback: (response: string) => void) => {
    if(llm == 'Anthropic'){
      try {
        if (!api_key) {
          throw new Error("AnthropicGen API key not set");
        }
    
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            "anthropic-dangerous-direct-browser-access": "true", 
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                ],
              },
            ],
          }),
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data = await response.json();
        const genresp = data.content[0].text;
        callback(genresp);
      } catch (err) {
        console.error('Error in generatewithAPI:', err);
      }
    }
    else if (llm == 'OpenAI') {
      try {
        if (!api_key) {
          throw new Error("AnthropicGen API key not set");
        }
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
      headers: {
              "authorization": "Bearer " + api_key,
              "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const genresp = data.choices[0].message.content;
        callback(genresp);
      } catch (err) {
        console.error('Error in generatewithAPI:', err);
      }
    }
    else if (llm == 'Groq'){
      try {
        if (!api_key) {
          throw new Error("AnthropicGen API key not set");
        }
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
      headers: {
              "authorization": "Bearer " + api_key,
              "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.2-90b-text-preview",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const genresp = data.choices[0].message.content;
    callback(genresp);
      } catch (err) {
        console.error('Error in generatewithAPI:', err);
      }

    }
  
  };

  const handleResponse = (content: string, levelIndex: number) => {
    console.log('content', content)
    const options = content.split('\n').filter(Boolean);
    const position = { top: autocompletePosition.top, left: autocompletePosition.left };
    //setOptionLevels([{ options, position }]); // Initialize with the first level
    setOptionLevels((prevLevels) => {
      const updatedLevels = [...prevLevels];
      updatedLevels.splice(levelIndex + 1, prevLevels.length - levelIndex - 1, { options: options, position: position });
      return updatedLevels;
    });
    console.log('option levels:', optionLevels)
    setGeneratedOptions(options); //just to pass variables to proceedfunction
    setShowAutocomplete(true)
  };

  const handleUpGenerate = async (hint: string, levelIndex = 0) => {
    setButtonchoice('up') // for ...
    let prompt = '';
    if (hint.includes(' ')) {
      prompt = handleUpGenerateprompt_sentence+hint
    } else {
      prompt = handleUpGenerateprompt_word + hint
    }

    try {
      await generatewithAPI(prompt, (content) => handleResponse(content, levelIndex));
    } catch (err) {
      console.log('err', err)
    }
  };

  const handleRightGenerate = async (hint: string, levelIndex = 0) => {
    setButtonchoice('right') // for ...
    var prompt = '';

    if (hint.includes(' ')) {
      prompt = handleRightGenerateprompt_sentence+hint
    } else {
      prompt = handleRightGenerateprompt_word + hint
    }
    console.log('generate prompt', prompt)

    try {
      await generatewithAPI(prompt, (content) => handleResponse(content, levelIndex));
    } catch (err) {
      console.log('err', err)
    }

  };

  const handleDownGenerate = async (hint: string, levelIndex = 0) => {
    console.log('down')
    setButtonchoice('down') // for ...
    let prompt = '';
    if (hint.includes(' ')) {
      prompt = handleDownGenerateprompt_sentence+hint
    } else {
      prompt = handleDownGenerateprompt_word + hint
    }

    console.log('prompt', prompt)

    try {
      await generatewithAPI(prompt, (content) => handleResponse(content, levelIndex));
    } catch (err) {
      console.log('err', err)
    }
  };


  const handleAutocompleteOptionClick = (option: string, hintText: string) => {
    const currentValue = userjs;
    const cursorPosition = editorRef.current?.selectionStart || 0;
    const textBeforeCursor = currentValue.slice(0, cursorPosition).replace(new RegExp(`${hintText}$`), '');
    const textAfterCursor = currentValue.slice(cursorPosition + hintText.length);
    const newText = textBeforeCursor + option + textAfterCursor;
    console.log('handleAutocompleteOptionClick, new text', newText)
    setuserJs(newText);
    setShowAutocomplete(false);
    setShowGenerateOption(false);
    setOptionLevels([]);
    setButtonchoice('');
  };

  const handleCoordcompleteOptionClick = (option: string, hintText: string) => {
    const currentValue = userjs;
    const cursorPosition = editorRef.current?.selectionStart || 0;
    const textBeforeCursor = currentValue.slice(0, cursorPosition).replace(new RegExp(`${hintText}$`), '');
    const textAfterCursor = currentValue.slice(cursorPosition + hintText.length);
    const newText = textBeforeCursor + option + textAfterCursor;
    setuserJs(newText);
    setShowAutocomplete(false);
    setGeneratedOptions([]);
  };


  const proceedGeneration = async (option: string, levelIndex: number) => {
    let prompt = '';

    if (buttonchoice == 'down'){
      console.log('proceedgeneration, option', option, buttonchoice)
      if (option.includes(' ')) {
        prompt = handleDownGenerateprompt_sentence+option    
      } else {
        prompt = handleDownGenerateprompt_word+option    
      }
    }

    if (buttonchoice == 'up'){
      console.log('proceedgeneration, option', option, buttonchoice)
      if (option.includes(' ')) {
        prompt = handleUpGenerateprompt_sentence+option    
      } else {
        prompt = handleUpGenerateprompt_word+option    
      }
    }    

    if (buttonchoice == 'right'){
      console.log('proceedgeneration, option', option, buttonchoice)
      if (option.includes(' ')) {
        prompt = handleRightGenerateprompt_sentence+option    
      } else {
        prompt = handleRightGenerateprompt_word+option    
      }
    }
    try {
      await generatewithAPI(prompt, (content) => 
      {const newOptions = content.split('\n').filter(Boolean);
      const newPosition = {
        top: optionLevels.length > 0 ? optionLevels[levelIndex].position.top : 0,
        left: optionLevels.length > 0 ? optionLevels[levelIndex].position.left + 200 : 0,
      };
      
      setOptionLevels((prevLevels) => {
        const updatedLevels = [...prevLevels];
        updatedLevels.splice(levelIndex + 1, prevLevels.length - levelIndex - 1, { options: newOptions, position: newPosition });
        return updatedLevels;
      });
      console.log('proceed: optionlevels', optionLevels)
    });
    } catch (err) {
      console.log('err', err)
    }    
  };
  
  const GenerateOptionWidget = ({ hintKeywords }: { hintKeywords: string }) => (
    <div
      id="code-generate-option-widget"
      ref={widgetRef}
      className="code-generate-option-widget"
      style={{
        position: 'absolute',
        top: autocompletePosition.top,
        left: autocompletePosition.left,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        padding: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="button-container">
        <button onClick={() => handleUpGenerate(hintKeywords)}>🔼</button>
        <button onClick={() => handleRightGenerate(hintKeywords)}>🔄</button>
        <button onClick={() => handleDownGenerate(hintKeywords)}>🔽</button>
      </div>
    </div>
  );
  
  const AutocompleteWidget = ({ options, levelIndex }: { options: string[], levelIndex: number }) => {
    const [checkedOptions, setCheckedOptions] = useState<string[]>([]);
  
    const handleCheckboxChange = (option: string) => {
      setCheckedOptions((prev) => {
        if (prev.includes(option)) {
          return prev.filter((item) => item !== option);
        } else {
          return [...prev, option];
        }
      });
    };
  
    const handleEqualButtonClick = () => {
      const combinedText = checkedOptions.join('\', \'');
      const currentValue = userjs;
      const cursorPosition = editorRef.current?.selectionStart || 0;
      const textBeforeCursor = currentValue.slice(0, cursorPosition);
      const textAfterCursor = currentValue.slice(cursorPosition);
      const newText = textBeforeCursor + combinedText + textAfterCursor;
      setuserJs(newText);
      setShowAutocomplete(false);
      setShowGenerateOption(false);
      setOptionLevels([]);
    };
  
    const handleProceedClick = (option: string) => {
      if (!boldOptions.includes(option)) {
        setBoldOptions([...boldOptions, option]); // Add option to boldOptions array
      }
      console.log('bold options', boldOptions);
      proceedGeneration(option, levelIndex);
    };
  
    return (
      <div
        id={`autocomplete-widget-${levelIndex}`}
        className="autocomplete-widget"
        style={{
          position: 'absolute',
          top: optionLevels[levelIndex]?.position.top || autocompletePosition.top,
          left: optionLevels[levelIndex]?.position.left || autocompletePosition.left,
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '10px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          width: '200px', // Fixed width to provide more space for longer texts
          fontSize: '14px', // Smaller font size
        }}
      >
        <ul className="autocomplete-options" style={{ margin: 0, padding: 0, listStyleType: 'none' }}>
          {options.map((option, index) => (
            <li
              key={index}
              className="autocomplete-option"
              style={{
                padding: '5px',
                cursor: 'pointer',
                whiteSpace: 'pre-wrap', // Allow text to wrap onto the next line
                overflow: 'hidden', // Hide overflow text
                textOverflow: 'ellipsis', // Show ellipsis for overflowing text
                fontWeight: boldOptions.includes(option) ? 'bold' : 'normal', // Apply bold if in boldOptions
                wordWrap: 'break-word', // Ensure words break to the next line if they are too long
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <input
                type="checkbox"
                checked={checkedOptions.includes(option)}
                onChange={() => handleCheckboxChange(option)}
                style={{ marginRight: '5px' }}
              />
              <span
                onClick={() => handleAutocompleteOptionClick(option, hintKeywords)}
                style={{ flexGrow: 1 }}
              >
                {option}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the click event from propagating to the list item
                  handleProceedClick(option); // Bold the option and proceed with generation
                }} 
                style={{
                  marginLeft: '10px',
                  padding: '2px 5px',
                  fontSize: '10px',
                }}
              >
                ...
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={handleEqualButtonClick}
          style={{
            marginTop: '10px',
            width: '100%',
            padding: '5px 0',
            backgroundColor: 'transparent', // No background color
            color: 'inherit', // Inherit the default text color
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center', // Center the text
          }}
        >
          create array
        </button>
      </div>
    );
  };

//modifyobj widget
  const ModifyObjWidget = () => {
    const currentVersion = versions.find((version) => version.id === currentVersionId);
    const currentreuseableSVGElementList = currentVersion?.reuseableSVGElementList || [];
    const [objNameInput, setObjNameInput] = useState(currentSelectedSVG); // State for the object name input
    const [currentPieceName, setCurrentPieceName] = useState(''); // Track the currently clicked piece name
    const [piecePrompts, setPiecePrompts] = useState({}); // Store prompts for each piece
    const [groupNameInput, setGroupNameInput] = useState('');
    const [showLocalSvgCodeText, setShowLocalSvgCodeText] = useState(showsvgstr); //use for svg str edit
    const iframeRef = useRef<HTMLIFrameElement>(null);

    //sanitize svg code to render correctly
    const sanitize_removeattributes = (svgString: string) => {
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
    //to re-render svg edit
    useEffect(() => {
        // console.log('ModifyObjWidget useeffect called', svgCodeText)
        const iframe = iframeRef.current;
        
        if (iframe) {
          const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    
          iframeDocument.open(); // Open the document for writing
          iframeDocument.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <!-- head content -->
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
                svg {
                  width: 100%;
                  height: 100%;
                }
              </style>
            </head>
            <body>
              <div id="canvasContainer">
                ${sanitize_removeattributes(svgCodeText)}
              </div>
            </body>
            </html>
          `);
          iframeDocument.close(); // Close the document to complete writing
    
          // Wait for the iframe's content to load before manipulating the SVG elements
          iframe.onload = () => {
            const svgElement = iframeDocument.querySelector('svg');
            if (svgElement) {
              attachHighlightListeners(svgElement);
            }
          };
        }
      }, [svgCodeText]);

    // render small svg preview
    const renderSVGInIframe = (previewiframeRef: React.RefObject<HTMLIFrameElement>, svgCode: string) => {
      
      const iframe = previewiframeRef.current;
      if (iframe) {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDocument) {
          iframeDocument.open(); // Open the document for writing
          iframeDocument.write(`
                      <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                background-color: none;
              }
              svg {
                width: 100%;
                height: 100%;
                object-fit: contain;
              }
              #container {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: none;
              }
            </style>
          </head>
          <body>
            <div id="container">
              ${sanitize_removeattributes(svgCode)}
            </div>
          </body>
          </html>
          `);
          // console.log('ifram code', `
          //             <!DOCTYPE html>
          // <html lang="en">
          // <head>
          //   <meta charset="UTF-8">
          //   <meta name="viewport" content="width=device-width, initial-scale=1.0">
          //   <style>
          //     html, body {
          //       margin: 0;
          //       padding: 0;
          //       width: 100%;
          //       height: 100%;
          //       display: flex;
          //       justify-content: center;
          //       align-items: center;
          //       overflow: hidden;
          //       background-color: white;
          //     }
          //     svg {
          //       width: auto;
          //       height: 100%;
          //       max-width: 100%;
          //       object-fit: contain;
          //     }
          //     #container {
          //       width: 100%;
          //       height: 100%;
          //       display: flex;
          //       justify-content: center;
          //       align-items: center;
          //       background-color: white;
          //     }
          //   </style>
          // </head>
          // <body>
          //   <div id="container">
          //     ${sanitize_removeattributes(svgCode)}
          //   </div>
          // </body>
          // </html>
          // `)
          iframeDocument.close(); // Close the document to complete writing
        }
      }
    };

    //functions to click and highlight svg pieces
    const handlePieceClick = (pieceCodeName: string) => {
      // Keep the current prompts intact while selecting the new piece
      setCurrentPieceName(pieceCodeName);
    
      // Find the piece from the previous selected list
      const piece = currentVersion.previousSelectedSVGPieceList?.find(item => item.codeName === pieceCodeName);
      
      if (piece) {
        const parentSVG = currentVersion.reuseableSVGElementList.find(svg => svg.codeName === piece.parentSVG);
        if (parentSVG) {
          const cursorPosition = editorRef.current?.selectionStart || 0;
          const position = getCaretCoordinates(editorRef.current, cursorPosition);
          setAutocompletePositionbackup({ top: 600, left: 0 });
          setSvgCodeText_checkpiece(parentSVG.codeText);
          setShowCheckSVGPieceWidget(true); // Show the CheckSVGPieceWidget
        }
    
        // Preserve all other prompts while ensuring the current piece's prompt is updated or preserved
        // setPiecePrompts((prevPrompts) => ({
        //   ...prevPrompts, // Keep previous prompts intact
        //   [pieceCodeName]: prevPrompts[pieceCodeName] || '', // Preserve the current piece's prompt or set it as an empty string
        // }));
        // console.log('set prompts', prevPrompts)
      }
    };
      
    const attachHighlightListeners = (svgElement: SVGElement) => {
        svgElement.querySelectorAll('*').forEach(svgChildElement => {
            svgChildElement.addEventListener('click', toggleHighlight);
        });
    };

    const update_svgpiece = (codename: string, codetext:string) =>{

      console.log('added svg:', codetext);
        const newElementBaseName = codename;
        let newElementName = newElementBaseName;
        const newElement = {
          codeName: newElementName,
          codeText: codetext,
          selected: false,
          parentSVG: currentSelectedSVG
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

    const remove_svgpiece = (codetext:string) => {
        console.log('removing svg:', codetext)
        // Remove a specific SVG piece from the highlightedSVGPieceList by matching codeText
        setVersions(prevVersions => {
          const updatedVersions = prevVersions.map(version => {
            if (version.id === currentVersionId) {
              const updatedhighlightedSVGPieceList = version.highlightedSVGPieceList?.filter(
                element => element.codeText !== codetext
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

    function findSVGAncestor(element) {
      while (element && element.tagName.toLowerCase() !== 'svg') {
          element = element.parentElement;
      }
      return element;
    }
    const toggleHighlight = (event: MouseEvent) => {
        event.stopPropagation();
        const target = event.currentTarget as SVGElement;
        console.log('target:', target, target.outerHTML)
        const isHighlighted = target.getAttribute('data-highlighted') === 'true';

        if (isHighlighted) {
            const originalStroke = target.getAttribute('data-original-stroke') || 'none';
            const originalStrokeWidth = target.getAttribute('data-original-stroke-width') || '1';
            target.setAttribute('stroke', originalStroke);
            target.setAttribute('stroke-width', originalStrokeWidth);
            target.removeAttribute('data-highlighted');
            target.removeAttribute('data-original-stroke-width');
            target.removeAttribute('data-original-stroke');
            if (originalStroke === 'none' && parseFloat(originalStrokeWidth) === 0) {
                target.removeAttribute('stroke');
                target.removeAttribute('stroke-width');
            }
            const svgString = target.outerHTML;
            remove_svgpiece(svgString)
            setSvgCodeText(findSVGAncestor(target).outerHTML)
            console.log('done update', svgString, findSVGAncestor(target))
            //window.parent.postMessage({ type: 'REMOVE_SVGPIECE', codetext: svgString }, '*');
            
        } else {
            const clonedTarget = target.cloneNode(true);
            const originalStroke = target.getAttribute('stroke') || 'none';
            const originalStrokeWidth = target.getAttribute('stroke-width') || '0';
            target.setAttribute('data-original-stroke', originalStroke);
            target.setAttribute('data-original-stroke-width', originalStrokeWidth);
            target.setAttribute('stroke', 'yellow');
            target.setAttribute('stroke-width', parseFloat(originalStrokeWidth) + 10);
            target.setAttribute('data-highlighted', 'true');
            const svgString = clonedTarget.outerHTML;
            //console.log('before update', svgCodeText)
            update_svgpiece(svgString.split(' ')[0].split('<')[1], svgString)
            setSvgCodeText(findSVGAncestor(target).outerHTML) 
            console.log('done update', svgString, findSVGAncestor(target))
        }
    };

    //render svg edit window
    const handleRenderSVGClick = (codeName: string, codeText: string) => {
        setSvgCodeText(codeText);
        setInitialSvgCodeText(codeText);
        setShowSvgStr(null);
        setShowLocalSvgCodeText(codeText);
        setCurrentSelectedSVG(codeName)
    };

    //render svg str edit window
    const handleShowSVGClick = (codeName: string, codeText: string) => {
      setSvgCodeText('');
      setShowSvgStr(codeText);
      setShowLocalSvgCodeText(codeText);
      setCurrentSelectedSVG(codeName);
    };
    
    
    const handleRenameObject = () => {
      if (!objNameInput) return;
      setCurrentSelectedSVG(objNameInput);
      setVersions((prevVersions) => {
        const updatedVersions = prevVersions.map((version) => {
          if (version.id === currentVersionId) {
            const updatedReusableSVGList = version.reuseableSVGElementList.map((element) => {
              if (element.codeName === currentSelectedSVG) {
                return { ...element, codeName: objNameInput }; // Update the object name
              }
              return element;
            });
    
            // Also update the cachedobjectslog if it exists in sessionStorage
            const cachedObjectsLog = JSON.parse(sessionStorage.getItem('cachedobjects'));
            if (cachedObjectsLog) {
              const updatedCachedObjectsLog = JSON.parse(JSON.stringify(cachedObjectsLog));
              if (updatedCachedObjectsLog[currentSelectedSVG]) {
                updatedCachedObjectsLog[objNameInput] = {
                  ...updatedCachedObjectsLog[currentSelectedSVG],
                  objname: objNameInput, // Update the objname property
                };
                delete updatedCachedObjectsLog[currentSelectedSVG];
                sessionStorage.setItem('cachedobjects', JSON.stringify(updatedCachedObjectsLog));
              }
            }
    
            return { ...version, reuseableSVGElementList: updatedReusableSVGList };
          }
          return version;
        });
    
        return updatedVersions;
      });
    };
  

    //functions to modify selected svg pieces
    const handleModifyPieces = () => {
      
      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version => {
          const updatedHighlightedSVGPieceList = [];

          if (version.id === currentVersionId) {
            const modifiedPieces = currentVersion.highlightedSVGPieceList.map(piece => ({
              codeName: piece.codeName,
              prompt: piecePrompts[piece.codeName] || '', // Get the corresponding prompt
            }));
    
            const modifiedEntry = {
              codeName: currentSelectedSVG,
              pieces: modifiedPieces.map(item => item.codeName),
              pieceprompts: modifiedPieces.map(item => item.prompt),
            };
    
            // Check if there's already an entry with the same codeText and update it, or append a new one
            const existingModifyPieceList = version.modifyPieceList || [];
            const updatedModifyPieceList = existingModifyPieceList.filter(
              entry => entry.codeName !== modifiedEntry.codeName
            );
    
            // Add the modified entry (which overwrites any existing entry with the same codeText)
            updatedModifyPieceList.push(modifiedEntry);
            console.log('check moedifypiece prompts', modifiedEntry)
            // const cachedObjects = JSON.parse((sessionStorage.getItem('cachedobjects')))
            //find current svg code
            const svgcode = currentVersion.reuseableSVGElementList.find(item => item.codeName === currentSelectedSVG)?.codeText;
              
              if (!svgcode) {
                console.warn(`Item with codeName "${codeName}" not found in reuseableSVGElementList`);
                return null;
              }
              // console.log('svgcode', svgcode)
          
            updateobject_modifypieces(modifiedEntry, svgcode)
            return { ...version, modifyPieceList: updatedModifyPieceList, highlightedSVGPieceList: updatedHighlightedSVGPieceList, };
          }
          return version;
        });
        return updatedVersions;
      });
      
    };

    const generatewithAPI = async (prompt: string, callback: (response: string) => void) => {
      if(llm == 'Anthropic'){
        try {
          if (!api_key) {
            throw new Error("AnthropicGen API key not set");
          }
      
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": api_key,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
              "anthropic-dangerous-direct-browser-access": "true", 
            },
            body: JSON.stringify({
              model: "claude-3-haiku-20240307",
              max_tokens: 1024,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                  ],
                },
              ],
            }),
          });
      
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
      
          const data = await response.json();
          const genresp = data.content[0].text;
          callback(genresp);
        } catch (err) {
          console.error('Error in generatewithAPI:', err);
        }
      }
      else if (llm == 'OpenAI') {
        try {
          if (!api_key) {
            throw new Error("AnthropicGen API key not set");
          }
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
        headers: {
                "authorization": "Bearer " + api_key,
                "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
              ],
            },
          ],
        }),
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const genresp = data.choices[0].message.content;
          callback(genresp);
        } catch (err) {
          console.error('Error in generatewithAPI:', err);
        }
      }
      else if (llm == 'Groq'){
        try {
          if (!api_key) {
            throw new Error("AnthropicGen API key not set");
          }
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
        headers: {
                "authorization": "Bearer " + api_key,
                "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.2-90b-text-preview",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
              ],
            },
          ],
        }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      const genresp = data.choices[0].message.content;
      callback(genresp);
        } catch (err) {
          console.error('Error in generatewithAPI:', err);
        }
  
      }
    
    };
    async function updateobject_modifypieces(modifiedEntry , svgcode: string){
      // Create a new list: piececode by getting codeText using this.piecemodify elements as codeName from window.currentreuseablesvgpieces
          let piececode = modifiedEntry.pieces.map(codeName => {
            const currentVersion = versions.find(version => version.id === currentVersionId);
            const piece = currentVersion.highlightedSVGPieceList.find(item => item.codeName === codeName);
            return piece ? piece.codeText : null;
        }).filter(codeText => codeText !== null);

        // Initialize the APIprompt
        let modifyprompt = '';

        // For each element A in piececode and element B in piecemodify, create a prompt
        piececode.forEach((codePiece, index) => {
            const modification = modifiedEntry.pieceprompts[index];
            modifyprompt += ` for svg code piece:` + codePiece+`, ` +  modification ;
        });

        // Clone the object from currentVersion or cachedObjectsLog based on currentSelectedSVG
        const currentVersion = versions.find(version => version.id === currentVersionId);
        // const cachedObjectsLog = JSON.parse(sessionStorage.getItem('cachedobjects')) || {};
        
        // Find the object in reuseableSVGElementList
        let OriginalObject_reuseableSVGElementList = currentVersion.reuseableSVGElementList.find(item => item.codeName === currentSelectedSVG);

        if (!OriginalObject_reuseableSVGElementList) {
          console.error('Original object not found for codeName:', currentSelectedSVG);
          return;
        }

        // Clone the original object and create a variation
        const clonedObject_reuseableSVGElementList = { ...OriginalObject_reuseableSVGElementList };
        const OriginalCodeName_reuseableSVGElementList = OriginalObject_reuseableSVGElementList.codeName;
        clonedObject_reuseableSVGElementList.codeName = `${OriginalCodeName_reuseableSVGElementList}_variation`; // Append variation to original codeName
          // console.log('new check', currentVersion, currentVersion?.cachedobjectslog)
          // Find the object in cachedObjectsLog
          // let OriginalObject_cachedObjectsLog = cachedObjectsLog[currentSelectedSVG];

          // if (!OriginalObject_cachedObjectsLog) {
          //   console.error('Original object not found for codeName:', currentSelectedSVG);
          //   return;
          // }

        var APIprompt = ''
        var existingcode = svgcode

        APIprompt = 'Modify an existing svg code: '+existingcode+ ', make these modifications on specific svg elements: ' + modifyprompt +'. Do not include any background in generated svg. As long as the svg follows the description, make as little change as possible other than the specific svg elements mentioned above. Make sure donot include anything other than the svg code in your response.';                                

        console.log(APIprompt)

        try {
          await generatewithAPI(APIprompt, (content) => 
          {            
              var updatedcontent = content.slice();
              // Update the cloned object with the new SVG code
                clonedObject_reuseableSVGElementList.codeText = updatedcontent;

                // Replace or add the cloned object back to the reuseableSVGElementList
                var updatedVersion = {
                  ...currentVersion,
                  reuseableSVGElementList: [
                    ...currentVersion.reuseableSVGElementList.filter(item => item.codeName !== clonedObject_reuseableSVGElementList.codeName),
                    clonedObject_reuseableSVGElementList
                  ],
                  highlightedSVGPieceList: []
                };
                const newKey = `${currentSelectedSVG}_variation`;

                // const updatedCachedObjectsLog = {
                //   ...cachedObjectsLog,
                //   [newKey]: { ...OriginalObject_cachedObjectsLog, objname: newKey, svgcode: updatedcontent, templatecode: content } // Add or replace the 'newvariation' entry
                // };                
                
                // Update cachedobjectslog and reuseableSVGElementList again if necessary
                // updatedVersion = {
                //   ...updatedVersion, // Start with the previously updated version
                //   cachedobjectslog: updatedCachedObjectsLog,
                //   highlightedSVGPieceList: []
                // };

                // Store the updated cached objects back into sessionStorage
                // sessionStorage.setItem('cachedobjects', JSON.stringify(updatedCachedObjectsLog));

                setVersions(prevVersions => {
                  const updatedVersions = prevVersions.map(version => {
                    // Ensure `id` is always defined with a default value
                    const versionId = version.id ?? 'default-id'; // Provide a default value if `id` is undefined
                    
                    // If the versionId matches the currentVersionId, update the version
                    if (versionId === currentVersionId) {
                      return { ...updatedVersion, id: versionId }; // Use the updated version and ensure the id is set
                    }
                
                    // Otherwise, return the version unchanged but ensure the id is defined
                    return { ...version, id: versionId };
                  });
                
                  // Return the updated versions array
                  return updatedVersions;
                });
          });
        } catch (err) {
          console.log('err', err)
        }
    }

  const handlePromptChange = (pieceCodeName: string, prompt: string) => {
    setPiecePrompts(prevPrompts => ({
      ...prevPrompts,
      [pieceCodeName]: prompt,
    }));
    console.log('set prompts', prompt)
  };

  const handleDeleteObject = (versionId: string, codeName: string) => {
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version =>
        version.id === versionId
          ? { ...version, reuseableSVGElementList: version.reuseableSVGElementList.filter(element => element.codeName !== codeName) }
          : version
      );
      return updatedVersions;
    });
  };

  //annotated selected svg group
  const handleAnnotateGroup = async (groupNameInput: string, codeText: string) => {

    if (version.id === currentVersionId) {
      // var currentVersion = versions.find(version => version.id === currentVersionId);
      // console.log('check version', currentVersion)
      const AnnotatedPieces = currentVersion.highlightedSVGPieceList.map(piece => ({
        codeName: piece.codeText,
      }));

      const AnnotatedEntry = [{
        codeName: currentSelectedSVG,
        pieces: AnnotatedPieces.map(item => item.codeName),
        groupname: groupNameInput
      }];
      var annotated_prompt = 'Modify the following svg code: '+codeText
      // Filter the objects that match the given codeName
      AnnotatedEntry.forEach(obj => {
          if (true) {
              // Collect the groupname and corresponding pieces
              const group = obj.groupname;
              const pieces = obj.pieces.join(',');

              // Append to the prompt
              annotated_prompt += `Add annotations for specific elements to give them special names to be called as. \n Annotate ${pieces} as "${group}"; Don't change anything other than adding annotations. Only include the annotated svg code in your response.`;
          }
      });
      console.log('check annotation prompts', annotated_prompt)
      try {
        await generatewithAPI(annotated_prompt, (content) => saveForNew(content, 'annotation'));
      } catch (err) {
        console.log('err', err)
      }
      
    setVersions(prevVersions => {
      const updatedVersions = prevVersions.map(version => {
        const updatedHighlightedSVGPieceList = [];

        if (version.id === currentVersionId) {
          // var currentVersion = versions.find(version => version.id === currentVersionId);
          // console.log('check version', currentVersion)
          const AnnotatedPieces = currentVersion.highlightedSVGPieceList.map(piece => ({
            codeName: piece.codeText,
          }));
  
          const AnnotatedEntry = {
            codeName: currentSelectedSVG,
            pieces: AnnotatedPieces.map(item => item.codeName),
            groupname: groupNameInput
          };

          // Check if there's already an entry with the same codeName and groupname, and update or append a new one
          const existingAnnotatedPieceList = version.AnnotatedPieceList || [];
          const updatedAnnotatedPieceList = existingAnnotatedPieceList.filter(
            entry => !(entry.codeName === AnnotatedEntry.codeName && entry.groupname === AnnotatedEntry.groupname)
          );

          // Add the new AnnotatedEntry to the filtered list (overwriting any existing matching entry)
          updatedAnnotatedPieceList.push(AnnotatedEntry);        
          console.log('updating updatedAnnotatedPieceList', updatedAnnotatedPieceList)
          // updateobject_modifypieces(modifiedEntry, cachedObjects[currentSelectedSVG])
          return { ...version, highlightedSVGPieceList: updatedHighlightedSVGPieceList, AnnotatedPieceList: updatedAnnotatedPieceList};
        }
        return version;
      });
      return updatedVersions;
    });
    // console.log('check version', versions.find(version => version.id === currentVersionId))
  };
}
  //make use of svg str
  const saveForNew =(content: string, type: string)=>{
    console.log('returned svg:', content, type)
    // Clone the object from currentVersion or cachedObjectsLog based on currentSelectedSVG
    const currentVersion = versions.find(version => version.id === currentVersionId);
    // const cachedObjectsLog = JSON.parse(sessionStorage.getItem('cachedobjects')) || {};

    // Find the object in reuseableSVGElementList
    let OriginalObject_reuseableSVGElementList = currentVersion.reuseableSVGElementList.find(item => item.codeName === currentSelectedSVG);

    if (!OriginalObject_reuseableSVGElementList) {
      console.error('Original object not found for codeName:', currentSelectedSVG);
      return;
    }

    // Clone the original object and create a variation
    const clonedObject_reuseableSVGElementList = { ...OriginalObject_reuseableSVGElementList };
    const OriginalCodeName_reuseableSVGElementList = OriginalObject_reuseableSVGElementList.codeName;
    clonedObject_reuseableSVGElementList.codeName = `${OriginalCodeName_reuseableSVGElementList}_${type}`; // Append variation to original codeName
    var updatedcontent = content.slice();
    // Update the cloned object with the new SVG code
      clonedObject_reuseableSVGElementList.codeText = updatedcontent;

      // Replace or add the cloned object back to the reuseableSVGElementList
      var updatedVersion = {
        ...currentVersion,
        reuseableSVGElementList: [
          ...currentVersion.reuseableSVGElementList.filter(item => item.codeName !== clonedObject_reuseableSVGElementList.codeName),
          clonedObject_reuseableSVGElementList
        ],
        highlightedSVGPieceList: []
      };

      setVersions(prevVersions => {
        const updatedVersions = prevVersions.map(version => {
          // Ensure `id` is always defined with a default value
          const versionId = version.id ?? 'default-id'; // Provide a default value if `id` is undefined
          
          // If the versionId matches the currentVersionId, update the version
          if (versionId === currentVersionId) {
            return { ...updatedVersion, id: versionId }; // Use the updated version and ensure the id is set
          }
      
          // Otherwise, return the version unchanged but ensure the id is defined
          return { ...version, id: versionId };
        });
      
        // Return the updated versions array
        return updatedVersions;
      });
  }

  const copyContextToCode =()=>{
    var svgstring = JSON.stringify(showLocalSvgCodeText.toString())
    var newclasscode = 'var savedsvg = ' +svgstring+ '\n'+classcode.js
    setClassCode({js:newclasscode})
    console.log('current class code', classcode)
  }
    
  return (

    <div
      className="modify-obj-widget"
      style={{
        position: 'absolute',
        top: 450,
        left: 820,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        padding: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'row',
        fontSize: '14px',
        width: '100%',
        maxWidth: '500px',
      }}
    >
      {/* Left side for autocomplete options and large iframe preview */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginRight: '10px',
          width: '50%',
        }}
      >
        {/* Autocomplete options */}
        <div
          className="code-name-list"
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
            flexGrow: 1,
          }}
        >
          <ul className="autocomplete-options" style={{ margin: 0, padding: 0, listStyleType: 'none' }}>
            {currentreuseableSVGElementList.map((item, index) => (
              <li
                key={index}
                className="autocomplete-option"
                style={{
                  padding: '5px',
                  cursor: 'pointer',
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordWrap: 'break-word',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <button className="delete-icon"
                  style={{
                    marginLeft: '10px',
                    padding: '2px 5px',
                    fontSize: '10px',
                    color: 'black',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                    onClick={() => handleDeleteObject(currentVersionId, item.codeName)}>-
                </button>

                <span
                  style={{
                    width: '120px', // Fixed width
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginRight: '10px', // Add some margin to separate from the next element
                  }}
                >
                  {item.codeName}
                </span>

                {/* Render large SVG edit window */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenderSVGClick(item.codeName, item.codeText);
                  }}
                  style={{
                    width: '40px', // Match iframe width
                    height: '40px', // Match iframe height
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex', // Flexbox for centering content
                    alignItems: 'center', // Vertically center
                    justifyContent: 'center', // Horizontally center
                    padding: '0', // Remove padding to fit the iframe exactly
                  }}                  
                >
                {/* Render the small SVG preview */}
                <div style={{ width: '40px', height: '40px', border: 'none', pointerEvents: 'none' }}>
                <iframe
                  ref={(previewiframeRef) => {
                    if (previewiframeRef) {
                      // Render the specific item's codeText in its corresponding iframe
                      renderSVGInIframe({ current: previewiframeRef }, item.codeText);
                    }
                  }}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              {/* {{svg str edit window}} */}
              </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowSVGClick(item.codeName, item.codeText);
                  }}
                  style={{
                    marginLeft: '10px',
                    padding: '2px 5px',
                    fontSize: '10px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  SVG
                  Str+
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Large SVG edit window */}
        {svgCodeText && (
          <div style={{ marginTop: '10px' }}>
            <div
              style={{
                width: '100%',
                height: '200px',
                border: '1px solid #ccc',
              }}
            >
              {svgCodeText && (
                <iframe
                  ref={iframeRef}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          </div>
        )}
        {/* SVG str edit window */}
        {showsvgstr !== null && (
          <div className="svg-preview-container" style={{ flexGrow: 2, marginLeft: '10px' }}>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <textarea
                value={showLocalSvgCodeText} // Initialize the editable SVG code from showSvgCodeText
                onChange={(e) => {e.stopPropagation(); setShowLocalSvgCodeText(e.target.value)}}
                placeholder="Edit SVG Code"
                style={{
                  width: '100%',
                  height: '300px',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  marginBottom: '10px',
                }}
              />

              {/* Buttons for "Copy to Code" and "Save for New" */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={copyContextToCode}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Copy Context to Code
                </button>

                <button
                  onClick={()=>saveForNew(showLocalSvgCodeText, 'variation')}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Save for New
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side for rename, modify and annotate */}
      <div className="rename-modify-annotate-container" style={{ flexGrow: 2, marginLeft: '10px' }}>
        {/* Input for object name and buttons */}
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <input
            type="text"
            value={objNameInput}
            onChange={(e) => setObjNameInput(e.target.value)}
            placeholder="Object Name"
            style={{
              marginBottom: '10px',
              padding: '5px',
              width: '100%',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <button
            onClick={handleRenameObject}
            style={{
              padding: '5px 10px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '10px',
              width: '100%',
            }}
          >
            Rename Object
          </button>

          {/* Displaying buttons for highlighted SVG pieces */}
          <div style={{ marginTop: '10px', width: '100%' }}>
            {currentVersion?.highlightedSVGPieceList?.map((piece) => (
              <div key={piece.codeName} style={{ display: 'flex', marginBottom: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => handlePieceClick(piece.codeName)}
                  style={{
                    backgroundColor: currentPieceName === piece.codeName ? '#ccc' : '#f0f0f0',
                    border: '1px solid #ccc',
                    padding: '5px',
                    marginRight: '10px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                >
                  {piece.codeName}
                </button>
                <input
                  type="text"
                  value={piecePrompts[piece.codeName] || ''}
                  onChange={(e) => handlePromptChange(piece.codeName, e.target.value)}
                  placeholder="modify selected pieces"
                  style={{
                    marginBottom: '10px',
                    padding: '5px',
                    width: '100%',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Unified Modify and Apply buttons */}
          <button
            onClick={handleModifyPieces}
            style={{
              padding: '5px 10px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '10px',
              width: '100%',
            }}
          >
            Modify Pieces
          </button>
          <input
            type="text"
            // value={objNameInput}
            onChange={(e) => setGroupNameInput(e.target.value)}
            placeholder="annotate selected pieces"
            style={{
              marginBottom: '10px',
              padding: '5px',
              width: '100%',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <button
            onClick={() => handleAnnotateGroup(groupNameInput, initialSvgCodeText)}
            style={{
              padding: '5px 10px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '10px',
              width: '100%',
            }}
          >
            Annotate group
          </button>
        </div>
      </div>
    </div>
  );
};

  const CoordcompleteWidget = () => (
    <div
      ref={widgetRef}
      className="coordcomplete-widget"
      style={{
        position: 'absolute',
        top: CoordcompletePosition.top,
        left: CoordcompletePosition.left,
        zIndex: 1000,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        padding: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <ul className="coordcomplete-options" style={{ listStyleType: 'none', paddingLeft: 0 }}>
        {versions.find(version => version.id === currentVersionId)?.storedcoordinate && (
          <li
            className="coordcomplete-option"
            onClick={() => handleCoordcompleteOptionClick(
              `{x: ${Math.round(versions.find(version => version.id === currentVersionId)?.storedcoordinate.x)}, y: ${Math.round(versions.find(version => version.id === currentVersionId)?.storedcoordinate.y)}}`,
              hintKeywords
            )}
            style={{ padding: '5px', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          >
            {`{x: ${Math.round(versions.find(version => version.id === currentVersionId)?.storedcoordinate.x)}, y: ${Math.round(versions.find(version => version.id === currentVersionId)?.storedcoordinate.y)}}`}
          </li>
        )}
      </ul>
    </div>
  );
  
  const getCaretCoordinates = (element: HTMLTextAreaElement | null, position: number) => {
    if (!element) return { top: 0, left: 0 };
    const div = document.createElement('div');
    const style = getComputedStyle(element);
    [...style].forEach((prop) => {
      div.style.setProperty(prop, style.getPropertyValue(prop));
    });
    div.style.position = 'absolute';
    div.style.whiteSpace = 'pre-wrap';
    div.style.visibility = 'hidden';
    div.style.top = '0';
    div.style.left = '0';
    document.body.appendChild(div);
  
    const text = element.value.substring(0, position);
    div.textContent = text;
  
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);
  
    // Account for scrollTop and scrollLeft
    const coordinates = {
      top: span.offsetTop + element.getBoundingClientRect().top - element.scrollTop,
      left: span.offsetLeft + element.getBoundingClientRect().left - element.scrollLeft,
    };
  
    document.body.removeChild(div);
    return coordinates;
  };
  
  const renderEditor = () => {
    if (true) {
      return (
        <div style={{ 
          height: '600px', 
          width: '400px', 
          overflow: 'auto',
         }}>
        <CodeEditor
          value={userjs}
          language="js"
          padding={15}
          style={{
            fontSize: 15,
            backgroundColor: '#f5f5f5',
            fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            //this will do style conflict!
            // height: '100%',
            // overflow: 'auto',
          }}
          ref={editorRef}
          onChange={(evn) => setuserJs(evn.target.value)}
        />
        </div>
      );
    } 
    return null;
  };

  return (
    <div
      ref={codecomponentRef}
      className="code-editor"
      // onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
    >
      {loading && <div className="loading-container"><ReactLoading type="spin" color="#007bff" height={50} width={50} /></div>}
      {showModifyObjWidget && <ModifyObjWidget />}
      {showGenerateOption && optionLevels.length === 0 && <GenerateOptionWidget hintKeywords={hintKeywords} />}
      {showAutocomplete && optionLevels.map((level, index) => (
        <AutocompleteWidget key={index} options={level.options} levelIndex={index} />
      ))}
      {showCoordcomplete && <CoordcompleteWidget />}
      {/* {showCachedObjWidget && <CachedObjWidget currentVersionId={currentVersionId} versions={versions} />}
       */}
      <div>
      {renderEditor()}
      <button onClick={() => onRunUserCode({ js: userjs })}>Run User Code</button>
      </div> 
    </div>
  );
  
};

export default CustomCodeEditor;
