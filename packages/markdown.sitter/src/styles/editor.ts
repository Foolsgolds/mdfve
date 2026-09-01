// `<markdown-editor>` の Shadow DOM スタイル。
// viewer と同じ規約: `--md-editor-*` を最優先、無ければホストの汎用変数。
export const editorStyles: string = /* css */ `
:host {
  display: block;
  overflow: hidden;
}

textarea {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  box-sizing: border-box;
  padding: var(--md-editor-padding, 24px);
  font-family: var(--md-mono-font, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: var(--md-editor-font-size, 14px);
  line-height: var(--md-editor-line-height, 1.6);
  background-color: var(--md-editor-bg, var(--editor-bg, transparent));
  color: var(--md-editor-fg, var(--text-primary, #0f172a));
  caret-color: var(--md-caret, var(--accent-color, #2563eb));
  overflow-y: auto;
  user-select: text;
  transition: background-color 0.3s, color 0.3s;
  zoom: var(--md-zoom, 1);
}

textarea::placeholder {
  color: var(--md-editor-placeholder, var(--text-secondary, #94a3b8));
}
`;
