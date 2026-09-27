// FRONT-END (CLIENT) JAVASCRIPT HERE

let ul

let canvas
let ctx

let audioCtx
let osc
let gainNode
let analyser
let results

const submit = async function( event ) {
  // stop form submission from trying to load
  // a new .html page for displaying results...
  // this was the original browser behavior and still
  // remains to this day
  event.preventDefault()
  
  const json = { name: document.querySelector('#itemname').value,  
    price: document.querySelector('#itemprice').value, 
    tasty: document.querySelector('#itemgood').value, 
    delete: document.querySelector('#delete').value, 
    modify: document.querySelector('#modify').value}
  const body = JSON.stringify( json )

  let type = '/add'
  if (document.querySelector('#delete').value) {
    type = '/remove'
  }
  if (document.querySelector('#modify').value) {
    type = '/update'
  }

  fetch( type, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify( json )
  })

  const response = await fetch( '/docs', {
    method:  'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  let arr = await response.text()

  console.log(arr)
  
  arr = JSON.parse(arr)

  console.log(arr)

  ul.innerHTML = ''
  for (let item of arr) {
    const li = document.createElement('li')
    li.innerText = "Name: " + item.name + " Price: $" + item.price + " Tasty?: " + item.tasty
    ul.appendChild(li)
  }
}


const playAudio = async function( event ) {
  console.log("Playing Audio thats " + document.querySelector('#gain') + " loud")

  if (osc != null) {
    osc.stop()
  }

  audioCtx = new AudioContext()
  osc  = audioCtx.createOscillator()
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 1024

  osc.type = 'sawtooth'

  gainNode = audioCtx.createGain()
  gainNode.gain.value = .1

  biquad = audioCtx.createBiquadFilter()

  osc.connect( biquad )
  biquad.connect( gainNode )
  gainNode.connect( audioCtx.destination )
  osc.connect( analyser )

  osc.start( 0 )

  // try different values
  osc.frequency.value = document.querySelector('#frequency').value
  gainNode.gain.value = document.querySelector('#gain').value
  biquad.frequency.value = document.querySelector('#filter').value

  results = new Uint8Array( analyser.frequencyBinCount )
}

const stopAudio = async function( event ) {
  if (osc != null) {
    osc.stop()
  }
}

draw = function() {
  console.log("start")
  // temporal recursion, call tthe function in the future
  window.requestAnimationFrame( draw )
  
  ctx.fillStyle = 'black' 
  ctx.fillRect( 0,0,canvas.width,canvas.height )
  ctx.fillStyle = 'white' 
  
  if (analyser != null) {
    console.log("work")
    analyser.getByteFrequencyData( results )
    
    for( let i = 0; i < analyser.frequencyBinCount; i++ ) {
      ctx.fillRect( i, 0, 1, results[i] ) // upside down
    }
  }
}

window.onload = function() {
  // const button = document.querySelector('button')
  // button.onclick = submit
  // ul = document.createElement('ul')
  // document.getElementById("forma").appendChild(ul)


  const audiobutton = document.getElementById("playaudio")
  audiobutton.onclick = playAudio

  const audiobutton2 = document.getElementById("stopaudio")
  audiobutton2.onclick = stopAudio


  console.log("Started")
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");  

  draw()

}
