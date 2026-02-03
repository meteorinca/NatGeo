/**
 * South America Geography Quiz
 * Interactive Map Quiz with Hoverable Country Regions
 * 
 * Features:
 * - Click-to-answer quiz format
 * - Hoverable country regions that light up
 * - 3 attempts per question with decreasing points
 * - Timer and score tracking
 * - Fireworks celebration on completion
 */

// ============================================
// Geography Data with SVG Polygon Coordinates
// ============================================

const geographyData = [
    {
        id: 'venezuela',
        name: 'Venezuela',
        capital: 'Caracas',
        // Polygon coordinates as percentage of image (will be converted to viewBox coords)
        polygon: '270,45 320,35 380,50 400,75 380,100 340,110 300,100 270,85'
    },
    {
        id: 'colombia',
        name: 'Colombia',
        capital: 'Bogotá',
        polygon: '180,80 230,60 280,70 300,100 280,140 240,170 200,160 160,130 170,100'
    },
    {
        id: 'ecuador',
        name: 'Ecuador',
        capital: 'Quito',
        polygon: '140,170 180,160 200,175 190,210 160,230 130,210 130,185'
    },
    {
        id: 'peru',
        name: 'Peru',
        capital: 'Lima',
        polygon: '130,210 165,230 200,250 220,290 200,350 170,390 140,380 100,320 90,260 110,220'
    },
    {
        id: 'brazil',
        name: 'Brazil',
        capital: 'Brasília',
        polygon: '280,100 340,110 400,100 450,90 500,110 530,150 520,220 500,280 480,340 440,400 380,440 320,450 280,400 260,340 280,280 300,220 280,160'
    },
    {
        id: 'bolivia',
        name: 'Bolivia',
        capital: 'Sucre',
        polygon: '200,350 260,340 290,380 310,420 280,460 240,470 200,440 180,400'
    },
    {
        id: 'paraguay',
        name: 'Paraguay',
        capital: 'Asunción',
        polygon: '290,420 340,410 370,450 360,500 320,520 280,500 280,460'
    },
    {
        id: 'chile',
        name: 'Chile',
        capital: 'Santiago',
        polygon: '140,380 180,400 200,450 210,520 200,580 185,650 170,720 155,750 140,720 145,650 155,580 165,520 170,450 155,400'
    },
    {
        id: 'argentina',
        name: 'Argentina',
        capital: 'Buenos Aires',
        polygon: '200,450 250,470 290,500 330,520 360,560 350,620 320,680 280,720 250,750 220,720 200,660 180,600 175,540 185,480'
    },
    {
        id: 'uruguay',
        name: 'Uruguay',
        capital: 'Montevideo',
        polygon: '340,540 380,530 400,560 390,600 360,610 340,580'
    },
    {
        id: 'guyana',
        name: 'Guyana',
        capital: 'Georgetown',
        polygon: '380,55 410,45 440,60 450,90 430,110 400,100 385,75'
    },
    {
        id: 'suriname',
        name: 'Suriname',
        capital: 'Paramaribo',
        polygon: '430,45 460,40 485,55 490,85 470,100 450,90 440,60'
    },
    {
        id: 'french-guiana',
        name: 'French Guiana',
        capital: 'Cayenne',
        polygon: '475,40 510,45 520,75 510,95 485,90 480,60'
    },
    {
        id: 'falkland',
        name: 'Falkland Islands',
        capital: 'Stanley',
        polygon: '310,730 350,725 370,745 355,760 320,760 305,745'
    }
];

// ============================================
// Quiz State
// ============================================

let state = {
    isPlaying: false,
    questions: [],
    currentQuestionIndex: 0,
    currentAttempts: 3,
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    timerInterval: null,
    elapsedSeconds: 0,
    completedCountries: new Set()
};

// ============================================
// DOM References
// ============================================

const elements = {
    startScreen: document.getElementById('start-screen'),
    startBtn: document.getElementById('start-btn'),
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
    labeledOverlay: document.getElementById('labeled-overlay'),
    victoryModal: document.getElementById('victory-modal'),
    finalScore: document.getElementById('final-score'),
    finalTime: document.getElementById('final-time'),
    finalAccuracy: document.getElementById('final-accuracy'),
    victoryMessage: document.getElementById('victory-message'),
    playAgainBtn: document.getElementById('play-again-btn'),
    fireworksCanvas: document.getElementById('fireworks-canvas')
};

// ============================================
// Initialization
// ============================================

function init() {
    // Wait for map to load
    if (elements.reliefMap.complete) {
        setupMap();
    } else {
        elements.reliefMap.onload = setupMap;
    }

    // Event listeners
    elements.startBtn.addEventListener('click', startQuiz);
    elements.playAgainBtn.addEventListener('click', () => {
        elements.victoryModal.classList.remove('visible');
        resetQuiz();
        startQuiz();
    });
}

function setupMap() {
    createCountryRegions();
}

// ============================================
// Create SVG Country Regions
// ============================================

function createCountryRegions() {
    elements.countryOverlay.innerHTML = '';

    // Get actual image dimensions for scaling
    const img = elements.reliefMap;
    const viewBoxWidth = 640;
    const viewBoxHeight = 800;

    geographyData.forEach(country => {
        // Create polygon for country
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', country.polygon);
        polygon.setAttribute('class', 'country-region');
        polygon.setAttribute('data-id', country.id);
        polygon.setAttribute('data-name', country.name);
        polygon.setAttribute('data-capital', country.capital);

        // Event listeners
        polygon.addEventListener('click', handleCountryClick);
        polygon.addEventListener('mouseenter', handleCountryHover);
        polygon.addEventListener('mouseleave', handleCountryLeave);

        elements.countryOverlay.appendChild(polygon);
    });
}

// ============================================
// Quiz Flow
// ============================================

function startQuiz() {
    // Hide start screen
    elements.startScreen.classList.add('hidden');

    // Generate questions (countries + capitals)
    state.questions = generateQuestions();
    state.totalQuestions = state.questions.length;
    state.currentQuestionIndex = 0;
    state.score = 0;
    state.correctAnswers = 0;
    state.elapsedSeconds = 0;
    state.completedCountries.clear();
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

    // Add country questions
    geographyData.forEach(country => {
        questions.push({
            type: 'country',
            target: country.name,
            answerId: country.id,
            icon: '🏴'
        });
    });

    // Add capital questions
    geographyData.forEach(country => {
        questions.push({
            type: 'capital',
            target: country.capital,
            answerId: country.id,
            countryName: country.name,
            icon: '🏛️'
        });
    });

    // Shuffle questions
    return shuffleArray(questions);
}

function showQuestion() {
    if (state.currentQuestionIndex >= state.totalQuestions) {
        endQuiz();
        return;
    }

    const question = state.questions[state.currentQuestionIndex];

    // Reset attempts
    state.currentAttempts = 3;

    // Update question display
    const prefix = question.type === 'capital'
        ? `${question.icon} Where is the capital`
        : `${question.icon} Where is`;

    elements.questionTarget.textContent = question.target;
    document.querySelector('.question-prefix').textContent = prefix;

    // Update points badge
    updatePointsBadge();

    // Update attempts indicator
    updateAttemptsIndicator();

    // Update progress
    elements.currentQuestion.textContent = state.currentQuestionIndex + 1;

    // Hide feedback
    hideFeedback();

    // Reset country highlighting
    resetCountryHighlighting();
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
// Country Interaction Handlers
// ============================================

function handleCountryClick(e) {
    if (!state.isPlaying) return;

    const clickedId = e.target.dataset.id;
    const clickedName = e.target.dataset.name;
    const question = state.questions[state.currentQuestionIndex];

    if (clickedId === question.answerId) {
        // Correct answer!
        handleCorrectAnswer(e.target);
    } else {
        // Wrong answer
        handleWrongAnswer(e.target, clickedName, question.target);
    }
}

function handleCorrectAnswer(element) {
    const question = state.questions[state.currentQuestionIndex];

    // Add points
    state.score += state.currentAttempts;
    state.correctAnswers++;
    elements.currentScore.textContent = state.score;

    // Mark country as completed
    state.completedCountries.add(question.answerId);
    element.classList.add('correct-answer');

    // Show correct feedback
    showFeedback(true, `✓ Correct! That's ${question.target}!`);

    // Move to next question after delay
    setTimeout(() => {
        element.classList.remove('correct-answer');
        element.classList.add('completed');
        state.currentQuestionIndex++;
        showQuestion();
    }, 1200);
}

function handleWrongAnswer(element, clickedName, targetName) {
    state.currentAttempts--;

    // Show wrong animation
    element.classList.add('wrong-answer');
    setTimeout(() => {
        element.classList.remove('wrong-answer');
    }, 500);

    if (state.currentAttempts > 0) {
        // Still have attempts
        const triesText = state.currentAttempts === 1 ? 'try' : 'tries';
        showFeedback(false, `Whoops! That's ${clickedName}, not ${targetName}.`, `${state.currentAttempts} ${triesText} left`);
        updatePointsBadge();
        updateAttemptsIndicator();
    } else {
        // No more attempts - show correct answer and move on
        showFeedback(false, `The answer was ${targetName}. Moving on...`, 'No points');

        // Highlight correct answer
        const correctElement = document.querySelector(`[data-id="${state.questions[state.currentQuestionIndex].answerId}"]`);
        if (correctElement) {
            correctElement.classList.add('correct-answer');
            state.completedCountries.add(state.questions[state.currentQuestionIndex].answerId);

            setTimeout(() => {
                correctElement.classList.remove('correct-answer');
                correctElement.classList.add('completed');
                state.currentQuestionIndex++;
                showQuestion();
            }, 2000);
        }
    }
}

function handleCountryHover(e) {
    if (!state.isPlaying) return;
    // Could add tooltip here if desired
}

function handleCountryLeave(e) {
    // Remove any hover effects
}

// ============================================
// Feedback Display
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

    // Stop timer
    clearInterval(state.timerInterval);

    // Calculate stats
    const accuracy = Math.round((state.correctAnswers / state.totalQuestions) * 100);
    const maxScore = state.totalQuestions * 3;

    // Update victory modal
    elements.finalScore.textContent = state.score;
    elements.finalTime.textContent = elements.timer.textContent;
    elements.finalAccuracy.textContent = `${accuracy}%`;

    // Victory message based on performance
    let message = '';
    if (state.score >= maxScore * 0.9) {
        message = '🏆 Outstanding! You\'re a geography master!';
    } else if (state.score >= maxScore * 0.7) {
        message = '🌟 Great job! You really know South America!';
    } else if (state.score >= maxScore * 0.5) {
        message = '👍 Good effort! Keep practicing!';
    } else {
        message = '📚 Keep studying! You\'ll get better!';
    }
    elements.victoryMessage.textContent = message;

    // Show labeled map overlay
    elements.labeledOverlay.classList.add('visible');

    // Start fireworks
    startFireworks();

    // Show victory modal
    setTimeout(() => {
        elements.victoryModal.classList.add('visible');
    }, 1000);
}

function resetQuiz() {
    // Reset state
    state.currentQuestionIndex = 0;
    state.score = 0;
    state.correctAnswers = 0;
    state.elapsedSeconds = 0;
    state.completedCountries.clear();

    // Reset UI
    elements.labeledOverlay.classList.remove('visible');
    elements.currentScore.textContent = '0';
    updateTimer();

    // Reset all country regions
    document.querySelectorAll('.country-region').forEach(region => {
        region.classList.remove('completed', 'correct-answer', 'wrong-answer');
    });

    stopFireworks();
}

function resetCountryHighlighting() {
    document.querySelectorAll('.country-region').forEach(region => {
        if (!state.completedCountries.has(region.dataset.id)) {
            region.classList.remove('correct-answer', 'wrong-answer');
        }
    });
}

// ============================================
// Fireworks Animation
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
// Utility Functions
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
// Start the App
// ============================================

document.addEventListener('DOMContentLoaded', init);
