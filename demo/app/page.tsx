import Link from 'next/link'
import { DemoWorkspace } from '@/components/DemoWorkspace'

export default function Page() {
  return (
    <div>
      {/* ヘッダー */}
      <header className="site-header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="logo-pkg">@yanqirenshi/</span>
            <span className="logo-name">markdown.sitter</span>
          </div>
          <nav className="header-nav">
            <a
              href="https://github.com/Foolsgolds/mdfve/tree/main/packages/markdown.sitter"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@yanqirenshi/markdown.sitter"
              target="_blank"
              rel="noopener noreferrer"
            >
              npm
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* ヒーロー */}
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-badge">Web Components</div>
            <h1 className="hero-title">
              Markdown{' '}
              <span className="accent">ビューワー / エディタ</span>
            </h1>
            <p className="hero-desc">
              フレームワーク非依存の Web Components。Shadow DOM で完全にカプセル化され、
              CSS 変数でテーマを自由にカスタマイズできます。
            </p>
            <div className="install-block">
              <span className="prompt">$</span>
              <code>npm install @yanqirenshi/markdown.sitter</code>
            </div>
            <div className="hero-tags">
              {['marked', 'Prism.js', 'Shadow DOM', 'TypeScript', 'MIT'].map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ライブデモ */}
        <section className="demo-section">
          <div className="section-inner">
            <div className="section-header">
              <h2>
                <Link href="/livedemo" className="livedemo-title-link">ライブデモ</Link>
              </h2>
              <p>エディタを直接編集して、Markdown のレンダリングをリアルタイムで確認できます。</p>
            </div>
            <DemoWorkspace />
          </div>
        </section>

        {/* 機能 */}
        <section className="features-section">
          <div className="section-inner">
            <h2>機能</h2>
            <div className="features-grid">
              {FEATURES.map((f) => (
                <div key={f.title} className="feature-card">
                  <div className="feature-icon">{f.icon}</div>
                  <h3>
                    {f.href ? (
                      <Link href={f.href} className="feature-card-link">{f.title}</Link>
                    ) : f.title}
                  </h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* クイックスタート */}
        <section className="quickstart-section">
          <div className="section-inner">
            <h2>クイックスタート</h2>
            <div className="code-tabs">
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
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="site-footer">
        <p>
          MIT License —{' '}
          <a
            href="https://github.com/Foolsgolds/mdfve"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub / Foolsgolds/mdfve
          </a>
        </p>
      </footer>
    </div>
  )
}

const FEATURES = [
  {
    icon: '👁',
    title: '<markdown-viewer>',
    href: '/components/markdown-viewer',
    desc: 'marked で HTML 化し、Prism でシンタックスハイライト。見出しは折り畳み可能で、目次データを outlinechange イベントで公開。',
  },
  {
    icon: '✏️',
    title: '<markdown-editor>',
    href: '/components/markdown-editor',
    desc: '素の textarea による EditorHost 実装。value / scrollRatio / focus() の 3 点を契約とし、CodeMirror 等への差し替えも容易。',
  },
  {
    icon: '⊞',
    title: '<markdown-workspace>',
    href: '/components/markdown-workspace',
    desc: '分割表示・リサイザ・スクロール同期・Ctrl+ホイールズームを内蔵。エディタを EditorHost 契約でしか触らないため、実装を問わず差し替えられる。',
  },
  {
    icon: '🎨',
    title: 'CSS 変数テーマ',
    desc: '--md-* 変数を最優先で見て、ホストアプリの汎用変数にフォールバック。CSS 変数は Shadow DOM を貫通するのでライブラリ側の CSS を編集する必要なし。',
  },
  {
    icon: '🔌',
    title: 'フレームワーク非依存',
    desc: 'Web Components なので React / Vue / Svelte / vanilla JS どこでも動く。import 1 行でカスタム要素が登録される。',
  },
  {
    icon: '📘',
    title: 'TypeScript 完全対応',
    desc: '型定義同梱。HTMLElementTagNameMap に登録済みで querySelector の戻り値にも型が付く。MarkdownParser / Sanitizer / EditorHost も公開。',
  },
]

const CODE_EXAMPLES = [
  {
    title: '表示だけしたいとき',
    lang: 'HTML + JS',
    html: `<span class="tag">&lt;markdown-viewer</span> <span class="attr">id</span>=<span class="val">"v"</span> <span class="attr">foldable</span><span class="tag">&gt;&lt;/markdown-viewer&gt;</span>

<span class="kw">import</span> <span class="str">"@yanqirenshi/markdown.sitter"</span><span class="cmt">;</span>

<span class="kw">const</span> v = document.getElementById(<span class="str">"v"</span>)<span class="cmt">;</span>
v.markdown = <span class="str">"# Hello World\\n\\nこんにちは！"</span><span class="cmt">;</span>`,
  },
  {
    title: 'エディタと並べたいとき',
    lang: 'HTML',
    html: `<span class="tag">&lt;markdown-workspace</span> <span class="attr">mode</span>=<span class="val">"split"</span> <span class="attr">live</span><span class="tag">&gt;</span>
  <span class="tag">&lt;markdown-editor</span>
    <span class="attr">slot</span>=<span class="val">"editor"</span>
    <span class="attr">placeholder</span>=<span class="val">"Markdown を入力"</span>
  <span class="tag">&gt;&lt;/markdown-editor&gt;</span>
  <span class="tag">&lt;markdown-viewer</span>
    <span class="attr">slot</span>=<span class="val">"preview"</span>
    <span class="attr">foldable</span>
  <span class="tag">&gt;&lt;/markdown-viewer&gt;</span>
<span class="tag">&lt;/markdown-workspace&gt;</span>`,
  },
  {
    title: 'テーマを CSS 変数で設定',
    lang: 'CSS',
    html: `<span class="cmt">/* --md-* を最優先で見る。未定義なら</span>
<span class="cmt">   --text-primary 等の汎用変数にフォールバック */</span>
<span class="tag">.dark-theme</span> {
  <span class="attr">--md-bg</span>: <span class="val">#121214</span>;
  <span class="attr">--md-fg</span>: <span class="val">#e4e4e7</span>;
  <span class="attr">--md-token-keyword</span>: <span class="val">#3b82f6</span>;
  <span class="attr">--md-token-string</span>:  <span class="val">#10b981</span>;
}`,
  },
  {
    title: 'サニタイズを挟むとき',
    lang: 'TypeScript',
    html: `<span class="kw">import</span> DOMPurify <span class="kw">from</span> <span class="str">"dompurify"</span><span class="cmt">;</span>
<span class="kw">import</span> <span class="kw">type</span> { MarkdownViewer } <span class="kw">from</span>
  <span class="str">"@yanqirenshi/markdown.sitter"</span><span class="cmt">;</span>

<span class="kw">const</span> viewer =
  document.querySelector<span class="tag">&lt;</span>MarkdownViewer<span class="tag">&gt;</span>(
    <span class="str">"markdown-viewer"</span>
  )!<span class="cmt">;</span>

<span class="cmt">// 既定は素通し — 外部入力には必ず挿すこと</span>
viewer.sanitize = (html) =>
  DOMPurify.sanitize(html)<span class="cmt">;</span>`,
  },
]
