// 10 Progressive Physics Castle Defense Levels
window.GAME_LEVELS = [
  {
    level: 1,
    ammo: 5,
    title: "প্রথম যুদ্ধক্ষেত্র",
    blocks: [
      { x: 700, y: 390, w: 25, h: 70, type: "wood", hp: 40 },
      { x: 770, y: 390, w: 25, h: 70, type: "wood", hp: 40 },
      { x: 690, y: 375, w: 115, h: 15, type: "wood", hp: 35 }
    ],
    enemies: [
      { x: 735, y: 435, r: 18, hp: 30 }
    ]
  },
  {
    level: 2,
    ammo: 5,
    title: "পাথুরে প্রহরী",
    blocks: [
      { x: 680, y: 390, w: 25, h: 70, type: "stone", hp: 80 },
      { x: 750, y: 390, w: 25, h: 70, type: "stone", hp: 80 },
      { x: 670, y: 375, w: 115, h: 15, type: "wood", hp: 35 },
      { x: 710, y: 320, w: 20, h: 55, type: "wood", hp: 40 }
    ],
    enemies: [
      { x: 715, y: 435, r: 18, hp: 30 },
      { x: 720, y: 300, r: 16, hp: 25 }
    ]
  },
  {
    level: 3,
    ammo: 6,
    title: "দ্বৈত টাওয়ার",
    blocks: [
      // Tower 1
      { x: 630, y: 400, w: 22, h: 60, type: "wood", hp: 40 },
      { x: 680, y: 400, w: 22, h: 60, type: "wood", hp: 40 },
      { x: 620, y: 385, w: 90, h: 15, type: "wood", hp: 30 },
      // Tower 2
      { x: 760, y: 390, w: 26, h: 70, type: "stone", hp: 80 },
      { x: 820, y: 390, w: 26, h: 70, type: "stone", hp: 80 },
      { x: 750, y: 375, w: 105, h: 15, type: "stone", hp: 70 }
    ],
    enemies: [
      { x: 655, y: 438, r: 18, hp: 30 },
      { x: 790, y: 438, r: 18, hp: 30 },
      { x: 790, y: 355, r: 16, hp: 25 }
    ]
  },
  {
    level: 4,
    ammo: 5,
    title: "টিএনটি এক্সপ্লোশন",
    blocks: [
      { x: 700, y: 410, w: 30, h: 50, type: "tnt", hp: 15 },
      { x: 660, y: 380, w: 25, h: 80, type: "stone", hp: 90 },
      { x: 745, y: 380, w: 25, h: 80, type: "stone", hp: 90 },
      { x: 650, y: 365, w: 130, h: 15, type: "stone", hp: 80 }
    ],
    enemies: [
      { x: 715, y: 345, r: 18, hp: 35 },
      { x: 810, y: 438, r: 18, hp: 30 }
    ]
  },
  {
    level: 5,
    ammo: 6,
    title: "তিন তলা দুর্গ",
    blocks: [
      // Floor 1
      { x: 680, y: 400, w: 25, h: 60, type: "stone", hp: 90 },
      { x: 780, y: 400, w: 25, h: 60, type: "stone", hp: 90 },
      { x: 670, y: 385, w: 145, h: 15, type: "stone", hp: 80 },
      // Floor 2
      { x: 700, y: 325, w: 22, h: 60, type: "wood", hp: 40 },
      { x: 760, y: 325, w: 22, h: 60, type: "wood", hp: 40 },
      { x: 690, y: 310, w: 100, h: 15, type: "wood", hp: 35 },
      // Roof
      { x: 730, y: 260, w: 20, h: 50, type: "wood", hp: 35 }
    ],
    enemies: [
      { x: 730, y: 438, r: 18, hp: 30 },
      { x: 730, y: 365, r: 16, hp: 25 },
      { x: 740, y: 240, r: 15, hp: 20 }
    ]
  },
  {
    level: 6,
    ammo: 6,
    title: "ব্যারিকেড অ্যান্ড আর্চার",
    blocks: [
      { x: 580, y: 380, w: 25, h: 80, type: "stone", hp: 100 },
      { x: 700, y: 400, w: 25, h: 60, type: "wood", hp: 40 },
      { x: 770, y: 400, w: 25, h: 60, type: "wood", hp: 40 },
      { x: 690, y: 385, w: 115, h: 15, type: "wood", hp: 35 },
      { x: 735, y: 345, w: 25, h: 40, type: "tnt", hp: 15 }
    ],
    enemies: [
      { x: 640, y: 438, r: 18, hp: 30 },
      { x: 735, y: 438, r: 18, hp: 30 },
      { x: 820, y: 438, r: 18, hp: 30 }
    ]
  },
  {
    level: 7,
    ammo: 6,
    title: "লোহার খিলান",
    blocks: [
      { x: 660, y: 370, w: 28, h: 90, type: "stone", hp: 110 },
      { x: 760, y: 370, w: 28, h: 90, type: "stone", hp: 110 },
      { x: 650, y: 355, w: 150, h: 16, type: "stone", hp: 90 },
      { x: 700, y: 295, w: 20, h: 60, type: "wood", hp: 45 },
      { x: 740, y: 295, w: 20, h: 60, type: "wood", hp: 45 },
      { x: 690, y: 280, w: 80, h: 15, type: "wood", hp: 35 }
    ],
    enemies: [
      { x: 710, y: 438, r: 20, hp: 40 },
      { x: 720, y: 335, r: 16, hp: 25 },
      { x: 720, y: 260, r: 15, hp: 20 }
    ]
  },
  {
    level: 8,
    ammo: 7,
    title: "বিস্ফোরক ঘাঁটি",
    blocks: [
      { x: 640, y: 410, w: 30, h: 50, type: "tnt", hp: 15 },
      { x: 685, y: 380, w: 25, h: 80, type: "stone", hp: 90 },
      { x: 755, y: 380, w: 25, h: 80, type: "stone", hp: 90 },
      { x: 800, y: 410, w: 30, h: 50, type: "tnt", hp: 15 },
      { x: 670, y: 365, w: 125, h: 15, type: "wood", hp: 40 }
    ],
    enemies: [
      { x: 720, y: 438, r: 20, hp: 35 },
      { x: 720, y: 345, r: 18, hp: 30 },
      { x: 640, y: 380, r: 16, hp: 25 },
      { x: 800, y: 380, r: 16, hp: 25 }
    ]
  },
  {
    level: 9,
    ammo: 7,
    title: "উঁচু চূড়া",
    blocks: [
      { x: 710, y: 410, w: 40, h: 50, type: "stone", hp: 120 },
      { x: 700, y: 350, w: 60, h: 60, type: "stone", hp: 100 },
      { x: 690, y: 290, w: 80, h: 60, type: "wood", hp: 50 },
      { x: 710, y: 230, w: 40, h: 60, type: "wood", hp: 45 }
    ],
    enemies: [
      { x: 650, y: 438, r: 18, hp: 30 },
      { x: 790, y: 438, r: 18, hp: 30 },
      { x: 730, y: 205, r: 16, hp: 25 }
    ]
  },
  {
    level: 10,
    ammo: 8,
    title: "রাজকীয় দুর্গ (ফাইনাল বস)",
    blocks: [
      { x: 620, y: 360, w: 30, h: 100, type: "stone", hp: 130 },
      { x: 720, y: 360, w: 30, h: 100, type: "stone", hp: 130 },
      { x: 820, y: 360, w: 30, h: 100, type: "stone", hp: 130 },
      { x: 610, y: 345, w: 250, h: 18, type: "stone", hp: 100 },
      { x: 660, y: 285, w: 25, h: 60, type: "wood", hp: 50 },
      { x: 770, y: 285, w: 25, h: 60, type: "wood", hp: 50 },
      { x: 650, y: 270, w: 155, h: 15, type: "wood", hp: 45 }
    ],
    enemies: [
      { x: 670, y: 435, r: 18, hp: 35 },
      { x: 770, y: 435, r: 18, hp: 35 },
      { x: 715, y: 245, r: 24, hp: 60, isBoss: true } // Boss
    ]
  }
];
