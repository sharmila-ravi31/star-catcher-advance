
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const livesElement = document.getElementById("lives");
const highScoreElement = document.getElementById("highScore");
const message = document.getElementById("message");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const soundBtn = document.getElementById("soundBtn");

// Game configuration
const TARGET_SCORE = 300;

let gameState = "start";

let score = 0;
let lives = 3;
let level = 1;

let highScore = Number(localStorage.getItem("highScore")) || 0;
let soundEnabled = localStorage.getItem("soundEnabled") !== "false";

highScoreElement.textContent = highScore;

const basket = {
    x: 350,
    y: 440,
    width: 100,
    height: 30,
    speed: 7
};

let stars = [];
let keys = {};
let spawnTimer = 0;
let lastTime = 0;

// Display current game state
function updateUI() {
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    levelElement.textContent = level;
    highScoreElement.textContent = highScore;

    pauseBtn.disabled = gameState !== "playing";

    if (gameState === "start") {
        startBtn.textContent = "Start Game";
    } else if (gameState === "paused") {
        startBtn.textContent = "Resume Game";
    } else {
        startBtn.textContent = "Start Game";
    }
}

// Show game messages
function showMessage(title, description) {
    message.innerHTML = `
        <h2>${title}</h2>
        <p>${description}</p>
    `;
}

// Start game
function startGame() {
    if (gameState === "paused") {
        gameState = "playing";
        showMessage("Game Resumed!", "Catch the falling stars!");
        updateUI();
        return;
    }

    if (gameState !== "start") return;

    gameState = "playing";
    showMessage("Game Started!", "Catch the falling stars!");
    updateUI();
}

// Pause game
function pauseGame() {
    if (gameState !== "playing") return;

    gameState = "paused";
    showMessage("Game Paused", "Click Resume Game to continue.");
    updateUI();
}

// Restart game
function restartGame() {
    gameState = "restart";

    score = 0;
    lives = 3;
    level = 1;

    stars = [];
    spawnTimer = 0;

    basket.x = 350;
    keys = {};

    updateUI();
    showMessage("Restarting...", "Get ready!");

    setTimeout(() => {
        if (gameState !== "restart") return;

        gameState = "playing";
        showMessage("Game Started!", "Catch the falling stars!");
        updateUI();
    }, 250);
}

// End game
function endGame(result) {
    if (gameState !== "playing") return;

    gameState = result;

    if (result === "win") {
        showMessage("🎉 You Win!", "Congratulations! You reached 300 points.");
    } else {
        showMessage("💔 Game Over!", "You lost all your lives. Try again!");
    }

    updateUI();
}

// Update score and levels
function updateScore() {
    score += 10;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }

    level = Math.min(3, Math.floor(score / 100) + 1);

    updateUI();

    if (score >= TARGET_SCORE) {
        endGame("win");
    }
}

// Sound effect
function playCatchSound() {
    if (!soundEnabled) return;

    try {
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();

        oscillator.connect(gain);
        gain.connect(audio.destination);

        oscillator.frequency.value = 600;
        gain.gain.value = 0.08;

        oscillator.start();
        oscillator.stop(audio.currentTime + 0.12);

        oscillator.onended = () => audio.close();
    } catch (error) {
        console.log("Audio unavailable");
    }
}

// Save sound preference
soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    localStorage.setItem("soundEnabled", soundEnabled);

    soundBtn.textContent = soundEnabled
        ? "Sound: ON"
        : "Sound: OFF";
});

soundBtn.textContent = soundEnabled ? "Sound: ON" : "Sound: OFF";

// Create falling stars
function spawnStar() {
    stars.push({
        x: Math.random() * (canvas.width - 30) + 15,
        y: -20,
        radius: 13,
        speed: 2 + level * 1.2
    });
}

// Update basket position
function updateBasket() {
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        basket.x -= basket.speed;
    }

    if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        basket.x += basket.speed;
    }

    basket.x = Math.max(
        0,
        Math.min(canvas.width - basket.width, basket.x)
    );
}

// Update falling stars
function updateStars(deltaTime) {
    spawnTimer += deltaTime;

    const spawnInterval = Math.max(350, 1000 - level * 180);

    if (spawnTimer >= spawnInterval) {
        spawnStar();
        spawnTimer = 0;
    }

    stars.forEach((star, index) => {
        star.y += star.speed * deltaTime / 16.67;

        // Check collision with basket
        const caught =
            star.y + star.radius >= basket.y &&
            star.y - star.radius <= basket.y + basket.height &&
            star.x >= basket.x &&
            star.x <= basket.x + basket.width;

        if (caught) {
            updateScore();
            playCatchSound();
            stars.splice(index, 1);
            return;
        }

        // Missed star
        if (star.y - star.radius > canvas.height) {
            lives--;
            stars.splice(index, 1);
            updateUI();

            if (lives <= 0) {
                lives = 0;
                endGame("lose");
            }
        }
    });
}

// Draw everything
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background stars
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 35; i++) {
        const x = (i * 137) % canvas.width;
        const y = (i * 79) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }

    // Draw falling stars
    ctx.font = "28px Arial";
    ctx.textAlign = "center";

    stars.forEach(star => {
        ctx.fillText("⭐", star.x, star.y);
    });

    // Draw basket
    ctx.fillStyle = "#ffae00";
    ctx.fillRect(
        basket.x,
        basket.y,
        basket.width,
        basket.height
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText(
        "BASKET",
        basket.x + basket.width / 2,
        basket.y + 21
    );

    // Draw current state
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Level " + level, 15, 30);
}

// Main game loop
function gameLoop(timestamp) {
    const deltaTime = Math.min(
        timestamp - (lastTime || timestamp),
        50
    );

    lastTime = timestamp;

    if (gameState === "playing") {
        updateBasket();
        updateStars(deltaTime);
    }

    drawGame();

    requestAnimationFrame(gameLoop);
}

// Keyboard controls
document.addEventListener("keydown", event => {
    if (
        ["ArrowLeft", "ArrowRight", " "].includes(event.key)
    ) {
        event.preventDefault();
    }

    keys[event.key] = true;

    if (event.key === " " && !event.repeat) {
        if (gameState === "playing") {
            pauseGame();
        } else if (gameState === "paused") {
            startGame();
        }
    }
});

document.addEventListener("keyup", event => {
    keys[event.key] = false;
});

// Button controls
startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
restartBtn.addEventListener("click", restartGame);

// Mobile controls
function holdButton(id, key) {
    const button = document.getElementById(id);

    button.addEventListener("pointerdown", event => {
        event.preventDefault();
        keys[key] = true;
    });

    button.addEventListener("pointerup", () => {
        keys[key] = false;
    });

    button.addEventListener("pointerleave", () => {
        keys[key] = false;
    });

    button.addEventListener("pointercancel", () => {
        keys[key] = false;
    });
}

holdButton("leftBtn", "ArrowLeft");
holdButton("rightBtn", "ArrowRight");

// Initial game display
updateUI();
drawGame();

// Start animation loop
requestAnimationFrame(gameLoop);
