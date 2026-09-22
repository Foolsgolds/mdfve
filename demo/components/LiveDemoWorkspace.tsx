'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Mode = 'editor' | 'split' | 'preview'
type Theme = 'light' | 'dark' | 'sepia' | 'cyberpunk'

const SAMPLE_MARKDOWN = `# markdown.sitter へようこそ

フレームワーク非依存の Markdown **ビューワー / エディタ** Web Components です。

## 特徴

### 見出しの折り畳み

見出しをクリックすると配下のコンテンツを折り畳めます。
目次 UI はデータのみ公開するので、サイドバーの見た目はアプリ側で自由に実装できます。

### シンタックスハイライト

\`\`\`typescript
import "@yanqirenshi/markdown.sitter";

const workspace = document.querySelector("markdown-workspace") as any;
workspace.mode = "split";
workspace.zoom = 1.2;
\`\`\`

\`\`\`rust
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
\`\`\`

### テーブル

| コンポーネント | 役割 |
|---|---|
| \`<markdown-viewer>\` | Markdown の表示 |
| \`<markdown-editor>\` | 本文の編集 |
| \`<markdown-workspace>\` | 2 ペインの器 |

### テーマ対応

CSS 変数で Shadow DOM を貫通し、ライブラリ側の CSS を変更せずにテーマを適用できます。

> **試してみてください！** 左のエディタを直接編集すると
> 右のプレビューにリアルタイムで反映されます。
> 上の **テーマ** ボタンでカラースキームも切り替えられます。

---

## エディタの差し替え

\`EditorHost\` 契約を満たす要素なら何でも差し込めます。

\`\`\`typescript
interface EditorHost extends HTMLElement {
  value: string;
  scrollRatio: number;
  focus(): void;
  // input と scroll イベントを発火すること
}
\`\`\`
`

const THEME_VARS: Record<Theme, Record<string, string>> = {
  light: {
    '--md-bg': '#f9fafb',
    '--md-editor-bg': '#ffffff',
    '--md-fg': '#111827',
    '--md-fg-muted': '#4b5563',
    '--md-border': '#e5e7eb',
    '--md-code-bg': '#f0f2f5',
    '--md-link': '#2563eb',
    '--md-quote-bg': 'rgba(37,99,235,0.05)',
    '--md-resizer-bg': '#e5e7eb',
    '--md-resizer-active-bg': '#2563eb',
    '--md-th-bg': 'rgba(0,0,0,0.04)',
    '--md-caret': '#2563eb',
    '--bg': '#f9fafb',
  },
  dark: {
    '--md-bg': '#121214',
    '--md-editor-bg': '#121214',
    '--md-fg': '#e4e4e7',
    '--md-fg-muted': '#a1a1aa',
    '--md-border': '#2f2f35',
    '--md-code-bg': '#1e1e24',
    '--md-link': '#3b82f6',
    '--md-quote-bg': 'rgba(59,130,246,0.05)',
    '--md-resizer-bg': '#2f2f35',
    '--md-resizer-active-bg': '#3b82f6',
    '--md-th-bg': 'rgba(255,255,255,0.04)',
    '--md-token-property': '#f43f5e',
    '--md-caret': '#3b82f6',
    '--bg': '#121214',
  },
  sepia: {
    '--md-bg': '#f4ecd8',
    '--md-editor-bg': '#fbf0d9',
    '--md-fg': '#5c4033',
    '--md-fg-muted': '#8b5a2b',
    '--md-border': '#d7c59a',
    '--md-code-bg': '#ede1c5',
    '--md-link': '#a0522d',
    '--md-quote-bg': 'rgba(160,82,45,0.05)',
    '--md-resizer-bg': '#d7c59a',
    '--md-resizer-active-bg': '#a0522d',
    '--md-th-bg': 'rgba(92,64,51,0.05)',
    '--md-caret': '#a0522d',
    '--bg': '#f4ecd8',
  },
  cyberpunk: {
    '--md-bg': '#0d0e15',
    '--md-editor-bg': '#0d0e15',
    '--md-fg': '#00ffcc',
    '--md-fg-muted': '#ff007f',
    '--md-border': '#ff007f',
    '--md-code-bg': '#1b1c2b',
    '--md-link': '#ffff00',
    '--md-quote-bg': 'rgba(255,0,127,0.1)',
    '--md-resizer-bg': '#ff007f',
    '--md-resizer-active-bg': '#00ffcc',
    '--md-th-bg': 'rgba(255,0,127,0.05)',
    '--md-token-property': '#ff007f',
    '--md-token-string': '#00ffcc',
    '--md-token-keyword': '#ffff00',
    '--md-caret': '#00ffcc',
    '--bg': '#0d0e15',
  },
}

const MODE_LABELS: Record<Mode, string> = { editor: 'エディタ', split: '分割', preview: 'プレビュー' }
const THEME_LABELS: Record<Theme, string> = { light: 'ライト', dark: 'ダーク', sepia: 'セピア', cyberpunk: 'サイバーパンク' }

export function LiveDemoWorkspace() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<any>(null)
  const [mode, setMode] = useState<Mode>('split')
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    import('@yanqirenshi/markdown.sitter').then(() => setMounted(true))
  }, [])

  useEffect(() => {
    if (!mounted || !canvasRef.current || workspaceRef.current) return
    const workspace = document.createElement('markdown-workspace') as any
    workspace.style.cssText = 'display:flex;flex:1;width:100%;height:100%;min-width:0'
    workspace.setAttribute('mode', 'split')
    const editor = document.createElement('markdown-editor') as HTMLElement
    editor.setAttribute('slot', 'editor')
    editor.setAttribute('placeholder', 'ここに Markdown を入力...')
    const viewer = document.createElement('markdown-viewer') as HTMLElement
    viewer.setAttribute('slot', 'preview')
    viewer.setAttribute('foldable', '')
    workspace.append(editor, viewer)
    canvasRef.current.appendChild(workspace)
    workspaceRef.current = workspace
    workspace.value = SAMPLE_MARKDOWN
    return () => { workspace.remove(); workspaceRef.current = null }
  }, [mounted])

  useEffect(() => {
    if (workspaceRef.current) workspaceRef.current.mode = mode
  }, [mode])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const vars = THEME_VARS[theme]
    for (const [key, val] of Object.entries(vars)) {
      if (key.startsWith('--')) el.style.setProperty(key, val)
    }
    el.style.background = vars['--bg'] ?? ''
  }, [theme, mounted])

  return (
    <div className="livedemo-root">
      {/* ツールバー */}
      <div className="livedemo-bar">
        <Link href="/" className="livedemo-back">
          ← ホーム
        </Link>
        <div className="livedemo-controls">
          <div className="demo-ctrl-group">
            {(['editor', 'split', 'preview'] as Mode[]).map((m) => (
              <button
                key={m}
                className={`demo-ctrl-btn${mode === m ? ' active' : ''}`}
                onClick={() => setMode(m)}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
          <div className="livedemo-divider" />
          <div className="demo-ctrl-group">
            {(Object.keys(THEME_LABELS) as Theme[]).map((t) => (
              <button
                key={t}
                className={`demo-ctrl-btn${theme === t ? ' active' : ''}`}
                onClick={() => setTheme(t)}
              >
                {THEME_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ワークスペース */}
      <div
        ref={canvasRef}
        className="livedemo-canvas"
        style={{ background: THEME_VARS[theme]['--bg'] }}
      >
        {!mounted && <div className="demo-loading">読み込み中</div>}
      </div>
    </div>
  )
}
