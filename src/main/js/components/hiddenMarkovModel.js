const dp = 124;

class LatentState extends State{
   
    constructor(x,y,id,colour){
        super(x,y,id);
        this.emissionProabilities = {}; 
        this.colour = colour;
    }

    getEmissions(){
        var check = Math.random();
        var probSum = 0;
        for (var i in model.transitions[this.id]) {
            if (model.transitions[this.id][i].endNode instanceof EmissionState){
                probSum += parseFloat(model.transitions[this.id][i].text);
                if (probSum > check) {
                    return model.emissionStates[i];
                }
            }
        }
    }

    getEmissionProbability(emissionState){
        if (emissionState instanceof EmissionState) {
            return (model.transitions[this.id][emissionState.id])?parseFloat(model.transitions[this.id][emissionState.id].text):0;
        }
        for (var i in model.transitions[this.id]) {
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

    closestPointOnCircle(x,y) { // not a circle a square but should keep the name the same.
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
        Big.DP = dp;
        model = this;
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
            X : [], //xi

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
    addState(x,y,id) { //latent
        if (id){this.lastId = id+1;} 
        else {id = this.lastId++;}
        this.states[id] =  new LatentState(x,y,id,this.nextColour());
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
        for (var i in this.emissionStates) {
            if (this.emissionStates[i] === object) {
                this.removeAllTrasitions(i);
                delete this.emissionStates[i];
            }
        }
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
            if (!this.transitions[i]) {continue}
            for (var j in this.transitions[i]){
                var trans = this.transitions[i][j];
                if (trans.isNear(mouse)){
                    return trans;
                }
            }
        }
        return null;
    }
    /////////////////////////////////////////////////
    // Error Checker
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
        if (sts == null || Object.keys(sts).length === 0){
            this.processor.errors.push("There are no latent states");
        }
        
        var names = [];
        for (i in sts) {
            if (sts[i].text == ""){
                this.processor.warnings.push("State id: " + i + " has no name");
            }
            for (j in sts){
                if (sts[i].text == sts[j].text && i != j && !names.includes(i)){
                    names.push(j);
                    this.processor.warnings.push("State id: " + i + " and state id: " + j + ", have the same name: " + sts[j].text);
                }
            }
        }

        var connection;
        var eStates = this.emissionStates;
        if (eStates == null || Object.keys(eStates).length === 0){
            this.processor.errors.push("There are no emmission states");
        }
        var emmissions = [];
        names = [];
        for (i in eStates){
            if (eStates[i].emission == "" || eStates[i].emission == null ) {
                this.processor.warnings.push("State id: " + i + ", name: " + eStates[i].text + " has defult emission string");
            } else if (eStates[i].getEmissions().length > 1) {
                this.processor.warnings.push("State id: " + i + ", name: " + eStates[i].text + " has an emission string of size >1");
            }
            for (j in eStates){
                if (eStates[i].getEmissions() == eStates[j].getEmissions() && eStates[i] != eStates[j] && !emmissions.includes(i)){
                    emmissions.push(j);
                    this.processor.errors.push("State id: " + i + ", name: " + eStates[i].text + " and state id: " + j + ", name: " + eStates[j].text + " have the same emission");
                }
                if (eStates[i].text == eStates[j].text && i != j && !names.includes(i)){
                    names.push(j);
                    this.processor.warnings.push("State id: " + i + " and state id: " + j + ", have the same name: " + eStates[j].text);
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

    validateObs(str){

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

    validateEmission(str){
        var char = str.charAt(str.length-1);

        for (var i in this.emmissions){
            if (this.emissionStates[i].getEmissions().toUpperCase() == char.toUpperCase()){
                return "";
            }
        }

        return char.toUpperCase();
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
        return [];
    }
    decodeEmissions(str){
        var emissions = []
        for (var i = 0; i < str.length; i++) {
            emissions[i] = str.charAt(i);
        }
        return emissions;
    }
    getTrasitionProability(i,j){ // needed when the trasition doesn't exist 
        return (this.transitions[i][j])?parseFloat(this.transitions[i][j].text):0;
    }
  
    algStep(type){
        this.validCheck();
        this.currentAlg = type;
        if (type == this.AlgType.FORWARD){this.forwardStep();}
        else if (type === this.AlgType.BACKWARD){this.backwardStep();}
        else if (type === this.AlgType.VITERBI){this.viterbiStep();}
        else if (type === this.AlgType.FORWARDBACKWARD){this.gammaStep();}
        else if (type === this.AlgType.BAUMWELCH){this.baumWelchStep();};
    }


    /////////////////////////////////////////////////
    // Forward
    /////////////////////////////////////////////////
    forwardStep(){
        
        this.algProsessor.done = false;
        if (this.algProsessor.observedString == null){
            var comp = document.getElementById("algString");
            comp.disabled = true;
            this.algProsessor.observedString = this.decodeEmissions(comp.value);
            this.initForward();
            document.getElementById("description").innerHTML = forwardDesc[0];
        } else if (this.algProsessor.observedString.length <= this.algProsessor.t){
            var comp = document.getElementById("algString");
            comp.disabled = false;
            this.algProsessor.done = true;
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
        for(var i in this.states){
            var tempSum = new Big(0);
            for(var j in this.states){
                tempSum = tempSum.plus(Big(this.algProsessor.A[t-1][j]).times(this.getTrasitionProability(j,i))); 
            }
            this.algProsessor.A[t][i] = tempSum.times(this.states[i].getEmissionProbability(this.getStateFromEmission(char)));
        }
    }
    initForward(){
        this.algProsessor.t = 1;
        this.algProsessor.A = [];
        this.algProsessor.A[this.algProsessor.t] = [];
        for (var i in this.states){
            var emissionState = this.getStateFromEmission(this.algProsessor.observedString[0]);
            this.algProsessor.A[this.algProsessor.t][i] = Big(this.initialProbabilityDistribution[i]).times(this.states[i].getEmissionProbability(emissionState));
        }
    }

    getStateFromEmission(string){
        for (var i in this.emissionStates){
            if (string === this.emissionStates[i].getEmissions()){return this.emissionStates[i];}
        }
        return null;
    }
    /////////////////////////////////////////////////
    // Backward
    /////////////////////////////////////////////////
    
    backwardStep(){
        if (this.algProsessor.observedString == null){
            var comp = document.getElementById("algString");
            comp.disabled = true;
            this.algProsessor.observedString = this.decodeEmissions(comp.value);
            this.initBackward();
        } else if (this.algProsessor.t <= 0){
            var comp = document.getElementById("algString");
            comp.disabled = false;
            comp.value = "";
        } else if (this.algProsessor.t <= 1){
            this.terminationBeta();
        } else { // inductive step;
            this.inductiveBackward();
        }
    }
    
    terminationBeta(){
        this.inductiveBackward();
        this.algProsessor.t = 0;
        var t = this.algProsessor.t;
        var char = this.algProsessor.observedString[t];
        for (var i in this.states){
            this.algProsessor.B[t][i] = this.algProsessor.B[t+1][i].times(this.states[i].getEmissionProbability(this.getStateFromEmission(char))).times(this.initialProbabilityDistribution[i])
        }
    }

    inductiveBackward(){
        this.algProsessor.t--;
        var t = this.algProsessor.t;
        this.algProsessor.B[t] = [];
        var char = this.algProsessor.observedString[t];
        for(var i in this.states){
            var tempSum = new Big(0);
            for(var j in this.states){
                tempSum = tempSum.plus(Big(this.algProsessor.B[t+1][j]).times(this.getTrasitionProability(i,j)).times(this.states[j].getEmissionProbability(this.getStateFromEmission(char)))); 
            }
            this.algProsessor.B[t][i] = tempSum;
        }
    }

    initBackward(){ 
        this.algProsessor.t = this.algProsessor.observedString.length;
        this.algProsessor.B[this.algProsessor.t] = [];
        for (var i in this.states){
            var emissionState = this.getStateFromEmission(this.algProsessor.observedString[0]);
            this.algProsessor.B[this.algProsessor.t][i] = new Big(1);
        }
        this.inductiveBackward();
    }

    /////////////////////////////////////////////////
    // most likely 
    /////////////////////////////////////////////////

    gammaStep(){
        this.algProsessor.done = false;
        if (this.algProsessor.observedString == null){
            this.initGamma();
        } else if (this.algProsessor.t < -2) {
            document.getElementById("algVarDropdown").value = this.AlgVars.A;
            this.runForward();
            this.algProsessor.t = -2;
        } else if (this.algProsessor.t < -1){
            document.getElementById("algVarDropdown").value = this.AlgVars.B;
            this.runBackward();
            this.algProsessor.t = -1;
        } else if (this.algProsessor.observedString.length <= this.algProsessor.t){
            var comp = document.getElementById("algString");
            comp.disabled = false;
            this.algProsessor.done = true;
        } else { // inductive step;
            
            document.getElementById("algVarDropdown").value = this.AlgVars.Y;
            this.inductiveGamma();
        }
    }

    initGamma(){
        //get the string
        //stop string being edited 
        var comp = document.getElementById("algString");
        comp.disabled = true;
        this.algProsessor.observedString = this.decodeEmissions(comp.value);
        this.algProsessor.t = -3;
    }

    runForward(){
        this.initForward();
        this.algProsessor.A[0] = [];
        this.algProsessor.A[0][0] = new Big(this.initialProbabilityDistribution[0]);
        this.algProsessor.A[0][1] = new Big(this.initialProbabilityDistribution[1]);
        for (var i = 0; i < this.algProsessor.observedString.length-1; i++){
            this.inductiveFoward();
        }
        this.normalise(this.algProsessor.A);
    }

    runBackward(){
        this.initBackward();
        for (var i = 0; i < this.algProsessor.observedString.length-1; i++){
            this.inductiveBackward();
        }
        this.normalise(this.algProsessor.B);
    }

    normalise(input){
        for (var i in input){
            var sum = new Big(0);
            for (var j in input[i]){
                sum = sum.plus(input[i][j]);
            }
            for (var j in input[i]){
                if (sum.eq('0')){input[i][j] = sum;}
                else if (input[i][j] != 1) {input[i][j] = input[i][j].div(sum)};
            }
        }
        return input;
    }

    inductiveGamma(){
        
        this.algProsessor.t++;
        var t = this.algProsessor.t;
        this.algProsessor.Y[t] = [];
        var char = this.algProsessor.observedString[t-1];
        
        var tempSum = new Big(0);
        for(var i in this.states){
            tempSum = tempSum.plus(Big(this.algProsessor.A[t][i]).times(this.algProsessor.B[t][i]));
        }
        for(var i in this.states){
            var numerator = new Big(this.algProsessor.A[t][i]).times(this.algProsessor.B[t][i])
            if (tempSum.eq('0')){
                this.algProsessor.Y[t][i] = tempSum;
            }else {
                this.algProsessor.Y[t][i] = numerator.div(tempSum);
            }
        }
    }

    /////////////////////////////////////////////////
    // Viterbi 
    /////////////////////////////////////////////////

    viterbiStep(){
        if (this.algProsessor.observedString == null){
            document.getElementById("algVarDropdown").value = this.AlgVars.D;
            var comp = document.getElementById("algString");
            comp.disabled = true;
            this.algProsessor.observedString = this.decodeEmissions(comp.value);
            this.initViterbi();
        } else if (this.algProsessor.observedString.length <= this.algProsessor.t){
            var comp = document.getElementById("algString");
            comp.disabled = false;
            var sequence = this.getSqeuence();
            document.getElementById("description").innerHTML = "Most likely sequence of latent states: " + sequence;
        } else { // inductive step;
            document.getElementById("algVarDropdown").value = this.AlgVars.D;
            this.inductiveViterbi();
        }
    }

    getSqeuence(){
        var max = new Big(0);
        var argMax = "";
        for (var i in this.algProsessor.D[this.algProsessor.t]){
            if (this.algProsessor.D[this.algProsessor.t][i].gte(max)){
                max = this.algProsessor.D[this.algProsessor.t][i];
                argMax = i;
            }
        }
        var sequence = ","+this.states[argMax].text;
        for (var i = this.algProsessor.t+1; i--; 2 < i){
            if (i < 2){
                continue;
            }
            sequence = ","+this.algProsessor.P[i][argMax] + sequence;
            argMax = this.algProsessor.P[i][argMax+"id"];
        }
        sequence = sequence.substr(1,sequence.length);
        return sequence;
    }

    initViterbi(){

        this.algProsessor.t = 1;
        this.algProsessor.D[this.algProsessor.t] = [];
        for (var i in this.states){
            var emissionState = this.getStateFromEmission(this.algProsessor.observedString[0]);
            this.algProsessor.D[this.algProsessor.t][i] = Big(this.initialProbabilityDistribution[i]).times(this.states[i].getEmissionProbability(emissionState));
        }
    }

    inductiveViterbi(){
        
        this.algProsessor.t++;
        var t = this.algProsessor.t;
        this.algProsessor.D[t] = [];
        this.algProsessor.P[t] = [];
        var char = this.algProsessor.observedString[t-1];

        var max = new Big('0');
        var argMax = "";
        for (var j in this.states){
            max = new Big('0');
            argMax = "";
            for (var i in this.states){
                var temp = new Big(this.algProsessor.D[this.algProsessor.t-1][i]).times(this.getTrasitionProability(i,j));
                if (temp.gte(max)){
                    max = temp;
                    argMax = i;
                }
            }

            this.algProsessor.D[this.algProsessor.t][j] = max.times(this.states[j].getEmissionProbability(this.getStateFromEmission(char)));
            this.algProsessor.P[this.algProsessor.t][j] = "" + this.states[argMax].text;
            this.algProsessor.P[this.algProsessor.t][j+"id"] = argMax;
        }
    }


    /////////////////////////////////////////////////
    // Baum-Welch 
    /////////////////////////////////////////////////

    baumWelchStep(){
        if (this.algProsessor.observedString == null){
            this.initBaumWelch();
        } else if (this.algProsessor.t < -2) {
            document.getElementById("algVarDropdown").value = this.AlgVars.A;
            this.runForward();
            this.algProsessor.t = -2;
        } else if (this.algProsessor.t < -1){
            document.getElementById("algVarDropdown").value = this.AlgVars.B;
            this.runBackward();
            this.algProsessor.t = -1;
        } else if (this.algProsessor.t < 0){
            document.getElementById("algVarDropdown").value = this.AlgVars.Y;
            this.runGamma();
            this.algProsessor.t = 0;
        } else if (this.algProsessor.observedString.length <= this.algProsessor.t+1){
            this.updateModel();
            var comp = document.getElementById("algString");
            comp.disabled = false;
            comp.value = "";
        } else { // inductive step;
            document.getElementById("algVarDropdown").value = this.AlgVars.X;
            this.inductiveBaumWelch();
        }
    }

    updateModel(){

        var testXi = 0
        for(var t = 0; t < this.algProsessor.observedString.length-1; t++){
            for (var i in this.states){
                testXi = new Big(0);
                for (var j in this.states){
                    testXi = testXi.plus(this.algProsessor.X[t+1][i][j]);
                }
                var testY = this.algProsessor.Y[t+1][i].round(dp-4,0);
                testXi = testXi.round(dp-4,0); // some small rounding errors, either way this is significant places so so little data lost.

                if (!testXi.eq(testY)){
                    var tes1 = testXi.toNumber();
                    var tes2 = testY.toNumber();
                    var diff = testY.minus(testXi);
                    throw 'Xi and Gamma are not equal!'
                } 
            }

        }


        // π0i = γ1(i)

        var sum = new Big(0);
        for(var i in this.states){
            this.initialProbabilityDistribution[i] = removeZeros(this.algProsessor.Y[1][i].toFixed(6));
            sum = sum.plus(this.initialProbabilityDistribution[i]);
        }
        if (!sum.eq(1)){
            this.initialProbabilityDistribution[1] = Big(this.initialProbabilityDistribution[1]).plus(sum.minus(1));
        }

        //         m0i,j = ΣT−1t=1 ξt(i, j)/ΣT−1t γt(i)

        var xiSum = 0;
        var gammaSum = 0;
        for (var i in this.states){
            for (var j in this.states){
                
                xiSum = new Big(0);
                gammaSum = new Big(0);
                for(var t = 0; t < this.algProsessor.observedString.length-1; t++){
                    xiSum = xiSum.plus(this.algProsessor.X[t+1][i][j]);
                    gammaSum = gammaSum.plus(this.algProsessor.Y[t+1][i]);
                }
                if (gammaSum.eq(0) || xiSum.eq(0)){
                    if(this.transitions[i][j]){this.delete(this.transitions[i][j])}
                } else {
                    if (!this.transitions[i][j]){
                        throw "this shouldnt happen"
                    }
                    this.transitions[i][j].text = removeZeros(xiSum.div(gammaSum).toFixed(6));
            
                }
            }
        }
        

        //         e0j(k) = ΣT−1t=1 γt(i)/ΣT−1t=1 γt(i)

        var conditionalGammaSumm = 0;
        for (var i in this.states){
            if (i == 3){
                // console.log("here");
            }
            for (var j in this.emissionStates){

                conditionalGammaSumm = new Big(0);
                gammaSum = new Big(0);
                for (var t = 0; t < this.algProsessor.observedString.length; t++){
                    gammaSum = gammaSum.plus(this.algProsessor.Y[t+1][i]);
                    if (this.algProsessor.observedString[t] == this.emissionStates[j].getEmissions()){
                        conditionalGammaSumm = conditionalGammaSumm.plus(this.algProsessor.Y[t+1][i]);
                    }
                }
                if (gammaSum.eq(0) || conditionalGammaSumm.eq(0)){
                    if(this.transitions[i][j]){this.delete(this.transitions[i][j])}
                } else {
                    if (!this.transitions[i][j]){
                        throw "this shouldnt happen"
                    }
                    this.transitions[i][j].text = removeZeros(conditionalGammaSumm.div(gammaSum).toFixed(6));
            
                }
            }
        }
    }

    runGamma(){
        this.algProsessor.t = 0;
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

        this.algProsessor.t++
        var t = this.algProsessor.t;
        this.algProsessor.X[t] = [];
        var char = this.algProsessor.observedString[t];

        var sum = new Big(0);
        for (var i in this.states){
            for (var j in this.states){
                sum = sum.plus(this.algProsessor.A[t][i].times(this.getTrasitionProability(i,j)).times(this.states[j].getEmissionProbability(this.getStateFromEmission(char))).times(this.algProsessor.B[t+1][j]));
            }
        }

        for (var i in this.states){
            if (!this.algProsessor.X[t][i]){this.algProsessor.X[t][i] = [];}
            for (var j in this.states){
                var numerator = this.algProsessor.A[t][i].times(this.getTrasitionProability(i,j)).times(this.states[j].getEmissionProbability(this.getStateFromEmission(char))).times(this.algProsessor.B[t+1][j])
                if (sum.eq('0')) {
                    this.algProsessor.X[t][i][j] = sum
                }else {
                    this.algProsessor.X[t][i][j] = numerator.div(sum);
                }
            }
        }
    }


    AlgType = {
        FORWARD: 'Forward',
        BACKWARD: 'Backward',
        FORWARDBACKWARD: 'Forward-Backward',
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

    forwardBackwardVars = {
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
