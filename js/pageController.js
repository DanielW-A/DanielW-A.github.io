
var running = false;

run = function(steps,time){
    
    var output = document.getElementById('output');
    if (model.validCheck() != "") { output.innerText = "There are unresolved errors";alert(model.validCheck()); return;}
    if (steps < 1 || steps == null) { output.innerText = ""; return; }
    model.init();
    while (model.processor.outPutLength < steps) {
        sleep(time);
        document.getElementById('outputString').innerHTML = model.step();

    }
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }