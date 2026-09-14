/* 首页：当前梦想的大储蓄罐 + 从模糊到清晰 + 我的梦想 */

import {
  getCurrentDream, getActiveDreams, getCompletedDreams, dreamProgress, jarVisual,
} from "../store.js";
import { escapeHtml, fmtMoney, fmtNumber, backgroundStyle, fmtDateCN } from "../utils.js";
import { jarHTML, bindJarDrag } from "../jar.js";
import {
  dreamCardHTML, completedRowHTML, progressHTML, emptyHTML, icons, icon,
} from "../components.js";

export function renderHome(el) {
  const dream = getCurrentDream();
  const active = getActiveDreams();
  const completed = getCompletedDreams();

  el.innerHTML = `
    ${dream ? heroHTML(dream) : heroEmptyHTML()}
    ${dream ? clarityHTML(dream) : ""}
    <div class="home-cols">
      <section class="section">
        <div class="section__head">
          <div class="section__title">
            <h2>我的梦想</h2>
            <p>把每一个想去的地方，变成可实现的计划。</p>
          </div>
          <div class="section__actions">
            <a class="link-btn" href="#/dreams">查看全部 ${icon("arrowRight")}</a>
            <button class="btn btn--primary btn--sm" type="button" data-action="open-create">
              <span class="plus">+</span> 创建新梦想
            </button>
          </div>
        </div>
        ${active.length
          ? `<div class="dream-grid">${active.slice(0, 8).map(dreamCardHTML).join("")}</div>`
          : emptyHTML({
              title: "还没有正在进行的梦想",
              desc: "创建一个梦想储蓄罐，上传一张梦想照片，然后开始一点一点存钱。",
              action: `<button class="btn btn--primary" type="button" data-action="open-create">创建第一个梦想</button>`,
            })}
      </section>

      <section class="section">
        <div class="section__head">
          <div class="section__title"><h2>已完成的梦想</h2></div>
          <div class="section__actions">
            <a class="link-btn" href="#/completed">查看全部 ${icon("arrowRight")}</a>
          </div>
        </div>
        ${completed.length
          ? `<div class="row-list">${completed.slice(0, 4).map(completedRowHTML).join("")}</div>`
          : `<div class="card card--flat" style="font-size:12.5px;color:var(--ink-soft);line-height:1.9">
               完成的梦想会出现在这里，成为你的个人梦想纪念馆。
             </div>`}
      </section>
    </div>`;

  bindJarDrag(el);
}

/* ---------------- 顶部大罐子 ---------------- */
function heroHTML(dream) {
  const p = dreamProgress(dream);
  const v = jarVisual(p.pct);
  return `
  <section class="hero">
    <div class="hero__bg" style="${backgroundStyle(dream.image)}"></div>
    <div class="hero__veil"></div>

    <div class="hero__left">
      <h1>${escapeHtml(dream.name)} <span class="heart">♥</span></h1>
      <p class="hero__lead">${escapeHtml(dream.description || "每一笔存款，都是向梦想更近一步。")}</p>
      <div class="hero__actions">
        <button class="btn btn--primary" type="button" data-action="open-deposit" data-id="${dream.id}">
          <span class="plus">+</span> 存入一笔
        </button>
        <a class="btn btn--ghost" href="#/dream/${dream.id}">查看梦想详情</a>
      </div>
      <p class="muted" style="margin-top:16px">${escapeHtml(startText(dream))}</p>
    </div>

    <div class="hero__jar">
      ${jarHTML({ progress: p.pct, image: dream.image, name: dream.name, size: "lg", badge: false, interactive: true })}
      <div class="jar-hint">${icons.rotate}<span>滑动可以换个角度看看它</span></div>
    </div>

    <div class="hero__right">
      <div class="hero__title">${icons.target}${escapeHtml(dream.name)}</div>
      <div class="hero__meta">
        <div class="row"><span>目标金额</span><strong>${fmtMoney(p.target)}</strong></div>
        <div class="row"><span>已存金额</span><strong>${fmtMoney(p.total)}</strong></div>
        <div class="row"><span>还需金额</span><strong>${fmtMoney(p.remaining)}</strong></div>
      </div>
      ${progressHTML(p.pct, { large: true })}
      <div class="hero__percent">完成度 ${fmtNumber(p.pct)}%　·　${v.stageRange}</div>
      <p class="hero__quote">“ ${escapeHtml(dream.savingNote || dream.completeMessage || "想去的远方，会因为你今天存下的这一笔，慢慢变得清晰。")} ”</p>
    </div>
  </section>`;
}

function startText(dream) {
  const parts = [];
  if (dream.startDate) parts.push(`开始于 ${fmtDateCN(dream.startDate)}`);
  if (dream.targetDate) parts.push(`目标完成 ${fmtDateCN(dream.targetDate)}`);
  if (dream.savingMethod) parts.push(dream.savingMethod);
  return parts.join("　·　") || "今天开始，也不算晚";
}

function heroEmptyHTML() {
  return `
  <section class="hero hero--empty">
    <div class="hero__left">
      <h1>把梦想<br><span class="accent">装进罐子里</span></h1>
      <p class="hero__lead">每一笔存款，都是向梦想更近一步。创建一个梦想储蓄罐，看它从磨砂变得透明。</p>
      <div class="hero__actions">
        <button class="btn btn--primary" type="button" data-action="open-create">
          <span class="plus">+</span> 创建新梦想
        </button>
        <button class="btn btn--ghost" type="button" data-action="load-samples">先看看示例</button>
      </div>
    </div>
    <div class="hero__jar">
      ${jarHTML({ progress: 0, image: "", name: "", size: "lg", badge: false, interactive: true })}
      <div class="jar-hint">${icons.sparkles}<span>罐子现在是磨砂的，等着被你的梦想填满</span></div>
    </div>
  </section>`;
}

/* ---------------- 从模糊到清晰 ---------------- */
function clarityHTML(dream) {
  const target = Number(dream.target) || 0;
  const steps = [
    { pct: 0, caption: "刚开始，一切还是模糊的" },
    { pct: 33, caption: target ? `存入 ${fmtMoney(target * 0.33)}，梦想开始显现` : "梦想开始显现" },
    { pct: 66, caption: target ? `存入 ${fmtMoney(target * 0.66)}，画面越来越清晰` : "画面越来越清晰" },
    { pct: 100, caption: "达成目标，解锁真实的梦想" },
  ];
  return `
  <section class="section">
    <div class="section__head">
      <div class="section__title">
        <h2>从模糊到清晰 · 见证梦想的每一步</h2>
        <p>存钱越多，罐子越透明，梦想越清晰。</p>
      </div>
    </div>
    <div class="card">
      <div class="clarity">
        ${steps.map((s) => `
          <div class="clarity__item">
            ${jarHTML({ progress: s.pct, image: dream.image, name: "", size: "xs", badge: false, bubbles: false })}
            <div class="clarity__pct">${s.pct}%</div>
            <div class="clarity__caption">${escapeHtml(s.caption)}</div>
          </div>`).join("")}
      </div>
    </div>
  </section>`;
}
