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

pub const DEFAULT_WINDOWS_FOLDER_PNG: &[u8] = include_bytes!("../../assets/windows_default_folder.png");

// 13 Authentic Windows 11 Presets extracted from FolderIco
pub const ICO_YELLOW: &[u8] = include_bytes!("../../assets/windows11_folders/yellow.ico");
pub const PNG_YELLOW: &[u8] = include_bytes!("../../assets/windows11_folders/yellow.png");

pub const ICO_AZURE: &[u8] = include_bytes!("../../assets/windows11_folders/azure.ico");
pub const PNG_AZURE: &[u8] = include_bytes!("../../assets/windows11_folders/azure.png");

pub const ICO_BLACK: &[u8] = include_bytes!("../../assets/windows11_folders/black.ico");
pub const PNG_BLACK: &[u8] = include_bytes!("../../assets/windows11_folders/black.png");

pub const ICO_BLUE: &[u8] = include_bytes!("../../assets/windows11_folders/blue.ico");
pub const PNG_BLUE: &[u8] = include_bytes!("../../assets/windows11_folders/blue.png");

pub const ICO_BROWN: &[u8] = include_bytes!("../../assets/windows11_folders/brown.ico");
pub const PNG_BROWN: &[u8] = include_bytes!("../../assets/windows11_folders/brown.png");

pub const ICO_GRAY: &[u8] = include_bytes!("../../assets/windows11_folders/gray.ico");
pub const PNG_GRAY: &[u8] = include_bytes!("../../assets/windows11_folders/gray.png");

pub const ICO_GREEN: &[u8] = include_bytes!("../../assets/windows11_folders/green.ico");
pub const PNG_GREEN: &[u8] = include_bytes!("../../assets/windows11_folders/green.png");

pub const ICO_LEMON: &[u8] = include_bytes!("../../assets/windows11_folders/lemon.ico");
pub const PNG_LEMON: &[u8] = include_bytes!("../../assets/windows11_folders/lemon.png");

pub const ICO_ORANGE: &[u8] = include_bytes!("../../assets/windows11_folders/orange.ico");
pub const PNG_ORANGE: &[u8] = include_bytes!("../../assets/windows11_folders/orange.png");

pub const ICO_PINK: &[u8] = include_bytes!("../../assets/windows11_folders/pink.ico");
pub const PNG_PINK: &[u8] = include_bytes!("../../assets/windows11_folders/pink.png");

pub const ICO_RED: &[u8] = include_bytes!("../../assets/windows11_folders/red.ico");
pub const PNG_RED: &[u8] = include_bytes!("../../assets/windows11_folders/red.png");

pub const ICO_VIOLET: &[u8] = include_bytes!("../../assets/windows11_folders/violet.ico");
pub const PNG_VIOLET: &[u8] = include_bytes!("../../assets/windows11_folders/violet.png");

pub const ICO_WHITE: &[u8] = include_bytes!("../../assets/windows11_folders/white.ico");
pub const PNG_WHITE: &[u8] = include_bytes!("../../assets/windows11_folders/white.png");

pub fn get_authentic_preset(hue: f32, sat: f32, lit: f32) -> Option<(&'static [u8], &'static [u8])> {
    let h_int = (hue.clamp(0.0, 360.0) * 10.0).round() as u32;
    let s_int = (sat.clamp(0.0, 1.0) * 100.0).round() as u32;
    let l_int = (lit.clamp(0.0, 1.0) * 100.0).round() as u32;

    if (h_int >= 460 && h_int <= 500) && s_int >= 90 && l_int >= 55 {
        return Some((ICO_YELLOW, PNG_YELLOW));
    }
    if (h_int >= 1950 && h_int <= 2040) && s_int >= 90 && l_int >= 40 && l_int <= 50 {
        return Some((ICO_AZURE, PNG_AZURE));
    }
    if (h_int >= 2050 && h_int <= 2150) && s_int >= 70 && l_int >= 45 && l_int <= 55 {
        return Some((ICO_BLUE, PNG_BLUE));
    }
    if (h_int >= 1180 && h_int <= 1300) && s_int >= 35 && s_int <= 50 && l_int >= 40 && l_int <= 50 {
        return Some((ICO_GREEN, PNG_GREEN));
    }
    if (h_int >= 800 && h_int <= 950) && s_int >= 40 && s_int <= 60 && l_int >= 40 && l_int <= 55 {
        return Some((ICO_LEMON, PNG_LEMON));
    }
    if (h_int >= 280 && h_int <= 380) && s_int >= 90 && l_int >= 45 && l_int <= 55 {
        return Some((ICO_ORANGE, PNG_ORANGE));
    }
    if (h_int >= 3500 || h_int <= 100) && s_int >= 70 && l_int >= 50 && l_int <= 60 {
        return Some((ICO_RED, PNG_RED));
    }
    if (h_int >= 3300 && h_int <= 3450) && s_int >= 70 && l_int >= 42 && l_int <= 54 {
        return Some((ICO_PINK, PNG_PINK));
    }
    if (h_int >= 2800 && h_int <= 2950) && s_int >= 55 && s_int <= 75 && l_int >= 35 && l_int <= 45 {
        return Some((ICO_VIOLET, PNG_VIOLET));
    }
    if (h_int >= 100 && h_int <= 180) && s_int <= 30 && l_int >= 28 && l_int <= 40 {
        return Some((ICO_BROWN, PNG_BROWN));
    }
    if (h_int >= 1900 && h_int <= 2100) && s_int <= 25 && l_int >= 35 && l_int <= 45 {
        return Some((ICO_GRAY, PNG_GRAY));
    }
    if s_int <= 5 && l_int <= 20 {
        return Some((ICO_BLACK, PNG_BLACK));
    }
    if s_int <= 25 && l_int >= 88 {
        return Some((ICO_WHITE, PNG_WHITE));
    }

    None
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedIconResult {
    pub icon_path: String,
    pub preview_data_url: String,
}

#[tauri::command]
pub fn get_default_folder_preview() -> Result<String, String> {
    let b64 = base64_encode(DEFAULT_WINDOWS_FOLDER_PNG);
    Ok(format!("data:image/png;base64,{}", b64))
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

    if let Some((ico_bytes, png_bytes)) = get_authentic_preset(hue, saturation, lightness) {
        if !output_path.exists() {
            fs::write(&output_path, ico_bytes)
                .map_err(|e| format!("Failed to write icon file: {}", e))?;
        }
        let b64 = base64_encode(png_bytes);
        return Ok(GeneratedIconResult {
            icon_path: output_path.to_string_lossy().to_string(),
            preview_data_url: format!("data:image/png;base64,{}", b64),
        });
    }

    let img256 = tint_windows_folder(hue, saturation, lightness);
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

fn rgb_to_hsl(r: u8, g: u8, b: u8) -> (f32, f32, f32) {
    let rf = r as f32 / 255.0;
    let gf = g as f32 / 255.0;
    let bf = b as f32 / 255.0;

    let max = rf.max(gf).max(bf);
    let min = rf.min(gf).min(bf);
    let delta = max - min;

    let l = (max + min) / 2.0;

    if delta == 0.0 {
        return (0.0, 0.0, l);
    }

    let s = if l <= 0.5 {
        delta / (max + min)
    } else {
        delta / (2.0 - max - min)
    };

    let h = if max == rf {
        let seg = (gf - bf) / delta;
        60.0 * (if seg < 0.0 { seg + 6.0 } else { seg })
    } else if max == gf {
        60.0 * (((bf - rf) / delta) + 2.0)
    } else {
        60.0 * (((rf - gf) / delta) + 4.0)
    };

    (h.rem_euclid(360.0), s.clamp(0.0, 1.0), l.clamp(0.0, 1.0))
}

pub fn tint_windows_folder(target_hue: f32, target_sat: f32, target_lit: f32) -> RgbaImage {
    // If it matches an authentic preset exactly, return its decoded RGBA image directly
    if let Some((_, png_bytes)) = get_authentic_preset(target_hue, target_sat, target_lit) {
        if let Ok(img) = image::load_from_memory(png_bytes) {
            return img.to_rgba8();
        }
    }

    let default_img = image::load_from_memory(DEFAULT_WINDOWS_FOLDER_PNG)
        .expect("Valid embedded windows_default_folder.png")
        .to_rgba8();

    let (width, height) = default_img.dimensions();
    let mut tinted = RgbaImage::new(width, height);

    let h_clamped = (target_hue % 360.0 + 360.0) % 360.0;
    let s_clamped = target_sat.clamp(0.0, 1.0);
    let l_clamped = target_lit.clamp(0.0, 1.0);

    for y in 0..height {
        for x in 0..width {
            let p = default_img.get_pixel(x, y);
            let alpha = p[3];
            if alpha == 0 {
                continue;
            }

            let (src_h, src_s, src_l) = rgb_to_hsl(p[0], p[1], p[2]);

            // Keep bottom drop shadows neutral
            if src_s < 0.12 && src_l < 0.25 {
                tinted.put_pixel(x, y, *p);
                continue;
            }

            // Authentic folder body tinting
            let hue_delta = src_h - 48.0;
            let new_h = (h_clamped + hue_delta).rem_euclid(360.0);

            let new_s = if s_clamped == 0.0 {
                0.0
            } else {
                (src_s * (s_clamped / 0.95)).clamp(0.0, 1.0)
            };

            let new_l = if l_clamped <= 0.60 {
                src_l * (l_clamped / 0.60)
            } else {
                src_l + (1.0 - src_l) * ((l_clamped - 0.60) / 0.40)
            }
            .clamp(0.0, 1.0);

            let (r, g, b) = hsl_to_rgb(new_h, new_s, new_l);
            tinted.put_pixel(x, y, Rgba([r, g, b, alpha]));
        }
    }

    tinted
}

pub fn render_folder_canvas(hue: f32, saturation: f32, lightness: f32) -> RgbaImage {
    tint_windows_folder(hue, saturation, lightness)
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

pub fn base64_decode(s: &str) -> Option<Vec<u8>> {
    let clean = s.trim();
    let mut table = [255u8; 256];
    for (i, &b) in b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
        .iter()
        .enumerate()
    {
        table[b as usize] = i as u8;
    }

    let mut out = Vec::new();
    let mut buffer = 0u32;
    let mut bits = 0;

    for &b in clean.as_bytes() {
        if b == b'=' {
            break;
        }
        if b.is_ascii_whitespace() {
            continue;
        }
        let val = table[b as usize];
        if val == 255 {
            return None;
        }
        buffer = (buffer << 6) | (val as u32);
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push((buffer >> bits) as u8);
        }
    }
    Some(out)
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
    fn test_tint_windows_folder_uses_default_icon_and_preserves_alpha_and_silhouette() {
        let tinted = tint_windows_folder(210.0, 0.85, 0.55);
        assert_eq!(tinted.width(), 256);
        assert_eq!(tinted.height(), 256);

        // Corner must be transparent (not a full canvas box)
        let corner_pixel = tinted.get_pixel(0, 0);
        assert_eq!(corner_pixel[3], 0, "Top-left corner must be transparent");

        // Front flap center must be opaque and tinted to blue
        let flap_pixel = tinted.get_pixel(128, 120);
        assert_eq!(flap_pixel[3], 255, "Folder flap must be opaque");
        assert!(flap_pixel[2] > flap_pixel[0], "Blue channel must dominate for 210 hue");

        // Authentic folder has no synthetic white paper slot at (100, 75)
        let slot_pixel = tinted.get_pixel(100, 75);
        assert!(slot_pixel[2] > slot_pixel[0], "Position (100, 75) must be folder body, not white paper");
    }

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
        let b64 = res.preview_data_url.split(',').nth(1).unwrap();
        let decoded_bytes = base64_decode(b64).expect("valid base64");
        let decoded = image::load_from_memory(&decoded_bytes).expect("load image").to_rgba8();
        assert_eq!(decoded.get_pixel(0, 0)[3], 0, "Top-left corner must be transparent");

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
