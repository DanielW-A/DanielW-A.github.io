
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
}

run = function(steps,time){
    var output = document.getElementById('outputString');
    if (model.validCheck() != "") { output.innerHTML = "There are unresolved errors";alert(model.validCheck()); return;}
    if (steps < 1 || steps == null) { output.innerHTML = ""; return; }
    model.init();
    while (model.processor.outPutLength < steps) {
        sleep(time);
        document.getElementById('outputString').innerHTML = model.step();

    }

    if (tempInitial){
        model.initialProbabilityDistribution = {};
        tempInitial = false;
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

    mInitalProability
    //mLatentStates
    //mEmmisionProbaility
    
}



function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

