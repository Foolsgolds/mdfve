import { workspaceStyles } from "./styles/workspace.js";
import "./markdown-editor.js";
import "./markdown-viewer.js";
import type { MarkdownViewer } from "./markdown-viewer.js";
import type { EditorHost, ViewMode } from "./types.js";

/**
 * `<markdown-workspace>` — エディタとビューワーを並べる器。
 *
 * 分割表示・リサイザ・スクロール同期・表示倍率だけを受け持ち、描画も
 * 編集も内包する子コンポーネントに委ねる。エディタは
 * {@link EditorHost} 契約でしか触らないので、`slot="editor"` に同契約の
 * 別実装を差し込めば workspace は無改修で動く。
 *
 * ```html
 * <markdown-workspace mode="split">
 *   <markdown-editor slot="editor"></markdown-editor>
 *   <markdown-viewer slot="preview"></markdown-viewer>
 * </markdown-workspace>
 * ```
 *
 * @fires input      - エディタの本文が変わったとき。
 * @fires modechange - 表示モードが変わったとき。`detail.mode`。
 * @fires zoomchange - 表示倍率が変わったとき。`detail.zoom`。
 */
export class MarkdownWorkspace extends HTMLElement {
  static get observedAttributes() {
    return ["mode", "live"];
  }

  private root: ShadowRoot;
  private resizer!: HTMLElement;
  private editorPane!: HTMLElement;

  private _zoom = 1;
  /**
   * 直近に同期で書き込んだ相手と値。
   *
   * 片方を動かすと相手からも scroll が返ってくる(エコー)。これを
   * 「次の1発を無視する」フラグや rAF で消す方式にすると、エコーが
   * 来なかった場合や非表示タブ(rAF が止まる)でフラグが残り、以降の
   * スクロールを取りこぼす。自分が書いた値がそのまま返ってきたときだけ
   * 無視する形にすれば、状態が残っても実害がない。
   */
  private lastWrite: { target: EventTarget; ratio: number } | null = null;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = workspaceStyles;

    this.editorPane = document.createElement("div");
    this.editorPane.className = "pane editor-pane";
    this.editorPane.innerHTML = `<slot name="editor"></slot>`;

    this.resizer = document.createElement("div");
    this.resizer.className = "resizer";

    const previewPane = document.createElement("div");
    previewPane.className = "pane preview-pane";
    previewPane.innerHTML = `<slot name="preview"></slot>`;

    this.root.append(style, this.editorPane, this.resizer, previewPane);
  }

  connectedCallback() {
    if (!this.hasAttribute("mode")) this.setAttribute("mode", "split");

    this.addEventListener("input", this.onEditorInput);
    this.addEventListener("scroll", this.onPaneScroll, true);
    this.resizer.addEventListener("mousedown", this.onResizeStart);
    this.addEventListener("wheel", this.onWheel, { passive: false });
  }

  disconnectedCallback() {
    this.removeEventListener("input", this.onEditorInput);
    this.removeEventListener("scroll", this.onPaneScroll, true);
    this.resizer.removeEventListener("mousedown", this.onResizeStart);
    this.removeEventListener("wheel", this.onWheel);
    this.endResize();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === "mode") {
      this.dispatchEvent(new CustomEvent("modechange", { detail: { mode: value } }));
    }
  }

  /** slot に差し込まれたエディタ。契約は {@link EditorHost}。 */
  get editor(): EditorHost | null {
    return this.querySelector<EditorHost>('[slot="editor"]');
  }

  /** slot に差し込まれたビューワー。 */
  get viewer(): MarkdownViewer | null {
    return this.querySelector<MarkdownViewer>('[slot="preview"]');
  }

  /** 表示モード。属性 `mode` と連動。 */
  get mode(): ViewMode {
    return (this.getAttribute("mode") as ViewMode) || "split";
  }
  set mode(value: ViewMode) {
    this.setAttribute("mode", value);
  }

  /**
   * エディタ入力をビューワーへ自動反映するか。属性 `live` と連動。
   *
   * 無効にすると `input` イベントだけ流れるので、デバウンスや
   * タブ管理をアプリ側で挟める。
   */
  get live(): boolean {
    return this.hasAttribute("live");
  }
  set live(value: boolean) {
    this.toggleAttribute("live", value);
  }

  /** 本文。エディタとビューワーの両方へ流す。 */
  get value(): string {
    return this.editor?.value ?? "";
  }
  set value(text: string) {
    const editor = this.editor;
    if (editor) editor.value = text;
    const viewer = this.viewer;
    if (viewer) viewer.markdown = text;
  }

  /**
   * 表示倍率 (0.5〜3.0)。
   *
   * px 指定の見出しやコードも一様に拡縮させたいので、font-size ではなく
   * CSS の `zoom` を使う（ブラウザズームと同じ感覚）。値は `--md-zoom`
   * として子へ渡り、各コンポーネントの Shadow DOM 内で適用される。
   */
  get zoom(): number {
    return this._zoom;
  }
  set zoom(value: number) {
    const next = Math.min(3, Math.max(0.5, Math.round(value * 10) / 10));
    if (next === this._zoom) return;
    this._zoom = next;
    this.style.setProperty("--md-zoom", String(next));
    this.dispatchEvent(new CustomEvent("zoomchange", { detail: { zoom: next } }));
  }

  /** エディタ側の幅 (CSS 長さ)。リサイザのドラッグ結果もここに入る。 */
  get split(): string {
    return this.style.getPropertyValue("--md-split") || "50%";
  }
  set split(value: string) {
    this.style.setProperty("--md-split", value);
  }

  private onEditorInput = () => {
    if (this.live) {
      const viewer = this.viewer;
      if (viewer) viewer.markdown = this.editor?.value ?? "";
    }
  };

  /** エディタ ↔ プレビューのスクロール同期。 */
  private onPaneScroll = (e: Event) => {
    const editor = this.editor;
    const viewer = this.viewer;
    if (!editor || !viewer || this.mode !== "split") return;

    const target = e.target;
    let source: { scrollRatio: number };
    let destination: { scrollRatio: number };
    if (target === editor) [source, destination] = [editor, viewer];
    else if (target === viewer) [source, destination] = [viewer, editor];
    else return;

    const ratio = source.scrollRatio;

    // 自分が書いた値がそのまま返ってきただけならエコー。捨てる。
    if (
      this.lastWrite &&
      this.lastWrite.target === target &&
      Math.abs(this.lastWrite.ratio - ratio) < 0.0001
    ) {
      this.lastWrite = null;
      return;
    }

    this.lastWrite = { target: destination as unknown as EventTarget, ratio };
    destination.scrollRatio = ratio;
  };

  /** Ctrl + ホイールで表示倍率を変更する。 */
  private onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    this.zoom = this._zoom + (e.deltaY < 0 ? 0.1 : -0.1);
  };

  private onResizeStart = (e: MouseEvent) => {
    e.preventDefault();
    this.classList.add("resizing");
    this.resizer.classList.add("dragging");
    window.addEventListener("mousemove", this.onResizeMove);
    window.addEventListener("mouseup", this.endResize);
  };

  private onResizeMove = (e: MouseEvent) => {
    const rect = this.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    const clamped = Math.min(0.9, Math.max(0.1, ratio));
    this.split = `${(clamped * 100).toFixed(2)}%`;
  };

  private endResize = () => {
    this.classList.remove("resizing");
    this.resizer.classList.remove("dragging");
    window.removeEventListener("mousemove", this.onResizeMove);
    window.removeEventListener("mouseup", this.endResize);
  };
}

if (!customElements.get("markdown-workspace")) {
  customElements.define("markdown-workspace", MarkdownWorkspace);
}
