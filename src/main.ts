import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open, save, confirm } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { marked } from "marked";
import Prism from "prismjs";

// 下部中央のコマンドドック(独立パッケージ command-dock)。
// 副作用 import で <command-dock> をカスタム要素として登録する。型としてしか
// 使わないと本番ビルドで tree-shake され登録が消えるため、登録は必ず副作用 import で行う。
import "command-dock";
import type { CommandDock, DockItem } from "command-dock";

// Prism の主要な言語ハイライト定義を読み込む
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markdown";

// ==========================================
// 状態管理用変数 ＆ タブ定義
// ==========================================
interface Tab {
  id: string;
  filePath: string | null;
  title: string;
  content: string;
  isDirty: boolean;
  editorScrollTop: number;
  previewScrollTop: number;
  collapsedTOCHeadings: Set<string>;
  collapsedPreviewHeadings: Set<string>;
}

let tabs: Tab[] = [];
let activeTabId: string | null = null;

let currentFilePath: string | null = null;
let isDirty = false;
let isAutosaveEnabled = true;
let autoSaveTimeout: number | undefined;

// 折り畳み状態管理用のSet (階層パス level:見出し名 をキーにする)
const collapsedTOCHeadings = new Set<string>();
const collapsedPreviewHeadings = new Set<string>();

// ダイアログのプロミス解決用リゾルバ
let closeDialogResolve: ((value: "save" | "discard" | "cancel") => void) | null = null;

// DOM 要素への参照
let editorEl: HTMLTextAreaElement;
let previewEl: HTMLElement;
let previewPaneEl: HTMLElement;
let editorPaneEl: HTMLElement;
let fileTitleEl: HTMLElement | null = null;
let dirtyIndicatorEl: HTMLElement | null = null;
let filepathDisplayEl: HTMLElement;
let charCountEl: HTMLElement;
let wordCountEl: HTMLElement;
let readTimeEl: HTMLElement;
let autosaveStatusEl: HTMLElement;
let activeThemeEl: HTMLElement;
let outlineSidebarEl: HTMLElement;
let outlineListEl: HTMLElement;
let workspaceEl: HTMLElement;
let btnFloatingOutlineEl: HTMLElement;
let btnCloseSidebarEl: HTMLElement;
let btnCloseSidebarBottomEl: HTMLElement;

// コンテンツエリア(エディタ+プレビュー)の表示倍率。Ctrl+ホイールで変更する。
let contentZoom = 1;
let contentZoomEl: HTMLElement;

// コマンドドック本体と、その popup の active 表示を駆動する現在状態。
let commandDock: CommandDock | null = null;
let currentViewMode: ViewMode = "editor";
let currentWidth: "standard" | "wide" | "full" = "standard";
let currentTheme = "theme-light";

// ==========================================
// Markdown レンダリング ＆ 統計情報更新
// ==========================================
async function renderMarkdown() {
  let markdownText = editorEl.value;
  // BOM (Byte Order Mark) を除去
  if (markdownText.startsWith("\uFEFF")) {
    markdownText = markdownText.slice(1);
  }
  // marked で HTML を生成
  const htmlContent = await marked.parse(markdownText);
  previewEl.innerHTML = htmlContent;

  // HTMLを階層構造に再構築 (折り畳み機能のため)
  restructurePreviewDOM();

  // PrismJS を用いてコードブロックをシンタックスハイライト
  Prism.highlightAllUnder(previewEl);

  // 目次（アウトライン）の更新
  updateOutline();
}

function restructurePreviewDOM() {
  const container = previewEl;
  const children = Array.from(container.childNodes);
  container.innerHTML = "";

  // 階層を管理するためのスタック
  // ルート要素（レベル0）から開始
  const rootWrapper = document.createElement("div");
  rootWrapper.className = "markdown-section-wrapper level-0";
  const rootContent = document.createElement("div");
  rootContent.className = "section-content";
  rootWrapper.appendChild(rootContent);

  interface StackItem {
    wrapper: HTMLElement;
    content: HTMLElement;
    level: number;
    title: string;
    path: string;
  }

  const stack: StackItem[] = [
    {
      wrapper: rootWrapper,
      content: rootContent,
      level: 0,
      title: "root",
      path: ""
    }
  ];

  children.forEach((child) => {
    if (child.nodeType !== Node.ELEMENT_NODE) {
      stack[stack.length - 1].content.appendChild(child);
      return;
    }

    const el = child as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    const isHeading = /^h[1-6]$/.test(tagName);

    if (isHeading) {
      const level = parseInt(tagName.substring(1), 10);
      const title = el.textContent?.trim() || "";

      // 現在のヘッダーレベルと同等以上の親をスタックからポップ
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      const parentItem = stack[stack.length - 1];
      const parentPath = parentItem.path;
      const currentPath = parentPath ? `${parentPath} > ${level}:${title}` : `${level}:${title}`;

      // 新しいラッパーとコンテンツエリアの作成
      const wrapper = document.createElement("div");
      wrapper.className = `markdown-section-wrapper level-${level}`;
      wrapper.dataset.path = currentPath;
      wrapper.dataset.level = level.toString();

      const content = document.createElement("div");
      content.className = "section-content";

      // ヘッダーに折り畳み用クラスを追加
      el.classList.add("collapsible-header");

      // 折り畳み用の矢印（アイコン）をヘッダーの先頭に追加
      const chevron = document.createElement("span");
      chevron.className = "fold-chevron";
      chevron.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      el.insertBefore(chevron, el.firstChild);

      // コラップ状態の復元
      if (collapsedPreviewHeadings.has(currentPath)) {
        wrapper.classList.add("collapsed");
      }

      // 要素を移動
      wrapper.appendChild(el);
      wrapper.appendChild(content);
      parentItem.content.appendChild(wrapper);

      // スタックに追加
      stack.push({
        wrapper,
        content,
        level,
        title,
        path: currentPath
      });

      // ヘッダーのクリックで折り畳みを切り替える
      el.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest("a")) return;

        // 折り畳み用矢印をクリックした場合は選択状態に関わらずトグルする
        const isChevron = (e.target as HTMLElement).closest(".fold-chevron") !== null;
        if (!isChevron) {
          // テキスト選択中、またはドラッグ選択動作を行った場合はトグルしない
          const selection = window.getSelection();
          if (selection && selection.toString().trim() !== "") {
            return;
          }
        }

        e.preventDefault();
        e.stopPropagation();
        togglePreviewHeadingCollapse(currentPath);
      });
    } else {
      // 通常の要素は現在のスタックトップのコンテンツに追加
      stack[stack.length - 1].content.appendChild(el);
    }
  });

  // コンテナに再構築したDOMを展開
  while (rootContent.firstChild) {
    container.appendChild(rootContent.firstChild);
  }
}

function togglePreviewHeadingCollapse(path: string) {
  if (collapsedPreviewHeadings.has(path)) {
    collapsedPreviewHeadings.delete(path);
  } else {
    collapsedPreviewHeadings.add(path);
  }

  // プレビュー領域の該当するラッパー要素のコラップ状態をトグル
  const previewWrapper = previewEl.querySelector(`.markdown-section-wrapper[data-path="${CSS.escape(path)}"]`);
  if (previewWrapper) {
    previewWrapper.classList.toggle("collapsed", collapsedPreviewHeadings.has(path));
  }
  syncGlobalsToActiveTabState();
}

function toggleTOCHeadingCollapse(path: string) {
  if (collapsedTOCHeadings.has(path)) {
    collapsedTOCHeadings.delete(path);
  } else {
    collapsedTOCHeadings.add(path);
  }
  updateOutline();
  syncGlobalsToActiveTabState();
}

function updateStats() {
  const text = editorEl.value;
  // 空白を除いた文字数
  const charCount = text.replace(/\s/g, "").length;
  // 単語数
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  // 読了目安 (一般的な読書速度: 1分間に約600文字として計算)
  const readTime = Math.ceil(charCount / 600);

  charCountEl.textContent = `${charCount} 文字`;
  wordCountEl.textContent = `${wordCount} 単語`;
  readTimeEl.textContent = `読了目安: ${readTime} 分`;
}

async function updateFileTitle() {
  const fileName = currentFilePath
    ? currentFilePath.split(/[/\\]/).pop() || "無題.md"
    : "無題.md";
  if (fileTitleEl) {
    fileTitleEl.textContent = fileName;
  }
  filepathDisplayEl.textContent = currentFilePath || "新規ファイル";

  // Tauriのウィンドウタイトルを更新 (MDFVE - <ファイル名> *)
  try {
    const appWindow = getCurrentWindow();
    const dirtySuffix = isDirty ? " *" : "";
    await appWindow.setTitle(`MDFVE - ${fileName}${dirtySuffix}`);
  } catch (e) {
    console.error("Failed to set window title:", e);
  }
}

function markAsDirty(dirty: boolean) {
  isDirty = dirty;
  if (dirty) {
    if (dirtyIndicatorEl) {
      dirtyIndicatorEl.classList.remove("hidden");
    }
    if (currentFilePath && isAutosaveEnabled) {
      updateAutoSaveStatus("saving");
    } else {
      updateAutoSaveStatus("dirty");
    }
  } else {
    if (dirtyIndicatorEl) {
      dirtyIndicatorEl.classList.add("hidden");
    }
    updateAutoSaveStatus(currentFilePath ? "saved" : "off");
  }
  // 未保存状態をウィンドウタイトルに即座に反映
  updateFileTitle();
}

function updateAutoSaveStatus(state: "off" | "saving" | "saved" | "dirty") {
  autosaveStatusEl.className = "status-indicator";
  
  if (!isAutosaveEnabled || !currentFilePath) {
    autosaveStatusEl.textContent = "自動保存: オフ";
    return;
  }

  switch (state) {
    case "saving":
      autosaveStatusEl.classList.add("saving");
      autosaveStatusEl.textContent = "自動保存: 保存中...";
      break;
    case "saved":
      autosaveStatusEl.classList.add("saved");
      autosaveStatusEl.textContent = "自動保存: 保存済み";
      break;
    case "dirty":
      autosaveStatusEl.classList.add("dirty");
      autosaveStatusEl.textContent = "自動保存: 未保存の変更あり";
      break;
  }
}

// ==========================================
// 動的目次 (TOC) 生成
// ==========================================
function updateOutline() {
  outlineListEl.innerHTML = "";
  
  // プレビューのラッパー要素からすべてのヘッダーエリアを取得
  const wrappers = previewEl.querySelectorAll(".markdown-section-wrapper");
  if (wrappers.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "outline-item";
    emptyMsg.style.color = "var(--text-secondary)";
    emptyMsg.style.fontStyle = "italic";
    emptyMsg.textContent = "見出しがありません";
    outlineListEl.appendChild(emptyMsg);
    return;
  }

  wrappers.forEach((wrapperNode, index) => {
    const wrapper = wrapperNode as HTMLElement;
    // level-0 (root) はスキップ
    if (wrapper.classList.contains("level-0")) return;

    const path = wrapper.dataset.path || "";
    const level = parseInt(wrapper.dataset.level || "1", 10);
    const header = wrapper.querySelector(".collapsible-header") as HTMLElement;
    if (!header) return;

    // ヘッダーテキストを取得 (シェブロンのテキストを除去)
    const headerTextNode = Array.from(header.childNodes)
      .find(node => node.nodeType === Node.TEXT_NODE);
    const title = headerTextNode ? headerTextNode.textContent?.trim() || "" : "";

    // ヘッダー要素にアンカー用のIDを付与 (スムーズスクロールのため)
    const id = `heading-${index}`;
    header.setAttribute("id", id);

    // 親のいずれかが目次で折り畳まれているかチェック
    let isHiddenByParent = false;
    const pathSegments = path.split(" > ");
    for (let i = 0; i < pathSegments.length - 1; i++) {
      const parentPath = pathSegments.slice(0, i + 1).join(" > ");
      if (collapsedTOCHeadings.has(parentPath)) {
        isHiddenByParent = true;
        break;
      }
    }

    if (isHiddenByParent) {
      // 親が折り畳まれている場合は目次項目を表示しない
      return;
    }

    // 子（サブ見出し）を持っているか確認
    const hasChildren = wrapper.querySelector(".markdown-section-wrapper") !== null;
    const isCollapsed = collapsedTOCHeadings.has(path);
    console.log(`[TOC Debug] Path: "${path}", Level: ${level}, HasChildren: ${hasChildren}`);

    // 目次項目のコンテナを作成
    const itemWrapper = document.createElement("div");
    itemWrapper.className = `outline-item-container h${level}`;
    if (isCollapsed) {
      itemWrapper.classList.add("collapsed");
    }

    // 折り畳みボタン
    const foldBtn = document.createElement("span");
    foldBtn.className = "outline-fold-btn";
    if (hasChildren) {
      foldBtn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      foldBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTOCHeadingCollapse(path);
      });
    } else {
      foldBtn.classList.add("empty");
      foldBtn.innerHTML = ``;
    }

    // リンク
    const link = document.createElement("a");
    link.className = `outline-item`;
    link.textContent = title;
    
    // スムーズスクロール
    link.addEventListener("click", (e) => {
      e.preventDefault();
      header.scrollIntoView({ behavior: "smooth" });
    });

    itemWrapper.appendChild(foldBtn);
    itemWrapper.appendChild(link);
    outlineListEl.appendChild(itemWrapper);
  });
}

// ==========================================
// ファイル入出力処理
// ==========================================
// ==========================================
// ファイル入出力 ＆ タブ操作処理
// ==========================================
async function saveFileContent(path: string) {
  const content = editorEl.value;
  await writeTextFile(path, content);
}

function getNextUntitledName(): string {
  let count = 1;
  while (true) {
    const name = count === 1 ? "無題.md" : `無題 ${count}.md`;
    if (!tabs.some(t => t.title === name)) {
      return name;
    }
    count++;
  }
}

function createTab(filePath: string | null = null, content: string = "", title: string | null = null): Tab {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  
  let tabTitle = title;
  if (!tabTitle) {
    if (filePath) {
      tabTitle = filePath.split(/[/\\]/).pop() || "無題.md";
    } else {
      tabTitle = getNextUntitledName();
    }
  }

  const tab: Tab = {
    id,
    filePath,
    title: tabTitle,
    content,
    isDirty: false,
    editorScrollTop: 0,
    previewScrollTop: 0,
    collapsedTOCHeadings: new Set<string>(),
    collapsedPreviewHeadings: new Set<string>()
  };

  tabs.push(tab);
  return tab;
}

function syncActiveTabStateToGlobals() {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (!activeTab) return;

  currentFilePath = activeTab.filePath;
  isDirty = activeTab.isDirty;
  editorEl.value = activeTab.content;

  collapsedTOCHeadings.clear();
  activeTab.collapsedTOCHeadings.forEach(h => collapsedTOCHeadings.add(h));

  collapsedPreviewHeadings.clear();
  activeTab.collapsedPreviewHeadings.forEach(h => collapsedPreviewHeadings.add(h));
}

function syncGlobalsToActiveTabState() {
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (!activeTab) return;

  activeTab.filePath = currentFilePath;
  activeTab.isDirty = isDirty;
  activeTab.content = editorEl.value;
  
  if (currentFilePath) {
    activeTab.title = currentFilePath.split(/[/\\]/).pop() || "無題.md";
  }

  activeTab.collapsedTOCHeadings = new Set(collapsedTOCHeadings);
  activeTab.collapsedPreviewHeadings = new Set(collapsedPreviewHeadings);
  activeTab.editorScrollTop = editorEl.scrollTop;
  activeTab.previewScrollTop = previewPaneEl.scrollTop;
}

function renderTabs() {
  const tabBar = document.getElementById("tab-bar");
  if (!tabBar) return;
  tabBar.innerHTML = "";

  tabs.forEach(tab => {
    const tabEl = document.createElement("div");
    tabEl.className = `tab${tab.id === activeTabId ? " active" : ""}${tab.isDirty ? " is-dirty" : ""}`;
    tabEl.dataset.tabId = tab.id;

    // タブタイトル
    const titleEl = document.createElement("span");
    titleEl.className = "tab-title";
    titleEl.textContent = tab.title;
    titleEl.title = tab.filePath || tab.title;
    tabEl.appendChild(titleEl);

    // 未保存時のドット
    const dirtyDot = document.createElement("span");
    dirtyDot.className = "tab-dirty-dot";
    tabEl.appendChild(dirtyDot);

    // 閉じるボタン
    const closeBtn = document.createElement("button");
    closeBtn.className = "tab-close-btn";
    closeBtn.title = "タブを閉じる";
    closeBtn.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleCloseTab(tab.id);
    });
    tabEl.appendChild(closeBtn);

    // クリックでタブ切り替え
    tabEl.addEventListener("click", () => {
      if (tab.id !== activeTabId) {
        switchTab(tab.id);
      }
    });

    tabBar.appendChild(tabEl);
  });

  // アクティブなファイルの有無が変わったので、再読込ボタン(R)の disabled を再評価。
  commandDock?.refresh();
}

async function switchTab(tabId: string) {
  if (tabId === activeTabId) return;

  // 1. 現在のタブの未保存オートセーブがあれば実行
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = undefined;
    if (currentFilePath && isDirty) {
      try {
        await saveFileContent(currentFilePath);
        markAsDirty(false);
      } catch (e) {
        console.error("Save on switch failed", e);
      }
    }
  }

  // 2. 現在のタブの状態を保存
  syncGlobalsToActiveTabState();

  // 3. アクティブタブIDの更新
  activeTabId = tabId;

  // 4. 新しいタブの状態をロード
  syncActiveTabStateToGlobals();

  // 5. 表示更新
  await renderMarkdown();
  updateStats();
  markAsDirty(isDirty);
  renderTabs();

  // 6. スクロール位置の復元 (レンダリング完了後)
  const targetTab = tabs.find(t => t.id === tabId);
  if (targetTab) {
    editorEl.scrollTop = targetTab.editorScrollTop;
    previewPaneEl.scrollTop = targetTab.previewScrollTop;
  }

  // エディタにフォーカス
  editorEl.focus();
}

function setupDialogEvents() {
  const btnSave = document.getElementById("btn-dialog-save")!;
  const btnDiscard = document.getElementById("btn-dialog-discard")!;
  const btnCancel = document.getElementById("btn-dialog-cancel")!;
  const overlay = document.getElementById("custom-dialog-overlay")!;

  btnSave.addEventListener("click", () => {
    if (closeDialogResolve) {
      closeDialogResolve("save");
      closeDialogResolve = null;
      overlay.classList.add("hidden");
    }
  });

  btnDiscard.addEventListener("click", () => {
    if (closeDialogResolve) {
      closeDialogResolve("discard");
      closeDialogResolve = null;
      overlay.classList.add("hidden");
    }
  });

  btnCancel.addEventListener("click", () => {
    if (closeDialogResolve) {
      closeDialogResolve("cancel");
      closeDialogResolve = null;
      overlay.classList.add("hidden");
    }
  });
}

function showCloseConfirmDialog(fileName: string): Promise<"save" | "discard" | "cancel"> {
  return new Promise((resolve) => {
    closeDialogResolve = resolve;
    const overlay = document.getElementById("custom-dialog-overlay")!;
    const messageEl = document.getElementById("dialog-message")!;
    messageEl.textContent = `「${fileName}」への変更内容を保存しますか？\n保存しない場合、変更は失われます。`;
    overlay.classList.remove("hidden");
  });
}

async function handleCloseTab(tabId: string) {
  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex === -1) return;

  const tab = tabs[tabIndex];

  if (tabId === activeTabId) {
    syncGlobalsToActiveTabState();
  }

  if (tab.isDirty) {
    const choice = await showCloseConfirmDialog(tab.title);
    if (choice === "cancel") {
      return;
    } else if (choice === "save") {
      if (tab.filePath) {
        try {
          await writeTextFile(tab.filePath, tab.content);
          tab.isDirty = false;
        } catch (e) {
          console.error("Failed to save file before closing", e);
          return;
        }
      } else {
        const prevActiveId = activeTabId;
        await switchTab(tabId);
        await handleSaveAsFile();
        
        syncGlobalsToActiveTabState();
        if (tab.isDirty) {
          if (prevActiveId && prevActiveId !== tabId) {
            await switchTab(prevActiveId);
          }
          return;
        }
      }
    }
  }

  if (tabId === activeTabId && autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = undefined;
  }

  tabs.splice(tabIndex, 1);

  if (tabs.length === 0) {
    const newTab = createTab();
    activeTabId = newTab.id;
    syncActiveTabStateToGlobals();
    await renderMarkdown();
    updateStats();
    markAsDirty(false);
  } else {
    if (tabId === activeTabId) {
      const newActiveIndex = Math.min(tabIndex, tabs.length - 1);
      const newActiveTab = tabs[newActiveIndex];
      activeTabId = newActiveTab.id;
      syncActiveTabStateToGlobals();
      await renderMarkdown();
      updateStats();
      markAsDirty(isDirty);
      
      editorEl.scrollTop = newActiveTab.editorScrollTop;
      previewPaneEl.scrollTop = newActiveTab.previewScrollTop;
    }
  }

  renderTabs();
}

async function handleNewFile() {
  const newTab = createTab();
  await switchTab(newTab.id);
  // 新規ファイルは空なのでエディタのみ表示
  setViewMode("editor");
}

// 指定パスのファイルをタブで開く (外部起動: emacs 連携などから利用)
// 既に開いているファイルは内容を再読込してそのタブへ切り替える。
// preloadedContent が渡された場合はそれを使う (Rust 側で読込済み)。
async function openFilePath(path: string, preloadedContent?: string) {
  let content = preloadedContent !== undefined
    ? preloadedContent
    : await readTextFile(path);
  if (content.startsWith("﻿")) {
    content = content.slice(1);
  }

  // 内容があるファイルはプレビューのみ、空ファイルはエディタのみ表示
  const targetMode: ViewMode = content.trim() !== "" ? "preview" : "editor";

  const existingTab = tabs.find(t => t.filePath === path);
  if (existingTab) {
    existingTab.content = content;
    existingTab.isDirty = false;
    if (existingTab.id === activeTabId) {
      editorEl.value = content;
      await renderMarkdown();
      updateStats();
      markAsDirty(false);
      syncGlobalsToActiveTabState();
    }
    await switchTab(existingTab.id);
    renderTabs();
    setViewMode(targetMode);
    return;
  }

  // 空の初期タブがあれば再利用、なければ新規タブ
  const activeTab = tabs.find(t => t.id === activeTabId);
  if (activeTab && tabs.length === 1 && !activeTab.filePath && !activeTab.isDirty && activeTab.content === "") {
    activeTab.filePath = path;
    activeTab.title = path.split(/[/\\]/).pop() || "無題.md";
    activeTab.content = content;
    activeTab.isDirty = false;

    syncActiveTabStateToGlobals();
    await renderMarkdown();
    updateStats();
    markAsDirty(false);
    renderTabs();
  } else {
    const newTab = createTab(path, content);
    await switchTab(newTab.id);
  }

  setViewMode(targetMode);
}

// アクティブなファイルをディスクから再読み込みして再描画する(ActionDockItem 用)。
// 未保存の変更があれば破棄確認する。新規/未保存ファイルは対象外。
async function handleReloadFile() {
  if (!currentFilePath) return;

  if (isDirty) {
    const ok = await confirm(
      "未保存の変更があります。破棄してディスクから再読み込みしますか?",
      { title: "再読み込み", kind: "warning" },
    );
    if (!ok) return;
  }

  let content = await readTextFile(currentFilePath);
  if (content.startsWith("﻿")) {
    content = content.slice(1);
  }

  editorEl.value = content;
  await renderMarkdown();
  updateStats();
  markAsDirty(false);
  syncGlobalsToActiveTabState();
  renderTabs();
}

async function handleOpenFile() {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Markdown",
          extensions: ["md", "markdown", "txt"]
        }
      ]
    });

    if (selected && typeof selected === "string") {
      const existingTab = tabs.find(t => t.filePath === selected);
      if (existingTab) {
        await switchTab(existingTab.id);
        return;
      }

      let content = await readTextFile(selected);
      if (content.startsWith("\uFEFF")) {
        content = content.slice(1);
      }

      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab && tabs.length === 1 && !activeTab.filePath && !activeTab.isDirty && activeTab.content === "") {
        activeTab.filePath = selected;
        activeTab.title = selected.split(/[/\\]/).pop() || "無題.md";
        activeTab.content = content;
        activeTab.isDirty = false;
        
        syncActiveTabStateToGlobals();
        await renderMarkdown();
        updateStats();
        markAsDirty(false);
        renderTabs();
      } else {
        const newTab = createTab(selected, content);
        await switchTab(newTab.id);
      }
    }
  } catch (e) {
    console.error("Failed to open file", e);
  }
}

async function handleSaveFile() {
  if (!currentFilePath) {
    await handleSaveAsFile();
    return;
  }

  try {
    await saveFileContent(currentFilePath);
    markAsDirty(false);
    
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
      activeTab.isDirty = false;
      activeTab.title = currentFilePath.split(/[/\\]/).pop() || "無題.md";
      activeTab.filePath = currentFilePath;
      activeTab.content = editorEl.value;
    }
    renderTabs();
  } catch (e) {
    console.error("Failed to save file", e);
  }
}

async function handleSaveAsFile() {
  try {
    const path = await save({
      filters: [
        {
          name: "Markdown",
          extensions: ["md"]
        }
      ],
      defaultPath: currentFilePath || "無題.md"
    });

    if (path) {
      currentFilePath = path;
      await saveFileContent(path);
      markAsDirty(false);
      
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab) {
        activeTab.filePath = path;
        activeTab.title = path.split(/[/\\]/).pop() || "無題.md";
        activeTab.isDirty = false;
        activeTab.content = editorEl.value;
      }
      
      updateFileTitle();
      renderTabs();
    }
  } catch (e) {
    console.error("Failed to save as file", e);
  }
}

// ==========================================
// 同期スクロールロジック
// ==========================================
let isScrollingEditor = false;
let isScrollingPreview = false;

function setupSyncScroll() {
  editorEl.addEventListener("scroll", () => {
    if (isScrollingPreview) {
      isScrollingPreview = false;
      return;
    }
    isScrollingEditor = true;
    
    // スクロール比率を計算
    const scrollRange = editorEl.scrollHeight - editorEl.clientHeight;
    if (scrollRange > 0) {
      const percentage = editorEl.scrollTop / scrollRange;
      const previewScrollRange = previewPaneEl.scrollHeight - previewPaneEl.clientHeight;
      previewPaneEl.scrollTop = percentage * previewScrollRange;
    }
  });

  previewPaneEl.addEventListener("scroll", () => {
    if (isScrollingEditor) {
      isScrollingEditor = false;
      return;
    }
    isScrollingPreview = true;
    
    // スクロール比率を計算
    const scrollRange = previewPaneEl.scrollHeight - previewPaneEl.clientHeight;
    if (scrollRange > 0) {
      const percentage = previewPaneEl.scrollTop / scrollRange;
      const editorScrollRange = editorEl.scrollHeight - editorEl.clientHeight;
      editorEl.scrollTop = percentage * editorScrollRange;
    }
  });
}

// ==========================================
// 表示モード切替 (エディタ / 分割 / プレビュー)
// ==========================================
type ViewMode = "editor" | "split" | "preview";

function setViewMode(mode: ViewMode) {
  currentViewMode = mode;
  workspaceEl.classList.remove("mode-editor", "mode-preview");

  if (mode === "editor") {
    workspaceEl.classList.add("mode-editor");
  } else if (mode === "preview") {
    workspaceEl.classList.add("mode-preview");
  }
  // split モードは workspace クラスなし

  // ドックの popup を開いていれば active 表示を更新
  commandDock?.refresh();
}

// ==========================================
// コンテンツエリアの表示倍率 (Ctrl+ホイール / Ctrl+0)
// ==========================================
// px 指定の見出し・コード等も一様に拡縮するため、font-size ではなく
// CSS の zoom をエディタ/プレビューに適用する(ブラウザズームと同じ感覚)。
function setContentZoom(zoom: number) {
  contentZoom = Math.min(3, Math.max(0.5, Math.round(zoom * 10) / 10));
  editorEl.style.setProperty("zoom", String(contentZoom));
  previewEl.style.setProperty("zoom", String(contentZoom));
  contentZoomEl.textContent = `${Math.round(contentZoom * 100)}%`;
}

// ==========================================
// イベントハンドラ ＆ UI 初期化
// ==========================================
function setupUI() {
  // ====== 下部中央のコマンドドック (F/V/W/T) ======
  // 開閉/外クリック/自動クローズの挙動は <command-dock> が内蔵する。
  // ここでは中身(項目・ハンドラ)を宣言的に渡すだけ。

  // 表示幅 (W) の適用
  const setPreviewWidth = (width: "standard" | "wide" | "full") => {
    currentWidth = width;
    previewEl.classList.remove("wide-preview", "full-preview");
    if (width === "wide") previewEl.classList.add("wide-preview");
    else if (width === "full") previewEl.classList.add("full-preview");
    commandDock?.refresh();
  };

  // テーマ (T) の適用
  const applyTheme = (themeClass: string, label: string) => {
    currentTheme = themeClass;
    const host = workspaceEl.parentElement;
    Array.from(host?.classList || []).forEach((c) => {
      if (c.startsWith("theme-")) host?.classList.remove(c);
    });
    host?.classList.add(themeClass);
    activeThemeEl.textContent = label;
    commandDock?.refresh();
  };

  // テーマ色プレビューの丸アイコン (Shadow DOM 内なのでインラインスタイルで渡す)
  const swatch = (bg: string, border?: string) =>
    `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;` +
    `background:${bg};border:1px solid ${border ?? "var(--dock-border,var(--border-color,#e5e7eb))"};"></span>`;

  // ファイル操作アイコン (元 index.html の SVG)
  const icoNew = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`;
  const icoOpen = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
  const icoSave = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;
  const icoSaveAs = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>`;
  // 再読み込みアイコン(refresh-cw)。ボタン面が 44px なので 18px。currentColor でテーマ/hover 追従。
  const icoReload = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;
  // ドックのトリガー面アイコン(feather 系, 18px, currentColor でテーマ/hover 追従)
  const icoDockFile = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
  const icoDockView = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const icoDockWidth = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 8 22 12 18 16"/><polyline points="6 8 2 12 6 16"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`;
  const icoDockTheme = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;

  const dockItems: DockItem[] = [
    {
      // 即アクション型: クリックでアクティブな .md をディスクから再読込 + 再描画。
      // onClick が Promise を返すので、読み込み中は自動で disabled + busy 表示になる。
      id: "reload",
      label: icoReload,
      title: "再読み込み (ディスクから)",
      onClick: () => handleReloadFile(),
      disabled: () => !currentFilePath,
    },
    {
      id: "file",
      label: icoDockFile,
      title: "ファイル操作 (F)",
      popup: [
        { icon: icoNew, label: "新規作成 (Ctrl+N)", onSelect: () => handleNewFile() },
        { icon: icoOpen, label: "ファイルを開く (Ctrl+O)", onSelect: () => handleOpenFile() },
        { icon: icoSave, label: "上書き保存 (Ctrl+S)", onSelect: () => handleSaveFile() },
        { icon: icoSaveAs, label: "別名で保存", title: "別名で保存 (Ctrl+Shift+S)", onSelect: () => handleSaveAsFile() },
      ],
    },
    {
      id: "view",
      label: icoDockView,
      title: "表示設定 (V)",
      popup: {
        section: "表示モード",
        items: [
          { label: "エディタ", title: "エディタのみ", active: () => currentViewMode === "editor", onSelect: () => setViewMode("editor") },
          { label: "分割表示", active: () => currentViewMode === "split", onSelect: () => setViewMode("split") },
          { label: "プレビュー表示", title: "プレビューのみ", active: () => currentViewMode === "preview", onSelect: () => setViewMode("preview") },
        ],
      },
    },
    {
      id: "width",
      label: icoDockWidth,
      title: "表示幅設定 (W)",
      popup: {
        section: "プレビュー幅",
        items: [
          { label: "標準幅", title: "標準幅 (800px)", active: () => currentWidth === "standard", onSelect: () => setPreviewWidth("standard") },
          { label: "広い幅", title: "広い幅 (1200px)", active: () => currentWidth === "wide", onSelect: () => setPreviewWidth("wide") },
          { label: "フル幅", title: "フル幅 (100%)", active: () => currentWidth === "full", onSelect: () => setPreviewWidth("full") },
        ],
      },
    },
    {
      id: "theme",
      label: icoDockTheme,
      title: "テーマ設定 (T)",
      popup: [
        { icon: swatch("#ffffff"), label: "ライトテーマ", active: () => currentTheme === "theme-light", onSelect: () => applyTheme("theme-light", "ライトテーマ") },
        { icon: swatch("#1a1a1e"), label: "ダークテーマ", active: () => currentTheme === "theme-dark", onSelect: () => applyTheme("theme-dark", "ダークテーマ") },
        { icon: swatch("#fbf0d9"), label: "セピアテーマ", active: () => currentTheme === "theme-sepia", onSelect: () => applyTheme("theme-sepia", "セピアテーマ") },
        { icon: swatch("#171821", "#ff007f"), label: "サイバーパンク", active: () => currentTheme === "theme-cyberpunk", onSelect: () => applyTheme("theme-cyberpunk", "サイバーパンク") },
      ],
    },
  ];

  commandDock = document.getElementById("command-dock") as CommandDock;
  commandDock.items = dockItems;

  // タブ追加ボタン & ダイアログ
  document.getElementById("btn-add-tab")?.addEventListener("click", handleNewFile);
  setupDialogEvents();

  // 目次の表示/非表示
  const setOutlineVisibility = (visible: boolean) => {
    if (visible) {
      outlineSidebarEl.classList.remove("hidden");
      btnFloatingOutlineEl.classList.add("hidden");
    } else {
      outlineSidebarEl.classList.add("hidden");
      btnFloatingOutlineEl.classList.remove("hidden");
    }
  };

  btnFloatingOutlineEl.addEventListener("click", () => {
    setOutlineVisibility(true);
  });

  btnCloseSidebarEl.addEventListener("click", () => {
    setOutlineVisibility(false);
  });

  btnCloseSidebarBottomEl.addEventListener("click", () => {
    setOutlineVisibility(false);
  });

  // 初期状態の適用 (エディタ表示 / 標準幅 / ライトテーマ)
  setViewMode("editor");
  setPreviewWidth("standard");
  applyTheme("theme-light", "ライトテーマ");

  // Ctrl+ホイールでコンテンツエリアの表示倍率を変更(素のホイールはスクロールのまま)。
  // preventDefault で WebView2 既定のページズームを抑止するため passive:false。
  const onZoomWheel = (e: WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setContentZoom(contentZoom + (e.deltaY < 0 ? 0.1 : -0.1));
  };
  editorPaneEl.addEventListener("wheel", onZoomWheel, { passive: false });
  previewPaneEl.addEventListener("wheel", onZoomWheel, { passive: false });

  // ドラッグリサイズバーの実装
  const dragBar = document.getElementById("drag-bar")!;
  dragBar.addEventListener("mousedown", (e) => {
    e.preventDefault();
    dragBar.classList.add("dragging");

    const doDrag = (moveEvent: MouseEvent) => {
      const workspaceRect = workspaceEl.getBoundingClientRect();
      const sidebarWidth = outlineSidebarEl.classList.contains("hidden") ? 0 : 260;
      
      const relativeX = moveEvent.clientX - workspaceRect.left - sidebarWidth;
      const totalWidth = workspaceRect.width - sidebarWidth - 6; // 6px はドラッグバー幅
      
      if (totalWidth > 0) {
        let percentage = (relativeX / totalWidth) * 100;
        // 限界値を設定
        if (percentage < 15) percentage = 15;
        if (percentage > 85) percentage = 85;

        editorPaneEl.style.flex = "none";
        editorPaneEl.style.width = `${percentage}%`;
      }
    };

    const stopDrag = () => {
      dragBar.classList.remove("dragging");
      window.removeEventListener("mousemove", doDrag);
      window.removeEventListener("mouseup", stopDrag);
    };

    window.addEventListener("mousemove", doDrag);
    window.addEventListener("mouseup", stopDrag);
  });

  // キーボードショートカット
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
      e.preventDefault();
      handleNewFile();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
      e.preventDefault();
      handleOpenFile();
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSaveAsFile();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSaveFile();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
      // コンテンツエリアの表示倍率をリセット
      e.preventDefault();
      setContentZoom(1);
    }
  });

  // テキストエリア入力イベント (自動保存タイマー始動、Markdownレンダリング)
  editorEl.addEventListener("input", () => {
    markAsDirty(true);
    updateStats();
    renderMarkdown();

    // タブの状態も更新
    syncGlobalsToActiveTabState();
    renderTabs();

    // 自動保存処理
    if (currentFilePath && isAutosaveEnabled) {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(async () => {
        try {
          await saveFileContent(currentFilePath!);
          markAsDirty(false);
          syncGlobalsToActiveTabState();
          renderTabs();
        } catch (e) {
          console.error("Auto-save failed", e);
          updateAutoSaveStatus("dirty");
        }
      }, 1500) as unknown as number;
    }
  });
}

// アプリケーションロード時の初期処理
window.addEventListener("DOMContentLoaded", async () => {
  // DOM の関連付け
  editorEl = document.getElementById("editor") as HTMLTextAreaElement;
  previewEl = document.getElementById("preview")!;
  previewPaneEl = document.getElementById("preview-pane")!;
  editorPaneEl = document.getElementById("editor-pane")!;
  fileTitleEl = document.getElementById("file-title");
  dirtyIndicatorEl = document.getElementById("dirty-indicator");
  filepathDisplayEl = document.getElementById("filepath-display")!;
  charCountEl = document.getElementById("char-count")!;
  wordCountEl = document.getElementById("word-count")!;
  readTimeEl = document.getElementById("read-time")!;
  autosaveStatusEl = document.getElementById("autosave-status")!;
  activeThemeEl = document.getElementById("active-theme")!;
  contentZoomEl = document.getElementById("content-zoom")!;
  outlineSidebarEl = document.getElementById("outline-sidebar")!;
  outlineListEl = document.getElementById("outline-list")!;
  workspaceEl = document.querySelector(".workspace")!;
  btnFloatingOutlineEl = document.getElementById("btn-floating-outline")!;
  btnCloseSidebarEl = document.getElementById("btn-close-sidebar")!;
  btnCloseSidebarBottomEl = document.getElementById("btn-close-sidebar-bottom")!;

  // UI セットアップ
  setupUI();
  setupSyncScroll();

  // 初期タブを作成
  const initialTab = createTab();
  activeTabId = initialTab.id;
  syncActiveTabStateToGlobals();

  // 初期プレビュー描画と文字数計算
  await renderMarkdown();
  updateStats();
  updateFileTitle();
  renderTabs();

  // 外部起動 (emacs 連携など) でファイルパスが渡された場合に開く
  // パスと内容は Rust 側で読み込んで渡される (JS の fs スコープに依存しない)
  interface OpenedFile { path: string; content: string; }

  // 1. 初回起動: コマンドライン引数のファイル
  try {
    const startupFile = await invoke<OpenedFile | null>("get_startup_file");
    if (startupFile) {
      await openFilePath(startupFile.path, startupFile.content);
    }
  } catch (e) {
    console.error("Failed to open startup file", e);
  }

  // 2. 2回目以降の起動: single-instance 経由で届くファイルを新規タブで開く
  await listen<OpenedFile>("open-file", async (event) => {
    if (event.payload && event.payload.path) {
      try {
        await openFilePath(event.payload.path, event.payload.content);
        const appWindow = getCurrentWindow();
        await appWindow.unminimize();
        await appWindow.setFocus();
      } catch (e) {
        console.error("Failed to open forwarded file", e);
      }
    }
  });
});
