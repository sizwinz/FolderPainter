use crate::commands::color_icons::{encode_multi_res_ico, encode_png_data_url};
use image::RgbaImage;
use image::imageops::FilterType;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConvertedIconResult {
    pub icon_path: String,
    pub preview_data_url: String,
}

#[tauri::command]
pub fn convert_image_to_icon(image_path: String) -> Result<ConvertedIconResult, String> {
    let path = Path::new(&image_path);
    if !path.exists() {
        return Err(format!("Image file does not exist: {}", image_path));
    }

    let img = image::open(path).map_err(|e| format!("Failed to read image file: {}", e))?;
    let rgba = img.to_rgba8();

    // Fit image into a square 256x256 canvas preserving aspect ratio
    let target_size = 256u32;
    let (orig_w, orig_h) = rgba.dimensions();

    let (scaled_w, scaled_h) = if orig_w == orig_h {
        (target_size, target_size)
    } else if orig_w > orig_h {
        let h = ((orig_h as f32 / orig_w as f32) * target_size as f32).round() as u32;
        (target_size, h.max(1))
    } else {
        let w = ((orig_w as f32 / orig_h as f32) * target_size as f32).round() as u32;
        (w.max(1), target_size)
    };

    let resized = image::imageops::resize(&rgba, scaled_w, scaled_h, FilterType::Lanczos3);

    let mut canvas = RgbaImage::new(target_size, target_size);
    let offset_x = (target_size - scaled_w) / 2;
    let offset_y = (target_size - scaled_h) / 2;

    image::imageops::overlay(&mut canvas, &resized, offset_x as i64, offset_y as i64);

    let custom_dir = get_custom_icons_dir()?;
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("custom_icon");

    // Clean stem to safe characters
    let safe_stem: String = stem
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
        .collect();

    let safe_stem = if safe_stem.is_empty() {
        "custom_icon".to_string()
    } else {
        safe_stem
    };

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let filename = format!("{}_{:x}.ico", safe_stem, timestamp);
    let out_path = custom_dir.join(filename);

    let ico_bytes = encode_multi_res_ico(&canvas)
        .map_err(|e| format!("Failed to encode converted icon: {}", e))?;

    fs::write(&out_path, ico_bytes).map_err(|e| format!("Failed to write icon file: {}", e))?;

    let preview_data_url = encode_png_data_url(&canvas)?;

    Ok(ConvertedIconResult {
        icon_path: out_path.to_string_lossy().to_string(),
        preview_data_url,
    })
}

#[tauri::command]
pub fn get_icon_preview_data_url(icon_path: String) -> Result<String, String> {
    let path = Path::new(&icon_path);
    if !path.exists() {
        return Err(format!("Icon file does not exist: {}", icon_path));
    }
    let img = image::open(path).map_err(|e| format!("Failed to read icon file: {}", e))?;
    let rgba = img.to_rgba8();
    encode_png_data_url(&rgba)
}

pub fn get_custom_icons_dir() -> Result<PathBuf, String> {
    let base = dirs::data_local_dir()
        .unwrap_or_else(|| std::env::temp_dir())
        .join("FolderPainter")
        .join("custom_icons");

    if !base.exists() {
        fs::create_dir_all(&base)
            .map_err(|e| format!("Failed to create custom icons directory: {}", e))?;
    }
    Ok(base)
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{Rgba, RgbaImage};
    use std::fs;
    use std::path::Path;

    #[test]
    fn test_convert_png_to_valid_ico() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_convert_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();

        let png_path = temp_dir.join("input.png");
        let mut sample_img = RgbaImage::new(100, 100);
        for pixel in sample_img.pixels_mut() {
            *pixel = Rgba([255, 100, 50, 255]);
        }
        sample_img.save(&png_path).unwrap();

        let res = convert_image_to_icon(png_path.to_str().unwrap().to_string()).unwrap();
        let ico_path = Path::new(&res.icon_path);

        assert!(ico_path.exists(), "Converted icon should exist");
        assert!(res.preview_data_url.starts_with("data:image/png;base64,"));
        let bytes = fs::read(ico_path).unwrap();
        assert!(bytes.len() > 100, "ICO file should contain icon data");
        assert_eq!(
            &bytes[0..4],
            &[0x00, 0x00, 0x01, 0x00],
            "Should have valid ICO header"
        );

        let _ = fs::remove_dir_all(&temp_dir);
        let _ = fs::remove_file(ico_path);
    }

    #[test]
    fn test_get_icon_preview_data_url() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_preview_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();
        let png_path = temp_dir.join("sample.png");
        let sample_img = RgbaImage::new(32, 32);
        sample_img.save(&png_path).unwrap();

        let preview = get_icon_preview_data_url(png_path.to_str().unwrap().to_string()).unwrap();
        assert!(preview.starts_with("data:image/png;base64,"));

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
