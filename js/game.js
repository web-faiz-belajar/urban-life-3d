
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 100);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    200
);

camera.position.set(0, 2, 8);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

document.body.innerHTML = "";
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

// Cahaya
scene.add(new THREE.HemisphereLight(0xffffff, 0x536078, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(10, 20, 10);
scene.add(sunlight);

// Tanah
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x477c42 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
scene.add(ground);

// Jalan kota
const road = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 200),
    new THREE.MeshStandardMaterial({ color: 0x343943 })
);
road.rotation.x = -Math.PI / 2;
road.position.y = -0.05;
scene.add(road);

// Garis tengah jalan
for (let z = -90; z <= 90; z += 10) {
    const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.03, 4),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    line.position.set(0, 0.02, z);
    scene.add(line);
}

// Membuat gedung sederhana
function createBuilding(x, z, width, height, color) {
    const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, width),
        new THREE.MeshStandardMaterial({ color })
    );

    building.position.set(x, height / 2, z);
    scene.add(building);
}

for (let z = -40; z <= 40; z += 15) {
    createBuilding(-12, z, 7, 5 + Math.random() * 10, 0xd6d3d1);
    createBuilding(12, z, 7, 5 + Math.random() * 10, 0xc4b5a5);
}

// Pemain sederhana
const player = new THREE.Group();

const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.4, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x2563eb })
);
body.position.y = 0.8;
player.add(body);
scene.add(player);

camera.position.set(0, 3, 7);
camera.lookAt(player.position);

// Kontrol gerakan sederhana dengan keyboard
const keys = {};

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

function animate() {
    requestAnimationFrame(animate);

    if (keys["w"] || keys["arrowup"]) player.position.z -= 0.1;
    if (keys["s"] || keys["arrowdown"]) player.position.z += 0.1;
    if (keys["a"] || keys["arrowleft"]) player.position.x -= 0.1;
    if (keys["d"] || keys["arrowright"]) player.position.x += 0.1;

    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 7;
    camera.lookAt(player.position.x, player.position.y, player.position.z);

    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
