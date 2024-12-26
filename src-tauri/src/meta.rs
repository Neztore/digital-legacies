use rmp_serde::Serializer;
use serde::Serialize;
use std::io::{Read, Write};

use crate::error::AppResult;
use crate::vault::PublicInfo;

/*
pub const KEYSHARE_COMMENT: &str = "\
\
";
// Then include: Comment, M of N scheme, Name of owner.

pub const VAULT_COMMENT: &str = "This is a digital vault. It contains photos, documents and the last will and testament of the named individual below.\
Access is gained by combining key pieces - a number of these have been generated and given to trusted contacts. You can also find the number of keys required below.";

pub const SCHEME_COMMENT: &str = "This is a {M] of {N} key sharing scheme. {M} keys exist, and {N} keys must be combined to unlock the data.";
*/
/*
   Use this for a comment at a later date.
       // Make meta data
   let mut meta_str: String = VAULT_COMMENT.to_owned();
   meta_str.push('\n');
   meta_str.push_str(&*format!("Name: {}, Email address: {}. This is a {} of {} key sharing scheme.",
                               vault.personal_info.name,
                               vault.personal_info.email_address,
       vault.share_config.shares, vault.share_config.required
   ));
*/

// meta data encoding
pub fn encode_meta(writer: &mut impl Write, info: PublicInfo) -> Vec<u8> {
    // Serialize
    let mut meta_buffer = Vec::new();
    info.serialize(&mut Serializer::new(&mut meta_buffer))
        .expect("Failed to encode");

    let len = u32::try_from(meta_buffer.len()).unwrap();

    // First two bytes - Length of message pack
    writer.write(len.to_be_bytes().as_ref()).unwrap();
    writer.write(&meta_buffer).unwrap();

    meta_buffer
}

// All we actually need to read in is the nonce and the start point of the file.
pub fn decode_meta(reader: &mut impl Read) -> AppResult<(Vec<u8>, PublicInfo)> {
    let mut meta_len_buff: [u8; 4] = [0; 4];

    reader.read(&mut meta_len_buff)?;

    let meta_len: u32 = u32::from_be_bytes(meta_len_buff);
    let mut buff: Vec<u8> = vec![0u8; meta_len.try_into().unwrap()];

    reader.read_exact(&mut buff)?;

    let res = rmp_serde::from_slice(&buff)?;

    return Ok((buff, res));
}

#[cfg(test)]
mod tests {
    use crate::meta::{decode_meta, encode_meta};
    use crate::vault::{PublicInfo, ShareConfiguration};
    use std::env::temp_dir;
    use std::fs;
    use std::fs::{File, OpenOptions};

    #[test]
    fn encode_works() {
        let mut f = get_test_file();
        let info = PublicInfo {
            share_config: ShareConfiguration {
                required: 4,
                circles: vec![],
            },
            name: "Test_encode".to_string(),
            email_address: "foo@bar.com".to_string(),
            nonce: vec![0, 1, 2, 3, 4, 5],
            path: "/foo/bar".to_string(),
        };

        let res = encode_meta(&mut f, info);
        assert!(res.len() > 0);
    }

    #[test]
    fn basic_encode_decode() {
        let mut temp_dir = temp_dir();
        temp_dir.push("test_meta");

        if temp_dir.exists() {
            fs::remove_file(&temp_dir).expect("Failed to remove old file");
        }

        let info = PublicInfo {
            share_config: ShareConfiguration {
                required: 4,
                circles: vec![],
            },
            name: "Test_encode".to_string(),
            email_address: "foo@bar.com".to_string(),
            nonce: vec![0, 1, 2, 3, 4, 5],
            path: "/foo/bar".to_string(),
        };

        // Inner closure allows for drops
        let res = {
            let mut writable = File::create(&temp_dir).expect("Failed to create file");

            let copied = info.clone();

            encode_meta(&mut writable, copied)
        };
        assert!(res.len() > 0);

        let mut readable = File::open(&temp_dir).expect("Failed to open for reading");
        let result = decode_meta(&mut readable);
        assert!(result.is_ok(), "Failed to decode");

        let (raw, meta) = result.unwrap();
        assert_eq!(raw, res);
        assert_eq!(info.name, meta.name, "Returned meta is incorrect");
        assert_eq!(
            info.email_address, meta.email_address,
            "Returned meta is incorrect"
        );
        assert_eq!(info.nonce, meta.nonce, "Returned meta is incorrect");
        assert_eq!(info.path, meta.path, "Returned meta is incorrect");
    }

    fn get_test_file() -> File {
        let mut temp_dir = temp_dir();
        temp_dir.push("test_meta");

        let with_opt = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .open(temp_dir)
            .expect("Failed to set up open options");

        return with_opt;
    }
}
