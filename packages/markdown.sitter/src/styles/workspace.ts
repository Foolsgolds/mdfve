// `<markdown-workspace>` の Shadow DOM スタイル。
// エディタ／プレビューの 2 ペイン + リサイザの器だけを持ち、
// 中身の見た目は各コンポーネント側の責務。
export const workspaceStyles: string = /* css */ `
:host {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.pane {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pane > ::slotted(*) {
  flex: 1;
  min-height: 0;
}

/* 幅は split のときだけ resizer が動かす。それ以外は片方が 100%。 */
.editor-pane { flex: 0 0 var(--md-split, 50%); }
.preview-pane { flex: 1 1 auto; }

.resizer {
  flex: 0 0 var(--md-resizer-width, 6px);
  height: 100%;
  background-color: var(--md-resizer-bg, var(--border-color, #e5e7eb));
  cursor: col-resize;
  z-index: 5;
  transition: background-color 0.2s;
}
.resizer:hover,
.resizer.dragging {
  background-color: var(--md-resizer-active-bg, var(--accent-color, #2563eb));
}

/* ---------- 表示モード ---------- */
:host([mode="editor"]) .editor-pane { flex: 1 1 auto; }
:host([mode="editor"]) .preview-pane,
:host([mode="editor"]) .resizer { display: none; }

:host([mode="preview"]) .editor-pane,
:host([mode="preview"]) .resizer { display: none; }

/* ドラッグ中は iframe/選択にイベントを取られないようにする。 */
:host(.resizing) { user-select: none; }
:host(.resizing) .pane { pointer-events: none; }
`;
