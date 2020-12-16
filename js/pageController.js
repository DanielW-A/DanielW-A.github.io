
var running = false;

run = function(steps,time){
    var output = document.getElementById('outputString');
    if (model.validCheck() != "") { output.innerHTML = "There are unresolved errors";alert(model.validCheck()); return;}
    if (steps < 1 || steps == null) { output.innerHTML = ""; return; }
    model.init();
    while (model.processor.outPutLength < steps) {
        sleep(time);
        document.getElementById('outputString').innerHTML = model.step();

    }

    if (tempInitial){
        model.initialProbabilityDistribution = {};
        tempInitial = false;
    }
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}