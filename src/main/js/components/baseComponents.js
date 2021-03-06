class MarkovModel{
    constructor() {
        "use Strict";
        this.states = {};
        this.transitions = {};
        this.initialProbabilityDistribution = {};
        
        this.emissionStates = {};

        this.userStartState = null;

        this.lastId = 0;

        this.processor = {
            currentState: null,
            outPut: "",
            outPutLength: 0,
            emissionState: null,
            errors: [],
            warnings: []
        };
    }
    deleteState(object){
        for (var i in this.states) {
            if (this.states[i] === object) {
                this.removeAllTrasitions(i);
                delete this.states[i];
            }
        }
    }
    deleteTrasition(object){
        for (var i in this.transitions) {
            for (var j in this.transitions[i]){
                if (this.transitions[i][j] === object){
                    if (this.transitions[i][j].type == LinkType.ARC){
                        this.transitions[j][i].type = LinkType.DIRECT;
                    }
                    delete this.transitions[i][j];
                }
            }
        }
    }
    removeAllTrasitions(i) {
        delete this.transitions[i];
        for (var j in this.states){
            if (!this.transitions[j]){continue;}
            if (this.transitions[j][i]){delete this.transitions[j][i]}
        }
        return this;
    }
    removeTransition(stateA, stateB) {
        if (this.transitions[stateA]) { delete this.transitions[stateA][stateB]; }
        return this;
    }
    /////////////////////////////////////////////////
    // processing
    /////////////////////////////////////////////////
    init(){
        this.clearCache();
        this.getStartState();
    }
    clearCache() {
        this.processor.currentState = null;
        this.processor.outPut = "";
        this.processor.outPutLength = 0;
    }
    saveState(state) {
        this.processor.currentState = state;
        if (this instanceof HiddenMarkovModel){
            var emState = this.states[state].getEmissions();
            this.processor.outPut += emState.getEmissions();
            this.processor.emissionState = emState;
        } else {
            this.processor.outPut += this.states[state].getEmissions();
        }
        this.processor.outPutLength++;
    }
    getStartState() {
        var i;
        var probSum = 0;
        var check = Math.random();
        var initProb = this.initialProbabilityDistribution;
        for (i in initProb) {
            probSum += parseFloat(initProb[i]);
            if (probSum > check) {
                this.saveState(i);
                return;
            }
        }
    }
    transition(state) {
        var i;
        var check = Math.random();
        var probSum = 0.0;
        var trans = this.transitions[state];
        for (i in trans) {
            probSum += parseFloat(trans[i].text);
            if (probSum > check) {
                return i;
            }
        }
    }
    step() {
        var temp = this.transition(this.processor.currentState);
        this.saveState(temp);
        return this.processor.outPut;
    }

    validateProbability(text){ // slower than original but handles pasting without disabling it.
        if (text == ""){
            return text;
        }
    
        if (text.charCodeAt(0) != 48){
            if (text.charCodeAt(0) == 46){
                return "0.";
            }
            if (text.charCodeAt(0) == 49){
                return "1";
            }
            return "";
        }

        if (text.charCodeAt(1) != 46){
            return "0";
        }
        for (var i=2; i < text.length; i++){
            var keyCode = text.charCodeAt(i);
            if(!(keyCode >= 48 && keyCode <= 57)){
                return text.substr(0, i);
            }
        }
    
        return text;
    }

    createModelOn(obj){
    
        for (var i in obj.states){
            var oldState = obj.states[i];
            var state = this.addState(oldState.x,oldState.y,oldState.id);
            state.text = oldState.text;
            this.initialProbabilityDistribution[i] = obj.initialProbabilityDistribution[i];
        }
        
        if (this instanceof HiddenMarkovModel){
            for ( var i in obj.emissionStates){
                var oldEmmisisonState = obj.emissionStates[i];
                var emissionState = model.addEmissionState(oldEmmisisonState.x,oldEmmisisonState.y);
                emissionState.text = oldEmmisisonState.text;
                emissionState.emission = oldEmmisisonState.emission;
            }
        }
        
        for (var i in obj.transitions){
            for (var j in obj.transitions[i]){
                var oldTrans = obj.transitions[i][j];
                var trans = model.addTransistion(new TempLink(model.states[oldTrans.startNode.id],{x : oldTrans.endNode.x, y :oldTrans.endNode.y}));
                trans.text = oldTrans.text;
                trans.anchorAngle = oldTrans.anchorAngle; 
            }
        }
    
    
    }
}

const LinkType = {
    DIRECT: 'direct',
    ARC: 'arc',
    SELF: 'self'
}

const colours = ["#0000FF","#FF0000","#FFA500","#9932CC","#A0522D","#008000","#6D6656","#0BBB1B","#532233","#897EF1","#A41AB6","#117509"]; //(make it a multiple of 6)
const nodeRadius = 30; 
const mousePadding = 5;

class viewable{
    constructor(x,y){
        "use Strict";
        this.x = x;
        this.y = y;
    }
}

class State extends viewable {
    constructor(x,y,id){
        super(x,y);
        this.id = id;
        this.text = "";
    }

    isNear(mouse) {
        return ((mouse.x - this.x) * (mouse.x - this.x) + (mouse.y - this.y) * (mouse.y - this.y) < nodeRadius * nodeRadius); 
    }
   
    closestPointOnCircle(x,y) {
        var dx = x - this.x;
        var dy = y - this.y;
        var scale = Math.sqrt(dx * dx + dy * dy);
        return {
            x: this.x + dx * nodeRadius / scale,
            y: this.y + dy * nodeRadius / scale
        };
    }

    draw(c,isSelected){
        
        c.beginPath();
        c.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI, false);
        c.stroke();
        
        this.addText(c,this.text,this.x,this.y,isSelected);
    }

    addText = function(c,text,x,y,isSelected){
        c.font = font;
        var width = c.measureText(text).width;
        x -= Math.round(width / 2);
        c.fillText(text, x, y + 6);
        if(isSelected && caretVisible && document.hasFocus()) {
            x += width;
            c.beginPath();
            c.moveTo(x, y - 10);
            c.lineTo(x, y + 10);
            c.stroke();
        }
    }
}

class Link extends viewable {
    constructor(startNode,x,y){
        super(x,y);
        this.startNode = startNode;
        this.endNode = null;
        this.type = null;
        this.endPos = {
            x :0,
            y :0
        };
        this.startPos = {
            x :0,
            y :0
        };
        this.anchorAngle = 0;
    }

    setAnchorangle(mousePos){
        this.anchorAngle = Math.atan2(mousePos.y - this.startNode.y, mousePos.x - this.startNode.x) + 0; //this.mouseOffsetAngle;
        if(this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI;
	    if(this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI;
    }
 
    det(a, b, c, d, e, f, g, h, i) {
        return a*e*i + b*f*g + c*d*h - a*f*h - b*d*i - c*e*g;
    }

    circleFromThreePoints(x1, y1, x2, y2, x3, y3) {
        var a = this.det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
        var bx = -this.det(x1*x1 + y1*y1, y1, 1, x2*x2 + y2*y2, y2, 1, x3*x3 + y3*y3, y3, 1);
        var by = this.det(x1*x1 + y1*y1, x1, 1, x2*x2 + y2*y2, x2, 1, x3*x3 + y3*y3, x3, 1);
        var c = -this.det(x1*x1 + y1*y1, x1, y1, x2*x2 + y2*y2, x2, y2, x3*x3 + y3*y3, x3, y3);
        return {
            'x': -bx / (2*a),
            'y': -by / (2*a),
            'radius': Math.sqrt(bx*bx + by*by - 4*a*c) / (2*Math.abs(a))
        };
    }
}

class StationaryLink extends Link {
    constructor(startNode,endNode,text,anchorAngle){
        super(startNode,(startNode.x + endNode.x)/2,(startNode.y + endNode.y)/2);
        this.endNode = endNode;
        this.text = (text == null)? "" : text;
		this.type = (endNode === startNode)? LinkType.SELF: LinkType.DIRECT;
        this.perpendicularPart = 20;
        this.parallelPart = 0.5;
        this.anchorAngle = anchorAngle;

        if (this.type === LinkType.SELF){
            this.x = this.startNode.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
            this.y = this.startNode.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
        }
    }

    getAnchorPoint() {
        var dx = this.endNode.x - this.startNode.x;
        var dy = this.endNode.y - this.startNode.y;
        var scale = Math.sqrt(dx * dx + dy * dy);
        return {
            'x': this.startNode.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
            'y': this.startNode.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
        };
    }

    draw(c,isSelected){ //TODO make more consitant and less redundant.
        var angle = null;
        this.x = (this.startNode.x + this.endNode.x)/2;
        this.y = (this.startNode.y + this.endNode.y)/2;
        if (this.type === LinkType.SELF){
            var circleX = this.startNode.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
            var circleY = this.startNode.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
            var circleRadius = 0.75 * nodeRadius;
            var startAngle = this.anchorAngle - Math.PI * 0.8;
            var endAngle = this.anchorAngle + Math.PI * 0.8;
    

            c.beginPath();
            c.arc(circleX, circleY, circleRadius, startAngle, endAngle, false);
            c.stroke();

            this.endPos.x = circleX + circleRadius * Math.cos(endAngle);
            this.endPos.y = circleY + circleRadius * Math.sin(endAngle);

            this.drawArrow(c, this.endPos.x, this.endPos.y, endAngle + Math.PI * 0.4);

            if(endAngle < startAngle) {
                endAngle += Math.PI * 2;
            }
            var textAngle = (startAngle + endAngle) / 2 +  Math.PI;
            var textX = circleX - circleRadius * Math.cos(textAngle);
            var textY = circleY - circleRadius * Math.sin(textAngle);
        
        } else if(this.type === LinkType.DIRECT){
            this.startPos = this.startNode.closestPointOnCircle(this.x, this.y);
            this.endPos = this.endNode.closestPointOnCircle(this.x, this.y);
            
            c.beginPath();
		    c.moveTo(this.startPos.x, this.startPos.y);
		    c.lineTo(this.endPos.x, this.endPos.y);
            c.stroke();
            this.drawArrow(c, this.endPos.x, this.endPos.y, Math.atan2(this.endPos.y - this.startPos.y, this.endPos.x - this.startPos.x));
            
		    var textX = (this.startPos.x + this.endPos.x) / 2;
		    var textY = (this.startPos.y + this.endPos.y) / 2;
		    var textAngle = Math.atan2(this.endPos.x - this.startPos.x, this.startPos.y - this.endPos.y);
        } else {
            var anchor = this.getAnchorPoint();
            var circle = this.circleFromThreePoints(this.startNode.x, this.startNode.y, this.endNode.x, this.endNode.y, anchor.x, anchor.y);
            var isReversed = (this.perpendicularPart > 0);
            var reverseScale = isReversed ? 1 : -1;
            var startAngle = Math.atan2(this.startNode.y - circle.y, this.startNode.x - circle.x) - reverseScale * nodeRadius / circle.radius;
            var endAngle = Math.atan2(this.endNode.y - circle.y, this.endNode.x - circle.x) + reverseScale * nodeRadius / circle.radius;
            this.startPos.x = circle.x + circle.radius * Math.cos(startAngle);
            this.startPos.y = circle.y + circle.radius * Math.sin(startAngle);
            this.endPos.x = circle.x + circle.radius * Math.cos(endAngle);
            this.endPos.y = circle.y + circle.radius * Math.sin(endAngle);

            c.beginPath();
		    c.arc(circle.x, circle.y, circle.radius, startAngle, endAngle, isReversed);
            c.stroke();
            this.drawArrow(c, this.endPos.x, this.endPos.y, endAngle - reverseScale * (Math.PI / 2));
    
            if(endAngle > startAngle) {
                endAngle += Math.PI * 2;
            }
            var textAngle = (startAngle + endAngle) / 2 +  Math.PI;
            var textX = circle.x - circle.radius * Math.cos(textAngle);
            var textY = circle.y - circle.radius * Math.sin(textAngle);
        }

        this.addText(c,this.text,textX,textY,textAngle,isSelected,this.type);
    }

    
    drawArrow(c, x, y, angle) {
	    var dx = Math.cos(angle);
	    var dy = Math.sin(angle);
	    c.beginPath();
	    c.moveTo(x, y);
	    c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
    	c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
	    c.fill();
    }

    addText = function(c,text,x,y,angle,isSelected,type){
        c.font = font;
        var width = c.measureText(text).width;
        x -= Math.round(width / 2);
        if(angle != null) {
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
            var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
            var slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
            if (type === LinkType.DIRECT && angle < 0){
                x += cornerPointX - sin * slide;
                y += cornerPointY + cos * slide;
            } else {
                x -= cornerPointX - sin * slide;
                y -= cornerPointY + cos * slide;
            }
        }
        c.fillText(text, x, y + 6);


        if(isSelected && caretVisible && document.hasFocus()) {
            x += width;
            c.beginPath();
            c.moveTo(x, y - 10);
            c.lineTo(x, y + 10);
            c.stroke();
        }
    }

    isNear(mouse){
        if (this.type === LinkType.SELF){
	        var dx = mouse.x - (this.startNode.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle));
	        var dy = mouse.y - (this.startNode.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle));
	        var distance = Math.sqrt(dx*dx + dy*dy) - 0.75 * nodeRadius;
	        return (Math.abs(distance) < mousePadding);
        }else if (this.type === LinkType.ARC){
            var anchor = this.getAnchorPoint();
            var circle = this.circleFromThreePoints(this.startNode.x, this.startNode.y, this.endNode.x, this.endNode.y, anchor.x, anchor.y);
            var dx = mouse.x - circle.x;
		    var dy = mouse.y - circle.y;
            var distance = Math.sqrt(dx*dx + dy*dy) - circle.radius;
            var reverseScale = (this.perpendicularPart > 0) ? 1 : -1;
            var startAngle = Math.atan2(this.startNode.y - circle.y, this.startNode.x - circle.x) - reverseScale * nodeRadius / circle.radius;
            var endAngle = Math.atan2(this.endNode.y - circle.y, this.endNode.x - circle.x) + reverseScale * nodeRadius / circle.radius;
		    if(Math.abs(distance) < mousePadding) {
			    var angle = Math.atan2(dy, dx);
			    if(this.perpendicularPart > 0) {
				    var temp = startAngle;
				    startAngle = endAngle;
				    endAngle = temp;
			    }
			    if(endAngle < startAngle) {
			    	endAngle += Math.PI * 2;
			    }
			    if(angle < startAngle) {
				    angle += Math.PI * 2;
			    } else if(angle > endAngle) {
				    angle -= Math.PI * 2;
			    }
			    return (angle > startAngle && angle < endAngle);
		    }
        }else if((mouse.x < Math.max(this.startNode.x,this.endNode.x) + nodeRadius) && 
                (mouse.x > Math.min(this.startNode.x,this.endNode.x) - nodeRadius) &&  
                (mouse.y < Math.max(this.startNode.y,this.endNode.y) + nodeRadius) &&  
                (mouse.y > Math.min(this.startNode.y,this.endNode.y) - nodeRadius)){

            var d = (((this.endPos.x - this.startPos.x)*(this.startPos.y - mouse.y)) -
                        ((this.startPos.x - mouse.x) * (this.endPos.y - this.startPos.y)))/
                        Math.sqrt(Math.pow((this.endNode.x-this.startNode.x),2)+Math.pow((this.endNode.y-this.startNode.y),2));
            console.log(d);
            return (Math.abs(d) < mousePadding);
        }
        
    }
}

class TempLink extends Link{ // this will be the more adaptive link when being drawn.
	constructor(startNode,mousePos, endNode){
		super(startNode,mousePos.x,mousePos.y);
		this.mousePos = mousePos;
        if (endNode == null){
		    this.refresh(mousePos);
        } else {
            this.endNode = endNode;
        }
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
		if(this.type === LinkType.DIRECT || this.startNode instanceof EmissionState){
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
