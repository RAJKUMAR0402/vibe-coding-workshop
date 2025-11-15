// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Skybox
const skyboxGeometry = new THREE.SphereGeometry(500, 60, 40);
skyboxGeometry.scale(-1, 1, 1);
const skyboxMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb
});
const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
scene.add(skybox);

// Clouds
function createCloud() {
    const cloud = new THREE.Group();

    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 5; i++) {
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = Math.random() * 20 - 10;
        sphere.position.y = Math.random() * 10 - 5;
        sphere.position.z = Math.random() * 10 - 5;
        sphere.scale.set(Math.random() * 1.5 + 0.5, Math.random() * 1.5 + 0.5, Math.random() * 1.5 + 0.5);
        cloud.add(sphere);
    }
    return cloud;
}

for (let i = 0; i < 20; i++) {
    const cloud = createCloud();
    cloud.position.x = Math.random() * 400 - 200;
    cloud.position.y = Math.random() * 50 + 20;
    cloud.position.z = Math.random() * -400 - 50;
    scene.add(cloud);
}

// Jet Model
const jet = new THREE.Group();

const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 32);
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
body.rotation.z = Math.PI / 2;
jet.add(body);

const wingMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
const wingGeometry = new THREE.BoxGeometry(6, 0.2, 1.5);
const wing = new THREE.Mesh(wingGeometry, wingMaterial);
jet.add(wing);

const tailGeometry = new THREE.BoxGeometry(0.2, 1, 1);
const tail = new THREE.Mesh(tailGeometry, wingMaterial);
tail.position.set(-2, 0.5, 0);
jet.add(tail);

const cockpitGeometry = new THREE.SphereGeometry(0.4, 32, 32);
const cockpitMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
cockpit.position.set(1, 0.5, 0);
jet.add(cockpit);

scene.add(jet);

// Particle Trail
const particleCount = 200;
const particles = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleVelocities = [];

for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    particlePositions[i3] = jet.position.x;
    particlePositions[i3 + 1] = jet.position.y;
    particlePositions[i3 + 2] = jet.position.z;

    particleVelocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
    ));
}

particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particleMaterial = new THREE.PointsMaterial({
    color: 0xffa500,
    size: 0.1,
    transparent: true,
    opacity: 0.7
});

const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

// Flight Controls
const keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

let speed = 0.1;
const normalSpeed = 0.1;
const boostSpeed = 0.3;

// Camera follow logic
const cameraOffset = new THREE.Vector3(0, 3, 12);

// Audio
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load('https://opengameart.org/sites/default/files/audio_preview/Another%20space%20background%20track.ogg', function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();
});

// HUD Elements
const speedElement = document.getElementById('speed');
const altitudeElement = document.getElementById('altitude');

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Speed boost
    if (keys['Space']) {
        speed = boostSpeed;
    } else {
        speed = normalSpeed;
    }

    // Pitch
    if (keys['KeyS'] || keys['ArrowDown']) {
        jet.rotation.x += 0.01;
    } else if (keys['KeyW'] || keys['ArrowUp']) {
        jet.rotation.x -= 0.01;
    }

    // Roll
    if (keys['KeyA'] || keys['ArrowLeft']) {
        jet.rotation.z += 0.01;
    } else if (keys['KeyD'] || keys['ArrowRight']) {
        jet.rotation.z -= 0.01;
    }

    // Yaw
    if (keys['KeyQ']) {
        jet.rotation.y += 0.01;
    } else if (keys['KeyE']) {
        jet.rotation.y -= 0.01;
    }

    jet.position.z -= Math.cos(jet.rotation.y) * speed;
    jet.position.x -= Math.sin(jet.rotation.y) * speed;
    jet.position.y += Math.sin(jet.rotation.x) * speed;

    // Update camera position
    const offset = cameraOffset.clone().applyQuaternion(jet.quaternion);
    const desiredCameraPosition = jet.position.clone().add(offset);
    camera.position.lerp(desiredCameraPosition, 0.1);
    camera.lookAt(jet.position);

    // Update particle system
    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] += particleVelocities[i].x;
        positions[i3 + 1] += particleVelocities[i].y;
        positions[i3 + 2] += particleVelocities[i].z;

        if (positions[i3] > 200 || positions[i3] < -200 || positions[i3 + 1] > 200 || positions[i3 + 1] < -200 || positions[i3 + 2] > 200 || positions[i3 + 2] < -200) {
            positions[i3] = jet.position.x - (Math.sin(jet.rotation.y) * 2);
            positions[i3 + 1] = jet.position.y;
            positions[i3 + 2] = jet.position.z - (Math.cos(jet.rotation.y) * 2);
        }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;

    // Update HUD
    speedElement.textContent = (speed * 100).toFixed(0);
    altitudeElement.textContent = jet.position.y.toFixed(0);

    renderer.render(scene, camera);
}
animate();
