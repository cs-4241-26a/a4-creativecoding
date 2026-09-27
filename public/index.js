let canvas = undefined
let ctx = undefined

window.onload = function() {
    //setup for canvas
    canvas = document.getElementById("canvas")
    ctx = canvas.getContext("2d")
    canvas.addEventListener("pointerup", canvasClicked)
    prevTime = document.timeline.currentTime

    //setup for input sliders
    zoomInput = document.getElementById("zoom")
    zoomLevel = parseInt(zoomInput.value)
    viewOffset = (conwayDimensions - zoomLevel) / 2
    speedInput = document.getElementById("gameSpeed")
    gameSpeed = parseInt(speedInput.value)

    //setup for pause & unpause buttons
    const pauseButton = document.getElementById("pause")
    pauseButton.onclick = pauseGame
    const unpauseButton = document.getElementById("unpause")
    unpauseButton.onclick = unpauseGame

    //setup gamestate array
    initializeConwayArray()

    //add in a few initial values to start the player off
    //conwayArray[5][5] = true
    //conwayArray[6][6] = true
    //conwayArray[7][6] = true

    requestAnimationFrame(draw) //start render loop
}

let gameRunning = false //if the game is running: true. if the game is paused: false. 
function pauseGame() {
    gameRunning = false
    const pauseIndicator = document.getElementById("pauseIndicator")
    pauseIndicator.innerText = "Game Paused"
}

function unpauseGame() {
    gameRunning = true
    const pauseIndicator = document.getElementById("pauseIndicator")
    pauseIndicator.innerText = "Game Running"
}


let prevTime = undefined //time that the previous function started
let zoomInput = undefined //input element that provides zoom level
let zoomLevel = undefined //number of cells per axis
let viewOffset = undefined //coordinate where the viewport begins. derived from zoomLevel and conwayDimensions
const updateSpeed = 500 //in ms. when gameSpeed = 1, it will take this many milliseconds to make a new update
let speedInput = undefined //input element that provides game speed
let gameSpeed = undefined //multiplier for how fast the game updates. 
let sinceLastUpdate = 0 //in ms. time elapsed since the last update happened. 
function draw(timestamp) {
    let deltaTime = timestamp - prevTime //miliseconds that passed since last frame. usually 16.6667ms for 60hz
    prevTime = timestamp //set prevTime so that next deltaTime calculation will be accurate

    //sometimes, the user tabs out. this will result in a massive deltaTime value. which messes things up and is bad. 
    // so if deltaTime is abnormally large, just skip the frame! shouldn't be a problem unless the user has a 10Hz monitor or something.
    if (deltaTime < 100) { //only run the frame if it hasn't been more than 100ms
        //clear canvas for this frame
        ctx.fillStyle = "rgb(255 255 255)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        //update any inputs that may have changed
        zoomLevel = parseInt(zoomInput.value)
        viewOffset = (conwayDimensions - zoomLevel) / 2
        gameSpeed = parseInt(speedInput.value)

        //possibly perform an update. only if the game is running, though. 
        if (gameRunning === true) {
            sinceLastUpdate += deltaTime
        }
        //check if it's update time
        if (sinceLastUpdate > (updateSpeed / gameSpeed)) {
            //if it is update time, make sure to set back sinceLastDot
            sinceLastUpdate -= (updateSpeed / gameSpeed)

            //get how many neighbors each cell has
            for (let i = 0; i < conwayDimensions; i++) {
                for (let j = 0; j < conwayDimensions; j++) {
                    secondaryArray[i][j] = numAliveSurrounding(i, j)
                }
            }
            //update cells based on neighbor information
            for (let i = 0; i < conwayDimensions; i++) {
                for (let j = 0; j < conwayDimensions; j++) {
                    let numNeighbors = secondaryArray[i][j]
                    if (conwayArray[i][j] === true) { //if the cell is alive:
                        if (numNeighbors < 2) {
                            //fewer than 2 neighbors: starvation
                            conwayArray[i][j] = false
                        } else if (numNeighbors > 3) {
                            //more than 3 neighbors: overpopulation
                            conwayArray[i][j] = false
                        }
                        //otherwise, the cell stays alive
                    } else { //if the cell is dead:
                        if (numNeighbors === 3) {
                            //only if the dead cell has 3 neighbors: becomes alive via reporduction
                            conwayArray[i][j] = true
                        }
                    }
                }
            }
            //updates done! 
        }

        //add in live cells
        let oneVerticalDiv = canvas.height / zoomLevel
        let oneHorizontalDiv = canvas.width / zoomLevel
        ctx.fillStyle = "rgb(0 0 0)"
        for (let i = viewOffset; i < (zoomLevel+viewOffset); i++) {
            for (let j = viewOffset; j < (zoomLevel+viewOffset); j++) {
                if (conwayArray[i][j] === true) {
                    ctx.fillRect((i-viewOffset)*oneHorizontalDiv, (j-viewOffset)*oneVerticalDiv, oneHorizontalDiv, oneVerticalDiv)
                }
            }
        }
    }
    requestAnimationFrame(draw) //continue render loop
}

function canvasClicked(event) {
    //console.log(`something moved somewhere...x=${event.offsetX}, y=${event.offsetY}`)
    let coordX = Math.floor(event.offsetX / canvas.width * zoomLevel) + viewOffset
    let coordY = Math.floor(event.offsetY / canvas.height * zoomLevel) + viewOffset
    //console.log(`we gots x=${coordX}, y=${coordY}`)
    conwayArray[coordX][coordY] = !(conwayArray[coordX][coordY])
}

function numAliveSurrounding(x, y) {
    let numAlive = 0
    for (let i = x-1; i <= x+1; i++) {
        for (let j = y-1; j <= y+1; j++) {
            //ensure that number is within array bounds
            //consider all outside of bounds to be dead. 
            if ((i >= 0) && (j >= 0) && (i < conwayDimensions) && (j < conwayDimensions)) {
                //make sure we're not counting this cell
                if ((i != x) || (j != y)) {
                    //if it's alive, add one to the count
                    if (conwayArray[i][j] === true) {
                        numAlive += 1
                    }
                }
            }
        }
    }
    //return number of cells found alive
    return numAlive
}

const conwayDimensions = 16 //how many rows and how many columns will be simulated. 
let conwayArray = undefined //2d, has booleans. true if the cell at that point is alive, false if dead. 
let secondaryArray = undefined //2d, has integers. used to hold info about neighbors in conwayArray
function initializeConwayArray() {
    //make array
    conwayArray = []
    secondaryArray = []
    //push a conwayDimensions 1d array to the main 2d array, conwayDimensions times.
    for (let i = 0; i < conwayDimensions; i++) {
        conwayArray.push(new Array(conwayDimensions))
        secondaryArray.push(new Array(conwayDimensions))
    }
    //fill all with false
    for (let i = 0; i < conwayDimensions; i++) {
        for (let j = 0; j < conwayDimensions; j++) {
            conwayArray[i][j] = false
            secondaryArray[i][j] = 0
        }
    }
}