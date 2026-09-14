/* 我的梦想：所有正在进行中的梦想 */

import { getActiveDreams, getCompletedDreams, getDreams } from "../store.js";
import { dreamCardHTML, wallCardHTML, emptyHTML, statHTML } from "../components.js";

export function renderDreams(el) {
  const active = getActiveDreams();
  const completed = getCompletedDreams();
  const total = getDreams().length;

  el.innerHTML = `
    <header class="page-head">
      <h1>我的梦想</h1>
      <p>每一个罐子，都是一件正在慢慢实现的事。</p>
    </header>

    <div class="stat-strip" style="margin-bottom:22px">
      ${statHTML(total, "梦想总数")}
      ${statHTML(active.length, "正在进行")}
      ${statHTML(completed.length, "已经实现")}
    </div>

    ${active.length
      ? `<div class="dream-grid">${active.map(dreamCardHTML).join("")}</div>`
      : emptyHTML({
          title: "还没有正在进行的梦想",
          desc: "创建一个梦想储蓄罐，上传一张梦想照片，设置目标金额，然后开始存钱吧。",
          action: `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
                     <button class="btn btn--primary" type="button" data-action="open-create">创建新梦想</button>
                     <button class="btn btn--ghost" type="button" data-action="load-samples">载入示例数据看看效果</button>
                   </div>`,
        })}

    ${completed.length
      ? `<section class="section">
          <div class="section__head">
            <div class="section__title"><h2>已经实现的梦想</h2><p>它们被收进了梦想收藏馆。</p></div>
            <div class="section__actions"><a class="link-btn" href="#/completed">前往收藏馆 →</a></div>
          </div>
          <div class="wall">${completed.map(wallCardHTML).join("")}</div>
        </section>`
      : ""}
  `;
}
