/* 梦想详情页：大型玻璃罐 + 梦想数据 + 存钱记录 + 储蓄时间线 */

import { getDream, dreamProgress, jarVisual } from "../store.js";
import {
  escapeHtml, fmtMoney, fmtNumber, fmtDateCN, backgroundStyle, fmtDateDot,
} from "../utils.js";
import { jarHTML, bindJarDrag } from "../jar.js";
import {
  progressHTML, recordListHTML, timelineHTML, icons,
} from "../components.js";

export function renderDetail(el, id) {
  const dream = getDream(id);
  if (!dream) {
    el.innerHTML = `
      <div class="empty">
        <div class="empty__icon">${icons.sparkles}</div>
        <h3>没有找到这个梦想</h3>
        <p>它可能已经被删除了。</p>
        <a class="btn btn--primary" href="#/dreams">回到我的梦想</a>
      </div>`;
    return;
  }

  const p = dreamProgress(dream);
  const v = jarVisual(p.pct);
  const done = dream.status === "completed";

  el.innerHTML = `
    <div class="detail-top">
      <a class="back-btn" href="#/">${icons.arrowLeft}<span>返回</span></a>
      <span class="chip ${done ? "chip--done" : ""}">${done ? "已完成" : `进行中 · ${v.stageRange}`}</span>
      <div style="margin-left:auto;display:flex;gap:8px">
        ${done
          ? `<a class="btn btn--ghost btn--sm" href="#/archive/${dream.id}">查看梦想档案</a>`
          : `<button class="btn btn--primary btn--sm" type="button" data-action="open-deposit" data-id="${dream.id}">
               <span class="plus">+</span> 存入一笔
             </button>`}
        <button class="btn btn--ghost btn--sm" type="button" data-action="dream-menu" data-id="${dream.id}">更多</button>
      </div>
    </div>

    <section class="detail-panel">
      <div class="detail-panel__jar">
        <div class="detail-panel__jar-bg" style="${backgroundStyle(dream.image)}"></div>
        ${jarHTML({ progress: p.pct, image: dream.image, name: dream.name, size: "lg", badge: false, interactive: true })}
        <div class="jar-hint">${icons.rotate}<span>滑动查看不同角度</span></div>
        <div class="jar-dots"><span></span><span></span><span></span></div>
      </div>

      <div class="detail-info">
        <div class="detail-info__title">
          <h2>${escapeHtml(dream.name)}</h2>
          <button class="icon-btn" type="button" data-action="edit-dream" data-id="${dream.id}" aria-label="编辑梦想">${icons.pencil}</button>
        </div>
        <p class="detail-info__desc">${escapeHtml(dream.description || "还没有写描述，编辑梦想可以补上几句。")}</p>

        <div class="detail-amount">
          <b>${fmtMoney(p.total)}</b><span>/ ${fmtMoney(p.target)}</span>
        </div>
        <div class="detail-progress">
          ${progressHTML(p.pct, { large: true })}
          <b>${fmtNumber(p.pct)}%</b>
        </div>
        <p class="muted" style="margin-top:8px">${v.stageLabel}${p.remaining > 0 ? `　还需 ${fmtMoney(p.remaining)}` : ""}</p>

        <div style="margin-top:18px">
          ${kv("calendar", "开始时间", dream.startDate ? fmtDateCN(dream.startDate) : "—")}
          ${kv("clock", "目标完成时间", dream.targetDate ? fmtDateCN(dream.targetDate) : "未设置")}
          ${kv("wallet", "存钱方式", dream.savingMethod || "未设置")}
          ${kv("note", "存钱笔记", dream.savingNote || "还没有写笔记")}
          ${kv("coin", "存钱记录", `${dream.deposits.length} 笔　共 ${fmtMoney(p.total)}`)}
        </div>

        <div class="detail-actions">
          ${done
            ? `<a class="btn btn--primary" href="#/archive/${dream.id}">查看梦想档案</a>
               <button class="btn btn--ghost" type="button" data-action="edit-dream" data-id="${dream.id}">编辑</button>`
            : `<button class="btn btn--primary" type="button" data-action="open-deposit" data-id="${dream.id}">存入一笔</button>
               <button class="btn btn--ghost" type="button" data-action="edit-dream" data-id="${dream.id}">编辑</button>`}
        </div>
      </div>

      <div class="detail-panel__preview">
        <div class="dream-preview">
          <div class="dream-preview__title">${icons.eye}<span>梦想的样子</span></div>
          <div class="dream-preview__img" style="${backgroundStyle(done ? (dream.archive?.finishImage || dream.image) : dream.image)}"></div>
          <p class="dream-preview__quote">
            “ ${escapeHtml(dream.completeMessage || dream.description || "这是我努力的方向。")} ”
          </p>
          <div style="display:flex;align-items:center;gap:8px;color:var(--accent)">
            <span style="width:18px;height:18px;display:inline-block">${icons.heart}</span>
            <span class="muted">${done ? `完成于 ${fmtDateDot(dream.archive?.finishDate)}` : "还在路上"}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="home-cols">
        <div class="card">
          <div class="section__head" style="margin-bottom:10px">
            <div class="section__title">
              <h2 style="font-size:16px">存钱记录</h2>
              <p>${dream.deposits.length} 笔 · 共 ${fmtMoney(p.total)}</p>
            </div>
            <div class="section__actions">
              ${done
                ? `<span class="chip chip--done">已封存</span>`
                : `<button class="btn btn--primary btn--sm" type="button" data-action="open-deposit" data-id="${dream.id}">
                     <span class="plus">+</span> 存入一笔
                   </button>`}
            </div>
          </div>
          ${recordListHTML(dream, { deletable: !done })}
        </div>

        <div class="card">
          <div class="section__head" style="margin-bottom:10px">
            <div class="section__title"><h2 style="font-size:16px">储蓄时间线</h2></div>
          </div>
          ${timelineHTML(dream)}
        </div>
      </div>
    </section>`;

  bindJarDrag(el);
}

function kv(iconName, label, value) {
  return `
  <div class="kv">
    <span class="kv__icon">${icons[iconName] || ""}</span>
    <span class="kv__label">${label}</span>
    <span class="kv__value">${escapeHtml(value)}</span>
  </div>`;
}
