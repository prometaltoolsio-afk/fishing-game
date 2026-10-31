/**
 * River Angler - 2D Cartoon Fishing Game
 * 100% Procedural & Crash-Safe Version
 */

// অডিও সিন্থেসাইজার (ব্রাউজারে সহজে শব্দ তৈরি করার জন্য)
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type, duration) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
  cast() { this.playTone(400, 'sine', 0.2); }
  splash() { this.playTone(180, 'triangle', 0.25); }
  bite() { this.playTone(650, 'square', 0.15); }
  catchFish() { this.playTone(880, 'sine', 0.4); }
}

const sfx = new SoundFX();

const FISH_TYPES = [
  { name: 'তেলাপিয়া (Tilapia)', color: 0x4bcffa, size: 28, speed: 60, points: 50, stamina: 40 },
  { name: 'রুই (Rohu)', color: 0xe056fd, size: 36, speed: 70, points: 100, stamina: 60 },
  { name: 'কাতলা (Catla)', color: 0xff6b6b, size: 44, speed: 45, points: 150, stamina: 85 },
  { name: 'মাগুর (Magur)', color: 0xf6b93b, size: 32, speed: 85, points: 120, stamina: 70 },
  { name: 'শোল (Snakehead)', color: 0x1dd1a1, size: 40, speed: 95, points: 200, stamina: 95 },
  { name: 'বোয়াল (Boal)', color: 0xff4757, size: 48, speed: 110, points: 250, stamina: 120 }
];

class FishingScene extends Phaser.Scene {
  constructor() {
    super('FishingScene');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.waterY = h * 0.52;
    this.rodTip = { x: 190, y: this.waterY - 45 };

    this.score = 0;
    this.level = 1;
    this.targetLeft = 3;
    this.castState = 'ready'; // ready | flying | floating | fighting
    this.hookedFish = null;
    this.tension = 20;
    this.isReeling = false;

    // ব্যাকগ্রাউন্ড আঁকা
    this.drawEnvironment(w, h);

    // ফিশিং লাইন ও ট্র্যাজেক্টরি গ্রাফিক্স
    this.lineGfx = this.add.graphics().setDepth(15);
    this.aimGfx = this.add.graphics().setDepth(16);

    // ভাসমান টোপ (Bobber)
    this.bobber = this.add.circle(this.rodTip.x, this.rodTip.y, 7, 0xff3838).setDepth(20);
    this.physics.add.existing(this.bobber);
    this.bobber.body.setCollideWorldBounds(true);
    this.bobber.body.setAllowGravity(false);

    // মাছের গ্রুপ তৈরি
    this.fishList = [];
    this.spawnFishes(w, h);

    // ইউজার ইন্টারফেস (UI)
    this.createUI(w, h);

    // কাস্টিং কন্ট্রোল (Drag & Aim)
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    this.input.on('pointerdown', (p) => {
      if (this.castState !== 'ready') return;
      if (p.y > h - 70 || p.y < 50) return;
      this.isDragging = true;
      this.dragStart = { x: p.x, y: p.y };
    });

    this.input.on('pointermove', (p) => {
      if (!this.isDragging) return;
      const dx = this.dragStart.x - p.x;
      const dy = this.dragStart.y - p.y;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
      this.castPower = dist / 150;
      this.castAngle = Math.atan2(dy, dx);
      this.drawTrajectory();
    });

    this.input.on('pointerup', () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.aimGfx.clear();
      if (this.castPower > 0.15) {
        this.castBait();
      }
    });
  }

  drawEnvironment(w, h) {
    const bg = this.add.graphics();

    // আকাশ
    bg.fillGradientStyle(0x74b9ff, 0x74b9ff, 0xa8d8ea, 0xcbe9fc, 1);
    bg.fillRect(0, 0, w, this.waterY);

    // দূরবর্তী পাহাড়
    bg.fillStyle(0x636e72, 0.6);
    bg.beginPath();
    bg.moveTo(0, this.waterY);
    bg.lineTo(w * 0.3, h * 0.3);
    bg.lineTo(w * 0.6, this.waterY);
    bg.lineTo(w * 0.85, h * 0.28);
    bg.lineTo(w, this.waterY);
    bg.fillPath();

    // সবুজ পাহাড়
    bg.fillStyle(0x00b894, 0.9);
    bg.beginPath();
    bg.moveTo(0, this.waterY);
    bg.lineTo(w * 0.2, h * 0.38);
    bg.lineTo(w * 0.55, this.waterY);
    bg.lineTo(w, h * 0.42);
    bg.lineTo(w, this.waterY);
    bg.fillPath();

    // জল
    bg.fillGradientStyle(0x0984e3, 0x0984e3, 0x073b64, 0x051c33, 0.95);
    bg.fillRect(0, this.waterY, w, h - this.waterY);

    // নদীর পাড়
    bg.fillStyle(0x2ed573, 1);
    bg.beginPath();
    bg.moveTo(0, this.waterY + 10);
    bg.lineTo(160, this.waterY + 10);
    bg.quadraticCurveTo(180, this.waterY + 40, 175, h);
    bg.lineTo(0, h);
    bg.fillPath();

    // জেলে (Fisherman)
    const man = this.add.graphics();
    man.fillStyle(0x2d3436, 1); // প্যান্ট
    man.fillRect(115, this.waterY - 35, 20, 40);
    man.fillStyle(0xd63031, 1); // জামা
    man.fillRoundedRect(110, this.waterY - 70, 30, 38, 5);
    man.fillStyle(0xffeaa7, 1); // মুখ
    man.fillCircle(125, this.waterY - 82, 11);
    man.fillStyle(0xfdcb6e, 1); // টুপি
    man.fillEllipse(125, this.waterY - 92, 36, 10);

    // ছিপ (Fishing Rod)
    this.rodGfx = this.add.graphics();
    this.updateRod(0);
  }

  updateRod(bend) {
    this.rodGfx.clear();
    this.rodGfx.lineStyle(4, 0xd35400);
    this.rodGfx.beginPath();
    this.rodGfx.moveTo(130, this.waterY - 60);
    this.rodGfx.quadraticCurveTo(160, this.waterY - 80 - bend, this.rodTip.x, this.rodTip.y + bend);
    this.rodGfx.strokePath();
  }

  spawnFishes(w, h) {
    const count = 5 + this.level * 2;
    for (let i = 0; i < count; i++) {
      const type = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
      const x = 230 + Math.random() * (w - 260);
      const y = this.waterY + 35 + Math.random() * (h - this.waterY - 70);

      const fGfx = this.add.graphics();
      fGfx.fillStyle(type.color, 1);
      fGfx.fillEllipse(0, 0, type.size, type.size * 0.5);
      fGfx.fillTriangle(-type.size * 0.4, 0, -type.size * 0.8, -type.size * 0.3, -type.size * 0.8, type.size * 0.3);
      fGfx.fillStyle(0xffffff, 1);
      fGfx.fillCircle(type.size * 0.25, -2, 3);
      fGfx.fillStyle(0x000000, 1);
      fGfx.fillCircle(type.size * 0.28, -2, 1.5);

      const container = this.add.container(x, y, [fGfx]);
      this.physics.add.existing(container);
      container.body.setAllowGravity(false);
      container.body.setSize(type.size, type.size * 0.5);

      const dir = Math.random() > 0.5 ? 1 : -1;
      container.setScale(dir, 1);
      container.body.setVelocityX(type.speed * dir);

      container.info = {
        ...type,
        curStamina: type.stamina,
        timer: Math.random() * 200
      };

      this.fishList.push(container);
    }
  }

  createUI(w, h) {
    const bar = this.add.graphics().setDepth(30);
    bar.fillStyle(0x000000, 0.5);
    bar.fillRoundedRect(15, 10, w - 30, 42, 8);

    this.scoreTxt = this.add.text(30, 20, `স্কোর: ${this.score}`, { font: 'bold 16px Arial', fill: '#fff' }).setDepth(31);
    this.targetTxt = this.add.text(180, 20, `টার্গেট বাকি: ${this.targetLeft}`, { font: 'bold 16px Arial', fill: '#f1c40f' }).setDepth(31);
    this.levelTxt = this.add.text(350, 20, `লেভেল: ${this.level}/10`, { font: 'bold 16px Arial', fill: '#2ecc71' }).setDepth(31);

    // ফাইট মিটার UI (শুরুতে লুকানো থাকবে)
    this.fightBox = this.add.container(w * 0.5, h * 0.32).setVisible(false).setDepth(100);
    const boxBg = this.add.graphics();
    boxBg.fillStyle(0x222f3e, 0.9);
    boxBg.fillRoundedRect(-120, -75, 240, 150, 12);
    boxBg.lineStyle(2, 0xf1c40f);
    boxBg.strokeRoundedRect(-120, -75, 240, 150, 12);

    const fTitle = this.add.text(0, -55, 'মাছ ধরা পড়েছে! রিল টানুন', { font: 'bold 14px Arial', fill: '#f1c40f' }).setOrigin(0.5);

    // টেনশন বার
    this.add.rectangle(0, -20, 180, 14, 0x576574);
    this.tBar = this.add.rectangle(-90, -20, 0, 14, 0x2ecc71).setOrigin(0, 0.5);

    // স্ট্যামিনা বার
    this.add.rectangle(0, 12, 180, 12, 0x576574);
    this.sBar = this.add.rectangle(-90, 12, 180, 12, 0xe74c3c).setOrigin(0, 0.5);

    // রিল বাটন
    const reelBtn = this.add.rectangle(0, 48, 120, 32, 0xe67e22).setInteractive({ useHandCursor: true });
    reelBtn.setStrokeStyle(2, 0xffffff);
    const reelTxt = this.add.text(0, 48, 'চাপুন (REEL)', { font: 'bold 13px Arial', fill: '#fff' }).setOrigin(0.5);

    reelBtn.on('pointerdown', () => { this.isReeling = true; });
    reelBtn.on('pointerup', () => { this.isReeling = false; });
    reelBtn.on('pointerout', () => { this.isReeling = false; });

    this.fightBox.add([boxBg, fTitle, this.tBar, this.sBar, reelBtn, reelTxt]);
  }

  drawTrajectory() {
    this.aimGfx.clear();
    const vel = this.castPower * 700;
    const vx = Math.cos(this.castAngle) * vel;
    let vy = Math.sin(this.castAngle) * vel;
    let px = this.rodTip.x;
    let py = this.rodTip.y;

    this.aimGfx.fillStyle(0xf1c40f, 0.85);
    for (let i = 0; i < 14; i++) {
      px += vx * 0.045;
      py += vy * 0.045;
      vy += 500 * 0.045;
      if (py > this.waterY) break;
      this.aimGfx.fillCircle(px, py, Math.max(1.5, 4.5 - i * 0.25));
    }
  }

  castBait() {
    sfx.cast();
    this.castState = 'flying';
    this.bobber.setPosition(this.rodTip.x, this.rodTip.y);
    this.bobber.body.setAllowGravity(true);
    this.bobber.body.setGravityY(520);
    const speed = this.castPower * 750;
    this.bobber.body.setVelocity(Math.cos(this.castAngle) * speed, Math.sin(this.castAngle) * speed);
  }

  update(time, delta) {
    // ফিশিং লাইন আঁকা
    this.lineGfx.clear();
    this.lineGfx.lineStyle(1.5, 0xffffff, 0.8);
    this.lineGfx.beginPath();
    this.lineGfx.moveTo(this.rodTip.x, this.rodTip.y);

    if (this.castState === 'ready') {
      this.bobber.setPosition(this.rodTip.x, this.rodTip.y + 10);
      this.lineGfx.lineTo(this.rodTip.x, this.rodTip.y + 10);
    } else {
      const midX = (this.rodTip.x + this.bobber.x) * 0.5;
      const midY = (this.rodTip.y + this.bobber.y) * 0.5 + 20;
      this.lineGfx.quadraticCurveTo(midX, midY, this.bobber.x, this.bobber.y);
    }
    this.lineGfx.strokePath();

    // জলে পড়ার চেক
    if (this.castState === 'flying' && this.bobber.y >= this.waterY) {
      sfx.splash();
      this.castState = 'floating';
      this.bobber.body.setGravityY(0);
      this.bobber.body.setVelocity(this.bobber.body.velocity.x * 0.15, 20);
    }

    if (this.castState === 'floating') {
      if (this.bobber.y > this.waterY + 160) this.bobber.body.setVelocityY(-15);
      else if (this.bobber.y < this.waterY + 30) this.bobber.body.setVelocityY(15);
      this.bobber.body.setVelocityX(this.bobber.body.velocity.x * 0.95);
    }

    // মাছের চলাচল
    this.fishList.forEach(fish => {
      const d = fish.info;
      d.timer -= delta * 0.1;
      if (d.timer <= 0) {
        d.timer = 120 + Math.random() * 150;
        const vx = fish.body.velocity.x > 0 ? -d.speed : d.speed;
        fish.body.setVelocityX(vx);
        fish.setScale(vx > 0 ? 1 : -1, 1);
      }

      if (fish.x < 210) {
        fish.x = 210;
        fish.body.setVelocityX(d.speed);
        fish.setScale(1, 1);
      } else if (fish.x > this.scale.width - 25) {
        fish.x = this.scale.width - 25;
        fish.body.setVelocityX(-d.speed);
        fish.setScale(-1, 1);
      }

      // টোপের দিকে আকর্ষণ
      if (this.castState === 'floating') {
        const dist = Phaser.Math.Distance.Between(fish.x, fish.y, this.bobber.x, this.bobber.y);
        if (dist < 120) {
          this.physics.moveToObject(fish, this.bobber, d.speed * 1.2);
          fish.setScale(this.bobber.x > fish.x ? 1 : -1, 1);
          if (dist < 18) {
            this.hookFish(fish);
          }
        }
      }
    });

    if (this.castState === 'fighting') {
      this.handleFight();
    }
  }

  hookFish(fish) {
    sfx.bite();
    this.castState = 'fighting';
    this.hookedFish = fish;
    this.tension = 30;
    this.fightBox.setVisible(true);
  }

  handleFight() {
    if (!this.hookedFish) return;
    const d = this.hookedFish.info;

    if (this.isReeling) {
      this.tension += 0.55;
      d.curStamina -= 0.35;
      this.updateRod(12);

      const angle = Phaser.Math.Angle.Between(this.bobber.x, this.bobber.y, this.rodTip.x, this.rodTip.y);
      this.bobber.x += Math.cos(angle) * 1.7;
      this.bobber.y += Math.sin(angle) * 1.7;
      this.hookedFish.setPosition(this.bobber.x, this.bobber.y);
    } else {
      this.tension = Math.max(0, this.tension - 0.25);
      this.updateRod(2);
      this.bobber.x += 0.25;
      this.hookedFish.setPosition(this.bobber.x, this.bobber.y);
    }

    this.tBar.width = Math.min(180, (this.tension / 100) * 180);
    this.sBar.width = Math.max(0, (d.curStamina / d.stamina) * 180);

    if (this.tension > 85) this.tBar.setFillStyle(0xe74c3c);
    else if (this.tension < 20) this.tBar.setFillStyle(0xf39c12);
    else this.tBar.setFillStyle(0x2ecc71);

    if (this.tension >= 100) {
      this.endFight(false, 'লাইন ছিঁড়ে গেছে!');
    } else if (this.tension <= 0 && this.bobber.x > 300) {
      this.endFight(false, 'মাছ পালিয়ে গেছে!');
    } else {
      const dist = Phaser.Math.Distance.Between(this.bobber.x, this.bobber.y, this.rodTip.x, this.rodTip.y);
      if (d.curStamina <= 0 || dist < 45) {
        this.endFight(true, `${d.name} ধরেছেন! +${d.points}`);
      }
    }
  }

  endFight(win, msg) {
    this.fightBox.setVisible(false);
    this.updateRod(0);

    const toast = this.add.text(this.scale.width * 0.5, this.scale.height * 0.45, msg, {
      font: 'bold 20px Arial',
      fill: win ? '#2ecc71' : '#e74c3c',
      backgroundColor: '#000000bb',
      padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(200);

    this.time.delayedCall(1800, () => toast.destroy());

    if (win) {
      sfx.catchFish();
      this.score += this.hookedFish.info.points;
      this.targetLeft = Math.max(0, this.targetLeft - 1);
      this.scoreTxt.setText(`স্কোর: ${this.score}`);
      this.targetTxt.setText(`টার্গেট বাকি: ${this.targetLeft}`);

      this.hookedFish.destroy();
      this.fishList = this.fishList.filter(f => f !== this.hookedFish);

      if (this.targetLeft === 0) {
        this.level++;
        this.targetLeft = 3 + this.level;
        this.levelTxt.setText(`লেভেল: ${this.level}/10`);
        this.spawnFishes(this.scale.width, this.scale.height);
      }
    }

    this.castState = 'ready';
    this.bobber.body.setAllowGravity(false);
    this.bobber.body.setVelocity(0, 0);
    this.bobber.setPosition(this.rodTip.x, this.rodTip.y);
    this.hookedFish = null;
  }
}

// গেম কনফিগ
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 540,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [FishingScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
