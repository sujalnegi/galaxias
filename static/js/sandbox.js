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
    camera.position.set(0, 3000, 3000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 100;
    controls.maxDistance = 50000;
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemisphereLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(500, 1000, 750);
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0xffffff, 2.0, 50000);
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
    const customModelBtn = document.getElementById('customModelBtn');
    const customModelInput = document.getElementById('customModelInput');

    if (customModelBtn && customModelInput) {
        customModelBtn.addEventListener('click', () => {
            customModelInput.click();
        });

        customModelInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                const name = file.name.replace(/\.[^/.]+$/, ""); 
                loadCustomModel(url, name);
                customModelInput.value = '';
            }
        });
    }

    function setupModel(gltf, name) {
        const rawModel = gltf.scene;

        const box = new THREE.Box3().setFromObject(rawModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        rawModel.position.x -= center.x;
        rawModel.position.y -= center.y;
        rawModel.position.z -= center.z;

        const modelWrapper = new THREE.Group();
        modelWrapper.add(rawModel);
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 500;
        if (maxDim > 0) {
            const scaleFactor = targetSize / maxDim;
            modelWrapper.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }

        const dimX = size.x * modelWrapper.scale.x;
        const dimZ = size.z * modelWrapper.scale.z;
        const radius = Math.max(dimX, dimZ) / 2;

        modelWrapper.userData.name = name;
        modelWrapper.userData.isSelectable = true;
        modelWrapper.userData.originalScale = modelWrapper.scale.clone();
        modelWrapper.userData.radius = radius;
        modelWrapper.userData.isSpinning = false;
        modelWrapper.userData.isOrbiting = false;
        modelWrapper.userData.animationSpeed = 1.0;

        const positionOffset = 3000;
        let validPosition = false;
        let attempts = 0;
        const maxAttempts = 100;
        let finalX = 0, finalZ = 0;

        while (!validPosition && attempts < maxAttempts) {
            const x = (Math.random() - 0.5) * positionOffset;
            const z = (Math.random() - 0.5) * positionOffset;

            validPosition = true;
            scene.children.forEach(child => {
                if (child.userData.isSelectable && child !== modelWrapper) {
                    const dist = Math.sqrt(Math.pow(child.position.x - x, 2) + Math.pow(child.position.z - z, 2));
                    const minDistance = radius + (child.userData.radius || 0) + 50;
                    if (dist < minDistance) {
                        validPosition = false;
                    }
                }
            });

            if (validPosition) {
                finalX = x;
                finalZ = z;
            }
            attempts++;
        }

        modelWrapper.position.set(finalX, 0, finalZ);
        scene.add(modelWrapper);
        console.log(`Loaded ${name} at`, modelWrapper.position);

        recordAction({
            type: 'add',
            object: modelWrapper
        });

        selectObject(modelWrapper);
    }

    function loadModel(name) {
        const loader = new THREE.GLTFLoader();
        const fileName = name.toLowerCase().replace(' ', '_');

        loader.load(`/static/assets/${fileName}.glb`, function (gltf) {
            setupModel(gltf, name);
        }, undefined, function (error) {
            console.error('An error occurred loading the model:', error);
            alert(`Could not load ${name} model.`);
        });
    }

    function loadCustomModel(url, name) {
        const loader = new THREE.GLTFLoader();
        loader.load(url, function (gltf) {
            setupModel(gltf, name);
            URL.revokeObjectURL(url);
        }, undefined, function (error) {
            console.error('An error occurred loading the custom model:', error);
            alert(`Could not load custom model.`);
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
    const starToggleBtn = document.getElementById('starToggleBtn');
    if (starToggleBtn) {
        starToggleBtn.addEventListener('click', () => {
            starToggleBtn.classList.toggle('active');
            const isActive = starToggleBtn.classList.contains('active');
            if (starfield) starfield.visible = isActive;
        });
    }
    const gridToggleBtn = document.getElementById('gridToggleBtn');
    if (gridToggleBtn) {
        gridToggleBtn.addEventListener('click', () => {
            gridToggleBtn.classList.toggle('active');
            const isActive = gridToggleBtn.classList.contains('active');
            if (gridHelper) gridHelper.visible = isActive;
        });
    }
    const hideAllBtn = document.getElementById('hideAllBtn');
    let allVisible = true;

    function toggleAllVisibility() {
        const leftSidebar = document.getElementById('leftSidebar');
        const rightSidebar = document.getElementById('rightSidebar');
        const topSidebar = document.getElementById('topSidebar');
        const icon = hideAllBtn.querySelector('.material-icons');
        if (allVisible) {
            leftSidebar.classList.add('collapsed');
            rightSidebar.classList.add('collapsed');
            if (topSidebar) topSidebar.classList.add('collapsed');

            icon.textContent = 'visibility_off';
            hideAllBtn.classList.add('active');
            allVisible = false;
        } else {
            leftSidebar.classList.remove('collapsed');
            rightSidebar.classList.remove('collapsed');
            if (topSidebar) topSidebar.classList.remove('collapsed');

            icon.textContent = 'visibility';
            hideAllBtn.classList.remove('active');
            allVisible = true;
        }

        const leftToggleIcon = document.querySelector('#leftToggle i');
        if (leftToggleIcon) leftToggleIcon.className = leftSidebar.classList.contains('collapsed') ? 'fas fa-chevron-right' : 'fas fa-chevron-left';

        const rightToggleIcon = document.querySelector('#rightToggle i');
        if (rightToggleIcon) rightToggleIcon.className = rightSidebar.classList.contains('collapsed') ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
    }

    if (hideAllBtn) {
        hideAllBtn.addEventListener('click', toggleAllVisibility);
    }

    const recentreBtn = document.getElementById('recentreBtn');
    function resetCamera() {
        camera.position.set(0, 3000, 3000);
        camera.lookAt(0, 0, 0);
        if (controls) {
            controls.target.set(0, 0, 0);
            controls.update();
        }
    }
    if (recentreBtn) {
        recentreBtn.addEventListener('click', resetCamera);
    }

    const screenshotBtn = document.getElementById('screenshotBtn');
    const screenshotModal = document.getElementById('screenshotModal');
    const screenshotPreview = document.getElementById('screenshotPreview');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const downloadShotBtn = document.getElementById('downloadShotBtn');

    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', () => {
            const currentSelection = selectedObject;
            if (currentSelection) {
                deselectObject();
            }
            renderer.render(scene, camera);
            const dataURL = renderer.domElement.toDataURL('image/png');

            if (currentSelection) {
                selectObject(currentSelection);
            }

            if (screenshotPreview) {
                screenshotPreview.src = dataURL;
            }
            if (screenshotModal) {
                screenshotModal.style.display = 'block';
            }
        });
    }

    if (closeModalBtn && screenshotModal) {
        closeModalBtn.addEventListener('click', () => {
            screenshotModal.style.display = 'none';
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === screenshotModal) {
            screenshotModal.style.display = 'none';
        }
    });

    if (downloadShotBtn && screenshotPreview) {
        downloadShotBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'galaxias_simulation_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.png';
            link.href = screenshotPreview.src;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (screenshotModal) {
                screenshotModal.style.display = 'none';
            }
        });
    }
    const spinBtn = document.getElementById('spinBtn');
    const spinAllBtn = document.getElementById('spinAllBtn');

    if (spinBtn) {
        spinBtn.addEventListener('click', () => {
            if (selectedObject) {
                selectedObject.userData.isSpinning = !selectedObject.userData.isSpinning;
                updateSpinAndOrbitButtonsState();
            } else {
                alert('Select an object to spin');
            }
        });
    }

    if (spinAllBtn) {
        spinAllBtn.addEventListener('click', () => {
            isGlobalSpinning = !isGlobalSpinning;
            updateSpinAndOrbitButtonsState();
        });
    }
    const orbitBtn = document.getElementById('orbitBtn');
    const orbitAllBtn = document.getElementById('orbitAllBtn');

    if (orbitBtn) {
        orbitBtn.addEventListener('click', () => {
            if (selectedObject) {
                selectedObject.userData.isOrbiting = !selectedObject.userData.isOrbiting;
                updateSpinAndOrbitButtonsState();
            } else {
                alert('Select an object to orbit');
            }
        });
    }

    if (orbitAllBtn) {
        orbitAllBtn.addEventListener('click', () => {
            isGlobalOrbiting = !isGlobalOrbiting;
            updateSpinAndOrbitButtonsState();
        });
    }

    const centerObjBtn = document.getElementById('centerObjBtn');
    if (centerObjBtn) {
        centerObjBtn.addEventListener('click', () => {
            if (selectedObject) {

                selectedObject.position.set(0, 0, 0);
                updatePropertiesPanel();
                if (selectionHelper) selectionHelper.update();
            } else {
                alert('Select an object to center');
            }
        });
    }

    const topToggle = document.getElementById('topToggle');
    const topSidebar = document.getElementById('topSidebar');
    if (topToggle && topSidebar) {
        topToggle.addEventListener('click', () => {
            topSidebar.classList.toggle('collapsed');
        });
    }

    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (key === 'h') {
            toggleAllVisibility();
        } else if (key === 'g') {
            if (gridToggleBtn) gridToggleBtn.click();
        } else if (key === 's') {
            if (starToggleBtn) starToggleBtn.click();
        } else if (key === 'delete' || key === 'backspace' || key === 'd') {
            if (selectedObject) deleteSelectedObject();
        } else if (key === ' ') {
            isPaused = !isPaused;
        } else if (key === 'x') {
            resetCamera();
        }

        if (selectedObject) {
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                e.preventDefault();
            }
        }
    });
    const validKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
    const activeKeys = new Set();
    let movementFrameId = null;
    let keyHoldStartTime = 0;

    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (validKeys.includes(key) && !activeKeys.has(key)) {
            activeKeys.add(key);
            if (activeKeys.size === 1) {
                keyHoldStartTime = performance.now();
                if (selectedObject) {
                    currentTransformState = {
                        position: selectedObject.position.clone(),
                        scale: selectedObject.scale.clone()
                    };
                }
                startMovementLoop(e.ctrlKey, e.shiftKey);
            }
        }

        if ((e.ctrlKey || e.metaKey) && key === 'z') {
            e.preventDefault();
            undo();
        } else if ((e.ctrlKey || e.metaKey) && key === 'y') {
            e.preventDefault();
            redo();
        }
    });
    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (activeKeys.has(key)) {
            activeKeys.delete(key);
            if (activeKeys.size === 0) {
                stopMovementLoop();
            }
        }
    });
    window.addEventListener('blur', () => {
        activeKeys.clear();
        stopMovementLoop();
    });

    function startMovementLoop(isCtrlPressed, isShiftPressed) {
        if (movementFrameId) return;

        function updateLoop(timestamp) {
            if (!selectedObject || activeKeys.size === 0) {
                stopMovementLoop();
                return;
            }

            const duration = timestamp - keyHoldStartTime;
            let speedMultiplier = 1;
            if (duration > 200) {
                speedMultiplier = 1 + Math.pow((duration - 200) / 1000, 2) * 5;
            }
            speedMultiplier = Math.min(speedMultiplier, 50);

            const moveBase = 10;
            const scaleBase = 0.1;
            const currentMoveStep = moveBase * speedMultiplier;
            const currentScaleStep = scaleBase * speedMultiplier * 0.1;

            let changed = false;

            if (isCtrlPressed) {
                if (activeKeys.has('arrowup')) {
                    const newScale = selectedObject.scale.x + currentScaleStep;
                    selectedObject.scale.set(newScale, newScale, newScale);
                    changed = true;
                }
                if (activeKeys.has('arrowdown')) {
                    const newScale = Math.max(0.1, selectedObject.scale.x - currentScaleStep);
                    selectedObject.scale.set(newScale, newScale, newScale);
                    changed = true;
                }
            } else if (isShiftPressed) {
                if (activeKeys.has('arrowup')) {
                    selectedObject.position.y += currentMoveStep;
                    changed = true;
                }
                if (activeKeys.has('arrowdown')) {
                    selectedObject.position.y -= currentMoveStep;
                    changed = true;
                }
            } else {
                if (activeKeys.has('arrowup')) {
                    selectedObject.position.z -= currentMoveStep;
                    changed = true;
                }
                if (activeKeys.has('arrowdown')) {
                    selectedObject.position.z += currentMoveStep;
                    changed = true;
                }
                if (activeKeys.has('arrowleft')) {
                    selectedObject.position.x -= currentMoveStep;
                    changed = true;
                }
                if (activeKeys.has('arrowright')) {
                    selectedObject.position.x += currentMoveStep;
                    changed = true;
                }
            }

            if (changed) {
                if (selectionHelper) selectionHelper.update();
                updatePropertiesPanel();
            }
            movementFrameId = requestAnimationFrame(updateLoop);
        }
        movementFrameId = requestAnimationFrame(updateLoop);
    }
}
const historyStack = [];
const redoStack = [];
let currentTransformState = null;

function recordAction(action) {
    historyStack.push(action);
    redoStack.length = 0; 
    console.log('Action recorded:', action.type);
}

function undo() {
    if (historyStack.length === 0) return;
    const action = historyStack.pop();
    redoStack.push(action);

    switch (action.type) {
        case 'add':
            scene.remove(action.object);
            if (selectedObject === action.object) deselectObject();
            break;
        case 'delete':
            scene.add(action.object);
            selectObject(action.object);
            break;
        case 'transform':
            if (action.object) {
                action.object.position.copy(action.oldState.position);
                action.object.scale.copy(action.oldState.scale);
                if (selectionHelper) selectionHelper.update();
                updatePropertiesPanel();
            }
            break;
    }
    console.log('Undo:', action.type);
}

function redo() {
    if (redoStack.length === 0) return;
    const action = redoStack.pop();
    historyStack.push(action);

    switch (action.type) {
        case 'add':
            scene.add(action.object);
            selectObject(action.object);
            break;
        case 'delete':
            scene.remove(action.object);
            if (selectedObject === action.object) deselectObject();
            break;
        case 'transform':
            if (action.object) {
                action.object.position.copy(action.newState.position);
                action.object.scale.copy(action.newState.scale);
                if (selectionHelper) selectionHelper.update();
                updatePropertiesPanel();
            }
            break;
    }
    console.log('Redo:', action.type);
}

const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
if (undoBtn) undoBtn.addEventListener('click', undo);
if (redoBtn) redoBtn.addEventListener('click', redo);

function stopMovementLoop() {
    if (currentTransformState && selectedObject) {
        const newPos = selectedObject.position.clone();
        const newScale = selectedObject.scale.clone();

        if (!newPos.equals(currentTransformState.position) || !newScale.equals(currentTransformState.scale)) {
            recordAction({
                type: 'transform',
                object: selectedObject,
                oldState: currentTransformState,
                newState: {
                    position: newPos,
                    scale: newScale
                }
            });
        }
        currentTransformState = null;
    }
    if (movementFrameId) {
        cancelAnimationFrame(movementFrameId);
        movementFrameId = null;
    }
}
const propInputs = ['propX', 'propY', 'propZ', 'propScale', 'propScaleRange', 'propSpeedRange'];
propInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
        input.addEventListener('input', updateSelectedObjectProperties);
    }
});

const deleteBtn = document.getElementById('deleteBtn');
if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteSelectedObject);
}

const globalSpeedRange = document.getElementById('globalSpeedRange');
const globalSpeedValue = document.getElementById('globalSpeedValue');
if (globalSpeedRange) {
    globalSpeedRange.addEventListener('input', function () {
        globalAnimationSpeed = parseFloat(this.value);
        if (globalSpeedValue) globalSpeedValue.textContent = globalAnimationSpeed.toFixed(2);
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
    updatePropertiesPanel();
    updateSpinAndOrbitButtonsState();
}
function selectObject(object) {
    if (selectedObject) {
        if (selectedObject === object) return;
        deselectObject();
    }
    selectedObject = object;

    selectionHelper = new THREE.BoxHelper(object, 0xffff00);
    scene.add(selectionHelper);

    const propTabBtn = document.querySelector('.tab-btn[data-tab="objectTab"]');
    if (propTabBtn) propTabBtn.click();

    updatePropertiesPanel();
    updateSpinAndOrbitButtonsState();
}

function updatePropertiesPanel() {
    const panel = document.getElementById('propertiesPanel');
    const noSelection = document.getElementById('noSelectionMsg');
    const nameEl = document.getElementById('propName');
    const xEl = document.getElementById('propX');
    const yEl = document.getElementById('propY');
    const zEl = document.getElementById('propZ');
    const scaleEl = document.getElementById('propScale');

    if (selectedObject) {
        if (panel) panel.style.display = 'block';
        if (noSelection) noSelection.style.display = 'none';

        if (nameEl) nameEl.textContent = selectedObject.userData.name || 'Object';
        if (xEl) xEl.value = Math.round(selectedObject.position.x);
        if (yEl) yEl.value = Math.round(selectedObject.position.y);
        if (zEl) zEl.value = Math.round(selectedObject.position.z);
        if (scaleEl) {
            scaleEl.value = selectedObject.scale.x;
            const rangeEl = document.getElementById('propScaleRange');
            if (rangeEl) rangeEl.value = selectedObject.scale.x;
            if (rangeEl) rangeEl.value = selectedObject.scale.x;
        }
        const speedRange = document.getElementById('propSpeedRange');
        const speedValue = document.getElementById('propSpeedValue');
        if (speedRange) {
            speedRange.value = selectedObject.userData.animationSpeed || 1.0;
            if (speedValue) speedValue.textContent = (selectedObject.userData.animationSpeed || 1.0).toFixed(2);
        }

    } else {
        if (panel) panel.style.display = 'none';
        if (noSelection) noSelection.style.display = 'block';
    }
}
function updateSelectedObjectProperties() {
    if (!selectedObject) return;

    const xEl = document.getElementById('propX');
    const yEl = document.getElementById('propY');
    const zEl = document.getElementById('propZ');
    const scaleEl = document.getElementById('propScale');
    if (xEl && yEl && zEl) {
        selectedObject.position.set(
            parseFloat(xEl.value) || 0,
            parseFloat(yEl.value) || 0,
            parseFloat(zEl.value) || 0
        );
    }

    if (scaleEl) {
        let scale = parseFloat(scaleEl.value) || 1;
        const rangeEl = document.getElementById('propScaleRange');

        if (this && this.id === 'propScaleRange') {
            scale = parseFloat(this.value);
            scaleEl.value = scale;
        } else if (rangeEl) {
            rangeEl.value = scale;
        }

        selectedObject.scale.set(scale, scale, scale);
    }
    const speedRange = document.getElementById('propSpeedRange');
    const speedValue = document.getElementById('propSpeedValue');
    if (speedRange && this && this.id === 'propSpeedRange') {
        const speed = parseFloat(speedRange.value);
        selectedObject.userData.animationSpeed = speed;
        if (speedValue) speedValue.textContent = speed.toFixed(2);
    }

    if (selectionHelper) selectionHelper.update();
}

function deleteSelectedObject() {
    if (!selectedObject) return;

    recordAction({
        type: 'delete',
        object: selectedObject
    });

    scene.remove(selectedObject);
    deselectObject();
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

let isGlobalSpinning = false;
let isGlobalOrbiting = false;
let isPaused = false;
let globalAnimationSpeed = 1.0;

function updateSpinAndOrbitButtonsState() {
    const spinBtn = document.getElementById('spinBtn');
    const spinAllBtn = document.getElementById('spinAllBtn');
    const orbitBtn = document.getElementById('orbitBtn');
    const orbitAllBtn = document.getElementById('orbitAllBtn');
    if (spinBtn) {
        if (selectedObject && selectedObject.userData.isSpinning) {
            spinBtn.classList.add('active');
            spinBtn.style.borderColor = '#FF9F43';
        } else {
            spinBtn.classList.remove('active');
            spinBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
    }
    if (spinAllBtn) {
        if (isGlobalSpinning) {
            spinAllBtn.classList.add('active');
            spinAllBtn.style.borderColor = '#FF9F43';
        } else {
            spinAllBtn.classList.remove('active');
            spinAllBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
    }

    if (orbitBtn) {
        if (selectedObject && selectedObject.userData.isOrbiting) {
            orbitBtn.classList.add('active');
            orbitBtn.style.borderColor = '#FF9F43';
        } else {
            orbitBtn.classList.remove('active');
            orbitBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
    }
    if (orbitAllBtn) {
        if (isGlobalOrbiting) {
            orbitAllBtn.classList.add('active');
            orbitAllBtn.style.borderColor = '#FF9F43';
        } else {
            orbitAllBtn.classList.remove('active');
            orbitAllBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (!isPaused) {
        scene.children.forEach(child => {
            const animSpeed = (child.userData.animationSpeed || 1.0) * globalAnimationSpeed;
            if ((child.userData.isSelectable && isGlobalSpinning) || child.userData.isSpinning) {
                child.rotation.y += 0.01 * animSpeed;
            }

            if ((child.userData.isSelectable && isGlobalOrbiting) || child.userData.isOrbiting) {
                const baseSpeed = 0.005;
                const speed = baseSpeed * animSpeed;
                const x = child.position.x;
                const z = child.position.z;

                child.position.x = x * Math.cos(speed) - z * Math.sin(speed);
                child.position.z = x * Math.sin(speed) + z * Math.cos(speed);
            }

            if (selectedObject === child && selectionHelper) {
                selectionHelper.update();
            }
        });
    }

    controls.update();
    renderer.render(scene, camera);
}
document.addEventListener('DOMContentLoaded', init);