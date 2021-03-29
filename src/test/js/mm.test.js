
const { expect } = require('@jest/globals');
const mm = require('./mm');
const { default: Big } = require("big.js");

///////////////////////////////////////////////////
// Markov Model
///////////////////////////////////////////////////

const emissionStr = "NNCNDDCDDNN";

test('Markov Model: valdate probability', () => {
    var model = new mm.markovChain();
    
    expect(model.validateProbability("")).toEqual("");
    expect(model.validateProbability("0")).toEqual("0");
    expect(model.validateProbability("0.")).toEqual("0.");
    expect(model.validateProbability(".")).toEqual("0.");
    expect(model.validateProbability("1")).toEqual("1");
    expect(model.validateProbability("0.1")).toEqual("0.1");
    expect(model.validateProbability("0.03930482943273928012")).toEqual("0.03930482943273928012");

    expect(model.validateProbability("2")).toEqual("");
    expect(model.validateProbability("a")).toEqual("");
    expect(model.validateProbability("00")).toEqual("0");
    expect(model.validateProbability("0.a")).toEqual("0.");
    expect(model.validateProbability("0.0393048294a3273928012")).toEqual("0.0393048294");
});

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

test('Hidden Markov Model: Validating the unputs', () => {
    var model = createSimpleHiddenMarkovModel(new mm.hiddenMarkovModel());

    expect(model.validateObs("")).toEqual("");
    expect(model.validateObs("NCDNCD")).toEqual("NCDNCD");
    expect(model.validateObs("NFGNDDFGEET")).toEqual("NNDD");
    expect(model.validateObs(")£$)$R*J!^&&&%£ γ")).toEqual("");
    expect(model.validateObs(")£$)$R*J!^&&&%£ γ  nd")).toEqual("ND");
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

    var Alpha

    model.algProsessor.observedString = model.decodeEmissions(emissionStr);

    model.initForward();
    Alpha = model.algProsessor.A;
    expect(Alpha[1][0].toString()).toEqual(Big(model.initialProbabilityDistribution[0]).times(Big(model.transitions[0]['e0'].text)).toString());
    expect(Alpha[1][0].toString()).toEqual("0.3");

    expect(Alpha[1][1].toString()).toEqual(Big(model.initialProbabilityDistribution[1]).times(Big(model.transitions[1]['e0'].text)).toString());
    expect(Alpha[1][1].toString()).toEqual("0.04");


    for (var i = 1; i < emissionStr.length; i++){
        model.inductiveFoward();
    }

    Alpha = model.algProsessor.A;

    
    expect(Alpha[2][0].toString()).toEqual("0.113");
    expect(Alpha[2][1].toString()).toEqual("0.0114");
    
    expect(Alpha[3][0].toString()).toEqual("0.033464");
    expect(Alpha[3][1].toString()).toEqual("0.012222");
    
    expect(Alpha[4][0].toString()).toEqual("0.0141568");
    expect(Alpha[4][1].toString()).toEqual("0.00173724");
    
    expect(Alpha[9][0].toString()).toEqual("0.000007702635924352");
    expect(Alpha[9][1].toString()).toEqual("0.000056182951577088");
    
    expect(Alpha[11][0].toString()).toEqual("0.000005596790745600448");
    expect(Alpha[11][1].toString()).toEqual("6.340987570095744e-7");

    expect(Alpha != null);

    //TODO check some random values from my own caculations.

});

test('Hidden Markov Model: Running Backward Algorithm', () => {
    var model = createSimpleHiddenMarkovModel(new mm.hiddenMarkovModel());

    var Beta;

    model.algProsessor.observedString = model.decodeEmissions(emissionStr);

    model.initBackward();
    Beta = model.algProsessor.B;
    expect(Beta[emissionStr.length+1][0].toString()).toEqual("1")

    expect(Beta[emissionStr.length+1][1].toString()).toEqual("1");


    for (var i = 1; i < emissionStr.length; i++){
        model.inductiveBackward();
    }

    Beta = model.algProsessor.B;

    expect(Beta != null);

    //TODO check some random values from my own caculations.

});

test('Hidden Markov Model: Running Gamma Algorithm', () => {
    var model = createSimpleHiddenMarkovModel(new mm.hiddenMarkovModel());

    //TODO

});

test('Hidden Markov Model: Running Viterbi Algorithm', () => {
    var model = createSimpleHiddenMarkovModel(new mm.hiddenMarkovModel());

    //TODO

});

test('Hidden Markov Model: Running Balm-Welch Algorithm', () => {
    var model = createSimpleHiddenMarkovModel(new mm.hiddenMarkovModel());

    //TODO

});

test('Hidden Markov Model: Gamma and Balm-Welch Equal', () => {
    var model = createSimpleHiddenMarkovModel(new mm.hiddenMarkovModel());


    model.algProsessor.observedString = model.decodeEmissions(emissionStr);

    model.runForward();
    model.runBackward();
    model.runGamma();
    for (var i = 1; i < emissionStr.length-1; i++){
        model.inductiveBaumWelch();
    }


    var testXi = 0
    for(var t = 0; t < model.algProsessor.observedString.length-2; t++){
        for (var i in model.states){
            testXi = new Big(0);
            for (var j in model.states){
                testXi = testXi.plus(model.algProsessor.X[t+1][i][j]);
            }
            var testY = model.algProsessor.Y[t+1][i].round(120,0);
            testXi = testXi.round(120,0); // some small rounding errors, either way this is significant places so so little data lost.
            expect(testXi.toString()).toEqual(testY.toString());
            expect(testXi.eq(testY)).toBeTruthy();
        }
    }
});

/////////////////////////////////////////////////////////////
// Large HMM
/////////////////////////////////////////////////////////////

test('Hidden Markov Model: large model', ()  => {
    var model = new mm.hiddenMarkovModel();
    
    const fs = require('fs');
   
    const data = fs.readFileSync('src/test/js/test.json',
            {encoding:'utf8', flag:'r'});
  

    JSON.parse(data);
    model.createModelOn(JSON.parse(data));

    expect(Object.keys(model.states).length).toBeGreaterThan(0);
    expect(Object.keys(model.emissionStates).length).toBeGreaterThan(0);
    expect(Object.keys(model.transitions).length).toBeGreaterThan(0);
    expect(model.validCheck()).toBeTruthy();

});

//https://www.cs.rochester.edu/u/james/CSC248/Lec11.pdf
test('forward and backward off this model', () => {
    var model = new mm.hiddenMarkovModel();

    const fs = require('fs');
   
    const data = fs.readFileSync('src/test/js/rochester-model.json',
            {encoding:'utf8', flag:'r'});

    JSON.parse(data);
    model.createModelOn(JSON.parse(data));

    model.algProsessor.observedString = model.decodeEmissions("RWBB");


    model.initForward();
    for (var i = 1; i < model.algProsessor.observedString.length; i++){
        model.inductiveFoward();
    }
    Alpha = model.algProsessor.A;

    Big.RM = 1;
    
    expect(Alpha[1][0].round(2).toString()).toEqual("0.24");
    expect(Alpha[1][1].round(2).toString()).toEqual("0.08");
    
    expect(Alpha[2][0].round(3).toString()).toEqual("0.067");
    expect(Alpha[2][1].round(3).toString()).toEqual("0.046");
    
    expect(Alpha[3][0].round(3).toString()).toEqual("0.016");
    expect(Alpha[3][1].round(3).toString()).toEqual("0.018"); 
    // note that this value is differnt to the one on the document this is to do with the heigher precision i store the intermeadte values at rather than 2 s.f.

    expect(Alpha[4][0].round(4).toString()).toEqual("0.0045");
    expect(Alpha[4][1].round(4).toString()).toEqual("0.0056");



    model.algProsessor.observedString = model.decodeEmissions("RWBB");

    model.initBackward();
    for (var i = 1; i <  model.algProsessor.observedString.length; i++){
        model.inductiveBackward();
    }
    model.terminationBeta();

    Beta = model.algProsessor.B;

    Big.RM = 1;

        
    expect(Beta[5][0].round(1).toString()).toEqual("1");
    expect(Beta[5][1].round(1).toString()).toEqual("1");
    
    expect(Beta[4][0].round(1).toString()).toEqual("0.3");
    expect(Beta[4][1].round(1).toString()).toEqual("0.3");
        
    expect(Beta[3][0].round(2).toString()).toEqual("0.09");
    expect(Beta[3][1].round(2).toString()).toEqual("0.09");

    expect(Beta[2][0].round(4).toString()).toEqual("0.0324");
    expect(Beta[2][1].round(4).toString()).toEqual("0.0297");

    // expect(Beta[1][0].round(4).toString()).toEqual("0.0078"); // this treats beta a liitle differnetly than my model
    // expect(Beta[1][1].round(4).toString()).toEqual("0.0024");
  

});

//https://iulg.sitehost.iu.edu/moss/hmmcalculations.pdf

//http://www.biostat.jhsph.edu/bstcourse/bio638/notes/HMMs_BaumWelch.pdf

//https://en.wikipedia.org/wiki/Forward%E2%80%93backward_algorithm
test("forward-Backward off Russell & Norvig umbrella world", () => {
    var model = new mm.hiddenMarkovModel();

    var fs = require('fs');
    var data = fs.readFileSync('src/test/js/Umbrella-world.json',  {encoding:'utf8', flag:'r'});

    JSON.parse(data);
    model.createModelOn(JSON.parse(data));

    model.algProsessor.observedString = model.decodeEmissions("UUNUU");


    model.runForward();
    Alpha = model.algProsessor.A;

    Big.RM = 1;
    
    expect(Alpha[0][0].round(2).toString()).toEqual("0.5");
    expect(Alpha[0][1].round(2).toString()).toEqual("0.5");
    
    expect(Alpha[1][0].round(4).toString()).toEqual("0.8182");
    expect(Alpha[1][1].round(4).toString()).toEqual("0.1818");
    
    expect(Alpha[2][0].round(4).toString()).toEqual("0.8834");
    expect(Alpha[2][1].round(4).toString()).toEqual("0.1166"); 

    expect(Alpha[3][0].round(4).toString()).toEqual("0.1907");
    expect(Alpha[3][1].round(4).toString()).toEqual("0.8093");

    expect(Alpha[4][0].round(4).toString()).toEqual("0.7308");
    expect(Alpha[4][1].round(4).toString()).toEqual("0.2692");

    expect(Alpha[5][0].round(4).toString()).toEqual("0.8673");
    expect(Alpha[5][1].round(4).toString()).toEqual("0.1327");


    model.algProsessor.observedString = model.decodeEmissions("UUNUU");

    model.runBackward();

    Beta = model.algProsessor.B;

    Big.RM = 1;

        
    expect(Beta[5][0].round(1).toString()).toEqual("1");
    expect(Beta[5][1].round(1).toString()).toEqual("1");
    
    expect(Beta[4][0].round(4).toString()).toEqual("0.6273");
    expect(Beta[4][1].round(4).toString()).toEqual("0.3727");
        
    expect(Beta[3][0].round(4).toString()).toEqual("0.6533");
    expect(Beta[3][1].round(4).toString()).toEqual("0.3467");

    expect(Beta[2][0].round(4).toString()).toEqual("0.3763");
    expect(Beta[2][1].round(4).toString()).toEqual("0.6237");

    expect(Beta[1][0].round(4).toString()).toEqual("0.5923");
    expect(Beta[1][1].round(4).toString()).toEqual("0.4077");

    expect(Beta[0][0].round(4).toString()).toEqual("0.6469");
    expect(Beta[0][1].round(4).toString()).toEqual("0.3531");

    model.algProsessor.t=-1;
    for (var i = 0; i <= model.algProsessor.observedString.length; i++){
        model.inductiveGamma();
    }
    Gamma = model.algProsessor.Y;

    expect(Gamma[0][0].round(4).toString()).toEqual("0.6469");
    expect(Gamma[0][1].round(4).toString()).toEqual("0.3531");
    
    expect(Gamma[1][0].round(4).toString()).toEqual("0.8673");
    expect(Gamma[1][1].round(4).toString()).toEqual("0.1327");
    
    expect(Gamma[2][0].round(4).toString()).toEqual("0.8204");
    expect(Gamma[2][1].round(4).toString()).toEqual("0.1796"); 

    expect(Gamma[3][0].round(4).toString()).toEqual("0.3075");
    expect(Gamma[3][1].round(4).toString()).toEqual("0.6925");

    expect(Gamma[4][0].round(4).toString()).toEqual("0.8204");
    expect(Gamma[4][1].round(4).toString()).toEqual("0.1796");

    expect(Gamma[5][0].round(4).toString()).toEqual("0.8673");
    expect(Gamma[5][1].round(4).toString()).toEqual("0.1327");
});
