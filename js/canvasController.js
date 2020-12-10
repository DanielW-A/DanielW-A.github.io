
/////////////////////////////////////////////////
// vars/ consts
/////////////////////////////////////////////////

const nodeRadius = 50; 
const font ='20px "Times New Roman", serif';

var selectedObj;
var model = new markovChain;
var canvas;
var c;

window.onload = function() {

    canvas = document.getElementById('markovCanvas');


	canvas.onmousedown = function(e) {
		var mousePos = relativeMousePos(e);
        console.log(mousePos);
        selectedObj = model.getElementAt(mousePos);
        console.log("Selected Obj");
        console.log(selectedObj);
        refresh();
    };

    canvas.ondblclick = function(e) {
        var mousePos = relativeMousePos(e);
        selectedObj = model.getElementAt(mousePos);
        if (selectedObj == null){
            selectedObj = model.addState(mousePos.x,mousePos.y,null,null,null);
            console.log("selectedObj");
            console.log(selectedObj);
        }

        refresh();
    };
}


refresh = function() {
    refreshComponents();
    resetCaret();
}


refreshComponents = function() {

    c = canvas.getContext("2d");
    c.clearRect(0, 0, canvas.width, canvas.height);

    console.log("selectedObj");
    console.log(selectedObj);
	for (i in model.states){
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = (model.states[i] === selectedObj) ? 'blue' : 'black';
		console.log("model.states[i]");
		console.log(model.states[i]);
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
    console.log(caretVisible);
	if(isSelected && caretVisible && document.hasFocus()) {
		x += width;
		c.beginPath();
		c.moveTo(x, y - 10);
		c.lineTo(x, y + 10);
		c.stroke();
    }
}

var caretTimer;
var caretVisible = true;

function resetCaret() {
	clearInterval(caretTimer);
	caretTimer = setInterval('caretVisible = !caretVisible; refreshComponents()', 500);
	// caretVisible = true;
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