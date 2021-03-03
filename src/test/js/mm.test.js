
const mm = require('./mm');
// const mc = require('./markovChain');

test('Create a MC instance', () => {
    var model = new mm.markovChain();
    expect(model != null).toBeTruthy();
});

test('Create a MC model', () => {
    var model = new mm.markovChain();
    var s1 = model.addState(100,100);
    s1.text = "H";
    s1.emission = "H";
    model.initialProbabilityDistribution[s1.id] = "0.6";
    var s2 = model.addState(600,100);
    s2.text = "F";
    s2.emission = "F";
    model.initialProbabilityDistribution[s2.id] = "0.4";

    model.addTransistion(new TempLink(s1,{x : s2.x, y :s2.y})).text = "0.3";
    model.addTransistion(new TempLink(s2,{x : s1.x, y :s1.y})).text = "0.4";
    model.addTransistion(new TempLink(s2,{x : s2.x, y :s2.y})).text = "0.6";
    model.addTransistion(new TempLink(s1,{x : s1.x-1, y :s1.y})).text = "0.7";
    expect(model != null).toBeTruthy();
});