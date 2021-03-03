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

module.exports.markovChain = MarkovChain;
module.exports.chainState = ChainState;
