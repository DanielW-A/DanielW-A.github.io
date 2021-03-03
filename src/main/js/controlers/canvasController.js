/////////////////////////////////////////////////
// vars/ consts
/////////////////////////////////////////////////

var selectedObj;
var model;
var drawingLink;
var canvas;
var c;

var movingObject;
var offset;

initCanvas = function() {

	model = new MarkovChain();

    canvas = document.getElementById('markovCanvas');

	console.log (document.body.clientWidth);
	canvas.width = document.body.clientWidth;
	canvas.height = window.innerHeight;
	document.body.clientHeight;
	document.body.clientWidth;
	window.innerHeight;
	window.innerWidth;
	document.documentElement.clientHeight;
	document.documentElement.clientWidth;

	canvas.onmousedown = function(e) {
		if (running == true){return;}
		var mousePos = getMousePos(canvas,e);

        console.log(mousePos);
		selectedObj = model.getElementAt(mousePos);
		if (selectedObj instanceof State){
            openAccordion(document.getElementById("stateButton"));
            document.getElementById("sNameText").focus();
		}
		if (selectedObj != null){
			console.log(shift);
			
			if(shift && selectedObj instanceof State){
				console.log("Shift and is state");
				drawingLink = new TempLink(selectedObj,mousePos);
			} else {
				movingObject = true;
				offset = {
					x: selectedObj.x - mousePos.x,
					y: selectedObj.y - mousePos.y
				}
			}
		}
		resetCaret();
        refresh();
        
		document.getElementById("hoverInfo").style.display = "none";
		document.getElementById("algTable").style.color = "";
    };

    canvas.ondblclick = function(e) {
		if (running == true){return;}
        var mousePos = getMousePos(canvas,e);
		selectedObj = model.getElementAt(mousePos);
        if (selectedObj == null){
			if (control && model instanceof HiddenMarkovModel){
				selectedObj = model.addEmissionState(mousePos.x,mousePos.y);
			} else {
            	selectedObj = model.addState(mousePos.x,mousePos.y);
			}
            openAccordion(document.getElementById("stateButton"));
            document.getElementById("sNameText").focus();
        }

		resetCaret();
        refresh();
	};
	
	canvas.onmousemove = function(e) {
		if (running == true){return;}
		var mousePos = getMousePos(canvas,e);
		if(drawingLink != null){
			drawingLink.refresh(mousePos);
			refresh();
		} else if (movingObject){
			if (selectedObj instanceof State){	
				selectedObj.x = mousePos.x + offset.x;
				selectedObj.y = mousePos.y + offset.y;
			} else if (selectedObj instanceof Link && selectedObj.type == LinkType.SELF){
				selectedObj.setAnchorangle(mousePos); 
			}
			refresh();
		}
		
	}

	canvas.onmouseup = function(e) {
		if (running == true){return;}
        movingObject = false;
        
		if(drawingLink != null){
			var mousePos = getMousePos(canvas,e);
			selectedObj = model.getElementAt(mousePos);
			if (selectedObj != null){
				selectedObj = model.addTransistion(drawingLink);
				drawingLink = null;
			} else {
				drawingLink = null;
            }
            refresh();
            closeAccordion(document.getElementById("stateButton"));
			
        } else if(selectedObj instanceof State){
            document.getElementById("sNameText").focus();
        } else if(canvasHasFocus()){
			closeAccordion(document.getElementById("stateButton"));
            
        }
        
	}

}



function canvasHasFocus() {
	return (document.activeElement.tagName != "INPUT");
}

var shift = false;
var control = false;
document.onkeydown = function(e) {
	var key = e.key;
	console.log(key);
	if (key == "Enter" && selectedObj != null){
		selectedObj = null;
		refresh();
		closeAccordion(document.getElementById("stateButton"));
		return false;
	}
	if(key == "Shift") {
		shift = true;
	} else if(key == "Control"){
		control = true;
	
	} else if(key == "Delete") { // delete key
		if(selectedObj != null) {
			model.delete(selectedObj);
			selectedObj = null;
			refresh();
            closeAccordion(document.getElementById("stateButton"));
		}
	}else if(!canvasHasFocus() || running == true){ // changed hoe this works a bit , now less imprtant
		//don't read keystrokes when other things have focus
		return true;
    } else if(key == "Escape") { 
		selectedObj = null;
		refresh();
			
	} else if(key == "Backspace") {
		if(selectedObj != null) {
			if(control || selectedObj.text == "0."){
				selectedObj.text = "";
			} else {
				selectedObj.text = selectedObj.text.substr(0, selectedObj.text.length - 1);
			}
			resetCaret();
			refresh();
		}

		// backspace is a shortcut for the back button, but do NOT want to change pages
		return false;
	}
	
}

document.onkeyup = function(e) {
	var key = e.key;

	console.log("key up " + e);
	if(key == "Shift") {
		console.log("key up shift");
		shift = false;
	} else if(key == "Control"){
		control = false;
	}
}


document.onkeypress = function(e) {
	var key = e.key;
	var keyCode = key.charCodeAt(0);
    console.log(key);
	console.log(key.charCodeAt(0));
	if (key == "Enter"){
		selectedObj = null;
		refresh();
		closeAccordion(document.getElementById("stateButton"));
		return false;
	}
	if(!canvasHasFocus() || running != true){
		return true;
	} else if(keyCode >= 31 && keyCode <= 127 && !e.metaKey && !e.altKey && !e.ctrlKey && selectedObj != null) {
		if (selectedObj instanceof StationaryLink){
			if((!(keyCode >= 48 && keyCode <= 57))
					|| ((keyCode != 48 & keyCode != 49) && selectedObj.text == "")
					|| (selectedObj.text == "1")){

				if (keyCode == 46 && (selectedObj.text == "" || selectedObj.text == '0')){
					selectedObj.text = "0.";
				}
				resetCaret();
				refresh();
				return false;
            }
            if (selectedObj.text == "0"){
                return false;
            }
		}
		selectedObj.text += key;
		resetCaret();
		refresh();

		// don't let keys do their actions (like space scrolls down the page)
		return false;
	} else if(keyCode == 8) {
		// backspace is a shortcut for the back button, but do NOT want to change pages
		return false;
	}
}

elementPos = function(e) {
	var target = e.target;
	var x = 0, y = 0;
	while(target.offsetParent) {
		x += target.offsetLeft;
		y += target.offsetTop;
		target = target.offsetParent;
	}
	return { 'x': x, 'y': y };
}


function  getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y
  
    return {
      x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
      y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    }
  }
relativeMousePos = function(e){
    var element = elementPos(e);
    return {
		'x': e.pageX - element.x,
		'y': e.pageY - element.y
	};
}




refresh = function() {
    refreshComponents();
    refreshInfoPanels();
}


refreshComponents = function(latexCanvas) {

	if (latexCanvas == null){
		c = canvas.getContext("2d");
		canvas.width = document.body.clientWidth;
		canvas.height = window.innerHeight;
    	c.clearRect(0, 0, canvas.width, canvas.height);
	} else {
		c = latexCanvas;
	}

	var alpha = 1;
	if (graphSpotlight){c.globalAlpha = alpha = 0.2;}
	for (i in model.states){
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = (model.states[i] === selectedObj) ? 'blue' : 'black';
		if (graphSpotlight && selectedObj === model.states[i]){c.globalAlpha = 1;}
		model.states[i].draw(c,(model.states[i] === selectedObj));
		c.globalAlpha = alpha;
	}
	if (model instanceof HiddenMarkovModel){
		for (i in model.emissionStates){
			c.lineWidth = 1;
			c.fillStyle = c.strokeStyle = (model.emissionStates[i] === selectedObj || model.emissionStates[i] === currentEmission) ? 'blue' : 'black';
			if (graphSpotlight && currentEmission === model.emissionStates[i]){c.globalAlpha = 1;}
			model.emissionStates[i].draw(c,(model.emissionStates[i] === selectedObj));	
			c.globalAlpha = alpha;
		}
	}
	if(drawingLink != null){
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = 'black';
		drawingLink.draw(c);
	}
	for (i in model.transitions){
		for (j in model.transitions[i]){
			c.lineWidth = 1;
			c.fillStyle = c.strokeStyle = (model.transitions[i][j] === selectedObj ) ? 'blue' : 'black';
			if(j.charAt(0) == 'e'){
				c.fillStyle = c.strokeStyle = model.states[i].colour;
				if (!((model.states[i] === selectedObj && model.emissionStates[j] === currentEmission) || ((running == false) && (!graphSpotlight)))){
					c.globalAlpha = 0.1;
				} else if (selectedObj instanceof State && !((model.states[i] == selectedObj) || model.emissionStates[j] == selectedObj)){
					c.globalAlpha = 0.4;
				} else {
					c.globalAlpha = 1;
				}
			}
			if (graphSpotlight && selectedObj === model.transitions[i][j]){c.globalAlpha = 1;}
			model.transitions[i][j].draw(c,(model.transitions[i][j] === selectedObj));
			c.globalAlpha = alpha;
			
		}
	}
}

var caretTimer = null;
var caretVisible = true;

function resetCaret() {
	clearInterval(caretTimer);
	caretTimer = setInterval('caretVisible = !caretVisible; refreshComponents()', 530); // 530 is the defult time
	caretVisible = true;
}
