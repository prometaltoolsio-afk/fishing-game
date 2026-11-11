const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const assets = {
  background: new Image(),
  castle: new Image()
};

assets.background.src = 'assets/background.jpg'; // অথবা 'background.jpg'
assets.castle.src = 'assets/CASTLE.png';        // অথবা 'CASTLE.png'

let loadedAssetsCount = 0;
const totalAssets = Object.keys(assets).length;

// ক্যাসেল কনফিগারেশন
const castle = {
  x: 20,
  y: 0,
  width: 280,
  height: 380,
  health: 1000,
  maxHealth: 1000,
  lastHitTime: 0,        // শেষ অ্যাটাক হওয়ার সময়
  hitBarDisplayDuration: 3000 // অ্যাটাক হওয়ার পর হেলথ বার ৩ সেকেন্ড দেখাবে
};

// ক্যাসেলটিকে আগের চেয়ে উপরে সেট করা হলো (নিচ থেকে ১২০ পিক্সেল উপরে)
castle.y = canvas.height - castle.height - 120;

function checkAssetLoaded() {
  loadedAssetsCount++;
  if (loadedAssetsCount === totalAssets) {
    requestAnimationFrame(gameLoop);
  }
}

assets.background.onload = checkAssetLoaded;
assets.castle.onload = checkAssetLoaded;

// ড্যামেজ নেওয়ার ফাংশন (এনিমি আঘাত করলে এটি কল হবে)
function takeDamage(amount) {
  castle.health = Math.max(0, castle.health - amount);
  castle.lastHitTime = Date.now(); // অ্যাটাকের সময় আপডেট
}

// টেস্ট করার জন্য ক্যানভাসে ক্লিক করলে ক্যাসেল ড্যামেজ খাবে এবং বার শো হবে
window.addEventListener('click', () => {
  takeDamage(50);
});

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

function update() {
  // এনিমি ও সৈন্যের মুভমেন্ট কোড এখানে যুক্ত হবে
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ১. ব্যাকগ্রাউন্ড
  ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);

  // ২. ক্যাসেল
  ctx.drawImage(assets.castle, castle.x, castle.y, castle.width, castle.height);

  // ৩. ড্যামেজ হলে হেলথ বার প্রদর্শন
  const currentTime = Date.now();
  if (currentTime - castle.lastHitTime < castle.hitBarDisplayDuration) {
    drawCastleHealth();
  }
}

function drawCastleHealth() {
  const barWidth = 200;
  const barHeight = 14;
  const barX = castle.x + (castle.width - barWidth) / 2;
  const barY = castle.y - 25;

  // ব্যাকগ্রাউন্ড বক্স
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

  // লাইফ বার
  const currentHealthWidth = (castle.health / castle.maxHealth) * barWidth;
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(barX, barY, currentHealthWidth, barHeight);

  // বর্ডার
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
}