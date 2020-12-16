
const font ='20px "Times New Roman", serif';
var running = false;
var modelPanel;



window.onload = function() {
    initCanvas();

    var acc = document.getElementsByClassName("accordion");
    var i;

    for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            } 
        });
    }
}

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

refreshInfoPanels = function(){
    document.getElementById('modelPanelBody').innerHTML = model.toString();
    document.getElementById('modelPanelBody').innerHTML = model.toString();
    
}



function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

