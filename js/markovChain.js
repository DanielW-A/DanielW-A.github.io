function markovChain(){
    "use strict";
    // the 3 - tuple that defines markov chains
    this.states = {};
    this.transitions = {};
    this.initialProbabilityDistribution = {};
    
    // TODO allow the user to start at a state they want.
    this.userStartState = null;

    this.processor = {
        currentState : null,
        outPut : "",
        outPutLength : 0,
    };
}

markovChain.prototype.addState = function(state,output,init) {
    if (output == null){
        output = state;
    }
    if (!this.states[state]) {
        this.states[state] = "";
        this.transitions[state] = {};
        this.initialProbabilityDistribution[state] = 0;
    }
    this.states[state] = output;
    console.log("Add" + state + " with var " + output);
    if(init != null){
        this.initialProbabilityDistribution[state] = init;
    }
    return this;
}

markovChain.prototype.setInitialProbability = function(state,probability){
    if (!this.states[state]) {this.addState(state,null);}

    this.initialProbabilityDistribution[state] = probability;
}

markovChain.prototype.addTransistion = function(stateA,stateB,probability) {
    if (!this.states[stateA]) {this.addState(stateA,null);}
    if (!this.states[stateB]) {this.addState(stateB,null);}

    if (!this.transitions[stateA]) {
        this.transitions[stateA] = {};
    }
    this.transitions[stateA][stateB] = probability; // might switch stateB and prob in the future.
    return this;
}

markovChain.prototype.validCheck = function(){
    var errorMsg = "";
    var i = "";
    var j = "";

    var probSum = 0.0;
    var initProb = this.initialProbabilityDistribution;
    for (i in initProb){
        probSum += initProb[i];
    }
    if (probSum != 1){
        errorMsg += "ERROR : The initial probability distribution sums to : " + probSum + " (Should be 1) \n";
    }

    var trans = this.transitions;
    for (i in trans) {
        var probSum = 0.0;
        for (j in trans[i]){
            probSum += trans[i][j];
        }
        if (probSum != 1){
            errorMsg += "ERROR : " + i + " state trasition sums to : " + probSum + " (Should be 1) \n";
        }
    }

    var sts = this.states;
    for (i in sts) {
        if (i === sts[i]){
            errorMsg += "WARNING : " + i + " state has defult emmision string \n";
        } else if (sts[i].length > 1){
            errorMsg += "WARNING : " + i + " state has defult emmision string of lenght > 1 \n";
        }
    }

    return errorMsg; // should objectify this later.
}

markovChain.prototype.clearCache = function(){
    this.processor.currentState = null;
    this.processor.outPut = "";
    this.processor.outPutLength = 0;
}

markovChain.prototype.saveState = function(state){
    this.processor.currentState = state;
    this.processor.outPut += this.states[state];
    this.processor.outPutLength ++;
}

markovChain.prototype.getStartState = function(){
    var check = Math.random();
    var probSum =  0.0;
    var initProb = this.initialProbabilityDistribution;
    for (i in initProb){
        probSum += initProb[i];
        if (probSum > check){
            this.saveState(i);
            console.log( this.states[i]);
            return;
        }
    }
}

markovChain.prototype.transition = function(state){
    var check = Math.random();
    var probSum =  0.0;
    var trans = this.transitions[state];
    for (i in trans){
        probSum += trans[i];
        if (probSum > check){
            return i;
        }
    }
}

markovChain.prototype.step = function(){
    this.saveState(this.transition(this.processor.currentState));
}

markovChain.prototype.run = function(count){
    if (this.validCheck() != ""){return "There are unresolved errors";}
    if (count < 1 || count == null){return "";}

    this.clearCache();
    this.getStartState();
    
    while(this.processor.outPutLength < count){
        this.step();
    }
    return this.processor.outPut;
}

markovChain.runTests = function() {
    // function assert(outcome, description) {window.console && console.log((outcome ? 'Pass:' : 'FAIL:'),  description);}
  
    var myMC = new markovChain;

    console.log("Markov Chain Created");

    myMC.addState("s1",null,null);
    console.log(myMC.states);
    myMC.addState("s2","2",null);
    console.log(myMC.states);
    myMC.addState("s3","da",0.2);
    console.log(myMC.states);

    console.log(myMC.validCheck());
    var states2 = {};
    states2 = myMC.states;

    console.log(states2);

    myMC.addTransistion("s1","s1",0.1);
    myMC.addTransistion("s1","s2",0.1);
    myMC.addTransistion("s1","s3",0.8);
    
    myMC.addTransistion("s2","s1",0.56);
    myMC.addTransistion("s2","s3",0.44);
    
    myMC.addTransistion("s3","s2",0.9);



    var trans = {};
    trans = myMC.transitions;

    console.log(trans);
    
    console.log(myMC.validCheck());
  

    
    myMC.addState("s1","1");
    myMC.addState("s2","2");
    myMC.addState("s3","3");

    
    myMC.addTransistion("s3","s3",0.1);

    myMC.setInitialProbability("s1",0.5);
    myMC.setInitialProbability("s2",0.3);
    
    console.log(myMC.validCheck());

    console.log(myMC.run(20));
}
