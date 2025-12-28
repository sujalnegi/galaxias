let scene, camera, renderer, controls;
function init() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        100000
    );
    camera.position.set(0, 500, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 100;
    controls.maxDistance = 50000;
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
    createStarfield();
    createGrid();
    window.addEventListener('resize', onWindowResize);
    setupEventListeners();
    animate();
}
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 50000;
        positions[i + 1] = (Math.random() - 0.5) * 50000;
        positions[i + 2] = (Math.random() - 0.5) * 50000;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        sizeAttenuation: true
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}
let gridHelper;
function createGrid() {
    const size = 10000;
    const divisions = 50;
    gridHelper = new THREE.GridHelper(size, divisions, 0x444444, 0x222222);
    gridHelper.visible = false;
    scene.add(gridHelper);
}
function setupEventListeners() {
    const backBtn = document.getElementById('backBtn');
    const resetBtn = document.getElementById('resetBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/simulation';
        });
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            location.reload();
        });
    }
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const type = e.target.dataset.type;
            const name = e.target.dataset.name;
            console.log(`Adding ${type}: ${name}`);
        });
    });
    const colorBtns = document.querySelectorAll('.color-circle');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const color = e.target.dataset.color;
            scene.background = new THREE.Color(color);
        });
    });
    const starToggle = document.getElementById('starToggle');
    let starsVisible = true;
    const starfield = scene.children.find(child => child.type === 'Points');
    if (starToggle) {
        starToggle.addEventListener('click', () => {
            starsVisible = !starsVisible;
            if (starfield) starfield.visible = starsVisible;
            starToggle.textContent = starsVisible ? 'Hide Stars' : 'Show Stars';
        });
    }
    const customColorBtn = document.getElementById('customColorBtn');
    if (customColorBtn) {
        customColorBtn.addEventListener('click', () => {
            const hexColor = prompt('Enter a hex color code (e.g., #FF5733):');
            if (hexColor && /^#[0-9A-F]{6}$/i.test(hexColor)) {
                scene.background = new THREE.Color(hexColor);
            } else if (hexColor) {
                alert('Invalid hex color code. Please use format: #RRGGBB');
            }
        });
    }
    const gridToggle = document.getElementById('gridToggle');
    let gridVisible = false;
    if (gridToggle) {
        gridToggle.addEventListener('click', () => {
            gridVisible = !gridVisible;
            if (gridHelper) gridHelper.visible = gridVisible;
            gridToggle.textContent = gridVisible ? 'Hide Grid' : 'Show Grid';
        });
    }
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
document.addEventListener('DOMContentLoaded', init);