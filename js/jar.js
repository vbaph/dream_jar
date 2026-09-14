/* 玻璃梦想储蓄罐：根据完成度生成不同透明度 / 水位 / 清晰度的罐子 */

import { jarVisual } from "./store.js";
import { cssVars, escapeHtml, clamp, fmtNumber } from "./utils.js";

const SIZE_CLASS = {
  lg: "jar--lg",
  mini: "jar--mini",
  xs: "jar--xs",
  md: "",
};

/**
 * 生成储蓄罐 HTML
 * @param {object} opts
 * @param {number} opts.progress 完成度 0-100
 * @param {string} opts.image    梦想图片地址（本地路径或 dataURL）
 * @param {string} opts.name     罐身标签文字
 * @param {'lg'|'md'|'mini'|'xs'} opts.size
 * @param {boolean} opts.badge   是否显示百分比徽标
 * @param {boolean} opts.interactive 是否支持鼠标/手指旋转查看
 */
export function jarHTML({
  progress = 0,
  image = "",
  name = "",
  size = "md",
  badge = true,
  interactive = false,
  bubbles = true,
} = {}) {
  const v = jarVisual(progress);
  const complete = v.pct >= 100;
  const style = cssVars({
    "--p": v.pct.toFixed(1),
    "--blur": `${v.blur}px`,
    "--frost": v.frost,
    "--water": `${v.water}%`,
    "--photo-scale": v.scale,
    "--photo-sat": v.sat,
    "--photo-bri": v.bri,
    "--glow": v.glow,
  });
  const photo = image
    ? `<div class="jar__photo" style="background-image:url('${String(image).replace(/'/g, "%27")}')"></div>`
    : `<div class="jar__photo jar__photo--blank"></div>`;
  const bubbleSpans = bubbles ? "<span class=\"jar__bubble\"></span>".repeat(5) : "";

  return `
  <div class="jar-3d${interactive ? " js-jar-stage" : ""}">
    <div class="jar ${SIZE_CLASS[size] ?? ""}${complete ? " is-complete" : ""}${interactive ? " js-jar" : ""}"
         style="${style}" role="img"
         aria-label="${escapeHtml(name || "梦想储蓄罐")}，完成度 ${Math.round(v.pct)}%">
      <div class="jar__lid"><span class="jar__cork"></span></div>
      <div class="jar__mouth"></div>
      <div class="jar__body">
        <div class="jar__inner">
          ${photo}
          <div class="jar__water">${bubbleSpans}</div>
        </div>
        <div class="jar__frost"></div>
        <div class="jar__shine"></div>
        <div class="jar__sparkles">
          ${"<span class=\"jar__sparkle\"></span>".repeat(6)}
        </div>
        ${name ? `<div class="jar__label">${escapeHtml(name)}</div>` : ""}
        ${badge ? `<div class="jar__badge">${fmtNumber(v.pct)}%</div>` : ""}
      </div>
    </div>
  </div>`;
}

/** 让罐子可以跟随鼠标 / 手指轻微旋转，营造立体感 */
export function bindJarDrag(root = document) {
  root.querySelectorAll(".js-jar-stage").forEach((stage) => {
    if (stage.dataset.jarBound === "1") return;
    stage.dataset.jarBound = "1";
    const jar = stage.querySelector(".js-jar");
    if (!jar) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let baseRY = 0;
    let baseRX = 0;

    const set = (ry, rx) => {
      jar.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      jar.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    };
    const reset = () => set(0, 0);

    stage.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      baseRY = parseFloat(jar.style.getPropertyValue("--ry")) || 0;
      baseRX = parseFloat(jar.style.getPropertyValue("--rx")) || 0;
      jar.classList.add("is-dragging");
      try { stage.setPointerCapture(e.pointerId); } catch { /* 忽略 */ }
    });

    stage.addEventListener("pointermove", (e) => {
      if (dragging) {
        const ry = clamp(baseRY + (e.clientX - startX) / 5, -34, 34);
        const rx = clamp(baseRX - (e.clientY - startY) / 7, -16, 16);
        set(ry, rx);
        return;
      }
      if (e.pointerType !== "mouse") return;
      const rect = stage.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      set(nx * 30, -ny * 14);
    });

    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      jar.classList.remove("is-dragging");
      try { stage.releasePointerCapture(e.pointerId); } catch { /* 忽略 */ }
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    stage.addEventListener("pointerleave", (e) => {
      if (dragging) return;
      if (e.pointerType === "mouse") reset();
    });
  });
}
