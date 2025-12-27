function createStarfield() {
    const starfield = document.getElementById('starfield');
    const numberOfStars = 300;
    const sizes = ['tiny', 'tiny', 'tiny', 'extra-small', 'extra-small', 'extra-small', 'small', 'small', 'medium', 'large', 'extra-large'];
    const tints = [
        '', '', '', '', '', '',
        'white-bright', 'white-bright', 'white-bright',
        'blue-tint', 'blue-tint',
        'gold-tint', 'gold-tint',
        'orange-tint',
        'red-tint',
        'green-tint'
    ];
    for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        const tint = tints[Math.floor(Math.random() * tints.length)];
        star.classList.add(size);
        if (tint) star.classList.add(tint);
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.animationDuration = `${2 + Math.random() * 3}s`;
        if (Math.random() > 0.5) {
            star.style.animation = `shine ${5 + Math.random() * 10}s infinite`;
            star.style.animationDelay = `${Math.random() * 5}s`;
        }
        if (Math.random() > 0.7) {
            star.style.filter = `blur(${Math.random() * 0.5}px)`;
        }
        starfield.appendChild(star);
    }
}
function createShootingStars() {
    const starfield = document.getElementById('starfield');
    setInterval(() => {
        if (Math.random() > 0.7) {
            const shootingStar = document.createElement('div');
            shootingStar.className = 'shooting-star';
            shootingStar.style.left = `${Math.random() * 100}%`;
            shootingStar.style.top = `${Math.random() * 50}%`;
            starfield.appendChild(shootingStar);
            setTimeout(() => {
                shootingStar.remove();
            }, 3000);
        }
    }, 2000);
}
function createParticles() {
    const container = document.querySelector('.container');
    const numberOfParticles = 20;
    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.bottom = '0';
        particle.style.animationDelay = `${Math.random() * 6}s`;
        particle.style.animationDuration = `${4 + Math.random() * 4}s`;
        container.appendChild(particle);
    }
}
function setupGoButton() {
    const goButton = document.getElementById('goButton');
    goButton.addEventListener('click', () => {
        goButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            goButton.style.transform = '';
            window.location.href = '/simulation';
        }, 1000);
    });
}
document.addEventListener('DOMContentLoaded', () => {
    createStarfield();
    createShootingStars();
    createParticles();
    setupGoButton();
    create3DStars();
});
function create3DStars() {
    const container = document.getElementById('stars-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
    let starsModel = null;
    const loader = new THREE.GLTFLoader();
    loader.load('/static/assets/stars.glb', function (gltf) {
        starsModel = gltf.scene;
        starsModel.scale.set(2, 2, 2);
        starsModel.position.x = -3;
        starsModel.position.y = -2.5;
        starsModel.position.z = 8;
        scene.add(starsModel);
    }, undefined, function (error) {
        console.error('Error loading stars model:', error);
    });
    let animationStartTime = null;
    const PAUSE_DURATION = 1000;
    const ACCELERATION_DURATION = 1000;
    const TARGET_SPEED = 0.001;

    function animate() {
        requestAnimationFrame(animate);
        if (starsModel) {
            if (animationStartTime === null) {
                animationStartTime = Date.now();
            }
            const elapsedTime = Date.now() - animationStartTime;

            if (elapsedTime > PAUSE_DURATION && starsModel.position.z < 10) {
                const animationTime = elapsedTime - PAUSE_DURATION;
                let speed;

                if (animationTime < ACCELERATION_DURATION) {
                    const progress = animationTime / ACCELERATION_DURATION;
                    speed = TARGET_SPEED * progress;
                } else {
                    speed = TARGET_SPEED;
                }

                starsModel.position.z += speed;
            }
        }
        renderer.render(scene, camera);
    }
    animate();
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}