use image::{imageops, ImageReader, Rgba, RgbaImage};
use std::path::Path;

pub fn save_standard_24bit_bmp(img: &RgbaImage, path: &Path) -> Result<(), String> {
    let (width, height) = img.dimensions();
    let row_stride = (width * 3 + 3) & !3;
    let image_data_size = row_stride * height;
    let file_size = 14 + 40 + image_data_size;

    let mut bytes = Vec::with_capacity(file_size as usize);

    // 1. BMP File Header (14 bytes)
    bytes.extend_from_slice(b"BM");
    bytes.extend_from_slice(&(file_size as u32).to_le_bytes());
    bytes.extend_from_slice(&[0u8; 4]);
    bytes.extend_from_slice(&54u32.to_le_bytes());

    // 2. BITMAPINFOHEADER (40 bytes standard)
    bytes.extend_from_slice(&40u32.to_le_bytes());
    bytes.extend_from_slice(&(width as i32).to_le_bytes());
    bytes.extend_from_slice(&(height as i32).to_le_bytes());
    bytes.extend_from_slice(&1u16.to_le_bytes());
    bytes.extend_from_slice(&24u16.to_le_bytes());
    bytes.extend_from_slice(&0u32.to_le_bytes()); // BI_RGB
    bytes.extend_from_slice(&(image_data_size as u32).to_le_bytes());
    bytes.extend_from_slice(&2835u32.to_le_bytes()); // 72 DPI
    bytes.extend_from_slice(&2835u32.to_le_bytes()); // 72 DPI
    bytes.extend_from_slice(&0u32.to_le_bytes());
    bytes.extend_from_slice(&0u32.to_le_bytes());

    // 3. Pixel Data (Bottom-Up, BGR, padded to 4 bytes per row)
    let padding_len = (row_stride - (width * 3)) as usize;
    for y in (0..height).rev() {
        for x in 0..width {
            let pixel = img.get_pixel(x, y);
            let a = pixel[3] as f32 / 255.0;
            let r = (pixel[0] as f32 * a + 255.0 * (1.0 - a)).round() as u8;
            let g = (pixel[1] as f32 * a + 255.0 * (1.0 - a)).round() as u8;
            let b = (pixel[2] as f32 * a + 255.0 * (1.0 - a)).round() as u8;
            bytes.push(b);
            bytes.push(g);
            bytes.push(r);
        }
        for _ in 0..padding_len {
            bytes.push(0);
        }
    }

    std::fs::write(path, bytes)
        .map_err(|e| format!("Failed to write BMP file {}: {}", path.display(), e))
}

pub fn generate_nsis_assets(logo_path: &Path, out_dir: &Path) -> Result<(), String> {
    std::fs::create_dir_all(out_dir).map_err(|e| e.to_string())?;

    let logo_img = ImageReader::open(logo_path)
        .map_err(|e| format!("Failed to open logo: {}", e))?
        .decode()
        .map_err(|e| format!("Failed to decode logo: {}", e))?
        .to_rgba8();

    // 1. Create NSIS Header Image (150 x 57)
    let header_width = 150;
    let header_height = 57;
    let mut header = RgbaImage::from_pixel(header_width, header_height, Rgba([255, 255, 255, 255]));

    let header_logo_size = 46;
    let resized_header_logo = imageops::resize(
        &logo_img,
        header_logo_size,
        header_logo_size,
        imageops::FilterType::Lanczos3,
    );

    let header_x = (header_width - header_logo_size - 6) as i64;
    let header_y = ((header_height - header_logo_size) / 2) as i64;
    imageops::overlay(&mut header, &resized_header_logo, header_x, header_y);

    let header_bmp_path = out_dir.join("header.bmp");
    let header_png_path = out_dir.join("header.png");
    save_standard_24bit_bmp(&header, &header_bmp_path)?;
    header.save(&header_png_path).map_err(|e| format!("Failed to save header.png: {}", e))?;

    // 2. Create NSIS Sidebar Image (164 x 314)
    let sidebar_width = 164;
    let sidebar_height = 314;
    let mut sidebar = RgbaImage::new(sidebar_width, sidebar_height);

    // Fill with modern dark vertical gradient from #18181b to #09090b
    for y in 0..sidebar_height {
        let t = y as f32 / sidebar_height as f32;
        let r = ((1.0 - t) * 24.0 + t * 9.0) as u8;
        let g = ((1.0 - t) * 24.0 + t * 9.0) as u8;
        let b = ((1.0 - t) * 27.0 + t * 11.0) as u8;
        for x in 0..sidebar_width {
            sidebar.put_pixel(x, y, Rgba([r, g, b, 255]));
        }
    }

    let sidebar_logo_size = 96;
    let resized_sidebar_logo = imageops::resize(
        &logo_img,
        sidebar_logo_size,
        sidebar_logo_size,
        imageops::FilterType::Lanczos3,
    );

    let sidebar_x = ((sidebar_width - sidebar_logo_size) / 2) as i64;
    let sidebar_y = 65;
    imageops::overlay(&mut sidebar, &resized_sidebar_logo, sidebar_x, sidebar_y);

    let sidebar_bmp_path = out_dir.join("sidebar.bmp");
    let sidebar_png_path = out_dir.join("sidebar.png");
    save_standard_24bit_bmp(&sidebar, &sidebar_bmp_path)?;
    sidebar.save(&sidebar_png_path).map_err(|e| format!("Failed to save sidebar.png: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_nsis_assets_creates_expected_files() {
        let temp_dir = std::env::temp_dir().join("test_nsis_assets");
        let _ = std::fs::remove_dir_all(&temp_dir);
        std::fs::create_dir_all(&temp_dir).unwrap();

        let dummy_logo = temp_dir.join("logo.png");
        let img = image::RgbaImage::new(64, 64);
        img.save(&dummy_logo).unwrap();

        let res = generate_nsis_assets(&dummy_logo, &temp_dir);
        assert!(res.is_ok());
        assert!(temp_dir.join("header.bmp").exists());
        assert!(temp_dir.join("header.png").exists());
        assert!(temp_dir.join("sidebar.bmp").exists());
        assert!(temp_dir.join("sidebar.png").exists());

        let header_bytes = std::fs::read(temp_dir.join("header.bmp")).unwrap();
        assert_eq!(&header_bytes[0..2], b"BM");
        assert_eq!(&header_bytes[14..18], &[40, 0, 0, 0], "biSize must be 40");
        assert_eq!(&header_bytes[28..30], &[24, 0], "biBitCount must be 24");
        assert_eq!(&header_bytes[30..34], &[0, 0, 0, 0], "biCompression must be BI_RGB (0)");

        let sidebar_bytes = std::fs::read(temp_dir.join("sidebar.bmp")).unwrap();
        assert_eq!(&sidebar_bytes[0..2], b"BM");
        assert_eq!(&sidebar_bytes[14..18], &[40, 0, 0, 0], "biSize must be 40");
        assert_eq!(&sidebar_bytes[28..30], &[24, 0], "biBitCount must be 24");
        assert_eq!(&sidebar_bytes[30..34], &[0, 0, 0, 0], "biCompression must be BI_RGB (0)");

        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_generate_real_nsis_assets() {
        let logo = Path::new(r"C:\Users\Sahaj33\Downloads\Folder Paintbrush Icon.png");
        if logo.exists() {
            let out = Path::new("nsis");
            let _ = generate_nsis_assets(logo, out);
            assert!(out.join("header.bmp").exists());
            assert!(out.join("sidebar.bmp").exists());
        }
    }
}
