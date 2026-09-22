import Link from 'next/link'
import { WorkspacePageDemo } from '@/components/WorkspacePageDemo'

export const metadata = {
  title: '<markdown-workspace> — @yanqirenshi/markdown.sitter',
  description:
    '分割表示・リサイザ・スクロール同期・Ctrl+ホイールズームを内蔵。エディタを EditorHost 契約でしか触らないため実装を問わず差し替えられる Web Component。',
}

export default function WorkspacePage() {
  return (
    <div>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="header-logo" style={{ textDecoration: 'none' }}>
            <span className="logo-pkg">@yanqirenshi/</span>
            <span className="logo-name">markdown.sitter</span>
          </Link>
          <nav className="header-nav">
            <Link href="/">ホーム</Link>
            <a href="https://github.com/Foolsgolds/mdfve/tree/main/packages/markdown.sitter" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://www.npmjs.com/package/@yanqirenshi/markdown.sitter" target="_blank" rel="noopener noreferrer">npm</a>
          </nav>
        </div>
      </header>

      <main>
        {/* ヒーロー */}
        <div className="comp-hero">
          <div className="section-inner">
            <nav className="comp-breadcrumb">
              <Link href="/">ホーム</Link>
              <span>/</span>
              <span>コンポーネント</span>
              <span>/</span>
              <span className="comp-breadcrumb-current">markdown-workspace</span>
            </nav>
            <div className="comp-hero-badge">Web Component</div>
            <h1 className="comp-hero-title">&lt;markdown-workspace&gt;</h1>
            <p className="comp-hero-desc">
              分割表示・リサイザ・スクロール同期・Ctrl+ホイールズームを内蔵。
              エディタを <code>EditorHost</code> 契約でしか触らないため、実装を問わず差し替えられます。
            </p>
            <div className="comp-hero-tags">
              {['mode', 'live', 'zoom', 'modechange', 'EditorHost', 'resizer'].map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* サンプル */}
        <section className="comp-section">
          <div className="section-inner">
            <h2 className="comp-section-title">サンプル</h2>
            <p className="comp-section-desc">
              上部のボタンでモードを切り替えられます。
              分割表示ではリサイザをドラッグして幅を変更でき、Ctrl+ホイールでズームできます。
            </p>
            <WorkspacePageDemo />
          </div>
        </section>

        {/* 利用方法 */}
        <section className="comp-section comp-section--alt">
          <div className="section-inner">
            <h2 className="comp-section-title">利用方法</h2>
            <div className="code-tabs comp-code-tabs">
              {CODE_EXAMPLES.map((ex) => (
                <div key={ex.title} className="code-tab">
                  <div className="code-tab-header">
                    <h3>{ex.title}</h3>
                    <span className="code-lang-badge">{ex.lang}</span>
                  </div>
                  <pre>
                    <code dangerouslySetInnerHTML={{ __html: ex.html }} />
                  </pre>
                </div>
              ))}
            </div>

            <div className="comp-props">
              <h3 className="comp-props-title">プロパティ</h3>
              <table className="comp-props-table">
                <thead>
                  <tr><th>プロパティ</th><th>型</th><th>説明</th></tr>
                </thead>
                <tbody>
                  {PROPS.map((p) => (
                    <tr key={p.name}>
                      <td><code>{p.name}</code></td>
                      <td><code>{p.type}</code></td>
                      <td>{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="comp-props">
              <h3 className="comp-props-title">スロット</h3>
              <table className="comp-props-table">
                <thead>
                  <tr><th>スロット名</th><th>期待する型</th><th>説明</th></tr>
                </thead>
                <tbody>
                  {SLOTS.map((s) => (
                    <tr key={s.name}>
                      <td><code>{s.name}</code></td>
                      <td><code>{s.type}</code></td>
                      <td>{s.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="comp-props">
              <h3 className="comp-props-title">イベント</h3>
              <table className="comp-props-table">
                <thead>
                  <tr><th>イベント</th><th>detail の型</th><th>タイミング</th></tr>
                </thead>
                <tbody>
                  {EVENTS.map((e) => (
                    <tr key={e.name}>
                      <td><code>{e.name}</code></td>
                      <td><code>{e.detail}</code></td>
                      <td>{e.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          MIT License —{' '}
          <a href="https://github.com/Foolsgolds/mdfve" target="_blank" rel="noopener noreferrer">
            GitHub / Foolsgolds/mdfve
          </a>
        </p>
      </footer>
    </div>
  )
}

const PROPS = [
  { name: 'value', type: 'string', desc: 'エディタの現在のテキスト (読み書き)' },
  { name: 'mode', type: '"editor" | "split" | "preview"', desc: '表示モード' },
  { name: 'live', type: 'boolean', desc: 'ライブプレビューを有効化 (デフォルト: false)' },
  { name: 'zoom', type: 'number', desc: '表示倍率 0.5〜3.0 (デフォルト: 1)' },
  { name: 'split', type: 'string', desc: 'エディタ幅の CSS 長さ値 (例: "45%", "400px")' },
]

const SLOTS = [
  { name: 'editor', type: 'EditorHost', desc: 'エディタ領域。EditorHost インターフェースを実装した要素を配置する' },
  { name: 'preview', type: 'HTMLElement', desc: 'プレビュー領域。通常は markdown-viewer を配置する' },
]

const EVENTS = [
  { name: 'input', detail: '{ value: string }', desc: 'エディタの内容が変更されたとき' },
  { name: 'modechange', detail: '{ mode: string }', desc: '表示モードが変更されたとき' },
  { name: 'zoomchange', detail: '{ zoom: number }', desc: 'ズーム倍率が変更されたとき' },
]

const CODE_EXAMPLES = [
  {
    title: '基本セットアップ',
    lang: 'HTML',
    html: `<span class="tag">&lt;markdown-workspace</span>
  <span class="attr">mode</span>=<span class="val">"split"</span>
  <span class="attr">live</span>
<span class="tag">&gt;</span>
  <span class="tag">&lt;markdown-editor</span>
    <span class="attr">slot</span>=<span class="val">"editor"</span>
    <span class="attr">placeholder</span>=<span class="val">"Markdown を入力…"</span>
  <span class="tag">&gt;&lt;/markdown-editor&gt;</span>
  <span class="tag">&lt;markdown-viewer</span>
    <span class="attr">slot</span>=<span class="val">"preview"</span>
    <span class="attr">foldable</span>
  <span class="tag">&gt;&lt;/markdown-viewer&gt;</span>
<span class="tag">&lt;/markdown-workspace&gt;</span>`,
  },
  {
    title: 'モードを切り替える',
    lang: 'JavaScript',
    html: `<span class="kw">const</span> ws = document.querySelector(<span class="str">"markdown-workspace"</span>);

ws.mode = <span class="str">"editor"</span>;   <span class="cmt">// エディタのみ表示</span>
ws.mode = <span class="str">"split"</span>;    <span class="cmt">// 分割表示</span>
ws.mode = <span class="str">"preview"</span>;  <span class="cmt">// プレビューのみ表示</span>

ws.addEventListener(<span class="str">"modechange"</span>, (e) => {
  console.log(e.detail.mode);
});`,
  },
  {
    title: 'ズームを制御する',
    lang: 'JavaScript',
    html: `<span class="kw">const</span> ws = document.querySelector(<span class="str">"markdown-workspace"</span>);

ws.zoom = <span class="val">1.5</span>; <span class="cmt">// 150% に設定</span>

ws.addEventListener(<span class="str">"zoomchange"</span>, (e) => {
  console.log(e.detail.zoom); <span class="cmt">// 0.5 ~ 3.0</span>
});

<span class="cmt">// Ctrl+ホイールでも自動ズームします</span>`,
  },
  {
    title: 'CSS 変数でカスタマイズ',
    lang: 'CSS',
    html: `<span class="tag">markdown-workspace</span> {
  <span class="cmt">/* 分割位置の初期値 */</span>
  <span class="attr">--md-split</span>:  <span class="val">45%</span>;

  <span class="cmt">/* カラーテーマ */</span>
  <span class="attr">--md-bg</span>:     <span class="val">#1e1e2e</span>;
  <span class="attr">--md-fg</span>:     <span class="val">#cdd6f4</span>;
  <span class="attr">--md-border</span>: <span class="val">#313244</span>;
}`,
  },
]
