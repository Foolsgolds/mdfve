import { editorStyles } from "./styles/editor.js";
import type { EditorHost } from "./types.js";

/**
 * `<markdown-editor>` — EditorHost 契約の既定実装（素の textarea）。
 *
 * workspace はこの実装ではなく {@link EditorHost} の 3 点だけを見る。
 * CodeMirror などに置き換えたい場合は、同じ契約を満たす要素を
 * `<markdown-workspace>` の `slot="editor"` に差し込めばよく、
 * workspace 側の変更は不要。
 *
 * @fires input  - 本文が変わったとき（textarea の input をそのまま再送）。
 * @fires scroll - 縦スクロール位置が変わったとき。
 */
export class MarkdownEditor extends HTMLElement implements EditorHost {
  static get observedAttributes() {
    return ["placeholder", "readonly"];
  }

  private textarea: HTMLTextAreaElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = editorStyles;

    this.textarea = document.createElement("textarea");
    this.textarea.spellcheck = false;
    this.textarea.addEventListener("input", () => {
      this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    this.textarea.addEventListener("scroll", () => {
      this.dispatchEvent(new Event("scroll"));
    });

    root.append(style, this.textarea);
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === "placeholder") this.textarea.placeholder = value ?? "";
    if (name === "readonly") this.textarea.readOnly = value !== null;
  }

  /** 本文。代入しても `input` は発火しない（プログラム的な差し替えのため）。 */
  get value(): string {
    return this.textarea.value;
  }
  set value(v: string) {
    if (this.textarea.value === v) return;
    this.textarea.value = v ?? "";
  }

  /** 0..1 の縦スクロール位置。 */
  get scrollRatio(): number {
    const range = this.textarea.scrollHeight - this.textarea.clientHeight;
    return range > 0 ? this.textarea.scrollTop / range : 0;
  }
  set scrollRatio(ratio: number) {
    const range = this.textarea.scrollHeight - this.textarea.clientHeight;
    if (range > 0) this.textarea.scrollTop = ratio * range;
  }

  override focus(options?: FocusOptions) {
    this.textarea.focus(options);
  }

  /** 内部の textarea。選択範囲操作など、契約外の低レベル操作が要るとき用。 */
  get textareaElement(): HTMLTextAreaElement {
    return this.textarea;
  }
}

if (!customElements.get("markdown-editor")) {
  customElements.define("markdown-editor", MarkdownEditor);
}
