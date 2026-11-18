const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const fireBtn = document.getElementById('fireBtn');

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
  cannon: null,
  goblinFrames: []
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
        // Ignore decode warning
      }
      resolve(img);
    };

    img.onerror = tryNext;
    tryNext();
  });
}

// Chobite kono sada pixel ba nicher barti daag thakle ta porishkar kore offscreen canvas-e cache kora
function createCleanFrameCanvas(img, cropBottom = false) {
  if (!img || img.naturalWidth === 0) return null;

  const offCanvas = document.createElement('canvas');
  offCanvas.width = img.naturalWidth;
  offCanvas.height = img.naturalHeight;
  const offCtx = offCanvas.getContext('2d');

  offCtx.drawImage(img, 0, 0);

  try {
    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;

    for (let y = 0; y < offCanvas.height; y++) {
      for (let x = 0; x < offCanvas.width; x++) {
        const i = (y * offCanvas.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Pure white ba kachakachi sada background pixel transparent kora
        if (a > 0 && r > 245 && g > 245 && b > 245) {
          data[i + 3] = 0;
        }

        // Goblin frame er ekebare niche kono barti daag thakle muche fela
        if (cropBottom && y > offCanvas.height * 0.96) {
          data[i + 3] = 0;
        }
      }
    }
    offCtx.putImageData(imgData, 0, 0);
  } catch (e) {
    return img;
  }

  return offCanvas;
}

// Sob chobi load howar por game shuru kora
async function initAssetsAndStart() {
  ctx.fillStyle = '#1e272e';
  ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Loading Game Assets...', BASE_WIDTH / 2, BASE_HEIGHT / 2);

  // 1. Background load
  assets.background = await loadSingleImage(['background.jpg', 'assets/background.jpg']);

  // 2. Cannon image load
  const rawCannon = await loadSingleImage(['CANNON.png', 'cannon.png', 'assets/CANNON.png', 'assets/cannon.png']);
  assets.cannon = createCleanFrameCanvas(rawCannon, false);

  // 3. 16ti Goblin frame load
  const goblinFileNames = [];
  for (let i = 1; i <= 16; i++) {
    goblinFileNames.push(`goblin_walk_${i}.png`);
  }

  const loadedImages = await Promise.all(
    goblinFileNames.map((name) => loadSingleImage([name, `assets/${name}`]))
  );

  assets.goblinFrames = loadedImages
    .map((img) => createCleanFrameCanvas(img, true))
    .filter((frame) => frame !== null);

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

const castleDoorX = 242;

// Aim Pointer (Set Pointer)
const aimPointer = {
  x: 760,
  y: 485,
  pulse: 0
};

// Cannon object (Castle er chader opor bosano)
const cannon = {
  x: 158,         // Castle er chader X position
  y: 238,         // Castle er chader Y position
  width: 78,
  height: 56,
  angle: 0,
  recoilOffset: 0,
  cooldown: 650,  // Milliseconds between shots
  lastFireTime: 0,
  damage: 55,

  update() {
    // Target point er dike cannon er angle hisab kora
    const dx = aimPointer.x - this.x;
    const dy = aimPointer.y - this.y;
    let targetAngle = Math.atan2(dy, dx);

    // Cannon jate pichone ba khub beshi upore na ghure jay (clamp angle)
    const minAngle = -0.55; // ~ -31 deg
    const maxAngle = 0.85;  // ~ +48 deg
    this.angle = Math.max(minAngle, Math.min(maxAngle, targetAngle));

    // Recoil recovery
    if (this.recoilOffset > 0) {
      this.recoilOffset = Math.max(0, this.recoilOffset - 0.8);
    }

    // Cooldown sesh hole FIRE button abar normal kora
    if (Date.now() - this.lastFireTime >= this.cooldown) {
      fireBtn.classList.remove('reloading');
    }
  },

  getMuzzlePosition() {
    // Cannon er noler mukher exact position
    const barrelLength = 42 - this.recoilOffset;
    const barrelLiftY = -6;
    return {
      x: this.x + Math.cos(this.angle) * barrelLength - Math.sin(this.angle) * barrelLiftY,
      y: this.y + Math.sin(this.angle) * barrelLength + Math.cos(this.angle) * barrelLiftY
    };
  },

  fire() {
    const now = Date.now();
    if (now - this.lastFireTime < this.cooldown || castle.health <= 0) return;

    this.lastFireTime = now;
    this.recoilOffset = 10;
    fireBtn.classList.add('reloading');

    const muzzle = this.getMuzzlePosition();

    // Muzzle flash & smoke
    for (let i = 0; i < 14; i++) {
      const spread = (Math.random() - 0.5) * 0.7;
      const spd = 2 + Math.random() * 5;
      hitSparks.push({
        x: muzzle.x,
        y: muzzle.y,
        vx: Math.cos(this.angle + spread) * spd,
        vy: Math.sin(this.angle + spread) * spd,
        life: 1.0,
        color: i % 2 === 0 ? '#ffae00' : '#ffffff'
      });
    }

    // Cannonball launch (Parabolic trajectory towards aimPointer)
    const targetX = Math.max(250, aimPointer.x);
    const targetY = aimPointer.y;
    const dx = targetX - muzzle.x;
    const dy = targetY - muzzle.y;
    const distance = Math.hypot(dx, dy);

    const flightFrames = Math.max(18, Math.min(52, distance / 16));
    const gravity = 0.42;
    const vx = dx / flightFrames;
    const vy = (dy - 0.5 * gravity * flightFrames * flightFrames) / flightFrames;

    cannonballs.push({
      x: muzzle.x,
      y: muzzle.y,
      vx: vx,
      vy: vy,
      gravity: gravity,
      targetX: targetX,
      targetY: targetY,
      radius: 8,
      trail: []
    });
  },

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Noler angle onujayi halka tilt (chaka gulo jate chader sathe thake)
    ctx.rotate(this.angle * 0.65);

    if (assets.cannon) {
      ctx.drawImage(
        assets.cannon,
        -this.width * 0.42 - this.recoilOffset,
        -this.height * 0.62,
        this.width,
        this.height
      );
    } else {
      // Fallback shape jodi CANNON.png load na hoy
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-15 - this.recoilOffset, -12, 52, 18);
      ctx.fillStyle = '#d35400';
      ctx.beginPath();
      ctx.arc(0, 8, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
};

// Active cannonballs & explosions
let cannonballs = [];
let explosions = [];
let hitSparks = [];
let slashEffects = [];

function createExplosion(x, y) {
  explosions.push({
    x: x,
    y: y,
    radius: 10,
    maxRadius: 58,
    life: 1.0
  });

  for (let i = 0; i < 22; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 1.5 + Math.random() * 6.5;
    hitSparks.push({
      x: x,
      y: y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 2,
      life: 1.0,
      color: i % 3 === 0 ? '#ff3b30' : (i % 3 === 1 ? '#ffcc00' : '#ff9500')
    });
  }
}

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

// Screen coordinate theke Canvas internal coordinate (1280x720) e convert kora
function setAimFromClientEvent(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const scaleX = BASE_WIDTH / rect.width;
  const scaleY = BASE_HEIGHT / rect.height;

  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;

  // Castle er samner area-te aim restrict kora
  aimPointer.x = Math.max(220, Math.min(BASE_WIDTH - 20, canvasX));
  aimPointer.y = Math.max(80, Math.min(BASE_HEIGHT - 40, canvasY));
}

// Mouse o Touch event diye Set Pointer control
let isDraggingAim = false;

canvas.addEventListener('pointerdown', (e) => {
  isDraggingAim = true;
  setAimFromClientEvent(e.clientX, e.clientY);
});

canvas.addEventListener('pointermove', (e) => {
  if (isDraggingAim) {
    setAimFromClientEvent(e.clientX, e.clientY);
  }
});

window.addEventListener('pointerup', () => {
  isDraggingAim = false;
});

// FIRE button click/touch event
fireBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  cannon.fire();
});

// Goblin object
const goblin = {
  width: 72,
  height: 102,
  x: 1210,
  y: 416,
  speed: 2.0,
  damage: 25,
  health: 150,
  maxHealth: 150,
  isDead: false,
  respawnTimer: 0,
  hitFlashTime: 0,
  
  currentFrame: 0,
  frameInterval: 55,
  lastFrameTime: 0,
  walkBobY: 0,
  
  attackInterval: 900,
  lastAttackTime: 0,
  isAttacking: false,
  attackOffsetX: 0,
  attackOffsetY: 0,
  attackAngle: 0,

  respawn() {
    this.x = 1230;
    this.health = this.maxHealth;
    this.isDead = false;
    this.isAttacking = false;
    this.attackOffsetX = 0;
    this.attackOffsetY = 0;
    this.attackAngle = 0;
  },

  takeDamage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.hitFlashTime = Date.now();

    if (this.health <= 0) {
      this.isDead = true;
      this.respawnTimer = Date.now();
    }
  },

  update(currentTime) {
    if (this.isDead) {
      // 2 second por notun goblin asbe
      if (currentTime - this.respawnTimer > 2000) {
        this.respawn();
      }
      return;
    }

    let roadGroundY = 518;
    if (this.x > 465 && this.x < 965) {
      const bridgeProgress = (this.x - 465) / (965 - 465);
      const archCurve = Math.sin(bridgeProgress * Math.PI) * 14;
      roadGroundY = 518 - archCurve;
    }

    if (this.x > castleDoorX) {
      this.x -= this.speed;
      this.isAttacking = false;
      this.attackOffsetX = 0;
      this.attackOffsetY = 0;
      this.attackAngle = 0;

      const totalFrames = assets.goblinFrames.length;
      if (totalFrames > 0 && currentTime - this.lastFrameTime > this.frameInterval) {
        this.currentFrame = (this.currentFrame + 1) % totalFrames;
        this.lastFrameTime = currentTime;
      }

      const frameCount = Math.max(totalFrames, 1);
      this.walkBobY = Math.abs(Math.sin((this.currentFrame / frameCount) * Math.PI * 2)) * -2.2;
    } else {
      this.x = castleDoorX;
      this.isAttacking = true;
      this.walkBobY = 0;

      const totalFrames = assets.goblinFrames.length;
      const timeSinceAttack = currentTime - this.lastAttackTime;
      const attackProgress = Math.min(timeSinceAttack / this.attackInterval, 1);

      if (attackProgress < 0.25) {
        const p = attackProgress / 0.25;
        this.currentFrame = Math.min(4, totalFrames - 1);
        this.attackOffsetX = p * 12;
        this.attackOffsetY = -p * 6;
        this.attackAngle = p * 0.22;
      } else if (attackProgress < 0.45) {
        const p = (attackProgress - 0.25) / 0.20;
        this.currentFrame = Math.min(8, totalFrames - 1);
        this.attackOffsetX = 12 - (p * 38);
        this.attackOffsetY = -6 + (p * 8);
        this.attackAngle = 0.22 - (p * 0.55);
      } else if (attackProgress < 0.65) {
        const p = (attackProgress - 0.45) / 0.20;
        this.currentFrame = Math.min(12, totalFrames - 1);
        this.attackOffsetX = -26 * (1 - p);
        this.attackOffsetY = 2 * (1 - p);
        this.attackAngle = -0.33 * (1 - p);
      } else {
        this.currentFrame = 0;
        this.attackOffsetX = 0;
        this.attackOffsetY = 0;
        this.attackAngle = 0;
      }

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

  draw(currentTime) {
    if (this.isDead) return;

    ctx.save();
    
    const drawX = this.x + this.attackOffsetX;
    const drawY = this.y + this.attackOffsetY + this.walkBobY;

    // Payer niche chaya
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(
      drawX + this.width / 2,
      this.y + this.height - 5,
      this.width * 0.35,
      7,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Goblin Health Bar (Goblin er mathar opore)
    if (this.health < this.maxHealth) {
      const hpW = 54;
      const hpH = 6;
      const hpX = drawX + (this.width - hpW) / 2;
      const hpY = drawY - 12;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(hpX - 1, hpY - 1, hpW + 2, hpH + 2);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(hpX, hpY, hpW * (this.health / this.maxHealth), hpH);
    }

    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
    ctx.rotate(this.attackAngle);

    // Cannonball lagle halka flash effect
    if (currentTime - this.hitFlashTime < 120) {
      ctx.filter = 'brightness(1.8)';
    }

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
  aimPointer.pulse += 0.08;
  cannon.update();
  goblin.update(currentTime);

  // Cannonballs update & collision check
  for (let i = cannonballs.length - 1; i >= 0; i--) {
    const ball = cannonballs[i];
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 8) ball.trail.shift();

    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vy += ball.gravity;

    // Goblin er sathe direct collision check
    const goblinCenterX = goblin.x + goblin.width / 2;
    const goblinCenterY = goblin.y + goblin.height / 2;
    const hitGoblinDirectly =
      !goblin.isDead &&
      Math.hypot(ball.x - goblinCenterX, ball.y - goblinCenterY) < 42;

    // Target point ba ground e pouchale blast hobe
    const reachedTarget =
      (ball.vy > 0 && ball.y >= ball.targetY) ||
      ball.y >= 540 ||
      ball.x >= BASE_WIDTH;

    if (hitGoblinDirectly || reachedTarget) {
      createExplosion(ball.x, ball.y);

      // Blast radius er moddhe goblin thakle damage pabe
      if (!goblin.isDead) {
        const blastDist = Math.hypot(ball.x - goblinCenterX, ball.y - goblinCenterY);
        if (blastDist <= 78) {
          goblin.takeDamage(cannon.damage);
        }
      }

      cannonballs.splice(i, 1);
    }
  }

  // Explosions update
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].radius += 3.2;
    explosions[i].life -= 0.07;
    if (explosions[i].life <= 0) {
      explosions.splice(i, 1);
    }
  }

  // Sparks update
  for (let i = hitSparks.length - 1; i >= 0; i--) {
    hitSparks[i].x += hitSparks[i].vx;
    hitSparks[i].y += hitSparks[i].vy;
    hitSparks[i].vy += 0.25;
    hitSparks[i].life -= 0.05;
    if (hitSparks[i].life <= 0) {
      hitSparks.splice(i, 1);
    }
  }

  // Slash effects update
  for (let i = slashEffects.length - 1; i >= 0; i--) {
    slashEffects[i].life -= 0.08;
    if (slashEffects[i].life <= 0) {
      slashEffects.splice(i, 1);
    }
  }
}

function drawAimPointer() {
  const x = aimPointer.x;
  const y = aimPointer.y;
  const pulseRadius = 18 + Math.sin(aimPointer.pulse) * 3;
  const muzzle = cannon.getMuzzlePosition();

  ctx.save();

  // 1. Cannon theke Aim Pointer porjonto halka dotted trajectory line
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(muzzle.x, muzzle.y);
  ctx.quadraticCurveTo(
    (muzzle.x + x) / 2,
    Math.min(muzzle.y, y) - 70,
    x,
    y
  );
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Outer pulsing ring
  ctx.strokeStyle = '#ff3b30';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Inner gold ring & crosshair lines
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.moveTo(x - 24, y);
  ctx.lineTo(x - 10, y);
  ctx.moveTo(x + 10, y);
  ctx.lineTo(x + 24, y);
  ctx.moveTo(x, y - 24);
  ctx.lineTo(x, y - 10);
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x, y + 24);
  ctx.stroke();

  // 4. Center dot
  ctx.fillStyle = '#ff3b30';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
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

  // 2. Castle er opore Cannon
  cannon.draw();

  // 3. Set Pointer (Aim Crosshair)
  drawAimPointer();

  // 4. Goblin
  goblin.draw(currentTime);

  // 5. Cannonballs
  for (const ball of cannonballs) {
    // Smoke trail
    for (let t = 0; t < ball.trail.length; t++) {
      const pt = ball.trail[t];
      ctx.fillStyle = `rgba(220, 220, 220, ${(t + 1) / (ball.trail.length * 2.5)})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, ball.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Iron Cannonball
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7f8fa6';
    ctx.beginPath();
    ctx.arc(ball.x - 2.5, ball.y - 2.5, ball.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Explosions
  for (const exp of explosions) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, exp.life);
    const grad = ctx.createRadialGradient(exp.x, exp.y, 4, exp.x, exp.y, exp.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, '#ffcc00');
    grad.addColorStop(0.75, '#ff4500');
    grad.addColorStop(1, 'rgba(255, 69, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 7. Tolwarer slash effect
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

  // 8. Sparks
  for (const spark of hitSparks) {
    ctx.globalAlpha = Math.max(0, spark.life);
    ctx.fillStyle = spark.color;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  ctx.restore();

  // 9. Castle er health bar
  if (currentTime - castle.lastHitTime < castle.hitBarDisplayDuration && castle.health > 0) {
    drawCastleHealth();
  }

  // 10. Castle dhongso hoye gele game over
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