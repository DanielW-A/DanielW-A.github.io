// var forward1 = p("This is used to calculate the chances of the model being in internal state I at time t given the observation sequence from 0 to t."+
//         " this is done by a set of cached variables called ALPHA. This is calculated by these 2 equations: ")+
//         p("Base case:");
// var forward2 = p("When t=1 Alpha is calculated by multiplying the probability of the model starting in the state i and the probability of this state emitting the observed value e_i(o_t).") + 
//         p("Inductive step:");
// var forward3 = p("When t>1 Alpha is calculated by summing the products of all previous alphas (A_t-1(i)) by the transition from the previous internal state to the next current state M_i,j," +
//         "this is then multiplied by the probability of the state emitting the observed value e_i(o_t). ");


///////////////////////////////////////////////////////
// HTML tags
///////////////////////////////////////////////////////
function th(str){return "<th>"+str+"</th>";}
function td(str,j,i){return "<td id=\"td_"+j+""+i+"\" onclick=\"tableCellMouseOver(event,this,"+j+","+i+")\">"+str+"</td>";}
function li(str){return "<li>"+str+"</li>";}
function p(str){return "<p>"+str+"</p>";}
function spanNH(equType,str,id){return "<span id=\"" + equType + "0_"+id+"\">" + str + "</span>";}
function span(equ,id,t,nodeA,nodeB,str){return "<span id=\""+equType+""+equ+"_"+id+"\" onmouseover=\"spotlight('"+id+"',"+t+",'"+nodeA+"','"+nodeB+"')\" onmouseout=\"unspotlight('"+id+"',"+t+",'"+nodeA+"','"+nodeB+"')\" >" + str + "</span>"}

///////////////////////////////////////////////////////
// alg descriptions
///////////////////////////////////////////////////////

const forwardDescription = [p("This is used to calculate the chances of the model being in internal state \\(i\\) at time \\(t\\) given the observation sequence from \\(0\\) to \\(t\\)."+
        " this is done by a set of cached variables called Alpha (\\(\\alpha\\)). This is calculated by these two equations: ")+
        p("Base case:"),
        p("When \\(t=1\\) Alpha is calculated by multiplying the probability of the model starting in the state \\(i\\) and the probability of this state emitting the observed value \\(e_i(o_t)\\).") + 
        p("Inductive step:"),
        p("When \\(t>1\\) Alpha is calculated by summing the products of all previous alphas \\(\\alpha_{t-1}(i)\\) by the transition from the previous internal state to the next current state \\(M_i,j\\)," +
        "this is then multiplied by the probability of the state emitting the observed value \\(e_i(o_t)\\). ")];

const forwardDesc = ["The Initial Alpha is calculated by multiplying the probability of the HMM starting in this state and the probability of this state emitting the observed value.",
        "The Alpha in the inductive step is calculated by summing all the product of all previous alphas by the transition probability from the previous state to the state for the new alpha, this is then also multiplied by the probability of the state emitting the observed string.",
        "Note: while this shows the most likely state at each time given the previous observations it does NOT show the most likely sequence of states. In fact the sequence shown may not even be valid."]

const forwardEquations = ["<div id=\"init0\">" + spanNH("init","\\(\\alpha_t (j)\\)",1) + " = " + spanNH("init","\\(\\pi(e_i)\\)",2) + spanNH("init","\\(e_j (o_t)\\)",4) + spanNH("equ","\\(, t = 1 , 1 <= j <= |S|\\)",5)+"</div>",
        "<div id=\"equ0\">" + spanNH("equ","\\(\\alpha_t (j)\\)",1) + " = " + spanNH("equ","\\((\\Sigma^{|S|}_{i=1}\\)",0) + spanNH("equ","\\(\\alpha_{t-1} (i)\\)",2) + spanNH("equ","\\(m_{i,j}\\)",3) +
        spanNH("equ","\\(e_j (o_t))\\)",4) + spanNH("equ","\\(, 1 < t <= T , 1 <= j <= |S|\\)",5) +"</div>"]

const backwardDescription = [p("This is used to calculate the chances of the model being in internal state \\(i\\) at time \\(t\\) given the observation sequence from \\(t\\) to \\(T\\)."  +
        " this is done by a set of cached variables called Beta \\(\\beta\\). This is calculated by these 2 equations: ")+
        p("Base case:"),
        p("When \\(t=T\\) Beta is 1, this is as there is no observed sequence past \\(T\\)") + 
        p("Inductive step:"),
        p("When \\(t < T\\) Beta is calculated by summing the products of all subsequent Betas \\((B_t+1(i))\\) by the transition from the current internal state to the next state \\(M_j,i\\) ," + 
        "this is then multiplied by the probability of the state emitting the observed value \\(e_j(o_t)\\). ")];

const backwardEquations = ["<div id=\"init0\">" + spanNH("init","\\(\\beta_T (j)\\)",1) + " =  1" + spanNH("equ","\\(, t = T , 1 <= j <= |S|)\\)",5) +"</div>",
        "<div id=\"equ0\">" + spanNH("equ","\\(\\beta_t (i)\\)",1) + " = " + spanNH("equ","\\((\\Sigma^{|S|}_{j=1}\\)",0) +spanNH("equ","\\(\\beta_{t+1} (j)\\)",2)+
        spanNH("equ","\\(m_{i,j}\\)",3) + spanNH("equ","\\(e_j (o_t))\\)",4) + spanNH("equ","\\(, 1 <= t < T , 1 <= j <= |S|\\)",5)+"</div>"];

const viterbiDesc = p("This is used to calculate the most likely sequence of  internal states the model took, this is the most important algorithm to solve the decoding problem and uses 2 variables. \\(\\delta\\) (defined as the most likely valid sequence of states that ends at the current state in the current timestep)" +
 "and \\(\\phi\\), (\\(\\phi \\) is used to cache the most likely previous state so the chain can be traced backwards to find the most likely sequence of states).")
+ p("\\(\\delta\\) and \\(\\phi\\) at the base case:")
+ "<div id=\"init0\">" + spanNH("init","\\(\\delta_1(i)\\)",1) + "=" + spanNH("init","\\(\\pi_i\\)",2) + spanNH("init", "\\(e_i(o_1)\\)",3) + "<br>"
+ spanNH("init","\\(\\psi_1(i)\\)",4) + "=" + spanNH("init", "\\(0\\)",5) + "</div>" 
+ p("Inductive step:")
+ "<div id=\"equ0\">" + spanNH("equ","\\(\\delta_t(j)\\)",1) + " = \\(max_i\\)[" + spanNH("equ","\\(\\delta_{t-1}(i)\\)",2) + spanNH("equ","\\(m_{i,j}\\)",3) + "] " + spanNH("equ","\\(e_j(o_t)\\)",4) + "<br>"
+ spanNH("equ","\\(\\psi_t(i)\\)",5) + " = \\(argmax_i\\)[" + spanNH("equ","\\(\\delta_{t-1}(i)\\)",6) + spanNH("equ","\\(m_{i,j} \\)",7) + "] </div>"
+ p("When t > 1 then delta is the maximum of the previous values and the transition probability multiplied, multiplied by the chance that that state will emit the observed emission state.")
+ p("After this is we trace back through the \\(\\phi \\) s starting at the \\(\\phi \\) with the highest corresponding \\(\\delta\\) at time T.");

const fbDesc = p("The forward-backward algorithm is one way of calculating the most likely sequence of internal states of a model give the observations. Although note that this may not produce a valid sequence of states (the state at time \\(t\\) may have a probability of 0 to transition to the state at time \\(t+1\\)).")
+ p("This algorithm has no base case and is based around the values cached by the forward and backward algorithms. It uses one new variable gamma(\\(\\gamma\\))")
+ "<div id=\"equ0\">" + spanNH("equ","\\( \\gamma_t(i) = \\frac{\\alpha_t(i)\\beta_t(i)}{ \\Sigma^{|S|}_{j=1} \\alpha_t(j) \\beta_t(j)}\\)",0) + "</div>"
+ p("The gamma(\\(\\gamma\\) ) at time t is equal to the product of corresponding alpha and beta. This value is then normalised by the sum of each alpha beta pair for all the other latent states, this means that all the gamma values at each timestep sums to 1.")
+ p("To calculate the most likely sequence of states simply take the state at each timestep with the heist probability.");

const bwDesc = p("The Baum-Welch algorithm is the most complex algorithm and is used for training the model to fit the observed string better. This is done using the forward backward and one new variable Xi(\\(\\xi\\)).")
+ p("To start this algorithm it is advised to create a “best guess” model, this model should contain all the states and transitions > 0 wanted on the final model (it especially must already be possible to create the observed string from the model).")
+ p("It is run by first creating the alpha beta and gamma values (from the forward backward and forward-backward algorithms respectively) then calculating Xi as follows:")
+ "<div id=\"equ0\">" + spanNH("equ","\\(\\xi_t(i,j) = \\frac{\\alpha_t(i)m_{i,j}e_j(o_{t+1})\\beta_{t+1}(j)}{P(O|\\lambda)}\\)",0) + "</div>"
+ p("Xi represents the chances of being in state i and transitioning to state j in the subsequent timestep. Note that \\(P(O|\\lambda)\\) is a normalising term defined as:")
+ "<div id=\"equ0\">" + spanNH("equ","\\(P(O|\\lambda) = \\Sigma^{|S|}_{i=1} \\Sigma^{|S|}_{j=1} \\alpha_t(i)m_{i,j}e_j(o_{t+1})\\beta_{t+1}(j)\\)",0) + "</div>"
+ p("With all these variables it is possible to recalculate the initial, transition and emission probabilities of the tool with the equations to follow:")
+ "<div id=\"equ0\">" + spanNH("equ","\\(\\pi'_i = \\gamma_1(i)\\)",0) + "</div>"
+ p("The number of times in state \\(S_i\\) when \\(t=1\\).")
+ "<div id=\"equ0\">" + spanNH("equ","\\(m'_{i,j} = \\frac{ \\Sigma^{T-1}_{t=1} \\xi_t(i,j)}{ \\Sigma^{T-1}_{t} \\gamma_t(i)}\\)",0) + "</div>"
+ p("The number of transitions from \\(S_i\\) to \\(S_j\\) normalised by the number of transitions from \\(S_i\\) to any other state.")
+ "<div id=\"equ0\">" + spanNH("equ","\\(e'_j(k) = \\frac{ \\Sigma^{T-1}_{t=1} \\gamma_t(j)_{s.t. o_t=k}}{ \\Sigma^{T-1}_{t=1}\\gamma_t(j)}\\)",0) + "</div>"
+ p("The number of times in state \\(S_j\\) and observing symbol \\(k\\) normalised by the number of times in state \\(S_j\\) and observing any symbol.");


///////////////////////////////////////////////////////
// algTable descriptions
///////////////////////////////////////////////////////
function forwardZero(t,i,s,output,A){
    equType = "equ";
    str =  "<div id=\"equ1\">" + span(1,1,t,i,"∅","\\(\\alpha_{0}("+s.text+")\\)") + " = (";
    str += span(1,2,t,i,null,"\\(\\pi("+ s.text +")\\)") + "</div>";

    str +=  "<div id=\"init2\">" + span(2,1,t,i,"∅","\\("+removeZeros(A[t][i].toPrecision(6))+"\\)") + " = (";
    str += span(2,2,t,i,null,"\\("+model.initialProbabilityDistribution[i]+"\\)") + ")</div>";
    return str;
}
function forwardInital(t,i,s,output,A){
    equType = "init";
    str =  "<div id=\"init1\">" + span(1,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\(\\alpha_{"+t+"}("+s.text+")\\)") + " = (";
    str += span(1,2,t,i,null,"\\(\\pi("+ s.text +")\\)");
    str +=  ")" + span(1,4,t,i,model.getEmissionState(output.charAt(t-1)),"\\(e_{"+s.text+"} ("+output.charAt(t-1)+")\\)") + "</div>";

    str +=  "<div id=\"init2\">" + span(2,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\("+removeZeros(A[t][i].toPrecision(6))+"\\)") + " = (";
    str += span(2,2,t,i,null,"\\("+model.initialProbabilityDistribution[i]+"\\)");
    str +=  ")" + span(2,4,t,i,model.getEmissionState(output.charAt(t-1)),"\\("+ s.getEmissionProbability(output.charAt(t-1))+"\\)") + "</div>";
    return str;
}
function forwardInduction(t,i,s,output,A){
    equType = "equ";
    str = "<div id=\"equ1\">" + span(1,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\(\\alpha_{"+t+"}("+s.text+")\\)") + " = (";
    for (var k in model.states){
        str += span(1,2+""+k,t-1,k,model.getEmissionState(output.charAt(t-2)),"\\(\\alpha_{"+(t-1)+"} ("+model.states[k].text+")\\)");
        str += span(1,3+""+k,t-1,k,i,"\\(m_{"+model.states[k].text+","+s.text+"} \\)");
        str += " + ";
    } 
    str = str.substr(0, str.length - 3);
    str +=  ")" + span(1,4,t,i,model.getEmissionState(output.charAt(t-1)),"\\(e_{"+s.text+"} ("+output.charAt(t-1)+")\\)") + "</div>";

    str += "<div id=\"equ2\">" + span(2,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\("+removeZeros(A[t][i].toPrecision(6))+"\\)") + " = (";
    for (var k in model.states){
        str += span(2,2+""+k,t-1,k,model.getEmissionState(output.charAt(t-2)),"\\("+removeZeros(A[t-1][k].toPrecision(6))+"\\)") + '*';
        str += span(2,3+""+k,t-1,k,i,"\\("+model.transitions[k][i].text+"\\)");
        str += " + ";
    }
    str = str.substr(0, str.length - 3);
    str +=  ")" + span(2,4,t,i,model.getEmissionState(output.charAt(t-1)),"\\("+ s.getEmissionProbability(output.charAt(t-1))+"\\)") + "</div>";
    return str;
}
function backwardZero(t,i,s,output,B){
    equType = "equ";
    str = "<div id=\"equ1\">" + span(1,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\(\\beta_{"+t+"}("+s.text+")\\)") + " = (";
    for (var k in model.states){
        str += span(1,2+""+k,t+1,k,model.getEmissionState(output.charAt(t)),"\\(\\beta_{"+(t+1)+"} ("+model.states[k].text+")\\)");
        str += span(1,3+""+k,t+1,i,k,"\\(m_{"+s.text+","+model.states[k].text+"} \\)");
        str += span(1,4+""+k,t+1,k,model.getEmissionState(output.charAt(t)),"\\(e_{"+model.states[k].text+"} ("+output.charAt(t)+")\\)");
        str += " + ";
    } 
    str = str.substr(0, str.length - 3);
    str +=  ")" + span(1,2,t,i,null,"\\(\\pi("+ s.text +")\\)") + "</div>";

    str += "<div id=\"equ2\">" + span(2,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\("+removeZeros(B[t][i].toPrecision(6))+"\\)") + " = (";
    for (var k in model.states){
        str += span(2,2+""+k,t+1,k,model.getEmissionState(output.charAt(t)),"\\("+removeZeros(B[t+1][k].toPrecision(6))+"\\)") + '*';
        str += span(2,3+""+k,t+1,i,k,"\\("+model.transitions[i][k].text+"\\)") + '*';
        str += span(2,4+""+k,t+1,k,model.getEmissionState(output.charAt(t)),"\\("+ model.states[k].getEmissionProbability(output.charAt(t))+"\\)");
        str += " + ";
    }
    str = str.substr(0, str.length - 3);
    str +=  ")" + span(2,2,t,i,null,"\\("+model.initialProbabilityDistribution[i]+"\\)") + "</div>";
    return str;
}
function backwardInital(t,i,s,output,B){
    equType = "init";
    str =  "<div id=\"init1\">" + span(1,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\(\\alpha_{"+t+"}("+s.text+")\\)") + " = 1" + "</div>";

    str +=  "<div id=\"init2\">" + span(2,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\("+removeZeros(B[t][i].toPrecision(6))+"\\)") + " = 1" + "</div>";
    return str;
}
function backwardInduction(t,i,s,output,B){
    equType = "equ";
    str = "<div id=\"equ1\">" + span(1,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\(\\beta_{"+t+"}("+s.text+")\\)") + " = (";
    for (var k in model.states){
        str += span(1,2+""+k,t+1,k,model.getEmissionState(output.charAt(t)),"\\(\\beta_{"+(t+1)+"} ("+model.states[k].text+")\\)");
        str += span(1,3+""+k,t+1,i,k,"\\(m_{"+s.text+","+model.states[k].text+"} \\)");
        str += span(1,4+""+k,t+1,k,model.getEmissionState(output.charAt(t)),"\\(e_{"+model.states[k].text+"} ("+output.charAt(t)+")\\)");
        str += " + ";
    } 
    str = str.substr(0, str.length - 3);
    str +=  ")" + "</div>";

    str += "<div id=\"equ2\">" + span(2,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\("+removeZeros(B[t][i].toPrecision(6))+"\\)") + " = (";
    for (var k in model.states){
        str += span(2,2+""+k,t+1,k,model.getEmissionState(output.charAt(t)),"\\("+removeZeros(B[t+1][k].toPrecision(6))+"\\)") + '*';
        str += span(2,3+""+k,t+1,i,k,"\\("+model.transitions[i][k].text+"\\)") + '*';
        str += span(2,4+""+k,t+1,k,model.getEmissionState(output.charAt(t)),"\\("+ model.states[k].getEmissionProbability(output.charAt(t))+"\\)");
        str += " + ";
    }
    str = str.substr(0, str.length - 3);
    str +=  ")" + "</div>";
    return str;
}
function gammaInduction(t,i,s,output,G,A,B){
    equType = "equ";
    str = "<div id=\"equ1\">" + "\\(\\gamma_{"+t+"}("+s.text+") = \\frac{\\alpha_{"+(t)+"} ("+s.text+")*\\beta_{"+(t)+"} ("+s.text+")}{";
    for (var k in model.states){
        str += "\\alpha_{"+(t)+"} ("+model.states[k].text+") \\beta{"+(t)+"} ("+model.states[k].text+")";
        str += " + ";
    } 
    str = str.substr(0, str.length - 3);
    str +=  "}\\)" + "</div>";

    str += "<div id=\"equ2\">" + "\\("+removeZeros(G[t][i].toPrecision(6))+" = \\frac{("+removeZeros(A[t][i].toPrecision(6))+"*"+removeZeros(B[t][i].toPrecision(6))+"}{";
    for (var k in model.states){
        str += ""+removeZeros(A[t][k].toPrecision(6))+" "+removeZeros(B[t][k].toPrecision(6))+"";
        str += " + ";
    } 
    str = str.substr(0, str.length - 3);
    str +=  "}\\)" + "</div>";

    return str;
}
function viterbiInital(t,i,s,output,D){
    equType = "init";
    str =  "<div id=\"init1\">" + span(1,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\(\\delta{"+t+"}("+s.text+")\\)") + " = (";
    str += span(1,2,t,i,null,"\\(\\pi(" + s.text + ")\\)");
    str +=  ")" + span(1,4,t,i,model.getEmissionState(output.charAt(t-1)),"\\(e_{"+s.text+"} ("+output.charAt(t-1)+")\\)") + "</div>";

    str +=  "<div id=\"init2\">" + span(2,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\("+removeZeros(D[t][i].toPrecision(6))+"\\)") + " = (";
    str += span(2,2,t,i,null,"\\("+model.initialProbabilityDistribution[i]+"\\)");
    str +=  ")" + span(2,4,t,i,model.getEmissionState(output.charAt(t-1)),"\\("+ s.getEmissionProbability(output.charAt(t-1))+"\\)") + "</div>";
    return str;
}
function viterbiInduction(t,i,s,output,D){
    equType = "equ";
    str = "<div id=\"equ1\">" + span(1,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\(\\delta_{"+t+"}("+s.text+")\\)") + " = ";
    str += "\\(max[\\)";
    for (var k in model.states){
        str += span(1,2+""+k,t-1,k,model.getEmissionState(output.charAt(t-2)),"\\(\\delta{"+(t-1)+"} ("+model.states[k].text+")\\)");
        str += span(1,3+""+k,t-1,k,i,"\\(m_{"+model.states[k].text+","+s.text+"} \\)");
        str += " , ";
    } 
    str = str.substr(0, str.length - 3);
    str +=  "]" + span(1,4,t,i,model.getEmissionState(output.charAt(t-1)),"\\(e_{"+s.text+"} ("+output.charAt(t-1)+")\\)") + "</div>";

    str += "<div id=\"equ2\">" + span(2,1,t,i,model.getEmissionState(output.charAt(t-1)),"\\("+removeZeros(D[t][i].toPrecision(6))+"\\)") + " = ";
    str += "\\(max[\\)";
    for (var k in model.states){
        str += span(2,2+""+k,t-1,k,model.getEmissionState(output.charAt(t-2)),"\\("+D[t-1][k]+"\\)");
        str += span(2,3+""+k,t-1,k,i,"\\("+model.transitions[k][i].text+"\\)");
        str += " , ";
    }
    str = str.substr(0, str.length - 3);
    str +=  "]" + span(2,4,t,i,model.getEmissionState(output.charAt(t-1)),"\\("+ s.getEmissionProbability(output.charAt(t-1))+"\\)") + "</div>";
    return str;
}
///////////////////////////////////////////////////////
// instructions
///////////////////////////////////////////////////////

const markovChainInstructions =  
    p("<b>Add a state:</b> Double-click anywhere.")+
    p("<b>Add a transition:</b> Shift-drag on a state.")+
    p("<b>Delete Something:</b> Click on it and press the delete key")+
    p("<b>Move Something:</b> Click on it and hold to drag")+
    p("All of the elements of a state can be edited inside the 'State Details' tab, and most can be edited on the model itself");

const HiddenMarkovModelInstructions = 
    p("<b>Add a state:</b> Double-click anywhere.")+
    p("<b>Add an emission state:</b> Double-click anywhere while holding control.")+
    p("<b>Add a transition:</b> Shift-drag on a state.")+
    p("<b>Delete Something:</b> Click on it and press the delete key")+
    p("<b>Move Something:</b> Click on it and hold to drag")+
    p("All of the elements of a state can be edited inside the 'State Details' tab, and most can be edited on the model itself");
    