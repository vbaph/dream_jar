/* 所有弹窗：创建 / 编辑梦想、存入一笔、完成梦想、更多操作 */

import { $, $$, escapeHtml, compressImage, fmtMoney, fmtNumber, todayISO, parseAmount } from "./utils.js";
import {
  createDream, updateDream, deleteDream, addDeposit, getDream, dreamProgress,
  completeDream, setCurrentDream, getCurrentDream,
} from "./store.js";
import { openModal, closeModal, toast, confirmDialog, celebrate } from "./ui.js";
import { icons, progressHTML } from "./components.js";

/* ---------------- 图片上传控件 ---------------- */
function uploaderHTML(value, { hint = "支持 JPG / PNG / WEBP，图片只保存在你自己的浏览器里" } = {}) {
  return `
  <div class="uploader" data-uploader>
    ${value ? `<div class="uploader__preview" style="background-image:url('${String(value).replace(/'/g, "%27")}')"></div>
      <span class="uploader__replace">更换图片</span>` : `
      <div>
        <div class="uploader__icon">${icons.image}</div>
        <div class="uploader__text">点击上传图片</div>
        <div class="uploader__hint">或把图片拖到这里 · ${hint}</div>
      </div>`}
  </div>
  <input type="file" accept="image/png,image/jpeg,image/webp" hidden data-uploader-input>`;
}

function bindUploader(root, { onPick }) {
  const box = $("[data-uploader]", root);
  const input = $("[data-uploader-input]", root);
  if (!box || !input) return;

  const handle = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      onPick(dataUrl);
    } catch (err) {
      toast(err.message || "图片处理失败", "error");
    }
  };

  box.addEventListener("click", () => input.click());
  input.addEventListener("change", () => handle(input.files?.[0]));
  ["dragenter", "dragover"].forEach((ev) =>
    box.addEventListener(ev, (e) => {
      e.preventDefault();
      box.classList.add("is-drag");
    }));
  ["dragleave", "drop"].forEach((ev) =>
    box.addEventListener(ev, (e) => {
      e.preventDefault();
      box.classList.remove("is-drag");
    }));
  box.addEventListener("drop", (e) => handle(e.dataTransfer?.files?.[0]));
}

/* ---------------- 创建 / 编辑梦想 ---------------- */
export function openDreamForm(id = null) {
  const editing = Boolean(id);
  const dream = editing ? getDream(id) : null;
  if (editing && !dream) return;
  let image = dream?.image || "";

  const body = `
    <form id="dream-form" novalidate>
      <div class="field">
        <label class="field__label">梦想图片 <em>建议上传一张与梦想有关的照片</em></label>
        <div data-uploader-slot>${uploaderHTML(image)}</div>
      </div>
      <div class="field">
        <label class="field__label" for="f-name">梦想名称 <em>*</em></label>
        <input class="input" id="f-name" name="name" maxlength="30" placeholder="例如：去南极看极光"
               value="${escapeHtml(dream?.name || "")}" autocomplete="off">
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field__label" for="f-target">目标金额（元） <em>*</em></label>
          <input class="input" id="f-target" name="target" inputmode="numeric" placeholder="例如：30000"
                 value="${dream?.target ? dream.target : ""}" autocomplete="off">
        </div>
        <div class="field">
          <label class="field__label" for="f-target-date">目标完成时间</label>
          <input class="input" id="f-target-date" name="targetDate" type="date" value="${dream?.targetDate || ""}">
        </div>
      </div>
      <div class="field">
        <label class="field__label" for="f-desc">梦想描述</label>
        <textarea class="textarea" id="f-desc" name="description" maxlength="200"
                  placeholder="为什么想做这件事？想亲眼看到什么？">${escapeHtml(dream?.description || "")}</textarea>
        <div class="field__hint">这段话会出现在梦想详情页，提醒你当初为什么出发。</div>
      </div>
      <details class="more-fields" ${editing ? "open" : ""}>
        <summary>更多设置（可选）</summary>
        <div style="padding-top:14px">
          <div class="grid-2">
            <div class="field">
              <label class="field__label" for="f-start">开始时间</label>
              <input class="input" id="f-start" name="startDate" type="date" value="${dream?.startDate || todayISO()}">
            </div>
            <div class="field">
              <label class="field__label" for="f-method">存钱方式</label>
              <input class="input" id="f-method" name="savingMethod" maxlength="20" placeholder="例如：每月自动存"
                     value="${escapeHtml(dream?.savingMethod || "")}">
            </div>
          </div>
          <div class="field">
            <label class="field__label" for="f-note">存钱笔记</label>
            <input class="input" id="f-note" name="savingNote" maxlength="60" placeholder="例如：想去看极光，拍一张属于自己的照片。"
                   value="${escapeHtml(dream?.savingNote || "")}">
          </div>
          <div class="field" style="margin-bottom:0">
            <label class="field__label" for="f-message">完成后的纪念文字</label>
            <textarea class="textarea" id="f-message" name="completeMessage" maxlength="200"
                      placeholder="例如：我做到了！终于看到了南极的极光。">${escapeHtml(dream?.completeMessage || "")}</textarea>
          </div>
        </div>
      </details>
    </form>`;

  openModal({
    title: editing ? "编辑梦想" : "创建新梦想",
    subtitle: editing ? "随时调整目标金额或图片" : "给梦想起个名字，它就从模糊开始变得清晰",
    body,
    footer: `
      <button class="btn btn--ghost" type="button" data-action="close-modal">取消</button>
      <button class="btn btn--primary" type="button" id="dream-submit">${editing ? "保存修改" : "创建梦想"}</button>`,
    onMount(root) {
      const rebind = () => bindUploader(root, {
        onPick: (v) => {
          image = v;
          $("[data-uploader-slot]", root).innerHTML = uploaderHTML(image);
          rebind();
        },
      });
      rebind();

      const submit = root.querySelector("#dream-submit");
      const nameInput = root.querySelector("#f-name");
      submit.addEventListener("click", () => {
        const name = nameInput.value.trim();
        const target = parseAmount(root.querySelector("#f-target").value);
        if (!name) {
          toast("请先给梦想起个名字", "warn");
          nameInput.focus();
          return;
        }
        if (target <= 0) {
          toast("请填写大于 0 的目标金额", "warn");
          root.querySelector("#f-target").focus();
          return;
        }
        const payload = {
          name,
          image,
          target,
          description: root.querySelector("#f-desc").value.trim(),
          completeMessage: root.querySelector("#f-message").value.trim(),
          startDate: root.querySelector("#f-start").value || todayISO(),
          targetDate: root.querySelector("#f-target-date").value || "",
          savingMethod: root.querySelector("#f-method").value.trim(),
          savingNote: root.querySelector("#f-note").value.trim(),
        };
        if (editing) {
          updateDream(id, payload);
          toast("梦想已更新", "success");
          closeModal();
          location.hash = `#/dream/${id}`;
        } else {
          const created = createDream(payload);
          toast("新的梦想储蓄罐已创建 ✦", "success");
          closeModal();
          location.hash = `#/dream/${created.id}`;
        }
      });
      nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit.click();
        }
      });
    },
  });
}

/* ---------------- 存入一笔 ---------------- */
export function openDepositDialog(id) {
  const dream = getDream(id);
  if (!dream) return;
  let amount = "";

  const p = dreamProgress(dream);
  const body = `
    <form id="deposit-form" novalidate>
      <div class="field">
        <label class="field__label">本次存入金额（元） <em>*</em></label>
        <input class="input" id="d-amount" inputmode="decimal" placeholder="例如：500" autocomplete="off">
        <div class="amount-chips">
          ${[100, 200, 500, 1000, 2000].map((v) => `<button type="button" data-quick="${v}">+${fmtNumber(v)}</button>`).join("")}
        </div>
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field__label" for="d-date">存入日期</label>
          <input class="input" id="d-date" type="date" value="${todayISO()}">
        </div>
        <div class="field">
          <label class="field__label" for="d-note">备注</label>
          <input class="input" id="d-note" maxlength="30" placeholder="例如：兼职收入">
        </div>
      </div>
      <div class="card card--flat" style="margin-top:4px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
          <span style="color:var(--ink-soft)">当前进度</span>
          <b>${fmtMoney(p.total)} / ${fmtMoney(p.target)}　${fmtNumber(p.pct)}%</b>
        </div>
        ${progressHTML(p.pct)}
        <div class="field__hint" style="margin-top:8px">存入后，玻璃罐会变透明一点，梦想图片也会清晰一点。</div>
      </div>
    </form>`;

  openModal({
    title: `存入一笔 · ${dream.name}`,
    subtitle: "每一笔存款，都是向梦想更近一步",
    body,
    footer: `
      <button class="btn btn--ghost" type="button" data-action="close-modal">取消</button>
      <button class="btn btn--primary" type="button" id="deposit-submit">确认存入</button>`,
    onMount(root) {
      const input = root.querySelector("#d-amount");
      $$("[data-quick]", root).forEach((btn) => {
        btn.addEventListener("click", () => {
          amount = String(Number(btn.dataset.quick));
          input.value = amount;
          input.focus();
        });
      });
      const doSubmit = () => {
        const value = parseAmount(input.value);
        if (value <= 0) {
          toast("请输入大于 0 的金额", "warn");
          input.focus();
          return;
        }
        const before = dreamProgress(getDream(id)).pct;
        addDeposit(id, {
          amount: value,
          date: root.querySelector("#d-date").value || todayISO(),
          note: root.querySelector("#d-note").value.trim(),
        });
        const after = dreamProgress(getDream(id));
        closeModal();
        toast(`已存入 ${fmtMoney(value)}　完成度 ${fmtNumber(after.pct)}%`, "success", 2800);
        if (after.pct >= 100 && before < 100) {
          celebrate();
          setTimeout(() => openCompleteDialog(id), 700);
        }
      };
      root.querySelector("#deposit-submit").addEventListener("click", doSubmit);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          doSubmit();
        }
      });
    },
  });
}

/* ---------------- 完成梦想（写纪念档案） ---------------- */
export function openCompleteDialog(id) {
  const dream = getDream(id);
  if (!dream) return;
  const p = dreamProgress(dream);
  const archive = dream.archive || {};
  let finishImage = archive.finishImage || "";

  const body = `
    <form id="complete-form" novalidate>
      <p style="font-size:13px;color:var(--ink-soft);line-height:1.9;margin-bottom:16px">
        目标 ${fmtMoney(dream.target)}，已存 ${fmtMoney(p.total)}。上传一张实现梦想时的真实照片，写下当时的感受，它会被收进你的梦想收藏馆。
      </p>
      <div class="field">
        <label class="field__label">完成照片 <em>可选</em></label>
        <div data-uploader-slot>${uploaderHTML(finishImage, { hint: "例如：你站在目的地拍的那张照片" })}</div>
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field__label" for="c-date">完成日期</label>
          <input class="input" id="c-date" type="date" value="${archive.finishDate || todayISO()}">
        </div>
        <div class="field">
          <label class="field__label" for="c-amount">最终存入金额（元）</label>
          <input class="input" id="c-amount" inputmode="numeric" value="${archive.finalAmount ?? p.total}">
        </div>
      </div>
      <div class="field" style="margin-bottom:0">
        <label class="field__label" for="c-memory">我的留言</label>
        <textarea class="textarea" id="c-memory" maxlength="200"
                  placeholder="例如：我终于站到了这里，谢谢你一直没有放弃。">${escapeHtml(archive.memoryText || dream.completeMessage || "")}</textarea>
      </div>
    </form>`;

  openModal({
    title: "我做到了！",
    subtitle: `《${dream.name}》完成纪念`,
    body,
    footer: `
      <button class="btn btn--ghost" type="button" data-action="close-modal">稍后再说</button>
      <button class="btn btn--primary" type="button" id="complete-submit">收进梦想收藏馆</button>`,
    onMount(root) {
      const rebind = () => bindUploader(root, {
        onPick: (v) => {
          finishImage = v;
          $("[data-uploader-slot]", root).innerHTML = uploaderHTML(finishImage, { hint: "例如：你站在目的地拍的那张照片" });
          rebind();
        },
      });
      rebind();

      root.querySelector("#complete-submit").addEventListener("click", () => {
        completeDream(id, {
          finishImage: finishImage || dream.image,
          finishDate: root.querySelector("#c-date").value || todayISO(),
          finalAmount: parseAmount(root.querySelector("#c-amount").value),
          memoryText: root.querySelector("#c-memory").value.trim(),
        });
        closeModal();
        celebrate();
        toast("梦想已收进收藏馆 🎉", "success");
        location.hash = `#/archive/${id}`;
      });
    },
  });
}

/* ---------------- 卡片更多操作 ---------------- */
export function openDreamMenu(id) {
  const dream = getDream(id);
  if (!dream) return;
  const isCurrent = getCurrentDream()?.id === id;
  const p = dreamProgress(dream);
  const done = dream.status === "completed";

  const item = (action, label, { danger = false, meta = "" } = {}) => `
    <button class="row-item" type="button" data-menu-action="${action}"
            style="width:100%;text-align:left;${danger ? "color:#d1597f;" : ""}">
      <div class="row-item__body">
        <h4>${label}</h4>
        ${meta ? `<p>${meta}</p>` : ""}
      </div>
    </button>`;

  openModal({
    title: dream.name,
    subtitle: `${fmtMoney(p.total)} / ${fmtMoney(p.target)}　完成度 ${fmtNumber(p.pct)}%`,
    body: `
      <div class="row-list">
        ${item("open", "查看梦想详情", { meta: "打开储蓄罐、存钱记录与时间线" })}
        ${done
          ? item("archive", "查看梦想档案", { meta: "完成照片与当时的留言" })
          : item("deposit", "存入一笔", { meta: "立刻给梦想加一点进度" })}
        ${item("edit", "编辑梦想", { meta: "修改名称、图片、目标金额" })}
        ${done
          ? ""
          : item("current", isCurrent ? "正在首页展示" : "设为首页展示的梦想", { meta: "首页大罐子会展示这个梦想" })}
        ${done
          ? ""
          : item("complete", p.pct >= 100 ? "标记为已完成" : `提前标记完成（当前 ${fmtNumber(p.pct)}%）`, { meta: "生成梦想纪念档案" })}
        ${item("delete", "删除这个梦想", { meta: "同时删除它的存钱记录，无法恢复", danger: true })}
      </div>`,
    onMount(root) {
      $$("[data-menu-action]", root).forEach((btn) => {
        btn.addEventListener("click", async () => {
          const action = btn.dataset.menuAction;
          if (action === "delete") {
            const ok = await confirmDialog({
              title: "删除梦想",
              message: `确定要删除《${escapeHtml(dream.name)}》吗？它的 ${dream.deposits.length} 条存钱记录也会一起删除，且无法恢复。`,
              confirmText: "删除",
              danger: true,
            });
            if (!ok) return;
            deleteDream(id);
            toast("已删除", "info");
            location.hash = "#/dreams";
            return;
          }
          closeModal();
          if (action === "open") location.hash = `#/dream/${id}`;
          if (action === "archive") location.hash = `#/archive/${id}`;
          if (action === "deposit") openDepositDialog(id);
          if (action === "edit") openDreamForm(id);
          if (action === "complete") openCompleteDialog(id);
          if (action === "current") {
            setCurrentDream(id);
            toast("首页已切换到这个梦想", "success");
          }
        });
      });
    },
  });
}
