import { marked } from "marked";
import Prism from "prismjs";
import { viewerStyles } from "./styles/viewer.js";
import type { Heading, MarkdownParser, Sanitizer } from "./types.js";

const CHEVRON_SVG =
  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
  `stroke-width="3" stroke-linecap="round" stroke-linejoin="round">` +
  `<polyline points="9 18 15 12 9 6"></polyline></svg>`;

/** Byte Order Mark。先頭にあると marked がそのまま本文として扱ってしまう。 */
const BOM = "﻿";

/** 見出しタグから階層を組み直す際のスタック要素。 */
interface StackItem {
  content: HTMLElement;
  level: number;
  path: string;
}

/**
 * `<markdown-viewer>` — Markdown を描画する表示専用コンポーネント。
 *
 * marked で HTML 化し、見出しごとに折り畳み可能な階層 DOM へ組み直し、
 * Prism でコードブロックを着色する。目次は UI を持たず、`headings` と
 * `outlinechange` イベントでデータのみ公開する — 目次の見た目は
 * アプリ側の責務。
 *
 * @fires outlinechange - 描画完了で発火。`detail.headings` に Heading[]。
 * @fires foldchange    - 見出しの折り畳み切替で発火。`detail.path` / `detail.collapsed`。
 */
export class MarkdownViewer extends HTMLElement {
  static get observedAttributes() {
    return ["foldable"];
  }

  private root: ShadowRoot;
  private bodyEl: HTMLElement;
  private _markdown = "";
  private _headings: Heading[] = [];
  /** 折り畳み中の見出しパス。再描画をまたいで状態を保つ。 */
  private collapsed = new Set<string>();
  /** 描画の世代番号。非同期 parse の追い越し結果を捨てるために使う。 */
  private generation = 0;

  /** Markdown → HTML の変換器。差し替え可能。既定は marked。 */
  parser: MarkdownParser = (md) => marked.parse(md) as string | Promise<string>;

  /**
   * 生成した HTML を挿入前に通すフック。既定は素通し。
   *
   * marked は既定で生 HTML を通すため、信頼できない Markdown を描画する
   * 場合は DOMPurify 等をここに挿すこと。
   */
  sanitize: Sanitizer = (html) => html;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = viewerStyles;
    this.bodyEl = document.createElement("div");
    this.bodyEl.className = "body";
    this.root.append(style, this.bodyEl);
  }

  connectedCallback() {
    if (!this.hasAttribute("foldable")) this.setAttribute("foldable", "");
    void this.render();
  }

  attributeChangedCallback(name: string) {
    if (name === "foldable" && this.isConnected) void this.render();
  }

  /** 表示する Markdown 本文。代入すると再描画する。 */
  set markdown(value: string) {
    const next = value ?? "";
    if (next === this._markdown) return;
    this._markdown = next;
    if (this.isConnected) void this.render();
  }
  get markdown(): string {
    return this._markdown;
  }

  /** 見出しの折り畳みを有効にするか。属性 `foldable` と連動。 */
  set foldable(value: boolean) {
    this.toggleAttribute("foldable", value);
  }
  get foldable(): boolean {
    return this.hasAttribute("foldable");
  }

  /** 直近の描画で得た見出し一覧。目次 UI はこれを読む。 */
  get headings(): readonly Heading[] {
    return this._headings;
  }

  /** 折り畳み中の見出しパス。タブ復元などで保存/復元する用。 */
  get collapsedPaths(): string[] {
    return [...this.collapsed];
  }
  set collapsedPaths(paths: string[]) {
    this.collapsed = new Set(paths ?? []);
    // 折り畳みは表示状態でしかないので、再パースはせず既存 DOM に反映する。
    for (const wrapper of this.bodyEl.querySelectorAll<HTMLElement>(".section-wrapper")) {
      wrapper.classList.toggle("collapsed", this.collapsed.has(wrapper.dataset.path || ""));
    }
    this.syncHeadingState();
    this.emitOutline();
  }

  /** 見出しの折り畳みを切り替える。目次からの操作もこれを呼ぶ。 */
  toggleFold(path: string) {
    const nowCollapsed = !this.collapsed.has(path);
    if (nowCollapsed) this.collapsed.add(path);
    else this.collapsed.delete(path);

    const wrapper = this.bodyEl.querySelector<HTMLElement>(
      `.section-wrapper[data-path="${CSS.escape(path)}"]`
    );
    wrapper?.classList.toggle("collapsed", nowCollapsed);

    this.syncHeadingState();
    this.dispatchEvent(
      new CustomEvent("foldchange", { detail: { path, collapsed: nowCollapsed } })
    );
    this.emitOutline();
  }

  /** 指定パスの見出しまでスクロールする。目次クリック用。 */
  scrollToHeading(path: string, behavior: ScrollBehavior = "smooth") {
    const wrapper = this.bodyEl.querySelector<HTMLElement>(
      `.section-wrapper[data-path="${CSS.escape(path)}"]`
    );
    wrapper?.querySelector(".collapsible-header")?.scrollIntoView({ behavior });
  }

  /** 0..1 の縦スクロール位置。workspace のスクロール同期が読み書きする。 */
  get scrollRatio(): number {
    const range = this.scrollHeight - this.clientHeight;
    return range > 0 ? this.scrollTop / range : 0;
  }
  set scrollRatio(ratio: number) {
    const range = this.scrollHeight - this.clientHeight;
    if (range > 0) this.scrollTop = ratio * range;
  }

  /** 本文を再描画する。markdown 代入時に自動で呼ばれる。 */
  async render() {
    const gen = ++this.generation;

    let text = this._markdown;
    if (text.startsWith(BOM)) text = text.slice(1);

    const html = this.sanitize(await this.parser(text));
    // await の間に新しい render が始まっていたら、この結果は捨てる。
    if (gen !== this.generation) return;

    this.bodyEl.innerHTML = html;
    this.restructure();
    Prism.highlightAllUnder(this.bodyEl);
    this.syncHeadingState();
    this.emitOutline();
  }

  /**
   * marked が吐いたフラットな HTML を、見出しを軸にした入れ子構造へ組み直す。
   * 各見出しは `.collapsible-header`、配下は `.section-content` に入り、
   * ラッパーの `collapsed` クラスだけで開閉できる形にする。
   */
  private restructure() {
    const children = Array.from(this.bodyEl.childNodes);
    this.bodyEl.innerHTML = "";

    const rootContent = document.createElement("div");
    const stack: StackItem[] = [{ content: rootContent, level: 0, path: "" }];
    const foldable = this.foldable;

    for (const child of children) {
      if (child.nodeType !== Node.ELEMENT_NODE) {
        stack[stack.length - 1].content.appendChild(child);
        continue;
      }

      const el = child as HTMLElement;
      const level = /^h([1-6])$/.exec(el.tagName.toLowerCase())?.[1];
      if (!level) {
        stack[stack.length - 1].content.appendChild(el);
        continue;
      }

      const lv = parseInt(level, 10);
      const title = el.textContent?.trim() || "";

      // 同レベル以上の見出しはここで閉じる。
      while (stack.length > 1 && stack[stack.length - 1].level >= lv) stack.pop();

      const parent = stack[stack.length - 1];
      const path = parent.path ? `${parent.path} > ${lv}:${title}` : `${lv}:${title}`;

      const wrapper = document.createElement("div");
      wrapper.className = `section-wrapper level-${lv}`;
      wrapper.dataset.path = path;
      wrapper.dataset.level = String(lv);
      if (this.collapsed.has(path)) wrapper.classList.add("collapsed");

      const content = document.createElement("div");
      content.className = "section-content";

      el.classList.add("collapsible-header");
      const chevron = document.createElement("span");
      chevron.className = "fold-chevron";
      chevron.innerHTML = CHEVRON_SVG;
      el.insertBefore(chevron, el.firstChild);

      if (foldable) el.addEventListener("click", (e) => this.onHeaderClick(e, path));

      wrapper.append(el, content);
      parent.content.appendChild(wrapper);
      stack.push({ content, level: lv, path });
    }

    while (rootContent.firstChild) this.bodyEl.appendChild(rootContent.firstChild);
  }

  /** 見出しクリックの扱い。リンクとテキスト選択を折り畳みより優先する。 */
  private onHeaderClick(e: MouseEvent, path: string) {
    const target = e.target as HTMLElement;
    if (target.closest("a")) return;

    // シェブロン以外をクリックしたときは、テキスト選択中ならトグルしない。
    if (!target.closest(".fold-chevron")) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== "") return;
    }

    e.preventDefault();
    e.stopPropagation();
    this.toggleFold(path);
  }

  /** DOM から見出しデータを組み直す。 */
  private syncHeadingState() {
    this._headings = Array.from(
      this.bodyEl.querySelectorAll<HTMLElement>(".section-wrapper")
    ).map((wrapper) => {
      const path = wrapper.dataset.path || "";
      const header = wrapper.querySelector(".collapsible-header");
      // シェブロンを除いた見出しテキストだけを拾う。
      const title = Array.from(header?.childNodes ?? [])
        .filter(
          (n) =>
            n.nodeType !== Node.ELEMENT_NODE ||
            !(n as HTMLElement).classList.contains("fold-chevron")
        )
        .map((n) => n.textContent ?? "")
        .join("")
        .trim();
      return {
        path,
        level: parseInt(wrapper.dataset.level || "1", 10),
        title,
        hasChildren: wrapper.querySelector(".section-wrapper") !== null,
        collapsed: this.collapsed.has(path),
      } satisfies Heading;
    });
  }

  private emitOutline() {
    this.dispatchEvent(
      new CustomEvent("outlinechange", { detail: { headings: this._headings } })
    );
  }
}

if (!customElements.get("markdown-viewer")) {
  customElements.define("markdown-viewer", MarkdownViewer);
}
