use std::path::Path;
use crate::shell::{attributes, desktop_ini, notify};

#[tauri::command]
pub fn apply_icon(folder_path: String, icon_path: String) -> Result<(), String> {
    let folder = Path::new(&folder_path);
    if !folder.exists() || !folder.is_dir() {
        return Err(format!(
            "Folder does not exist or is not a directory: {}",
            folder_path
        ));
    }

    let icon = Path::new(&icon_path);
    if !icon.exists() {
        return Err(format!("Icon file does not exist: {}", icon_path));
    }

    desktop_ini::write_icon_resource(folder, &icon_path)
        .map_err(|e| format!("Failed to update desktop.ini: {}", e))?;

    attributes::set_folder_system(folder)
        .map_err(|e| format!("Failed to set folder attributes: {}", e))?;

    notify::refresh_folder(folder);

    Ok(())
}

#[tauri::command]
pub fn restore_icon(folder_path: String) -> Result<(), String> {
    let folder = Path::new(&folder_path);
    if !folder.exists() || !folder.is_dir() {
        return Err(format!("Folder does not exist: {}", folder_path));
    }

    desktop_ini::remove_icon_resource(folder)
        .map_err(|e| format!("Failed to clean desktop.ini: {}", e))?;

    attributes::clear_folder_system(folder)
        .map_err(|e| format!("Failed to reset folder attributes: {}", e))?;

    notify::refresh_folder(folder);

    Ok(())
}

#[tauri::command]
pub fn get_current_icon(folder_path: String) -> Result<Option<String>, String> {
    let folder = Path::new(&folder_path);
    if !folder.exists() {
        return Ok(None);
    }
    desktop_ini::read_icon_resource(folder)
        .map_err(|e| format!("Failed to read desktop.ini: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_apply_and_restore_icon_flow() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_cmd_folder_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();

        let icon_file = temp_dir.join("test.ico");
        fs::write(&icon_file, b"dummy ico").unwrap();

        apply_icon(
            temp_dir.to_str().unwrap().to_string(),
            icon_file.to_str().unwrap().to_string(),
        )
        .unwrap();

        let current = get_current_icon(temp_dir.to_str().unwrap().to_string()).unwrap();
        assert_eq!(current, Some(icon_file.to_str().unwrap().to_string()));

        restore_icon(temp_dir.to_str().unwrap().to_string()).unwrap();
        let after_restore = get_current_icon(temp_dir.to_str().unwrap().to_string()).unwrap();
        assert_eq!(after_restore, None);

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
