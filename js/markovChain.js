// create a class for each visable component;
class State {
    constructor(x,y,id){
        this.id = id;
        this.x = x;
        this.y = y;
        this.text = "";
        this.emmision = null;
    }

    draw(c,isSelected){
        
        c.beginPath();
        c.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI, false);
        c.stroke();
        
        addText(c,this.text,this.x,this.y,null,isSelected);
    }

}

class Transition {
    constructor(startNode,endNode,text){
        this.startNode = startNode;
		this.endNode = endNode;
		this.type = (endNode === startNode)? LinkType.SELF: LinkType.DIRECT;
		this.x = (startNode.x + endNode.x)/2;
        this.y = (startNode.y + endNode.y)/2;
        this.text = (text == null)? "" : text;
        this.endPos = {
            x :0,
            y :0
        };
        this.startPos = {
            x :0,
            y :0
        };
    }

    draw(c,isSelected){
        
		if(this.type === LinkType.DIRECT){
            var endAngle = (this.startNode.y-this.endNode.y == 0)? Math.PI/2 :
                    Math.atan((this.startNode.x-this.endNode.x)/(this.startNode.y-this.endNode.y));
    
            this.endPos.x = (this.startNode.y < this.endNode.y)? -(nodeRadius*Math.sin(endAngle)) : nodeRadius*Math.sin(endAngle);
            this.endPos.x += this.endNode.x;
            this.endPos.y = (this.startNode.y < this.endNode.y)? -(nodeRadius*Math.cos(endAngle)) : nodeRadius*Math.cos(endAngle);
            this.endPos.y += this.endNode.y;
            var startAngle = (this.startNode.x-this.x == 0)? Math.PI/2 : 
                    Math.atan((this.startNode.y-this.endNode.y)/(this.startNode.x-this.endNode.x));
            
            this.startPos.x = (this.startNode.x > this.endNode.x)? -(nodeRadius*Math.cos(startAngle)) : nodeRadius*Math.cos(startAngle);
            this.startPos.x += this.startNode.x;
            this.startPos.y = (this.startNode.x > this.endNode.x)? -(nodeRadius*Math.sin(startAngle)) : nodeRadius*Math.sin(startAngle);
            this.startPos.y += this.startNode.y;

            c.beginPath();
			c.moveTo(this.startPos.x, this.startPos.y);
			c.lineTo(this.endPos.x, this.endPos.y);
            c.stroke();
            
        }
        
        addText(c,this.text,this.x,this.y,null,isSelected);
    }

    isNear(mouse){
        if((mouse.x < Math.max(this.startPos.x,this.endPos.x)) && 
                (mouse.x > Math.min(this.startPos.x,this.endPos.x)) &&  
                (mouse.y < Math.max(this.startPos.y,this.endPos.y)) &&  
                (mouse.y > Math.min(this.startPos.y,this.endPos.y))){

            var d = (((this.endPos.x - this.startPos.x)*(this.startPos.y - mouse.y)) -
                        ((this.startPos.x - mouse.x) * (this.endPos.y - this.startPos.y)))/
                        Math.sqrt(Math.pow((this.endNode.x-this.startNode.x),2)+Math.pow((this.endNode.y-this.startNode.y),2));
            console.log(d);
            return (d < 5)? true : false;
        }
    }
}

class markovChain {
    constructor() {
        "use strict";
        // the 3 - tuple that defines markov chains
        this.states = {};
        this.transitions = {};
        this.initialProbabilityDistribution = {};

        // TODO allow the user to start at a state they want.
        this.userStartState = null;

        this.lastId = 0;

        this.processor = {
            currentState: null,
            outPut: "",
            outPutLength: 0,
        };
    }
    /////////////////////////////////////////////////
    // Editing the model
    /////////////////////////////////////////////////
    addState(x, y) {
        var id = this.lastId++;
        console.log("new State with id : " + id);
        this.states[id] = new State(x,y,id);
        return this.states[id];
    }
    setName(id, text) {
        this.states[id].text = text;
        return this;
    }
    setEmmision(id, emmision) {
        this.states[id].emmision = emmision;
        return this;
    }
    setInitialProbability(state, probability) {
        this.initialProbabilityDistribution[state] = probability;
    }
    // addTransistion(stateA, stateB, probability) {
    //     if (!this.transitions[stateA]) {this.transitions[stateA] = {};}
    //     this.transitions[stateA][stateB] = new Transition(0,0,probability); // might switch stateB and prob in the future.
    //     return this;
    // }
    addTransistion(tempLink){
        if (!this.transitions[tempLink.startNode.id]) {this.transitions[tempLink.startNode.id] = {};}
        console.log(tempLink.startNode);
        console.log(tempLink.endNode);
        this.transitions[tempLink.startNode.id][tempLink.endNode.id] = new Transition(tempLink.startNode,tempLink.endNode,null);
        console.log(this.transitions);
    }
    editTransistion(stateA, stateB, probability){
        if (!this.transitions[stateA]) {this.transitions[stateA] = {};}
        this.transitions[stateA.id][stateB.id] = probability;
    }
    delete(object) {
        //TODO classify the object
        if (true) {
            console.log(this.states);
            console.log(object);
            for (i in this.states) {
                if (this.states[i] === object) {
                    this.removeAllTrasitions(i);
                    delete this.states[i];
                }
            }
            console.log(this.states);
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
    // Querying the model
    /////////////////////////////////////////////////
    getElementAt(mouse) {
        for (i in this.states) {
            var state = this.states[i];
            if ((mouse.x - state.x) * (mouse.x - state.x) + (mouse.y - state.y) * (mouse.y - state.y) < 50 * 50) {
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
    /////////////////////////////////////////////////
    // processing
    /////////////////////////////////////////////////
    clearCache() {
        this.processor.currentState = null;
        this.processor.outPut = "";
        this.processor.outPutLength = 0;
    }
    saveState(state) {
        this.processor.currentState = state;
        this.processor.outPut += this.states[state].emmision;
        this.processor.outPutLength++;
    }
    getStartState() {
        var i;
        var probSum = 0;
        var check = Math.random();
        var initProb = this.initialProbabilityDistribution;
        for (i in initProb) {
            probSum += initProb[i];
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
            probSum += trans[i].probability;
            if (probSum > check) {
                return i;
            }
        }
    }
    step() {
        var temp = this.transition(this.processor.currentState);
        console.log(temp);
        this.saveState(temp);
    }
    /////////////////////////////////////////////////
    // testing / running
    /////////////////////////////////////////////////
    validCheck() {
        var errorMsg = "";
        var i = "";
        var j = "";

        var probSum = 0.0;
        var initProb = this.initialProbabilityDistribution;
        for (i in initProb) {
            probSum += initProb[i];
        }
        if (probSum != 1) {
            errorMsg += "ERROR : The initial probability distribution sums to : " + probSum + " (Should be 1) \n";
        }

        var trans = this.transitions;
        for (i in trans) {
            var probSum = 0.0;
            for (j in trans[i]) {
                probSum += trans[i][j].probability;
            }
            if (probSum != 1) {
                errorMsg += "ERROR : " + i + " state trasition sums to : " + probSum + " (Should be 1) \n";
            }
        }

        var sts = this.states;
        for (i in sts) {
            if (i === sts[i]) {
                errorMsg += "WARNING : " + i + " state has defult emmision string \n";
            } else if (sts[i].length > 1) {
                errorMsg += "WARNING : " + i + " state has defult emmision string of lenght > 1 \n";
            }
        }

        return errorMsg; // should objectify this later.
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
    run(count) {
        if (this.validCheck() != "") { return "There are unresolved errors"; }
        if (count < 1 || count == null) { return ""; }

        this.clearCache();
        this.getStartState();

        while (this.processor.outPutLength < count) {
            this.step();
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
        myMC.setEmmision(s2, "2");

        myMC.addState(0, 3);
        var s3 = 2;
        myMC.setName(s3, "S3");
        myMC.setEmmision(s3, "da");
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
        myMC.setEmmision(s1, "1");

        myMC.setEmmision(s2, "2");
        myMC.setEmmision(s3, "3");

        myMC.addTransistion(s3, s3, 0.1);

        myMC.setInitialProbability(s1, 0.5);
        myMC.setInitialProbability(s2, 0.3);

        console.log(myMC.validCheck());

        console.log(myMC.run(20));

        console.log(myMC.toString());
    }
}









 















