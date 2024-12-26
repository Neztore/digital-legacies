use crate::constants::META_FILE_NAME;
use crate::error::AppResult;
use crate::vault::Vault;
use chacha20poly1305::aead::rand_core::RngCore;
use chacha20poly1305::aead::OsRng;
use std::fs;
use std::fs::File;
use std::path::PathBuf;
use std::time::SystemTime;

pub fn get_random_file_path(handle: tauri::AppHandle) -> AppResult<PathBuf> {
    let mut base_folder = handle
        .path_resolver()
        .app_data_dir()
        .expect("Failed to get app data dir");

    base_folder.push(get_random_file_name()?);
    return Ok(base_folder);
}

// Originally this just used the ms time, which was not very good for obvious reasons (very very frequent collisions during testing...)
// Also appends a random number to make the chance of that happening very low
pub fn get_random_file_name() -> AppResult<String> {
    let file_name = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)?
        .as_millis();
    let rand_str = OsRng.next_u64().to_string();
    let file_name_str = file_name.to_string();
    return Ok(rand_str + "-" + &file_name_str);
}

pub fn read_meta_file(folder_path: &PathBuf) -> AppResult<Vault> {
    let mut meta_file_path = folder_path.clone();
    meta_file_path.push(META_FILE_NAME);

    let file = File::open(&meta_file_path)?;
    let vault: Vault = rmp_serde::from_read(&file)?;
    fs::remove_file(&meta_file_path)?;

    return Ok(vault);
}

#[cfg(test)]
mod test {
    use crate::util::get_random_file_name;

    #[test]
    fn random_paths() {
        let name1 = get_random_file_name().expect("Expected file name");
        let name2 = get_random_file_name().expect("Expected file name");
        let name3 = get_random_file_name().expect("Expected file name");

        // Test that they are all unique
        assert_ne!(name1, name2);
        assert_ne!(name1, name3);
        assert_ne!(name2, name3);
    }
}
