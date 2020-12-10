
/////////////////////////////////////////////////
// vars/ consts
/////////////////////////////////////////////////

const nodeRadius = 50; 
const font ='20px "Times New Roman", serif';

var selectedObj;
var model = new markovChain;
var canvas;
var modelPanel;
var c;

window.onload = function() {

    canvas = document.getElementById('markovCanvas');


	canvas.onmousedown = function(e) {
		var mousePos = relativeMousePos(e);
		selectedObj = model.getElementAt(mousePos);
		if (selectedObj != null){
			
		}
        refresh();
    };

    canvas.ondblclick = function(e) {
        var mousePos = relativeMousePos(e);
        selectedObj = model.getElementAt(mousePos);
        if (selectedObj == null){
            selectedObj = model.addState(mousePos.x,mousePos.y,null,null,null);
        }

		resetCaret();
        refresh();
    };

    modelPanel = document.getElementById('modelPanelBody');

}

var shift = false;
var control = false;
document.onkeydown = function(e) {
	var key = e.key;
	console.log(key);
	if(key == "Shift") {
		shift = true;
	} else if(key == "Control"){
		control = true;
	}else if(false){ //!canvasHasFocus()) {
		// don't read keystrokes when other things have focus
		return true;
	} else if(key == "Backspace") { // backspace key
		if(selectedObj != null) {
			if(control){
				selectedObj.name = "";
			} else {
				selectedObj.name = selectedObj.name.substr(0, selectedObj.name.length - 1);
			}
			resetCaret();
			refresh();
		}

		// backspace is a shortcut for the back button, but do NOT want to change pages
		return false;
	} else if(key == "Delete") { // delete key
		if(selectedObj != null) {
			model.delete(selectedObj);
			selectedObj = null;
			refresh();
		}
    } else if(key == "Escape") { 
		selectedObj = null;
		refresh();
			
    }
}

document.onkeyup = function(e) {
	var key = e.key;

	if(key == "Shift") {
		shift = false;
	} else if(key == "Control"){
		control = false;
	}
}

document.onkeypress = function(e) {
	// don't read keystrokes when other things have focus
	var key = e.key;
	var keyCode = key.charCodeAt(0);
    console.log(key);
	if(false){ //TODO !canvasHasFocus()) {
		// don't read keystrokes when other things have focus
		return true;
	} else if (key == "Enter"){
		selectedObj = null;
		refresh();
	} else if(keyCode >= 31 && keyCode <= 127 && !e.metaKey && !e.altKey && !e.ctrlKey && selectedObj != null) {
		selectedObj.name += key;
		resetCaret();
		refresh();

		// don't let keys do their actions (like space scrolls down the page)
		return false;
	} else if(key == 8) {
		// backspace is a shortcut for the back button, but do NOT want to change pages
		return false;
	}
}




refresh = function() {
    refreshComponents();
    refreshInfoPanels();
}


refreshComponents = function() {

    c = canvas.getContext("2d");
    c.clearRect(0, 0, canvas.width, canvas.height);


	for (i in model.states){
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = (model.states[i] === selectedObj) ? 'blue' : 'black';
		drawNode(c,model.states[i])
    }
}

drawNode = function(c,node){
    c.beginPath();
	c.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
    c.stroke();
    
    addText(c,node.name,node.x,node.y,null,(node === selectedObj))
}

addText = function(c,text,x,y,Angle,isSelected){
    // TODO text = convertLatexShortcuts(originalText);
	c.font = font;
	var width = c.measureText(text).width;

	// center the text
	x -= width / 2;

	if(Angle != null) {
		//TODO  for arrows.
	}

	// draw text and caret (round the coordinates so the caret falls on a pixel)

	x = Math.round(x);
	y = Math.round(y);
	c.fillText(text, x, y + 6);
	if(isSelected && caretVisible && document.hasFocus()) {
		x += width;
		c.beginPath();
		c.moveTo(x, y - 10);
		c.lineTo(x, y + 10);
		c.stroke();
    }
}

var caretTimer = null;
var caretVisible = true;

function resetCaret() {
	clearInterval(caretTimer);
	caretTimer = setInterval('caretVisible = !caretVisible; refreshComponents()', 500);
	caretVisible = true;
}

refreshInfoPanels = function(){
    modelPanel.innerHTML = model.toString();
}
// 		if (mode === 'drawing') {
// 			selectedObject = selectObject(mouse.x, mouse.y);
// 			movingObject = false;
// 			originalClick = mouse;
// 			if(selectedObject != null) {
// 				if(shift && selectedObject instanceof Node) {
// 					currentLink = new SelfLink(selectedObject, mouse, checkDirected());
// 				} else {
// 					movingObject = true;
// 					deltaMouseX = deltaMouseY = 0;
// 					if(selectedObject.setMouseStart) {
// 						selectedObject.setMouseStart(mouse.x, mouse.y);
// 					}
// 				}
// 				resetCaret();
// 			} else if(shift) {
// 				currentLink = new TemporaryLink(mouse, mouse, checkDirected());
// 			}
// 		}
// 		else if (mode === 'coinfiring') {
// 			var currentObject = selectObject(mouse.x, mouse.y);
// 			if (currentObject != null) {
// 				if (currentObject instanceof Node) {
// 					var chipsToFireAway = 0;
// 					// Look for edges to adjacent nodes
// 					var modifier = 1;
// 					if (shift) {
// 						modifier = -1;
// 					}
// 					var edges = leavingEdges(currentObject);
// 					for (var i = 0; i < edges.length; i++) {
// 						var edge = edges[i];
// 						var otherNode = edge.nodeB;
// 						if (otherNode === currentObject) {
// 							otherNode = edge.nodeA;
// 						}
// 						var edgeWeight = 1;
// 						if (edge.text !== '' && !isNaN(edge.text)) {
// 							edgeWeight = parseInt(edge.text);
// 						}
// 						chipsToFireAway += edgeWeight;
// 						incrementNode(otherNode, edgeWeight * modifier);
// 					}
// 					incrementNode(currentObject, -chipsToFireAway * modifier)
// 				}
// 			}
// 		}

// 		draw();

// 		if(canvasHasFocus()) {
// 			// disable drag-and-drop only if the canvas is already focused
// 			return false;
// 		} else {
// 			// otherwise, let the browser switch the focus away from wherever it was
// 			resetCaret();
// 			return true;
// 		}
// 	};

// 	canvas.ondblclick = function(e) {
// 		var mouse = crossBrowserRelativeMousePos(e);

// 		if (mode === 'drawing') {
// 			selectedObject = selectObject(mouse.x, mouse.y);
// 			if(selectedObject == null) {
// 				selectedObject = new Node(mouse.x, mouse.y);
// 				nodes.push(selectedObject);
// 				resetCaret();
// 				draw();
// 			} else if(selectedObject instanceof Node) {
// 				selectedObject.isAcceptState = !selectedObject.isAcceptState;
// 				draw();
// 			}
// 		}
// 		else if (mode === 'coinfiring') {
// 			// Do nothing special
// 		}
// 	};

// 	canvas.onmousemove = function(e) {
// 		var mouse = crossBrowserRelativeMousePos(e);

// 		if(currentLink != null) {
// 			var targetNode = selectObject(mouse.x, mouse.y);
// 			if(!(targetNode instanceof Node)) {
// 				targetNode = null;
// 			}

// 			if(selectedObject == null) {
// 				if(targetNode != null) {
// 					currentLink = new StartLink(targetNode, originalClick, checkDirected());
// 				} else {
// 					currentLink = new TemporaryLink(originalClick, mouse, checkDirected());
// 				}
// 			} else {
// 				if(targetNode == selectedObject) {
// 					currentLink = new SelfLink(selectedObject, mouse, checkDirected());
// 				} else if(targetNode != null) {
// 					currentLink = new Link(selectedObject, targetNode, checkDirected());
// 				} else {
// 					currentLink = new TemporaryLink(selectedObject.closestPointOnCircle(mouse.x, mouse.y), mouse, checkDirected());
// 				}
// 			}
// 			draw();
// 		}

// 		if(movingObject) {
// 			selectedObject.setAnchorPoint(mouse.x, mouse.y);
// 			if(selectedObject instanceof Node) {
// 				snapNode(selectedObject);
// 			}
// 			draw();
// 		}
// 	};

// 	canvas.onmouseup = function(e) {
// 		movingObject = false;

// 		if(currentLink != null) {
// 			if(!(currentLink instanceof TemporaryLink)) {
// 				selectedObject = currentLink;
// 				links.push(currentLink);
// 				resetCaret();
// 			}
// 			currentLink = null;
// 			draw();
// 		}
// 	};
// }