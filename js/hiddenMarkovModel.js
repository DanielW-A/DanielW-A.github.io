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
                    throw 'Xi and Gamma are not equal!'
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
