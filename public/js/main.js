// FRONT-END (CLIENT) JAVASCRIPT HERE

class AudioBox {
  canvas
  ctx

  audioCtx
  osc
  gainNode
  analyser
  results
  constructor() {
    
  }
}

const audioBoxes = [
    // new Person("Alice", 30),
    // new Person("Bob", 25),
    // new Person("Charlie", 35)
];

let ul

const playAudio = async function(event, next) {  
  event.preventDefault()

  let which = next

  message("Playing Audio thats " + document.querySelector('#gain' + which) + " loud")

  message(next)

  if (audioBoxes[which].osc != null) {
    audioBoxes[which].osc.stop()
  }

  audioBoxes[which].audioCtx = new AudioContext()
  audioBoxes[which].osc  = audioBoxes[which].audioCtx.createOscillator()
  audioBoxes[which].analyser = audioBoxes[which].audioCtx.createAnalyser()
  audioBoxes[which].analyser.fftSize = 1024

  audioBoxes[which].osc.type = document.querySelector('#noise' + which).value

  audioBoxes[which].gainNode = audioBoxes[which].audioCtx.createGain()
  audioBoxes[which].gainNode.gain.value = .1

  biquad = audioBoxes[which].audioCtx.createBiquadFilter()


  audioBoxes[which].osc.connect( biquad )
  biquad.connect( audioBoxes[which].gainNode )
  audioBoxes[which].gainNode.connect( audioBoxes[which].audioCtx.destination )
  audioBoxes[which].osc.connect( audioBoxes[which].analyser )

  audioBoxes[which].osc.start( 0 )

  // try different values
  audioBoxes[which].osc.frequency.value = document.querySelector('#frequency' + which).value
  audioBoxes[which].gainNode.gain.value = document.querySelector('#gain' + which).value
  biquad.frequency.value = document.querySelector('#filter' + which).value

  audioBoxes[which].results = new Uint8Array( audioBoxes[which].analyser.frequencyBinCount )

}

const stopAudio = async function(event, next) {
  event.preventDefault()
  if (audioBoxes[next].osc != null) {
    audioBoxes[next].osc.stop()
  }
}


const makeBox = async function( event ) {
  event.preventDefault()
  let next = audioBoxes.length

  let container = document.getElementById("forma");

  let div = document.createElement("div");
  let title = document.createElement("h3");
  title.textContent = "Audio Box " + next

  let canvas = document.createElement("canvas")
  canvas.id = "canvas" + next
  canvas.width = 1000
  canvas.height = 400
  canvas.style="border:1px solid #000000;"


  
  let form = document.createElement("form");

  let labelF = document.createElement("label");
  labelF.textContent = "Frequency";
  let inputF = document.createElement("input")
  inputF.type = "text"
  inputF.id = "frequency" + next
  inputF.placeholder = "frequency"
  inputF.value = "220"

  let labelG = document.createElement("label");
  labelG.textContent = "Gain";
  let inputG = document.createElement("input")
  inputG.type = "text"
  inputG.id = "gain" + next
  inputG.placeholder = "gain"
  inputG.value = "0.1"

  let labelFi = document.createElement("label");
  labelFi.textContent = "Filter";
  let inputFi = document.createElement("input")
  inputFi.type = "text"
  inputFi.id = "filter" + next
  inputFi.placeholder = "filter"
  inputFi.value = "300"

  let labelN = document.createElement("label");
  labelN.textContent = "Noise Type (ex \"sine\" \"sawtooth\" \"square\")";
  let inputN = document.createElement("input")
  inputN.type = "text"
  inputN.id = "noise" + next
  inputN.placeholder = "noise"
  inputN.value = "sawtooth"

  let startbutton = document.createElement("button")
  //startbutton.onclick = playAudio
  startbutton.textContent = "Play Audio";
  startbutton.id = "playaudio" + next
  startbutton.addEventListener("click", (event) => {playAudio(event, next);});
  let stopbutton = document.createElement("button")
  //stopbutton.onclick = stopAudio
  stopbutton.textContent = "Stop Audio";
  stopbutton.id = "stopaudio" + next
  stopbutton.addEventListener("click", (event) => {stopAudio(event, next);});

  form.appendChild(labelF);
  form.appendChild(inputF);
  form.appendChild(labelG);
  form.appendChild(inputG);
  form.appendChild(labelFi);
  form.appendChild(inputFi);
  form.appendChild(labelN);
  form.appendChild(inputN);
  form.appendChild(startbutton);
  form.appendChild(stopbutton);




  div.appendChild(title);
  div.appendChild(canvas);
  div.appendChild(form);
  container.appendChild(div);

  audioBoxes.push(new AudioBox())
  audioBoxes[next].canvas = document.getElementById("canvas" + next);
  audioBoxes[next].ctx = audioBoxes[next].canvas.getContext("2d");
}

message = function(what) {
  const json = { message: what}

  fetch( '/debug', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify( json )
  })
}

draw = function() {
  console.log("start")
  // temporal recursion, call tthe function in the future
  window.requestAnimationFrame( draw )

  for (let i = 0; i < audioBoxes.length; i++) {
  
    audioBoxes[i].ctx.fillStyle = 'black' 
    audioBoxes[i].ctx.fillRect( 0,0,audioBoxes[i].canvas.width,audioBoxes[i].canvas.height )
    audioBoxes[i].ctx.fillStyle = 'white' 
    
    if (audioBoxes[i].analyser != null) {
      console.log("work" + i)
      audioBoxes[i].analyser.getByteFrequencyData( audioBoxes[i].results )
      
      for( let j = 0; j < 512; j++ ) {
        audioBoxes[i].ctx.fillRect( j, 0, 1, audioBoxes[i].results[j] ) // upside down
      }
    }

  }
}

window.onload = function() {
  // const button = document.querySelector('button')
  // button.onclick = submit
  // ul = document.createElement('ul')
  // document.getElementById("forma").appendChild(ul)

  const boxbutton = document.getElementById("boxbutton")
  boxbutton.onclick = makeBox

  console.log("Started")

  draw()

}
