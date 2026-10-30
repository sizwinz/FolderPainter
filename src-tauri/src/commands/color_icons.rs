use image::imageops::FilterType;
use image::{ExtendedColorType, ImageEncoder, Rgba, RgbaImage, codecs::png::PngEncoder};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresetColor {
    pub name: String,
    pub hex: String,
    pub hue: f32,
    pub saturation: f32,
    pub lightness: f32,
}

#[tauri::command]
pub fn list_preset_colors() -> Vec<PresetColor> {
    vec![
        PresetColor {
            name: "Crimson Red".to_string(),
            hex: "#E53935".to_string(),
            hue: 356.0,
            saturation: 0.79,
            lightness: 0.55,
        },
        PresetColor {
            name: "Amber Orange".to_string(),
            hex: "#FB8C00".to_string(),
            hue: 33.0,
            saturation: 1.0,
            lightness: 0.49,
        },
        PresetColor {
            name: "Sunflower Yellow".to_string(),
            hex: "#FDD835".to_string(),
            hue: 48.0,
            saturation: 0.98,
            lightness: 0.60,
        },
        PresetColor {
            name: "Emerald Green".to_string(),
            hex: "#43A047".to_string(),
            hue: 123.0,
            saturation: 0.41,
            lightness: 0.45,
        },
        PresetColor {
            name: "Teal Mint".to_string(),
            hex: "#00897B".to_string(),
            hue: 174.0,
            saturation: 1.0,
            lightness: 0.27,
        },
        PresetColor {
            name: "Sky Azure".to_string(),
            hex: "#039BE5".to_string(),
            hue: 199.0,
            saturation: 0.97,
            lightness: 0.45,
        },
        PresetColor {
            name: "Cobalt Blue".to_string(),
            hex: "#1E88E5".to_string(),
            hue: 208.0,
            saturation: 0.79,
            lightness: 0.51,
        },
        PresetColor {
            name: "Royal Indigo".to_string(),
            hex: "#3949AB".to_string(),
            hue: 232.0,
            saturation: 0.50,
            lightness: 0.45,
        },
        PresetColor {
            name: "Vibrant Violet".to_string(),
            hex: "#8E24AA".to_string(),
            hue: 287.0,
            saturation: 0.65,
            lightness: 0.40,
        },
        PresetColor {
            name: "Rose Pink".to_string(),
            hex: "#D81B60".to_string(),
            hue: 338.0,
            saturation: 0.78,
            lightness: 0.48,
        },
        PresetColor {
            name: "Warm Brown".to_string(),
            hex: "#6D4C41".to_string(),
            hue: 14.0,
            saturation: 0.25,
            lightness: 0.34,
        },
        PresetColor {
            name: "Slate Gray".to_string(),
            hex: "#546E7A".to_string(),
            hue: 200.0,
            saturation: 0.19,
            lightness: 0.40,
        },
        PresetColor {
            name: "Graphite Black".to_string(),
            hex: "#212121".to_string(),
            hue: 0.0,
            saturation: 0.0,
            lightness: 0.16,
        },
    ]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedIconResult {
    pub icon_path: String,
    pub preview_data_url: String,
}

#[tauri::command]
pub fn get_default_folder_preview() -> Result<String, String> {
    let img = render_folder_canvas(48.0, 0.98, 0.60);
    encode_png_data_url(&img)
}

#[tauri::command]
pub fn generate_color_icon(
    hue: f32,
    saturation: f32,
    lightness: f32,
) -> Result<GeneratedIconResult, String> {
    let base_dir = get_icons_cache_dir()?;
    let h_int = (hue.clamp(0.0, 360.0) * 10.0).round() as u32;
    let s_int = (saturation.clamp(0.0, 1.0) * 100.0).round() as u32;
    let l_int = (lightness.clamp(0.0, 1.0) * 100.0).round() as u32;

    let filename = format!("folder_h{}_s{}_l{}.ico", h_int, s_int, l_int);
    let output_path = base_dir.join(filename);

    let img256 = render_folder_canvas(hue, saturation, lightness);
    let preview_data_url = encode_png_data_url(&img256)?;

    if !output_path.exists() {
        let ico_bytes = encode_multi_res_ico(&img256)
            .map_err(|e| format!("Failed to encode ICO file: {}", e))?;
        fs::write(&output_path, ico_bytes)
            .map_err(|e| format!("Failed to write icon file: {}", e))?;
    }

    Ok(GeneratedIconResult {
        icon_path: output_path.to_string_lossy().to_string(),
        preview_data_url,
    })
}

pub fn get_icons_cache_dir() -> Result<PathBuf, String> {
    let base = dirs::data_local_dir()
        .unwrap_or_else(|| std::env::temp_dir())
        .join("FolderPainter")
        .join("icons");

    if !base.exists() {
        fs::create_dir_all(&base)
            .map_err(|e| format!("Failed to create icons directory: {}", e))?;
    }
    Ok(base)
}

fn hsl_to_rgb(h: f32, s: f32, l: f32) -> (u8, u8, u8) {
    let h = (h % 360.0 + 360.0) % 360.0;
    let s = s.clamp(0.0, 1.0);
    let l = l.clamp(0.0, 1.0);

    let c = (1.0 - (2.0 * l - 1.0).abs()) * s;
    let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs());
    let m = l - c / 2.0;

    let (r_prime, g_prime, b_prime) = if h < 60.0 {
        (c, x, 0.0)
    } else if h < 120.0 {
        (x, c, 0.0)
    } else if h < 180.0 {
        (0.0, c, x)
    } else if h < 240.0 {
        (0.0, x, c)
    } else if h < 300.0 {
        (x, 0.0, c)
    } else {
        (c, 0.0, x)
    };

    (
        ((r_prime + m) * 255.0).round() as u8,
        ((g_prime + m) * 255.0).round() as u8,
        ((b_prime + m) * 255.0).round() as u8,
    )
}

pub fn render_folder_canvas(hue: f32, saturation: f32, lightness: f32) -> RgbaImage {
    let width = 256;
    let height = 256;
    let mut img = RgbaImage::new(width, height);

    let back_rgb = hsl_to_rgb(hue, saturation * 0.95, (lightness - 0.12).clamp(0.05, 0.95));
    let tab_rgb = hsl_to_rgb(hue, saturation * 0.90, (lightness - 0.08).clamp(0.05, 0.95));
    let slot_rgb = hsl_to_rgb(hue, saturation * 0.30, 0.92);

    // 1. Draw back tab and back plate
    for y in 0..height {
        for x in 0..width {
            let px = x as f32;
            let py = y as f32;

            // Back tab (x: 24..112, y: 38..74)
            let in_tab = px >= 24.0 && px <= 112.0 && py >= 38.0 && py <= 74.0;
            // Back body (x: 24..232, y: 56..216)
            let in_back = px >= 24.0 && px <= 232.0 && py >= 56.0 && py <= 216.0;

            if in_tab || in_back {
                let color = if in_tab && py < 56.0 {
                    tab_rgb
                } else {
                    back_rgb
                };
                img.put_pixel(x, y, Rgba([color.0, color.1, color.2, 255]));
            }
        }
    }

    // 2. Interior slot/paper sheet peeking through
    for y in 66..88 {
        for x in 38..218 {
            img.put_pixel(x, y, Rgba([slot_rgb.0, slot_rgb.1, slot_rgb.2, 240]));
        }
    }

    // 3. Drop shadow under front cover (y: 220..232)
    for y in 220..232 {
        for x in 24..232 {
            let dist_y = (y - 220) as f32;
            let alpha = ((1.0 - dist_y / 12.0) * 80.0) as u8;
            let curr = img.get_pixel(x, y);
            if curr[3] == 0 {
                img.put_pixel(x, y, Rgba([0, 0, 0, alpha]));
            }
        }
    }

    // 4. Draw front cover with rounded corners and gradient
    let front_left = 20.0;
    let front_right = 236.0;
    let front_top = 82.0;
    let front_bottom = 222.0;
    let corner_radius = 16.0;

    for y in 82..224 {
        for x in 20..238 {
            let px = x as f32;
            let py = y as f32;

            let in_bounds =
                px >= front_left && px <= front_right && py >= front_top && py <= front_bottom;
            if !in_bounds {
                continue;
            }

            let mut corner_dist_sq = 0.0;
            let is_top_left = px < front_left + corner_radius && py < front_top + corner_radius;
            let is_top_right = px > front_right - corner_radius && py < front_top + corner_radius;
            let is_bottom_left =
                px < front_left + corner_radius && py > front_bottom - corner_radius;
            let is_bottom_right =
                px > front_right - corner_radius && py > front_bottom - corner_radius;

            if is_top_left {
                let dx = px - (front_left + corner_radius);
                let dy = py - (front_top + corner_radius);
                corner_dist_sq = dx * dx + dy * dy;
            } else if is_top_right {
                let dx = px - (front_right - corner_radius);
                let dy = py - (front_top + corner_radius);
                corner_dist_sq = dx * dx + dy * dy;
            } else if is_bottom_left {
                let dx = px - (front_left + corner_radius);
                let dy = py - (front_bottom - corner_radius);
                corner_dist_sq = dx * dx + dy * dy;
            } else if is_bottom_right {
                let dx = px - (front_right - corner_radius);
                let dy = py - (front_bottom - corner_radius);
                corner_dist_sq = dx * dx + dy * dy;
            }

            if corner_dist_sq <= corner_radius * corner_radius {
                let progress_y = (py - front_top) / (front_bottom - front_top);
                let grad_l = (lightness + (0.06 - progress_y * 0.12)).clamp(0.05, 0.95);
                let rgb = hsl_to_rgb(hue, saturation, grad_l);

                // Top bevel highlight
                let final_rgb = if py <= front_top + 2.0 {
                    (
                        ((rgb.0 as f32 * 0.8 + 255.0 * 0.2).min(255.0)) as u8,
                        ((rgb.1 as f32 * 0.8 + 255.0 * 0.2).min(255.0)) as u8,
                        ((rgb.2 as f32 * 0.8 + 255.0 * 0.2).min(255.0)) as u8,
                    )
                } else {
                    rgb
                };

                img.put_pixel(x, y, Rgba([final_rgb.0, final_rgb.1, final_rgb.2, 255]));
            }
        }
    }

    img
}

pub fn encode_multi_res_ico(source_256: &RgbaImage) -> Result<Vec<u8>, image::ImageError> {
    let sizes = [256u32, 48, 32, 16];
    let mut png_buffers: Vec<(u32, Vec<u8>)> = Vec::new();

    for &size in &sizes {
        let resized = if size == 256 {
            source_256.clone()
        } else {
            image::imageops::resize(source_256, size, size, FilterType::Lanczos3)
        };

        let mut buf = Vec::new();
        let encoder = PngEncoder::new(&mut buf);
        encoder.write_image(resized.as_raw(), size, size, ExtendedColorType::Rgba8)?;

        png_buffers.push((size, buf));
    }

    // Build ICO header + directory entries + data
    let mut ico = Vec::new();

    // 1. ICO header: reserved(2) = 0, type(2) = 1, count(2)
    ico.extend_from_slice(&0u16.to_le_bytes());
    ico.extend_from_slice(&1u16.to_le_bytes());
    ico.extend_from_slice(&(png_buffers.len() as u16).to_le_bytes());

    let header_size = 6 + (png_buffers.len() * 16);
    let mut current_offset = header_size as u32;

    // 2. Directory entries
    for (size, data) in &png_buffers {
        let width_byte = if *size >= 256 { 0 } else { *size as u8 };
        let height_byte = width_byte;
        let color_count = 0u8;
        let reserved = 0u8;
        let planes = 1u16;
        let bpp = 32u16;
        let bytes_in_res = data.len() as u32;

        ico.push(width_byte);
        ico.push(height_byte);
        ico.push(color_count);
        ico.push(reserved);
        ico.extend_from_slice(&planes.to_le_bytes());
        ico.extend_from_slice(&bpp.to_le_bytes());
        ico.extend_from_slice(&bytes_in_res.to_le_bytes());
        ico.extend_from_slice(&current_offset.to_le_bytes());

        current_offset += bytes_in_res;
    }

    // 3. Image payloads
    for (_, data) in &png_buffers {
        ico.extend_from_slice(data);
    }

    Ok(ico)
}

const BASE64_ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

pub fn base64_encode(bytes: &[u8]) -> String {
    let mut out = String::with_capacity((bytes.len() + 2) / 3 * 4);
    for chunk in bytes.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };

        out.push(BASE64_ALPHABET[(b0 >> 2) as usize] as char);
        out.push(BASE64_ALPHABET[(((b0 & 0x03) << 4) | (b1 >> 4)) as usize] as char);

        if chunk.len() > 1 {
            out.push(BASE64_ALPHABET[(((b1 & 0x0F) << 2) | (b2 >> 6)) as usize] as char);
        } else {
            out.push('=');
        }

        if chunk.len() > 2 {
            out.push(BASE64_ALPHABET[(b2 & 0x3F) as usize] as char);
        } else {
            out.push('=');
        }
    }
    out
}

pub fn encode_png_data_url(img: &RgbaImage) -> Result<String, String> {
    let mut buf = Vec::new();
    let encoder = PngEncoder::new(&mut buf);
    encoder
        .write_image(
            img.as_raw(),
            img.width(),
            img.height(),
            ExtendedColorType::Rgba8,
        )
        .map_err(|e| format!("PNG encode error: {}", e))?;

    let b64 = base64_encode(&buf);
    Ok(format!("data:image/png;base64,{}", b64))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;

    #[test]
    fn test_encode_png_data_url_valid() {
        let img = render_folder_canvas(48.0, 0.98, 0.60);
        let data_url = encode_png_data_url(&img).unwrap();
        assert!(data_url.starts_with("data:image/png;base64,"));
        assert!(data_url.len() > 100);
    }

    #[test]
    fn test_generate_color_icon_produces_valid_ico() {
        let res = generate_color_icon(210.0, 0.85, 0.55).unwrap();
        let icon_path = Path::new(&res.icon_path);

        assert!(icon_path.exists(), "Generated icon file should exist");
        assert!(res.preview_data_url.starts_with("data:image/png;base64,"));
        let bytes = fs::read(icon_path).unwrap();
        assert!(bytes.len() > 100, "ICO file should contain icon data");
        assert_eq!(
            &bytes[0..4],
            &[0x00, 0x00, 0x01, 0x00],
            "Should have valid ICO header"
        );

        let presets = list_preset_colors();
        assert_eq!(presets.len(), 13, "Should have 13 preset colors");

        let _ = fs::remove_file(icon_path);
    }
}
