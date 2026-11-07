/**
 * CASTLE SIEGE DEFENSE
 * 2D Physics-Based Trajectory Defense & Puzzle Engine
 * Pure Vanilla HTML5 Canvas, Web Audio API, and Custom Rigid/Particle Physics.
 */

(() => {
  'use strict';

  // -------------------------------------------------------------
  // AUDIO SYNTHESIS SYSTEM (Procedural SFX, Zero External Files)
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
        osc.frequency.setValueAtTime(440, t);
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
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(28, t + 0.35);
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      } else if (type === 'explosion') {
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(80, t + 0.4);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.4);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
      } else if (type === 'wood_break') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.setValueAtTime(120, t + 0.05);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      } else if (type === 'hit') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
        gain.gain.setValueAtTime(0.4, t);
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
  // GAME CONFIGURATION & LEVEL DATABASE (30 Progressive Levels)
  // -------------------------------------------------------------
  const WIDTH = 1280;
  const HEIGHT = 720;
  const GROUND_Y = 620;
  const GRAVITY = 0.42;

  // 30 distinct levels with varied obstacles, barrel traps, and enemy waves
  const LEVELS = [
    // 1-5 Tutorials & Basics
    { id: 1, name: "First Defense", ammo: 15, enemies: [{ type: 'raider', count: 4, delay: 90 }], obstacles: [] },
    { id: 2, name: "Infantry Drill", ammo: 12, enemies: [{ type: 'raider', count: 6, delay: 80 }], obstacles: [] },
    { id: 3, name: "Cannon Introduction", ammo: 8, enemies: [{ type: 'shield', count: 3, delay: 110 }], obstacles: [] },
    { id: 4, name: "Timber Barricades", ammo: 10, enemies: [{ type: 'raider', count: 5, delay: 90 }],
      obstacles: [{ type: 'wood_box', x: 800, y: GROUND_Y - 40, w: 40, h: 80 }, { type: 'wood_box', x: 800, y: GROUND_Y - 120, w: 40, h: 80 }] },
    { id: 5, name: "Powder Kegs", ammo: 8, enemies: [{ type: 'shield', count: 4, delay: 90 }],
      obstacles: [{ type: 'tnt', x: 780, y: GROUND_Y - 30, w: 45, h: 45 }, { type: 'wood_box', x: 830, y: GROUND_Y - 40, w: 40, h: 80 }] },

    // 6-10 Tactical Formations & Physics Barricades
    { id: 6, name: "Shield & Arrow", ammo: 12, enemies: [{ type: 'shield', count: 3, delay: 100 }, { type: 'enemy_archer', count: 3, delay: 120 }], obstacles: [] },
    { id: 7, name: "Stone Enclosure", ammo: 10, enemies: [{ type: 'raider', count: 6, delay: 70 }],
      obstacles: [{ type: 'stone_wall', x: 740, y: GROUND_Y - 60, w: 35, h: 120 }, { type: 'tnt', x: 790, y: GROUND_Y - 25, w: 40, h: 40 }] },
    { id: 8, name: "Cavalry Rush", ammo: 12, enemies: [{ type: 'rider', count: 5, delay: 65 }], obstacles: [] },
    { id: 9, name: "Watchtower Snipers", ammo: 14, enemies: [{ type: 'enemy_archer', count: 4, delay: 90 }, { type: 'raider', count: 4, delay: 80 }],
      obstacles: [{ type: 'wood_box', x: 900, y: GROUND_Y - 70, w: 50, h: 140 }, { type: 'tnt', x: 905, y: GROUND_Y - 170, w: 40, h: 40 }] },
    { id: 10, name: "Awakened Giant", ammo: 14, enemies: [{ type: 'giant', count: 1, delay: 100 }, { type: 'raider', count: 5, delay: 70 }],
      obstacles: [{ type: 'stone_wall', x: 850, y: GROUND_Y - 50, w: 30, h: 100 }] },

    // 11-15 Moving Hazards & Aerial Platforms
    { id: 11, name: "Floating Bastion", ammo: 12, enemies: [{ type: 'enemy_archer', count: 4, delay: 100 }, { type: 'shield', count: 3, delay: 80 }],
      obstacles: [{ type: 'moving_plat', x: 720, y: 350, w: 140, h: 22, range: 140, speed: 1.8 }, { type: 'tnt', x: 760, y: 320, w: 35, h: 35 }] },
    { id: 12, name: "Bridge Ambush", ammo: 15, enemies: [{ type: 'rider', count: 4, delay: 80 }, { type: 'giant', count: 1, delay: 140 }],
      obstacles: [{ type: 'bridge', x: 680, y: GROUND_Y - 90, w: 160, h: 18 }] },
    { id: 13, name: "Falling Rocks Trap", ammo: 10, enemies: [{ type: 'shield', count: 5, delay: 75 }],
      obstacles: [{ type: 'falling_rock', x: 750, y: 160, r: 28 }, { type: 'wood_box', x: 740, y: 200, w: 40, h: 40 }] },
    { id: 14, name: "Pendulum Guillotine", ammo: 14, enemies: [{ type: 'raider', count: 7, delay: 60 }],
      obstacles: [{ type: 'moving_plat', x: 820, y: 300, w: 120, h: 25, range: 180, speed: 2.5 }] },
    { id: 15, name: "Colossal Wave", ammo: 16, enemies: [{ type: 'giant', count: 2, delay: 180 }, { type: 'raider', count: 6, delay: 60 }],
      obstacles: [{ type: 'tnt', x: 700, y: GROUND_Y - 30, w: 45, h: 45 }, { type: 'tnt', x: 880, y: GROUND_Y - 30, w: 45, h: 45 }] },

    // 16-20 Multi-Stage Puzzle Levels & Tight Ammo
    { id: 16, name: "Precision Squeeze", ammo: 7, enemies: [{ type: 'shield', count: 4, delay: 90 }],
      obstacles: [{ type: 'stone_wall', x: 650, y: GROUND_Y - 110, w: 30, h: 220 }, { type: 'tnt', x: 820, y: GROUND_Y - 25, w: 40, h: 40 }] },
    { id: 17, name: "Double Decker Defense", ammo: 12, enemies: [{ type: 'enemy_archer', count: 5, delay: 80 }, { type: 'rider', count: 3, delay: 90 }],
      obstacles: [{ type: 'wood_box', x: 780, y: GROUND_Y - 45, w: 50, h: 90 }, { type: 'moving_plat', x: 780, y: 320, w: 130, h: 20, range: 90, speed: 1.5 }] },
    { id: 18, name: "Chain Reaction", ammo: 8, enemies: [{ type: 'shield', count: 6, delay: 65 }],
      obstacles: [{ type: 'tnt', x: 650, y: GROUND_Y - 25, w: 40, h: 40 }, { type: 'tnt', x: 750, y: GROUND_Y - 25, w: 40, h: 40 }, { type: 'tnt', x: 850, y: GROUND_Y - 25, w: 40, h: 40 }] },
    { id: 19, name: "Sky Vault", ammo: 10, enemies: [{ type: 'enemy_archer', count: 6, delay: 85 }],
      obstacles: [{ type: 'stone_wall', x: 700, y: 300, w: 35, h: 220 }, { type: 'falling_rock', x: 710, y: 150, r: 26 }] },
    { id: 20, name: "Ironhide Vanguard", ammo: 12, enemies: [{ type: 'giant', count: 2, delay: 150 }, { type: 'shield', count: 4, delay: 70 }],
      obstacles: [{ type: 'wood_box', x: 700, y: GROUND_Y - 45, w: 40, h: 90 }, { type: 'tnt', x: 750, y: GROUND_Y - 25, w: 40, h: 40 }] },

    // 21-25 Heavy Combined Siege
    { id: 21, name: "Speed Raid", ammo: 14, enemies: [{ type: 'rider', count: 8, delay: 50 }],
      obstacles: [{ type: 'moving_plat', x: 750, y: 440, w: 100, h: 20, range: 120, speed: 3.2 }] },
    { id: 22, name: "Fortified Redoubt", ammo: 15, enemies: [{ type: 'shield', count: 4, delay: 80 }, { type: 'enemy_archer', count: 4, delay: 90 }, { type: 'giant', count: 1, delay: 160 }],
      obstacles: [{ type: 'stone_wall', x: 820, y: GROUND_Y - 80, w: 35, h: 160 }, { type: 'tnt', x: 870, y: GROUND_Y - 25, w: 40, h: 40 }] },
    { id: 23, name: "Crumbling Archway", ammo: 12, enemies: [{ type: 'raider', count: 8, delay: 50 }, { type: 'rider', count: 4, delay: 70 }],
      obstacles: [{ type: 'wood_box', x: 720, y: GROUND_Y - 50, w: 40, h: 100 }, { type: 'wood_box', x: 840, y: GROUND_Y - 50, w: 40, h: 100 }, { type: 'falling_rock', x: 780, y: GROUND_Y - 160, r: 35 }] },
    { id: 24, name: "Lethal Alley", ammo: 14, enemies: [{ type: 'shield', count: 5, delay: 70 }, { type: 'enemy_archer', count: 4, delay: 80 }],
      obstacles: [{ type: 'moving_plat', x: 670, y: 320, w: 110, h: 20, range: 150, speed: 2.2 }, { type: 'moving_plat', x: 880, y: 420, w: 110, h: 20, range: 120, speed: -2.0 }] },
    { id: 25, name: "The Twin Titans", ammo: 16, enemies: [{ type: 'giant', count: 2, delay: 140 }, { type: 'rider', count: 5, delay: 60 }],
      obstacles: [{ type: 'tnt', x: 680, y: GROUND_Y - 30, w: 45, h: 45 }, { type: 'stone_wall', x: 800, y: GROUND_Y - 60, w: 30, h: 120 }] },

    // 26-29 Climax Puzzles
    { id: 26, name: "Shattered Keep", ammo: 15, enemies: [{ type: 'shield', count: 6, delay: 70 }, { type: 'giant', count: 2, delay: 160 }],
      obstacles: [{ type: 'wood_box', x: 700, y: GROUND_Y - 40, w: 45, h: 80 }, { type: 'tnt', x: 760, y: GROUND_Y - 30, w: 45, h: 45 }, { type: 'wood_box', x: 820, y: GROUND_Y - 40, w: 45, h: 80 }] },
    { id: 27, name: "The Gauntlet", ammo: 16, enemies: [{ type: 'rider', count: 6, delay: 55 }, { type: 'enemy_archer', count: 6, delay: 75 }],
      obstacles: [{ type: 'moving_plat', x: 740, y: 360, w: 160, h: 24, range: 200, speed: 3.0 }] },
    { id: 28, name: "Bombardment Valley", ammo: 14, enemies: [{ type: 'shield', count: 6, delay: 65 }, { type: 'giant', count: 2, delay: 150 }],
      obstacles: [{ type: 'tnt', x: 650, y: GROUND_Y - 25, w: 40, h: 40 }, { type: 'falling_rock', x: 720, y: 180, r: 30 }, { type: 'tnt', x: 840, y: GROUND_Y - 25, w: 40, h: 40 }] },
    { id: 29, name: "Gate of Despair", ammo: 18, enemies: [{ type: 'rider', count: 6, delay: 50 }, { type: 'shield', count: 6, delay: 60 }, { type: 'giant', count: 2, delay: 140 }],
      obstacles: [{ type: 'stone_wall', x: 700, y: GROUND_Y - 70, w: 35, h: 140 }, { type: 'stone_wall', x: 860, y: GROUND_Y - 70, w: 35, h: 140 }, { type: 'tnt', x: 780, y: GROUND_Y - 25, w: 40, h: 40 }] },

    // Level 30: Final Multi-Phase Boss
    { id: 30, name: "Siege Overlord - Final Stand", ammo: 24,
      enemies: [{ type: 'boss', count: 1, delay: 100 }],
      obstacles: [
        { type: 'wood_box', x: 680, y: GROUND_Y - 40, w: 40, h: 80 },
        { type: 'tnt', x: 750, y: GROUND_Y - 30, w: 45, h: 45 },
        { type: 'moving_plat', x: 820, y: 340, w: 140, h: 22, range: 160, speed: 2.2 },
        { type: 'falling_rock', x: 840, y: 150, r: 32 }
      ]
    }
  ];

  // -------------------------------------------------------------
  // GAME ENGINE STATE
  // -------------------------------------------------------------
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  let gameState = 'MENU'; // MENU, PLAYING, VICTORY, DEFEAT
  let currentLevelIdx = 0;
  let castleHp = 1000;
  const maxCastleHp = 1000;
  let remainingAmmo = 0;
  let ammoUsed = 0;
  let currentUnit = 'archer'; // archer, cannon, infantry, cavalry

  // Input & Aiming
  let isAiming = false;
  let aimStart = { x: 0, y: 0 };
  let aimCurrent = { x: 0, y: 0 };
  const originPositions = {
    archer: { x: 195, y: 310 },
    cannon: { x: 235, y: 550 }
  };

  // Cooldowns
  const cooldowns = {
    archer: 0,
    cannon: 0,
    infantry: 0,
    cavalry: 0
  };
  const cooldownDurations = {
    archer: 30,
    cannon: 90,
    infantry: 140,
    cavalry: 200
  };

  // Entities
  let projectiles = [];
  let enemies = [];
  let friendlyUnits = [];
  let obstacles = [];
  let particles = [];
  let spawnQueue = [];
  let spawnTimer = 0;
  let screenShake = 0;

  // Local Storage Save Progress
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
  // UNIT & ENEMY DEFINITIONS (Weaknesses, Stats & Visuals)
  // -------------------------------------------------------------
  class Enemy {
    constructor(type, x, y) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.markedForDeath = false;
      this.attackTimer = 0;
      this.animTick = 0;

      switch(type) {
        case 'raider':
          this.hp = 80;
          this.maxHp = 80;
          this.speed = 1.35;
          this.damage = 18;
          this.w = 26;
          this.h = 42;
          this.color = '#ef4444';
          break;
        case 'shield':
          this.hp = 180;
          this.maxHp = 180;
          this.speed = 0.85;
          this.damage = 25;
          this.w = 32;
          this.h = 44;
          this.color = '#94a3b8';
          this.shieldFront = true; // Arrows from front deal 80% reduced dmg
          break;
        case 'rider':
          this.hp = 95;
          this.maxHp = 95;
          this.speed = 2.8;
          this.damage = 35;
          this.w = 46;
          this.h = 40;
          this.color = '#f97316';
          break;
        case 'giant':
          this.hp = 550;
          this.maxHp = 550;
          this.speed = 0.55;
          this.damage = 90;
          this.w = 48;
          this.h = 76;
          this.color = '#a855f7';
          break;
        case 'enemy_archer':
          this.hp = 70;
          this.maxHp = 70;
          this.speed = 1.0;
          this.damage = 12;
          this.range = 420;
          this.w = 26;
          this.h = 40;
          this.color = '#10b981';
          break;
        case 'boss':
          this.hp = 1600;
          this.maxHp = 1600;
          this.speed = 0.5;
          this.damage = 150;
          this.w = 64;
          this.h = 96;
          this.color = '#dc2626';
          this.phase = 1; // 3 phases
          break;
      }
    }

    update() {
      this.animTick++;
      const castleX = 230;

      // Boss special phases
      if (this.type === 'boss') {
        if (this.hp <= 1000 && this.phase === 1) {
          this.phase = 2;
          this.speed = 0.8;
          spawnParticles(this.x, this.y, '#f59e0b', 30);
          audio.play('wood_break');
        } else if (this.hp <= 450 && this.phase === 2) {
          this.phase = 3;
          this.speed = 1.2;
          this.damage = 220;
          spawnParticles(this.x, this.y, '#dc2626', 40);
          audio.play('explosion');
        }
      }

      // Check combat with player ground units
      let engagedFriendly = null;
      for (const friendly of friendlyUnits) {
        if (!friendly.dead && Math.abs(friendly.x - this.x) < 32) {
          engagedFriendly = friendly;
          break;
        }
      }

      if (engagedFriendly) {
        // Fight friendly unit
        this.attackTimer++;
        if (this.attackTimer % 45 === 0) {
          engagedFriendly.hp -= this.damage;
          audio.play('hit');
          spawnParticles(engagedFriendly.x, engagedFriendly.y - 15, '#ef4444', 4);
          if (engagedFriendly.hp <= 0) engagedFriendly.dead = true;
        }
        return;
      }

      // Ranged attacker logic
      if (this.type === 'enemy_archer') {
        if (this.x - castleX <= this.range) {
          this.attackTimer++;
          if (this.attackTimer % 90 === 0) {
            // Shoot arrow at castle
            projectiles.push(new Projectile(this.x, this.y - 20, -7.5, -4.5, 'enemy_arrow'));
            audio.play('bow_release');
          }
          return;
        }
      }

      // Marching towards castle
      if (this.x > castleX + 15) {
        this.x -= this.speed;
      } else {
        // Attacking Castle
        this.attackTimer++;
        if (this.attackTimer % 50 === 0) {
          castleHp = Math.max(0, castleHp - this.damage);
          screenShake = 6;
          audio.play('hit');
          spawnParticles(this.x - 10, this.y - 20, '#ef4444', 8);
          updateHUD();
        }
      }
    }

    takeDamage(amount, damageType, hitVelocityX = 0) {
      let finalDmg = amount;

      // Type Weaknesses & Resistances
      if (this.type === 'shield') {
        if (damageType === 'arrow' && hitVelocityX > 0) {
          finalDmg *= 0.2; // Shield deflects frontal arrows
          spawnParticles(this.x, this.y - 20, '#cbd5e1', 6);
        } else if (damageType === 'cannon') {
          finalDmg *= 1.8; // Vulnerable to cannon blast
        }
      } else if (this.type === 'rider') {
        if (damageType === 'arrow') finalDmg *= 1.6; // Vulnerable to precision arrows
      } else if (this.type === 'giant') {
        if (damageType === 'cannon') finalDmg *= 1.5;
        if (damageType === 'cavalry') finalDmg *= 1.7;
      } else if (this.type === 'raider') {
        if (damageType === 'infantry') finalDmg *= 1.6;
      }

      this.hp -= finalDmg;
      audio.play('hit');
      spawnParticles(this.x, this.y - 20, '#b91c1c', 6);

      if (this.hp <= 0) {
        this.markedForDeath = true;
        spawnParticles(this.x, this.y - 20, this.color, 15);
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);

      // Walk cycle bob
      const bob = Math.sin(this.animTick * 0.2) * 2;

      // Draw shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.w / 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body rendering
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.roundRect(-this.w / 2, -this.h + bob, this.w, this.h, [4]);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Shield graphic
      if (this.type === 'shield') {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-this.w / 2 - 4, -this.h + 8 + bob, 8, this.h - 10);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(-this.w / 2 - 4, -this.h + 8 + bob, 8, this.h - 10);
      }

      // Boss decorative armor
      if (this.type === 'boss') {
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(0, -this.h - 4 + bob, 10, 0, Math.PI, true);
        ctx.fill();
      }

      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -this.h + 4 + bob, 9, 0, Math.PI * 2);
      ctx.fill();

      // Health bar
      if (this.hp < this.maxHp) {
        const barW = Math.max(30, this.w + 6);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-barW / 2, -this.h - 14, barW, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-barW / 2, -this.h - 14, (this.hp / this.maxHp) * barW, 5);
      }

      ctx.restore();
    }
  }

  // Friendly Deployed Troops (Infantry & Cavalry)
  class FriendlyTroop {
    constructor(type) {
      this.type = type;
      this.x = 230;
      this.y = GROUND_Y;
      this.dead = false;
      this.animTick = 0;

      if (type === 'infantry') {
        this.hp = 140;
        this.maxHp = 140;
        this.speed = 1.6;
        this.damage = 22;
        this.w = 26;
        this.h = 42;
        this.color = '#3b82f6';
      } else {
        // cavalry
        this.hp = 220;
        this.maxHp = 220;
        this.speed = 3.6;
        this.damage = 45;
        this.w = 44;
        this.h = 44;
        this.color = '#0284c7';
      }
    }

    update() {
      this.animTick++;
      let target = null;
      for (const e of enemies) {
        if (e.x > this.x && e.x - this.x < 30) {
          target = e;
          break;
        }
      }

      if (target) {
        if (this.animTick % 40 === 0) {
          target.takeDamage(this.damage, this.type);
          spawnParticles(this.x + 15, this.y - 18, '#38bdf8', 4);
        }
      } else {
        this.x += this.speed;
        // Check obstacle collision
        for (const obs of obstacles) {
          if (!obs.destroyed && obs.type !== 'moving_plat' && obs.type !== 'falling_rock') {
            if (this.x + this.w / 2 >= obs.x && this.x - this.w / 2 <= obs.x + obs.w) {
              obs.takeDamage(this.damage);
              this.dead = true;
              spawnParticles(this.x, this.y - 20, '#38bdf8', 8);
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
      const bob = Math.sin(this.animTick * 0.25) * 2;

      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.w / 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.roundRect(-this.w / 2, -this.h + bob, this.w, this.h, [4]);
      ctx.fill();

      // Helmet / Head
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(0, -this.h + 2 + bob, 8, 0, Math.PI * 2);
      ctx.fill();

      // Sword or Lance
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(8, -this.h / 2 + bob);
      ctx.lineTo(this.w / 2 + 10, -this.h / 2 + bob);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Projectile Class (Arrows, Cannonballs, Enemy Arrows)
  class Projectile {
    constructor(x, y, vx, vy, type) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.type = type;
      this.dead = false;
      this.radius = type === 'cannonball' ? 9 : 4;
    }

    update() {
      this.vy += GRAVITY;
      this.x += this.vx;
      this.y += this.vy;

      // Hit Ground
      if (this.y >= GROUND_Y) {
        this.dead = true;
        if (this.type === 'cannonball') {
          triggerExplosion(this.x, GROUND_Y, 80, 160);
        } else {
          spawnParticles(this.x, GROUND_Y, '#78350f', 4);
          audio.play('hit');
        }
        return;
      }

      // Enemy Projectiles hitting Castle
      if (this.type === 'enemy_arrow') {
        if (this.x <= 230) {
          this.dead = true;
          castleHp = Math.max(0, castleHp - 15);
          screenShake = 3;
          audio.play('hit');
          spawnParticles(this.x, this.y, '#ef4444', 5);
          updateHUD();
        }
        return;
      }

      // Collision with Obstacles
      for (const obs of obstacles) {
        if (obs.destroyed) continue;
        if (obs.checkCollision(this.x, this.y, this.radius)) {
          this.dead = true;
          if (this.type === 'cannonball') {
            triggerExplosion(this.x, this.y, 90, 220);
          } else {
            obs.takeDamage(45);
            audio.play('wood_break');
            spawnParticles(this.x, this.y, '#d97706', 6);
          }
          return;
        }
      }

      // Collision with Enemies
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
      if (this.type === 'arrow' || this.type === 'enemy_arrow') {
        const angle = Math.atan2(this.vy, this.vx);
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.strokeStyle = this.type === 'arrow' ? '#f8fafc' : '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();

        // Arrow head
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(2, -4);
        ctx.lineTo(2, 4);
        ctx.closePath();
        ctx.fill();
      } else if (this.type === 'cannonball') {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Interactive Obstacle & Puzzle System
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
        this.hp = 80;
        this.maxHp = 80;
      } else if (this.type === 'stone_wall') {
        this.hp = 300;
        this.maxHp = 300;
      } else if (this.type === 'tnt') {
        this.hp = 20;
        this.maxHp = 20;
      } else if (this.type === 'falling_rock') {
        this.hp = 999;
        this.falling = false;
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

        // Rock squashes enemies beneath
        for (const e of enemies) {
          if (!e.markedForDeath && Math.hypot(e.x - this.x, e.y - 20 - this.y) < this.r + 20) {
            e.takeDamage(250, 'rock');
            screenShake = 6;
          }
        }

        if (this.y >= GROUND_Y - this.r) {
          this.y = GROUND_Y - this.r;
          this.falling = false;
          screenShake = 7;
          audio.play('wood_break');
          spawnParticles(this.x, this.y, '#64748b', 16);
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
          triggerExplosion(this.x + this.w / 2, this.y + this.h / 2, 110, 260);
        } else {
          audio.play('wood_break');
          spawnParticles(this.x + this.w / 2, this.y + this.h / 2, this.type === 'wood_box' ? '#b45309' : '#64748b', 14);
        }
      }
    }

    draw() {
      if (this.destroyed) return;
      ctx.save();

      if (this.type === 'wood_box') {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.w, this.y + this.h);
        ctx.moveTo(this.x + this.w, this.y);
        ctx.lineTo(this.x, this.y + this.h);
        ctx.stroke();
      } else if (this.type === 'stone_wall') {
        ctx.fillStyle = '#475569';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
      } else if (this.type === 'tnt') {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TNT', this.x + this.w / 2, this.y + this.h / 2 + 4);
      } else if (this.type === 'moving_plat' || this.type === 'bridge') {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
      } else if (this.type === 'falling_rock') {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // Particle System
  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.02,
        color: color,
        size: Math.random() * 4 + 2
      });
    }
  }

  function triggerExplosion(x, y, radius, damage) {
    audio.play('explosion');
    screenShake = 12;
    spawnParticles(x, y, '#ea580c', 25);
    spawnParticles(x, y, '#facc15', 20);

    // Blast damage to enemies
    for (const e of enemies) {
      if (e.markedForDeath) continue;
      const d = Math.hypot(e.x - x, e.y - 20 - y);
      if (d < radius) {
        const falloff = 1 - (d / radius);
        e.takeDamage(damage * falloff, 'cannon');
      }
    }

    // Blast damage to nearby obstacles
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
  // LEVEL INITIALIZATION & WAVE SPAWNING
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

    // Build spawn queue
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
    // Castle HP
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

    // Ammo
    document.getElementById('ammo-count').innerText = remainingAmmo;

    // Remaining Enemies
    const totalRemaining = spawnQueue.length + enemies.length;
    document.getElementById('wave-display').innerText = `Enemies Left: ${totalRemaining}`;

    // Cooldown overlays
    ['archer', 'cannon', 'infantry', 'cavalry'].forEach(u => {
      const el = document.getElementById(`cd-${u}`);
      const cdRatio = cooldowns[u] / cooldownDurations[u];
      el.style.transform = `scaleY(${Math.max(0, cdRatio)})`;
    });
  }

  // -------------------------------------------------------------
  // USER INPUT & AIMING CONTROLS (Pointer / Touch Support)
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

    // Infantry / Cavalry Deployment directly onto battlefield
    if (currentUnit === 'infantry' || currentUnit === 'cavalry') {
      if (cooldowns[currentUnit] <= 0) {
        friendlyUnits.push(new FriendlyTroop(currentUnit));
        cooldowns[currentUnit] = cooldownDurations[currentUnit];
        audio.play('wood_break');
      }
      return;
    }

    // Manual Aiming for Archer & Cannon
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

    if (dist < 15) return; // Prevent accidental misfires

    // Physics launch calculation (drag backward to shoot forward)
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
      screenShake = 5;
    }

    remainingAmmo--;
    ammoUsed++;
    updateHUD();
  }

  // Troop Switch Event Listeners
  document.querySelectorAll('.troop-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.troop-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentUnit = card.dataset.unit;
    });
  });

  // -------------------------------------------------------------
  // TRAJECTORY PREDICTION (Dotted Visual Curve)
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
    ctx.fillStyle = currentUnit === 'archer' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(234, 88, 12, 0.75)';

    for (let step = 0; step < 36; step++) {
      simVy += GRAVITY;
      simX += simVx;
      simY += simVy;

      if (simY >= GROUND_Y || simX >= WIDTH) break;

      if (step % 2 === 0) {
        ctx.beginPath();
        ctx.arc(simX, simY, currentUnit === 'archer' ? 3 : 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Slingshot Pull Vector line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x - (start.x - cur.x) * 0.5, origin.y - (start.y - cur.y) * 0.5);
    ctx.stroke();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // RENDERING PIPELINE (Original 2D Graphics)
  // -------------------------------------------------------------
  function drawEnvironment() {
    // Atmospheric Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.5, '#1e293b');
    sky.addColorStop(1, '#334155');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Distant Mountain Silhouettes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(160, 420);
    ctx.lineTo(340, 520);
    ctx.lineTo(580, 400);
    ctx.lineTo(840, 510);
    ctx.lineTo(1080, 390);
    ctx.lineTo(WIDTH, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Ground Dirt & Grass Layer
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, GROUND_Y, WIDTH, 6);

    // Player Castle (Left Side)
    drawPlayerCastle();
  }

  function drawPlayerCastle() {
    ctx.save();

    // Castle Base & Walls
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 240, 230, GROUND_Y - 240);

    // Stone Brick Pattern
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    for (let y = 250; y < GROUND_Y; y += 30) {
      for (let x = 0; x < 230; x += 40) {
        ctx.strokeRect(x + ((y / 30) % 2 * 20), y, 40, 30);
      }
    }

    // Battlement Crenellations
    ctx.fillStyle = '#1e293b';
    for (let x = 0; x <= 200; x += 40) {
      ctx.fillRect(x, 210, 25, 30);
    }

    // Castle Arch Gate
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(170, GROUND_Y, 45, Math.PI, 0);
    ctx.fill();

    // Archer Platform & Archer Unit
    const archerPos = originPositions.archer;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(archerPos.x, archerPos.y - 12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(archerPos.x - 8, archerPos.y, 16, 22);

    // Cannon Platform & Cannon Unit
    const cannonPos = originPositions.cannon;
    ctx.fillStyle = '#475569';
    ctx.fillRect(cannonPos.x - 28, cannonPos.y - 10, 36, 18);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cannonPos.x - 8, cannonPos.y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // MAIN SIMULATION LOOP (60 FPS FIXED DELTA)
  // -------------------------------------------------------------
  function gameLoop() {
    // Screen Shake Offset
    ctx.save();
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake;
      const shakeY = (Math.random() - 0.5) * screenShake;
      ctx.translate(shakeX, shakeY);
      screenShake = Math.max(0, screenShake - 0.7);
    }

    // Clear and Render Backdrop
    drawEnvironment();

    if (gameState === 'PLAYING') {
      // Cooldown timer updates
      Object.keys(cooldowns).forEach(k => {
        if (cooldowns[k] > 0) cooldowns[k]--;
      });

      // Wave Spawning
      spawnTimer++;
      for (let i = spawnQueue.length - 1; i >= 0; i--) {
        const item = spawnQueue[i];
        if (spawnTimer >= item.delay) {
          enemies.push(new Enemy(item.type, WIDTH + 30, GROUND_Y));
          spawnQueue.splice(i, 1);
        }
      }

      // Update & Draw Obstacles
      obstacles.forEach(o => {
        o.update();
        o.draw();
      });

      // Update & Draw Projectiles
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update();
        p.draw();
        if (p.dead) projectiles.splice(i, 1);
      }

      // Update & Draw Friendly Troops
      for (let i = friendlyUnits.length - 1; i >= 0; i--) {
        const f = friendlyUnits[i];
        f.update();
        f.draw();
        if (f.dead) friendlyUnits.splice(i, 1);
      }

      // Update & Draw Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.update();
        e.draw();
        if (e.markedForDeath) enemies.splice(i, 1);
      }

      // Trajectory Prediction Guide during Drag
      if (isAiming) {
        const origin = originPositions[currentUnit];
        drawTrajectoryGuide(origin, aimStart, aimCurrent);
      }

      // Win / Loss Conditions
      checkGameOutcomes();
      updateHUD();
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;

      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      if (pt.life <= 0) particles.splice(i, 1);
    }

    ctx.restore();
    requestAnimationFrame(gameLoop);
  }

  function checkGameOutcomes() {
    // Castle destroyed
    if (castleHp <= 0) {
      gameState = 'DEFEAT';
      document.getElementById('defeat-screen').classList.remove('hidden');
      return;
    }

    // Wave cleared
    if (spawnQueue.length === 0 && enemies.length === 0) {
      gameState = 'VICTORY';
      const lvl = LEVELS[currentLevelIdx];

      // Star calculation
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
  // UI NAVIGATION & EVENT CONTROLS
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

  document.getElementById('btn-restart-hud').addEventListener('click', () => {
    loadLevel(currentLevelIdx);
  });

  document.getElementById('btn-retry').addEventListener('click', () => {
    loadLevel(currentLevelIdx);
  });

  document.getElementById('btn-defeat-retry').addEventListener('click', () => {
    loadLevel(currentLevelIdx);
  });

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

  // Start engine loop
  requestAnimationFrame(gameLoop);
})();
