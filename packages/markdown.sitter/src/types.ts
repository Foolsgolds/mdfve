/** 見出し 1 件ぶんのアウトライン情報。 */
export interface Heading {
  /** 祖先を含む一意なパス。例: `1:はじめに > 2:動機` */
  path: string;
  /** 見出しレベル (1-6)。 */
  level: number;
  /** 見出しテキスト。 */
  title: string;
  /** 子見出しを持つか。目次の折り畳み UI で使う。 */
  hasChildren: boolean;
  /** ビューワー内で折り畳まれているか。 */
  collapsed: boolean;
}

/** Markdown 文字列を HTML へ変換する関数。既定は marked。 */
export type MarkdownParser = (markdown: string) => string | Promise<string>;

/** 生成した HTML を挿入前に通すフック。既定は素通し。 */
export type Sanitizer = (html: string) => string;

/** 表示モード。 */
export type ViewMode = "editor" | "split" | "preview";

/**
 * `<markdown-workspace>` がエディタ実装に要求する最小の契約。
 *
 * workspace はこの 3 点だけを見る。`<markdown-editor>` は textarea による
 * 既定実装にすぎず、同じ契約を満たす要素(CodeMirror ラッパー等)を
 * `slot="editor"` に差し込めば workspace 側は無改修で動く。
 *
 * - `value`      : 本文の取得と設定。
 * - `scrollRatio`: 0..1 の縦スクロール位置。スクロール同期に使う。
 * - イベント     : 本文変更で `input`、スクロールで `scroll` を発火すること。
 */
export interface EditorHost extends HTMLElement {
  value: string;
  scrollRatio: number;
  focus(): void;
}
