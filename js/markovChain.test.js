
const MarkovChain = require('./markovChain');
// const mc = require('./markovChain');

test('Create a MC instance', () => {
    var model = new MarkovChain.markovChain();
    model.addState(10,10);
    expect(model != null).toBeTruthy();
  });