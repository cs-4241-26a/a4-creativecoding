
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const settings = {
  ballSpeed: 10,
  pokemonSpeed: 2,
  spawnRate: 2,
  ballSize: 15,
  maxPokemon: 6,
  difficulty: "normal"
};

let pokemon = [];
let pokeballs = [];
let particles = [];

let score = 0;
let balls = 30;
let caught = 0;

let running = false;
let paused = false;

let lastTime = 0;
let spawnTimer = 0;


const pokemonTypes = [
  {
    name: "Electric",
    color: "#ffdc35",
    points: 10,
    catchRate: 0.8
  },
  {
    name: "Fire",
    color: "#ff7948",
    points: 20,
    catchRate: 0.65
  },
  {
    name: "Water",
    color: "#59bfff",
    points: 15,
    catchRate: 0.75
  },
  {
    name: "Grass",
    color: "#73df79",
    points: 15,
    catchRate: 0.75
  },
  {
    name: "Rare",
    color: "#c28aff",
    points: 50,
    catchRate: 0.35
  }
];

function updateStats() {
  document.getElementById("score").textContent = score;
  document.getElementById("balls").textContent = balls;
  document.getElementById("caught").textContent = caught;
}

function showMessage(text) {
  document.getElementById("message").textContent = text;
}

function createPokemon() {
  if (pokemon.length >= settings.maxPokemon) {
    return;
  }

  const type = pokemonTypes[
    Math.floor(Math.random() * pokemonTypes.length)
  ];

  const radius = 24;

  pokemon.push({
    x: radius + Math.random() * (canvas.width - radius * 2),
    y: radius + Math.random() * (canvas.height - radius * 2),
    vx: Math.random() < 0.5 ? -1 : 1,
    vy: Math.random() < 0.5 ? -1 : 1,
    radius: radius,
    type: type,
    wiggle: Math.random() * Math.PI * 2
  });
}

function drawBackground() {
  ctx.fillStyle = "#86c96d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#68ad56";

  for (let x = 20; x < canvas.width; x += 60) {
    for (let y = 20; y < canvas.height; y += 60) {
      ctx.fillRect(x, y, 3, 12);
      ctx.fillRect(x + 5, y + 4, 3, 8);
    }
  }

  ctx.fillStyle = "#d6c28b";
  ctx.fillRect(0, canvas.height - 65, canvas.width, 65);
}

function drawPokemon(p) {
  ctx.save();

  ctx.translate(p.x, p.y);

  const bounce = Math.sin(p.wiggle) * 3;

  ctx.translate(0, bounce);

  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(0, 27, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = p.type.color;

  ctx.beginPath();
  ctx.moveTo(-16, -13);
  ctx.lineTo(-20, -35);
  ctx.lineTo(-4, -20);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(16, -13);
  ctx.lineTo(20, -35);
  ctx.lineTo(4, -20);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#222";

  ctx.beginPath();
  ctx.arc(-8, -4, 3, 0, Math.PI * 2);
  ctx.arc(8, -4, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff7777";

  ctx.beginPath();
  ctx.arc(-14, 7, 4, 0, Math.PI * 2);
  ctx.arc(14, 7, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#222";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(0, 4, 5, 0, Math.PI);
  ctx.stroke();

  ctx.restore();
}

function updatePokemon(delta) {
  for (const p of pokemon) {
    const movement = settings.pokemonSpeed * delta;

    p.x += p.vx * movement;
    p.y += p.vy * movement;

    p.wiggle += 0.08 * delta;

    if (p.x < p.radius || p.x > canvas.width - p.radius) {
      p.vx *= -1;
      p.x = Math.max(p.radius, Math.min(canvas.width - p.radius, p.x));
    }

    if (p.y < p.radius || p.y > canvas.height - p.radius) {
      p.vy *= -1;
      p.y = Math.max(p.radius, Math.min(canvas.height - p.radius, p.y));
    }
  }
}

function throwBall(x, y) {
  if (!running || paused || balls <= 0) {
    return;
  }

  balls--;

  const startX = canvas.width / 2;
  const startY = canvas.height - 30;

  const dx = x - startX;
  const dy = y - startY;

  const distance = Math.hypot(dx, dy) || 1;

  pokeballs.push({
    x: startX,
    y: startY,
    vx: dx / distance,
    vy: dy / distance,
    targetX: x,
    targetY: y,
    radius: settings.ballSize,
    speed: settings.ballSpeed,
    traveled: 0,
    maxDistance: distance
  });

  updateStats();
}

function drawBall(ball) {
  ctx.save();

  ctx.translate(ball.x, ball.y);

  ctx.fillStyle = "#e63946";

  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI);
  ctx.fill();

  ctx.strokeStyle = "#222";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-ball.radius, 0);
  ctx.lineTo(ball.radius, 0);
  ctx.stroke();

  ctx.fillStyle = "white";

  ctx.beginPath();
  ctx.arc(0, 0, ball.radius * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.stroke();

  ctx.restore();
}

function attemptCatch(p) {
  let multiplier = 1;

  if (settings.difficulty === "easy") {
    multiplier = 1.3;
  }

  if (settings.difficulty === "hard") {
    multiplier = 0.6;
  }

  const probability = Math.min(1, p.type.catchRate * multiplier);

  if (Math.random() < probability) {
    score += p.type.points;
    caught++;

    createParticles(p.x, p.y, p.type.color);

    showMessage(
      `Caught a ${p.type.name} Pokémon! +${p.type.points} points!`
    );

    return true;
  }

  showMessage(`${p.type.name} Pokémon escaped!`);

  return false;
}

function updateBalls(delta) {
  for (let i = pokeballs.length - 1; i >= 0; i--) {
    const ball = pokeballs[i];

    const step = Math.min(
      ball.speed * delta,
      ball.maxDistance - ball.traveled
    );

    ball.x += ball.vx * step;
    ball.y += ball.vy * step;
    ball.traveled += step;

    let hit = false;

    for (let j = pokemon.length - 1; j >= 0; j--) {
      const p = pokemon[j];

      const distance = Math.hypot(
        ball.x - p.x,
        ball.y - p.y
      );

      if (distance < ball.radius + p.radius) {
        const success = attemptCatch(p);

        if (success) {
          pokemon.splice(j, 1);
        }

        hit = true;
        break;
      }
    }

    if (hit || ball.traveled >= ball.maxDistance) {
      pokeballs.splice(i, 1);
    }
  }

  updateStats();
}

function createParticles(x, y, color) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30,
      color: color
    });
  }
}

function updateParticles(delta) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.life -= delta;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// Draw particles
function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 30);
    ctx.fillStyle = p.color;

    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function gameLoop(timestamp) {
  const delta = Math.min((timestamp - lastTime) / 16.67, 3) || 1;

  lastTime = timestamp;

  if (running && !paused) {
    spawnTimer += delta;

    const spawnInterval = 120 / settings.spawnRate;

    if (spawnTimer >= spawnInterval) {
      createPokemon();
      spawnTimer = 0;
    }

    updatePokemon(delta);
    updateBalls(delta);
    updateParticles(delta);

    if (balls <= 0 && pokeballs.length === 0) {
      running = false;
      showMessage(`Game Over! Final score: ${score}`);
    }
  }

  drawBackground();

  pokemon.forEach(drawPokemon);
  pokeballs.forEach(drawBall);
  drawParticles();

  requestAnimationFrame(gameLoop);
}

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();

  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;

  throwBall(x, y);
});

function setupSlider(id) {
  const slider = document.getElementById(id);
  const display = document.getElementById(id + "Value");

  slider.addEventListener("input", () => {
    settings[id] = Number(slider.value);
    display.textContent = slider.value;

    if (id === "maxPokemon") {
      pokemon.length = Math.min(pokemon.length, settings.maxPokemon);
    }
  });
}

[
  "ballSpeed",
  "pokemonSpeed",
  "spawnRate",
  "ballSize",
  "maxPokemon"
].forEach(setupSlider);

document.getElementById("difficulty").addEventListener("change", (event) => {
  settings.difficulty = event.target.value;
});

document.getElementById("startBtn").addEventListener("click", () => {
  if (running) {
    return;
  }

  if (balls <= 0) {
    showMessage("Click Restart to play again!");
    return;
  }

  running = true;
  paused = false;
  lastTime = performance.now();

  showMessage("Adventure started! Click to throw Pokéballs!");

  if (pokemon.length === 0) {
    createPokemon();
    createPokemon();
    createPokemon();
  }
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  if (!running) {
    return;
  }

  paused = !paused;

  document.getElementById("pauseBtn").textContent =
    paused ? "Resume" : "Pause";

  showMessage(paused ? "Game paused!" : "Game resumed!");
});

document.getElementById("resetBtn").addEventListener("click", () => {
  pokemon = [];
  pokeballs = [];
  particles = [];

  score = 0;
  balls = 30;
  caught = 0;

  running = false;
  paused = false;
  spawnTimer = 0;

  document.getElementById("pauseBtn").textContent = "Pause";

  updateStats();

  showMessage("Game reset! Press Start Game!");
});

updateStats();

requestAnimationFrame(gameLoop);