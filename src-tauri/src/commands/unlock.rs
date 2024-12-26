use std::fs::{create_dir_all, File};
use std::io::{BufReader, Cursor, Read};
use std::path::{Path, PathBuf};

use tar::Archive;
use tauri::api::path::download_dir;

use crate::crypto::{combine_keys, decrypt_file, EncryptedFile, KeyPiece};
use crate::error::{app_error, make_error, AppResult};
use crate::meta::decode_meta;
use crate::util::read_meta_file;

/// Unlock a vault using keypieces
/// Takes the path to a vault file and a vector of key pieces
/// Returns the path to the unpacked data
#[tauri::command]
pub fn unlock(
    file_path: String,
    keys: Vec<KeyPiece>,
    save_path: Option<String>,
) -> AppResult<String> {
    // Combine keys

    let secret_key = combine_keys(keys)?;
    // Load file
    let mut reader = BufReader::new(File::open(&file_path)?);

    // Decrypt
    let (raw_meta, meta) = decode_meta(&mut reader)?;

    let mut buff = Vec::new();
    reader.read_to_end(&mut buff)?;

    let file = EncryptedFile {
        ciphertext: buff,
        nonce: meta.nonce,
        aad: raw_meta,
    };

    let decrypted = decrypt_file(&secret_key, file).map_err(|_e| make_error("crypto", "Decryption failed. Did you provide all of the required keys, and are they definitely for this vault? The combined key was not correct."))?;

    let mut tar = Archive::new(Cursor::new(decrypted));

    // Either save to downloads or specified folder
    let mut data_dir: PathBuf = if save_path.is_some() {
        PathBuf::from(save_path.unwrap())
    } else {
        download_dir().ok_or(app_error("Failed to get download_dir".to_string()))?
    };

    let current_path = Path::new(&file_path);
    data_dir.push(current_path.file_stem().unwrap());
    // make sure data dir it exists
    create_dir_all(&data_dir)?;

    tar.unpack(&data_dir)?;

    // Read meta file w/ full vault info and delete it
    let _meta = read_meta_file(&data_dir)?;

    // Return vault info (incl. path)

    return Ok(String::from(data_dir.to_str().unwrap()));
}

#[tauri::command]
pub fn unlock_cloud(keys: Vec<KeyPiece>) -> AppResult<[u8; 8]> {
    // Combine key-shares
    // Return ID,Token,key. (CloudKey Data)
    // Frontend then requests it using id + token, then passes to open using vault file and key.
    let secret_key = combine_keys(keys)?;

    return Ok(secret_key[0..8].try_into()?);
}

#[cfg(test)]
mod test {
    use std::{env, fs};

    use crate::commands::create::do_create;
    use crate::commands::unlock::unlock;
    use crate::crypto::tests::get_basic_combo;
    use crate::util::get_random_file_name;
    use crate::vault::{PersonalInfo, ShareConfiguration, Vault, VaultType};

    // Very simple. Empty vault!
    #[test]
    fn simple_unlock() {
        // CREATE
        let vault_info_in = Vault {
            vault_type: VaultType::Offline,
            personal_info: PersonalInfo {
                name: "Test".to_string(),
                email_address: "test@example.com".to_string(),
                full_legal_name: None,
                phone_number: None,
                guidance_doc: None,
                address: None,
            },
            share_config: ShareConfiguration {
                required: 3,
                circles: get_basic_combo(),
            },
            vault_folder: "/foo/bar".to_string(),
            alert_duration: 0,
            reminder_period: 0,
            keys: None,
        };

        let mut empty_folder = env::temp_dir();
        empty_folder.push(get_random_file_name().unwrap() + "empty");
        fs::create_dir_all(&empty_folder).expect("Failed to create empty folder for testing");

        let mut output_file = env::temp_dir();
        output_file.push(get_random_file_name().expect("Failed to get output file"));

        let sample_vault_result = do_create(vault_info_in, empty_folder, output_file);

        let res = sample_vault_result.expect("Could not create vault to test unlock");

        // END CREATE
        let path = res.path.clone();

        let mut keys_only: Vec<Vec<u8>> = Vec::new();
        for c in res.keys.share_keys {
            if c.keys.is_some() {
                keys_only.extend(c.keys.unwrap());
            }
        }

        // Actual test - open it using the main key.
        let open_result =
            unlock(res.path, keys_only, Some(".".to_string())).expect("Failed to open");
        assert_ne!(open_result, path);

        fs::remove_dir_all(open_result).unwrap();
    }
}
