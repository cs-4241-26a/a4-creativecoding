## Neon Drift

Local demo: http://localhost:3000

Neon Drift is a browser-based interactive art scene that combines the browser's 2D drawing capabilities with an SVG overlay to create a reactive particle field. The goal of the app is to let the user manipulate motion, density, hue, and trail behavior in real time using a set of sliders and mouse-driven interaction. This project uses the Canvas API for the animated particle rendering and SVG for the layered geometric rings that give the scene a sharper, more polished visual structure.

### What the app does
- A full Express server serves the interactive client.
- The main experience is rendered with the [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API).
- An SVG overlay adds rings and subtle vector effects that react to the same color and movement changes.
- The interface exposes five adjustable parameters:
  - Particle count
  - Orbit speed
  - Swirl force
  - Hue shift
  - Trail fade
- On initial load, a help panel describes how to use the interface.
- The user can move the pointer across the screen to gently steer the particles and create a more dynamic visual field.

### Challenges faced
The main challenge was balancing visual complexity with performance so the app stayed smooth while still feeling alive. Using the Canvas layer for thousands of moving particles kept the animation efficient, and the SVG overlay was used only for a lightweight geometric accent rather than heavy computation. I also had to make sure the controls updated the scene consistently without recreating too much state on every input event.

### Instructions
1. Open the app in a browser at http://localhost:3000.
2. Move the pointer over the visualization to steer the particles.
3. Adjust the sliders to change particle count, motion, swirl, color, and fade.
4. Use the instructions button to hide or show the on-screen help panel.

### Run locally
```bash
npm install
npm start
```

