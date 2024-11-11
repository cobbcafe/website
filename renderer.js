//
//	==============================================================
//	WebGL rendering
//  ==============================================================
//

// Initialize variables
let canvas, gl, scene, renderer;
let keys = { w: false, a: false, s: false, d: false };
let boardObject = new THREE.Object3D();
let whitePieces = new THREE.Object3D();
let blackPieces = new THREE.Object3D();
let invisibleSquares = new THREE.Object3D();
let loadedObject;

// Function to initialize the WebGL context and set up shaders
function initWebGL() {
	// Create canvas element programmatically
	canvas = document.createElement('canvas');
	document.body.appendChild(canvas);
	resizeCanvas();
	// Set the background color to black
	canvas.style.backgroundColor = "rgba(0, 0, 0, 1)";

	// Get the WebGL rendering context
	gl = canvas.getContext('webgl');
	if (!gl) {
		console.log('WebGL not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}
	if (!gl) {
		alert('Sorry, you cannot view Cobb Cafe. Your browser does not support WebGL.');
		return;
	}

	gl.enable(gl.DEPTH_TEST);

	// Load camera, scene, etc
	initializeScene();
	// Load MTL and OBJ for cobb
	loadCobbMtl("cobb");

	// Add event listener to resize the canvas when the window is resized
	window.addEventListener('resize', resizeCanvas);
}

// Resize the canvas to fill the screen
function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	if (renderer) {
		renderer.setSize(window.innerWidth, window.innerHeight);
	}
}

// Get the reticle canvas
const reticleCanvas = document.getElementById('reticleCanvas');
const reticleContext = reticleCanvas.getContext('2d');

// Set the reticle canvas size to match the Three.js canvas
function resizeReticleCanvas() {
	reticleCanvas.width = canvas.width;
	reticleCanvas.height = canvas.height;
}

// Call this when the window resizes
window.addEventListener('resize', resizeReticleCanvas);

// Draw a simple crosshair
function drawReticle() {
	const centerX = reticleCanvas.width / 2;
	const centerY = reticleCanvas.height / 2;
	const length = 5;

	reticleContext.clearRect(0, 0, reticleCanvas.width, reticleCanvas.height); // Clear previous reticle

	// Draw horizontal line
	reticleContext.beginPath();
	reticleContext.moveTo(centerX - length, centerY);
	reticleContext.lineTo(centerX + length, centerY);
	reticleContext.strokeStyle = 'white';
	reticleContext.lineWidth = 2;
	reticleContext.stroke();

	// Draw vertical line
	reticleContext.beginPath();
	reticleContext.moveTo(centerX, centerY - length);
	reticleContext.lineTo(centerX, centerY + length);
	reticleContext.stroke();
}

// Loads camera, scene, renderer, lighting
function initializeScene() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.rotation.order = "YXZ";

	renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);

	// Add ambient and directional light
	const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
	scene.add(ambientLight);
	const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
	directionalLight.position.set(5, 10, 7.5).normalize();
	scene.add(directionalLight);

	// Set the initial camera position
	camera.position.z = 0;
}

// Loading shaders, materials, and models
function loadCobbMtl(name) {
	const objLoader = new THREE.OBJLoader();
	const mtlLoader = new THREE.MTLLoader();

	mtlLoader.load(`obj/${name}.mtl`, function (materials) {
		materials.preload();
		objLoader.setMaterials(materials);

		objLoader.load(`obj/${name}.obj`, function (object) {
			// Create a parent object to serve as the new pivot
			parentObject = new THREE.Object3D();
			scene.add(parentObject);

			// Add the loaded object to the parent
			parentObject.add(object);

			// Position the object relative to the parent,
			// center the object based on its bounding box
			const bbox = new THREE.Box3().setFromObject(object);
			const center = bbox.getCenter(new THREE.Vector3());
			object.position.set(0, 0, -center.z / 2);
			// Changing the (x [distance side-to-side], y [height], z [distance in front of camera]) initial position
			// of the scene
			object.position.set(0, -1, -5);
			// Scaling (make sure x, y, z all match or things will be distorted)
			object.scale.set(1, 1, 1);
			boardObject.add(object);
		});
		scene.add(boardObject);
	});
}

const up = new THREE.Vector3(0, 1, 0);
var cameraDirection = new THREE.Vector3();
var cameraSideways = new THREE.Vector3();

// Function to update the camera based on user input
function updateCamera(deltaTime) {
	const speed = 20 * deltaTime; // Adjust speed as necessary

	// Camera direction and sideways direction (perpendicular to up and
	// forward)
	camera.getWorldDirection(cameraDirection);
	cameraSideways.crossVectors(cameraDirection, up);
	// Normalize so that movement is not extremely slow if looking down
	cameraDirection.y = 0;
	cameraSideways.y = 0;
	cameraDirection.normalize();
	cameraSideways.normalize();

	// Move the camera based on key inputs
	if (keys.w) { // Move forward
		camera.position.x += speed * cameraDirection.x;
		camera.position.z += speed * cameraDirection.z;
	}
	if (keys.s) { // Move backward
		camera.position.x -= speed * cameraDirection.x;
		camera.position.z -= speed * cameraDirection.z;
	}
	if (keys.a) { // Move left
		camera.position.x -= speed * cameraSideways.x;
		camera.position.z -= speed * cameraSideways.z;
	}
	if (keys.d) { // Move right
		camera.position.x += speed * cameraSideways.x;
		camera.position.z += speed * cameraSideways.z;
	}

	// Apply camera rotation from mouse movement
	const pitch = camera.rotation.x;
	const yaw = camera.rotation.y;

	// Clamp pitch between -89 and 89 degrees (to prevent camera flipping)
	camera.rotation.x = Math.max(Math.min(pitch, Math.PI / 2), -Math.PI / 2);
	camera.rotation.y = yaw; // Use directly for yaw

	// Create a basic view matrix based on camera position and rotation
	const viewMatrix = new THREE.Matrix4(); // Create a new instance of Matrix4
	viewMatrix.makeRotationX(camera.rotation.x); // Rotate around X
	viewMatrix.makeRotationY(camera.rotation.y); // Rotate around Y
	viewMatrix.setPosition(camera.position); // Set camera position
}

// Mouse movement handler to adjust camera rotation
function handleMouseMove(event) {
	const sensitivity = 0.002;
	// Up-down camera movement
	camera.rotation.x -= event.movementY * sensitivity;
	// Left-right camera rotation
	camera.rotation.y -= event.movementX * sensitivity;

	// Clamp pitch between -89 and 89 degrees (to prevent camera flipping)
	camera.rotation.x = Math.max(Math.min(camera.rotation.x, Math.PI / 2), -Math.PI / 2);
}

// Keyboard input handlers
function handleKeyDown(event) {
	switch (event.key) {
		case 'w': keys.w = true; break;
		case 'a': keys.a = true; break;
		case 's': keys.s = true; break;
		case 'd': keys.d = true; break;
	}
}

function handleKeyUp(event) {
	switch (event.key) {
		case 'w': keys.w = false; break;
		case 'a': keys.a = false; break;
		case 's': keys.s = false; break;
		case 'd': keys.d = false; break;
	}
}

// Hide the mouse cursor and lock the pointer
function hideMouseCursor() {
	canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
	canvas.requestPointerLock();
}

//
//	==============================================================
//	Main loops
//  ==============================================================
//

let messaged = 0;
// Main render loop
function render() {
	drawReticle();
	// Clear the WebGL context (color and depth buffers)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Calculate time step (deltaTime) for smooth movement
	const deltaTime = 0.016; // Approx 60 FPS

	// Update camera based on input
	updateCamera(deltaTime);

	// Render the Three.js scene
	renderer.render(scene, camera);

	// Request the next frame
	requestAnimationFrame(render);
}

// Main initialization
function main() {
	initWebGL();
	resizeReticleCanvas();

	// Add event listeners
	canvas.addEventListener('click', hideMouseCursor);
	window.addEventListener('mousemove', handleMouseMove);
	window.addEventListener('keydown', handleKeyDown);
	window.addEventListener('keyup', handleKeyUp);
	window.addEventListener('resize', resizeReticleCanvas);

	// Start the render loop
	requestAnimationFrame(render);
}

window.onload = main;