function save(){

    var myObj = {
        type: model.constructor.name,
        states: model.states,
        transitions: model.transitions,
        initialProbabilityDistribution : model.initialProbabilityDistribution, 
        emmisionStates: (model instanceof HiddenMarkovModel)? model.emmisionStates : null
    }

    var test = JSON.stringify(myObj,null, "\t");
    download("test.json",test);
}

function load(){
    document.getElementById("loadInput").click();
    console.log("test");
}

function loadfile(){
    
    const curFiles = document.getElementById("loadInput").files;
    console.log(curFiles);

    if (curFiles.length == 1){
        var fr =  new FileReader();
        fr.readAsText(curFiles[0]);
        fr.addEventListener("load", function(){
            decodeJSON(fr.result);
        });
    }
}

function decodeJSON(str){
    var obj = JSON.parse(str);

    if (!(model.constructor.name === obj.type)){
        if (model instanceof HiddenMarkovModel){
            model = new MarkovChain();
        } else {
            model = new HiddenMarkovModel();
        }
    }
    initModelUI();
    refresh();

    for (var i in obj.states){
        var oldState = obj.states[i];
        var state = model.addState(oldState.x,oldState.y);
        state.text = oldState.text;
        model.initialProbabilityDistribution[i] = obj.initialProbabilityDistribution[i];
    }
    
    if (model instanceof HiddenMarkovModel){
        for ( var i in obj.emmisionStates){
            var oldEmmisisonState = obj.emmisionStates[i];
            var emmisionState = model.addEmmisionState(oldEmmisisonState.x,oldEmmisisonState.y);
            emmisionState.text = oldEmmisisonState.text;
            emmisionState.emmision = oldEmmisisonState.emmision;
        }
    }
    
    for (var i in obj.transitions){
        for (var j in obj.transitions[i]){
            var oldTrans = obj.transitions[i][j];
            model.addTransistion(new TempLink(model.states[oldTrans.startNode.id],{x : oldTrans.endNode.x, y :oldTrans.endNode.y})).text = oldTrans.text;
        }
    }

    
    initModelUI();
    refresh();

}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }