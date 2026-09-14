/* 可复用的页面片段 */

import {
  escapeHtml, fmtMoney, fmtNumber, fmtDate, fmtDateDot, fmtDateCN, backgroundStyle,
} from "./utils.js";
import { dreamProgress, dreamTotal, jarVisual } from "./store.js";
import { jarHTML } from "./jar.js";

/* ---------------- 图标 ---------------- */
/* 线性图标统一在 <g> 上声明描边与填充，避免被全局 svg{fill:currentColor} 影响 */
const line = (paths, w = 1.8) =>
  `<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;

export const icons = {
  heart: `<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/></svg>`,
  pencil: line(`<path d="M4.5 19.5h3.2L18.6 8.6a1.6 1.6 0 0 0 0-2.3l-1.9-1.9a1.6 1.6 0 0 0-2.3 0L3.5 15.3z"/><path d="M13.8 5.6 18 9.8"/>`),
  calendar: line(`<rect x="3.5" y="5.5" width="17" height="15" rx="3"/><path d="M3.5 10.4h17M8 3.4v4M16 3.4v4"/>`),
  target: line(`<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.3"/><path d="M12 12h6.6"/><circle cx="12" cy="12" r="1" fill="currentColor"/>`),
  clock: line(`<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.1 1.9"/>`),
  wallet: line(`<path d="M4 8a2.4 2.4 0 0 1 2.4-2.4H17A2.4 2.4 0 0 1 19.4 8v8.6A2.4 2.4 0 0 1 17 19H6.4A2.4 2.4 0 0 1 4 16.6z"/><path d="M14.6 11.4h4.8v3h-4.8a1.5 1.5 0 0 1 0-3z"/>`),
  note: line(`<rect x="4.6" y="3.8" width="14.8" height="16.4" rx="3"/><path d="M8.4 9h7.2M8.4 12.6h7.2M8.4 16.2h4.4"/>`),
  image: line(`<rect x="3.6" y="4.6" width="16.8" height="14.8" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4.4 17.6 9.6 12.2l3.1 3 2.6-2.4 4 3.9"/>`),
  plus: line(`<path d="M12 5.5v13M5.5 12h13"/>`, 2.2),
  check: line(`<circle cx="12" cy="12" r="8.6"/><path d="M8.2 12.4l2.6 2.6 5-5.2"/>`, 1.9),
  trash: line(`<path d="M4.8 7.2h14.4"/><path d="M9.6 7.2V4.9a.9.9 0 0 1 .9-.9h3a.9.9 0 0 1 .9.9v2.3"/><path d="M6.7 7.2 7.6 19a1.2 1.2 0 0 0 1.2 1.1h6.4a1.2 1.2 0 0 0 1.2-1.1l.9-11.8"/><path d="M10.4 11v5.6M13.6 11v5.6"/>`),
  arrowRight: line(`<path d="M9 6l6 6-6 6"/>`, 2.1),
  arrowLeft: line(`<path d="M15 6l-6 6 6 6"/>`, 2.1),
  more: `<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/></svg>`,
  rotate: line(`<path d="M12 5.2a6.9 6.9 0 1 1-6.5 4.7"/><path d="M5.2 4.6v4.9h4.9"/>`, 1.9),
  sparkles: `<svg viewBox="0 0 24 24"><path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7z"/><path d="M18.5 15l.8 2.1 2.2.8-2.2.8-.8 2.1-.8-2.1-2.2-.8 2.2-.8z"/></svg>`,
  eye: line(`<path d="M12 6.2c4.8 0 8.2 3.8 9.2 5.8-1 2-4.4 5.8-9.2 5.8S3.8 14 2.8 12c1-2 4.4-5.8 9.2-5.8z"/><circle cx="12" cy="12" r="2.6"/>`),
  download: line(`<path d="M12 4.2v10.4m0 0 4-4m-4 4-4-4"/><path d="M5 18.4h14"/>`, 1.9),
  upload: line(`<path d="M12 16.2V5.8m0 0 4 4m-4-4-4 4"/><path d="M5 18.4h14"/>`, 1.9),
  coin: line(`<ellipse cx="12" cy="8.2" rx="7" ry="3.4"/><path d="M5 8.2v7.6c0 1.9 3.1 3.4 7 3.4s7-1.5 7-3.4V8.2"/><path d="M5 12c0 1.9 3.1 3.4 7 3.4s7-1.5 7-3.4"/>`),
};

export const icon = (name, cls = "") => `<span class="${cls}" aria-hidden="true">${icons[name] || ""}</span>`;

/* ---------------- 进度条 ---------------- */
export function progressHTML(pct, { large = false, extraClass = "" } = {}) {
  const w = Math.max(0, Math.min(100, Number(pct) || 0));
  return `<div class="progress${large ? " progress--lg" : ""} ${extraClass}">
    <div class="progress__bar" style="width:${w.toFixed(1)}%"></div>
  </div>`;
}

/* ---------------- 梦想卡片（我的梦想 / 首页） ---------------- */
export function dreamCardHTML(dream) {
  const p = dreamProgress(dream);
  return `
  <article class="dream-card" data-action="open-dream" data-id="${dream.id}">
    <button class="dream-card__more" type="button" data-action="dream-menu" data-id="${dream.id}" aria-label="更多操作">${icons.more}</button>
    ${jarHTML({ progress: p.pct, image: dream.image, name: "", size: "mini", badge: false, bubbles: false })}
    <h4 class="dream-card__name">${escapeHtml(dream.name)}</h4>
    <div class="dream-card__bar">
      ${progressHTML(p.pct)}
      <b>${fmtNumber(p.pct)}%</b>
    </div>
    <p class="dream-card__money">${fmtMoney(p.total)} / ${fmtMoney(p.target)}</p>
  </article>`;
}

/* ---------------- 已完成行 ---------------- */
export function completedRowHTML(dream) {
  const thumb = dream.archive?.finishImage || dream.image;
  return `
  <div class="row-item" data-action="open-dream" data-id="${dream.id}">
    <div class="row-item__thumb" style="${backgroundStyle(thumb)}"></div>
    <div class="row-item__body">
      <h4>${escapeHtml(dream.name)}</h4>
      <p>${fmtDateDot(dream.archive?.finishDate || dream.startDate)}</p>
    </div>
    <div class="row-item__right">
      <span class="chip chip--done">已完成</span>
      <span class="arrow">${icons.arrowRight}</span>
    </div>
  </div>`;
}

/* ---------------- 梦想收藏馆卡片 ---------------- */
export function wallCardHTML(dream) {
  const p = dreamProgress(dream);
  const img = dream.archive?.finishImage || dream.image;
  const archive = dream.archive || {};
  return `
  <article class="wall-card" data-action="open-dream" data-id="${dream.id}">
    <div class="wall-card__img" style="${backgroundStyle(img)}">
      <span class="wall-card__tag">✦ 已实现</span>
    </div>
    <div class="wall-card__body">
      <h3>${escapeHtml(dream.name)}</h3>
      <p>${escapeHtml(archive.memoryText || dream.completeMessage || "这个梦想，已经装进我的罐子里了。")}</p>
      <div class="wall-card__foot">
        <span>${fmtDateDot(archive.finishDate)}</span>
        <span>实际存入 ${fmtMoney(archive.finalAmount ?? dreamTotal(dream))}</span>
      </div>
    </div>
  </article>`;
}

/* ---------------- 存钱记录 ---------------- */
export function recordListHTML(dream, { limit = 0, deletable = false } = {}) {
  const list = [...(dream.deposits || [])].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const shown = limit ? list.slice(0, limit) : list;
  if (!shown.length) {
    return `<p style="font-size:12.5px;color:var(--ink-soft);padding:6px 0">还没有存钱记录，点「存入一笔」开始吧。</p>`;
  }
  let running = dreamTotal(dream);
  const rows = shown.map((d) => {
    const totalAfter = running;
    running -= Number(d.amount) || 0;
    return `
    <div class="record">
      <span class="record__drop"></span>
      <div>
        <div class="record__date">${fmtDate(d.date)}</div>
        ${d.note ? `<div class="record__note">${escapeHtml(d.note)}</div>` : ""}
      </div>
      <div class="record__right">
        <div class="record__amount">+${fmtMoney(d.amount)}</div>
        <div class="record__total">累计 ${fmtMoney(totalAfter)}</div>
      </div>
      ${deletable
        ? `<button class="record__del" type="button" data-action="delete-deposit" data-id="${dream.id}" data-deposit="${d.id}" aria-label="删除这条记录">${icons.trash}</button>`
        : ""}
    </div>`;
  }).join("");
  const more = limit && list.length > limit
    ? `<p style="font-size:12px;color:var(--ink-faint);text-align:center;padding-top:10px">共 ${list.length} 条记录</p>`
    : "";
  return rows + more;
}

/* ---------------- 储蓄时间线 ---------------- */
export function timelineHTML(dream) {
  const events = [];
  events.push({
    date: dream.startDate || (dream.createTime || "").slice(0, 10),
    title: "创建梦想计划",
    note: `目标金额 ${fmtMoney(dream.target)}`,
    type: "create",
  });
  let running = 0;
  [...(dream.deposits || [])]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .forEach((d) => {
      running += Number(d.amount) || 0;
      const pct = dream.target > 0 ? (running / dream.target) * 100 : 0;
      events.push({
        date: d.date,
        title: `存入 ${fmtMoney(d.amount)}`,
        note: `累计 ${fmtMoney(running)} / ${fmtMoney(dream.target)}　完成度 ${fmtNumber(pct)}%${d.note ? `　· ${d.note}` : ""}`,
        type: "deposit",
      });
    });
  if (dream.status === "completed") {
    events.push({
      date: dream.archive?.finishDate || "",
      title: "🎉 梦想达成",
      note: dream.archive?.memoryText || dream.completeMessage || "梦想已经实现。",
      type: "done",
    });
  }
  return `
  <div class="timeline">
    ${events.map((e) => `
      <div class="tl-item tl-item--${e.type}">
        <div class="tl-item__head">
          <span class="tl-item__title">${e.title}</span>
          <span class="tl-item__date">${fmtDateDot(e.date)}</span>
        </div>
        ${e.note ? `<div class="tl-item__note">${escapeHtml(e.note)}</div>` : ""}
      </div>`).join("")}
  </div>`;
}

/* ---------------- 空状态 ---------------- */
export function emptyHTML({ title, desc, action = "" }) {
  return `
  <div class="empty">
    <div class="empty__icon">${icons.sparkles}</div>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(desc)}</p>
    ${action}
  </div>`;
}

/* ---------------- 数据小卡 ---------------- */
export function statHTML(value, label) {
  return `<div class="stat"><b>${value}</b><span>${escapeHtml(label)}</span></div>`;
}

/* ---------------- 罐子说明行 ---------------- */
export function jarStateHintHTML(pct) {
  const v = jarVisual(pct);
  return `<div class="jar-hint">${icons.sparkles}<span>${v.stageRange}　${v.stageLabel}</span></div>`;
}

export function createTimeText(dream) {
  return `创建时间 ${fmtDateCN(dream.startDate || dream.createTime)}`;
}
