import Link from 'next/link'
import { ViewerDemo } from '@/components/ViewerDemo'

export const metadata = {
  title: '<markdown-viewer> — @yanqirenshi/markdown.sitter',
  description:
    'Markdown をレンダリングし、Prism.js でシンタックスハイライト。見出しは折り畳み可能で目次データを公開する Web Component。',
}

export default function ViewerPage() {
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
              <span className="comp-breadcrumb-current">markdown-viewer</span>
            </nav>
            <div className="comp-hero-badge">Web Component</div>
            <h1 className="comp-hero-title">&lt;markdown-viewer&gt;</h1>
            <p className="comp-hero-desc">
              Markdown を HTML にレンダリングし、Prism.js でシンタックスハイライト。
              見出しは折り畳み可能で、目次データを <code>outlinechange</code> イベントで公開します。
            </p>
            <div className="comp-hero-tags">
              {['foldable', 'outlinechange', 'scrollRatio', 'marked', 'Prism.js'].map((t) => (
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
              見出しをクリックすると折り畳めます。
              右側の「outlinechange」パネルにはイベントで取得した目次データを表示しています。
            </p>
            <ViewerDemo />
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
  { name: 'markdown', type: 'string', desc: 'レンダリングする Markdown テキスト' },
  { name: 'foldable', type: 'boolean', desc: '見出しをクリックで折り畳み可能にする' },
  { name: 'scrollRatio', type: 'number', desc: 'スクロール位置を 0〜1 で取得/設定' },
  { name: 'headings', type: 'Heading[]', desc: 'パース済みの見出し一覧 (読み取り専用)' },
  { name: 'collapsedPaths', type: 'string[]', desc: '折り畳み中の見出しパスの配列' },
  { name: 'parser', type: 'MarkdownParser', desc: 'Markdown パーサー関数 (デフォルト: marked)' },
  { name: 'sanitize', type: 'Sanitizer', desc: 'HTML サニタイザー関数 (デフォルト: 素通し)' },
]

const EVENTS = [
  { name: 'outlinechange', detail: '{ headings: Heading[] }', desc: 'Markdown が更新されて見出し一覧が変わったとき' },
  { name: 'foldchange', detail: '{ collapsedPaths: string[] }', desc: '見出しの折り畳み状態が変化したとき' },
]

const CODE_EXAMPLES = [
  {
    title: '基本的な使い方',
    lang: 'HTML + JS',
    html: `<span class="tag">&lt;markdown-viewer</span> <span class="attr">id</span>=<span class="val">"viewer"</span><span class="tag">&gt;&lt;/markdown-viewer&gt;</span>

<span class="tag">&lt;script</span> <span class="attr">type</span>=<span class="val">"module"</span><span class="tag">&gt;</span>
<span class="kw">import</span> <span class="str">"@yanqirenshi/markdown.sitter"</span>;

<span class="kw">const</span> viewer = document.getElementById(<span class="str">"viewer"</span>);
viewer.markdown = <span class="str">"# Hello\\n\\nこんにちは！"</span>;
<span class="tag">&lt;/script&gt;</span>`,
  },
  {
    title: '見出しの折り畳みを有効化',
    lang: 'HTML',
    html: `<span class="cmt">&lt;!-- foldable 属性を付けるだけで有効になります --&gt;</span>
<span class="tag">&lt;markdown-viewer</span>
  <span class="attr">id</span>=<span class="val">"viewer"</span>
  <span class="attr">foldable</span>
<span class="tag">&gt;&lt;/markdown-viewer&gt;</span>`,
  },
  {
    title: '目次データを取得',
    lang: 'JavaScript',
    html: `viewer.addEventListener(<span class="str">"outlinechange"</span>, (e) => {
  <span class="kw">const</span> headings = e.detail.headings;
  <span class="cmt">// [</span>
  <span class="cmt">//   { level: 1, text: "タイトル", path: "0" },</span>
  <span class="cmt">//   { level: 2, text: "セクション", path: "0-1" },</span>
  <span class="cmt">// ]</span>
  renderTOC(headings);
});`,
  },
  {
    title: 'サニタイザーを設定',
    lang: 'TypeScript',
    html: `<span class="kw">import</span> DOMPurify <span class="kw">from</span> <span class="str">"dompurify"</span>;
<span class="kw">import</span> <span class="kw">type</span> { MarkdownViewer } <span class="kw">from</span>
  <span class="str">"@yanqirenshi/markdown.sitter"</span>;

<span class="kw">const</span> viewer =
  document.querySelector&lt;MarkdownViewer&gt;(<span class="str">"markdown-viewer"</span>)!;

<span class="cmt">// 外部入力を表示するときは必ずサニタイズを挟む</span>
viewer.sanitize = (html) => DOMPurify.sanitize(html);`,
  },
  {
    title: 'CSS 変数でテーマを設定',
    lang: 'CSS',
    html: `<span class="tag">markdown-viewer</span> {
  <span class="attr">--md-bg</span>:            <span class="val">#1a1a2e</span>;
  <span class="attr">--md-fg</span>:            <span class="val">#eee</span>;
  <span class="attr">--md-token-keyword</span>: <span class="val">#569cd6</span>;
  <span class="attr">--md-token-string</span>:  <span class="val">#ce9178</span>;
  <span class="attr">--md-token-comment</span>: <span class="val">#6a9955</span>;
}`,
  },
]
