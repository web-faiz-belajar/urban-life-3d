
(() => {
    "use strict";

    const container = document.getElementById("game-container");
    const loading = document.getElementById("loading-screen");
    const loadingStatus = document.getElementById("loading-status");
    const locationName = document.getElementById("location-name");
    const minimapCanvas = document.getElementById("minimap-canvas");
    const mapCtx = minimapCanvas.getContext("2d");
    const joystick = document.getElementById("joystick");
    const stick = document.getElementById("stick");
    const runButton = document.getElementById("run-button");

    if (!window.THREE) {
        loadingStatus.textContent = "Three.js gagal dimuat. Periksa internet.";
        return;
    }

    loadingStatus.textContent = "Membangun kawasan Bandung...";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9bc7df);
    scene.fog = new THREE.Fog(0x9bc7df, 90, 260);

    const camera = new THREE.PerspectiveCamera(
        65, innerWidth / innerHeight, 0.1, 500
    );

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xd9efff, 0x58604c, 2));

    const sunlight = new THREE.DirectionalLight(0xffedcf, 2);
    sunlight.position.set(-35, 70, 25);
    scene.add(sunlight);

    const mat = (color, roughness = 1) =>
        new THREE.MeshStandardMaterial({ color, roughness });

    const materials = {
        grass: mat(0x587d59),
        road: mat(0x303943),
        sidewalk: mat(0xb8b5a8),
        white: mat(0xf3eee0),
        yellow: mat(0xf3c75b),
        red: mat(0xb95c4c),
        teal: mat(0x397b79),
        blue: mat(0x527a9c),
        cream: mat(0xd9c7a6),
        dark: mat(0x343a46),
        glass: mat(0x477c8d),
        tree: mat(0x356747),
        trunk: mat(0x70503a)
    };

    function box(x, y, z, sx, sy, sz, material, parent = scene) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(sx, sy, sz), material
        );
        mesh.position.set(x, y, z);
        parent.add(mesh);
        return mesh;
    }

    function cylinder(x, y, z, radiusTop, radiusBottom, height, material) {
        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 7),
            material
        );
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    // Ground
    box(0, -0.35, 0, 240, 0.6, 240, materials.grass);

    // Roads follow connected, gently winding points.
    const roadPoints = [
        [-100, 0], [-72, 4], [-45, 0], [-20, 7],
        [5, 2], [30, 10], [56, 5], [82, 13], [105, 8]
    ];

    function roadSegment(a, b, width = 10) {
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const length = Math.hypot(dx, dz);
        const angle = Math.atan2(dz, dx);
        const mx = (a[0] + b[0]) / 2;
        const mz = (a[1] + b[1]) / 2;

        const road = box(mx, -0.015, mz, length + 1, 0.12, width, materials.road);
        road.rotation.y = -angle;

        const edgeOffset = width / 2 + 0.8;
        for (const side of [-1, 1]) {
            const ex = -Math.sin(angle) * edgeOffset * side;
            const ez = Math.cos(angle) * edgeOffset * side;
            const walk = box(mx + ex, 0.04, mz + ez,
                length + 1, 0.18, 1.6, materials.sidewalk);
            walk.rotation.y = -angle;
        }

        // Short dashed center markings
        const dashCount = Math.floor(length / 7);
        for (let i = 1; i < dashCount; i++) {
            const t = i / dashCount;
            const dash = box(
                a[0] + dx * t, 0.06, a[1] + dz * t,
                2.3, 0.035, 0.14, materials.yellow
            );
            dash.rotation.y = -angle;
        }
    }

    for (let i = 0; i < roadPoints.length - 1; i++) {
        roadSegment(roadPoints[i], roadPoints[i + 1], 11);
    }

    // Side streets
    const sideRoads = [
        { x: -70, z: -53, end: 45 },
        { x: -35, z: 25, end: 48 },
        { x: 2, z: -42, end: 42 },
        { x: 39, z: 30, end: 48 },
        { x: 72, z: -35, end: 43 }
    ];

    sideRoads.forEach(r => {
        roadSegment([r.x, -r.end], [r.x + 5, r.end], 7);
    });

    // Buildings with colorful facades and storefront windows
    const facadeMaterials = [
        materials.cream, materials.white, materials.red,
        materials.teal, materials.blue, materials.yellow
    ];

    function building(x, z, width, depth, height, colorIndex) {
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        scene.add(group);

        const facade = facadeMaterials[colorIndex % facadeMaterials.length];
        box(0, height / 2, 0, width, height, depth, facade, group);

        // Flat roof and dark storefront base
        box(0, height + 0.18, 0, width + 0.5, 0.36, depth + 0.4,
            materials.dark, group);
        box(0, 0.8, depth / 2 + 0.035, width * 0.88, 1.5, 0.09,
            materials.dark, group);

        const windows = Math.max(2, Math.floor(width / 2.4));
        for (let i = 0; i < windows; i++) {
            const wx = -width / 2 + width * (i + 0.5) / windows;
            box(wx, height * 0.59, depth / 2 + 0.06,
                width / windows * 0.62, height * 0.25, 0.08,
                materials.glass, group);
            box(wx, height * 0.39, depth / 2 + 0.09,
                width / windows * 0.72, 0.13, 0.12,
                materials.white, group);
        }

        // Simple signboard
        box(0, 2.0, depth / 2 + 0.13, width * 0.7, 0.35, 0.12,
            materials.yellow, group);
    }

    // Keep the central road open; place buildings along both sides.
    for (let i = 0; i < 33; i++) {
        const x = -92 + i * 5.7;
        const zRoad = 3 + Math.sin((x + 15) / 17) * 4;
        const width = 3.5 + (i % 3) * 1.1;
        const depth = 5 + (i % 2) * 2;
        const height = 5 + (i % 4) * 1.8;

        building(x, zRoad - 12 - depth / 2, width, depth, height, i);
        building(x + 2, zRoad + 12 + depth / 2,
            width, depth, height + (i % 3), i + 2);
    }

    // Trees on sidewalks and small parks
    function tree(x, z, scale = 1) {
        cylinder(x, 1.1 * scale, z, 0.16 * scale, 0.22 * scale,
            2.2 * scale, materials.trunk);

        const crown = new THREE.Mesh(
            new THREE.SphereGeometry(1.15 * scale, 7, 6),
            materials.tree
        );
        crown.position.set(x, 2.8 * scale, z);
        scene.add(crown);
    }

    for (let i = 0; i < 38; i++) {
        const x = -92 + i * 5;
        const z = 3 + Math.sin((x + 15) / 17) * 4;
        tree(x, z - 8.5, 0.8);
        tree(x + 1.5, z + 8.5, 0.8);
    }

    // Player character
    const player = new THREE.Group();
    scene.add(player);

    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.5, 1.25, 8),
        mat(0x2563eb)
    );
    body.position.y = 1.1;
    player.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 10, 8),
        mat(0xf0c8a2)
    );
    head.position.y = 1.98;
    player.add(head);

    const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        mat(0x30271f)
    );
    hair.position.y = 2.13;
    player.add(hair);

    player.position.set(0, 0, 0);

    // Camera follows the player from behind.
    let cameraYaw = 0;
    let cameraPitch = 0.22;
    let running = false;
    let moveX = 0;
    let moveY = 0;
    let lastTime = performance.now();

    function updateCamera() {
        const distance = 8;
        const horizontal = Math.cos(cameraPitch) * distance;

        camera.position.set(
            player.position.x + Math.sin(cameraYaw) * horizontal,
            player.position.y + 4 + Math.sin(cameraPitch) * distance,
            player.position.z + Math.cos(cameraYaw) * horizontal
        );

        camera.lookAt(
            player.position.x,
            player.position.y + 1.2,
            player.position.z
        );
    }

    updateCamera();

    // Touch joystick
    let joystickPointer = null;

    function updateStick(event) {
        const rect = joystick.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = event.clientX - cx;
        let dy = event.clientY - cy;
        const max = rect.width * 0.32;
        const length = Math.hypot(dx, dy);

        if (length > max) {
            dx = dx / length * max;
            dy = dy / length * max;
        }

        moveX = dx / max;
        moveY = dy / max;
        stick.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    joystick.addEventListener("pointerdown", event => {
        event.preventDefault();
        joystickPointer = event.pointerId;
        joystick.setPointerCapture(event.pointerId);
        updateStick(event);
    });

    joystick.addEventListener("pointermove", event => {
        if (event.pointerId === joystickPointer) updateStick(event);
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
        runButton.addEventListener(type, () => running = false);
    });

    // Drag anywhere outside controls to look around
    let lookPointer = null;
    let previousX = 0;
    let previousY = 0;

    renderer.domElement.addEventListener("pointerdown", event => {
        lookPointer = event.pointerId;
        previousX = event.clientX;
        previousY = event.clientY;
    });

    renderer.domElement.addEventListener("pointermove", event => {
        if (lookPointer !== event.pointerId) return;

        const dx = event.clientX - previousX;
        const dy = event.clientY - previousY;
        previousX = event.clientX;
        previousY = event.clientY;

        cameraYaw += dx * 0.006;
    cameraPitch = Math.max(-0.05,
    Math.min(0.65, cameraPitch + dy * 0.003));
    });

    function endLook(event) {
        if (lookPointer === event.pointerId) lookPointer = null;
    }
    renderer.domElement.addEventListener("pointerup", endLook);
    renderer.domElement.addEventListener("pointercancel", endLook);

    // Simple minimap
    function drawMinimap() {
        const w = minimapCanvas.width;
        const h = minimapCanvas.height;
        const scale = w / 240;

        mapCtx.clearRect(0, 0, w, h);
        mapCtx.fillStyle = "#294b3c";
        mapCtx.fillRect(0, 0, w, h);

        mapCtx.strokeStyle = "#59636b";
        mapCtx.lineWidth = 7;
        mapCtx.lineCap = "round";
        mapCtx.beginPath();

        roadPoints.forEach((p, i) => {
            const x = w / 2 + p[0] * scale;
            const y = h / 2 + p[1] * scale;
            if (i === 0) mapCtx.moveTo(x, y);
            else mapCtx.lineTo(x, y);
        });
        mapCtx.stroke();

        mapCtx.fillStyle = "#d9d2b8";
        sideRoads.forEach(r => {
            mapCtx.fillRect(
                w / 2 + r.x * scale - 1,
                h / 2 - 50 * scale,
                2,
                100 * scale
            );
        });

        mapCtx.fillStyle = "#f4ca58";
        mapCtx.beginPath();
        mapCtx.arc(
            w / 2 + player.position.x * scale,
            h / 2 + player.position.z * scale,
            4, 0, Math.PI * 2
        );
        mapCtx.fill();
    }

    function updateLocation() {
        if (player.position.x < -35) {
            locationName.textContent = "Kawasan Cihampelas";
        } else if (player.position.x < 35) {
            locationName.textContent = "Kawasan Braga";
        } else {
            locationName.textContent = "Bandung District";
        }
    }

    function animate(now) {
        requestAnimationFrame(animate);

        const delta = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        const inputLength = Math.hypot(moveX, moveY);
        if (inputLength > 0.08) {
            const speed = running ? 10 : 5;
            const forward = -moveY;
            const strafe = -moveX;
            const dx = (
                  Math.sin(cameraYaw) * forward +
                  Math.cos(cameraYaw) * strafe
           ) * speed * delta;
           const dz = (
                 -Math.cos(cameraYaw) * forward +
                  Math.sin(cameraYaw) * strafe
          ) * speed * delta;

            player.position.x += dx;
            player.position.z += dz;

            player.position.x = THREE.MathUtils.clamp(
                player.position.x, -112, 112
            );
            player.position.z = THREE.MathUtils.clamp(
                player.position.z, -105, 105
            );

            player.rotation.y = Math.atan2(dx, dz);
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
    }, 900);
})();
