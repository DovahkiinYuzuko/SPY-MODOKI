#[derive(Debug)]
pub struct SpyHeader {
    pub magic: [u8; 4],
    pub retry_count: u8,
    pub expiration: i64,
    pub salt: [u8; 16],
    pub nonce: [u8; 12],
}

impl SpyHeader {
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::with_capacity(41);
        bytes.extend_from_slice(&self.magic);
        bytes.push(self.retry_count);
        bytes.extend_from_slice(&self.expiration.to_be_bytes());
        bytes.extend_from_slice(&self.salt);
        bytes.extend_from_slice(&self.nonce);
        bytes
    }

    pub fn from_bytes(bytes: &[u8]) -> Result<Self, String> {
        let error_msg =
            "残念ｗ何か足りてないねｗ/Oops!Something’s missing, isn’t it? lol".to_string();

        if bytes.len() < 41 {
            return Err(error_msg);
        }

        let magic: [u8; 4] = bytes[0..4].try_into().map_err(|_| error_msg.clone())?;
        if &magic != b"SPY!" {
            return Err(error_msg);
        }

        let retry_count = bytes[4];
        let expiration =
            i64::from_be_bytes(bytes[5..13].try_into().map_err(|_| error_msg.clone())?);
        let salt: [u8; 16] = bytes[13..29].try_into().map_err(|_| error_msg.clone())?;
        let nonce: [u8; 12] = bytes[29..41].try_into().map_err(|_| error_msg.clone())?;

        Ok(SpyHeader {
            magic,
            retry_count,
            expiration,
            salt,
            nonce,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_bytes() {
        let header = SpyHeader {
            magic: *b"SPY!",
            retry_count: 1,
            expiration: 123456789,
            salt: [0u8; 16],
            nonce: [1u8; 12],
        };
        let bytes = header.to_bytes();
        assert_eq!(bytes.len(), 41);
        assert_eq!(&bytes[0..4], b"SPY!");
        assert_eq!(bytes[4], 1);
        assert_eq!(
            i64::from_be_bytes(bytes[5..13].try_into().unwrap()),
            123456789
        );
    }

    #[test]
    fn test_from_bytes_success() {
        let original = SpyHeader {
            magic: *b"SPY!",
            retry_count: 2,
            expiration: 987654321,
            salt: [0xAA; 16],
            nonce: [0xBB; 12],
        };
        let bytes = original.to_bytes();
        let restored = SpyHeader::from_bytes(&bytes).unwrap();

        assert_eq!(restored.magic, original.magic);
        assert_eq!(restored.retry_count, original.retry_count);
        assert_eq!(restored.expiration, original.expiration);
        assert_eq!(restored.salt, original.salt);
        assert_eq!(restored.nonce, original.nonce);
    }

    #[test]
    fn test_from_bytes_invalid_magic() {
        let mut bytes = [0u8; 41];
        bytes[0..4].copy_from_slice(b"BAD!");
        let result = SpyHeader::from_bytes(&bytes);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("残念ｗ何か足りてないねｗ"));
    }
}
