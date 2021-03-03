
const { expect } = require('@jest/globals');
const mm = require('./mm');


///////////////////////////////////////////////////
// Markov Chain
///////////////////////////////////////////////////

function createSimpleMarkovChain(model){
    var s1 = model.addState(100,100);
    s1.text = "H";
    s1.emission = "H";
    model.initialProbabilityDistribution[s1.id] = "0.6";
    var s2 = model.addState(600,100);
    s2.text = "F";
    s2.emission = "F";
    model.initialProbabilityDistribution[s2.id] = "0.4";

    var t1 = model.addTransistion(new mm.tempLink(s1,{x : s2.x, y :s2.y},s2)).text = "0.3";
    var t2 = model.addTransistion(new mm.tempLink(s2,{x : s1.x, y :s1.y},s1)).text = "0.4";
    var t3 = model.addTransistion(new mm.tempLink(s2,{x : s2.x, y :s2.y},s2)).text = "0.6";
    var t4 = model.addTransistion(new mm.tempLink(s1,{x : s1.x-1, y :s1.y},s1)).text = "0.7";

    return model;

}

test('Markov Chain: Create an instance', () => {
    var model = new mm.markovChain();
    expect(model != null).toBeTruthy();
});

test('Markov Chain: Create a model and validating', () => {
    var model = new mm.markovChain();

    
    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(1);
    expect(model.processor.warnings.length).toEqual(1);


    var s1 = model.addState(100,100);
    s1.text = "H";
    model.initialProbabilityDistribution[s1.id] = "0.6";
    var s2 = model.addState(600,100);
    s2.text = "F";
    s2.emission = "F";
    model.initialProbabilityDistribution[s2.id] = "0.4";

    var t1 = model.addTransistion(new mm.tempLink(s1,{x : s2.x, y :s2.y},s2)).text = "0.3";
    var t2 = model.addTransistion(new mm.tempLink(s2,{x : s1.x, y :s1.y},s1)).text = "0.4";
    var t3 = model.addTransistion(new mm.tempLink(s2,{x : s2.x, y :s2.y},s2)).text = "0.6";
    var t4 = model.addTransistion(new mm.tempLink(s1,{x : s1.x-1, y :s1.y},s1)).text = "0.6";

    expect(model != null).toBeTruthy();
    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(1);
    expect(model.processor.warnings.length).toEqual(1);

    model.transitions[0][1].text = "0.4";

    expect(model.validCheck()).toBeTruthy();
    expect(model.processor.errors.length).toEqual(0);
    expect(model.processor.warnings.length).toEqual(1);
    
    model.states[0].emission = "H";

    expect(model.validCheck()).toBeTruthy();
    expect(model.processor.errors.length).toEqual(0);
    expect(model.processor.warnings.length).toEqual(0);

    model.states[0].text = "F";

    expect(model.validCheck()).toBeTruthy();
    expect(model.processor.errors.length).toEqual(0);
    expect(model.processor.warnings.length).toEqual(1);

    model.states[0].text = "H";

    expect(model.validCheck()).toBeTruthy();
    expect(model.processor.errors.length).toEqual(0);
    expect(model.processor.warnings.length).toEqual(0);

    model.initialProbabilityDistribution = [0,0];

    expect(model.validCheck()).toBeTruthy();
    expect(model.processor.errors.length).toEqual(0);
    expect(model.processor.warnings.length).toEqual(1);

    model.initialProbabilityDistribution = [0.5,0.4];

    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(1);
    expect(model.processor.warnings.length).toEqual(0);

    model.initialProbabilityDistribution = [0.4,0.6];

    expect(model.validCheck()).toBeTruthy();
    expect(model.processor.errors.length).toEqual(0);
    expect(model.processor.warnings.length).toEqual(0);
});

test('Markov Chain: Deleting components', () => {
    model = createSimpleMarkovChain(new mm.markovChain);

    model.delete(model.transitions[1][1]);

    expect(Object.keys(model.transitions[1]).length).toEqual(1);
    expect(Object.keys(model.states).length).toEqual(2);

    model.delete(model.states[1]);

    expect(Object.keys(model.transitions).length).toEqual(1);
    expect(Object.keys(model.transitions[0]).length).toEqual(1);
    expect(Object.keys(model.states).length).toEqual(1);

    model.delete(model.states[0]);

    expect(Object.keys(model.transitions).length).toEqual(0);
    expect(Object.keys(model.states).length).toEqual(0);
});

test('Markov Chain: Running the model', () => {
    var model = createSimpleMarkovChain(new mm.markovChain());

    expect(model.validCheck()).toBeTruthy();
    expect(model.processor.errors.length).toEqual(0);
    expect(model.processor.warnings.length).toEqual(0);


    model.clearCache();

    expect(model.processor.currentState).toBeNull();
    expect(model.processor.outPut).toEqual("");

    model.getStartState();

    expect(model.processor.currentState != null).toBeTruthy();
    expect(model.processor.outPutLength).toEqual(1);
    expect(model.processor.outPut == "F" ||model.processor.outPut == "H" ).toBeTruthy();
    
    for (var i = 1 ; i < 20 ; i ++){
        model.step();

        expect(model.processor.currentState != null).toBeTruthy();
        expect(model.processor.outPutLength).toEqual(i+1);
        expect(model.processor.outPut.charAt(i) == "F" || model.processor.outPut.charAt(i) == "H" ).toBeTruthy();

    }
});

///////////////////////////////////////////////////
// Hidden Markov model 
///////////////////////////////////////////////////

function createSimpleHiddenMarkovModel(model){
    var s1 = model.addState(100,100);
    s1.text = "H";
    model.initialProbabilityDistribution[s1.id] = "0.6";
    var s2 = model.addState(100,300);
    s2.text = "F";
    model.initialProbabilityDistribution[s2.id] = "0.4";

    var es1 =  model.addEmissionState(300,75);
    es1.text = "N";
    es1.emission = "N";
    var es2 =  model.addEmissionState(300,200);
    es2.text = "C";
    es2.emission = "C";
    var es3 =  model.addEmissionState(300,425);
    es3.text = "D";
    es3.emission = "D";


    model.addTransistion(new mm.tempLink(s1,{x : s2.x, y :s2.y},s2)).text = "0.3";
    model.addTransistion(new mm.tempLink(s2,{x : s1.x, y :s1.y},s1)).text = "0.4";
    model.addTransistion(new mm.tempLink(s2,{x : s2.x, y :s2.y},s2)).text = "0.6";
    model.addTransistion(new mm.tempLink(s1,{x : s1.x-1, y :s1.y},s1)).text = "0.7";

        
    var le1 =  model.addTransistion(new mm.tempLink(s1,{x : es1.x, y :es1.y},es1)).text = "0.5";
    var le2 =  model.addTransistion(new mm.tempLink(s1,{x : es2.x, y :es2.y},es2)).text = "0.4";
    var le3 =  model.addTransistion(new mm.tempLink(s1,{x : es3.x, y :es3.y},es3)).text = "0.1";

        
    var le4 =  model.addTransistion(new mm.tempLink(s2,{x : es1.x, y :es1.y},es1)).text = "0.1";
    var le5 =  model.addTransistion(new mm.tempLink(s2,{x : es2.x, y :es2.y},es2)).text = "0.3";
    var le6 =  model.addTransistion(new mm.tempLink(s2,{x : es3.x, y :es3.y},es3)).text = "0.6";

    return model;
};

test('Hidden Markov Model: Create an instance', () => {
    var model = new mm.hiddenMarkovModel();
    expect(model != null).toBeTruthy();
});

test('Hidden Markov Model: Create a model and validating', () => {
    var model = new mm.hiddenMarkovModel();

    
    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(2);
    expect(model.processor.warnings.length).toEqual(1);

    var s1 = model.addState(100,100);
    s1.text = "H";
    model.initialProbabilityDistribution[s1.id] = "0.4";
    var s2 = model.addState(600,100);
    s2.text = "N";
    model.initialProbabilityDistribution[s2.id] = "0.4";

    var es1 =  model.addEmissionState(75,400);
    es1.text = "N";
    var es2 =  model.addEmissionState(150,400);
    es2.text = "C";
    es2.emission = "D";
    var es3 =  model.addEmissionState(225,400);
    es3.text = "D";
    es3.emission = "D";

    
    var es4 =  model.addEmissionState(225,900);
    es4.text = "D";
    es4.emission = "D";


    model.addTransistion(new mm.tempLink(s1,{x : s2.x, y :s2.y},s2)).text = "0.3";
    model.addTransistion(new mm.tempLink(s2,{x : s1.x, y :s1.y},s1)).text = "0.4";
    model.addTransistion(new mm.tempLink(s2,{x : s2.x, y :s2.y},s2)).text = "0.6";
    model.addTransistion(new mm.tempLink(s1,{x : s1.x-1, y :s1.y},s1)).text = "0.6";

    
    var le1 =  model.addTransistion(new mm.tempLink(s1,{x : es1.x, y :es1.y},es1)).text = "0.5";
    var le2 =  model.addTransistion(new mm.tempLink(s1,{x : es2.x, y :es2.y},es2)).text = "0.2";
    var le3 =  model.addTransistion(new mm.tempLink(s1,{x : es3.x, y :es3.y},es3)).text = "0.1";

    
    var le4 =  model.addTransistion(new mm.tempLink(s2,{x : es1.x, y :es1.y},es1)).text = "0.1";
    var le5 =  model.addTransistion(new mm.tempLink(s2,{x : es2.x, y :es2.y},es2)).text = "0.3";
    var le6 =  model.addTransistion(new mm.tempLink(s2,{x : es3.x, y :es3.y},es3)).text = "0.6";



    expect(model != null).toBeTruthy();

    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(5);
    expect(model.processor.warnings.length).toEqual(3);

    model.emissionStates['e3'].text = "G";

    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(5);
    expect(model.processor.warnings.length).toEqual(2);

    
    model.emissionStates['e3'].emission = "G";

    
    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(4);
    expect(model.processor.warnings.length).toEqual(2);

    model.delete(es4);
    
    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(4);
    expect(model.processor.warnings.length).toEqual(1);

    model.transitions[0][0].text = "0.7";

    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(3);
    expect(model.processor.warnings.length).toEqual(1);

    model.emissionStates['e0'].emission = "N";
    
    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(3);
    expect(model.processor.warnings.length).toEqual(0);    

    model.emissionStates['e1'].emission = "C";
    
    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(2);
    expect(model.processor.warnings.length).toEqual(0);    
    
    model.transitions[0]['e1'].text = "0.4";

    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(1);
    expect(model.processor.warnings.length).toEqual(0);

    model.initialProbabilityDistribution = [0,0];

    expect(model.validCheck()).toBeTruthy();
    expect(model.processor.errors.length).toEqual(0);
    expect(model.processor.warnings.length).toEqual(1);

    model.initialProbabilityDistribution = [0.5,0.4];

    expect(model.validCheck()).toBeFalsy();
    expect(model.processor.errors.length).toEqual(1);
    expect(model.processor.warnings.length).toEqual(0);

    model.initialProbabilityDistribution = [0.4,0.6];

    expect(model.validCheck()).toBeTruthy();
    expect(model.processor.errors.length).toEqual(0);
    expect(model.processor.warnings.length).toEqual(0);
});

test('Hidden Markov Model: Deleting components', () => {
    model = createSimpleHiddenMarkovModel(new mm.hiddenMarkovModel());

    model.delete(model.transitions[0][0]);

    expect(Object.keys(model.transitions[0]).length).toEqual(4);
    expect(Object.keys(model.states).length).toEqual(2);
    expect(Object.keys(model.emissionStates).length).toEqual(3);

    model.delete(model.emissionStates['e0']);

    expect(Object.keys(model.transitions).length).toEqual(2);
    expect(Object.keys(model.transitions[0]).length).toEqual(3);
    expect(Object.keys(model.transitions[1]).length).toEqual(4);
    expect(Object.keys(model.states).length).toEqual(2);
    expect(Object.keys(model.emissionStates).length).toEqual(2);

    model.delete(model.states[0]);

    expect(Object.keys(model.transitions).length).toEqual(1);
    expect(Object.keys(model.transitions[1]).length).toEqual(3);
    expect(Object.keys(model.states).length).toEqual(1);
    expect(Object.keys(model.emissionStates).length).toEqual(2);
    
    model.delete(model.transitions[1]['e1']);
    
    expect(Object.keys(model.transitions).length).toEqual(1);
    expect(Object.keys(model.transitions[1]).length).toEqual(2);
    expect(Object.keys(model.states).length).toEqual(1);
    expect(Object.keys(model.emissionStates).length).toEqual(2);

    model.delete(model.emissionStates['e1']);
    
    expect(Object.keys(model.transitions).length).toEqual(1);
    expect(Object.keys(model.transitions[1]).length).toEqual(2);
    expect(Object.keys(model.states).length).toEqual(1);
    expect(Object.keys(model.emissionStates).length).toEqual(1);

    model.delete(model.states[1]);
    
    expect(Object.keys(model.transitions).length).toEqual(0);
    expect(Object.keys(model.states).length).toEqual(0);
    expect(Object.keys(model.emissionStates).length).toEqual(1);

    model.delete(model.emissionStates['e2']);
    
    expect(Object.keys(model.transitions).length).toEqual(0);
    expect(Object.keys(model.states).length).toEqual(0);
    expect(Object.keys(model.emissionStates).length).toEqual(0);
});

test('Hidden Markov Model: Running the model', () => {
    var model = createSimpleHiddenMarkovModel(new mm.hiddenMarkovModel());

    expect(model.validCheck()).toBeTruthy();
    expect(model.processor.errors.length).toEqual(0);
    expect(model.processor.warnings.length).toEqual(0);


    model.clearCache();

    expect(model.processor.currentState).toBeNull();
    expect(model.processor.outPut).toEqual("");

    model.getStartState();

    expect(model.processor.currentState != null).toBeTruthy();
    expect(model.processor.outPutLength).toEqual(1);
    expect(model.processor.outPut == "D" || model.processor.outPut == "C" || model.processor.outPut == "N").toBeTruthy();
    
    for (var i = 1 ; i < 20 ; i ++){
        model.step();

        expect(model.processor.currentState != null).toBeTruthy();
        expect(model.processor.outPutLength).toEqual(i+1);
        expect(model.processor.outPut.charAt(i) == "D" || model.processor.outPut.charAt(i) == "C" || model.processor.outPut.charAt(i) == "N" ).toBeTruthy();

    }
});

test('Hidden Markov Model: Running Forward Algorithm', () => {
    var model = createSimpleHiddenMarkovModel(new mm.hiddenMarkovModel());

    var emissionStr = "NNCCDDNCDDCDNCNNND";
    var Alpha

    model.algProsessor.observedString = model.decodeEmissions(emissionStr);

    model.initForward();
    Alpha = model.algProsessor.A;
    expect(Alpha[1][0]).toEqual(model.initialProbabilityDistribution[0]*parseFloat(model.transitions[0]['e0'].text))
    expect(Alpha[1][0]).toEqual(0.3);

    // expect(Alpha[1][1]).toEqual(model.initialProbabilityDistribution[1]*parseFloat(model.transitions[1]['e0'].text)) epsilon error
    expect(Alpha[1][1]).toEqual(0.04);


    for (var i = 1; i < emissionStr.length; i++){
        model.inductiveFoward();
    }

    Alpha = model.algProsessor.A;

    expect(Alpha != null);

    //TODO check some random values from my own caculations.

});

test('Hidden Markov Model: Running Backward Algorithm', () => {
    var model = createSimpleHiddenMarkovModel(new mm.hiddenMarkovModel());

    var emissionStr = "NNCCDDNCDDCDNCNNND";
    var Beta;

    model.algProsessor.observedString = model.decodeEmissions(emissionStr);

    model.initBackward();
    Beta = model.algProsessor.B;
    expect(Beta[emissionStr.length][0]).toEqual(1)

    expect(Beta[emissionStr.length][1]).toEqual(1);


    for (var i = 1; i < emissionStr.length; i++){
        model.inductiveBackward();
    }

    Beta = model.algProsessor.B;

    expect(Beta != null);

    //TODO check some random values from my own caculations.

});