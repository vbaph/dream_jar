/* 工具函数：选择器、格式化、图片压缩、文件读写 */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function parseAmount(value) {
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function fmtNumber(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("zh-CN");
}

/** ¥10,000 */
export function fmtMoney(n) {
  return `¥${fmtNumber(n)}`;
}

/** 不带符号的金额数字：10,000 */
export function fmtMoneyPlain(n) {
  return fmtNumber(n);
}

export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

/** 2026-09-13 */
export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 2026.09.13 */
export function fmtDateDot(iso) {
  return fmtDate(iso).replace(/-/g, ".");
}

/** 2026年9月13日 */
export function fmtDateCN(iso) {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function daysBetween(a, b) {
  const d1 = new Date(`${a}T00:00:00`);
  const d2 = new Date(`${b}T00:00:00`);
  return Math.round((d2 - d1) / 86400000);
}

/** 把用户选择的图片压缩为 dataURL，便于保存在浏览器本地 */
export function compressImage(file, { maxSize = 1200, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("请选择图片文件（JPG / PNG / WEBP）"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("图片解析失败"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const isPng = file.type === "image/png";
        resolve(canvas.toDataURL(isPng ? "image/png" : "image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function downloadFile(filename, content, type = "application/json") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(file);
  });
}

/** style="--a:1;--b:2" 便捷构造 */
export function cssVars(map) {
  return Object.entries(map)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

export function backgroundStyle(url) {
  if (!url) return "";
  // 注意：这里用单引号，避免与 HTML 双引号 style 属性冲突
  return `background-image:url('${String(url).replace(/'/g, "%27").replace(/"/g, "%22")}')`;
}
