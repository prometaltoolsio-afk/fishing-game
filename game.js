const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ইমেজ লোডার সেটআপ
const assets = {
  background: new Image(),
  castle: new Image()
};

// ইমেজ সোর্স
assets.background.src = 'assets/background.jpg';
assets.castle.src = 'assets/CASTLE.png'; // অথবা CASTLE.jpg

let loadedAssetsCount = 0;
const totalAssets = Object.keys(assets).length;

// ক্যাসেল কনফিগারেশন
const castle = {
  x: 20,              // ক্যানভাসের বাঁ দিক থেকে দূরত্ব
  y: 0,               // ড্র করার সময় গ্রাউন্ড লেভেল অনুযায়ী সেট হবে
  width: 280,
  height: 380,
  health: 1000,
  maxHealth: 1000
};

// গ্রাউন্ডের উচ্চতা অনুযায়ী ক্যাসেল পজিশন
castle.y = canvas.height - castle.height - 40;

function checkAssetLoaded() {
  loadedAssetsCount++;
  if (loadedAssetsCount === totalAssets) {
    // সব ইমেজ লোড হলে গেম লুপ শুরু হবে
    requestAnimationFrame(gameLoop);
  }
}

assets.background.onload = checkAssetLoaded;
assets.castle.onload = checkAssetLoaded;

// গেম লুপ
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

function update() {
  // এখানে সৈন্য বা গবলিনদের মুভমেন্ট আপডেট যুক্ত হবে
}

function render() {
  // ক্যানভাস ক্লিয়ার করা
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ১. ব্যাকগ্রাউন্ড ড্র করা
  ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);

  // ২. ক্যাসেল ড্র করা
  ctx.drawImage(assets.castle, castle.x, castle.y, castle.width, castle.height);

  // ৩. ক্যাসেলের হেলথ বার (UI)
  drawCastleHealth();
}

function drawCastleHealth() {
  const barWidth = 200;
  const barHeight = 16;
  const barX = castle.x + (castle.width - barWidth) / 2;
  const barY = castle.y - 25;

  // ব্যাকগ্রাউন্ড বার
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

  // কারেন্ট হেলথ
  const currentHealthWidth = (castle.health / castle.maxHealth) * barWidth;
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(barX, barY, currentHealthWidth, barHeight);

  // বর্ডার
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
}