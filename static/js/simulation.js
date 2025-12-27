let scene, camera, renderer, controls;
let sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune;
let mercuryOrbitAngle = 0;
let venusOrbitAngle = 0;
let earthOrbitAngle = 0;
let marsOrbitAngle = 0;
let jupiterOrbitAngle = 0;
let saturnOrbitAngle = 0;
let uranusOrbitAngle = 0;
let neptuneOrbitAngle = 0;
let isPaused = false;
let grid = null;
let planetSizeMultiplier = 1.0;
let orbitLines = [];
let orbitsVisible = true;
const DEFAULT_CAMERA_POSITION = { x: 10000, y: 10000, z: 10000 };
const BASE_ORBIT_RADII = {
    mercury: 2160,
    venus: 3170,
    earth: 4000,
    mars: 5570,
    jupiter: 16600,
    saturn: 29600,
    uranus: 58500,
    neptune: 91100
};
let orbitScaleMultiplier = 1.0;

function init() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 2000000);
    camera.position.set(10000, 10000, 10000);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 0;
    controls.maxDistance = Infinity;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
    pointLight.position.set(100, 100, 100);
    scene.add(pointLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(0, 50, 50);
    scene.add(directionalLight);
    createStarfield();
    createInfiniteGrid();
    createFallbackSun();
    if (typeof THREE.GLTFLoader !== 'undefined') {
        loadSunModel();
        loadMercuryModel();
        loadVenusModel();
        loadEarthModel();
        loadMarsModel();
        loadJupiterModel();
        loadSaturnModel();
        loadUranusModel();
        loadNeptuneModel();
    }
    window.addEventListener('resize', onWindowResize);
    const playPauseBtn = document.getElementById('playPauseBtn');
    const gridToggleBtn = document.getElementById('gridToggleBtn');
    const orbitToggleBtn = document.getElementById('orbitToggleBtn');
    const recentreBtn = document.getElementById('recentreBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const planetSizeIncreaseBtn = document.getElementById('planetSizeIncreaseBtn');
    const planetSizeDecreaseBtn = document.getElementById('planetSizeDecreaseBtn');
    const resizeMaxBtn = document.getElementById('resizeMaxBtn');
    const resizeMinBtn = document.getElementById('resizeMinBtn');
    playPauseBtn.addEventListener('click', togglePlayPause);
    gridToggleBtn.addEventListener('click', toggleGrid);
    orbitToggleBtn.addEventListener('click', toggleOrbits);
    recentreBtn.addEventListener('click', recentreCamera);
    planetSizeIncreaseBtn.addEventListener('click', () => {
        planetSizeMultiplier *= 1.2;
        orbitScaleMultiplier *= 1.2;
        updatePlanetSizes();
        updateOrbitLines();
    });
    planetSizeDecreaseBtn.addEventListener('click', () => {
        planetSizeMultiplier *= 0.8;
        orbitScaleMultiplier *= 0.8;
        updatePlanetSizes();
        updateOrbitLines();
    });
    resizeMaxBtn.addEventListener('click', () => {
        planetSizeMultiplier = 10.0;
        orbitScaleMultiplier = 10.0;
        const scaleSlider = document.getElementById('scaleSlider');
        const scaleValue = document.getElementById('scaleValue');
        if (scaleSlider && scaleSlider.max >= 10) {
            scaleSlider.value = 10.0;
        } else if (scaleSlider) {
            scaleSlider.value = scaleSlider.max;
        }
        if (scaleValue) {
            scaleValue.textContent = planetSizeMultiplier.toFixed(1) + 'x';
        }
        updatePlanetSizes();
        updateOrbitLines();
    });
    resizeMinBtn.addEventListener('click', () => {
        planetSizeMultiplier = 1.0;
        orbitScaleMultiplier = 1.0;
        const scaleSlider = document.getElementById('scaleSlider');
        const scaleValue = document.getElementById('scaleValue');
        if (scaleSlider) {
            scaleSlider.value = 1.0;
        }
        if (scaleValue) {
            scaleValue.textContent = '1.0x';
        }
        updatePlanetSizes();
        updateOrbitLines();
    });
    const scaleSlider = document.getElementById('scaleSlider');
    const scaleValue = document.getElementById('scaleValue');
    scaleSlider.addEventListener('input', (e) => {
        const sliderValue = parseFloat(e.target.value);
        planetSizeMultiplier = sliderValue;
        orbitScaleMultiplier = sliderValue;
        scaleValue.textContent = sliderValue.toFixed(1) + 'x';
        updatePlanetSizes();
        updateOrbitLines();
    });
    zoomInBtn.addEventListener('click', () => {
        const direction = camera.position.clone().normalize();
        camera.position.sub(direction.multiplyScalar(500));
    });
    zoomOutBtn.addEventListener('click', () => {
        const direction = camera.position.clone().normalize();
        camera.position.add(direction.multiplyScalar(500));
    });
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlayPause();
        }
        if (e.code === 'KeyG') {
            e.preventDefault();
            toggleGrid();
        }
        if (e.code === 'KeyO') {
            e.preventDefault();
            toggleOrbits();
        }
        if (e.code === 'KeyX') {
            e.preventDefault();
            recentreCamera();
        }
        if (e.code === 'ArrowUp') {
            e.preventDefault();
            camera.position.y += 100;
        }
        if (e.code === 'ArrowDown') {
            e.preventDefault();
            camera.position.y -= 100;
        }
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            camera.position.x -= 100;
        }
        if (e.code === 'ArrowRight') {
            e.preventDefault();
            camera.position.x += 100;
        }
    });
    animate();
}

function togglePlayPause() {
    isPaused = !isPaused;
    const playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.textContent = isPaused ? '▶' : '||';
}

function toggleGrid() {
    if (grid) {
        grid.visible = !grid.visible;
        const gridToggleBtn = document.getElementById('gridToggleBtn');
        gridToggleBtn.textContent = grid.visible ? '⊞' : '⊡';
    }
}

function toggleOrbits() {
    orbitsVisible = !orbitsVisible;
    orbitLines.forEach(orbit => {
        orbit.visible = orbitsVisible;
    });
    const orbitToggleBtn = document.getElementById('orbitToggleBtn');
    if (orbitToggleBtn) {
        orbitToggleBtn.textContent = orbitsVisible ? '◯' : '○';
    }
}

function recentreCamera() {
    camera.position.set(DEFAULT_CAMERA_POSITION.x, DEFAULT_CAMERA_POSITION.y, DEFAULT_CAMERA_POSITION.z);
    camera.lookAt(0, 0, 0);
    if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
    }
}

function updateOrbitLines() {
    orbitLines.forEach(orbit => {
        scene.remove(orbit);
    });
    orbitLines = [];
    createOrbitLine(BASE_ORBIT_RADII.mercury * orbitScaleMultiplier, 0x8C7853);
    createOrbitLine(BASE_ORBIT_RADII.venus * orbitScaleMultiplier, 0xFFC649);
    createOrbitLine(BASE_ORBIT_RADII.earth * orbitScaleMultiplier, 0x4A90E2);
    createOrbitLine(BASE_ORBIT_RADII.mars * orbitScaleMultiplier, 0xCD5C5C);
    createOrbitLine(BASE_ORBIT_RADII.jupiter * orbitScaleMultiplier, 0xFFA500);
    createOrbitLine(BASE_ORBIT_RADII.saturn * orbitScaleMultiplier, 0xDAA520);
    createOrbitLine(BASE_ORBIT_RADII.uranus * orbitScaleMultiplier, 0x4FD8EB);
    createOrbitLine(BASE_ORBIT_RADII.neptune * orbitScaleMultiplier, 0x4169E1);
}

function updatePlanetSizes() {
    const baseScales = {
        sun: 100,
        mercury: 0.03,
        venus: 15.0,
        earth: 15.0,
        mars: 7.5,
        jupiter: 0.75,
        saturn: 75.0,
        uranus: 0.195,
        neptune: 0.195
    };
    if (sun) sun.scale.setScalar(baseScales.sun * planetSizeMultiplier);
    if (mercury) mercury.scale.setScalar(baseScales.mercury * planetSizeMultiplier);
    if (venus) venus.scale.setScalar(baseScales.venus * planetSizeMultiplier);
    if (earth) earth.scale.setScalar(baseScales.earth * planetSizeMultiplier);
    if (mars) mars.scale.setScalar(baseScales.mars * planetSizeMultiplier);
    if (jupiter) jupiter.scale.setScalar(baseScales.jupiter * planetSizeMultiplier);
    if (saturn) saturn.scale.setScalar(baseScales.saturn * planetSizeMultiplier);
    if (uranus) uranus.scale.setScalar(baseScales.uranus * planetSizeMultiplier);
    if (neptune) neptune.scale.setScalar(baseScales.neptune * planetSizeMultiplier);
}

function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1667;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const starColors = [
        { r: 1.0, g: 1.0, b: 1.0 },
        { r: 1.0, g: 0.3, b: 0.3 },
        { r: 0.3, g: 0.5, b: 1.0 },
        { r: 0.3, g: 1.0, b: 0.5 }
    ];
    for (let i = 0; i < starCount; i++) {
        const radius = 400000 + Math.random() * 200000;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        const colorChoice = Math.random() < 0.8 ? starColors[0] : starColors[Math.floor(Math.random() * 4)];
        colors[i * 3] = colorChoice.r;
        colors[i * 3 + 1] = colorChoice.g;
        colors[i * 3 + 2] = colorChoice.b;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const starMaterial = new THREE.PointsMaterial({
        size: 100,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function createInfiniteGrid() {
    const gridSize = 20000;
    const gridDivisions = 100;
    const gridStep = gridSize / gridDivisions;
    grid = new THREE.Group();
    const gridHelper = new THREE.GridHelper(gridSize * 2, gridDivisions * 2, 0x444444, 0x222222);
    gridHelper.position.y = 0;
    grid.add(gridHelper);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    for (let x = -gridSize; x <= gridSize; x += gridStep * 10) {
        for (let z = -gridSize; z <= gridSize; z += gridStep * 10) {
            if (x === 0 && z === 0) continue;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'white';
            context.font = 'Bold 48px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(`${x},${z}`, canvas.width / 2, canvas.height / 2);
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(x, 5, z);
            sprite.scale.set(50, 25, 1);
            grid.add(sprite);
        }
    }
    scene.add(grid);
    grid.visible = false;
}

function loadSunModel() {
    const loader = new THREE.GLTFLoader();
    loader.load('/static/assets/sun.glb', function (gltf) {
        if (sun) {
            scene.remove(sun);
        }
        sun = gltf.scene;
        sun.scale.set(100, 100, 100);
        sun.position.set(0, 0, 0);
        sun.traverse((child) => {
            if (child.isMesh) {
                if (child.material) {
                    child.material.emissive = new THREE.Color(0xFDB813);
                    child.material.emissiveIntensity = 2;
                    child.material.color = new THREE.Color(0xFDB813);
                    child.material.needsUpdate = true;
                }
            }
        });
        scene.add(sun);
    });
}

function loadMercuryModel() {
    const loader = new THREE.GLTFLoader();
    const mercuryOrbitRadius = 2160;
    loader.load('/static/assets/mercury.glb', function (gltf) {
        mercury = gltf.scene;
        mercury.scale.set(0.01, 0.01, 0.01);
        mercury.position.set(mercuryOrbitRadius, 0, 0);
        scene.add(mercury);
        createOrbitLine(mercuryOrbitRadius, 0x8C7853);
    });
}

function loadVenusModel() {
    const loader = new THREE.GLTFLoader();
    const venusOrbitRadius = 3170;
    loader.load('/static/assets/venus.glb', function (gltf) {
        venus = gltf.scene;
        venus.scale.set(5.0, 5.0, 5.0);
        venus.position.set(venusOrbitRadius, 0, 0);
        scene.add(venus);
        createOrbitLine(venusOrbitRadius, 0xFFC649);
    });
}

function loadEarthModel() {
    const loader = new THREE.GLTFLoader();
    const earthOrbitRadius = 4000;
    loader.load('/static/assets/earth.glb', function (gltf) {
        earth = gltf.scene;
        earth.scale.set(5.0, 5.0, 5.0);
        earth.position.set(earthOrbitRadius, 0, 0);
        scene.add(earth);
        createOrbitLine(earthOrbitRadius, 0x4A90E2);
    });
}

function loadMarsModel() {
    const loader = new THREE.GLTFLoader();
    const marsOrbitRadius = 5570;
    loader.load('/static/assets/mars.glb', function (gltf) {
        mars = gltf.scene;
        mars.scale.set(2.5, 2.5, 2.5);
        mars.position.set(marsOrbitRadius, 0, 0);
        scene.add(mars);
        createOrbitLine(marsOrbitRadius, 0xCD5C5C);
    });
}

function loadJupiterModel() {
    const loader = new THREE.GLTFLoader();
    const jupiterOrbitRadius = 16600;
    loader.load('/static/assets/jupiter.glb', function (gltf) {
        jupiter = gltf.scene;
        jupiter.scale.set(0.25, 0.25, 0.25);
        jupiter.position.set(jupiterOrbitRadius, 0, 0);
        scene.add(jupiter);
        createOrbitLine(jupiterOrbitRadius, 0xFFA500);
    });
}

function loadSaturnModel() {
    const loader = new THREE.GLTFLoader();
    const saturnOrbitRadius = 29600;
    loader.load('/static/assets/saturn.glb', function (gltf) {
        saturn = gltf.scene;
        saturn.scale.set(25.0, 25.0, 25.0);
        saturn.position.set(saturnOrbitRadius, 0, 0);
        scene.add(saturn);
        createOrbitLine(saturnOrbitRadius, 0xDAA520);
    });
}

function loadUranusModel() {
    const loader = new THREE.GLTFLoader();
    const uranusOrbitRadius = 58500;
    loader.load('/static/assets/uranus.glb', function (gltf) {
        uranus = gltf.scene;
        uranus.scale.set(0.065, 0.065, 0.065);
        uranus.position.set(uranusOrbitRadius, 0, 0);
        uranus.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(uranus);
        createOrbitLine(uranusOrbitRadius, 0x4FD8EB);
    });
}

function loadNeptuneModel() {
    const loader = new THREE.GLTFLoader();
    const neptuneOrbitRadius = 91100;
    loader.load('/static/assets/neptune.glb', function (gltf) {
        neptune = gltf.scene;
        neptune.scale.set(0.065, 0.065, 0.065);
        neptune.position.set(neptuneOrbitRadius, 0, 0);
        neptune.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(neptune);
        createOrbitLine(neptuneOrbitRadius, 0x4169E1);
    });
}

function createOrbitLine(radius, color) {
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    orbitGeometry.setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
    });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    orbitLines.push(orbit);
    scene.add(orbit);
}

function createFallbackSun() {
    const sunGeometry = new THREE.SphereGeometry(80, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 2
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 0, 0);
    scene.add(sun);
    const sunGlow = new THREE.Mesh(
        new THREE.SphereGeometry(100, 64, 64),
        new THREE.MeshBasicMaterial({
            color: 0xFFAA00,
            transparent: true,
            opacity: 0.3
        })
    );
    sun.add(sunGlow);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (!isPaused) {
        if (sun) {
            sun.rotation.y += 0.003;
        }
        if (mercury) {
            mercuryOrbitAngle += 0.01;
            const mercuryOrbitRadius = BASE_ORBIT_RADII.mercury * orbitScaleMultiplier;
            mercury.position.x = Math.cos(mercuryOrbitAngle) * mercuryOrbitRadius;
            mercury.position.z = Math.sin(mercuryOrbitAngle) * mercuryOrbitRadius;
            mercury.rotation.y += 0.005;
        }
        if (venus) {
            venusOrbitAngle += 0.007;
            const venusOrbitRadius = BASE_ORBIT_RADII.venus * orbitScaleMultiplier;
            venus.position.x = Math.cos(venusOrbitAngle) * venusOrbitRadius;
            venus.position.z = Math.sin(venusOrbitAngle) * venusOrbitRadius;
            venus.rotation.y += 0.003;
        }
        if (earth) {
            earthOrbitAngle += 0.005;
            const earthOrbitRadius = BASE_ORBIT_RADII.earth * orbitScaleMultiplier;
            earth.position.x = Math.cos(earthOrbitAngle) * earthOrbitRadius;
            earth.position.z = Math.sin(earthOrbitAngle) * earthOrbitRadius;
            earth.rotation.y += 0.01;
        }
        if (mars) {
            marsOrbitAngle += 0.003;
            const marsOrbitRadius = BASE_ORBIT_RADII.mars * orbitScaleMultiplier;
            mars.position.x = Math.cos(marsOrbitAngle) * marsOrbitRadius;
            mars.position.z = Math.sin(marsOrbitAngle) * marsOrbitRadius;
            mars.rotation.y += 0.008;
        }
        if (jupiter) {
            jupiterOrbitAngle += 0.002;
            const jupiterOrbitRadius = BASE_ORBIT_RADII.jupiter * orbitScaleMultiplier;
            jupiter.position.x = Math.cos(jupiterOrbitAngle) * jupiterOrbitRadius;
            jupiter.position.z = Math.sin(jupiterOrbitAngle) * jupiterOrbitRadius;
            jupiter.rotation.y += 0.015;
        }
        if (saturn) {
            saturnOrbitAngle += 0.0015;
            const saturnOrbitRadius = BASE_ORBIT_RADII.saturn * orbitScaleMultiplier;
            saturn.position.x = Math.cos(saturnOrbitAngle) * saturnOrbitRadius;
            saturn.position.z = Math.sin(saturnOrbitAngle) * saturnOrbitRadius;
            saturn.rotation.y += 0.012;
        }
        if (uranus) {
            uranusOrbitAngle += 0.001;
            const uranusOrbitRadius = BASE_ORBIT_RADII.uranus * orbitScaleMultiplier;
            uranus.position.x = Math.cos(uranusOrbitAngle) * uranusOrbitRadius;
            uranus.position.z = Math.sin(uranusOrbitAngle) * uranusOrbitRadius;
            uranus.rotation.y += 0.01;
        }
        if (neptune) {
            neptuneOrbitAngle += 0.0008;
            const neptuneOrbitRadius = BASE_ORBIT_RADII.neptune * orbitScaleMultiplier;
            neptune.position.x = Math.cos(neptuneOrbitAngle) * neptuneOrbitRadius;
            neptune.position.z = Math.sin(neptuneOrbitAngle) * neptuneOrbitRadius;
            neptune.rotation.y += 0.009;
        }
    }
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);
