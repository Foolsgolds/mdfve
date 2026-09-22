'use client'

import { useEffect, useRef, useState } from 'react'

const SAMPLE = `## 特徴

### 折り畳み可能な見出し

この見出しをクリックすると配下のコンテンツを折り畳めます。
目次データは \`outlinechange\` イベントで取得できます。

### シンタックスハイライト

\`\`\`typescript
import "@yanqirenshi/markdown.sitter";

const viewer = document.querySelector("markdown-viewer")!;
viewer.markdown = "# Hello World";
viewer.foldable = true;

viewer.addEventListener("outlinechange", (e) => {
  console.log(e.detail.headings);
});
\`\`\`

\`\`\`rust
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
\`\`\`

### テーブル

| プロパティ | 型 | 説明 |
|---|---|---|
| \`markdown\` | \`string\` | Markdown テキスト |
| \`foldable\` | \`boolean\` | 見出し折り畳みを有効化 |
| \`scrollRatio\` | \`number\` | スクロール位置 (0–1) |

## イベント

| イベント | タイミング |
|---|---|
| \`outlinechange\` | 見出し一覧が更新されたとき |
| \`foldchange\` | 折り畳み状態が変化したとき |

> **ヒント:** Shadow DOM でカプセル化されているため、\`--md-*\` CSS 変数でテーマを設定してください。
`

type Heading = { level: number; text: string }

export function ViewerDemo() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [outline, setOutline] = useState<Heading[]>([])

  useEffect(() => {
    import('@yanqirenshi/markdown.sitter').then(() => setMounted(true))
  }, [])

  useEffect(() => {
    if (!mounted || !canvasRef.current) return
    const el = canvasRef.current
    const viewer = document.createElement('markdown-viewer') as any
    viewer.style.cssText =
      'display:block;flex:1;width:100%;height:100%;min-width:0;overflow:auto'
    viewer.setAttribute('foldable', '')
    viewer.markdown = SAMPLE
    viewer.addEventListener('outlinechange', (e: any) => {
      setOutline(e.detail?.headings ?? [])
    })
    el.appendChild(viewer)
    return () => { el.removeChild(viewer) }
  }, [mounted])

  return (
    <div className="comp-demo-wrapper">
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div className="comp-demo-canvas" ref={canvasRef}>
          {!mounted && <div className="demo-loading">読み込み中…</div>}
        </div>
        {outline.length > 0 && (
          <aside className="comp-outline">
            <p className="comp-outline-label">outlinechange</p>
            <ul>
              {outline.map((h, i) => (
                <li key={i} style={{ paddingLeft: `${(h.level - 2) * 12}px` }}>
                  {h.text}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  )
}
