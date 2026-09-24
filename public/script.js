const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const svg = document.getElementById('hud');
const docs = document.getElementById('docs');
const toggleDocsBtn = document.getElementById('toggleDocs');

const controls = {
  particleCount: document.getElementById('particleCount'),
  speed: document.getElementById('speed'),
  swirl: document.getElementById('swirl'),
  hue: document.getElementById('hue'),
  fade: document.getElementById('fade')
};

const valueLabels = {
  particleCount: document.getElementById('particleCountValue'),
  speed: document.getElementById('speedValue'),
  swirl: document.getElementById('swirlValue'),
  hue: document.getElementById('hueValue'),
  fade: document.getElementById('fadeValue')
};

const state = {
  particles: [],
  pointer: { x: 0, y: 0, active: false },
  width: 0,
  height: 0,
  colorBase: 180
};

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  state.width = rect.width;
  state.height = rect.height;

  canvas.width = Math.max(1, rect.width * dpr);
  canvas.height = Math.max(1, rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  svg.setAttribute('viewBox', `0 0 ${state.width} ${state.height}`);
  initializeParticles();
}

function initializeParticles() {
  const count = Number(controls.particleCount.value);
  state.particles = [];

  for (let i = 0; i < count; i++) {
    state.particles.push({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      radius: Math.random() * 2.8 + 1.2,
      angle: Math.random() * Math.PI * 2,
      orbit: Math.random() * 170 + 40,
      speed: Math.random() * 1.3 + 0.6,
      hue: Math.random() * 120 + state.colorBase
    });
  }
}

function updateOutputLabels() {
  valueLabels.particleCount.textContent = controls.particleCount.value;
  valueLabels.speed.textContent = `${Number(controls.speed.value).toFixed(1)}x`;
  valueLabels.swirl.textContent = Number(controls.swirl.value).toFixed(1);
  valueLabels.hue.textContent = `${controls.hue.value}°`;
  valueLabels.fade.textContent = Number(controls.fade.value).toFixed(2);
}

function syncControls() {
  updateOutputLabels();
  state.colorBase = Number(controls.hue.value);
  initializeParticles();
}

function addSvgRings() {
  const rings = [];
  const ringCount = 6;

  for (let i = 0; i < ringCount; i++) {
    const radius = 70 + i * 52;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', state.width / 2);
    circle.setAttribute('cy', state.height / 2);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', `hsla(${(state.colorBase + i * 26) % 360}, 90%, 70%, ${0.08 + i * 0.06})`);
    circle.setAttribute('stroke-width', '1.1');
    circle.setAttribute('vector-effect', 'non-scaling-stroke');
    rings.push(circle);
  }

  svg.innerHTML = '';
  rings.forEach((ring) => svg.appendChild(ring));
}

function updateSvgOverlay() {
  const rings = [...svg.children];
  const baseX = state.width / 2;
  const baseY = state.height / 2;

  rings.forEach((ring, index) => {
    const pulse = 1 + Math.sin((performance.now() * 0.0015) + index) * 0.08;
    const radius = 70 + index * 52 + (Math.sin(index + performance.now() * 0.001) + 1) * 18;
    ring.setAttribute('cx', baseX);
    ring.setAttribute('cy', baseY);
    ring.setAttribute('r', radius * pulse);
    ring.setAttribute('stroke', `hsla(${(state.colorBase + index * 26) % 360}, 90%, 72%, ${0.09 + index * 0.06})`);
  });
}

function render() {
  const fade = Number(controls.fade.value);
  const speedFactor = Number(controls.speed.value);
  const swirlStrength = Number(controls.swirl.value);
  ctx.fillStyle = `rgba(4, 8, 16, ${fade})`;
  ctx.fillRect(0, 0, state.width, state.height);

  const pX = state.pointer.x || state.width / 2;
  const pY = state.pointer.y || state.height / 2;

  state.particles.forEach((particle, index) => {
    const angle = particle.angle + (index * 0.005) * speedFactor;
    const orbitX = Math.cos(angle) * particle.orbit;
    const orbitY = Math.sin(angle) * particle.orbit;

    particle.x += Math.cos(angle + 1.4) * 0.8 * speedFactor;
    particle.y += Math.sin(angle + 1.2) * 0.8 * speedFactor;

    const dx = pX - particle.x;
    const dy = pY - particle.y;
    const distance = Math.hypot(dx, dy) || 1;

    if (state.pointer.active) {
      const force = Math.max(0, 120 - distance) / 120;
      particle.x -= (dx / distance) * force * 2.5 * swirlStrength;
      particle.y -= (dy / distance) * force * 2.5 * swirlStrength;
    }

    if (particle.x < 0 || particle.x > state.width) particle.x = Math.random() * state.width;
    if (particle.y < 0 || particle.y > state.height) particle.y = Math.random() * state.height;

    const px = particle.x + orbitX * 0.18;
    const py = particle.y + orbitY * 0.18;
    const glow = 1 + Math.sin((performance.now() * 0.002) + index) * 0.8;

    ctx.beginPath();
    ctx.fillStyle = `hsla(${(particle.hue + state.colorBase) % 360}, 100%, 70%, ${0.7 * glow})`;
    ctx.arc(px, py, particle.radius * glow, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = `hsla(${(particle.hue + 30) % 360}, 100%, 70%, 0.16)`;
    ctx.moveTo(px, py);
    ctx.lineTo(pX, pY);
    ctx.stroke();
  });

  updateSvgOverlay();
  requestAnimationFrame(render);
}

Object.values(controls).forEach((control) => {
  control.addEventListener('input', () => {
    syncControls();
  });
});

window.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect();
  state.pointer.x = event.clientX - rect.left;
  state.pointer.y = event.clientY - rect.top;
  state.pointer.active = true;
});

window.addEventListener('pointerleave', () => {
  state.pointer.active = false;
});

toggleDocsBtn.addEventListener('click', () => {
  docs.classList.toggle('hidden');
  toggleDocsBtn.textContent = docs.classList.contains('hidden') ? 'Show instructions' : 'Hide instructions';
});

window.addEventListener('resize', resizeCanvas);

resizeCanvas();
addSvgRings();
syncControls();
requestAnimationFrame(render);
