
const font ='20px "Times New Roman", serif';
var running = false;
var modelPanel;



window.onload = function() {
    initCanvas();

    var acc = document.getElementsByClassName("accordion");
    var i;

    for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            } 
        });
    }

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
    stateTrasitions.addEventListener('input', function(e){
       /// TODO
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

var runner = null;
run = function(steps,time){
    var output = document.getElementById('outputString');
    if (!model.validCheck()) { output.innerHTML = "There are unresolved errors";alert(model.validCheck()); return;}
    if (steps < 1 || steps == null) { output.innerHTML = ""; return; }
    model.init();
    selectedObj = null;
    clearInterval(caretTimer);
    runner = setInterval('step()',time/2);
    // while (model.processor.outPutLength < steps) {
    //     // do nothing.
    // }
    // runner = null;
    // while (model.processor.outPutLength < steps) {
    //     selectedObj = model.states[model.processor.currentState];
    //     refresh();
    //     // sleep(time/2);
    //     document.getElementById('outputString').innerHTML = model.step();
    //     selectedObj = model.transitions[selectedObj.id][model.processor.currentState];
    //     refresh();
    //     // sleep(time/2);

    // }

    if (tempInitial){
        model.initialProbabilityDistribution = {};
        tempInitial = false;
    }
}

function step() {
    if (selectedObj == null){
        selectedObj = model.states[model.processor.currentState]; //init state
    } else if (selectedObj instanceof State){
        model.step();
        selectedObj = model.transitions[selectedObj.id][model.processor.currentState];
    } else if (selectedObj instanceof StationaryLink){
        selectedObj = model.states[model.processor.currentState];
        document.getElementById('outputString').innerHTML = model.processor.outPut;
    }
    refresh();
    if (model.processor.outPutLength > 20){
        clearInterval(runner);
        resetCaret();
    }
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

