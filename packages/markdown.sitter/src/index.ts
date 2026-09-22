// Prism 本体を先に読み込む。prismjs/components/* はグローバルの Prism へ
// 自分を登録する作りなので、この順序を崩すと ReferenceError になる。
import "prismjs";

// 同梱する言語定義。ここに無い言語はアプリ側で
// `import "prismjs/components/prism-xxx"` を足せば同じ Prism に登録される。
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markdown";

import "./markdown-viewer.js";
import "./markdown-editor.js";
import "./markdown-workspace.js";

export { MarkdownViewer } from "./markdown-viewer.js";
export { MarkdownEditor } from "./markdown-editor.js";
export { MarkdownWorkspace } from "./markdown-workspace.js";
export { viewerStyles } from "./styles/viewer.js";
export { editorStyles } from "./styles/editor.js";
export { workspaceStyles } from "./styles/workspace.js";
export type {
  Heading,
  MarkdownParser,
  Sanitizer,
  ViewMode,
  EditorHost,
} from "./types.js";

declare global {
  interface HTMLElementTagNameMap {
    "markdown-viewer": import("./markdown-viewer.js").MarkdownViewer;
    "markdown-editor": import("./markdown-editor.js").MarkdownEditor;
    "markdown-workspace": import("./markdown-workspace.js").MarkdownWorkspace;
  }
}
