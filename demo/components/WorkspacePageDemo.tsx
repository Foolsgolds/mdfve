'use client'

import { useEffect, useRef, useState } from 'react'

const SAMPLE = `# markdown-workspace

エディタとプレビューを統合した **ワークスペース** コンポーネントです。

## 機能

- **分割表示** — エディタとプレビューを並べて表示
- **スクロール同期** — 双方向でスクロール位置を同期
- **リサイザ** — 仕切りをドラッグして分割比率を変更
- **Ctrl+ホイール** でズームイン/アウト

## コード

\`\`\`typescript
const ws = document.querySelector("markdown-workspace")!;

ws.mode = "split";   // "editor" | "split" | "preview"
ws.live  = true;     // ライブプレビュー
ws.zoom  = 1.2;      // 0.5 ~ 3.0

ws.addEventListener("input", (e) => {
  console.log(e.detail.value);
});
ws.addEventListener("modechange", (e) => {
  console.log(e.detail.mode);
});
ws.addEventListener("zoomchange", (e) => {
  console.log(e.detail.zoom);
});
\`\`\`

> リサイザをドラッグするか Ctrl+ホイールを試してみてください。
`

const MODES = ['editor', 'split', 'preview'] as const
const MODE_LABELS: Record<string, string> = { editor: 'エディタ', split: '分割', preview: 'プレビュー' }

export function WorkspacePageDemo() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'editor' | 'split' | 'preview'>('split')

  useEffect(() => {
    import('@yanqirenshi/markdown.sitter').then(() => setMounted(true))
  }, [])

  useEffect(() => {
    if (!mounted || !canvasRef.current) return
    const el = canvasRef.current
    const workspace = document.createElement('markdown-workspace') as any
    workspace.style.cssText = 'display:flex;flex:1;width:100%;height:100%;min-width:0'
    workspace.setAttribute('mode', 'split')
    workspace.setAttribute('live', '')
    const editor = document.createElement('markdown-editor') as any
    editor.setAttribute('slot', 'editor')
    const viewer = document.createElement('markdown-viewer') as any
    viewer.setAttribute('slot', 'preview')
    viewer.setAttribute('foldable', '')
    workspace.append(editor, viewer)
    el.appendChild(workspace)
    workspace.value = SAMPLE
    workspaceRef.current = workspace
    return () => { el.removeChild(workspace) }
  }, [mounted])

  useEffect(() => {
    if (workspaceRef.current) workspaceRef.current.mode = mode
  }, [mode])

  return (
    <div className="comp-demo-wrapper">
      <div className="comp-demo-toolbar">
        <span className="comp-demo-tag">markdown-workspace</span>
        <div className="comp-demo-ctrl-group">
          {MODES.map((m) => (
            <button
              key={m}
              className={`demo-ctrl-btn${mode === m ? ' active' : ''}`}
              onClick={() => setMode(m)}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>
      <div className="comp-demo-canvas" ref={canvasRef}>
        {!mounted && <div className="demo-loading">読み込み中…</div>}
      </div>
    </div>
  )
}
