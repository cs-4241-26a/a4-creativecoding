import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x101624 );

const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, .1, 100 );
camera.position.set( 0, 1.2, 8 );
camera.lookAt( 0, 1.2, 0 );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
renderer.setClearColor( 0x101624, 1 );
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.inset = '0';
renderer.domElement.style.zIndex = '0';
document.body.appendChild( renderer.domElement );

scene.add( new THREE.HemisphereLight( 0xd8f6ff, 0x172033, 2.5 ) );
const keyLight = new THREE.DirectionalLight( 0xffffff, 3 );
keyLight.position.set( -4, 7, 6 );
scene.add( keyLight );

const display = new THREE.Group();
display.position.y = 1.35;
scene.add( display );

const materials = [
  new THREE.MeshStandardMaterial( { color: 0x72e1c1, roughness: .3, metalness: .15 } ),
  new THREE.MeshStandardMaterial( { color: 0xffb86b, roughness: .3, metalness: .15 } ),
  new THREE.MeshStandardMaterial( { color: 0x9da7ff, roughness: .3, metalness: .15 } ),
];
const shapes = {
  cube: () => new THREE.BoxGeometry( 2.3, 2.3, 2.3 ),
  tetrahedron: () => new THREE.TetrahedronGeometry( 1.8 ),
  octahedron: () => new THREE.OctahedronGeometry( 1.8 ),
  sphere: () => new THREE.SphereGeometry( 1.7, 32, 20 ),
  cylinder: () => new THREE.CylinderGeometry( 1.45, 1.45, 2.6, 32 ),
  torus: () => new THREE.TorusGeometry( 1.25, .45, 18, 40 ),
  custom: () => new THREE.TorusGeometry( 1.25, .45, 18, 40 ),
};
const customMaterial = new THREE.MeshStandardMaterial( { color: 0xffe082, roughness: .3, metalness: .15 } );
let selectedShape = 'cube';
let shapeMesh;
let rotation = new THREE.Vector3();
const angularVelocity = new THREE.Vector3();
let rotationCount = 0;
const targetRotation = new THREE.Vector3();
let score = 0;
let level = 1;
let streak = 0;
let roundTime = 15;
let roundComplete = false;
let lastTime = 0;
let roundTimeout;
let flashUntil = 0;
const heldKeys = {};
const keyControls = {
  KeyW: [ 'x', -.35 ], ArrowUp: [ 'x', -.35 ],
  KeyS: [ 'x', .35 ], ArrowDown: [ 'x', .35 ],
  KeyA: [ 'y', -.35 ], ArrowLeft: [ 'y', -.35 ],
  KeyD: [ 'y', .35 ], ArrowRight: [ 'y', .35 ],
};
const status = document.querySelector( '#status' );
const rotationLabel = document.querySelector( '#rotation' );
const challengeLabel = document.querySelector( '#challenge' );
const scoreLabel = document.querySelector( '#score' );
const timerLabel = document.querySelector( '#timer' );
const levelLabel = document.querySelector( '#level' );
const streakLabel = document.querySelector( '#streak' );
const customType = document.querySelector( '#custom-type' );
const customSize = document.querySelector( '#custom-size' );
const customSecondary = document.querySelector( '#custom-secondary' );
const customSegments = document.querySelector( '#custom-segments' );
const customSizeLabel = document.querySelector( '#custom-size-label' );
const customSecondaryLabel = document.querySelector( '#custom-secondary-label' );
const customBuilder = document.querySelector( '#custom-builder' );

function createCustomGeometry( type, size, secondary, segments ) {
  if ( type === 'box' ) return new THREE.BoxGeometry( size, secondary, size );
  if ( type === 'sphere' ) return new THREE.SphereGeometry( size, segments, Math.max( 3, Math.floor( segments * .65 ) ) );
  if ( type === 'cylinder' ) return new THREE.CylinderGeometry( size, size, secondary, segments );
  if ( type === 'cone' ) return new THREE.ConeGeometry( size, secondary, segments );
  return new THREE.TorusGeometry( size, secondary, Math.max( 8, Math.floor( segments * .75 ) ), segments );
}

function updateCustomLabels() {
  const labels = {
    box: [ 'Width', 'Height' ], sphere: [ 'Radius', 'Unused' ],
    cylinder: [ 'Radius', 'Height' ], cone: [ 'Radius', 'Height' ], torus: [ 'Radius', 'Tube' ],
  };
  const [ sizeLabel, secondaryLabel ] = labels[ customType.value ];
  customSizeLabel.firstChild.textContent = `${sizeLabel} `;
  customSecondaryLabel.firstChild.textContent = `${secondaryLabel} `;
  customSecondary.disabled = customType.value === 'sphere';
}

function setShapeFlash( isFlashing ) {
  if ( !shapeMesh ) return;
  shapeMesh.material.emissive.set( isFlashing ? 0x39ff79 : 0x000000 );
  shapeMesh.material.emissiveIntensity = isFlashing ? 2.4 : 0;
}

function selectShape( shapeName ) {
  setShapeFlash( false );
  flashUntil = 0;
  if ( shapeMesh ) display.remove( shapeMesh );
  selectedShape = shapeName;
  const material = shapeName === 'custom'
    ? customMaterial
    : materials[ Object.keys( shapes ).indexOf( shapeName ) % materials.length ];
  shapeMesh = new THREE.Mesh( shapes[ shapeName ](), material );
  shapeMesh.castShadow = true;
  display.add( shapeMesh );
  rotation.set( 0, 0, 0 );
  angularVelocity.set( 0, 0, 0 );
  rotationCount = 0;
  rotationLabel.textContent = '0°';
  status.textContent = `${shapeName[ 0 ].toUpperCase() + shapeName.slice( 1 )} selected`;
  document.querySelectorAll( '[data-shape]' ).forEach( ( button ) => {
    button.classList.toggle( 'selected', button.dataset.shape === shapeName );
  } );
  customBuilder.classList.toggle( 'visible', shapeName === 'custom' );
  startRound();
}

function degrees( radians ) {
  return Math.round( THREE.MathUtils.euclideanModulo( radians, Math.PI * 2 ) * 180 / Math.PI );
}

function updateScoreboard() {
  scoreLabel.textContent = `Score ${score}`;
  timerLabel.textContent = `${Math.ceil( roundTime )}s`;
  levelLabel.textContent = `Level ${level}`;
  streakLabel.textContent = `Streak ${streak}`;
}

function startRound() {
  window.clearTimeout( roundTimeout );
  targetRotation.set(
    THREE.MathUtils.randInt( 0, 3 ) * Math.PI / 2,
    THREE.MathUtils.randInt( 0, 3 ) * Math.PI / 2,
    0,
  );
  if ( targetRotation.x === 0 && targetRotation.y === 0 ) targetRotation.x = Math.PI / 2;
  roundTime = Math.max( 7, 16 - level );
  roundComplete = false;
  challengeLabel.textContent = `Target: pitch ${degrees( targetRotation.x )}° · yaw ${degrees( targetRotation.y )}°`;
  updateScoreboard();
}

function angleDifference( first, second ) {
  return Math.abs( THREE.MathUtils.euclideanModulo( first - second + Math.PI, Math.PI * 2 ) - Math.PI );
}

function checkRound( time ) {
  if ( roundComplete ) return;
  const closeEnough = angleDifference( rotation.x, targetRotation.x ) < .22 && angleDifference( rotation.y, targetRotation.y ) < .22;
  if ( closeEnough ) {
    roundComplete = true;
    streak += 1;
    const points = 100 * level + Math.ceil( roundTime ) * 10;
    score += points;
    level = Math.max( level, 1 + Math.floor( score / 500 ) );
    status.textContent = `Perfect match! +${points} points`;
    setShapeFlash( true );
    flashUntil = time + 450;
    updateScoreboard();
    roundTimeout = window.setTimeout( startRound, 900 );
  }
}

function missRound() {
  if ( roundComplete ) return;
  roundComplete = true;
  streak = 0;
  status.textContent = 'Time up. Try the next target.';
  updateScoreboard();
  roundTimeout = window.setTimeout( startRound, 900 );
}

function rotateShape( axis, amount ) {
  angularVelocity[ axis ] += amount * .18;
  rotationCount += Math.abs( amount );
  rotationLabel.textContent = `${Math.round( rotationCount * 180 / Math.PI )}°`;
  status.textContent = `${selectedShape[ 0 ].toUpperCase() + selectedShape.slice( 1 )} rotating`;
}

function resetRotation() {
  rotation.set( 0, 0, 0 );
  angularVelocity.set( 0, 0, 0 );
  rotationCount = 0;
  rotationLabel.textContent = '0°';
  status.textContent = `${selectedShape[ 0 ].toUpperCase() + selectedShape.slice( 1 )} rotation reset`;
}

document.querySelectorAll( '[data-shape]' ).forEach( ( button ) => {
  button.addEventListener( 'click', () => selectShape( button.dataset.shape ) );
} );

customType.addEventListener( 'change', updateCustomLabels );
document.querySelector( '#new-round' ).addEventListener( 'click', startRound );
customBuilder.addEventListener( 'submit', ( event ) => {
  event.preventDefault();
  const size = Math.max( .1, Number( customSize.value ) || 1 );
  const secondary = Math.max( .1, Number( customSecondary.value ) || 1 );
  const segments = Math.min( 64, Math.max( 3, Math.floor( Number( customSegments.value ) || 16 ) ) );
  shapes.custom = () => createCustomGeometry( customType.value, size, secondary, segments );
  selectShape( 'custom' );
  status.textContent = `Custom ${customType.value} selected`;
} );
updateCustomLabels();

window.addEventListener( 'keydown', ( event ) => {
  if ( event.code === 'Space' ) {
    event.preventDefault();
    resetRotation();
    return;
  }
  if ( keyControls[ event.code ] ) {
    event.preventDefault();
    if ( !heldKeys[ event.code ] ) {
      heldKeys[ event.code ] = true;
      rotateShape( keyControls[ event.code ][ 0 ], keyControls[ event.code ][ 1 ] );
    }
  }
} );
window.addEventListener( 'keyup', ( event ) => {
  delete heldKeys[ event.code ];
} );

const pedestal = new THREE.Mesh(
  new THREE.CylinderGeometry( 2.7, 3.1, .35, 64 ),
  new THREE.MeshStandardMaterial( { color: 0x263653, roughness: .65 } ),
);
pedestal.position.y = -.3;
pedestal.receiveShadow = true;
scene.add( pedestal );

const ring = new THREE.Mesh(
  new THREE.TorusGeometry( 2.55, .035, 8, 64 ),
  new THREE.MeshBasicMaterial( { color: 0x72e1c1 } ),
);
ring.rotation.x = Math.PI / 2;
ring.position.y = -.1;
scene.add( ring );

selectShape( selectedShape );

function animate( time ) {
  const delta = lastTime === 0 ? 0 : Math.min( ( time - lastTime ) / 1000, .05 );
  lastTime = time;
  for ( const key of Object.keys( heldKeys ) ) {
    const [ axis, amount ] = keyControls[ key ];
    angularVelocity[ axis ] += amount * delta * .75;
  }
  angularVelocity.x = THREE.MathUtils.damp( angularVelocity.x, 0, 7, Math.max( delta, .016 ) );
  angularVelocity.y = THREE.MathUtils.damp( angularVelocity.y, 0, 7, Math.max( delta, .016 ) );
  rotation.x += angularVelocity.x;
  rotation.y += angularVelocity.y;
  display.rotation.x = rotation.x;
  display.rotation.y = rotation.y;
  ring.rotation.z = time / 1800;
  if ( flashUntil && time >= flashUntil ) {
    setShapeFlash( false );
    flashUntil = 0;
  }
  if ( !roundComplete ) {
    roundTime -= delta;
    if ( roundTime <= 0 ) missRound();
    checkRound( time );
    updateScoreboard();
  }
  renderer.render( scene, camera );
}

animate( 0 );
renderer.setAnimationLoop( animate );

window.addEventListener( 'resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
} );
