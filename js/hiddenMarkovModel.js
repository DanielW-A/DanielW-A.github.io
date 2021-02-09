class LatentState extends State{
   
    constructor(x,y,id){
        super(x,y,id);
        this.emmisionProabilities = {};  //[State] = value
        this.colour = model.nextColour();
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

    getEmmisionProbability(emmisionState){
        if (emmisionState instanceof EmmisionState) {return parseFloat(model.transitions[this.id][emmisionState.id].text);}
        for (i in model.transitions[this.id]) {
            if (model.transitions[this.id][i].endNode instanceof EmmisionState){
                if (model.transitions[this.id][i].endNode.getEmmision() == emmisionState){
                    return parseFloat(model.transitions[this.id][i].text);
                }
            }
        }
        return 0;
    }
}

class EmmisionState extends State{
   
    constructor(x,y,id){
        super(x,y,id);
        this.emmision = null;
    }

    getEmmision(){
        return (this.emmision == null)? this.text : this.emmision;
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
        this.algProsessor = {
            type : null,
            observedString : null,
            t : 0,
            A : [], //alpha
            B : [], //beta
            G : [], //gamma
            D : [], //delta
            p : [], //psi
            x : []  //xi
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
                this.removeAllTrasitions(i);
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
        var i;
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
            probSum += parseFloat(initProb[i]);
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
        for (i in this.states) {
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
            transSum = Math.round( transSum * 10000 + Number.EPSILON ) / 10000;
            emmisionSum = Math.round( emmisionSum * 10000 + Number.EPSILON ) / 10000;
            if (transSum != 1) {
                this.processor.errors.push("State id: " + i + ", name: " + this.getState(i).text + ", trasitions sum to : " + transSum + " (Should be 1)");
            }
            if (emmisionSum != 1) {
                this.processor.errors.push("State id: " + i + ", name: " + this.getState(i).text + ", emmisions sum to : " + emmisionSum + " (Should be 1)");
            }
        }

        var sts = this.states;
        if (sts == null || sts == []){
            this.processor.errors.push("There are no latent states");
        }
        for (i in sts) {

        }

        var connection;
        var eStates = this.emmisionStates;
        if (eStates == null || eStates == []){
            this.processor.errors.push("There are no emmission states");
        }
        var emmissions = [];
        for (i in eStates){
            for (j in eStates){
                if (eStates[i].getEmmision() == eStates[j].getEmmision() && eStates[i] != eStates[j] && !emmissions.includes(i)){
                    emmissions.push(j);
                    this.processor.errors.push("State id: " + i + ", name: " + eStates[i].text + " and state id: " + j + ", name: " + eStates[j].text + " have the same emmision");
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
                this.processor.warnings.push("State id: " + i + ", name: " + eStates[i].text + " is not used, concider removing.");
            }
        }

        return (this.processor.errors.length == 0)
    }

    validateObS(str){
        for (i in this.emmisionStates){
            if (this.emmisionStates[i].getEmmision() == str.charAt(str.length-1).toLowerCase()){
                return str.substr(0, str.length - 1) + str.charAt(str.length-1).toLowerCase();
            }
            if (this.emmisionStates[i].getEmmision() == str.charAt(str.length-1).toUpperCase()){
                return str.substr(0, str.length - 1) + str.charAt(str.length-1).toUpperCase();
            }
        }
        return str.substr(0, str.length - 1);
    }

    getEmmisionState(emmisionStr){
        for (var i in this.emmisionStates){
            if (this.emmisionStates[i].getEmmision() == emmisionStr){
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
        return (this.states[str] != null)? this.states[str] : this.emmisionStates[str];
    }
    getAlpha(){
        return this.algProsessor.A;
    }
    getBeta(){
        return this.algProsessor.B;
    }
    decodeEmmisions(str){
        //TODO THis is just a placeholder
        var emmisions = []
        for (var i = 0; i < str.length; i++) {
            emmisions[i] = str.charAt(i);
        }
        return emmisions;
    }
  
    algStep(type){
        this.currentAlg = type;
        if (type == this.AlgType.FORWARD){this.forwardStep();}
        else if (type === this.AlgType.FORWARDBACKWARD){this.forwardBackwardStep();}
        else if (type === this.AlgType.VITERBI){}//TODO;
        else if (type === this.AlgType.BAUMWELCH){}//TODO;
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
            this.algProsessor.t++
            var t = this.algProsessor.t;
            this.algProsessor.A[t] = [];
            var char = this.algProsessor.observedString[t-1];
            for(i in this.states){
                var tempSum = 0;
                for(j in this.states){
                    tempSum += this.algProsessor.A[t-1][j]*parseFloat(this.transitions[j][i].text); 
                }
                this.algProsessor.A[t][i] = tempSum*this.states[i].getEmmisionProbability(this.getStateFromEmmision(char));
                this.algProsessor.A[t][i] = Math.round( this.algProsessor.A[t][i] * 10000 + Number.EPSILON ) / 10000;
            }
            document.getElementById("description").innerHTML = forwardDesc[1];
        }
    }
    InitForward(){
        //get the string
        //stop string being edited 
        var comp = document.getElementById("algString");
        comp.disabled = true;
        this.algProsessor.observedString = this.decodeEmmisions(comp.value);
        this.algProsessor.t = 1;
        this.algProsessor.A[this.algProsessor.t] = [];
        for (var i in this.states){
            var emmisionState = this.getStateFromEmmision(this.algProsessor.observedString[0]);
            this.algProsessor.A[this.algProsessor.t][i] = this.initialProbabilityDistribution[i]*this.states[i].getEmmisionProbability(emmisionState);
            this.algProsessor.A[this.algProsessor.t][i] = Math.round( this.algProsessor.A[this.algProsessor.t][i] * 10000 + Number.EPSILON ) / 10000;
        }
    }

    getStateFromEmmision(string){
        for (i in this.emmisionStates){
            if (string === this.emmisionStates[i].getEmmision()){return this.emmisionStates[i];}
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
            this.algProsessor.t--;
            var t = this.algProsessor.t;
            this.algProsessor.B[t] = [];
            var char = this.algProsessor.observedString[t-1];
            for(i in this.states){
                var tempSum = 0;
                for(j in this.states){
                    tempSum += this.algProsessor.B[t+1][j]*parseFloat(this.transitions[i][j].text); 
                }
                this.algProsessor.B[t][i] = tempSum*this.states[i].getEmmisionProbability(this.getStateFromEmmision(char));
            }
        }
    }

    InitForwardBackward(){
        //get the string
        //stop string being edited 
        var comp = document.getElementById("algString");
        comp.disabled = true;
        this.algProsessor.observedString = this.decodeEmmisions(comp.value);
        this.algProsessor.t = this.algProsessor.observedString.length;
        this.algProsessor.B[this.algProsessor.t] = [];
        for (var i in this.states){
            var emmisionState = this.getStateFromEmmision(this.algProsessor.observedString[0]);
            this.algProsessor.B[this.algProsessor.t][i] = 1;
        }
    }
    /////////////////////////////////////////////////
    // Viterbi 
    /////////////////////////////////////////////////
    AlgType = {
        FORWARD: 'Forward',
        FORWARDBACKWARD: 'Forward-Backward',
        VITERBI: 'Viterbi',
        BAUMWELCH: 'Baum-Welch'
    }
}  
