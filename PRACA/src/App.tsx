import React, { useState, useRef, useEffect } from 'react';
import CustomCodeEditor from './components/CodeEditor';
import ResultViewer from './components/ResultViewer';
import ClassEditor from './components/ClassEditor';
import {Version} from './types'
import './App.css';

const App: React.FC = () => {
  const [api_key, setApiKey] = useState('')
  const [llm, setLlm] = useState('Anthropic')
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [classcode, setClassCode] = useState<{ js: string }>({
    js: ``,
  });
  const [usercode, setUserCode] = useState<{ js: string }>({ js: '' });   // Initialize usercode
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const handleRunClassCode = () => {
    console.log('posting msg EXECUTE_CLASSCODE')
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'EXECUTE_CLASSCODE',
          classcode: classcode,
        },
        '*'
      );
    }
  };
    
  const handleRunUserCode = (newuserCode: { js: string },) => {
    console.log('clicked', currentVersionId, iframeRef.current?.contentWindow)
    if (currentVersionId === null) return;
    setVersions((prevVersions) => {
      const updatedVersions = prevVersions.map(version =>
        version.id === currentVersionId
          ? { ...version, usercode: newuserCode, highlightedSVGPieceList: []}
          : version
      );
      return updatedVersions;
    });
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'EXECUTE_USERCODE',
          usercode: newuserCode.js,
        },
        '*'
      );
    }
    console.log('posted EXECUTE_USERCODE')
  };

  const updateAPIKey = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('set key')
    setApiKey(event.target.value);
  };

  const onLLMChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Implement the logic for changing LLM
    console.log('set llm')
    setLlm(event.target.value)
  };

  useEffect(() => {
    console.log('useEffect loading user and classcode');
    const fetchCode = async () => {
      try {
        // Fetch classcode.js
        const classcodeResponse = await fetch('/classcode.js');
        const classcodeData = await classcodeResponse.text();
        setClassCode({ js: classcodeData });
        console.log('classcode.js loaded', classcodeData);
  
        // Fetch usercode.js
        const usercodeResponse = await fetch('/usercode.js');
        const usercodeData = await usercodeResponse.text();
        setUserCode({ js: usercodeData });
        console.log('usercode.js loaded', usercodeData);
  
        // Now that both fetches are complete, create baseVersion
        const baseVersion: Version = {
          id: 'init',
          description: "",
          savedOldDescription: '', 
          backendcode: {html: ``},
          usercode: { js: usercodeData }, // Use fetched data directly
          savedOldCode: { html: '', css: '', js: '' },
          keywordTree: [
            { level: 1, keywords: [] },
            { level: 2, keywords: [] },
          ],
          wordselected: 'ocean',
          highlightEnabled: false,
          loading: false,
          piecesToHighlightLevel1: [],
          piecesToHighlightLevel2: [],
          showDetails: {},
          latestDescriptionText: '', 
          hiddenInfo: [],
          formatDescriptionHtml:'',
          specificParamList: [],
          paramCheckEnabled: false,
          reuseableSVGElementList: [],
          highlightedSVGPieceList: [],
          AnnotatedPieceList: [],
          modifyPieceList: []
        };
  
        setVersions([baseVersion]);
        setCurrentVersionId(baseVersion.id);
      } catch (error) {
        console.error('Error loading code files:', error);
      }
    };
  
    fetchCode();
  }, []);
  

  return (
    <div className="App">
      <div className="editor-section">
        {currentVersionId !== null && versions.find(version => version.id === currentVersionId) && (
          <>
  
            <div className="class-editor-container">
                          {/* Make this section small and place it on top of ClassEditor */}
            <div className="header-container">
              <h1 className="small-title">Generator</h1>
              <label htmlFor="api-key" className="small-label">API Key:</label>
              <input 
                type="text" 
                id="api-key" 
                name="api-key" 
                value={api_key} 
                onChange={updateAPIKey}
                className="small-input"
              />
              <select id="llm" name="llm" onChange={onLLMChange} className="small-select">
                <option value="Anthropic">Anthropic</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Groq">Groq</option>
              </select>
            </div>
              <ClassEditor 
                api_key={api_key}
                currentVersionId={currentVersionId}
                versions={versions}
                setVersions={setVersions}
                classcode={classcode} 
                setClassCode={setClassCode}
                onRunClassCode={handleRunClassCode} // Pass the handler
              />
            </div>
  
            <div className="code-editor-container">
              <CustomCodeEditor
                classcode={classcode}
                setClassCode={setClassCode}
                api_key={api_key}
                usercode={versions.find(version => version.id === currentVersionId)!.usercode}
                currentVersionId={currentVersionId}
                versions={versions}
                setVersions={setVersions}
                onRunUserCode={handleRunUserCode} // Pass the handler
              />
            </div>
  
            <ResultViewer  
              usercode={versions.find(version => version.id === currentVersionId)!.usercode}
              api_key = {api_key}
              llm = {llm}
              classcode={classcode} // Pass classcode to ResultViewer 
              currentVersionId={currentVersionId}
              versions={versions}
              setVersions={setVersions}
              iframeRef={iframeRef}
            />
          </>
        )}
      </div>
    </div>
  );
  
}
  
export default App;


