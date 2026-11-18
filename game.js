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

// Background o goblin er frame load korar byabostha
const assets = {
  background: new Image(),
  goblinFrames: []
};

const assetStatus = {
  background: false,
  goblinFramesLoaded: 0
};

// Background loader
function loadBackground(paths) {
  let index = 0;
  function tryNext() {
    if (index >= paths.length) return;
    assets.background.src = paths[index++];
  }
  assets.background.onload = () => {
    assetStatus.background = true;
  };
  assets.background.onerror = tryNext;
  tryNext();
}

loadBackground(['background.jpg', 'assets/background.jpg']);

// Tomar dewa 8ti goblin image file er list
const goblinFileNames = [
  'goblin_walk_1_2.png',
  'goblin_walk_2_2.png',
  'goblin_walk_3_2.png',
  'goblin_walk_4_2.png',
  'goblin_walk_5_2.png',
  'goblin_walk_6_2.png',
  'goblin_walk_7.png',
  'goblin_walk_8.png'
];

// 8ti frame load kora (root folder ba assets folder theke)
goblinFileNames.forEach((fileName) => {
  const img = new Image();
  const paths = [fileName, `assets/${fileName}`];
  let pathIndex = 0;

  function tryLoadFrame() {
    if (pathIndex >= paths.length) return;
    img.src = paths[pathIndex++];
  }

  img.onload = () => {
    assetStatus.goblinFramesLoaded++;
  };
  img.onerror = tryLoadFrame;
  tryLoadFrame();

  assets.goblinFrames.push(img);
});

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
  // Aguner spark
  for (let i = 0; i < 10; i++) {
    hitSparks.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.15) * 6,
      vy: (Math.random() - 0.85) * 6,
      life: 1.0,
      color: i % 2 === 0 ? '#ffd700' : '#ff6b00'
    });
  }
  // Tolwarer slash mark
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
  x: 1210,    // Dan diker rasta theke jatra shuru korbe
  y: 380,
  speed: 2.1,
  damage: 25,
  
  // Hatar animation control (8ti frame)
  currentFrame: 0,
  frameInterval: 95,
  lastFrameTime: 0,
  
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
      if (currentTime - this.lastFrameTime > this.frameInterval) {
        this.currentFrame = (this.currentFrame + 1) % assets.goblinFrames.length;
        this.lastFrameTime = currentTime;
      }
    } else {
      // Dorjar samne pouchhe attack shuru korbe
      this.x = castleDoorX;
      this.isAttacking = true;

      const timeSinceAttack = currentTime - this.lastAttackTime;
      const attackProgress = Math.min(timeSinceAttack / this.attackInterval, 1);

      // 3-step realistic attack motion: Wind-up -> Strike -> Recover
      if (attackProgress < 0.25) {
        // Step 1: Tolwar pichone tule prostuti (Wind-up)
        const p = attackProgress / 0.25;
        this.currentFrame = 4; // goblin_walk_5_2.png (ready stance)
        this.attackOffsetX = p * 12;
        this.attackOffsetY = -p * 6;
        this.attackAngle = p * 0.22;
      } else if (attackProgress < 0.45) {
        // Step 2: Samne jhapiye pore dorjay jore kop dewa (Strike)
        const p = (attackProgress - 0.25) / 0.20;
        const strikeCurve = Math.sin(p * Math.PI);
        this.currentFrame = 5; // goblin_walk_6_2.png (forward strike pose)
        this.attackOffsetX = 12 - (p * 38);
        this.attackOffsetY = -6 + (p * 8);
        this.attackAngle = 0.22 - (p * 0.55);
      } else if (attackProgress < 0.65) {
        // Step 3: Abar ager jaygay phire asa (Recover)
        const p = (attackProgress - 0.45) / 0.20;
        this.currentFrame = 6; // goblin_walk_7.png
        this.attackOffsetX = -26 * (1 - p);
        this.attackOffsetY = 2 * (1 - p);
        this.attackAngle = -0.33 * (1 - p);
      } else {
        // Idle stance porer aghater age porjonto
        this.currentFrame = 1; // goblin_walk_2_2.png
        this.attackOffsetX = 0;
        this.attackOffsetY = 0;
        this.attackAngle = 0;
      }

      // Thik strike er muhurte castle e damage o spark effect
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
    const drawY = this.y + this.attackOffsetY;

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

    const activeImg = assets.goblinFrames[this.currentFrame];
    if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
      ctx.drawImage(
        activeImg,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    } else {
      ctx.fillStyle = '#6ab04c';
      ctx.fillRect(-20, -30, 40, 60);
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

  // Spark particle update
  for (let i = hitSparks.length - 1; i >= 0; i--) {
    hitSparks[i].x += hitSparks[i].vx;
    hitSparks[i].y += hitSparks[i].vy;
    hitSparks[i].vy += 0.25;
    hitSparks[i].life -= 0.05;
    if (hitSparks[i].life <= 0) {
      hitSparks.splice(i, 1);
    }
  }

  // Slash effect update
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
  // Dorjay aghat lagle screen shake effect
  if (currentTime - castle.shakeTime < 130) {
    const shakeX = (Math.random() - 0.5) * 6;
    const shakeY = (Math.random() - 0.5) * 6;
    ctx.translate(shakeX, shakeY);
  }

  // 1. Background image
  if (assetStatus.background && assets.background.complete && assets.background.naturalWidth > 0) {
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

// Game shuru
requestAnimationFrame(gameLoop);