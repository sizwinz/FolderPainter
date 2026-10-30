use std::path::Path;

#[cfg(windows)]
use windows::Win32::Foundation::CloseHandle;
#[cfg(windows)]
use windows::Win32::Storage::FileSystem::{
    CreateFileW, FILE_FLAG_BACKUP_SEMANTICS, FILE_SHARE_DELETE, FILE_SHARE_READ, FILE_SHARE_WRITE,
    FILE_WRITE_ATTRIBUTES, OPEN_EXISTING, SetFileTime,
};
#[cfg(windows)]
use windows::Win32::UI::Shell::{
    SHCNE_ASSOCCHANGED, SHCNE_ATTRIBUTES, SHCNE_UPDATEDIR, SHCNE_UPDATEITEM, SHCNF_IDLIST,
    SHCNF_PATHW, SHChangeNotify,
};
#[cfg(windows)]
use windows::core::HSTRING;

pub fn touch_directory_timestamp(folder: &Path) {
    #[cfg(windows)]
    {
        if folder.exists() {
            let wide = HSTRING::from(folder.as_os_str());
            unsafe {
                if let Ok(handle) = CreateFileW(
                    &wide,
                    FILE_WRITE_ATTRIBUTES.0,
                    FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
                    None,
                    OPEN_EXISTING,
                    FILE_FLAG_BACKUP_SEMANTICS,
                    None,
                ) {
                    let now = std::time::SystemTime::now();
                    if let Ok(duration) = now.duration_since(std::time::UNIX_EPOCH) {
                        let intervals = (duration.as_secs() + 11644473600) * 10_000_000
                            + (duration.subsec_nanos() as u64 / 100);
                        let file_time = windows::Win32::Foundation::FILETIME {
                            dwLowDateTime: (intervals & 0xFFFFFFFF) as u32,
                            dwHighDateTime: (intervals >> 32) as u32,
                        };
                        let _ = SetFileTime(handle, None, None, Some(&file_time));
                    }
                    let _ = CloseHandle(handle);
                }
            }
        }
    }
}

pub fn refresh_folder(folder: &Path) {
    #[cfg(windows)]
    {
        touch_directory_timestamp(folder);

        let wide = HSTRING::from(folder.as_os_str());
        unsafe {
            // 1. Notify that attributes changed (SYSTEM / READONLY)
            SHChangeNotify(
                SHCNE_ATTRIBUTES,
                SHCNF_PATHW,
                Some(wide.as_ptr() as *const _),
                None,
            );

            // 2. Notify that the folder item itself changed its icon
            SHChangeNotify(
                SHCNE_UPDATEITEM,
                SHCNF_PATHW,
                Some(wide.as_ptr() as *const _),
                None,
            );

            // 3. Notify the directory itself
            SHChangeNotify(
                SHCNE_UPDATEDIR,
                SHCNF_PATHW,
                Some(wide.as_ptr() as *const _),
                None,
            );

            // 4. Notify the parent directory where the folder's icon is displayed
            if let Some(parent) = folder.parent() {
                let parent_wide = HSTRING::from(parent.as_os_str());
                SHChangeNotify(
                    SHCNE_UPDATEDIR,
                    SHCNF_PATHW,
                    Some(parent_wide.as_ptr() as *const _),
                    None,
                );
            }

            // 5. Invalidate global shell icon cache so Explorer redraws immediately
            SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, None, None);
        }
    }
}

pub fn broadcast_icon_repair() {
    #[cfg(windows)]
    unsafe {
        SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, None, None);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_touch_directory_timestamp_executes() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_touch_folder_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();

        touch_directory_timestamp(&temp_dir);
        refresh_folder(&temp_dir);

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
