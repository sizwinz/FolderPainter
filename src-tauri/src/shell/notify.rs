use std::path::Path;

#[cfg(windows)]
use windows::Win32::UI::Shell::{SHCNE_UPDATEDIR, SHCNF_PATHW, SHChangeNotify};
#[cfg(windows)]
use windows::core::HSTRING;

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
