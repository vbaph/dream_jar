/* 轻量 UI 层：弹窗、提示、确认框、完成庆祝动画 */

import { $, $$ } from "./utils.js";

const modalRoot = () => $("#modal-root");
const toastRoot = () => $("#toast-root");

/* ---------------- Toast ---------------- */
export function toast(message, type = "info", duration = 2400) {
  const root = toastRoot();
  if (!root) return;
  const el = document.createElement("div");
  el.className = `toast${type !== "info" ? ` toast--${type}` : ""}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => {
    el.classList.add("is-out");
    setTimeout(() => el.remove(), 320);
  }, duration);
}

/* ---------------- Modal ---------------- */
let escHandler = null;

export function openModal({ title = "", subtitle = "", body = "", footer = "", wide = false, onMount } = {}) {
  const root = modalRoot();
  root.innerHTML = `
    <div class="modal-backdrop" data-action="close-modal"></div>
    <div class="modal${wide ? " modal--wide" : ""}" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="modal__head">
        <div>
          <h3>${title}</h3>
          ${subtitle ? `<p>${subtitle}</p>` : ""}
        </div>
        <button class="modal__close" type="button" data-action="close-modal" aria-label="关闭">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>
        </button>
      </div>
      <div class="modal__body">${body}</div>
      ${footer ? `<div class="modal__foot">${footer}</div>` : ""}
    </div>`;
  root.classList.add("is-open");
  document.body.style.overflow = "hidden";

  escHandler = (e) => {
    if (e.key === "Escape") closeModal();
  };
  document.addEventListener("keydown", escHandler);

  if (typeof onMount === "function") onMount(root);
  const firstInput = root.querySelector("input, textarea, select");
  if (firstInput) setTimeout(() => firstInput.focus({ preventScroll: true }), 60);
  return root;
}

export function closeModal() {
  const root = modalRoot();
  if (!root) return;
  root.classList.remove("is-open");
  root.innerHTML = "";
  document.body.style.overflow = "";
  if (escHandler) {
    document.removeEventListener("keydown", escHandler);
    escHandler = null;
  }
}

export const isModalOpen = () => modalRoot()?.classList.contains("is-open");

/* ---------------- 确认框 ---------------- */
export function confirmDialog({
  title = "确认操作",
  message = "",
  confirmText = "确定",
  cancelText = "取消",
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    openModal({
      title,
      body: `<p style="font-size:14px;line-height:1.9;color:var(--ink-2)">${message}</p>`,
      footer: `
        <button class="btn btn--ghost" type="button" data-confirm="0">${cancelText}</button>
        <button class="btn ${danger ? "btn--danger" : "btn--primary"}" type="button" data-confirm="1">${confirmText}</button>`,
      onMount(root) {
        $$("[data-confirm]", root).forEach((btn) => {
          btn.addEventListener("click", () => {
            closeModal();
            resolve(btn.dataset.confirm === "1");
          });
        });
      },
    });
  });
}

/* ---------------- 完成庆祝 ---------------- */
export function celebrate() {
  const colors = ["#7ba0f5", "#a58cf3", "#f6bcd2", "#f4d08a", "#8fe0cf", "#ffffff"];
  const layer = document.createElement("div");
  layer.className = "celebrate";
  const count = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 70;
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = `${2.6 + Math.random() * 2.4}s`;
    piece.style.animationDelay = `${Math.random() * 0.9}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    if (Math.random() > 0.6) piece.style.borderRadius = "50%";
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 6000);
}

/** 数字滚动动画，用于进度变化 */
export function animateNumber(el, from, to, duration = 900, format = (v) => Math.round(v)) {
  if (!el) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = format(to);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
