// WHATTHE — first-person stealth horror in a closed hospital ward.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const $ = (id) => document.getElementById(id);
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
if (IS_TOUCH) document.body.classList.add('touch');

const ASSET_PATHS = {
  monster: 'assets/monster.glb',
  generator: 'assets/generator.glb',
  locker: 'assets/locker.glb',
  door_a: 'assets/props/door_a.glb',
  door_b: 'assets/props/door_b.glb',
  exit_door: 'assets/props/exit_door.glb',
  bed: 'assets/props/bed.glb',
  wheelchair: 'assets/props/wheelchair.glb',
  iv: 'assets/props/iv.glb',
  cart: 'assets/props/cart.glb',
  cabinet: 'assets/props/cabinet.glb'
};
// 3D props replace the primitive versions when their file loads (h = target height, rot = turn so the long side runs along X)
const GLB_PROPS = { bed: { key: 'bed', h: 1.1, rot: Math.PI / 2 }, wheelchair: { key: 'wheelchair', h: 1.0 }, ivStand: { key: 'iv', h: 1.9 },
  cart: { key: 'cart', h: 1.0 }, cabinet: { key: 'cabinet', h: 1.8 } };

// ==========================================
// 1. MAP
// ==========================================
const CELL_SIZE = 4.0;
const WALL_HEIGHT = 3.4;
const EYE_HEIGHT = 1.62;
const CROUCH_HEIGHT = 1.05;
const MAP_SIZE = 25;
const CENTER_IDX = 12;

const BASE_GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,3,1,0,0,0,1],
  [1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,0,0,0,1,0,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1],
  [1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,0,0,0,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,1,1,0,1,0,0,0,1,0,1],
  [1,1,1,0,1,0,1,1,1,1,1,0,1,0,0,0,1,0,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,1,0,1,1,1,0,1,0,0,0,1,0,0,0,1],
  [1,1,1,1,1,0,1,0,1,1,1,0,0,0,1,0,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,1],
  [1,0,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
  [1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1],
  [1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,1],
  [1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const SPAWN = { r: 23, c: 12 };
const EXIT_CELL = { r: 1, c: 19 };
const DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];

function gridToWorld(r, c) { return { x: (c - CENTER_IDX) * CELL_SIZE, z: (r - CENTER_IDX) * CELL_SIZE }; }
function worldToGrid(x, z) { return { c: Math.round(x / CELL_SIZE + CENTER_IDX), r: Math.round(z / CELL_SIZE + CENTER_IDX) }; }
function wrapAngle(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
function isOpen(r, c) { return r >= 0 && r < MAP_SIZE && c >= 0 && c < MAP_SIZE && BASE_GRID[r][c] === 0; }
function openNeighbors(r, c) { return DIRS.filter(([dr, dc]) => isOpen(r + dr, c + dc)); }
function wallNeighbors(r, c) { return DIRS.filter(([dr, dc]) => !isOpen(r + dr, c + dc)); }
const manhattan = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
const cellKey = (r, c) => r * 100 + c;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rnd = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

const OPEN_CELLS = [];
for (let r = 0; r < MAP_SIZE; r++) for (let c = 0; c < MAP_SIZE; c++) if (isOpen(r, c)) OPEN_CELLS.push({ r, c });
const DEAD_ENDS = OPEN_CELLS.filter(({ r, c }) => openNeighbors(r, c).length === 1);

const LOCKER_COORDS = [
  { r: 3, c: 1 }, { r: 5, c: 7 }, { r: 3, c: 11 }, { r: 7, c: 9 }, { r: 9, c: 1 }, { r: 9, c: 17 },
  { r: 11, c: 11 }, { r: 13, c: 1 }, { r: 13, c: 17 }, { r: 17, c: 1 }, { r: 19, c: 9 }, { r: 21, c: 5 }
];
const LOCKER_KEYS = new Set(LOCKER_COORDS.map((l) => cellKey(l.r, l.c)));
// Generators + keycard spawn in dead ends that have no locker, away from the start.
const OBJECTIVE_CELLS = DEAD_ENDS.filter((d) => !LOCKER_KEYS.has(cellKey(d.r, d.c)) && manhattan(d, SPAWN) >= 7);
const PATROL_NODES = [
  { r: 3, c: 5 }, { r: 1, c: 11 }, { r: 3, c: 19 }, { r: 7, c: 21 }, { r: 11, c: 19 }, { r: 13, c: 11 },
  { r: 9, c: 5 }, { r: 15, c: 5 }, { r: 19, c: 3 }, { r: 23, c: 5 }, { r: 19, c: 15 }, { r: 21, c: 21 }
];
const CORRIDOR_NODES = PATROL_NODES.slice();

// ---- Enterable rooms: carved out of long interior wall runs, one hinged door each ----
// u = 0..1 across the room (west→east), v = 0..1 from the door wall (0) to the back wall (1)
const ROOMS = [
  { name: '간호사실', num: 'NS', r: 12, c0: 9, c1: 11, door: { r: 13, c: 10 }, tint: 0xb9c7d2, lamp: 'on',
    keySpot: [0.52, 0.62], spots: [[0.12, 0.3], [0.88, 0.3]],
    layout: [['desk', 0.24, 0.8, 'door'], ['officeChair', 0.24, 0.55, 'back'], ['desk', 0.76, 0.8, 'door'], ['officeChair', 0.8, 0.5, 'left'],
      ['cabinet', 0.04, 0.55, 'right'], ['cart', 0.95, 0.75, 'left'], ['locker', 0.97, 0.28, 'left']] },
  { name: '수술실', num: 'OR-2', r: 14, c0: 5, c1: 7, door: { r: 13, c: 6 }, tint: 0x9fbdb3, lamp: 'flicker',
    spots: [[0.86, 0.25], [0.12, 0.3]],
    layout: [['opTable', 0.5, 0.62, 'door'], ['surgLamp', 0.5, 0.62, 'door'], ['tray', 0.33, 0.38, 'door'], ['ivStand', 0.68, 0.4, 'door'],
      ['cabinet', 0.04, 0.6, 'right'], ['cabinet', 0.96, 0.6, 'left'], ['cart', 0.2, 0.88, 'door'], ['bloodPool', 0.52, 0.45, 'door']] },
  { name: '404 병실', num: '404', r: 4, c0: 5, c1: 7, door: { r: 5, c: 6 }, tint: 0xd2c4a6, lamp: 'flicker',
    spots: [[0.33, 0.25], [0.7, 0.25]],
    layout: [['bed', 0.17, 0.75, 'door'], ['bed', 0.5, 0.75, 'door'], ['bed', 0.83, 0.75, 'door'], ['curtain', 0.335, 0.66, 'right'], ['curtain', 0.665, 0.66, 'right'],
      ['ivStand', 0.06, 0.4, 'door'], ['wheelchair', 0.92, 0.3, 'left'], ['writing', 0.5, 1, 'door']] },
  { name: '비품 창고', num: 'B-09', r: 10, c0: 2, c1: 4, door: { r: 11, c: 3 }, tint: 0xa9a291, lamp: 'dead',
    keySpot: [0.5, 0.6], spots: [[0.22, 0.32], [0.8, 0.35]],
    layout: [['shelf', 0.1, 0.84, 'door'], ['shelf', 0.3, 0.84, 'door'], ['shelf', 0.72, 0.84, 'door'], ['shelf', 0.92, 0.84, 'door'],
      ['boxes', 0.06, 0.3, 'door'], ['boxes', 0.94, 0.25, 'left'], ['locker', 0.04, 0.55, 'right']] },
  { name: '영안실', num: 'B-13', r: 20, c0: 15, c1: 17, door: { r: 21, c: 16 }, tint: 0x90a3ac, lamp: 'dead',
    spots: [[0.9, 0.3], [0.06, 0.5]],
    layout: [['morgueWall', 0.2, 0.88, 'door'], ['morgueWall', 0.8, 0.88, 'door'], ['gurneyBag', 0.32, 0.42, 'door'], ['gurneyBag', 0.72, 0.45, 'door'],
      ['bloodPool', 0.5, 0.6, 'door']] },
  { name: '직원 휴게실', num: 'B-07', r: 16, c0: 9, c1: 11, door: { r: 17, c: 10 }, tint: 0xcbbba2, lamp: 'on',
    keySpot: [0.45, 0.72], spots: [[0.68, 0.3], [0.3, 0.28]],
    layout: [['sofa', 0.2, 0.84, 'door'], ['lowTable', 0.2, 0.52, 'door'], ['vending', 0.9, 0.84, 'door'], ['vending', 0.78, 0.84, 'door'],
      ['fallenChair', 0.62, 0.55, 'door'], ['locker', 0.03, 0.3, 'right']] }
];
const ROOM_T = 0.24;
const DOOR_W = 1.25;
const roomAt = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(-1));
ROOMS.forEach((rm, i) => {
  for (let c = rm.c0; c <= rm.c1; c++) roomAt[rm.r][c] = i;
  rm.s = rm.door.r > rm.r ? 1 : -1; // door on +z (south) or -z (north) side of the room
});
PATROL_NODES.push({ r: 12, c: 10 }, { r: 4, c: 6 }, { r: 20, c: 16 });
function makeGridState() {
  const g = BASE_GRID.map((row) => row.slice());
  ROOMS.forEach((rm) => { for (let c = rm.c0; c <= rm.c1; c++) g[rm.r][c] = 4; });
  return g;
}
// Room point from (u, v) layout coordinates
function roomPoint(rm, u, v) {
  const minX = (rm.c0 - CENTER_IDX) * CELL_SIZE - CELL_SIZE / 2 + ROOM_T, maxX = (rm.c1 - CENTER_IDX) * CELL_SIZE + CELL_SIZE / 2 - ROOM_T;
  const rz = (rm.r - CENTER_IDX) * CELL_SIZE, depth = CELL_SIZE - 2 * ROOM_T;
  const doorZ = rz + rm.s * (CELL_SIZE / 2 - ROOM_T);
  return { x: minX + u * (maxX - minX), z: doorZ - rm.s * v * depth };
}

// ==========================================
// 2. SETTINGS, DIFFICULTY, RECORDS, LORE
// ==========================================
const settings = { sens: 1.0, sound: 'on', quality: IS_TOUCH ? 'low' : 'high' };
try { Object.assign(settings, JSON.parse(localStorage.getItem('whatthe_settings') || '{}')); } catch (e) {}
function saveSettings() { try { localStorage.setItem('whatthe_settings', JSON.stringify(settings)); } catch (e) {} }

const DIFFS = {
  easy: { label: '쉬움', speed: 0.85, sight: 0.8, hear: 0.75, drain: 0.6, batteries: 7 },
  normal: { label: '보통', speed: 1.0, sight: 1.0, hear: 1.0, drain: 1.0, batteries: 5 },
  hard: { label: '어려움', speed: 1.15, sight: 1.2, hear: 1.3, drain: 1.4, batteries: 4 }
};
let diffKey = 'normal';
let diff = DIFFS.normal;

let records = {};
try { records = JSON.parse(localStorage.getItem('whatthe_records') || '{}'); } catch (e) {}
function saveRecords() { try { localStorage.setItem('whatthe_records', JSON.stringify(records)); } catch (e) {} }
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const NOTES = [
  { title: '간호 일지 — 3월 2일', body: '404호 환자가 밤마다 웃는다.\n입꼬리가 귀까지 올라간 채로.\n주치의는 안면 근육 경련이라고 했다.\n경련이 저렇게 오래 가나?' },
  { title: '정전 시 행동 요령', body: '1. 병동 밖으로 나가지 말 것.\n2. 예비 발전기는 각 복도 끝에 있다. 4대 모두 돌려야 비상구 잠금이 풀린다.\n3. 시동이 어긋나면 큰 소리가 난다. 조심.' },
  { title: '찢어진 메모', body: '그건 눈이 나쁘다. 대신 귀가 좋다.\n뛰지 마. 숙여.\n불빛도 꺼. 불빛은 본다.\n병을 던지면 그쪽으로 간다. 진짜야.' },
  { title: '보안팀 보고서', body: '출입 카드키 1장 분실.\n마지막 확인 위치: 막다른 복도 어딘가.\n비상구는 전력 복구 + 카드키 둘 다 있어야 열림.' },
  { title: '???', body: '사물함에 숨었는데 그게 봤어.\n문 앞에서 숨소리가 들려.\n웃고 있어.\n웃는 소리가 점점\n가까이' }
];

// ==========================================
// 3. AUDIO (procedural, no files)
// ==========================================
const SoundEngine = {
  ctx: null, master: null, muted: settings.sound === 'off', initialized: false, noiseBuf: null, ambientTimer: 8, hums: [],

  init() {
    if (this.initialized) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 6;
      this.master.connect(comp); comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.initialized = true;
      this.startAmbient();
    } catch (e) {}
  },
  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
  },
  ok() { return this.ctx && !this.muted; },
  out(pan) {
    if (pan !== undefined && this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      p.connect(this.master);
      return p;
    }
    return this.master;
  },
  noise(t, dur, o = {}) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = o.type || 'bandpass';
    fl.frequency.setValueAtTime(o.f || 800, t);
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    fl.Q.value = o.q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain || 0.2), t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl); fl.connect(g); g.connect(this.out(o.pan));
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
  },
  tone(t, dur, o = {}) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f || 100, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain || 0.2), t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.out(o.pan));
    osc.start(t); osc.stop(t + dur + 0.05);
  },
  startAmbient() {
    const ctx = this.ctx;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = o2.type = 'sawtooth'; o1.frequency.value = 41; o2.frequency.value = 41.6;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 105;
    const g = ctx.createGain(); g.gain.value = 0.075;
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.master); o1.start(); o2.start();
    const n = ctx.createBufferSource(); n.buffer = this.noiseBuf; n.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 300; nf.Q.value = 0.5;
    const ng = ctx.createGain(); ng.gain.value = 0.02;
    n.connect(nf); nf.connect(ng); ng.connect(this.master); n.start();
    const b = ctx.createOscillator(); b.type = 'square'; b.frequency.value = 120;
    const bf = ctx.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 2400; bf.Q.value = 9;
    const bg = ctx.createGain(); bg.gain.value = 0.005;
    b.connect(bf); bf.connect(bg); bg.connect(this.master); b.start();
  },
  tickAmbient(dt) {
    if (!this.ok()) return;
    this.ambientTimer -= dt;
    if (this.ambientTimer > 0) return;
    this.ambientTimer = 9 + Math.random() * 14;
    const t = this.ctx.currentTime, pan = Math.random() * 2 - 1, kind = Math.random();
    if (kind < 0.35) {
      this.tone(t, 2.2, { type: 'sawtooth', f: 70 + Math.random() * 60, f2: 40 + Math.random() * 30, gain: 0.03, attack: 0.6, pan });
      this.noise(t, 2.0, { type: 'bandpass', f: 600, f2: 300, q: 6, gain: 0.03, attack: 0.5, pan });
    } else if (kind < 0.6) {
      for (let i = 0; i < 3; i++) this.noise(t + i * (0.22 + Math.random() * 0.1), 0.12, { type: 'lowpass', f: 500, gain: 0.07, pan });
    } else if (kind < 0.8) {
      this.tone(t, 0.12, { type: 'sine', f: 1400, f2: 700, gain: 0.03, pan });
    } else { // far-away giggle
      for (let i = 0; i < 4; i++) this.tone(t + i * 0.13, 0.11, { type: 'triangle', f: 520 - i * 30, f2: 380, gain: 0.012, pan });
    }
  },
  playFootstep(kind) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    const g = kind === 'sprint' ? 0.2 : kind === 'crouch' ? 0.025 : 0.09;
    this.noise(t, 0.11, { type: 'lowpass', f: kind === 'sprint' ? 1100 : 650, gain: g });
    this.tone(t, 0.09, { f: kind === 'sprint' ? 95 : 72, f2: 38, gain: g * 0.65 });
  },
  playMonsterStep3D(dist, pan, chasing) {
    if (!this.ok() || dist > 32) return;
    const t = this.ctx.currentTime, prox = Math.pow(Math.max(0, 1 - dist / 32), 1.5);
    this.noise(t, 0.22, { type: 'lowpass', f: 250 + prox * 1400, gain: prox * (chasing ? 0.6 : 0.4), pan });
    this.tone(t, 0.25, { f: chasing ? 68 : 52, f2: 28, gain: prox * 0.32, pan });
  },
  playMonsterBreath(dist, pan) {
    if (!this.ok() || dist > 14) return;
    const t = this.ctx.currentTime, prox = 1 - dist / 14;
    this.noise(t, 1.0, { type: 'bandpass', f: 380, f2: 230, q: 4, gain: prox * 0.3, attack: 0.3, pan });
    this.tone(t, 1.0, { type: 'sawtooth', f: 58, f2: 46, gain: prox * 0.05, attack: 0.3, pan });
  },
  playScream(dist, pan) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, att = Math.max(0.15, 1 - dist / 40);
    this.tone(t, 1.3, { type: 'sawtooth', f: 980, f2: 360, gain: 0.07 * att, attack: 0.05, pan });
    this.tone(t, 1.3, { type: 'sawtooth', f: 1010, f2: 330, gain: 0.05 * att, attack: 0.05, pan });
    this.noise(t, 1.2, { type: 'bandpass', f: 1600, f2: 700, q: 2, gain: 0.18 * att, attack: 0.05, pan });
  },
  playGeneratorPowerUp() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.tone(t, 1.0, { type: 'sawtooth', f: 45, f2: 180, gain: 0.16, attack: 0.15 });
    this.noise(t, 1.1, { type: 'lowpass', f: 150, f2: 1200, gain: 0.16, attack: 0.3 });
  },
  playGaugeSuccess(stage) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, f = 420 + stage * 140;
    this.tone(t, 0.16, { type: 'triangle', f, f2: f * 1.35, gain: 0.18 });
  },
  playGaugeFail() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.45, { type: 'highpass', f: 1800, gain: 0.35 });
    [130, 175].forEach((f) => this.tone(t, 0.32, { type: 'sawtooth', f, f2: f * 0.55, gain: 0.14 }));
  },
  playHorrorStinger() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    [311.1, 329.6, 466.2, 622.3].forEach((f, i) => this.tone(t, 1.4, { type: 'sawtooth', f, f2: f * (i % 2 ? 0.86 : 1.14), gain: 0.06, attack: 0.02 }));
    this.noise(t, 1.1, { type: 'bandpass', f: 3200, f2: 500, q: 2, gain: 0.14 });
  },
  playHeartbeat(intensity) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, g = Math.min(0.5, 0.06 + intensity * 0.42);
    this.tone(t, 0.16, { f: 62, f2: 30, gain: g });
    this.tone(t + 0.17, 0.14, { f: 54, f2: 28, gain: g * 0.7 });
  },
  playPickup() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.tone(t, 0.1, { type: 'triangle', f: 540, gain: 0.12 });
    this.tone(t + 0.08, 0.2, { type: 'triangle', f: 820, gain: 0.12 });
  },
  playClick() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.04, { type: 'highpass', f: 3000, gain: 0.12 });
    this.tone(t, 0.03, { type: 'square', f: 1600, gain: 0.04 });
  },
  playPaper() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.35, { type: 'bandpass', f: 2600, q: 0.7, gain: 0.1, attack: 0.05 });
    this.noise(t + 0.18, 0.25, { type: 'bandpass', f: 3400, q: 0.7, gain: 0.07, attack: 0.04 });
  },
  playThrow() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.18, { type: 'bandpass', f: 900, f2: 300, q: 1.2, gain: 0.07, attack: 0.03 });
  },
  playShatter(dist, pan) {
    if (!this.ok() || dist > 45) return;
    const t = this.ctx.currentTime, a = Math.max(0.08, 1 - dist / 45);
    this.noise(t, 0.5, { type: 'highpass', f: 2800, gain: 0.55 * a, pan });
    this.noise(t, 0.12, { type: 'lowpass', f: 600, gain: 0.3 * a, pan });
    [2300, 3150, 4200, 5300].forEach((f, i) => this.tone(t + i * 0.025, 0.25, { type: 'triangle', f, f2: f * 0.97, gain: 0.05 * a, pan }));
  },
  playDoor(dist, pan, open) {
    if (!this.ok() || dist > 36) return;
    const t = this.ctx.currentTime, a = Math.max(0.1, 1 - dist / 36);
    if (open) {
      this.tone(t, 0.9, { type: 'sawtooth', f: 240, f2: 150, gain: 0.05 * a, attack: 0.1, pan });
      this.noise(t, 0.9, { type: 'bandpass', f: 950, f2: 480, q: 7, gain: 0.14 * a, attack: 0.12, pan });
    } else {
      this.noise(t, 0.2, { type: 'lowpass', f: 420, gain: 0.45 * a, pan });
      this.tone(t, 0.16, { f: 90, f2: 45, gain: 0.22 * a, pan });
    }
  },
  playLockerDoor() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.3, { type: 'bandpass', f: 900, f2: 400, q: 5, gain: 0.25 });
    this.tone(t, 0.2, { type: 'square', f: 180, f2: 55, gain: 0.08 });
    this.noise(t + 0.18, 0.08, { type: 'lowpass', f: 700, gain: 0.25 });
  },
  playJumpscare() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    [155, 210, 295, 415, 587, 830, 1140].forEach((f) => this.tone(t, 1.4, { type: 'sawtooth', f, f2: f * 1.5, gain: 0.12, attack: 0.008 }));
    this.noise(t, 1.5, { type: 'bandpass', f: 2600, f2: 800, q: 0.7, gain: 0.95, attack: 0.008 });
    this.noise(t, 1.3, { type: 'lowpass', f: 160, gain: 0.7, attack: 0.008 });
  },
  startHum(i) {
    if (!this.ctx || this.hums[i]) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 47 + i * 2.5;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 230;
    const g = ctx.createGain(); g.gain.value = 0;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.connect(f); f.connect(g);
    if (p) { g.connect(p); p.connect(this.master); } else g.connect(this.master);
    o.start();
    this.hums[i] = { o, g, p };
  },
  setHum(i, vol, pan) {
    const h = this.hums[i];
    if (!h) return;
    const t = this.ctx.currentTime;
    h.g.gain.setTargetAtTime(vol, t, 0.15);
    if (h.p) h.p.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.15);
  },
  stopHums() {
    this.hums.forEach((h) => { if (h) { try { h.o.stop(); } catch (e) {} } });
    this.hums = [];
  }
};

// ==========================================
// 4. PROCEDURAL TEXTURES
// ==========================================
let maxAniso = 4;
function canvasOf(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function finishTex(c, rx = 1, ry = 1, color = true) {
  const tex = new THREE.CanvasTexture(c);
  if (color) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = maxAniso;
  return tex;
}
const rand = (a, b) => a + Math.random() * (b - a);

// Photo textures (assets/tex) with the procedural ones as a fallback if a file fails to load
const texLoader = new THREE.TextureLoader();
function loadTex(url, rx, ry, fallback) {
  const t = texLoader.load(url, undefined, undefined, () => {
    const f = fallback();
    t.image = f.image; t.needsUpdate = true;
  });
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = maxAniso;
  return t;
}

function createWallTexture() {
  const [c, ctx] = canvasOf(512, 512);
  ctx.fillStyle = '#3f4844'; ctx.fillRect(0, 0, 512, 300);
  for (let y = 0; y < 300; y += 32) for (let x = 0; x < 512; x += 32) {
    const v = rand(-10, 10);
    ctx.fillStyle = `rgb(${66 + v},${74 + v},${70 + v})`;
    ctx.fillRect(x + 1, y + 1, 30, 30);
  }
  ctx.fillStyle = 'rgba(20,26,23,.9)';
  for (let x = 0; x <= 512; x += 32) ctx.fillRect(x - 1, 0, 2, 300);
  for (let y = 0; y <= 300; y += 32) ctx.fillRect(0, y - 1, 512, 2);
  // a few missing tiles
  for (let i = 0; i < 6; i++) { ctx.fillStyle = '#1a1d1b'; ctx.fillRect(Math.floor(rand(0, 16)) * 32 + 1, Math.floor(rand(0, 9)) * 32 + 1, 30, 30); }
  ctx.fillStyle = '#1f2925'; ctx.fillRect(0, 300, 512, 212);
  ctx.fillStyle = '#151a18'; ctx.fillRect(0, 294, 512, 12);
  ctx.fillStyle = '#7b8a83'; ctx.fillRect(0, 297, 512, 3);
  const gr = ctx.createLinearGradient(0, 380, 0, 512);
  gr.addColorStop(0, 'rgba(10,8,6,0)'); gr.addColorStop(1, 'rgba(10,8,6,.75)');
  ctx.fillStyle = gr; ctx.fillRect(0, 380, 512, 132);
  for (let i = 0; i < 14; i++) {
    const x = rand(0, 512), w = rand(2, 9), h = rand(40, 260);
    const g2 = ctx.createLinearGradient(0, 0, 0, h);
    g2.addColorStop(0, 'rgba(30,22,10,.55)'); g2.addColorStop(1, 'rgba(30,22,10,0)');
    ctx.fillStyle = g2; ctx.fillRect(x, 0, w, h);
  }
  for (let i = 0; i < 70; i++) {
    const sx = rand(0, 512), sy = rand(0, 512), sr = rand(6, 40);
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    const col = i % 14 === 0 ? '60,6,8' : '18,16,10';
    sg.addColorStop(0, `rgba(${col},${i % 14 === 0 ? 0.35 : 0.28})`); sg.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = sg; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  }
  ctx.strokeStyle = 'rgba(10,10,10,.6)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    let x = rand(0, 512), y = rand(0, 300); ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 8; k++) { x += rand(-18, 18); y += rand(4, 22); ctx.lineTo(x, y); }
    ctx.stroke();
  }
  return finishTex(c);
}

function createFloorTexture() {
  const [c, ctx] = canvasOf(512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 64) {
    const dark = ((x + y) / 64) % 2 === 0, v = rand(-6, 6);
    ctx.fillStyle = dark ? `rgb(${36 + v},${38 + v},${36 + v})` : `rgb(${70 + v},${72 + v},${66 + v})`;
    ctx.fillRect(x, y, 64, 64);
  }
  ctx.fillStyle = 'rgba(8,8,8,.8)';
  for (let x = 0; x <= 512; x += 64) ctx.fillRect(x - 1, 0, 2, 512);
  for (let y = 0; y <= 512; y += 64) ctx.fillRect(0, y - 1, 512, 2);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = i % 13 === 0 ? 'rgba(70,6,8,.3)' : 'rgba(14,12,8,.3)';
    ctx.beginPath(); ctx.ellipse(rand(0, 512), rand(0, 512), rand(4, 34), rand(3, 18), rand(0, 3), 0, Math.PI * 2); ctx.fill();
  }
  return finishTex(c, MAP_SIZE, MAP_SIZE);
}

function createCeilingTexture() {
  const [c, ctx] = canvasOf(256, 256);
  ctx.fillStyle = '#4a4a44'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) { ctx.fillStyle = `rgba(0,0,0,${rand(0.05, 0.2)})`; ctx.fillRect(rand(0, 256), rand(0, 256), 1.5, 1.5); }
  ctx.fillStyle = '#1e1e1b';
  ctx.fillRect(0, 0, 256, 4); ctx.fillRect(0, 0, 4, 256); ctx.fillRect(126, 0, 4, 256); ctx.fillRect(0, 126, 256, 4);
  ctx.fillStyle = '#0d0d0c'; ctx.fillRect(130, 4, 122, 122); // one missing ceiling tile
  for (let i = 0; i < 4; i++) {
    const x = rand(20, 236), y = rand(20, 236), r = rand(20, 60);
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, 'rgba(60,40,10,.5)'); g.addColorStop(1, 'rgba(60,40,10,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  }
  return finishTex(c, MAP_SIZE * 2, MAP_SIZE * 2);
}

function createExitDoorTexture() {
  const [c, ctx] = canvasOf(512, 448);
  ctx.fillStyle = '#2d3b36'; ctx.fillRect(0, 0, 512, 448);
  ctx.fillStyle = '#0d0f0e'; ctx.fillRect(120, 70, 272, 378);
  [[126, 76], [260, 76]].forEach(([x, y]) => {
    ctx.fillStyle = '#4b5452'; ctx.fillRect(x, y, 126, 372);
    ctx.fillStyle = '#3a4240'; ctx.fillRect(x + 14, y + 20, 98, 120);
    ctx.fillStyle = '#0b0c0c'; ctx.fillRect(x + 30, y + 36, 66, 70);
    ctx.fillStyle = '#9ca3af'; ctx.fillRect(x + (x < 200 ? 104 : 10), y + 190, 10, 46);
  });
  ctx.fillStyle = '#a16207';
  for (let i = 0; i < 12; i++) ctx.fillRect(126 + i * 23, 410, 12, 26);
  for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(40,20,8,.25)'; ctx.beginPath(); ctx.arc(rand(120, 392), rand(70, 448), rand(3, 20), 0, 7); ctx.fill(); }
  return finishTex(c);
}

function createRoomDoorTexture(num) {
  const [c, ctx] = canvasOf(256, 448);
  ctx.fillStyle = '#121513'; ctx.fillRect(0, 0, 256, 448);
  const base = ['#5c6660', '#64584a', '#4e5a63'][num % 3];
  ctx.fillStyle = base; ctx.fillRect(12, 12, 232, 436);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(24, 24, 208, 412);
  ctx.fillStyle = base; ctx.fillRect(30, 30, 196, 400);
  ctx.fillStyle = '#060707'; ctx.fillRect(84, 70, 88, 120); // window
  ctx.strokeStyle = '#2b2f2d'; ctx.lineWidth = 6; ctx.strokeRect(84, 70, 88, 120);
  ctx.strokeStyle = 'rgba(160,170,170,.25)'; ctx.lineWidth = 1; // wired glass
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(84 + i * 11, 70); ctx.lineTo(84 + i * 11, 190); ctx.stroke(); }
  ctx.fillStyle = '#b8b2a5'; ctx.fillRect(196, 236, 22, 10); ctx.fillRect(208, 226, 8, 30); // handle
  ctx.fillStyle = '#e8e2d4'; ctx.fillRect(86, 24, 84, 30);
  ctx.fillStyle = '#1b1b1b'; ctx.font = '700 22px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText(String(num), 128, 47);
  for (let i = 0; i < 26; i++) { ctx.fillStyle = `rgba(${i % 7 === 0 ? '80,10,10' : '30,22,12'},.25)`; ctx.beginPath(); ctx.arc(rand(20, 236), rand(20, 440), rand(3, 22), 0, 7); ctx.fill(); }
  if (num % 4 === 0) { // bloody handprint
    ctx.fillStyle = 'rgba(110,8,8,.75)';
    ctx.beginPath(); ctx.ellipse(150, 260, 16, 20, 0.2, 0, 7); ctx.fill();
    for (let f = 0; f < 4; f++) { ctx.beginPath(); ctx.ellipse(134 + f * 10, 232 - (f === 1 || f === 2 ? 6 : 0), 4, 12, 0, 0, 7); ctx.fill(); }
  }
  return finishTex(c);
}

function createWritingTexture(text) {
  const [c, ctx] = canvasOf(512, 256);
  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = 'rgba(120,6,8,.88)';
  ctx.font = '400 110px "Nanum Pen Script", "Noto Sans KR", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.save(); ctx.translate(256, 118); ctx.rotate(rand(-0.08, 0.08)); ctx.fillText(text, 0, 0); ctx.restore();
  for (let i = 0; i < 9; i++) { // drips
    const x = rand(90, 420), y = rand(130, 160), h = rand(30, 90);
    ctx.fillRect(x, y, rand(2, 4), h);
    ctx.beginPath(); ctx.arc(x + 1.5, y + h, 3, 0, 7); ctx.fill();
  }
  return finishTex(c);
}

function createRadialTex(inner, outer, size = 128, soft = 0.5) {
  const [c, ctx] = canvasOf(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner); g.addColorStop(soft, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  return finishTex(c);
}

function createBloodTex() {
  const [c, ctx] = canvasOf(256, 256);
  ctx.fillStyle = 'rgba(70,4,6,.9)';
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(128 + rand(-40, 40), 128 + rand(-40, 40), rand(20, 60), rand(15, 45), rand(0, 3), 0, 7); ctx.fill(); }
  for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc(128 + rand(-110, 110), 128 + rand(-110, 110), rand(2, 7), 0, 7); ctx.fill(); }
  return finishTex(c);
}
function createSmearTex() {
  const [c, ctx] = canvasOf(512, 128);
  const g = ctx.createLinearGradient(0, 0, 512, 0);
  g.addColorStop(0, 'rgba(70,4,6,.85)'); g.addColorStop(0.7, 'rgba(70,4,6,.45)'); g.addColorStop(1, 'rgba(70,4,6,0)');
  ctx.fillStyle = g;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(220, 64 + rand(-14, 14), 230, rand(8, 18), 0, 0, 7); ctx.fill(); }
  return finishTex(c);
}
function createPuddleTex() {
  const [c, ctx] = canvasOf(256, 256);
  ctx.fillStyle = 'rgba(12,14,14,.85)';
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(128 + rand(-50, 50), 128 + rand(-50, 50), rand(30, 70), rand(25, 55), rand(0, 3), 0, 7); ctx.fill(); }
  return finishTex(c);
}
function createPaperTex() {
  const [c, ctx] = canvasOf(128, 160);
  ctx.fillStyle = '#c9c2b2'; ctx.fillRect(4, 4, 120, 152);
  ctx.fillStyle = 'rgba(40,40,60,.55)';
  for (let y = 26; y < 150; y += 11) ctx.fillRect(16, y, rand(50, 96), 2);
  ctx.fillStyle = 'rgba(80,50,20,.25)'; ctx.beginPath(); ctx.arc(rand(20, 100), rand(20, 140), 26, 0, 7); ctx.fill();
  return finishTex(c);
}
function createMattressTex() {
  const [c, ctx] = canvasOf(256, 256);
  ctx.fillStyle = '#8e8a7c'; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 2;
  for (let i = 0; i < 256; i += 32) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke(); }
  for (let i = 0; i < 10; i++) {
    const x = rand(0, 256), y = rand(0, 256), r = rand(15, 60);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, i % 3 === 0 ? 'rgba(90,10,10,.5)' : 'rgba(90,70,30,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  }
  return finishTex(c);
}
function createSignTexture(text, color) {
  const [c, ctx] = canvasOf(256, 96);
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = color; ctx.font = '900 58px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 52);
  return finishTex(c);
}

// ==========================================
// 5. STATE
// ==========================================
let scene, camera, renderer;
let flashlight, ambientLight, hemiLight, playerGlow;
const lampPool = [];
const lampList = [];
let lampMats = null;
let lastTime = performance.now();
const clock = { t: 0 };

const gameState = {
  menu: true, running: false, paused: false, reading: false, gameOver: false, won: false, dying: false, dyingT: 0, jsStarted: false,
  isHidden: false, hideLocker: null, hideBaseYaw: 0,
  stamina: 100, exhausted: false, crouch: false, flashOn: true, battery: 100, bottles: 0,
  hasKeycard: false, generatorsOn: [false, false, false, false], genStages: [0, 0, 0, 0], activeGenIndex: null,
  gaugeNeedlePos: 0, gaugeNeedleDir: 1, gaugeSpeed: 115, gaugeTargetStart: 35, gaugeTargetWidth: 22,
  startTime: 0, elapsed: 0, heartbeatTimer: 0, bobPhase: 0, lastStepSign: 1, noiseRadius: 0, noiseLevel: 0, fear: 0,
  powerRestored: false, notesRead: new Set(), spotted: 0, thrown: 0, roomsSeen: new Set()
};

const player = { pos: new THREE.Vector3(0, EYE_HEIGHT, 44), vel: new THREE.Vector3(), yaw: 0, pitch: 0, radius: 0.4, fov: 72, eye: EYE_HEIGHT };
const input = { w: false, a: false, s: false, d: false, turnLeft: false, turnRight: false, turnUp: false, turnDown: false, sprint: false, sprintToggle: false, joyX: 0, joyY: 0 };

const interactables = [];
const generatorObjects = [];
const lockerObjects = [];
const propColliders = [];
const items = [];
const projectiles = [];
const glassDecals = [];
let gridState = makeGridState();
let keycardObj = null, exitSignMat = null, exitLight = null, dust = null;
const assets = {};
const shared = {};

const MONSTER_SCALE = 1.3;
const monster = {
  group: null, mixer: null, actions: {}, currentAction: null,
  pos: new THREE.Vector3(), heading: 0, state: 'PATROL',
  goalR: 3, goalC: 5, nextWaypointWorld: new THREE.Vector3(), repathTimer: 0,
  lostTimer: 0, searchTimer: 0, lastKnown: { r: 0, c: 0 }, huntLocker: null, lured: false,
  stepTimer: 0, breathTimer: 0, speed: 0
};

// Moving between cells: rooms connect to the corridor only through their door
function canStep(r, c, nr, nc, allowRooms = true) {
  const v = gridState[nr][nc];
  if (v !== 0 && v !== 4) return false;
  const a = roomAt[r][c], b = roomAt[nr][nc];
  if (a === b) return true;
  if (!allowRooms || (a >= 0 && b >= 0)) return false;
  const rm = ROOMS[a >= 0 ? a : b];
  const inside = a >= 0 ? { r, c } : { r: nr, c: nc }, outside = a >= 0 ? { r: nr, c: nc } : { r, c };
  return inside.c === rm.door.c && outside.r === rm.door.r && outside.c === rm.door.c;
}

function findNextStepBFS(startR, startC, targetR, targetC, allowRooms = true) {
  if (startR === targetR && startC === targetC) return { r: targetR, c: targetC };
  const visited = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(false));
  const parent = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(null));
  const queue = [{ r: startR, c: startC }];
  if (startR >= 0 && startR < MAP_SIZE && startC >= 0 && startC < MAP_SIZE) visited[startR][startC] = true;
  let found = false, head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (cur.r === targetR && cur.c === targetC) { found = true; break; }
    for (const [dr, dc] of DIRS) {
      const nr = cur.r + dr, nc = cur.c + dc;
      if (nr >= 0 && nr < MAP_SIZE && nc >= 0 && nc < MAP_SIZE && !visited[nr][nc] && canStep(cur.r, cur.c, nr, nc, allowRooms)) {
        visited[nr][nc] = true; parent[nr][nc] = cur; queue.push({ r: nr, c: nc });
      }
    }
  }
  if (!found) {
    for (const [dr, dc] of DIRS) if (isOpen(startR + dr, startC + dc)) return { r: startR + dr, c: startC + dc };
    return { r: startR, c: startC };
  }
  let step = { r: targetR, c: targetC };
  while (parent[step.r][step.c] && !(parent[step.r][step.c].r === startR && parent[step.r][step.c].c === startC)) step = parent[step.r][step.c];
  return step;
}

function isWallAt(x, z) {
  const g = worldToGrid(x, z);
  if (g.r < 0 || g.r >= MAP_SIZE || g.c < 0 || g.c >= MAP_SIZE) return true;
  const cell = gridState[g.r][g.c];
  return cell === 1 || cell === 3;
}

// Thin room walls and closed doors (axis-aligned boxes) also block sight and bottles
const thinWalls = [];
function segHitsBox(x1, z1, x2, z2, b) {
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dz = z2 - z1;
  const clip = (p, q) => {
    if (Math.abs(p) < 1e-9) return q >= 0;
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    return true;
  };
  return clip(-dx, x1 - b.minX) && clip(dx, b.maxX - x1) && clip(-dz, z1 - b.minZ) && clip(dz, b.maxZ - z1) && t0 <= t1;
}
function thinBlocked(x1, z1, x2, z2, ignore) {
  for (const b of thinWalls) { if (b.enabled && b !== ignore && segHitsBox(x1, z1, x2, z2, b)) return true; }
  return false;
}

function hasLOS(x1, z1, x2, z2, ignore) {
  const dx = x2 - x1, dz = z2 - z1, d = Math.hypot(dx, dz);
  const steps = Math.ceil(d / 0.3);
  for (let i = 1; i < steps; i++) { const t = i / steps; if (isWallAt(x1 + dx * t, z1 + dz * t)) return false; }
  return !thinBlocked(x1, z1, x2, z2, ignore);
}

// ==========================================
// 6. THREE.JS SCENE
// ==========================================
function initThreeScene() {
  const canvas = $('webgl-canvas');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020304);
  scene.fog = new THREE.FogExp2(0x030405, 0.06);

  camera = new THREE.PerspectiveCamera(player.fov, innerWidth / Math.max(1, innerHeight), 0.05, 60);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_TOUCH, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.quality === 'low' ? 1 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  ambientLight = new THREE.AmbientLight(0x6f7f9c, 0.75);
  scene.add(ambientLight);
  hemiLight = new THREE.HemisphereLight(0x8494b4, 0x1c1610, 0.55);
  scene.add(hemiLight);
  playerGlow = new THREE.PointLight(0xa8b4c8, 2.4, 8, 2);
  scene.add(playerGlow);

  flashlight = new THREE.SpotLight(0xffeccc, 45, 32, 0.7, 0.6, 1.1);
  flashlight.castShadow = settings.quality !== 'low';
  flashlight.shadow.mapSize.set(IS_TOUCH ? 512 : 1024, IS_TOUCH ? 512 : 1024);
  flashlight.shadow.camera.near = 0.3;
  flashlight.shadow.camera.far = 30;
  flashlight.shadow.bias = -0.0006;
  flashlight.shadow.normalBias = 0.02;
  scene.add(flashlight, flashlight.target);

  // A small pool of real lights that follows the nearest working ceiling lamps
  for (let i = 0; i < 4; i++) {
    const l = new THREE.PointLight(0xd6e6ff, 0, 11, 1.6);
    l.userData.lamp = null;
    scene.add(l);
    lampPool.push(l);
  }
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  if (!renderer || !camera) return;
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

function applyQuality() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.quality === 'low' ? 1 : 2));
  renderer.setSize(innerWidth, innerHeight);
  flashlight.castShadow = settings.quality !== 'low';
}

// ==========================================
// 7. ASSET LOADING
// ==========================================
function loadAssets(onProgress) {
  const loader = new GLTFLoader();
  const keys = Object.keys(ASSET_PATHS);
  const prog = {};
  const report = () => onProgress(keys.reduce((s, k) => s + (prog[k] || 0), 0) / keys.length);
  return Promise.all(keys.map((k) => new Promise((resolve) => {
    loader.load(ASSET_PATHS[k], (gltf) => { prog[k] = 1; report(); assets[k] = gltf; resolve(); },
      (e) => { if (e.total) { prog[k] = e.loaded / e.total; report(); } },
      (err) => { console.warn('asset load failed', k, err); prog[k] = 1; report(); resolve(); });
  })));
}

function prepModelMaterials(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      if (m && m.isMeshStandardMaterial) { m.metalness = Math.min(m.metalness, 0.45); if (m.map) m.map.anisotropy = maxAniso; }
    });
  });
}

function makeProp(gltf, targetH, rotY = 0) {
  const pivot = new THREE.Group();
  const inner = gltf.scene.clone(true);
  inner.rotation.y = rotY;
  inner.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(new THREE.Vector3());
  const s = targetH / size.y;
  inner.scale.setScalar(s);
  box.setFromObject(inner);
  const ctr = box.getCenter(new THREE.Vector3());
  inner.position.set(-ctr.x, -box.min.y, -ctr.z);
  prepModelMaterials(inner);
  pivot.add(inner);
  return { pivot, inner, w: size.x * s, h: size.y * s, d: size.z * s };
}

// Stand a prop against the wall of a cell (dead-end back wall first). Front (+Z) faces the open side.
function placeAgainstWall(r, c, depth, wallDir) {
  let wall = wallDir;
  if (!wall) {
    const open = openNeighbors(r, c);
    if (open.length === 1) wall = [-open[0][0], -open[0][1]];
    else wall = wallNeighbors(r, c)[0] || [1, 0];
  }
  const p = gridToWorld(r, c);
  const off = CELL_SIZE / 2 - depth / 2 - 0.06;
  return { x: p.x + wall[1] * off, z: p.z + wall[0] * off, rotY: Math.atan2(-wall[1], -wall[0]), wall };
}

function setCollider(col, x, z, rotY, w, d) {
  const swap = Math.abs(Math.sin(rotY)) > 0.5;
  const hw = (swap ? d : w) / 2, hd = (swap ? w : d) / 2;
  Object.assign(col, { minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd });
  return col;
}
function addCollider(x, z, rotY, w, d) {
  const col = setCollider({ enabled: true }, x, z, rotY, w, d);
  propColliders.push(col);
  return col;
}

function makeAnchor(x, y, z, data) {
  const a = new THREE.Object3D();
  a.position.set(x, y, z);
  a.userData = data;
  scene.add(a);
  interactables.push(a);
  return a;
}

function makeGlow(color, size, opacity = 0.9) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: shared.glowTex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.set(size, size, 1);
  return s;
}

// ==========================================
// 8. DECOR — hospital props built from primitives
// ==========================================
function buildSharedMaterials() {
  shared.glowTex = createRadialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)', 64, 0.05);
  shared.metal = new THREE.MeshStandardMaterial({ color: 0x80868a, roughness: 0.42, metalness: 0.7 });
  shared.rust = new THREE.MeshStandardMaterial({ color: 0x5b3e2b, roughness: 0.85, metalness: 0.3 });
  shared.enamel = new THREE.MeshStandardMaterial({ color: 0xb4b0a3, roughness: 0.6, metalness: 0.1 });
  shared.fabric = new THREE.MeshStandardMaterial({ map: createMattressTex(), roughness: 0.95 });
  shared.darkFabric = new THREE.MeshStandardMaterial({ color: 0x24221f, roughness: 0.95 });
  shared.rubber = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  shared.bag = new THREE.MeshStandardMaterial({ color: 0xcfe6ef, roughness: 0.15, transparent: true, opacity: 0.45 });
  shared.glass = new THREE.MeshStandardMaterial({ color: 0x3d5a2a, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.8 });
  shared.brownGlass = new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.15, transparent: true, opacity: 0.85 });
  shared.paper = new THREE.MeshStandardMaterial({ map: createPaperTex(), roughness: 0.9, side: THREE.DoubleSide });
  shared.cable = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.7 });
}

const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
const cyl = (r, h, mat, x, y, z, seg = 8) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y, z); return m; };

const PROP_BUILDERS = {
  bed() {
    const g = new THREE.Group();
    [-0.42, 0.42].forEach((z) => g.add(box(2.0, 0.06, 0.05, shared.metal, 0, 0.42, z)));
    [[-0.95, -0.42], [-0.95, 0.42], [0.95, -0.42], [0.95, 0.42]].forEach(([x, z]) => g.add(cyl(0.025, 0.42, shared.metal, x, 0.21, z)));
    g.add(box(1.9, 0.16, 0.86, shared.fabric, 0, 0.53, 0));
    g.add(box(0.4, 0.1, 0.6, shared.enamel, -0.7, 0.66, 0));
    g.add(box(0.05, 0.6, 0.9, shared.enamel, -1.0, 0.72, 0));
    g.add(box(0.05, 0.4, 0.9, shared.enamel, 1.0, 0.62, 0));
    // restraint straps
    [-0.2, 0.45].forEach((x) => g.add(box(0.08, 0.18, 0.9, shared.darkFabric, x, 0.55, 0)));
    return { g, w: 2.05, d: 0.95 };
  },
  wheelchair() {
    const g = new THREE.Group();
    g.add(box(0.48, 0.06, 0.45, shared.darkFabric, 0, 0.5, 0.02));
    g.add(box(0.48, 0.5, 0.05, shared.darkFabric, 0, 0.78, -0.22));
    [-0.29, 0.29].forEach((x) => {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.025, 6, 18), shared.metal);
      w.position.set(x, 0.3, -0.05); w.rotation.y = Math.PI / 2; g.add(w);
      g.add(cyl(0.012, 0.32, shared.metal, x * 0.85, 1.0, -0.25));
      g.add(cyl(0.05, 0.03, shared.rubber, x * 0.8, 0.05, 0.25));
    });
    return { g, w: 0.7, d: 0.7 };
  },
  ivStand() {
    const g = new THREE.Group();
    g.add(cyl(0.015, 1.9, shared.metal, 0, 0.95, 0));
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const leg = box(0.32, 0.03, 0.03, shared.metal, Math.cos(a) * 0.16, 0.04, Math.sin(a) * 0.16); leg.rotation.y = -a; g.add(leg); }
    g.add(box(0.36, 0.015, 0.015, shared.metal, 0, 1.88, 0));
    g.add(box(0.14, 0.24, 0.05, shared.bag, 0.12, 1.68, 0));
    g.add(cyl(0.004, 0.9, shared.bag, 0.12, 1.12, 0, 4));
    return { g, w: 0.45, d: 0.45 };
  },
  cart() {
    const g = new THREE.Group();
    [0.42, 0.85].forEach((y) => g.add(box(0.85, 0.03, 0.5, shared.metal, 0, y, 0)));
    [[-0.4, -0.22], [-0.4, 0.22], [0.4, -0.22], [0.4, 0.22]].forEach(([x, z]) => { g.add(cyl(0.015, 0.85, shared.metal, x, 0.43, z)); g.add(cyl(0.035, 0.03, shared.rubber, x, 0.035, z)); });
    for (let i = 0; i < 4; i++) g.add(cyl(0.035, 0.16, shared.brownGlass, -0.3 + i * 0.16, 0.95, rand(-0.12, 0.12)));
    g.add(box(0.3, 0.02, 0.22, shared.enamel, 0.15, 0.45, 0));
    return { g, w: 0.9, d: 0.55 };
  },
  cabinet() {
    const g = new THREE.Group();
    g.add(box(0.8, 1.8, 0.42, shared.enamel, 0, 0.9, 0));
    g.add(box(0.7, 1.0, 0.02, shared.glass, 0, 1.25, 0.215));
    [0.95, 1.3, 1.6].forEach((y) => g.add(box(0.7, 0.02, 0.36, shared.enamel, 0, y, 0)));
    for (let i = 0; i < 5; i++) g.add(cyl(0.03, 0.12, shared.brownGlass, -0.25 + i * 0.12, 1.02 + (i % 2) * 0.35, 0.05));
    return { g, w: 0.8, d: 0.45 };
  },
  fallenChair() {
    const g = new THREE.Group();
    const inner = new THREE.Group();
    inner.add(box(0.45, 0.04, 0.45, shared.rust, 0, 0.45, 0));
    inner.add(box(0.45, 0.45, 0.04, shared.rust, 0, 0.7, -0.21));
    [[-0.2, -0.2], [-0.2, 0.2], [0.2, -0.2], [0.2, 0.2]].forEach(([x, z]) => inner.add(cyl(0.015, 0.45, shared.metal, x, 0.22, z)));
    inner.rotation.z = Math.PI / 2; inner.position.set(0.45, 0.22, 0);
    g.add(inner);
    return { g, w: 0.9, d: 0.6 };
  }
};
const PROP_TYPES = ['bed', 'bed', 'wheelchair', 'ivStand', 'ivStand', 'cart', 'cart', 'cabinet', 'fallenChair'];

function instancedDecals(tex, list, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: opts.rough ?? 0.6, metalness: 0,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  list.forEach((d, i) => {
    e.set(-Math.PI / 2, 0, d.rot, 'YXZ');
    e.set(-Math.PI / 2, 0, 0); q.setFromEuler(e);
    const qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), d.rot);
    qz.multiply(q);
    im.setMatrixAt(i, m4.compose(new THREE.Vector3(d.x, 0.012 + i * 0.0004, d.z), qz, new THREE.Vector3(d.sx, d.sy, 1)));
  });
  im.receiveShadow = true;
  scene.add(im);
  return im;
}

function wallFace(r, c, wall, offset = 0.025) {
  const p = gridToWorld(r, c);
  const o = CELL_SIZE / 2 - offset;
  return { x: p.x + wall[1] * o, z: p.z + wall[0] * o, rotY: Math.atan2(-wall[1], -wall[0]), along: [-wall[0], wall[1]] };
}

const decorList = [];
function buildDecor() {
  const rnd = mulberry32(4041);
  const reserved = new Set();
  DEAD_ENDS.forEach((d) => reserved.add(cellKey(d.r, d.c)));
  LOCKER_COORDS.forEach((l) => reserved.add(cellKey(l.r, l.c)));
  OPEN_CELLS.forEach((cl) => { if (manhattan(cl, SPAWN) <= 2) reserved.add(cellKey(cl.r, cl.c)); });
  reserved.add(cellKey(2, 19));
  ROOMS.forEach((rm) => reserved.add(cellKey(rm.door.r, rm.door.c)));

  // --- standing props against walls ---
  const propCells = shuffle(OPEN_CELLS.filter((cl) => !reserved.has(cellKey(cl.r, cl.c)) && wallNeighbors(cl.r, cl.c).length > 0), rnd).slice(0, 34);
  propCells.forEach((cl, i) => {
    const type = PROP_TYPES[Math.floor(rnd() * PROP_TYPES.length)];
    const { g, w, d } = PROP_BUILDERS[type]();
    const walls = wallNeighbors(cl.r, cl.c);
    const wall = walls[Math.floor(rnd() * walls.length)];
    const pl = placeAgainstWall(cl.r, cl.c, d, wall);
    const slide = (rnd() - 0.5) * Math.max(0, CELL_SIZE - w - 0.6);
    const ax = -wall[0], az = wall[1]; // along-wall unit vector (perpendicular to wall normal)
    const x = pl.x + ax * slide, z = pl.z + az * slide;
    g.position.set(x, 0, z);
    g.rotation.y = pl.rotY + (type === 'wheelchair' || type === 'fallenChair' ? (rnd() - 0.5) * 0.8 : 0);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g);
    addCollider(x, z, pl.rotY, w + 0.05, d + 0.05);
    decorList.push({ type, x, z, rotY: pl.rotY });
    cl.prop = true;
    reserved.add(cellKey(cl.r, cl.c) + 0.5);
  });

  // --- wall decals: room doors, writing ---
  const faces = [];
  OPEN_CELLS.forEach((cl) => wallNeighbors(cl.r, cl.c).forEach((w) => {
    if (cl.r === 2 && cl.c === 19 && w[0] === -1) return; // exit door face
    if (ROOMS.some((rm) => rm.door.r === cl.r && rm.door.c === cl.c && roomAt[cl.r + w[0]][cl.c + w[1]] >= 0)) return; // real room door
    faces.push({ r: cl.r, c: cl.c, w });
  }));
  shuffle(faces, rnd);
  const doorGeo = new THREE.PlaneGeometry(1.3, 2.3);
  let num = 401;
  faces.slice(0, 22).forEach((f) => {
    const wf = wallFace(f.r, f.c, f.w);
    const m = new THREE.Mesh(doorGeo, new THREE.MeshStandardMaterial({ map: createRoomDoorTexture(num++), roughness: 0.7, metalness: 0.1,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    const slide = (rnd() - 0.5) * 1.6;
    m.position.set(wf.x + wf.along[0] * slide, 1.15, wf.z + wf.along[1] * slide);
    m.rotation.y = wf.rotY;
    m.receiveShadow = true;
    scene.add(m);
  });
  const WRITINGS = ['뛰지 마', '듣고 있다', '불 꺼', '도망쳐', '웃지 마', '404', '여기 없어', '보지 마', '숨어', '하하하하'];
  const writeGeo = new THREE.PlaneGeometry(2.4, 1.2);
  faces.slice(22, 22 + WRITINGS.length).forEach((f, i) => {
    const wf = wallFace(f.r, f.c, f.w, 0.03);
    const m = new THREE.Mesh(writeGeo, new THREE.MeshStandardMaterial({ map: createWritingTexture(WRITINGS[i]), transparent: true, depthWrite: false, roughness: 0.5,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.position.set(wf.x, 1.8 + rnd() * 0.4, wf.z);
    m.rotation.y = wf.rotY;
    scene.add(m);
  });

  // --- floor decals (instanced) ---
  const spot = (pad = 1.4) => {
    const cl = OPEN_CELLS[Math.floor(rnd() * OPEN_CELLS.length)];
    const p = gridToWorld(cl.r, cl.c);
    return { x: p.x + (rnd() - 0.5) * 2 * pad, z: p.z + (rnd() - 0.5) * 2 * pad, rot: rnd() * Math.PI * 2 };
  };
  const list = (n, f) => Array.from({ length: n }, f);
  instancedDecals(createBloodTex(), list(16, () => { const s = 0.9 + rnd() * 1.4; return { ...spot(), sx: s, sy: s }; }), { rough: 0.25 });
  instancedDecals(createSmearTex(), list(12, () => ({ ...spot(1.0), sx: 2.2 + rnd() * 1.6, sy: 0.6 + rnd() * 0.3 })), { rough: 0.35 });
  instancedDecals(createPuddleTex(), list(14, () => { const s = 1.2 + rnd() * 1.6; return { ...spot(), sx: s, sy: s * 0.8 }; }), { rough: 0.04 });
  instancedDecals(shared.paper.map, list(36, () => ({ ...spot(1.6), sx: 0.24, sy: 0.3 })), { rough: 0.9 });

  // --- broken ceiling panels + hanging cables ---
  const hangCells = shuffle(OPEN_CELLS.slice(), rnd).slice(0, 22);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x45453f, roughness: 0.95 });
  hangCells.slice(0, 10).forEach((cl) => {
    const p = gridToWorld(cl.r, cl.c);
    const m = box(1.0, 0.03, 0.6, panelMat, p.x + (rnd() - 0.5) * 2, WALL_HEIGHT - 0.32, p.z + (rnd() - 0.5) * 2);
    m.rotation.set(0.6 + rnd() * 0.4, rnd() * 3, 0.2);
    m.castShadow = true;
    scene.add(m);
  });
  hangCells.slice(10).forEach((cl) => {
    const p = gridToWorld(cl.r, cl.c);
    const len = 0.6 + rnd() * 1.1;
    const m = cyl(0.008, len, shared.cable, p.x + (rnd() - 0.5) * 2.4, WALL_HEIGHT - len / 2, p.z + (rnd() - 0.5) * 2.4, 4);
    m.rotation.z = (rnd() - 0.5) * 0.2;
    scene.add(m);
  });

  // --- floating dust ---
  const N = 380, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = rand(-7, 7); pos[i * 3 + 1] = rand(0.1, WALL_HEIGHT - 0.1); pos[i * 3 + 2] = rand(-7, 7); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xd9d2c0, size: 0.022, transparent: true, opacity: 0.38, depthWrite: false }));
  dust.frustumCulled = false;
  scene.add(dust);
  return reserved;
}

function updateDust(dt) {
  if (!dust) return;
  const a = dust.geometry.attributes.position, arr = a.array;
  const px = player.pos.x, pz = player.pos.z;
  for (let i = 0; i < arr.length; i += 3) {
    arr[i] += Math.sin(clock.t * 0.3 + i) * 0.02 * dt;
    arr[i + 1] -= 0.03 * dt;
    if (arr[i + 1] < 0.05) arr[i + 1] = WALL_HEIGHT - 0.1;
    if (arr[i] - px > 7) arr[i] -= 14; else if (arr[i] - px < -7) arr[i] += 14;
    if (arr[i + 2] - pz > 7) arr[i + 2] -= 14; else if (arr[i + 2] - pz < -7) arr[i + 2] += 14;
  }
  a.needsUpdate = true;
}


// ==========================================
// 8b. ROOMS — thin walls, hinged doors, furniture
// ==========================================
const doors = [];

function createRoomSignTexture(num, name) {
  const [c, ctx] = canvasOf(320, 80);
  ctx.fillStyle = '#d9d4c7'; ctx.fillRect(0, 0, 320, 80);
  ctx.fillStyle = '#1d2a33'; ctx.fillRect(0, 0, 92, 80);
  ctx.fillStyle = '#e8e2d4'; ctx.font = '700 30px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(num, 46, 42);
  ctx.fillStyle = '#1b1b1b'; ctx.font = '700 32px "Noto Sans KR", sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(name, 108, 42);
  for (let i = 0; i < 10; i++) { ctx.fillStyle = 'rgba(60,40,20,.2)'; ctx.beginPath(); ctx.arc(rand(0, 320), rand(0, 80), rand(3, 14), 0, 7); ctx.fill(); }
  return finishTex(c);
}
function createVendTexture() {
  const [c, ctx] = canvasOf(128, 256);
  ctx.fillStyle = '#0d0f12'; ctx.fillRect(0, 0, 128, 256);
  const cols = ['#c0392b', '#2e86c1', '#f1c40f', '#27ae60', '#e67e22', '#8e44ad'];
  for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) {
    ctx.fillStyle = cols[(r * 4 + k) % cols.length];
    if ((r * 7 + k * 3) % 5 === 0) continue; // sold out
    ctx.fillRect(10 + k * 28, 12 + r * 38, 18, 26);
  }
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, 0, 40, 256);
  return finishTex(c);
}

function roomMaterials() {
  if (shared.wood) return;
  shared.wood = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.7 });
  shared.cardboard = new THREE.MeshStandardMaterial({ color: 0x8a6d47, roughness: 0.95 });
  shared.steel = new THREE.MeshStandardMaterial({ color: 0x9aa1a5, roughness: 0.35, metalness: 0.8 });
  shared.bagMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.35, metalness: 0.1 });
  shared.screen = new THREE.MeshStandardMaterial({ color: 0x050805, emissive: 0x3aa36a, emissiveIntensity: 0.9 });
  shared.lampFace = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff4dc, emissiveIntensity: 2.2 });
  shared.curtain = new THREE.MeshStandardMaterial({ color: 0x86aab0, roughness: 0.9, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
  shared.vend = new THREE.MeshStandardMaterial({ map: createVendTexture(), emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0.0, roughness: 0.3 });
  shared.vend.emissiveMap = shared.vend.map; shared.vend.emissiveIntensity = 0.9;
  shared.vendBody = new THREE.MeshStandardMaterial({ color: 0x7a1d1d, roughness: 0.5, metalness: 0.3 });
  shared.blood = new THREE.MeshStandardMaterial({ map: createBloodTex(), transparent: true, depthWrite: false, roughness: 0.2, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
}

Object.assign(PROP_BUILDERS, {
  desk() {
    const g = new THREE.Group();
    g.add(box(1.4, 0.05, 0.7, shared.wood, 0, 0.74, 0));
    [[-0.66, -0.31], [-0.66, 0.31]].forEach(([x, z]) => g.add(box(0.05, 0.72, 0.05, shared.metal, x, 0.36, z)));
    g.add(box(0.42, 0.7, 0.66, shared.wood, 0.47, 0.36, 0));
    g.add(box(0.5, 0.36, 0.05, shared.rubber, -0.18, 1.0, -0.18));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.29), shared.screen); scr.position.set(-0.18, 1.0, -0.153); g.add(scr);
    g.add(box(0.1, 0.18, 0.1, shared.rubber, -0.18, 0.85, -0.2));
    g.add(box(0.42, 0.02, 0.14, shared.rubber, -0.18, 0.775, 0.12));
    const pap = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), shared.paper); pap.rotation.set(-Math.PI / 2, 0, 0.3); pap.position.set(0.35, 0.768, 0.08); g.add(pap);
    return { g, w: 1.4, d: 0.72 };
  },
  officeChair() {
    const g = new THREE.Group();
    g.add(box(0.48, 0.07, 0.48, shared.darkFabric, 0, 0.48, 0));
    g.add(box(0.46, 0.5, 0.06, shared.darkFabric, 0, 0.8, -0.22));
    g.add(cyl(0.03, 0.4, shared.metal, 0, 0.25, 0));
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const l = box(0.3, 0.03, 0.04, shared.metal, Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15); l.rotation.y = -a; g.add(l); }
    return { g, w: 0.55, d: 0.55 };
  },
  opTable() {
    const g = new THREE.Group();
    g.add(box(0.6, 0.06, 0.5, shared.steel, 0, 0.03, 0));
    g.add(cyl(0.12, 0.8, shared.steel, 0, 0.42, 0, 12));
    g.add(box(2.0, 0.08, 0.62, shared.steel, 0, 0.85, 0));
    g.add(box(1.9, 0.05, 0.56, shared.darkFabric, 0, 0.91, 0));
    [-0.5, 0.3].forEach((x) => g.add(box(0.07, 0.07, 0.66, shared.rubber, x, 0.92, 0)));
    return { g, w: 2.0, d: 0.66 };
  },
  surgLamp() {
    const g = new THREE.Group();
    const rodLen = WALL_HEIGHT - 2.3;
    g.add(cyl(0.025, rodLen, shared.steel, 0, 2.3 + rodLen / 2, 0));
    const head = cyl(0.42, 0.12, shared.enamel, 0, 2.25, 0, 20); g.add(head);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20), shared.lampFace); face.rotation.x = Math.PI / 2; face.position.y = 2.185; g.add(face);
    const gl = makeGlow(0xfff2d0, 1.6, 0.5); gl.position.y = 2.1; g.add(gl);
    return { g, w: 0, d: 0 };
  },
  tray() {
    const g = new THREE.Group();
    g.add(cyl(0.015, 0.95, shared.steel, 0, 0.47, 0));
    g.add(box(0.3, 0.03, 0.03, shared.steel, 0, 0.02, 0));
    g.add(box(0.5, 0.02, 0.35, shared.steel, 0, 0.95, 0));
    for (let i = 0; i < 5; i++) { const m = box(0.18, 0.012, 0.02, shared.steel, rand(-0.15, 0.15), 0.97, rand(-0.12, 0.12)); m.rotation.y = rand(0, 3); g.add(m); }
    return { g, w: 0.5, d: 0.4 };
  },
  shelf() {
    const g = new THREE.Group();
    [[-0.73, -0.23], [-0.73, 0.23], [0.73, -0.23], [0.73, 0.23]].forEach(([x, z]) => g.add(box(0.04, 2.0, 0.04, shared.metal, x, 1.0, z)));
    [0.1, 0.65, 1.2, 1.75].forEach((y) => {
      g.add(box(1.5, 0.03, 0.5, shared.metal, 0, y, 0));
      for (let k = 0; k < 3; k++) if (Math.random() < 0.75) {
        const bw = rand(0.25, 0.4), bh = rand(0.2, 0.4);
        const b = box(bw, bh, rand(0.3, 0.42), shared.cardboard, -0.5 + k * 0.5 + rand(-0.05, 0.05), y + 0.015 + bh / 2, 0);
        b.rotation.y = rand(-0.2, 0.2); g.add(b);
      }
    });
    return { g, w: 1.5, d: 0.5 };
  },
  boxes() {
    const g = new THREE.Group();
    g.add(box(0.6, 0.45, 0.5, shared.cardboard, -0.1, 0.225, 0));
    const b2 = box(0.45, 0.35, 0.4, shared.cardboard, -0.05, 0.625, 0.02); b2.rotation.y = 0.3; g.add(b2);
    const b3 = box(0.4, 0.3, 0.35, shared.cardboard, 0.32, 0.15, 0.1); b3.rotation.y = -0.4; g.add(b3);
    return { g, w: 0.9, d: 0.7 };
  },
  morgueWall() {
    const g = new THREE.Group();
    g.add(box(2.4, 2.2, 0.8, shared.steel, 0, 1.1, 0));
    for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) {
      if (r === 0 && k === 1) continue; // this drawer is pulled out
      g.add(box(0.7, 0.8, 0.03, shared.metal, -0.78 + k * 0.78, 0.6 + r * 1.0, 0.41));
      g.add(box(0.2, 0.04, 0.05, shared.rubber, -0.78 + k * 0.78, 0.6 + r * 1.0, 0.44));
    }
    g.add(box(0.7, 0.8, 0.03, shared.rubber, 0, 0.6, 0.39));
    g.add(box(0.66, 0.05, 1.2, shared.steel, 0, 0.42, 0.95));
    const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.75, 4, 10), shared.bagMat);
    bag.rotation.x = Math.PI / 2; bag.scale.set(1, 1, 0.6); bag.position.set(0, 0.56, 0.95); g.add(bag);
    return { g, w: 2.4, d: 0.8 };
  },
  gurneyBag() {
    const g = new THREE.Group();
    [-0.3, 0.3].forEach((z) => g.add(box(1.9, 0.05, 0.04, shared.steel, 0, 0.78, z)));
    g.add(box(1.9, 0.03, 0.62, shared.steel, 0, 0.8, 0));
    [[-0.9, -0.3], [-0.9, 0.3], [0.9, -0.3], [0.9, 0.3]].forEach(([x, z]) => { g.add(cyl(0.02, 0.78, shared.steel, x, 0.39, z)); g.add(cyl(0.04, 0.03, shared.rubber, x, 0.03, z)); });
    const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.25, 4, 10), shared.bagMat);
    bag.rotation.z = Math.PI / 2; bag.scale.set(0.55, 1, 1); bag.position.set(0, 0.95, 0); g.add(bag);
    const tag = box(0.06, 0.08, 0.005, shared.enamel, 0.85, 0.9, 0.31); g.add(tag);
    return { g, w: 1.95, d: 0.68 };
  },
  sofa() {
    const g = new THREE.Group();
    g.add(box(1.9, 0.42, 0.85, shared.darkFabric, 0, 0.21, 0));
    g.add(box(1.9, 0.55, 0.18, shared.darkFabric, 0, 0.66, -0.34));
    [-0.86, 0.86].forEach((x) => g.add(box(0.18, 0.62, 0.85, shared.darkFabric, x, 0.31, 0)));
    [-0.42, 0.42].forEach((x) => g.add(box(0.8, 0.12, 0.62, shared.fabric, x, 0.48, 0.05)));
    return { g, w: 1.95, d: 0.88 };
  },
  lowTable() {
    const g = new THREE.Group();
    g.add(box(1.0, 0.04, 0.55, shared.wood, 0, 0.42, 0));
    [[-0.45, -0.22], [-0.45, 0.22], [0.45, -0.22], [0.45, 0.22]].forEach(([x, z]) => g.add(box(0.04, 0.4, 0.04, shared.metal, x, 0.2, z)));
    g.add(cyl(0.04, 0.1, shared.enamel, 0.2, 0.49, 0.05, 10));
    return { g, w: 1.0, d: 0.55 };
  },
  vending() {
    const g = new THREE.Group();
    g.add(box(0.9, 1.95, 0.8, shared.vendBody, 0, 0.975, 0));
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.3), shared.vend); f.position.set(-0.08, 1.2, 0.402); g.add(f);
    g.add(box(0.5, 0.18, 0.02, shared.rubber, -0.08, 0.3, 0.41));
    const gl = makeGlow(0xbfd8ff, 1.8, 0.35); gl.position.set(-0.08, 1.2, 0.6); g.add(gl);
    return { g, w: 0.92, d: 0.82 };
  },
  curtain() {
    const g = new THREE.Group();
    g.add(box(2.4, 0.03, 0.03, shared.steel, 0, 2.6, 0));
    const geo = new THREE.PlaneGeometry(2.3, 2.15, 24, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 9) * 0.05);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, shared.curtain); m.position.y = 1.5; m.castShadow = true; g.add(m);
    return { g, w: 0, d: 0 };
  }
});

// Thin wall piece with corridor-side and room-side materials and UVs scaled to its size
function wallPiece(len, h, horizontal, corridorPositive, roomMat, wallMat, trimMat) {
  const geo = horizontal ? new THREE.BoxGeometry(len, h, ROOM_T) : new THREE.BoxGeometry(ROOM_T, h, len);
  const uv = geo.attributes.uv;
  const faces = horizontal ? [4, 5] : [0, 1];
  for (const f of faces) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setX(i, uv.getX(i) * len / CELL_SIZE);
    uv.setY(i, 1 - (1 - uv.getY(i)) * h / WALL_HEIGHT);
  }
  const mats = [trimMat, trimMat, trimMat, trimMat, trimMat, trimMat];
  mats[faces[0]] = corridorPositive ? wallMat : roomMat;
  mats[faces[1]] = corridorPositive ? roomMat : wallMat;
  const m = new THREE.Mesh(geo, mats);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function addThinCollider(minX, maxX, minZ, maxZ) {
  const col = { minX, maxX, minZ, maxZ, enabled: true };
  propColliders.push(col); thinWalls.push(col);
  return col;
}

function buildRooms(wallMat, trimMat) {
  roomMaterials();
  const DOOR_H = 2.35;
  ROOMS.forEach((rm, ri) => {
    const roomMat = wallMat.clone();
    roomMat.color.setHex(rm.tint);
    // walls on every edge that faces a corridor
    for (let c = rm.c0; c <= rm.c1; c++) {
      const p = gridToWorld(rm.r, c);
      DIRS.forEach(([dr, dc]) => {
        const nr = rm.r + dr, nc = c + dc;
        if (roomAt[nr][nc] === ri) return;
        if (BASE_GRID[nr][nc] === 1 && roomAt[nr][nc] < 0) return; // a solid wall block is already there
        const horizontal = dr !== 0;
        const sign = horizontal ? dr : dc;
        const off = CELL_SIZE / 2 - ROOM_T / 2;
        const cx = p.x + dc * off, cz = p.z + dr * off;
        const isDoor = dr === rm.s && c === rm.door.c;
        const addPiece = (len, h, y, along) => {
          const m = wallPiece(len, h, horizontal, sign > 0, roomMat, wallMat, trimMat);
          const x = horizontal ? cx + along : cx, z = horizontal ? cz : cz + along;
          m.position.set(x, y, z);
          scene.add(m);
          if (h > 2) {
            const hx = horizontal ? len / 2 : ROOM_T / 2, hz = horizontal ? ROOM_T / 2 : len / 2;
            addThinCollider(x - hx, x + hx, z - hz, z + hz);
          }
        };
        if (!isDoor) { addPiece(CELL_SIZE, WALL_HEIGHT, WALL_HEIGHT / 2, 0); return; }
        const side = (CELL_SIZE - DOOR_W) / 2;
        addPiece(side, WALL_HEIGHT, WALL_HEIGHT / 2, -(DOOR_W / 2 + side / 2));
        addPiece(side, WALL_HEIGHT, WALL_HEIGHT / 2, DOOR_W / 2 + side / 2);
        addPiece(DOOR_W, WALL_HEIGHT - DOOR_H, DOOR_H + (WALL_HEIGHT - DOOR_H) / 2, 0);
        // frame
        [-1, 1].forEach((k) => scene.add(box(0.08, DOOR_H, ROOM_T + 0.04, trimMat, cx + k * (DOOR_W / 2 + 0.04), DOOR_H / 2, cz)));
        scene.add(box(DOOR_W + 0.16, 0.08, ROOM_T + 0.04, trimMat, cx, DOOR_H + 0.04, cz));
        // name plate on the corridor side
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.28), new THREE.MeshStandardMaterial({ map: createRoomSignTexture(rm.num, rm.name), roughness: 0.6 }));
        plate.position.set(cx, DOOR_H + 0.42, cz + rm.s * (ROOM_T / 2 + 0.012));
        plate.rotation.y = rm.s > 0 ? 0 : Math.PI;
        scene.add(plate);
        buildRoomDoor(rm, ri, cx, cz, trimMat);
      });
    }
    // ceiling lamp
    const mid = roomPoint(rm, 0.5, 0.5);
    const lamp = box(1.3, 0.06, 0.32, lampMats[rm.lamp], mid.x, WALL_HEIGHT - 0.03, mid.z);
    scene.add(lamp);
    lampList.push({ x: mid.x, z: mid.z, type: rm.lamp });

    // furniture
    const minX = (rm.c0 - CENTER_IDX) * CELL_SIZE - CELL_SIZE / 2 + ROOM_T, maxX = (rm.c1 - CENTER_IDX) * CELL_SIZE + CELL_SIZE / 2 - ROOM_T;
    const rz = (rm.r - CENTER_IDX) * CELL_SIZE;
    const minZ = rz - CELL_SIZE / 2 + ROOM_T, maxZ = rz + CELL_SIZE / 2 - ROOM_T;
    const FACE = { door: [0, rm.s], back: [0, -rm.s], left: [-1, 0], right: [1, 0] };
    rm.layout.forEach(([type, u, v, face]) => {
      let { x, z } = roomPoint(rm, u, v);
      const fv = FACE[face];
      const rotY = Math.atan2(fv[0], fv[1]);
      if (type === 'bloodPool') {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), shared.blood);
        m.rotation.set(-Math.PI / 2, 0, rand(0, 3)); m.position.set(x, 0.014, z); m.receiveShadow = true;
        scene.add(m); return;
      }
      if (type === 'writing') {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshStandardMaterial({ map: createWritingTexture('하하하하하'), transparent: true, depthWrite: false, roughness: 0.5 }));
        m.position.set(x, 1.9, z + rm.s * 0.03); m.rotation.y = rotY;
        scene.add(m); return;
      }
      if (type === 'locker') {
        let prop;
        if (assets.locker) prop = makeProp(assets.locker, 2.15);
        else {
          const pivot = new THREE.Group();
          const b = box(0.9, 2.1, 0.9, new THREE.MeshStandardMaterial({ color: 0x3f4a3a, roughness: 0.6, metalness: 0.3 }), 0, 1.05, 0);
          pivot.add(b); prop = { pivot, inner: b, w: 0.9, h: 2.1, d: 0.9 };
        }
        const sw = Math.abs(Math.sin(rotY)) > 0.5;
        const hx = (sw ? prop.d : prop.w) / 2, hz = (sw ? prop.w : prop.d) / 2;
        x = Math.max(minX + hx + 0.02, Math.min(maxX - hx - 0.02, x)); z = Math.max(minZ + hz + 0.02, Math.min(maxZ - hz - 0.02, z));
        prop.pivot.position.set(x, 0, z); prop.pivot.rotation.y = rotY;
        scene.add(prop.pivot);
        const col = addCollider(x, z, rotY, prop.w, prop.d);
        const g = worldToGrid(x, z);
        const anchor = makeAnchor(x, 1.3, z, { type: 'LOCKER', label: '사물함에 숨기' });
        const locker = { pivot: prop.pivot, x, z, rotY, depth: prop.d, anchor, col, r: g.r, c: g.c };
        anchor.userData.locker = locker;
        lockerObjects.push(locker);
        return;
      }
      const { g, w, d } = PROP_BUILDERS[type]();
      if (w > 0) {
        const sw = Math.abs(Math.sin(rotY)) > 0.5;
        const hx = (sw ? d : w) / 2, hz = (sw ? w : d) / 2;
        x = Math.max(minX + hx + 0.02, Math.min(maxX - hx - 0.02, x));
        z = Math.max(minZ + hz + 0.02, Math.min(maxZ - hz - 0.02, z));
        addCollider(x, z, rotY, w, d);
      }
      g.position.set(x, 0, z);
      g.rotation.y = rotY;
      g.traverse((o) => { if (o.isMesh) { if (o.material !== shared.curtain) o.castShadow = true; o.receiveShadow = true; } });
      scene.add(g);
    });
  });
}

function buildRoomDoor(rm, ri, wallX, wallZ, trimMat) {
  const pivot = new THREE.Group();
  pivot.position.set(wallX - DOOR_W / 2, 0, wallZ - rm.s * (ROOM_T / 2 - 0.04));
  const model = assets[ri % 2 ? 'door_b' : 'door_a'];
  if (model) {
    const lf = makeProp(model, 2.32);
    lf.pivot.scale.x = (DOOR_W - 0.02) / lf.w;
    lf.pivot.position.set(DOOR_W / 2, 0, 0);
    if (rm.s < 0) lf.pivot.rotation.y = Math.PI; // painted side faces the corridor
    pivot.add(lf.pivot);
  } else {
    const leafMat = new THREE.MeshStandardMaterial({ map: createRoomDoorTexture(430 + ri * 3), roughness: 0.7, metalness: 0.1 });
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W - 0.02, 2.32, 0.06), [trimMat, trimMat, trimMat, trimMat, leafMat, leafMat]);
    leaf.position.set(DOOR_W / 2, 1.16, 0);
    leaf.castShadow = leaf.receiveShadow = true;
    pivot.add(leaf);
  }
  scene.add(pivot);
  const col = addThinCollider(wallX - DOOR_W / 2, wallX + DOOR_W / 2, wallZ - ROOM_T / 2, wallZ + ROOM_T / 2);
  const boundaryZ = (rm.r - CENTER_IDX) * CELL_SIZE + rm.s * CELL_SIZE / 2;
  const anchor = makeAnchor(wallX, 1.3, boundaryZ, { type: 'DOOR', label: '문 열기', ignoreCol: col });
  const door = { rm, pivot, col, anchor, open: false, angle: 0, target: 0, openAngle: rm.s * 2.85, x: wallX, z: boundaryZ };
  anchor.userData.door = door;
  doors.push(door);
}

function setDoor(door, open, by = 'player') {
  if (door.open === open) return true;
  if (!open && by === 'player') {
    const c = door.col, r = player.radius + 0.05;
    const px = Math.max(c.minX, Math.min(player.pos.x, c.maxX)), pz = Math.max(c.minZ, Math.min(player.pos.z, c.maxZ));
    if ((player.pos.x - px) ** 2 + (player.pos.z - pz) ** 2 < r * r) { showToast('문 앞을 비켜야 한다', '', 1200); return false; }
  }
  door.open = open;
  door.target = open ? door.openAngle : 0;
  door.col.enabled = !open;
  door.anchor.userData.label = open ? '문 닫기' : '문 열기';
  const dx = door.x - player.pos.x, dz = door.z - player.pos.z, d = Math.hypot(dx, dz);
  SoundEngine.playDoor(d, d > 0.01 ? (dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw)) / d : 0, open);
  if (by === 'player') noiseAt(door.x, door.z, gameState.crouch ? 3 : 6);
  return true;
}
function updateDoors(dt) {
  doors.forEach((d) => {
    if (Math.abs(d.target - d.angle) < 0.001) return;
    d.angle += (d.target - d.angle) * Math.min(1, dt * (d.open ? 4.5 : 10));
    d.pivot.rotation.y = d.angle;
  });
}
function resetDoors(randomOpen) {
  doors.forEach((d) => {
    const o = randomOpen && Math.random() < 0.25;
    d.open = o; d.target = d.angle = o ? d.openAngle : 0; d.col.enabled = !o;
    d.pivot.rotation.y = d.angle;
    d.anchor.userData.label = o ? '문 닫기' : '문 열기';
  });
}

// ==========================================
// 9. LEVEL
// ==========================================
let decorReserved = new Set();

function buildLevelGeometry() {
  gridState = makeGridState();
  buildSharedMaterials();
  Object.entries(GLB_PROPS).forEach(([name, cfg]) => {
    if (!assets[cfg.key]) return;
    PROP_BUILDERS[name] = () => { const p = makeProp(assets[cfg.key], cfg.h, cfg.rot || 0); return { g: p.pivot, w: p.w, d: p.d }; };
  });
  const wallTex = loadTex('assets/tex/wall.jpg', 1, 1, createWallTexture);
  const floorTex = loadTex('assets/tex/floor.jpg', MAP_SIZE, MAP_SIZE, createFloorTexture);
  const ceilTex = loadTex('assets/tex/ceil.jpg', MAP_SIZE * 2, MAP_SIZE * 2, createCeilingTexture);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xb4b4b4, map: wallTex, bumpMap: wallTex, bumpScale: 0.6, roughness: 0.78, metalness: 0.02 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xa6a6a6, map: floorTex, bumpMap: floorTex, bumpScale: 0.35, roughness: 0.42, metalness: 0.06 });
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x8c8c8c, map: ceilTex, roughness: 0.95 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x15181a, roughness: 0.55, metalness: 0.4 });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x3b2f27, roughness: 0.45, metalness: 0.6 });

  const span = MAP_SIZE * CELL_SIZE;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(span, span), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(span, span), ceilMat);
  ceil.rotation.x = Math.PI / 2; ceil.position.y = WALL_HEIGHT; ceil.receiveShadow = true; scene.add(ceil);

  // Walls — instanced, tinted per wing so each quarter of the ward feels different
  const wallCells = [], openCells = [];
  for (let r = 0; r < MAP_SIZE; r++) for (let c = 0; c < MAP_SIZE; c++) {
    if (gridState[r][c] === 1) wallCells.push([r, c]);
    else if (gridState[r][c] === 0) openCells.push([r, c]);
  }
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE), wallMat, wallCells.length);
  const plinths = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL_SIZE + 0.08, 0.22, CELL_SIZE + 0.08), trimMat, wallCells.length);
  const crowns = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL_SIZE + 0.06, 0.14, CELL_SIZE + 0.06), trimMat, wallCells.length);
  wallCells.forEach(([r, c], i) => {
    const p = gridToWorld(r, c);
    walls.setMatrixAt(i, m4.makeTranslation(p.x, WALL_HEIGHT / 2, p.z));
    plinths.setMatrixAt(i, m4.makeTranslation(p.x, 0.11, p.z));
    crowns.setMatrixAt(i, m4.makeTranslation(p.x, WALL_HEIGHT - 0.07, p.z));
    const north = r < 12, west = c < 12;
    if (north && west) col.setRGB(1, 1, 1);
    else if (north) col.setRGB(0.8, 0.93, 1.15);       // east wing: cold blue tile
    else if (west) col.setRGB(1.1, 0.98, 0.8);         // south-west: yellowed
    else col.setRGB(1.08, 0.85, 0.85);                 // south-east: sick pink
    walls.setColorAt(i, col);
  });
  walls.castShadow = walls.receiveShadow = true;
  plinths.receiveShadow = crowns.receiveShadow = true;
  scene.add(walls, plinths, crowns);

  // Pipes
  const pipeCells = openCells.filter(([r, c]) => r % 2 === 1 && (r * 3 + c) % 4 === 0);
  const pipes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.07, CELL_SIZE, 8), pipeMat, pipeCells.length);
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
  pipeCells.forEach(([r, c], i) => {
    const p = gridToWorld(r, c);
    pipes.setMatrixAt(i, m4.compose(new THREE.Vector3(p.x, WALL_HEIGHT - 0.25, p.z + 1.3), q, new THREE.Vector3(1, 1, 1)));
  });
  scene.add(pipes);

  // Fluorescent fixtures: steady / flickering / dead (dead ones come back when the power is restored)
  lampMats = {
    on: new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xd8ecff, emissiveIntensity: 1.6 }),
    flicker: new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xd8ecff, emissiveIntensity: 1.6 }),
    dead: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0xd8ecff, emissiveIntensity: 0, roughness: 0.6 })
  };
  const lampGeo = new THREE.BoxGeometry(1.3, 0.06, 0.32);
  const lampCells = { on: [], flicker: [], dead: [] };
  openCells.forEach(([r, c]) => {
    if ((r * 7 + c * 13) % 5 !== 0) return;
    const h = (r * 31 + c * 17) % 10;
    const type = h < 2 ? 'on' : h < 4 ? 'flicker' : 'dead';
    lampCells[type].push([r, c]);
    const p = gridToWorld(r, c);
    lampList.push({ x: p.x, z: p.z, type });
  });
  Object.keys(lampCells).forEach((k) => {
    const im = new THREE.InstancedMesh(lampGeo, lampMats[k], lampCells[k].length);
    lampCells[k].forEach(([r, c], i) => { const p = gridToWorld(r, c); im.setMatrixAt(i, m4.makeTranslation(p.x, WALL_HEIGHT - 0.03, p.z)); });
    scene.add(im);
  });

  // Exit door
  {
    const p = gridToWorld(EXIT_CELL.r, EXIT_CELL.c);
    const door = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE),
      [wallMat, wallMat, trimMat, trimMat, new THREE.MeshStandardMaterial({ map: createExitDoorTexture(), roughness: 0.6, metalness: 0.3 }), wallMat]);
    door.position.set(p.x, WALL_HEIGHT / 2, p.z);
    door.receiveShadow = true;
    scene.add(door);
    exitSignMat = new THREE.MeshBasicMaterial({ map: createSignTexture('EXIT', '#ff2a2a') });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.34, 0.08), exitSignMat);
    sign.position.set(p.x, WALL_HEIGHT - 0.42, p.z + CELL_SIZE / 2 + 0.05);
    if (assets.exit_door) {
      door.material[4] = wallMat;
      const ed = makeProp(assets.exit_door, 2.95);
      ed.pivot.position.set(p.x, 0, p.z + CELL_SIZE / 2 + ed.d / 2 + 0.01);
      scene.add(ed.pivot);
      sign.scale.set(0.42, 0.42, 1);
      sign.position.set(p.x, ed.h * 0.965, p.z + CELL_SIZE / 2 + ed.d + 0.02);
    }
    scene.add(sign);
    exitLight = new THREE.PointLight(0xff2020, 4, 9, 2);
    exitLight.position.set(p.x, WALL_HEIGHT - 0.6, p.z + CELL_SIZE / 2 + 0.6);
    scene.add(exitLight);
    makeAnchor(p.x, 1.4, p.z + CELL_SIZE / 2 + 0.2, { type: 'ESCAPE_DOOR', label: '탈출구 열기' });
  }

  // Generators — 4 models, moved to random dead ends every run
  for (let idx = 0; idx < 4; idx++) {
    let prop;
    if (assets.generator) prop = makeProp(assets.generator, 1.45);
    else {
      const pivot = new THREE.Group();
      const b = box(2.0, 1.3, 0.9, new THREE.MeshStandardMaterial({ color: 0x6b5a2a, roughness: 0.6 }), 0, 0.65, 0);
      b.castShadow = true; pivot.add(b);
      prop = { pivot, inner: b, w: 2.0, h: 1.3, d: 0.9 };
    }
    scene.add(prop.pivot);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff1a1a, emissiveIntensity: 2.5 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), lampMat);
    lamp.position.set(prop.w * 0.32, prop.h + 0.12, 0);
    const cage = cyl(0.035, 0.14, new THREE.MeshStandardMaterial({ color: 0x111111 }), prop.w * 0.32, prop.h + 0.03, 0, 6);
    const glow = makeGlow(0xff2020, 1.3, 0.7);
    glow.position.copy(lamp.position);
    prop.pivot.add(lamp, cage, glow);
    const anchor = makeAnchor(0, 1.0, 0, { type: 'GENERATOR', genIndex: idx, label: '발전기 가동' });
    const col = addCollider(0, 0, 0, prop.w + 0.1, prop.d + 0.1);
    generatorObjects.push({ ...prop, innerBase: prop.inner.position.clone(), lampMat, glow, anchor, col, r: 0, c: 0 });
  }

  // Keycard on a pedestal (moved every run)
  {
    const g = new THREE.Group();
    const ped = cyl(0.38, 0.95, new THREE.MeshStandardMaterial({ color: 0x23272b, roughness: 0.5, metalness: 0.5 }), 0, 0.475, 0, 16);
    ped.castShadow = ped.receiveShadow = true;
    const card = new THREE.Group();
    card.add(box(0.42, 0.27, 0.02, new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 0.35 }), 0, 0, 0));
    card.add(box(0.42, 0.05, 0.022, new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x38bdf8, emissiveIntensity: 2 }), 0, 0.06, 0));
    card.position.y = 1.25;
    const glow = makeGlow(0x38bdf8, 1.6, 0.8);
    glow.position.y = 1.25;
    g.add(ped, card, glow);
    scene.add(g);
    const anchor = makeAnchor(0, 1.2, 0, { type: 'KEYCARD', label: '카드키 줍기' });
    keycardObj = { group: g, card, glow, anchor };
  }

  // Lockers (fixed positions)
  LOCKER_COORDS.forEach((lk, idx) => {
    if (!isOpen(lk.r, lk.c)) return;
    let prop;
    if (assets.locker) prop = makeProp(assets.locker, 2.15);
    else {
      const pivot = new THREE.Group();
      const b = box(0.9, 2.1, 0.9, new THREE.MeshStandardMaterial({ color: 0x3f4a3a, roughness: 0.6, metalness: 0.3 }), 0, 1.05, 0);
      b.castShadow = true; pivot.add(b);
      prop = { pivot, inner: b, w: 0.9, h: 2.1, d: 0.9 };
    }
    const pl = placeAgainstWall(lk.r, lk.c, prop.d);
    prop.pivot.position.set(pl.x, 0, pl.z);
    prop.pivot.rotation.y = pl.rotY;
    scene.add(prop.pivot);
    const col = addCollider(pl.x, pl.z, pl.rotY, prop.w, prop.d);
    const anchor = makeAnchor(pl.x, 1.3, pl.z, { type: 'LOCKER', lockerId: idx, label: '사물함에 숨기' });
    const locker = { pivot: prop.pivot, x: pl.x, z: pl.z, rotY: pl.rotY, depth: prop.d, anchor, col, r: lk.r, c: lk.c };
    anchor.userData.locker = locker;
    lockerObjects.push(locker);
  });

  buildRooms(wallMat, trimMat);
  decorReserved = buildDecor();
  buildItemPool();
  buildMonsterMesh();
}

// ==========================================
// 10. PICKUPS (batteries, bottles, notes)
// ==========================================
function buildItemPool() {
  const battBody = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4, metalness: 0.5 });
  const battTop = new THREE.MeshStandardMaterial({ color: 0xc08a3e, roughness: 0.3, metalness: 0.9 });
  const make = (type) => {
    const g = new THREE.Group();
    let glowColor = 0xfff2c0;
    if (type === 'battery') {
      const b = cyl(0.045, 0.16, battBody, 0, 0.045, 0, 12); b.rotation.z = Math.PI / 2;
      const t = cyl(0.02, 0.02, battTop, 0.09, 0.045, 0, 8); t.rotation.z = Math.PI / 2;
      g.add(b, t); glowColor = 0xffe08a;
    } else if (type === 'bottle') {
      g.add(cyl(0.05, 0.2, shared.glass, 0, 0.1, 0, 10), cyl(0.018, 0.08, shared.glass, 0, 0.24, 0, 8));
      glowColor = 0xbfffcf;
    } else {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.3), shared.paper);
      p.rotation.x = -Math.PI / 2; p.position.y = 0.015; g.add(p);
      glowColor = 0xffffff;
    }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const glow = makeGlow(glowColor, 0.7, 0.45);
    glow.position.y = 0.2;
    g.add(glow);
    g.visible = false;
    scene.add(g);
    const label = type === 'battery' ? '배터리 줍기' : type === 'bottle' ? '빈 병 줍기' : '기록 읽기';
    const anchor = makeAnchor(0, 0.25, 0, { type: 'ITEM', label });
    anchor.visible = false;
    const item = { type, group: g, anchor, glow, active: false, noteIndex: -1 };
    anchor.userData.item = item;
    items.push(item);
  };
  for (let i = 0; i < 8; i++) make('battery');
  for (let i = 0; i < 7; i++) make('bottle');
  for (let i = 0; i < NOTES.length; i++) make('note');
}

function setItemActive(item, on, x = 0, z = 0) {
  item.active = on;
  item.group.visible = on;
  item.anchor.visible = on;
  if (on) {
    item.group.position.set(x, 0, z);
    item.group.rotation.y = Math.random() * Math.PI * 2;
    item.anchor.position.set(x, 0.25, z);
  }
}

// Randomise this run: generators, keycard, pickups.
function setupRun() {
  const cand = shuffle(OBJECTIVE_CELLS.slice());
  const gens = [];
  for (const c of cand) { if (gens.every((g) => manhattan(g, c) >= 8)) gens.push(c); if (gens.length === 4) break; }
  for (const c of cand) { if (gens.length === 4) break; if (!gens.includes(c)) gens.push(c); }
  const keyCell = cand.find((c) => !gens.includes(c) && manhattan(c, SPAWN) >= 10) || cand.find((c) => !gens.includes(c));

  generatorObjects.forEach((g, i) => {
    const cell = gens[i];
    const pl = placeAgainstWall(cell.r, cell.c, g.d);
    g.pivot.position.set(pl.x, 0, pl.z);
    g.pivot.rotation.y = pl.rotY;
    setCollider(g.col, pl.x, pl.z, pl.rotY, g.w + 0.1, g.d + 0.1);
    g.anchor.position.set(pl.x + Math.sin(pl.rotY) * 0.3, 1.0, pl.z + Math.cos(pl.rotY) * 0.3);
    g.r = cell.r; g.c = cell.c;
    g.lampMat.emissive.setHex(0xff1a1a); g.lampMat.color.setHex(0x220000);
    g.glow.material.color.setHex(0xff2020);
    g.anchor.userData.label = '발전기 가동';
  });

  let kp = gridToWorld(keyCell.r, keyCell.c);
  const keyRooms = ROOMS.filter((rm) => rm.keySpot);
  if (Math.random() < 0.45) { const rm = keyRooms[Math.floor(Math.random() * keyRooms.length)]; kp = roomPoint(rm, rm.keySpot[0], rm.keySpot[1]); }
  keycardObj.group.position.set(kp.x, 0, kp.z);
  keycardObj.group.visible = true;
  keycardObj.anchor.position.set(kp.x, 1.2, kp.z);
  keycardObj.anchor.visible = true;
  keycardObj.cell = keyCell;

  // pickups on free floor
  items.forEach((it) => setItemActive(it, false));
  const used = new Set([...gens, keyCell].map((c) => cellKey(c.r, c.c)));
  const free = shuffle(OPEN_CELLS.filter((c) => !used.has(cellKey(c.r, c.c)) && manhattan(c, SPAWN) >= 2));
  let fi = 0;
  const placeOn = (item, prefer) => {
    for (let tries = 0; tries < 40 && fi < free.length; tries++) {
      const cl = prefer ? prefer() : free[fi++];
      if (!cl) break;
      const p = gridToWorld(cl.r, cl.c);
      const x = p.x + rand(-1.3, 1.3), z = p.z + rand(-1.3, 1.3);
      if (!isBlockedAt(x, z, 0.35)) { setItemActive(item, true, x, z); return; }
    }
  };
  const notes = items.filter((i) => i.type === 'note');
  const noteCells = [];
  // every room hides something: 2 notes, 2 batteries, 1 bottle, then the rest goes to the corridors
  const roomSpots = shuffle(ROOMS.flatMap((rm) => rm.spots.map(([u, v]) => roomPoint(rm, u, v))));
  const inRoom = new Set();
  const toRoom = (it) => { const p = roomSpots.pop(); if (p) { setItemActive(it, true, p.x, p.z); inRoom.add(it); } };
  const noteOrder = shuffle(notes.slice());
  noteOrder.forEach((n, i) => { n.noteIndex = notes.indexOf(n); if (i < 2) toRoom(n); });
  items.filter((i) => i.type === 'battery').slice(0, Math.min(2, diff.batteries)).forEach(toRoom);
  toRoom(items.find((i) => i.type === 'bottle'));
  notes.forEach((n, i) => {
    if (inRoom.has(n)) return;
    placeOn(n, () => {
      const c = free.find((cl) => noteCells.every((o) => manhattan(o, cl) >= 7) && !cl.taken);
      if (c) { c.taken = true; noteCells.push(c); }
      return c || free[fi++];
    });
  });
  free.forEach((c) => { delete c.taken; });
  items.filter((i) => i.type === 'battery').slice(0, diff.batteries).forEach((b) => { if (!inRoom.has(b)) placeOn(b); });
  items.filter((i) => i.type === 'bottle').forEach((b) => { if (!inRoom.has(b)) placeOn(b); });
}

// ==========================================
// 11. MONSTER
// ==========================================
function buildMonsterMesh() {
  const group = new THREE.Group();
  if (assets.monster) {
    const model = assets.monster.scene;
    model.scale.setScalar(MONSTER_SCALE);
    model.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; }
      if (o.isMesh && o.material && o.material.isMeshStandardMaterial) {
        o.material.metalness = Math.min(o.material.metalness, 0.2);
        o.material.roughness = Math.max(o.material.roughness, 0.55);
      }
    });
    group.add(model);
    monster.mixer = new THREE.AnimationMixer(model);
    const clip = (n) => assets.monster.animations.find((a) => a.name === n);
    const map = { walk: 'Limping_Walk_3_inplace', search: 'Elderly_Shaky_Walk_inplace', run: 'Lean_Forward_Sprint_inplace', lunge: 'Standard_Forward_Charge_inplace' };
    Object.keys(map).forEach((k) => { const c = clip(map[k]); if (c) monster.actions[k] = monster.mixer.clipAction(c); });
  } else {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.5, 4, 8), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
    body.position.y = 1.1; body.castShadow = true; group.add(body);
  }
  monster.group = group;
  scene.add(group);
}

function setMonsterAnim(name, timeScale = 1) {
  const next = monster.actions[name];
  if (!next) return;
  next.timeScale = timeScale;
  if (monster.currentAction === next) return;
  next.reset().setEffectiveWeight(1).play();
  if (monster.currentAction) next.crossFadeFrom(monster.currentAction, 0.35, false);
  monster.currentAction = next;
}

function resetMonster() {
  const spawn = gridToWorld(7, 11);
  monster.pos.set(spawn.x, 0, spawn.z);
  monster.nextWaypointWorld.copy(monster.pos);
  Object.assign(monster, { heading: 0, state: 'PATROL', huntLocker: null, lostTimer: 0, searchTimer: 0, repathTimer: 0, lured: false, speed: 0 });
  pickPatrolGoal(true);
  if (monster.group) monster.group.position.copy(monster.pos);
  setMonsterAnim('walk', 1);
}

function setGoalCell(r, c) { monster.goalR = r; monster.goalC = c; monster.repathTimer = 0; }

function pickPatrolGoal(random) {
  const pg = worldToGrid(player.pos.x, player.pos.z);
  let node;
  if (!random && Math.random() < 0.55) {
    const sorted = PATROL_NODES.slice().sort((a, b) => (Math.abs(a.r - pg.r) + Math.abs(a.c - pg.c)) - (Math.abs(b.r - pg.r) + Math.abs(b.c - pg.c)));
    node = sorted[Math.floor(Math.random() * 3)];
  } else node = PATROL_NODES[Math.floor(Math.random() * PATROL_NODES.length)];
  setGoalCell(node.r, node.c);
}

const flashOn = () => gameState.flashOn && gameState.battery > 0 && !gameState.isHidden;

function monsterCanSee() {
  if (gameState.isHidden) return false;
  const dx = player.pos.x - monster.pos.x, dz = player.pos.z - monster.pos.z;
  const d = Math.hypot(dx, dz);
  let range = (flashOn() ? 20 : 9) * diff.sight;
  if (gameState.crouch) range *= 0.65;
  if (d > range) return false;
  if (!hasLOS(monster.pos.x, monster.pos.z, player.pos.x, player.pos.z)) return false;
  const close = gameState.crouch && !flashOn() ? 2.2 : 4.2;
  if (d < close) return true;
  return Math.abs(wrapAngle(Math.atan2(dx, dz) - monster.heading)) < 1.15;
}

// A sound at (x,z) heard within `radius` makes it come and look.
function noiseAt(x, z, radius, lure = false) {
  if (monster.huntLocker || gameState.dying) return;
  if (monster.state === 'CHASE' && monster.lostTimer < 0.6) return;
  if (Math.hypot(monster.pos.x - x, monster.pos.z - z) > radius * diff.hear) return;
  const g = worldToGrid(x, z);
  monster.state = 'INVESTIGATE';
  monster.lured = lure;
  setGoalCell(g.r, g.c);
}

// ==========================================
// 12. COLLISION
// ==========================================
function isBlockedAt(worldX, worldZ, radius) {
  const offs = [[0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius],
    [radius * 0.7, radius * 0.7], [-radius * 0.7, radius * 0.7], [radius * 0.7, -radius * 0.7], [-radius * 0.7, -radius * 0.7]];
  for (const [ox, oz] of offs) if (isWallAt(worldX + ox, worldZ + oz)) return true;
  for (const b of propColliders) {
    if (!b.enabled) continue;
    const cx = Math.max(b.minX, Math.min(worldX, b.maxX));
    const cz = Math.max(b.minZ, Math.min(worldZ, b.maxZ));
    if ((worldX - cx) ** 2 + (worldZ - cz) ** 2 < radius * radius) return true;
  }
  return false;
}

// ==========================================
// 13. GENERATOR GAUGE
// ==========================================
let currentHoveredObj = null;

function randomizeGaugeZone(stage) {
  const width = Math.max(14, 24 - stage * 4);
  const start = 14 + Math.random() * (82 - width - 14);
  gameState.gaugeTargetWidth = width;
  gameState.gaugeTargetStart = start;
  gameState.gaugeSpeed = 105 + stage * 26;
  const t = $('gauge-target-zone'), p = $('gauge-perfect-zone');
  t.style.left = `${start}%`; t.style.width = `${width}%`;
  const pw = Math.max(5, width * 0.3);
  p.style.left = `${start + (width - pw) / 2}%`; p.style.width = `${pw}%`;
}
function updateGaugeHUDDisplay() {
  const idx = gameState.activeGenIndex;
  if (idx === null) return;
  const stage = gameState.genStages[idx] || 0;
  $('gen-gauge-stage').textContent = `${stage} / 3`;
  $('gen-stage-bar').style.width = `${Math.round((stage / 3) * 100)}%`;
}
function openGeneratorGauge(idx) {
  gameState.activeGenIndex = idx;
  gameState.gaugeNeedlePos = 5;
  gameState.gaugeNeedleDir = 1;
  randomizeGaugeZone(gameState.genStages[idx] || 0);
  updateGaugeHUDDisplay();
  $('gen-gauge-hud').classList.add('show');
}
function closeGeneratorGauge() {
  gameState.activeGenIndex = null;
  $('gen-gauge-hud').classList.remove('show');
}
function flashGauge(cls, ms) {
  const hud = $('gen-gauge-hud');
  hud.classList.add(cls);
  setTimeout(() => hud.classList.remove(cls), ms);
}
function hallucinationFlash() {
  const hf = $('hallucination-flash');
  hf.classList.add('on');
  requestAnimationFrame(() => requestAnimationFrame(() => hf.classList.remove('on')));
}

function attemptGeneratorGaugeHit() {
  const idx = gameState.activeGenIndex;
  if (idx === null || gameState.generatorsOn[idx]) { closeGeneratorGauge(); return; }
  const pos = gameState.gaugeNeedlePos, start = gameState.gaugeTargetStart, end = start + gameState.gaugeTargetWidth;
  const gObj = generatorObjects[idx];
  if (pos >= start && pos <= end) {
    gameState.genStages[idx] = (gameState.genStages[idx] || 0) + 1;
    const curStage = gameState.genStages[idx];
    SoundEngine.playGaugeSuccess(curStage);
    flashGauge('ok', 140);
    if (curStage >= 3) {
      gameState.generatorsOn[idx] = true;
      SoundEngine.playGeneratorPowerUp();
      SoundEngine.startHum(idx);
      gObj.lampMat.emissive.setHex(0x22ff88);
      gObj.lampMat.color.setHex(0x002211);
      gObj.glow.material.color.setHex(0x22ff88);
      gObj.anchor.userData.label = '가동 중';
      closeGeneratorGauge();
      noiseAt(gObj.anchor.position.x, gObj.anchor.position.z, 30);
      updateHUD(true);
      const done = gameState.generatorsOn.filter(Boolean).length;
      if (done === 4) restorePower();
      else showToast(`발전기 가동 ${done}/4 — 엔진 소리가 울린다`, 'good');
    } else {
      gObj.anchor.userData.label = `발전기 가동 (${curStage}/3)`;
      updateGaugeHUDDisplay();
      randomizeGaugeZone(curStage);
    }
  } else {
    SoundEngine.playGaugeFail();
    gameState.genStages[idx] = Math.max(0, (gameState.genStages[idx] || 0) - 1);
    const curStage = gameState.genStages[idx];
    gObj.anchor.userData.label = `발전기 가동 (${curStage}/3)`;
    updateGaugeHUDDisplay();
    randomizeGaugeZone(curStage);
    flashGauge('fail', 220);
    hallucinationFlash();
    noiseAt(gObj.anchor.position.x, gObj.anchor.position.z, 40);
    showToast('합선! 그것이 소리를 들었다', 'bad');
  }
}

function restorePower() {
  gameState.powerRestored = true;
  showToast('전력 복구 — 비상구 잠금 해제. 그것도 깨어났다', 'bad', 3600);
  if (exitSignMat) exitSignMat.map = createSignTexture('EXIT', '#22ff66');
  if (exitLight) exitLight.color.setHex(0x22ff66);
  if (lampMats) lampMats.dead.emissiveIntensity = 0.8;
  SoundEngine.playHorrorStinger();
  const pg = worldToGrid(player.pos.x, player.pos.z);
  if (!monster.huntLocker) { monster.state = 'INVESTIGATE'; setGoalCell(pg.r, pg.c); }
}

// ==========================================
// 14. INTERACTION, ITEMS, NOTES, THROWING
// ==========================================
const camDirTmp = new THREE.Vector3();
const tmpV = new THREE.Vector3();

function setPrompt(text) {
  const el = $('interact-prompt');
  if (text) { $('prompt-text').textContent = text; el.classList.add('show'); }
  else el.classList.remove('show');
  $('btn-action-interact').classList.toggle('show', !!text);
}

function updateInteractionRaycast() {
  const dotEl = $('crosshair-dot');
  const useBtn = $('btn-action-interact');
  if (gameState.isHidden) {
    closeGeneratorGauge();
    setPrompt('밖으로 나오기');
    useBtn.textContent = '나가기';
    currentHoveredObj = { userData: { type: 'EXIT_LOCKER' } };
    return;
  }
  if (gameState.activeGenIndex !== null) {
    const gObj = generatorObjects[gameState.activeGenIndex];
    const d = Math.hypot(player.pos.x - gObj.anchor.position.x, player.pos.z - gObj.anchor.position.z);
    if (d > 3.6 || gameState.generatorsOn[gameState.activeGenIndex]) closeGeneratorGauge();
    else { setPrompt(null); useBtn.classList.add('show'); useBtn.textContent = '맞추기'; dotEl.classList.add('hot'); return; }
  }
  useBtn.textContent = '사용';
  currentHoveredObj = null;
  let best = 1e9;
  camera.getWorldDirection(camDirTmp);
  for (const a of interactables) {
    if (!a.visible) continue;
    tmpV.copy(a.position).sub(camera.position);
    const dist = tmpV.length();
    if (dist > 3.3) continue;
    const angle = camDirTmp.angleTo(tmpV.normalize());
    const limit = dist < 1.7 ? 0.95 : 0.55;
    if (angle > limit) continue;
    if (!hasLOS(player.pos.x, player.pos.z, a.position.x, a.position.z, a.userData.ignoreCol)) continue;
    const score = angle * 2 + dist * 0.3;
    if (score < best) { best = score; currentHoveredObj = a; }
  }
  if (currentHoveredObj) {
    let label = currentHoveredObj.userData.label;
    const it = currentHoveredObj.userData.item;
    if (it && it.type === 'bottle' && gameState.bottles >= 3) label = '병을 더 들 수 없다';
    setPrompt(label);
    dotEl.classList.add('hot');
  } else { setPrompt(null); dotEl.classList.remove('hot'); }
}

function showToast(msg, kind = '', ms = 2400) {
  const box = $('toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, ms);
}

function enterLocker(locker) {
  gameState.isHidden = true;
  gameState.hideLocker = locker;
  const fx = Math.sin(locker.rotY), fz = Math.cos(locker.rotY);
  player.pos.set(locker.x + fx * 0.08, 1.55, locker.z + fz * 0.08);
  player.vel.set(0, 0, 0);
  gameState.hideBaseYaw = locker.rotY + Math.PI;
  player.yaw = gameState.hideBaseYaw;
  player.pitch = -0.05;
  locker.pivot.visible = false;
  $('locker-overlay').classList.add('on');
  SoundEngine.playLockerDoor();
  const d = Math.hypot(monster.pos.x - locker.x, monster.pos.z - locker.z);
  if ((monster.state === 'CHASE' && monster.lostTimer < 0.6 && d < 14) ||
      (d < 9 && hasLOS(monster.pos.x, monster.pos.z, locker.x, locker.z) &&
        Math.abs(wrapAngle(Math.atan2(locker.x - monster.pos.x, locker.z - monster.pos.z) - monster.heading)) < 1.2)) {
    monster.huntLocker = locker;
  }
  if (monster.state === 'CHASE' && !monster.huntLocker) monster.lostTimer = 99;
}

function exitLocker() {
  const locker = gameState.hideLocker;
  gameState.isHidden = false;
  gameState.hideLocker = null;
  if (locker) {
    const fx = Math.sin(locker.rotY), fz = Math.cos(locker.rotY);
    player.pos.set(locker.x + fx * (locker.depth / 2 + 0.6), player.eye, locker.z + fz * (locker.depth / 2 + 0.6));
    locker.pivot.visible = true;
  }
  $('locker-overlay').classList.remove('on');
  SoundEngine.playLockerDoor();
  noiseAt(player.pos.x, player.pos.z, 8);
}

function pickupItem(item) {
  if (item.type === 'battery') {
    gameState.battery = Math.min(100, gameState.battery + 45);
    SoundEngine.playPickup();
    showToast('배터리 +45%', 'good', 1600);
  } else if (item.type === 'bottle') {
    if (gameState.bottles >= 3) { showToast('병을 더 들 수 없다', '', 1400); return; }
    gameState.bottles++;
    SoundEngine.playPickup();
    showToast(IS_TOUCH ? '빈 병 — 던지기 버튼으로 소리를 낸다' : '빈 병 — Q 또는 우클릭으로 던진다', '', 2200);
  } else {
    openNote(item.noteIndex);
  }
  setItemActive(item, false);
  updateHUD(true);
}

function openNote(i) {
  const n = NOTES[i];
  if (!n) return;
  gameState.notesRead.add(i);
  gameState.reading = true;
  for (const k of ['w', 'a', 's', 'd', 'sprint']) input[k] = false;
  $('note-meta').textContent = `B2 · 4병동 · 기록 ${gameState.notesRead.size}/${NOTES.length}`;
  $('note-title').textContent = n.title;
  $('note-body').textContent = n.body;
  $('note-hint').textContent = IS_TOUCH ? '탭하면 닫기' : 'E · 클릭하면 닫기';
  $('note-modal').classList.add('show');
  SoundEngine.playPaper();
}
function closeNote() {
  if (!gameState.reading) return;
  gameState.reading = false;
  $('note-modal').classList.remove('show');
  SoundEngine.playPaper();
  lastTime = performance.now();
}

const bottleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.22, 8);
function throwBottle() {
  if (!gameState.running || gameState.paused || gameState.reading || gameState.dying || gameState.isHidden) return;
  if (gameState.bottles <= 0) { showToast('던질 병이 없다', '', 1200); return; }
  gameState.bottles--;
  gameState.thrown++;
  camera.getWorldDirection(camDirTmp);
  const m = new THREE.Mesh(bottleGeo, shared.glass);
  m.castShadow = true;
  const pos = camera.position.clone().addScaledVector(camDirTmp, 0.45).add(new THREE.Vector3(0, -0.15, 0));
  m.position.copy(pos);
  scene.add(m);
  projectiles.push({ m, vel: camDirTmp.clone().multiplyScalar(13).add(new THREE.Vector3(0, 3.2, 0)) });
  SoundEngine.playThrow();
  updateHUD(true);
}

const glassMat = new THREE.MeshStandardMaterial({ color: 0x9fb89a, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.vel.y -= 14 * dt;
    const nx = p.m.position.x + p.vel.x * dt, ny = p.m.position.y + p.vel.y * dt, nz = p.m.position.z + p.vel.z * dt;
    if (isWallAt(nx, nz) || thinBlocked(p.m.position.x, p.m.position.z, nx, nz) || ny <= 0.08 || ny >= WALL_HEIGHT - 0.05) {
      shatterAt(p.m.position.x, Math.max(0.02, Math.min(ny, p.m.position.y)), p.m.position.z);
      scene.remove(p.m);
      projectiles.splice(i, 1);
      continue;
    }
    p.m.position.set(nx, ny, nz);
    p.m.rotation.x += dt * 12; p.m.rotation.z += dt * 7;
  }
}
function shatterAt(x, y, z) {
  const dx = x - player.pos.x, dz = z - player.pos.z, d = Math.hypot(dx, dz);
  const pan = d > 0.01 ? (dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw)) / d : 0;
  SoundEngine.playShatter(d, pan);
  // shards on the floor
  for (let k = 0; k < 6; k++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(rand(0.04, 0.1), rand(0.03, 0.07)), glassMat);
    s.rotation.set(-Math.PI / 2, 0, rand(0, 3));
    s.position.set(x + rand(-0.35, 0.35), 0.015, z + rand(-0.35, 0.35));
    scene.add(s); glassDecals.push(s);
  }
  while (glassDecals.length > 60) scene.remove(glassDecals.shift());
  noiseAt(x, z, 26, true);
}

function handleInteract() {
  if (gameState.reading) { closeNote(); return; }
  if (!gameState.running || gameState.gameOver || gameState.paused || gameState.dying) return;
  SoundEngine.resume();
  if (gameState.isHidden) { exitLocker(); return; }
  if (gameState.activeGenIndex !== null) { attemptGeneratorGaugeHit(); return; }
  if (!currentHoveredObj || !currentHoveredObj.userData) return;
  const data = currentHoveredObj.userData;
  if (data.type === 'GENERATOR') {
    if (!gameState.generatorsOn[data.genIndex]) openGeneratorGauge(data.genIndex);
  } else if (data.type === 'KEYCARD') {
    gameState.hasKeycard = true;
    keycardObj.group.visible = false;
    keycardObj.anchor.visible = false;
    SoundEngine.playPickup();
    updateHUD(true);
    showToast('카드키 획득', 'good');
  } else if (data.type === 'LOCKER') {
    enterLocker(data.locker);
  } else if (data.type === 'ITEM') {
    pickupItem(data.item);
  } else if (data.type === 'DOOR') {
    setDoor(data.door, !data.door.open);
  } else if (data.type === 'ESCAPE_DOOR') {
    const done = gameState.generatorsOn.filter(Boolean).length;
    if (done < 4 || !gameState.hasKeycard) {
      SoundEngine.playHorrorStinger();
      showToast(done < 4 ? `잠겨 있다 — 전력 없음 (${done}/4)` : '잠겨 있다 — 카드키가 필요하다', 'bad');
    } else {
      SoundEngine.playGeneratorPowerUp();
      triggerGameOver(true);
    }
  }
}

function toggleFlashlight() {
  if (!gameState.running || gameState.dying || gameState.paused || gameState.reading) return;
  if (!gameState.flashOn && gameState.battery <= 0) { showToast('배터리가 없다', 'bad', 1400); return; }
  gameState.flashOn = !gameState.flashOn;
  SoundEngine.playClick();
  updateHUD(true);
}
function toggleCrouch(force) {
  if (!gameState.running || gameState.dying || gameState.isHidden) return;
  gameState.crouch = force !== undefined ? force : !gameState.crouch;
  if (gameState.crouch) { input.sprintToggle = false; $('btn-action-sprint').classList.remove('on'); }
  $('btn-crouch').classList.toggle('on', gameState.crouch);
  updateHUD(true);
}

// ==========================================
// 15. HUD
// ==========================================
const hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function updateHUD(force) {
  const st = Math.round(gameState.stamina);
  if (force || hudCache.st !== st) { hudCache.st = st; $('stamina-bar').style.width = `${st}%`; }
  $('stamina-bar').classList.toggle('low', gameState.exhausted);
  const b = Math.ceil(gameState.battery);
  if (force || hudCache.b !== b) { hudCache.b = b; $('batt-bar').style.width = `${b}%`; }
  $('batt').classList.toggle('low', gameState.battery < 20);
  $('inv-light').classList.toggle('off', !gameState.flashOn || gameState.battery <= 0);
  $('btn-light').classList.toggle('off', !gameState.flashOn || gameState.battery <= 0);
  setText('bottle-count', String(gameState.bottles));
  setText('note-count', `${gameState.notesRead.size}/${NOTES.length}`);
  $('inv-key').classList.toggle('off', !gameState.hasKeycard);
  $('inv-key').classList.toggle('has', gameState.hasKeycard);
  $('crouch-tag').classList.toggle('on', gameState.crouch);
  $('btn-throw').classList.toggle('show', gameState.bottles > 0);
  setText('throw-label', `던지기 ${gameState.bottles}`);
  const lvl = gameState.noiseLevel;
  if (force || hudCache.lvl !== lvl) {
    hudCache.lvl = lvl;
    [...$('noise').children].forEach((el, i) => el.classList.toggle('on', i < lvl));
    $('noise').classList.toggle('loud', lvl >= 4);
  }
  if (force) {
    const gens = gameState.generatorsOn.filter(Boolean).length;
    $('gen-count').textContent = `${gens}/4`;
    const og = $('obj-gen'), ok = $('obj-key'), oe = $('obj-exit');
    og.className = gens === 4 ? 'done' : 'active';
    ok.className = gameState.hasKeycard ? 'done' : 'active';
    oe.className = gens === 4 && gameState.hasKeycard ? 'active' : 'locked';
  }
}

function drawMotionRadar(distToPlayer) {
  const canvas = $('radar-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2;
  ctx.fillStyle = 'rgba(2,8,5,.5)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(16,185,129,.28)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 56, 0, Math.PI * 2); ctx.stroke();
  const sw = (clock.t * 2.2) % (Math.PI * 2);
  ctx.strokeStyle = 'rgba(74,222,128,.35)';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sw) * 64, cy + Math.sin(sw) * 64); ctx.stroke();
  ctx.fillStyle = '#ece7e1';
  ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx - 4, cy + 4); ctx.lineTo(cx + 4, cy + 4); ctx.closePath(); ctx.fill();
  const cosY = Math.cos(-player.yaw), sinY = Math.sin(-player.yaw), scale = 1.25;
  const blip = (x, z, color, r, maxRange = 1e9) => {
    const dx = x - player.pos.x, dz = z - player.pos.z;
    if (Math.hypot(dx, dz) > maxRange) return;
    const rx = dx * cosY - dz * sinY, rz = dx * sinY + dz * cosY;
    const len = Math.hypot(rx, rz) * scale, maxR = 60, k = len > maxR ? maxR / len : 1;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx + rx * scale * k, cy + rz * scale * k, r, 0, Math.PI * 2); ctx.fill();
  };
  generatorObjects.forEach((g, idx) => { if (!gameState.generatorsOn[idx]) blip(g.anchor.position.x, g.anchor.position.z, 'rgba(242,179,61,.9)', 4.5); });
  if (!gameState.hasKeycard && keycardObj.anchor.visible) blip(keycardObj.anchor.position.x, keycardObj.anchor.position.z, 'rgba(90,209,230,.9)', 4.5, 18);
  if (gameState.powerRestored) { const ex = gridToWorld(EXIT_CELL.r, EXIT_CELL.c); blip(ex.x, ex.z + 2, '#4ade80', 5.5); }
  if (distToPlayer < 24) {
    const pulse = 0.55 + 0.45 * Math.sin(clock.t * 9);
    blip(monster.pos.x, monster.pos.z, distToPlayer < 12 ? `rgba(255,30,50,${pulse})` : 'rgba(249,115,22,.8)', distToPlayer < 12 ? 7 : 5);
  }
}

// ==========================================
// 16. MONSTER AI
// ==========================================
function updateMonsterAI(dt) {
  if (!monster.group) return;
  const dx = player.pos.x - monster.pos.x, dz = player.pos.z - monster.pos.z;
  const distToPlayer = Math.hypot(dx, dz);
  const mGrid = worldToGrid(monster.pos.x, monster.pos.z);
  const pGrid = worldToGrid(player.pos.x, player.pos.z);
  const sees = monsterCanSee();
  const reached = () => { const g = gridToWorld(monster.goalR, monster.goalC); return Math.hypot(monster.pos.x - g.x, monster.pos.z - g.z) < 1.0; };

  if (monster.huntLocker) {
    const L = monster.huntLocker;
    monster.state = 'HUNT';
    setGoalCell(L.r, L.c);
    if (Math.hypot(monster.pos.x - L.x, monster.pos.z - L.z) < 1.9) {
      if (gameState.isHidden && gameState.hideLocker === L) { exitLockerForDeath(); triggerGameOver(false); return; }
      monster.huntLocker = null;
      monster.state = 'SEARCH'; monster.searchTimer = 3;
    }
  } else if (sees) {
    if (monster.state !== 'CHASE') {
      gameState.spotted++;
      SoundEngine.playHorrorStinger();
      if (distToPlayer > 7) SoundEngine.playScream(distToPlayer, 0);
      hallucinationFlash();
    }
    monster.state = 'CHASE';
    monster.lured = false;
    monster.lostTimer = 0;
    monster.lastKnown = { r: pGrid.r, c: pGrid.c };
    monster.goalR = pGrid.r; monster.goalC = pGrid.c;
  } else if (monster.state === 'CHASE') {
    monster.lostTimer += dt;
    monster.goalR = monster.lastKnown.r; monster.goalC = monster.lastKnown.c;
    if (monster.lostTimer > 4 || reached()) { monster.state = 'SEARCH'; monster.searchTimer = 4; }
  } else if (!gameState.isHidden && gameState.noiseRadius > 0 && distToPlayer < gameState.noiseRadius * diff.hear) {
    if (monster.state !== 'INVESTIGATE') hallucinationFlash();
    monster.state = 'INVESTIGATE';
    monster.lured = false;
    if (monster.goalR !== pGrid.r || monster.goalC !== pGrid.c) setGoalCell(pGrid.r, pGrid.c);
  }

  if (monster.state === 'INVESTIGATE' && reached()) { monster.state = 'SEARCH'; monster.searchTimer = monster.lured ? 5 : 3.5; monster.lured = false; }
  if (monster.state === 'SEARCH') {
    monster.searchTimer -= dt;
    if (monster.searchTimer <= 0) { monster.state = 'PATROL'; pickPatrolGoal(false); }
  }
  if (monster.state === 'PATROL' && reached()) pickPatrolGoal(false);

  const gens = gameState.generatorsOn.filter(Boolean).length;
  const speeds = { PATROL: 1.6, INVESTIGATE: monster.lured ? 3.3 : 2.7, SEARCH: 0, HUNT: 3.4, CHASE: 4.4 + gens * 0.2 + (gameState.powerRestored ? 0.3 : 0) };
  const targetSpeed = (speeds[monster.state] || 0) * diff.speed;
  monster.speed += (targetSpeed - monster.speed) * Math.min(1, dt * 4);

  monster.repathTimer -= dt;
  const distToWp = Math.hypot(monster.pos.x - monster.nextWaypointWorld.x, monster.pos.z - monster.nextWaypointWorld.z);
  if (monster.state === 'CHASE' && sees && distToPlayer < 7) {
    monster.nextWaypointWorld.set(player.pos.x, 0, player.pos.z);
  } else if (monster.repathTimer <= 0 || distToWp < 0.4) {
    const nextCell = findNextStepBFS(mGrid.r, mGrid.c, monster.goalR, monster.goalC);
    const nw = gridToWorld(nextCell.r, nextCell.c);
    monster.nextWaypointWorld.set(nw.x, 0, nw.z);
    if (monster.state === 'HUNT' && monster.huntLocker && nextCell.r === monster.huntLocker.r && nextCell.c === monster.huntLocker.c) {
      const L = monster.huntLocker;
      monster.nextWaypointWorld.set(L.x + Math.sin(L.rotY) * 1.2, 0, L.z + Math.cos(L.rotY) * 1.2);
    }
    monster.repathTimer = 0.15;
  }

  const dir = tmpV.copy(monster.nextWaypointWorld).sub(monster.pos); dir.y = 0;
  if (monster.speed > 0.05 && dir.lengthSq() > 0.0025) {
    dir.normalize();
    monster.pos.x += dir.x * monster.speed * dt;
    monster.pos.z += dir.z * monster.speed * dt;
    monster.heading += wrapAngle(Math.atan2(dir.x, dir.z) - monster.heading) * Math.min(1, dt * 7);
  } else if (monster.state === 'SEARCH') {
    monster.heading += Math.sin(clock.t * 0.9) * dt * 1.6;
  }
  monster.heading = wrapAngle(monster.heading);
  for (const d of doors) if (!d.open && Math.hypot(monster.pos.x - d.x, monster.pos.z - d.z) < 1.6) setDoor(d, true, 'monster');
  monster.group.position.set(monster.pos.x, 0, monster.pos.z);
  monster.group.rotation.y = monster.heading;

  if (monster.state === 'CHASE' || monster.state === 'HUNT') setMonsterAnim('run', 0.85 + monster.speed * 0.06);
  else if (monster.state === 'SEARCH') setMonsterAnim('search', 0.55);
  else if (monster.state === 'INVESTIGATE') setMonsterAnim('walk', monster.lured ? 1.7 : 1.45);
  else setMonsterAnim('walk', 1.0);

  const pan = distToPlayer > 0.01 ? ((monster.pos.x - player.pos.x) * Math.cos(player.yaw) - (monster.pos.z - player.pos.z) * Math.sin(player.yaw)) / distToPlayer : 0;
  monster.stepTimer -= dt;
  if (monster.stepTimer <= 0 && monster.speed > 0.3) {
    SoundEngine.playMonsterStep3D(distToPlayer, pan, monster.state === 'CHASE');
    monster.stepTimer = monster.state === 'CHASE' || monster.state === 'HUNT' ? 0.3 : 0.62;
  }
  monster.breathTimer -= dt;
  if (monster.breathTimer <= 0) { SoundEngine.playMonsterBreath(distToPlayer, pan); monster.breathTimer = 2.2 + Math.random() * 1.5; }

  const visibleThreat = (distToPlayer < 18 && hasLOS(player.pos.x, player.pos.z, monster.pos.x, monster.pos.z)) ? 1 : 0.3;
  const fear = Math.max(0, Math.min(1, (17 - distToPlayer) / 14)) * visibleThreat;
  gameState.fear += (fear - gameState.fear) * Math.min(1, dt * 3);
  $('danger-overlay').style.opacity = (gameState.fear * 0.5).toFixed(2);
  $('grain').style.opacity = (0.05 + gameState.fear * 0.12).toFixed(3);
  if (distToPlayer < 16) {
    gameState.heartbeatTimer -= dt;
    if (gameState.heartbeatTimer <= 0) {
      const it = Math.max(0, Math.min(1, (16 - distToPlayer) / 14));
      SoundEngine.playHeartbeat(it);
      gameState.heartbeatTimer = Math.max(0.36, 1.1 - it * 0.75);
    }
  }
  drawMotionRadar(distToPlayer);

  if (!gameState.isHidden && distToPlayer < 1.3 && hasLOS(monster.pos.x, monster.pos.z, player.pos.x, player.pos.z)) triggerGameOver(false);
}

function exitLockerForDeath() {
  const L = gameState.hideLocker;
  gameState.isHidden = false;
  gameState.hideLocker = null;
  if (L) { L.pivot.visible = true; player.pos.set(L.x + Math.sin(L.rotY) * (L.depth / 2 + 0.5), EYE_HEIGHT, L.z + Math.cos(L.rotY) * (L.depth / 2 + 0.5)); }
  $('locker-overlay').classList.remove('on');
  SoundEngine.playLockerDoor();
}

// ==========================================
// 17. MAIN LOOP
// ==========================================
const fwdV = new THREE.Vector3(), rightV = new THREE.Vector3(), moveV = new THREE.Vector3();
const flashDir = new THREE.Vector3(0, 0, -1);
let lampPoolTimer = 0;

function updateLampPool(dt) {
  lampPoolTimer -= dt;
  if (lampPoolTimer <= 0) {
    lampPoolTimer = 0.4;
    const live = lampList.filter((l) => l.type !== 'dead' || gameState.powerRestored);
    live.sort((a, b) => ((a.x - player.pos.x) ** 2 + (a.z - player.pos.z) ** 2) - ((b.x - player.pos.x) ** 2 + (b.z - player.pos.z) ** 2));
    lampPool.forEach((l, i) => {
      const lamp = live[i];
      l.userData.lamp = lamp || null;
      if (lamp) l.position.set(lamp.x, WALL_HEIGHT - 0.3, lamp.z);
    });
  }
  lampPool.forEach((l) => {
    const lamp = l.userData.lamp;
    if (!lamp) { l.intensity = 0; return; }
    l.intensity = lamp.type === 'flicker' ? lampMats.flicker.emissiveIntensity * 2.2 : lamp.type === 'dead' ? 2.4 : 3.4;
  });
}

function applyCamera(dt) {
  camera.position.copy(player.pos);
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
  if (Math.abs(camera.fov - player.fov) > 0.05) { camera.fov += (player.fov - camera.fov) * Math.min(1, dt * 8); camera.updateProjectionMatrix(); }
  playerGlow.position.copy(player.pos);
  camera.getWorldDirection(camDirTmp);
  flashDir.lerp(camDirTmp, Math.min(1, dt * 14)).normalize();
  rightV.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  flashlight.position.copy(player.pos).addScaledVector(rightV, 0.18).add(tmpV.set(0, -0.2, 0));
  flashlight.target.position.copy(flashlight.position).add(flashDir).add(tmpV.set(0, -0.07, 0));
  let inten = flashOn() || gameState.menu ? 45 : 0;
  if (inten && gameState.battery < 15 && !gameState.menu && Math.random() < 0.08) inten *= Math.random() * 0.3;
  if (inten && gameState.fear > 0.35 && Math.random() < gameState.fear * 0.12) inten *= Math.random() * 0.3;
  flashlight.intensity = inten;
  playerGlow.intensity = gameState.isHidden ? 0.6 : (inten ? 2.4 : 1.8);
}

function updateGame(dt) {
  if (!gameState.running || gameState.gameOver || gameState.paused || gameState.reading) return;
  clock.t += dt;
  gameState.elapsed += dt;
  if (gameState.dying) { updateDying(dt); return; }

  if (keycardObj.group.visible) {
    keycardObj.card.rotation.y += 1.8 * dt;
    keycardObj.card.position.y = 1.25 + Math.sin(clock.t * 2) * 0.05;
  }
  items.forEach((it) => { if (it.active) it.glow.material.opacity = 0.3 + Math.sin(clock.t * 3 + it.group.position.x) * 0.15; });
  generatorObjects.forEach((g, idx) => {
    const amp = gameState.generatorsOn[idx] ? 0.012 : gameState.genStages[idx] > 0 ? 0.004 * gameState.genStages[idx] : 0;
    g.inner.position.set(g.innerBase.x + (Math.random() - 0.5) * amp, g.innerBase.y + (Math.random() - 0.5) * amp, g.innerBase.z);
    if (!gameState.generatorsOn[idx]) g.lampMat.emissiveIntensity = (Math.sin(clock.t * 5 + idx) > 0) ? 2.5 : 0.3;
    if (gameState.generatorsOn[idx]) {
      const dx = g.anchor.position.x - player.pos.x, dz = g.anchor.position.z - player.pos.z, d = Math.hypot(dx, dz);
      SoundEngine.setHum(idx, 0.07 * Math.max(0, 1 - d / 20), d > 0.1 ? (dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw)) / d : 0);
    }
  });

  if (gameState.activeGenIndex !== null) {
    gameState.gaugeNeedlePos += gameState.gaugeNeedleDir * gameState.gaugeSpeed * dt;
    if (gameState.gaugeNeedlePos >= 98) { gameState.gaugeNeedlePos = 98; gameState.gaugeNeedleDir = -1; }
    else if (gameState.gaugeNeedlePos <= 2) { gameState.gaugeNeedlePos = 2; gameState.gaugeNeedleDir = 1; }
    $('gauge-needle').style.left = `${gameState.gaugeNeedlePos}%`;
  }

  // flashlight battery
  if (flashOn()) {
    gameState.battery = Math.max(0, gameState.battery - 1.0 * diff.drain * dt);
    if (gameState.battery <= 0) { gameState.flashOn = false; SoundEngine.playClick(); showToast('손전등이 꺼졌다… 배터리를 찾아라', 'bad', 2600); updateHUD(true); }
  }

  const ks = 2.4 * settings.sens;
  if (input.turnLeft) player.yaw += ks * dt;
  if (input.turnRight) player.yaw -= ks * dt;
  if (input.turnUp) player.pitch = Math.min(1.25, player.pitch + ks * 0.7 * dt);
  if (input.turnDown) player.pitch = Math.max(-1.25, player.pitch - ks * 0.7 * dt);

  gameState.noiseRadius = 0;
  gameState.noiseLevel = 0;
  let targetFov = 72;
  if (!gameState.isHidden) {
    const mf = (input.w ? 1 : 0) - (input.s ? 1 : 0) - input.joyY;
    const mr = (input.d ? 1 : 0) - (input.a ? 1 : 0) + input.joyX;
    const mag = Math.min(1, Math.hypot(mf, mr));
    const wantsMove = mag > 0.12;
    const sprintHeld = input.sprint || input.sprintToggle;
    if (sprintHeld && gameState.crouch && wantsMove) toggleCrouch(false);
    const isSprinting = sprintHeld && wantsMove && !gameState.exhausted && mf > 0.2 && !gameState.crouch;
    if (isSprinting) {
      gameState.stamina = Math.max(0, gameState.stamina - 21 * dt);
      if (gameState.stamina <= 0) { gameState.exhausted = true; input.sprintToggle = false; $('btn-action-sprint').classList.remove('on'); }
    } else {
      gameState.stamina = Math.min(100, gameState.stamina + (wantsMove ? 11 : 17) * dt);
      if (gameState.exhausted && gameState.stamina > 35) gameState.exhausted = false;
    }
    const base = isSprinting ? 6.1 : gameState.crouch ? 1.6 : (gameState.exhausted ? 2.5 : 3.3);
    const speed = base * mag;
    fwdV.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    rightV.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    moveV.set(0, 0, 0);
    if (wantsMove) moveV.addScaledVector(fwdV, mf).addScaledVector(rightV, mr).normalize().multiplyScalar(speed);
    const accel = wantsMove ? 10 : 12;
    player.vel.x += (moveV.x - player.vel.x) * Math.min(1, dt * accel);
    player.vel.z += (moveV.z - player.vel.z) * Math.min(1, dt * accel);
    const dx = player.vel.x * dt, dz = player.vel.z * dt;
    if (!isBlockedAt(player.pos.x + dx, player.pos.z, player.radius)) player.pos.x += dx; else player.vel.x *= 0.2;
    if (!isBlockedAt(player.pos.x, player.pos.z + dz, player.radius)) player.pos.z += dz; else player.vel.z *= 0.2;

    const hs = Math.hypot(player.vel.x, player.vel.z);
    if (hs > 0.3) {
      gameState.bobPhase += dt * hs * 2.1;
      const s = Math.sign(Math.sin(gameState.bobPhase));
      if (s !== gameState.lastStepSign) { gameState.lastStepSign = s; SoundEngine.playFootstep(isSprinting ? 'sprint' : gameState.crouch ? 'crouch' : 'walk'); }
      if (isSprinting) { gameState.noiseRadius = 15; gameState.noiseLevel = 4; }
      else if (gameState.crouch) { gameState.noiseRadius = 1.2; gameState.noiseLevel = 1; }
      else { gameState.noiseRadius = hs > 2 ? 5 : 2.5; gameState.noiseLevel = 2; }
    }
    const eyeTarget = gameState.crouch ? CROUCH_HEIGHT : EYE_HEIGHT;
    player.eye += (eyeTarget - player.eye) * Math.min(1, dt * 9);
    const bobAmt = Math.min(1, hs / 6);
    player.pos.y = player.eye + Math.abs(Math.sin(gameState.bobPhase)) * 0.07 * bobAmt - 0.035 * bobAmt;
    if (isSprinting) targetFov = 80;
    camera.rotation.z += ((-mr * 0.015) - camera.rotation.z) * Math.min(1, dt * 6);
  } else {
    gameState.stamina = Math.min(100, gameState.stamina + 20 * dt);
    const lim = 0.75, off = wrapAngle(player.yaw - gameState.hideBaseYaw);
    if (off > lim) player.yaw = gameState.hideBaseYaw + lim;
    if (off < -lim) player.yaw = gameState.hideBaseYaw - lim;
    player.pitch = Math.max(-0.4, Math.min(0.35, player.pitch));
    camera.rotation.z = 0;
  }
  player.fov = targetFov;

  {
    const pg = worldToGrid(player.pos.x, player.pos.z);
    const ri = roomAt[pg.r] ? roomAt[pg.r][pg.c] : -1;
    if (ri >= 0 && !gameState.roomsSeen.has(ri)) { gameState.roomsSeen.add(ri); showToast(ROOMS[ri].name, '', 1800); }
  }
  updateProjectiles(dt);
  applyCamera(dt);
  updateInteractionRaycast();
  updateMonsterAI(dt);
  updateHUD(false);
}

function updateDying(dt) {
  gameState.dyingT += dt;
  const dx = monster.pos.x - player.pos.x, dz = monster.pos.z - player.pos.z;
  const d = Math.hypot(dx, dz);
  player.yaw += wrapAngle(Math.atan2(-dx, -dz) - player.yaw) * Math.min(1, dt * 16);
  player.pitch += (Math.atan2(1.9 - player.pos.y, Math.max(0.6, d)) - player.pitch) * Math.min(1, dt * 16);
  if (d > 0.9) { monster.pos.x -= (dx / d) * 7 * dt; monster.pos.z -= (dz / d) * 7 * dt; }
  monster.heading = Math.atan2(-dx, -dz);
  monster.group.position.set(monster.pos.x, 0, monster.pos.z);
  monster.group.rotation.y = monster.heading;
  gameState.fear = 1;
  gameState.flashOn = true; gameState.battery = Math.max(gameState.battery, 1);
  applyCamera(dt);
  if (gameState.dyingT > 0.42 && !gameState.jsStarted) { gameState.jsStarted = true; playFullJumpscareAnimation(showDeathModal); }
}

// grain
const grainC = $('grain'); grainC.width = 320; grainC.height = 180;
const gctx = grainC.getContext('2d'); const gimg = gctx.createImageData(320, 180);
function drawGrain(ctx, img) {
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
}
let frameN = 0;

function renderLoop(now) {
  requestAnimationFrame(renderLoop);
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  frameN++;
  if (gameState.menu) updateAttract(dt);
  updateGame(dt);
  const live = !gameState.paused && !gameState.reading;
  if (live) {
    if (monster.mixer) monster.mixer.update(dt);
    updateDoors(dt);
    SoundEngine.tickAmbient(dt);
    updateDust(dt);
  }
  if (lampMats) {
    const f = Math.random();
    lampMats.flicker.emissiveIntensity = f < 0.08 ? 0 : f < 0.12 ? 0.4 : 1.4 + Math.sin(now * 0.05) * 0.2;
    updateLampPool(dt);
  }
  if (frameN % 2 === 0) drawGrain(gctx, gimg);
  if (renderer && scene && camera) renderer.render(scene, camera);
}

// ==========================================
// 18. JUMPSCARE / ENDINGS
// ==========================================
const jsNoise = $('js-noise'); jsNoise.width = 320; jsNoise.height = 180;
const jnctx = jsNoise.getContext('2d'); const jnimg = jnctx.createImageData(320, 180);

function playFullJumpscareAnimation(onComplete) {
  const ov = $('jumpscare-overlay'), img = $('js-img');
  ov.classList.add('show');
  $('game').classList.add('shake');
  SoundEngine.playJumpscare();
  if (navigator.vibrate) { try { navigator.vibrate([300, 60, 400]); } catch (e) {} }
  const t0 = performance.now(), DUR = 1450;
  function step(now) {
    const t = (now - t0) / 1000;
    const rush = Math.min(1, t / 0.11);
    const scale = 0.55 + rush * 0.75 + t * 0.12 + Math.sin(t * 47) * 0.025;
    const shake = 34 * Math.max(0.2, 1 - t);
    img.style.transform = `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px) scale(${scale}) rotate(${(Math.random() - 0.5) * 3}deg)`;
    const flick = Math.random();
    img.style.filter = `contrast(${1.25 + Math.random() * 0.3}) brightness(${flick < 0.1 ? 2.6 : flick < 0.16 ? 0.3 : 1.35 + Math.random() * 0.3})`;
    img.style.opacity = t < 0.03 ? 0 : 1;
    drawGrain(jnctx, jnimg);
    if (now - t0 < DUR) requestAnimationFrame(step);
    else {
      img.style.opacity = 0;
      $('game').classList.remove('shake');
      setTimeout(() => { ov.classList.remove('show'); img.style.opacity = 1; onComplete(); }, 350);
    }
  }
  requestAnimationFrame(step);
}

function triggerGameOver(escaped) {
  if (gameState.gameOver || gameState.dying) return;
  closeGeneratorGauge();
  setPrompt(null);
  if (document.pointerLockElement) document.exitPointerLock();
  if (!escaped) {
    gameState.dying = true; gameState.dyingT = 0; gameState.jsStarted = false;
    setMonsterAnim('lunge', 1.4);
    return;
  }
  gameState.running = false; gameState.gameOver = true; gameState.won = true;
  SoundEngine.stopHums();
  const end = $('ending');
  const hh = 3 + Math.floor(gameState.elapsed / 3600), mm = 14 + Math.floor(gameState.elapsed / 60);
  $('ending-text').innerHTML = `${String(hh + Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')} — 비상구가 열렸다.<br>계단 위로 차가운 공기가 들어온다.<br><br>뒤에서 웃음소리가 멈췄다.`;
  end.classList.add('show');
  requestAnimationFrame(() => requestAnimationFrame(() => end.classList.add('on')));
  setTimeout(() => { showEndModal(true); end.classList.remove('on'); setTimeout(() => end.classList.remove('show'), 2200); }, 5200);
}

function showDeathModal() {
  gameState.running = false; gameState.gameOver = true; gameState.dying = false;
  SoundEngine.stopHums();
  showEndModal(false);
}

const DEATH_LINES = ['그것은 웃고 있었다.', '발소리가 너무 컸다.', '불빛이 너를 비췄다.', '사물함 문이 열렸다.'];
function showEndModal(escaped) {
  const secs = Math.max(1, Math.round(gameState.elapsed));
  const gens = gameState.generatorsOn.filter(Boolean).length;
  $('st-time').textContent = fmtTime(secs);
  $('st-gen').textContent = `${gens}/4`;
  $('st-notes').textContent = `${gameState.notesRead.size}/${NOTES.length}`;
  $('st-spotted').textContent = String(gameState.spotted);
  $('st-thrown').textContent = String(gameState.thrown);
  $('st-diff').textContent = diff.label;
  const badge = $('end-badge');
  badge.textContent = escaped ? 'ESCAPED' : 'SIGNAL LOST';
  badge.classList.toggle('win', escaped);
  $('end-title').textContent = escaped ? '4병동을 빠져나왔다' : '붙잡혔다';
  $('end-modal-card').classList.toggle('win', escaped);
  const rec = $('end-record');
  rec.classList.remove('new');
  if (escaped) {
    $('end-flavor').textContent = gameState.spotted === 0 ? '한 번도 들키지 않았다. 그것은 네가 있었는지도 모른다.' : '살아서 나왔다. 아직 귓가에 웃음소리가 남아 있다.';
    const prev = records[diffKey];
    if (!prev || secs < prev) { records[diffKey] = secs; saveRecords(); rec.textContent = `새 최고 기록! ${diff.label} ${fmtTime(secs)}`; rec.classList.add('new'); }
    else rec.textContent = `최고 기록 ${diff.label} ${fmtTime(prev)}`;
  } else {
    let line = DEATH_LINES[0];
    if (monster.huntLocker || monster.state === 'HUNT') line = DEATH_LINES[3];
    else if (gameState.noiseLevel >= 4) line = DEATH_LINES[1];
    else if (flashOn()) line = DEATH_LINES[2];
    $('end-flavor').textContent = line;
    rec.textContent = records[diffKey] ? `최고 기록 ${diff.label} ${fmtTime(records[diffKey])}` : '';
  }
  $('end-modal').classList.add('show');
  renderRecords();
}

function renderRecords() {
  ['easy', 'normal', 'hard'].forEach((k) => { $(`rec-${k}`).textContent = records[k] ? fmtTime(records[k]) : '--'; });
  const best = records[diffKey];
  $('mm-record').textContent = best ? `최고 기록 · ${DIFFS[diffKey].label} ${fmtTime(best)}` : '';
}

// ==========================================
// 19. START / MENU
// ==========================================
function startNewGame(key) {
  if (key) diffKey = key;
  diff = DIFFS[diffKey];
  SoundEngine.resume();
  SoundEngine.stopHums();
  Object.assign(gameState, {
    menu: false, generatorsOn: [false, false, false, false], genStages: [0, 0, 0, 0], hasKeycard: false,
    stamina: 100, exhausted: false, crouch: false, flashOn: true, battery: 100, bottles: 0,
    isHidden: false, hideLocker: null, gameOver: false, won: false, dying: false, jsStarted: false, paused: false, reading: false, running: true,
    startTime: performance.now(), elapsed: 0, fear: 0, powerRestored: false, heartbeatTimer: 0, notesRead: new Set(), spotted: 0, thrown: 0, roomsSeen: new Set()
  });
  resetDoors(true);
  closeGeneratorGauge();
  projectiles.forEach((p) => scene.remove(p.m)); projectiles.length = 0;
  glassDecals.forEach((s) => scene.remove(s)); glassDecals.length = 0;
  lockerObjects.forEach((l) => { l.pivot.visible = true; });
  if (exitSignMat) exitSignMat.map = createSignTexture('EXIT', '#ff2a2a');
  if (exitLight) exitLight.color.setHex(0xff2020);
  if (lampMats) lampMats.dead.emissiveIntensity = 0;
  setupRun();

  const spawn = gridToWorld(SPAWN.r, SPAWN.c);
  player.pos.set(spawn.x, EYE_HEIGHT, spawn.z);
  player.eye = EYE_HEIGHT;
  player.vel.set(0, 0, 0);
  player.yaw = -Math.PI / 2; player.pitch = 0;
  flashDir.set(1, 0, 0);
  input.sprintToggle = false;
  $('btn-action-sprint').classList.remove('on');
  $('btn-crouch').classList.remove('on');

  resetMonster();
  $('locker-overlay').classList.remove('on');
  $('danger-overlay').style.opacity = '0';
  $('note-modal').classList.remove('show');
  updateHUD(true);

  document.body.classList.remove('in-menu');
  ['main-menu', 'end-modal', 'pause-modal'].forEach((id) => $(id).classList.remove('show'));
  const fade = $('fade');
  $('intro-text').innerHTML = `<b>B2 · 4병동</b>03:14 · 정전 · 난이도 ${diff.label}`;
  fade.classList.add('on');
  setTimeout(() => {
    fade.classList.remove('on');
    showToast('발전기 4대를 찾아 가동하라', '', 3200);
  }, 1500);
  const hint = $('pc-hint'); hint.style.opacity = 1; setTimeout(() => { hint.style.opacity = 0; }, 12000);
  lockPointer();
  $('webgl-canvas').focus();
}

// Main menu: the camera wanders the ward on its own like a CCTV feed
const attract = { goal: null, wp: new THREE.Vector3(), need: true };
function updateAttract(dt) {
  clock.t += dt;
  const g = worldToGrid(player.pos.x, player.pos.z);
  if (!attract.goal || (g.r === attract.goal.r && g.c === attract.goal.c)) {
    attract.goal = CORRIDOR_NODES[Math.floor(Math.random() * CORRIDOR_NODES.length)];
    attract.need = true;
  }
  if (attract.need || Math.hypot(player.pos.x - attract.wp.x, player.pos.z - attract.wp.z) < 0.3) {
    const n = findNextStepBFS(g.r, g.c, attract.goal.r, attract.goal.c, false);
    const w = gridToWorld(n.r, n.c);
    attract.wp.set(w.x, 0, w.z);
    attract.need = false;
  }
  const dx = attract.wp.x - player.pos.x, dz = attract.wp.z - player.pos.z;
  const L = Math.hypot(dx, dz) || 1;
  player.pos.x += (dx / L) * 1.3 * dt;
  player.pos.z += (dz / L) * 1.3 * dt;
  player.yaw += wrapAngle(Math.atan2(-dx, -dz) - player.yaw) * Math.min(1, dt * 1.6);
  player.pitch = Math.sin(clock.t * 0.37) * 0.06 - 0.04;
  gameState.bobPhase += dt * 3.2;
  player.pos.y = EYE_HEIGHT + Math.sin(gameState.bobPhase) * 0.025;
  player.fov = 72;
  gameState.fear = Math.max(0, Math.min(0.5, (14 - Math.hypot(monster.pos.x - player.pos.x, monster.pos.z - player.pos.z)) / 14));
  applyCamera(dt);
}

function goToMenu() {
  Object.assign(gameState, { menu: true, running: false, paused: false, reading: false, gameOver: false, dying: false, isHidden: false, hideLocker: null, fear: 0, crouch: false });
  if (document.pointerLockElement) document.exitPointerLock();
  SoundEngine.stopHums();
  closeGeneratorGauge();
  ['end-modal', 'pause-modal', 'note-modal'].forEach((id) => $(id).classList.remove('show'));
  $('locker-overlay').classList.remove('on');
  $('danger-overlay').style.opacity = '0';
  lockerObjects.forEach((l) => { l.pivot.visible = true; });
  const spawn = gridToWorld(SPAWN.r, SPAWN.c);
  player.pos.set(spawn.x, EYE_HEIGHT, spawn.z);
  player.yaw = -Math.PI / 2; flashDir.set(1, 0, 0);
  attract.goal = null;
  resetDoors(false);
  resetMonster();
  monster.state = 'SEARCH'; monster.searchTimer = 1e9;
  setMonsterAnim('search', 0.5);
  showMenuPanel('mm-main');
  renderRecords();
  document.body.classList.add('in-menu');
  $('main-menu').classList.add('show');
  if (SoundEngine.initialized) SoundEngine.resume();
}

function showMenuPanel(id) {
  $('mm-main').style.display = id === 'mm-main' ? '' : 'none';
  document.querySelector('.mm-body').classList.toggle('sub', id !== 'mm-main');
  ['mm-howto', 'mm-settings', 'mm-diff'].forEach((p) => $(p).classList.toggle('show', id === p));
}

function lockPointer() {
  if (IS_TOUCH) return;
  try { const p = $('webgl-canvas').requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}

function setPaused(p) {
  if (gameState.menu || !gameState.running || gameState.gameOver || gameState.dying) return;
  if (p && gameState.reading) closeNote();
  gameState.paused = p;
  $('pause-modal').classList.toggle('show', p);
  if (p) {
    for (const k of ['w', 'a', 's', 'd', 'sprint', 'turnLeft', 'turnRight', 'turnUp', 'turnDown']) input[k] = false;
    if (SoundEngine.ctx) SoundEngine.ctx.suspend();
  } else {
    SoundEngine.resume();
    lastTime = performance.now();
    lockPointer();
  }
}

// ==========================================
// 20. INPUT
// ==========================================
function bindEvents() {
  const canvas = $('webgl-canvas');

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('mousedown', (e) => {
    if (!gameState.running || gameState.paused || IS_TOUCH) return;
    SoundEngine.resume();
    if (gameState.reading) { closeNote(); return; }
    if (document.pointerLockElement !== canvas) { lockPointer(); return; }
    if (e.button === 0) handleInteract();
    if (e.button === 2) throwBottle();
  });
  $('note-modal').addEventListener('click', () => closeNote());
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== canvas && gameState.running && !gameState.gameOver && !gameState.dying && !IS_TOUCH) setPaused(true);
  });
  window.addEventListener('mousemove', (e) => {
    if (!gameState.running || gameState.paused || gameState.dying || gameState.reading) return;
    if (document.pointerLockElement === canvas) {
      if (Math.abs(e.movementX) > 250 || Math.abs(e.movementY) > 250) return;
      const s = 0.0022 * settings.sens;
      player.yaw -= e.movementX * s;
      player.pitch = Math.max(-1.25, Math.min(1.25, player.pitch - e.movementY * s));
    }
  });

  // touch look + tap to interact
  let lookId = null, lx = 0, ly = 0, tStart = 0, moved = 0;
  canvas.addEventListener('touchstart', (e) => {
    if (!gameState.running) return;
    SoundEngine.resume();
    for (const t of e.changedTouches) {
      if (lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; tStart = performance.now(); moved = 0; break; }
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (!gameState.running || gameState.paused || gameState.dying || lookId === null) return;
    for (const t of e.changedTouches) {
      if (t.identifier !== lookId) continue;
      const dx = t.clientX - lx, dy = t.clientY - ly;
      lx = t.clientX; ly = t.clientY; moved += Math.abs(dx) + Math.abs(dy);
      const s = 0.0058 * settings.sens;
      player.yaw -= dx * s;
      player.pitch = Math.max(-1.25, Math.min(1.25, player.pitch - dy * s * 0.85));
    }
  }, { passive: true });
  const endLook = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== lookId) continue;
      lookId = null;
      if (performance.now() - tStart < 260 && moved < 14) handleInteract();
    }
  };
  canvas.addEventListener('touchend', endLook, { passive: true });
  canvas.addEventListener('touchcancel', endLook, { passive: true });

  // floating joystick
  const area = $('joy-area'), base = $('joy-base'), knob = $('joystick-knob');
  let joyId = null, ox = 0, oy = 0;
  const MAXR = 50;
  const restBase = () => { const r = area.getBoundingClientRect(); base.style.left = '96px'; base.style.top = `${r.height - 100}px`; };
  restBase();
  window.addEventListener('resize', restBase);
  area.addEventListener('touchstart', (e) => {
    e.preventDefault(); SoundEngine.resume();
    if (joyId !== null) return;
    const t = e.changedTouches[0], r = area.getBoundingClientRect();
    joyId = t.identifier; ox = t.clientX; oy = t.clientY;
    base.style.left = `${ox - r.left}px`; base.style.top = `${oy - r.top}px`;
    base.classList.add('active');
    knob.style.transform = 'translate(0px,0px)';
  }, { passive: false });
  area.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== joyId) continue;
      let dx = t.clientX - ox, dy = t.clientY - oy;
      const d = Math.hypot(dx, dy);
      if (d > MAXR) { dx = (dx / d) * MAXR; dy = (dy / d) * MAXR; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      const nx = dx / MAXR, ny = dy / MAXR, m = Math.hypot(nx, ny), dead = 0.12;
      const k = m < dead ? 0 : (m - dead) / (1 - dead) / m;
      input.joyX = nx * k; input.joyY = ny * k;
    }
  }, { passive: false });
  const joyEnd = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== joyId) continue;
      joyId = null; input.joyX = 0; input.joyY = 0;
      knob.style.transform = 'translate(0px,0px)';
      base.classList.remove('active');
      restBase();
    }
  };
  area.addEventListener('touchend', joyEnd);
  area.addEventListener('touchcancel', joyEnd);

  // mobile buttons
  const tapBtn = (id, fn) => {
    const el = $(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); SoundEngine.resume(); fn(); }, { passive: false });
    el.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
  };
  tapBtn('btn-action-sprint', () => {
    input.sprintToggle = !input.sprintToggle && !gameState.exhausted;
    if (input.sprintToggle && gameState.crouch) toggleCrouch(false);
    $('btn-action-sprint').classList.toggle('on', input.sprintToggle);
  });
  tapBtn('btn-crouch', () => toggleCrouch());
  tapBtn('btn-throw', throwBottle);
  tapBtn('btn-action-interact', handleInteract);

  // keyboard
  window.addEventListener('keydown', (e) => {
    const code = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) e.preventDefault();
    if (gameState.reading) { if (!e.repeat && ['KeyE', 'Space', 'Escape', 'Enter'].includes(code)) closeNote(); return; }
    if (code === 'KeyW') input.w = true;
    if (code === 'KeyS') input.s = true;
    if (code === 'KeyA') input.a = true;
    if (code === 'KeyD') input.d = true;
    if (code === 'ArrowLeft') input.turnLeft = true;
    if (code === 'ArrowRight') input.turnRight = true;
    if (code === 'ArrowUp') input.turnUp = true;
    if (code === 'ArrowDown') input.turnDown = true;
    if (code === 'ShiftLeft' || code === 'ShiftRight') input.sprint = true;
    if (e.repeat) return;
    if (code === 'KeyE' || code === 'Space') handleInteract();
    if (code === 'KeyC') toggleCrouch();
    if (code === 'KeyF') toggleFlashlight();
    if (code === 'KeyQ') throwBottle();
    if (code === 'KeyP') setPaused(!gameState.paused);
  });
  window.addEventListener('keyup', (e) => {
    const code = e.code;
    if (code === 'KeyW') input.w = false;
    if (code === 'KeyS') input.s = false;
    if (code === 'KeyA') input.a = false;
    if (code === 'KeyD') input.d = false;
    if (code === 'ArrowLeft') input.turnLeft = false;
    if (code === 'ArrowRight') input.turnRight = false;
    if (code === 'ArrowUp') input.turnUp = false;
    if (code === 'ArrowDown') input.turnDown = false;
    if (code === 'ShiftLeft' || code === 'ShiftRight') input.sprint = false;
  });
  window.addEventListener('blur', () => { for (const k of ['w', 'a', 's', 'd', 'sprint']) input[k] = false; });

  const click = (id, fn) => {
    const el = $(id);
    el.addEventListener('mousedown', (e) => e.stopPropagation());
    el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    el.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
  };
  click('btn-gauge-hit', attemptGeneratorGaugeHit);
  click('btn-start-game', () => showMenuPanel('mm-diff'));
  click('btn-howto', () => showMenuPanel('mm-howto'));
  click('btn-settings', () => showMenuPanel('mm-settings'));
  document.querySelectorAll('.mm-back').forEach((b) => b.addEventListener('click', () => showMenuPanel('mm-main')));
  document.querySelectorAll('.diff-btn').forEach((b) => b.addEventListener('click', () => startNewGame(b.dataset.d)));
  click('btn-restart', () => startNewGame());
  click('btn-pause-restart', () => startNewGame());
  click('btn-pause-menu', goToMenu);
  click('btn-end-menu', goToMenu);
  click('btn-resume', () => setPaused(false));
  click('btn-pause', () => setPaused(!gameState.paused));
  click('btn-light', toggleFlashlight);

  // settings (menu + pause share the same controls)
  const syncSettingsUI = () => {
    document.querySelectorAll('.seg').forEach((seg) => seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === settings[seg.dataset.k])));
    document.querySelectorAll('.sens-range').forEach((r) => { r.value = settings.sens; r.parentElement.querySelector('.sens-val').textContent = Number(settings.sens).toFixed(2); });
    $('btn-mute').innerHTML = `<svg><use href="#i-${settings.sound === 'off' ? 'mute' : 'sound'}"/></svg>`;
  };
  const setSound = (v) => { settings.sound = v; saveSettings(); SoundEngine.resume(); SoundEngine.setMuted(v === 'off'); syncSettingsUI(); };
  document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
    const k = b.parentElement.dataset.k;
    if (k === 'sound') setSound(b.dataset.v);
    else { settings.quality = b.dataset.v; saveSettings(); applyQuality(); syncSettingsUI(); }
  }));
  document.querySelectorAll('.sens-range').forEach((r) => r.addEventListener('input', () => { settings.sens = parseFloat(r.value); saveSettings(); syncSettingsUI(); }));
  click('btn-mute', () => setSound(settings.sound === 'off' ? 'on' : 'off'));
  syncSettingsUI();

  $('main-menu').addEventListener('pointerdown', () => SoundEngine.resume());
  let camSec = 3 * 3600 + 14 * 60;
  setInterval(() => {
    camSec++;
    const h = String(Math.floor(camSec / 3600) % 24).padStart(2, '0'), m = String(Math.floor(camSec / 60) % 60).padStart(2, '0'), sc = String(camSec % 60).padStart(2, '0');
    $('mm-clock').textContent = `${h}:${m}:${sc}`;
  }, 1000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
}

// ==========================================
// 21. BOOT
// ==========================================
bindEvents();
initThreeScene();
lastTime = performance.now();
requestAnimationFrame(renderLoop);
new Image().src = 'assets/jumpscare.png';
renderRecords();

loadAssets((p) => {
  $('mm-load-bar').firstElementChild.style.width = `${Math.round(p * 100)}%`;
  $('mm-load').textContent = `불러오는 중 ${Math.round(p * 100)}%`;
}).then(() => {
  buildLevelGeometry();
  setupRun();
  goToMenu();
  applyCamera(0.016);
  renderer.compile(scene, camera);
  $('btn-start-game').disabled = false;
  $('mm-load').textContent = '';
  $('mm-load-bar').style.visibility = 'hidden';
  window.__WARD_READY = true;
});

// debug hooks (used by automated tests)
window.__ward = { decorList, doors, ROOMS, roomPoint, setDoor, goToMenu, gameState, player, monster, generatorObjects, lockerObjects, items, get keycardObj() { return keycardObj; }, handleInteract, startNewGame, triggerGameOver,
  gridToWorld, input, applyCamera, updateGame, throwBottle, toggleFlashlight, toggleCrouch, openNote, closeNote, setPaused };
