use crate::commands::color_icons::{
    encode_multi_res_ico, encode_png_data_url, get_icons_cache_dir, render_folder_canvas,
};
use image::imageops::FilterType;
use image::{Rgba, RgbaImage};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesignOptions {
    pub hue: f32,
    pub saturation: f32,
    pub lightness: f32,
    pub custom_cover_path: Option<String>,
    #[serde(default)]
    pub custom_cover_data_url: Option<String>,
    #[serde(default)]
    pub cover_fit_mode: Option<String>,
    #[serde(default)]
    pub cover_scale: Option<f32>,
    #[serde(default)]
    pub cover_offset_x: Option<f32>,
    #[serde(default)]
    pub cover_offset_y: Option<f32>,
    pub sticker_path: Option<String>,
    pub sticker_data_url: Option<String>,
    pub sticker_scale: f32,               // 0.15 to 0.95 (default 0.50)
    pub sticker_offset_x: f32,            // -100.0 to 100.0 pixels
    pub sticker_offset_y: f32,            // -100.0 to 100.0 pixels
    pub sticker_opacity: f32,             // 0.0 to 1.0 (default 1.0)
    pub sticker_tint_hex: Option<String>, // e.g. "#FFFFFF" or None
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesignedIconResult {
    pub icon_path: String,
    pub preview_data_url: String,
}

fn base64_decode(s: &str) -> Option<Vec<u8>> {
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

fn parse_hex_color(hex: &str) -> Option<(u8, u8, u8)> {
    let s = hex.trim().trim_start_matches('#');
    if s.len() == 6 {
        let r = u8::from_str_radix(&s[0..2], 16).ok()?;
        let g = u8::from_str_radix(&s[2..4], 16).ok()?;
        let b = u8::from_str_radix(&s[4..6], 16).ok()?;
        Some((r, g, b))
    } else if s.len() == 3 {
        let r = u8::from_str_radix(&s[0..1], 16).ok()? * 17;
        let g = u8::from_str_radix(&s[1..2], 16).ok()? * 17;
        let b = u8::from_str_radix(&s[2..3], 16).ok()? * 17;
        Some((r, g, b))
    } else {
        None
    }
}

fn simple_hash(s: &str) -> u64 {
    let mut h: u64 = 0xcbf29ce484222325;
    for b in s.as_bytes() {
        h ^= *b as u64;
        h = h.wrapping_mul(0x100000001b3);
    }
    h
}

fn is_in_front_flap(px: f32, py: f32) -> bool {
    let front_left = 16.0;
    let front_right = 240.0;
    let front_top = 62.0;
    let front_bottom = 210.0;
    let corner_radius = 16.0;

    if px < front_left || px > front_right || py < front_top || py > front_bottom {
        return false;
    }

    let is_top_left = px < front_left + corner_radius && py < front_top + corner_radius;
    let is_top_right = px > front_right - corner_radius && py < front_top + corner_radius;
    let is_bottom_left = px < front_left + corner_radius && py > front_bottom - corner_radius;
    let is_bottom_right = px > front_right - corner_radius && py > front_bottom - corner_radius;

    if is_top_left {
        let dx = px - (front_left + corner_radius);
        let dy = py - (front_top + corner_radius);
        if dx * dx + dy * dy > corner_radius * corner_radius {
            return false;
        }
    } else if is_top_right {
        let dx = px - (front_right - corner_radius);
        let dy = py - (front_top + corner_radius);
        if dx * dx + dy * dy > corner_radius * corner_radius {
            return false;
        }
    } else if is_bottom_left {
        let dx = px - (front_left + corner_radius);
        let dy = py - (front_bottom - corner_radius);
        if dx * dx + dy * dy > corner_radius * corner_radius {
            return false;
        }
    } else if is_bottom_right {
        let dx = px - (front_right - corner_radius);
        let dy = py - (front_bottom - corner_radius);
        if dx * dx + dy * dy > corner_radius * corner_radius {
            return false;
        }
    }

    true
}

#[tauri::command]
pub fn generate_designed_icon(options: DesignOptions) -> Result<DesignedIconResult, String> {
    // 1. Base Folder Canvas (256x256)
    let mut canvas: RgbaImage = render_folder_canvas(options.hue, options.saturation, options.lightness);

    // 2. Load Cover Image if provided and composite onto front flap
    let cover_img_opt: Option<RgbaImage> = if let Some(path_str) = &options.custom_cover_path {
        let path = Path::new(path_str);
        if path.exists() {
            image::open(path).map(|i| i.to_rgba8()).ok()
        } else {
            None
        }
    } else if let Some(data_url) = &options.custom_cover_data_url {
        let b64 = if let Some(idx) = data_url.find("base64,") {
            &data_url[idx + 7..]
        } else {
            data_url.as_str()
        };
        if let Some(bytes) = base64_decode(b64) {
            image::load_from_memory(&bytes).map(|i| i.to_rgba8()).ok()
        } else {
            None
        }
    } else {
        None
    };

    if let Some(cover_rgba) = cover_img_opt {
        let (cw, ch) = (cover_rgba.width(), cover_rgba.height());
        if cw > 0 && ch > 0 {
            let flap_w = 224.0f32;
            let flap_h = 148.0f32;
            let fit_mode = options.cover_fit_mode.as_deref().unwrap_or("cover");
            let user_scale = options.cover_scale.unwrap_or(1.0).clamp(0.2, 5.0);

            let base_scale = match fit_mode {
                "contain" => (flap_w / cw as f32).min(flap_h / ch as f32),
                _ => (flap_w / cw as f32).max(flap_h / ch as f32),
            };
            let scale = base_scale * user_scale;

            let target_w = ((cw as f32 * scale).round() as u32).max(1);
            let target_h = ((ch as f32 * scale).round() as u32).max(1);

            let resized_cover = image::imageops::resize(
                &cover_rgba,
                target_w,
                target_h,
                FilterType::Lanczos3,
            );

            let center_x = 128.0 + options.cover_offset_x.unwrap_or(0.0);
            let center_y = 136.0 + options.cover_offset_y.unwrap_or(0.0);
            let top_left_x = (center_x - (target_w as f32 / 2.0)).round() as i32;
            let top_left_y = (center_y - (target_h as f32 / 2.0)).round() as i32;

            for cy in 0..target_h {
                for cx in 0..target_w {
                    let dest_x = top_left_x + cx as i32;
                    let dest_y = top_left_y + cy as i32;
                    if dest_x >= 0 && dest_x < 256 && dest_y >= 0 && dest_y < 256 {
                        if is_in_front_flap(dest_x as f32, dest_y as f32) {
                            let c_px = resized_cover.get_pixel(cx, cy);
                            let c_a = c_px[3] as f32 / 255.0;
                            if c_a > 0.001 {
                                let d_px = canvas.get_pixel(dest_x as u32, dest_y as u32);
                                let d_a = d_px[3] as f32 / 255.0;
                                let out_a = c_a + d_a * (1.0 - c_a);
                                if out_a > 0.0 {
                                    let r = ((c_px[0] as f32 * c_a + d_px[0] as f32 * d_a * (1.0 - c_a))
                                        / out_a)
                                        .round() as u8;
                                    let g = ((c_px[1] as f32 * c_a + d_px[1] as f32 * d_a * (1.0 - c_a))
                                        / out_a)
                                        .round() as u8;
                                    let b = ((c_px[2] as f32 * c_a + d_px[2] as f32 * d_a * (1.0 - c_a))
                                        / out_a)
                                        .round() as u8;
                                    let a = (out_a * 255.0).round() as u8;
                                    canvas.put_pixel(dest_x as u32, dest_y as u32, Rgba([r, g, b, a]));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 3. Load Sticker Image if provided
    let sticker_img_opt: Option<RgbaImage> = if let Some(path_str) = &options.sticker_path {
        let path = Path::new(path_str);
        if path.exists() {
            image::open(path).map(|i| i.to_rgba8()).ok()
        } else {
            None
        }
    } else if let Some(data_url) = &options.sticker_data_url {
        let b64 = if let Some(idx) = data_url.find("base64,") {
            &data_url[idx + 7..]
        } else {
            data_url.as_str()
        };
        if let Some(bytes) = base64_decode(b64) {
            image::load_from_memory(&bytes).map(|i| i.to_rgba8()).ok()
        } else {
            None
        }
    } else {
        None
    };

    // 3. Composite sticker onto canvas
    if let Some(sticker_rgba) = sticker_img_opt {
        let (sw, sh) = (sticker_rgba.width(), sticker_rgba.height());
        if sw > 0 && sh > 0 {
            let scale = options.sticker_scale.clamp(0.15, 0.95);
            let max_box = (256.0 * scale).round() as u32;

            let (target_w, target_h) = if sw >= sh {
                let h = ((sh as f32 / sw as f32) * max_box as f32).round() as u32;
                (max_box.max(1), h.max(1))
            } else {
                let w = ((sw as f32 / sh as f32) * max_box as f32).round() as u32;
                (w.max(1), max_box.max(1))
            };

            let mut resized_sticker = image::imageops::resize(
                &sticker_rgba,
                target_w,
                target_h,
                FilterType::Lanczos3,
            );

            let tint_rgb = options.sticker_tint_hex.as_deref().and_then(parse_hex_color);
            let opacity = options.sticker_opacity.clamp(0.0, 1.0);

            for pixel in resized_sticker.pixels_mut() {
                if pixel[3] > 0 {
                    if let Some((tr, tg, tb)) = tint_rgb {
                        pixel[0] = tr;
                        pixel[1] = tg;
                        pixel[2] = tb;
                    }
                    if opacity < 1.0 {
                        pixel[3] = ((pixel[3] as f32) * opacity).round() as u8;
                    }
                }
            }

            // Folder front pocket center is around (128, 154)
            let center_x = 128.0 + options.sticker_offset_x;
            let center_y = 154.0 + options.sticker_offset_y;
            let top_left_x = (center_x - (target_w as f32 / 2.0)).round() as i32;
            let top_left_y = (center_y - (target_h as f32 / 2.0)).round() as i32;

            for sy in 0..target_h {
                for sx in 0..target_w {
                    let dest_x = top_left_x + sx as i32;
                    let dest_y = top_left_y + sy as i32;
                    if dest_x >= 0 && dest_x < 256 && dest_y >= 0 && dest_y < 256 {
                        let s_px = resized_sticker.get_pixel(sx, sy);
                        let s_a = s_px[3] as f32 / 255.0;
                        if s_a > 0.001 {
                            let d_px = canvas.get_pixel(dest_x as u32, dest_y as u32);
                            let d_a = d_px[3] as f32 / 255.0;
                            let out_a = s_a + d_a * (1.0 - s_a);
                            if out_a > 0.0 {
                                let r = ((s_px[0] as f32 * s_a + d_px[0] as f32 * d_a * (1.0 - s_a))
                                    / out_a)
                                    .round() as u8;
                                let g = ((s_px[1] as f32 * s_a + d_px[1] as f32 * d_a * (1.0 - s_a))
                                    / out_a)
                                    .round() as u8;
                                let b = ((s_px[2] as f32 * s_a + d_px[2] as f32 * d_a * (1.0 - s_a))
                                    / out_a)
                                    .round() as u8;
                                let a = (out_a * 255.0).round() as u8;
                                canvas.put_pixel(dest_x as u32, dest_y as u32, Rgba([r, g, b, a]));
                            }
                        }
                    }
                }
            }
        }
    }

    // 4. Save to cache as multi-resolution ICO
    let preview_data_url = encode_png_data_url(&canvas)?;
    let base_dir = get_icons_cache_dir()?;

    let opt_json = serde_json::to_string(&options).unwrap_or_default();
    let hash = simple_hash(&opt_json);
    let output_path = base_dir.join(format!("design_{:x}.ico", hash));

    if !output_path.exists() {
        let ico_bytes = encode_multi_res_ico(&canvas)
            .map_err(|e| format!("Failed to encode designed ICO file: {}", e))?;
        fs::write(&output_path, ico_bytes)
            .map_err(|e| format!("Failed to write designed ICO file: {}", e))?;
    }

    Ok(DesignedIconResult {
        icon_path: output_path.to_string_lossy().to_string(),
        preview_data_url,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_designed_icon_composites_folder_and_sticker() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_designer_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();

        // 1. Create a dummy sticker PNG (32x32 white star/box)
        let sticker_file = temp_dir.join("sticker.png");
        let mut sticker_img = RgbaImage::new(32, 32);
        for pixel in sticker_img.pixels_mut() {
            *pixel = Rgba([255, 255, 255, 255]);
        }
        sticker_img.save(&sticker_file).unwrap();

        let options = DesignOptions {
            hue: 210.0,
            saturation: 0.85,
            lightness: 0.55,
            custom_cover_path: None,
            custom_cover_data_url: None,
            cover_fit_mode: None,
            cover_scale: None,
            cover_offset_x: None,
            cover_offset_y: None,
            sticker_path: Some(sticker_file.to_str().unwrap().to_string()),
            sticker_data_url: None,
            sticker_scale: 0.5,
            sticker_offset_x: 0.0,
            sticker_offset_y: 0.0,
            sticker_opacity: 1.0,
            sticker_tint_hex: Some("#FFFFFF".to_string()),
        };

        let result = generate_designed_icon(options).expect("Should generate designed icon");
        assert!(result.preview_data_url.starts_with("data:image/png;base64,"));
        assert!(Path::new(&result.icon_path).exists());

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_generate_designed_icon_masks_cover_to_folder_front_flap() {
        let temp_dir = std::env::temp_dir().join(format!(
            "test_mask_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&temp_dir).unwrap();

        // 1. Create a pure red image
        let cover_file = temp_dir.join("red_cover.png");
        let mut red_img = RgbaImage::new(100, 100);
        for pixel in red_img.pixels_mut() {
            *pixel = Rgba([255, 0, 0, 255]);
        }
        red_img.save(&cover_file).unwrap();

        let options = DesignOptions {
            hue: 210.0,
            saturation: 0.85,
            lightness: 0.55,
            custom_cover_path: Some(cover_file.to_str().unwrap().to_string()),
            custom_cover_data_url: None,
            cover_fit_mode: Some("cover".to_string()),
            cover_scale: Some(1.0),
            cover_offset_x: Some(0.0),
            cover_offset_y: Some(0.0),
            sticker_path: None,
            sticker_data_url: None,
            sticker_scale: 0.5,
            sticker_offset_x: 0.0,
            sticker_offset_y: 0.0,
            sticker_opacity: 1.0,
            sticker_tint_hex: None,
        };

        let result = generate_designed_icon(options).expect("Should generate designed icon");
        // Decode the preview to verify pixels
        let b64 = result.preview_data_url.split(',').nth(1).unwrap();
        let bytes = base64_decode(b64).expect("valid base64");
        let decoded = image::load_from_memory(&bytes).expect("load image").to_rgba8();

        // Folder top tab at (50, 45) must NOT be pure red (it must preserve folder tab base color)
        let tab_pixel = decoded.get_pixel(50, 45);
        assert_ne!(tab_pixel[0], 255, "Folder tab pixel at (50, 45) should not be overwritten by cover");
        assert!(tab_pixel[2] > 100, "Folder tab pixel should preserve blue folder color");

        // Front flap center at (128, 150) must be red (cover is placed there)
        let flap_pixel = decoded.get_pixel(128, 150);
        assert_eq!(flap_pixel[0], 255, "Front flap at (128, 150) should contain cover red pixel");
        assert_eq!(flap_pixel[1], 0);
        assert_eq!(flap_pixel[2], 0);

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
