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
        for (i in this.states) {
            if (this.states[i] === object) {
                this.removeAllTrasitions(i);
                delete this.states[i];
            }
        }
    }
    deleteTrasition(object){
        for (i in this.transitions) {
            for (j in this.transitions[i]){
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
        var self = this;
        $.each(self.transitions, function (stateA, sTrans) {
            $.each(sTrans, function (stateB) {
                if (stateB == i) { self.removeTransition(stateA, stateB); }
            });
        });
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
        console.log(temp);
        this.saveState(temp);
        return this.processor.outPut;
    }
}

const LinkType = {
    DIRECT: 'direct',
    ARC: 'arc',
    SELF: 'self'
}

const colours = ["#0000FF","#FF0000","#FFA500","#9932CC","#A0522D","#008000"]; //TODO (make it a multiple of 6)
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
        console.log(this.anchorAngle);
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


class LatentState extends State{
   
    constructor(x,y,id){
        super(x,y,id);
        this.emissionProabilities = {};  //[State] = value
        this.colour = model.nextColour();
    }

    getEmissions(){
        var check = Math.random();
        var probSum = 0;
        for (i in model.transitions[this.id]) {
            if (model.transitions[this.id][i].endNode instanceof EmissionState){
                probSum += parseFloat(model.transitions[this.id][i].text);
                if (probSum > check) {
                    return model.emissionStates[i];
                }
            }
        }
    }

    getEmissionProbability(emissionState){
        if (emissionState instanceof EmissionState) {return parseFloat(model.transitions[this.id][emissionState.id].text);}
        for (i in model.transitions[this.id]) {
            if (model.transitions[this.id][i].endNode instanceof EmissionState){
                if (model.transitions[this.id][i].endNode.getEmissions() == emissionState){
                    return parseFloat(model.transitions[this.id][i].text);
                }
            }
        }
        return 0;
    }
}

class EmissionState extends State{
   
    constructor(x,y,id){
        super(x,y,id);
        this.emission = null;
    }

    getEmissions(){
        return (this.emission == null)? this.text : this.emission;
    }

    closestPointOnCircle(x,y) { // not a circle but should keep the name the same.
        var dx = x - this.x;
        var dy = y - this.y;

        if (Math.abs(dx) > Math.abs(dy)){
            return {
                x: this.x + (nodeRadius * (dx/Math.abs(dx))),
                y: this.y + dy/(Math.abs(dx)/nodeRadius)
            }
        } else {
            return {
                x: this.x + dx/(Math.abs(dy)/nodeRadius),
                y: this.y + (nodeRadius * (dy/Math.abs(dy)))
            }
        }
    }

    draw(c,isSelected){
        
        c.beginPath();
        c.moveTo(this.x - nodeRadius,this.y - nodeRadius);
        c.lineTo(this.x + nodeRadius,this.y - nodeRadius);
        c.lineTo(this.x + nodeRadius,this.y + nodeRadius);
        c.lineTo(this.x - nodeRadius,this.y + nodeRadius);
        c.lineTo(this.x - nodeRadius,this.y - nodeRadius);
        c.stroke();
        
        this.addText(c,this.text,this.x,this.y,isSelected);
    }

}

class HMMTransition extends StationaryLink{
    constructor(startNode,endNode,anchorAngle,text,isEmission){
        super(startNode,endNode,text,anchorAngle);
        this.isEmission = isEmission;
    }
}

class HiddenMarkovModel extends MarkovModel{
    constructor(){
        super();
        this.lastEmissionId = 0;
        this.algProsessor = {
            type : null,
            observedString : null,
            t : 0,
            A : [], //alpha
            B : [], //beta
            Y : [], //gamma
            D : [], //delta
            P : [], //psi
            X : [],  //xi

            getObserevedString(){
                var str ="";
                for (i in this.observedString) {str += this.observedString[i]}
                return str;
            }
        }
    }
    /////////////////////////////////////////////////
    // Editing the model
    /////////////////////////////////////////////////
    addState(x,y) { //latent
        var id = this.lastId++;
        this.states[id] =  new LatentState(x,y,id);
        this.initialProbabilityDistribution[id] = 0;
        this.transitions[id] = {};
        return this.states[id];
    }
    nextColour() {
        var used = 0;
        var usedThreshold = 0;
        var i;
        var j;
        do {
            for (i in colours){
                used = 0;
                for (j in this.states){
                    if (this.states[j].colour === colours[i]){
                        used ++;
                    }
                }
                if(used <= usedThreshold){
                    return colours[i];
                }
            }
            usedThreshold ++;
        } while(true);
        
    }
    addEmissionState(x,y) {
        var id = 'e' +  this.lastEmissionId++;
        this.emissionStates[id] = new EmissionState(x,y,id);
        return this.emissionStates[id];
    }
    addTransistion(tempLink){
        if (tempLink.startNode instanceof EmissionState){
            var temp =  tempLink.startNode;
            tempLink.startNode = tempLink.endNode;
            tempLink.endNode = temp;
        }
        if (tempLink.startNode instanceof EmissionState){
            return  null;
        }
        if (!this.transitions[tempLink.startNode.id]) {this.transitions[tempLink.startNode.id] = {};}
        this.transitions[tempLink.startNode.id][tempLink.endNode.id] = new HMMTransition(tempLink.startNode,tempLink.endNode,tempLink.anchorAngle,null,(tempLink.endNode instanceof EmissionState));
        if (!this.transitions[tempLink.startNode.id][tempLink.endNode.id].isEmission){
            if (!(this.transitions[tempLink.endNode.id][tempLink.startNode.id] == null) && tempLink.startNode !== tempLink.endNode){
                this.transitions[tempLink.endNode.id][tempLink.startNode.id].type = LinkType.ARC;
                this.transitions[tempLink.startNode.id][tempLink.endNode.id].type = LinkType.ARC;
            }
        }
        return this.transitions[tempLink.startNode.id][tempLink.endNode.id];
    }
    delete(object) {
        if (object instanceof LatentState){
            this.deleteState(object);
        } else if( object instanceof StationaryLink){
            this.deleteTrasition(object);
        } else if (object instanceof EmissionState){
            this.deleteEmissionState(object);
        }
    }
    deleteEmissionState(object){
        for (i in this.emissionStates) {
            if (this.emissionStates[i] === object) {
                this.removeAllTrasitions(i);
                delete this.emissionStates[i];
            }
        }
    }
    removeAllTrasitions(i) {
        delete this.transitions[i];
        var self = this;
        $.each(self.transitions, function (stateA, sTrans) {
            $.each(sTrans, function (stateB) {
                if (stateB == i) { self.removeTransition(stateA, stateB); }
            });
        });
        return this;
    }
    getElementAt(mouse) {
        var i;
        for (i in this.states) {
            var state = this.states[i];
            if(state.isNear(mouse)){
                return state;
            }
        }
        for (i in this.emissionStates){
            var state = this.emissionStates[i];
            if(state.isNear(mouse)){
                return state;
            }
        }
        for (i in this.transitions){
            for (j in this.transitions[i]){
                var trans = this.transitions[i][j];
                if (trans.isNear(mouse)){
                    return trans;
                }
            }
        }
        return null;
    }
    validCheck(){
        var i = "";
        var j = "";

        this.processor.errors = [];
        this.processor.warnings = [];

        var probSum = 0.0;
        var initProb = this.initialProbabilityDistribution;
        for (i in this.states) {
            if (initProb[i] < 0){
                this.processor.errors.push("State id: " + i + ", name: " + this.states[i].text + "has a negative Initial probability");
            }
            if (initProb[i] == null){initProb[i] = 0;}
            probSum += parseFloat(initProb[i]);
        }
        if (probSum == 0) {
            this.processor.warnings.push("There are no initial probabilities, assigning temporary ones");
            tempInitial = true;
            for (i in this.states) {
                initProb[i] = 1/Object.keys(this.states).length;
            }
        }else if (probSum != 1) {
            this.processor.errors.push("The initial probability distribution sums to : " + probSum + " (Should be 1)");
        }



        var trans = this.transitions;
        for (i in this.states) {
            var transSum = 0;
            var emissionSum = 0;
            for (j in trans[i]) {
                if (parseFloat(trans[i][j].text) < 0){
                    this.processor.errors.push("State id: " + i + ", name: " + this.states[i].text + "has a negative transition  probability");
                }
                if (trans[i][j].endNode instanceof EmissionState){
                    emissionSum += parseFloat(trans[i][j].text);
                } else {
                    transSum += parseFloat(trans[i][j].text);
                }
            }
            transSum = Math.round( transSum * 10000 + Number.EPSILON ) / 10000;
            emissionSum = Math.round( emissionSum * 10000 + Number.EPSILON ) / 10000;
            if (transSum != 1) {
                this.processor.errors.push("State id: " + i + ", name: " + this.getState(i).text + ", transitions  sum to : " + transSum + " (Should be 1)");
            }
            if (emissionSum != 1) {
                this.processor.errors.push("State id: " + i + ", name: " + this.getState(i).text + ", emissions sum to : " + emissionSum + " (Should be 1)");
            }
        }

        var sts = this.states;
        if (sts == null || sts == []){
            this.processor.errors.push("There are no latent states");
        }
        for (i in sts) {
            if (sts[i].text == ""){
                this.processor.warnings.push("State id: " + i + " has no name");
            }

        }

        var connection;
        var eStates = this.emissionStates;
        if (eStates == null || eStates == []){
            this.processor.errors.push("There are no emmission states");
        }
        var emmissions = [];
        for (i in eStates){
            for (j in eStates){
                if (eStates[i].getEmissions() == eStates[j].getEmissions() && eStates[i] != eStates[j] && !emmissions.includes(i)){
                    emmissions.push(j);
                    this.processor.errors.push("State id: " + i + ", name: " + eStates[i].text + " and state id: " + j + ", name: " + eStates[j].text + " have the same emission");
                }
            }

            connection= false;
            for (j in trans) {
                if (trans[j][i]){
                    connection = true;
                    continue;
                }
            }
            if (!connection){
                this.processor.warnings.push("State id: " + i + ", name: " + eStates[i].text + " is not used, consider removing.");
            }
        }

        return (this.processor.errors.length == 0)
    }

    validateObS(str){

        var emmissions = {};
        for (var i in this.emissionStates){
            emmissions[i] = this.emissionStates[i].getEmissions().toUpperCase()
        }

        var newStr = "";

        for (var i=0; i < str.length; i++){
            var key = str.charAt(i);
            var valid = false;
            for (var j in emmissions){
                if(key.toUpperCase() == emmissions[j]){
                    valid = true;
                } 
            }
            if (valid){
                newStr += key.toUpperCase();
            }
            
        }

        return newStr
    }

    getEmissionState(emissionStr){
        for (var i in this.emissionStates){
            if (this.emissionStates[i].getEmissions() == emissionStr){
                return i;
            }
        }
    }
    
    /////////////////////////////////////////////////
    // Editing the model
    /////////////////////////////////////////////////
    clearAlgProsessor(){
        this.algProsessor.observedString = null;
        this.algProsessor.t = 0;
        this.algProsessor.A = [];
        this.algProsessor.B = [];
        this.algProsessor.G = [];
        this.algProsessor.D = [];
        this.algProsessor.p = [];
        this.algProsessor.x = [];
        document.getElementById("algString").disabled = false;
    
    }
    getState(str){
        return (this.states[str] != null)? this.states[str] : this.emissionStates[str];
    }
    getAlpha(){
        return this.algProsessor.A;
    }
    getBeta(){
        return this.algProsessor.B;
    }
    getVar(type){
        if (type == this.AlgVars.A) {return this.algProsessor.A;}
        if (type == this.AlgVars.B) {return this.algProsessor.B;}
        if (type == this.AlgVars.Y) {return this.algProsessor.Y;}
        if (type == this.AlgVars.D) {return this.algProsessor.D;}
        if (type == this.AlgVars.P) {return this.algProsessor.P;}
        if (type == this.AlgVars.X) {return this.algProsessor.X;}
    }
    decodeEmissions(str){
        //TODO THis is just a placeholder
        var emissions = []
        for (var i = 0; i < str.length; i++) {
            emissions[i] = str.charAt(i);
        }
        return emissions;
    }
  
    algStep(type){
        this.currentAlg = type;
        if (type == this.AlgType.FORWARD){this.forwardStep();}
        else if (type === this.AlgType.FORWARDBACKWARD){this.forwardBackwardStep();}
        else if (type === this.AlgType.VITERBI){this.viterbiStep();}
        else if (type === this.AlgType.MOSTLIKELY){this.gammaStep();}
        else if (type === this.AlgType.BAUMWELCH){this.baumWelchStep();}//TODO;
    }


    /////////////////////////////////////////////////
    // Forward
    /////////////////////////////////////////////////
    forwardStep(){
        if (this.algProsessor.observedString == null){
            this.InitForward();
            document.getElementById("description").innerHTML = forwardDesc[0];
        } else if (this.algProsessor.observedString.length <= this.algProsessor.t){
            var comp = document.getElementById("algString");
            comp.disabled = false;
            comp.value = "";
            highlightTable();
            // this.clearAlgProsessor();
            document.getElementById("description").innerHTML = forwardDesc[2];
        } else { // inductive step;
            this.inductiveFoward();
            document.getElementById("description").innerHTML = forwardDesc[1];
        }
    }
    inductiveFoward(){
        this.algProsessor.t++
        var t = this.algProsessor.t;
        this.algProsessor.A[t] = [];
        var char = this.algProsessor.observedString[t-1];
        for(i in this.states){
            var tempSum = 0;
            for(j in this.states){
                tempSum += this.algProsessor.A[t-1][j]*parseFloat(this.transitions[j][i].text); 
            }
            this.algProsessor.A[t][i] = tempSum*this.states[i].getEmissionProbability(this.getStateFromEmission(char));
            this.algProsessor.A[t][i] = Math.round( this.algProsessor.A[t][i] * 10000 + Number.EPSILON ) / 10000;
        }
    }
    InitForward(){
        //get the string
        //stop string being edited 
        var comp = document.getElementById("algString");
        comp.disabled = true;
        this.algProsessor.observedString = this.decodeEmissions(comp.value);
        this.algProsessor.t = 1;
        this.algProsessor.A[this.algProsessor.t] = [];
        for (var i in this.states){
            var emissionState = this.getStateFromEmission(this.algProsessor.observedString[0]);
            this.algProsessor.A[this.algProsessor.t][i] = this.initialProbabilityDistribution[i]*this.states[i].getEmissionProbability(emissionState);
            this.algProsessor.A[this.algProsessor.t][i] = Math.round( this.algProsessor.A[this.algProsessor.t][i] * 10000 + Number.EPSILON ) / 10000;
        }
    }

    getStateFromEmission(string){
        for (i in this.emissionStates){
            if (string === this.emissionStates[i].getEmissions()){return this.emissionStates[i];}
        }
        return null;
    }
    /////////////////////////////////////////////////
    // Forward-Backward
    /////////////////////////////////////////////////
    forwardBackwardStep(){
        if (this.algProsessor.observedString == null){
            this.InitForwardBackward();
        } else if (this.algProsessor.t <= 1){
            var comp = document.getElementById("algString");
            comp.disabled = false;
            comp.value = "";
        } else { // inductive step;
            this.inductiveBackward();
        }
    }

    inductiveBackward(){
        this.algProsessor.t--;
        var t = this.algProsessor.t;
        this.algProsessor.B[t] = [];
        var char = this.algProsessor.observedString[t-1];
        for(i in this.states){
            var tempSum = 0;
            for(j in this.states){
                tempSum += this.algProsessor.B[t+1][j]*parseFloat(this.transitions[i][j].text); 
            }
            this.algProsessor.B[t][i] = tempSum*this.states[i].getEmissionProbability(this.getStateFromEmission(char));
        }
    }

    InitForwardBackward(){
        //get the string
        //stop string being edited 
        var comp = document.getElementById("algString");
        comp.disabled = true;
        this.algProsessor.observedString = this.decodeEmissions(comp.value);
        this.algProsessor.t = this.algProsessor.observedString.length;
        this.algProsessor.B[this.algProsessor.t] = [];
        var char = this.algProsessor.observedString[this.algProsessor.t-1];
        for (var i in this.states){
            var emissionState = this.getStateFromEmission(this.algProsessor.observedString[0]);
            this.algProsessor.B[this.algProsessor.t][i] = 1;
            // this.algProsessor.B[this.algProsessor.t][i] = this.states[i].getEmissionProbability(this.getStateFromEmission(char))
        }
    }

    /////////////////////////////////////////////////
    // most likely 
    /////////////////////////////////////////////////

    gammaStep(){
        if (this.algProsessor.observedString == null){
            this.initGamma();
        } else if (this.algProsessor.t < -1) {
            this.runForward();
            this.algProsessor.t = -1;
        } else if (this.algProsessor.t < 0){
            this.runBackward();
            this.algProsessor.t = 0;
        } else if (this.algProsessor.observedString.length <= this.algProsessor.t){
            var comp = document.getElementById("algString");
            comp.disabled = false;
            comp.value = "";
        } else { // inductive step;
            this.inductiveGamma();
        }
    }

    initGamma(){
        //get the string
        //stop string being edited 
        var comp = document.getElementById("algString");
        comp.disabled = true;
        this.algProsessor.observedString = this.decodeEmissions(comp.value);
        this.algProsessor.t = -2;
    }

    runForward(){
        document.getElementById("algVarDropdown").value = this.AlgVars.A;
        this.InitForward();
        for (var i = 0; i < this.algProsessor.observedString.length-1; i++){
            this.inductiveFoward();
        }
    }

    runBackward(){
        document.getElementById("algVarDropdown").value = this.AlgVars.B;
        this.InitForwardBackward();
        for (var i = 0; i < this.algProsessor.observedString.length-1; i++){
            this.inductiveBackward();
        }
    }

    inductiveGamma(){
        document.getElementById("algVarDropdown").value = this.AlgVars.Y;
        
        this.algProsessor.t++;
        var t = this.algProsessor.t;
        this.algProsessor.Y[t] = [];
        var char = this.algProsessor.observedString[t-1];
        
        var tempSum = 0;
        for(i in this.states){
            tempSum += this.algProsessor.A[t][i] * this.algProsessor.B[t][i];
        }
        for(i in this.states){
            this.algProsessor.Y[t][i] = (this.algProsessor.A[t][i] * this.algProsessor.B[t][i]) / tempSum;
        }
    }

    /////////////////////////////////////////////////
    // Viterbi 
    /////////////////////////////////////////////////

    viterbiStep(){
        if (this.algProsessor.observedString == null){
            this.initViterbi();
        } else if (this.algProsessor.observedString.length <= this.algProsessor.t){
            var comp = document.getElementById("algString");
            comp.disabled = false;
            comp.value = "";
        } else { // inductive step;
            this.inductiveViterbi();
        }
    }

    initViterbi(){
        document.getElementById("algVarDropdown").value = this.AlgVars.D;
    
        var comp = document.getElementById("algString");
        comp.disabled = true;
        this.algProsessor.observedString = this.decodeEmissions(comp.value);

        this.algProsessor.t = 1;
        this.algProsessor.D[this.algProsessor.t] = [];
        for (var i in this.states){
            var emissionState = this.getStateFromEmission(this.algProsessor.observedString[0]);
            this.algProsessor.D[this.algProsessor.t][i] = this.initialProbabilityDistribution[i]*this.states[i].getEmissionProbability(emissionState);
            this.algProsessor.D[this.algProsessor.t][i] = Math.round( this.algProsessor.D[this.algProsessor.t][i] * 10000 + Number.EPSILON ) / 10000;
        }
    }

    inductiveViterbi(){
        document.getElementById("algVarDropdown").value = this.AlgVars.D;
        
        this.algProsessor.t++;
        var t = this.algProsessor.t;
        this.algProsessor.D[t] = [];
        this.algProsessor.P[t] = [];
        var char = this.algProsessor.observedString[t-1];

        var max = 0;
        var argMax = "";
        for (var j in this.states){
            for (var i in this.states){
                var temp = this.algProsessor.D[this.algProsessor.t-1][i]*parseFloat(this.transitions[i][j].text);
                if (temp > max){
                    max = temp;
                    argMax = i;
                }
            }

            this.algProsessor.D[this.algProsessor.t][j] = max*this.states[j].getEmissionProbability(this.getStateFromEmission(char));
            this.algProsessor.P[this.algProsessor.t][j] = "" + this.states[argMax].text;
        }
    }


    /////////////////////////////////////////////////
    // Baum-Welch 
    /////////////////////////////////////////////////

    baumWelchStep(){
        if (this.algProsessor.observedString == null){
            this.initBaumWelch();
        } else if (this.algProsessor.t < -2) {
            this.runForward();
            this.algProsessor.t = -2;
        } else if (this.algProsessor.t < -1){
            this.runBackward();
            this.algProsessor.t = -1;
        } else if (this.algProsessor.t < 0){
            this.runGamma();
            this.algProsessor.t = 0;
        } else if (this.algProsessor.observedString.length <= this.algProsessor.t+1){
            this.updateModel();
            var comp = document.getElementById("algString");
            comp.disabled = false;
            comp.value = "";
        } else { // inductive step;
            this.inductiveBaumWelch();
        }
    }

    updateModel(){

        var testXi = 0
        for(var t = 0; t < this.algProsessor.observedString.length-1; t++){
            for (var i in this.states){
                testXi = 0;
                for (var j in this.states){
                    testXi += this.algProsessor.X[t+1][i][j];
                }
                var testY = this.algProsessor.Y[t+1][i];
                if (testXi != testY){
                    this.algProsessor.Y[t+1][i] = testXi; // TODO terrible solution 
                    //throw 'Xi and Gamma are not equal!'
                } // TODO i think ill have to go over this by hand, there are many spaces i could have gone wrong.
            }

        }
        // for (var i in this.algProsessor.Y){

        // }

        // rAi) = C (Ai, /I


        // π0i = γ1(i)

        for(var i in this.states){
            this.initialProbabilityDistribution[i] = this.algProsessor.Y[1][i].toString();
        }

        //         m0i,j = ΣT−1t=1 ξt(i, j)/ΣT−1t γt(i)

        var xiSum = 0;
        var gammaSum = 0;
        for (var i in this.states){
            for (var j in this.states){
                
                xiSum = 0;
                gammaSum = 0;
                for(var t = 0; t < this.algProsessor.observedString.length-1; t++){
                    xiSum += this.algProsessor.X[t+1][i][j];
                    gammaSum += this.algProsessor.Y[t+1][i];
                }
                this.transitions[i][j].text = (xiSum/gammaSum).toString();
            }
        } // TODO check for epsilon errors and make more efficent.
        

        //         e0j(k) = ΣT−1t=1 γt(i)/ΣT−1t=1 γt(i)

        gammaSum = 0;
        var conditionalGammaSumm = 0;
        for (var i in this.states){
            for (var j in this.emissionStates){

                conditionalGammaSumm = 0;
                gammaSum = 0;
                for (var t = 0; t < this.algProsessor.observedString.length-1; t++){
                    gammaSum += this.algProsessor.Y[t+1][i];
                    if (this.algProsessor.observedString[t] == this.emissionStates[j].getEmissions()){
                        conditionalGammaSumm += this.algProsessor.Y[t+1][i];
                    }
                }
                this.transitions[i][j].text = (conditionalGammaSumm/gammaSum).toString();
            }
        }
    }

    runGamma(){
        this.algProsessor.t = 0;
        document.getElementById("algVarDropdown").value = this.AlgVars.Y;
        for (var i = 0; i < this.algProsessor.observedString.length; i++){
            this.inductiveGamma();
        }
        this.algProsessor.t = 0;
    }

    initBaumWelch(){
        var comp = document.getElementById("algString");
        comp.disabled = true;
        this.algProsessor.observedString = this.decodeEmissions(comp.value);
        this.algProsessor.t = -3;
    }

    inductiveBaumWelch(){
        
        document.getElementById("algVarDropdown").value = this.AlgVars.X;

        this.algProsessor.t++
        var t = this.algProsessor.t;
        this.algProsessor.X[t] = [];
        var char = this.algProsessor.observedString[t-1];

        var sum = 0;
        for (var i in this.states){
            for (var j in this.states){
                sum += this.algProsessor.A[t][i]*parseFloat(this.transitions[i][j].text)*this.states[j].getEmissionProbability(this.getStateFromEmission(char))*this.algProsessor.B[t+1][j];
            }
        }
        for (var i in this.states){
            if (!this.algProsessor.X[t][i]){this.algProsessor.X[t][i] = [];}
            for (var j in this.states){
                this.algProsessor.X[t][i][j] = (this.algProsessor.A[t][i]*parseFloat(this.transitions[i][j].text)*this.states[j].getEmissionProbability(this.getStateFromEmission(char))*this.algProsessor.B[t+1][j])/sum;
            }
        }
    }


    AlgType = {
        FORWARD: 'Forward',
        FORWARDBACKWARD: 'Forward-Backward',
        MOSTLIKELY: 'mostLikely',
        VITERBI: 'Viterbi',
        BAUMWELCH: 'Baum-Welch'
    }
    
    AlgVars = {
        A: 'alpha',
        B: 'beta',
        Y: 'gamma',
        D: 'delta',
        P: 'psi',
        X: 'Xi'
    }

    mostLikelyVars = {
        A: this.AlgVars.A,
        B: this.AlgVars.B,
        Y: this.AlgVars.Y
    }

    ViterbiVars = {
        D: this.AlgVars.D,
        P: this.AlgVars.P
    }

    baumWelchvars = {
        A: this.AlgVars.A,
        B: this.AlgVars.B,
        Y: this.AlgVars.Y,
        X: this.AlgVars.X
    }

    
} 

function save(){

    var myObj = {
        type: model.constructor.name,
        states: model.states,
        transitions: model.transitions,
        initialProbabilityDistribution : model.initialProbabilityDistribution, 
        emissionStates: (model instanceof HiddenMarkovModel)? model.emissionStates : null
    }

    var test = JSON.stringify(myObj,null, "\t");
    download("Model.json",test);
}

function load(){
    document.getElementById("loadInput").click();
    console.log("test");
}

function loadfile(){
    
    const curFiles = document.getElementById("loadInput").files;
    console.log(curFiles);

    if (curFiles.length == 1){
        var fr =  new FileReader();
        fr.readAsText(curFiles[0]);
        fr.addEventListener("load", function(){
            decodeJSON(fr.result);
        });
    }
}

function decodeJSON(str){
    var obj = JSON.parse(str);

    if (!(model.constructor.name === obj.type)){
        if (model instanceof HiddenMarkovModel){
            model = new MarkovChain();
        } else {
            model = new HiddenMarkovModel();
        }
    }
    initModelUI();
    refresh();

    for (var i in obj.states){
        var oldState = obj.states[i];
        var state = model.addState(oldState.x,oldState.y);
        state.text = oldState.text;
        model.initialProbabilityDistribution[i] = obj.initialProbabilityDistribution[i];
    }
    
    if (model instanceof HiddenMarkovModel){
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

    
    initModelUI();
    refresh();

}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }
const LaTexColours =  ["blue","red", "green", "cyan", "magenta", "yellow"]

function ExportAsLaTeX() {
	this._points = [];
	this._texData = '';
	this._scale = 100/canvas.width; // to convert pixels to document space

	this.toLaTeX = function() {
		return '\\documentclass[12pt]{article}\n' +
			'\\usepackage{tikz}\n' +
			'\n' +
			'\\begin{document}\n' +
			'\n' +
			'\\begin{center}\n' +
			'\\begin{tikzpicture}[scale=0.25, every node/.style={scale=0.8}]\n' +
			'\\tikzstyle{every node}+=[inner sep=0pt]\n' +
			this._texData +
			'\\end{tikzpicture}\n' +
			'\\end{center}\n' +
			'\n' +
			'\\end{document}\n';
	};

	this.beginPath = function() {
		this._points = [];
	};
    this.convertStrokeStyle = function(colour) {
        if (colour.charAt(0) != '#'){return colour}

        for(var i in colours){
            if (colours[i] == colour){
                return LaTexColours[parseInt(i) % LaTexColours.length];
            }
        }
    };
	this.arc = function(x, y, radius, startAngle, endAngle, isReversed) {
		x *= this._scale;
		y *= this._scale;
        this.strokeStyle = this.convertStrokeStyle(this.strokeStyle);
		radius *= this._scale;
		if(endAngle - startAngle == Math.PI * 2) {
			this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x, 3) + ',' + fixed(-y, 3) + ') circle (' + fixed(radius, 3) + ');\n';
		} else {
			if(isReversed) {
				var temp = startAngle;
				startAngle = endAngle;
				endAngle = temp;
			}
			if(endAngle < startAngle) {
				endAngle += Math.PI * 2;
			}
            if(Math.min(startAngle, endAngle) < -2*Math.PI) {
				startAngle += 2*Math.PI;
				endAngle += 2*Math.PI;
			} else if(Math.max(startAngle, endAngle) > 2*Math.PI) {
				startAngle -= 2*Math.PI;
				endAngle -= 2*Math.PI;
			}
			startAngle = -startAngle;
			endAngle = -endAngle;
			this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x + radius * Math.cos(startAngle), 3) + ',' + fixed(-y + radius * Math.sin(startAngle), 3) + ') arc (' + fixed(startAngle * 180 / Math.PI, 5) + ':' + fixed(endAngle * 180 / Math.PI, 5) + ':' + fixed(radius, 3) + ');\n';
		}
	};
	this.moveTo = this.lineTo = function(x, y) {
		x *= this._scale;
		y *= this._scale;
		this._points.push({ 'x': x, 'y': y });
	};
	this.stroke = function() {
		if(this._points.length == 0) return;
        this.strokeStyle = this.convertStrokeStyle(this.strokeStyle);
		this._texData += '\\draw [' + this.strokeStyle + ']';
		for(var i = 0; i < this._points.length; i++) {
			var p = this._points[i];
			this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
		}
		this._texData += ';\n';
	};
	this.fill = function() {
		if(this._points.length == 0) return;
        this.strokeStyle = this.convertStrokeStyle(this.strokeStyle);
		this._texData += '\\fill [' + this.strokeStyle + ']';
		for(var i = 0; i < this._points.length; i++) {
			var p = this._points[i];
			this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
		}
		this._texData += ';\n';
	};
	this.measureText = function(text) {
		var c = canvas.getContext('2d');
		c.font = '20px "Times New Romain", serif';
		return c.measureText(text);
	};
	this.fillText = function(text, x, y) {
        this.strokeStyle = this.convertStrokeStyle(this.strokeStyle);
        var originalText = text;
		if(text.replace(' ', '').length > 0) {
			var nodeParams = '';
			x *= this._scale;
			y *= this._scale;
            x += text.length/9; // i dont know why this is here, can't work out a better solution.
            y -= 0.3; // guess that latex and canvas start text at a deffernent pos.
			this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x, 2) + ',' + fixed(-y, 2) + ') node ' + nodeParams + '{$' + originalText.replace(/ /g, '\\mbox{ }') + '$};\n';
		}
	};

	this.translate = this.save = this.restore = this.clearRect = function(){};
}
function fixed(number, digits) {
	return number.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
}

var tempInitial = false;
// create a class for each visable component;
// TODO needs cleaning.
class ChainState extends State{
   
   
    constructor(x,y,id){
        super(x,y,id);
        this.emission = null;
    }

    getEmissions(){
        return (this.emission == null)? "("  + this.text + ")" : this.emission;
    }

}

class Transition extends StationaryLink{
    constructor(startNode,endNode,anchorAngle,text){
        super(startNode,endNode,text,anchorAngle);
    }
}

class MarkovChain extends MarkovModel{
    constructor() {
        super();
        this.algProsessor = {
            type : null,
            observedString : null,

            getObserevedString(){
                var str ="";
                for (i in this.observedString) {str += this.observedString[i]}
                return str;
            }
        }
    }
    /////////////////////////////////////////////////
    // Editing the model
    /////////////////////////////////////////////////
    addState(x, y) {
        var id = this.lastId++;
        console.log("new State with id : " + id);
        this.states[id] = new ChainState(x,y,id);
        this.initialProbabilityDistribution[id] = 0;
        this.transitions[id] = {};
        return this.states[id];
    }
    addTransistion(tempLink){
        if (!this.transitions[tempLink.startNode.id]) {this.transitions[tempLink.startNode.id] = {};}
        this.transitions[tempLink.startNode.id][tempLink.endNode.id] = new Transition(tempLink.startNode,tempLink.endNode,tempLink.anchorAngle,null);
        if (!(this.transitions[tempLink.endNode.id][tempLink.startNode.id] == null) && tempLink.startNode !== tempLink.endNode){
            this.transitions[tempLink.endNode.id][tempLink.startNode.id].type = LinkType.ARC;
            this.transitions[tempLink.startNode.id][tempLink.endNode.id].type = LinkType.ARC;
        }
        return this.transitions[tempLink.startNode.id][tempLink.endNode.id];
    }
    /////////////////////////////////////////////////
    // processing
    /////////////////////////////////////////////////
    saveState(state) {
        this.processor.currentState = state;
        this.processor.outPut += this.states[state].getEmissions();
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
        console.log(temp);
        this.saveState(temp);
        return this.processor.outPut;
    }
    delete(object) {
        if (object instanceof State){
            this.deleteState(object);
        } else if( object instanceof StationaryLink){
            this.deleteTrasition(object);
        }
    }
    getElementAt(mouse) {
        for (i in this.states) {
            var state = this.states[i];
            if(state.isNear(mouse)){
                return state;
            }
        }
        for (i in this.transitions){
            for (j in this.transitions[i]){
                var trans = this.transitions[i][j];
                if (trans.isNear(mouse)){
                    return trans;
                }
            }
        }
        return null;
    }
    getState(str){
        return this.states[str]; // used for campatibility with HMM
    }

    getVar(type){ //TODO compatability with HMM
        return [];
    }
    /////////////////////////////////////////////////
    // testing / running
    /////////////////////////////////////////////////
    validCheck(){
        var i = "";
        var j = "";

        this.processor.errors = [];
        this.processor.warnings = [];

        var probSum = 0.0;
        var initProb = this.initialProbabilityDistribution;
        for (i in this.states) {
            if (initProb[i] < 0){
                this.processor.errors.push("State id: " + i + ", name: " + this.states[i].text + "has a negative Initial probability");
            }
            if (initProb[i] == null){initProb[i] = 0;}
            probSum += parseFloat(initProb[i]);
        }
        if (probSum == 0) {
            this.processor.warnings.push("There are no inital probabilities, assigning temporary ones");
            tempInitial = true;
            for (i in this.states) {
                initProb[i] = 1/Object.keys(this.states).length;
            }
        }else if (probSum != 1) {
            this.processor.errors.push("The initial probability distribution sums to : " + probSum + " (Should be 1)");
        }



        var trans = this.transitions;
        for (i in trans) {
            var transSum = 0;
            for (j in trans[i]) {
                if (parseFloat(trans[i][j].text) < 0){
                    this.processor.errors.push("State id: " + i + ", name: " + this.states[i].text + "has a negative Initial probability");
                }
                transSum += parseFloat(trans[i][j].text);
            }
            if (transSum != 1) {
                this.processor.errors.push("State id: " + i + ", name: " + this.states[i].text + ", trasitions sum to : " + transSum + " (Should be 1)");
            }
        }

        var sts = this.states;
        if (sts == null || sts == []){
            this.processor.errors.push("There are no states");
        }
        for (i in sts) {
            if (i === sts[i]) {
                errorMsg += "WARNING : " + i + " state has defult emission string \n";
            } else if (sts[i].length > 1) {
                errorMsg += "WARNING : " + i + " state has defult emission string of lenght > 1 \n";
            }
        }

        return (this.processor.errors.length == 0); 
    }
    toString() {
        var i,j;
        var str = "";
        str += "S = {";
        var sts = this.states;
        for (i in sts) { str += sts[i].text + ','; }
        str += "}, \nT = {";
        var trans = this.transitions;
        for (i in trans) {
            str += "{";
            for (j in trans[i]) {
                str += trans[i][j].text + ',';
            }
            str += "},";
        }
        str += "}, \nPi = {";
        var initProb = this.initialProbabilityDistribution;
        for (i in initProb) { str += (initProb[i] == 0) ? '' : initProb[i] + ','; }
        str += "}";
        return str;
    }
    run(count,step) {
        if (this.validCheck() != "") { output.innerText("There are unresolved errors"); return;}
        if (count < 1 || count == null) { output.innerText(""); return; }

        var output = document.getElementById('output');

        this.clearCache();
        this.getStartState();

        while (this.processor.outPutLength < count) {
            this.step();
            sleep(step);
            output.innerText(this.processor.outPut);

        }
        return this.processor.outPut;
    }

    static runTests() {
        // function assert(outcome, description) {window.console && console.log((outcome ? 'Pass:' : 'FAIL:'),  description);}
        var myMC = new markovChain;

        console.log("Markov Chain Created");

        myMC.addState(0, 1);
        var s1 = 0;

        myMC.addState(0, 2);
        var s2 = 1;
        myMC.setName(s2, "S2");
        myMC.setEmissions(s2, "2");

        myMC.addState(0, 3);
        var s3 = 2;
        myMC.setName(s3, "S3");
        myMC.setEmissions(s3, "da");
        myMC.setInitialProbability(s3, 0.2);

        var states2 = {};
        states2 = myMC.states;

        console.log(states2);

        myMC.addTransistion(s1, s1, 0.1);
        myMC.addTransistion(s1, s2, 0.1);
        myMC.addTransistion(s1, s3, 0.8);

        myMC.addTransistion(s2, s1, 0.56);
        myMC.addTransistion(s2, s3, 0.44);

        myMC.addTransistion(s3, s2, 0.9);

        var trans = {};
        trans = myMC.transitions;

        console.log(trans);

        console.log(myMC.validCheck());



        myMC.setName(s1, "S1");
        myMC.setEmissions(s1, "1");

        myMC.setEmissions(s2, "2");
        myMC.setEmissions(s3, "3");

        myMC.addTransistion(s3, s3, 0.1);

        myMC.setInitialProbability(s1, 0.5);
        myMC.setInitialProbability(s2, 0.3);

        console.log(myMC.validCheck());

        console.log(myMC.run(20));

        console.log(myMC.toString());
    }

    AlgType = {
        LIKELIHOOD: 'likelihood'
    }
}


MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']]
    },
    svg: {
      fontCache: 'global'
    }
  };

const font ='20px "Times New Roman", serif';
var running = false;
var modelPanel;

function exportLatex(){
	var exporter = new ExportAsLaTeX();
	var oldSelectedObject = selectedObj;
	selectedObj = null;
	refreshComponents(exporter);
	selectedObj = oldSelectedObject;
	var texData = exporter.toLaTeX();
	download("Model.tex",texData);
}

module.exports.markovChain = MarkovChain;
module.exports.chainState = ChainState;
