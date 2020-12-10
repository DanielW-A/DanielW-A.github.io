// create a class for each visable component;
class state {
    constructor(x,y){
        this.x = x;
        this.y = y;
        this.text = "";
        this.emmision = null;
    }
}

class transition {
    constructor(x,y,probability){
        this.x = x;
        this.y = y;
        this.probability = probability;
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
        var id = Object.keys(this.states).length; // TODO fix this
        this.states[id] = new state(x,y);
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
    addTransistion(stateA, stateB, probability) {
        if (!this.transitions[stateA]) {this.transitions[stateA] = {};}
        this.transitions[stateA][stateB] = new transition(0,0,probability); // might switch stateB and prob in the future.
        return this;
    }
    delete(object) {
        //TODO classify the object
        if (true) {
            console.log(this.states);
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
                str += trans[i][j].probability + ',';
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









 















