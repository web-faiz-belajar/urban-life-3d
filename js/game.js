
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
scene.add(
    new THREE.HemisphereLight(0xffffff, 0x52634b, 2)
);

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(20, 30, 10);
sun.castShadow = true;
scene.add(sun);

// ===== TANAH =====
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({
        color: 0x477c42
    })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
ground.receiveShadow = true;
scene.add(ground);

// ===== KONVERSI KOORDINAT BANDUNG =====
const BASE_LON = 107.605;
const BASE_LAT = -6.915;
const METERS_PER_UNIT = 10;

function geoToWorld(lon, lat) {
    return {
        x:
            (lon - BASE_LON) *
            111320 *
            Math.cos(BASE_LAT * Math.PI / 180) /
            METERS_PER_UNIT,

        z:
            -(lat - BASE_LAT) *
            111320 /
            METERS_PER_UNIT
    };
}

// ===== JALAN BANDUNG DARI GEOJSON =====
function createBandungRoads(roads) {
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x343943,
        roughness: 0.95,
        side: THREE.DoubleSide
    });

    for (const road of roads) {
        if (!Array.isArray(road) || road.length < 2) {
            continue;
        }

        const points = road.map(([lon, lat]) => {
            const pos = geoToWorld(lon, lat);

            return new THREE.Vector3(
                pos.x,
                -0.045,
                pos.z
            );
        });

        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];

            const dx = end.x - start.x;
            const dz = end.z - start.z;
            const length = Math.hypot(dx, dz);

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

            roadMesh.receiveShadow = true;
            scene.add(roadMesh);
        }
    }

    console.log("Jalan Bandung selesai dibuat:", roads.length);
}

/* ===== BANGUNAN 3D BRAGA ===== */
function createBragaBuildings(buildings) {
    const material = new THREE.MeshStandardMaterial({
        color: 0xc8b9a3,
        roughness: 0.9
    });

    for (const feature of buildings) {
        if (!feature || !feature.geometry) continue;

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

        const points = polygon.map(([lon, lat]) =>
            geoToWorld(lon, lat)
        );

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

        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);
    }

    console.log("Bangunan 3D Braga selesai dibuat:", buildings.length);
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
    new THREE.MeshStandardMaterial({
        color: 0x2563eb
    })
);
body.position.y = 0.72;
body.castShadow = true;
character.add(body);

// Kepala
const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 16),
    new THREE.MeshStandardMaterial({
        color: 0xf1c27d
    })
);
head.position.y = 1.08;
head.castShadow = true;
character.add(head);

// Kaki
const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x172554
});

const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.39, 0.15),
    legMaterial
);
leftLeg.position.set(-0.11, 0.25, 0);
leftLeg.castShadow = true;
character.add(leftLeg);

const rightLeg = leftLeg.clone();
rightLeg.position.x = 0.11;
character.add(rightLeg);

scene.add(character);

// ===== VARIABEL KONTROL =====
let yaw = 0;
let pitch = 0;
let joystickX = 0;
let joystickY = 0;
let running = false;

// ===== POSISI AWAL KAMERA =====
camera.position.set(
    player.x,
    2.2,
    player.z + 3.5
);

camera.rotation.order = "YXZ";

/* ===== JOYSTICK ===== */
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

if (!joystick || !stick) {
    throw new Error(
        'Elemen joystick atau stick tidak ditemukan di HTML.'
    );
}

let joystickPointer = null;

joystick.addEventListener("pointerdown", (event) => {
    event.preventDefault();

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
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
    }

    joystickX = dx / maxDistance;
    joystickY = dy / maxDistance;

    stick.style.left = `calc(50% + ${dx}px)`;
    stick.style.top = `calc(50% + ${dy}px)`;
}

function resetJoystick(event) {
    if (event.pointerId !== joystickPointer) return;

    joystickPointer = null;
    joystickX = 0;
    joystickY = 0;

    stick.style.left = "50%";
    stick.style.top = "50%";
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

/* ===== TOMBOL LARI ===== */
const runButton = document.getElementById("run-button");

if (!runButton) {
    throw new Error('Tombol lari #run-button tidak ditemukan di HTML.');
}

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

/* ===== GERAKAN KAMERA DENGAN SENTUHAN ===== */
let lookPointer = null;
let lastLookX = 0;
let lastLookY = 0;

renderer.domElement.style.touchAction = "none";

renderer.domElement.addEventListener("pointerdown", (event) => {
    // Sisi kiri layar digunakan untuk joystick.
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

    pitch = THREE.MathUtils.clamp(pitch, -0.5, 0.5);
    
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

    const delta = Math.min(
        Math.max((time - previousTime) / 1000, 0),
        0.05
    );

    previousTime = time;

    // Arah gerakan berdasarkan arah kamera
    const forward = -joystickY;
    const sideways = joystickX;

    const inputLength = Math.hypot(forward, sideways);
    const normalizer = inputLength > 1 ? inputLength : 1;

    const forwardNormalized = forward / normalizer;
    const sidewaysNormalized = sideways / normalizer;

    const speed = player.speed * (running ? 1.8 : 1);

    const moveX =
        Math.sin(yaw) * forwardNormalized +
        Math.cos(yaw) * sidewaysNormalized;

    const moveZ =
        -Math.cos(yaw) * forwardNormalized +
        Math.sin(yaw) * sidewaysNormalized;

    // Gerakkan pemain
    player.x += moveX * speed * delta;
    player.z += moveZ * speed * delta;

    // Batas area permainan
    player.x = THREE.MathUtils.clamp(player.x, -40, 40);
    player.z = THREE.MathUtils.clamp(player.z, -90, 90);

    // Posisi karakter
    character.position.set(player.x, 0, player.z);

    // Hadapkan karakter ke arah gerakan
    if (Math.abs(moveX) + Math.abs(moveZ) > 0.01) {
        character.rotation.y = Math.atan2(moveX, moveZ);
    }


    // ===== KAMERA ORANG KETIGA =====
    const isLandscape =
        window.innerWidth > window.innerHeight;

    const cameraDistance = isLandscape ? 1.8 : 4;
    const cameraHeight = isLandscape ? 1.8 : 2.8;
    const lookDistance = 5;

    pitch = THREE.MathUtils.clamp(pitch, -0.8, 0.8);

    const horizontalDistance =
        cameraDistance * Math.cos(pitch);

    const targetX =
        player.x - Math.sin(yaw) * horizontalDistance;

    const targetZ =
        player.z + Math.cos(yaw) * horizontalDistance;

    const targetY =
        cameraHeight + Math.sin(pitch) * cameraDistance;

    // Haluskan gerakan kamera
    const smoothness = 1 - Math.exp(-6 * delta);

    camera.position.x +=
        (targetX - camera.position.x) * smoothness;

    camera.position.y +=
        (targetY - camera.position.y) * smoothness;

    camera.position.z +=
        (targetZ - camera.position.z) * smoothness;

    // Arah pandangan kamera
    camera.lookAt(
        player.x + Math.sin(yaw) * Math.cos(pitch) * lookDistance,
        0.9 + Math.sin(pitch) * lookDistance,
        player.z - Math.cos(yaw) * Math.cos(pitch) * lookDistance
    );

    renderer.render(scene, camera);
}

// ===== UKURAN LAYAR =====
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});

// Mulai animasi satu kali
animate();

/* ===== MEMUAT JALAN BANDUNG ===== */
let bandungRoads = [];

loadBandungMap()
    .then((roads) => {
        if (!Array.isArray(roads)) {
            throw new Error("Format data jalan Bandung tidak valid.");
        }

        bandungRoads = roads;
        createBandungRoads(roads);
        console.log("Jalan Bandung berhasil dimuat:", roads.length);
    })
    .catch((error) => {
        console.error("Gagal memuat jalan Bandung:", error);
    });

/* ===== MEMUAT BANGUNAN BRAGA ===== */
loadBragaBuildings()
    .then((buildings) => {
        if (!Array.isArray(buildings)) {
            throw new Error("Format data bangunan Braga tidak valid.");
        }

        createBragaBuildings(buildings);
        console.log("Bangunan Braga berhasil dimuat:", buildings.length);
    })
    .catch((error) => {
        console.error("Gagal memuat bangunan Braga:", error);
    });

/* ===== MINIMAP ===== */
const minimap = document.getElementById("minimap");

if (minimap) {
    const ctx = minimap.getContext("2d");

    function drawMinimap() {
        const w = minimap.width;
        const h = minimap.height;

        const centerX = w / 2;
        const centerY = h / 2;

        ctx.fillStyle = "#172a35";
        ctx.fillRect(0, 0, w, h);

        // Pusat peta mengikuti posisi pemain.
        const latCenter = BASE_LAT;

        const lonCenter =
            BASE_LON +
            (player.x * METERS_PER_UNIT) /
            (111320 * Math.cos(latCenter * Math.PI / 180));

        const latPusat =
            latCenter -
            (player.z * METERS_PER_UNIT) / 111320;

        const zoom = 3;

        const lonMin = lonCenter - 0.01 / zoom;
        const lonMax = lonCenter + 0.01 / zoom;
        const latMin = latPusat - 0.01 / zoom;
        const latMax = latPusat + 0.01 / zoom;

        // Gambar jalan GeoJSON.
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-character.rotation.y);

        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (const road of bandungRoads) {
            if (!Array.isArray(road) || road.length < 2) {
                continue;
            }

            ctx.beginPath();

            for (let i = 0; i < road.length; i++) {
                const [lon, lat] = road[i];

                const x =
                    ((lon - lonMin) / (lonMax - lonMin)) * w -
                    centerX;

                const y =
                    ((latMax - lat) / (latMax - latMin)) * h -
                    centerY;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
        }

        ctx.restore();

        // Penanda pemain di tengah minimap.
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
} else {
    console.warn("Canvas #minimap tidak ditemukan di HTML.");
}
