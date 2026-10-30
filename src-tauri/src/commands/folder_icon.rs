use crate::shell::{attributes, desktop_ini, notify};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FolderIconPreview {
    pub has_custom_icon: bool,
    pub icon_path: Option<String>,
    pub preview_data_url: String,
}

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

#[tauri::command]
pub fn get_folder_current_icon_preview(folder_path: String) -> Result<FolderIconPreview, String> {
    let folder = Path::new(&folder_path);
    if !folder.exists() {
        return Err(format!("Folder does not exist: {}", folder_path));
    }

    if let Ok(Some(raw_resource)) = desktop_ini::read_icon_resource(folder) {
        let clean_path = raw_resource
            .split(',')
            .next()
            .unwrap_or(&raw_resource)
            .trim()
            .trim_matches('"');

        let candidate_path = Path::new(clean_path);
        let resolved = if candidate_path.is_absolute() {
            candidate_path.to_path_buf()
        } else {
            folder.join(clean_path)
        };

        if resolved.exists() {
            if let Ok(img) = image::open(&resolved) {
                let rgba = img.to_rgba8();
                if let Ok(data_url) = crate::commands::color_icons::encode_png_data_url(&rgba) {
                    return Ok(FolderIconPreview {
                        has_custom_icon: true,
                        icon_path: Some(resolved.to_string_lossy().to_string()),
                        preview_data_url: data_url,
                    });
                }
            }
        }
    }

    let default_preview = crate::commands::color_icons::get_default_folder_preview()?;
    Ok(FolderIconPreview {
        has_custom_icon: false,
        icon_path: None,
        preview_data_url: default_preview,
    })
}

fn collect_directories(dir: &Path, recursive: bool) -> Vec<PathBuf> {
    let mut dirs = vec![dir.to_path_buf()];
    if !recursive {
        return dirs;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(file_type) = entry.file_type() {
                if file_type.is_dir() {
                    let sub = entry.path();
                    if let Some(name) = sub.file_name().and_then(|n| n.to_str()) {
                        if name.starts_with('.') || name.eq_ignore_ascii_case("$RECYCLE.BIN") {
                            continue;
                        }
                    }
                    dirs.extend(collect_directories(&sub, true));
                }
            }
        }
    }
    dirs
}

pub fn apply_icon_tree(folder: &Path, icon_path: &str, recursive: bool) -> Result<u32, String> {
    if !folder.exists() {
        return Err(format!("Folder does not exist: {}", folder.display()));
    }
    let all_dirs = collect_directories(folder, recursive);
    let mut count = 0;

    for dir in &all_dirs {
        desktop_ini::write_icon_resource(dir, icon_path)
            .map_err(|e| format!("Failed to write icon resource: {}", e))?;
        attributes::set_folder_system(dir)
            .map_err(|e| format!("Failed to set system attribute: {}", e))?;
        notify::refresh_folder(dir);
        count += 1;
    }

    Ok(count)
}

pub fn restore_icon_tree(folder: &Path, recursive: bool) -> Result<u32, String> {
    if !folder.exists() {
        return Err(format!("Folder does not exist: {}", folder.display()));
    }
    let all_dirs = collect_directories(folder, recursive);
    let mut count = 0;

    for dir in &all_dirs {
        desktop_ini::remove_icon_resource(dir)
            .map_err(|e| format!("Failed to remove icon resource: {}", e))?;
        attributes::clear_folder_system(dir)
            .map_err(|e| format!("Failed to reset folder attributes: {}", e))?;
        notify::refresh_folder(dir);
        count += 1;
    }

    Ok(count)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_apply_icon_tree_recursive() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_tree_folder_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let sub1 = temp_dir.join("sub1");
        let sub2 = temp_dir.join("sub2").join("nested");
        fs::create_dir_all(&sub1).unwrap();
        fs::create_dir_all(&sub2).unwrap();

        let icon_file = temp_dir.join("icon.ico");
        fs::write(&icon_file, b"dummy ico").unwrap();

        let count = apply_icon_tree(&temp_dir, icon_file.to_str().unwrap(), true).unwrap();
        assert_eq!(count, 4, "Should have applied to root, sub1, sub2, and nested");

        let restore_count = restore_icon_tree(&temp_dir, true).unwrap();
        assert_eq!(restore_count, 4, "Should have restored root, sub1, sub2, and nested");

        let _ = fs::remove_dir_all(&temp_dir);
    }

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

    #[test]
    fn test_get_folder_current_icon_preview() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_preview_folder_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();

        // 1. Initially folder has no custom icon -> default preview returned
        let preview_default = get_folder_current_icon_preview(temp_dir.to_str().unwrap().to_string()).unwrap();
        assert!(!preview_default.has_custom_icon);
        assert_eq!(preview_default.icon_path, None);
        assert!(preview_default.preview_data_url.starts_with("data:image/png;base64,"));

        // 2. Create sample image icon and apply
        let png_icon = temp_dir.join("sample.png");
        let mut sample_img = image::RgbaImage::new(16, 16);
        for pixel in sample_img.pixels_mut() {
            *pixel = image::Rgba([10, 150, 200, 255]);
        }
        sample_img.save(&png_icon).unwrap();

        desktop_ini::write_icon_resource(&temp_dir, png_icon.to_str().unwrap()).unwrap();

        let preview_custom = get_folder_current_icon_preview(temp_dir.to_str().unwrap().to_string()).unwrap();
        assert!(preview_custom.has_custom_icon);
        assert!(preview_custom.icon_path.is_some());
        assert!(preview_custom.preview_data_url.starts_with("data:image/png;base64,"));

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
