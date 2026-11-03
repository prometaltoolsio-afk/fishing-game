/**
 * ৩০টি সম্পূর্ণ লেভেলের ডিজাইন ডেটাবেস
 */
const GAME_LEVELS = [
  // --- ১ থেকে ৫: সাধারণ নিশানা ও ফিজিক্স ---
  {
    id: 1,
    heroes: ['power', 'power', 'power'],
    monsters: [{ type: 'small', x: 900, y: 580 }],
    blocks: [
      { type: 'wood', x: 900, y: 620, w: 90, h: 25 },
      { type: 'wood', x: 860, y: 550, w: 20, h: 100 },
      { type: 'wood', x: 940, y: 550, w: 20, h: 100 },
      { type: 'wood', x: 900, y: 490, w: 100, h: 20 }
    ],
    moving: [],
    blades: []
  },
  {
    id: 2,
    heroes: ['power', 'speed', 'power'],
    monsters: [
      { type: 'small', x: 880, y: 580 },
      { type: 'small', x: 1020, y: 580 }
    ],
    blocks: [
      { type: 'wood', x: 880, y: 630, w: 80, h: 20 },
      { type: 'stone', x: 1020, y: 630, w: 80, h: 20 },
      { type: 'wood', x: 880, y: 520, w: 80, h: 20 },
      { type: 'wood', x: 1020, y: 520, w: 80, h: 20 }
    ],
    moving: [],
    blades: []
  },
  {
    id: 3,
    heroes: ['bomb', 'power', 'power'],
    monsters: [{ type: 'armored', x: 940, y: 580 }],
    blocks: [
      { type: 'stone', x: 900, y: 590, w: 30, h: 100 },
      { type: 'stone', x: 980, y: 590, w: 30, h: 100 },
      { type: 'wood', x: 940, y: 530, w: 110, h: 25 },
      { type: 'wood', x: 940, y: 480, w: 30, h: 80 }
    ],
    moving: [],
    blades: []
  },
  {
    id: 4,
    heroes: ['power', 'ice', 'bomb'],
    monsters: [
      { type: 'small', x: 860, y: 590 },
      { type: 'armored', x: 960, y: 590 },
      { type: 'small', x: 1060, y: 590 }
    ],
    blocks: [
      { type: 'wood', x: 860, y: 530, w: 70, h: 20 },
      { type: 'stone', x: 960, y: 530, w: 80, h: 25 },
      { type: 'wood', x: 1060, y: 530, w: 70, h: 20 },
      { type: 'glass', x: 960, y: 470, w: 120, h: 20 }
    ],
    moving: [],
    blades: []
  },
  {
    id: 5,
    heroes: ['speed', 'bomb', 'power', 'power'],
    monsters: [
      { type: 'small', x: 900, y: 400 },
      { type: 'armored', x: 900, y: 600 }
    ],
    blocks: [
      { type: 'stone', x: 850, y: 580, w: 30, h: 120 },
      { type: 'stone', x: 950, y: 580, w: 30, h: 120 },
      { type: 'metal', x: 900, y: 510, w: 140, h: 25 },
      { type: 'wood', x: 870, y: 440, w: 20, h: 100 },
      { type: 'wood', x: 930, y: 440, w: 20, h: 100 },
      { type: 'wood', x: 900, y: 380, w: 90, h: 20 }
    ],
    moving: [],
    blades: []
  },

  // --- ৬ থেকে ১০: চলন্ত বাধা ও নিখুঁত সময় ---
  {
    id: 6,
    heroes: ['speed', 'power', 'power'],
    monsters: [{ type: 'small', x: 1000, y: 590 }],
    blocks: [{ type: 'wood', x: 1000, y: 520, w: 90, h: 25 }],
    moving: [{ x: 700, y: 450, w: 20, h: 180, rx: 0, ry: 130, spd: 0.04 }],
    blades: []
  },
  {
    id: 7,
    heroes: ['ice', 'speed', 'power'],
    monsters: [
      { type: 'small', x: 950, y: 340 },
      { type: 'small', x: 950, y: 590 }
    ],
    blocks: [{ type: 'stone', x: 950, y: 520, w: 110, h: 25 }],
    moving: [{ x: 950, y: 390, w: 140, h: 25, rx: 120, ry: 0, spd: 0.03 }],
    blades: []
  },
  {
    id: 8,
    heroes: ['bomb', 'power', 'speed'],
    monsters: [{ type: 'armored', x: 1050, y: 580 }],
    blocks: [{ type: 'stone', x: 1050, y: 520, w: 90, h: 30 }],
    moving: [{ x: 750, y: 380, w: 30, h: 220, rx: 0, ry: 100, spd: 0.05 }],
    blades: [{ x: 900, y: 450, len: 140, w: 18, spd: 0.04 }]
  },
  {
    id: 9,
    heroes: ['speed', 'bomb', 'power'],
    monsters: [
      { type: 'small', x: 920, y: 590 },
      { type: 'small', x: 1080, y: 590 }
    ],
    blocks: [
      { type: 'metal', x: 920, y: 520, w: 80, h: 25 },
      { type: 'wood', x: 1080, y: 520, w: 80, h: 25 }
    ],
    moving: [
      { x: 650, y: 500, w: 20, h: 160, rx: 0, ry: 120, spd: 0.04 },
      { x: 800, y: 350, w: 20, h: 160, rx: 0, ry: 120, spd: -0.04 }
    ],
    blades: []
  },
  {
    id: 10,
    heroes: ['bomb', 'speed', 'ice', 'power'],
    monsters: [
      { type: 'armored', x: 1000, y: 580 },
      { type: 'small', x: 1000, y: 380 }
    ],
    blocks: [
      { type: 'stone', x: 950, y: 590, w: 25, h: 100 },
      { type: 'stone', x: 1050, y: 590, w: 25, h: 100 },
      { type: 'wood', x: 1000, y: 530, w: 130, h: 25 },
      { type: 'wood', x: 1000, y: 440, w: 90, h: 20 }
    ],
    moving: [{ x: 720, y: 420, w: 30, h: 180, rx: 0, ry: 110, spd: 0.04 }],
    blades: [{ x: 860, y: 380, len: 130, w: 18, spd: 0.05 }]
  },

  // --- ১১ থেকে ১৫: বিস্ফোরক ও চেইন রিয়্যাকশন ---
  {
    id: 11,
    heroes: ['power', 'bomb', 'speed'],
    monsters: [
      { type: 'small', x: 950, y: 580 },
      { type: 'armored', x: 1080, y: 580 }
    ],
    blocks: [
      { type: 'tnt', x: 850, y: 600, w: 45, h: 45 },
      { type: 'wood', x: 950, y: 620, w: 80, h: 20 },
      { type: 'wood', x: 950, y: 520, w: 80, h: 20 },
      { type: 'stone', x: 1080, y: 520, w: 80, h: 25 }
    ],
    moving: [],
    blades: []
  },
  {
    id: 12,
    heroes: ['speed', 'power', 'bomb'],
    monsters: [
      { type: 'armored', x: 920, y: 430 },
      { type: 'small', x: 1040, y: 590 }
    ],
    blocks: [
      { type: 'tnt', x: 920, y: 600, w: 45, h: 45 },
      { type: 'stone', x: 920, y: 530, w: 110, h: 25 },
      { type: 'wood', x: 920, y: 480, w: 30, h: 80 },
      { type: 'tnt', x: 1040, y: 520, w: 45, h: 45 }
    ],
    moving: [],
    blades: []
  },
  {
    id: 13,
    heroes: ['bomb', 'speed', 'power'],
    monsters: [
      { type: 'armored', x: 960, y: 590 },
      { type: 'armored', x: 1100, y: 590 }
    ],
    blocks: [
      { type: 'wood', x: 880, y: 600, w: 30, h: 100 },
      { type: 'tnt', x: 960, y: 520, w: 45, h: 45 },
      { type: 'metal', x: 960, y: 480, w: 120, h: 25 },
      { type: 'tnt', x: 1100, y: 520, w: 45, h: 45 }
    ],
    moving: [],
    blades: []
  },
  {
    id: 14,
    heroes: ['ice', 'power', 'bomb'],
    monsters: [
      { type: 'small', x: 900, y: 390 },
      { type: 'small', x: 1020, y: 390 },
      { type: 'armored', x: 960, y: 590 }
    ],
    blocks: [
      { type: 'tnt', x: 900, y: 590, w: 45, h: 45 },
      { type: 'tnt', x: 1020, y: 590, w: 45, h: 45 },
      { type: 'stone', x: 960, y: 520, w: 180, h: 25 },
      { type: 'wood', x: 960, y: 440, w: 140, h: 20 }
    ],
    moving: [],
    blades: []
  },
  {
    id: 15,
    heroes: ['speed', 'bomb', 'bomb', 'power'],
    monsters: [
      { type: 'armored', x: 880, y: 590 },
      { type: 'armored', x: 1000, y: 590 },
      { type: 'armored', x: 1120, y: 590 }
    ],
    blocks: [
      { type: 'tnt', x: 880, y: 520, w: 45, h: 45 },
      { type: 'tnt', x: 1000, y: 520, w: 45, h: 45 },
      { type: 'tnt', x: 1120, y: 520, w: 45, h: 45 },
      { type: 'stone', x: 1000, y: 460, w: 300, h: 25 }
    ],
    moving: [],
    blades: []
  },

  // --- ১৬ থেকে ২০: উড়ন্ত শত্রু ও উঁচুর চ্যালেঞ্জ ---
  {
    id: 16,
    heroes: ['speed', 'power', 'power'],
    monsters: [
      { type: 'flying', x: 880, y: 280 },
      { type: 'small', x: 980, y: 590 }
    ],
    blocks: [{ type: 'wood', x: 980, y: 530, w: 80, h: 20 }],
    moving: [],
    blades: []
  },
  {
    id: 17,
    heroes: ['ice', 'speed', 'bomb'],
    monsters: [
      { type: 'flying', x: 850, y: 250 },
      { type: 'flying', x: 1050, y: 320 },
      { type: 'small', x: 950, y: 590 }
    ],
    blocks: [{ type: 'stone', x: 950, y: 530, w: 90, h: 25 }],
    moving: [],
    blades: []
  },
  {
    id: 18,
    heroes: ['speed', 'bomb', 'power'],
    monsters: [
      { type: 'flying', x: 900, y: 300 },
      { type: 'armored', x: 1020, y: 580 }
    ],
    blocks: [
      { type: 'glass', x: 800, y: 300, w: 20, h: 200 },
      { type: 'stone', x: 1020, y: 520, w: 80, h: 25 },
      { type: 'tnt', x: 1020, y: 470, w: 45, h: 45 }
    ],
    moving: [],
    blades: []
  },
  {
    id: 19,
    heroes: ['ice', 'speed', 'bomb', 'power'],
    monsters: [
      { type: 'flying', x: 820, y: 240 },
      { type: 'flying', x: 1020, y: 240 },
      { type: 'armored', x: 920, y: 580 }
    ],
    blocks: [
      { type: 'wood', x: 920, y: 520, w: 100, h: 25 },
      { type: 'tnt', x: 920, y: 470, w: 45, h: 45 }
    ],
    moving: [{ x: 700, y: 320, w: 25, h: 160, rx: 0, ry: 90, spd: 0.05 }],
    blades: []
  },
  {
    id: 20,
    heroes: ['bomb', 'speed', 'ice', 'power'],
    monsters: [
      { type: 'flying', x: 880, y: 200 },
      { type: 'flying', x: 1040, y: 220 },
      { type: 'armored', x: 960, y: 580 }
    ],
    blocks: [
      { type: 'metal', x: 960, y: 520, w: 120, h: 25 },
      { type: 'glass', x: 850, y: 350, w: 20, h: 140 }
    ],
    moving: [],
    blades: [{ x: 750, y: 360, len: 140, w: 18, spd: 0.06 }]
  },

  // --- ২১ থেকে ২৫: ঢালযুক্ত শত্রু ও ভারী দুর্গ ---
  {
    id: 21,
    heroes: ['bomb', 'speed', 'power'],
    monsters: [{ type: 'shield', x: 950, y: 590 }],
    blocks: [
      { type: 'stone', x: 900, y: 590, w: 25, h: 100 },
      { type: 'wood', x: 950, y: 530, w: 90, h: 20 }
    ],
    moving: [],
    blades: []
  },
  {
    id: 22,
    heroes: ['bomb', 'speed', 'ice', 'power'],
    monsters: [
      { type: 'shield', x: 920, y: 590 },
      { type: 'armored', x: 1060, y: 590 }
    ],
    blocks: [
      { type: 'stone', x: 870, y: 590, w: 25, h: 100 },
      { type: 'metal', x: 990, y: 530, w: 180, h: 25 },
      { type: 'tnt', x: 1060, y: 480, w: 45, h: 45 }
    ],
    moving: [],
    blades: []
  },
  {
    id: 23,
    heroes: ['speed', 'bomb', 'bomb', 'power'],
    monsters: [
      { type: 'shield', x: 900, y: 420 },
      { type: 'shield', x: 900, y: 590 }
    ],
    blocks: [
      { type: 'metal', x: 850, y: 590, w: 25, h: 100 },
      { type: 'stone', x: 900, y: 530, w: 110, h: 25 },
      { type: 'wood', x: 860, y: 460, w: 20, h: 90 },
      { type: 'wood', x: 900, y: 370, w: 90, h: 20 }
    ],
    moving: [{ x: 740, y: 420, w: 20, h: 150, rx: 0, ry: 100, spd: 0.04 }],
    blades: []
  },
  {
    id: 24,
    heroes: ['ice', 'bomb', 'speed', 'power'],
    monsters: [
      { type: 'shield', x: 960, y: 590 },
      { type: 'flying', x: 1020, y: 280 }
    ],
    blocks: [
      { type: 'stone', x: 910, y: 590, w: 25, h: 100 },
      { type: 'tnt', x: 960, y: 520, w: 45, h: 45 },
      { type: 'wood', x: 960, y: 460, w: 100, h: 20 }
    ],
    moving: [],
    blades: [{ x: 820, y: 400, len: 150, w: 20, spd: 0.05 }]
  },
  {
    id: 25,
    heroes: ['bomb', 'speed', 'bomb', 'power'],
    monsters: [
      { type: 'shield', x: 920, y: 590 },
      { type: 'shield', x: 1080, y: 590 },
      { type: 'armored', x: 1000, y: 410 }
    ],
    blocks: [
      { type: 'metal', x: 870, y: 590, w: 25, h: 100 },
      { type: 'stone', x: 1000, y: 520, w: 220, h: 25 },
      { type: 'tnt', x: 1000, y: 460, w: 45, h: 45 }
    ],
    moving: [],
    blades: []
  },

  // --- ২৬ থেকে ৩০: বস যুদ্ধ (Boss Battles) ---
  {
    id: 26,
    heroes: ['bomb', 'bomb', 'speed', 'power'],
    monsters: [{ type: 'boss', x: 980, y: 560 }],
    blocks: [
      { type: 'stone', x: 910, y: 580, w: 30, h: 120 },
      { type: 'stone', x: 1050, y: 580, w: 30, h: 120 },
      { type: 'wood', x: 980, y: 500, w: 140, h: 25 },
      { type: 'tnt', x: 980, y: 450, w: 45, h: 45 }
    ],
    moving: [],
    blades: []
  },
  {
    id: 27,
    heroes: ['speed', 'bomb', 'ice', 'power', 'power'],
    monsters: [
      { type: 'boss', x: 1020, y: 560 },
      { type: 'flying', x: 900, y: 260 }
    ],
    blocks: [
      { type: 'metal', x: 940, y: 580, w: 30, h: 120 },
      { type: 'stone', x: 1020, y: 490, w: 140, h: 25 },
      { type: 'tnt', x: 1020, y: 440, w: 45, h: 45 }
    ],
    moving: [{ x: 750, y: 420, w: 25, h: 180, rx: 0, ry: 120, spd: 0.04 }],
    blades: []
  },
  {
    id: 28,
    heroes: ['bomb', 'bomb', 'speed', 'ice', 'power'],
    monsters: [
      { type: 'boss', x: 1050, y: 560 },
      { type: 'shield', x: 920, y: 590 }
    ],
    blocks: [
      { type: 'stone', x: 870, y: 590, w: 25, h: 100 },
      { type: 'stone', x: 970, y: 580, w: 25, h: 120 },
      { type: 'wood', x: 1050, y: 490, w: 120, h: 25 },
      { type: 'tnt', x: 1050, y: 440, w: 45, h: 45 }
    ],
    moving: [],
    blades: [{ x: 800, y: 380, len: 140, w: 18, spd: 0.05 }]
  },
  {
    id: 29,
    heroes: ['speed', 'bomb', 'bomb', 'ice', 'power'],
    monsters: [
      { type: 'boss', x: 1020, y: 560 },
      { type: 'flying', x: 860, y: 240 },
      { type: 'armored', x: 1140, y: 590 }
    ],
    blocks: [
      { type: 'metal', x: 940, y: 580, w: 25, h: 120 },
      { type: 'metal', x: 1090, y: 580, w: 25, h: 120 },
      { type: 'stone', x: 1020, y: 490, w: 150, h: 25 },
      { type: 'tnt', x: 1020, y: 440, w: 45, h: 45 },
      { type: 'tnt', x: 1140, y: 520, w: 45, h: 45 }
    ],
    moving: [{ x: 720, y: 440, w: 20, h: 180, rx: 0, ry: 130, spd: 0.04 }],
    blades: []
  },
  {
    id: 30,
    heroes: ['bomb', 'speed', 'ice', 'bomb', 'power'],
    monsters: [
      { type: 'boss', x: 1000, y: 540 },
      { type: 'shield', x: 880, y: 590 },
      { type: 'flying', x: 1000, y: 240 }
    ],
    blocks: [
      { type: 'stone', x: 830, y: 590, w: 25, h: 100 },
      { type: 'metal', x: 930, y: 580, w: 25, h: 120 },
      { type: 'metal', x: 1070, y: 580, w: 25, h: 120 },
      { type: 'stone', x: 1000, y: 470, w: 160, h: 25 },
      { type: 'tnt', x: 1000, y: 410, w: 50, h: 50 },
      { type: 'tnt', x: 880, y: 520, w: 45, h: 45 }
    ],
    moving: [{ x: 680, y: 400, w: 25, h: 200, rx: 0, ry: 140, spd: 0.05 }],
    blades: [{ x: 800, y: 320, len: 140, w: 18, spd: 0.05 }]
  }
];
