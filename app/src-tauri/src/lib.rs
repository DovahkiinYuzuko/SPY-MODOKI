mod crypto;
mod models;
mod shred;

use chrono::{Duration, Utc};
use std::fs;
use std::path::Path;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn generate_full_width_key() -> String {
    crypto::key_gen::generate_full_width_key()
}

#[tauri::command]
fn encrypt_file_command(
    source_path: String,
    output_path: String, // 追加
    key: String,
    seconds_valid: i64,
) -> Result<String, String> {
    let path = Path::new(&source_path);
    let data = fs::read(path).map_err(|e| format!("ファイルが読めないよｗ: {}", e))?;

    let expiration = (Utc::now() + Duration::seconds(seconds_valid)).timestamp();

    let encrypted_data = crypto::engine::encrypt_data(&data, &key, expiration)?;

    // 出力パスが空ならデフォルト（.spy付与）を使用
    let final_output = if output_path.is_empty() {
        format!("{}.spy", source_path)
    } else {
        output_path
    };

    fs::write(&final_output, encrypted_data).map_err(|e| format!("保存に失敗したよｗ: {}", e))?;

    Ok(final_output)
}

#[tauri::command]
fn decrypt_file_command(
    source_path: String, 
    output_path: String, // 追加
    key: String
) -> Result<String, String> {
    let path = Path::new(&source_path);
    let mut file_data = fs::read(path).map_err(|e| format!("ファイルが読めないよｗ: {}", e))?;

    if file_data.len() < 41 {
        return Err("ファイルが壊れてるっぽいよｗ".to_string());
    }

    let mut header = models::SpyHeader::from_bytes(&file_data[0..41])?;

    // 1. 期限チェック
    if Utc::now().timestamp() > header.expiration {
        shred::shred_file(path).map_err(|e| format!("破壊に失敗したよｗ: {}", e))?;
        return Err("期限切れのためファイルを破壊しましたｗ".to_string());
    }

    // 2. 復号試行
    match crypto::engine::decrypt_data(&file_data, &key) {
        Ok((decrypted_data, _)) => {
            // 出力パスの決定
            let final_output = if output_path.is_empty() {
                if source_path.ends_with(".spy") {
                    source_path[..source_path.len() - 4].to_string()
                } else {
                    format!("{}.dec", source_path)
                }
            } else {
                output_path
            };

            // 復元ファイルの保存
            fs::write(&final_output, decrypted_data)
                .map_err(|e| format!("復元ファイルの保存に失敗ｗ: {}", e))?;
            
            // 【証拠隠滅】元の.spyファイルを物理破壊
            shred::shred_file(path).map_err(|e| format!("証拠隠滅（破壊）に失敗したよｗ: {}", e))?;

            Ok(final_output)
        }
        Err(_) => {
            // 3. 失敗時
            header.retry_count += 1;
            if header.retry_count >= 3 {
                shred::shred_file(path).map_err(|e| format!("破壊に失敗したよｗ: {}", e))?;
                Err("試行回数超過のためファイルを破壊しましたｗ".to_string())
            } else {
                // ヘッダーを更新して書き戻す
                let header_bytes = header.to_bytes();
                file_data[0..41].copy_from_slice(&header_bytes);
                fs::write(path, file_data)
                    .map_err(|e| format!("リトライ回数の更新に失敗ｗ: {}", e))?;
                Err(format!("鍵が違いますｗ (残り{}回)", 3 - header.retry_count))
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            generate_full_width_key,
            encrypt_file_command,
            decrypt_file_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
