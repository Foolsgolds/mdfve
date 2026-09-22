import Link from 'next/link'
import { EditorDemo } from '@/components/EditorDemo'

export const metadata = {
  title: '<markdown-editor> — @yanqirenshi/markdown.sitter',
  description:
    '素の textarea による EditorHost 実装。value / scrollRatio / focus() の3点を契約とし、CodeMirror 等への差し替えも容易な Web Component。',
}

export default function EditorPage() {
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
              <span className="comp-breadcrumb-current">markdown-editor</span>
            </nav>
            <div className="comp-hero-badge">Web Component</div>
            <h1 className="comp-hero-title">&lt;markdown-editor&gt;</h1>
            <p className="comp-hero-desc">
              素の <code>textarea</code> による <code>EditorHost</code> 実装。
              <code>value</code> / <code>scrollRatio</code> / <code>focus()</code> の3点を契約とし、
              CodeMirror 等への差し替えも容易です。
            </p>
            <div className="comp-hero-tags">
              {['EditorHost', 'value', 'scrollRatio', 'input event', 'scroll event'].map((t) => (
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
              テキストを編集すると文字数・行数がリアルタイムで更新されます。
            </p>
            <EditorDemo />
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
              <h3 className="comp-props-title">プロパティ / メソッド (EditorHost 契約)</h3>
              <table className="comp-props-table">
                <thead>
                  <tr><th>名前</th><th>型</th><th>説明</th></tr>
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
                  <tr><th>イベント</th><th>タイミング</th></tr>
                </thead>
                <tbody>
                  {EVENTS.map((e) => (
                    <tr key={e.name}>
                      <td><code>{e.name}</code></td>
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
  { name: 'scrollRatio', type: 'number', desc: 'スクロール位置を 0〜1 で取得/設定 (スクロール同期に使用)' },
  { name: 'focus()', type: 'void', desc: 'エディタにフォーカスを移す' },
  { name: 'textareaElement', type: 'HTMLTextAreaElement', desc: 'textarea 要素への参照 (低レベルアクセス用)' },
]

const EVENTS = [
  { name: 'input', desc: '内容が変更されたとき (composed: true でバブルします)' },
  { name: 'scroll', desc: 'textarea がスクロールしたとき' },
]

const CODE_EXAMPLES = [
  {
    title: '基本的な使い方',
    lang: 'HTML + JS',
    html: `<span class="tag">&lt;markdown-editor</span>
  <span class="attr">id</span>=<span class="val">"editor"</span>
  <span class="attr">placeholder</span>=<span class="val">"Markdown を入力…"</span>
<span class="tag">&gt;&lt;/markdown-editor&gt;</span>

<span class="tag">&lt;script</span> <span class="attr">type</span>=<span class="val">"module"</span><span class="tag">&gt;</span>
<span class="kw">import</span> <span class="str">"@yanqirenshi/markdown.sitter"</span>;

<span class="kw">const</span> editor = document.getElementById(<span class="str">"editor"</span>);
editor.value = <span class="str">"# Hello"</span>;

editor.addEventListener(<span class="str">"input"</span>, () => {
  console.log(editor.value);
});
<span class="tag">&lt;/script&gt;</span>`,
  },
  {
    title: 'ビューワーとスクロールを同期',
    lang: 'JavaScript',
    html: `<span class="kw">const</span> editor = document.querySelector(<span class="str">"markdown-editor"</span>);
<span class="kw">const</span> viewer = document.querySelector(<span class="str">"markdown-viewer"</span>);

<span class="cmt">// エディタのスクロールをビューワーに反映</span>
editor.addEventListener(<span class="str">"scroll"</span>, () => {
  viewer.scrollRatio = editor.scrollRatio;
});

<span class="cmt">// ビューワーのスクロールをエディタに反映</span>
viewer.addEventListener(<span class="str">"scroll"</span>, () => {
  editor.scrollRatio = viewer.scrollRatio;
});`,
  },
  {
    title: 'CodeMirror へ差し替える (EditorHost)',
    lang: 'TypeScript',
    html: `<span class="kw">import</span> <span class="kw">type</span> { EditorHost } <span class="kw">from</span>
  <span class="str">"@yanqirenshi/markdown.sitter"</span>;

<span class="cmt">// EditorHost を実装したカスタム要素を作る</span>
<span class="kw">class</span> CodeMirrorHost
  <span class="kw">extends</span> HTMLElement
  <span class="kw">implements</span> EditorHost {

  <span class="kw">get</span> value() { <span class="kw">return</span> <span class="kw">this</span>._cm.getValue(); }
  <span class="kw">set</span> value(v: <span class="kw">string</span>) { <span class="kw">this</span>._cm.setValue(v); }

  <span class="kw">get</span> scrollRatio() { <span class="cmt">/* ... */</span> }
  <span class="kw">set</span> scrollRatio(r: <span class="kw">number</span>) { <span class="cmt">/* ... */</span> }

  focus() { <span class="kw">this</span>._cm.focus(); }
}

customElements.define(<span class="str">"codemirror-host"</span>, CodeMirrorHost);`,
  },
]
