let scene, camera, renderer, controls;
let sun, mercury, venus, earth, mars, jupiter;
let mercuryOrbitAngle = 0;
let venusOrbitAngle = 0;
let earthOrbitAngle = 0;
let marsOrbitAngle = 0;
let jupiterOrbitAngle = 0;
let isPaused = false;
let grid = null;
let planetSizeMultiplier = 1.0;
function init() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFFFFF);
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000000
    );
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
    createInfiniteGrid();
    createFallbackSun();
    if (typeof THREE.GLTFLoader !== 'undefined') {
        loadSunModel();
        loadMercuryModel();
        loadVenusModel();
        loadEarthModel();
        loadMarsModel();
        loadJupiterModel();
    } else {
        console.warn('GLTFLoader not available, using fallback sun');
    }
    window.addEventListener('resize', onWindowResize);
    const playPauseBtn = document.getElementById('playPauseBtn');
    const gridToggleBtn = document.getElementById('gridToggleBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const planetSizeIncreaseBtn = document.getElementById('planetSizeIncreaseBtn');
    const planetSizeDecreaseBtn = document.getElementById('planetSizeDecreaseBtn');

    playPauseBtn.addEventListener('click', togglePlayPause);
    gridToggleBtn.addEventListener('click', toggleGrid);

    planetSizeIncreaseBtn.addEventListener('click', () => {
        planetSizeMultiplier *= 1.2;
        updatePlanetSizes();
    });

    planetSizeDecreaseBtn.addEventListener('click', () => {
        planetSizeMultiplier *= 0.8;
        updatePlanetSizes();
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

function updatePlanetSizes() {
    const baseScales = {
        mercury: 0.01,
        venus: 5.0,
        earth: 5.0,
        mars: 2.5,
        jupiter: 0.25
    };

    if (mercury) mercury.scale.setScalar(baseScales.mercury * planetSizeMultiplier);
    if (venus) venus.scale.setScalar(baseScales.venus * planetSizeMultiplier);
    if (earth) earth.scale.setScalar(baseScales.earth * planetSizeMultiplier);
    if (mars) mars.scale.setScalar(baseScales.mars * planetSizeMultiplier);
    if (jupiter) jupiter.scale.setScalar(baseScales.jupiter * planetSizeMultiplier);
}

function createInfiniteGrid() {
    const gridSize = 10000;
    const gridDivisions = 100;
    const gridStep = gridSize / gridDivisions;
    grid = new THREE.Group();
    const gridHelper = new THREE.GridHelper(gridSize * 2, gridDivisions * 2, 0x444444, 0x222222);
    gridHelper.position.y = 0;
    grid.add(gridHelper);
    const loader = new THREE.FontLoader();
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
}
function loadSunModel() {
    const loader = new THREE.GLTFLoader();
    loader.load(
        '/static/assets/sun.glb',
        function (gltf) {
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
        },
        function (xhr) {

        },
        function (error) {
            console.error('');
        }
    );
}
function loadMercuryModel() {
    const loader = new THREE.GLTFLoader();
    const mercuryOrbitRadius = 1500;
    loader.load(
        '/static/assets/mercury.glb',
        function (gltf) {
            mercury = gltf.scene;
            mercury.scale.set(0.01, 0.01, 0.01);
            mercury.position.set(mercuryOrbitRadius, 0, 0);
            mercury.traverse((child) => {
                if (child.isMesh) {
                }
            });
            scene.add(mercury);
            createOrbitLine(mercuryOrbitRadius, 0x8C7853);
        },
        function (xhr) {
        },
        function (error) {
            console.error('');
        }
    );
}
function loadVenusModel() {
    const loader = new THREE.GLTFLoader();
    const venusOrbitRadius = 2300;
    console.log('🪐 Attempting to load venus.glb...');
    loader.load(
        '/static/assets/venus.glb',
        function (gltf) {
            venus = gltf.scene;
            venus.scale.set(5.0, 5.0, 5.0);
            venus.position.set(venusOrbitRadius, 0, 0);
            venus.traverse((child) => {
                if (child.isMesh) {
                }
            });
            scene.add(venus);
            createOrbitLine(venusOrbitRadius, 0xFFC649);
        },
        function (xhr) {

        },
        function (error) {
            console.error('');
        }
    );
}
function loadEarthModel() {
    const loader = new THREE.GLTFLoader();
    const earthOrbitRadius = 3000;

    loader.load(
        '/static/assets/earth.glb',
        function (gltf) {

            earth = gltf.scene;

            earth.scale.set(5.0, 5.0, 5.0);
            earth.position.set(earthOrbitRadius, 0, 0);

            earth.traverse((child) => {
                if (child.isMesh) {
                }
            });
            scene.add(earth);
            createOrbitLine(earthOrbitRadius, 0x4A90E2);
        },
        function (xhr) {
        },
        function (error) {
            console.error('');
        }
    );
}
function loadMarsModel() {
    const loader = new THREE.GLTFLoader();
    const marsOrbitRadius = 4500;
    loader.load(
        '/static/assets/mars.glb',
        function (gltf) {
            mars = gltf.scene;
            mars.scale.set(2.5, 2.5, 2.5);
            mars.position.set(marsOrbitRadius, 0, 0);
            mars.traverse((child) => {
                if (child.isMesh) {
                }
            });
            scene.add(mars);
            createOrbitLine(marsOrbitRadius, 0xCD5C5C);
        },
        function (xhr) {
        },
        function (error) {
            console.error('');
        }
    );
}
function loadJupiterModel() {
    const loader = new THREE.GLTFLoader();
    const jupiterOrbitRadius = 7000;
    loader.load(
        '/static/assets/jupiter.glb',
        function (gltf) {
            jupiter = gltf.scene;
            jupiter.scale.set(0.25, 0.25, 0.25);
            jupiter.position.set(jupiterOrbitRadius, 0, 0);
            jupiter.traverse((child) => {
                if (child.isMesh) {
                }
            });
            scene.add(jupiter);
            createOrbitLine(jupiterOrbitRadius, 0xFFA500);
        },
        function (xhr) {
        },
        function (error) {
            console.error('');
        }
    );
}
function createOrbitLine(radius, color) {
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];

    for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        orbitPoints.push(
            new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            )
        );
    }
    orbitGeometry.setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
    });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbit);
}
function createFallbackSun() {
    console.log('🌞 Creating fallback sun sphere...');

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
            const mercuryOrbitRadius = 1500;
            mercury.position.x = Math.cos(mercuryOrbitAngle) * mercuryOrbitRadius;
            mercury.position.z = Math.sin(mercuryOrbitAngle) * mercuryOrbitRadius;
            mercury.rotation.y += 0.005;
        }
        if (venus) {
            venusOrbitAngle += 0.007;
            const venusOrbitRadius = 2300;
            venus.position.x = Math.cos(venusOrbitAngle) * venusOrbitRadius;
            venus.position.z = Math.sin(venusOrbitAngle) * venusOrbitRadius;
            venus.rotation.y += 0.003;
        }
        if (earth) {
            earthOrbitAngle += 0.005;
            const earthOrbitRadius = 3000;
            earth.position.x = Math.cos(earthOrbitAngle) * earthOrbitRadius;
            earth.position.z = Math.sin(earthOrbitAngle) * earthOrbitRadius;
            earth.rotation.y += 0.01;
        }
        if (mars) {
            marsOrbitAngle += 0.003;
            const marsOrbitRadius = 4500;
            mars.position.x = Math.cos(marsOrbitAngle) * marsOrbitRadius;
            mars.position.z = Math.sin(marsOrbitAngle) * marsOrbitRadius;
            mars.rotation.y += 0.008;
        }
        if (jupiter) {
            jupiterOrbitAngle += 0.002;
            const jupiterOrbitRadius = 7000;
            jupiter.position.x = Math.cos(jupiterOrbitAngle) * jupiterOrbitRadius;
            jupiter.position.z = Math.sin(jupiterOrbitAngle) * jupiterOrbitRadius;
            jupiter.rotation.y += 0.015;
        }
    }
    renderer.render(scene, camera);
}
document.addEventListener('DOMContentLoaded', init);