

drawNode = function(canvas,state,name) {
	// draw the circle
	canvas.beginPath();
	canvas.arc(state.x, state.y, 50, 0, 2 * Math.PI, false);
	canvas.stroke();

	// draw the text
	//drawText(c, this.text, this.x, this.y, null, selectedObject == this);

	// draw a double circle for an accept state
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

relativeMousePos = function(e){
    var element = elementPos(e);
    return {
		'x': e.pageX - element.x,
		'y': e.pageY - element.y
	};
}
