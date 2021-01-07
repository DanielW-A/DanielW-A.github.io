class LatentState extends State{
   
    constructor(x,y,id){
        super(x,y,id);
        this.emmisionProabilities = {};  //[State] = value
    }

    getEmmision(){
        var check = Math.random();
        var probSum = 0;
        for (i in model.transitions[this.id]) {
            if (model.transitions[this.id][i].endNode instanceof EmmisionState){
                probSum += parseFloat(model.transitions[this.id][i].text);
                if (probSum > check) {
                    return model.emmisionStates[i];
                }
            }
        }
    }

}

class EmmisionState extends State{
   
    constructor(x,y,id){
        super(x,y,id);
        this.emmision = null;
    }

    getEmmision(){
        return (this.emmision == null)? "("  + this.text + ")" : this.emmision;
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
    constructor(startNode,endNode,anchorAngle,text,isEmmision){
        super(startNode,endNode,text,anchorAngle);
        this.isEmmision = isEmmision;
    }
}

class HiddenMarkovModel extends MarkovModel{
    constructor(){
        super();
        this.lastEmmisionId = 0;
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
    addEmmisionState(x,y) {
        var id = 'e' +  this.lastEmmisionId++;
        this.emmisionStates[id] = new EmmisionState(x,y,id);
        return this.emmisionStates[id];
    }
    addTransistion(tempLink){
        if (tempLink.startNode instanceof EmmisionState){
            var temp =  tempLink.startNode;
            tempLink.startNode = tempLink.endNode;
            tempLink.endNode = temp;
        }
        if (tempLink.startNode instanceof EmmisionState){
            return  null;
        }
        if (!this.transitions[tempLink.startNode.id]) {this.transitions[tempLink.startNode.id] = {};}
        this.transitions[tempLink.startNode.id][tempLink.endNode.id] = new HMMTransition(tempLink.startNode,tempLink.endNode,tempLink.anchorAngle,null,(tempLink.endNode instanceof EmmisionState));
        if (!this.transitions[tempLink.startNode.id][tempLink.endNode.id].isEmmision){
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
        } else if (object instanceof EmmisionState){
            this.deleteEmmisionState(object);
        }
    }
    deleteEmmisionState(object){
        for (i in this.emmisionStates) {
            if (this.emmisionStates[i] === object) {
                this.removeAllEmmisionTrasitions(i);
                delete this.emmisionStates[i];
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
        for (i in this.states) {
            var state = this.states[i];
            if(state.isNear(mouse)){
                return state;
            }
        }
        for (i in this.emmisionStates){
            var state = this.emmisionStates[i];
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
                this.processor.errors.push("State id: " + i + ", name: " + this.states[i].text + "has a negative Inital proabulity");
            }
            if (initProb[i] == null){initProb[i] = 0;}
            probSum += initProb[i];
        }
        if (probSum == 0) {
            this.processor.warnings.push("There are no inital proabilitys, asining temporay ones");
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
            var emmisionSum = 0;
            for (j in trans[i]) {
                if (parseFloat(trans[i][j].text) < 0){
                    this.processor.errors.push("State id: " + i + ", name: " + this.states[i].text + "has a negative trasition proabulity");
                }
                if (trans[i][j].endNode instanceof EmmisionState){
                    emmisionSum += parseFloat(trans[i][j].text);
                } else {
                    transSum += parseFloat(trans[i][j].text);
                }
            }
            if (transSum != 1) {
                this.processor.errors.push("State id: " + i + ", name: " + this.states[i].text + ", trasitions sum to : " + transSum + " (Should be 1)");
            }
            if (emmisionSum != 1) {
                this.processor.errors.push("State id: " + i + ", name: " + this.states[i].text + ", emmisions sum to : " + emmisionSum + " (Should be 1)");
            }
        }

        var sts = this.states;
        for (i in sts) {
        }

        return (this.processor.errors.length == 0)
    }
}