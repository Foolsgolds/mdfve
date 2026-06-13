// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::Serialize;
use tauri::{Emitter, Manager};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// フロントへ渡すファイル情報 (パス + 内容)
#[derive(Clone, Serialize)]
struct OpenedFile {
    path: String,
    content: String,
}

// argv から開く対象のファイルパスを取り出す。
// emacs などが明示的にパスを渡すため拡張子は問わない。
// フラグ (先頭が "-") を除いた最初の引数を採用する。
fn pick_file_path(argv: &[String]) -> Option<String> {
    argv.iter()
        .skip(1) // argv[0] は実行ファイル自身
        .find(|a| !a.starts_with('-') && !a.is_empty())
        .cloned()
}

// 任意パスのファイルを読み込む (JS 側 fs スコープに依存しない)。
// BOM は読み込んだ側 (フロント) で除去する。
fn read_opened_file(path: &str) -> Option<OpenedFile> {
    match std::fs::read_to_string(path) {
        Ok(content) => Some(OpenedFile {
            path: path.to_string(),
            content,
        }),
        Err(e) => {
            eprintln!("Failed to read file '{}': {}", path, e);
            None
        }
    }
}

// フロントが起動完了時に呼ぶ: 初回起動の引数ファイル (パス + 内容) を返す
#[tauri::command]
fn get_startup_file() -> Option<OpenedFile> {
    let argv: Vec<String> = std::env::args().collect();
    let path = pick_file_path(&argv)?;
    read_opened_file(&path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // single-instance は最初に登録する (公式の要件)
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // 2回目以降の起動: 既存インスタンスへ argv が届く
            if let Some(path) = pick_file_path(&argv) {
                if let Some(file) = read_opened_file(&path) {
                    let _ = app.emit("open-file", file);
                }
            }
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, get_startup_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
