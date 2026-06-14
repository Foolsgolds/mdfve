# MDFVE — Markdown エディタ ＆ ビューア

**MDFVE** は、Markdown をリアルタイムにプレビューしながら編集できるデスクトップアプリケーションです。
[Tauri 2](https://tauri.app/) + Vanilla TypeScript で構築されており、軽量かつネイティブに動作します。

---

## 主な機能

### 編集・プレビュー
- **ライブプレビュー** — 入力と同時に [marked](https://marked.js.org/) で HTML へ変換して表示
- **シンタックスハイライト** — コードブロックを [Prism.js](https://prismjs.com/) でハイライト（JavaScript / TypeScript / CSS / Rust / JSON / Bash / Markdown 対応）
- **3 つの表示モード** — エディタのみ / 分割表示 / プレビューのみ（フローティングメニュー **V**）
- **同期スクロール** — エディタとプレビューがスクロール位置を連動
- **分割幅のドラッグ調整** — 中央のバーをドラッグしてエディタ／プレビューの比率を変更
- **プレビュー幅の切替** — 標準 (800px) / 広い (1200px) / フル幅 (100%)（フローティングメニュー **W**）

### ドキュメント構造
- **折り畳み可能な見出し** — プレビュー本文の見出しをクリックして階層ごと折り畳み
- **目次（アウトライン）サイドバー** — 見出しから該当箇所へスムーズスクロール。目次側でも折り畳み可能

### ファイル操作
- **タブ管理** — 複数ファイルをタブで開く・切替・閉じる（未保存時は確認ダイアログ）
- **新規 / 開く / 上書き保存 / 別名保存**（フローティングメニュー **F**）
- **自動保存** — 保存済みファイルは入力停止から約 1.5 秒後に自動保存
- **UTF-8 BOM の自動除去**

### 外観・情報
- **4 つのテーマ** — ライト / ダーク / セピア / サイバーパンク（フローティングメニュー **T**）
- **ステータスバー** — 文字数 / 単語数 / 読了目安、自動保存状態、現在のテーマを表示
- **ウィンドウタイトル** — `MDFVE - <ファイル名>`（未保存時は `*` を付与）

### キーボードショートカット

| 操作 | ショートカット |
|------|----------------|
| 新規作成 | `Ctrl + N` |
| ファイルを開く | `Ctrl + O` |
| 上書き保存 | `Ctrl + S` |
| 別名で保存 | `Ctrl + Shift + S` |

---

## emacs 連携（markdown-preview の置き換え）

emacs の `M-x markdown-preview` の代わりに、編集中のファイルを MDFVE で開けます。
詳細は [`emacs/mdfve.el`](emacs/mdfve.el) を参照してください。

`init.el` に以下を追加します（実行ファイルのパスは環境に合わせて調整）：

```elisp
(load "/path/to/mdfve/emacs/mdfve.el")
;; スタンドアロン版（npm run tauri build の出力）を指定する
(setq mdfve-executable "/path/to/mdfve/src-tauri/target/release/tauri-app.exe")
;; インストーラで導入した場合は: "C:/Program Files/MDFVE/MDFVE.exe"
```

markdown-mode のバッファで `C-c C-c p`（`M-x mdfve-preview`）を実行すると、
バッファを保存して MDFVE がそのファイルをタブで開きます。

> **注意:** 開発ビルド（`target/debug`）は vite 開発サーバーが必要なため、
> emacs 連携には `npm run tauri build` で生成したスタンドアロン版を使ってください。

- **single-instance 対応** — 2 回目以降のプレビューは既存ウィンドウに新規タブとして追加され、ウィンドウが増えません
- **拡張子非依存** — `.md` だけでなく `.org` などコマンドライン引数で渡した任意のファイルを開けます
- **再読込** — 既に開いているファイルを再プレビューすると最新内容に更新されます

---

## 開発

### 必要環境
- [Node.js](https://nodejs.org/)
- [Rust ツールチェーン](https://www.rust-lang.org/tools/install)
- Tauri の[前提条件](https://tauri.app/start/prerequisites/)（Windows の場合は WebView2 ランタイム）

### セットアップ
```bash
npm install
```

### 開発モードで起動
```bash
npm run tauri dev
```

### ビルド（配布用バイナリ生成）
```bash
npm run tauri build
```

---

## 技術スタック

| 領域 | 使用技術 |
|------|----------|
| アプリ基盤 | Tauri 2 |
| フロントエンド | Vanilla TypeScript + Vite |
| Markdown 変換 | marked |
| シンタックスハイライト | Prism.js |
| ファイル / ダイアログ | tauri-plugin-fs / tauri-plugin-dialog |
| 単一インスタンス | tauri-plugin-single-instance |

---

## プロジェクト構成

```
mdfve/
├── index.html              # 画面レイアウト
├── src/
│   ├── main.ts             # アプリ本体ロジック（タブ・プレビュー・ファイル I/O 等）
│   └── styles.css          # スタイル・テーマ定義
├── src-tauri/
│   ├── src/lib.rs          # Rust バックエンド（CLI 引数・single-instance）
│   ├── capabilities/       # Tauri 権限設定
│   └── tauri.conf.json     # Tauri 設定
└── emacs/
    └── mdfve.el            # emacs 連携用 elisp
```
