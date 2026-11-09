// Castle Guardian - Fully Fixed Canvas Physics Engine
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const currentLevelEl = document.getElementById('current-level');
const scoreValEl = document.getElementById('score-val');
const ammoValEl = document.getElementById('ammo-val');
const enemiesValEl = document.getElementById('enemies-val');

const modal = document.getElementById('overlay-modal');
const modalTitle = document.getElementById('modal-title');
const modalMsg = document.getElementById('modal-msg');
const modalBtnNext = document.getElementById('modal-btn-next');
const modalBtnRestart = document.getElementById('modal-btn-restart');

const levelPickerModal = document.getElementById('level-picker-modal');
const levelsGrid = document.getElementById('levels-grid');
const btnRestartCurrent = document.getElementById('btn-restart-current');
const btnSelectLevel = document.getElementById('btn-select-level');
const btnClosePicker = document.getElementById('btn-close-picker');

// Global Constants & Physics
const GRAVITY = 0.38;
const GROUND_Y = 460;
const LAUNCHER_X = 140;
const LAUNCHER_Y = 370;
const MAX_STRETCH = 85;
const LAUNCH_POWER = 0.22;

let currentLevelIdx = 0;
let score = 0;
let remainingAmmo = 5;
let gameState = "PLAYING"; // PLAYING, RESOLVING, WON, LOST

// Projectile Ball
let ball = {
  x: LAUNCHER_X,
  y: LAUNCHER_Y,
  vx: 0,
  vy: 0,
  radius: 14,
  isDragging: false,
  isFlying: false,
  trail: []
};

// Particles & Effects
let particles = [];
let blocks = [];
let enemies = [];

// Initialize Level Picker Buttons
function setupLevelPicker() {
  levelsGrid.innerHTML = '';
  window.GAME_LEVELS.forEach((lvl, idx) => {
    const box = document.createElement('div');
    box.className = `level-box ${idx === currentLevelIdx ? 'current' : ''}`;
    box.innerText = `লেভেল ${lvl.level}`;
    box.onclick = () => {
      loadLevel(idx);
      levelPickerModal.classList.add('hidden');
    };
    levelsGrid.appendChild(box);
  });
}

function loadLevel(index) {
  if (index >= window.GAME_LEVELS.length) index = 0;
  currentLevelIdx = index;
  const lvlData = window.GAME_LEVELS[currentLevelIdx];
  
  remainingAmmo = lvlData.ammo;
  gameState = "PLAYING";
  particles = [];
  
  // Clone blocks with physics attributes
  blocks = lvlData.blocks.map(b => ({
    ...b,
    currentHp: b.hp,
    vx: 0,
    vy: 0,
    broken: false
  }));

  // Clone enemies
  enemies = lvlData.enemies.map(e => ({
    ...e,
    currentHp: e.hp,
    alive: true,
    vx: 0,
    vy: 0
  }));

  resetBall();
  updateUI();
  modal.classList.add('hidden');
}

function resetBall() {
  ball.x = LAUNCHER_X;
  ball.y = LAUNCHER_Y;
  ball.vx = 0;
  ball.vy = 0;
  ball.isDragging = false;
  ball.isFlying = false;
  ball.trail = [];
}

function updateUI() {
  currentLevelEl.innerText = (currentLevelIdx + 1);
  scoreValEl.innerText = score;
  ammoValEl.innerText = remainingAmmo;
  const aliveEnemies = enemies.filter(e => e.alive).length;
  enemiesValEl.innerText = aliveEnemies;
}

// Coordinate extraction helper for Canvas
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (cx - rect.left) * (canvas.width / rect.width),
    y: (cy - rect.top) * (canvas.height / rect.height)
  };
}

// Mouse & Touch Interaction
function onPointerDown(e) {
  if (ball.isFlying || gameState !== "PLAYING") return;
  const pos = getPos(e);
  const dist = Math.hypot(pos.x - ball.x, pos.y - ball.y);
  if (dist <= 40) {
    ball.isDragging = true;
  }
}

function onPointerMove(e) {
  if (!ball.isDragging) return;
  const pos = getPos(e);
  const dx = pos.x - LAUNCHER_X;
  const dy = pos.y - LAUNCHER_Y;
  const angle = Math.atan2(dy, dx);
  const dist = Math.min(Math.hypot(dx, dy), MAX_STRETCH);

  ball.x = LAUNCHER_X + Math.cos(angle) * dist;
  ball.y = LAUNCHER_Y + Math.sin(angle) * dist;
}

function onPointerUp() {
  if (!ball.isDragging) return;
  ball.isDragging = false;
  
  // Calculate launch velocity
  const dx = LAUNCHER_X - ball.x;
  const dy = LAUNCHER_Y - ball.y;
  
  if (Math.hypot(dx, dy) > 8) {
    ball.isFlying = true;
    ball.vx = dx * LAUNCH_POWER;
    ball.vy = dy * LAUNCH_POWER;
    remainingAmmo--;
    updateUI();
  } else {
    resetBall();
  }
}

// Event Listeners
canvas.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onPointerDown(e); }, { passive: false });
window.addEventListener('touchmove', (e) => { onPointerMove(e); }, { passive: false });
window.addEventListener('touchend', onPointerUp);

// Spawn Explosion & Debris Particles
function triggerExplosion(x, y, power, color = '#f39c12') {
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * power + 2;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      radius: Math.random() * 4 + 2,
      alpha: 1,
      color: color
    });
  }

  // Radius Damage to surrounding blocks and enemies
  blocks.forEach(b => {
    if (b.broken) return;
    const midX = b.x + b.w / 2;
    const midY = b.y + b.h / 2;
    const d = Math.hypot(midX - x, midY - y);
    if (d < 110) {
      b.currentHp -= (110 - d) * 0.8;
      b.vx += (midX - x) * 0.08;
      b.vy += (midY - y) * 0.08;
      if (b.currentHp <= 0) b.broken = true;
    }
  });

  enemies.forEach(e => {
    if (!e.alive) return;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < 120) {
      e.currentHp -= (120 - d) * 0.9;
      e.vx += (e.x - x) * 0.09;
      e.vy += (e.y - y) * 0.09;
      if (e.currentHp <= 0) {
        e.alive = false;
        score += 200;
      }
    }
  });
}

// Physics Loop Update
function updatePhysics() {
  // Update Flying Ball
  if (ball.isFlying) {
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vy += GRAVITY;

    // Ball trail
    if (Math.random() < 0.6) {
      ball.trail.push({ x: ball.x, y: ball.y, alpha: 0.6 });
    }
    if (ball.trail.length > 25) ball.trail.shift();

    // Check collision with ground
    if (ball.y + ball.radius >= GROUND_Y) {
      ball.y = GROUND_Y - ball.radius;
      ball.vy = -ball.vy * 0.45;
      ball.vx *= 0.75;
      if (Math.hypot(ball.vx, ball.vy) < 1.5) {
        endBallShot();
      }
    }

    // Check boundary
    if (ball.x > canvas.width + 50 || ball.x < -50) {
      endBallShot();
    }

    // Ball vs Blocks Collision
    blocks.forEach(b => {
      if (b.broken) return;
      if (
        ball.x + ball.radius > b.x &&
        ball.x - ball.radius < b.x + b.w &&
        ball.y + ball.radius > b.y &&
        ball.y - ball.radius < b.y + b.h
      ) {
        // Impact!
        const impact = Math.hypot(ball.vx, ball.vy);
        b.currentHp -= impact * 7;
        ball.vx *= -0.4;
        ball.vy *= -0.4;

        if (b.type === "tnt" && b.currentHp <= 20) {
          b.broken = true;
          triggerExplosion(b.x + b.w/2, b.y + b.h/2, 8, '#e74c3c');
        } else if (b.currentHp <= 0) {
          b.broken = true;
          score += 50;
          triggerExplosion(b.x + b.w/2, b.y + b.h/2, 3, b.type === "wood" ? '#c0392b' : '#7f8c8d');
        }
      }
    });

    // Ball vs Enemies Collision
    enemies.forEach(e => {
      if (!e.alive) return;
      const d = Math.hypot(ball.x - e.x, ball.y - e.y);
      if (d < ball.radius + e.r) {
        const impact = Math.hypot(ball.vx, ball.vy);
        e.currentHp -= impact * 9;
        ball.vx *= 0.5;
        ball.vy *= 0.5;

        triggerExplosion(e.x, e.y, 4, '#2ecc71');
        if (e.currentHp <= 0) {
          e.alive = false;
          score += e.isBoss ? 500 : 150;
        }
      }
    });
  }

  // Fade Ball Trail
  ball.trail.forEach(t => t.alpha -= 0.015);
  ball.trail = ball.trail.filter(t => t.alpha > 0);

  // Update Dynamic Blocks
  blocks.forEach(b => {
    if (b.broken) return;
    if (Math.abs(b.vx) > 0.05 || Math.abs(b.vy) > 0.05) {
      b.x += b.vx;
      b.y += b.vy;
      b.vy += GRAVITY * 0.4;
      b.vx *= 0.94;
      if (b.y + b.h > GROUND_Y) {
        b.y = GROUND_Y - b.h;
        b.vy = 0;
      }
    }
  });

  // Update Dynamic Enemies
  enemies.forEach(e => {
    if (!e.alive) return;
    if (Math.abs(e.vx) > 0.05 || Math.abs(e.vy) > 0.05) {
      e.x += e.vx;
      e.y += e.vy;
      e.vy += GRAVITY * 0.4;
      e.vx *= 0.92;
      if (e.y + e.r > GROUND_Y) {
        e.y = GROUND_Y - e.r;
        e.vy = 0;
      }
    }
  });

  // Update particles
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.alpha -= 0.025;
  });
  particles = particles.filter(p => p.alpha > 0);

  // Check Game State Progression
  checkGameState();
}

let shotEndTimer = null;
function endBallShot() {
  if (shotEndTimer) return;
  shotEndTimer = setTimeout(() => {
    resetBall();
    shotEndTimer = null;
    checkGameState(true);
  }, 750);
}

function checkGameState(forceCheck = false) {
  const aliveCount = enemies.filter(e => e.alive).length;
  updateUI();

  if (aliveCount === 0 && gameState === "PLAYING") {
    gameState = "WON";
    setTimeout(() => {
      modalTitle.innerText = "🎉 বিজয় অর্জিত হয়েছে!";
      modalMsg.innerText = `অভিনন্দন! সব শত্রু নির্মূল করা হয়েছে! মোট স্কোর: ${score}`;
      modalBtnNext.style.display = "inline-block";
      modal.classList.remove('hidden');
    }, 500);
  } else if (remainingAmmo <= 0 && !ball.isFlying && aliveCount > 0 && gameState === "PLAYING") {
    gameState = "LOST";
    setTimeout(() => {
      modalTitle.innerText = "❌ মিশন ব্যর্থ!";
      modalMsg.innerText = "আপনার সমস্ত গোলাবারুদ শেষ হয়ে গেছে কিন্তু দুর্গ অক্ষত রয়ে গেছে।";
      modalBtnNext.style.display = "none";
      modal.classList.remove('hidden');
    }, 600);
  }
}

// Rendering Engine
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Sky & Gradient Background
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, '#1a365d');
  skyGrad.addColorStop(0.65, '#2b6cb0');
  skyGrad.addColorStop(1, '#bee3f8');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, GROUND_Y);

  // Background Hills
  ctx.fillStyle = '#2c7a7b';
  ctx.beginPath();
  ctx.arc(300, 480, 260, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#285e61';
  ctx.beginPath();
  ctx.arc(750, 490, 310, Math.PI, 0);
  ctx.fill();

  // 2. Ground Terrain
  ctx.fillStyle = '#2f855a';
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
  ctx.fillStyle = '#276749';
  ctx.fillRect(0, GROUND_Y + 12, canvas.width, canvas.height - (GROUND_Y + 12));

  // 3. Castle Catapult Base
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(80, 340, 70, 120);
  ctx.fillStyle = '#2d3748';
  ctx.fillRect(70, 330, 90, 16);
  // Slingshot Fork
  ctx.strokeStyle = '#744210';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(130, 410);
  ctx.lineTo(LAUNCHER_X, LAUNCHER_Y + 10);
  ctx.lineTo(LAUNCHER_X - 16, LAUNCHER_Y - 20);
  ctx.moveTo(LAUNCHER_X, LAUNCHER_Y + 10);
  ctx.lineTo(LAUNCHER_X + 16, LAUNCHER_Y - 20);
  ctx.stroke();

  // 4. Trajectory Preview Arc (During aiming)
  if (ball.isDragging) {
    ctx.beginPath();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 3;

    let simX = ball.x;
    let simY = ball.y;
    let simVx = (LAUNCHER_X - ball.x) * LAUNCH_POWER;
    let simVy = (LAUNCHER_Y - ball.y) * LAUNCH_POWER;

    ctx.moveTo(simX, simY);
    for (let i = 0; i < 35; i++) {
      simX += simVx;
      simY += simVy;
      simVy += GRAVITY;
      ctx.lineTo(simX, simY);
      if (simY > GROUND_Y) break;
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 5. Slingshot Elastic Band
  if (ball.isDragging) {
    ctx.strokeStyle = '#b7791f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(LAUNCHER_X - 14, LAUNCHER_Y - 15);
    ctx.lineTo(ball.x, ball.y);
    ctx.lineTo(LAUNCHER_X + 14, LAUNCHER_Y - 15);
    ctx.stroke();
  }

  // 6. Projectile Flight Trail
  ball.trail.forEach(t => {
    ctx.fillStyle = `rgba(237, 137, 54, ${t.alpha})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // 7. Projectile Ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#2d3748';
  ctx.fill();
  ctx.strokeStyle = '#1a202c';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Ball shine highlight
  ctx.beginPath();
  ctx.arc(ball.x - 4, ball.y - 4, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#718096';
  ctx.fill();

  // 8. Draw Destructible Structure Blocks
  blocks.forEach(b => {
    if (b.broken) return;
    ctx.save();
    if (b.type === 'wood') {
      ctx.fillStyle = '#d69e2e';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#744210';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    } else if (b.type === 'stone') {
      ctx.fillStyle = '#a0aec0';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    } else if (b.type === 'tnt') {
      ctx.fillStyle = '#e53e3e';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#742a2a';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('TNT', b.x + 4, b.y + b.h/2 + 4);
    }
    ctx.restore();
  });

  // 9. Draw Enemies (Cartoon Orcs / Goblins)
  enemies.forEach(e => {
    if (!e.alive) return;
    ctx.save();
    // Body
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fillStyle = e.isBoss ? '#c53030' : '#38a169';
    ctx.fill();
    ctx.strokeStyle = '#22543d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(e.x - e.r*0.35, e.y - e.r*0.2, e.r*0.25, 0, Math.PI * 2);
    ctx.arc(e.x + e.r*0.35, e.y - e.r*0.2, e.r*0.25, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(e.x - e.r*0.3, e.y - e.r*0.2, e.r*0.12, 0, Math.PI * 2);
    ctx.arc(e.x + e.r*0.4, e.y - e.r*0.2, e.r*0.12, 0, Math.PI * 2);
    ctx.fill();

    // Angry Eyebrows
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.x - e.r*0.6, e.y - e.r*0.45);
    ctx.lineTo(e.x - e.r*0.15, e.y - e.r*0.25);
    ctx.moveTo(e.x + e.r*0.6, e.y - e.r*0.45);
    ctx.lineTo(e.x + e.r*0.15, e.y - e.r*0.25);
    ctx.stroke();

    // Snout / Teeth
    ctx.fillStyle = '#fff';
    ctx.fillRect(e.x - 4, e.y + e.r*0.3, 3, 4);
    ctx.fillRect(e.x + 2, e.y + e.r*0.3, 3, 4);

    ctx.restore();
  });

  // 10. Particles
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// Game Loop
function gameLoop() {
  updatePhysics();
  draw();
  requestAnimationFrame(gameLoop);
}

// Button Listeners
modalBtnNext.onclick = () => {
  loadLevel(currentLevelIdx + 1);
};

modalBtnRestart.onclick = () => {
  loadLevel(currentLevelIdx);
};

btnRestartCurrent.onclick = () => {
  loadLevel(currentLevelIdx);
};

btnSelectLevel.onclick = () => {
  setupLevelPicker();
  levelPickerModal.classList.remove('hidden');
};

btnClosePicker.onclick = () => {
  levelPickerModal.classList.add('hidden');
};

// Start Game
setupLevelPicker();
loadLevel(0);
gameLoop();
