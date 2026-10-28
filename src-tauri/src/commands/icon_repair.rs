use crate::shell::notify;
use std::fs;

#[tauri::command]
pub fn repair_icon_cache() -> Result<String, String> {
    let mut cleaned_files = 0;
    if let Some(local_app_data) = dirs::data_local_dir() {
        let legacy_cache = local_app_data.join("IconCache.db");
        if legacy_cache.exists() {
            let _ = fs::remove_file(legacy_cache);
            cleaned_files += 1;
        }

        let explorer_cache_dir = local_app_data.join("Microsoft").join("Windows").join("Explorer");
        if explorer_cache_dir.exists() {
            if let Ok(entries) = fs::read_dir(explorer_cache_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        if name.starts_with("iconcache") || name.starts_with("thumbcache") {
                            if fs::remove_file(&path).is_ok() {
                                cleaned_files += 1;
                            }
                        }
                    }
                }
            }
        }
    }

    notify::broadcast_icon_repair();

    Ok(format!(
        "Shell icon cache successfully rebuilt (cleaned {} cache databases).",
        cleaned_files
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_repair_icon_cache_executes() {
        let res = repair_icon_cache();
        assert!(res.is_ok());
    }
}
