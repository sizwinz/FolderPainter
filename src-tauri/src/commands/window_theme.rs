#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum ThemeMode {
    Light,
    Dark,
}

pub fn parse_theme(input: &str) -> Result<ThemeMode, String> {
    match input.trim().to_lowercase().as_str() {
        "dark" => Ok(ThemeMode::Dark),
        "light" => Ok(ThemeMode::Light),
        other => Err(format!("Unsupported theme: {}", other)),
    }
}

#[tauri::command]
pub async fn set_window_theme(window: tauri::Window, theme: String) -> Result<(), String> {
    let mode = parse_theme(&theme)?;

    let tauri_theme = match mode {
        ThemeMode::Dark => tauri::Theme::Dark,
        ThemeMode::Light => tauri::Theme::Light,
    };
    let _ = window.set_theme(Some(tauri_theme));

    #[cfg(target_os = "windows")]
    {
        use windows::Win32::Foundation::HWND;
        use windows::Win32::Graphics::Dwm::{
            DWMWA_USE_IMMERSIVE_DARK_MODE, DWMWINDOWATTRIBUTE, DwmSetWindowAttribute,
        };

        if let Ok(raw_hwnd) = window.hwnd() {
            let hwnd = HWND(raw_hwnd.0 as _);
            let is_dark: i32 = if mode == ThemeMode::Dark { 1 } else { 0 };

            unsafe {
                let _ = DwmSetWindowAttribute(
                    hwnd,
                    DWMWA_USE_IMMERSIVE_DARK_MODE,
                    &is_dark as *const _ as *const _,
                    std::mem::size_of::<i32>() as u32,
                );

                const DWMWA_USE_IMMERSIVE_DARK_MODE_OLD: i32 = 19;
                let _ = DwmSetWindowAttribute(
                    hwnd,
                    DWMWINDOWATTRIBUTE(DWMWA_USE_IMMERSIVE_DARK_MODE_OLD),
                    &is_dark as *const _ as *const _,
                    std::mem::size_of::<i32>() as u32,
                );
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_theme_valid() {
        assert_eq!(parse_theme("dark").unwrap(), ThemeMode::Dark);
        assert_eq!(parse_theme("light").unwrap(), ThemeMode::Light);
        assert!(parse_theme("invalid").is_err());
    }
}
