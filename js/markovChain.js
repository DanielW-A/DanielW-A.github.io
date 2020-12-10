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

/////////////////////////////////////////////////
// Editing the model
/////////////////////////////////////////////////

markovChain.prototype.addState = function(x,y) {
    var id = Object.keys(this.states).length;
    if (!this.states[id]) {
        this.states[id] = {};
        this.transitions[id] = {};
        this.initialProbabilityDistribution[id] = 0;
    }
    this.states[id] = {
        'x': x,
        'y': y,
        'name': "",
        'emmision' : null };
    return this.states[id];
}

markovChain.prototype.setName = function(id,name) {
    this.states[id].name = name;
    return this;
}

markovChain.prototype.setEmmision = function(id,emmision){
    this.states[id].emmision = emmision;
    return this;
}

markovChain.prototype.setInitialProbability = function(state,probability){
    if (!this.states[state]) {this.addState(0,0,state,null);}

    this.initialProbabilityDistribution[state] = probability;
}

markovChain.prototype.addTransistion = function(stateA,stateB,probability) {
    if (!this.states[stateA]) {this.addState(0,0,stateA,null);}
    if (!this.states[stateB]) {this.addState(0,0,stateB,null);}

    if (!this.transitions[stateA]) {
        this.transitions[stateA] = {};
    }
    this.transitions[stateA][stateB] = probability; // might switch stateB and prob in the future.
    return this;
}


/////////////////////////////////////////////////
// Querying the model
/////////////////////////////////////////////////

markovChain.prototype.getElementAt = function(mouse){
    for (i in this.states){
        var state = this.states[i];
        if((mouse.x - state.x)*(mouse.x - state.x) + (mouse.y - state.y)*(mouse.y - state.y) < 50*50){
            return state;
        }
    }

    return null;
}




/////////////////////////////////////////////////
// processing
/////////////////////////////////////////////////

markovChain.prototype.clearCache = function(){
    this.processor.currentState = null;
    this.processor.outPut = "";
    this.processor.outPutLength = 0;
}

markovChain.prototype.saveState = function(state){
    this.processor.currentState = state;
    this.processor.outPut += this.states[state].emmision;
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

/////////////////////////////////////////////////
// testing / running
/////////////////////////////////////////////////

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

    myMC.addState(0,1);
    var s1 = 0;
    
    myMC.addState(0,2);
    var s2 = 1;
    myMC.setName(s2,"S2");
    myMC.setEmmision(s2,"2");

    myMC.addState(0,3);
    var s3 = 2;
    myMC.setName(s3,"S3");
    myMC.setEmmision(s3,"da");
    myMC.setInitialProbability(s3,0.2);

    var states2 = {};
    states2 = myMC.states;

    console.log(states2);

    myMC.addTransistion(s1,s1,0.1);
    myMC.addTransistion(s1,s2,0.1);
    myMC.addTransistion(s1,s3,0.8);
    
    myMC.addTransistion(s2,s1,0.56);
    myMC.addTransistion(s2,s3,0.44);
    
    myMC.addTransistion(s3,s2,0.9);

    var trans = {};
    trans = myMC.transitions;

    console.log(trans);
    
    console.log(myMC.validCheck());
  

    
    myMC.setName(s1,"S1");
    myMC.setEmmision(s1,"1");

    myMC.setEmmision(s2,"2");
    myMC.setEmmision(s3,"3");
    
    myMC.addTransistion(s3,s3,0.1);

    myMC.setInitialProbability(s1,0.5);
    myMC.setInitialProbability(s2,0.3);
    
    console.log(myMC.validCheck());

    console.log(myMC.run(20));
}
