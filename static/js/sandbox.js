let scene, camera, renderer, controls, selectedObject, selectionHelper, starfield;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
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
    preloadAssets();
}
function preloadAssets() {
    const loadingScreen = document.getElementById('loading-screen');
    const progressBar = document.getElementById('progressBar');
    const loadingText = document.getElementById('loadingText');
    const manager = new THREE.LoadingManager();

    manager.onProgress = function (url, itemsLoaded, itemsTotal) {
        const progress = (itemsLoaded / itemsTotal) * 100;
        if (progressBar) progressBar.style.width = progress + '%';
        if (loadingText) loadingText.textContent = `Loading asset ${itemsLoaded} of ${itemsTotal}`;
    };

    manager.onLoad = function () {
        if (loadingText) loadingText.textContent = 'Ready!';
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 500);
    };

    const loader = new THREE.GLTFLoader(manager);
    const planetsKey = ['mercury', 'venus', 'earth', 'mars', 'jupiter'];

    planetsKey.forEach(name => {
        loader.load(`/static/assets/${name}.glb`, (gltf) => {
        }, undefined, (err) => {
            console.warn(`Failed to preload ${name}`, err);
        });
    });
}
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = Math.floor(10000 / 3);
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
    starfield = new THREE.Points(starGeometry, starMaterial);
    scene.add(starfield);
}
let gridHelper;
function createGrid() {
    const size = 40000;
    const divisions = 100;
    gridHelper = new THREE.GridHelper(size, divisions, 0x444444, 0x222222);
    gridHelper.visible = true;
    scene.add(gridHelper);
}
function setupEventListeners() {
    renderer.domElement.addEventListener('click', onMouseClick);
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
            loadModel(name);
        });
    });

    const colorBtns = document.querySelectorAll('.color-circle');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const color = e.target.dataset.color;
            scene.background = new THREE.Color(color);
            updateStarContrast(color);
        });
    });
    const gridToggle = document.getElementById('gridToggle');
    if (gridToggle) {
        gridToggle.addEventListener('change', () => {
            if (gridHelper) gridHelper.visible = gridToggle.checked;
        });
    }


    function loadModel(name) {
        const loader = new THREE.GLTFLoader();
        const fileName = name.toLowerCase().replace(' ', '_');

        let scale = 1;
        if (name === 'Sun') scale = 50;
        else if (name === 'Dwarf Star') scale = 25;
        else if (name === 'Jupiter' || name === 'Saturn') scale = 10;
        else if (name === 'Uranus' || name === 'Neptune') scale = 5;
        else scale = 1;

        loader.load(`/static/assets/${fileName}.glb`, function (gltf) {
            const model = gltf.scene;
            model.scale.set(scale, scale, scale);
            const positionOffset = 500;
            model.position.set(
                (Math.random() - 0.5) * positionOffset,
                0,
                (Math.random() - 0.5) * positionOffset
            );

            model.userData.isSelectable = true;
            model.userData.name = name;

            scene.add(model);
            console.log(`Loaded ${name} at`, model.position);
            selectObject(model);
        }, undefined, function (error) {
            console.error(`Error loading ${name}:`, error);
            alert(`Could not load ${name} model.`);
        });
    }
    const starToggle = document.getElementById('starToggle');
    if (starToggle) {
        starToggle.addEventListener('change', () => {
            if (starfield) starfield.visible = starToggle.checked;
        });
    }
    const customColorBtn = document.getElementById('customColorBtn');
    if (customColorBtn) {
        customColorBtn.addEventListener('click', () => {
            const hexColor = prompt('Enter a hex color code (e.g., #FF5733):');
            if (hexColor && /^#[0-9A-F]{6}$/i.test(hexColor)) {
                scene.background = new THREE.Color(hexColor);
                updateStarContrast(hexColor);
            } else if (hexColor) {
                alert('Invalid hex color code. Please use format: #RRGGBB');
            }
        });
    }

    const leftSidebar = document.getElementById('leftSidebar');
    const leftToggle = document.getElementById('leftToggle');
    if (leftToggle && leftSidebar) {
        leftToggle.addEventListener('click', () => {
            leftSidebar.classList.toggle('collapsed');
            const isCollapsed = leftSidebar.classList.contains('collapsed');
            const icon = leftToggle.querySelector('i');
            if (isCollapsed) {
                icon.className = 'fas fa-chevron-right';
            } else {
                icon.className = 'fas fa-chevron-left';
            }
        });
    }

    const rightSidebar = document.getElementById('rightSidebar');
    const rightToggle = document.getElementById('rightToggle');
    if (rightToggle && rightSidebar) {
        rightToggle.addEventListener('click', () => {
            rightSidebar.classList.toggle('collapsed');
            const isCollapsed = rightSidebar.classList.contains('collapsed');
            const icon = rightToggle.querySelector('i');
            if (isCollapsed) {
                icon.className = 'fas fa-chevron-left';
            } else {
                icon.className = 'fas fa-chevron-right';
            }
        });
    }

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => content.style.display = 'none');

            const targetId = btn.dataset.tab;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateStarContrast(colorHex) {
    if (!starfield) return;
    const color = new THREE.Color(colorHex);
    const luminance = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
    starfield.material.color.setHex(luminance > 0.5 ? 0x000000 : 0xffffff);
}
function deselectObject() {
    if (selectionHelper) {
        scene.remove(selectionHelper);
        selectionHelper = null;
    }
    selectedObject = null;
}
function selectObject(object) {
    if (selectedObject) {
        if (selectedObject === object) return;
        deselectObject();
    }
    selectedObject = object;

    selectionHelper = new THREE.BoxHelper(object, 0xffff00);
    scene.add(selectionHelper);
}

function onMouseClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        let target = intersects[0].object;
        while (target.parent && target.parent !== scene && !target.userData.isSelectable) {
            target = target.parent;
        }
        if (target.userData.isSelectable) {
            if (selectedObject === target) {
                deselectObject();
            } else {
                selectObject(target);
            }
            return;
        }
    }

    deselectObject();
}
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
document.addEventListener('DOMContentLoaded', init);