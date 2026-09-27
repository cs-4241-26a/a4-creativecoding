import * as THREE from "/node_modules/three/build/three.module.js";

import { AudioManager } from './audio.js';

let width = window.innerWidth;
let height = window.innerHeight;

let mesh1Scale, mesh2Scale, mesh3Scale = 1;


const displayScene = new THREE.Scene();
displayScene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
    75, // changed so the sphere is smaller
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.z = 5;

const audioManager = new AudioManager(camera);

window.onresize = (e) => {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};

const uniforms = {
    time: { value: 0.0 },
    bass: { value: 0.0 },
    mids: { value: 0.0 },
    highs: { value: 0.0 },
};

// the vertex shader is to change the height and depth of vertexs and the fragmentshader originally was supposed to change the
// color and have cool animations but ran out of time and now they are unused
const mat1 = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
        uniform float time;
        uniform float bass;

        varying float vWave;
        
        void main() {
            vec3 pos = position;
            vec3 orig = position;
            
            float scale = 0.05 + bass * 0.2;
        
            pos.x += sin(pos.y * 6.0 + time) * scale;
            pos.y += sin(pos.z * 6.0 + time) * scale;
            pos.z += sin(pos.x * 6.0 + time) * scale;

            vWave = length(pos - orig);
        
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        void main() {
            gl_FragColor = vec4(
                0.6,
                1.0,
                0.6,
                1.0
            );
        }
    `,
    wireframe: true,
});
const mat2 = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
        uniform float time;
        uniform float mids;
        
        void main() {
            vec3 pos = position;
            vec3 orig = position;
            
            float scale = 0.05 + mids * 0.2;
        
            pos.x += sin(pos.y * 6.0 + time) * scale;
            pos.y += sin(pos.z * 6.0 + time) * scale;
            pos.z += sin(pos.x * 6.0 + time) * scale;
        
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        void main() {
            gl_FragColor = vec4(
                0.4,
                0.8,
                0.6,
                1.0
            );
        }
    `,
    wireframe: true,
});
const mat3 = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
        uniform float time;
        uniform float highs;
        
        void main() {
            vec3 pos = position;
            vec3 orig = position;
            
            float scale = 0.05 + highs * 0.2;
        
            pos.x += sin(pos.y * 10.0 + time) * scale;
            pos.y += sin(pos.z * 10.0 + time) * scale;
            pos.z += sin(pos.x * 10.0 + time) * scale;
        
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        void main() {
            gl_FragColor = vec4(
                0.2,
                0.5,
                0.6,
                1.0
            );
        }
    `,
    wireframe: true,
});


// creating a sphere and not using the base sphere because I do not like the connection at the top and it messes with sine
const geo = new THREE.IcosahedronGeometry(1, 64);
// creating a mesh and using different shades that change the topology of the sphere
const mesh1 = new THREE.Mesh(geo, mat1);
const mesh2 = new THREE.Mesh(geo, mat2);
const mesh3 = new THREE.Mesh(geo, mat3);
// allowing for size change later
mesh1.scale.setScalar(1.9);
mesh2.scale.setScalar(2.0);
mesh3.scale.setScalar(2.1);
// adding all of the spheres to the display
displayScene.add(mesh1);
displayScene.add(mesh2);
displayScene.add(mesh3);

// instantiating renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
// adding the canvas to the document body
document.body.appendChild(renderer.domElement);

function animate() {
    // spinning the spheres in different directions cause it looks cool
    mesh3.rotation.y += -0.005;
    mesh3.rotation.x += 0.005;
    mesh3.rotation.z += 0.005;
    mesh2.rotation.y += 0.005;
    mesh2.rotation.x += -0.005;
    mesh2.rotation.z += 0.005;
    mesh1.rotation.y += 0.005;
    mesh1.rotation.x += 0.005;
    mesh1.rotation.z += -0.005;

    //
    const bands = audioManager.getAllBands();

    uniforms.bass.value  = bands.bass;
    uniforms.mids.value  = bands.mids;
    uniforms.highs.value = bands.highs;
    mesh1.scale.setScalar(1.9 + bands.bass  * 0.5 * mesh1Scale);
    mesh2.scale.setScalar(2.0 + bands.mids  * 0.5 * mesh2Scale);
    mesh3.scale.setScalar(2.1 + bands.highs * 0.5 * mesh3Scale);

    uniforms.time.value = performance.now() * 0.002;

    renderer.render(displayScene, camera);
    requestAnimationFrame(animate);
}

animate();

document.addEventListener('click',audioManager.resumePlaying);
document.addEventListener('keydown',audioManager.resumePlaying);
document.addEventListener('touchstart',audioManager.resumePlaying);
// preventing default to catch the file
window.addEventListener('dragover', (e) => {
    e.preventDefault();
});
// grabbing the file the user drops
window.addEventListener('drop', (e) => {
    e.preventDefault();

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length === 0) return;

    const actualMusicFileMaybeIfNotDumb = droppedFiles[0];

    // Handing off to my music manager
    audioManager.load(actualMusicFileMaybeIfNotDumb);
});

window.onload = function () {
    const volume = document.getElementById('volume-slider').value;
    document.getElementById('value').textContent = volume;
    audioManager.changeSoundVolume(volume)
    const m1 = document.getElementById('mesh1-slider').value;
    document.getElementById('mesh1-value').textContent = m1;
    mesh1Scale = m1
    const m2 = document.getElementById('mesh2-slider').value;
    document.getElementById('mesh2-value').textContent = m2;
    mesh2Scale = m2
    const m3 = document.getElementById('mesh3-slider').value;
    document.getElementById('mesh3-value').textContent = m3;
    mesh3Scale = m3
}

document.getElementById('volume-slider').addEventListener('input', e => {
    const volume = document.getElementById('volume-slider').value;
    document.getElementById('value').textContent = volume;
    audioManager.changeSoundVolume(volume)
})

document.getElementById('mesh1-slider').addEventListener('input', e => {
    const m1 = document.getElementById('mesh1-slider').value;
    document.getElementById('mesh1-value').textContent = m1;
    mesh1Scale = m1;
})
document.getElementById('mesh2-slider').addEventListener('input', e => {
    const m2 = document.getElementById('mesh2-slider').value;
    document.getElementById('mesh2-value').textContent = m2;
    mesh2Scale = m2;
})
document.getElementById('mesh3-slider').addEventListener('input', e => {
    const m3 = document.getElementById('mesh3-slider').value;
    document.getElementById('mesh3-value').textContent = m3;
    mesh3Scale = m3;
})