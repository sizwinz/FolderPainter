pub mod commands;
pub mod shell;

use commands::color_icons::{generate_color_icon, list_preset_colors};
use commands::folder_icon::{apply_icon, get_current_icon, restore_icon};
use commands::icon_convert::convert_image_to_icon;
use commands::icon_library::{
    clear_icon_cache, download_and_convert_icon, fetch_collections, fetch_icons,
};
use commands::undo::{
    UndoManager, UndoManagerState, apply_icon_tracked, get_undo_state, redo_last,
    restore_icon_tracked, undo_last,
};
use commands::window_theme::set_window_theme;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(Mutex::new(UndoManager::new()) as UndoManagerState)
        .invoke_handler(tauri::generate_handler![
            apply_icon,
            restore_icon,
            get_current_icon,
            list_preset_colors,
            generate_color_icon,
            convert_image_to_icon,
            apply_icon_tracked,
            restore_icon_tracked,
            undo_last,
            redo_last,
            get_undo_state,
            fetch_collections,
            fetch_icons,
            download_and_convert_icon,
            clear_icon_cache,
            set_window_theme,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
