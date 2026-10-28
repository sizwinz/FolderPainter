use crate::commands::color_icons::encode_multi_res_ico;
use image::RgbaImage;
use image::imageops::FilterType;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionAuthor {
    pub name: String,
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionItem {
    pub id: String,
    pub title: String,
    pub author: Option<CollectionAuthor>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionsResponse {
    pub total: u32,
    pub collections: Vec<CollectionItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IconAsset {
    pub size: u32,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IconItem {
    pub id: String,
    pub name: String,
    #[serde(rename = "collectionId")]
    pub collection_id: String,
    pub library: Option<String>,
    pub tags: Option<Vec<String>>,
    pub assets: Vec<IconAsset>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CatalogResponse {
    pub offset: u32,
    pub limit: u32,
    pub total: u32,
    pub collections: Option<Vec<CollectionItem>>,
    pub items: Vec<IconItem>,
}

#[tauri::command]
pub fn fetch_collections() -> Result<CollectionsResponse, String> {
    let cache_file = get_cache_dir()?.join("collections_cache.json");

    let url = "https://api.folderico.com/v1/icons/windows/win11/collections";
    let body = match ureq::get(url).call() {
        Ok(mut res) => {
            if let Ok(s) = res.body_mut().read_to_string() {
                let _ = fs::write(&cache_file, &s);
                s
            } else if cache_file.exists() {
                fs::read_to_string(&cache_file).map_err(|e| e.to_string())?
            } else {
                return Err("Failed to read response body".to_string());
            }
        }
        Err(_) => {
            if cache_file.exists() {
                fs::read_to_string(&cache_file).map_err(|e| e.to_string())?
            } else {
                return Err(
                    "Failed to connect to icon collection service and no cache exists".to_string(),
                );
            }
        }
    };

    serde_json::from_str::<CollectionsResponse>(&body).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fetch_icons(
    offset: u32,
    limit: u32,
    query: Option<String>,
) -> Result<CatalogResponse, String> {
    let url = if let Some(q) = query.filter(|s| !s.trim().is_empty()) {
        format!(
            "https://api.folderico.com/v1/icons/windows/win11?offset={}&limit={}&query={}",
            offset,
            limit,
            urlencoding(&q)
        )
    } else {
        format!(
            "https://api.folderico.com/v1/icons/windows/win11?offset={}&limit={}",
            offset, limit
        )
    };

    let mut res = ureq::get(&url)
        .call()
        .map_err(|e| format!("Failed to fetch icon catalog: {}", e))?;

    let body = res
        .body_mut()
        .read_to_string()
        .map_err(|e| format!("Failed to read catalog response: {}", e))?;

    serde_json::from_str::<CatalogResponse>(&body)
        .map_err(|e| format!("Failed to parse catalog JSON: {}", e))
}

#[tauri::command]
pub fn download_and_convert_icon(url: String) -> Result<String, String> {
    let icons_dir = get_library_icons_dir()?;

    let url_hash = simple_hash(&url);
    let out_path = icons_dir.join(format!("lib_{:x}.ico", url_hash));

    if out_path.exists() {
        return Ok(out_path.to_string_lossy().to_string());
    }

    let mut res = ureq::get(&url)
        .call()
        .map_err(|e| format!("Failed to download icon asset: {}", e))?;

    let bytes = res
        .body_mut()
        .read_to_vec()
        .map_err(|e| format!("Failed to read asset bytes: {}", e))?;

    let img =
        image::load_from_memory(&bytes).map_err(|e| format!("Failed to decode image: {}", e))?;

    let rgba = img.to_rgba8();
    let target_size = 256u32;
    let (w, h) = rgba.dimensions();

    let final_img = if w == target_size && h == target_size {
        rgba
    } else {
        let (scaled_w, scaled_h) = if w >= h {
            let new_h = ((h as f32 / w as f32) * target_size as f32).round() as u32;
            (target_size, new_h.max(1))
        } else {
            let new_w = ((w as f32 / h as f32) * target_size as f32).round() as u32;
            (new_w.max(1), target_size)
        };

        let resized = image::imageops::resize(&rgba, scaled_w, scaled_h, FilterType::Lanczos3);
        let mut canvas = RgbaImage::new(target_size, target_size);
        let offset_x = (target_size - scaled_w) / 2;
        let offset_y = (target_size - scaled_h) / 2;
        image::imageops::overlay(&mut canvas, &resized, offset_x as i64, offset_y as i64);
        canvas
    };

    let ico_bytes = encode_multi_res_ico(&final_img)
        .map_err(|e| format!("Failed to encode multi-resolution ICO: {}", e))?;

    fs::write(&out_path, ico_bytes).map_err(|e| format!("Failed to write icon file: {}", e))?;

    Ok(out_path.to_string_lossy().to_string())
}

fn get_cache_dir() -> Result<PathBuf, String> {
    let base = dirs::data_local_dir()
        .unwrap_or_else(|| std::env::temp_dir())
        .join("FolderPainter")
        .join("cache");
    if !base.exists() {
        let _ = fs::create_dir_all(&base);
    }
    Ok(base)
}

fn get_library_icons_dir() -> Result<PathBuf, String> {
    let base = dirs::data_local_dir()
        .unwrap_or_else(|| std::env::temp_dir())
        .join("FolderPainter")
        .join("library_icons");
    if !base.exists() {
        let _ = fs::create_dir_all(&base);
    }
    Ok(base)
}

fn simple_hash(s: &str) -> u64 {
    let mut h: u64 = 0xcbf29ce484222325;
    for b in s.bytes() {
        h = h.wrapping_mul(0x100000001b3);
        h ^= b as u64;
    }
    h
}

fn urlencoding(s: &str) -> String {
    let mut out = String::new();
    for b in s.bytes() {
        if b.is_ascii_alphanumeric() || b == b'-' || b == b'_' || b == b'.' || b == b'~' {
            out.push(b as char);
        } else {
            out.push_str(&format!("%{:02X}", b));
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fetch_collections_returns_valid_catalog() {
        let resp = fetch_collections().unwrap();
        assert!(resp.total > 0, "Should have collections");
        assert!(
            !resp.collections.is_empty(),
            "Collections list should not be empty"
        );
    }
}
