
const mm = require('./mm');
// const mc = require('./markovChain');

test('Create a MC instance', () => {
    var model = new mm.markovChain();
    model.addState(10,10);
    expect(model != null).toBeTruthy();
  });