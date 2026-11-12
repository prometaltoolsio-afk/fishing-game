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

loadAsset('background', ['assets/background_3.jpg', 'background_3.jpg', 'assets/background.jpg', 'background.jpg']);
loadAsset('castle', ['assets/CASTLE_3.png', 'CASTLE_3.png', 'assets/CASTLE.png', 'CASTLE.png']);
loadAsset('goblin', ['assets/goblin.png', 'goblin.png']);

// ক্যাসেল কনফিগারেশন: বাম দিকে বসানো এবং দরজাটি রাস্তার শেষ প্রান্তে রাখা হয়েছে
const castle = {
  x: 15,
  y: 95,
  width: 310,
  height: 365,
  health: 1000,
  maxHealth: 1000,
  lastHitTime: 0,
  hitBarDisplayDuration: 3000
};

// ক্যাসেলের কাঠের দরজার ঠিক মাঝখানের X এবং নিচের Y পজিশন
const castleDoorX = castle.x + (castle.width * 0.56); // দরজার মাঝামাঝি (~188px)
const castleDoorBottomY = castle.y + castle.height - 10; // দরজার চৌকাঠ (~450px)

// হলুদ রাস্তাটিকে ঘুরিয়ে ক্যাসেলের দরজায় মিশিয়ে দেওয়ার ফাংশন
function drawRoadToCastleDoor() {
  ctx.save();

  // ১. বাম দিকের অতিরিক্ত সোজা রাস্তাটি ঘাসের রঙ দিয়ে ঢেকে দেওয়া, যাতে রাস্তাটি সোজা না গিয়ে দরজায় ঢোকে
  const grassGrad = ctx.createLinearGradient(0, 425, 0, 480);
  grassGrad.addColorStop(0, '#5ce619');
  grassGrad.addColorStop(1, '#39b80d');
  ctx.fillStyle = grassGrad;
  ctx.beginPath();
  ctx.moveTo(0, 428);
  ctx.lineTo(240, 428);
  ctx.lineTo(240, 482);
  ctx.lineTo(0, 482);
  ctx.closePath();
  ctx.fill();

  // ২. হলুদ রাস্তাটি ব্রিজের বাম পাশ থেকে বাঁক নিয়ে সরাসরি ক্যাসেলের দরজায় গিয়ে শেষ হবে
  const roadGrad = ctx.createLinearGradient(350, 460, castleDoorX, castleDoorBottomY);
  roadGrad.addColorStop(0, '#f5b83d'); // ব্যাকগ্রাউন্ড রাস্তার আসল হলুদ রঙ
  roadGrad.addColorStop(1, '#e09d24');

  ctx.fillStyle = roadGrad;
  ctx.beginPath();
  // ব্রিজের বাম দিকের সংযোগস্থল (x = 355) থেকে শুরু
  ctx.moveTo(355, 434);
  // উপরের কিনারা বাঁক নিয়ে দরজার ডান প্রান্তে মিশেছে
  ctx.quadraticCurveTo(270, 434, castleDoorX + 38, castleDoorBottomY - 4);
  // দরজার নিচের প্রান্ত
  ctx.lineTo(castleDoorX - 38, castleDoorBottomY - 4);
  // নিচের কিনারা বাঁক নিয়ে রাস্তার নিচের অংশে মিশেছে
  ctx.quadraticCurveTo(250, 474, 355, 474);
  ctx.closePath();
  ctx.fill();

  // রাস্তার ধারের হালকা বর্ডার (ন্যাচারাল লুকের জন্য)
  ctx.strokeStyle = '#c98618';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(355, 474);
  ctx.quadraticCurveTo(250, 474, castleDoorX - 38, castleDoorBottomY - 4);
  ctx.stroke();

  ctx.restore();
}

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
    // রাস্তার ও ব্রিজের উচ্চতা অনুযায়ী Y পজিশন
    let roadLevelY = 462;

    if (this.x > 360 && this.x < 920) {
      // ব্রিজের আর্চ অনুযায়ী উচ্চতা
      const bridgeProgress = (this.x - 360) / (920 - 360);
      const archCurve = Math.sin(bridgeProgress * Math.PI) * 16;
      roadLevelY = 462 - archCurve;
    } else if (this.x <= 355) {
      // ক্যাসেলের দরজার দিকে যাওয়ার বাঁকানো রাস্তার উচ্চতা
      const pathProgress = Math.min((355 - this.x) / (355 - castleDoorX), 1);
      roadLevelY = 462 - (pathProgress * (462 - castleDoorBottomY));
    }

    this.baseY = roadLevelY - this.height;

    // ক্যাসেলের দরজার ঠিক সামনে না পৌঁছানো পর্যন্ত হাঁটবে
    if (this.x > castleDoorX + 5) {
      this.x -= this.speed;
      this.isAttacking = false;
      this.walkAnimOffset = Math.sin(Date.now() / 120) * 3;
    } else {
      // দরজার সামনে পৌঁছে রাস্তা শেষ, এখন আক্রমণ করবে
      this.x = castleDoorX + 5;
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

  // ১. ব্যাকগ্রাউন্ড
  if (assetStatus.background) {
    ctx.drawImage(assets.background, 0, 0, BASE_WIDTH, BASE_HEIGHT);
  } else {
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  }

  // ২. হলুদ রাস্তাটিকে ঘুরিয়ে ক্যাসেলের দরজায় মিশিয়ে দেওয়া
  drawRoadToCastleDoor();

  // ৩. ক্যাসেল (রাস্তার শেষ প্রান্তে দরজাসহ)
  if (assetStatus.castle) {
    ctx.drawImage(assets.castle, castle.x, castle.y, castle.width, castle.height);
  }

  // ৪. গবলিন (ক্যাসেলের দরজার ঠিক সামনে রেন্ডার হবে)
  singleGoblin.draw();

  // ৫. ড্যামেজ হলে হেলথ বার প্রদর্শন
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

// সরাসরি গেম লুপ শুরু
requestAnimationFrame(gameLoop);