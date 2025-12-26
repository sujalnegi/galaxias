let scene, camera, renderer, controls;
let sun, mercury, venus;
let mercuryOrbitAngle = 0;
let venusOrbitAngle = 0;
let isPaused = false;

function init() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

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
    } else {
        console.warn('GLTFLoader not available, using fallback sun');
    }

    window.addEventListener('resize', onWindowResize);

    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');

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
    });

    animate();
}

function togglePlayPause() {
    isPaused = !isPaused;
    const playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.textContent = isPaused ? '▶' : '||';
}

function createInfiniteGrid() {
    const gridSize = 10000;
    const gridDivisions = 100;
    const gridStep = gridSize / gridDivisions;

    const gridHelper = new THREE.GridHelper(gridSize * 2, gridDivisions * 2, 0x444444, 0x222222);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

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
            scene.add(sprite);
        }
    }


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

            mercury.scale.set(0.05, 0.05, 0.05);
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

            venus.scale.set(2.0, 2.0, 2.0);
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

    renderer.render(scene, camera);
}
document.addEventListener('DOMContentLoaded', init);

/*
tap of tiffany 
vickey eventually i did it 
just injected drugs 
audience out sorce of this it works not very hard  
vecna he was here  after school i thi libraryi used to live in this house memory to memory he shuffles bingo caught  henry holly  selfish u beein 
i m done  alot of books are here it does take time to log 



*/ 