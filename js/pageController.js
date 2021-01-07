
const font ='20px "Times New Roman", serif';
var running = false;
var modelPanel;


toggleAccordion = function(component){
    component.classList.toggle("active");
    var panel = component.nextElementSibling;
    if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
    } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
    }
}


window.onload = function() {
    initCanvas();

    var acc = document.getElementsByClassName("accordion");
    var i;

    for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            toggleAccordion(this);
        });
    }

    // buttons
    document.getElementById("saveBtn").addEventListener("click", function() {
        save();
    });
    document.getElementById("loadBtn").addEventListener("click", function() {
        load();
    });
    document.getElementById("clearBtn").addEventListener("click", function() {
        clear();
    });
    document.getElementById("runBtn").addEventListener("click",  function() {
        run(20,1000);
    });

    document.getElementById("markovChainBtn").disabled = true;
    document.getElementById("markovChainBtn").addEventListener("click", function(){
        model = new MarkovChain();
        document.getElementById("markovChainBtn").disabled = true;
        document.getElementById("hiddenMarkovModelBtn").disabled = false;
    });
    document.getElementById("hiddenMarkovModelBtn").addEventListener("click", function(){
        model = new HiddenMarkovModel();
        document.getElementById("markovChainBtn").disabled = false;
        document.getElementById("hiddenMarkovModelBtn").disabled = true;
    });

    // State details
    var stateName = document.getElementById("sNameText");
    stateName.addEventListener('input', function(e){
        if (selectedObj instanceof State){
            selectedObj.text = this.value;
            refresh();
        }
    });

    var stateEmmision = document.getElementById("sEmmisionText");
    stateEmmision.addEventListener('input', function(e){
        if (selectedObj instanceof State){
            selectedObj.emmision = this.value;
            refresh();
        }
    });

    var stateInitProb = document.getElementById("sInitalProability");
    stateInitProb.addEventListener('input', function(e){
        if (selectedObj instanceof State){
            model.initialProbabilityDistribution[selectedObj.id] = validateProability(this.value);;
            refresh();
        }
    });

    var stateTrasitions = document.getElementById("sInitalProability");
    // stateTrasitions.addEventListener('input', function(e){
    //    /// TODO
    // });

    var AlgButton = document.getElementById("algButton");
    AlgButton.addEventListener("click", function() {
        model.algStep(document.getElementById("algorithmDropdown").value);
    });

}

validateProability = function(text){
    var keyCode = text.charCodeAt(text.length-1);
    
	text = text.substr(0, text.length - 1);
	if((!(keyCode >= 48 && keyCode <= 57))
			|| ((keyCode != 48 & keyCode != 49) && text == "")
			|| (text == "1")){

		if (keyCode == 46 && (text == "" || text == '0')){
			text = "0.";
	    }
	} else {
       text += String.fromCharCode(keyCode); 
    }

	return text;

}

save = function(){
    alert("TODO");
}

load = function(){
    var w = canvas.width;
    var h = canvas.height;

    if (model instanceof HiddenMarkovModel){
        var s1 = model.addState(w/3,h/3);
        s1.text = "H";
        model.initialProbabilityDistribution[s1.id] = "0.6";
        var s2 = model.addState(2*w/3,h/3);
        s2.text = "F";
        model.initialProbabilityDistribution[s2.id] = "0.4";

        var es1 =  model.addEmmisionState(w/4,2*h/3);
        es1.text = "N";
        es1.emmision = "N";
        var es2 =  model.addEmmisionState(w/2,2*h/3);
        es2.text = "C";
        es2.emmision = "C";
        var es3 =  model.addEmmisionState(3*w/4,2*h/3);
        es3.text = "D";
        es3.emmision = "D";


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

    } 

    refresh();
}

clear = function(){
    if (model instanceof HiddenMarkovModel){
        model = new HiddenMarkovModel();
    } else if (model instanceof MarkovChain){
        model = new MarkovChain();
    }

    model = new MarkovChain();
}

var runner = null;
run = function(steps,time){
    var output = document.getElementById('outputString');
    if (!model.validCheck()) { 
        output.innerHTML = "There are unresolved errors";
        refresh();
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
    runner = setInterval('step()',time/2);


    if (tempInitial){
        model.initialProbabilityDistribution = {};
        tempInitial = false;
    }
}

var currentEmmision = null;
function step() {
    if (selectedObj == null){
        selectedObj = model.states[model.processor.currentState]; //init state
        if (model instanceof HiddenMarkovModel) {currentEmmision = model.processor.emmisionState}
    } else if (selectedObj instanceof State){
        model.step();
        selectedObj = model.transitions[selectedObj.id][model.processor.currentState];
        currentEmmision = null;
    } else if (selectedObj instanceof StationaryLink){
        selectedObj = model.states[model.processor.currentState];
        if (model instanceof HiddenMarkovModel) {currentEmmision = model.processor.emmisionState}
        document.getElementById('outputString').innerHTML = model.processor.outPut;
    }
    refresh();
    if (model.processor.outPutLength > 20){
        selectedObj = null;
        stopStep();
        resetCaret();
    }
}

function stopStep(){
    clearInterval(runner);
    runner = null;
}

refreshInfoPanels = function(){
    if (!(selectedObj == null)){
        if (selectedObj instanceof State){
            document.getElementById("sIDText").value = selectedObj.id;
            document.getElementById("sNameText").value = selectedObj.text;
            document.getElementById("sEmmisionText").value = selectedObj.emmision;
            document.getElementById("sInitalProability").value = model.initialProbabilityDistribution[selectedObj.id];
            document.getElementById("sTransitionProabilitysText").value = model.transitions[selectedObj.id];
        }
    }
    var panel = document.getElementById("statePanelInfo");
    if (panel.style.maxHeight){
        panel.style.maxheight = panel.scrollHeight + "px";
    }

    var stateStr = "{";
    for (i in model.states){ stateStr += model.states[i].text + ','; }
    stateStr = stateStr.substr(0, stateStr.length - 1);
    stateStr += "}";
    document.getElementById("mStatesText").innerHTML = stateStr;

    
    var transStr = "{";
    for (i in model.states){
        for (j in model.states){
            if (model.transitions[i][j] == null || model.transitions[i][j].text == ''){
                transStr += '0';
            } else {
                transStr += model.transitions[i][j].text;
            }
            transStr += ',';
        }
        transStr += "},<br>{"; //TODO not what i want but good enough for rn.
    }
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
    initStr = initStr.substr(0, initStr.length - 1);
    initStr += "}";
    document.getElementById("mInitalProability").innerHTML = initStr;

    //mLatentStates
    //mEmmisionProbaility

    
    panel = document.getElementById("modelPanelInfo");
    if (panel.style.maxHeight){
        panel.style.maxHeight = panel.scrollHeight + "px";
    }

    if (model instanceof MarkovChain){
        document.getElementById("instructionsPanelInfo").innerHTML = 
        "<ul> " + 
        li("<b>Add a state:</b> double-click anywhere.")+
        li("<b>Add a transition:</b> Shift-drag on the canvas.")+
        li("<b>Move Something:</b> TODO.")+
        li("<b>Delete Something:</b> click on it and press the delete key")+
        li("")+
        "</ul>";
    } else if (model instanceof HiddenMarkovModel){

    }

    var errors = "";
    for (i in model.processor.errors){
        errors += "ERROR : " + model.processor.errors[i] + "<br>";
    }
    for (i in model.processor.warnings){
        errors += "WARNING : " + model.processor.warnings[i] + "<br>";
    }

    document.getElementById("errorPanelInfo").innerHTML = errors;
    
}

function li(string){
    return "<li>" + string + "</li>";
}



function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

