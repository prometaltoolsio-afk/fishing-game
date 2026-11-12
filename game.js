const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ক্যানভাসের মূল রেজোলিউশন (16:9 রেশিও)
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;
canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;

// মোবাইল ও সব ডিভাইসের স্ক্রিন অনুযায়ী ক্যানভাস সাইজ অ্যাডজাস্ট ফাংশন
function resizeCanvas() {
  const windowWidth = window.innerWidth - 16; // সামান্য প্যাডিং বাদ দিয়ে
  const windowHeight = window.innerHeight - 16;
  const aspectRatio = BASE_WIDTH / BASE_HEIGHT;

  let newWidth = windowWidth;
  let newHeight = windowWidth / aspectRatio;

  if (newHeight > windowHeight) {
    newHeight = windowHeight;
    newWidth = windowHeight * aspectRatio;
  }

  canvas.style.width = `${newWidth}px`;
  canvas.style.height = `${newHeight}px`;
}

// পেজ লোড এবং স্ক্রিন রিসাইজ/রোটেট হলে কল হবে
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// ইমেজ লোডার সেটআপ
const assets = {
  background: new Image(),
  castle: new Image(),
  goblin: new Image()
};

assets.background.src = 'assets/background.jpg';
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

// ক্যাসেল কনফিগারেশন (x: 60, y: 60)
const castle = {
  x: 60,
  y: 60,
  width: 280,
  height: 380,
  health: 1000,
  maxHealth: 1000,
  lastHitTime: 0,
  hitBarDisplayDuration: 3000
};

// সিঙ্গেল গবলিন (রাস্তার উপর দিয়ে হাঁটার লজিকসহ)
const singleGoblin = {
  width: 75,
  height: 75,
  x: BASE_WIDTH + 10,
  baseY: 370,
  y: 370,
  speed: 1.6,
  damage: 25,
  attackInterval: 1000,
  lastAttackTime: 0,
  isAttacking: false,
  walkAnimOffset: 0,

  update(currentTime) {
    const castleWallX = castle.x + castle.width - 40;

    // রাস্তার ও ব্রিজের ঢাল অনুযায়ী Y পজিশন নির্ধারণ
    let roadLevelY = 445; // রাস্তার মূল উচ্চতা
    if (this.x > 360 && this.x < 920) {
      const bridgeProgress = (this.x - 360) / (920 - 360);
      const archCurve = Math.sin(bridgeProgress * Math.PI) * 14;
      roadLevelY = 445 - archCurve;
    }
    this.baseY = roadLevelY - this.height;

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

    this.y = this.baseY;
  },

  draw() {
    ctx.save();
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
  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  // ১. ব্যাকগ্রাউন্ড
  ctx.drawImage(assets.background, 0, 0, BASE_WIDTH, BASE_HEIGHT);

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