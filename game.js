const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas er mul resolution
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;
canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;

// Mobile o sob device er screen onujayi canvas size fix kora
function resizeCanvas() {
  const windowWidth = document.documentElement.clientWidth || window.innerWidth;
  const windowHeight = document.documentElement.clientHeight || window.innerHeight;
  
  const availableWidth = Math.max(windowWidth - 16, 200);
  const availableHeight = Math.max(windowHeight - 16, 150);
  const aspectRatio = BASE_WIDTH / BASE_HEIGHT;

  let newWidth = availableWidth;
  let newHeight = availableWidth / aspectRatio;

  if (newHeight > availableHeight) {
    newHeight = availableHeight;
    newWidth = availableHeight * aspectRatio;
  }

  canvas.style.width = `${Math.floor(newWidth)}px`;
  canvas.style.height = `${Math.floor(newHeight)}px`;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
resizeCanvas();

// Assets storage
const assets = {
  background: null,
  goblinFrames: [] // Pre-rendered offscreen canvases for flicker-free drawing
};

// Image load o decode korar helper function
function loadSingleImage(paths) {
  return new Promise((resolve) => {
    const img = new Image();
    let index = 0;

    function tryNext() {
      if (index >= paths.length) {
        resolve(null);
        return;
      }
      img.src = paths[index++];
    }

    img.onload = async () => {
      try {
        if (img.decode) {
          await img.decode();
        }
      } catch (e) {
        // Ignore decode warning if already ready
      }
      resolve(img);
    };

    img.onerror = tryNext;
    tryNext();
  });
}

// Chobite kono sada pixel thakle ta porishkar kore offscreen canvas-e cache kora
function createCleanFrameCanvas(img) {
  if (!img || img.naturalWidth === 0) return null;

  const offCanvas = document.createElement('canvas');
  offCanvas.width = img.naturalWidth;
  offCanvas.height = img.naturalHeight;
  const offCtx = offCanvas.getContext('2d');

  offCtx.drawImage(img, 0, 0);

  try {
    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;

    // Pure white ba kachakachi sada background pixel thakle transparent kora
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a > 0 && r > 245 && g > 245 && b > 245) {
        data[i + 3] = 0;
      }
    }
    offCtx.putImageData(imgData, 0, 0);
  } catch (e) {
    // Local file (file://) CORS restriction thakle direct image use korbe
    return img;
  }

  return offCanvas;
}

// Sob chobi load howar por game shuru kora
async function initAssetsAndStart() {
  // Loading screen dekhano
  ctx.fillStyle = '#1e272e';
  ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Loading Game Assets...', BASE_WIDTH / 2, BASE_HEIGHT / 2);

  // 1. Background load
  assets.background = await loadSingleImage(['background.jpg', 'assets/background.jpg']);

  // 2. 8ti Goblin frame load
  const goblinFileNames = [
    'goblin_walk_1.png',
    'goblin_walk_2.png',
    'goblin_walk_3.png',
    'goblin_walk_4.png',
    'goblin_walk_5.png',
    'goblin_walk_6.png',
    'goblin_walk_7.png',
    'goblin_walk_8.png'
  ];

  const loadedImages = await Promise.all(
    goblinFileNames.map((name) => loadSingleImage([name, `assets/${name}`]))
  );

  // Protiti frame clean kore memory-te store kora
  assets.goblinFrames = loadedImages
    .map((img) => createCleanFrameCanvas(img))
    .filter((frame) => frame !== null);

  // Sob asset ready hole game loop chalu kora
  requestAnimationFrame(gameLoop);
}

// Castle er health o obosthan
const castle = {
  health: 1000,
  maxHealth: 1000,
  lastHitTime: 0,
  hitBarDisplayDuration: 3000,
  shakeTime: 0
};

// background.jpg er castle er kather dorjar thik samner X position
const castleDoorX = 242;

// Dorjay aghater somoy spark o slash effect
let hitSparks = [];
let slashEffects = [];

function spawnAttackEffect(x, y) {
  for (let i = 0; i < 12; i++) {
    hitSparks.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.15) * 6.5,
      vy: (Math.random() - 0.85) * 6.5,
      life: 1.0,
      color: i % 2 === 0 ? '#ffd700' : '#ff6b00'
    });
  }
  slashEffects.push({
    x: x - 5,
    y: y,
    life: 1.0
  });
}

// Goblin object
const goblin = {
  width: 72,
  height: 98,
  x: 1210,
  y: 380,
  speed: 2.1,
  damage: 25,
  
  // Smooth walking animation control
  currentFrame: 0,
  frameInterval: 85,
  lastFrameTime: 0,
  walkBobY: 0,
  
  // Attack animation control
  attackInterval: 900,
  lastAttackTime: 0,
  isAttacking: false,
  attackOffsetX: 0,
  attackOffsetY: 0,
  attackAngle: 0,

  update(currentTime) {
    // background.jpg er rasta o bridge er height onujayi payer obosthan
    let roadGroundY = 476;
    if (this.x > 465 && this.x < 965) {
      const bridgeProgress = (this.x - 465) / (965 - 465);
      const archCurve = Math.sin(bridgeProgress * Math.PI) * 14;
      roadGroundY = 476 - archCurve;
    }

    // Castle er dorja porjonto hete jawa
    if (this.x > castleDoorX) {
      this.x -= this.speed;
      this.isAttacking = false;
      this.attackOffsetX = 0;
      this.attackOffsetY = 0;
      this.attackAngle = 0;

      // 8ti sprite frame porjaykrome change hoye smooth hata
      if (assets.goblinFrames.length > 0 && currentTime - this.lastFrameTime > this.frameInterval) {
        this.currentFrame = (this.currentFrame + 1) % assets.goblinFrames.length;
        this.lastFrameTime = currentTime;
      }

      // Hatar chhonde halka upore-niche natural bounce
      this.walkBobY = Math.abs(Math.sin((this.currentFrame / 8) * Math.PI * 2)) * -2.5;
    } else {
      // Dorjar samne pouchhe attack shuru korbe
      this.x = castleDoorX;
      this.isAttacking = true;
      this.walkBobY = 0;

      const timeSinceAttack = currentTime - this.lastAttackTime;
      const attackProgress = Math.min(timeSinceAttack / this.attackInterval, 1);

      if (attackProgress < 0.25) {
        // Step 1: Wind-up
        const p = attackProgress / 0.25;
        this.currentFrame = Math.min(4, assets.goblinFrames.length - 1);
        this.attackOffsetX = p * 12;
        this.attackOffsetY = -p * 6;
        this.attackAngle = p * 0.22;
      } else if (attackProgress < 0.45) {
        // Step 2: Strike
        const p = (attackProgress - 0.25) / 0.20;
        this.currentFrame = Math.min(5, assets.goblinFrames.length - 1);
        this.attackOffsetX = 12 - (p * 38);
        this.attackOffsetY = -6 + (p * 8);
        this.attackAngle = 0.22 - (p * 0.55);
      } else if (attackProgress < 0.65) {
        // Step 3: Recover
        const p = (attackProgress - 0.45) / 0.20;
        this.currentFrame = Math.min(6, assets.goblinFrames.length - 1);
        this.attackOffsetX = -26 * (1 - p);
        this.attackOffsetY = 2 * (1 - p);
        this.attackAngle = -0.33 * (1 - p);
      } else {
        // Idle stance
        this.currentFrame = Math.min(1, assets.goblinFrames.length - 1);
        this.attackOffsetX = 0;
        this.attackOffsetY = 0;
        this.attackAngle = 0;
      }

      // Castle-e damage o spark effect
      if (timeSinceAttack >= this.attackInterval) {
        if (castle.health > 0) {
          castle.health = Math.max(0, castle.health - this.damage);
          castle.lastHitTime = currentTime;
          castle.shakeTime = currentTime;
          this.lastAttackTime = currentTime;
          
          spawnAttackEffect(castleDoorX - 4, roadGroundY - 45);
        }
      }
    }

    this.y = roadGroundY - this.height;
  },

  draw() {
    ctx.save();
    
    const drawX = this.x + this.attackOffsetX;
    const drawY = this.y + this.attackOffsetY + this.walkBobY;

    // Payer niche halka chaya (Shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(
      drawX + this.width / 2,
      this.y + this.height - 3,
      this.width * 0.35,
      7,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Rotation o attack animation er jonno pivot point
    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
    ctx.rotate(this.attackAngle);

    const activeFrame = assets.goblinFrames[this.currentFrame];
    if (activeFrame) {
      ctx.drawImage(
        activeFrame,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    }

    ctx.restore();
  }
};

// Main game loop
function gameLoop() {
  const currentTime = Date.now();
  update(currentTime);
  render(currentTime);
  requestAnimationFrame(gameLoop);
}

function update(currentTime) {
  goblin.update(currentTime);

  for (let i = hitSparks.length - 1; i >= 0; i--) {
    hitSparks[i].x += hitSparks[i].vx;
    hitSparks[i].y += hitSparks[i].vy;
    hitSparks[i].vy += 0.25;
    hitSparks[i].life -= 0.05;
    if (hitSparks[i].life <= 0) {
      hitSparks.splice(i, 1);
    }
  }

  for (let i = slashEffects.length - 1; i >= 0; i--) {
    slashEffects[i].life -= 0.08;
    if (slashEffects[i].life <= 0) {
      slashEffects.splice(i, 1);
    }
  }
}

function render(currentTime) {
  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  ctx.save();
  if (currentTime - castle.shakeTime < 130) {
    const shakeX = (Math.random() - 0.5) * 6;
    const shakeY = (Math.random() - 0.5) * 6;
    ctx.translate(shakeX, shakeY);
  }

  // 1. Background image
  if (assets.background) {
    ctx.drawImage(assets.background, 0, 0, BASE_WIDTH, BASE_HEIGHT);
  } else {
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  }

  // 2. Goblin
  goblin.draw();

  // 3. Tolwarer slash effect
  for (const slash of slashEffects) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, slash.life);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(slash.x + 15, slash.y, 28, Math.PI * 0.75, Math.PI * 1.35);
    ctx.stroke();
    ctx.restore();
  }

  // 4. Dorjay aghater spark
  for (const spark of hitSparks) {
    ctx.globalAlpha = Math.max(0, spark.life);
    ctx.fillStyle = spark.color;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  ctx.restore();

  // 5. Castle er health bar
  if (currentTime - castle.lastHitTime < castle.hitBarDisplayDuration && castle.health > 0) {
    drawCastleHealth();
  }

  // 6. Castle dhongso hoye gele game over
  if (castle.health <= 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CASTLE DESTROYED!', BASE_WIDTH / 2, BASE_HEIGHT / 2);
  }
}

function drawCastleHealth() {
  const barWidth = 200;
  const barHeight = 14;
  const barX = 75;
  const barY = 55;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

  const healthPercent = castle.health / castle.maxHealth;
  const currentHealthWidth = healthPercent * barWidth;
  ctx.fillStyle = healthPercent > 0.3 ? '#2ecc71' : '#e74c3c';
  ctx.fillRect(barX, barY, currentHealthWidth, barHeight);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
}

// Sob asset load kore game shuru kora
initAssetsAndStart();