function save(){

    var myObj = {
        type: model.constructor.name,
        states: model.states,
        transitions: model.transitions,
        initialProbabilityDistribution : model.initialProbabilityDistribution, 
        emissionStates: (model instanceof HiddenMarkovModel)? model.emissionStates : null
    }

    var test = JSON.stringify(myObj,null, "\t");
    download("Model.json",test);
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
        for ( var i in obj.emissionStates){
            var oldEmmisisonState = obj.emissionStates[i];
            var emissionState = model.addEmissionState(oldEmmisisonState.x,oldEmmisisonState.y);
            emissionState.text = oldEmmisisonState.text;
            emissionState.emission = oldEmmisisonState.emission;
        }
    }
    
    for (var i in obj.transitions){
        for (var j in obj.transitions[i]){
            var oldTrans = obj.transitions[i][j];
            var trans = model.addTransistion(new TempLink(model.states[oldTrans.startNode.id],{x : oldTrans.endNode.x, y :oldTrans.endNode.y}));
            trans.text = oldTrans.text;
            trans.anchorAngle = oldTrans.anchorAngle; 
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