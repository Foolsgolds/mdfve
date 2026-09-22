# @yanqirenshi/markdown.sitter

Markdown のビューワー／エディタを提供する、フレームワーク非依存の Web Components。

- **`<markdown-viewer>`** — 表示専用。marked で描画し、Prism で着色し、見出しごとに折り畳める。
- **`<markdown-editor>`** — 素の `textarea` による編集欄。
- **`<markdown-workspace>`** — 上記 2 つを並べる器。分割表示・リサイザ・スクロール同期・表示倍率を担う。

いずれも Shadow DOM なので、スタイルはパッケージ内に閉じている。見た目の調整は
**すべて CSS 変数**で行い、ライブラリの CSS を編集する必要はない。

## インストール

```bash
npm install @yanqirenshi/markdown.sitter
```

## 使い方

### 表示だけしたいとき

```html
<markdown-viewer id="v" foldable></markdown-viewer>
```

```js
import "@yanqirenshi/markdown.sitter";

const v = document.getElementById("v");
v.markdown = "# 見出し\n\n本文です。";
```

### エディタと並べたいとき

```html
<markdown-workspace id="ws" mode="split" live>
  <markdown-editor slot="editor" placeholder="Markdown を入力"></markdown-editor>
  <markdown-viewer slot="preview" foldable></markdown-viewer>
</markdown-workspace>
```

`live` を付けると入力がそのままプレビューへ流れる。デバウンスやタブ管理を自分で挟みたい
場合は `live` を外し、`input` イベントを受けて `viewer.markdown` を自分で更新する。

## API

### `<markdown-viewer>`

| プロパティ | 型 | 説明 |
|---|---|---|
| `markdown` | `string` | 表示する本文。代入で再描画。 |
| `foldable` | `boolean` | 見出しの折り畳みを有効にする（属性 `foldable` と連動）。 |
| `headings` | `readonly Heading[]` | 直近の描画で得た見出し一覧。目次 UI はこれを読む。 |
| `collapsedPaths` | `string[]` | 折り畳み中の見出しパス。保存／復元用。再パースは起きない。 |
| `scrollRatio` | `number` | 0..1 の縦スクロール位置。 |
| `parser` | `MarkdownParser` | Markdown → HTML の変換器。既定は marked。 |
| `sanitize` | `Sanitizer` | HTML 挿入前のフック。**既定は素通し**（下記の注意を参照）。 |

| メソッド | 説明 |
|---|---|
| `toggleFold(path)` | 見出しの折り畳みを切り替える。 |
| `scrollToHeading(path, behavior?)` | 該当見出しまでスクロールする。 |
| `render()` | 明示的に再描画する。 |

| イベント | `detail` |
|---|---|
| `outlinechange` | `{ headings }` — 描画完了ごと。 |
| `foldchange` | `{ path, collapsed }` — 折り畳み切替ごと。 |

目次は **データだけ** を公開し、UI は持たない。サイドバーの見た目や配置はアプリごとに
違うため、そこはアプリ側の責務としている。

### `<markdown-editor>`

`value` / `scrollRatio` / `focus()` を持ち、`input` と `scroll` を発火する。
内部の `textarea` は `textareaElement` で取れる。

### `<markdown-workspace>`

| プロパティ | 型 | 説明 |
|---|---|---|
| `mode` | `"editor" \| "split" \| "preview"` | 表示モード（属性 `mode` と連動）。 |
| `live` | `boolean` | 入力をプレビューへ自動反映するか。 |
| `value` | `string` | 本文。エディタとビューワーの両方へ流す。 |
| `zoom` | `number` | 表示倍率 0.5〜3.0。Ctrl+ホイールでも変わる。 |
| `split` | `string` | エディタ側の幅（CSS 長さ）。リサイザのドラッグ結果もここ。 |
| `editor` / `viewer` | 要素 | slot に差し込まれた子。 |

イベントは `input` / `modechange` / `zoomchange`。

## エディタの差し替え

`<markdown-workspace>` はエディタを `EditorHost` 契約でしか触らない。

```ts
interface EditorHost extends HTMLElement {
  value: string;        // 本文
  scrollRatio: number;  // 0..1 の縦スクロール位置
  focus(): void;
  // 本文変更で input、スクロールで scroll を発火すること
}
```

この 3 点を満たす要素を `slot="editor"` に置けば、CodeMirror などに差し替えても
workspace 側は無改修で動く。`<markdown-editor>` はその既定実装にすぎない。

## テーマ

すべて CSS 変数で受ける。`--md-*` を最優先で見て、無ければホストアプリの汎用変数
（`--text-primary` 等）へフォールバックし、最後に素の既定値へ落ちる。CSS 変数は
Shadow DOM を貫通するので、アプリ側のテーマ切替がそのまま効く。

```css
#app {
  --md-heading-font: 'Outfit', sans-serif;
  --md-mono-font: 'JetBrains Mono', monospace;
}
.theme-dark  { --md-token-property: #f43f5e; }
.theme-light { --md-token-property: #d97706; }
```

主な変数:

| 分類 | 変数 |
|---|---|
| 基本 | `--md-bg` `--md-fg` `--md-fg-muted` `--md-border` `--md-zoom` |
| 版面 | `--md-max-width` `--md-padding` `--md-font-size` `--md-line-height` |
| 書体 | `--md-font` `--md-heading-font` `--md-mono-font` |
| 見出し | `--md-h1-size` 〜 `--md-h4-size` `--md-heading-fg` |
| 要素 | `--md-link` `--md-link-hover` `--md-code-bg` `--md-quote-bg` `--md-th-bg` `--md-row-alt-bg` |
| Prism | `--md-token-comment` `--md-token-punctuation` `--md-token-property` `--md-token-string` `--md-token-operator` `--md-token-keyword` `--md-token-function` `--md-token-variable` |
| エディタ | `--md-editor-bg` `--md-editor-fg` `--md-editor-padding` `--md-editor-font-size` `--md-caret` |
| workspace | `--md-split` `--md-resizer-width` `--md-resizer-bg` `--md-resizer-active-bg` |

Prism のトークン色をテーマ名で分岐させる作りにはしていない。テーマを増やすときも
このパッケージの CSS を編集する必要はない。

## 対応言語

同梱している Prism の言語定義は javascript / typescript / css / rust / json / bash /
markdown。追加したい言語はアプリ側で読み込めば、同じ Prism インスタンスに登録される。

```js
import "@yanqirenshi/markdown.sitter";
import "prismjs/components/prism-python";
```

## 注意: サニタイズ

`sanitize` の既定は素通しで、marked も既定で生 HTML を通す。自分で書いた文書だけを
表示する用途では問題ないが、外部から受け取った Markdown を表示するなら
DOMPurify などを挿すこと。

```js
import DOMPurify from "dompurify";
viewer.sanitize = (html) => DOMPurify.sanitize(html);
```

## ライセンス

MIT
