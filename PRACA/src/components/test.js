if(this.modifyobj.objname){
  console.log('modify obj')
  const codename = this.modifyobj.objname
  const codelist = window.currentreuseableSVGElementList
  console.log('check codelist in ref', codelist)
  var existingcode = codelist.find((item) => item.codeName === codename)?.codeText;
  console.log('draw with ref code:', existingcode)
  // for abstract parameters
  window.parent.postMessage({ type: 'GET_AnnotatedPieceList' }, '*');
  (async function () {
    console.log('Waiting for RETURN_AnnotatedPieceList event...');
    
    window.cachedobjects = {}; // Declare as a reference to be assigned
  
    // Wait for the cachedobjectsRef to be provided by the parent (React app)
    await new Promise((resolve) => {
      const messageHandler = (event) => {
        if (event.data.type === 'RETURN_AnnotatedPieceList') {
          console.log('Received AnnotatedPieceList from parent:', event.data.currentAnnotatedPieceList);
          resolve();
        }
      };
  
      // Keep listening for the CACHEDOBJECT_LOADED event
      window.addEventListener('message', messageHandler);
    });
  })

  var abstract_param_prompt = 'Also, '
  if(this.abstract_params.length >0){
    this.abstract_params.forEach((abstract_param, index) => {
        const param_content = abstractparameterContents[index];
        abstract_param_prompt += `for ` +  abstract_param + ` , make it ` + param_content+`; `;
    });
    console.log('check abstract_param_prompt', abstract_param_prompt)
  }

        //have params
        if(this.parameters.length >0){
      existingcode = window.cachedobjects[codename].template.templatecode
        APIprompt = `you will be given an svg template code generated by this rule: write me svg code to create a svg image of ` + this.basic_prompt +`. Make the svg image as detailed as possible and as close to the description as possible.  
    Furthermore, process the generated svg code into a svg code template, with the given a list of parameter names, make the returned svg code a template with certain parameters as text placeholders made by {parameter name}. 
    For example, parameter list: roof height, window color; resulting svg template:
    <svg viewBox="0 0 200 200">
    <rect x="50" y="70" width="100" height="80" fill="brown" /> <!-- House body -->
    <polygon points="50,70 100,{roof height} 150,70" fill="red" /> <!-- Roof -->
    <rect x="65" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 1 -->
    <rect x="115" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 2 -->
    <rect x="90" y="120" width="20" height="30" fill="black" /> <!-- Door -->
    </svg>.
    
    Notice that only one parameter name and nothing else can be inside {}. Replace the whole parameter (e.g., fill = "#e0d0c0" to fill = "{parameter name}") instead of just part of it (e.g., fill = "#e0d0c0" to fill = "#{parameter name}"). Return svg code template for this parameter list:` + this.parameters.join(', ')+`. Do not include any background in generated svg. 
    The svg code template must be able to satify the requirements of the parameters by simply replacing the placeholders, instead of other manual modifications (e.g., 'window number' can be modified by simply replacing {window number} to some data, instead of needing to repeat window element manually)
    Make sure donot include anything other than the final svg code template in your response.
    This is the svg template code generated by the above rule: `+ existingcode
  
    +`Now, you are going to modify the above given svg template to make it satisfy this new description: `+ this.basic_prompt +
    `, and these these new parameters:`+ this.parameters.join(', ')+`. As long as the original svg template follows the new requirements, make as little change as possible. Make sure donot include anything other than the svg template code in your response
    `
      }
        //no params
        else{
          APIprompt = 'write me an updated svg code basing on this existing code: '+existingcode+ ' and description: ' + this.basic_prompt + '. If the existing code conforms to the description, return the same code without change; Otherwise, return the code slightly updated according to the existing description. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.';

        }
  }

else{
  console.log('no existing code', this.parameters, this.abstract_params)
  var abstract_param_prompt = 'Also, '
  if(this.abstract_params.length >0){
    this.abstract_params.forEach((abstract_param, index) => {
        const param_content = abstractparameterContents[index];
        abstract_param_prompt += `for ` +  abstract_param + ` , make it ` + param_content+`; `;
    });
    console.log('check abstract_param_prompt', abstract_param_prompt)
  }

  if(this.parameters.length >0){
    APIprompt = `write me svg code to create a svg image of ` + this.basic_prompt +`. ` +abstract_param_prompt+`Make the svg image as detailed as possible and as close to the description as possible.  
    Furthermore, process the generated svg code into a svg code template, with the given a list of parameter names, make the returned svg code a template with certain parameters as text placeholders made by {parameter name}. 
    For example, parameter list: roof height, window color; resulting svg template:
    <svg viewBox="0 0 200 200">
    <rect x="50" y="70" width="100" height="80" fill="brown" /> <!-- House body -->
    <polygon points="50,70 100,{roof height} 150,70" fill="red" /> <!-- Roof -->
    <rect x="65" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 1 -->
    <rect x="115" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 2 -->
    <rect x="90" y="120" width="20" height="30" fill="black" /> <!-- Door -->
    </svg>.
    
    Notice that only one parameter name and nothing else can be inside {}. Replace the whole parameter (e.g., fill = "#e0d0c0" to fill = "{parameter name}") instead of just part of it (e.g., fill = "#e0d0c0" to fill = "#{parameter name}"). Return svg code template for this parameter list:` + this.parameters.join(', ')+`. Do not include any background in generated svg. 
    The svg code template must be able to satify the requirements of the parameters by simply replacing the placeholders, instead of other manual modifications (e.g., 'window number' can be modified by simply replacing {window number} to some data, instead of needing to repeat window element manually)
    Make sure donot include anything other than the final svg code template in your response.`;
  }
  else{
    APIprompt = 'write me svg code to create a svg image of ' + this.basic_prompt +`. `+abstract_param_prompt+`Make the svg image as detailed as possible and as close to the description as possible. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.`;
  }
}

if (event.data.type === 'GET_AnnotatedPieceList') {
  console.log('GET_AnnotatedPieceList returning', versions.find(version => version.id === currentVersionId)?.AnnotatedPieceList)
  const currentAnnotatedPieceList = versions.find(version => version.id === currentVersionId)?.AnnotatedPieceList;
  if (currentAnnotatedPieceList) {
    iframeRef.current.contentWindow.postMessage(
      {
        type: 'RETURN_AnnotatedPieceList',
        currentAnnotatedPieceList: currentAnnotatedPieceList,
      },
      '*'
    );
    console.log('GET_AnnotatedPieceList returned')
  }
}

async draw(abstractparameterContents = []) {
  console.log('object draw called, check rule', this);

    var APIprompt = '';

    if(this.modifyobj.objname){
      console.log('modify obj')
      const codename = this.modifyobj.objname
      const codelist = window.currentreuseableSVGElementList
      console.log('check codelist in ref', codelist)
      var existingcode = codelist.find((item) => item.codeName === codename)?.codeText;
      console.log('draw with ref code:', existingcode)

    
            console.log('modifyobj-no piece')
            //have params
        if(this.parameters.length >0){
          existingcode = window.cachedobjects[codename].template.templatecode
            APIprompt = `you will be given an svg template code generated by this rule: write me svg code to create a svg image of ` + this.basic_prompt +`. Make the svg image as detailed as possible and as close to the description as possible.  
            Furthermore, process the generated svg code into a svg code template, with the given a list of parameter names, make the returned svg code a template with certain parameters as text placeholders made by {parameter name}. 
            For example, parameter list: roof height, window color; resulting svg template:
            <svg viewBox="0 0 200 200">
            <rect x="50" y="70" width="100" height="80" fill="brown" /> <!-- House body -->
            <polygon points="50,70 100,{roof height} 150,70" fill="red" /> <!-- Roof -->
            <rect x="65" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 1 -->
            <rect x="115" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 2 -->
            <rect x="90" y="120" width="20" height="30" fill="black" /> <!-- Door -->
            </svg>.
            
            Notice that only one parameter name and nothing else can be inside {}. Replace the whole parameter (e.g., fill = "#e0d0c0" to fill = "{parameter name}") instead of just part of it (e.g., fill = "#e0d0c0" to fill = "#{parameter name}"). Return svg code template for this parameter list:` + this.parameters.join(', ')+`. Do not include any background in generated svg. 
            The svg code template must be able to satify the requirements of the parameters by simply replacing the placeholders, instead of other manual modifications (e.g., 'window number' can be modified by simply replacing {window number} to some data, instead of needing to repeat window element manually)
            Make sure donot include anything other than the final svg code template in your response.
            This is the svg template code generated by the above rule: `+ existingcode
          
            +`Now, you are going to modify the above given svg template to make it satisfy this new description: `+ this.basic_prompt +
            `, and these these new parameters:`+ this.parameters.join(', ')+`. As long as the original svg template follows the new requirements, make as little change as possible. Make sure donot include anything other than the svg template code in your response
            `
        }
        //no params
        else{
          APIprompt = 'write me an updated svg code basing on this existing code: '+existingcode+ ' and description: ' + this.basic_prompt + '. If the existing code conforms to the description, return the same code without change; Otherwise, return the code slightly updated according to the existing description. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.';

        }
    }

      else{
        console.log('no existing code', this.parameters, this.abstract_params)
        var abstract_param_prompt = 'Also, '
        if(this.abstract_params.length >0){
          this.abstract_params.forEach((abstract_param, index) => {
              const param_content = abstractparameterContents[index];
              abstract_param_prompt += `for ` +  abstract_param + ` , make it ` + param_content+`; `;
          });
          console.log('check abstract_param_prompt', abstract_param_prompt)
        }

        if(this.parameters.length >0){
          APIprompt = `write me svg code to create a svg image of ` + this.basic_prompt +`. ` +abstract_param_prompt+`Make the svg image as detailed as possible and as close to the description as possible.  
          Furthermore, process the generated svg code into a svg code template, with the given a list of parameter names, make the returned svg code a template with certain parameters as text placeholders made by {parameter name}. 
          For example, parameter list: roof height, window color; resulting svg template:
          <svg viewBox="0 0 200 200">
          <rect x="50" y="70" width="100" height="80" fill="brown" /> <!-- House body -->
          <polygon points="50,70 100,{roof height} 150,70" fill="red" /> <!-- Roof -->
          <rect x="65" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 1 -->
          <rect x="115" y="90" width="20" height="20" fill="{window color}" /> <!-- Window 2 -->
          <rect x="90" y="120" width="20" height="30" fill="black" /> <!-- Door -->
          </svg>.
          
          Notice that only one parameter name and nothing else can be inside {}. Replace the whole parameter (e.g., fill = "#e0d0c0" to fill = "{parameter name}") instead of just part of it (e.g., fill = "#e0d0c0" to fill = "#{parameter name}"). Return svg code template for this parameter list:` + this.parameters.join(', ')+`. Do not include any background in generated svg. 
          The svg code template must be able to satify the requirements of the parameters by simply replacing the placeholders, instead of other manual modifications (e.g., 'window number' can be modified by simply replacing {window number} to some data, instead of needing to repeat window element manually)
          Make sure donot include anything other than the final svg code template in your response.`;
        }
        else{
          APIprompt = 'write me svg code to create a svg image of ' + this.basic_prompt +`. `+abstract_param_prompt+`Make the svg image as detailed as possible and as close to the description as possible. Do not include any background in generated svg. Make sure donot include anything other than the svg code in your response.`;
        }
      }

    console.log('api prompt', APIprompt);
    console.log(this.ngrok_url_sonnet);

    try {
      const response = await axios.post(this.ngrok_url_sonnet, {
        prompt: APIprompt
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      const content = data?.content;
      console.log('Content from API call:', content);

      if (content) {
        // const svgElement = this.createSVGElement(content, coord, canvas.offsetWidth, canvas.offsetHeight, scale);
        // canvas.appendChild(svgElement);
        // console.log('svgElement is', svgElement);
        // return svgElement;
        return content
      }
    } catch (error) {
      console.error('Error drawing the shape:', error);
    }                          
  }                         
}