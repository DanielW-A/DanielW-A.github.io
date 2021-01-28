
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

//pass the button that controles the accordion
openAccordion = function(component){
    if (component.nextElementSibling.style.maxHeight == ''){
        component.click();
    }
}

closeAccordion = function(component){
    if (component.nextElementSibling.style.maxHeight != ''){
        component.click();
    }
}



window.onload = function() {
    initCanvas();
    initModelUI();

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
    document.getElementById("testBtn").addEventListener("click",  function() {
        test();
    });

    document.getElementById("markovChainBtn").disabled = true;
    document.getElementById("markovChainBtn").addEventListener("click", function(){
        model = new MarkovChain();
        document.getElementById("markovChainBtn").disabled = true;
        document.getElementById("hiddenMarkovModelBtn").disabled = false;
        initModelUI();
    });
    document.getElementById("hiddenMarkovModelBtn").addEventListener("click", function(){
        model = new HiddenMarkovModel();
        document.getElementById("markovChainBtn").disabled = false;
        document.getElementById("hiddenMarkovModelBtn").disabled = true;
        initModelUI();
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
        refresh();
    });

    var obserevedString = document.getElementById("algString");
    obserevedString.addEventListener('input', function(e){
        var obsStr = model.validateObS(obserevedString.value);
        obserevedString.value = obsStr;
        refresh();
    });

    var dropdown = document.getElementById("algorithmDropdown");
    dropdown.onchange = function() {
        model.clearAlgProsessor();
        model.algProsessor.type = dropdown.value;

    };

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

        var es1 =  model.addEmmisionState(w/4,11*h/18);
        es1.text = "N";
        es1.emmision = "N";
        var es2 =  model.addEmmisionState(w/2,13*h/18);
        es2.text = "C";
        es2.emmision = "C";
        var es3 =  model.addEmmisionState(3*w/4,11*h/18);
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

    refresh();
    var algStr = document.getElementById("algString");
    algStr.disabled = false;
    algStr.value = "";
}

var runnerSelectedObject = null; //TODO
var runner = null;
run = function(steps,time){
    if (runner != null){
        selectedObj = null;
        currentEmmision = null;
        stopStep();
        resetCaret();
        return;
    }
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
        currentEmmision = null;
        stopStep();
        resetCaret();
    }
}

function stopStep(){
    clearInterval(runner);
    runner = null;
}

refreshInfoPanels = function(){

    if (selectedObj instanceof State && runner == null){
        document.getElementById("sIDText").value = selectedObj.id;
        document.getElementById("sNameText").value = selectedObj.text;
        document.getElementById("sEmmisionText").value = selectedObj.emmision;
        document.getElementById("sInitalProability").value = model.initialProbabilityDistribution[selectedObj.id];
    } else {
        document.getElementById("sIDText").value = null;
        document.getElementById("sNameText").value = null;
        document.getElementById("sEmmisionText").value = null;
        document.getElementById("sInitalProability").value = null;
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


    // table :
    var str = document.getElementById("algString").value;
    if(str.length > 0){
        
        var table = "<tr>" +
                    "<th></th>";
        var states = model.states;
        var Alpha = model.getAlpha(); // todo 
        for (i = 0; i < str.length; i++){table += th(str.charAt(i));}
        table += "</tr>";

        for (i in states){
            table += "<tr>" +
                    th(states[i].text);
            for (j = 1; j <= str.length; j++){
                if(!Alpha[j]) {Alpha[j] = []};
                table += td((Alpha[j][i]== null)? 0: Math.round( Alpha[j][i] * 10000000000 + Number.EPSILON ) / 10000000000,j,i); 
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
function th(str){return "<th>"+str+"</th>";}
function td(str,j,i){return "<td id=\"td_"+j+""+i+"\" onclick=\"tableCellMouseOver(event,this,"+j+","+i+")\">"+str+"</td>";}
function li(str){return "<li>"+str+"</li>";}

function spanNH(str,id){return "<span id=\"equ0_"+id+"\">" + str + "</span>"}
// function span(str,id,t,nodeA,nodeB,equ){return "<span id=\"equ"+equ+"_"+id+"\" onmouseover=\"spotlight('"+id+"',"+t+","+nodeA+","+nodeB+")\" onmouseout=\"unspotlight('"+id+"',"+t+","+nodeA+","+nodeB+")\" >" + str + "</span>"}
function span(equ,id,t,nodeA,nodeB,str){return "<span id=\"equ"+equ+"_"+id+"\" onmouseover=\"spotlight('"+id+"',"+t+",'"+nodeA+"','"+nodeB+"')\" onmouseout=\"unspotlight('"+id+"',"+t+",'"+nodeA+"','"+nodeB+"')\" >" + str + "</span>"}

var graphSpotlight = false;
function spotlight(id,t,nodeA,nodeB){
    console.log("focus",id,t,nodeA,nodeB);

    for (var i = 0; i< 3;i++){
        var point =  (i == 0)? id.charAt(0): id
        var equStr = "equ" + i + "_" + point;
        var element = document.getElementById(equStr);
        element.style.color = "blue";
    }
    if (id.charAt(0) == 1 || id.charAt(0) == 2){
        graphSpotlight = true;
        selectedObj = model.states[nodeA];
        currentEmmision = model.emmisionStates[nodeB];
        document.getElementById("td_"+t+""+nodeA).style.color = "blue";

    } else if (id.charAt(0) == 3 || id.charAt(0) == 4){
        selectedObj = model.transitions[nodeA][nodeB];
        graphSpotlight = true;

    }
    refreshComponents();
}
function unspotlight(id,t,nodeA,nodeB){
    console.log("unfocus",id,t,nodeA,nodeB);

    for (var i = 0; i< 3;i++){
        var point =  (i == 0)? id.charAt(0): id
        var equStr = "equ" + i + "_" + point;
        var element = document.getElementById(equStr);
        element.style.color = "";
    }
    if (id.charAt(0) == 1 || id.charAt(0) == 2){
        graphSpotlight = false;
        selectedObj = null;
        currentEmmision = null;
        document.getElementById("td_"+t+""+nodeA).style.color = (id.charAt(0) != 1)? "" : "red";

    } else if (id.charAt(0) == 3 || id.charAt(0) == 4){
        selectedObj = null;
        graphSpotlight = false;

    }
    refreshComponents();
}
function tableCellMouseOver(e,comp,j,i){
    var panel = document.getElementById("hoverInfo");


    panel.style.display = "inline";

    var str;
    if (model.algProsessor.type == model.AlgType.forward){ //TODO if forward

        var t = j;
        var S = 0;
        for (var k in model.states){S++;}
        var s = model.states[i];
        var output = document.getElementById("algString").value;
        var A = model.getAlpha();
        

        str = "<div id=\"equ1\">" + span(1,1,t,i,model.getEmmisionState(output.charAt(t)),"\\(\\alpha_{"+t+"}("+s.text+")\\)") + " = (";
        for (var k in model.states){
            str += span(1,2+""+k,t-1,k,model.getEmmisionState(output.charAt(t-1)),"\\(\\alpha_{"+(t-1)+"} ("+model.states[k].text+")\\)");
            str += span(1,3+""+k,t-1,k,i,"\\(m_{"+model.states[k].text+","+s.text+"} \\)");
            str += " + ";
        } 
        str = str.substr(0, str.length - 3);
        str +=  ")" + span(1,4,t,i,model.getEmmisionState(output.charAt(t)),"\\(e_{"+s.text+"} ("+output.charAt(t)+")\\)") + "</div>";
        
        str += "<div id=\"equ2\">" + span(2,1,t,i,model.getEmmisionState(output.charAt(t)),"\\("+A[t][i]+"\\)") + " = (";
        for (var k in model.states){
            str += span(2,2+""+k,t-1,k,model.getEmmisionState(output.charAt(t-1)),"\\("+A[t-1][k]+"\\)");
            str += span(2,3+""+k,t-1,k,i,"\\("+model.transitions[k][i].text+"\\)");
            str += " + ";
        }
        str = str.substr(0, str.length - 3);
        str +=  ")" + span(2,4,t,i,model.getEmmisionState(output.charAt(t)),"\\("+ s.getEmmisionProbability(output.charAt(t))+"\\)") + "</div>";
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
    var dropdown = document.getElementById("algorithmDropdown");
    dropdownText = "";
    for (i in model.AlgType){
        dropdownText += "<option value=\""+model.AlgType[i] + "\">"+model.AlgType[i]+"</option>"
    }
    dropdown.innerHTML = dropdownText;

    setAlgDescription(model.AlgType[0]);

    if (model instanceof HiddenMarkovModel){
        document.getElementById("sEmmision").style.display = "none";
        document.getElementById("sEmmisionBtn").style.display = "";
    } else {
        document.getElementById("sEmmision").style.display = "";
        document.getElementById("sEmmisionBtn").style.display = "none";
    }
    sEmmisionBtn
    sEmmision
}

function setAlgDescription(type){
    if (type == model.AlgType.forward){
        var info = document.getElementById("AlgorithmVarPanelText");
        var str = "<div id=\"equ0\">";
        str += spanNH("\\(\\alpha_t (j)\\)",1) + " = ";
        str += spanNH("\\((\\Sigma^{|S|}_{i=1}\\)",0);
        str += spanNH("\\(\\alpha_{t-1} (i)\\)",2);
        str += spanNH("\\(m_{i,j}\\)",3);
        str += spanNH("\\(e_j (o_t)\\)",4);
        str += spanNH("\\(, 1 < t <= T , 1 <= j <= |S|)\\)",5);
        str += "</div>";
        info.innerHTML = str;
    }

}



function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

