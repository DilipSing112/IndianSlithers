ArrColor = ["#FF0000", "#FFFF00", "#00FF00", "#FF00FF", "#FFFFFF", "#00FFFF", "#7FFF00", "#FFCC00"];
window.PowerUpTypes = [
    { type: 'speed', color: '#FFD600' },
    { type: 'invincible', color: '#2196F3' },
    { type: 'shrink', color: '#43A047' },
    { type: 'double', color: '#8E24AA' }
];

class food {
    constructor(game, size, x, y, powerup = null) {
        this.game = game;
        this.size = size;
        this.value = this.size;
        this.x = x;
        this.y = y;
        this.powerup = powerup; // null or {type, color, icon}
        this.init();
    }

    init() {
        if (this.powerup) {
            this.color = this.powerup.color;
        } else {
            this.color = ArrColor[Math.floor(Math.random() * 99999) % ArrColor.length];
        }
    }

    draw() {
        if (this.game.isPoint(this.x, this.y)) {
            this.game.context.save();
            let isPower = !!this.powerup;
            // Make power-up food smaller and unique
            let r = isPower ? this.size * 0.28 : this.size / 2;
            let cx = this.x - this.size / 4 - XX;
            let cy = this.y - this.size / 4 - YY;
            this.game.context.beginPath();
            this.game.context.arc(cx, cy, r, 0, Math.PI * 2, false);
            this.game.context.fillStyle = this.color;
            this.game.context.shadowColor = isPower ? this.color : 'transparent';
            this.game.context.shadowBlur = isPower ? 18 : 0;
            this.game.context.fill();
            // Add a white border for power-up food
            if (isPower) {
                this.game.context.lineWidth = 2.5;
                this.game.context.strokeStyle = '#fff';
                this.game.context.stroke();
            }
            this.game.context.closePath();
            this.game.context.restore();
        }
    }
}