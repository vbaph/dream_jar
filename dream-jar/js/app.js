/* 应用入口：路由、全局事件委托、主题、首次访问示例数据 */

import { $, $$ } from "./utils.js";
import {
  load, onChange, loadSamples, setTheme, getState, deleteDeposit,
} from "./store.js";
import { closeModal, toast, confirmDialog } from "./ui.js";
import { openDreamForm, openDepositDialog, openCompleteDialog, openDreamMenu } from "./dialogs.js";
import { renderHome } from "./views/home.js";
import { renderDreams } from "./views/dreams.js";
import { renderDetail } from "./views/detail.js";
import { renderCompleted, renderArchive } from "./views/completed.js";
import { renderSettings } from "./views/settings.js";

const viewEl = $("#view");

/* ---------------- 主题 ---------------- */
function applyTheme() {
  const settings = getState().settings;
  const theme = settings.theme === "night" ? "night" : "light";
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.motion = settings.reduceMotion ? "off" : "on";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "night" ? "#141a3f" : "#8ea8f0");
}

/* ---------------- 路由 ---------------- */
function parseHash() {
  const raw = (location.hash || "").replace(/^#\/?/, "");
  const [path, id] = raw.split("/");
  return { path: path || "home", id: id || "" };
}

let lastRouteKey = "";

function render({ scrollTop = false } = {}) {
  const { path, id } = parseHash();
  const key = `${path}/${id}`;
  applyTheme();

  switch (path) {
    case "dreams": renderDreams(viewEl); break;
    case "completed": renderCompleted(viewEl); break;
    case "settings": renderSettings(viewEl); break;
    case "dream": renderDetail(viewEl, id); break;
    case "archive": renderArchive(viewEl, id); break;
    case "create":
      renderHome(viewEl);
      openDreamForm();
      break;
    default: renderHome(viewEl);
  }

  updateNav(path);

  if (scrollTop && key !== lastRouteKey) window.scrollTo({ top: 0, behavior: "auto" });
  lastRouteKey = key;
}

function updateNav(path) {
  const map = { home: "home", "": "home", dream: "dreams", dreams: "dreams", archive: "completed", completed: "completed", settings: "settings", create: "" };
  const active = map[path] ?? "";
  $$("[data-nav]").forEach((el) => el.classList.toggle("is-active", el.dataset.nav === active));
}

/* ---------------- 全局交互 ---------------- */
document.addEventListener("click", async (e) => {
  const trigger = e.target.closest("[data-action]");
  if (!trigger) return;
  const { action, id, deposit } = trigger.dataset;

  switch (action) {
    case "close-modal":
      closeModal();
      break;

    case "open-create":
      e.preventDefault();
      openDreamForm();
      break;

    case "open-dream":
      if (id) {
        e.preventDefault();
        location.hash = `#/dream/${id}`;
      }
      break;

    case "dream-menu":
      e.preventDefault();
      e.stopPropagation();
      openDreamMenu(id);
      break;

    case "open-deposit":
      e.preventDefault();
      openDepositDialog(id);
      break;

    case "edit-dream":
      e.preventDefault();
      openDreamForm(id);
      break;

    case "complete-dream":
      e.preventDefault();
      openCompleteDialog(id);
      break;

    case "delete-deposit": {
      e.preventDefault();
      const ok = await confirmDialog({
        title: "删除存钱记录",
        message: "确定要删除这条存钱记录吗？完成度会相应回退。",
        confirmText: "删除",
        danger: true,
      });
      if (!ok) return;
      deleteDeposit(id, deposit);
      toast("记录已删除", "info");
      break;
    }

    case "load-samples": {
      e.preventDefault();
      const added = loadSamples();
      toast(added ? `已载入 ${added} 个示例梦想` : "示例梦想已经在列表里了", added ? "success" : "info");
      break;
    }

    case "toggle-theme": {
      e.preventDefault();
      const next = getState().settings.theme === "night" ? "light" : "night";
      setTheme(next);
      break;
    }

    default:
      break;
  }
});

/* ---------------- 启动 ---------------- */
function bootstrap() {
  load();
  applyTheme();

  // 第一次打开时载入示例数据，让页面直接呈现完整效果（可在设置里清空）
  const state = getState();
  if (!state.settings.seeded && state.dreams.length === 0) {
    loadSamples();
  }

  onChange(() => render());
  window.addEventListener("hashchange", () => render({ scrollTop: true }));
  render({ scrollTop: true });

  // 离线可用（PWA）：仅在使用 http/https 打开时注册
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* 本地文件打开时忽略 */ });
    });
  }
}

bootstrap();
