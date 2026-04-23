use rand::{rng, Rng};
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::Path;

/// 指定されたファイルをシュレッダーにかける（ランダムデータで3回上書きして削除）
pub fn shred_file(path: &Path) -> io::Result<()> {
    // 1. メタデータを取得してサイズを確認
    let metadata = fs::metadata(path)?;
    let file_size = metadata.len();

    // 2-4. 3回上書きを繰り返す
    for _ in 0..3 {
        // ランダムなバイト列を生成
        let mut random_data = vec![0u8; file_size as usize];
        rng().fill_bytes(&mut random_data);

        // ファイルを書き込みモードで開く
        let mut file = OpenOptions::new().write(true).open(path)?;

        // ランダムデータを書き込んで同期
        file.write_all(&random_data)?;
        file.sync_all()?;
    }

    // 5. ファイルを削除
    fs::remove_file(path)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;

    #[test]
    fn test_shred_file() {
        // テスト用の一時ファイルを作成
        let test_path = Path::new("test_shred_target.txt");
        let content = b"important secret content";
        {
            let mut file = File::create(test_path).expect("Failed to create test file");
            file.write_all(content)
                .expect("Failed to write to test file");
        }

        // ファイルが存在することを確認
        assert!(test_path.exists());

        // シュレッダー実行
        shred_file(test_path).expect("shred_file failed");

        // ファイルが削除されていることを確認
        assert!(!test_path.exists());
    }

    #[test]
    fn test_shred_non_existent_file() {
        let test_path = Path::new("non_existent_file.txt");
        let result = shred_file(test_path);
        assert!(result.is_err());
    }
}
