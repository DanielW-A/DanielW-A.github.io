# DanielW-A.github.io

This is a browser-based tool for experimenting and learning Markov chains and Hidden Markov models.

### How to use it

- Navigate to https://danielw-a.github.io/.
- Switch type of model (hidden Markov model or Markov chain) at the top, the default is Markov chain.

##### Create a model

- To create a state double click on the screen.
- To edit properties of the state type in the "State Details" accordion on the right.
- To create transitions between states, drag and drop from the origin state to the second state while holding SHIFT.
- To set the probability of the transition type a valid probability when the transition is highlighted.
- Transitions can also be created in the "Transition Probabilities" section of the "State Details" accordion.
- To Create an emission state (For Hidden Markov Models) double click anywhere while holding CONTROL

##### Edit a model

- To select a component simply click on it.
- To deselect a component, click elsewhere or press ENTER.
- To remove a component, press DELETE while it is selected.
- To move a state or change the angle of a self-transition drag a drop them.

##### Running a model

- To run a model, press the "Run" button in the top right corner. The speed and number of steps can be controlled by the slider and number input below.

##### Executing and algorithm
	
- To Run and algorithm first click the chevron near the bottom left corner to open the algorithm panel.
- Select the required algorithm from the dropdown.
- A description of the algorithm can then be found in the "Algorithm Info" accordion panel.
- Then enter the Observed string into the input box.
- Now pressing the "step" button will step through whatever algorithm is selected.

##### Misc

- to save the model as a JSON file press the save button.
- To Export the model to a LaTeX figure, press the "export" button.
- To load in JSON files press the "load" button.
- To clear the canvas, press the "clear” button.
- To run locally download this repository and run "index.html" in a web browser.
- To test the project download this repository and run "npm run test" in the root of the project.
 
