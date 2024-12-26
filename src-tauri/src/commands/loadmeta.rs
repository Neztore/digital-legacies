use std::fs::File;
use std::io::BufReader;
use std::path::{Path, PathBuf};

use crate::error::{AppError, AppResult};
use crate::meta::decode_meta;
use crate::util::get_random_file_path;
use crate::vault::PublicInfo;

/// Given the path to a meta file, load the meta information and return it.
/// This command is used to get the number of keypieces to unlock a vault.
#[tauri::command]
pub fn load_meta(file_path: String) -> AppResult<PublicInfo> {
    let current_path = Path::new(&file_path);

    if !current_path.exists() {
        // error
        return Err(AppError {
            error_type: "fs".to_string(),
            message: "File does not exist".to_string(),
        });
    }

    let mut reader = BufReader::new(File::open(current_path)?);

    let (_, meta) = decode_meta(&mut reader)?;
    return Ok(meta);
}

#[tauri::command]
pub fn get_file_path(app_handle: tauri::AppHandle) -> AppResult<PathBuf> {
    return get_random_file_path(app_handle);
}

#[cfg(test)]
mod test {
    use std::{env, fs};

    use crate::commands::create::do_create;
    use crate::commands::loadmeta::load_meta;
    use crate::crypto::tests::get_basic_combo;
    use crate::util::get_random_file_name;
    use crate::vault::{PersonalInfo, ShareConfiguration, Vault, VaultType};

    #[test]
    fn sample_load_meta() {
        let mut empty_folder = env::temp_dir();
        empty_folder.push(get_random_file_name().unwrap() + "empty");
        fs::create_dir_all(&empty_folder).expect("Failed to create empty folder for testing");

        let mut output_file = env::temp_dir();
        output_file.push(get_random_file_name().expect("Failed to get output file"));

        let sample_vault_result = do_create(
            Vault {
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
            },
            empty_folder,
            output_file,
        );

        let res = sample_vault_result.expect("Could not create vault to test meta");
        let path = res.path.clone();
        let meta = load_meta(res.path).expect("Failed to load meta");

        assert_eq!(meta.email_address, "test@example.com");
        assert_eq!(meta.name, "Test");

        fs::remove_file(path).unwrap();
    }
}
