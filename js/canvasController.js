
class TempLink extends Link{ // this will be the more adaptive link when being drawn.
	constructor(startNode,mousePos){
		super(startNode,mousePos.x,mousePos.y);
		this.mousePos = mousePos;
	}

	refresh(mousePos){
		this.endNode = model.getElementAt(mousePos);
		if (!(this.endNode instanceof State)){this.endNode = null;}
		if (this.startNode != this.endNode){
			this.type = LinkType.DIRECT;
		} else {
			this.type = LinkType.SELF;
		}
		this.x = mousePos.x;
		this.y = mousePos.y;

		this.setAnchorangle(mousePos);
	}

	draw(c){
		if(this.type === LinkType.DIRECT || this.startNode instanceof EmmisionState){
			if (this.endNode == null){
				this.endPos.x = this.x;
				this.endPos.y = this.y;
				this.startPos = this.startNode.closestPointOnCircle(this.x, this.y);
			} else {
				this.endPos = this.endNode.closestPointOnCircle(this.startNode.x, this.startNode.y);
				this.startPos = this.startNode.closestPointOnCircle(this.endNode.x, this.endNode.y);
			}


			c.beginPath();
			c.moveTo(this.startPos.x, this.startPos.y);
			c.lineTo(this.endPos.x, this.endPos.y);
			c.stroke();

		
		} else if(this.type == LinkType.SELF){
			var circleX = this.startNode.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
			var circleY = this.startNode.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
			var circleRadius = 0.75 * nodeRadius;
			var startAngle = this.anchorAngle - Math.PI * 0.8;
			var endAngle = this.anchorAngle + Math.PI * 0.8;


			c.beginPath();
			c.arc(circleX, circleY, circleRadius, startAngle, endAngle, false);
			c.stroke();
		}

	}
}
/////////////////////////////////////////////////
// vars/ consts
/////////////////////////////////////////////////

var selectedObj;
var model;
var drawingLink;
var canvas;
var c;

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
		var mousePos = getMousePos(canvas,e);
		console.log(mousePos);
		selectedObj = model.getElementAt(mousePos);
		if (selectedObj != null){
			console.log(shift);
			if(shift && selectedObj instanceof State){
				console.log("Shift and is state");
				drawingLink = new TempLink(selectedObj,mousePos);
			}
		}
		resetCaret();
        refresh();
    };

    canvas.ondblclick = function(e) {
        var mousePos = getMousePos(canvas,e);
		selectedObj = model.getElementAt(mousePos);
        if (selectedObj == null){
			if (control && model instanceof HiddenMarkovModel){
				selectedObj = model.addEmmisionState(mousePos.x,mousePos.y);
			} else {
            	selectedObj = model.addState(mousePos.x,mousePos.y);

			}
        }

		resetCaret();
        refresh();
	};
	
	canvas.onmousemove = function(e) {
		var mousePos = getMousePos(canvas,e);
		if(drawingLink != null){
			drawingLink.refresh(mousePos);
			refresh();
		}
	}

	canvas.onmouseup = function(e) {
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
			
		}
	}

}

function canvasHasFocus() {
	return (document.activeElement || document.body) == document.body;
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
	}else if(!canvasHasFocus()){
		// don't read keystrokes when other things have focus
		return true;
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
	if(!canvasHasFocus()){
		return true;
	} else if (key == "Enter"){
		selectedObj = null;
		refresh();
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
		}
		selectedObj.text += key;
		resetCaret();
		refresh();

		// don't let keys do their actions (like space scrolls down the page)
		return false;
	} else if(key == 8) {
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


refreshComponents = function() {

    c = canvas.getContext("2d");
    c.clearRect(0, 0, canvas.width, canvas.height);


	for (i in model.states){
		c.lineWidth = 1;
		c.fillStyle = c.strokeStyle = (model.states[i] === selectedObj) ? 'blue' : 'black';
		model.states[i].draw(c,(model.states[i] === selectedObj));
	}
	if (model instanceof HiddenMarkovModel){
		for (i in model.emmisionStates){
			c.lineWidth = 1;
			c.fillStyle = c.strokeStyle = (model.emmisionStates[i] === selectedObj || model.emmisionStates[i] === currentEmmision) ? 'blue' : 'black';
			model.emmisionStates[i].draw(c,(model.emmisionStates[i] === selectedObj));	
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
			c.fillStyle = c.strokeStyle = (model.transitions[i][j] === selectedObj || (model.states[i] === selectedObj && model.emmisionStates[j] === currentEmmision)) ? 'blue' : 'black';
			model.transitions[i][j].draw(c,(model.transitions[i][j] === selectedObj));
		}
	}
}

var caretTimer = null;
var caretVisible = true;

function resetCaret() {
	clearInterval(caretTimer);
	caretTimer = setInterval('caretVisible = !caretVisible; refreshComponents()', 500);
	caretVisible = true;
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