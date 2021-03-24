
const font ='20px "Times New Roman", serif';
var running = false;
var hideEmission = false;
var modelPanel;

function exportLatex(){
	var exporter = new ExportAsLaTeX();
	var oldSelectedObject = selectedObj;
	selectedObj = null;
	refreshComponents(exporter);
	selectedObj = oldSelectedObject;
	var texData = exporter.toLaTeX();
	download("Model.tex",texData);
}


function toggleAccordion(component){
    var panel = component.nextElementSibling;

     if (panel.style.maxHeight) {
        closeAccordion(component);
     } else {
        openAccordion(component);
     }
    try { // If there isnt an element in the position im checking then nothing needs to be done.
        if (component.parentElement.parentElement.previousElementSibling.className.includes('accordion')){
            component.parentElement.parentElement.style.maxHeight = component.parentElement.parentElement.scrollHeight +  panel.scrollHeight + "px";
        }
    } catch (err){
        // will be a NPE 
        console.log(err)
    }
    
}

function refreshAccordion(panel){
    panel = (panel)? panel : document.getElementById("statePanelInfo");
    if (panel.style.maxHeight){
        var informationPanel = document.getElementById("informationPanel");
        if(panel.id == "statePanelInfo"){
            informationPanel.scrollHeight
            closeAccordion(document.getElementById("sTransitionBtn"));
            panel.style.maxHeight =  window.innerHeight - (informationPanel.scrollHeight)+ "px";
            openAccordion(document.getElementById("sTransitionBtn"));
            // setTimeout("refreshAccordion()",200);
            return;
        }
        if (informationPanel.scrollHeight + panel.scrollHeight > window.innerHeight){
            panel.style.maxHeight =  window.innerHeight - informationPanel.scrollHeight + "px";
            panel.style.overflow = "auto";
        } else {
            panel.style.maxHeight = panel.scrollHeight + "px";

        }
    }
}

//pass the button that controles the accordion
function openAccordion(component){
    
    var panel = component.nextElementSibling;
    component.classList.add("active");
    if (!panel.style.maxHeight){
        refreshInfoPanels();
        var informationPanel = document.getElementById("informationPanel");
        if(component.id == "stateButton"){
            informationPanel.scrollHeight
            closeAccordion(document.getElementById("sTransitionBtn"));
            panel.style.maxHeight =  window.innerHeight - (informationPanel.scrollHeight)+ "px";
            // openAccordion(document.getElementById("sTransitionBtn"));
            setTimeout("openAccordion(document.getElementById(\"sTransitionBtn\"))",50);
            return;
        }
        if (informationPanel.scrollHeight + panel.scrollHeight > window.innerHeight){
            panel.style.maxHeight =  window.innerHeight - informationPanel.scrollHeight + "px";
            panel.style.overflow = "auto";
        } else {
            panel.style.maxHeight = panel.scrollHeight + "px";

        }


        
    } else {
        // refreshAccordion(panel);
    }
}

function closeAccordion(component){
    component.classList.remove("active");
    if (component.nextElementSibling.style.maxHeight){
        component.nextElementSibling.style.maxHeight = null;
        if(component.id == "stateButton"){
            closeAccordion(document.getElementById("sTransitionBtn"));
        }
        setTimeout("refreshInfoPanels()",200);
    }
}

function openAlgPanel(){
    var div = document.getElementById("algDiv");
    div.style.maxWidth = '100%';
    div.style.maxHeight = '100%';
    var outerDiv = document.getElementById("outerAlgDiv");
    outerDiv.style.maxWidth = '94px';
    outerDiv.style.overflowY = 'auto';
    document.getElementById("closeBtn").innerHTML = "&lt;"
    document.getElementById("algInput").style.maxWidth = '100%';
    setTimeout("document.getElementById('algDiv').style.overflow = 'initial';",1000);
}

function closeAlgPanel(){
    var div = document.getElementById("algDiv");
    div.style.maxWidth = '0%';
    div.style.HeightWidth = '0%';
    div.style.overflow = 'hidden';
    document.getElementById("outerAlgDiv").style.overflowY = 'hidden';
    document.getElementById("algInput").style.maxWidth = 0;
    document.getElementById("closeBtn").innerHTML = "&gt;"

}

function setModelHMM(){
    model = new HiddenMarkovModel();
    document.getElementById("markovChainBtn").disabled = false;
    document.getElementById("hiddenMarkovModelBtn").disabled = true;
    document.getElementById("emissionHide").disabled = false;
    document.getElementById("outerAlgDiv").style.display = null;
    initModelUI();
}

function setModelMC(){
    model = new MarkovChain();
    document.getElementById("markovChainBtn").disabled = true;
    document.getElementById("hiddenMarkovModelBtn").disabled = false;
    document.getElementById("emissionHide").disabled = true;
    document.getElementById("outerAlgDiv").style.display = 'none';
    initModelUI();

}

window.onload = function() {
    initCanvas();
    initModelUI();
    
    document.getElementById("emissionHide").disabled = true;

    var acc = document.getElementsByClassName("accordion");
    var i;

    for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            toggleAccordion(this);
        });
    }

    document.getElementById("emissionHide").addEventListener("change", function(){
        hideEmission = this.checked;
        refreshComponents();
    })

    // buttons
    document.getElementById("saveBtn").addEventListener("click", function() {
        save();
    });
    document.getElementById("loadBtn").addEventListener("click", function() {
        load();
    });
    document.getElementById("loadInput").addEventListener("change" , function() {
        loadfile();
    });
    document.getElementById("clearBtn").addEventListener("click", function() {
        clear();
    });
    document.getElementById("runBtn").addEventListener("click",  function() {
        run(document.getElementById("stepSpeed").value,document.getElementById("stepCount").value); //TODO
    });
    document.getElementById("testBtn").addEventListener("click",  function() {
        test();
    });
    document.getElementById("exportBtn").addEventListener("click", function() {
        exportLatex();
    });

    document.getElementById("markovChainBtn").disabled = true;
    document.getElementById("markovChainBtn").addEventListener("click", function(){
        setModelMC();
    });
    document.getElementById("hiddenMarkovModelBtn").addEventListener("click", function(){
        setModelHMM();
    });

    // State details
    var stateName = document.getElementById("sNameText");
    stateName.addEventListener('input', function(e){
        if (selectedObj instanceof State){
            selectedObj.text = this.value;
            refresh();
        }
    });

    var stateEmission = document.getElementById("sEmissionText");
    stateEmission.addEventListener('input', function(e){
        if (selectedObj instanceof State){
            selectedObj.emission = model.validateEmission(this.value);
            refresh();
        }
    });

    var stateInitProb = document.getElementById("sInitalProability");
    stateInitProb.addEventListener('input', function(e){
        if (selectedObj instanceof State){
            model.initialProbabilityDistribution[selectedObj.id] = model.validateProbability(this.value);
            refresh();
        }
    });

    var AlgButton = document.getElementById("algButton");
    AlgButton.addEventListener("click", function() {
        if (!model.validCheck()) { 
            var output = document.getElementById('outputString');
            output.innerHTML = "There are unresolved errors";
            refreshInfoPanels();
            var panel = document.getElementById("errorPanelInfo");
            panel.style.maxHeight = panel.scrollHeight + "px";
            document.getElementById("errorButton").classList.add("active");
            return;
        }
        model.algStep(document.getElementById("algorithmDropdown").value);
        refresh();
    });

    var obserevedString = document.getElementById("algString");
    obserevedString.addEventListener('input', function(e){
        var obsStr = model.validateObs(obserevedString.value);
        obserevedString.value = obsStr;
        refresh();
    });

    var dropdown = document.getElementById("algorithmDropdown");
    dropdown.onchange = function() {
        model.clearAlgProsessor();
        model.algProsessor.type = dropdown.value;
        setAlgDescription(dropdown.value);
    };

    var varDropdown = document.getElementById("algVarDropdown");
    varDropdown.onchange = function() {
        refreshInfoPanels();
    };

    document.getElementById("closeBtn").addEventListener("click" , function(){
        if (algFlag){
            return;
        } else {
            algFlag = true;
            setTimeout("algFlag = false;",1000);
        }
        var div = document.getElementById("algDiv");
        if (div.clientWidth > 0 ){
            closeAlgPanel();
        } else {
            div.style.maxWidth = '100%';
            document.getElementById("algInput").style.maxWidth = '100%';
            document.getElementById("outerAlgDiv").style.overflowY = 'auto';
            document.getElementById("closeBtn").innerHTML = "&lt;"
            div.style.maxHeight = '100%';
            setTimeout("document.getElementById('algDiv').style.overflow = 'initial';",1000);
        }
    });

}

var algFlag = false;

test = function(){
    var w = canvas.width;
    var h = canvas.height;

    if (model instanceof HiddenMarkovModel){
        var s1 = model.addState(w/3,h/3);
        s1.text = "H";
        model.initialProbabilityDistribution[s1.id] = "0.6";
        var s2 = model.addState(2*w/3,h/3);
        s2.text = "F";
        model.initialProbabilityDistribution[s2.id] = "0.4";

        var es1 =  model.addEmissionState(w/4,11*h/18);
        es1.text = "N";
        es1.emission = "N";
        var es2 =  model.addEmissionState(w/2,13*h/18);
        es2.text = "C";
        es2.emission = "C";
        var es3 =  model.addEmissionState(3*w/4,11*h/18);
        es3.text = "D";
        es3.emission = "D";


        model.addTransistion(new TempLink(s1,{x : s2.x, y :s2.y})).text = "0.3";
        model.addTransistion(new TempLink(s2,{x : s1.x, y :s1.y})).text = "0.4";
        model.addTransistion(new TempLink(s2,{x : s2.x, y :s2.y})).text = "0.6";
        model.addTransistion(new TempLink(s1,{x : s1.x-1, y :s1.y})).text = "0.7";

        
        var le1 =  model.addTransistion(new TempLink(s1,{x : es1.x, y :es1.y})).text = "0.5";
        var le2 =  model.addTransistion(new TempLink(s1,{x : es2.x, y :es2.y})).text = "0.4";
        var le3 =  model.addTransistion(new TempLink(s1,{x : es3.x, y :es3.y})).text = "0.1";

        
        var le4 =  model.addTransistion(new TempLink(s2,{x : es1.x, y :es1.y})).text = "0.1";
        var le5 =  model.addTransistion(new TempLink(s2,{x : es2.x, y :es2.y})).text = "0.3";
        var le6 =  model.addTransistion(new TempLink(s2,{x : es3.x, y :es3.y})).text = "0.6";

    } else {
        var s1 = model.addState(w/3,h/3);
        s1.text = "H";
        s1.emission = "H";
        model.initialProbabilityDistribution[s1.id] = "0.6";
        var s2 = model.addState(2*w/3,h/3);
        s2.text = "F";
        s2.emission = "F";
        model.initialProbabilityDistribution[s2.id] = "0.4";

        model.addTransistion(new TempLink(s1,{x : s2.x, y :s2.y})).text = "0.3";
        model.addTransistion(new TempLink(s2,{x : s1.x, y :s1.y})).text = "0.4";
        model.addTransistion(new TempLink(s2,{x : s2.x, y :s2.y})).text = "0.6";
        model.addTransistion(new TempLink(s1,{x : s1.x-1, y :s1.y})).text = "0.7";

    }

    refresh();
}

clear = function(){
    if (model instanceof HiddenMarkovModel){
        model = new HiddenMarkovModel();
    } else if (model instanceof MarkovChain){
        model = new MarkovChain();
    }

    refresh();
    var algStr = document.getElementById("algString");
    algStr.disabled = false;
    algStr.value = "";
    model.clearAlgProsessor();
    model.algProsessor.type = document.getElementById("algorithmDropdown").value;

    selectedObj = null;
    currentEmission = null;
}

run = function(steps,time){
    if (running){
        selectedObj = null;
        currentEmission = null;
        resetCaret();
        running = false;
        return;
    }
    var output = document.getElementById('outputString');
    if (!model.validCheck()) { 
        output.innerHTML = "There are unresolved errors";
        refreshInfoPanels();
        var panel = document.getElementById("errorPanelInfo");
        panel.style.maxHeight = panel.scrollHeight + "px";
        document.getElementById("errorButton").classList.add("active");
        return;
    }


    if (steps < 1 || steps == null) { output.innerHTML = ""; return; }
    model.init();
    selectedObj = null;
    clearInterval(caretTimer);
    caretVisible = false;
    running = true;
    step();


    if (tempInitial){
        model.initialProbabilityDistribution = {};
        tempInitial = false;
    }
}

var currentEmission = null;
function step() {
    if (!running){
        return;
    }
    
    var time = document.getElementById("stepSpeed").value;
    var steps = document.getElementById("stepCount").value;
    if (selectedObj == null){
        selectedObj = model.states[model.processor.currentState]; //init state
        if (model instanceof HiddenMarkovModel) {currentEmission = model.processor.emissionState}
    } else if (selectedObj instanceof State){
        model.step();
        selectedObj = model.transitions[selectedObj.id][model.processor.currentState];
        currentEmission = null;
    } else if (selectedObj instanceof StationaryLink){
        selectedObj = model.states[model.processor.currentState];
        if (model instanceof HiddenMarkovModel) {currentEmission = model.processor.emissionState}
        document.getElementById('outputString').innerHTML = model.processor.outPut;
    }
    refresh();
    if (model.processor.outPutLength > steps){
        selectedObj = null;
        currentEmission = null;
        resetCaret();
        
        running = false;
    } else {
        setTimeout(step, (1/time)*10000);
    }
}


function label(str,colour){
    var style =  (colour != null)?"style=\"color:" + colour + "\"":""
    return "<label "+ style + ">" + str + "</label>";}
function input(str,id){return "<input id=\"" + id + "\"  value=\"" + str + "\" oninput=\"trasitionChange('"+id+"',this)\">";}

function trasitionChange(stateB,comp){
    var str = model.validateProbability(comp.value);
    if (str != ""){
        if (model.transitions[selectedObj.id][stateB] == null){
            var state = model.getState(stateB);
            model.addTransistion(new TempLink(selectedObj,{x : state.x, y : state.y})).text = str;
        } else {
            model.transitions[selectedObj.id][stateB].text = str;
        }
    } else {
        if (model.transitions[selectedObj.id][stateB] != null){
            model.delete(model.transitions[selectedObj.id][stateB]);
        }
    }
    comp.value = str;
    refreshComponents();
    
}

function refreshInfoPanels(){

    var sIDText = document.getElementById("sIDText");
    var sNameText = document.getElementById("sNameText");
    var sEmissionText = document.getElementById("sEmissionText");
    var sInitalProability = document.getElementById("sInitalProability");
    var sTransitionForm = document.getElementById("sTransitionForm");

    if (selectedObj instanceof LatentState){
        document.getElementById("sEmission").style.display = "none";
    } else { document.getElementById("sEmission").style.display = "";}

    document.getElementById("sEmission").style.display = (selectedObj instanceof LatentState)? "none" : "";
    document.getElementById("sInital").style.display = (selectedObj instanceof EmissionState)? "none" : "";
    document.getElementById("sTransition").style.display = (selectedObj instanceof EmissionState)? "none" : "";

    if (selectedObj instanceof State && !running){
        sIDText.value = selectedObj.id;
        sNameText.value = selectedObj.text;
        sEmissionText.value = selectedObj.emission;
        sInitalProability.value = model.initialProbabilityDistribution[selectedObj.id];
       
        var transStr = "";
        for (var i in model.states){
            if(!model.transitions[selectedObj.id]){model.transitions[selectedObj.id] = []};
            transStr += p(label((model.states[i].text == "")?i:model.states[i].text) + input((model.transitions[selectedObj.id][i] == null)? "" :model.transitions[selectedObj.id][i].text,i));
        }
        if (model instanceof HiddenMarkovModel){
            if(!model.transitions[selectedObj.id]){model.transitions[selectedObj.id] = []};
            for (var i in model.emissionStates){
                transStr += p(label((model.emissionStates[i].text == "")?i:model.emissionStates[i].text,"red") + input((model.transitions[selectedObj.id][i] == null)? "" :model.transitions[selectedObj.id][i].text,i));
            }
        }
        sTransitionForm.innerHTML = transStr;
    } else {
        sIDText.value = null;
        sNameText.value = null;
        sEmissionText.value = null;
        sInitalProability.value = null;
        sTransitionForm.innerHTML = "";
    }
    

    // model panel

    var stateStr = "{";
    for (i in model.states){ stateStr += model.states[i].text + ','; }
    stateStr = (stateStr == "{")? stateStr : stateStr.substr(0, stateStr.length - 1);
    stateStr += "}";
    document.getElementById("mStatesText").innerHTML = stateStr;

    
    var transStr = "{";
    for (i in model.states){
        transStr += "{";
        for (j in model.states){
            if (model.transitions[i][j] == null || model.transitions[i][j].text == ''){
                transStr += '0';
            } else {
                transStr += model.transitions[i][j].text;
            }
            transStr += ',';
        }
        transStr += "},<br>"; //TODO not what i want but good enough for rn.
    }
    transStr = (transStr == "{")? transStr : transStr.substr(0, transStr.length-5);
    transStr += "}";
    document.getElementById("mTransitions").innerHTML = transStr;

    var initStr = "{";
    for (i in model.states){
        if (model.initialProbabilityDistribution[model.states[i].id] == null){
            initStr += '0';
        } else {
            initStr += model.initialProbabilityDistribution[model.states[i].id];
        }
        initStr += ','
    }
    initStr = (initStr == "{")? initStr : initStr.substr(0, initStr.length - 1);
    initStr += "}";
    document.getElementById("mInitalProability").innerHTML = initStr;

    //mEmissionStates
    if (model instanceof HiddenMarkovModel){
        var emStateStr = "{";
        for (i in model.emissionStates){ emStateStr += model.emissionStates[i].text + ','; }
        emStateStr = (emStateStr == "{")? emStateStr : emStateStr.substr(0, emStateStr.length - 1);
        emStateStr += "}";
        document.getElementById("mEmissionStates").innerHTML = emStateStr;
    
        var emissionString = "{";
        for (i in model.states){
            emissionString += "{";
            for (j in model.emissionStates){
                if (model.transitions[i][j] == null || model.transitions[i][j].text == ''){
                    emissionString += '0';
                } else {
                    emissionString += model.transitions[i][j].text;
                }
                emissionString += ',';
            }
            emissionString += "},<br>"; //TODO not what i want but good enough for rn.
        }
        emissionString = (emissionString == "{")? emissionString : emissionString.substr(0, emissionString.length-5);
        emissionString += "}";
        document.getElementById("mEmissionProbaility").innerHTML = emissionString;
    }
    

    
    panel = document.getElementById("modelPanelInfo");
    if (panel.style.maxHeight){
        panel.style.maxHeight = panel.scrollHeight + "px";
    }

    var errors = "";
    for (i in model.processor.errors){
        errors += "ERROR : " + model.processor.errors[i] + "<br>";
    }
    for (i in model.processor.warnings){
        errors += "WARNING : " + model.processor.warnings[i] + "<br>";
    }

    document.getElementById("errorPanelInfo").innerHTML = errors;


    // table :
    var str = document.getElementById("algString").value;
    if (str == ""){ 
        str = model.algProsessor.getObserevedString()}
    var values = [];
    if (model.algProsessor.type == model.AlgType.FORWARD){
        values =  model.getAlpha();
    } else if (model.algProsessor.type == model.AlgType.FORWARDBACKWARD){
        values =  model.getBeta();
    } else {
        var type = document.getElementById("algVarDropdown").value;
        values = model.getVar(type);
    }
        var states = model.states;
    if(str.length > 0){
        
        var table = "<tr>" +
                    "<th></th>";
        for (i = 0; i < str.length; i++){table += th(str.charAt(i));}
        table += "</tr>";

        for (i in states){
            table += "<tr>" +
                    th(states[i].text);
            for (j = 1; j <= str.length; j++){
                if(!values[j]) {values[j] = []};
                if(values[j][i]==null) {values[j][i] = new Big(0);};
                table += td((isNaN(values[j][i]))? values[j][i] : removeZeros(values[j][i].toPrecision(8)),j,i); 
            }
            table += "</tr>";

        }
        document.getElementById("algTable").innerHTML = table;

        var tablecomp = document.getElementById("algDiv");
        tablecomp.clientHeight;
        tablecomp.style.top;
        height = window.innerHeight * 0.20;
        
    }
}

function removeZeros(str){
    var char = str.charAt(str.length-1)
    if (str == "0" || (char != '0' && char != '.') || str.includes('e')){return str}
    return removeZeros(str.substr(0,str.length-1));
}

function highlightTable(){
    var values = [];
    if (model.algProsessor.type == model.AlgType.FORWARD){
        values =  model.getAlpha();
    } else if (model.algProsessor.type == model.AlgType.FORWARDBACKWARD){
        values =  model.getBeta();
    }

    var currentMax = 0;
    var maxI = 0;
    var maxJ = 0;

    for (var i in values){
        for (var j in values[i]){
            if (values[i][j] > currentMax){
                currentMax = values[i][j];
                maxJ = j;
            }
        }
    currentMax = 0;
    document.getElementById("td_"+i+""+maxJ).style.color = "red";
    }
}

var equType = "equ";
var graphSpotlight = false;
function spotlight(id,t,nodeA,nodeB){
    console.log("focus",id,t,nodeA,nodeB);
    
    clearInterval(caretTimer);
    caretVisible = flase;

    equType = (id.length < 2 && t == 1)? "init" : "equ";

    for (var i = 0; i< 3;i++){
        var point =  (i == 0)? id.charAt(0): id
        var equStr = equType + i + "_" + point;
        var element = document.getElementById(equStr);
        if (element != null) {element.style.color = "blue";}
    }
    if (id.charAt(0) == 1 || id.charAt(0) == 2){
        graphSpotlight = true;
        selectedObj = model.states[nodeA];
        currentEmission = model.emissionStates[nodeB];
        document.getElementById("td_"+t+""+nodeA).style.color = "blue";

    } else if (id.charAt(0) == 3 || id.charAt(0) == 4){
        selectedObj = model.transitions[nodeA][nodeB];
        graphSpotlight = true;

    }
    refreshComponents();
}
function unspotlight(id,t,nodeA,nodeB){
    console.log("unfocus",id,t,nodeA,nodeB);

    resetCaret();
    
    equType = (id.length < 2 && t == 1)? "init" : "equ";

    for (var i = 0; i< 3;i++){
        var point =  (i == 0)? id.charAt(0): id
        var equStr = equType + i + "_" + point;
        var element = document.getElementById(equStr);
        if (element != null) {element.style.color = "";}
    }
    if (id.charAt(0) == 1 || id.charAt(0) == 2){
        graphSpotlight = false;
        selectedObj = null;
        currentEmission = null;
        document.getElementById("td_"+t+""+nodeA).style.color = (id.charAt(0) != 1)? "" : "red";

    } else if (id.charAt(0) == 3 || id.charAt(0) == 4){
        selectedObj = null;
        graphSpotlight = false;

    }
    refreshComponents();
}
function tableCellMouseOver(e,comp,j,i){
    var panel = document.getElementById("hoverInfo");
    refreshInfoPanels();

    panel.style.display = "inline";

    var str;
    if (model.algProsessor.type == model.AlgType.FORWARD || document.getElementById("algVarDropdown").value == model.AlgVars.A){
        var t = j;
        var S = 0;
        for (var k in model.states){S++;}
        var s = model.states[i];
        var output = document.getElementById("algString").value;
        var A = model.getAlpha();

        if (t == 1){
            str = forwardInital(t,i,s,output,A);
        } else {
            str = forwardInduction(t,i,s,output,A);
        }
    } else if (model.algProsessor.type == model.AlgType.FORWARDBACKWARD || document.getElementById("algVarDropdown").value == model.AlgVars.B){
        var t = j;
        var s = model.states[i];
        for (var k in model.states){S++;}
        var output = document.getElementById("algString").value;
        var B = model.getBeta();

        if (t == output.length){
            str = backwardInital(t,i,s,output,B);
        } else {
            str = backwardInduction(t,i,s,output,B);
        }
    } else if (model.algProsessor.type == model.AlgType.MOSTLIKELY || document.getElementById("algVarDropdown").value == model.AlgVars.Y){
        var t = j;
        var s = model.states[i];
        for (var k in model.states){S++;}
        var output = document.getElementById("algString").value;
        var A = model.getAlpha();
        var B = model.getBeta();
        var G = model.getVar(model.AlgVars.Y);

        str = gammaInduction(t,i,s,output,G,A,B);
    }
    

    panel.innerHTML = str;
    MathJax.typeset();

    var rect = document.getElementById("algTable").getBoundingClientRect();
    var width = panel.clientWidth;
    var height = panel.clientHeight;

    var x = e.clientX;
    var y = e.clientY;

    panel.style.left = ((x > width)? x - width: x )+ "px" ;
    panel.style.top = rect.top - height + "px";

    
    document.getElementById("td_"+j+""+i).style.color = "Red";
    document.getElementById("algTable").style.color = "white";

    // MathJax.typesetPromise();

    

}

function initModelUI(){

    selectedObj = null;
    currentEmission = null;

    var dropdown = document.getElementById("algorithmDropdown");
    dropdownText = "";
    for (i in model.AlgType){
        dropdownText += "<option value=\""+model.AlgType[i] + "\">"+model.AlgType[i]+"</option>"
    }
    dropdown.innerHTML = dropdownText;
    
    model.algProsessor.type = dropdown.value;
    setAlgDescription(dropdown.value);

    if (model instanceof MarkovChain){
        document.getElementById("instructionsPanelInfo").innerHTML = markovChainInstructions;
        document.getElementById("sEmission").style.display = "";
    } else if (model instanceof HiddenMarkovModel){
        document.getElementById("instructionsPanelInfo").innerHTML = HiddenMarkovModelInstructions;
        document.getElementById("sEmission").style.display = "none";
    }
}


function setAlgDescription(type){
    var info = document.getElementById("AlgorithmVarPanelText");
    var str = "";
    if (type == model.AlgType.FORWARD){
        str += forwardDescription[0];
        str += forwardEquations[0];
        str += forwardDescription[1];
        str += forwardEquations[1];
        str += forwardDescription[2];
    } else if (type == model.AlgType.FORWARDBACKWARD){
        str += backwardDescription[0];
        str += backwardEquations[0];
        str += backwardDescription[1];
        str += backwardEquations[1];
        str += backwardDescription[2];
    } else if (type == model.AlgType.VITERBI){
        str = viterbiDesc;
    }
    info.innerHTML = str;

    
    var dropdown = document.getElementById("algorithmDropdown");
    var algVar = document.getElementById("algVarDropdown");
    var dropdownText = "";
    if (dropdown.value == model.AlgType.VITERBI){
        for (i in model.ViterbiVars){
            dropdownText += "<option value=\""+model.ViterbiVars[i] + "\">"+model.ViterbiVars[i]+"</option>"
        }
        algVar.innerHTML = dropdownText;
        algVar.style.display = "";
    } else if (dropdown.value == model.AlgType.MOSTLIKELY){
        for (i in model.mostLikelyVars){
            dropdownText += "<option value=\""+model.mostLikelyVars[i] + "\">"+model.mostLikelyVars[i]+"</option>"
        }
        algVar.innerHTML = dropdownText;
        algVar.style.display = "";
    } else if (dropdown.value == model.AlgType.BAUMWELCH){
        for (i in model.baumWelchvars){
            dropdownText += "<option value=\""+model.baumWelchvars[i] + "\">"+model.baumWelchvars[i]+"</option>"
        }
        algVar.innerHTML = dropdownText;
        algVar.style.display = "";
    } else {
        algVar.style.display = "none";

    }

    MathJax.typeset();

}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

