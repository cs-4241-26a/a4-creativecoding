
import kaplay from "kaplay";

const k = kaplay();


k.loadRoot("./");

k.setBackground(k.Color.fromHex("#E0FFFF"));

k.loadSprite("yarn", "sprites/yarn.png");
k.loadSprite("scissors", "sprites/scissors.png");
k.loadSprite("hook", "sprites/hook.png");
k.loadSprite("halfsweat", "sprites/halfsweat.png");
k.loadSprite("fullsweat", "sprites/fullsweat.png");
k.loadSprite("basket", "sprites/basket.png");
k.loadFont("playfair", "sprites/PlayfairDisplay-VariableFont_wght.ttf");

const player = k.add([
    k.sprite("basket"),
    k.pos(360, 500),
    k.area(),
    k.anchor("center"),
    k.scale(0.5),
]);


let score = 0;

let gameOver = false;
let gameStarted = false;

let fallingObjects = [];
let gameTime = 60; 


const scoreText = k.add([
    k.text("Score : 0", {
        font: "playfair",
        size: 32,
    }),
    k.pos(20, 20),
    k.color(0,0,0),
]);



const timerText = k.add([
     k.text("Time: 60", {
        font: "playfair", 
        size: 32,
     }),
    k.pos(20, 120),
    
    k.color(0, 0, 0),
]);

const startButton = document.getElementById("startButton");
const startScreen = document.getElementById("startScreen");
const playerSpeed = document.getElementById("playerSpeed");

startButton.addEventListener("click", () => {

    gameStarted = true;
    gameTime = 60; 

    startScreen.style.display = "none";

    spawnObject();
    spawnObject();
    spawnObject();
});



window.addEventListener("keydown", (event) => {

    if (!gameStarted || gameOver) {
        return;
    }

    if (event.key === "ArrowLeft") {
        player.pos.x -= Number(playerSpeed.value) / 20;
    }

    if (event.key === "ArrowRight") {
        player.pos.x += Number(playerSpeed.value) / 20;
    }
});

function spawnObject() {

    const randomObject = Math.random();

    if (randomObject < 0.70) {


        const newObject = k.add([
            k.sprite("yarn"),
            k.pos(k.rand(50, 670), 50),
            k.area(),
            k.anchor("center"),
            k.scale(0.2),
        ]);

        fallingObjects.push({
            object: newObject,
            type: "yarn"
        });

    } else if (randomObject < 0.85) {

         const newObject = k.add([
            k.sprite("scissors"),
            k.pos(k.rand(50, 670), 50),
            k.area(),
            k.anchor("center"),
            k.scale(0.2),
        ]);

        fallingObjects.push({
            object: newObject,
            type: "scissors"
        });

    } else {

        const newObject = k.add([
            k.sprite("hook"),
            k.pos(k.rand(50, 670), 50),
            k.area(),
            k.anchor("center"),
            k.scale(0.2),
        ]);

        fallingObjects.push({
            object: newObject,
            type: "hook"
        });
    }

    console.log("New object spawned");
}



k.onUpdate(() => {

    if (!gameStarted) {
        return;
    }

    if (gameOver) {
        return;
    }
     gameTime -= k.dt();

    timerText.text = "Time: " + Math.ceil(gameTime);


    if (gameTime <= 0) {

        gameTime = 0;
        gameOver = true;
        for (const current of fallingObjects) {
            current.object.destroy();
        }

fallingObjects = [];

        if (score >= 200) {

            k.add([
                k.text("You made a FULL sweater!",{
                    font: "playfair", 
                    size: 32,
                }),  

                k.pos(360, 180),
                k.anchor("center"),
                k.color(0, 0, 0),
            ]);

            k.add([
                k.text ("Final Score: " + score,{
                    font: "playfair",
                    size: 28, 
                }), 
            k.pos(360, 240),
            k.anchor("center"),
            k.color(0,0,0),

        ]);

            k.add([
                k.sprite('fullsweat'), 
                k.pos(360, 400), 
                k.anchor("center"), 
                k.scale(0.5),
                
            ]); 

        } else {

            k.add([
                k.text("You made HALF a sweater!",{
                    font: "playfair", 
                    size: 32,
                }),

                k.pos(360, 180),
                k.anchor("center"),
                k.color(0,0,0),

            ]);

             k.add([
                k.text ("Final Score: " + score,{
                    font: "playfair",
                    size: 28, 
                }), 
            k.pos(360, 240),
            k.anchor("center"),
            k.color(0,0,0),

        ]);
            k.add([
                k.sprite('halfsweat'), 
                k.pos(360, 400), 
                k.anchor("center"), 
                k.scale(0.5),
         

                
            ]); 
        }



        return;
    }

    for (let i = fallingObjects.length - 1; i >= 0; i--) {

        const current = fallingObjects[i];



        current.object.move(0, 150);


        if (current.object.pos.dist(player.pos) < 60) {

            if (current.type === "yarn") {

                score += 10;
                console.log("Yarn caught!");

            } else if (current.type === "scissors") {

                score -= 10;
                console.log("Scissors caught!");

            } else if (current.type === "hook") {

                score += 1;
                console.log("Hook caught!");
            }

            scoreText.text = "Score: " + score;


            current.object.destroy();

            fallingObjects.splice(i, 1);
            spawnObject();

            continue;
        }

        if (current.object.pos.y > 550) {

            if (current.type === "scissors") {

                console.log("Scissors missed");

            } else if (current.type === "hook") {

                console.log("Hook missed");
            }

            current.object.destroy();

            fallingObjects.splice(i, 1);
            spawnObject(); 
        }
    }
});