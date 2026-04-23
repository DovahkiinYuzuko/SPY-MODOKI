use crate::models::SpyHeader;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::Argon2;
use rand::Rng;

/// データをキーのバイト列で XOR する（古典ヴィジュネル層）
fn xor_vigenere(data: &mut [u8], key: &str) {
    let key_bytes = key.as_bytes();
    if key_bytes.is_empty() {
        return;
    }
    for (i, byte) in data.iter_mut().enumerate() {
        *byte ^= key_bytes[i % key_bytes.len()];
    }
}

/// 全角16文字チェック
fn validate_key(key: &str) -> Result<(), String> {
    if key.chars().count() != 16 {
        return Err(
            "キーは全角16文字で入力してねｗ/Key must be 16 full-width characters lol".to_string(),
        );
    }
    Ok(())
}

pub fn encrypt_data(data: &[u8], key: &str, expiration: i64) -> Result<Vec<u8>, String> {
    validate_key(key)?;

    // 1. ソルトと Nonce の生成
    let mut salt = [0u8; 16];
    let mut nonce_bytes = [0u8; 12];
    let mut rng = rand::rng();
    rng.fill_bytes(&mut salt);
    rng.fill_bytes(&mut nonce_bytes);

    // 2. 鍵派生 (Argon2id)
    let mut derived_key = [0u8; 32];
    let argon2 = Argon2::default();
    argon2
        .hash_password_into(key.as_bytes(), &salt, &mut derived_key)
        .map_err(|e| format!("鍵派生に失敗したよｗ: {}", e))?;

    // 3. 古典ヴィジュネル層 (XOR)
    let mut xor_data = data.to_vec();
    xor_vigenere(&mut xor_data, key);

    // 4. AES-256-GCM 暗号化
    let cipher = Aes256Gcm::new_from_slice(&derived_key)
        .map_err(|e| format!("暗号化エンジンの初期化に失敗ｗ: {}", e))?;
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, xor_data.as_ref())
        .map_err(|e| format!("暗号化に失敗したよｗ: {}", e))?;

    // 5. ヘッダーの作成と連結
    let header = SpyHeader {
        magic: *b"SPY!",
        retry_count: 0,
        expiration,
        salt,
        nonce: nonce_bytes,
    };

    let mut result = header.to_bytes();
    result.extend(ciphertext);
    Ok(result)
}

pub fn decrypt_data(encrypted_data: &[u8], key: &str) -> Result<(Vec<u8>, i64), String> {
    validate_key(key)?;

    if encrypted_data.len() < 41 {
        return Err("データが短すぎるよｗ/Data is too short lol".to_string());
    }

    // 1. ヘッダーの読み取り
    let header = SpyHeader::from_bytes(&encrypted_data[0..41])?;
    let ciphertext = &encrypted_data[41..];

    // 2. 鍵派生 (Argon2id)
    let mut derived_key = [0u8; 32];
    let argon2 = Argon2::default();
    argon2
        .hash_password_into(key.as_bytes(), &header.salt, &mut derived_key)
        .map_err(|e| format!("鍵派生に失敗したよｗ: {}", e))?;

    // 3. AES-256-GCM 復号
    let cipher = Aes256Gcm::new_from_slice(&derived_key)
        .map_err(|e| format!("復号エンジンの初期化に失敗ｗ: {}", e))?;
    let nonce = Nonce::from_slice(&header.nonce);
    let mut decrypted_data = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("復号に失敗したよｗ: {}", e))?;

    // 4. 古典ヴィジュネル層 (XOR) で元に戻す
    xor_vigenere(&mut decrypted_data, key);

    Ok((decrypted_data, header.expiration))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_success() {
        let key = "あいうえおかきくけこさしすせそそ"; // 全角16文字
        let data = b"Hello, SPY-MODOKI! This is a secret message.";
        let expiration = 123456789;

        let encrypted = encrypt_data(data, key, expiration).expect("Encryption failed");
        let (decrypted, dec_expiration) = decrypt_data(&encrypted, key).expect("Decryption failed");

        assert_eq!(data.to_vec(), decrypted);
        assert_eq!(expiration, dec_expiration);
    }

    #[test]
    fn test_decrypt_with_wrong_key() {
        let key = "あいうえおかきくけこさしすせそそ";
        let wrong_key = "そそせすしさこけくきかおえういあ";
        let data = b"Hello!";
        let expiration = 0;

        let encrypted = encrypt_data(data, key, expiration).expect("Encryption failed");
        let result = decrypt_data(&encrypted, wrong_key);

        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_key_length() {
        let short_key = "短いよ";
        let result = encrypt_data(b"data", short_key, 0);
        assert!(result.is_err());
    }
}
