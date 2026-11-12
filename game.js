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

// ইমেজ লোডার সেটআপ (নতুন এবং পুরোনো সব নামের ফলব্যাকসহ)
const assets = {
  background: new Image(),
  castle: new Image(),
  goblin: new Image()
};

const assetStatus = {
  background: false,
  castle: false,
  goblin: false
};

function loadAsset(key, paths) {
  let index = 0;
  function tryNext() {
    if (index >= paths.length) return;
    assets[key].src = paths[index];
    index++;
  }
  assets[key].onload = () => {
    assetStatus[key] = true;
  };
  assets[key].onerror = tryNext;
  tryNext();
}

loadAsset('background', ['assets/background_4.jpg', 'background_4.jpg', 'assets/background_3.jpg', 'background_3.jpg']);
loadAsset('castle', ['assets/CASTLE_4.png', 'CASTLE_4.png', 'assets/CASTLE_3.png', 'CASTLE_3.png']);
loadAsset('goblin', ['assets/goblin_2.png', 'goblin_2.png', 'assets/goblin.png', 'goblin.png']);

// ক্যাসেল পজিশন অ্যাডজাস্টমেন্ট:
// বাম দিকের হলুদ রাস্তাটি সোজা ক্যাসেলের দরজার গোড়ায় ঢুকে শেষ হবে
// এবং বাম প্রান্তের অবশিষ্ট রাস্তা ক্যাসেলের বাম পাশের দেয়ালের পেছনে ঢাকা পড়বে।
const castle = {
  x: -20,
  y: 95,
  width: 340,
  height: 375,
  health: 1000,
  maxHealth: 1000,
  lastHitTime: 0,
  hitBarDisplayDuration: 3000
};

// ক্যাসেলের দরজার ঠিক সামনের X পজিশন (যেখানে এসে গবলিন থামবে)
const castleDoorX = castle.x + (castle.width * 0.56); // ~170px

// সিঙ্গেল গবলিন: রাস্তার উপর দিয়ে হেঁটে ক্যাসেলের দরজার সামনে এসে আক্রমণ করবে
const singleGoblin = {
  width: 75,
  height: 75,
  x: BASE_WIDTH + 10,
  baseY: 388,
  y: 388,
  speed: 1.6,
  damage: 25,
  attackInterval: 1000,
  lastAttackTime: 0,
  isAttacking: false,
  walkAnimOffset: 0,

  update(currentTime) {
    // রাস্তার ও ব্রিজের উচ্চতা অনুযায়ী Y পজিশন (হলুদ রাস্তা ~462px)
    let roadLevelY = 462;
    if (this.x > 360 && this.x < 920) {
      const bridgeProgress = (this.x - 360) / (920 - 360);
      const archCurve = Math.sin(bridgeProgress * Math.PI) * 16;
      roadLevelY = 462 - archCurve;
    }
    this.baseY = roadLevelY - this.height;

    // ক্যাসেলের দরজা পর্যন্ত রাস্তার উপর দিয়ে হেঁটে যাবে
    if (this.x > castleDoorX) {
      this.x -= this.speed;
      this.isAttacking = false;
      this.walkAnimOffset = Math.sin(Date.now() / 120) * 3;
    } else {
      // দরজার সামনে পৌঁছে রাস্তা শেষ, এখন আক্রমণ করবে
      this.x = castleDoorX;
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
    if (!assetStatus.goblin) return;
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

  // ১. ব্যাকগ্রাউন্ড ইমেজ
  if (assetStatus.background) {
    ctx.drawImage(assets.background, 0, 0, BASE_WIDTH, BASE_HEIGHT);
  } else {
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  }

  // ২. ক্যাসেল ইমেজ (রাস্তার শেষ প্রান্তে বসানো)
  if (assetStatus.castle) {
    ctx.drawImage(assets.castle, castle.x, castle.y, castle.width, castle.height);
  }

  // ৩. গবলিন ইমেজ (রাস্তার উপর দিয়ে হেঁটে ক্যাসেলের দরজার সামনে)
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
  const barX = Math.max(20, castle.x + (castle.width - barWidth) / 2);
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

// সরাসরি গেম লুপ শুরু
requestAnimationFrame(gameLoop);