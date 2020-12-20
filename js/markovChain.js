var tempInitial = false;
// create a class for each visable component;
class ChainState extends State{
   
   
    constructor(x,y,id){
        super(x,y,id);
        this.emmision = null;
    }

    getEmmision(){
        return (this.emmision == null)? "("  + this.text + ")" : this.emmision;
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
    // setName(id, text) {
    //     this.states[id].text = text;
    //     return this;
    // }
    // setEmmision(id, emmision) {
    //     this.states[id].emmision = emmision;
    //     return this;
    // }
    // setInitialProbability(state, probability) {
    //     this.initialProbabilityDistribution[state] = probability;
    // }
    // addTransistion(stateA, stateB, probability) {
    //     if (!this.transitions[stateA]) {this.transitions[stateA] = {};}
    //     this.transitions[stateA][stateB] = new Transition(0,0,probability); // might switch stateB and prob in the future.
    //     return this;
    // }
    addTransistion(tempLink){
        if (!this.transitions[tempLink.startNode.id]) {this.transitions[tempLink.startNode.id] = {};}
        this.transitions[tempLink.startNode.id][tempLink.endNode.id] = new Transition(tempLink.startNode,tempLink.endNode,tempLink.anchorAngle,null);
        if (!(this.transitions[tempLink.endNode.id][tempLink.startNode.id] == null) && tempLink.startNode !== tempLink.endNode){
            this.transitions[tempLink.endNode.id][tempLink.startNode.id].type = LinkType.ARC;
            this.transitions[tempLink.startNode.id][tempLink.endNode.id].type = LinkType.ARC;
        }
        return this.transitions[tempLink.startNode.id][tempLink.endNode.id];
    }
    // editTransistion(stateA, stateB, probability){
    //     if (!this.transitions[stateA]) {this.transitions[stateA] = {};}
    //     this.transitions[stateA.id][stateB.id] = probability;
    // }
    /////////////////////////////////////////////////
    // Querying the model
    /////////////////////////////////////////////////
    
    /////////////////////////////////////////////////
    // processing
    /////////////////////////////////////////////////
    saveState(state) {
        this.processor.currentState = state;
        this.processor.outPut += this.states[state].getEmmision();
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
        if (object instanceof LatentState){
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
        if (probSum == 0) {
            tempInitial = true;
            for (i in this.states) {
                initProb[i] = 1/Object.keys(this.states).length;
            }
        }else if (probSum != 1) {
            errorMsg += "ERROR : The initial probability distribution sums to : " + probSum + " (Should be 1) \n";
        }

        console.log(this.initialProbabilityDistribution);

        var trans = this.transitions;
        for (i in trans) {
            var probSum = 0.0;
            for (j in trans[i]) {
                probSum += parseFloat(trans[i][j].text);
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









 















