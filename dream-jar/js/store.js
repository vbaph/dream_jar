/* 数据层：全部数据保存在浏览器 LocalStorage，无需服务器 */

import { uid, clamp } from "./utils.js";
import { toast } from "./ui.js";

const KEY = "dreamjar.v1";

const defaultState = () => ({
  version: 1,
  settings: { theme: "light", seeded: false },
  currentDreamId: null,
  dreams: [],
});

let state = defaultState();
const listeners = new Set();

/* ---------------- 读写 ---------------- */

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      state = defaultState();
      return state;
    }
    const parsed = JSON.parse(raw);
    state = {
      ...defaultState(),
      ...parsed,
      settings: { ...defaultState().settings, ...(parsed.settings || {}) },
      dreams: Array.isArray(parsed.dreams) ? parsed.dreams.map(normalizeDream) : [],
    };
  } catch (err) {
    console.warn("[DreamJar] 数据读取失败，已重置为空白数据：", err);
    state = defaultState();
  }
  return state;
}

function normalizeDream(d) {
  return {
    id: d.id || uid("dream"),
    name: d.name || "未命名梦想",
    image: d.image || "",
    target: Number(d.target) || 0,
    description: d.description || "",
    completeMessage: d.completeMessage || "",
    startDate: d.startDate || (d.createTime || "").slice(0, 10),
    targetDate: d.targetDate || "",
    savingMethod: d.savingMethod || "",
    savingNote: d.savingNote || "",
    createTime: d.createTime || new Date().toISOString(),
    status: d.status === "completed" ? "completed" : "active",
    deposits: Array.isArray(d.deposits)
      ? d.deposits.map((x) => ({
          id: x.id || uid("dep"),
          amount: Number(x.amount) || 0,
          date: x.date || "",
          note: x.note || "",
          createTime: x.createTime || new Date().toISOString(),
        }))
      : [],
    archive: d.archive || null,
  };
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error("[DreamJar] 保存失败：", err);
    return false;
  }
}

export function getState() {
  return state;
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (err) {
      console.error(err);
    }
  });
}

export function commit() {
  const ok = save();
  if (!ok) {
    toast("保存失败：浏览器存储空间可能已满，请在「设置」里导出备份，并删除一些图片后重试。", "error", 6000);
  }
  emit();
  return ok;
}

/* ---------------- 查询 ---------------- */

export const getDreams = () => state.dreams;
export const getActiveDreams = () => state.dreams.filter((d) => d.status !== "completed");
export const getCompletedDreams = () =>
  state.dreams
    .filter((d) => d.status === "completed")
    .sort((a, b) => (b.archive?.finishDate || "").localeCompare(a.archive?.finishDate || ""));

export const getDream = (id) => state.dreams.find((d) => d.id === id) || null;

export function getCurrentDream() {
  const active = getActiveDreams();
  if (!active.length) return null;
  return active.find((d) => d.id === state.currentDreamId) || active[0];
}

export function setCurrentDream(id) {
  state.currentDreamId = id;
  commit();
}

export function dreamTotal(dream) {
  if (!dream) return 0;
  return (dream.deposits || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
}

export function dreamProgress(dream) {
  const total = dreamTotal(dream);
  const target = Number(dream?.target) || 0;
  const raw = target > 0 ? (total / target) * 100 : 0;
  return {
    total,
    target,
    raw,
    pct: clamp(raw, 0, 100),
    remaining: Math.max(0, target - total),
    isComplete: target > 0 && total >= target,
  };
}

/** 按 PRD 的状态阈值输出视觉参数 */
export function jarVisual(pct) {
  const p = clamp(Number(pct) || 0, 0, 100);
  const t = p / 100;
  const stage = p >= 100 ? 5 : p >= 80 ? 4 : p >= 50 ? 3 : p >= 20 ? 2 : 1;
  const stageText = {
    1: ["0% – 20%", "磨砂玻璃，梦想还很朦胧"],
    2: ["20% – 50%", "轮廓出现，梦想开始显形"],
    3: ["50% – 80%", "画面清晰，水位继续升高"],
    4: ["80% – 99%", "接近透明，只有一步之遥"],
    5: ["100%", "完全透明，梦想已经实现"],
  }[stage];
  return {
    pct: p,
    stage,
    stageRange: stageText[0],
    stageLabel: stageText[1],
    blur: +(22 * Math.pow(1 - t, 1.6)).toFixed(2),
    frost: +(0.84 * Math.pow(1 - t, 1.35)).toFixed(3),
    water: +(6 + 88 * Math.pow(t, 0.85)).toFixed(1),
    sat: +(0.45 + 0.7 * t).toFixed(2),
    bri: +(0.86 + 0.22 * t).toFixed(2),
    scale: +(1.22 - 0.2 * t).toFixed(3),
    glow: +(Math.pow(t, 2) * 0.9).toFixed(2),
  };
}

/* ---------------- 写入 ---------------- */

export function createDream(input) {
  const dream = normalizeDream({
    ...input,
    id: uid("dream"),
    createTime: new Date().toISOString(),
    status: "active",
    deposits: [],
  });
  state.dreams.unshift(dream);
  if (!state.currentDreamId) state.currentDreamId = dream.id;
  commit();
  return dream;
}

export function updateDream(id, patch) {
  const dream = getDream(id);
  if (!dream) return null;
  Object.assign(dream, patch);
  commit();
  return dream;
}

export function deleteDream(id) {
  state.dreams = state.dreams.filter((d) => d.id !== id);
  if (state.currentDreamId === id) state.currentDreamId = null;
  commit();
}

export function addDeposit(dreamId, { amount, date, note = "" }) {
  const dream = getDream(dreamId);
  const value = Number(amount) || 0;
  if (!dream || value <= 0) return null;
  const deposit = {
    id: uid("dep"),
    amount: value,
    date: date || new Date().toISOString().slice(0, 10),
    note,
    createTime: new Date().toISOString(),
  };
  dream.deposits.push(deposit);
  dream.deposits.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  commit();
  return deposit;
}

export function deleteDeposit(dreamId, depositId) {
  const dream = getDream(dreamId);
  if (!dream) return;
  dream.deposits = dream.deposits.filter((d) => d.id !== depositId);
  commit();
}

export function completeDream(id, { finishImage = "", finishDate = "", finalAmount = null, memoryText = "" } = {}) {
  const dream = getDream(id);
  if (!dream) return null;
  const total = dreamTotal(dream);
  dream.status = "completed";
  dream.archive = {
    id: uid("archive"),
    finishImage,
    finishDate: finishDate || new Date().toISOString().slice(0, 10),
    finalAmount: finalAmount === null || finalAmount === "" ? total : Number(finalAmount) || 0,
    memoryText,
  };
  commit();
  return dream;
}

export function setTheme(theme) {
  state.settings.theme = theme === "night" ? "night" : "light";
  commit();
}

export function setMotion(reduce) {
  state.settings.reduceMotion = Boolean(reduce);
  commit();
}

/* ---------------- 导入 / 导出 / 示例 ---------------- */

export function exportData() {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

export function importData(json) {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
  if (!parsed || !Array.isArray(parsed.dreams)) throw new Error("文件格式不正确：缺少 dreams 数据");
  state = {
    ...defaultState(),
    ...parsed,
    settings: { ...defaultState().settings, ...(parsed.settings || {}) },
    dreams: parsed.dreams.map(normalizeDream),
  };
  commit();
  return state.dreams.length;
}

export function clearAll() {
  state = defaultState();
  commit();
}

/** 示例数据：数值与原型图一致，方便第一次打开时就有完整效果 */
export const sampleDreams = () => [
  {
    id: "sample_aurora",
    name: "去南极看极光",
    image: "assets/samples/aurora.svg",
    target: 30000,
    description: "去看世界的尽头，把极光的浪漫，装进我们的回忆里。",
    completeMessage: "我做到了！终于站到了南极大陆，看到了极光。",
    startDate: "2025-08-01",
    targetDate: "2026-02-01",
    savingMethod: "每月自动存",
    savingNote: "想去看极光，拍一张属于自己的照片。",
    createTime: "2025-08-01T09:00:00.000Z",
    status: "active",
    deposits: [
      { id: "d_aurora_1", amount: 3000, date: "2025-08-01", note: "开始存钱的第一天", createTime: "2025-08-01T09:10:00.000Z" },
      { id: "d_aurora_2", amount: 1500, date: "2025-08-05", note: "兼职收入", createTime: "2025-08-05T10:00:00.000Z" },
      { id: "d_aurora_3", amount: 2000, date: "2025-08-10", note: "少买两件衣服", createTime: "2025-08-10T10:00:00.000Z" },
      { id: "d_aurora_4", amount: 1500, date: "2025-08-15", note: "", createTime: "2025-08-15T10:00:00.000Z" },
      { id: "d_aurora_5", amount: 2000, date: "2025-08-20", note: "年终奖存一部分", createTime: "2025-08-20T10:00:00.000Z" },
    ],
    archive: null,
  },
  {
    id: "sample_paris",
    name: "去巴黎看埃菲尔铁塔",
    image: "assets/samples/paris.svg",
    target: 30000,
    description: "想在塞纳河边散步，看一次铁塔亮灯。",
    completeMessage: "我做到了！巴黎的黄昏比照片里更温柔。",
    startDate: "2025-12-01",
    targetDate: "2026-10-01",
    savingMethod: "每周存 500",
    savingNote: "先把机票钱存出来。",
    createTime: "2025-12-01T09:00:00.000Z",
    status: "active",
    deposits: [
      { id: "d_paris_1", amount: 3000, date: "2025-12-01", note: "", createTime: "2025-12-01T09:00:00.000Z" },
      { id: "d_paris_2", amount: 3000, date: "2025-12-20", note: "", createTime: "2025-12-20T09:00:00.000Z" },
    ],
    archive: null,
  },
  {
    id: "sample_house",
    name: "拥有自己的小房子",
    image: "assets/samples/house.svg",
    target: 300000,
    description: "有一间朝南的房间，窗台上放着绿植。",
    completeMessage: "我做到了！这是我的家。",
    startDate: "2025-06-01",
    targetDate: "2028-06-01",
    savingMethod: "每月固定存",
    savingNote: "首付计划，慢慢来。",
    createTime: "2025-06-01T09:00:00.000Z",
    status: "active",
    deposits: [
      { id: "d_house_1", amount: 25000, date: "2025-06-01", note: "", createTime: "2025-06-01T09:00:00.000Z" },
      { id: "d_house_2", amount: 20000, date: "2025-09-01", note: "", createTime: "2025-09-01T09:00:00.000Z" },
    ],
    archive: null,
  },
  {
    id: "sample_sakura",
    name: "去日本看樱花",
    image: "assets/samples/sakura.svg",
    target: 30000,
    description: "想在樱花落下的那条路上走一走。",
    completeMessage: "我做到了！樱花真的像一场粉色的雨。",
    startDate: "2025-03-01",
    targetDate: "2026-04-01",
    savingMethod: "每月存 2000",
    savingNote: "春天出发。",
    createTime: "2025-03-01T09:00:00.000Z",
    status: "active",
    deposits: [
      { id: "d_sakura_1", amount: 9000, date: "2025-03-01", note: "", createTime: "2025-03-01T09:00:00.000Z" },
      { id: "d_sakura_2", amount: 6000, date: "2025-07-01", note: "", createTime: "2025-07-01T09:00:00.000Z" },
      { id: "d_sakura_3", amount: 9000, date: "2025-11-01", note: "加班费", createTime: "2025-11-01T09:00:00.000Z" },
    ],
    archive: null,
  },
  {
    id: "sample_yunnan",
    name: "去云南看日照金山",
    image: "assets/samples/sunrise.svg",
    target: 8000,
    description: "在梅里雪山脚下，等一次日出。",
    completeMessage: "我做到了！金色铺满山尖的那一刻，我哭了出来。",
    startDate: "2025-01-10",
    targetDate: "2025-04-12",
    savingMethod: "每月存 2000",
    savingNote: "",
    createTime: "2025-01-10T09:00:00.000Z",
    status: "completed",
    deposits: [
      { id: "d_yn_1", amount: 4000, date: "2025-01-10", note: "", createTime: "2025-01-10T09:00:00.000Z" },
      { id: "d_yn_2", amount: 4000, date: "2025-02-20", note: "", createTime: "2025-02-20T09:00:00.000Z" },
    ],
    archive: {
      id: "archive_yunnan",
      finishImage: "assets/samples/sunrise.svg",
      finishDate: "2025-04-12",
      finalAmount: 8600,
      memoryText: "这是我第一次一个人旅行，也是第一次觉得存钱原来可以这么幸福。",
    },
  },
  {
    id: "sample_xian",
    name: "去西安看兵马俑",
    image: "assets/samples/xian.svg",
    target: 6000,
    description: "去看看两千年前的军队。",
    completeMessage: "我做到了！历史比我以为的更震撼。",
    startDate: "2024-05-01",
    targetDate: "2024-10-01",
    savingMethod: "每月存 1000",
    savingNote: "",
    createTime: "2024-05-01T09:00:00.000Z",
    status: "completed",
    deposits: [
      { id: "d_xa_1", amount: 3000, date: "2024-05-01", note: "", createTime: "2024-05-01T09:00:00.000Z" },
      { id: "d_xa_2", amount: 3000, date: "2024-08-01", note: "", createTime: "2024-08-01T09:00:00.000Z" },
    ],
    archive: {
      id: "archive_xian",
      finishImage: "assets/samples/xian.svg",
      finishDate: "2024-10-01",
      finalAmount: 6500,
      memoryText: "跟着讲解走了一整天，值回票价。",
    },
  },
  {
    id: "sample_beach",
    name: "去海边看日出",
    image: "assets/samples/beach.svg",
    target: 3000,
    description: "赤脚踩在沙子上，等太阳跳出海面。",
    completeMessage: "我做到了！清晨的海是最安静的地方。",
    startDate: "2024-03-01",
    targetDate: "2024-06-15",
    savingMethod: "每月存 1000",
    savingNote: "",
    createTime: "2024-03-01T09:00:00.000Z",
    status: "completed",
    deposits: [
      { id: "d_bc_1", amount: 1500, date: "2024-03-01", note: "", createTime: "2024-03-01T09:00:00.000Z" },
      { id: "d_bc_2", amount: 1800, date: "2024-05-01", note: "", createTime: "2024-05-01T09:00:00.000Z" },
    ],
    archive: {
      id: "archive_beach",
      finishImage: "assets/samples/beach.svg",
      finishDate: "2024-06-15",
      finalAmount: 3300,
      memoryText: "凌晨四点起床的困，被日出治好了。",
    },
  },
];

export function loadSamples() {
  const existing = new Set(state.dreams.map((d) => d.id));
  const additions = sampleDreams().filter((d) => !existing.has(d.id));
  state.dreams = [...state.dreams, ...additions.map(normalizeDream)];
  if (!state.currentDreamId && additions.length) state.currentDreamId = additions[0].id;
  state.settings.seeded = true;
  commit();
  return additions.length;
}
