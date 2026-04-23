use rand::prelude::IndexedRandom;

pub fn generate_full_width_key() -> String {
    let mut rng = rand::rng();

    // 全角文字セットの定義
    // ひらがな: あ-ん (U+3041 - U+3093)
    let hiragana: Vec<char> = ('\u{3041}'..='\u{3093}').collect();
    // カタカナ（全角）: ア-ン (U+30A1 - U+30F3)
    let katakana: Vec<char> = ('\u{30A1}'..='\u{30F3}').collect();
    // 常用漢字（一部）
    let kanji: Vec<char> = vec![
        '日', '本', '語', '鍵', '生', '成', '全', '角', '文', '字', '試', '験', '愛', '空', '海',
        '風', '花', '月', '星', '光',
    ];
    // 英数字（全角）: ０-９, Ａ-Ｚ, ａ-ｚ
    let full_width_digits: Vec<char> = ('\u{FF10}'..='\u{FF19}').collect();
    let full_width_upper: Vec<char> = ('\u{FF21}'..='\u{FF3A}').collect();
    let full_width_lower: Vec<char> = ('\u{FF41}'..='\u{FF5A}').collect();

    let mut all_chars = Vec::new();
    all_chars.extend(hiragana);
    all_chars.extend(katakana);
    all_chars.extend(kanji);
    all_chars.extend(full_width_digits);
    all_chars.extend(full_width_upper);
    all_chars.extend(full_width_lower);

    let mut key = String::new();
    for _ in 0..16 {
        if let Some(&c) = all_chars.choose(&mut rng) {
            key.push(c);
        }
    }
    key
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_key_length() {
        let key = generate_full_width_key();
        // 16文字であることを確認
        assert_eq!(key.chars().count(), 16);
    }

    #[test]
    fn test_is_utf8() {
        let key = generate_full_width_key();
        // バイト列にした時にUTF-8として正しいことを確認
        // String型は常に有効なUTF-8なので、中身が空でないか等の基本的なチェック
        assert!(!key.is_empty());
        assert!(std::str::from_utf8(key.as_bytes()).is_ok());
    }
}
