game_W = 0, game_H = 0;

var bg_im = new Image();
bg_im.src = "images/Map2.png";
SPEED = 1;
MaxSpeed = 0;
chX = chY = 1;
mySnake = [];
FOOD = [];
NFood = 2000;
Nsnake = 20;
sizeMap = 2000;
index = 0;
minScore = 200;
die = false;

Xfocus = Yfocus = 0;
XX = 0, YY = 0;

names = ["Ahmed Steinke",
    "Aubrey Brass",
    "Johanne Boothe",
    "Sunni Markland",
    "Tifany Sugar",
    "Latonya Tully",
    "Bobette Huckaby",
    "Daryl Nowicki",
    "Lizeth Kremer",
    "Chiquita Pitt",
    "Christinia Siler",
    "Rena Reep",
    "Evan Mcknight",
    "Sofia Freeland",
    "Virgie Vaughns",
    "Kit Polen",
    "Emma Rutland",
    "Queen Guertin",
    "Cecily Pasquariello",
    "Palmer Myer",
    "Kera Quinton",
    "Domonique Diebold",
    "Henriette Sockwell",
    "Adeline Pettway",
    "Shu Osby",
    "Shantay Wallner",
    "Isaias Drewes",
    "Lettie Gatz",
    "Remona Maravilla",
    "Jessenia Mick",
    "Noelle Rickey",
    "Lavon Revard",
    "Shavonne Stogsdill",
    "Hailey Razo",
    "Bart Somerville",
    "Hannah Masker",
    "Frederica Farmer",
    "Glennie Thorpe",
    "Sherrell Arriaga",
    "Lawanda Maines",
    "Douglass Watts",
    "Naida Grund",
    "Branda Bussiere",
    "Carmelo Savory",
    "Gabriela Blanchette",
    "Tran Huf",
    "Antoinette Hinrichs",
    "Deborah Primmer",
    "Drusilla Mcvea",
    "Charlsie Acy",
    "Nadene Royce",
    "Danette Touchet",
    "Luana Endo",
    "Elvina Hibbitts",
    "Ludivina Dahle",
    "Fabiola Mcwhirter",
    "Isabella Mosier",
    "Lon Lassiter",
    "Laurence Hanning",
    "NamZ Bede"
];


// --- Power-up balancing constants ---
const POWERUP_CONFIG = {
    speed: { duration: 330, spawnChance: 0.1 },
    invincible: { duration: 200, spawnChance: 0.05 },
    shrink: { duration: 0, spawnChance: 0.08 },
    double: { duration: 400, spawnChance: 0.12 }
};
const MAX_POWERUPS_ON_MAP = 6;
const POWERUP_SPAWN_INTERVAL_MIN = 120; // frames
const POWERUP_SPAWN_INTERVAL_MAX = 360; // frames
// Patch: allow nickname to be set before game starts
window.startGameWithNickname = function (nickname) {
    window._nickname = nickname;
    // Remove old canvas if exists
    if (window._gameInstance && window._gameInstance.canvas) {
        window._gameInstance.canvas.remove();
    }
    // Reset global variables for a clean restart
    game_W = 0; game_H = 0;
    chX = chY = 1;
    mySnake = [];
    FOOD = [];
    die = false;
    Xfocus = Yfocus = 0;
    XX = 0; YY = 0;
    index = 0;
    window._gameInstance = new game(nickname);
};


class game {
    draw() {
        // Draw background
        this.context.clearRect(0, 0, game_W, game_H);
        this.context.drawImage(bg_im, Xfocus, Yfocus, 1.5 * game_W, 1.5 * game_H, 0, 0, game_W, game_H);
        // Draw food
        for (let i = 0; i < FOOD.length; i++) {
            if (FOOD[i] && typeof FOOD[i].draw === 'function') FOOD[i].draw();
        }
        // Draw snakes
        for (let i = 0; i < mySnake.length; i++) {
            if (mySnake[i] && typeof mySnake[i].draw === 'function') mySnake[i].draw();
        }
        this.drawScores();
    }
    constructor(nickname) {
        this.canvas = null;
        this.context = null;
        this.nickname = nickname || window._nickname || "Player";
        this._listenersAttached = false;

        // Load sound effects
        this.sounds = {
            gameplay: new Audio("sounds/gameplay.mp3"),
            eat: new Audio("sounds/eat.mp3"),
            achievement: new Audio("sounds/achievement.mp3"),
            death: new Audio("sounds/death.mp3")
        };

        // Loop gameplay sound
        this.sounds.gameplay.loop = true;
        this.sounds.gameplay.volume = 0.5;
        this.sounds.gameplay.play();

        this.init();
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play();
        }
    }

    init() {
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);

        // Set canvas size and game_W/game_H before initializing snakes/food
        this.render();

        for (let i = 0; i < Nsnake; i++)
            mySnake[i] = new snake(names[Math.floor(Math.random() * 99999) % names.length], this, Math.floor(2 * minScore + Math.random() * 2 * minScore), (Math.random() - Math.random()) * sizeMap, (Math.random() - Math.random()) * sizeMap);
        // Use nickname for player snake
        mySnake[0] = new snake(this.nickname, this, minScore, game_W / 2, game_H / 2);
        // Fill normal food only
        for (let i = 0; i < NFood; i++) {
            FOOD[i] = new food(this, this.getSize() / (7 + Math.random() * 10), (Math.random() - Math.random()) * sizeMap, (Math.random() - Math.random()) * sizeMap);
        }

        // Power-up spawn timer
        this._powerupSpawnTimer = this._randPowerupInterval();

        this.loop();

        // Attach listeners only once, after game starts
        if (!this._listenersAttached) {
            this._listenersAttached = true;
            setTimeout(() => {
                this.listenMouse();
                this.listenTouch();
            }, 0);
        }
    }

    _randPowerupInterval() {
        return Math.floor(Math.random() * (POWERUP_SPAWN_INTERVAL_MAX - POWERUP_SPAWN_INTERVAL_MIN + 1)) + POWERUP_SPAWN_INTERVAL_MIN;
    }

    listenTouch() {
        document.addEventListener("touchmove", evt => {
            var y = evt.touches[0].pageY;
            var x = evt.touches[0].pageX;
            chX = (x - game_W / 2) / 15;
            chY = (y - game_H / 2) / 15;
        })

        document.addEventListener("touchstart", evt => {
            var y = evt.touches[0].pageY;
            var x = evt.touches[0].pageX;
            chX = (x - game_W / 2) / 15;
            chY = (y - game_H / 2) / 15;
            mySnake[0].speed = 2;
        })

        document.addEventListener("touchend", evt => {
            mySnake[0].speed = 1;
        })
    }

    listenMouse() {
        document.addEventListener("mousedown", evt => {
            var x = evt.offsetX == undefined ? evt.layerX : evt.offsetX;
            var y = evt.offsetY == undefined ? evt.layerY : evt.offsetY;
            mySnake[0].speed = 2;
        })

        document.addEventListener("mousemove", evt => {
            var x = evt.offsetX == undefined ? evt.layerX : evt.offsetX;
            var y = evt.offsetY == undefined ? evt.layerY : evt.offsetY;
            chX = (x - game_W / 2) / 15;
            chY = (y - game_H / 2) / 15;
        })

        document.addEventListener("mouseup", evt => {
            var x = evt.offsetX == undefined ? evt.layerX : evt.offsetX;
            var y = evt.offsetY == undefined ? evt.layerY : evt.offsetY;
            mySnake[0].speed = 1;
        })
    }

    loop() {
        if (die)
            return;
        this.update();
        this.draw();
        setTimeout(() => this.loop(), 30);
    }

    update() {
        this.render();
        this.unFood();
        this.changeFood();
        this.changeSnake();
        this.updateChXY();
        this.checkDie();

        mySnake[0].dx = chX;
        mySnake[0].dy = chY;
        XX += chX * mySnake[0].speed;
        YY += chY * mySnake[0].speed;
        mySnake[0].v[0].x = XX + game_W / 2;
        mySnake[0].v[0].y = YY + game_H / 2;
    }

    updateChXY() {
        while (Math.abs(chY) * Math.abs(chY) + Math.abs(chX) * Math.abs(chX) > MaxSpeed * MaxSpeed && chY * chX != 0) {
            chX /= 1.1;
            chY /= 1.1;
        }
        while (Math.abs(chY) * Math.abs(chY) + Math.abs(chX) * Math.abs(chX) < MaxSpeed * MaxSpeed && chY * chX != 0) {
            chX *= 1.1;
            chY *= 1.1;
        }

        Xfocus += 1.5 * chX * mySnake[0].speed;
        Yfocus += 1.5 * chY * mySnake[0].speed;
        if (Xfocus < 0)
            Xfocus = bg_im.width / 2 + 22;
        if (Xfocus > bg_im.width / 2 + 22)
            Xfocus = 0;
        if (Yfocus < 0)
            Yfocus = bg_im.height / 2 + 60;
        if (Yfocus > bg_im.height / 2 + 60)
            Yfocus = 0;
    }

    changeFood() {
        for (let i = 0; i < FOOD.length; i++)
            if (Math.sqrt((mySnake[0].v[0].x - FOOD[i].x) * (mySnake[0].v[0].x - FOOD[i].x) + (mySnake[0].v[0].y - FOOD[i].y) * (mySnake[0].v[0].y - FOOD[i].y)) > sizeMap) {
                FOOD[i] = new food(this, this.getSize() / (10 + Math.random() * 10), (Math.random() - Math.random()) * sizeMap + mySnake[0].v[0].x, (Math.random() - Math.random()) * sizeMap + mySnake[0].v[0].y);
                // console.log(FOOD[i]);
            }
    }

    changeSnake() {
        for (let i = 0; i < mySnake.length; i++)
            if (Math.sqrt((mySnake[0].v[0].x - mySnake[i].v[0].x) * (mySnake[0].v[0].x - mySnake[i].v[0].x) + (mySnake[0].v[0].y - mySnake[i].v[0].y) * (mySnake[0].v[0].y - mySnake[i].v[0].y)) > sizeMap) {
                mySnake[i].v[0].x = (mySnake[0].v[0].x + mySnake[i].v[0].x) / 2;
                mySnake[i].v[0].y = (mySnake[0].v[0].y + mySnake[i].v[0].y) / 2;
            }
    }

    unFood() {
        if (mySnake.length <= 0)
            return;
        for (let i = 0; i < mySnake.length; i++)
            for (let j = 0; j < FOOD.length; j++) {
                if ((mySnake[i].v[0].x - FOOD[j].x) * (mySnake[i].v[0].x - FOOD[j].x) + (mySnake[i].v[0].y - FOOD[j].y) * (mySnake[i].v[0].y - FOOD[j].y) < 1.5 * mySnake[i].size * mySnake[i].size) {
                    // Power-up logic
                    if (FOOD[j].powerup && i === 0) {
                        this.applyPowerUp(FOOD[j].powerup.type);
                        this.playSound("achievement"); // Play achievement sound
                    }
                    this.playSound("eat"); // Play eating sound
                    mySnake[i].score += Math.floor(FOOD[j].value);
                    // Respawn food, keep powerup chance and type
                    let pType = PowerUpTypes[Math.floor(Math.random() * PowerUpTypes.length)];
                    if (Math.random() < POWERUP_CONFIG[pType.type].spawnChance) {
                        FOOD[j] = new food(this, this.getSize() * 1.2, (Math.random() - Math.random()) * 5000 + XX, (Math.random() - Math.random()) * 5000 + YY, pType);
                    } else {
                        FOOD[j] = new food(this, this.getSize() / (5 + Math.random() * 10), (Math.random() - Math.random()) * 5000 + XX, (Math.random() - Math.random()) * 5000 + YY);
                    }
                }
            }
    }

    // Power-up effect logic
    applyPowerUp(type) {
        if (!this._powerupState) this._powerupState = {};
        let conf = POWERUP_CONFIG[type];
        if (!conf) return;
        if (type === 'shrink') {
            // Instantly shrink snake
            if (mySnake[0].v.length > 10) {
                mySnake[0].v = mySnake[0].v.slice(0, Math.max(10, Math.floor(mySnake[0].v.length / 2)));
            }
        } else {
            this._powerupState[type] = conf.duration;
        }
    }

    checkDie() {
        for (let i = 0; i < mySnake.length; i++) {
            for (let j = 0; j < mySnake.length; j++) {
                if (i !== j) {
                    let collision = false;
                    for (let k = 0; k < mySnake[j].v.length; k++) {
                        if (this.range(mySnake[i].v[0].x, mySnake[i].v[0].y, mySnake[j].v[k].x, mySnake[j].v[k].y) < mySnake[i].size) {
                            collision = true;
                            break;
                        }
                    }
                    if (collision) {
                        for (let k = 0; k < mySnake[i].v.length; k += 5) {
                            FOOD[index] = new food(this, this.getSize() / (2 + Math.random() * 2), mySnake[i].v[k].x + Math.random() * mySnake[i].size / 2, mySnake[i].v[k].y + Math.random() * mySnake[i].size / 2);
                            FOOD[index++].value = 0.4 * mySnake[i].score / (mySnake[i].v.length / 5);
                            if (index >= FOOD.length) index = 0;
                        }
                        if (i === 0) {
                            // Show respawn/quit menu with killer info
                            const killerName = mySnake[j].name;
                            const rank = [...mySnake].sort((a, b) => b.score - a.score).findIndex(snake => snake === mySnake[i]) + 1;
                            if (window.showRespawn) {
                                this.playSound("death"); // Play death sound
                                window.showRespawn({
                                    message: `You were killed by ${killerName}.`,
                                    score: Math.floor(mySnake[i].score),
                                    rank: rank,
                                    killedBy: killerName
                                });
                            }
                            die = true;
                        } else {
                            mySnake[i] = new snake(
                                names[Math.floor(Math.random() * 99999) % names.length],
                                this,
                                Math.max(
                                    Math.floor(mySnake[0].score > 10 * minScore ? mySnake[0].score / 10 : minScore),
                                    mySnake[i].score / 10
                                ),
                                this.randomXY(XX),
                                this.randomXY(YY)
                            );
                        }
                    }
                }
            }
        }
    }

    render() {
        if (this.canvas.width != document.documentElement.clientWidth || this.canvas.height != document.documentElement.clientHeight) {
            this.canvas.width = document.documentElement.clientWidth;
            this.canvas.height = document.documentElement.clientHeight;
            game_W = this.canvas.width;
            game_H = this.canvas.height;
            SPEED = this.getSize() / 7;
            SPEED = 1;
            MaxSpeed = this.getSize() / 7;
            if (mySnake.length == 0)
                return;
            if (mySnake[0].v != null) {
                mySnake[0].v[0].x = XX + game_W / 2;
                mySnake[0].v[0].y = YY + game_H / 2;
            }
        }
    }

    update() {
        // Power-up timers
        if (this._powerupState) {
            for (let k in this._powerupState) {
                if (this._powerupState[k] > 0) this._powerupState[k]--;
            }
        }

        // Power-up food spawn logic
        let powerupCount = FOOD.filter(f => f && f.powerup).length;
        if (powerupCount < MAX_POWERUPS_ON_MAP) {
            this._powerupSpawnTimer--;
            if (this._powerupSpawnTimer <= 0) {
                // Find a normal food to replace
                let normalIndexes = FOOD.map((f, i) => (!f.powerup ? i : -1)).filter(i => i !== -1);
                if (normalIndexes.length > 0) {
                    let idx = normalIndexes[Math.floor(Math.random() * normalIndexes.length)];
                    let pType = PowerUpTypes[Math.floor(Math.random() * PowerUpTypes.length)];
                    FOOD[idx] = new food(this, this.getSize() * 1.2, (Math.random() - Math.random()) * sizeMap, (Math.random() - Math.random()) * sizeMap, pType);
                }
                this._powerupSpawnTimer = this._randPowerupInterval();
            }
        }

        this.render();
        this.unFood();
        this.changeFood();
        this.changeSnake();
        this.updateChXY();
        this.checkDie();

        // Apply power-up effects to player
        if (this._powerupState && this._powerupState.speed > 0) {
            mySnake[0].speed = 2.5;
        }
        // Double points
        if (this._powerupState && this._powerupState.double > 0) {
            mySnake[0].setDoublePoints(true);
        } else {
            mySnake[0].setDoublePoints(false);
        }
        // Invincibility
        if (this._powerupState && this._powerupState.invincible > 0) {
            mySnake[0].setInvincible(true);
        } else {
            mySnake[0].setInvincible(false);
        }

        mySnake[0].dx = chX;
        mySnake[0].dy = chY;
        XX += chX * mySnake[0].speed;
        YY += chY * mySnake[0].speed;
        mySnake[0].v[0].x = XX + game_W / 2;
        mySnake[0].v[0].y = YY + game_H / 2;
    }

    getSize() {
        // Calculate size based on game dimensions or other logic
        return Math.max(60, Math.min(game_W, game_H) / 10); // Further increased size for better visual appearance
    }

    // Optionally, move leaderboard rendering to its own method if needed
    // renderLeaderboard() { ... }

    clearScreen() {
        this.context.clearRect(0, 0, game_W, game_H);
        this.context.drawImage(bg_im, Xfocus, Yfocus, 1.5 * game_W, 1.5 * game_H, 0, 0, game_W, game_H);
    }

    unFood() {
        if (mySnake.length <= 0)
            return;
        for (let i = 0; i < mySnake.length; i++)
            for (let j = 0; j < FOOD.length; j++) {
                if ((mySnake[i].v[0].x - FOOD[j].x) * (mySnake[i].v[0].x - FOOD[j].x) + (mySnake[i].v[0].y - FOOD[j].y) * (mySnake[i].v[0].y - FOOD[j].y) < 1.5 * mySnake[i].size * mySnake[i].size) {
                    // Power-up logic
                    if (FOOD[j].powerup && i === 0) {
                        this.applyPowerUp(FOOD[j].powerup.type);
                        this.playSound("achievement"); // Play achievement sound
                    }
                    this.playSound("eat"); // Play eating sound
                    mySnake[i].score += Math.floor(FOOD[j].value);
                    // Respawn as normal food only
                    FOOD[j] = new food(this, this.getSize() / (5 + Math.random() * 10), (Math.random() - Math.random()) * 5000 + XX, (Math.random() - Math.random()) * 5000 + YY);
                }
            }
    }

    isPoint(x, y) {
        if (x - XX < -3 * this.getSize())
            return false;
        if (y - YY < -3 * this.getSize())
            return false;
        if (x - XX > game_W + 3 * this.getSize())
            return false;
        if (y - YY > game_H + 3 * this.getSize())
            return false;
        return true;
    }

    range(x1, y1, x2, y2) {
        // Calculate the distance between two points (x1, y1) and (x2, y2)
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    randomXY(center) {
        // Generate a random coordinate near the given center
        return center + (Math.random() - Math.random()) * sizeMap / 2;
    }

    drawScores() {
        // Display top 10 scores and highlight the current player's score
        this.context.font = "16px Arial";
        this.context.fillStyle = "white";
        this.context.fillText("Top Scores:", 10, 20);

        // Sort snakes by score in descending order
        const sortedSnakes = [...mySnake].sort((a, b) => b.score - a.score);
        const currentPlayer = mySnake.find(snake => snake.name === this.nickname);

        let displayedCount = 0;
        for (let i = 0; i < sortedSnakes.length && displayedCount < 10; i++) {
            const snake = sortedSnakes[i];
            const isCurrentPlayer = snake === currentPlayer;

            // Highlight the current player's score
            this.context.fillStyle = isCurrentPlayer ? "yellow" : "white";
            const scoreText = `${displayedCount + 1}. ${snake.name}: ${Math.floor(snake.score)}`;
            this.context.fillText(scoreText, 10, 40 + displayedCount * 20);
            displayedCount++;
        }

        // Ensure the current player's score is always displayed if not in the top 10
        if (currentPlayer && !sortedSnakes.slice(0, 10).includes(currentPlayer)) {
            this.context.fillStyle = "yellow";
            const currentPlayerText = `Your Score: ${currentPlayer.name}: ${Math.floor(currentPlayer.score)}`;
            this.context.fillText("...", 10, 40 + displayedCount * 20);
            this.context.fillText(currentPlayerText, 10, 60 + displayedCount * 20);
        }
    }
}

// WebSocket client setup
const socket = io("http://localhost:8000");

// Send player movement to server
function sendPlayerMove() {
    if (mySnake[0]) {
        socket.emit("playerMove", { x: mySnake[0].v[0].x, y: mySnake[0].v[0].y, score: mySnake[0].score });
    }
}

// Listen for updates from server
socket.on("updatePlayers", (players) => {
    Object.keys(players).forEach((id) => {
        if (id !== socket.id) {
            const playerData = players[id];
            let snake = mySnake.find(s => s.id === id);

            if (!snake) {
                // Create a new snake for the player if it doesn't exist
                snake = new snake(`Player ${id}`, window._gameInstance, playerData.score, playerData.x, playerData.y);
                snake.id = id; // Assign the player's ID to the snake
                mySnake.push(snake);
            } else {
                // Update existing snake's position and score
                snake.v[0].x = playerData.x;
                snake.v[0].y = playerData.y;
                snake.score = playerData.score;
            }
        }
    });

    // Remove snakes for disconnected players
    mySnake = mySnake.filter(s => s.id === socket.id || players[s.id]);
});

// Update player movement periodically
setInterval(sendPlayerMove, 100);

// Do not auto-start game; wait for nickname input
// var g = new game();