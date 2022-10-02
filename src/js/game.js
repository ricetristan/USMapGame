usRaphael = {};
var R = null;
var theWheel = null;

window.onload = function () {
    R = Raphael("map", 1000, 600),
      attr = {
      "fill": "#d3d3d3",
      "stroke": "#fff",
      "stroke-opacity": "1",
      "stroke-linejoin": "round",
      "stroke-miterlimit": "4",
      "stroke-width": "0.75",
      "stroke-dasharray": "none"
    };
    
    
    //Draw Map and store Raphael paths
    for (var state in usMap) {
      usRaphael[state] = R.path(usMap[state]).attr(attr);
    }
    // Draw labels
    for (var state in usMap) {
      var statePathBox = usRaphael[state].getBBox();
      usRaphael[state + '_name'] = R.text(statePathBox.x + (statePathBox.width / 2), statePathBox.y + (statePathBox.height / 2), state.toUpperCase());
    }

    //Do Work on Map
    for (var state in usRaphael) {
      usRaphael[state].color = Raphael.getColor();
      usRaphael[state][0].id = state;
      (function (st, state) {

        st[0].style.cursor = "pointer";

        // st[0].onmouseover = function () {
        //   st.animate({fill: st.color}, 500);
        //   st.toFront();
        //   R.safari();
        // };

        // st[0].onmouseout = function () {
        //   st.animate({fill: "#d3d3d3"}, 500);
        //   st.toFront();
        //   R.safari();
        // };
                   
      })(usRaphael[state], state);
    }
     
    // Add state click handlers
    let statePaths = document.querySelectorAll('path');
    for(let i=0; i<statePaths.length; i++){ statePaths[i].addEventListener('click', function(evt){ 
      if(evt && evt.target){
        let stateName = evt.target.id;
        if(stateName && getStateOwner(stateName) == stateName){ pickState(stateName.toLowerCase()); }
      }
     }, false); }
     let stateNames = document.querySelectorAll('text');
     for(let i=0; i<stateNames.length; i++){ stateNames[i].addEventListener('click', function(evt){ 
      if(evt && evt.target){
        let stateName = evt.target.textContent.toLowerCase();
        if(stateName && getStateOwner(stateName) == stateName){ pickState(stateName); }
      }
     }, false); }
     
};

function resetMap(){
  if(confirm('Are you sure you want to reset the map?')){
    window.location.reload();
  }
}

function hideSpinner(){
  document.getElementById('canvas').style.display = 'none';
}

function showSpinner(state){

  if(document.getElementById('canvas').style.display == '') return; // Already spinning

  // Hide spinner
  hideSpinner();

  // Setup the wheel
  let segments = getWheelSegments(state);
  if(segments && segments.length > 0){
    theWheel = new Winwheel({
      'responsive'   : true,
      'numSegments'    : segments.length,
      'segments'       : segments,
      'animation' :
      {
          'type'     : 'spinToStop',
          'duration' : 2,
          'spins'    : 4,
          'callbackFinished' : "spinComplete(" + (state ? "'" + state + "'" : "") + ")",
          'callbackAfter' : 'drawTriangle()'
      }
    });

    // Show spinner and spin it
    document.getElementById('canvas').style.display = '';
    startSpin();
  }
}

function getWheelSegments(state){
  let segments = [];
  if(state){
    let neighbors = getStateNeighbors(state);
    for(let i=0; i<neighbors.length; i++){
      segments.push({'fillStyle': usRaphael[neighbors[i]].color, 'text': neighbors[i].toUpperCase()});
    }
  }else{
    let states = Object.keys(stateNeighbors);
    for(let i=0; i<states.length; i++){
      if(getStateOwner(states[i]) == states[i]){
        segments.push({'fillStyle': usRaphael[states[i]].color, 'text': states[i].toUpperCase()});
      }
    }
  }
  return segments;
}

function startSpin()
{
  if(theWheel){
    // Stop any current animation.
    theWheel.stopAnimation(false);

    // Reset the rotation angle to less than or equal to 360 so spinning again works as expected.
    // Setting to modulus (%) 360 keeps the current position.
    theWheel.rotationAngle = theWheel.rotationAngle % 360;

    // Start animation.
    theWheel.startAnimation();
  }
}
function drawTriangle()
{
    // Get the canvas context the wheel uses.
    let ctx = theWheel.ctx;

    ctx.strokeStyle = 'navy';     // Set line colour.
    ctx.fillStyle   = 'gray';     // Set fill colour.
    ctx.lineWidth   = 2;
    ctx.beginPath();              // Begin path.
    ctx.moveTo(240, 1);           // Move to initial position.
    ctx.lineTo(260, 1);           // Draw lines to make the shape.
    ctx.lineTo(250, 40);
    ctx.lineTo(241, 1);
    ctx.stroke();                 // Complete the path by stroking (draw lines).
    ctx.fill();                   // Then fill.
}
function spinComplete(state)
{
    let selectedState = theWheel.getIndicatedSegment();
    if(state){
      combine(getCurrentStatePick(), selectedState.text.toLowerCase());
    }else{
      pickState(selectedState.text.toLowerCase());
    }
    setTimeout(hideSpinner, 1500);
}

function showState(state){
  if(state){
    let stateElem = usRaphael[state.toLowerCase()];
    if(stateElem){
        stateElem.animate({fill: stateElem.color}, 3000);
        //stateElem.toFront();
        R.safari();
    }
  }
}

/*function showNeighbor(state, dir){
    let stateElem = usRaphael[state];
    let neighbor = stateNeighbors[state][dir];
    if(neighbor){ showState(neighbor); }
}*/

function pickState(state){
  if(!state){
    let N = Object.keys(stateNeighbors).length;
    let random = Math.floor(Math.random() * N);
    state = Object.keys(stateNeighbors)[random];
    state = getStateOwner(state);
  }
  document.getElementById('statePick').innerHTML = state;
  pickNeighbor(null, true); // reset neighbor selection
  showState(state);
}

function getCurrentStatePick(){
  return document.getElementById('statePick').innerHTML;
}

function getStateOwner(state){
  let owner = state;
  let stateOwners = Object.keys(combinedStates);
  if(stateOwners){
    for(let i=0; i<stateOwners.length; i++){
      let stateOwner = stateOwners[i];
      if(combinedStates[stateOwner].includes(state)){ owner = stateOwner; }
    }
  }
  return owner;
}

function getStateNeighbors(state){
  let stateOwner = getStateOwner(state);
  let neighbors = stateNeighbors[state];
  if(combinedStates[stateOwner]) {
    for(let i=0; i<combinedStates[stateOwner].length; i++){
      let ownedState = combinedStates[stateOwner][i];
      neighbors.push(...stateNeighbors[ownedState]);
    }
  }
  let filteredNeighbors = [];
  for(let i=0; i<neighbors.length; i++){
    let neighbor = neighbors[i];
    let neighborOwner = getStateOwner(neighbor);
    if(neighborOwner != state && !filteredNeighbors.includes(neighborOwner)) filteredNeighbors.push(neighborOwner);
  }
   return filteredNeighbors; 
}

function pickNeighbor(state, reset){
  if(reset){
    //document.getElementById('neighborPick').innerHTML = '';
  }else{
    let statePick = state;
    if(!statePick) statePick = getCurrentStatePick();
    let neighbors = stateNeighbors[statePick];
    let N = neighbors.length;
    if(N <= 0) pickNeighbor(null, true);
    let random = Math.floor(Math.random() * N);
    let neighbor = neighbors[random];
    //document.getElementById('neighborPick').innerHTML = neighbor;
    showState(neighbor);
    combine(statePick, neighbor);
  }
}


function combine(state, neighbor){
  if(!state || !neighbor) return;
  if(state == neighbor) return;

  // First, check if selected state or neighbor is already owned by another state
  state = getStateOwner(state);
  let neighborOwner = getStateOwner(neighbor);
  
  if(!combinedStates[state]){ combinedStates[state] = []; }
  else if(combinedStates[state].length > 49){ return; }

  // If neighbor is already owned, recurse!
  if(state == neighborOwner){ pickNeighbor(neighbor); }
  
  // Else, check if selected neighbor is owner of other states
  else if(combinedStates[neighborOwner]){
    // If so, combine all owned states
    combinedStates[state] = [...combinedStates[state], ...combinedStates[neighborOwner]];
    combinedStates[state].push(neighborOwner);
    delete combinedStates[neighborOwner];
  }

  // Otherwise, just add neighbor to owned list
  else{
    combinedStates[state].push(neighbor);
  }


  // Finally, color all owned states the same, and clear any owned state labels
  let stateElem = usRaphael[state];
  stateElem.animate({stroke: stateElem.color}, 500);
  for(let i=0; i< combinedStates[state].length; i++){
    let ownedState = combinedStates[state][i];
    let neighborElem = usRaphael[ownedState];
    if(neighborElem){
      neighborElem.animate({fill: stateElem.color}, 500);
      neighborElem.animate({stroke: stateElem.color}, 500);
      //neighborElem.toFront();
      R.safari();

      // Remove neighbor label
      usRaphael[ownedState + '_name'].remove();
    }
  }

  if(combinedStates[state].length > 49){ gameOver(); }
}


function gameOver(){
  alert('GAME OVER! ' + getCurrentStatePick().toUpperCase() + ' WINS!');
}