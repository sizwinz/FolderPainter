use std::path::Path;

#[cfg(windows)]
use windows::core::HSTRING;
#[cfg(windows)]
use windows::Win32::UI::Shell::{SHChangeNotify, SHCNE_UPDATEDIR, SHCNF_PATHW};

pub fn refresh_folder(folder: &Path) {
    #[cfg(windows)]
    {
        let wide = HSTRING::from(folder.as_os_str());
        unsafe {
            SHChangeNotify(
                SHCNE_UPDATEDIR,
                SHCNF_PATHW,
                Some(wide.as_ptr() as *const _),
                None,
            );
        }
    }
}
