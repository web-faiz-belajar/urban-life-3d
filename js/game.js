
(() => {
    "use strict";

    // ==========================================
    // URBAN LIFE 3D — BANDUNG
    // New low-poly city foundation
    // ==========================================

    const $ = id => document.getElementById(id);
    const container = $("game-container");
    const loading = $("loading-screen");
    const loadingStatus = $("loading-status");
    const locationLabel = $("location-name");
    const joystick = $("joystick");
    const stick = $("stick");
    const runButton = $("run-button");
    const mapCanvas = $("minimap-canvas");
    const map = mapCanvas.getContext("2d");

    if (!window.THREE) {
        loadingStatus.textContent = "Three.js gagal dimuat.";
        return;
    }

    // ---------- SCENE ----------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fc7dc);
    scene.fog = new THREE.Fog(0x9fc7dc, 100, 300);

    const camera = new THREE.PerspectiveCamera(
        65, innerWidth / innerHeight, 0.1, 500
    );

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe5f4ff, 0x56604a, 2));

    const sun = new THREE.DirectionalLight(0xffedcf, 2.2);
    sun.position.set(-40, 70, 30);
    scene.add(sun);

    // ---------- MATERIALS ----------
    function material(color, roughness = 1) {
        return new THREE.MeshStandardMaterial({ color, roughness });
    }

    const M = {
        grass: material(0x63805b),
        road: material(0x343941),
        sidewalk: material(0xbdb9ac),
        line: material(0xf4d77c),
        cream: material(0xe3d2b3),
        white: material(0xece9df),
        brick: material(0xb96955),
        blue: material(0x557f9d),
        green: material(0x4c8378),
        yellow: material(0xd8ae56),
        glass: material(0x568a99),
        dark: material(0x343640),
        leaf: material(0x356849),
        trunk: material(0x72503a),
        skin: material(0xd6a17d),
        shirt: material(0x3566a8),
        pants: material(0x303746),
        shoe: material(0x20232b)
    };

    function box(parent, x, y, z, w, h, d, mat) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d), mat
        );
        mesh.position.set(x, y, z);
        parent.add(mesh);
        return mesh;
    }

    function sphere(parent, x, y, z, r, mat) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(r, 10, 8), mat
        );
        mesh.position.set(x, y, z);
        parent.add(mesh);
        return mesh;
    }

    // ---------- GROUND ----------
    box(scene, 0, -0.4, 0, 250, 0.7, 250, M.grass);

    // ---------- CITY ROADS ----------
    // The main road follows a gently winding path.
    const roadPoints = [
        [-110, -8], [-82, -3], [-55, -7],
        [-28, 1], [0, -3], [28, 5],
        [55, 1], [82, 10], [110, 5]
    ];

    function makeRoad(a, b, width) {
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const len = Math.hypot(dx, dz);
        const angle = Math.atan2(dz, dx);
        const mx = (a[0] + b[0]) / 2;
        const mz = (a[1] + b[1]) / 2;

        const road = box(
            scene, mx, -0.02, mz,
            len + 1, 0.13, width, M.road
        );
        road.rotation.y = -angle;

        // Sidewalk edges
        for (const side of [-1, 1]) {
            const offset = width / 2 + 1;
            const sx = -Math.sin(angle) * offset * side;
            const sz = Math.cos(angle) * offset * side;

            const pavement = box(
                scene, mx + sx, 0.035, mz + sz,
                len + 1, 0.18, 1.7, M.sidewalk
            );
            pavement.rotation.y = -angle;
        }

        // Road markings
        const count = Math.floor(len / 7);
        for (let i = 1; i < count; i++) {
            const t = i / count;
            const dash = box(
                scene,
                a[0] + dx * t, 0.055, a[1] + dz * t,
                2.1, 0.025, 0.13, M.line
            );
            dash.rotation.y = -angle;
        }
    }

    for (let i = 0; i < roadPoints.length - 1; i++) {
        makeRoad(roadPoints[i], roadPoints[i + 1], 12);
    }

    // Side streets
    const sideRoads = [
        { x: -75, z: -50, end: 48 },
        { x: -42, z: 5, end: 42 },
        { x: -8, z: -48, end: 43 },
        { x: 30, z: 10, end: 46 },
        { x: 68, z: -38, end: 45 }
    ];

    for (const r of sideRoads) {
        makeRoad([r.x, -r.end], [r.x + 3, r.end], 7);
    }

    // ---------- BRAGA-INSPIRED BUILDINGS ----------
    const facades = [
        M.cream, M.white, M.brick, M.green, M.blue, M.yellow
    ];

    function makeBuilding(x, z, w, d, h, index) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        scene.add(group);

        const facade = facades[index % facades.length];

        box(group, 0, h / 2, 0, w, h, d, facade);

        // Roof trim
        box(
            group, 0, h + 0.15, 0,
            w + 0.45, 0.3, d + 0.4, M.dark
        );

        // Storefront base
        box(
            group, 0, 0.85, d / 2 + 0.05,
            w * 0.88, 1.55, 0.1, M.dark
        );

        // Windows
        const windowCount = Math.max(2, Math.floor(w / 2.3));
        for (let i = 0; i < windowCount; i++) {
            const wx = -w / 2 + w * (i + 0.5) / windowCount;

            box(
                group, wx, h * 0.59, d / 2 + 0.07,
                w / windowCount * 0.6, h * 0.23,
                0.09, M.glass
            );
        }

        // Shop sign
        box(
            group, 0, 2.05, d / 2 + 0.13,
            w * 0.72, 0.32, 0.12, M.yellow
        );

        // Entrance
        box(
            group, 0, 0.95, d / 2 + 0.14,
            0.8, 1.7, 0.12, M.glass
        );
    }

    for (let i = 0; i < 36; i++) {
        const x = -98 + i * 5.6;
        const roadZ = -3 + Math.sin((x + 10) / 18) * 4;
        const w = 3.8 + (i % 3) * 0.9;
        const d = 5.5 + (i % 2) * 1.5;
        const h = 5.5 + (i % 4) * 1.8;

        makeBuilding(
            x, roadZ - 12 - d / 2, w, d, h, i
        );

        makeBuilding(
            x + 1.5, roadZ + 12 + d / 2,
            w, d, h + (i % 3), i + 2
        );
    }

    // ---------- TREES & STREET PROPS ----------
    function makeTree(x, z, size = 1) {
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.14 * size, 0.2 * size, 1.8 * size, 7
            ),
            M.trunk
        );
        trunk.position.set(x, 0.9 * size, z);
        scene.add(trunk);

        const crown = new THREE.Mesh(
            new THREE.IcosahedronGeometry(1.05 * size, 1),
            M.leaf
        );
        crown.position.set(x, 2.25 * size, z);
        scene.add(crown);
    }

    for (let i = 0; i < 40; i++) {
        const x = -95 + i * 4.9;
        const z = -3 + Math.sin((x + 10) / 18) * 4;

        makeTree(x, z - 8.5, 0.8);
        makeTree(x + 1, z + 8.5, 0.8);
    }

    // ---------- PLAYER CHARACTER ----------
    const player = new THREE.Group();
    scene.add(player);

    const body = new THREE.Group();
    player.add(body);

    box(body, 0, 1.25, 0, 0.85, 0.9, 0.48, M.shirt);
    sphere(body, 0, 1.95, 0, 0.31, M.skin);

    // Hair
    sphere(body, 0, 2.12, -0.015, 0.31, M.dark);

    // Legs
    const leftLeg = box(
        body, -0.22, 0.55, 0, 0.27, 0.65, 0.3, M.pants
    );
    const rightLeg = box(
        body, 0.22, 0.55, 0, 0.27, 0.65, 0.3, M.pants
    );

    box(body, -0.22, 0.18, 0.07, 0.3, 0.18, 0.43, M.shoe);
    box(body, 0.22, 0.18, 0.07, 0.3, 0.18, 0.43, M.shoe);

    // Arms
    const leftArm = box(
        body, -0.55, 1.25, 0, 0.23, 0.75, 0.25, M.shirt
    );
    const rightArm = box(
        body, 0.55, 1.25, 0, 0.23, 0.75, 0.25, M.shirt
    );

    player.position.set(0, 0, -3);

    // ---------- CAMERA & INPUT ----------
    let cameraYaw = 0;
    let cameraPitch = 0.22;
    let moveX = 0;
    let moveY = 0;
    let running = false;
    let joystickPointer = null;
    let lookPointer = null;
    let previousX = 0;
    let previousY = 0;
    let lastTime = performance.now();
    let walkTime = 0;

    function updateCamera() {
        const distance = 8;
        const horizontal = Math.cos(cameraPitch) * distance;

        camera.position.set(
            player.position.x + Math.sin(cameraYaw) * horizontal,
            player.position.y + 3.5 +
                Math.sin(cameraPitch) * distance,
            player.position.z + Math.cos(cameraYaw) * horizontal
        );

        camera.lookAt(
            player.position.x,
            player.position.y + 1.1,
            player.position.z
        );
    }

    updateCamera();

    // Joystick input: up = forward, left = left.
    function updateStick(event) {
        const rect = joystick.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        let x = event.clientX - cx;
        let y = event.clientY - cy;

        const max = rect.width * 0.32;
        const length = Math.hypot(x, y);

        if (length > max) {
            x = x / length * max;
            y = y / length * max;
        }

        moveX = x / max;
        moveY = y / max;
        stick.style.transform = `translate(${x}px, ${y}px)`;
    }

    joystick.addEventListener("pointerdown", event => {
        event.preventDefault();
        joystickPointer = event.pointerId;
        joystick.setPointerCapture(event.pointerId);
        updateStick(event);
    });

    joystick.addEventListener("pointermove", event => {
        if (event.pointerId === joystickPointer) {
            updateStick(event);
        }
    });

    function releaseJoystick(event) {
        if (event.pointerId !== joystickPointer) return;

        joystickPointer = null;
        moveX = 0;
        moveY = 0;
        stick.style.transform = "translate(0px, 0px)";
    }

    joystick.addEventListener("pointerup", releaseJoystick);
    joystick.addEventListener("pointercancel", releaseJoystick);

    runButton.addEventListener("pointerdown", event => {
        event.preventDefault();
        running = true;
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach(type => {
        runButton.addEventListener(type, () => {
            running = false;
        });
    });

    // Camera drag: swipe right turns view right;
    // swipe up looks upward.
    renderer.domElement.addEventListener("pointerdown", event => {
        lookPointer = event.pointerId;
        previousX = event.clientX;
        previousY = event.clientY;
    });

    renderer.domElement.addEventListener("pointermove", event => {
        if (event.pointerId !== lookPointer) return;

        const dx = event.clientX - previousX;
        const dy = event.clientY - previousY;

        previousX = event.clientX;
        previousY = event.clientY;

        cameraYaw -= dx * 0.006;
        cameraPitch = THREE.MathUtils.clamp(
            cameraPitch + dy * 0.004, -0.05, 0.65
        );
    });

    function endLook(event) {
        if (event.pointerId === lookPointer) {
            lookPointer = null;
        }
    }

    renderer.domElement.addEventListener("pointerup", endLook);
    renderer.domElement.addEventListener("pointercancel", endLook);

    // ---------- MINIMAP ----------
    function drawMinimap() {
        const w = mapCanvas.width;
        const h = mapCanvas.height;
        const scale = w / 240;

        map.clearRect(0, 0, w, h);
        map.fillStyle = "#294b3c";
        map.fillRect(0, 0, w, h);

        map.strokeStyle = "#59636b";
        map.lineWidth = 7;
        map.lineCap = "round";
        map.beginPath();

        roadPoints.forEach((p, i) => {
            const x = w / 2 + p[0] * scale;
            const y = h / 2 + p[1] * scale;

            if (i === 0) map.moveTo(x, y);
            else map.lineTo(x, y);
        });

        map.stroke();

        map.fillStyle = "#f4ca58";
        map.beginPath();
        map.arc(
            w / 2 + player.position.x * scale,
            h / 2 + player.position.z * scale,
            4, 0, Math.PI * 2
        );
        map.fill();
    }

    function updateLocation() {
        const x = player.position.x;

        if (x < -35) {
            locationLabel.textContent = "Kawasan Cihampelas";
        } else if (x < 35) {
            locationLabel.textContent = "Kawasan Braga";
        } else {
            locationLabel.textContent = "Bandung District";
        }
    }

    // ---------- GAME LOOP ----------
    function animate(now) {
        requestAnimationFrame(animate);

        const delta = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        const forward = -moveY;
        const strafe = moveX;
        const inputLength = Math.hypot(forward, strafe);

        if (inputLength > 0.08) {
            const speed = running ? 9 : 4.5;

            // Camera-relative movement.
            const dx = (
                -Math.sin(cameraYaw) * forward +
                 Math.cos(cameraYaw) * strafe
            ) * speed * delta;

            const dz = (
                -Math.cos(cameraYaw) * forward -
                 Math.sin(cameraYaw) * strafe
            ) * speed * delta;

            player.position.x += dx;
            player.position.z += dz;

            player.position.x = THREE.MathUtils.clamp(
                player.position.x, -115, 115
            );

            player.position.z = THREE.MathUtils.clamp(
                player.position.z, -110, 110
            );

            // Face the direction of travel.
            player.rotation.y = Math.atan2(dx, dz);

            // Simple walking animation.
            walkTime += delta * speed;
            leftLeg.rotation.x = Math.sin(walkTime) * 0.45;
            rightLeg.rotation.x = -Math.sin(walkTime) * 0.45;
            leftArm.rotation.x = -Math.sin(walkTime) * 0.3;
            rightArm.rotation.x = Math.sin(walkTime) * 0.3;
        } else {
            leftLeg.rotation.x *= 0.8;
            rightLeg.rotation.x *= 0.8;
            leftArm.rotation.x *= 0.8;
            rightArm.rotation.x *= 0.8;
        }

        updateCamera();
        updateLocation();
        drawMinimap();
        renderer.render(scene, camera);
    }

    addEventListener("resize", () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    });

    requestAnimationFrame(animate);

    setTimeout(() => {
        loading.style.opacity = "0";
        setTimeout(() => loading.remove(), 600);
    }, 1000);
})();
