use std::ffi::OsString;
use std::fs::File;
use std::io::{BufReader, Cursor, Read};
use std::path::PathBuf;
use std::time::SystemTime;

use tar::Archive;

use crate::constants::OPENED_VAULT_FOLDER;
use crate::crypto::{decrypt_file, EncryptedFile};
use crate::error::{app_error, AppError, AppResult};
use crate::meta::decode_meta;
use crate::util::read_meta_file;
use crate::vault::Vault;

/// Open a vault using a main key
/// Takes the path to a vault file and a key.
#[tauri::command]
pub fn open(app_handle: tauri::AppHandle, file_path: String, key: Vec<u8>) -> AppResult<Vault> {
    let mut new_path = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or(app_error("Could not get data directory".to_string()))?;
    new_path.push(OPENED_VAULT_FOLDER);

    return do_open(new_path, file_path, key);
}

/// Does all the actual command functionality.
/// Seperated so that app_handle is not used, so it is really easy to test.
fn do_open(mut new_path: PathBuf, file_path: String, key: Vec<u8>) -> AppResult<Vault> {
    let folder_name = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)?
        .as_secs();

    new_path.push(folder_name.to_string());

    // So we have the path to an encrypted vault and a main key.
    // Decrypt it and then decompress it
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

    let decrypted = decrypt_file(key.as_slice(), file)?;

    let mut tar = Archive::new(Cursor::new(decrypted));
    tar.unpack(&new_path)?;

    // Load meta
    let mut vault = read_meta_file(&new_path)?;

    // In practice, this error should not happen (no unicode path)
    // But I guess you could say that for most errors...
    fn handle_err(_s: OsString) -> AppError {
        return app_error("Failed to convert OS String".to_string());
    }

    vault.vault_folder = new_path
        .into_os_string()
        .into_string()
        .map_err(handle_err)?;
    return Ok(vault);
}

// Tests
#[cfg(test)]
mod test {
    use std::{env, fs};

    use crate::commands::create::do_create;
    use crate::commands::open::do_open;
    use crate::crypto::tests::get_basic_combo;
    use crate::util::get_random_file_name;
    use crate::vault::{PersonalInfo, ShareConfiguration, Vault, VaultType};

    // Very simple. Empty vault!
    #[test]
    fn simple_open() {
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

        let copy_for_assert = vault_info_in.clone();

        let mut empty_folder = env::temp_dir();
        empty_folder.push(get_random_file_name().unwrap() + "empty");
        fs::create_dir_all(&empty_folder).expect("Failed to create empty folder for testing");
        let unpack_dir = empty_folder.clone();

        let mut output_file = env::temp_dir();
        output_file.push(get_random_file_name().expect("Failed to get output file"));

        let sample_vault_result = do_create(vault_info_in, empty_folder, output_file);

        assert!(sample_vault_result.is_ok());
        let res = sample_vault_result.unwrap();
        let path = res.path.clone();

        // Actual test - open it using the main key.
        let open_result =
            do_open(unpack_dir, res.path, res.keys.main.to_vec()).expect("Failed to open");
        assert_eq!(open_result.alert_duration, copy_for_assert.alert_duration);
        assert_eq!(open_result.reminder_period, copy_for_assert.reminder_period);
        assert_eq!(open_result.vault_type, copy_for_assert.vault_type);
        assert_eq!(
            open_result.share_config.required,
            copy_for_assert.share_config.required
        );
        assert_eq!(
            open_result.personal_info.name,
            copy_for_assert.personal_info.name
        );
        assert_eq!(open_result.alert_duration, copy_for_assert.alert_duration);
        assert_eq!(open_result.alert_duration, copy_for_assert.alert_duration);

        fs::remove_file(path).unwrap();
    }
}
