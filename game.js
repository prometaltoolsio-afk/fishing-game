/**
 * CASTLE SIEGE DEFENSE - ENHANCED CARTOON EDITION
 * Procedural Angry Birds-Style Aesthetics, Expressive Characters & Juice FX
 * Vanilla HTML5 Canvas + Web Audio API
 */

(() => {
  'use strict';

  // -------------------------------------------------------------
  // AUDIO SYNTHESIS SYSTEM (Procedural SFX)
  // -------------------------------------------------------------
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = true;
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

    play(type) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;

      if (type === 'bow_release') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      } else if (type === 'cannon_fire') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);
        gain.gain.setValueAtTime(0.65, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      } else if (type === 'explosion') {
        const bufferSize = this.ctx.sampleRate * 0.45;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, t);
        filter.frequency.exponentialRampToValueAtTime(60, t + 0.45);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.75, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.45);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
      } else if (type === 'wood_break') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.setValueAtTime(110, t + 0.05);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      } else if (type === 'hit') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
      } else if (type === 'victory') {
        [261.6, 329.6, 392.0, 523.3].forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t + idx * 0.12);
          gain.gain.setValueAtTime(0.3, t + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.01, t + idx * 0.12 + 0.3);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t + idx * 0.12);
          osc.stop(t + idx * 0.12 + 0.3);
        });
      }
    }
  }

  const audio = new SoundManager();

  // -------------------------------------------------------------
  // GAME CONFIGURATION & 30 LEVELS
  // -------------------------------------------------------------
  const WIDTH = 1280;
  const HEIGHT = 720;
  const GROUND_Y = 620;
  const GRAVITY = 0.42;

  const LEVELS = [
    { id: 1, name: "First Defense", ammo: 15, enemies: [{ type: 'raider', count: 4, delay: 90 }], obstacles: [] },
    { id: 2, name: "Infantry Drill", ammo: 12, enemies: [{ type: 'raider', count: 6, delay: 80 }], obstacles: [] },
    { id: 3, name: "Cannon Introduction", ammo: 8, enemies: [{ type: 'shield', count: 3, delay: 110 }], obstacles: [] },
    { id: 4, name: "Timber Barricades", ammo: 10, enemies: [{ type: 'raider', count: 5, delay: 90 }],
      obstacles: [{ type: 'wood_box', x: 800, y: GROUND_Y - 40, w: 44, h: 80 }, { type: 'wood_box', x: 800, y: GROUND_Y - 120, w: 44, h: 80 }] },
    { id: 5, name: "Powder Kegs", ammo: 8, enemies: [{ type: 'shield', count: 4, delay: 90 }],
      obstacles: [{ type: 'tnt', x: 780, y: GROUND_Y - 30, w: 45, h: 45 }, { type: 'wood_box', x: 830, y: GROUND_Y - 40, w: 44, h: 80 }] },
    { id: 6, name: "Shield & Arrow", ammo: 12, enemies: [{ type: 'shield', count: 3, delay: 100 }, { type: 'enemy_archer', count: 3, delay: 120 }], obstacles: [] },
    { id: 7, name: "Stone Enclosure", ammo: 10, enemies: [{ type: 'raider', count: 6, delay: 70 }],
      obstacles: [{ type: 'stone_wall', x: 740, y: GROUND_Y - 60, w: 35, h: 120 }, { type: 'tnt', x: 790, y: GROUND_Y - 25, w: 40, h: 40 }] },
    { id: 8, name: "Cavalry Rush", ammo: 12, enemies: [{ type: 'rider', count: 5, delay: 65 }], obstacles: [] },
    { id: 9, name: "Watchtower Snipers", ammo: 14, enemies: [{ type: 'enemy_archer', count: 4, delay: 90 }, { type: 'raider', count: 4, delay: 80 }],
      obstacles: [{ type: 'wood_box', x: 900, y: GROUND_Y - 70, w: 50, h: 140 }, { type: 'tnt', x: 905, y: GROUND_Y - 170, w: 40, h: 40 }] },
    { id: 10, name: "Awakened Giant", ammo: 14, enemies: [{ type: 'giant', count: 1, delay: 100 }, { type: 'raider', count: 5, delay: 70 }],
      obstacles: [{ type: 'stone_wall', x: 850, y: GROUND_Y - 50, w: 30, h: 100 }] },
    { id: 11, name: "Floating Bastion", ammo: 12, enemies: [{ type: 'enemy_archer', count: 4, delay: 100 }, { type: 'shield', count: 3, delay: 80 }],
      obstacles: [{ type: 'moving_plat', x: 720, y: 350, w: 140, h: 24, range: 140, speed: 1.8 }, { type: 'tnt', x: 760, y: 320, w: 35, h: 35 }] },
    { id: 12, name: "Bridge Ambush", ammo: 15, enemies: [{ type: 'rider', count: 4, delay: 80 }, { type: 'giant', count: 1, delay: 140 }],
      obstacles: [{ type: 'bridge', x: 680, y: GROUND_Y - 90, w: 160, h: 20 }] },
    { id: 13, name: "Falling Rocks Trap", ammo: 10, enemies: [{ type: 'shield', count: 5, delay: 75 }],
      obstacles: [{ type: 'falling_rock', x: 750, y: 160, r: 28 }, { type: 'wood_box', x: 740, y: 200, w: 44, h: 44 }] },
    { id: 14, name: "Pendulum Guillotine", ammo: 14, enemies: [{ type: 'raider', count: 7, delay: 60 }],
      obstacles: [{ type: 'moving_plat', x: 820, y: 300, w: 120, h: 25, range: 180, speed: 2.5 }] },
    { id: 15, name: "Colossal Wave", ammo: 16, enemies: [{ type: 'giant', count: 2, delay: 180 }, { type: 'raider', count: 6, delay: 60 }],
      obstacles: [{ type: 'tnt', x: 700, y: GROUND_Y - 30, w: 45, h: 45 }, { type: 'tnt', x: 880, y: GROUND_Y - 30, w: 45, h: 45 }] },
    { id: 16, name: "Precision Squeeze", ammo: 7, enemies: [{ type: 'shield', count: 4, delay: 90 }],
      obstacles: [{ type: 'stone_wall', x: 650, y: GROUND_Y - 110, w: 30, h: 220 }, { type: 'tnt', x: 820, y: GROUND_Y - 25, w: 40, h: 40 }] },
    { id: 17, name: "Double Decker Defense", ammo: 12, enemies: [{ type: 'enemy_archer', count: 5, delay: 80 }, { type: 'rider', count: 3, delay: 90 }],
      obstacles: [{ type: 'wood_box', x: 780, y: GROUND_Y - 45, w: 50, h: 90 }, { type: 'moving_plat', x: 780, y: 320, w: 130, h: 20, range: 90, speed: 1.5 }] },
    { id: 18, name: "Chain Reaction", ammo: 8, enemies: [{ type: 'shield', count: 6, delay: 65 }],
      obstacles: [{ type: 'tnt', x: 650, y: GROUND_Y - 25, w: 40, h: 40 }, { type: 'tnt', x: 750, y: GROUND_Y - 25, w: 40, h: 40 }, { type: 'tnt', x: 850, y: GROUND_Y - 25, w: 40, h: 40 }] },
    { id: 19, name: "Sky Vault", ammo: 10, enemies: [{ type: 'enemy_archer', count: 6, delay: 85 }],
      obstacles: [{ type: 'stone_wall', x: 700, y: 300, w: 35, h: 220 }, { type: 'falling_rock', x: 710, y: 150, r: 26 }] },
    { id: 20, name: "Ironhide Vanguard", ammo: 12, enemies: [{ type: 'giant', count: 2, delay: 150 }, { type: 'shield', count: 4, delay: 70 }],
      obstacles: [{ type: 'wood_box', x: 700, y: GROUND_Y - 45, w: 44, h: 90 }, { type: 'tnt', x: 750, y: GROUND_Y - 25, w: 40, h: 40 }] },
    { id: 21, name: "Speed Raid", ammo: 14, enemies: [{ type: 'rider', count: 8, delay: 50 }],
      obstacles: [{ type: 'moving_plat', x: 750, y: 440, w: 100, h: 20, range: 120, speed: 3.2 }] },
    { id: 22, name: "Fortified Redoubt", ammo: 15, enemies: [{ type: 'shield', count: 4, delay: 80 }, { type: 'enemy_archer', count: 4, delay: 90 }, { type: 'giant', count: 1, delay: 160 }],
      obstacles: [{ type: 'stone_wall', x: 820, y: GROUND_Y - 80, w: 35, h: 160 }, { type: 'tnt', x: 870, y: GROUND_Y - 25, w: 40, h: 40 }] },
    { id: 23, name: "Crumbling Archway", ammo: 12, enemies: [{ type: 'raider', count: 8, delay: 50 }, { type: 'rider', count: 4, delay: 70 }],
      obstacles: [{ type: 'wood_box', x: 720, y: GROUND_Y - 50, w: 44, h: 100 }, { type: 'wood_box', x: 840, y: GROUND_Y - 50, w: 44, h: 100 }, { type: 'falling_rock', x: 780, y: GROUND_Y - 160, r: 35 }] },
    { id: 24, name: "Lethal Alley", ammo: 14, enemies: [{ type: 'shield', count: 5, delay: 70 }, { type: 'enemy_archer', count: 4, delay: 80 }],
      obstacles: [{ type: 'moving_plat', x: 670, y: 320, w: 110, h: 20, range: 150, speed: 2.2 }, { type: 'moving_plat', x: 880, y: 420, w: 110, h: 20, range: 120, speed: -2.0 }] },
    { id: 25, name: "The Twin Titans", ammo: 16, enemies: [{ type: 'giant', count: 2, delay: 140 }, { type: 'rider', count: 5, delay: 60 }],
      obstacles: [{ type: 'tnt', x: 680, y: GROUND_Y - 30, w: 45, h: 45 }, { type: 'stone_wall', x: 800, y: GROUND_Y - 60, w: 30, h: 120 }] },
    { id: 26, name: "Shattered Keep", ammo: 15, enemies: [{ type: 'shield', count: 6, delay: 70 }, { type: 'giant', count: 2, delay: 160 }],
      obstacles: [{ type: 'wood_box', x: 700, y: GROUND_Y - 40, w: 45, h: 80 }, { type: 'tnt', x: 760, y: GROUND_Y - 30, w: 45, h: 45 }, { type: 'wood_box', x: 820, y: GROUND_Y - 40, w: 45, h: 80 }] },
    { id: 27, name: "The Gauntlet", ammo: 16, enemies: [{ type: 'rider', count: 6, delay: 55 }, { type: 'enemy_archer', count: 6, delay: 75 }],
      obstacles: [{ type: 'moving_plat', x: 740, y: 360, w: 160, h: 24, range: 200, speed: 3.0 }] },
    { id: 28, name: "Bombardment Valley", ammo: 14, enemies: [{ type: 'shield', count: 6, delay: 65 }, { type: 'giant', count: 2, delay: 150 }],
      obstacles: [{ type: 'tnt', x: 650, y: GROUND_Y - 25, w: 40, h: 40 }, { type: 'falling_rock', x: 720, y: 180, r: 30 }, { type: 'tnt', x: 840, y: GROUND_Y - 25, w: 40, h: 40 }] },
    { id: 29, name: "Gate of Despair", ammo: 18, enemies: [{ type: 'rider', count: 6, delay: 50 }, { type: 'shield', count: 6, delay: 60 }, { type: 'giant', count: 2, delay: 140 }],
      obstacles: [{ type: 'stone_wall', x: 700, y: GROUND_Y - 70, w: 35, h: 140 }, { type: 'stone_wall', x: 860, y: GROUND_Y - 70, w: 35, h: 140 }, { type: 'tnt', x: 780, y: GROUND_Y - 25, w: 40, h: 40 }] },
    { id: 30, name: "Siege Overlord - Final Stand", ammo: 24,
      enemies: [{ type: 'boss', count: 1, delay: 100 }],
      obstacles: [
        { type: 'wood_box', x: 680, y: GROUND_Y - 40, w: 44, h: 80 },
        { type: 'tnt', x: 750, y: GROUND_Y - 30, w: 45, h: 45 },
        { type: 'moving_plat', x: 820, y: 340, w: 140, h: 24, range: 160, speed: 2.2 },
        { type: 'falling_rock', x: 840, y: 150, r: 32 }
      ]
    }
  ];

  // -------------------------------------------------------------
  // ENGINE STATE & VARIABLES
  // -------------------------------------------------------------
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let gameState = 'MENU';
  let currentLevelIdx = 0;
  let castleHp = 1000;
  const maxCastleHp = 1000;
  let remainingAmmo = 0;
  let ammoUsed = 0;
  let currentUnit = 'archer';

  let isAiming = false;
  let aimStart = { x: 0, y: 0 };
  let aimCurrent = { x: 0, y: 0 };
  const originPositions = {
    archer: { x: 195, y: 310 },
    cannon: { x: 235, y: 550 }
  };

  const cooldowns = { archer: 0, cannon: 0, infantry: 0, cavalry: 0 };
  const cooldownDurations = { archer: 30, cannon: 90, infantry: 140, cavalry: 200 };

  let projectiles = [];
  let enemies = [];
  let friendlyUnits = [];
  let obstacles = [];
  let particles = [];
  let spawnQueue = [];
  let spawnTimer = 0;
  let screenShake = 0;

  function getProgress() {
    try {
      const data = localStorage.getItem('castle_defense_prog');
      return data ? JSON.parse(data) : { unlocked: 1, stars: {} };
    } catch (e) {
      return { unlocked: 1, stars: {} };
    }
  }

  function saveProgress(level, stars) {
    const prog = getProgress();
    if (level + 1 > prog.unlocked) {
      prog.unlocked = Math.min(30, level + 1);
    }
    prog.stars[level] = Math.max(prog.stars[level] || 0, stars);
    localStorage.setItem('castle_defense_prog', JSON.stringify(prog));
  }

  // -------------------------------------------------------------
  // CARTOON EXPRESSIVE ENEMY SYSTEM
  // -------------------------------------------------------------
  class Enemy {
    constructor(type, x, y) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.markedForDeath = false;
      this.attackTimer = 0;
      this.animTick = 0;
      this.hurtTimer = 0;

      switch(type) {
        case 'raider':
          this.hp = 80; this.maxHp = 80; this.speed = 1.35; this.damage = 18;
          this.w = 30; this.h = 44; this.color = '#ef4444';
          break;
        case 'shield':
          this.hp = 180; this.maxHp = 180; this.speed = 0.85; this.damage = 25;
          this.w = 34; this.h = 46; this.color = '#64748b';
          break;
        case 'rider':
          this.hp = 95; this.maxHp = 95; this.speed = 2.8; this.damage = 35;
          this.w = 48; this.h = 42; this.color = '#f97316';
          break;
        case 'giant':
          this.hp = 550; this.maxHp = 550; this.speed = 0.55; this.damage = 90;
          this.w = 54; this.h = 78; this.color = '#9333ea';
          break;
        case 'enemy_archer':
          this.hp = 70; this.maxHp = 70; this.speed = 1.0; this.damage = 12;
          this.range = 420; this.w = 28; this.h = 42; this.color = '#10b981';
          break;
        case 'boss':
          this.hp = 1600; this.maxHp = 1600; this.speed = 0.5; this.damage = 150;
          this.w = 68; this.h = 98; this.color = '#b91c1c'; this.phase = 1;
          break;
      }
    }

    update() {
      this.animTick++;
      if (this.hurtTimer > 0) this.hurtTimer--;

      const castleX = 230;

      if (this.type === 'boss') {
        if (this.hp <= 1000 && this.phase === 1) {
          this.phase = 2;
          this.speed = 0.8;
          spawnSplinters(this.x, this.y - 30, '#f59e0b', 30);
          audio.play('wood_break');
        } else if (this.hp <= 450 && this.phase === 2) {
          this.phase = 3;
          this.speed = 1.2;
          this.damage = 220;
          spawnSplinters(this.x, this.y - 30, '#dc2626', 40);
          audio.play('explosion');
        }
      }

      let engagedFriendly = null;
      for (const friendly of friendlyUnits) {
        if (!friendly.dead && Math.abs(friendly.x - this.x) < 32) {
          engagedFriendly = friendly;
          break;
        }
      }

      if (engagedFriendly) {
        this.attackTimer++;
        if (this.attackTimer % 45 === 0) {
          engagedFriendly.hp -= this.damage;
          audio.play('hit');
          spawnSplinters(engagedFriendly.x, engagedFriendly.y - 15, '#ef4444', 6);
          if (engagedFriendly.hp <= 0) engagedFriendly.dead = true;
        }
        return;
      }

      if (this.type === 'enemy_archer') {
        if (this.x - castleX <= this.range) {
          this.attackTimer++;
          if (this.attackTimer % 90 === 0) {
            projectiles.push(new Projectile(this.x, this.y - 20, -7.5, -4.5, 'enemy_arrow'));
            audio.play('bow_release');
          }
          return;
        }
      }

      if (this.x > castleX + 15) {
        this.x -= this.speed;
      } else {
        this.attackTimer++;
        if (this.attackTimer % 50 === 0) {
          castleHp = Math.max(0, castleHp - this.damage);
          screenShake = 6;
          audio.play('hit');
          spawnSplinters(this.x - 10, this.y - 20, '#ef4444', 10);
          updateHUD();
        }
      }
    }

    takeDamage(amount, damageType, hitVelocityX = 0) {
      let finalDmg = amount;
      this.hurtTimer = 16; // trigger hurt expression

      if (this.type === 'shield') {
        if (damageType === 'arrow' && hitVelocityX > 0) {
          finalDmg *= 0.2;
          spawnSplinters(this.x - 8, this.y - 20, '#cbd5e1', 8);
        } else if (damageType === 'cannon') {
          finalDmg *= 1.8;
        }
      } else if (this.type === 'rider') {
        if (damageType === 'arrow') finalDmg *= 1.6;
      } else if (this.type === 'giant') {
        if (damageType === 'cannon') finalDmg *= 1.5;
        if (damageType === 'cavalry') finalDmg *= 1.7;
      } else if (this.type === 'raider') {
        if (damageType === 'infantry') finalDmg *= 1.6;
      }

      this.hp -= finalDmg;
      audio.play('hit');
      spawnSplinters(this.x, this.y - 20, this.color, 8);

      if (this.hp <= 0) {
        this.markedForDeath = true;
        spawnSplinters(this.x, this.y - 25, this.color, 18);
        spawnPuffSmoke(this.x, this.y - 25);
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);

      // Walk cycle bobbing and squash
      const bob = Math.sin(this.animTick * 0.22) * 3;
      const squash = Math.cos(this.animTick * 0.22) * 0.04;

      // Soft oval shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.w * 0.6, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main cartoon body with dark thick outline
      ctx.scale(1 + squash, 1 - squash);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.roundRect(-this.w / 2, -this.h + bob, this.w, this.h, [10]);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Shield graphic
      if (this.type === 'shield') {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(-this.w / 2 - 8, -this.h + 8 + bob, 12, this.h - 10, [4]);
        ctx.fill();
        ctx.stroke();

        // Shield boss metal spike
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(-this.w / 2 - 2, -this.h / 2 + 3 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Boss horns & battle crown
      if (this.type === 'boss') {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-16, -this.h + bob);
        ctx.lineTo(-24, -this.h - 14 + bob);
        ctx.lineTo(-8, -this.h - 2 + bob);
        ctx.lineTo(0, -this.h - 16 + bob);
        ctx.lineTo(8, -this.h - 2 + bob);
        ctx.lineTo(24, -this.h - 14 + bob);
        ctx.lineTo(16, -this.h + bob);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // EXPRESSIVE CARTOON EYES (Angry Birds style)
      const eyeY = -this.h + 16 + bob;
      const eyeOffset = 6;
      const eyeR = this.type === 'giant' || this.type === 'boss' ? 7 : 5.5;

      // Sclera (White)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-eyeOffset, eyeY, eyeR, 0, Math.PI * 2);
      ctx.arc(eyeOffset - 3, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Pupils (Looking left towards player's castle or scared if hurt)
      ctx.fillStyle = '#0f172a';
      if (this.hurtTimer > 0) {
        // Wide shock pupils
        ctx.beginPath();
        ctx.arc(-eyeOffset - 1, eyeY, 2, 0, Math.PI * 2);
        ctx.arc(eyeOffset - 4, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Focused aggressive pupils
        ctx.beginPath();
        ctx.arc(-eyeOffset - 2, eyeY, 3, 0, Math.PI * 2);
        ctx.arc(eyeOffset - 5, eyeY, 3, 0, Math.PI * 2);
        ctx.fill();

        // White eye glints
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-eyeOffset - 3, eyeY - 1.5, 1.2, 0, Math.PI * 2);
        ctx.arc(eyeOffset - 6, eyeY - 1.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Angry angled cartoon eyebrows
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (this.hurtTimer > 0) {
        // Shock raised eyebrows
        ctx.moveTo(-eyeOffset - 5, eyeY - 8);
        ctx.lineTo(-eyeOffset + 2, eyeY - 9);
        ctx.moveTo(eyeOffset - 7, eyeY - 9);
        ctx.lineTo(eyeOffset, eyeY - 8);
      } else {
        // Aggressive frown eyebrows
        ctx.moveTo(-eyeOffset - 5, eyeY - 9);
        ctx.lineTo(-eyeOffset + 2, eyeY - 6);
        ctx.moveTo(eyeOffset - 6, eyeY - 6);
        ctx.lineTo(eyeOffset + 1, eyeY - 9);
      }
      ctx.stroke();

      // Health bar display
      if (this.hp < this.maxHp) {
        const barW = Math.max(34, this.w + 8);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.beginPath();
        ctx.roundRect(-barW / 2, -this.h - 14, barW, 6, [3]);
        ctx.fill();

        ctx.fillStyle = '#22c55e';
        const fillW = Math.max(0, (this.hp / this.maxHp) * barW);
        ctx.beginPath();
        ctx.roundRect(-barW / 2, -this.h - 14, fillW, 6, [3]);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // -------------------------------------------------------------
  // FRIENDLY TROOPS WITH MATCHING CARTOON STYLING
  // -------------------------------------------------------------
  class FriendlyTroop {
    constructor(type) {
      this.type = type;
      this.x = 230;
      this.y = GROUND_Y;
      this.dead = false;
      this.animTick = 0;

      if (type === 'infantry') {
        this.hp = 140; this.maxHp = 140; this.speed = 1.6; this.damage = 22;
        this.w = 30; this.h = 44; this.color = '#3b82f6';
      } else {
        this.hp = 220; this.maxHp = 220; this.speed = 3.6; this.damage = 45;
        this.w = 46; this.h = 46; this.color = '#0284c7';
      }
    }

    update() {
      this.animTick++;
      let target = null;
      for (const e of enemies) {
        if (e.x > this.x && e.x - this.x < 32) {
          target = e;
          break;
        }
      }

      if (target) {
        if (this.animTick % 40 === 0) {
          target.takeDamage(this.damage, this.type);
          spawnSplinters(this.x + 18, this.y - 18, '#38bdf8', 6);
        }
      } else {
        this.x += this.speed;
        for (const obs of obstacles) {
          if (!obs.destroyed && obs.type !== 'moving_plat' && obs.type !== 'falling_rock') {
            if (this.x + this.w / 2 >= obs.x && this.x - this.w / 2 <= obs.x + obs.w) {
              obs.takeDamage(this.damage);
              this.dead = true;
              spawnSplinters(this.x, this.y - 20, '#38bdf8', 10);
              break;
            }
          }
        }
      }

      if (this.x > WIDTH + 50) this.dead = true;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      const bob = Math.sin(this.animTick * 0.28) * 3;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.w * 0.6, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.roundRect(-this.w / 2, -this.h + bob, this.w, this.h, [8]);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Shiny Knight Helmet
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(0, -this.h + 8 + bob, 10, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // Eye slit with keen forward gaze
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-2, -this.h + 10 + bob, 8, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, -this.h + 11 + bob, 3, 2);

      // Sword or Lance weapon
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(8, -this.h / 2 + bob);
      ctx.lineTo(this.w / 2 + 14, -this.h / 2 + bob);
      ctx.stroke();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  }

  // -------------------------------------------------------------
  // DETAILED TEXTURED OBSTACLES & PROPS
  // -------------------------------------------------------------
  class Obstacle {
    constructor(cfg) {
      this.type = cfg.type;
      this.x = cfg.x;
      this.y = cfg.y;
      this.w = cfg.w || 40;
      this.h = cfg.h || 40;
      this.r = cfg.r || 24;
      this.destroyed = false;
      this.vy = 0;
      this.initialX = cfg.x;
      this.range = cfg.range || 0;
      this.speed = cfg.speed || 0;
      this.phase = 0;

      if (this.type === 'wood_box') {
        this.hp = 80; this.maxHp = 80;
      } else if (this.type === 'stone_wall') {
        this.hp = 300; this.maxHp = 300;
      } else if (this.type === 'tnt') {
        this.hp = 20; this.maxHp = 20;
      } else if (this.type === 'falling_rock') {
        this.hp = 999; this.falling = false;
      }
    }

    update() {
      if (this.destroyed) return;

      if (this.type === 'moving_plat') {
        this.phase += 0.03 * Math.sign(this.speed);
        this.x = this.initialX + Math.sin(this.phase) * this.range;
      } else if (this.type === 'falling_rock' && this.falling) {
        this.vy += GRAVITY;
        this.y += this.vy;

        for (const e of enemies) {
          if (!e.markedForDeath && Math.hypot(e.x - this.x, e.y - 20 - this.y) < this.r + 20) {
            e.takeDamage(260, 'rock');
            screenShake = 6;
          }
        }

        if (this.y >= GROUND_Y - this.r) {
          this.y = GROUND_Y - this.r;
          this.falling = false;
          screenShake = 7;
          audio.play('wood_break');
          spawnSplinters(this.x, this.y, '#64748b', 16);
        }
      }
    }

    checkCollision(px, py, pr) {
      if (this.type === 'falling_rock') {
        return Math.hypot(px - this.x, py - this.y) < pr + this.r;
      }
      return (
        px + pr >= this.x &&
        px - pr <= this.x + this.w &&
        py + pr >= this.y &&
        py - pr <= this.y + this.h
      );
    }

    takeDamage(amount) {
      if (this.type === 'falling_rock') {
        this.falling = true;
        return;
      }

      this.hp -= amount;
      if (this.hp <= 0 && !this.destroyed) {
        this.destroyed = true;
        if (this.type === 'tnt') {
          triggerExplosion(this.x + this.w / 2, this.y + this.h / 2, 115, 260);
        } else {
          audio.play('wood_break');
          const color = this.type === 'wood_box' ? '#b45309' : '#64748b';
          spawnSplinters(this.x + this.w / 2, this.y + this.h / 2, color, 16);
          spawnPuffSmoke(this.x + this.w / 2, this.y + this.h / 2);
        }
      }
    }

    draw() {
      if (this.destroyed) return;
      ctx.save();

      if (this.type === 'wood_box') {
        // Warm cartoon wood block
        ctx.fillStyle = '#b45309';
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Wood grain pattern lines
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 8, this.y);
        ctx.lineTo(this.x + 12, this.y + this.h);
        ctx.moveTo(this.x + this.w - 12, this.y);
        ctx.lineTo(this.x + this.w - 8, this.y + this.h);
        ctx.moveTo(this.x + 4, this.y + 4);
        ctx.lineTo(this.x + this.w - 4, this.y + this.h - 4);
        ctx.moveTo(this.x + this.w - 4, this.y + 4);
        ctx.lineTo(this.x + 4, this.y + this.h - 4);
        ctx.stroke();

        // Thick bold outline
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        // Corner iron nails
        ctx.fillStyle = '#1e293b';
        const corners = [
          [this.x + 5, this.y + 5],
          [this.x + this.w - 5, this.y + 5],
          [this.x + 5, this.y + this.h - 5],
          [this.x + this.w - 5, this.y + this.h - 5]
        ];
        corners.forEach(([cx, cy]) => {
          ctx.beginPath();
          ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (this.type === 'stone_wall') {
        // Stone block with crack lines
        ctx.fillStyle = '#64748b';
        ctx.fillRect(this.x, this.y, this.w, this.h);

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 6, this.y + 12);
        ctx.lineTo(this.x + 18, this.y + 24);
        ctx.lineTo(this.x + 10, this.y + 40);
        ctx.stroke();

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
      } else if (this.type === 'tnt') {
        // Red TNT barrel with metallic hoops
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.w, this.h, [6]);
        ctx.fill();

        // Metal reinforcement bands
        ctx.fillStyle = '#334155';
        ctx.fillRect(this.x, this.y + 6, this.w, 4);
        ctx.fillRect(this.x, this.y + this.h - 10, this.w, 4);

        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        // Cartoon TNT typography
        ctx.fillStyle = '#fde047';
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TNT', this.x + this.w / 2, this.y + this.h / 2 + 5);
      } else if (this.type === 'moving_plat' || this.type === 'bridge') {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
      } else if (this.type === 'falling_rock') {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();

        // Shading arc
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 4, this.r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // -------------------------------------------------------------
  // PROJECTILES (With Trail Effects)
  // -------------------------------------------------------------
  class Projectile {
    constructor(x, y, vx, vy, type) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.type = type;
      this.dead = false;
      this.radius = type === 'cannonball' ? 10 : 4;
      this.trail = [];
    }

    update() {
      this.vy += GRAVITY;
      this.x += this.vx;
      this.y += this.vy;

      // Trail recording
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 8) this.trail.shift();

      if (this.y >= GROUND_Y) {
        this.dead = true;
        if (this.type === 'cannonball') {
          triggerExplosion(this.x, GROUND_Y, 85, 170);
        } else {
          spawnSplinters(this.x, GROUND_Y, '#78350f', 5);
          audio.play('hit');
        }
        return;
      }

      if (this.type === 'enemy_arrow') {
        if (this.x <= 230) {
          this.dead = true;
          castleHp = Math.max(0, castleHp - 15);
          screenShake = 3;
          audio.play('hit');
          spawnSplinters(this.x, this.y, '#ef4444', 6);
          updateHUD();
        }
        return;
      }

      for (const obs of obstacles) {
        if (obs.destroyed) continue;
        if (obs.checkCollision(this.x, this.y, this.radius)) {
          this.dead = true;
          if (this.type === 'cannonball') {
            triggerExplosion(this.x, this.y, 90, 220);
          } else {
            obs.takeDamage(45);
            audio.play('wood_break');
            spawnSplinters(this.x, this.y, '#d97706', 7);
          }
          return;
        }
      }

      for (const e of enemies) {
        if (e.markedForDeath) continue;
        if (
          this.x >= e.x - e.w / 2 &&
          this.x <= e.x + e.w / 2 &&
          this.y >= e.y - e.h &&
          this.y <= e.y
        ) {
          this.dead = true;
          if (this.type === 'cannonball') {
            triggerExplosion(this.x, this.y, 85, 200);
          } else {
            e.takeDamage(60, 'arrow', this.vx);
          }
          return;
        }
      }

      if (this.x > WIDTH + 100 || this.x < -50 || this.y > HEIGHT + 100) {
        this.dead = true;
      }
    }

    draw() {
      ctx.save();

      // Motion Trail
      ctx.strokeStyle = this.type === 'arrow' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(251, 146, 60, 0.5)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < this.trail.length; i++) {
        const pt = this.trail[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      if (this.type === 'arrow' || this.type === 'enemy_arrow') {
        const angle = Math.atan2(this.vy, this.vx);
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.strokeStyle = this.type === 'arrow' ? '#f8fafc' : '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();

        // Cartoon arrowhead
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(2, -5);
        ctx.lineTo(2, 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (this.type === 'cannonball') {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 3D Cartoon spherical highlight
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // -------------------------------------------------------------
  // JUICE FX & PARTICLE EFFECTS
  // -------------------------------------------------------------
  function spawnSplinters(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1.5;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.3,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.02,
        color: color,
        w: Math.random() * 6 + 4,
        h: Math.random() * 3 + 2,
        type: 'splinter'
      });
    }
  }

  function spawnPuffSmoke(x, y) {
    for (let i = 0; i < 7; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 1.8 - 0.5,
        size: Math.random() * 12 + 8,
        life: 1.0,
        decay: 0.03,
        color: '#e2e8f0',
        type: 'smoke'
      });
    }
  }

  function triggerExplosion(x, y, radius, damage) {
    audio.play('explosion');
    screenShake = 14;
    spawnSplinters(x, y, '#ea580c', 20);
    spawnSplinters(x, y, '#facc15', 20);
    spawnPuffSmoke(x, y);

    for (const e of enemies) {
      if (e.markedForDeath) continue;
      const d = Math.hypot(e.x - x, e.y - 20 - y);
      if (d < radius) {
        const falloff = 1 - (d / radius);
        e.takeDamage(damage * falloff, 'cannon');
      }
    }

    for (const obs of obstacles) {
      if (obs.destroyed) continue;
      const ox = obs.x + (obs.w ? obs.w / 2 : 0);
      const oy = obs.y + (obs.h ? obs.h / 2 : 0);
      if (Math.hypot(ox - x, oy - y) < radius) {
        obs.takeDamage(damage);
      }
    }
  }

  // -------------------------------------------------------------
  // LEVEL MANAGER & HUD
  // -------------------------------------------------------------
  function loadLevel(idx) {
    currentLevelIdx = idx;
    const lvl = LEVELS[idx];

    castleHp = maxCastleHp;
    remainingAmmo = lvl.ammo;
    ammoUsed = 0;
    projectiles = [];
    enemies = [];
    friendlyUnits = [];
    obstacles = lvl.obstacles.map(o => new Obstacle(o));
    particles = [];

    spawnQueue = [];
    lvl.enemies.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        spawnQueue.push({
          type: group.type,
          delay: group.delay * (i + 1)
        });
      }
    });

    spawnTimer = 0;
    gameState = 'PLAYING';

    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('troop-dock').classList.remove('hidden');
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('level-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('defeat-screen').classList.add('hidden');

    document.getElementById('level-display').innerText = `Level ${lvl.id}: ${lvl.name}`;
    updateHUD();
  }

  function updateHUD() {
    const hpPct = Math.max(0, (castleHp / maxCastleHp) * 100);
    const hpBar = document.getElementById('castle-hp-bar');
    hpBar.style.width = `${hpPct}%`;
    if (hpPct < 30) {
      hpBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
    } else if (hpPct < 60) {
      hpBar.style.background = 'linear-gradient(90deg, #eab308, #fde047)';
    } else {
      hpBar.style.background = 'linear-gradient(90deg, #22c55e, #4ade80)';
    }
    document.getElementById('castle-hp-text').innerText = `${Math.ceil(castleHp)}/${maxCastleHp}`;
    document.getElementById('ammo-count').innerText = remainingAmmo;

    const totalRemaining = spawnQueue.length + enemies.length;
    document.getElementById('wave-display').innerText = `Enemies: ${totalRemaining}`;

    ['archer', 'cannon', 'infantry', 'cavalry'].forEach(u => {
      const el = document.getElementById(`cd-${u}`);
      const cdRatio = cooldowns[u] / cooldownDurations[u];
      el.style.transform = `scaleY(${Math.max(0, cdRatio)})`;
    });
  }

  // -------------------------------------------------------------
  // CONTROLS & POINTER DRAG
  // -------------------------------------------------------------
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onPointerDown(e); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onPointerMove(e); }, { passive: false });
  window.addEventListener('touchend', onPointerUp);

  function onPointerDown(e) {
    if (gameState !== 'PLAYING') return;
    audio.init();

    const p = getCanvasCoords(e);

    if (currentUnit === 'infantry' || currentUnit === 'cavalry') {
      if (cooldowns[currentUnit] <= 0) {
        friendlyUnits.push(new FriendlyTroop(currentUnit));
        cooldowns[currentUnit] = cooldownDurations[currentUnit];
        audio.play('wood_break');
      }
      return;
    }

    if (cooldowns[currentUnit] <= 0 && remainingAmmo > 0) {
      isAiming = true;
      aimStart = p;
      aimCurrent = p;
    }
  }

  function onPointerMove(e) {
    if (!isAiming) return;
    aimCurrent = getCanvasCoords(e);
  }

  function onPointerUp() {
    if (!isAiming) return;
    isAiming = false;

    if (remainingAmmo <= 0) return;

    const origin = originPositions[currentUnit];
    const dx = aimStart.x - aimCurrent.x;
    const dy = aimStart.y - aimCurrent.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 15) return;

    const power = Math.min(dist * 0.16, 24);
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * power;
    const vy = Math.sin(angle) * power;

    if (currentUnit === 'archer') {
      projectiles.push(new Projectile(origin.x, origin.y, vx, vy, 'arrow'));
      audio.play('bow_release');
      cooldowns.archer = cooldownDurations.archer;
    } else if (currentUnit === 'cannon') {
      projectiles.push(new Projectile(origin.x, origin.y, vx, vy, 'cannonball'));
      audio.play('cannon_fire');
      cooldowns.cannon = cooldownDurations.cannon;
      screenShake = 6;
      spawnPuffSmoke(origin.x + 10, origin.y);
    }

    remainingAmmo--;
    ammoUsed++;
    updateHUD();
  }

  document.querySelectorAll('.troop-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.troop-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentUnit = card.dataset.unit;
    });
  });

  // -------------------------------------------------------------
  // TRAJECTORY PREDICTION (Cartoon Dots)
  // -------------------------------------------------------------
  function drawTrajectoryGuide(origin, start, cur) {
    const dx = start.x - cur.x;
    const dy = start.y - cur.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) return;

    const power = Math.min(dist * 0.16, 24);
    const angle = Math.atan2(dy, dx);
    let simVx = Math.cos(angle) * power;
    let simVy = Math.sin(angle) * power;
    let simX = origin.x;
    let simY = origin.y;

    ctx.save();

    // Slingshot Pull Vector line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x - (start.x - cur.x) * 0.5, origin.y - (start.y - cur.y) * 0.5);
    ctx.stroke();

    // Dotted predicted arc
    ctx.fillStyle = currentUnit === 'archer' ? '#f8fafc' : '#fb923c';
    for (let step = 0; step < 36; step++) {
      simVy += GRAVITY;
      simX += simVx;
      simY += simVy;

      if (simY >= GROUND_Y || simX >= WIDTH) break;

      if (step % 2 === 0) {
        ctx.beginPath();
        ctx.arc(simX, simY, currentUnit === 'archer' ? 3.5 : 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // ENVIRONMENT & FORTRESS RENDERING
  // -------------------------------------------------------------
  function drawEnvironment() {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#0284c7');
    sky.addColorStop(0.5, '#38bdf8');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Fluffy Cartoon Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    drawCloud(240, 90, 45);
    drawCloud(620, 140, 55);
    drawCloud(1020, 80, 40);

    // Rolling Green Hills (Backdrop)
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.quadraticCurveTo(320, 460, 680, GROUND_Y);
    ctx.quadraticCurveTo(980, 440, WIDTH, GROUND_Y);
    ctx.lineTo(WIDTH, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Ground Grass & Soil Layer
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.roundRect(0, GROUND_Y, WIDTH, 10, [4]);
    ctx.fill();

    drawPlayerFortress();
  }

  function drawCloud(cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.7, cy - r * 0.2, r * 0.75, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.7, cy - r * 0.1, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlayerFortress() {
    ctx.save();

    // Stone Castle Tower
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 240, 230, GROUND_Y - 240);

    // Hand-drawn brick stylings
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    for (let y = 250; y < GROUND_Y; y += 32) {
      for (let x = 0; x < 230; x += 44) {
        ctx.strokeRect(x + ((y / 32) % 2 * 22), y, 44, 32);
      }
    }

    // Crenellations
    ctx.fillStyle = '#334155';
    for (let x = 0; x <= 200; x += 44) {
      ctx.fillRect(x, 210, 26, 30);
      ctx.strokeRect(x, 210, 26, 30);
    }

    // Heavy Reinforced Gate
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(170, GROUND_Y, 46, Math.PI, 0);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Archer with Slingshot/Bow
    const archerPos = originPositions.archer;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(archerPos.x, archerPos.y - 10, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Archer Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(archerPos.x + 4, archerPos.y - 12, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(archerPos.x + 5, archerPos.y - 12, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Cannon with highlight
    const cannonPos = originPositions.cannon;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cannonPos.x - 6, cannonPos.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(cannonPos.x - 10, cannonPos.y - 4, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // MAIN LOOP
  // -------------------------------------------------------------
  function gameLoop() {
    ctx.save();
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake;
      const shakeY = (Math.random() - 0.5) * screenShake;
      ctx.translate(shakeX, shakeY);
      screenShake = Math.max(0, screenShake - 0.7);
    }

    drawEnvironment();

    if (gameState === 'PLAYING') {
      Object.keys(cooldowns).forEach(k => {
        if (cooldowns[k] > 0) cooldowns[k]--;
      });

      spawnTimer++;
      for (let i = spawnQueue.length - 1; i >= 0; i--) {
        const item = spawnQueue[i];
        if (spawnTimer >= item.delay) {
          enemies.push(new Enemy(item.type, WIDTH + 30, GROUND_Y));
          spawnQueue.splice(i, 1);
        }
      }

      obstacles.forEach(o => { o.update(); o.draw(); });

      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update();
        p.draw();
        if (p.dead) projectiles.splice(i, 1);
      }

      for (let i = friendlyUnits.length - 1; i >= 0; i--) {
        const f = friendlyUnits[i];
        f.update();
        f.draw();
        if (f.dead) friendlyUnits.splice(i, 1);
      }

      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.update();
        e.draw();
        if (e.markedForDeath) enemies.splice(i, 1);
      }

      if (isAiming) {
        const origin = originPositions[currentUnit];
        drawTrajectoryGuide(origin, aimStart, aimCurrent);
      }

      checkGameOutcomes();
      updateHUD();
    }

    // Render Splinters & Smoke Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life);
      if (pt.type === 'splinter') {
        pt.rot += pt.vRot;
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        ctx.fillStyle = pt.color;
        ctx.fillRect(-pt.w / 2, -pt.h / 2, pt.w, pt.h);
      } else if (pt.type === 'smoke') {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      if (pt.life <= 0) particles.splice(i, 1);
    }

    ctx.restore();
    requestAnimationFrame(gameLoop);
  }

  function checkGameOutcomes() {
    if (castleHp <= 0) {
      gameState = 'DEFEAT';
      document.getElementById('defeat-screen').classList.remove('hidden');
      return;
    }

    if (spawnQueue.length === 0 && enemies.length === 0) {
      gameState = 'VICTORY';
      const lvl = LEVELS[currentLevelIdx];

      let stars = 1;
      const hpRatio = castleHp / maxCastleHp;
      if (hpRatio >= 0.8 && remainingAmmo >= 3) stars = 3;
      else if (hpRatio >= 0.5) stars = 2;

      saveProgress(lvl.id, stars);
      audio.play('victory');

      document.getElementById('victory-stars').innerText = '⭐'.repeat(stars);
      document.getElementById('stat-hp').innerText = `${Math.ceil(hpRatio * 100)}%`;
      document.getElementById('stat-ammo').innerText = ammoUsed;
      document.getElementById('stat-score').innerText = stars === 3 ? 'Flawless Strategy!' : stars === 2 ? 'Great Tactician' : 'Siege Repelled';
      document.getElementById('victory-screen').classList.remove('hidden');
    }
  }

  // -------------------------------------------------------------
  // MODAL & MENU HANDLERS
  // -------------------------------------------------------------
  function buildLevelGrid() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';
    const prog = getProgress();

    LEVELS.forEach(lvl => {
      const node = document.createElement('div');
      const isUnlocked = lvl.id <= prog.unlocked;
      node.className = `level-node ${isUnlocked ? 'unlocked' : 'locked'}`;

      const starsEarned = prog.stars[lvl.id] || 0;
      node.innerHTML = `
        <span class="lvl-num">${lvl.id}</span>
        <span class="lvl-stars">${isUnlocked ? (starsEarned ? '⭐'.repeat(starsEarned) : '—') : '🔒'}</span>
      `;

      if (isUnlocked) {
        node.addEventListener('click', () => {
          loadLevel(lvl.id - 1);
        });
      }
      grid.appendChild(node);
    });
  }

  document.getElementById('btn-play').addEventListener('click', () => {
    audio.init();
    const prog = getProgress();
    loadLevel(prog.unlocked - 1);
  });

  document.getElementById('btn-level-select').addEventListener('click', () => {
    audio.init();
    buildLevelGrid();
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('level-screen').classList.remove('hidden');
  });

  document.getElementById('btn-level-back').addEventListener('click', () => {
    document.getElementById('level-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
  });

  document.getElementById('btn-menu-hud').addEventListener('click', () => {
    gameState = 'MENU';
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('troop-dock').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
  });

  document.getElementById('btn-restart-hud').addEventListener('click', () => { loadLevel(currentLevelIdx); });
  document.getElementById('btn-retry').addEventListener('click', () => { loadLevel(currentLevelIdx); });
  document.getElementById('btn-defeat-retry').addEventListener('click', () => { loadLevel(currentLevelIdx); });

  document.getElementById('btn-next-level').addEventListener('click', () => {
    if (currentLevelIdx + 1 < LEVELS.length) {
      loadLevel(currentLevelIdx + 1);
    } else {
      document.getElementById('victory-screen').classList.add('hidden');
      document.getElementById('menu-screen').classList.remove('hidden');
    }
  });

  document.getElementById('btn-defeat-menu').addEventListener('click', () => {
    gameState = 'MENU';
    document.getElementById('defeat-screen').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('troop-dock').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
  });

  document.getElementById('btn-sound').addEventListener('click', (e) => {
    audio.enabled = !audio.enabled;
    e.target.innerText = audio.enabled ? '🔊' : '🔇';
  });

  document.getElementById('btn-reset-data').addEventListener('click', () => {
    if (confirm("Reset all campaign levels and stars?")) {
      localStorage.removeItem('castle_defense_prog');
      alert("Progress reset!");
    }
  });

  requestAnimationFrame(gameLoop);
})();
