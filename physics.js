/**
 * Matter.js ফিজিক্স ইঞ্জিন এবং অবজেক্ট ম্যানেজমেন্ট
 */
const { Engine, World, Bodies, Body, Composite, Constraint, Events, Vector } = Matter;

class PhysicsManager {
  constructor() {
    this.engine = Engine.create({
      enableSleeping: false
    });
    this.world = this.engine.world;
    this.engine.world.gravity.y = 1.0;
    this.bounds = { width: 1280, height: 720 };
    this.ground = null;
    this.boundaries = [];
  }

  initBounds(width, height) {
    this.bounds = { width, height };
    World.clear(this.world, false);

    const thickness = 100;
    // মাটি (Ground)
    this.ground = Bodies.rectangle(width / 2, height - 20, width * 2, 80, {
      isStatic: true,
      label: 'ground',
      friction: 0.8
    });
    // বাম সীমানা
    const wallLeft = Bodies.rectangle(-thickness / 2, height / 2, thickness, height * 2, {
      isStatic: true,
      label: 'boundary'
    });
    // ডান সীমানা
    const wallRight = Bodies.rectangle(width + thickness / 2, height / 2, thickness, height * 2, {
      isStatic: true,
      label: 'boundary'
    });
    // ছাদ
    const ceiling = Bodies.rectangle(width / 2, -thickness * 2, width * 2, thickness, {
      isStatic: true,
      label: 'boundary'
    });

    this.boundaries = [this.ground, wallLeft, wallRight, ceiling];
    World.add(this.world, this.boundaries);
  }

  clearWorld() {
    World.clear(this.world, false);
    World.add(this.world, this.boundaries);
  }

  update(delta = 1000 / 60) {
    Engine.update(this.engine, delta);
  }

  // --- হিরো তৈরির মেথড ---
  createHero(type, x, y) {
    const radius = 22;
    let density = 0.003;
    let restitution = 0.4;

    if (type === 'speed') {
      density = 0.005;
      restitution = 0.2;
    } else if (type === 'bomb') {
      density = 0.004;
    }

    const hero = Bodies.circle(x, y, radius, {
      density: density,
      restitution: restitution,
      friction: 0.6,
      label: 'hero'
    });

    hero.custom = {
      heroType: type,
      activated: false,
      launched: false,
      frozenTimer: 0,
      radius: radius
    };

    World.add(this.world, hero);
    return hero;
  }

  // --- দানব তৈরির মেথড ---
  createMonster(type, x, y) {
    let radius = 24;
    let hp = 100;

    if (type === 'armored') {
      radius = 26;
      hp = 250;
    } else if (type === 'boss') {
      radius = 48;
      hp = 700;
    } else if (type === 'flying') {
      radius = 22;
      hp = 80;
    } else if (type === 'shield') {
      radius = 26;
      hp = 180;
    }

    const body = Bodies.circle(x, y, radius, {
      density: 0.002,
      friction: 0.5,
      restitution: 0.1,
      label: 'monster'
    });

    body.custom = {
      monsterType: type,
      maxHp: hp,
      hp: hp,
      radius: radius,
      originX: x,
      originY: y,
      hoverOffset: 0,
      isShielded: type === 'shield'
    };

    World.add(this.world, body);
    return body;
  }

  // --- ব্লক তৈরির মেথড ---
  createBlock(type, x, y, width, height, angle = 0) {
    let hp = 50;
    let density = 0.002;
    let friction = 0.5;

    if (type === 'wood') {
      hp = 45;
      density = 0.0015;
      friction = 0.6;
    } else if (type === 'stone') {
      hp = 140;
      density = 0.004;
      friction = 0.8;
    } else if (type === 'metal') {
      hp = 400;
      density = 0.008;
      friction = 0.4;
    } else if (type === 'tnt') {
      hp = 10;
      density = 0.002;
    } else if (type === 'glass') {
      hp = 20;
      density = 0.001;
      friction = 0.2;
    }

    const body = Bodies.rectangle(x, y, width, height, {
      angle: angle,
      density: density,
      friction: friction,
      label: type === 'tnt' ? 'tnt' : 'block'
    });

    body.custom = {
      blockType: type,
      maxHp: hp,
      hp: hp,
      w: width,
      h: height
    };

    World.add(this.world, body);
    return body;
  }

  // চলন্ত প্ল্যাটফর্ম
  createMovingPlatform(x, y, width, height, rangeX, rangeY, speed) {
    const body = Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      friction: 0.9,
      label: 'platform'
    });

    body.custom = {
      originX: x,
      originY: y,
      rangeX: rangeX,
      rangeY: rangeY,
      speed: speed,
      timer: 0,
      w: width,
      h: height
    };

    World.add(this.world, body);
    return body;
  }

  // ঘূর্ণায়মান ব্লেড
  createRotatingBlade(x, y, length, width, speed) {
    const anchor = Bodies.circle(x, y, 6, { isStatic: true });
    const blade = Bodies.rectangle(x, y, length, width, {
      density: 0.01,
      label: 'blade'
    });

    const joint = Constraint.create({
      bodyA: anchor,
      bodyB: blade,
      pointB: { x: 0, y: 0 },
      stiffness: 1,
      length: 0
    });

    blade.custom = {
      rotSpeed: speed,
      length: length,
      width: width
    };

    World.add(this.world, [anchor, blade, joint]);
    return blade;
  }
}
