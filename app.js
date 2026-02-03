/**
 * South America Geography Quiz - Interactive Drag & Drop
 * 
 * Design Philosophy:
 * - Direct to Action: Map loads immediately with all interactions ready
 * - Mobile Compatible: Touch events + click fallback for accessibility
 * - Immediate Feedback: Visual confirmation on correct/incorrect placement
 * - Celebration: Fireworks animation on completion
 */

// ============================================
// Data: Countries and Capitals with Map Positions
// ============================================

const geographyData = [
    // Countries and their capitals with approximate positions (as percentages)
    // Positions are calibrated for the unlabeledReliefMap.png
    {
        id: 'argentina',
        country: 'Argentina',
        capital: 'Buenos Aires',
        countryPos: { x: 38, y: 75 },
        capitalPos: { x: 50, y: 72 }
    },
    {
        id: 'bolivia',
        country: 'Bolivia',
        capital: 'Sucre',
        capitalAlt: 'La Paz',
        countryPos: { x: 38, y: 48 },
        capitalPos: { x: 40, y: 45 }
    },
    {
        id: 'brazil',
        country: 'Brazil',
        capital: 'Brasília',
        countryPos: { x: 65, y: 40 },
        capitalPos: { x: 68, y: 48 }
    },
    {
        id: 'chile',
        country: 'Chile',
        capital: 'Santiago',
        countryPos: { x: 24, y: 62 },
        capitalPos: { x: 30, y: 68 }
    },
    {
        id: 'colombia',
        country: 'Colombia',
        capital: 'Bogotá',
        countryPos: { x: 25, y: 18 },
        capitalPos: { x: 20, y: 15 }
    },
    {
        id: 'ecuador',
        country: 'Ecuador',
        capital: 'Quito',
        countryPos: { x: 15, y: 28 },
        capitalPos: { x: 12, y: 25 }
    },
    {
        id: 'guyana',
        country: 'Guyana',
        capital: 'Georgetown',
        countryPos: { x: 55, y: 10 },
        capitalPos: { x: 58, y: 8 }
    },
    {
        id: 'paraguay',
        country: 'Paraguay',
        capital: 'Asunción',
        countryPos: { x: 52, y: 58 },
        capitalPos: { x: 48, y: 56 }
    },
    {
        id: 'peru',
        country: 'Peru',
        capital: 'Lima',
        countryPos: { x: 22, y: 38 },
        capitalPos: { x: 12, y: 35 }
    },
    {
        id: 'suriname',
        country: 'Suriname',
        capital: 'Paramaribo',
        countryPos: { x: 62, y: 12 },
        capitalPos: { x: 60, y: 9 }
    },
    {
        id: 'uruguay',
        country: 'Uruguay',
        capital: 'Montevideo',
        countryPos: { x: 55, y: 72 },
        capitalPos: { x: 58, y: 75 }
    },
    {
        id: 'venezuela',
        country: 'Venezuela',
        capital: 'Caracas',
        countryPos: { x: 42, y: 8 },
        capitalPos: { x: 48, y: 5 }
    },
    {
        id: 'french-guiana',
        country: 'French Guiana',
        capital: 'Cayenne',
        countryPos: { x: 72, y: 12 },
        capitalPos: { x: 70, y: 9 }
    },
    {
        id: 'falkland',
        country: 'Falkland Islands',
        capital: 'Stanley',
        countryPos: { x: 52, y: 92 },
        capitalPos: { x: 58, y: 90 }
    }
];

// ============================================
// State Management
// ============================================

let state = {
    placedCount: 0,
    totalItems: 0,
    selectedWord: null,
    correctPlacements: new Set(),
    wordItems: [],
    dropZones: []
};

// ============================================
// DOM References
// ============================================

const elements = {
    wordBank: document.getElementById('word-bank'),
    dropZones: document.getElementById('drop-zones'),
    mapContainer: document.getElementById('map-container'),
    reliefMap: document.getElementById('relief-map'),
    labeledOverlay: document.getElementById('labeled-overlay'),
    placedCount: document.getElementById('placed-count'),
    totalCount: document.getElementById('total-count'),
    resetBtn: document.getElementById('reset-btn'),
    victoryModal: document.getElementById('victory-modal'),
    playAgainBtn: document.getElementById('play-again-btn'),
    fireworksCanvas: document.getElementById('fireworks-canvas')
};

// ============================================
// Initialization
// ============================================

function init() {
    // Wait for the map image to load to get proper dimensions
    if (elements.reliefMap.complete) {
        setupGame();
    } else {
        elements.reliefMap.onload = setupGame;
    }

    // Event listeners
    elements.resetBtn.addEventListener('click', resetGame);
    elements.playAgainBtn.addEventListener('click', () => {
        elements.victoryModal.classList.remove('visible');
        resetGame();
    });

    // Handle window resize for responsive drop zones
    window.addEventListener('resize', debounce(updateDropZonePositions, 250));
}

function setupGame() {
    createWordBank();
    createDropZones();
    state.totalItems = geographyData.length * 2; // Countries + Capitals
    elements.totalCount.textContent = state.totalItems;
    updateScore();
}

// ============================================
// Word Bank Creation
// ============================================

function createWordBank() {
    elements.wordBank.innerHTML = '';
    state.wordItems = [];

    // Create array of all words (countries and capitals), then shuffle
    const allWords = [];

    geographyData.forEach(item => {
        allWords.push({
            text: item.country,
            type: 'country',
            id: item.id,
            matchId: `${item.id}-country`
        });
        allWords.push({
            text: item.capital,
            type: 'capital',
            id: item.id,
            matchId: `${item.id}-capital`
        });
    });

    // Shuffle the words
    shuffleArray(allWords);

    // Create DOM elements
    allWords.forEach(word => {
        const wordEl = document.createElement('div');
        wordEl.className = `word-item ${word.type}`;
        wordEl.textContent = word.text;
        wordEl.dataset.matchId = word.matchId;
        wordEl.dataset.id = word.id;
        wordEl.dataset.type = word.type;
        wordEl.draggable = true;

        // Drag events (desktop)
        wordEl.addEventListener('dragstart', handleDragStart);
        wordEl.addEventListener('dragend', handleDragEnd);

        // Touch events (mobile)
        wordEl.addEventListener('touchstart', handleTouchStart, { passive: false });
        wordEl.addEventListener('touchmove', handleTouchMove, { passive: false });
        wordEl.addEventListener('touchend', handleTouchEnd);

        // Click for tap-to-select on mobile
        wordEl.addEventListener('click', handleWordClick);

        elements.wordBank.appendChild(wordEl);
        state.wordItems.push(wordEl);
    });
}

// ============================================
// Drop Zones Creation
// ============================================

function createDropZones() {
    elements.dropZones.innerHTML = '';
    state.dropZones = [];

    geographyData.forEach(item => {
        // Country drop zone
        const countryZone = createDropZone(item, 'country', item.countryPos);
        elements.dropZones.appendChild(countryZone);
        state.dropZones.push(countryZone);

        // Capital drop zone
        const capitalZone = createDropZone(item, 'capital', item.capitalPos);
        elements.dropZones.appendChild(capitalZone);
        state.dropZones.push(capitalZone);
    });
}

function createDropZone(item, type, position) {
    const zone = document.createElement('div');
    zone.className = `drop-zone ${type}-zone`;
    zone.dataset.matchId = `${item.id}-${type}`;
    zone.dataset.id = item.id;
    zone.dataset.type = type;

    // Position the zone
    zone.style.left = `${position.x}%`;
    zone.style.top = `${position.y}%`;
    zone.style.transform = 'translate(-50%, -50%)';

    // Add label hint
    const label = document.createElement('span');
    label.className = 'zone-label';
    label.textContent = type === 'country' ? '🏴' : '🏛️';
    zone.appendChild(label);

    // Drag & drop events
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragenter', handleDragEnter);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);

    // Touch/click events for tap-to-place
    zone.addEventListener('click', handleZoneClick);

    return zone;
}

function updateDropZonePositions() {
    // This function can be used to recalculate positions on resize if needed
    // For now, percentage-based positioning handles responsiveness
}

// ============================================
// Drag & Drop Handlers (Desktop)
// ============================================

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.matchId);

    // Clear any tap selection
    clearSelection();
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedElement = null;

    // Remove hover state from all zones
    state.dropZones.forEach(zone => zone.classList.remove('hover'));
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (!e.currentTarget.classList.contains('correct')) {
        e.currentTarget.classList.add('hover');
    }
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('hover');
}

function handleDrop(e) {
    e.preventDefault();
    const zone = e.currentTarget;
    zone.classList.remove('hover');

    if (zone.classList.contains('correct')) return;

    const matchId = e.dataTransfer.getData('text/plain');
    attemptPlacement(matchId, zone);
}

// ============================================
// Touch Handlers (Mobile)
// ============================================

let touchedElement = null;
let touchClone = null;
let touchStartPos = { x: 0, y: 0 };

function handleTouchStart(e) {
    if (e.target.classList.contains('placed')) return;

    touchedElement = e.target;
    const touch = e.touches[0];
    touchStartPos = { x: touch.clientX, y: touch.clientY };

    // Create a clone for visual feedback
    touchClone = e.target.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '10000';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.opacity = '0.9';
    touchClone.style.transform = 'scale(1.1)';
    touchClone.style.left = `${touch.clientX}px`;
    touchClone.style.top = `${touch.clientY}px`;
    touchClone.style.translate = '-50% -50%';
    document.body.appendChild(touchClone);

    e.target.classList.add('dragging');
    e.preventDefault();
}

function handleTouchMove(e) {
    if (!touchClone) return;

    const touch = e.touches[0];
    touchClone.style.left = `${touch.clientX}px`;
    touchClone.style.top = `${touch.clientY}px`;

    // Check which drop zone we're over
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    state.dropZones.forEach(zone => zone.classList.remove('hover'));

    if (elemBelow && elemBelow.classList.contains('drop-zone') && !elemBelow.classList.contains('correct')) {
        elemBelow.classList.add('hover');
    }

    e.preventDefault();
}

function handleTouchEnd(e) {
    if (!touchedElement || !touchClone) return;

    const touch = e.changedTouches[0];
    const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);

    // Clean up
    touchClone.remove();
    touchClone = null;
    touchedElement.classList.remove('dragging');
    state.dropZones.forEach(zone => zone.classList.remove('hover'));

    // Check if dropped on a valid zone
    if (elemBelow && elemBelow.classList.contains('drop-zone') && !elemBelow.classList.contains('correct')) {
        attemptPlacement(touchedElement.dataset.matchId, elemBelow);
    }

    touchedElement = null;
}

// ============================================
// Tap-to-Select Mode (Alternative Mobile UX)
// ============================================

function handleWordClick(e) {
    const wordEl = e.target;
    if (wordEl.classList.contains('placed') || wordEl.classList.contains('dragging')) return;

    // Check for double-tap vs selection
    if (state.selectedWord === wordEl) {
        // Double click - deselect
        clearSelection();
        return;
    }

    // Select this word
    clearSelection();
    wordEl.classList.add('selected');
    state.selectedWord = wordEl;
}

function handleZoneClick(e) {
    const zone = e.currentTarget;
    if (zone.classList.contains('correct')) return;

    if (state.selectedWord) {
        attemptPlacement(state.selectedWord.dataset.matchId, zone);
        clearSelection();
    }
}

function clearSelection() {
    if (state.selectedWord) {
        state.selectedWord.classList.remove('selected');
        state.selectedWord = null;
    }
}

// ============================================
// Placement Logic
// ============================================

function attemptPlacement(wordMatchId, zone) {
    const zoneMatchId = zone.dataset.matchId;

    if (wordMatchId === zoneMatchId) {
        // Correct placement!
        handleCorrectPlacement(wordMatchId, zone);
    } else {
        // Incorrect placement
        handleIncorrectPlacement(zone);
    }
}

function handleCorrectPlacement(matchId, zone) {
    // Mark zone as correct
    zone.classList.add('correct');

    // Find and update the word item
    const wordEl = state.wordItems.find(w => w.dataset.matchId === matchId);
    if (wordEl) {
        wordEl.classList.add('placed');

        // Create enhanced display for correct placement
        const type = zone.dataset.type;
        const icon = type === 'country' ? '🏴' : '🏛️';

        // Build the display with icon and text
        zone.innerHTML = `<span class="placed-icon">${icon}</span><span class="placed-text">${wordEl.textContent}</span>`;
    }

    // Update state
    state.correctPlacements.add(matchId);
    state.placedCount++;
    updateScore();

    // Check for victory
    if (state.placedCount >= state.totalItems) {
        triggerVictory();
    }
}

function handleIncorrectPlacement(zone) {
    zone.classList.add('incorrect');

    // Remove shake animation after it completes
    setTimeout(() => {
        zone.classList.remove('incorrect');
    }, 500);
}

// ============================================
// Score & Victory
// ============================================

function updateScore() {
    elements.placedCount.textContent = state.placedCount;
}

function triggerVictory() {
    // Show labeled map overlay
    elements.labeledOverlay.classList.add('visible');

    // Start fireworks
    startFireworks();

    // Show victory modal after a brief delay
    setTimeout(() => {
        elements.victoryModal.classList.add('visible');
        document.getElementById('final-count').textContent = state.totalItems;
    }, 1500);
}

// ============================================
// Reset Game
// ============================================

function resetGame() {
    // Reset state
    state.placedCount = 0;
    state.correctPlacements.clear();
    state.selectedWord = null;

    // Reset UI
    elements.labeledOverlay.classList.remove('visible');
    elements.victoryModal.classList.remove('visible');

    // Recreate word bank and drop zones
    createWordBank();
    createDropZones();

    updateScore();

    // Stop fireworks if running
    stopFireworks();
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

    // Set canvas size
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
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // gravity

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

        // Draw head
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${this.hue}, 100%, 80%)`;
        ctx.fill();
    };

    Firework.prototype.explode = function () {
        const particleCount = 60 + Math.floor(Math.random() * 40);
        for (let i = 0; i < particleCount; i++) {
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

        // Fade out previous frame
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Launch new fireworks
        if (frameCount % 30 === 0) {
            const x = Math.random() * canvas.width;
            const y = canvas.height;
            const targetY = 100 + Math.random() * (canvas.height * 0.4);
            fireworks.push(new Firework(x, y, targetY));
        }

        // Update and draw fireworks
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].draw();
            if (!fireworks[i].alive) {
                fireworks.splice(i, 1);
            }
        }

        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].alpha <= 0) {
                particles.splice(i, 1);
            }
        }

        frameCount++;

        // Stop after some time
        if (frameCount > 600) {
            stopFireworks();
        }
    }

    animate();
}

function stopFireworks() {
    if (fireworksAnimationId) {
        cancelAnimationFrame(fireworksAnimationId);
        fireworksAnimationId = null;
    }

    // Clear canvas
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
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// Start the App
// ============================================

document.addEventListener('DOMContentLoaded', init);
