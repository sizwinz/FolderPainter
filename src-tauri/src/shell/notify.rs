use std::path::Path;

#[cfg(windows)]
use windows::Win32::UI::Shell::{
    SHCNE_ASSOCCHANGED, SHCNE_UPDATEDIR, SHCNE_UPDATEITEM, SHCNF_IDLIST, SHCNF_PATHW,
    SHChangeNotify,
};
#[cfg(windows)]
use windows::core::HSTRING;

pub fn refresh_folder(folder: &Path) {
    #[cfg(windows)]
    {
        let wide = HSTRING::from(folder.as_os_str());
        unsafe {
            // 1. Notify that the folder item itself changed its icon
            SHChangeNotify(
                SHCNE_UPDATEITEM,
                SHCNF_PATHW,
                Some(wide.as_ptr() as *const _),
                None,
            );

            // 2. Notify the directory itself
            SHChangeNotify(
                SHCNE_UPDATEDIR,
                SHCNF_PATHW,
                Some(wide.as_ptr() as *const _),
                None,
            );

            // 3. Notify the parent directory where the folder's icon is displayed
            if let Some(parent) = folder.parent() {
                let parent_wide = HSTRING::from(parent.as_os_str());
                SHChangeNotify(
                    SHCNE_UPDATEDIR,
                    SHCNF_PATHW,
                    Some(parent_wide.as_ptr() as *const _),
                    None,
                );
            }

            // 4. Invalidate global shell icon cache so Explorer redraws immediately
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
