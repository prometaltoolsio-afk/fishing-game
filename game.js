/**
 * River Angler - 2D Cartoon Fishing Puzzle
 * Complete Playable Stage 1 Prototype
 */

// --- 1. Procedural Audio Synthesizer (Zero External Dependencies) ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCast() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playSplash() {
    if (this.muted) return;
    this.init();
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.25);
    whiteNoise.connect(filter);
    filter.connect(this.ctx.destination);
    whiteNoise.start();
  }

  playBite() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.setValueAtTime(700, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playReelClick() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(950, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  playCatch() {
    if (this.muted) return;
    this.init();
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.25);
    });
  }
}

const sounds = new SoundController();

// --- 2. Fish Species Registry ---
const FISH_SPECIES = [
  { name: 'Tilapia', color: 0x4bcffa, size: 28, speed: 65, points: 50, stamina: 40, prefBait: 'worm' },
  { name: 'Rohu', color: 0xe056fd, size: 36, speed: 75, points: 100, stamina: 65, prefBait: 'dough' },
  { name: 'Catla', color: 0xff6b6b, size: 42, speed: 50, points: 150, stamina: 85, prefBait: 'dough' },
  { name: 'Magur', color: 0xf6b93b, size: 32, speed: 90, points: 120, stamina: 70, prefBait: 'insect' },
  { name: 'Snakehead', color: 0x1dd1a1, size: 45, speed: 110, points: 220, stamina: 110, prefBait: 'small_fish' },
  { name: 'Boal', color: 0xff4757, size: 52, speed: 125, points: 300, stamina: 140, prefBait: 'special' }
];

// --- 3. Main Fishing Scene ---
class FishingGameScene extends Phaser.Scene {
  constructor() {
    super('FishingGameScene');
  }

  create() {
    const { width, height } = this.scale;
    this.waterLevel = height * 0.52;
    this.rodTip = { x: 195, y: height * 0.44 - 38 };

    // Player State
    this.score = 0;
    this.coins = 0;
    this.currentLevel = 1;
    this.targetFishLeft = 3;
    this.activeBait = 'worm';
    this.isCasting = false;
    this.baitCastState = 'ready'; // ready | flying | floating | fighting | reeling
    this.hookedFish = null;

    // Build Graphics & Background
    this.createAtmosphere(width, height);
    this.createFisherman(width, height);

    // Fishing Line Graphics Pipeline
    this.lineGraphics = this.add.graphics();
    this.aimGraphics = this.add.graphics();

    // Bait Bobber Sprite (Procedural Texture)
    this.createProceduralTextures();
    this.bobber = this.physics.add.sprite(this.rodTip.x, this.rodTip.y, 'bobber_tex');
    this.bobber.setCollideWorldBounds(true);
    this.bobber.body.setAllowGravity(false);
    this.bobber.setDepth(20);

    // Fish Group
    this.fishGroup = this.physics.add.group();
    this.spawnSchoolOfFish();

    // UI Systems
    this.createUI(width, height);
    this.createFightSystemUI(width, height);

    // Interactive Aiming Controls (Sling/Angle Dragging)
    this.dragStart = null;
    this.currentPower = 0;
    this.currentAngle = 0;

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
  }

  createProceduralTextures() {
    // Bobber Graphic
    const bg = this.make.graphics({ x: 0, y: 0, add: false });
    bg.fillStyle(0xff3838);
    bg.fillCircle(8, 8, 8);
    bg.fillStyle(0xffffff);
    bg.fillRect(0, 7, 16, 5);
    bg.generateTexture('bobber_tex', 16, 16);

    // Bubble Graphic
    const bub = this.make.graphics({ x: 0, y: 0, add: false });
    bub.lineStyle(1.5, 0xffffff, 0.8);
    bub.strokeCircle(6, 6, 5);
    bub.generateTexture('bubble_tex', 12, 12);
  }

  createAtmosphere(w, h) {
    // Sky Gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x70a1ff, 0x70a1ff, 0xa1c4fd, 0xc2e9fb, 1);
    sky.fillRect(0, 0, w, this.waterLevel);

    // Distant Mountains
    const mountains = this.add.graphics();
    mountains.fillStyle(0x576574, 0.6);
    mountains.beginPath();
    mountains.moveTo(0, this.waterLevel);
    mountains.lineTo(w * 0.25, h * 0.3);
    mountains.lineTo(w * 0.5, this.waterLevel);
    mountains.lineTo(w * 0.75, h * 0.28);
    mountains.lineTo(w, this.waterLevel);
    mountains.closePath();
    mountains.fillPath();

    // Green Hills
    const hills = this.add.graphics();
    hills.fillStyle(0x10ac84, 0.9);
    hills.beginPath();
    hills.moveTo(0, this.waterLevel);
    hills.lineTo(w * 0.15, h * 0.38);
    hills.lineTo(w * 0.45, this.waterLevel);
    hills.lineTo(w * 0.85, h * 0.4);
    hills.lineTo(w, this.waterLevel);
    hills.closePath();
    hills.fillPath();

    // Water Depth Body
    const water = this.add.graphics();
    water.fillGradientStyle(0x2e86de, 0x2e86de, 0x0a3d62, 0x071e3d, 0.92);
    water.fillRect(0, this.waterLevel, w, h - this.waterLevel);

    // Water Surface Sheen
    this.waterSurface = this.add.graphics();
    this.waterWaveOffset = 0;

    // Riverbed Terrain (Right & Bottom)
    const bed = this.add.graphics();
    bed.fillStyle(0x3d3d3d, 1);
    bed.beginPath();
    bed.moveTo(0, h);
    bed.lineTo(0, h - 35);
    bed.bezierCurveTo(w * 0.3, h - 45, w * 0.7, h - 20, w, h - 50);
    bed.lineTo(w, h);
    bed.closePath();
    bed.fillPath();

    // Floating Clouds
    this.clouds = [];
    for (let i = 0; i < 4; i++) {
      const cloud = this.add.graphics();
      cloud.fillStyle(0xffffff, 0.75);
      cloud.fillCircle(0, 0, 22);
      cloud.fillCircle(20, -6, 26);
      cloud.fillCircle(42, 0, 20);
      cloud.x = Math.random() * w;
      cloud.y = 50 + Math.random() * 80;
      cloud.speed = 0.25 + Math.random() * 0.3;
      this.clouds.push(cloud);
    }
  }

  createFisherman(w, h) {
    const bank = this.add.graphics();
    // Grassy Riverbank on Left
    bank.fillStyle(0x2ed573, 1);
    bank.beginPath();
    bank.moveTo(0, this.waterLevel + 20);
    bank.lineTo(165, this.waterLevel + 20);
    bank.quadraticCurveTo(185, this.waterLevel + 40, 180, h);
    bank.lineTo(0, h);
    bank.closePath();
    bank.fillPath();

    // Cartoon Fisherman Character
    const fm = this.add.graphics();
    // Body / Legs
    fm.fillStyle(0x2f3542, 1); // Pants
    fm.fillRect(115, this.waterLevel - 35, 22, 38);
    fm.fillStyle(0xff4757, 1); // Jacket
    fm.fillRoundedRect(110, this.waterLevel - 70, 32, 40, 6);
    // Face & Hat
    fm.fillStyle(0xfad390, 1); // Face
    fm.fillCircle(126, this.waterLevel - 82, 12);
    fm.fillStyle(0xf6b93b, 1); // Straw Hat
    fm.fillEllipse(126, this.waterLevel - 94, 38, 12);
    fm.fillRect(116, this.waterLevel - 105, 20, 14);

    // Fishing Rod (Bamboo Tone)
    this.rodGraphics = this.add.graphics();
    this.redrawRod(0);
  }

  redrawRod(bendAngle = 0) {
    this.rodGraphics.clear();
    this.rodGraphics.lineStyle(4, 0xb8860b);
    this.rodGraphics.beginPath();
    this.rodGraphics.moveTo(132, this.waterLevel - 60);
    // Bend curve reacts to casting or fish pull
    this.rodGraphics.quadraticCurveTo(165, this.waterLevel - 80 - bendAngle, this.rodTip.x, this.rodTip.y + bendAngle);
    this.rodGraphics.strokePath();
  }

  spawnSchoolOfFish() {
    const { width, height } = this.scale;
    const fishCount = 6 + this.currentLevel * 2;

    for (let i = 0; i < fishCount; i++) {
      const type = FISH_SPECIES[Math.floor(Math.random() * Math.min(this.currentLevel + 2, FISH_SPECIES.length))];
      const x = 240 + Math.random() * (width - 280);
      const y = this.waterLevel + 45 + Math.random() * (height - this.waterLevel - 90);

      const fishContainer = this.add.container(x, y);
      const fishBody = this.add.graphics();

      // Draw Fish Vector
      fishBody.fillStyle(type.color, 1);
      fishBody.fillEllipse(0, 0, type.size, type.size * 0.52);
      // Tail
      fishBody.beginPath();
      fishBody.moveTo(-type.size * 0.45, 0);
      fishBody.lineTo(-type.size * 0.85, -type.size * 0.35);
      fishBody.lineTo(-type.size * 0.85, type.size * 0.35);
      fishBody.closePath();
      fishBody.fillPath();
      // Eye
      fishBody.fillStyle(0xffffff, 1);
      fishBody.fillCircle(type.size * 0.25, -type.size * 0.1, 3);
      fishBody.fillStyle(0x000000, 1);
      fishBody.fillCircle(type.size * 0.28, -type.size * 0.1, 1.5);

      fishContainer.add(fishBody);
      this.physics.world.enable(fishContainer);

      fishContainer.body.setAllowGravity(false);
      fishContainer.body.setSize(type.size, type.size * 0.5);

      const direction = Math.random() > 0.5 ? 1 : -1;
      fishContainer.setScale(direction, 1);
      fishContainer.body.setVelocityX(type.speed * direction);

      fishContainer.fishData = {
        ...type,
        currentStamina: type.stamina,
        turnTimer: Math.random() * 200,
        wiggleTimer: 0
      };

      this.fishGroup.add(fishContainer);
    }
  }

  createUI(w, h) {
    // Header Info Board
    const header = this.add.graphics();
    header.fillStyle(0x000000, 0.45);
    header.fillRoundedRect(16, 12, w - 32, 48, 10);

    this.scoreText = this.add.text(32, 24, `Score: ${this.score}`, {
      font: 'bold 18px Arial',
      fill: '#ffffff'
    });
    this.targetText = this.add.text(180, 24, `Target Left: ${this.targetFishLeft}`, {
      font: 'bold 18px Arial',
      fill: '#fed330'
    });
    this.levelText = this.add.text(360, 24, `Level: ${this.currentLevel}/10`, {
      font: 'bold 18px Arial',
      fill: '#2bcbba'
    });

    // Bait Selection Buttons
    const baits = [
      { id: 'worm', label: '🪱 Worm' },
      { id: 'dough', label: '🍞 Dough' },
      { id: 'insect', label: '🦗 Insect' },
      { id: 'small_fish', label: '🐟 Minnow' },
      { id: 'special', label: '⭐ Master' }
    ];

    this.baitButtons = [];
    baits.forEach((b, idx) => {
      const btnX = 40 + idx * 95;
      const btnY = h - 35;
      const btn = this.add.rectangle(btnX, btnY, 85, 32, idx === 0 ? 0x20bf6b : 0x4b6584, 0.9)
        .setInteractive({ useHandCursor: true });
      btn.setStrokeStyle(2, 0xffffff, 0.8);

      const txt = this.add.text(btnX, btnY, b.label, {
        font: 'bold 12px Arial',
        fill: '#ffffff'
      }).setOrigin(0.5);

      btn.on('pointerdown', () => {
        if (this.baitCastState !== 'ready') return;
        this.activeBait = b.id;
        this.baitButtons.forEach(button => button.setFillStyle(0x4b6584, 0.9));
        btn.setFillStyle(0x20bf6b, 0.9);
      });

      this.baitButtons.push(btn);
    });

    // Audio Mute Toggle Button
    const muteBtn = this.add.rectangle(w - 50, 36, 40, 32, 0x4b6584, 0.8).setInteractive({ useHandCursor: true });
    const muteText = this.add.text(w - 50, 36, '🔊', { font: '18px Arial' }).setOrigin(0.5);
    muteBtn.on('pointerdown', () => {
      sounds.muted = !sounds.muted;
      muteText.setText(sounds.muted ? '🔇' : '🔊');
    });
  }

  createFightSystemUI(w, h) {
    // Hidden tension meter & reel challenge widget
    this.fightWidget = this.add.container(w * 0.5, h * 0.35).setVisible(false).setDepth(100);

    const bgPanel = this.add.graphics();
    bgPanel.fillStyle(0x1e272c, 0.85);
    bgPanel.fillRoundedRect(-140, -90, 280, 180, 16);
    bgPanel.lineStyle(3, 0xf1c40f, 0.9);
    bgPanel.strokeRoundedRect(-140, -90, 280, 180, 16);

    const title = this.add.text(0, -68, 'FISH HOOKED! REEL IN!', {
      font: 'bold 16px Arial',
      fill: '#f1c40f'
    }).setOrigin(0.5);

    // Tension Bar Backdrop
    const tensionBg = this.add.rectangle(0, -30, 200, 18, 0x2c3e50);
    this.tensionFill = this.add.rectangle(-100, -30, 0, 18, 0x2ecc71).setOrigin(0, 0.5);
    const tensionLabel = this.add.text(0, -45, 'LINE TENSION (Keep Balanced)', {
      font: '11px Arial',
      fill: '#ecf0f1'
    }).setOrigin(0.5);

    // Fish Stamina Bar
    const staminaBg = this.add.rectangle(0, 8, 200, 14, 0x2c3e50);
    this.staminaFill = this.add.rectangle(-100, 8, 200, 14, 0xe74c3c).setOrigin(0, 0.5);
    const staminaLabel = this.add.text(0, -5, 'FISH STAMINA', {
      font: '11px Arial',
      fill: '#ecf0f1'
    }).setOrigin(0.5);

    // Reel Action Button
    this.reelButton = this.add.rectangle(0, 52, 130, 36, 0xe67e22)
      .setInteractive({ useHandCursor: true });
    this.reelButton.setStrokeStyle(2, 0xffffff);
    const reelBtnText = this.add.text(0, 52, 'HOLD TO REEL', {
      font: 'bold 13px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.isReeling = false;
    this.reelButton.on('pointerdown', () => { this.isReeling = true; });
    this.reelButton.on('pointerup', () => { this.isReeling = false; });
    this.reelButton.on('pointerout', () => { this.isReeling = false; });

    this.fightWidget.add([
      bgPanel, title, tensionBg, this.tensionFill, tensionLabel,
      staminaBg, this.staminaFill, staminaLabel, this.reelButton, reelBtnText
    ]);

    this.tension = 20; // 0 to 100
  }

  // --- 4. Angry Birds Style Slingshot Aim & Cast Input ---
  onPointerDown(pointer) {
    if (this.baitCastState !== 'ready') return;
    if (pointer.y > this.scale.height - 65 || pointer.y < 60) return; // Ignore top/bottom UI clicks

    this.dragStart = { x: pointer.x, y: pointer.y };
    this.isCasting = true;
  }

  onPointerMove(pointer) {
    if (!this.isCasting || !this.dragStart) return;

    // Calculate pull delta (pull backward to shoot forward)
    const dx = this.dragStart.x - pointer.x;
    const dy = this.dragStart.y - pointer.y;

    const pullDistance = Math.min(Math.sqrt(dx * dx + dy * dy), 160);
    this.currentPower = pullDistance / 160; // 0 to 1
    this.currentAngle = Math.atan2(dy, dx);

    // Draw Angry Birds style dotted arc trajectory
    this.drawAimArc(this.currentPower, this.currentAngle);
  }

  drawAimArc(power, angle) {
    this.aimGraphics.clear();
    const dots = 14;
    const velocity = power * 720;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    const dt = 0.045;

    let posX = this.rodTip.x;
    let posY = this.rodTip.y;
    let simVy = vy;

    this.aimGraphics.fillStyle(0xf1c40f, 0.85);

    for (let i = 0; i < dots; i++) {
      posX += vx * dt;
      posY += simVy * dt;
      simVy += 500 * dt; // Match scene gravity

      if (posY > this.waterLevel) {
        // Draw splash landing marker
        this.aimGraphics.lineStyle(2, 0x00d2d3, 0.8);
        this.aimGraphics.strokeCircle(posX, this.waterLevel, 6 + i * 0.4);
        break;
      }

      const dotRadius = Math.max(1.5, 4.5 - i * 0.25);
      this.aimGraphics.fillCircle(posX, posY, dotRadius);
    }
  }

  onPointerUp(pointer) {
    if (!this.isCasting) return;
    this.isCasting = false;
    this.aimGraphics.clear();

    if (this.currentPower > 0.15) {
      this.executeCast(this.currentPower, this.currentAngle);
    }
  }

  executeCast(power, angle) {
    sounds.playCast();
    this.baitCastState = 'flying';

    this.bobber.setPosition(this.rodTip.x, this.rodTip.y);
    this.bobber.body.setAllowGravity(true);
    this.bobber.body.setGravityY(520);

    const speed = power * 750;
    this.bobber.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  createSplash(x, y) {
    sounds.playSplash();
    for (let i = 0; i < 9; i++) {
      const drop = this.add.graphics();
      drop.fillStyle(0xdff9fb, 0.9);
      drop.fillCircle(0, 0, 2 + Math.random() * 2);
      drop.setPosition(x, y);
      const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
      const speed = 60 + Math.random() * 110;

      this.tweens.add({
        targets: drop,
        x: x + Math.cos(angle) * speed * 0.45,
        y: y + Math.sin(angle) * speed * 0.45 + 15,
        alpha: 0,
        duration: 350 + Math.random() * 200,
        onComplete: () => drop.destroy()
      });
    }
  }

  // --- 5. Main Game Loop ---
  update(time, delta) {
    // Animate clouds
    this.clouds.forEach(c => {
      c.x += c.speed;
      if (c.x > this.scale.width + 50) c.x = -60;
    });

    // Animate water ripple surface
    this.waterWaveOffset += 0.05;
    this.waterSurface.clear();
    this.waterSurface.lineStyle(2.5, 0x54a0ff, 0.85);
    this.waterSurface.beginPath();
    this.waterSurface.moveTo(0, this.waterLevel);
    for (let x = 0; x <= this.scale.width; x += 20) {
      const y = this.waterLevel + Math.sin(x * 0.02 + this.waterWaveOffset) * 2.5;
      this.waterSurface.lineTo(x, y);
    }
    this.waterSurface.strokePath();

    // Render Dynamic Elastic Fishing Line
    this.lineGraphics.clear();
    this.lineGraphics.lineStyle(1.5, 0xf5f6fa, 0.75);
    this.lineGraphics.beginPath();
    this.lineGraphics.moveTo(this.rodTip.x, this.rodTip.y);

    if (this.baitCastState === 'ready') {
      // Resting on rod
      this.lineGraphics.lineTo(this.rodTip.x, this.rodTip.y + 12);
      this.bobber.setPosition(this.rodTip.x, this.rodTip.y + 12);
    } else {
      // Sag / Arc effect when flying or immersed
      const midX = (this.rodTip.x + this.bobber.x) * 0.5;
      const midY = (this.rodTip.y + this.bobber.y) * 0.5 + (this.baitCastState === 'flying' ? 12 : 25);
      this.lineGraphics.quadraticCurveTo(midX, midY, this.bobber.x, this.bobber.y);
    }
    this.lineGraphics.strokePath();

    // Bobber State Machine Underwater
    if (this.baitCastState === 'flying' && this.bobber.y >= this.waterLevel) {
      this.createSplash(this.bobber.x, this.waterLevel);
      this.baitCastState = 'floating';
      this.bobber.body.setVelocity(this.bobber.body.velocity.x * 0.15, 25);
      this.bobber.body.setGravityY(0);
    }

    if (this.baitCastState === 'floating') {
      // Buoyancy and gentle sink
      if (this.bobber.y > this.waterLevel + 180) {
        this.bobber.body.setVelocityY(-15);
      } else if (this.bobber.y < this.waterLevel + 40) {
        this.bobber.body.setVelocityY(15);
      }
      this.bobber.body.setVelocityX(this.bobber.body.velocity.x * 0.94);
    }

    // Update AI fish swimming & Bait Detection
    this.updateFishAI(delta);

    // Update Fish Fight Challenge
    if (this.baitCastState === 'fighting') {
      this.updateFight(delta);
    }
  }

  updateFishAI(delta) {
    const { width, height } = this.scale;

    this.fishGroup.getChildren().forEach(fish => {
      const data = fish.fishData;
      data.turnTimer -= delta * 0.1;

      // Natural patrol wandering
      if (data.turnTimer <= 0) {
        data.turnTimer = 100 + Math.random() * 180;
        const speed = (data.speed * (0.7 + Math.random() * 0.6));
        const newVx = fish.body.velocity.x > 0 ? -speed : speed;
        fish.body.setVelocityX(newVx);
        fish.setScale(newVx > 0 ? 1 : -1, 1);
      }

      // Keep within water boundaries
      if (fish.x < 210) {
        fish.x = 210;
        fish.body.setVelocityX(Math.abs(fish.body.velocity.x));
        fish.setScale(1, 1);
      } else if (fish.x > width - 30) {
        fish.x = width - 30;
        fish.body.setVelocityX(-Math.abs(fish.body.velocity.x));
        fish.setScale(-1, 1);
      }

      // Check proximity to bait if floating in water
      if (this.baitCastState === 'floating') {
        const dist = Phaser.Math.Distance.Between(fish.x, fish.y, this.bobber.x, this.bobber.y);
        if (dist < 130) {
          // Attracted to bait! Move towards it
          this.physics.moveToObject(fish, this.bobber, data.speed * 1.3);
          fish.setScale(this.bobber.x > fish.x ? 1 : -1, 1);

          // Hook bite event
          if (dist < 18) {
            this.hookFish(fish);
          }
        }
      }
    });
  }

  hookFish(fish) {
    sounds.playBite();
    this.baitCastState = 'fighting';
    this.hookedFish = fish;
    this.tension = 35;
    this.fightWidget.setVisible(true);

    // Visual ripple alert
    this.createSplash(this.bobber.x, this.waterLevel);
  }

  updateFight(delta) {
    if (!this.hookedFish) return;

    const data = this.hookedFish.fishData;

    // Fish pulls periodically
    const pullPower = 0.22 * (data.stamina / 50);

    if (this.isReeling) {
      sounds.playReelClick();
      this.tension += 0.55;
      data.currentStamina -= 0.32;
      this.redrawRod(12);

      // Pull bobber & fish towards fisherman
      const angle = Phaser.Math.Angle.Between(this.bobber.x, this.bobber.y, this.rodTip.x, this.rodTip.y);
      this.bobber.x += Math.cos(angle) * 1.6;
      this.bobber.y += Math.sin(angle) * 1.6;
      this.hookedFish.setPosition(this.bobber.x, this.bobber.y);
    } else {
      // Natural recovery & line slack
      this.tension = Math.max(0, this.tension - 0.28);
      this.redrawRod(2);
      // Fish slowly fights backwards
      this.bobber.x += pullPower;
      this.hookedFish.setPosition(this.bobber.x, this.bobber.y);
    }

    // Bait matching bonus
    const baitMatch = data.prefBait === this.activeBait;
    if (baitMatch) {
      data.currentStamina -= 0.1; // Tires faster with favorite bait
    }

    // Refresh UI meters
    this.tensionFill.width = Math.min(200, (this.tension / 100) * 200);
    this.staminaFill.width = Math.max(0, (data.currentStamina / data.stamina) * 200);

    // Color code tension danger
    if (this.tension > 80) {
      this.tensionFill.setFillStyle(0xe74c3c); // Red danger
    } else if (this.tension < 20) {
      this.tensionFill.setFillStyle(0xf39c12); // Slack danger
    } else {
      this.tensionFill.setFillStyle(0x2ecc71); // Safe green zone
    }

    // Condition 1: Line snapped (Over-tension)
    if (this.tension >= 100) {
      this.endFight(false, 'Line Snapped from Excessive Tension!');
      return;
    }

    // Condition 2: Fish Escaped (Too much slack for too long)
    if (this.tension <= 0 && this.bobber.x > 320) {
      this.endFight(false, 'Fish Escaped! Line Was Too Slack.');
      return;
    }

    // Condition 3: Success! Reeled into shore or stamina depleted
    const distToFisherman = Phaser.Math.Distance.Between(this.bobber.x, this.bobber.y, this.rodTip.x, this.rodTip.y);
    if (data.currentStamina <= 0 || distToFisherman < 50) {
      this.endFight(true, `Caught a ${data.name}! +${data.points} pts`);
    }
  }

  endFight(success, message) {
    this.fightWidget.setVisible(false);
    this.redrawRod(0);

    const banner = this.add.text(this.scale.width * 0.5, this.scale.height * 0.45, message, {
      font: 'bold 22px Arial',
      fill: success ? '#2ecc71' : '#e74c3c',
      backgroundColor: '#000000cc',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setDepth(200);

    this.time.delayedCall(2000, () => banner.destroy());

    if (success) {
      sounds.playCatch();
      this.score += this.hookedFish.fishData.points;
      this.coins += Math.floor(this.hookedFish.fishData.points * 0.2);
      this.targetFishLeft = Math.max(0, this.targetFishLeft - 1);
      this.scoreText.setText(`Score: ${this.score}`);
      this.targetText.setText(`Target Left: ${this.targetFishLeft}`);

      this.hookedFish.destroy();

      // Check Level Clear
      if (this.targetFishLeft === 0) {
        this.currentLevel++;
        this.targetFishLeft = 3 + this.currentLevel;
        this.levelText.setText(`Level: ${this.currentLevel}/10`);
        this.spawnSchoolOfFish();
      }
    } else {
      // Fish swims away fast
      this.hookedFish.fishData.currentStamina = this.hookedFish.fishData.stamina;
      this.hookedFish.body.setVelocityX(140);
    }

    // Reset Bobber to Rod Tip
    this.baitCastState = 'ready';
    this.bobber.body.setAllowGravity(false);
    this.bobber.body.setVelocity(0, 0);
    this.bobber.setPosition(this.rodTip.x, this.rodTip.y);
    this.hookedFish = null;
  }
}

// --- 6. Responsive Phaser Game Initialization ---
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
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [FishingGameScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
