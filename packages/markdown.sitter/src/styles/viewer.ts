// Shadow DOM 内へ注入するスタイル。クラス名は外へ漏れない(衝突しない)。
//
// テーマ契約: すべて CSS 変数で受ける。`--md-*` を最優先で見て、無ければ
// ホストアプリの汎用変数(--text-primary 等)へフォールバックし、最後に
// 素の既定値へ落ちる。CSS 変数は Shadow DOM を貫通するので、アプリ側の
// テーマ切替がそのまま効く。テーマを増やすときにこのファイルを触る必要は
// ない — アプリ側で `--md-token-keyword` 等を再定義すれば済む。
export const viewerStyles: string = /* css */ `
:host {
  display: block;
  overflow-y: auto;
  background-color: var(--md-bg, var(--preview-bg, transparent));
  color: var(--md-fg, var(--text-primary, #0f172a));
  user-select: text;
  transition: background-color 0.3s;
}

.body {
  padding: var(--md-padding, 32px 40px);
  max-width: var(--md-max-width, 800px);
  margin: 0 auto;
  line-height: var(--md-line-height, 1.7);
  font-size: var(--md-font-size, 15px);
  font-family: var(--md-font, inherit);
  color: var(--md-fg, var(--text-primary, #0f172a));
  transition: max-width 0.2s ease-in-out;
  zoom: var(--md-zoom, 1);
}

/* ---------- 見出し ---------- */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--md-heading-font, var(--md-font, inherit));
  font-weight: 600;
  margin-top: 24px;
  margin-bottom: 12px;
  line-height: 1.35;
  color: var(--md-heading-fg, var(--md-fg, var(--text-primary, #0f172a)));
}
h1 {
  font-size: var(--md-h1-size, 28px);
  border-bottom: 2px solid var(--md-border, var(--border-color, #e5e7eb));
  padding-bottom: 8px;
  margin-top: 12px;
}
h2 {
  font-size: var(--md-h2-size, 22px);
  border-bottom: 1px solid var(--md-border, var(--border-color, #e5e7eb));
  padding-bottom: 6px;
}
h3 { font-size: var(--md-h3-size, 18px); }
h4 { font-size: var(--md-h4-size, 15px); }

/* ---------- 本文 ---------- */
p { margin-bottom: 16px; }

a {
  color: var(--md-link, var(--accent-color, #2563eb));
  text-decoration: none;
  border-bottom: 1px dashed var(--md-link, var(--accent-color, #2563eb));
  transition: color 0.2s, border-bottom-color 0.2s;
}
a:hover {
  color: var(--md-link-hover, var(--accent-hover, #1d4ed8));
  border-bottom-style: solid;
}

strong { font-weight: 700; }

blockquote {
  margin: 16px 0;
  padding: 8px 16px;
  background-color: var(--md-quote-bg, var(--quote-bg, rgba(0, 0, 0, 0.04)));
  border-left: 4px solid var(--md-link, var(--accent-color, #2563eb));
  color: var(--md-fg-muted, var(--text-secondary, #64748b));
  border-radius: 0 6px 6px 0;
}

/* ---------- リスト ---------- */
ul, ol {
  margin-bottom: 16px;
  padding-left: 24px;
}
li { margin-bottom: 4px; }
ul li { list-style-type: disc; }
ol li { list-style-type: decimal; }

/* ---------- コード ---------- */
code {
  font-family: var(--md-mono-font, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: var(--md-code-font-size, 13px);
  background-color: var(--md-code-bg, var(--code-bg, rgba(0, 0, 0, 0.05)));
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--md-fg-muted, var(--text-secondary, #64748b));
  transition: background-color 0.3s;
}
pre {
  margin: 16px 0;
  padding: 16px;
  background-color: var(--md-code-bg, var(--code-bg, rgba(0, 0, 0, 0.05)));
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid var(--md-border, var(--border-color, #e5e7eb));
  transition: background-color 0.3s, border-color 0.3s;
}
pre code {
  padding: 0;
  background-color: transparent;
  color: var(--md-fg, var(--text-primary, #0f172a));
  font-size: var(--md-code-font-size, 13px);
  display: block;
}

/* ---------- テーブル ---------- */
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  font-size: 14px;
}
th, td {
  padding: 8px 12px;
  border: 1px solid var(--md-border, var(--border-color, #e5e7eb));
  text-align: left;
}
th {
  background-color: var(--md-th-bg, var(--bg-tertiary, rgba(0, 0, 0, 0.04)));
  font-weight: 600;
}
tr:nth-child(even) td {
  background-color: var(--md-row-alt-bg, rgba(127, 127, 127, 0.05));
}

hr {
  height: 2px;
  background-color: var(--md-border, var(--border-color, #e5e7eb));
  border: none;
  margin: 24px 0;
}

input[type="checkbox"] {
  margin-right: 8px;
  vertical-align: middle;
  pointer-events: none;
}

img { max-width: 100%; }

/* ---------- 見出し折り畳み ---------- */
.section-wrapper {
  margin-bottom: 8px;
  width: 100%;
}
.section-content {
  padding-left: var(--md-fold-indent, 26px);
  box-sizing: border-box;
}
.collapsible-header {
  display: flex;
  align-items: center;
  position: relative;
  user-select: text;
  width: 100%;
  box-sizing: border-box;
}
.collapsible-header .fold-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 6px;
  color: var(--md-fg-muted, var(--text-secondary, #64748b));
  transition: transform 0.2s ease, color 0.2s;
  flex-shrink: 0;
  cursor: pointer;
}
.collapsible-header:hover .fold-chevron {
  color: var(--md-link, var(--accent-color, #2563eb));
}
/* 展開状態(既定)は下向き。 */
.collapsible-header .fold-chevron svg {
  transform: rotate(90deg);
  transition: transform 0.2s ease;
}
.section-wrapper.collapsed > .section-content {
  display: none !important;
}
.section-wrapper.collapsed > .collapsible-header .fold-chevron svg {
  transform: rotate(0deg);
}

/* foldable=false のときはシェブロンを非表示にする。 */
:host(:not([foldable])) .fold-chevron { display: none; }
:host(:not([foldable])) .section-content { padding-left: 0; }

/* ---------- PrismJS トークン ---------- *
 * テーマ名でのハードコードは行わない。色を変えたいテーマは
 * アプリ側で --md-token-* を再定義する。                      */
.token.comment, .token.prolog, .token.doctype, .token.cdata {
  color: var(--md-token-comment, #7c7c88);
}
.token.punctuation {
  color: var(--md-token-punctuation, var(--md-fg, var(--text-primary, #0f172a)));
  opacity: var(--md-token-punctuation-opacity, 0.7);
}
.token.property, .token.tag, .token.boolean, .token.number,
.token.constant, .token.symbol, .token.deleted {
  color: var(--md-token-property, #ff007f);
}
.token.selector, .token.attr-name, .token.string, .token.char,
.token.builtin, .token.inserted {
  color: var(--md-token-string, #10b981);
}
.token.operator, .token.entity, .token.url,
.language-css .token.string, .style .token.string {
  color: var(--md-token-operator, var(--accent-color, #2563eb));
}
.token.atrule, .token.attr-value, .token.keyword {
  color: var(--md-token-keyword, #3b82f6);
}
.token.function, .token.class-name {
  color: var(--md-token-function, #a855f7);
}
.token.regex, .token.important, .token.variable {
  color: var(--md-token-variable, #eab308);
}
`;
