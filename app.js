/**
 * Geography Quiz - Multi-Map Support
 * ===================================
 * Loads map data from JSON files in the maps/ folder.
 * Supports multiple maps/regions with automatic discovery.
 */

// ============================================
// Configuration
// ============================================

const CONFIG = {
    mapsFolder: 'maps',
    // Fallback data if no JSON files found (for GitHub Pages without server)
    fallbackMaps: ['south_america']
};

// ============================================
// Quiz State
// ============================================

let state = {
    availableMaps: [],
    currentMap: null,
    mapData: null,
    isPlaying: false,
    questions: [],
    currentQuestionIndex: 0,
    currentAttempts: 3,
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    timerInterval: null,
    elapsedSeconds: 0,
    completedRegions: new Set()
};

// ============================================
// DOM References
// ============================================

const elements = {
    quizTitle: document.getElementById('quiz-title'),
    startScreen: document.getElementById('start-screen'),
    mapGrid: document.getElementById('map-grid'),
    questionPanel: document.getElementById('question-panel'),
    questionTarget: document.getElementById('question-target'),
    pointsBadge: document.getElementById('points-badge'),
    attemptsIndicator: document.getElementById('attempts-indicator'),
    feedbackMessage: document.getElementById('feedback-message'),
    timer: document.getElementById('timer'),
    currentScore: document.getElementById('current-score'),
    currentQuestion: document.getElementById('current-question'),
    totalQuestions: document.getElementById('total-questions'),
    mapContainer: document.getElementById('map-container'),
    reliefMap: document.getElementById('relief-map'),
    countryOverlay: document.getElementById('country-overlay'),
    victoryModal: document.getElementById('victory-modal'),
    finalScore: document.getElementById('final-score'),
    finalTime: document.getElementById('final-time'),
    finalAccuracy: document.getElementById('final-accuracy'),
    victoryMessage: document.getElementById('victory-message'),
    playAgainBtn: document.getElementById('play-again-btn'),
    chooseMapBtn: document.getElementById('choose-map-btn'),
    fireworksCanvas: document.getElementById('fireworks-canvas')
};

// ============================================
// Initialization
// ============================================

async function init() {
    // Event listeners
    elements.playAgainBtn.addEventListener('click', () => {
        elements.victoryModal.classList.remove('visible');
        resetQuiz();
        startQuiz();
    });

    elements.chooseMapBtn.addEventListener('click', () => {
        elements.victoryModal.classList.remove('visible');
        showMapSelection();
    });

    // Discover available maps
    await discoverMaps();
}

// ============================================
// Map Discovery
// ============================================

async function discoverMaps() {
    const maps = [];

    // Try to load map index file first
    try {
        const response = await fetch(`${CONFIG.mapsFolder}/index.json`);
        if (response.ok) {
            const index = await response.json();
            maps.push(...index.maps);
        }
    } catch (e) {
        // Index file not available, try known maps
    }

    // Try loading known/common maps
    const knownMaps = [
        'south_america',
        'north_america',
        'europe',
        'asia',
        'africa',
        'oceania',
        'unlabeledReliefMap'
    ];

    for (const mapName of knownMaps) {
        if (!maps.find(m => m.id === mapName)) {
            try {
                const response = await fetch(`${CONFIG.mapsFolder}/${mapName}_data.json`);
                if (response.ok) {
                    const data = await response.json();
                    maps.push({
                        id: mapName,
                        name: data.mapName || mapName.replace(/_/g, ' '),
                        dataFile: `${mapName}_data.json`,
                        imageFile: data.imageFile,
                        regionCount: data.regions?.length || 0
                    });
                }
            } catch (e) {
                // Map not available
            }
        }
    }

    // Also check root folder for legacy data
    try {
        const response = await fetch('maps/unlabeledReliefMap_data.json');
        if (response.ok) {
            const data = await response.json();
            if (!maps.find(m => m.id === 'unlabeledReliefMap')) {
                maps.push({
                    id: 'unlabeledReliefMap',
                    name: data.mapName || 'South America',
                    dataFile: 'unlabeledReliefMap_data.json',
                    imageFile: data.imageFile || 'unlabeledReliefMap.png',
                    regionCount: data.regions?.length || 0
                });
            }
        }
    } catch (e) { }

    state.availableMaps = maps;
    renderMapSelection();
}

function renderMapSelection() {
    const grid = elements.mapGrid;

    if (state.availableMaps.length === 0) {
        grid.innerHTML = `
            <div class="no-maps-message">
                <p>📭 No maps found!</p>
                <p>Run <code>python map_editor.py</code> to create map data.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';

    state.availableMaps.forEach(map => {
        const card = document.createElement('div');
        card.className = 'map-card';
        card.innerHTML = `
            <div class="map-card-icon">🗺️</div>
            <div class="map-card-name">${formatMapName(map.name)}</div>
            <div class="map-card-info">${map.regionCount} regions</div>
        `;
        card.addEventListener('click', () => selectMap(map));
        grid.appendChild(card);
    });
}

function formatMapName(name) {
    return name
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// ============================================
// Map Loading
// ============================================

async function selectMap(mapInfo) {
    try {
        // Load the map data
        const response = await fetch(`${CONFIG.mapsFolder}/${mapInfo.dataFile}`);
        if (!response.ok) throw new Error('Failed to load map data');

        state.mapData = await response.json();
        state.currentMap = mapInfo;

        // Update title
        elements.quizTitle.textContent = `🌎 ${formatMapName(state.mapData.mapName)}`;

        // Load the map image
        const imagePath = state.mapData.imageFile.includes('/')
            ? state.mapData.imageFile
            : `${CONFIG.mapsFolder}/${state.mapData.imageFile}`;

        elements.reliefMap.onload = () => {
            setupMapOverlay();
            startQuiz();
        };

        elements.reliefMap.onerror = () => {
            // Try alternate paths
            const altPath = state.mapData.imageFile;
            elements.reliefMap.src = altPath;
        };

        elements.reliefMap.src = imagePath;

    } catch (error) {
        console.error('Error loading map:', error);
        alert('Failed to load map data. Please ensure the JSON file exists.');
    }
}

function setupMapOverlay() {
    const svg = elements.countryOverlay;
    svg.innerHTML = '';

    // Set viewBox to match image dimensions
    const width = state.mapData.imageWidth || elements.reliefMap.naturalWidth;
    const height = state.mapData.imageHeight || elements.reliefMap.naturalHeight;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Create polygon for each region
    state.mapData.regions.forEach(region => {
        if (region.polygon && region.polygon.length >= 3) {
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');

            // Convert points array to string format
            const pointsStr = region.polygon.map(p => `${p.x},${p.y}`).join(' ');
            polygon.setAttribute('points', pointsStr);
            polygon.setAttribute('class', 'country-region');
            polygon.setAttribute('data-id', region.id);
            polygon.setAttribute('data-name', region.name);
            polygon.setAttribute('data-capital', region.capital || '');

            polygon.addEventListener('click', handleRegionClick);
            polygon.addEventListener('mouseenter', handleRegionHover);
            polygon.addEventListener('mouseleave', handleRegionLeave);

            svg.appendChild(polygon);
        }
    });
}

// ============================================
// Quiz Flow
// ============================================

function startQuiz() {
    elements.startScreen.classList.add('hidden');

    // Generate questions from loaded map data
    state.questions = generateQuestions();
    state.totalQuestions = state.questions.length;
    state.currentQuestionIndex = 0;
    state.score = 0;
    state.correctAnswers = 0;
    state.elapsedSeconds = 0;
    state.completedRegions.clear();
    state.isPlaying = true;

    // Update UI
    elements.totalQuestions.textContent = state.totalQuestions;
    elements.currentScore.textContent = '0';
    updateTimer();

    // Start timer
    state.timerInterval = setInterval(() => {
        state.elapsedSeconds++;
        updateTimer();
    }, 1000);

    // Show first question
    showQuestion();
}

function generateQuestions() {
    const questions = [];

    state.mapData.regions.forEach(region => {
        // Add region/country question
        if (region.name) {
            questions.push({
                type: 'region',
                target: region.name,
                answerId: region.id,
                icon: '🏴'
            });
        }

        // Add capital question if capital exists
        if (region.capital) {
            questions.push({
                type: 'capital',
                target: region.capital,
                answerId: region.id,
                regionName: region.name,
                icon: '🏛️'
            });
        }
    });

    return shuffleArray(questions);
}

function showQuestion() {
    if (state.currentQuestionIndex >= state.totalQuestions) {
        endQuiz();
        return;
    }

    const question = state.questions[state.currentQuestionIndex];
    state.currentAttempts = 3;

    // Update question display
    const prefix = question.type === 'capital'
        ? `${question.icon} Where is`
        : `${question.icon} Where is`;

    elements.questionTarget.textContent = question.target;
    document.querySelector('.question-prefix').textContent = prefix;

    updatePointsBadge();
    updateAttemptsIndicator();
    elements.currentQuestion.textContent = state.currentQuestionIndex + 1;

    hideFeedback();
    resetRegionHighlighting();
}

function updatePointsBadge() {
    const points = state.currentAttempts;
    elements.pointsBadge.querySelector('.points-value').textContent = points;
    elements.pointsBadge.className = 'points-badge';
    if (points === 2) elements.pointsBadge.classList.add('points-2');
    if (points === 1) elements.pointsBadge.classList.add('points-1');
}

function updateAttemptsIndicator() {
    const dots = elements.attemptsIndicator.querySelectorAll('.attempt-dot');
    dots.forEach((dot, index) => {
        dot.className = 'attempt-dot';
        if (index < state.currentAttempts) {
            dot.classList.add('active');
        } else {
            dot.classList.add('used');
        }
    });
}

// ============================================
// Region Interaction
// ============================================

function handleRegionClick(e) {
    if (!state.isPlaying) return;

    const clickedId = e.target.dataset.id;
    const clickedName = e.target.dataset.name;
    const question = state.questions[state.currentQuestionIndex];

    if (clickedId === question.answerId) {
        handleCorrectAnswer(e.target);
    } else {
        handleWrongAnswer(e.target, clickedName, question.target);
    }
}

function handleCorrectAnswer(element) {
    const question = state.questions[state.currentQuestionIndex];

    state.score += state.currentAttempts;
    state.correctAnswers++;
    elements.currentScore.textContent = state.score;

    state.completedRegions.add(question.answerId);
    element.classList.add('correct-answer');

    showFeedback(true, `✓ Correct! That's ${question.target}!`);

    setTimeout(() => {
        element.classList.remove('correct-answer');
        element.classList.add('completed');
        state.currentQuestionIndex++;
        showQuestion();
    }, 1200);
}

function handleWrongAnswer(element, clickedName, targetName) {
    state.currentAttempts--;

    element.classList.add('wrong-answer');
    setTimeout(() => element.classList.remove('wrong-answer'), 500);

    if (state.currentAttempts > 0) {
        const triesText = state.currentAttempts === 1 ? 'try' : 'tries';
        showFeedback(false, `Whoops! That's ${clickedName}, not ${targetName}.`, `${state.currentAttempts} ${triesText} left`);
        updatePointsBadge();
        updateAttemptsIndicator();
    } else {
        showFeedback(false, `The answer was ${targetName}.`, 'No points');

        const correctElement = document.querySelector(`[data-id="${state.questions[state.currentQuestionIndex].answerId}"]`);
        if (correctElement) {
            correctElement.classList.add('correct-answer');
            state.completedRegions.add(state.questions[state.currentQuestionIndex].answerId);

            setTimeout(() => {
                correctElement.classList.remove('correct-answer');
                correctElement.classList.add('completed');
                state.currentQuestionIndex++;
                showQuestion();
            }, 2000);
        }
    }
}

function handleRegionHover(e) {
    // Optional: Show tooltip
}

function handleRegionLeave(e) {
    // Optional: Hide tooltip
}

// ============================================
// Feedback
// ============================================

function showFeedback(isCorrect, message, subMessage = '') {
    const feedback = elements.feedbackMessage;
    feedback.querySelector('.feedback-icon').textContent = isCorrect ? '✅' : '❌';
    feedback.querySelector('.feedback-text').textContent = message;
    feedback.querySelector('.attempts-left').textContent = subMessage;
    feedback.querySelector('.attempts-left').style.display = subMessage ? 'inline' : 'none';

    feedback.className = 'feedback-message visible';
    if (isCorrect) feedback.classList.add('correct');
}

function hideFeedback() {
    elements.feedbackMessage.classList.remove('visible', 'correct');
}

// ============================================
// Timer
// ============================================

function updateTimer() {
    const minutes = Math.floor(state.elapsedSeconds / 60);
    const seconds = state.elapsedSeconds % 60;
    elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================
// Quiz End
// ============================================

function endQuiz() {
    state.isPlaying = false;
    clearInterval(state.timerInterval);

    const accuracy = Math.round((state.correctAnswers / state.totalQuestions) * 100);
    const maxScore = state.totalQuestions * 3;

    elements.finalScore.textContent = state.score;
    elements.finalTime.textContent = elements.timer.textContent;
    elements.finalAccuracy.textContent = `${accuracy}%`;

    let message = '';
    if (state.score >= maxScore * 0.9) {
        message = '🏆 Outstanding! You\'re a geography master!';
    } else if (state.score >= maxScore * 0.7) {
        message = '🌟 Great job! You really know your geography!';
    } else if (state.score >= maxScore * 0.5) {
        message = '👍 Good effort! Keep practicing!';
    } else {
        message = '📚 Keep studying! You\'ll get better!';
    }
    elements.victoryMessage.textContent = message;

    startFireworks();

    setTimeout(() => {
        elements.victoryModal.classList.add('visible');
    }, 1000);
}

function resetQuiz() {
    state.currentQuestionIndex = 0;
    state.score = 0;
    state.correctAnswers = 0;
    state.elapsedSeconds = 0;
    state.completedRegions.clear();

    elements.currentScore.textContent = '0';
    updateTimer();

    document.querySelectorAll('.country-region').forEach(region => {
        region.classList.remove('completed', 'correct-answer', 'wrong-answer');
    });

    stopFireworks();
}

function showMapSelection() {
    state.isPlaying = false;
    clearInterval(state.timerInterval);
    stopFireworks();

    elements.startScreen.classList.remove('hidden');
}

function resetRegionHighlighting() {
    document.querySelectorAll('.country-region').forEach(region => {
        if (!state.completedRegions.has(region.dataset.id)) {
            region.classList.remove('correct-answer', 'wrong-answer');
        }
    });
}

// ============================================
// Fireworks
// ============================================

let fireworksAnimationId = null;
let fireworks = [];
let particles = [];

function startFireworks() {
    const canvas = elements.fireworksCanvas;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    fireworks = [];
    particles = [];

    function Firework(x, y, targetY) {
        this.x = x;
        this.y = y;
        this.targetY = targetY;
        this.speed = 4 + Math.random() * 3;
        this.angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.trail = [];
        this.maxTrail = 15;
        this.hue = Math.random() * 360;
        this.alive = true;
    }

    Firework.prototype.update = function () {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05;
        if (this.y <= this.targetY || this.vy >= 0) {
            this.explode();
            this.alive = false;
        }
    };

    Firework.prototype.draw = function () {
        ctx.beginPath();
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length;
            ctx.strokeStyle = `hsla(${this.hue}, 100%, 70%, ${alpha})`;
            ctx.lineWidth = 2;
            if (i > 0) {
                ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${this.hue}, 100%, 80%)`;
        ctx.fill();
    };

    Firework.prototype.explode = function () {
        const count = 60 + Math.floor(Math.random() * 40);
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(this.x, this.y, this.hue));
        }
    };

    function Particle(x, y, hue) {
        this.x = x;
        this.y = y;
        this.hue = hue + (Math.random() - 0.5) * 30;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = 0.015 + Math.random() * 0.015;
        this.gravity = 0.08;
        this.size = 2 + Math.random() * 2;
    }

    Particle.prototype.update = function () {
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    };

    Particle.prototype.draw = function () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, ${this.alpha})`;
        ctx.fill();
    };

    let frameCount = 0;

    function animate() {
        fireworksAnimationId = requestAnimationFrame(animate);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (frameCount % 25 === 0) {
            const x = Math.random() * canvas.width;
            const y = canvas.height;
            const targetY = 100 + Math.random() * (canvas.height * 0.4);
            fireworks.push(new Firework(x, y, targetY));
        }

        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].draw();
            if (!fireworks[i].alive) fireworks.splice(i, 1);
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].alpha <= 0) particles.splice(i, 1);
        }

        frameCount++;
        if (frameCount > 600) stopFireworks();
    }

    animate();
}

function stopFireworks() {
    if (fireworksAnimationId) {
        cancelAnimationFrame(fireworksAnimationId);
        fireworksAnimationId = null;
    }
    const canvas = elements.fireworksCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fireworks = [];
    particles = [];
}

// ============================================
// Utilities
// ============================================

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ============================================
// Start
// ============================================

document.addEventListener('DOMContentLoaded', init);
