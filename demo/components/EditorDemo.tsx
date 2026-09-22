'use client'

import { useEffect, useRef, useState } from 'react'

const INITIAL = `# markdown-editor

ここに Markdown を入力してみてください。

- \`value\` プロパティで読み書き
- \`input\` イベントで変更を検知
- \`scrollRatio\` でスクロール位置を同期

## EditorHost インターフェース

\`EditorHost\` を実装すれば \`markdown-workspace\` の
エディタを CodeMirror 等へ差し替えられます。

\`\`\`typescript
interface EditorHost extends HTMLElement {
  value: string
  scrollRatio: number
  focus(): void
}
\`\`\`
`

export function EditorDemo() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [charCount, setCharCount] = useState(INITIAL.length)
  const [lineCount, setLineCount] = useState(INITIAL.split('\n').length)

  useEffect(() => {
    import('@yanqirenshi/markdown.sitter').then(() => setMounted(true))
  }, [])

  useEffect(() => {
    if (!mounted || !canvasRef.current) return
    const el = canvasRef.current
    const editor = document.createElement('markdown-editor') as any
    editor.style.cssText = 'display:flex;flex:1;width:100%;height:100%;min-width:0'
    editor.value = INITIAL
    editor.addEventListener('input', () => {
      const v: string = editor.value ?? ''
      setCharCount(v.length)
      setLineCount(v.split('\n').length)
    })
    el.appendChild(editor)
    return () => { el.removeChild(editor) }
  }, [mounted])

  return (
    <div className="comp-demo-wrapper">
      <div className="comp-demo-toolbar">
        <span className="comp-demo-tag">markdown-editor</span>
        <div className="comp-demo-stats">
          <span>{charCount} 文字</span>
          <span>{lineCount} 行</span>
        </div>
      </div>
      <div className="comp-demo-canvas" ref={canvasRef}>
        {!mounted && <div className="demo-loading">読み込み中…</div>}
      </div>
    </div>
  )
}
