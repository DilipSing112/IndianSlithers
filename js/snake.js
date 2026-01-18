Nball = 13;
class snake {
    // Power-up state hooks
    setDoublePoints(active) {
        this._doublePoints = !!active;
    }
    setInvincible(active) {
        this._invincible = !!active;
    }

    eatFood(food) {
        let points = Math.floor(food.value);
        if (this._doublePoints) points *= 2;
        this.score += points;
        this.v.push({
            x: this.v[this.v.length - 1].x,
            y: this.v[this.v.length - 1].y
        });
    }

    die(force = false) {
        if (this._invincible && !force) return;
        this.alive = false;
    }
    constructor(name, game, score, x, y) {
        this.name = name;
        this.game = game;
        this.score = score;
        this.x = x;
        this.y = y;
        this.init();
    }

    init() {
        this.time = Math.floor(20 + Math.random() * 100);
        this.speed = 1;
        this.size = this.game.getSize() * 1;
        this.angle = 0;
        this.dx = Math.random() * MaxSpeed - Math.random() * MaxSpeed;
        this.dy = Math.random() * MaxSpeed - Math.random() * MaxSpeed;

        this.v = [];
        for (let i = 0; i < 50; i++)
            this.v[i] = { x: this.x, y: this.y };
        this.sn_im = new Image();
        this.sn_im.src = "images/head.png";
        // Color index for body image, will change as snake grows
        this.initialBodyColorIndex = Math.floor(Math.random() * 999999) % Nball;
        this.bodyColorIndex = this.initialBodyColorIndex;
        this.bd_im = new Image();
        this.bd_im.src = "images/body/" + this.bodyColorIndex + ".png";
    }


    update() {
        this.time--;
        // For player snake (index 0), always use chX/chY and speed for movement
        if (mySnake[0] === this) {
            this.dx = chX;
            this.dy = chY;
            // angle for drawing head
            this.angle = this.getAngle(this.dx, this.dy);
        } else {
            this.angle = this.getAngle(this.dx, this.dy);
            if (this.time > 90)
                this.speed = 2;
            else
                this.speed = 1;
            if (this.time <= 0) {
                this.time = Math.floor(10 + Math.random() * 20);
                this.dx = Math.random() * MaxSpeed - Math.random() * MaxSpeed;
                this.dy = Math.random() * MaxSpeed - Math.random() * MaxSpeed;

                let minRange = Math.sqrt(game_W * game_W + game_H * game_H);

                for (let i = 0; i < FOOD.length; i++) {
                    if (FOOD[i].size > this.game.getSize() / 10 && this.range(this.v[0], FOOD[i]) < minRange) {
                        minRange = this.range(this.v[0], FOOD[i]);
                        this.dx = FOOD[i].x - this.v[0].x;
                        this.dy = FOOD[i].y - this.v[0].y;
                    }
                }
                if (minRange < Math.sqrt(game_W * game_W + game_H * game_H))
                    this.time = 0;

                while (Math.abs(this.dy) * Math.abs(this.dy) + Math.abs(this.dx) * Math.abs(this.dx) > MaxSpeed * MaxSpeed && this.dx * this.dy != 0) {
                    this.dx /= 1.1;
                    this.dy /= 1.1;
                }
                while (Math.abs(this.dy) * Math.abs(this.dy) + Math.abs(this.dx) * Math.abs(this.dx) < MaxSpeed * MaxSpeed && this.dx * this.dy != 0) {
                    this.dx *= 1.1;
                    this.dy *= 1.1;
                }
            }
            this.score += this.score / 666;
        }

        this.v[0].x += this.dx * this.speed;
        this.v[0].y += this.dy * this.speed;

        // Change color as snake grows (score increases), but only at thresholds
        let thresholds = [500, 1000, 2000, 4000, 8000, 16000];
        let newColorIndex = this.initialBodyColorIndex;
        for (let i = 0; i < thresholds.length; i++) {
            if (this.score > thresholds[i]) {
                newColorIndex = (this.initialBodyColorIndex + i + 1) % Nball;
            }
        }
        if (newColorIndex !== this.bodyColorIndex) {
            this.bodyColorIndex = newColorIndex;
            this.bd_im.src = "images/body/" + this.bodyColorIndex + ".png";
        }

        for (let i = 1; i < this.v.length; i++) {
            if (this.range(this.v[i], this.v[i - 1]) > this.size / 5) {
                this.v[i].x = (this.v[i].x + this.v[i - 1].x) / 2;
                this.v[i].y = (this.v[i].y + this.v[i - 1].y) / 2;
                this.v[i].x = (this.v[i].x + this.v[i - 1].x) / 2;
                this.v[i].y = (this.v[i].y + this.v[i - 1].y) / 2;
            }
        }
        if (this.score < 200)
            return;
        if (this.speed == 2)
            this.score -= this.score / 2000;;
        let csUp = Math.pow((this.score) / 1000, 1 / 5);
        this.size = this.game.getSize() / 2 * csUp;
        let N = 3 * Math.floor(50 * Math.pow((this.score) / 1000, 1 / 1));
        if (N > this.v.length) {
            this.v[this.v.length] = { x: this.v[this.v.length - 1].x, y: this.v[this.v.length - 1].y };
        } else
            this.v = this.v.slice(0, N);
    }

    // Add blinking and tongue state
    _blinkState = {
        t: 0,
        closed: false,
        nextBlink: Math.random() * 60 + 60 // frames until next blink
    };
    _tongueState = {
        t: 0,
        out: false,
        nextFlick: Math.random() * 30 + 30 // frames until next flick
    };

    draw() {
        this.update();

        const glowSegments = 30;
        for (let i = this.v.length - 1; i >= 1; i--) {
            if (this.game.isPoint(this.v[i].x, this.v[i].y)) {
                if (this.speed === 2 && i < glowSegments) {
                    // Glowing effect: draw a colored shadow only for first N segments near the head
                    this.game.context.save();
                    this.game.context.shadowColor = '#ffff66';
                    this.game.context.shadowBlur = this.size * 0.7;
                    // Reduce alpha as snake grows
                    let minAlpha = 0.25, maxAlpha = 0.85;
                    let alpha = maxAlpha - (maxAlpha - minAlpha) * (this.v.length / 200);
                    if (alpha < minAlpha) alpha = minAlpha;
                    this.game.context.globalAlpha = alpha;
                    this.game.context.drawImage(this.bd_im, this.v[i].x - XX - (this.size) / 2, this.v[i].y - YY - (this.size) / 2, this.size, this.size);
                    this.game.context.restore();
                } else {
                    // Normal body only
                    this.game.context.drawImage(this.bd_im, this.v[i].x - XX - (this.size) / 2, this.v[i].y - YY - (this.size) / 2, this.size, this.size);
                }
            }
        }

        // Draw player name above the head
        if (this.game.isPoint(this.v[0].x, this.v[0].y)) {
            this.game.context.save();
            this.game.context.font = Math.max(14, this.size / 2) + 'px Arial Black';
            this.game.context.textAlign = 'center';
            this.game.context.textBaseline = 'bottom';
            this.game.context.fillStyle = '#222';
            this.game.context.strokeStyle = '#fff';
            this.game.context.lineWidth = 3;
            // Stroke for readability
            this.game.context.strokeText(this.name, this.v[0].x - XX, this.v[0].y - YY - this.size / 2 - 4);
            this.game.context.fillStyle = '#ffeb3b';
            this.game.context.fillText(this.name, this.v[0].x - XX, this.v[0].y - YY - this.size / 2 - 4);
            this.game.context.restore();
        }

        // Blinking logic: blink every 1-2 seconds, close for 5-7 frames
        this._blinkState.t++;
        if (!this._blinkState.closed && this._blinkState.t > this._blinkState.nextBlink) {
            this._blinkState.closed = true;
            this._blinkState.t = 0;
            this._blinkState.nextBlink = 5 + Math.floor(Math.random() * 3); // closed for 5-7 frames
        } else if (this._blinkState.closed && this._blinkState.t > this._blinkState.nextBlink) {
            this._blinkState.closed = false;
            this._blinkState.t = 0;
            this._blinkState.nextBlink = 60 + Math.floor(Math.random() * 60); // open for 1-2 seconds
        }

        // Tongue flick logic: flick every 0.5-1s, out for 6-10 frames
        this._tongueState.t++;
        if (!this._tongueState.out && this._tongueState.t > this._tongueState.nextFlick) {
            this._tongueState.out = true;
            this._tongueState.t = 0;
            this._tongueState.nextFlick = 6 + Math.floor(Math.random() * 5); // out for 6-10 frames
        } else if (this._tongueState.out && this._tongueState.t > this._tongueState.nextFlick) {
            this._tongueState.out = false;
            this._tongueState.t = 0;
            this._tongueState.nextFlick = 30 + Math.floor(Math.random() * 30); // in for 0.5-1s
        }

        // Draw head with slinking, blinking eyes and tongue
        this.game.context.save();
        this.game.context.translate(this.v[0].x - XX, this.v[0].y - YY);
        this.game.context.rotate(this.angle - Math.PI / 2);
        this.game.context.drawImage(this.sn_im, -this.size / 2, -this.size / 2, this.size, this.size);

        // Draw tongue if out
        if (this._tongueState.out) {
            let tongueLen = this.size * (0.45 + 0.1 * Math.sin(Date.now() / 60));
            let tongueWidth = this.size * 0.07;
            let mouthY = this.size * 0.38;
            // Main tongue
            this.game.context.save();
            this.game.context.beginPath();
            this.game.context.moveTo(0, mouthY);
            this.game.context.lineTo(-tongueWidth, mouthY + tongueLen * 0.7);
            this.game.context.lineTo(0, mouthY + tongueLen);
            this.game.context.lineTo(tongueWidth, mouthY + tongueLen * 0.7);
            this.game.context.closePath();
            this.game.context.fillStyle = '#e53935';
            this.game.context.fill();
            // Forked tip
            this.game.context.beginPath();
            this.game.context.moveTo(0, mouthY + tongueLen);
            this.game.context.lineTo(-tongueWidth * 0.5, mouthY + tongueLen + tongueWidth * 1.2);
            this.game.context.lineTo(0, mouthY + tongueLen + tongueWidth * 0.7);
            this.game.context.lineTo(tongueWidth * 0.5, mouthY + tongueLen + tongueWidth * 1.2);
            this.game.context.closePath();
            this.game.context.fillStyle = '#b71c1c';
            this.game.context.fill();
            this.game.context.restore();
        }

        // Draw animated eyes that follow the direction
        let eyeOffsetX = this.size * 0.18;
        let eyeOffsetY = -this.size * 0.18;
        let eyeRadius = this.size * 0.13;
        let pupilRadius = this.size * 0.06;
        // Eye slink: pupils move in direction of dx/dy
        let dx = this.dx, dy = this.dy;
        let mag = Math.sqrt(dx * dx + dy * dy) || 1;
        let pupilMove = this.size * 0.05;
        let px = (dx / mag) * pupilMove;
        let py = (dy / mag) * pupilMove;

        if (!this._blinkState.closed) {
            // Left eye
            this.game.context.beginPath();
            this.game.context.arc(-eyeOffsetX, eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
            this.game.context.fillStyle = '#fff';
            this.game.context.fill();
            this.game.context.closePath();
            // Right eye
            this.game.context.beginPath();
            this.game.context.arc(eyeOffsetX, eyeOffsetY, eyeRadius, 0, 2 * Math.PI);
            this.game.context.fillStyle = '#fff';
            this.game.context.fill();
            this.game.context.closePath();
            // Left pupil
            this.game.context.beginPath();
            this.game.context.arc(-eyeOffsetX + px, eyeOffsetY + py, pupilRadius, 0, 2 * Math.PI);
            this.game.context.fillStyle = '#222';
            this.game.context.fill();
            this.game.context.closePath();
            // Right pupil
            this.game.context.beginPath();
            this.game.context.arc(eyeOffsetX + px, eyeOffsetY + py, pupilRadius, 0, 2 * Math.PI);
            this.game.context.fillStyle = '#222';
            this.game.context.fill();
            this.game.context.closePath();
        } else {
            // Draw closed eyelids (blinking)
            // Left eye lid
            this.game.context.beginPath();
            this.game.context.ellipse(-eyeOffsetX, eyeOffsetY, eyeRadius, eyeRadius * 0.5, 0, 0, 2 * Math.PI);
            this.game.context.fillStyle = '#222';
            this.game.context.fill();
            this.game.context.closePath();
            // Right eye lid
            this.game.context.beginPath();
            this.game.context.ellipse(eyeOffsetX, eyeOffsetY, eyeRadius, eyeRadius * 0.5, 0, 0, 2 * Math.PI);
            this.game.context.fillStyle = '#222';
            this.game.context.fill();
            this.game.context.closePath();
        }

        this.game.context.restore();
    }

    getAngle(a, b) {
        let c = Math.sqrt(a * a + b * b);
        let al = Math.acos(a / c);
        if (b < 0)
            al += 2 * (Math.PI - al);
        return al;
    }

    range(v1, v2) {
        return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
    }
}