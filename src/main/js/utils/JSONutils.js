function saveToJSON(){

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

function decodeJSON(str){
    var obj = JSON.parse(str);
    if (!(model.constructor.name === obj.type)){
        if (model instanceof HiddenMarkovModel){
            setModelMC();
        } else {
            setModelHMM();
        }
    } else {
        clear();
    }
    model.createModelOn(obj);

    initModelUI();
    refresh();
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

function download(filename, text) { // not just used for JSON
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }