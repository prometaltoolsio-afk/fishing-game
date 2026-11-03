/**
 * মূল গেম ইঞ্জিন, সাউন্ড সিস্টেম, ভিজ্যুয়াল এফেক্টস ও ইউজার ইন্টারফেস
 */

// --- সাউন্ড সিস্টেম (Web Audio API) ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playLaunch() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playExplosion() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
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
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(80, now + 0.4);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  playHit() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playVictory() {
    if (!this.enabled || !this.ctx) return;
    const notes = [261.6, 329.6, 392.0, 523.2];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + idx * 0.12;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    });
  }

  playDefeat() {
    if (!this.enabled || !this.ctx) return;
    const notes = [300, 260, 220, 180];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + idx * 0.15;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.31);
    });
  }

  playSpecial() {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }
}

// --- পার্টিকল এফেক্ট সিস্টেম ---
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, color, count = 15, maxSpeed = 5, life = 40) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * maxSpeed + 1;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        alpha: 1.0,
        decay: 1 / (Math.random() * life + 15),
        size: Math.random() * 4 + 2
      });
    }
  }

  updateAndDraw(ctx) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // মাধ্যাকর্ষণ টান
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// --- মূল গেম কন্ট্রোলার ---
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.physics = new PhysicsManager();
    this.audio = new SoundController();
    this.particles = new ParticleSystem();

    this.slingshotPos = { x: 200, y: 520 };
    this.maxSlingDrag = 80;
    this.isDragging = false;
    this.dragPos = { ...this.slingshotPos };

    this.currentLevelIndex = 0;
    this.score = 0;
    this.heroQueue = [];
    this.currentHeroBody = null;
    this.activeHeroLaunched = false;
    this.settleTimer = 0;
    this.gameState = 'MENU';

    // সেভ ডেটা স্ট্রাকচার
    this.progression = {
      unlockedLevels: 1,
      scores: {},
      stars: {},
      coins: 0,
      unlockedHeroes: ['power'],
      lastDaily: 0
    };

    this.entities = {
      monsters: [],
      blocks: [],
      moving: [],
      blades: []
    };

    this.heroCatalog = [
      { id: 'power', name: 'পাওয়ার বল', cost: 0, desc: 'সুষম গতি এবং চমৎকার ভারসাম্য।' },
      { id: 'speed', name: 'স্পিড হিরো', cost: 100, desc: 'বাতাসে থাকা অবস্থায় ট্যাপ করলে দ্রুত গতি বাড়ে!' },
      { id: 'bomb', name: 'বোম্ব হিরো', cost: 250, desc: 'বাতাসে ট্যাপ করলে শক্তিশালী বিস্ফোরণ ঘটায়!' },
      { id: 'ice', name: 'আইস হিরো', cost: 400, desc: 'বাধা বরফে জমিয়ে গতিবেগ থামিয়ে দেয়!' }
    ];

    this.init();
  }

  init() {
    this.loadProgress();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupPhysicsEvents();
    this.setupInputEvents();
    this.setupUIEvents();

    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.physics.initBounds(1280, 720);
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('MONSTER_CLASH_SAVE_v1');
      if (saved) {
        this.progression = Object.assign(this.progression, JSON.parse(saved));
      }
    } catch (e) {
      console.error('Save লোড করতে সমস্যা হয়েছে', e);
    }
  }

  saveProgress() {
    try {
      localStorage.setItem('MONSTER_CLASH_SAVE_v1', JSON.stringify(this.progression));
    } catch (e) {
      console.error('Save করতে সমস্যা হয়েছে', e);
    }
  }

  setupPhysicsEvents() {
    Events.on(this.physics.engine, 'collisionStart', (evt) => {
      for (const pair of evt.pairs) {
        const { bodyA, bodyB } = pair;
        const speed = Vector.magnitude(Vector.sub(bodyA.velocity, bodyB.velocity));

        if (speed > 2.5) {
          this.handleDamage(bodyA, speed * 12);
          this.handleDamage(bodyB, speed * 12);
          this.audio.playHit();
        }
      }
    });
  }

  handleDamage(body, damage) {
    if (!body || !body.custom) return;

    // দানবের ক্ষতি
    if (body.label === 'monster') {
      if (body.custom.isShielded && damage < 40) {
        damage = 0; // শিল্ডে ধাক্কা আটকে যায়
      }
      body.custom.hp -= damage;
      this.particles.emit(body.position.x, body.position.y, '#e74c3c', 6, 3);

      if (body.custom.hp <= 0) {
        this.destroyMonster(body);
      }
    }

    // ব্লক ও টিএনটির ক্ষতি
    if (body.label === 'block' || body.label === 'tnt') {
      body.custom.hp -= damage;

      let color = '#d35400';
      if (body.custom.blockType === 'wood') color = '#e67e22';
      if (body.custom.blockType === 'stone') color = '#bdc3c7';
      if (body.custom.blockType === 'metal') color = '#7f8c8d';
      if (body.custom.blockType === 'glass') color = '#3498db';

      this.particles.emit(body.position.x, body.position.y, color, 4, 3);

      if (body.custom.hp <= 0) {
        if (body.label === 'tnt') {
          this.triggerExplosion(body.position.x, body.position.y, 160, 450);
        }
        World.remove(this.physics.world, body);
        const idx = this.entities.blocks.indexOf(body);
        if (idx > -1) this.entities.blocks.splice(idx, 1);
        this.addScore(100);
      }
    }
  }

  destroyMonster(monsterBody) {
    World.remove(this.physics.world, monsterBody);
    const idx = this.entities.monsters.indexOf(monsterBody);
    if (idx > -1) this.entities.monsters.splice(idx, 1);

    this.particles.emit(monsterBody.position.x, monsterBody.position.y, '#2ecc71', 25, 6);
    this.addScore(500);
  }

  triggerExplosion(x, y, radius, power) {
    this.audio.playExplosion();
    this.particles.emit(x, y, '#f39c12', 30, 8);
    this.particles.emit(x, y, '#e74c3c', 20, 6);

    const allBodies = Composite.allBodies(this.physics.world);
    for (const body of allBodies) {
      if (body.isStatic) continue;
      const dist = Vector.magnitude(Vector.sub(body.position, { x, y }));
      if (dist < radius && dist > 1) {
        const forceMag = (1 - dist / radius) * (power / 1000);
        const dir = Vector.normalise(Vector.sub(body.position, { x, y }));
        Body.applyForce(body, body.position, Vector.mult(dir, forceMag));
        this.handleDamage(body, (1 - dist / radius) * 200);
      }
    }
  }

  triggerIceBlast(x, y, radius) {
    this.audio.playSpecial();
    this.particles.emit(x, y, '#00d2d3', 25, 5);

    const allBodies = Composite.allBodies(this.physics.world);
    for (const body of allBodies) {
      const dist = Vector.magnitude(Vector.sub(body.position, { x, y }));
      if (dist < radius) {
        Body.setVelocity(body, { x: body.velocity.x * 0.2, y: body.velocity.y * 0.2 });
        if (body.custom) {
          body.custom.frozenTimer = 180;
        }
      }
    }
  }

  addScore(amt) {
    this.score += amt;
    document.getElementById('score-display').textContent = `স্কোর: ${this.score}`;
  }

  // --- ইউআই ম্যানেজমেন্ট ---
  setupUIEvents() {
    const get = (id) => document.getElementById(id);

    get('btn-play').onclick = () => {
      this.audio.init();
      this.startLevel(this.progression.unlockedLevels - 1);
    };

    get('btn-levels').onclick = () => {
      this.renderLevelGrid();
      this.switchScreen('level-screen');
    };

    get('btn-heroes').onclick = () => {
      this.renderHeroGrid();
      this.switchScreen('hero-screen');
    };

    get('btn-daily').onclick = () => this.claimDailyReward();

    get('btn-sound-toggle').onclick = (e) => {
      this.audio.init();
      this.audio.enabled = !this.audio.enabled;
      e.target.textContent = `🔊 সাউন্ড: ${this.audio.enabled ? 'চালু' : 'বন্ধ'}`;
    };

    get('btn-pause').onclick = () => {
      if (this.gameState === 'PLAYING') {
        this.gameState = 'PAUSED';
        get('pause-screen').classList.remove('hidden');
      }
    };

    get('btn-resume').onclick = () => {
      this.gameState = 'PLAYING';
      get('pause-screen').classList.add('hidden');
    };

    get('btn-restart').onclick = () => this.startLevel(this.currentLevelIndex);
    get('btn-pause-restart').onclick = () => {
      get('pause-screen').classList.add('hidden');
      this.startLevel(this.currentLevelIndex);
    };

    get('btn-pause-menu').onclick = () => {
      get('pause-screen').classList.add('hidden');
      this.returnToMenu();
    };

    get('btn-next-level').onclick = () => {
      get('win-screen').classList.add('hidden');
      if (this.currentLevelIndex < GAME_LEVELS.length - 1) {
        this.startLevel(this.currentLevelIndex + 1);
      } else {
        this.returnToMenu();
      }
    };

    get('btn-win-replay').onclick = () => {
      get('win-screen').classList.add('hidden');
      this.startLevel(this.currentLevelIndex);
    };

    get('btn-win-menu').onclick = () => {
      get('win-screen').classList.add('hidden');
      this.returnToMenu();
    };

    get('btn-lose-replay').onclick = () => {
      get('lose-screen').classList.add('hidden');
      this.startLevel(this.currentLevelIndex);
    };

    get('btn-lose-menu').onclick = () => {
      get('lose-screen').classList.add('hidden');
      this.returnToMenu();
    };

    get('btn-level-back').onclick = () => this.switchScreen('menu-screen');
    get('btn-hero-back').onclick = () => this.switchScreen('menu-screen');
  }

  switchScreen(screenId) {
    const screens = ['menu-screen', 'level-screen', 'hero-screen', 'pause-screen', 'win-screen', 'lose-screen'];
    screens.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    if (screenId) {
      document.getElementById(screenId).classList.remove('hidden');
    }
  }

  returnToMenu() {
    this.gameState = 'MENU';
    document.getElementById('hud').classList.add('hidden');
    this.switchScreen('menu-screen');
  }

  renderLevelGrid() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';

    GAME_LEVELS.forEach((lvl, idx) => {
      const card = document.createElement('div');
      const isLocked = idx >= this.progression.unlockedLevels;
      card.className = `level-card ${isLocked ? 'locked' : ''} ${this.progression.stars[idx + 1] ? 'cleared' : ''}`;

      const starsCount = this.progression.stars[idx + 1] || 0;
      card.innerHTML = `
        <div>#${lvl.id}</div>
        <div class="level-stars">${'★'.repeat(starsCount)}${'☆'.repeat(3 - starsCount)}</div>
      `;

      if (!isLocked) {
        card.onclick = () => {
          this.audio.init();
          this.startLevel(idx);
        };
      }
      grid.appendChild(card);
    });
  }

  renderHeroGrid() {
    const grid = document.getElementById('hero-grid');
    grid.innerHTML = '';

    this.heroCatalog.forEach(hero => {
      const isUnlocked = this.progression.unlockedHeroes.includes(hero.id);
      const card = document.createElement('div');
      card.className = `hero-card ${isUnlocked ? 'unlocked' : ''}`;

      let actionHtml = `<span style="color:#2ecc71; font-weight:bold;">আনলকড</span>`;
      if (!isUnlocked) {
        actionHtml = `<button class="btn btn-gold btn-small" id="buy-hero-${hero.id}">🪙 ${hero.cost}</button>`;
      }

      card.innerHTML = `
        <h3 style="color:#ffd32a;">${hero.name}</h3>
        <p style="font-size:12px; color:#cbd5e1;">${hero.desc}</p>
        <div>${actionHtml}</div>
      `;

      grid.appendChild(card);

      if (!isUnlocked) {
        card.querySelector(`#buy-hero-${hero.id}`).onclick = () => {
          if (this.progression.coins >= hero.cost) {
            this.progression.coins -= hero.cost;
            this.progression.unlockedHeroes.push(hero.id);
            this.saveProgress();
            this.renderHeroGrid();
            this.updateCoinsDisplay();
          } else {
            alert('পর্যাপ্ত কয়েন নেই! আরও লেভেল জিতে কয়েন অর্জন করুন।');
          }
        };
      }
    });
  }

  claimDailyReward() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - this.progression.lastDaily > oneDay) {
      this.progression.coins += 150;
      this.progression.lastDaily = now;
      this.saveProgress();
      this.updateCoinsDisplay();
      alert('১৫০ দৈনিক কয়েন সংগ্রহ করা হয়েছে!');
    } else {
      const waitHours = Math.ceil((oneDay - (now - this.progression.lastDaily)) / (1000 * 60 * 60));
      alert(`আজকের পুরস্কার নেওয়া হয়ে গেছে! আবার ${waitHours} ঘণ্টা পর আসুন।`);
    }
  }

  updateCoinsDisplay() {
    document.getElementById('coins-display').textContent = `🪙 ${this.progression.coins}`;
  }

  // --- লেভেল লোড এবং ট্রানজিশন ---
  startLevel(index) {
    this.currentLevelIndex = index;
    const levelData = GAME_LEVELS[index];
    this.physics.clearWorld();

    this.score = 0;
    this.activeHeroLaunched = false;
    this.currentHeroBody = null;
    this.settleTimer = 0;
    this.entities = { monsters: [], blocks: [], moving: [], blades: [] };

    document.getElementById('level-display').textContent = `লেভেল ${levelData.id}`;
    document.getElementById('score-display').textContent = `স্কোর: ০`;
    this.updateCoinsDisplay();
    this.updateStarsUI(3);

    this.heroQueue = levelData.heroes.map(heroType => {
      return this.progression.unlockedHeroes.includes(heroType) ? heroType : 'power';
    });

    levelData.monsters.forEach(m => {
      const body = this.physics.createMonster(m.type, m.x, m.y);
      this.entities.monsters.push(body);
    });

    levelData.blocks.forEach(b => {
      const body = this.physics.createBlock(b.type, b.x, b.y, b.w, b.h);
      this.entities.blocks.push(body);
    });

    levelData.moving.forEach(p => {
      const body = this.physics.createMovingPlatform(p.x, p.y, p.w, p.h, p.rx, p.ry, p.spd);
      this.entities.moving.push(body);
    });

    levelData.blades.forEach(b => {
      const body = this.physics.createRotatingBlade(b.x, b.y, b.len, b.w, b.spd);
      this.entities.blades.push(body);
    });

    this.switchScreen(null);
    document.getElementById('hud').classList.remove('hidden');
    this.gameState = 'PLAYING';

    this.loadNextHero();
    this.renderHeroDock();
  }

  loadNextHero() {
    if (this.heroQueue.length === 0) return;
    const heroType = this.heroQueue.shift();
    this.currentHeroBody = this.physics.createHero(heroType, this.slingshotPos.x, this.slingshotPos.y);
    Body.setStatic(this.currentHeroBody, true);
    this.activeHeroLaunched = false;
    this.renderHeroDock();
  }

  renderHeroDock() {
    const dock = document.getElementById('hero-dock');
    dock.innerHTML = '';
    this.heroQueue.forEach(heroType => {
      const slot = document.createElement('div');
      slot.className = 'hero-queue-slot';
      slot.style.backgroundColor = this.getHeroColor(heroType);
      dock.appendChild(slot);
    });
  }

  getHeroColor(type) {
    switch (type) {
      case 'power': return '#ff4757';
      case 'speed': return '#ffd32a';
      case 'bomb': return '#2f3542';
      case 'ice': return '#70a1ff';
      default: return '#ffffff';
    }
  }

  updateStarsUI(count) {
    const icons = document.querySelectorAll('#stars-live .star-icon');
    icons.forEach((ic, idx) => {
      ic.className = `star-icon ${idx < count ? 'active' : ''}`;
    });
  }

  // --- টাচ ও মাউস কন্ট্রোল ---
  setupInputEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const handleDown = (pos) => {
      if (this.gameState !== 'PLAYING') return;

      if (this.activeHeroLaunched && this.currentHeroBody) {
        this.activateHeroSpecial();
        return;
      }

      if (this.currentHeroBody && !this.activeHeroLaunched) {
        const dist = Vector.magnitude(Vector.sub(pos, this.slingshotPos));
        if (dist < 70) {
          this.isDragging = true;
          this.dragPos = pos;
        }
      }
    };

    const handleMove = (pos) => {
      if (!this.isDragging) return;
      const dragVec = Vector.sub(pos, this.slingshotPos);
      const dist = Vector.magnitude(dragVec);

      if (dist > this.maxSlingDrag) {
        const clamped = Vector.mult(Vector.normalise(dragVec), this.maxSlingDrag);
        this.dragPos = Vector.add(this.slingshotPos, clamped);
      } else {
        this.dragPos = pos;
      }

      Body.setPosition(this.currentHeroBody, this.dragPos);
    };

    const handleUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;

      const pullVec = Vector.sub(this.slingshotPos, this.dragPos);
      const pullDist = Vector.magnitude(pullVec);

      if (pullDist > 12) {
        Body.setStatic(this.currentHeroBody, false);
        const impulse = Vector.mult(pullVec, 0.32);
        Body.setVelocity(this.currentHeroBody, impulse);
        this.activeHeroLaunched = true;
        this.currentHeroBody.custom.launched = true;
        this.audio.playLaunch();
      } else {
        Body.setPosition(this.currentHeroBody, this.slingshotPos);
      }
    };

    this.canvas.addEventListener('mousedown', (e) => handleDown(getPos(e)));
    window.addEventListener('mousemove', (e) => handleMove(getPos(e)));
    window.addEventListener('mouseup', () => handleUp());

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleDown(getPos(e));
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      handleMove(getPos(e));
    }, { passive: true });

    window.addEventListener('touchend', () => handleUp());
  }

  activateHeroSpecial() {
    const hero = this.currentHeroBody;
    if (!hero || hero.custom.activated) return;

    hero.custom.activated = true;
    const type = hero.custom.heroType;

    if (type === 'speed') {
      const currentVel = hero.velocity;
      Body.setVelocity(hero, Vector.mult(Vector.normalise(currentVel), 34));
      this.particles.emit(hero.position.x, hero.position.y, '#ffd32a', 20, 6);
      this.audio.playSpecial();
    } else if (type === 'bomb') {
      this.triggerExplosion(hero.position.x, hero.position.y, 180, 500);
      World.remove(this.physics.world, hero);
      this.currentHeroBody = null;
    } else if (type === 'ice') {
      this.triggerIceBlast(hero.position.x, hero.position.y, 220);
    }
  }

  // --- গেমপ্লে আপডেট লজিক ---
  updateGameplay(dt) {
    this.entities.moving.forEach(p => {
      p.custom.timer += p.custom.speed;
      const newX = p.custom.originX + Math.sin(p.custom.timer) * p.custom.rangeX;
      const newY = p.custom.originY + Math.cos(p.custom.timer) * p.custom.rangeY;
      Body.setPosition(p, { x: newX, y: newY });
    });

    this.entities.blades.forEach(b => {
      Body.setAngle(b, b.angle + b.custom.rotSpeed);
    });

    this.entities.monsters.forEach(m => {
      if (m.custom.monsterType === 'flying') {
        m.custom.hoverOffset += 0.05;
        Body.applyForce(m, m.position, { x: 0, y: -0.0024 + Math.sin(m.custom.hoverOffset) * 0.0006 });
      }
    });

    if (this.activeHeroLaunched && this.currentHeroBody) {
      const vel = Vector.magnitude(this.currentHeroBody.velocity);
      const outOfBounds = this.currentHeroBody.position.x > 1300 || this.currentHeroBody.position.y > 750;

      if (vel < 0.25 || outOfBounds) {
        this.settleTimer += dt;
        if (this.settleTimer > 1200) {
          World.remove(this.physics.world, this.currentHeroBody);
          this.currentHeroBody = null;
          this.settleTimer = 0;

          if (this.entities.monsters.length > 0 && this.heroQueue.length > 0) {
            this.loadNextHero();
          }
        }
      } else {
        this.settleTimer = 0;
      }
    }

    if (this.entities.monsters.length === 0) {
      this.triggerVictory();
    } else if (this.heroQueue.length === 0 && !this.currentHeroBody && this.settleTimer === 0) {
      this.triggerDefeat();
    }
  }

  triggerVictory() {
    this.gameState = 'VICTORY';
    this.audio.playVictory();

    const heroesLeft = this.heroQueue.length;
    let starsEarned = 1;
    if (heroesLeft >= 1) starsEarned = 2;
    if (heroesLeft >= 2) starsEarned = 3;

    const coinsEarned = 50 * starsEarned;
    this.progression.coins += coinsEarned;
    this.progression.stars[this.currentLevelIndex + 1] = Math.max(
      this.progression.stars[this.currentLevelIndex + 1] || 0,
      starsEarned
    );
    this.progression.scores[this.currentLevelIndex + 1] = Math.max(
      this.progression.scores[this.currentLevelIndex + 1] || 0,
      this.score
    );

    if (this.currentLevelIndex + 1 >= this.progression.unlockedLevels && this.progression.unlockedLevels < GAME_LEVELS.length) {
      this.progression.unlockedLevels = this.currentLevelIndex + 2;
    }

    this.saveProgress();

    document.getElementById('win-stars').textContent = '★'.repeat(starsEarned) + '☆'.repeat(3 - starsEarned);
    document.getElementById('win-score').textContent = `স্কোর: ${this.score}`;
    document.getElementById('win-coins').textContent = `+${coinsEarned} কয়েন`;

    this.switchScreen('win-screen');
  }

  triggerDefeat() {
    this.gameState = 'DEFEAT';
    this.audio.playDefeat();
    this.switchScreen('lose-screen');
  }

  // --- রেন্ডারিং লুপ ---
  loop(timestamp) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.gameState === 'PLAYING') {
      this.physics.update();
      this.updateGameplay(16.6);
    }

    this.drawBackground();
    this.drawSlingshotBack();
    this.drawTrajectory();
    this.drawEntities();
    this.drawSlingshotFront();
    this.particles.updateAndDraw(this.ctx);

    requestAnimationFrame((t) => this.loop(t));
  }

  drawBackground() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#1e3c72');
    grad.addColorStop(0.7, '#2a5298');
    grad.addColorStop(1, '#1b2a47');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#182c4d';
    this.ctx.beginPath();
    this.ctx.arc(300, 750, 450, 0, Math.PI * 2);
    this.ctx.arc(950, 780, 520, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#22381f';
    this.ctx.fillRect(0, this.canvas.height - 60, this.canvas.width, 60);
    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(0, this.canvas.height - 60, this.canvas.width, 8);
  }

  drawSlingshotBack() {
    this.ctx.save();
    this.ctx.strokeStyle = '#5c3a21';
    this.ctx.lineWidth = 14;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(this.slingshotPos.x, this.canvas.height - 60);
    this.ctx.lineTo(this.slingshotPos.x, this.slingshotPos.y + 20);
    this.ctx.lineTo(this.slingshotPos.x - 22, this.slingshotPos.y - 30);
    this.ctx.stroke();

    if (this.isDragging) {
      this.ctx.strokeStyle = '#2d1d11';
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(this.slingshotPos.x - 20, this.slingshotPos.y - 25);
      this.ctx.lineTo(this.dragPos.x, this.dragPos.y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawSlingshotFront() {
    this.ctx.save();
    this.ctx.strokeStyle = '#795548';
    this.ctx.lineWidth = 14;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(this.slingshotPos.x, this.slingshotPos.y + 20);
    this.ctx.lineTo(this.slingshotPos.x + 22, this.slingshotPos.y - 30);
    this.ctx.stroke();

    if (this.isDragging) {
      this.ctx.strokeStyle = '#2d1d11';
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(this.dragPos.x, this.dragPos.y);
      this.ctx.lineTo(this.slingshotPos.x + 20, this.slingshotPos.y - 25);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawTrajectory() {
    if (!this.isDragging) return;

    const pullVec = Vector.sub(this.slingshotPos, this.dragPos);
    let simPos = { x: this.dragPos.x, y: this.dragPos.y };
    let simVel = Vector.mult(pullVec, 0.32);
    const gravity = 1.0;

    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';

    for (let i = 0; i < 30; i++) {
      simPos.x += simVel.x;
      simPos.y += simVel.y;
      simVel.y += gravity;

      if (i % 2 === 0) {
        this.ctx.beginPath();
        this.ctx.arc(simPos.x, simPos.y, 4 - (i * 0.08), 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.restore();
  }

  drawEntities() {
    const bodies = Composite.allBodies(this.physics.world);

    bodies.forEach(body => {
      if (body.label === 'ground' || body.label === 'boundary') return;

      this.ctx.save();
      this.ctx.translate(body.position.x, body.position.y);
      this.ctx.rotate(body.angle);

      if (body.label === 'hero') {
        this.drawHero(body);
      } else if (body.label === 'monster') {
        this.drawMonster(body);
      } else if (body.label === 'block' || body.label === 'tnt') {
        this.drawBlock(body);
      } else if (body.label === 'platform') {
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(-body.custom.w / 2, -body.custom.h / 2, body.custom.w, body.custom.h);
      } else if (body.label === 'blade') {
        this.ctx.fillStyle = '#95a5a6';
        this.ctx.fillRect(-body.custom.length / 2, -body.custom.width / 2, body.custom.length, body.custom.width);
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }

  drawHero(body) {
    const r = body.custom.radius;
    const type = body.custom.heroType;

    this.ctx.fillStyle = this.getHeroColor(type);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#222';
    this.ctx.stroke();

    // চোখ
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(6, -4, 6, 0, Math.PI * 2);
    this.ctx.arc(-4, -4, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(8, -4, 3, 0, Math.PI * 2);
    this.ctx.arc(-2, -4, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // মুখ / ঠোঁট
    this.ctx.fillStyle = '#f39c12';
    this.ctx.beginPath();
    this.ctx.moveTo(0, 2);
    this.ctx.lineTo(8, 6);
    this.ctx.lineTo(0, 10);
    this.ctx.fill();
  }

  drawMonster(body) {
    const r = body.custom.radius;
    const type = body.custom.monsterType;

    let baseColor = '#27ae60';
    if (type === 'armored') baseColor = '#2980b9';
    if (type === 'flying') baseColor = '#8e44ad';
    if (type === 'shield') baseColor = '#d35400';
    if (type === 'boss') baseColor = '#c0392b';

    this.ctx.fillStyle = baseColor;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#1b2a47';
    this.ctx.stroke();

    // চোখ
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.beginPath();
    this.ctx.arc(0, -2, r * 0.45, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(2, -2, r * 0.2, 0, Math.PI * 2);
    this.ctx.fill();

    // শিং
    if (type === 'boss' || type === 'shield') {
      this.ctx.fillStyle = '#bdc3c7';
      this.ctx.beginPath();
      this.ctx.moveTo(-16, -r + 2);
      this.ctx.lineTo(-24, -r - 18);
      this.ctx.lineTo(-8, -r + 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(16, -r + 2);
      this.ctx.lineTo(24, -r - 18);
      this.ctx.lineTo(8, -r + 2);
      this.ctx.fill();
    }
  }

  drawBlock(body) {
    const w = body.custom.w;
    const h = body.custom.h;
    const type = body.custom.blockType;

    if (type === 'wood') {
      this.ctx.fillStyle = '#d35400';
      this.ctx.strokeStyle = '#a04000';
    } else if (type === 'stone') {
      this.ctx.fillStyle = '#95a5a6';
      this.ctx.strokeStyle = '#7f8c8d';
    } else if (type === 'metal') {
      this.ctx.fillStyle = '#7f8c8d';
      this.ctx.strokeStyle = '#34495e';
    } else if (type === 'tnt') {
      this.ctx.fillStyle = '#c0392b';
      this.ctx.strokeStyle = '#962d22';
    } else if (type === 'glass') {
      this.ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
      this.ctx.strokeStyle = '#2980b9';
    }

    this.ctx.lineWidth = 2;
    this.ctx.fillRect(-w / 2, -h / 2, w, h);
    this.ctx.strokeRect(-w / 2, -h / 2, w, h);

    if (type === 'tnt') {
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('TNT', 0, 0);
    }
  }
}

// স্ক্রিন লোড হলে গেম চালু হবে
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
