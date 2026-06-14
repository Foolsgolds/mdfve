;;; mdfve.el --- Preview Markdown buffers in the MDFVE app -*- lexical-binding: t; -*-

;; markdown-mode の M-x markdown-preview の代わりに、編集中の .md ファイルを
;; MDFVE デスクトップアプリで開くための連携設定。
;;
;; 仕組み:
;;   - 現在のバッファを保存し、MDFVE 実行ファイルにファイルパスを渡して起動する。
;;   - MDFVE は single-instance 構成なので、2回目以降は既存ウィンドウの
;;     新規タブとして開かれ、ウィンドウが増えない。
;;
;; 使い方 (init.el などに記述):
;;   (require 'mdfve)              ; もしくは下記を直接 init.el に貼り付け
;;   (setq mdfve-executable "C:/Users/yanqi/prj/mdfve/src-tauri/target/debug/tauri-app.exe")

(defgroup mdfve nil
  "Preview Markdown files using the MDFVE desktop app."
  :group 'markdown)

(defcustom mdfve-executable
  ;; 開発ビルドの実行ファイル。
  ;; 開発ビルド (target/debug) は vite 開発サーバーが必要なため、
  ;; emacs 連携には npm run tauri build で作るスタンドアロン版を使うこと。
  ;;   - スタンドアロン: src-tauri/target/release/tauri-app.exe
  ;;   - インストーラ導入後: C:/Program Files/MDFVE/MDFVE.exe
  "C:/Users/yanqi/prj/mdfve/src-tauri/target/release/tauri-app.exe"
  "Path to the MDFVE executable."
  :type 'string
  :group 'mdfve)

;;;###autoload
(defun mdfve-preview ()
  "現在の Markdown バッファを保存して MDFVE で開く。"
  (interactive)
  (unless (buffer-file-name)
    (user-error "このバッファはファイルに保存されていません。先に保存してください"))
  (unless (file-executable-p mdfve-executable)
    (user-error "MDFVE 実行ファイルが見つかりません: %s" mdfve-executable))
  (save-buffer)
  (start-process "mdfve" nil mdfve-executable (buffer-file-name))
  (message "MDFVE で開いています: %s" (buffer-file-name)))

;; markdown-mode の C-c C-c p を MDFVE プレビューに置き換える。
;; 元の markdown-preview を残したい場合はこの with-eval-after-load を消して、
;; 任意のキー (例: C-c C-c m) に mdfve-preview を割り当ててください。
(with-eval-after-load 'markdown-mode
  (define-key markdown-mode-map (kbd "C-c C-c p") #'mdfve-preview))

(provide 'mdfve)
;;; mdfve.el ends here
