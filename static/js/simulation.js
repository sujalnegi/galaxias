let scene, camera, renderer, controls;
let sun;

function init() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );
    camera.position.set(0, 50, 200);
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

    createFallbackSun();

    if (typeof THREE.GLTFLoader !== 'undefined') {
        loadSunModel();
    } else {
        console.warn('GLTFLoader not available, using fallback sun');
    }

    window.addEventListener('resize', onWindowResize);

    animate();
}

function loadSunModel() {
    const loader = new THREE.GLTFLoader();

    console.log('🌟 Attempting to load sun.glb...');

    loader.load(
        '/static/assets/sun.glb',
        function (gltf) {
            console.log('✅ GLB file loaded successfully!');

            if (sun) {
                scene.remove(sun);
                console.log('Removed fallback sun');
            }

            sun = gltf.scene;

            sun.scale.set(100, 100, 100);
            sun.position.set(0, 0, 0);

            sun.traverse((child) => {
                if (child.isMesh) {
                    console.log('Found mesh:', child.name);
                    if (child.material) {
                        child.material.emissive = new THREE.Color(0xFDB813);
                        child.material.emissiveIntensity = 2;
                        child.material.color = new THREE.Color(0xFDB813);
                        child.material.needsUpdate = true;
                    }
                }
            });

            const box = new THREE.Box3().setFromObject(sun);
            const size = box.getSize(new THREE.Vector3());
            console.log('📏 Model size:', size);
            console.log('📍 Model position:', sun.position);

            const boxHelper = new THREE.BoxHelper(sun, 0xff0000);
            scene.add(boxHelper);

            scene.add(sun);
            console.log('✅ Sun GLB model added to scene at center (0,0,0)');
        },
        function (xhr) {
            const percentComplete = (xhr.loaded / xhr.total * 100);
            console.log('⏳ Loading: ' + percentComplete.toFixed(2) + '%');
        },
        function (error) {
            console.error('❌ Error loading sun model:', error);
            console.log('Using fallback sun sphere');
        }
    );
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

    console.log('✅ Fallback sun sphere created at (0,0,0) with radius 80');
    console.log('Camera is at:', camera.position);
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

    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', init);