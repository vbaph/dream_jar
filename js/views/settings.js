/* 设置：外观、数据管理、统计与说明 */

import {
  getState, getDreams, getActiveDreams, getCompletedDreams, dreamTotal,
  exportData, importData, clearAll, loadSamples, setTheme, setMotion,
} from "../store.js";
import { downloadFile, readTextFile, fmtMoney, todayISO } from "../utils.js";
import { toast, confirmDialog } from "../ui.js";
import { statHTML, icons } from "../components.js";

export function renderSettings(el) {
  const state = getState();
  const dreams = getDreams();
  const active = getActiveDreams();
  const completed = getCompletedDreams();
  const totalSaved = dreams.reduce((sum, d) => sum + dreamTotal(d), 0);
  const storageKB = (new Blob([JSON.stringify(state)]).size / 1024).toFixed(1);
  const isNight = state.settings.theme === "night";
  const lessMotion = Boolean(state.settings.reduceMotion);

  el.innerHTML = `
    <header class="page-head">
      <h1>设置</h1>
      <p>所有数据都保存在你这台设备的浏览器里，不需要注册，也不会上传到任何服务器。</p>
    </header>

    <div class="settings-grid">
      <section class="card">
        <div class="section__head" style="margin-bottom:8px">
          <div class="section__title"><h2 style="font-size:16px">外观</h2></div>
        </div>
        <div class="setting-row">
          <div class="setting-row__text">
            <h4>夜间模式</h4>
            <p>把页面切换成极光一样的深夜配色，晚上看更舒服。</p>
          </div>
          <button class="switch ${isNight ? "is-on" : ""}" type="button" data-setting="theme"
                  aria-label="切换夜间模式" aria-pressed="${isNight}"></button>
        </div>
        <div class="setting-row">
          <div class="setting-row__text">
            <h4>减少动画</h4>
            <p>关闭浮动、粒子与渐入动画，页面切换更快更安静。</p>
          </div>
          <button class="switch ${lessMotion ? "is-on" : ""}" type="button" data-setting="motion"
                  aria-label="减少动画" aria-pressed="${lessMotion}"></button>
        </div>
                <div class="setting-row">
          <div class="setting-row__text">
            <h4>新手引导</h4>
            <p>首页那张「欢迎来到梦想储蓄罐」的卡片只在第一次打开时出现，想再看一次就点右边。</p>
          </div>
          <a class="btn btn--ghost btn--sm" href="?guide=1">重新显示</a>
        </div>
      </section>

      <section class="card">
        <div class="section__head" style="margin-bottom:8px">
          <div class="section__title"><h2 style="font-size:16px">我的数据</h2></div>
        </div>
        <div class="stat-strip" style="margin-bottom:16px">
          ${statHTML(dreams.length, "梦想总数")}
          ${statHTML(active.length, "进行中")}
          ${statHTML(completed.length, "已完成")}
          ${statHTML(fmtMoney(totalSaved), "累计存入")}
        </div>
        <div class="setting-row">
          <div class="setting-row__text">
            <h4>导出备份</h4>
            <p>把全部梦想与存钱记录导出成 JSON 文件，换设备时导入即可恢复。</p>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" data-setting="export">导出</button>
        </div>
        <div class="setting-row">
          <div class="setting-row__text">
            <h4>导入数据</h4>
            <p>选择一个之前导出的 JSON 文件，覆盖当前数据。</p>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" data-setting="import">导入</button>
          <input type="file" accept="application/json,.json" hidden id="import-input">
        </div>
        <div class="setting-row">
          <div class="setting-row__text">
            <h4>载入示例数据</h4>
            <p>添加 7 个示例梦想（含完成的梦想），用来快速体验完整效果。</p>
          </div>
          <button class="btn btn--ghost btn--sm" type="button" data-setting="samples">载入</button>
        </div>
        <div class="setting-row">
          <div class="setting-row__text">
            <h4>清空所有数据</h4>
            <p>删除全部梦想、存钱记录与纪念档案，操作不可恢复。</p>
          </div>
          <button class="btn btn--danger btn--sm" type="button" data-setting="clear">清空</button>
        </div>
        <p class="field__hint" style="margin-top:10px">
          当前占用浏览器存储约 ${storageKB} KB。图片会压缩后保存，建议不要上传过多超大图片。
        </p>
      </section>

      <section class="card">
        <div class="section__head" style="margin-bottom:8px">
          <div class="section__title"><h2 style="font-size:16px">怎么用</h2></div>
        </div>
        <ol class="howto">
          <li>点「创建新梦想」，写下梦想名称、目标金额，上传一张代表梦想的照片。</li>
          <li>每存下一笔钱，就点「存入一笔」记进去，罐子里的水位会升高。</li>
          <li>进度越高，玻璃罐越透明、梦想图片越清晰，从磨砂到完全解锁。</li>
          <li>存满之后上传实现梦想时的真实照片，它会进入「梦想收藏馆」。</li>
        </ol>
      </section>
    </div>`;

  bindSettings(el);
}

function bindSettings(el) {
  const state = getState();

  const themeBtn = el.querySelector('[data-setting="theme"]');
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = state.settings.theme === "night" ? "light" : "night";
      setTheme(next);
    });
  }

  const motionBtn = el.querySelector('[data-setting="motion"]');
  if (motionBtn) {
    motionBtn.addEventListener("click", () => {
      setMotion(!state.settings.reduceMotion);
    });
  }

  const exportBtn = el.querySelector('[data-setting="export"]');
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      downloadFile(`梦想储蓄罐-备份-${todayISO()}.json`, exportData());
      toast("已导出备份文件", "success");
    });
  }

  const importBtn = el.querySelector('[data-setting="import"]');
  const importInput = el.querySelector("#import-input");
  if (importBtn && importInput) {
    importBtn.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      const ok = await confirmDialog({
        title: "导入数据",
        message: "导入会覆盖当前浏览器里的全部梦想数据，确定继续吗？",
        confirmText: "导入并覆盖",
      });
      if (!ok) {
        importInput.value = "";
        return;
      }
      try {
        const count = importData(await readTextFile(file));
        toast(`导入成功，共 ${count} 个梦想`, "success");
      } catch (err) {
        toast(err.message || "导入失败", "error");
      }
      importInput.value = "";
    });
  }

  const sampleBtn = el.querySelector('[data-setting="samples"]');
  if (sampleBtn) {
    sampleBtn.addEventListener("click", () => {
      const added = loadSamples();
      toast(added ? `已载入 ${added} 个示例梦想` : "示例梦想已经在你的列表里了", added ? "success" : "info");
    });
  }

  const clearBtn = el.querySelector('[data-setting="clear"]');
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      const ok = await confirmDialog({
        title: "清空所有数据",
        message: "将删除全部梦想、存钱记录和纪念档案，且无法恢复。建议先导出备份。",
        confirmText: "确认清空",
        danger: true,
      });
      if (!ok) return;
      clearAll();
      toast("数据已清空", "info");
      location.hash = "#/";
    });
  }
}
