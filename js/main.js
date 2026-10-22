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
  cabinet: 'assets/props/cabinet.glb',
  surg_lamp: 'assets/props/surg_lamp.glb',
  gurney: 'assets/props/gurney.glb',
  shelf: 'assets/props/shelf.glb',
  morgue: 'assets/props/morgue.glb',
  vending: 'assets/props/vending.glb',
  desk: 'assets/props/desk.glb',
  sofa: 'assets/props/sofa.glb',
  op_table: 'assets/props/op_table.glb',
  bottle: 'assets/props/bottle.glb',
  battery: 'assets/props/battery.glb',
  keycard: 'assets/props/keycard.glb',
  metal_chair: 'assets/props/metal_chair.glb',
  office_chair: 'assets/props/office_chair.glb',
  coffee_table: 'assets/props/coffee_table.glb',
  tray: 'assets/props/tray.glb',
  boxes: 'assets/props/boxes.glb',
  curtain: 'assets/props/curtain.glb',
  pedestal: 'assets/props/pedestal.glb',
  fluoro: 'assets/props/fluoro.glb',
  note: 'assets/props/note.glb',
  trash: 'assets/props/trash.glb',
  mop: 'assets/props/mop.glb',
  phone: 'assets/props/phone.glb',
  stretcher: 'assets/props/stretcher.glb',
  reception: 'assets/props/reception.glb',
  filing: 'assets/props/filing.glb',
  extinguisher: 'assets/props/extinguisher.glb',
  clock: 'assets/props/clock.glb'
};
// 3D props replace the primitive versions when their file loads (h = target height, rot = turn so the long side runs along X)
const GLB_PROPS = { bed: { key: 'bed', h: 1.1, rot: Math.PI / 2 }, wheelchair: { key: 'wheelchair', h: 1.0 }, ivStand: { key: 'iv', h: 1.9 },
  cart: { key: 'cart', h: 1.0 }, cabinet: { key: 'cabinet', h: 1.8 },
  desk: { key: 'desk', h: 1.25 }, opTable: { key: 'op_table', h: 1.15, rot: Math.PI / 2 }, shelf: { key: 'shelf', h: 2.0 },
  morgueWall: { key: 'morgue', h: 1.8 }, gurneyBag: { key: 'gurney', h: 1.1, rot: Math.PI / 2 }, sofa: { key: 'sofa', h: 0.9 },
  vending: { key: 'vending', h: 1.95, glow: true }, surgLamp: { key: 'surg_lamp', h: 1.2, hang: true },
  officeChair: { key: 'office_chair', h: 1.05 }, lowTable: { key: 'coffee_table', h: 0.45 }, tray: { key: 'tray', h: 1.0 },
  boxes: { key: 'boxes', h: 1.2 }, curtain: { key: 'curtain', h: 2.45 }, metalChair: { key: 'metal_chair', h: 0.85 },
  stretcher: { key: 'stretcher', h: 1.0, rot: Math.PI / 2 }, filing: { key: 'filing', h: 1.35 }, mop: { key: 'mop', h: 0.9 },
  trash: { key: 'trash', h: 0.65 }, reception: { key: 'reception', h: 1.15 },
  extinguisher: { key: 'extinguisher', h: 0.6 }, clock: { key: 'clock', h: 0.45 }, phone: { key: 'phone', h: 0.45 } };

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
      ['filing', 0.04, 0.6, 'right'], ['cart', 0.95, 0.75, 'left'], ['locker', 0.97, 0.28, 'left'], ['trash', 0.42, 0.88, 'door']] },
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
      ['boxes', 0.06, 0.3, 'door'], ['boxes', 0.94, 0.25, 'left'], ['mop', 0.55, 0.3, 'door'], ['locker', 0.04, 0.55, 'right']] },
  { name: '영안실', num: 'B-13', r: 20, c0: 15, c1: 17, door: { r: 21, c: 16 }, tint: 0x90a3ac, lamp: 'dead',
    spots: [[0.3, 0.2], [0.75, 0.22]],
    layout: [['morgueWall', 0.02, 0.5, 'right'], ['morgueWall', 0.98, 0.5, 'left'], ['gurneyBag', 0.38, 0.62, 'door'], ['gurneyBag', 0.64, 0.55, 'door'],
      ['bloodPool', 0.5, 0.7, 'door']] },
  { name: '직원 휴게실', num: 'B-07', r: 16, c0: 9, c1: 11, door: { r: 17, c: 10 }, tint: 0xcbbba2, lamp: 'on',
    keySpot: [0.45, 0.72], spots: [[0.68, 0.3], [0.3, 0.28]],
    layout: [['sofa', 0.2, 0.84, 'door'], ['lowTable', 0.2, 0.52, 'door'], ['vending', 0.93, 0.84, 'door'], ['vending', 0.8, 0.84, 'door'],
      ['metalChair', 0.36, 0.5, 'right'], ['metalChair', 0.6, 0.6, 'left'], ['trash', 0.7, 0.88, 'door'], ['locker', 0.03, 0.3, 'right']] },
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
const settings = { sens: 1.0, sound: 'on', quality: IS_TOUCH ? 'low' : 'high', fx: 'high' };
try { Object.assign(settings, JSON.parse(localStorage.getItem('whatthe_settings') || '{}')); } catch (e) {}
const FX_LEVEL = { high: 1, low: 0.4, off: 0 };
function applyFx() { document.body.dataset.fx = settings.fx; }
function saveSettings() { try { localStorage.setItem('whatthe_settings', JSON.stringify(settings)); } catch (e) {} }

const DIFFS = {
  easy: { label: '쉬움', speed: 0.85, sight: 0.8, hear: 0.75, drain: 0.6, batteries: 7, gauge: 1.35 },
  normal: { label: '보통', speed: 1.0, sight: 1.0, hear: 1.0, drain: 1.0, batteries: 5, gauge: 1.0 },
  hard: { label: '어려움', speed: 1.15, sight: 1.2, hear: 1.3, drain: 1.4, batteries: 4, gauge: 0.8 }
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
// 3. AUDIO — procedural foley through a hospital-corridor reverb (no audio files)
// ==========================================
const SoundEngine = {
  ctx: null, master: null, verb: null, muted: settings.sound === 'off', initialized: false, ambientTimer: 6, hums: [],
  bufs: {},

  init() {
    if (this.initialized) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.2;
      this.master.connect(comp); comp.connect(ctx.destination);
      // white / brown noise
      const sr = ctx.sampleRate;
      const white = ctx.createBuffer(1, sr * 2, sr), wd = white.getChannelData(0);
      for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
      const brown = ctx.createBuffer(1, sr * 4, sr), bd = brown.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bd.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; bd[i] = last * 3.5; }
      this.bufs.white = white; this.bufs.brown = brown;
      // reverb: long, dark tiled-corridor tail
      const len = Math.floor(sr * 3.2), ir = ctx.createBuffer(2, len, sr);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch); let lp = 0;
        for (let i = 0; i < len; i++) {
          const t = i / sr, k = 0.35 + 0.6 * Math.exp(-t * 1.4);       // darker as it decays
          lp = lp + k * ((Math.random() * 2 - 1) - lp);
          d[i] = lp * Math.pow(1 - i / len, 2.2) * (i < sr * 0.012 ? i / (sr * 0.012) : 1);
        }
      }
      this.verb = ctx.createConvolver(); this.verb.buffer = ir;
      const wet = ctx.createGain(); wet.gain.value = 0.55;
      this.verb.connect(wet); wet.connect(this.master);
      this.initialized = true;
      this.startAmbient();
    } catch (e) {}
  },
  resume() { if (!this.initialized) this.init(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05); },
  ok() { return this.ctx && !this.muted; },

  // output node: optional stereo pan, distance muffling, reverb send
  out(o = {}) {
    const ctx = this.ctx;
    let head = ctx.createGain();
    let node = head;
    if (o.muffle) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.muffle; node.connect(lp); node = lp; }
    if (o.pan !== undefined && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan)); node.connect(p); node = p; }
    node.connect(this.master);
    if (o.wet) { const s = ctx.createGain(); s.gain.value = o.wet; node.connect(s); s.connect(this.verb); }
    return head;
  },
  env(g, t, peak, attack, dur, curve = 'exp') {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
    else g.gain.linearRampToValueAtTime(0.0001, t + attack + dur);
  },
  noise(t, dur, o = {}) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.bufs[o.buf || 'white']; src.loop = true;
    let node = src;
    const filters = o.filters || [{ type: o.type || 'bandpass', f: o.f || 1000, f2: o.f2, q: o.q || 1 }];
    filters.forEach((fd) => {
      const f = ctx.createBiquadFilter(); f.type = fd.type; f.frequency.setValueAtTime(fd.f, t);
      if (fd.f2) f.frequency.exponentialRampToValueAtTime(fd.f2, t + dur); f.Q.value = fd.q || 1;
      node.connect(f); node = f;
    });
    const g = ctx.createGain(); this.env(g, t, o.gain || 0.2, o.attack || 0.003, dur, o.curve);
    node.connect(g); g.connect(this.out(o));
    src.start(t, Math.random() * 1.5); src.stop(t + (o.attack || 0.003) + dur + 0.05);
    return g;
  },
  osc(t, dur, o = {}) {
    const ctx = this.ctx;
    const s = ctx.createOscillator(); s.type = o.type || 'sine';
    if (o.curveF) s.frequency.setValueCurveAtTime(o.curveF, t, dur);
    else {
      s.frequency.setValueAtTime(o.f || 100, t);
      if (o.f2) s.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    }
    let node = s;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; node.connect(f); node = f; }
    if (o.bp) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.bp; f.Q.value = o.bq || 2; node.connect(f); node = f; }
    const g = ctx.createGain(); this.env(g, t, o.gain || 0.2, o.attack || 0.003, dur, o.curve);
    node.connect(g); g.connect(this.out(o));
    s.start(t); s.stop(t + (o.attack || 0.003) + dur + 0.05);
    return s;
  },
  // short burst of crackle/ticks (paper, glass, electric arcs)
  ticks(t, dur, n, o) {
    for (let i = 0; i < n; i++) {
      const tt = t + Math.pow(Math.random(), o.skew || 1) * dur;
      this.noise(tt, o.len || 0.012, { type: o.type || 'bandpass', f: (o.f || 4000) * (0.7 + Math.random() * 0.6), q: o.q || 3,
        gain: (o.gain || 0.1) * (0.4 + Math.random() * 0.6) * (o.fade ? 1 - (tt - t) / dur : 1), pan: o.pan, wet: o.wet, muffle: o.muffle });
    }
  },
  // metal panel: inharmonic partials with a noise transient (a clank, not a bell)
  metal(t, o) {
    const ratios = [1, 1.47, 2.09, 2.56, 3.71];
    ratios.forEach((r, i) => this.osc(t, o.decay * (1 - i * 0.12), { f: o.f * r * (0.98 + Math.random() * 0.04), gain: o.gain / (1 + i * 0.7), pan: o.pan, wet: o.wet, muffle: o.muffle }));
    this.noise(t, 0.05, { type: 'bandpass', f: o.f * 6, q: 0.8, gain: o.gain * 1.4, pan: o.pan, wet: o.wet, muffle: o.muffle });
  },
  // stick-slip friction: a hinge or pipe creaking
  creak(t, dur, o) {
    const n = 64, curve = new Float32Array(n);
    let f = o.f;
    for (let i = 0; i < n; i++) { f *= 1 + (Math.random() - 0.5) * 0.18; f = Math.max(o.f * 0.6, Math.min(o.f * 1.6, f)); curve[i] = f; }
    const ctx = this.ctx;
    const s = ctx.createOscillator(); s.type = 'sawtooth'; s.frequency.setValueCurveAtTime(curve, t, dur);
    const b1 = ctx.createBiquadFilter(); b1.type = 'bandpass'; b1.frequency.value = o.res || 1100; b1.Q.value = 6;
    const b2 = ctx.createBiquadFilter(); b2.type = 'peaking'; b2.frequency.value = (o.res || 1100) * 2.3; b2.Q.value = 5; b2.gain.value = 8;
    const am = new Float32Array(n);
    for (let i = 0; i < n; i++) am[i] = (0.25 + Math.random() * 0.75) * Math.sin(Math.PI * i / (n - 1)) * o.gain;
    const g = ctx.createGain(); g.gain.value = 0; g.gain.setValueCurveAtTime(am, t, dur);
    s.connect(b1); b1.connect(b2); b2.connect(g); g.connect(this.out(o));
    s.start(t); s.stop(t + dur + 0.05);
  },
  dist(dist, max) { return Math.max(0, 1 - dist / max); },

  startAmbient() {
    const ctx = this.ctx, t = ctx.currentTime;
    // sub drone with a slowly breathing filter
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = o2.type = 'sawtooth'; o1.frequency.value = 38; o2.frequency.value = 38.7;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 95; lp.Q.value = 3;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.04; const lfoG = ctx.createGain(); lfoG.gain.value = 40;
    lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start(t);
    const dg = ctx.createGain(); dg.gain.value = 0.06;
    o1.connect(lp); o2.connect(lp); lp.connect(dg); dg.connect(this.master); o1.start(t); o2.start(t);
    // ventilation air
    const air = ctx.createBufferSource(); air.buffer = this.bufs.brown; air.loop = true;
    const af = ctx.createBiquadFilter(); af.type = 'lowpass'; af.frequency.value = 520;
    const ag = ctx.createGain(); ag.gain.value = 0.05;
    const alfo = ctx.createOscillator(); alfo.frequency.value = 0.07; const alfoG = ctx.createGain(); alfoG.gain.value = 0.025;
    alfo.connect(alfoG); alfoG.connect(ag.gain); alfo.start(t);
    air.connect(af); af.connect(ag); ag.connect(this.master); air.start(t);
    // fluorescent ballast buzz
    const b = ctx.createOscillator(); b.type = 'sawtooth'; b.frequency.value = 120;
    const bf = ctx.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 2900; bf.Q.value = 12;
    const bg = ctx.createGain(); bg.gain.value = 0.0035;
    b.connect(bf); bf.connect(bg); bg.connect(this.master); b.start(t);
  },
  tickAmbient(dt) {
    if (!this.ok()) return;
    this.ambientTimer -= dt;
    if (this.ambientTimer > 0) return;
    this.ambientTimer = 8 + Math.random() * 14;
    const t = this.ctx.currentTime, pan = Math.random() * 2 - 1, kind = Math.random();
    if (kind < 0.22) { // something heavy hits metal far away
      this.metal(t, { f: 70 + Math.random() * 40, decay: 1.6, gain: 0.05, pan, wet: 1.2, muffle: 900 });
    } else if (kind < 0.42) { // pipes groaning
      this.creak(t, 2.4 + Math.random() * 1.5, { f: 55 + Math.random() * 40, res: 320, gain: 0.05, pan, wet: 0.9, muffle: 1400 });
    } else if (kind < 0.6) { // footsteps somewhere else
      const n = 3 + Math.floor(Math.random() * 3), step = 0.42 + Math.random() * 0.2;
      for (let i = 0; i < n; i++) this.noise(t + i * step, 0.09, { type: 'lowpass', f: 380, gain: 0.05, pan, wet: 0.9 });
    } else if (kind < 0.75) { // water dripping
      for (let i = 0; i < 3; i++) this.noise(t + i * (0.6 + Math.random() * 0.4), 0.02, { type: 'bandpass', f: 1600 + Math.random() * 600, q: 8, gain: 0.04, pan, wet: 0.8 });
    } else if (kind < 0.88) { // a whisper
      const syl = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < syl; i++) {
        const tt = t + i * (0.18 + Math.random() * 0.1);
        this.noise(tt, 0.16, { filters: [{ type: 'bandpass', f: 650 + Math.random() * 300, q: 6 }, { type: 'peaking', f: 2300, q: 4 }], gain: 0.03, attack: 0.04, pan, wet: 0.7 });
      }
    } else { // door slams far off
      this.noise(t, 0.3, { type: 'lowpass', f: 300, gain: 0.08, pan, wet: 1.3, muffle: 600 });
      this.osc(t, 0.25, { f: 60, f2: 40, gain: 0.06, pan, wet: 1.2 });
    }
  },
  playFootstep(kind) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, v = 0.85 + Math.random() * 0.3;
    const g = kind === 'sprint' ? 0.16 : kind === 'crouch' ? 0.02 : 0.07;
    this.noise(t, 0.045, { type: 'bandpass', f: 1900 * v, q: 1.3, gain: g, wet: 0.18 });             // heel on tile
    this.noise(t + 0.004, 0.09, { type: 'lowpass', f: 260, gain: g * 0.9, wet: 0.1 });                  // body
    if (kind !== 'crouch') this.noise(t + 0.01, 0.02, { type: 'highpass', f: 5000, gain: g * 0.35 });   // grit
  },
  playMonsterStep3D(dist, pan, chasing) {
    if (!this.ok() || dist > 34) return;
    const t = this.ctx.currentTime, a = Math.pow(this.dist(dist, 34), 1.4), muffle = 400 + a * 3600;
    this.osc(t, 0.28, { f: chasing ? 62 : 50, f2: 32, gain: a * 0.38, pan, wet: 0.35, muffle });
    this.noise(t, 0.08, { type: 'lowpass', f: 700, gain: a * (chasing ? 0.4 : 0.26), pan, wet: 0.35, muffle });
    if (Math.random() < 0.55) this.noise(t + 0.08, 0.32, { type: 'bandpass', f: 1100, q: 2, gain: a * 0.07, attack: 0.05, pan, wet: 0.4, muffle }); // dragging foot
  },
  playMonsterBreath(dist, pan) {
    if (!this.ok() || dist > 15) return;
    const t = this.ctx.currentTime, a = this.dist(dist, 15);
    const g = this.noise(t, 1.1, { filters: [{ type: 'bandpass', f: 520, q: 3 }, { type: 'peaking', f: 1500, q: 3 }], gain: a * 0.24, attack: 0.35, curve: 'lin', pan, wet: 0.35 });
    const trem = this.ctx.createOscillator(); trem.frequency.value = 17; const tg = this.ctx.createGain(); tg.gain.value = a * 0.08;
    trem.connect(tg); tg.connect(g.gain); trem.start(t); trem.stop(t + 1.5);
    this.osc(t, 1.1, { type: 'sawtooth', f: 58, f2: 49, lp: 180, gain: a * 0.06, attack: 0.3, curve: 'lin', pan, wet: 0.3 });
  },
  playScream(dist, pan) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, a = Math.max(0.15, this.dist(dist, 45));
    const n = 40, c = new Float32Array(n);
    for (let i = 0; i < n; i++) c[i] = 820 + 520 * Math.sin(Math.PI * i / n) + Math.sin(i * 1.7) * 60;
    this.osc(t, 1.4, { type: 'sawtooth', curveF: c, bp: 1500, bq: 1.2, gain: 0.16 * a, attack: 0.06, pan, wet: 0.9 });
    this.noise(t, 1.3, { type: 'bandpass', f: 2600, f2: 900, q: 1.5, gain: 0.08 * a, attack: 0.06, pan, wet: 0.9 });
    this.osc(t, 1.0, { type: 'sawtooth', f: 90, f2: 60, lp: 300, gain: 0.1 * a, attack: 0.05, pan, wet: 0.6 });
  },
  playHorrorStinger() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    // violin-like dissonant cluster screech + swell + low hit
    [1180, 1251, 1324, 1406, 1502].forEach((f, i) => this.osc(t, 1.9, { type: 'sawtooth', f, f2: f * (i % 2 ? 0.94 : 1.05), bp: f, bq: 3, gain: 0.05, attack: 0.04, wet: 0.9 }));
    this.noise(t, 1.2, { type: 'highpass', f: 2500, gain: 0.05, attack: 0.02, wet: 0.8 });
    this.osc(t, 1.4, { f: 46, f2: 30, gain: 0.32, wet: 0.5 });
    this.noise(t, 0.5, { type: 'lowpass', f: 180, gain: 0.25, wet: 0.6 });
  },
  playHeartbeat(intensity) {
    if (!this.ok()) return;
    const t = this.ctx.currentTime, g = Math.min(0.55, 0.08 + intensity * 0.42);
    const beat = (tt, k) => { this.osc(tt, 0.16, { f: 58, f2: 36, gain: g * k }); this.noise(tt, 0.05, { type: 'lowpass', f: 140, gain: g * 0.6 * k }); };
    beat(t, 1); beat(t + 0.19, 0.65);
  },
  playPickup() { // cloth and plastic, no chime
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.12, { type: 'bandpass', f: 2800, q: 0.9, gain: 0.07, attack: 0.02, wet: 0.15 });
    this.noise(t + 0.1, 0.1, { type: 'bandpass', f: 3600, q: 0.9, gain: 0.05, attack: 0.02, wet: 0.15 });
    this.noise(t + 0.17, 0.012, { type: 'highpass', f: 2500, gain: 0.12, wet: 0.2 });
  },
  playClick() { // flashlight switch
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.008, { type: 'bandpass', f: 2200, q: 2, gain: 0.25, wet: 0.15 });
    this.noise(t + 0.045, 0.006, { type: 'bandpass', f: 3400, q: 2, gain: 0.15, wet: 0.15 });
    this.noise(t + 0.01, 0.06, { type: 'bandpass', f: 5200, q: 6, gain: 0.02 });
  },
  playPaper() {
    if (!this.ok()) return;
    this.ticks(this.ctx.currentTime, 0.4, 14, { f: 3800, q: 1, len: 0.02, gain: 0.07, wet: 0.15 });
  },
  playThrow() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.22, { type: 'bandpass', f: 500, f2: 1400, q: 1.5, gain: 0.08, attack: 0.08, curve: 'lin' });
  },
  playShatter(dist, pan) {
    if (!this.ok() || dist > 48) return;
    const t = this.ctx.currentTime, a = Math.max(0.08, this.dist(dist, 48)), muffle = 1200 + a * 8000;
    this.noise(t, 0.035, { type: 'highpass', f: 2500, gain: 0.6 * a, pan, wet: 0.6, muffle });
    this.noise(t, 0.12, { type: 'lowpass', f: 400, gain: 0.25 * a, pan, wet: 0.5 });
    this.ticks(t + 0.02, 0.55, 26, { f: 6000, q: 5, len: 0.018, gain: 0.12 * a, pan, wet: 0.6, skew: 2, fade: true, muffle });
  },
  playDoor(dist, pan, open) {
    if (!this.ok() || dist > 38) return;
    const t = this.ctx.currentTime, a = Math.max(0.1, this.dist(dist, 38)), muffle = 700 + a * 6000;
    this.noise(t, 0.015, { type: 'bandpass', f: 2600, q: 2, gain: 0.25 * a, pan, wet: 0.4, muffle });   // latch
    if (open) this.creak(t + 0.05, 1.1, { f: 190, res: 1150, gain: 0.08 * a, pan, wet: 0.6, muffle });
    else {
      this.noise(t + 0.02, 0.3, { type: 'lowpass', f: 320, gain: 0.5 * a, pan, wet: 0.8, muffle });
      this.osc(t + 0.02, 0.22, { f: 75, f2: 45, gain: 0.25 * a, pan, wet: 0.6 });
      this.ticks(t + 0.05, 0.15, 5, { f: 2000, q: 4, gain: 0.06 * a, pan, wet: 0.4 });
    }
  },
  playLockerDoor() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.012, { type: 'bandpass', f: 2400, q: 2, gain: 0.25, wet: 0.3 });
    this.creak(t + 0.02, 0.35, { f: 260, res: 1500, gain: 0.05, wet: 0.4 });
    this.metal(t + 0.3, { f: 160, decay: 0.45, gain: 0.07, wet: 0.5 });
    this.noise(t + 0.3, 0.1, { type: 'lowpass', f: 500, gain: 0.2, wet: 0.4 });
  },
  playLatch() { // opening the generator's control panel
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.01, { type: 'bandpass', f: 2000, q: 3, gain: 0.2, wet: 0.3 });
    this.metal(t + 0.02, { f: 220, decay: 0.25, gain: 0.04, wet: 0.4 });
  },
  playCrank(stage, perfect) { // starter motor turns, engine coughs
    if (!this.ok()) return;
    const ctx = this.ctx, t = ctx.currentTime, dur = 0.7;
    const s = ctx.createOscillator(); s.type = 'sawtooth'; s.frequency.setValueAtTime(34, t); s.frequency.linearRampToValueAtTime(48 + stage * 6, t + dur);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
    const am = ctx.createOscillator(); am.type = 'square'; am.frequency.setValueAtTime(9, t); am.frequency.linearRampToValueAtTime(13, t + dur);
    const amg = ctx.createGain(); amg.gain.value = 0.07;
    const g = ctx.createGain(); this.env(g, t, 0.12, 0.03, dur, 'lin');
    am.connect(amg); amg.connect(g.gain);
    s.connect(f); f.connect(g); g.connect(this.out({ wet: 0.35 }));
    s.start(t); s.stop(t + dur + 0.1); am.start(t); am.stop(t + dur + 0.1);
    const pops = 2 + stage + (perfect ? 2 : 0);
    for (let i = 0; i < pops; i++) {
      const tt = t + dur * 0.5 + i * (0.09 + Math.random() * 0.07);
      this.noise(tt, 0.07, { type: 'lowpass', f: 600, gain: 0.22, wet: 0.45 });
      this.osc(tt, 0.08, { f: 70, f2: 40, gain: 0.12 });
    }
  },
  playGaugeFail() { // short circuit: arc crackle + buzz + pop
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.noise(t, 0.03, { type: 'highpass', f: 1500, gain: 0.5, wet: 0.5 });
    this.ticks(t, 0.55, 40, { type: 'highpass', f: 2500, q: 0.7, len: 0.008, gain: 0.22, wet: 0.4, skew: 1.6, fade: true });
    this.osc(t, 0.45, { type: 'sawtooth', f: 120, bp: 900, bq: 1.5, gain: 0.12, wet: 0.3 });
    this.osc(t, 0.45, { type: 'square', f: 240, bp: 2400, bq: 2, gain: 0.04 });
  },
  playGeneratorPowerUp() { // engine catches and settles into idle
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.playCrank(2, true);
    for (let i = 0; i < 6; i++) this.noise(t + 0.6 + i * 0.07, 0.08, { type: 'lowpass', f: 900, gain: 0.3 - i * 0.03, wet: 0.5 });
    this.osc(t + 0.6, 1.2, { type: 'sawtooth', f: 30, f2: 52, lp: 320, gain: 0.22, attack: 0.15, wet: 0.5 });
  },
  // one throat: detuned saw "vocal folds" + breath rasp, torn by AM roughness, shaped by moving vowel formants
  voice(t, dur, o) {
    const ctx = this.ctx, end = t + dur + 0.15;
    const src = ctx.createGain(); src.gain.value = 1;
    (o.detunes || [0, -18, 13, 31]).forEach((d, i) => {
      const s = ctx.createOscillator(); s.type = 'sawtooth';
      s.frequency.setValueCurveAtTime(o.pitch, t, dur); s.detune.value = d;
      const vib = ctx.createOscillator(); vib.frequency.value = (o.vibF || 6) + i * 0.7;
      const vg = ctx.createGain(); vg.gain.value = o.vib || 45; vib.connect(vg); vg.connect(s.detune);
      const sg = ctx.createGain(); sg.gain.value = 0.3; s.connect(sg); sg.connect(src);
      s.start(t); s.stop(end); vib.start(t); vib.stop(end);
    });
    const br = ctx.createBufferSource(); br.buffer = this.bufs.white; br.loop = true;
    const bg = ctx.createGain(); bg.gain.value = o.rasp || 0.5; br.connect(bg); bg.connect(src); br.start(t, Math.random()); br.stop(end);
    // roughness: fast irregular amplitude flutter = torn, screaming vocal cords
    const am = ctx.createGain(); am.gain.value = 0.55; src.connect(am);
    [o.rough || 70, (o.rough || 70) * 1.47].forEach((f) => {
      const m = ctx.createOscillator(); m.type = 'triangle'; m.frequency.setValueAtTime(f, t); m.frequency.linearRampToValueAtTime(f * 0.7, t + dur);
      const mg = ctx.createGain(); mg.gain.value = 0.3; m.connect(mg); mg.connect(am.gain); m.start(t); m.stop(end);
    });
    const outG = ctx.createGain();
    o.formants.forEach(([a, b, q, g]) => {
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
      f.frequency.setValueAtTime(a, t); f.frequency.linearRampToValueAtTime(b, t + dur);
      const fg = ctx.createGain(); fg.gain.value = g; am.connect(f); f.connect(fg); fg.connect(outG);
    });
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(o.gain, t + (o.attack || 0.02));
    env.gain.setValueAtTime(o.gain * 0.9, t + dur * 0.7);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    outG.connect(env); env.connect(o.dest);
  },
  playJumpscare() {
    if (!this.ok()) return;
    const ctx = this.ctx, t = ctx.currentTime;
    // everything goes through an overdriven, slightly clipped bus: a voice too loud for its own throat
    const shaper = ctx.createWaveShaper(), curve = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) { const x = i / 1024 - 1; curve[i] = Math.tanh(x * 3.2) * 0.9 + Math.tanh(x * 14) * 0.1; }
    shaper.curve = curve; shaper.oversample = '2x';
    const pre = ctx.createGain(); pre.gain.value = 0.85; pre.connect(shaper);
    const shelf = ctx.createBiquadFilter(); shelf.type = 'peaking'; shelf.frequency.value = 2900; shelf.Q.value = 1; shelf.gain.value = 5;
    const bus = ctx.createGain(); bus.gain.value = 0.62;
    shaper.connect(shelf); shelf.connect(bus); bus.connect(this.master);
    const send = ctx.createGain(); send.gain.value = 0.55; bus.connect(send); send.connect(this.verb);
    const jag = (n, fn) => { const c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = Math.max(40, fn(i / (n - 1)) * (1 + (Math.random() - 0.5) * 0.09)); return c; };
    // 1) the shriek: snaps up, cracks higher, wavers, drags down into a wail ("AAAEEEHHH")
    this.voice(t, 2.3, {
      dest: pre, gain: 1.1, attack: 0.025, rasp: 0.16, rough: 78, vib: 60, vibF: 7,
      pitch: jag(48, (x) => x < 0.06 ? 420 + x / 0.06 * 480 : x < 0.32 ? 900 + Math.sin(x * 40) * 50 + (x > 0.2 ? 260 : 0) : 1160 - (x - 0.32) * 820),
      formants: [[880, 560, 5, 1], [1250, 2350, 6, 0.85], [2750, 3150, 7, 0.6], [3900, 3700, 8, 0.35]],
    });
    // 2) dissonant second throat a hair off pitch: makes it sound wrong, not musical
    this.voice(t + 0.04, 2.0, {
      dest: pre, gain: 0.5, attack: 0.04, rasp: 0.25, rough: 53, vib: 90, vibF: 9, detunes: [0, 47, -33],
      pitch: jag(40, (x) => 610 + Math.sin(x * 9) * 120 + x * 260),
      formants: [[700, 500, 4, 1], [1900, 2700, 6, 0.8], [3300, 3000, 7, 0.5]],
    });
    // 3) guttural roar underneath, from the chest
    this.voice(t, 1.9, {
      dest: pre, gain: 0.9, attack: 0.012, rasp: 0.45, rough: 31, vib: 25, vibF: 4, detunes: [0, -25, 19, -40],
      pitch: jag(30, (x) => 118 - x * 50 + Math.sin(x * 23) * 9),
      formants: [[520, 420, 3, 1], [880, 760, 4, 0.7], [2400, 2200, 5, 0.3]],
    });
    // 4) wet breath rush before and after, and the hit
    this.noise(t, 0.35, { filters: [{ type: 'bandpass', f: 1800, f2: 3500, q: 0.8 }], gain: 0.5, attack: 0.005, wet: 0.4 });
    this.noise(t + 1.9, 0.9, { filters: [{ type: 'bandpass', f: 900, f2: 450, q: 2 }, { type: 'peaking', f: 1400, q: 3 }], gain: 0.25, attack: 0.08, curve: 'lin', wet: 0.6 }); // ragged exhale
    this.osc(t, 1.0, { f: 55, f2: 24, gain: 0.75 });
    this.noise(t, 0.4, { type: 'lowpass', f: 160, gain: 0.75 });
    this.noise(t, 0.05, { type: 'highpass', f: 3000, gain: 0.5 }); // the snap
  },
  startHum(i) { // idling diesel: low chug
    if (!this.ctx || this.hums[i]) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 29 + i * 1.3;
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 58 + i * 2.6;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
    const chug = ctx.createGain(); chug.gain.value = 0.6;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 12.5 + i * 0.4; const lg = ctx.createGain(); lg.gain.value = 0.4;
    lfo.connect(lg); lg.connect(chug.gain);
    const g = ctx.createGain(); g.gain.value = 0;
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.connect(f); o2.connect(f); f.connect(chug); chug.connect(g);
    if (p) { g.connect(p); p.connect(this.master); } else g.connect(this.master);
    const send = ctx.createGain(); send.gain.value = 0.3; g.connect(send); send.connect(this.verb);
    o.start(); o2.start(); lfo.start();
    this.hums[i] = { nodes: [o, o2, lfo], g, p };
  },
  setHum(i, vol, pan) {
    const h = this.hums[i]; if (!h) return;
    const t = this.ctx.currentTime;
    h.g.gain.setTargetAtTime(vol * 1.3, t, 0.15);
    if (h.p) h.p.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.15);
  },
  stopHums() {
    this.hums.forEach((h) => { if (h) h.nodes.forEach((n) => { try { n.stop(); } catch (e) {} }); });
    this.hums = [];
  },
  playSurge() {
    if (!this.ok()) return;
    const t = this.ctx.currentTime;
    this.metal(t, { f: 210, decay: 0.25, gain: 0.05, wet: 0.8, muffle: 2500 });
    this.osc(t + 0.05, 1.5, { type: 'sawtooth', f: 100, f2: 96, bp: 600, bq: 2, gain: 0.05, attack: 0.25, curve: 'lin', wet: 0.7 });
    this.osc(t + 0.05, 1.5, { type: 'square', f: 50, lp: 200, gain: 0.05, attack: 0.3, curve: 'lin', wet: 0.5 });
    this.ticks(t + 0.1, 1.3, 9, { f: 3200, q: 2, len: 0.01, gain: 0.06, wet: 0.6 });
    this.noise(t + 1.45, 0.06, { type: 'highpass', f: 1800, gain: 0.08, wet: 0.9 });
  },
  // main menu: slow minor string swells over a dark drone, wind, and a far-off low piano note
  menuMus: null,
  startMenuMusic() {
    if (!this.ctx || this.menuMus) return;
    const ctx = this.ctx, t0 = ctx.currentTime;
    const bus = ctx.createGain(); bus.gain.setValueAtTime(0.0001, t0); bus.gain.linearRampToValueAtTime(0.8, t0 + 4);
    bus.connect(this.master);
    const send = ctx.createGain(); send.gain.value = 0.8; bus.connect(send); send.connect(this.verb);
    const nodes = [];
    // drone A1 + a low, rubbing Bb
    const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 220; dl.Q.value = 3;
    const dlfo = ctx.createOscillator(); dlfo.frequency.value = 0.045; const dlg = ctx.createGain(); dlg.gain.value = 110;
    dlfo.connect(dlg); dlg.connect(dl.frequency); dlfo.start(); nodes.push(dlfo);
    const dg = ctx.createGain(); dg.gain.value = 0.22; dl.connect(dg); dg.connect(bus);
    [[55, 0.5], [55.35, 0.5], [82.1, 0.22], [58.4, 0.1], [27.5, 0.35]].forEach(([f, g]) => {
      const o = ctx.createOscillator(); o.type = f < 30 ? 'sine' : 'sawtooth'; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = g; o.connect(og); og.connect(dl); o.start(); nodes.push(o);
    });
    // wind through the ward
    const w = ctx.createBufferSource(); w.buffer = this.bufs.brown; w.loop = true;
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.8;
    const wlfo = ctx.createOscillator(); wlfo.frequency.value = 0.07; const wlg = ctx.createGain(); wlg.gain.value = 220;
    wlfo.connect(wlg); wlg.connect(wf.frequency); wlfo.start(); nodes.push(wlfo);
    const wg = ctx.createGain(); wg.gain.value = 0.16; w.connect(wf); wf.connect(wg); wg.connect(bus); w.start(); nodes.push(w);
    const pad = (t, freqs, dur, gain, cut) => {
      freqs.forEach((f) => [-7, 6].forEach((det) => {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det + (Math.random() - 0.5) * 4;
        const vib = ctx.createOscillator(); vib.frequency.value = 4.6 + Math.random(); const vg = ctx.createGain(); vg.gain.value = 5;
        vib.connect(vg); vg.connect(o.detune);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(cut * 0.5, t); lp.frequency.linearRampToValueAtTime(cut, t + dur * 0.5); lp.frequency.linearRampToValueAtTime(cut * 0.4, t + dur);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(gain, t + dur * 0.4); g.gain.linearRampToValueAtTime(gain * 0.8, t + dur * 0.65); g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(lp); lp.connect(g); g.connect(bus);
        o.start(t); o.stop(t + dur + 0.1); vib.start(t); vib.stop(t + dur + 0.1);
      }));
    };
    const piano = (t, f) => { // muted low piano: soft hammer, inharmonic partials, long dark tail
      [1, 2.003, 3.01, 4.03].forEach((r, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * r;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16 / (1 + i * 1.6), t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 5 - i);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
        o.connect(lp); lp.connect(g); g.connect(bus); o.start(t); o.stop(t + 5.2);
      });
    };
    // Am  F  Dm  E(with the b9) — each chord swells in and dies away
    const CH = [[110, 130.8, 164.8], [87.3, 110, 130.8], [73.4, 87.3, 110], [82.4, 103.8, 87.3]];
    const LOW = [55, 43.65, 36.7, 41.2];
    const M = { bus, nodes, i: 0, next: t0 + 0.5, timer: null };
    M.timer = setInterval(() => {
      const now = ctx.currentTime;
      while (M.next < now + 1.5) {
        const k = M.i % 4, t = M.next;
        pad(t, CH[k], 10, 0.05, 900);
        if (M.i % 2 === 0) piano(t + 0.6 + Math.random() * 2, LOW[k] * 2);
        if (Math.random() < 0.35) pad(t + 3, [880 * (Math.random() < 0.5 ? 1 : 0.75), 932.3], 7, 0.008, 2600); // thin, sour high strings
        if (Math.random() < 0.3) this.creak(t + 4 + Math.random() * 3, 1.2, { f: 70, res: 900, gain: 0.05, wet: 0.9 });
        if (Math.random() < 0.2) this.metal(t + 2 + Math.random() * 5, { f: 160, decay: 1.6, gain: 0.025, wet: 0.95, muffle: 900 });
        M.i++; M.next += 8;
      }
    }, 500);
    this.menuMus = M;
  },
  stopMenuMusic() {
    const M = this.menuMus;
    if (!M) return;
    this.menuMus = null;
    clearInterval(M.timer);
    const t = this.ctx.currentTime;
    M.bus.gain.cancelScheduledValues(t); M.bus.gain.setValueAtTime(M.bus.gain.value, t); M.bus.gain.linearRampToValueAtTime(0.0001, t + 1.2);
    setTimeout(() => { M.nodes.forEach((n) => { try { n.stop(); } catch (e) {} }); M.bus.disconnect(); }, 1500);
  },
  // ---- terror radius drone: low rubbing saws, a sour high cluster creeping in when it's close ----
  terror: null,
  setTerror(level) {
    if (!this.ctx) return;
    let T = this.terror;
    if (!T) {
      if (level < 0.01) return;
      const ctx = this.ctx, g = ctx.createGain(); g.gain.value = 0; g.connect(this.master);
      const hg = ctx.createGain(); hg.gain.value = 0; hg.connect(this.master);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240; lp.Q.value = 3; lp.connect(g);
      const trem = ctx.createOscillator(); trem.frequency.value = 3.1; const tg = ctx.createGain(); tg.gain.value = 0.35; trem.connect(tg); tg.connect(g.gain);
      const nodes = [trem];
      [[55, 'sawtooth'], [58.3, 'sawtooth'], [41.2, 'sine']].forEach(([f, ty]) => { const o = ctx.createOscillator(); o.type = ty; o.frequency.value = f; o.connect(ty === 'sine' ? g : lp); nodes.push(o); });
      [880, 932.3, 987.8].forEach((f) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; const v = ctx.createOscillator(); v.frequency.value = 5 + Math.random() * 2; const vg = ctx.createGain(); vg.gain.value = 9; v.connect(vg); vg.connect(o.frequency); o.connect(hg); nodes.push(o, v); });
      nodes.forEach((n) => n.start());
      T = this.terror = { g, hg, nodes };
    }
    const t = this.ctx.currentTime;
    T.g.gain.setTargetAtTime(0.09 * level, t, 0.4);
    T.hg.gain.setTargetAtTime(0.012 * level * level, t, 0.6);
  },
  stopTerror() { if (this.terror) { this.terror.nodes.forEach((n) => { try { n.stop(); } catch (e) {} }); this.terror = null; } this.chaseLvl = 0; },
  // ---- chase music: kick, ticks, toms and spiccato low strings at 150 bpm while it's after you ----
  chaseLvl: 0, chaseNext: 0, chaseStep: 0,
  chaseTick(dt, on) {
    if (!this.ok()) return;
    this.chaseLvl += ((on ? 1 : 0) - this.chaseLvl) * Math.min(1, dt * (on ? 4 : 0.45));
    if (this.chaseLvl < 0.03) { this.chaseNext = 0; return; }
    const ctx = this.ctx, now = ctx.currentTime, six = 60 / 150 / 4, k = this.chaseLvl;
    if (this.chaseNext < now) this.chaseNext = now + 0.03;
    const NOTES = [82.41, 82.41, 164.8, 82.41, 87.31, 82.41, 98.0, 87.31];
    while (this.chaseNext < now + 0.2) {
      const t = this.chaseNext, i = this.chaseStep++;
      if (i % 4 === 0) { this.osc(t, 0.3, { f: 125, f2: 42, gain: 0.5 * k }); this.noise(t, 0.012, { type: 'highpass', f: 2500, gain: 0.12 * k }); }
      if (i % 2 === 0) this.noise(t, 0.03, { type: 'highpass', f: 7000, gain: 0.05 * k, wet: 0.1 });
      if (i % 4 === 2) { this.osc(t, 0.35, { f: 78, f2: 44, gain: 0.3 * k }); this.noise(t, 0.07, { type: 'lowpass', f: 600, gain: 0.16 * k, wet: 0.3 }); }
      const f = NOTES[i % 8];
      [-8, 7].forEach((d) => {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900 + 1800 * k; lp.Q.value = 2;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.1 * k * (i % 4 === 0 ? 1 : 0.7), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
        o.connect(lp); lp.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.15);
      });
      this.chaseNext += six;
    }
  },
  buzzes: [],
  setBuzz(i, vol, pan) { // a dead generator's faulty wiring: an electrical fizz you can follow
    if (!this.ctx) return;
    let b = this.buzzes[i];
    if (!b) {
      if (vol <= 0.0005) return;
      const ctx = this.ctx;
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 100 + i * 3;
      const n = ctx.createBufferSource(); n.buffer = this.bufs.white; n.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 3;
      const am = ctx.createOscillator(); am.type = 'square'; am.frequency.value = 2.3 + i * 0.4;
      const amg = ctx.createGain(); amg.gain.value = 0.5;
      const mix = ctx.createGain(); mix.gain.value = 0.5;
      am.connect(amg); amg.connect(mix.gain);
      const ng = ctx.createGain(); ng.gain.value = 0.35;
      o.connect(f); n.connect(ng); ng.connect(f); f.connect(mix);
      const g = ctx.createGain(); g.gain.value = 0;
      const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      mix.connect(g);
      if (p) { g.connect(p); p.connect(this.master); } else g.connect(this.master);
      const send = ctx.createGain(); send.gain.value = 0.4; g.connect(send); send.connect(this.verb);
      o.start(); n.start(); am.start();
      b = this.buzzes[i] = { nodes: [o, n, am], g, p };
    }
    const t = this.ctx.currentTime;
    b.g.gain.setTargetAtTime(vol, t, 0.2);
    if (b.p) b.p.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.2);
  },
  stopBuzzes() {
    this.buzzes.forEach((b) => { if (b) b.nodes.forEach((n) => { try { n.stop(); } catch (e) {} }); });
    this.buzzes = [];
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
  ctx.font = '400 120px "East Sea Dokdo", "Nanum Pen Script", sans-serif';
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
  ctx.fillStyle = 'rgba(48,3,5,.88)';
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
  lostTimer: 0, searchTimer: 0, lastKnown: { r: 0, c: 0 }, huntLocker: null, huntSpare: false, lured: false, directorT: 40, peek: null,
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

  ambientLight = new THREE.AmbientLight(0x6f7f9c, 0.3);
  scene.add(ambientLight);
  hemiLight = new THREE.HemisphereLight(0x8494b4, 0x1c1610, 0.2);
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
    const l = new THREE.PointLight(0xd6e6ff, 0, 9, 2);
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

function makeProp(gltf, targetH, rotY = 0, opts = {}) {
  const pivot = new THREE.Group();
  const inner = gltf.scene.clone(true);
  inner.rotation.set(opts.rotX || 0, rotY, 0);
  inner.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inner);
  const size = box.getSize(new THREE.Vector3());
  const s = opts.fitW ? opts.fitW / size.x : targetH / size.y;
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
const simpleBox = (w, h, d, mat) => { const g = new THREE.Group(); g.add(box(w, h, d, mat, 0, h / 2, 0)); return { g, w, d }; };
Object.assign(PROP_BUILDERS, {
  stretcher() { return PROP_BUILDERS.gurneyBag(); },
  metalChair() { return simpleBox(0.5, 0.85, 0.5, shared.rust); },
  filing() { return simpleBox(0.6, 1.35, 0.7, shared.metal); },
  mop() { return simpleBox(0.7, 0.5, 0.4, new THREE.MeshStandardMaterial({ color: 0xb59a1c, roughness: 0.6 })); },
  trash() { const g = new THREE.Group(); g.add(cyl(0.25, 0.65, shared.metal, 0, 0.325, 0, 12)); return { g, w: 0.5, d: 0.5 }; },
  reception() { return simpleBox(1.9, 1.1, 0.7, shared.wood); },
  extinguisher() { const g = new THREE.Group(); g.add(cyl(0.08, 0.5, new THREE.MeshStandardMaterial({ color: 0xa31515, roughness: 0.4 }), 0, 0.25, 0, 10)); return { g, w: 0.2, d: 0.2 }; },
  clock() { const g = new THREE.Group(); const m = cyl(0.22, 0.05, shared.enamel, 0, 0.22, 0, 20); m.rotation.x = Math.PI / 2; g.add(m); return { g, w: 0.45, d: 0.06 }; },
  phone() { return simpleBox(0.2, 0.4, 0.12, shared.enamel); }
});

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
  reserved.add(cellKey(23, 16)); reserved.add(cellKey(23, 15)); reserved.add(cellKey(23, 17));

  // --- props: themed groups standing against walls (each wing has its own kind of clutter) ---
  const faceKey = (r, c, w) => `${r},${c},${w[0]},${w[1]}`;
  const usedFaces = new Set();
  const isJunction = (cl) => openNeighbors(cl.r, cl.c).length >= 3;
  const zoneOf = (r, c) => (r < 12 ? (c < 12 ? 'ward' : 'medical') : (c < 12 ? 'admin' : 'patient'));
  const POOLS = {
    ward: ['patient', 'patient', 'patient', 'wheelchair', 'wheelchair', 'trash', 'janitor'],
    medical: ['gurney', 'gurney', 'cart', 'cart', 'cabinet', 'cabinet', 'patient'],
    admin: ['waiting', 'waiting', 'office', 'office', 'cabinet', 'trash', 'janitor'],
    patient: ['patient', 'patient', 'gurney', 'wheelchair', 'wheelchair', 'trash', 'janitor']
  };
  // [builder, offset along the wall (m), rotation jitter]
  const GROUPS = {
    patient: [['bed', 0.25, 0], ['ivStand', -1.15, 0]],
    gurney: [['stretcher', 0, 0.12]],
    wheelchair: [['wheelchair', 0, 0.6]],
    cart: [['cart', -0.45, 0.1], ['tray', 0.55, 0]],
    cabinet: [['cabinet', -0.5, 0], ['cabinet', 0.65, 0]],
    waiting: [['metalChair', -0.75, 0.05], ['metalChair', 0, 0.05], ['metalChair', 0.75, 0.05], ['trash', 1.45, 0.3]],
    office: [['filing', -0.55, 0.12], ['boxes', 0.6, 0.35]],
    janitor: [['mop', -0.35, 0.5], ['trash', 0.5, 0.3]],
    trash: [['trash', 0, 0.4]]
  };
  const placeGroup = (cl, wall, kind) => {
    const parts = GROUPS[kind].map(([type, along, jit]) => ({ type, along, jit, ...PROP_BUILDERS[type]() }));
    const lo = Math.min(...parts.map((p) => p.along - p.w / 2)), hi = Math.max(...parts.map((p) => p.along + p.w / 2));
    const room = CELL_SIZE / 2 - 0.25;
    const slide = (-room - lo) + rnd() * Math.max(0, (room - hi) - (-room - lo));
    const ax = -wall[0], az = wall[1]; // along-wall unit vector
    parts.forEach((p) => {
      const pl = placeAgainstWall(cl.r, cl.c, p.d, wall);
      const a = p.along + slide;
      const x = pl.x + ax * a, z = pl.z + az * a;
      p.g.position.set(x, 0, z);
      p.g.rotation.y = pl.rotY + (rnd() - 0.5) * p.jit;
      p.g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(p.g);
      addCollider(x, z, pl.rotY, p.w + 0.05, p.d + 0.05);
      decorList.push({ type: p.type, x, z, rotY: pl.rotY });
    });
    usedFaces.add(faceKey(cl.r, cl.c, wall));
  };
  const okWall = (cl, w) => !(cl.r === 2 && cl.c === 19 && w[0] === -1);
  const cand = shuffle(OPEN_CELLS.filter((cl) => !reserved.has(cellKey(cl.r, cl.c)) && !isJunction(cl) && wallNeighbors(cl.r, cl.c).some((w) => okWall(cl, w))), rnd);
  const chosen = [];
  for (const cl of cand) {
    if (chosen.length >= 30) break;
    if (chosen.some((o) => manhattan(o, cl) < 3)) continue;
    chosen.push(cl);
  }
  chosen.forEach((cl) => {
    const walls = wallNeighbors(cl.r, cl.c).filter((w) => okWall(cl, w));
    const wall = walls[Math.floor(rnd() * walls.length)];
    const pool = POOLS[zoneOf(cl.r, cl.c)];
    placeGroup(cl, wall, pool[Math.floor(rnd() * pool.length)]);
    reserved.add(cellKey(cl.r, cl.c) + 0.5);
  });

  // --- wall-mounted things: extinguishers near crossings, clocks and phones in the admin side ---
  const faces = [];
  OPEN_CELLS.forEach((cl) => wallNeighbors(cl.r, cl.c).forEach((w) => {
    if (!okWall(cl, w)) return;
    if (ROOMS.some((rm) => rm.door.r === cl.r && rm.door.c === cl.c && roomAt[cl.r + w[0]][cl.c + w[1]] >= 0)) return; // real room door
    if (usedFaces.has(faceKey(cl.r, cl.c, w))) return;
    faces.push({ r: cl.r, c: cl.c, w });
  }));
  shuffle(faces, rnd);
  const takeFaces = (n, filter, spacing) => {
    const out = [];
    for (let i = 0; i < faces.length && out.length < n; i++) {
      const f = faces[i];
      if (usedFaces.has(faceKey(f.r, f.c, f.w)) || !filter(f) || out.some((o) => manhattan(o, f) < spacing)) continue;
      out.push(f); usedFaces.add(faceKey(f.r, f.c, f.w));
    }
    return out;
  };
  const mount = (type, f, baseY, slideMax = 1.2) => {
    const { g, d } = PROP_BUILDERS[type]();
    const wf = wallFace(f.r, f.c, f.w, d / 2 + 0.02);
    const slide = (rnd() - 0.5) * 2 * slideMax;
    g.position.set(wf.x + wf.along[0] * slide, baseY, wf.z + wf.along[1] * slide);
    g.rotation.y = wf.rotY;
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
  };
  const nearJunction = (f) => DIRS.some(([dr, dc]) => isOpen(f.r + dr, f.c + dc) && openNeighbors(f.r + dr, f.c + dc).length >= 3);
  takeFaces(10, nearJunction, 5).forEach((f) => mount('extinguisher', f, 0.75));
  takeFaces(4, (f) => ['admin', 'ward'].includes(zoneOf(f.r, f.c)), 7).forEach((f) => mount('clock', f, 2.25, 0.6));
  takeFaces(4, (f) => ['admin', 'medical'].includes(zoneOf(f.r, f.c)), 7).forEach((f) => mount('phone', f, 1.15));

  // --- reception desk by the start: where the night shift sat ---
  {
    const cl = { r: 23, c: 16 };
    const wall = [1, 0];
    const rec = PROP_BUILDERS.reception();
    const pl = placeAgainstWall(cl.r, cl.c, rec.d + 1.3, wall); // leave room for the chair behind it
    rec.g.position.set(pl.x, 0, pl.z);
    rec.g.rotation.y = pl.rotY;
    scene.add(rec.g);
    addCollider(pl.x, pl.z, pl.rotY, rec.w + 0.05, rec.d + 0.05);
    const ch = PROP_BUILDERS.officeChair();
    ch.g.position.set(pl.x + 0.3, 0, pl.z + rec.d / 2 + 0.42);
    ch.g.rotation.y = Math.PI + 0.4;
    scene.add(ch.g);
    addCollider(ch.g.position.x, ch.g.position.z, 0, ch.w, ch.d);
    usedFaces.add(faceKey(cl.r, cl.c, wall));
  }

  // --- wall decals: room doors, writing (on walls nothing else is using) ---
  // locked patient-room doors along the corridors: real door models in a steel frame with a room plate
  const doorGeo = new THREE.PlaneGeometry(1.3, 2.3);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2e2c, roughness: 0.55, metalness: 0.5 });
  let num = 401;
  takeFaces(18, () => true, 2).forEach((f, i) => {
    const wf = wallFace(f.r, f.c, f.w, 0);
    const slide = (rnd() - 0.5) * 1.6;
    const g = new THREE.Group();
    g.position.set(wf.x + wf.along[0] * slide, 0, wf.z + wf.along[1] * slide);
    g.rotation.y = wf.rotY;
    const model = assets[(i + num) % 3 === 0 ? 'door_b' : 'door_a'];
    if (model) {
      const lf = makeProp(model, 2.3);
      lf.pivot.scale.x = 1.2 / lf.w;
      lf.pivot.position.z = lf.d / 2 - 0.06;
      g.add(lf.pivot);
      [-1, 1].forEach((k) => g.add(box(0.09, 2.38, 0.14, frameMat, k * 0.645, 1.19, 0.04)));
      g.add(box(1.38, 0.09, 0.14, frameMat, 0, 2.42, 0.04));
    } else {
      const m = new THREE.Mesh(doorGeo, new THREE.MeshStandardMaterial({ map: createRoomDoorTexture(num), roughness: 0.7, metalness: 0.1,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
      m.position.set(0, 1.15, 0.025);
      g.add(m);
    }
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.16), new THREE.MeshStandardMaterial({ map: createRoomSignTexture(String(num), '병실'), roughness: 0.6 }));
    plate.position.set(0, 2.66, 0.012);
    g.add(plate);
    num++;
    decorList.push({ type: 'fakeDoor', x: g.position.x, z: g.position.z, rotY: wf.rotY });
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g);
  });
  const WRITINGS = ['뛰지 마', '듣고 있다', '불 꺼', '도망쳐', '웃지 마', '404', '여기 없어', '보지 마', '숨어', '하하하하'];
  const writeGeo = new THREE.PlaneGeometry(2.4, 1.2);
  takeFaces(WRITINGS.length, () => true, 4).forEach((f, i) => {
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
  const hangCells = shuffle(OPEN_CELLS.filter((cl) => !isJunction(cl)), rnd).slice(0, 14);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x45453f, roughness: 0.95 });
  hangCells.slice(0, 6).forEach((cl) => {
    const p = gridToWorld(cl.r, cl.c);
    const m = box(1.0, 0.03, 0.6, panelMat, p.x + (rnd() - 0.5) * 2, WALL_HEIGHT - 0.32, p.z + (rnd() - 0.5) * 2);
    m.rotation.set(0.6 + rnd() * 0.4, rnd() * 3, 0.2);
    m.castShadow = true;
    scene.add(m);
  });
  hangCells.slice(6).forEach((cl) => {
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
  ctx.fillStyle = '#e8e2d4'; ctx.font = '400 40px VT323, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(num, 46, 42);
  ctx.fillStyle = '#1b1b1b'; ctx.font = '800 32px "Nanum Myeongjo", serif'; ctx.textAlign = 'left';
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
    patchWallMaterial(roomMat); wallMats.push(roomMat);
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
        const locker = { kind: 'locker', pivot: prop.pivot, x, z, rotY, depth: prop.d, anchor, col, r: g.r, c: g.c };
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
      if (type === 'bed' || type === 'desk') addCrawlSpot(type, g, x, z, rotY, w, d);
    });
  });
}

// crawl-under hiding: beds in the ward, desks in the nurses' station
function addCrawlSpot(kind, g, x, z, rotY, w, d) {
  const isBed = kind === 'bed';
  const top = isBed ? 0.52 : 0.7;               // underside of the mattress / desktop
  const um = new THREE.MeshStandardMaterial({ color: 0x14100d, roughness: 0.95 });
  const slab = new THREE.Group();
  slab.add(box(w * 0.9, 0.03, d * 0.9, um, 0, top, 0));
  if (isBed) { // the bed frame rails and a sagging blanket edge hem you in
    const rm = new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 0.7, metalness: 0.5 });
    [-1, 1].forEach((k) => { slab.add(box(w * 0.9, 0.09, 0.04, rm, 0, top - 0.05, k * d * 0.44)); slab.add(box(0.04, 0.09, d * 0.9, rm, k * w * 0.44, top - 0.05, 0)); });
    const blanket = box(w * 0.86, 0.16, 0.015, new THREE.MeshStandardMaterial({ color: 0x5b5a52, roughness: 1 }), 0, top - 0.12, d * 0.46);
    blanket.rotation.x = 0.12; slab.add(blanket);
  }
  slab.visible = false;
  g.add(slab);
  const gc = worldToGrid(x, z);
  const anchor = makeAnchor(x, 0.6, z, { type: 'LOCKER', label: isBed ? '침대 밑에 숨기' : '책상 밑에 숨기' });
  const spot = { kind, pivot: null, slab, x, z, rotY, depth: d, w, eyeY: isBed ? 0.27 : 0.42, anchor, r: gc.r, c: gc.c };
  anchor.userData.locker = spot;
  lockerObjects.push(spot);
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
const wallMats = [];

// ---- walls that don't look like a printed photo ----
// The tile texture is mapped in world space (continuous along a corridor, no 4 m seams), the
// damage is mixed from two grid-aligned copies so no two stretches look the same, and on top of
// that: grime blotches, rust/water streaks running down from the ceiling, dirt creeping up from the
// floor and darkened corners. Tiles get a glossy roughness map so the flashlight glints off them.
const WALL_GLSL_NOISE = `
  float wh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float wn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(wh(i), wh(i + vec2(1, 0)), f.x), mix(wh(i + vec2(0, 1)), wh(i + vec2(1, 1)), f.x), f.y); }
  float wfbm(vec2 p) { return wn(p) * 0.55 + wn(p * 2.1 + 7.3) * 0.3 + wn(p * 4.3 + 1.7) * 0.15; }
`;
function patchWallMaterial(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying float vAlong;')
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        vec4 wpw = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          wpw = instanceMatrix * wpw;
        #endif
        wpw = modelMatrix * wpw;
        vec3 wn0 = normalize(mat3(modelMatrix) * normal);
        float along = abs(wn0.x) > 0.5 ? wpw.z * sign(wn0.x) : -wpw.x * sign(wn0.z);
        vAlong = along;
        vWPos = wpw.xyz;
        vec2 wuv = vec2(along / ${CELL_SIZE.toFixed(1)}, wpw.y / ${WALL_HEIGHT.toFixed(2)});
        #ifdef USE_MAP
          vMapUv = wuv;
        #endif
        #ifdef USE_BUMPMAP
          vBumpMapUv = wuv;
        #endif
        #ifdef USE_ROUGHNESSMAP
          vRoughnessMapUv = wuv;
        #endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying float vAlong;' + WALL_GLSL_NOISE)
      .replace('#include <map_fragment>', `
        #ifdef USE_MAP
          // second copy shifted by whole tiles: same grout grid, different cracks/holes/stains
          float pick = smoothstep(0.35, 0.65, wn(vec2(vAlong * 0.11, 3.7)));
          float k = floor(wh(vec2(floor(vAlong * 0.11 + 0.5), 1.3)) * 14.0) + 1.0;
          vec4 tA = texture2D(map, vMapUv);
          vec4 tB = texture2D(map, vMapUv + vec2(k / 15.0, 0.0));
          diffuseColor *= mix(tA, tB, pick);
        #endif
        {
          float y = vWPos.y;
          vec2 q = vec2(vAlong, y);
          // grime blotches
          float g = wfbm(q * 0.55 + vec2(vWPos.x * 0.07, 0.0));
          diffuseColor.rgb *= mix(1.0, 0.5, smoothstep(0.47, 0.82, g));
          // streaks running down from the ceiling (rust / damp)
          float col = wn(vec2(vAlong * 6.5, 0.0)) * wn(vec2(vAlong * 1.3, 5.0));
          float run = wn(vec2(vAlong * 6.5, y * 0.35));
          float streak = smoothstep(0.32, 0.6, col) * smoothstep(0.35, 0.8, run) * smoothstep(0.6, 2.9, y);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.55, 0.42, 0.3), streak * 0.75);
          // dirt and damp creeping up from the floor, soot under the ceiling
          float floorDirt = 1.0 - smoothstep(0.0, 0.55 + 0.35 * wn(q * vec2(1.5, 0.0) + 2.0), y);
          diffuseColor.rgb *= mix(1.0, 0.45, floorDirt);
          diffuseColor.rgb *= mix(1.0, 0.6, smoothstep(${(WALL_HEIGHT - 0.7).toFixed(2)}, ${WALL_HEIGHT.toFixed(2)}, y));
          // corners: every wall cell edge is a corner or a junction, keep them dark
          float e = abs(fract(vAlong / ${CELL_SIZE.toFixed(1)}) - 0.5) * 2.0;
          diffuseColor.rgb *= mix(1.0, 0.72, smoothstep(0.86, 1.0, e));
        }`);
  };
  mat.customProgramCacheKey = () => 'wallWS';
  mat.needsUpdate = true;
}
// gloss on the glazed tiles, matte grout, flat chalky paint below the rail
function makeWallRoughness(img) {
  const N = 512, [c, ctx] = canvasOf(N, N);
  ctx.drawImage(img, 0, 0, N, N);
  const d = ctx.getImageData(0, 0, N, N), px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    const y = (i / 4 / N) | 0;
    const l = (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11) / 255;
    let r = y < N * 0.58 ? 0.95 - Math.min(1, Math.max(0, (l - 0.42) / 0.3)) * 0.45 : 0.88 - l * 0.15;
    r = Math.round(Math.max(0.2, Math.min(1, r)) * 255);
    px[i] = px[i + 1] = px[i + 2] = r;
  }
  ctx.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// the rail painted on the tile texture becomes a real steel rail standing off the wall
function buildRails() {
  const RAIL_Y = WALL_HEIGHT * 0.428;
  const blocked = decorList.filter((d) => d.type === 'fakeDoor').map((d) => [d.x, d.z]);
  const ex = gridToWorld(EXIT_CELL.r, EXIT_CELL.c);
  const segs = [];
  for (let r = 0; r < MAP_SIZE; r++) for (let c = 0; c < MAP_SIZE; c++) {
    if (gridState[r][c] !== 1 || (r === EXIT_CELL.r && c === EXIT_CELL.c)) continue;
    const p = gridToWorld(r, c);
    DIRS.forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= MAP_SIZE || nc >= MAP_SIZE || gridState[nr][nc] !== 0) return;
      const fx = p.x + dc * (CELL_SIZE / 2 + 0.055), fz = p.z + dr * (CELL_SIZE / 2 + 0.055);
      if (blocked.some(([x, z]) => Math.hypot(x - fx, z - fz) < 1.6)) return;
      if (Math.hypot(ex.x - fx, ex.z - fz) < 1) return;
      segs.push({ x: fx, z: fz, along: dr !== 0 ? 'x' : 'z', bx: p.x + dc * (CELL_SIZE / 2 + 0.02), bz: p.z + dr * (CELL_SIZE / 2 + 0.02) });
    });
  }
  const railMat = new THREE.MeshStandardMaterial({ color: 0x4a443e, roughness: 0.38, metalness: 0.75 });
  const rail = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.028, 0.028, CELL_SIZE + 0.02, 8), railMat, segs.length);
  const brk = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.03, 0.07), railMat, segs.length * 2);
  const m4 = new THREE.Matrix4(), qx = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), qz = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  const one = new THREE.Vector3(1, 1, 1), yaw90 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)), noRot = new THREE.Quaternion();
  segs.forEach((sg, i) => {
    rail.setMatrixAt(i, m4.compose(new THREE.Vector3(sg.x, RAIL_Y, sg.z), sg.along === 'x' ? qx : qz, one));
    [-1, 1].forEach((k, j) => {
      const ox = sg.along === 'x' ? k * 1.2 : 0, oz = sg.along === 'z' ? k * 1.2 : 0;
      brk.setMatrixAt(i * 2 + j, m4.compose(new THREE.Vector3((sg.x + sg.bx) / 2 + ox, RAIL_Y, (sg.z + sg.bz) / 2 + oz), sg.along === 'x' ? noRot : yaw90, one));
    });
  });
  rail.castShadow = true; rail.receiveShadow = true;
  scene.add(rail, brk);
}

// a faint cone of dusty light under every lamp that still works
const shaftMats = {};
function buildLightShafts() {
  const geo = new THREE.CylinderGeometry(0.35, 1.5, WALL_HEIGHT - 0.12, 20, 1, true);
  geo.translate(0, -(WALL_HEIGHT - 0.12) / 2, 0);
  const mk = (strength) => new THREE.ShaderMaterial({
    uniforms: { uStr: { value: strength }, fogColor: { value: scene.fog.color }, fogDensity: { value: scene.fog.density } },
    vertexShader: `varying float vH; varying vec3 vN; varying vec3 vV; varying float vDepth;
      void main() { vH = -position.y / ${(WALL_HEIGHT - 0.12).toFixed(2)};
        vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vDepth = -mv.z;
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uStr; uniform vec3 fogColor; uniform float fogDensity;
      varying float vH; varying vec3 vN; varying vec3 vV; varying float vDepth;
      void main() { float edge = pow(abs(dot(vN, vV)), 1.6);
        float a = edge * (1.0 - vH) * (1.0 - vH) * uStr * smoothstep(0.0, 1.2, vDepth);
        float fog = exp(-fogDensity * fogDensity * vDepth * vDepth);
        gl_FragColor = vec4(vec3(0.85, 0.92, 1.0) * a * fog, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  shaftMats.on = mk(0.11); shaftMats.flicker = mk(0.11);
  lampList.forEach((l) => {
    if (l.type === 'dead') return;
    const m = new THREE.Mesh(geo, shaftMats[l.type]);
    m.position.set(l.x, WALL_HEIGHT - 0.1, l.z);
    m.renderOrder = 2;
    scene.add(m);
  });
  shaftMats.geo = geo;
}

function buildLevelGeometry() {
  gridState = makeGridState();
  buildSharedMaterials();
  Object.entries(GLB_PROPS).forEach(([name, cfg]) => {
    if (!assets[cfg.key]) return;
    PROP_BUILDERS[name] = () => {
      const p = makeProp(assets[cfg.key], cfg.h, cfg.rot || 0);
      if (cfg.hang) { // ceiling-mounted: no footprint
        const g = new THREE.Group();
        p.pivot.position.y = WALL_HEIGHT - p.h;
        const gl = makeGlow(0xfff2d0, 1.4, 0.45); gl.position.y = WALL_HEIGHT - p.h + 0.1;
        g.add(p.pivot, gl);
        return { g, w: 0, d: 0 };
      }
      if (cfg.glow) { const gl = makeGlow(0xffd8c8, 1.8, 0.3); gl.position.set(0, p.h * 0.62, p.d / 2 + 0.2); p.pivot.add(gl); }
      return { g: p.pivot, w: p.w, d: p.d };
    };
  });
  const wallTex = loadTex('assets/tex/wall.jpg', 1, 1, createWallTexture);
  const floorTex = loadTex('assets/tex/floor.jpg', MAP_SIZE, MAP_SIZE, createFloorTexture);
  const ceilTex = loadTex('assets/tex/ceil.jpg', MAP_SIZE * 2, MAP_SIZE * 2, createCeilingTexture);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xb4b4b4, map: wallTex, bumpMap: wallTex, bumpScale: 0.9, roughness: 0.78, metalness: 0.02 });
  patchWallMaterial(wallMat);
  const applyRough = () => {
    if (!wallTex.image || !wallTex.image.width) return;
    wallMat.roughnessMap = makeWallRoughness(wallTex.image); wallMat.roughness = 1; wallMat.needsUpdate = true;
    wallMats.forEach((m) => { m.roughnessMap = wallMat.roughnessMap; m.roughness = 1; m.needsUpdate = true; });
  };
  (function waitWallTex() { if (wallTex.image && wallTex.image.width) applyRough(); else setTimeout(waitWallTex, 200); })();
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xa6a6a6, map: floorTex, bumpMap: floorTex, bumpScale: 0.35, roughness: 0.42, metalness: 0.06 });
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x8c8c8c, map: ceilTex, roughness: 0.95 });
  floorMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vFW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvFW = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vFW;' + WALL_GLSL_NOISE)
      .replace('#include <map_fragment>', `#include <map_fragment>
        float fg = wfbm(vFW * 0.35);
        diffuseColor.rgb *= mix(1.0, 0.55, smoothstep(0.5, 0.82, fg));
        float wet = smoothstep(0.62, 0.7, wfbm(vFW * 0.22 + 11.0));
        diffuseColor.rgb *= mix(1.0, 0.7, wet);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.06, smoothstep(0.62, 0.7, wfbm(vFW * 0.22 + 11.0)));`);
  };
  floorMat.customProgramCacheKey = () => 'floorWS';
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
    lampList.push({ x: p.x, z: p.z, type, base: type });
  });
  const fixMesh = assets.fluoro ? (() => { let m = null; assets.fluoro.scene.traverse((o) => { if (o.isMesh && !m) m = o; }); return m; })() : null;
  let tubeY = WALL_HEIGHT - 0.03;
  if (fixMesh) {
    // one instanced housing for every lamp; the glowing tube is a thin box under it
    fixMesh.geometry.computeBoundingBox();
    const bb = fixMesh.geometry.boundingBox, sz = bb.getSize(new THREE.Vector3()), ctr = bb.getCenter(new THREE.Vector3());
    const sc = 1.35 / sz.x;
    const local = new THREE.Matrix4().makeScale(sc, sc, sc).multiply(new THREE.Matrix4().makeTranslation(-ctr.x, -bb.max.y, -ctr.z));
    const all = [...lampCells.on, ...lampCells.flicker, ...lampCells.dead];
    const housing = new THREE.InstancedMesh(fixMesh.geometry, fixMesh.material, all.length);
    all.forEach(([r, c], i) => { const p = gridToWorld(r, c); housing.setMatrixAt(i, new THREE.Matrix4().makeTranslation(p.x, WALL_HEIGHT, p.z).multiply(local)); });
    scene.add(housing);
    tubeY = WALL_HEIGHT - sz.y * sc * 0.75;
  }
  lampTubeY = tubeY;
  const tubeGeo = fixMesh ? new THREE.BoxGeometry(1.15, 0.035, 0.08) : lampGeo;
  Object.keys(lampCells).forEach((k) => {
    const im = new THREE.InstancedMesh(tubeGeo, lampMats[k], lampCells[k].length);
    lampCells[k].forEach(([r, c], i) => { const p = gridToWorld(r, c); im.setMatrixAt(i, m4.makeTranslation(p.x, tubeY, p.z)); });
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
    const beacon = makeGlow(0xff1a1a, 3.6, 0.8);
    beacon.material.fog = false;
    beacon.position.set(prop.w * 0.32, prop.h + 0.12, 0);
    prop.pivot.add(beacon);
    glow.position.copy(lamp.position);
    prop.pivot.add(lamp, cage, glow);
    const anchor = makeAnchor(0, 1.0, 0, { type: 'GENERATOR', genIndex: idx, label: '발전기 가동' });
    const col = addCollider(0, 0, 0, prop.w + 0.1, prop.d + 0.1);
    generatorObjects.push({ ...prop, innerBase: prop.inner.position.clone(), lampMat, glow, beacon, anchor, col, r: 0, c: 0 });
  }

  // Keycard on a pedestal (moved every run)
  {
    const g = new THREE.Group();
    const ped = assets.pedestal ? makeProp(assets.pedestal, 0.95).pivot : cyl(0.38, 0.95, new THREE.MeshStandardMaterial({ color: 0x23272b, roughness: 0.5, metalness: 0.5 }), 0, 0.475, 0, 16);
    ped.castShadow = ped.receiveShadow = true;
    const card = new THREE.Group();
    if (assets.keycard) {
      const k = makeProp(assets.keycard, 0.32);
      k.pivot.position.y = -k.h / 2;
      card.add(k.pivot);
    } else {
      card.add(box(0.42, 0.27, 0.02, new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 0.35 }), 0, 0, 0));
      card.add(box(0.42, 0.05, 0.022, new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x38bdf8, emissiveIntensity: 2 }), 0, 0.06, 0));
    }
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
    const locker = { kind: 'locker', pivot: prop.pivot, x: pl.x, z: pl.z, rotY: pl.rotY, depth: prop.d, anchor, col, r: lk.r, c: lk.c };
    anchor.userData.locker = locker;
    lockerObjects.push(locker);
  });

  buildRooms(wallMat, trimMat);
  decorReserved = buildDecor();
  buildRails();
  buildLightShafts();
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
      if (assets.battery) g.add(makeProp(assets.battery, 0.22).pivot);
      else {
        const b = cyl(0.045, 0.16, battBody, 0, 0.045, 0, 12); b.rotation.z = Math.PI / 2;
        const t = cyl(0.02, 0.02, battTop, 0.09, 0.045, 0, 8); t.rotation.z = Math.PI / 2;
        g.add(b, t);
      }
      glowColor = 0xffe08a;
    } else if (type === 'bottle') {
      if (assets.bottle) g.add(makeProp(assets.bottle, 0.3).pivot);
      else g.add(cyl(0.05, 0.2, shared.glass, 0, 0.1, 0, 10), cyl(0.018, 0.08, shared.glass, 0, 0.24, 0, 8));
      glowColor = 0xbfffcf;
    } else {
      if (assets.note) g.add(makeProp(assets.note, 0, 0, { rotX: -Math.PI / 4, fitW: 0.34 }).pivot);
      else { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.3), shared.paper); p.rotation.x = -Math.PI / 2; p.position.y = 0.015; g.add(p); }
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
    monster.model = model;
    monster.mixer = new THREE.AnimationMixer(model);
    const clip = (n) => assets.monster.animations.find((a) => a.name === n);
    const map = { walk: 'Limping_Walk_3_inplace', search: 'Look_Around_Dumbfounded', run: 'Lean_Forward_Sprint_inplace', lunge: 'Lean_Forward_Sprint_inplace' };
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
  if (monster.model) { monster.model.rotation.set(0, 0, 0); monster.model.position.y = 0; }
  Object.assign(monster, { peek: null, heading: 0, state: 'PATROL', huntLocker: null, huntSpare: false, lostTimer: 0, searchTimer: 0, repathTimer: 0, lured: false, speed: 0, directorT: 45 });
  pickPatrolGoal(true);
  if (monster.group) monster.group.position.copy(monster.pos);
  setMonsterAnim('walk', 1);
}

function setGoalCell(r, c) { monster.goalR = r; monster.goalC = c; monster.repathTimer = 0; }

function pickPatrolGoal(random) {
  const pg = worldToGrid(player.pos.x, player.pos.z);
  let node;
  if (!random && Math.random() < 0.5) {
    const sorted = PATROL_NODES.slice().sort((a, b) => (Math.abs(a.r - pg.r) + Math.abs(a.c - pg.c)) - (Math.abs(b.r - pg.r) + Math.abs(b.c - pg.c)));
    node = sorted[Math.floor(Math.random() * 3)];
  } else node = PATROL_NODES[Math.floor(Math.random() * PATROL_NODES.length)];
  setGoalCell(node.r, node.c);
}

const flashOn = () => gameState.flashOn && gameState.battery > 0 && !gameState.isHidden;

function monsterCanSee() {
  if (gameState.isHidden || (window.__cine && window.__cine.blind)) return false; // __cine: trailer capture only
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

// ---- generator start-up: a spinning dial, each hit is one crank of the starter ----
const arcPath = (a0, a1, r = 44) => {
  const p = (a) => { const t = (a - 90) * Math.PI / 180; return `${(60 + r * Math.cos(t)).toFixed(2)} ${(60 + r * Math.sin(t)).toFixed(2)}`; };
  return `M ${p(a0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(a1)}`;
};
function randomizeGaugeZone(stage) {
  const width = Math.max(12, 22 - stage * 4) * diff.gauge;     // % of a full turn
  const start = 20 + Math.random() * (100 - width - 25);
  gameState.gaugeTargetWidth = width;
  gameState.gaugeTargetStart = start;
  gameState.gaugeSpeed = (48 + stage * 14) / Math.sqrt(diff.gauge); // % of a turn per second
  gameState.gaugeDir = Math.random() < 0.5 ? 1 : -1;     // it can spin either way
  // the green zone slips around the dial against the needle, faster each crank
  gameState.gaugeDrift = -gameState.gaugeDir * (6 + stage * 9) / Math.sqrt(diff.gauge);  // the zone always slips, faster each crank
  gameState.gaugeFlipT = 0.7 + Math.random() * 1.2;                                      // and the needle can kick back the other way
  gameState.gaugeStage = stage;
  const pw = Math.max(3.5, width * 0.28);
  gameState.gaugePerfectStart = start + (width - pw) / 2;
  gameState.gaugePerfectWidth = pw;
  drawGaugeZone();
}
function drawGaugeZone() {
  const start = gameState.gaugeTargetStart, width = gameState.gaugeTargetWidth, pw = gameState.gaugePerfectWidth;
  $('dial-zone').setAttribute('d', arcPath(start * 3.6, (start + width) * 3.6));
  $('dial-perfect').setAttribute('d', arcPath(gameState.gaugePerfectStart * 3.6, (gameState.gaugePerfectStart + pw) * 3.6));
}
function updateGaugeHUDDisplay() {
  const idx = gameState.activeGenIndex;
  if (idx === null) return;
  const stage = gameState.genStages[idx] || 0;
  $('gen-gauge-stage').textContent = `${stage} / 3`;
  [...$('gen-stage-pips').children].forEach((el, i) => el.classList.toggle('on', i < stage));
}
function openGeneratorGauge(idx) {
  gameState.activeGenIndex = idx;
  document.body.classList.add('gauge');
  gameState.gaugeAimT = 0.45; // turn to face the starter panel
  gameState.gaugeNeedlePos = 0;
  randomizeGaugeZone(gameState.genStages[idx] || 0);
  updateGaugeHUDDisplay();
  $('gen-gauge-hud').classList.add('show');
  SoundEngine.playLatch();
}
function closeGeneratorGauge() {
  gameState.activeGenIndex = null;
  document.body.classList.remove('gauge');
  $('gen-gauge-hud').classList.remove('show');
}
// step back from the generator (to run, usually); cranks done so far are kept
const buzz = (p) => { if (IS_TOUCH && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } };
function quitGeneratorGauge() {
  const idx = gameState.activeGenIndex;
  if (idx === null) return;
  closeGeneratorGauge();
  const st = gameState.genStages[idx] || 0;
  if (st > 0) showToast(`시동 중단 — 진행 ${st}/3 유지`, '', 1600);
}
function flashGauge(cls, ms) {
  const hud = $('gen-gauge-hud');
  hud.classList.remove('ok', 'fail', 'perfect');
  void hud.offsetWidth;
  hud.classList.add(cls);
  setTimeout(() => hud.classList.remove(cls), ms);
}
function hallucinationFlash() {
  const hf = $('hallucination-flash');
  hf.classList.add('on');
  requestAnimationFrame(() => requestAnimationFrame(() => hf.classList.remove('on')));
}
function genExhaust(g) {
  return g.pivot.localToWorld(new THREE.Vector3(-g.w * 0.22, g.h + 0.1, -0.05));
}

function attemptGeneratorGaugeHit() {
  const idx = gameState.activeGenIndex;
  if (idx === null || gameState.generatorsOn[idx]) { closeGeneratorGauge(); return; }
  const pos = gameState.gaugeNeedlePos % 100;
  const rel = (a) => ((pos - a) % 100 + 100) % 100;
  const gObj = generatorObjects[idx];
  const perfect = rel(gameState.gaugePerfectStart) <= gameState.gaugePerfectWidth;
  if (rel(gameState.gaugeTargetStart) <= gameState.gaugeTargetWidth) {
    gameState.genStages[idx] = (gameState.genStages[idx] || 0) + 1;
    const curStage = gameState.genStages[idx];
    gObj.kick = perfect ? 0.6 : 0.4;
    gameState.camKick = perfect ? 0.8 : 0.55;
    buzz(perfect ? [20, 30, 40] : 35);
    spawnSmoke(genExhaust(gObj), perfect ? 3 : 2, 0x5a5650);
    flashGauge(perfect ? 'perfect' : 'ok', 260);
    if (curStage >= 3) {
      gameState.generatorsOn[idx] = true;
      SoundEngine.playGeneratorPowerUp();
      SoundEngine.startHum(idx);
      gObj.lampMat.emissive.setHex(0x22ff88);
      gObj.lampMat.color.setHex(0x002211);
      gObj.glow.material.color.setHex(0x22ff88);
      gObj.anchor.userData.label = '가동 중';
      closeGeneratorGauge();
      spawnSmoke(genExhaust(gObj), 6, 0x3c3a36);
      lightNearbyLamps(gObj.anchor.position.x, gObj.anchor.position.z);
      noiseAt(gObj.anchor.position.x, gObj.anchor.position.z, perfect ? 22 : 30);
      updateHUD(true);
      const done = gameState.generatorsOn.filter(Boolean).length;
      if (done === 4) restorePower();
      else showToast(`엔진이 걸렸다 (${done}/4) — 주변 불이 들어온다. 소리도 났다.`, 'good', 3000);
    } else {
      SoundEngine.playCrank(curStage, perfect);
      noiseAt(gObj.anchor.position.x, gObj.anchor.position.z, perfect ? 9 : 13 + curStage * 3); // the starter rattles through the halls
      gObj.anchor.userData.label = `발전기 가동 (${curStage}/3)`;
      updateGaugeHUDDisplay();
      randomizeGaugeZone(curStage);
    }
  } else {
    SoundEngine.playGaugeFail();
    gameState.genStages[idx] = diffKey === 'hard' ? 0 : Math.max(0, (gameState.genStages[idx] || 0) - 1);
    const curStage = gameState.genStages[idx];
    gObj.anchor.userData.label = `발전기 가동 (${curStage}/3)`;
    gObj.kick = 0.25;
    gameState.camKick = 1.2;
    buzz([80, 40, 140]);
    spawnSparks(gObj.pivot.localToWorld(new THREE.Vector3(gObj.w * 0.3, gObj.h * 0.7, gObj.d * 0.5)), 26);
    updateGaugeHUDDisplay();
    randomizeGaugeZone(curStage);
    flashGauge('fail', 320);
    hallucinationFlash();
    noiseAt(gObj.anchor.position.x, gObj.anchor.position.z, 40);
    showToast('합선! 불꽃이 튀었다. 그것이 들었다.', 'bad');
  }
}

// lamps near a running generator come back on
const lampOverlays = [];
let lampTubeY = WALL_HEIGHT - 0.06;
function lightNearbyLamps(x, z) {
  lampList.forEach((l) => {
    if (l.type !== 'dead' || Math.hypot(l.x - x, l.z - z) > 12) return;
    l.type = 'on';
    const m = box(1.15, 0.04, 0.09, lampMats.on, l.x, lampTubeY - 0.005, l.z);
    scene.add(m); lampOverlays.push(m);
    if (shaftMats.geo) { const sh = new THREE.Mesh(shaftMats.geo, shaftMats.on); sh.position.set(l.x, WALL_HEIGHT - 0.1, l.z); sh.renderOrder = 2; scene.add(sh); lampOverlays.push(sh); }
  });
  lampPoolTimer = 0;
}
function resetLamps() {
  lampOverlays.forEach((m) => scene.remove(m));
  lampOverlays.length = 0;
  lampList.forEach((l) => { l.type = l.base || l.type; });
}

// ---- small particle effects: sparks and exhaust smoke ----
const fxList = [];
function fxSprite(color, size, opacity, additive) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: shared.glowTex, color, transparent: true, opacity, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
  s.scale.set(size, size, 1);
  scene.add(s);
  return s;
}
function spawnSparks(p, n) {
  for (let i = 0; i < n; i++) {
    const s = fxSprite(i % 3 ? 0xffb347 : 0xfff2c0, 0.07, 1, true);
    s.position.copy(p);
    fxList.push({ s, v: new THREE.Vector3(rand(-2.5, 2.5), rand(0.5, 3.5), rand(-2.5, 2.5)), life: rand(0.35, 0.8), max: 0.8, kind: 'spark' });
  }
  const fl = fxSprite(0xbfe0ff, 2.2, 0.9, true); fl.position.copy(p);
  fxList.push({ s: fl, v: new THREE.Vector3(), life: 0.12, max: 0.12, kind: 'flash' });
}
function spawnSmoke(p, n, color) {
  for (let i = 0; i < n; i++) {
    const s = fxSprite(color, rand(0.3, 0.5), 0.5, false);
    s.position.copy(p).add(new THREE.Vector3(rand(-0.1, 0.1), 0, rand(-0.1, 0.1)));
    fxList.push({ s, v: new THREE.Vector3(rand(-0.15, 0.15), rand(0.5, 0.9), rand(-0.15, 0.15)), life: rand(1.6, 2.6), max: 2.6, kind: 'smoke' });
  }
}
function updateFX(dt) {
  for (let i = fxList.length - 1; i >= 0; i--) {
    const f = fxList[i];
    f.life -= dt;
    if (f.life <= 0) { scene.remove(f.s); f.s.material.dispose(); fxList.splice(i, 1); continue; }
    f.s.position.addScaledVector(f.v, dt);
    const k = f.life / f.max;
    if (f.kind === 'spark') { f.v.y -= 9 * dt; f.s.material.opacity = Math.min(1, k * 1.6); if (f.s.position.y < 0.02) { f.s.position.y = 0.02; f.v.y *= -0.3; f.v.x *= 0.5; f.v.z *= 0.5; } }
    else if (f.kind === 'smoke') { const sz = f.s.scale.x + dt * 0.6; f.s.scale.set(sz, sz, 1); f.s.material.opacity = 0.45 * k; f.v.multiplyScalar(1 - dt * 0.4); }
    else f.s.material.opacity = k;
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
  document.body.classList.toggle('hiding', gameState.isHidden);
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

// ---- hiding: short camera animations in and out ----
let hideAnim = null;      // { t, keys: [{ t, pos, yaw, pitch, door, on }], onDone }
let lockerRig = null;     // the inside of a locker: walls you can see, a slatted door you peek through
const DOOR_OPEN = -1.9;
function buildLockerRig() {
  const W = 0.7, H = 2.02, D = 0.56, T = 0.025;
  const mat = new THREE.MeshStandardMaterial({ color: 0x2c332c, roughness: 0.62, metalness: 0.45 });
  const rust = new THREE.MeshStandardMaterial({ color: 0x241d17, roughness: 0.9, metalness: 0.2 });
  const g = new THREE.Group();
  g.add(box(W, H, T, rust, 0, H / 2, -D / 2));                       // back
  g.add(box(T, H, D, mat, -W / 2, H / 2, 0));                          // sides
  g.add(box(T, H, D, mat, W / 2, H / 2, 0));
  g.add(box(W, T, D, rust, 0, H, 0));                                  // roof
  g.add(box(W, T, D, rust, 0, 0.05, 0));                               // floor
  g.add(box(W - 0.06, 0.02, 0.24, mat, 0, 1.86, -D / 2 + 0.13));       // hat shelf
  const hook = box(0.02, 0.09, 0.05, mat, 0.18, 1.74, -D / 2 + 0.03); g.add(hook);
  // door: hinged on the left, solid sheet with a band of angled louvers at eye height
  const door = new THREE.Group(); door.position.set(-W / 2, 0, D / 2);
  const add = (w, h, x, y, rx = 0) => { const m = box(w, h, 0.018, mat, x, y, 0); m.rotation.x = rx; door.add(m); return m; };
  add(W, 1.3, W / 2, 0.08 + 0.65);                                    // below the vents
  add(W, 0.3, W / 2, 1.76 + 0.15);                                    // above
  add(0.09, 0.4, 0.045, 1.565); add(0.09, 0.4, W - 0.045, 1.565);     // vent frame sides
  for (let y = 1.4; y < 1.75; y += 0.056) add(W - 0.18, 0.02, W / 2, y, 0.32); // louvers, gaps between
  const handle = box(0.03, 0.14, 0.03, rust, W - 0.07, 1.1, -0.03); door.add(handle);
  g.add(door);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  g.userData.door = door;
  g.visible = false;
  scene.add(g);
  return g;
}
function runHideAnim(keys, onDone) {
  keys.forEach((k) => { k.fired = false; });
  hideAnim = { t: 0, keys, onDone };
}
function updateHideAnim(dt) {
  if (!hideAnim) return false;
  const A = hideAnim, k = A.keys;
  A.t += dt;
  for (const key of k) if (!key.fired && A.t >= key.t) { key.fired = true; if (key.on) key.on(); }
  let i = 0;
  while (i < k.length - 2 && A.t > k[i + 1].t) i++;
  const a = k[i], b = k[i + 1];
  const u = Math.min(1, Math.max(0, (A.t - a.t) / Math.max(0.001, b.t - a.t))), e = u * u * (3 - 2 * u);
  player.pos.lerpVectors(a.pos, b.pos, e);
  player.yaw = a.yaw + wrapAngle(b.yaw - a.yaw) * e;
  player.pitch = a.pitch + (b.pitch - a.pitch) * e;
  if (lockerRig && a.door !== undefined) lockerRig.userData.door.rotation.y = a.door + (b.door - a.door) * e;
  if (A.t >= k[k.length - 1].t) { hideAnim = null; if (A.onDone) A.onDone(); }
  return true;
}
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function enterLocker(locker) {
  if (hideAnim) return;
  toggleCrouch(false);
  gameState.isHidden = true;
  gameState.hideLocker = locker;
  player.vel.set(0, 0, 0);
  const fx = Math.sin(locker.rotY), fz = Math.cos(locker.rotY);
  const outYaw = locker.rotY + Math.PI;   // camera yaw that looks out of the hiding spot
  gameState.hideBaseYaw = outYaw;
  const start = { t: 0, pos: player.pos.clone(), yaw: player.yaw, pitch: player.pitch };
  if (locker.kind === 'locker') {
    if (!lockerRig) lockerRig = buildLockerRig();
    lockerRig.position.set(locker.x, 0, locker.z); lockerRig.rotation.y = locker.rotY;
    lockerRig.userData.door.rotation.y = DOOR_OPEN;
    const front = V3(locker.x + fx * (locker.depth / 2 + 0.45), 1.5, locker.z + fz * (locker.depth / 2 + 0.45));
    const inside = V3(locker.x - fx * 0.08, 1.55, locker.z - fz * 0.08);
    SoundEngine.playLockerDoor();
    runHideAnim([
      { ...start, door: DOOR_OPEN, on: () => { locker.pivot.visible = false; lockerRig.visible = true; } },
      { t: 0.28, pos: front, yaw: locker.rotY, pitch: -0.05, door: DOOR_OPEN },                // step up, facing the open locker
      { t: 0.62, pos: inside, yaw: outYaw, pitch: -0.04, door: DOOR_OPEN },                     // squeeze in and turn round
      { t: 1.0, pos: inside, yaw: outYaw, pitch: -0.04, door: 0, on: () => {} },              // pull the door shut
      { t: 1.05, pos: inside, yaw: outYaw, pitch: -0.04, door: 0, on: () => { SoundEngine.playLatch(); } },
    ], () => { $('locker-overlay').classList.add('on'); });
  } else {
    // crawl under: get down in front, turn round, back in on your belly
    const reach = locker.depth / 2 + 0.55;
    const front = V3(locker.x + fx * reach, 0.6, locker.z + fz * reach);
    const under = V3(locker.x - fx * 0.05, locker.eyeY, locker.z - fz * 0.05);
    SoundEngine.playThrow();
    runHideAnim([
      { ...start, on: () => { locker.slab.visible = true; } },
      { t: 0.35, pos: front, yaw: outYaw, pitch: -0.25 },
      { t: 0.85, pos: under, yaw: outYaw, pitch: 0.02, on: () => SoundEngine.playFootstep('crouch') },
      { t: 0.9, pos: under, yaw: outYaw, pitch: 0.02 },
    ], () => { $('locker-overlay').classList.add('on'); SoundEngine.playFootstep('crouch'); });
  }
  const d = Math.hypot(monster.pos.x - locker.x, monster.pos.z - locker.z);
  if ((monster.state === 'CHASE' && monster.lostTimer < 0.6 && d < 14) ||
      (d < 9 && hasLOS(monster.pos.x, monster.pos.z, locker.x, locker.z) &&
        Math.abs(wrapAngle(Math.atan2(locker.x - monster.pos.x, locker.z - monster.pos.z) - monster.heading)) < 1.2)) {
    monster.huntLocker = locker;
    // the first few times it plays with you: comes over, listens, and walks off
    monster.huntSpare = gameState.hideGrace > 0;
    if (monster.huntSpare) gameState.hideGrace--;
  }
  if (monster.state === 'CHASE' && !monster.huntLocker) monster.lostTimer = 99;
}

function hideExitPos(locker) {
  const fx = Math.sin(locker.rotY), fz = Math.cos(locker.rotY);
  if (locker.kind === 'locker') return V3(locker.x + fx * (locker.depth / 2 + 0.6), EYE_HEIGHT, locker.z + fz * (locker.depth / 2 + 0.6));
  const tries = [[fx, fz, locker.depth / 2 + 0.6], [fz, -fx, locker.w / 2 + 0.6], [-fz, fx, locker.w / 2 + 0.6], [-fx, -fz, locker.depth / 2 + 0.6]];
  for (const [ax, az, r] of tries) {
    const x = locker.x + ax * r, z = locker.z + az * r;
    if (!isBlockedAt(x, z, player.radius)) return V3(x, EYE_HEIGHT, z);
  }
  return V3(locker.x + fx * (locker.depth / 2 + 0.6), EYE_HEIGHT, locker.z + fz * (locker.depth / 2 + 0.6));
}

function exitLocker() {
  const locker = gameState.hideLocker;
  if (!locker || hideAnim) return;
  $('locker-overlay').classList.remove('on');
  const start = { t: 0, pos: player.pos.clone(), yaw: player.yaw, pitch: player.pitch };
  const out = hideExitPos(locker);
  const finish = () => {
    gameState.isHidden = false;
    gameState.hideLocker = null;
    player.eye = EYE_HEIGHT;
    if (locker.pivot) locker.pivot.visible = true;
    if (locker.slab) locker.slab.visible = false;
    if (lockerRig) lockerRig.visible = false;
    noiseAt(player.pos.x, player.pos.z, 8);
  };
  if (locker.kind === 'locker') {
    SoundEngine.playLockerDoor();
    runHideAnim([
      { ...start, door: 0 },
      { t: 0.3, pos: start.pos, yaw: start.yaw, pitch: start.pitch, door: DOOR_OPEN },        // shove the door open
      { t: 0.7, pos: out, yaw: start.yaw, pitch: 0, door: DOOR_OPEN },                           // step out
    ], finish);
  } else {
    const fx = Math.sin(locker.rotY), fz = Math.cos(locker.rotY), reach = locker.depth / 2 + 0.55;
    const front = V3(locker.x + fx * reach, 0.35, locker.z + fz * reach);
    SoundEngine.playFootstep('crouch');
    runHideAnim([
      start,
      { t: 0.45, pos: front, yaw: start.yaw, pitch: 0.1, on: () => SoundEngine.playThrow() },
      { t: 0.8, pos: out, yaw: start.yaw, pitch: 0 },
    ], finish);
  }
}

const pickAnims = [];
function flyToCamera(obj, onDone) {
  obj.visible = true;
  pickAnims.push({ obj, t: 0, from: obj.position.clone(), s0: obj.scale.clone(), onDone });
  gameState.reach = 1;
}
function updatePickAnims(dt) {
  for (let i = pickAnims.length - 1; i >= 0; i--) {
    const a = pickAnims[i];
    a.t += dt / 0.38;
    const u = Math.min(1, a.t), e = u * u;
    camera.getWorldDirection(camDirTmp);
    const to = tmpV.copy(camera.position).addScaledVector(camDirTmp, 0.35).add(V3(0, -0.22, 0));
    a.obj.position.lerpVectors(a.from, to, e);
    a.obj.position.y += Math.sin(u * Math.PI) * 0.25;
    a.obj.rotation.y += dt * 9;
    a.obj.scale.copy(a.s0).multiplyScalar(1 - 0.75 * e);
    if (u >= 1) { a.obj.scale.copy(a.s0); a.obj.position.copy(a.from); pickAnims.splice(i, 1); if (a.onDone) a.onDone(); }
  }
  gameState.reach = Math.max(0, (gameState.reach || 0) - dt * 2.6);
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
  const m = assets.bottle ? makeProp(assets.bottle, 0.3).pivot : new THREE.Mesh(bottleGeo, shared.glass);
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
  if (hideAnim) return;
  if (gameState.isHidden) { exitLocker(); return; }
  if (gameState.activeGenIndex !== null) {
    if (performance.now() < (gameState.crankLock || 0)) return;   // the starter needs a moment between cranks
    gameState.crankLock = performance.now() + 450;
    attemptGeneratorGaugeHit(); return;
  }
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
// the camcorder timecode starts at 03:14:00 when the tape starts rolling
function camClock() {
  const t = 3 * 3600 + 14 * 60 + Math.floor(gameState.elapsed);
  return `${String(Math.floor(t / 3600) % 24).padStart(2, '0')}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function updateHUD(force) {
  const st = Math.round(gameState.stamina);
  if (force || hudCache.st !== st) { hudCache.st = st; $('stamina-bar').style.width = `${st}%`; }
  $('stamina-bar').classList.toggle('low', gameState.exhausted);
  $('status-bar').classList.toggle('st-show', gameState.stamina < 99.5);
  const b = Math.ceil(gameState.battery);
  if (force || hudCache.b !== b) { hudCache.b = b; $('batt-bar').style.width = `${b}%`; $('batt-pct').textContent = `${b}%`; }
  setText('rec-time', camClock());
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
  const cosY = Math.cos(-player.yaw), sinY = Math.sin(-player.yaw), scale = 0.9;
  const blip = (x, z, color, r, maxRange = 1e9) => {
    const dx = x - player.pos.x, dz = z - player.pos.z;
    if (Math.hypot(dx, dz) > maxRange) return;
    const rx = dx * cosY - dz * sinY, rz = dx * sinY + dz * cosY;
    const len = Math.hypot(rx, rz) * scale, maxR = 60, k = len > maxR ? maxR / len : 1;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx + rx * scale * k, cy + rz * scale * k, r, 0, Math.PI * 2); ctx.fill();
  };
  generatorObjects.forEach((g, idx) => { if (!gameState.generatorsOn[idx]) blip(g.anchor.position.x, g.anchor.position.z, `rgba(242,179,61,${0.6 + 0.4 * Math.sin(clock.t * 4 + idx)})`, 6); });
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
const PEEK_DUR = 5.2;
// while bent over, it keeps its head up so the face, not the crown, is at the gap
const _pq = new THREE.Quaternion(), _q = new THREE.Quaternion(), _rAxis = new THREE.Vector3();
function tiltBone(bone, ang) {
  if (!bone || !bone.parent) return;
  bone.parent.getWorldQuaternion(_pq);
  _q.setFromAxisAngle(_rAxis, ang);
  bone.quaternion.premultiply(_pq.clone().invert().multiply(_q).multiply(_pq));
}
function peekHeadUp() {
  const mdl = monster.model;
  if (!mdl) return;
  if (!monster.bones) monster.bones = { neck: mdl.getObjectByName('mixamorigNeck'), head: mdl.getObjectByName('mixamorigHead') };
  const lean = mdl.rotation.x;
  if (lean < 0.01) return;
  monster.group.updateMatrixWorld(true);
  _rAxis.set(Math.cos(monster.heading), 0, -Math.sin(monster.heading));
  tiltBone(monster.bones.neck, -lean * 0.45);
  monster.bones.neck && monster.bones.neck.updateMatrixWorld(true);
  tiltBone(monster.bones.head, -lean * 0.55);
}
function updatePeek(dt) {
  const P = monster.peek, L = P.L, mdl = monster.model;
  P.t += dt;
  const fx = Math.sin(L.rotY), fz = Math.cos(L.rotY), isLocker = L.kind === 'locker';
  // it bends down so its face ends up right at the vent slits (or at the gap under the bed)
  const LEAN = isLocker ? 0.5 : 1.0, DROP = isLocker ? 0.16 : 0.55;
  const stand = L.depth / 2 + (isLocker ? 1.1 : 1.6);
  const tx = L.x + fx * stand, tz = L.z + fz * stand;
  const face = Math.atan2(-fx, -fz);
  const u = Math.min(1, P.t / 0.8), e = u * u * (3 - 2 * u);
  monster.pos.x = P.from.x + (tx - P.from.x) * e;
  monster.pos.z = P.from.z + (tz - P.from.z) * e;
  monster.heading = P.h0 + wrapAngle(face - P.h0) * e;
  // lean in (deeper for a bed: it bends right down), sway as if peering through the gaps
  const inT = Math.min(1, Math.max(0, (P.t - 0.5) / 0.7)), outT = Math.min(1, Math.max(0, (P.t - (PEEK_DUR - 0.9)) / 0.7));
  const k = (inT * inT * (3 - 2 * inT)) * (1 - outT * outT * (3 - 2 * outT));
  if (mdl) {
    mdl.rotation.x = LEAN * k;
    mdl.rotation.z = Math.sin(P.t * 1.7) * 0.06 * k;     // head sways, peering from gap to gap
    mdl.position.y = -DROP * k;
  }
  P.faceLight = k;
  setMonsterAnim('walk', 0.12);   // the hunched limp, barely moving: swaying in place
  if (!P.rattled && P.t > 1.4) {
    P.rattled = true;
    if (isLocker) SoundEngine.playLockerDoor(); else SoundEngine.playMonsterStep3D(0.5, 0, false);
    $('game').classList.add('shake'); setTimeout(() => $('game').classList.remove('shake'), 380);
    buzz([90, 60, 90]);
  }
  if ((P.breath -= dt) <= 0) { P.breath = 1.25; SoundEngine.playMonsterBreath(0.6, 0); }
  gameState.fear = 1;
  monster.group.position.set(monster.pos.x, 0, monster.pos.z);
  monster.group.rotation.y = monster.heading;
  // you came out while it was right there
  if (!gameState.isHidden && !hideAnim) { monster.peek = null; if (mdl) { mdl.rotation.set(0, 0, 0); mdl.position.y = 0; } triggerGameOver(false); return; }
  if (P.t >= PEEK_DUR) {
    monster.peek = null;
    if (mdl) { mdl.rotation.set(0, 0, 0); mdl.position.y = 0; }
    if (gameState.hideGrace === 0) showToast('…그것은 알고 있다. 다음엔 열어볼 것이다.', 'bad', 3200);
    monster.directorT = 45;
    monster.state = 'SEARCH'; monster.searchTimer = 1.5;
    pickPatrolGoal(true);
  }
}

function updateMonsterAI(dt) {
  if (!monster.group) return;
  if (monster.peek) { updatePeek(dt); return; }
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
      if (gameState.isHidden && gameState.hideLocker === L && !monster.huntSpare) { exitLockerForDeath(); triggerGameOver(false); return; }
      if (gameState.isHidden && gameState.hideLocker === L) {
        // it walks right up to your hiding place and leans in to look... then lets you be
        monster.peek = { L, t: 0, from: monster.pos.clone(), h0: monster.heading, breath: 0.4, rattled: false };
        monster.huntLocker = null;
        monster.huntSpare = false;
        return;
      }
      monster.huntLocker = null;
      monster.huntSpare = false;
      monster.state = 'SEARCH'; monster.searchTimer = 3.5;
    }
  } else if (sees) {
    if (monster.state !== 'CHASE') {
      gameState.spotted++;
      buzz([60, 50, 60]);
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
    if (monster.lostTimer > 5 || reached()) { monster.state = 'SEARCH'; monster.searchTimer = 5; }
  } else if (monster.state === 'PATROL' && !gameState.isHidden && (monster.directorT -= dt) <= 0) {
    // it has a feeling where you are: comes to search a spot a few cells from you
    monster.directorT = (38 + Math.random() * 25) / diff.speed;
    const near = OPEN_CELLS.filter((c) => manhattan(c, pGrid) <= 7 && manhattan(c, pGrid) >= 4); // searches your part of the ward, not your exact spot
    const c = near[Math.floor(Math.random() * near.length)] || pGrid;
    monster.state = 'INVESTIGATE';
    monster.lured = false;
    setGoalCell(c.r, c.c);
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
  const speeds = { PATROL: 1.95, INVESTIGATE: monster.lured ? 3.5 : 3.0, SEARCH: 0, HUNT: 3.6, CHASE: 5.9 + gens * 0.04 };   // practically your sprint speed: you only lose it by breaking sight or hiding
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
  else if (monster.state === 'SEARCH') setMonsterAnim('search', 0.9);
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
  $('grain').style.opacity = ((0.05 + gameState.fear * 0.12) * FX_LEVEL[settings.fx]).toFixed(3);
  // terror radius: inside 30 m you hear your heart and a low dread swelling, even without seeing it
  const terror = Math.max(0, Math.min(1, (30 - distToPlayer) / 26));
  if (terror > 0) {
    gameState.heartbeatTimer -= dt;
    if (gameState.heartbeatTimer <= 0) {
      SoundEngine.playHeartbeat(0.15 + terror * 0.85);
      gameState.heartbeatTimer = Math.max(0.33, 1.25 - terror * 0.92);
    }
  }
  SoundEngine.setTerror(gameState.isHidden ? terror * 0.6 : terror);
  SoundEngine.chaseTick(dt, monster.state === 'CHASE' || monster.state === 'HUNT');
  drawMotionRadar(distToPlayer);

  if (!gameState.isHidden && !(window.__cine && window.__cine.noCatch) && distToPlayer < 1.3 && hasLOS(monster.pos.x, monster.pos.z, player.pos.x, player.pos.z)) triggerGameOver(false);
}

function exitLockerForDeath() {
  const L = gameState.hideLocker;
  gameState.isHidden = false;
  gameState.hideLocker = null;
  hideAnim = null;
  if (lockerRig) lockerRig.visible = false;
  if (L) {
    if (L.pivot) L.pivot.visible = true;
    if (L.slab) L.slab.visible = false;
    player.pos.copy(hideExitPos(L));
    player.yaw = Math.atan2(player.pos.x - monster.pos.x, player.pos.z - monster.pos.z);
  }
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
    l.intensity = (lamp.type === 'flicker' ? lampMats.flicker.emissiveIntensity * 3.2 : lamp.type === 'dead' ? 3.2 : 5.2) * (lamp.type === 'flicker' ? 1 : gameState.lampSurge ?? 1);
  });
}

function applyCamera(dt) {
  camera.position.copy(player.pos);
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
  if (gameState.activeGenIndex !== null && gameState.gaugeAimT > 0) {
    gameState.gaugeAimT -= dt;
    const g = generatorObjects[gameState.activeGenIndex].anchor.position;
    const want = Math.atan2(-(g.x - player.pos.x), -(g.z - player.pos.z));
    const k = Math.min(1, dt * 7);
    player.yaw += wrapAngle(want - player.yaw) * k;
    player.pitch += (-0.32 - player.pitch) * k;
  }
  if (gameState.camKick > 0) {
    const k = gameState.camKick; gameState.camKick = Math.max(0, k - dt * 3.5);
    camera.rotation.x += (Math.random() - 0.5) * 0.05 * k;
    camera.rotation.z += (Math.random() - 0.5) * 0.04 * k;
    camera.position.y += (Math.random() - 0.5) * 0.04 * k;
  }
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
  // with the light on, its bounce fills the corridor a little; with it off you see only a step or two ahead
  const lit = flashOn() || gameState.menu || gameState.isHidden; // hiding: eyes adjust, you can make out the corridor through the gaps
  const k = Math.min(1, dt * 6);
  // in the dark your eyes slowly adjust: after a few seconds you can make out walls and the floor ahead
  gameState.darkT = lit ? 0 : Math.min(6, (gameState.darkT || 0) + dt);
  const adapt = Math.min(1, gameState.darkT / 4) * (gameState.battery <= 0 ? 1.25 : 1);
  ambientLight.intensity += ((lit ? 0.3 : 0.045 + 0.16 * adapt) - ambientLight.intensity) * k;
  hemiLight.intensity += ((lit ? 0.2 : 0.03 + 0.1 * adapt) - hemiLight.intensity) * k;
  if (gameState.isHidden && gameState.hideLocker && !hideAnim && monster.peek && monster.peek.faceLight > 0.3) {
    // its face, pressed up to the door: a little light so you can see it through the slits
    const L = gameState.hideLocker, lk = L.kind === 'locker';
    playerGlow.position.set(L.x + Math.sin(L.rotY) * (L.depth / 2 + 0.25), lk ? 1.5 : 0.35, L.z + Math.cos(L.rotY) * (L.depth / 2 + 0.25));
    playerGlow.distance = 1.6;
    playerGlow.intensity = 1.6 * monster.peek.faceLight;
  } else if (gameState.isHidden && gameState.hideLocker && !hideAnim) {
    // eyes adjusted to the dark: faint light out in the corridor, none on your side of the door
    const L = gameState.hideLocker;
    playerGlow.position.set(L.x + Math.sin(L.rotY) * 1.9, L.kind === 'locker' ? 1.6 : 0.7, L.z + Math.cos(L.rotY) * 1.9);
    playerGlow.distance = 7;
    playerGlow.intensity = 2.4;
  } else if (lit || gameState.isHidden) {
    playerGlow.position.copy(player.pos);
    playerGlow.distance = 8;
    playerGlow.intensity = gameState.isHidden ? 0.4 : 2.2;
  } else {
    playerGlow.position.copy(player.pos).addScaledVector(camDirTmp, 1.1).add(tmpV.set(0, -0.35, 0));
    playerGlow.distance = 3.8 + 4 * adapt;
    playerGlow.intensity = 1.3 + 2.2 * adapt;
  }
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
    g.kick = Math.max(0, (g.kick || 0) - dt * 1.2);
    const amp = (gameState.generatorsOn[idx] ? 0.012 : gameState.genStages[idx] > 0 ? 0.004 * gameState.genStages[idx] : 0) + g.kick * 0.05;
    if (gameState.generatorsOn[idx]) { g.smokeT = (g.smokeT || 0) - dt; if (g.smokeT <= 0) { g.smokeT = 0.9 + Math.random() * 0.6; spawnSmoke(genExhaust(g), 1, 0x4a4742); } }
    g.inner.position.set(g.innerBase.x + (Math.random() - 0.5) * amp, g.innerBase.y + (Math.random() - 0.5) * amp, g.innerBase.z);
    if (!gameState.generatorsOn[idx]) {
      const blink = Math.sin(clock.t * 5 + idx) > 0;
      g.lampMat.emissiveIntensity = blink ? 2.5 : 0.3;
      const dx = g.anchor.position.x - player.pos.x, dz = g.anchor.position.z - player.pos.z, d = Math.hypot(dx, dz);
      g.beacon.visible = d > 2.5;  // a guide from afar; up close it would just wash the engine red
      g.beacon.material.opacity = (blink ? 0.8 : 0.12) * Math.min(1, Math.max(0, (d - 2.5) / 4));
      SoundEngine.setBuzz(idx, 0.05 * Math.max(0, 1 - d / 22) ** 1.5, d > 0.1 ? (dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw)) / d : 0);
    } else { g.beacon.visible = false; SoundEngine.setBuzz(idx, 0, 0); }
    if (gameState.generatorsOn[idx]) {
      const dx = g.anchor.position.x - player.pos.x, dz = g.anchor.position.z - player.pos.z, d = Math.hypot(dx, dz);
      SoundEngine.setHum(idx, 0.07 * Math.max(0, 1 - d / 20), d > 0.1 ? (dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw)) / d : 0);
    }
  });

  if (gameState.activeGenIndex !== null) {
    const sputter = 1 + (0.25 + gameState.gaugeStage * 0.12) * Math.sin(clock.t * 2.7) * Math.sin(clock.t * 1.3 + 1); // the engine coughs: needle surges and drags
    if (gameState.gaugeStage > 0 && (gameState.gaugeFlipT -= dt) <= 0) {   // from the 2nd crank the needle kicks back without warning
      gameState.gaugeFlipT = (1.6 - gameState.gaugeStage * 0.35) + Math.random() * 1.4;
      gameState.gaugeDir = -(gameState.gaugeDir || 1);
    }
    gameState.gaugeNeedlePos = ((gameState.gaugeNeedlePos + (gameState.gaugeDir || 1) * gameState.gaugeSpeed * sputter * dt) % 100 + 100) % 100;
    if (gameState.gaugeDrift) {
      const sh = gameState.gaugeDrift * dt;
      gameState.gaugeTargetStart = ((gameState.gaugeTargetStart + sh) % 100 + 100) % 100;
      gameState.gaugePerfectStart = ((gameState.gaugePerfectStart + sh) % 100 + 100) % 100;
      drawGaugeZone();
    }
    $('dial-needle').setAttribute('transform', `rotate(${(gameState.gaugeNeedlePos * 3.6).toFixed(1)} 60 60)`);
  }

  // flashlight battery
  if (flashOn()) {
    gameState.battery = Math.max(0, gameState.battery - 0.83 * diff.drain * dt);
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
  if (updateHideAnim(dt)) {
    camera.rotation.z = 0;
  } else if (!gameState.isHidden) {
    const mf = (input.w ? 1 : 0) - (input.s ? 1 : 0) - input.joyY;
    const mr = (input.d ? 1 : 0) - (input.a ? 1 : 0) + input.joyX;
    const mag = Math.min(1, Math.hypot(mf, mr));
    const wantsMove = mag > 0.12;
    const sprintHeld = input.sprint || input.sprintToggle;
    if (gameState.activeGenIndex !== null && mag > 0.3) quitGeneratorGauge();
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
      else { gameState.noiseRadius = hs > 2 ? 6.5 : 3; gameState.noiseLevel = 2; }
    }
    const eyeTarget = gameState.activeGenIndex !== null ? 1.12 : gameState.crouch ? CROUCH_HEIGHT : EYE_HEIGHT; // kneel to work the starter
    player.eye += (eyeTarget - player.eye) * Math.min(1, dt * 9);
    const bobAmt = Math.min(1, hs / 6);
    player.pos.y = player.eye + Math.abs(Math.sin(gameState.bobPhase)) * 0.07 * bobAmt - 0.035 * bobAmt;
    if (isSprinting) targetFov = 80;
    camera.rotation.z += ((-mr * 0.015) - camera.rotation.z) * Math.min(1, dt * 6);
  } else {
    gameState.stamina = Math.min(100, gameState.stamina + 20 * dt);
    const inLocker = gameState.hideLocker && gameState.hideLocker.kind === 'locker';
    const lim = inLocker ? 0.5 : 0.85, off = wrapAngle(player.yaw - gameState.hideBaseYaw);
    if (off > lim) player.yaw = gameState.hideBaseYaw + lim;
    if (off < -lim) player.yaw = gameState.hideBaseYaw - lim;
    player.pitch = inLocker ? Math.max(-0.3, Math.min(0.25, player.pitch)) : Math.max(-0.12, Math.min(0.22, player.pitch));
    // held breath: tiny sway
    camera.rotation.z = Math.sin(clock.t * 0.8) * 0.004;
  }
  player.fov = targetFov;

  {
    const pg = worldToGrid(player.pos.x, player.pos.z);
    const ri = roomAt[pg.r] ? roomAt[pg.r][pg.c] : -1;
    if (ri >= 0 && !gameState.roomsSeen.has(ri)) { gameState.roomsSeen.add(ri); showToast(`[ ${ROOMS[ri].num} · ${ROOMS[ri].name} ]`, '', 2000); }
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
    if (monster.peek) peekHeadUp();
    updateDoors(dt);
    updateFX(dt);
    updatePickAnims(dt);
    SoundEngine.tickAmbient(dt);
    updateDust(dt);
  }
  if (lampMats) {
    const f = Math.random();
    lampMats.flicker.emissiveIntensity = f < 0.08 ? 0 : f < 0.12 ? 0.4 : 1.4 + Math.sin(now * 0.05) * 0.2;
    // power surge: every light in the ward stutters for a moment
    let surge = 1;
    if (gameState.running && !gameState.paused) {
      gameState.surgeT = (gameState.surgeT === undefined ? 50 : gameState.surgeT) - dt;
      if (gameState.surgeT < 0) {
        if (gameState.surgeT > -dt * 1.5) SoundEngine.playSurge();
        surge = Math.random() < 0.45 ? 0.05 : 0.5 + Math.random() * 0.6;
        if (gameState.surgeT < -1.6) gameState.surgeT = 45 + Math.random() * 50;
      }
    }
    lampMats.on.emissiveIntensity = 1.6 * surge;
    lampMats.flicker.emissiveIntensity *= surge;
    gameState.lampSurge = surge;
    if (shaftMats.on) { shaftMats.on.uniforms.uStr.value = 0.11 * surge; shaftMats.flicker.uniforms.uStr.value = 0.11 * surge * lampMats.flicker.emissiveIntensity / 1.5; }
    updateLampPool(dt);
  }
  if (frameN % 2 === 0 && settings.fx !== 'off') drawGrain(gctx, gimg);
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
  $('end-modal').classList.toggle('won', escaped);
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
  SoundEngine.stopMenuMusic();
  SoundEngine.stopHums();
  SoundEngine.stopBuzzes();
  SoundEngine.stopTerror();
  Object.assign(gameState, {
    menu: false, generatorsOn: [false, false, false, false], genStages: [0, 0, 0, 0], hasKeycard: false,
    stamina: 100, exhausted: false, crouch: false, flashOn: true, battery: 100, bottles: 0,
    isHidden: false, hideLocker: null, gameOver: false, won: false, dying: false, jsStarted: false, paused: false, reading: false, running: true,
    hideGrace: diffKey === 'hard' ? 2 : 3,
    startTime: performance.now(), elapsed: 0, fear: 0, powerRestored: false, heartbeatTimer: 0, notesRead: new Set(), spotted: 0, thrown: 0, roomsSeen: new Set()
  });
  resetDoors(true);
  closeGeneratorGauge();
  projectiles.forEach((p) => scene.remove(p.m)); projectiles.length = 0;
  glassDecals.forEach((s) => scene.remove(s)); glassDecals.length = 0;
  lockerObjects.forEach((l) => { if (l.pivot) l.pivot.visible = true; if (l.slab) l.slab.visible = false; });
  if (exitSignMat) exitSignMat.map = createSignTexture('EXIT', '#ff2a2a');
  if (exitLight) exitLight.color.setHex(0xff2020);
  if (lampMats) lampMats.dead.emissiveIntensity = 0;
  resetLamps();
  fxList.forEach((f) => scene.remove(f.s)); fxList.length = 0;
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
  hideAnim = null; if (lockerRig) lockerRig.visible = false;
  $('danger-overlay').style.opacity = '0';
  $('note-modal').classList.remove('show');
  updateHUD(true);

  document.body.classList.remove('in-menu');
  ['main-menu', 'end-modal', 'pause-modal'].forEach((id) => $(id).classList.remove('show'));
  const fade = $('fade');
  $('intro-text').innerHTML = `<b>B2 · 4병동</b>▶ PLAY &nbsp; 03:14 AM &nbsp; ${diff.label}<i>● REC</i>`;
  fade.classList.add('on');
  setTimeout(() => {
    fade.classList.remove('on');
    showToast('발전기 4대를 찾아라 — 레이더의 노란 점, 빨간 불빛, 지직거리는 소리', '', 4200);
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
  SoundEngine.stopBuzzes();
  SoundEngine.stopTerror();
  closeGeneratorGauge();
  ['end-modal', 'pause-modal', 'note-modal'].forEach((id) => $(id).classList.remove('show'));
  $('locker-overlay').classList.remove('on');
  hideAnim = null; if (lockerRig) lockerRig.visible = false;
  $('danger-overlay').style.opacity = '0';
  lockerObjects.forEach((l) => { if (l.pivot) l.pivot.visible = true; if (l.slab) l.slab.visible = false; });
  const spawn = gridToWorld(SPAWN.r, SPAWN.c);
  player.pos.set(spawn.x, EYE_HEIGHT, spawn.z);
  player.yaw = -Math.PI / 2; flashDir.set(1, 0, 0);
  attract.goal = null;
  resetDoors(false);
  resetMonster();
  monster.state = 'SEARCH'; monster.searchTimer = 1e9;
  setMonsterAnim('search', 0.8);
  showMenuPanel('mm-main');
  renderRecords();
  document.body.classList.add('in-menu');
  $('main-menu').classList.add('show');
  if (SoundEngine.initialized) { SoundEngine.resume(); SoundEngine.startMenuMusic(); }
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
  if (p) $('pause-time').textContent = camClock();
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
  const restBase = () => { base.style.left = '96px'; base.style.top = 'calc(100% - 100px)'; }; // resting spot, bottom-left
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
  // tick marks on the generator dial
  const ticks = document.querySelector('.dial-ticks');
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2, major = i % 5 === 0, r1 = major ? 45.5 : 47.5, r2 = 50.5;
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', 60 + Math.sin(a) * r1); l.setAttribute('y1', 60 - Math.cos(a) * r1);
    l.setAttribute('x2', 60 + Math.sin(a) * r2); l.setAttribute('y2', 60 - Math.cos(a) * r2);
    if (major) l.setAttribute('class', 'major');
    ticks.appendChild(l);
    if (major) {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', (60 + Math.sin(a) * 37).toFixed(2)); t.setAttribute('y', (60 - Math.cos(a) * 37).toFixed(2));
      t.textContent = String(i);
      ticks.appendChild(t);
    }
  }
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
  click('btn-gauge-quit', () => quitGeneratorGauge());
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
  tapBtn('btn-light', toggleFlashlight);

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
    else if (k === 'fx') { settings.fx = b.dataset.v; saveSettings(); applyFx(); syncSettingsUI(); }
    else { settings.quality = b.dataset.v; saveSettings(); applyQuality(); syncSettingsUI(); }
  }));
  document.querySelectorAll('.sens-range').forEach((r) => r.addEventListener('input', () => { settings.sens = parseFloat(r.value); saveSettings(); syncSettingsUI(); }));
  click('btn-mute', () => setSound(settings.sound === 'off' ? 'on' : 'off'));
  syncSettingsUI();

  $('main-menu').addEventListener('pointerdown', () => SoundEngine.resume());
  // browsers only allow sound after a tap/key: the menu music starts on the first one
  const menuMusic = () => { if (!gameState.menu) return; SoundEngine.resume(); SoundEngine.startMenuMusic(); };
  window.addEventListener('pointerdown', menuMusic, true);
  window.addEventListener('keydown', menuMusic, true);
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
applyFx();
bindEvents();
initThreeScene();
lastTime = performance.now();
requestAnimationFrame(renderLoop);
new Image().src = 'assets/jumpscare.jpg';
renderRecords();

loadAssets((p) => {
  $('mm-load-bar').firstElementChild.style.width = `${Math.round(p * 100)}%`;
  $('mm-load').textContent = `불러오는 중 ${Math.round(p * 100)}%`;
}).then(() => Promise.race([
  Promise.all([
    document.fonts.load('400 120px "East Sea Dokdo"', '뛰지 마 듣고 있다 도망쳐 하하'),
    document.fonts.load('800 32px "Nanum Myeongjo"', '간호사실 수술실 병실 영안실 비품 창고 직원 휴게실'),
    document.fonts.load('400 40px VT323', '0123456789 NS OR B EXIT')
  ]).catch(() => {}),
  new Promise((r) => setTimeout(r, 4000))
])).then(() => {
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
window.__ward = { get renderer() { return renderer; }, get scene() { return scene; }, get peek() { return monster.peek; }, lampList, lampPool, isOpen, worldToGrid, SoundEngine, attemptGeneratorGaugeHit, openGeneratorGauge, enterLocker, exitLocker, lockerObjects, get hideAnim() { return hideAnim; }, decorList, doors, ROOMS, roomPoint, setDoor, goToMenu, gameState, player, monster, generatorObjects, lockerObjects, items, get keycardObj() { return keycardObj; }, handleInteract, startNewGame, triggerGameOver,
  gridToWorld, input, applyCamera, updateGame, throwBottle, toggleFlashlight, toggleCrouch, openNote, closeNote, setPaused };
