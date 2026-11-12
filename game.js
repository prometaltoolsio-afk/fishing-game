const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ক্যানভাসের মূল রেজোলিউশন
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;
canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;

// মোবাইল ও সব ডিভাইসের স্ক্রিন অনুযায়ী ক্যানভাস সাইজ ফিক্স করা
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

// ইমেজ লোডার সেটআপ (সব সম্ভাব্য নাম ও পাথসহ)
const assets = {
  background: new Image(),
  goblin: new Image()
};

const assetStatus = {
  background: false,
  goblin: false
};

function loadAsset(key, paths) {
  let index = 0;
  function tryNext() {
    if (index >= paths.length) {
      console.warn(`ইমেজ লোড হয়নি (${key}):`, paths);
      return;
    }
    const currentPath = paths[index];
    index++;
    assets[key].src = currentPath;
  }
  assets[key].onload = () => {
    assetStatus[key] = true;
  };
  assets[key].onerror = tryNext;
  tryNext();
}

loadAsset('background', [
  'background.jpg',
  'bg.jpg',
  'assets/background.jpg',
  'assets/bg.jpg',
  'background_4.jpg',
  'assets/background_4.jpg'
]);

loadAsset('goblin', [
  'goblin.png',
  'goblin_2.png',
  'assets/goblin.png',
  'assets/goblin_2.png',
  'Goblin.png',
  'Goblin_2.png'
]);

// background.jpg ছবির ক্যাসেলের হেলথ ও অবস্থান
const castle = {
  x: 15,
  y: 75,
  width: 335,
  height: 395,
  health: 1000,
  maxHealth: 1000,
  lastHitTime: 0,
  hitBarDisplayDuration: 3000
};

// background.jpg-এর ক্যাসেলের কাঠের দরজার ঠিক সামনের X পজিশন
const castleDoorX = 248;

// আঘাতের সময় দরজায় ছোট স্পার্ক/ইফেক্ট দেখানোর জন্য
let hitSparks = [];

function spawnHitSpark(x, y) {
  for (let i = 0; i < 6; i++) {
    hitSparks.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.3) * 4,
      vy: (Math.random() - 0.8) * 4,
      life: 1.0
    });
  }
}

// সিঙ্গেল গবলিন: রাস্তার উপর দিয়ে হেঁটে ক্যাসেলের দরজার সামনে এসে আক্রমণ করবে
const singleGoblin = {
  width: 80,
  height: 80,
  x: 1220, // শুরু থেকেই ডান দিকে দৃশ্যমান থাকবে
  baseY: 400,
  y: 400,
  speed: 1.8,
  damage: 25,
  attackInterval: 900,
  lastAttackTime: 0,
  isAttacking: false,
  walkAnimOffset: 0,
  attackAnimOffsetX: 0,
  attackAngle: 0,

  update(currentTime) {
    // background.jpg-এর হলুদ রাস্তা ও ব্রিজের উচ্চতা অনুযায়ী Y পজিশন (~476px)
    let roadLevelY = 476;
    if (this.x > 465 && this.x < 965) {
      const bridgeProgress = (this.x - 465) / (965 - 465);
      const archCurve = Math.sin(bridgeProgress * Math.PI) * 14;
      roadLevelY = 476 - archCurve;
    }
    this.baseY = roadLevelY - this.height;

    // ক্যাসেলের দরজা পর্যন্ত রাস্তার উপর দিয়ে হেঁটে যাবে
    if (this.x > castleDoorX) {
      this.x -= this.speed;
      this.isAttacking = false;
      this.walkAnimOffset = Math.sin(currentTime / 110) * 3.5;
      this.attackAnimOffsetX = 0;
      this.attackAngle = 0;
    } else {
      // দরজার সামনে পৌঁছে আক্রমণ করবে
      this.x = castleDoorX;
      this.isAttacking = true;
      this.walkAnimOffset = 0;

      // আক্রমণের সময় সামনে ঝাঁপিয়ে পড়ার অ্যানিমেশন
      const timeSinceLastAttack = currentTime - this.lastAttackTime;
      if (timeSinceLastAttack < 180) {
        const swing = Math.sin((timeSinceLastAttack / 180) * Math.PI);
        this.attackAnimOffsetX = -swing * 16;
        this.attackAngle = -swing * 0.22;
      } else {
        this.attackAnimOffsetX = 0;
        this.attackAngle = 0;
      }

      if (timeSinceLastAttack > this.attackInterval) {
        if (castle.health > 0) {
          castle.health = Math.max(0, castle.health - this.damage);
          castle.lastHitTime = currentTime;
          this.lastAttackTime = currentTime;
          spawnHitSpark(castleDoorX - 5, this.y + 38);
        }
      }
    }

    this.y = this.baseY;
  },

  draw() {
    ctx.save();
    const drawX = this.x + this.attackAnimOffsetX;
    const drawY = this.y + this.walkAnimOffset;

    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
    ctx.rotate(this.attackAngle);

    if (assetStatus.goblin && assets.goblin.complete && assets.goblin.naturalWidth > 0) {
      // গবলিন ইমেজ লোড হলে সেটি আঁকবে
      ctx.drawImage(
        assets.goblin,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    } else {
      // ইমেজ না পেলেও যেন গবলিন ইনভিজিবল না হয়, তার জন্য ফলব্যাক ক্যারেক্টার
      ctx.fillStyle = '#6ab04c';
      ctx.fillRect(-20, -25, 40, 45);
      ctx.fillStyle = '#eb4d4b';
      ctx.fillRect(-14, -12, 8, 6);
      ctx.fillStyle = '#95afc0';
      ctx.fillRect(-35, -15, 18, 6);
    }

    ctx.restore();
  }
};

// গেম লুপ
function gameLoop() {
  const currentTime = Date.now();
  update(currentTime);
  render(currentTime);
  requestAnimationFrame(gameLoop);
}

function update(currentTime) {
  singleGoblin.update(currentTime);

  // হিট স্পার্ক আপডেট
  for (let i = hitSparks.length - 1; i >= 0; i--) {
    hitSparks[i].x += hitSparks[i].vx;
    hitSparks[i].y += hitSparks[i].vy;
    hitSparks[i].life -= 0.06;
    if (hitSparks[i].life <= 0) {
      hitSparks.splice(i, 1);
    }
  }
}

function render(currentTime) {
  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  // ১. ব্যাকগ্রাউন্ড ইমেজ
  if (assetStatus.background && assets.background.complete && assets.background.naturalWidth > 0) {
    ctx.drawImage(assets.background, 0, 0, BASE_WIDTH, BASE_HEIGHT);
  } else {
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  }

  // ২. গবলিন ইমেজ (সবসময় দৃশ্যমান থাকবে)
  singleGoblin.draw();

  // ৩. দরজায় আঘাতের স্পার্ক ইফেক্ট
  for (const spark of hitSparks) {
    ctx.fillStyle = `rgba(255, 215, 0, ${spark.life})`;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ৪. ড্যামেজ হলে হেলথ বার প্রদর্শন
  if (currentTime - castle.lastHitTime < castle.hitBarDisplayDuration) {
    drawCastleHealth();
  }

  // ক্যাসেল সম্পূর্ণ ধ্বংস হলে
  if (castle.health <= 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CASTLE DESTROYED!', BASE_WIDTH / 2, BASE_HEIGHT / 2);
  }
}

function drawCastleHealth() {
  const barWidth = 200;
  const barHeight = 14;
  const barX = 75;
  const barY = 55;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

  const healthPercent = castle.health / castle.maxHealth;
  const currentHealthWidth = healthPercent * barWidth;
  ctx.fillStyle = healthPercent > 0.3 ? '#2ecc71' : '#e74c3c';
  ctx.fillRect(barX, barY, currentHealthWidth, barHeight);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
}

// সরাসরি গেম লুপ শুরু
requestAnimationFrame(gameLoop);