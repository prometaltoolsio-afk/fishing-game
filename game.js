const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ইমেজ লোডার সেটআপ
const assets = {
  background: new Image(),
  castle: new Image(),
  goblin: new Image()
};

assets.background.src = 'assets/background.jpg'; // ফোল্ডার অনুযায়ী পাথ ঠিক রাখুন
assets.castle.src = 'assets/CASTLE.png';
assets.goblin.src = 'assets/goblin.png';

let loadedAssetsCount = 0;
const totalAssets = Object.keys(assets).length;

function checkAssetLoaded() {
  loadedAssetsCount++;
  if (loadedAssetsCount === totalAssets) {
    requestAnimationFrame(gameLoop);
  }
}

assets.background.onload = checkAssetLoaded;
assets.castle.onload = checkAssetLoaded;
assets.goblin.onload = checkAssetLoaded;

// ক্যাসেল কনফিগারেশন
const castle = {
  x: 20,
  y: 140,
  width: 280,
  height: 380,
  health: 1000,
  maxHealth: 1000,
  lastHitTime: 0,
  hitBarDisplayDuration: 3000
};

// একটি মাত্র সিঙ্গেল গবলিন
const singleGoblin = {
  width: 75,
  height: 75,
  x: canvas.width + 10,
  y: canvas.height - 75 - 160, // মাটির উচ্চতা অনুযায়ী অবস্থান
  speed: 1.6,
  damage: 25,
  attackInterval: 1000,
  lastAttackTime: 0,
  isAttacking: false,
  walkAnimOffset: 0,

  update(currentTime) {
    const castleWallX = castle.x + castle.width - 40;

    // ক্যাসেল পর্যন্ত হেঁটে যাবে
    if (this.x > castleWallX) {
      this.x -= this.speed;
      this.isAttacking = false;
      this.walkAnimOffset = Math.sin(Date.now() / 120) * 3;
    } else {
      // ক্যাসেলে পৌঁছে অ্যাটাক শুরু করবে
      this.isAttacking = true;
      this.walkAnimOffset = 0;

      if (currentTime - this.lastAttackTime > this.attackInterval) {
        if (castle.health > 0) {
          castle.health = Math.max(0, castle.health - this.damage);
          castle.lastHitTime = currentTime;
          this.lastAttackTime = currentTime;
        }
      }
    }
  },

  draw() {
    ctx.save();
    // কোনো উল্টানো ছাড়া স্বাভাবিক সোজা রেন্ডার
    ctx.drawImage(
      assets.goblin,
      this.x,
      this.y + this.walkAnimOffset,
      this.width,
      this.height
    );
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
}

function render(currentTime) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ১. ব্যাকগ্রাউন্ড
  ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);

  // ২. ক্যাসেল
  ctx.drawImage(assets.castle, castle.x, castle.y, castle.width, castle.height);

  // ৩. গবলিন
  singleGoblin.draw();

  // ৪. ড্যামেজ হলে হেলথ বার প্রদর্শন
  if (currentTime - castle.lastHitTime < castle.hitBarDisplayDuration) {
    drawCastleHealth();
  }

  // ক্যাসেল সম্পূর্ণ ধ্বংস হলে
  if (castle.health <= 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CASTLE DESTROYED!', canvas.width / 2, canvas.height / 2);
  }
}

function drawCastleHealth() {
  const barWidth = 200;
  const barHeight = 14;
  const barX = castle.x + (castle.width - barWidth) / 2;
  const barY = castle.y - 25;

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