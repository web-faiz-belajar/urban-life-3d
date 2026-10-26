
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// ===== PENGATURAN DASAR =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 25, 120);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    200
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

// ===== PENCAHAYAAN =====
scene.add(new THREE.HemisphereLight(0xffffff, 0x52634b, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(20, 30, 10);
scene.add(sun);

// ===== TANAH =====
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x477c42 })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
scene.add(ground);

// ===== JALAN =====
const road = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 200),
    new THREE.MeshStandardMaterial({ color: 0x343943 })
);

road.rotation.x = -Math.PI / 2;
road.position.y = -0.04;
scene.add(road);

// Garis jalan
for (let z = -90; z <= 90; z += 8) {
    const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.025, 3),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );

    line.position.set(0, 0.01, z);
    scene.add(line);
}

// ===== BANGUNAN =====
function createBuilding(x, z, width, height, color) {
    const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, width),
        new THREE.MeshStandardMaterial({ color })
    );

    building.position.set(x, height / 2, z);
    scene.add(building);
}

for (let z = -50; z <= 50; z += 12) {
    createBuilding(-12, z, 7, 5 + Math.random() * 8, 0xd6d3d1);
    createBuilding(12, z, 7, 5 + Math.random() * 8, 0xc4b5a5);
}


/* ===== KARAKTER PEMAIN 3D ===== */
const player = {
    x: 0,
    z: 5,
    speed: 5
};

const character = new THREE.Group();

// Badan
const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.9, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x2563eb })
);
body.position.y = 1.05;
character.add(body);

// Kepala
const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf1c27d })
);
head.position.y = 1.7;
character.add(head);

// Kaki kiri dan kanan
const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x172554
});

const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.23, 0.65, 0.25),
    legMaterial
);
leftLeg.position.set(-0.18, 0.38, 0);
character.add(leftLeg);

const rightLeg = leftLeg.clone();
rightLeg.position.x = 0.18;
character.add(rightLeg);

// Tambahkan karakter ke dunia
scene.add(character);

let yaw = 0;
let pitch = 0;
let joystickX = 0;
let joystickY = 0;
let running = false;


/* ===== KAMERA ORANG KETIGA ===== */
camera.position.set(
    player.x,
    4,
    player.z + 7
);

camera.rotation.order = "YXZ";

// ===== JOYSTICK =====
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

let joystickPointer = null;

joystick.addEventListener("pointerdown", (event) => {
    joystickPointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    moveJoystick(event);
});

joystick.addEventListener("pointermove", (event) => {
    if (event.pointerId === joystickPointer) {
        moveJoystick(event);
    }
});

function moveJoystick(event) {
    const rect = joystick.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;

    const maxDistance = rect.width * 0.32;
    const distance = Math.hypot(dx, dy);

    if (distance > maxDistance) {
        dx = dx / distance * maxDistance;
        dy = dy / distance * maxDistance;
    }

    joystickX = dx / maxDistance;
    joystickY = dy / maxDistance;

    stick.style.left = `calc(50% + ${dx}px)`;
    stick.style.top = `calc(50% + ${dy}px)`;
}

function resetJoystick(event) {
    if (
        joystickPointer !== null &&
        event.pointerId === joystickPointer
    ) {
        joystickPointer = null;
        joystickX = 0;
        joystickY = 0;

        stick.style.left = "50%";
        stick.style.top = "50%";
    }
}

joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);
joystick.addEventListener("lostpointercapture", () => {
    joystickPointer = null;
    joystickX = 0;
    joystickY = 0;
    stick.style.left = "50%";
    stick.style.top = "50%";
});

// ===== TOMBOL LARI =====
const runButton = document.getElementById("run-button");

runButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    running = true;
});

function stopRunning() {
    running = false;
}

runButton.addEventListener("pointerup", stopRunning);
runButton.addEventListener("pointercancel", stopRunning);
runButton.addEventListener("lostpointercapture", stopRunning);

// ===== GERAKAN KAMERA =====
// Geser jari pada sisi kanan layar untuk melihat sekeliling.
let lookPointer = null;
let lastLookX = 0;
let lastLookY = 0;

renderer.domElement.addEventListener("pointerdown", (event) => {
    if (event.clientX < window.innerWidth * 0.4) return;

    lookPointer = event.pointerId;
    lastLookX = event.clientX;
    lastLookY = event.clientY;

    renderer.domElement.setPointerCapture(event.pointerId);
});

renderer.domElement.addEventListener("pointermove", (event) => {
    if (event.pointerId !== lookPointer) return;

    const dx = event.clientX - lastLookX;
    const dy = event.clientY - lastLookY;

    yaw += dx * 0.005;
    pitch -= dy * 0.005;

    pitch = THREE.MathUtils.clamp(
        pitch,
        -Math.PI / 2.5,
        Math.PI / 2.5
    );

    lastLookX = event.clientX;
    lastLookY = event.clientY;
});

function stopLooking(event) {
    if (event.pointerId === lookPointer) {
        lookPointer = null;
    }
}

renderer.domElement.addEventListener("pointerup", stopLooking);
renderer.domElement.addEventListener("pointercancel", stopLooking);

// ===== ANIMASI GAME =====
let previousTime = 0;

function animate(time = 0) {
    requestAnimationFrame(animate);

    const delta = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;

    // Arah depan dan samping berdasarkan kamera.  
const forward = -joystickY;
const sideways = joystickX;

const speed = player.speed * (running ? 1.8 : 1);

// Hitung arah gerakan berdasarkan kamera
const moveX =
    Math.sin(yaw) * forward +
    Math.cos(yaw) * sideways;

const moveZ =
    -Math.cos(yaw) * forward +
    Math.sin(yaw) * sideways;

// Gerakkan karakter
player.x += moveX * speed * delta;
player.z += moveZ * speed * delta;

    // Batas area permainan.
    player.x = THREE.MathUtils.clamp(player.x, -40, 40);
    player.z = THREE.MathUtils.clamp(player.z, -90, 90);

/* Kamera mengikuti dari belakang karakter */
const cameraDistance = 7;
const cameraHeight = 3.5;

const targetX = player.x - Math.sin(yaw) * cameraDistance;
const targetZ = player.z + Math.cos(yaw) * cameraDistance;

camera.position.set(
    targetX,
    cameraHeight,
    targetZ
);

camera.lookAt(
    player.x,
    1.3,
    player.z
);

    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
