
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { loadBandungMap } from "./bandung-map.js";
import { loadBragaBuildings } from "./braga-buildings.js";
// ===== PENGATURAN DASAR =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 25, 120);

const camera = new THREE.PerspectiveCamera(
    65,
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
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ color: 0x477c42 })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
scene.add(ground);

/* ===== JALAN BANDUNG DARI GEOJSON ===== */

function createBandungRoads(roads) {
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x343943,
        roughness: 0.95
    });

    const baseLon = 107.605;
    const baseLat = -6.915;
    const metersPerUnit = 10;

    for (const road of roads) {
        if (!road || road.length < 2) continue;

        const points = road.map(([lon, lat]) => {
            const x =
                (lon - baseLon) *
                111320 *
                Math.cos(baseLat * Math.PI / 180) /
                metersPerUnit;

            const z =
                -(lat - baseLat) *
                111320 /
                metersPerUnit;

            return new THREE.Vector3(x, -0.045, z);
        });

        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];

            const dx = end.x - start.x;
            const dz = end.z - start.z;
            const length = Math.sqrt(dx * dx + dz * dz);

            if (length < 0.1) continue;

            const roadMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(4, length),
                roadMaterial
            );

            roadMesh.rotation.x = -Math.PI / 2;
            roadMesh.rotation.z = -Math.atan2(dx, dz);
            roadMesh.position.set(
                (start.x + end.x) / 2,
                -0.045,
                (start.z + end.z) / 2
            );

            scene.add(roadMesh);
        }
    }

    console.log("Jalan 3D Bandung selesai dibuat");
}
/* ===== BANGUNAN 3D BRAGA ===== */

function createBragaBuildings(buildings) {
    const material = new THREE.MeshStandardMaterial({
        color: 0xc8b9a3,
        roughness: 0.9
    });

    const baseLon = 107.605;
    const baseLat = -6.915;
    const metersPerUnit = 10;

    for (const feature of buildings) {
        const geometry = feature.geometry;
        let polygon;

        if (geometry.type === "Polygon") {
            polygon = geometry.coordinates[0];
        } else if (geometry.type === "MultiPolygon") {
            polygon = geometry.coordinates[0][0];
        } else {
            continue;
        }

        if (!polygon || polygon.length < 4) continue;

        const points = polygon.map(([lon, lat]) => ({
            x: (lon - baseLon) * 111320 *
                Math.cos(baseLat * Math.PI / 180) / metersPerUnit,
            z: -(lat - baseLat) * 111320 / metersPerUnit
        }));

        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        const minZ = Math.min(...points.map(p => p.z));
        const maxZ = Math.max(...points.map(p => p.z));

        const width = maxX - minX;
        const depth = maxZ - minZ;

        if (width < 0.5 || depth < 0.5) continue;

        const height = 2 + Math.random() * 3;

        const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            material
        );

        building.position.set(
            (minX + maxX) / 2,
            height / 2,
            (minZ + maxZ) / 2
        );

        scene.add(building);
    }

    console.log("Bangunan 3D Braga selesai dibuat");
}

/* ===== KARAKTER PEMAIN 3D ===== */
const player = {
    x: 0,
    z: 5,
    speed: 5
};

const character = new THREE.Group();
character.scale.set(0.7, 0.7, 0.7);

// Badan
const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.39, 0.54, 0.21),
    new THREE.MeshStandardMaterial({ color: 0x2563eb })
);
body.position.y = 0.72;
character.add(body);

// Kepala
const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf1c27d })
);
head.position.y = 1.08;
character.add(head);

// Kaki kiri dan kanan
const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x172554
});

const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.39, 0.15),
    legMaterial
);
leftLeg.position.set(-0.11, 0.25, 0);
character.add(leftLeg);

const rightLeg = leftLeg.clone();
rightLeg.position.x = 0.11;
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
    2.2,
    player.z + 3.5
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


/* ===== ANIMASI GAME ===== */
let previousTime = 0;

function animate(time = 0) {
    requestAnimationFrame(animate);

    const delta = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;

    // Arah gerakan berdasarkan kamera
    const forward = -joystickY;
    const sideways = joystickX;

    const speed = player.speed * (running ? 1.8 : 1);

    const moveX =
        Math.sin(yaw) * forward +
        Math.cos(yaw) * sideways;

    const moveZ =
        -Math.cos(yaw) * forward +
        Math.sin(yaw) * sideways;

    // Gerakkan pemain
    player.x += moveX * speed * delta;
    player.z += moveZ * speed * delta;

    // Batasi area permainan
    player.x = THREE.MathUtils.clamp(player.x, -40, 40);
    player.z = THREE.MathUtils.clamp(player.z, -90, 90);

    // Pindahkan model karakter mengikuti pemain
    character.position.set(player.x, 0, player.z);

    // Putar karakter ke arah gerakan
    if (Math.abs(moveX) + Math.abs(moveZ) > 0.01) {
        character.rotation.y = Math.atan2(moveX, moveZ);
    }

    // Kamera orang ketiga
    const isLandscape = window.innerWidth > window.innerHeight;

    const cameraDistance = isLandscape ? 3 : 4;
    const cameraHeight = isLandscape ? 1.8 : 2.8;

    const targetX =
        player.x - Math.sin(yaw) * cameraDistance;

    const targetZ =
        player.z + Math.cos(yaw) * cameraDistance;

    // Haluskan pergerakan kamera
    const smoothness = 1 - Math.exp(-6 * delta);

    camera.position.x +=
        (targetX - camera.position.x) * smoothness;

    camera.position.y +=
        (cameraHeight - camera.position.y) * smoothness;

    camera.position.z +=
        (targetZ - camera.position.z) * smoothness;

    // Kamera melihat ke arah karakter
    camera.lookAt(player.x, 0.9, player.z);

    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

/* ===== MEMUAT JALAN BANDUNG ===== */
let bandungRoads = [];

loadBandungMap()
    .then((roads) => {
        bandungRoads = roads;
        console.log("Jalan Bandung dimuat:", bandungRoads.length);

        createBandungRoads(roads);
    })
    .catch((error) => {
        console.error("Gagal memuat jalan Bandung:", error);
    });

/* ===== MEMUAT BANGUNAN BRAGA ===== */

loadBragaBuildings()
    .then((buildings) => {
        createBragaBuildings(buildings);
    })
    .catch((error) => {
        console.error("Gagal memuat bangunan Braga:", error);
    });

/* ===== MINIMAP BERGERAK ===== */
const minimap = document.getElementById("minimap");

if (minimap) {
    const ctx = minimap.getContext("2d");

    function drawMinimap() {
        const w = minimap.width;
        const h = minimap.height;
        const scale = 3;
        const centerX = w / 2;
        const centerY = h / 2;

        const px = player.x;
        const pz = player.z;

        ctx.fillStyle = "#172a35";
        ctx.fillRect(0, 0, w, h);

        // Jalan asli dari GeoJSON Bandung
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-character.rotation.y);

        const latCenter = -6.915;

const lonCenter =
    107.605 + player.x / (111320 * Math.cos(latCenter * Math.PI / 180));

const latPusat =
    latCenter + player.z / 111320;

        const zoom = 3;

        const lonMin = lonCenter - 0.01 / zoom;
        const lonMax = lonCenter + 0.01 / zoom;
        const latMin = latPusat - 0.01 / zoom;
        const latMax = latPusat + 0.01 / zoom;

        const mapWidth = w;
        const mapHeight = h;

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (const road of bandungRoads) {
            ctx.beginPath();

            for (let i = 0; i < road.length; i++) {
                const lon = road[i][0];
                const lat = road[i][1];

                const x = ((lon - lonMin) / (lonMax - lonMin)) * mapWidth - centerX;
                const y = ((latMax - lat) / (latMax - latMin)) * mapHeight - centerY;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
        }

        ctx.restore();

        // Penanda arah pemain
        ctx.save();
        ctx.translate(centerX, centerY);

        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(-7, 7);
        ctx.lineTo(7, 7);
        ctx.closePath();

        ctx.fillStyle = "#38bdf8";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    function updateMinimap() {
        drawMinimap();
        requestAnimationFrame(updateMinimap);
    }

    updateMinimap();
}
