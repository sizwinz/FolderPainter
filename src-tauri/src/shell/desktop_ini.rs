use std::fs;
use std::io::Result;
use std::path::Path;

#[cfg(windows)]
use windows::Win32::Storage::FileSystem::{
    FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_NORMAL, FILE_ATTRIBUTE_SYSTEM, GetFileAttributesW,
    INVALID_FILE_ATTRIBUTES, SetFileAttributesW,
};
#[cfg(windows)]
use windows::core::HSTRING;

pub fn read_icon_resource(folder: &Path) -> Result<Option<String>> {
    let ini_path = folder.join("desktop.ini");
    if !ini_path.exists() {
        return Ok(None);
    }

    let content = match fs::read_to_string(&ini_path) {
        Ok(s) => s,
        Err(_) => {
            let bytes = fs::read(&ini_path)?;
            String::from_utf8_lossy(&bytes).to_string()
        }
    };

    let mut in_shell_class_info = false;
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            in_shell_class_info = trimmed.eq_ignore_ascii_case("[.ShellClassInfo]");
            continue;
        }

        if in_shell_class_info {
            if let Some(val) = trimmed.strip_prefix("IconResource=") {
                let path = val.split(',').next().unwrap_or(val).trim();
                return Ok(Some(path.to_string()));
            }
            if let Some(val) = trimmed.strip_prefix("IconFile=") {
                return Ok(Some(val.trim().to_string()));
            }
        }
    }

    Ok(None)
}

pub fn write_icon_resource(folder: &Path, icon_path: &str) -> Result<()> {
    let ini_path = folder.join("desktop.ini");

    #[cfg(windows)]
    prepare_file_for_write(&ini_path);

    let mut lines: Vec<String> = if ini_path.exists() {
        match fs::read_to_string(&ini_path) {
            Ok(s) => s.lines().map(|l| l.to_string()).collect(),
            Err(_) => {
                let bytes = fs::read(&ini_path)?;
                String::from_utf8_lossy(&bytes)
                    .lines()
                    .map(|l| l.to_string())
                    .collect()
            }
        }
    } else {
        Vec::new()
    };

    let mut section_start: Option<usize> = None;
    let mut section_end: Option<usize> = None;
    let mut icon_resource_idx: Option<usize> = None;

    for (i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            if trimmed.eq_ignore_ascii_case("[.ShellClassInfo]") {
                section_start = Some(i);
            } else if section_start.is_some() && section_end.is_none() {
                section_end = Some(i);
            }
        } else if section_start.is_some() && section_end.is_none() {
            if trimmed.starts_with("IconResource=") || trimmed.starts_with("IconFile=") {
                icon_resource_idx = Some(i);
            }
        }
    }

    let icon_entry = format!("IconResource={},0", icon_path);

    if let Some(idx) = icon_resource_idx {
        lines[idx] = icon_entry;
    } else if let Some(start) = section_start {
        lines.insert(start + 1, icon_entry);
    } else {
        if !lines.is_empty() && !lines.last().unwrap().is_empty() {
            lines.push(String::new());
        }
        lines.push("[.ShellClassInfo]".to_string());
        lines.push(icon_entry);
    }

    let output = lines.join("\r\n") + "\r\n";
    fs::write(&ini_path, output)?;

    #[cfg(windows)]
    apply_desktop_ini_attributes(&ini_path);

    Ok(())
}

pub fn remove_icon_resource(folder: &Path) -> Result<bool> {
    let ini_path = folder.join("desktop.ini");
    if !ini_path.exists() {
        return Ok(false);
    }

    #[cfg(windows)]
    prepare_file_for_write(&ini_path);

    let content = match fs::read_to_string(&ini_path) {
        Ok(s) => s,
        Err(_) => {
            let bytes = fs::read(&ini_path)?;
            String::from_utf8_lossy(&bytes).to_string()
        }
    };

    let mut lines: Vec<String> = Vec::new();
    let mut in_shell_class = false;
    let mut modified = false;

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            in_shell_class = trimmed.eq_ignore_ascii_case("[.ShellClassInfo]");
            lines.push(line.to_string());
            continue;
        }

        if in_shell_class {
            if trimmed.starts_with("IconResource=")
                || trimmed.starts_with("IconFile=")
                || trimmed.starts_with("IconIndex=")
            {
                modified = true;
                continue;
            }
        }

        lines.push(line.to_string());
    }

    let non_empty_lines: Vec<&String> = lines.iter().filter(|l| !l.trim().is_empty()).collect();
    let only_shell_header = non_empty_lines.len() == 1
        && non_empty_lines[0]
            .trim()
            .eq_ignore_ascii_case("[.ShellClassInfo]");

    if non_empty_lines.is_empty() || only_shell_header {
        let _ = fs::remove_file(&ini_path);
    } else {
        let output = lines.join("\r\n") + "\r\n";
        fs::write(&ini_path, output)?;
        #[cfg(windows)]
        apply_desktop_ini_attributes(&ini_path);
    }

    Ok(modified)
}

#[cfg(windows)]
fn prepare_file_for_write(path: &Path) {
    if !path.exists() {
        return;
    }
    let wide = HSTRING::from(path.as_os_str());
    unsafe {
        let attrs = GetFileAttributesW(&wide);
        if attrs != INVALID_FILE_ATTRIBUTES {
            let _ = SetFileAttributesW(&wide, FILE_ATTRIBUTE_NORMAL);
        }
    }
}

#[cfg(windows)]
fn apply_desktop_ini_attributes(path: &Path) {
    let wide = HSTRING::from(path.as_os_str());
    unsafe {
        let _ = SetFileAttributesW(&wide, FILE_ATTRIBUTE_HIDDEN | FILE_ATTRIBUTE_SYSTEM);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_merge_icon_resource_preserves_existing_sections() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_folder_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();
        let ini_path = temp_dir.join("desktop.ini");
        fs::write(&ini_path, "[ViewState]\r\nMode=\r\nVid=\r\n").unwrap();

        write_icon_resource(&temp_dir, r"C:\Icons\custom.ico").unwrap();

        let content = fs::read_to_string(&ini_path).unwrap();
        assert!(
            content.contains("[ViewState]"),
            "ViewState section should be preserved"
        );
        assert!(
            content.contains("[.ShellClassInfo]"),
            ".ShellClassInfo section should be added"
        );
        assert!(
            content.contains(r"IconResource=C:\Icons\custom.ico,0"),
            "IconResource should be set"
        );

        let current = read_icon_resource(&temp_dir).unwrap();
        assert_eq!(current, Some(r"C:\Icons\custom.ico".to_string()));

        let removed = remove_icon_resource(&temp_dir).unwrap();
        assert!(removed);
        let after_removal = fs::read_to_string(&ini_path).unwrap();
        assert!(after_removal.contains("[ViewState]"));
        assert!(!after_removal.contains("IconResource="));

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
