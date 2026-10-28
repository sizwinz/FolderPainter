use std::io::{Error, ErrorKind, Result};
use std::path::Path;

#[cfg(windows)]
use windows::Win32::Storage::FileSystem::{
    FILE_ATTRIBUTE_READONLY, FILE_ATTRIBUTE_SYSTEM, FILE_FLAGS_AND_ATTRIBUTES, GetFileAttributesW,
    INVALID_FILE_ATTRIBUTES, SetFileAttributesW,
};
#[cfg(windows)]
use windows::core::HSTRING;

pub fn set_folder_system(folder: &Path) -> Result<()> {
    if !folder.exists() {
        return Err(Error::new(ErrorKind::NotFound, "Folder does not exist"));
    }

    #[cfg(windows)]
    {
        let wide = HSTRING::from(folder.as_os_str());
        unsafe {
            let attrs = GetFileAttributesW(&wide);
            if attrs == INVALID_FILE_ATTRIBUTES {
                return Err(Error::last_os_error());
            }

            let new_attrs = FILE_FLAGS_AND_ATTRIBUTES(
                attrs | FILE_ATTRIBUTE_SYSTEM.0 | FILE_ATTRIBUTE_READONLY.0,
            );
            SetFileAttributesW(&wide, new_attrs)
                .map_err(|e| Error::new(ErrorKind::Other, e.to_string()))?;
        }
    }

    Ok(())
}

pub fn clear_folder_system(folder: &Path) -> Result<()> {
    if !folder.exists() {
        return Ok(());
    }

    #[cfg(windows)]
    {
        let wide = HSTRING::from(folder.as_os_str());
        unsafe {
            let attrs = GetFileAttributesW(&wide);
            if attrs != INVALID_FILE_ATTRIBUTES {
                let new_attrs = FILE_FLAGS_AND_ATTRIBUTES(
                    attrs & !(FILE_ATTRIBUTE_SYSTEM.0 | FILE_ATTRIBUTE_READONLY.0),
                );
                let _ = SetFileAttributesW(&wide, new_attrs);
            }
        }
    }

    Ok(())
}
