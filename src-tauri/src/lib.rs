use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // On macOS, position the window nicely on first launch
            #[cfg(target_os = "macos")]
            {
                let window = app.get_webview_window("main").unwrap();
                window.set_title("Together Tasks").unwrap();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Together Tasks")
}
