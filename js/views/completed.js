/* 已完成：梦想收藏馆 + 梦想档案 */

import { getCompletedDreams, getDream, dreamProgress, dreamTotal } from "../store.js";
import { escapeHtml, fmtMoney, fmtNumber, fmtDateDot, backgroundStyle, daysBetween } from "../utils.js";
import { wallCardHTML, emptyHTML, statHTML, recordListHTML, timelineHTML, icons } from "../components.js";
import { jarHTML, bindJarDrag } from "../jar.js";

export function renderCompleted(el) {
  const list = getCompletedDreams();
  const totalSaved = list.reduce((sum, d) => sum + (d.archive?.finalAmount ?? dreamTotal(d)), 0);
  const totalTarget = list.reduce((sum, d) => sum + (Number(d.target) || 0), 0);

  el.innerHTML = `
    <header class="page-head">
      <h1>梦想收藏馆</h1>
      <p>已经实现的梦想，会一直留在这里，提醒你曾经真的做到过。</p>
    </header>

    ${list.length ? `
      <div class="stat-strip" style="margin-bottom:22px">
        ${statHTML(list.length, "已实现的梦想")}
        ${statHTML(fmtMoney(totalSaved), "实际存入合计")}
        ${statHTML(fmtMoney(totalTarget), "目标金额合计")}
      </div>
      <div class="wall">${list.map(wallCardHTML).join("")}</div>
    ` : emptyHTML({
      title: "收藏馆还是空的",
      desc: "当你把一个梦想存满，它就会被收进这里，成为属于你的纪念。",
      action: `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
                 <a class="btn btn--primary" href="#/dreams">继续为梦想存钱</a>
                 <button class="btn btn--ghost" type="button" data-action="load-samples">载入示例数据</button>
               </div>`,
    })}
  `;
}

/* ---------------- 梦想档案 ---------------- */
export function renderArchive(el, id) {
  const dream = getDream(id);
  if (!dream || dream.status !== "completed") {
    el.innerHTML = `
      <div class="empty">
        <div class="empty__icon">${icons.sparkles}</div>
        <h3>还没有这个梦想的档案</h3>
        <p>只有完成的梦想才会生成纪念档案。</p>
        <a class="btn btn--primary" href="#/dreams">回到我的梦想</a>
      </div>`;
    return;
  }

  const p = dreamProgress(dream);
  const archive = dream.archive || {};
  const cover = archive.finishImage || dream.image;
  const days = dream.startDate && archive.finishDate ? daysBetween(dream.startDate, archive.finishDate) : null;

  el.innerHTML = `
    <div class="detail-top">
      <a class="back-btn" href="#/completed">${icons.arrowLeft}<span>返回收藏馆</span></a>
      <span class="chip chip--done">✦ 已实现</span>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button class="btn btn--ghost btn--sm" type="button" data-action="edit-dream" data-id="${dream.id}">编辑梦想</button>
        <button class="btn btn--primary btn--sm" type="button" data-action="complete-dream" data-id="${dream.id}">更新纪念档案</button>
      </div>
    </div>

    <section class="archive" style="${backgroundStyle(cover)}">
      <div class="archive__veil"></div>
      <div class="archive__content">
        <h2>我做到了！<br>${escapeHtml(dream.name)}</h2>
        <p>${escapeHtml(archive.memoryText || dream.completeMessage || "终于完成了这个梦想。")}</p>
        <div class="archive__meta">
          <div><span>完成日期</span>${fmtDateDot(archive.finishDate)}</div>
          <div><span>目标金额</span>${fmtMoney(dream.target)}</div>
          <div><span>实际存入</span>${fmtMoney(archive.finalAmount ?? p.total)}</div>
          ${days !== null ? `<div><span>用时</span>${fmtNumber(days)} 天</div>` : ""}
        </div>
        <div class="archive__thumbs">
          <div class="archive__thumb" style="${backgroundStyle(dream.image)}" title="当初的梦想图片"></div>
          <div class="archive__thumb" style="${backgroundStyle(archive.finishImage || cover)}" title="实现时的照片"></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="home-cols">
        <div class="card">
          <div class="section__head" style="margin-bottom:10px">
            <div class="section__title">
              <h2 style="font-size:16px">这个梦想的储蓄过程</h2>
              <p>${dream.deposits.length} 笔记录 · 共 ${fmtMoney(p.total)}</p>
            </div>
          </div>
          ${recordListHTML(dream)}
        </div>
        <div class="card">
          <div class="section__head" style="margin-bottom:10px">
            <div class="section__title"><h2 style="font-size:16px">储蓄时间线</h2></div>
          </div>
          ${timelineHTML(dream)}
          <div style="margin-top:16px;text-align:center">
            ${jarHTML({ progress: 100, image: dream.image, name: "", size: "xs", badge: false, bubbles: false })}
            <div class="muted" style="margin-top:6px">罐子已经完全透明了 ✦</div>
          </div>
        </div>
      </div>
    </section>`;

  bindJarDrag(el);
}
