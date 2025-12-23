function createStarfield() {
    const starfield = document.getElementById('starfield');
    const numberOfStars = 200;
    for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.animationDuration = `${2 + Math.random() * 3}s`;
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
});
