/** Sparse, low-contrast water glyphs and occasional small rising bubbles. */
const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const finite = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;
export const WATER_LIMITS = Object.freeze({ maxBubbles: 8, maxRipples: 8, minBurstInterval: 6, maxBurstInterval: 14 });

export class WaterField {
  constructor(seed = 33) {
    this.seed = seed >>> 0;
    this.width = 1; this.height = 1; this.time = 0;
    this.bands = []; this.bubbles = []; this.ripples = [];
    this.fishes = []; this.project = null;
    this.emissionCount = 0; this.lastEmissionAt = null;
    this.nextEmissionAt = 6 + this.random() * 5;
    this.background = null; this.backgroundContext = null;
  }
  random() {
    this.seed += 0x6d2b79f5;
    let n = this.seed;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  }
  resize(width, height) {
    const oldWidth = this.width, oldHeight = this.height;
    this.width = Math.max(1, finite(Number(width), 1));
    this.height = Math.max(1, finite(Number(height), 1));
    const sx = this.width / oldWidth, sy = this.height / oldHeight;
    for (const p of this.bubbles) {
      p.x *= sx; p.y *= sy; p.originX *= sx; p.originY *= sy; p.surface *= sy; p.rise *= sy;
    }
    for (const p of this.ripples) { p.x *= sx; p.y *= sy; }
    this.bands.length = 0;
    const mobile = this.width < 700;
    for (let i = 0; i < (mobile ? 7 : 9); i++) {
      this.bands.push({
        y: .035 + i * .111 + (this.random() - .5) * .045,
        x: -.09 + this.random() * .62,
        span: .32 + this.random() * .43,
        phase: this.random() * TAU,
        amplitude: 4 + this.random() * 10,
        period: 145 + this.random() * 190,
        speed: .055 + this.random() * .065,
        alpha: .23 + this.random() * .13,
        front: i === 1 || i === 6,
      });
    }
    this.background = null; this.backgroundContext = null;
  }
  emit(time) {
    this.lastEmissionAt = time;
    this.emissionCount++;
    this.nextEmissionAt = time + 6 + this.random() * 8;
    const count = Math.min(1 + Math.floor(this.random() * 4), WATER_LIMITS.maxBubbles - this.bubbles.length);
    const x = this.width * (.12 + this.random() * .76);
    const surface = this.height * (.035 + this.random() * .065);
    const startY = surface + this.height * (.12 + this.random() * .24);
    for (let i = 0; i < count; i++) {
      const life = 4.8 + this.random() * 3.4;
      const originX = x + (this.random() - .5) * 13;
      const originY = startY + (this.random() - .5) * 9;
      this.bubbles.push({
        x: originX, y: originY, originX, originY, surface,
        birth: time + i * (.15 + this.random() * .19), life,
        rise: (originY - surface) / life,
        r: .65 + this.random() * 1.75,
        phase: this.random() * TAU,
        drift: (this.random() - .5) * 1.8,
        alpha: .14 + this.random() * .20,
      });
    }
  }
  step(dt, time, fishes = [], project = null) {
    const elapsed = clamp(finite(Number(dt)), 0, .25);
    const now = finite(Number(time), this.time + elapsed);
    if (now < this.time - .01) {
      this.bubbles.length = 0; this.ripples.length = 0;
      this.nextEmissionAt = now + 6 + this.random() * 5;
      this.lastEmissionAt = null;
    }
    this.time = now;
    this.fishes = Array.isArray(fishes) ? fishes : [];
    this.project = typeof project === 'function' ? project : null;
    if (elapsed <= 0) return;
    if (now >= this.nextEmissionAt) this.emit(now);
    let write = 0;
    for (let i = 0; i < this.bubbles.length; i++) {
      const p = this.bubbles[i], age = now - p.birth;
      if (age >= p.life) {
        if (this.ripples.length < WATER_LIMITS.maxRipples) {
          this.ripples.push({ x: p.x, y: p.surface, birth: now, life: 2 + this.random() * .7, phase: p.phase });
        }
        continue;
      }
      if (age >= 0) {
        p.x = p.originX + p.drift * age + Math.sin(age * 1.6 + p.phase) * (1.5 + p.r);
        p.y = p.originY - age * p.rise;
      }
      this.bubbles[write++] = p;
    }
    this.bubbles.length = write;
    write = 0;
    for (const p of this.ripples) if (now - p.birth < p.life) this.ripples[write++] = p;
    this.ripples.length = write;
  }
  waveGlyphs(ctx, time, front) {
    const spacing = this.width < 700 ? 17 : 23;
    const fontSize = this.width < 700 ? 7.0 : 8.5;
    const scale = Math.min(this.width, this.height) / 720;
    ctx.font = `${fontSize}px "SFMono-Regular",Consolas,monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = front ? '#8cb6b8' : '#70959d';
    for (let b = 0; b < this.bands.length; b++) {
      const band = this.bands[b]; if (band.front !== front) continue;
      const start = band.x * this.width + Math.sin(time * .022 + band.phase) * this.width * .10;
      const span = band.span * this.width, count = Math.ceil(span / spacing);
      for (let i = 0; i <= count; i++) {
        const hash = ((i * 47 + b * 31) ^ (i * b * 13)) >>> 0;
        if (hash % 7 < 2) continue;
        const u = i / count, x = start + u * span;
        if (x < 0 || x > this.width) continue;
        const wave = x / band.period * TAU + time * band.speed + band.phase;
        const y = band.y * this.height + Math.sin(wave) * band.amplitude * scale
          + Math.sin(wave * .43 - time * .035) * 4 * scale;
        const endFade = Math.pow(Math.max(0, Math.sin(u * Math.PI)), .65);
        const swell = .66 + .34 * Math.sin(wave * .58 + time * .05);
        ctx.globalAlpha = band.alpha * endFade * swell * (front ? .67 : 1);
        const glyph = hash % 9 < 4 ? '~' : hash % 9 < 6 ? '.' : hash % 9 === 6 ? ',' : hash % 9 === 7 ? ':' : '-';
        ctx.fillText(glyph, x, y);
        // A few close companion strokes describe a moving wave crest, not fog.
        if (hash % 11 === 0) {
          ctx.globalAlpha *= .34;
          ctx.fillText('.', x + spacing * .4, y + 6 * scale);
        }
      }
    }
  }
  drawBack(ctx, time) {
    ctx.save();
    try {
      if (!this.background || this.backgroundContext !== ctx) {
        const g = ctx.createRadialGradient(this.width * .48, this.height * .38, 0,
          this.width * .48, this.height * .45, Math.max(this.width, this.height) * .72);
        g.addColorStop(0, '#07191f'); g.addColorStop(.6, '#041219'); g.addColorStop(1, '#020a10');
        this.background = g; this.backgroundContext = ctx;
      }
      ctx.globalAlpha = 1; ctx.fillStyle = this.background;
      ctx.fillRect(0, 0, this.width, this.height);
      this.waveGlyphs(ctx, finite(time), false);
    } finally { ctx.restore(); }
  }
  drawFront(ctx, time) {
    const now = finite(time);
    ctx.save();
    try {
      this.waveGlyphs(ctx, now, true);
      ctx.fillStyle = '#6b969c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `${this.width < 700 ? 6.5 : 8}px "SFMono-Regular",Consolas,monospace`;
      // Tail wash is a handful of points, rather than another full-screen layer.
      if (this.project) for (const fish of this.fishes) {
        if ((fish.opacity ?? 1) < .1 || !fish.nodes?.length) continue;
        const tail = fish.nodes[fish.nodes.length - 1], f = tail.forward;
        if (!f) continue;
        const p = this.project(tail);
        const q = this.project({ x: tail.x - f.x * 35, y: tail.y - f.y * 35, z: tail.z - f.z * 35 });
        if (![p?.x, p?.y, q?.x, q?.y].every(Number.isFinite)) continue;
        const dx = q.x - p.x, dy = q.y - p.y, n = Math.hypot(dx, dy) || 1;
        for (let j = 1; j < 8; j++) {
          const u = j / 8, drift = Math.sin(now * 1.0 - j * .8 + finite(fish.phase)) * u * 3;
          ctx.globalAlpha = .075 * (1 - u) * (fish.opacity ?? 1);
          ctx.fillText('.', p.x + dx * u - dy / n * drift, p.y + dy * u + dx / n * drift);
        }
      }
      for (const p of this.bubbles) {
        const age = now - p.birth; if (age < 0) continue;
        const fadeIn = Math.min(1, age / .6), fadeOut = Math.min(1, (p.life - age) / .7);
        ctx.globalAlpha = p.alpha * fadeIn * fadeOut;
        ctx.fillStyle = '#abc5c7';
        ctx.font = `${Math.max(4, p.r * 3.1)}px "SFMono-Regular",Consolas,monospace`;
        ctx.fillText(p.r > 1.15 ? 'o' : '.', p.x, p.y);
      }
      ctx.fillStyle = '#76999e';
      ctx.font = `${this.width < 700 ? 6 : 7.5}px "SFMono-Regular",Consolas,monospace`;
      for (const p of this.ripples) {
        const u = clamp((now - p.birth) / p.life, 0, 1), radius = 3 + u * 14;
        for (let j = 0; j < 8; j++) {
          const angle = j / 8 * TAU + p.phase;
          ctx.globalAlpha = .09 * (1 - u) * Math.sin(Math.PI * u);
          ctx.fillText(j % 2 ? '.' : '-', p.x + Math.cos(angle) * radius, p.y + Math.sin(angle) * radius * .32);
        }
      }
    } finally { ctx.restore(); }
  }
}
