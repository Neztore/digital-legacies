use std::fs::{remove_dir_all, File};
use std::io::{BufWriter, Write};
use std::path::PathBuf;

use rmp_serde::Serializer;
use serde::{Deserialize, Serialize};
use tar::{Builder, Header};

use crate::constants::{META_FILE_NAME, PRIVACY_FILE_NAME};
use crate::crypto::{encrypt_file, generate_circle_keys, generate_cloud_creds, generate_nonce};
use crate::error::{AppError, AppResult};
use crate::meta::encode_meta;
use crate::util::get_random_file_path;
use crate::vault::{CloudKeyData, KeyCollection, PublicInfo, Vault};

#[derive(Deserialize, Serialize, Debug)]
pub struct CreateResponse {
    pub(crate) keys: KeyCollection,
    cloud_keys: Option<CloudKeyData>,
    // path to the created file so the frontend can copy it out.
    pub(crate) path: String,
}

const PRIVACY_TEXT: &str = "This folder contains the contents of {name}'s digital vault. This is data that they imported and encrypted, and shared the keys with you.
Now that you have successfully decrypted their data, you must respect the instructions outlined in this folder.

If the data subject/controller (vault owner) is still alive, their GDPR rights still apply, and you must respect them.
if the data subject/controller (vault owner) is deceased, their GDPR rights no longer apply, but you should to respect the wishes of the family and/or next of kin.

You should act as a good steward of this data respect their wishes and both their privacy and that of their family and loved ones.

{name}
{emailAddress}
{legalName}
{phoneNumber}
{guidanceDocument}
{address}
";

#[tauri::command]
pub async fn create(app_handle: tauri::AppHandle, vault: Vault) -> AppResult<CreateResponse> {
    println!("{}", vault);

    let data_dir_error = AppError {
        error_type: "directory_load".to_string(),
        message: "Failed to load a directory for the application. Please close and try again."
            .to_string(),
    };

    let mut dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or(data_dir_error.clone())?;
    dir.push(&vault.vault_folder);

    let output_file_path = get_random_file_path(app_handle)?;

    return do_create(vault, dir, output_file_path);
}

// Does the actual command actions.
// Seperated to allow for testing.
pub fn do_create(
    mut vault: Vault,
    files_dir: PathBuf,
    output_file_path: PathBuf,
) -> AppResult<CreateResponse> {
    let mut archive = Builder::new(Vec::new());

    // Load files

    // Load the folder into the archive.
    archive.append_dir_all(".", &files_dir)?;

    {
        // Get values or an empty string. We need to clone as an unwrap moves the value.
        let cloned_personal_info = vault.personal_info.clone();
        let address = cloned_personal_info.address.unwrap_or("".to_string());
        let phone = cloned_personal_info.phone_number.unwrap_or("".to_string());
        let guidance = cloned_personal_info.guidance_doc.unwrap_or("".to_string());
        let legal_name = cloned_personal_info.full_legal_name.unwrap_or("".to_string());

        // Add privacy note with details added in the personal information screen.
        let filled_notice = PRIVACY_TEXT
            .replace("{name}", &vault.personal_info.name)
            .replace("{emailAddress}", &vault.personal_info.email_address)
            .replace("{address}", &address)
            .replace("{phoneNumber}", &phone)
            .replace("{guidanceDocument}", &guidance)
            .replace("{legalName}", &legal_name);

        let bytes = filled_notice.as_bytes();
        let mut header = Header::new_gnu();
        header.set_path(PRIVACY_FILE_NAME)?;
        header.set_size(bytes.len() as u64);
        header.set_cksum();

        archive.append(&header, bytes)?;
    }

    let mut cloud_creds: Option<CloudKeyData> = None;

    // Generate or retrieve keys
    let keys = if vault.keys.is_none() {
        let (key, creds) = generate_cloud_creds();
        cloud_creds = Some(creds);

        let circles_with_keys = generate_circle_keys(
            &key,
            vault.share_config.circles.clone(),
            vault.share_config.required,
        )?;
        let res = KeyCollection {
            main: key,
            share_keys: circles_with_keys,
        };
        vault.keys = Some(res.clone());
        res
    } else {
        vault.keys.clone().unwrap()
    };

    // Add meta information
    // Serialize the entire vault struct and put it into a special file within the tar archive.
    {
        let mut meta_buffer = Vec::new();
        vault.serialize(&mut Serializer::new(&mut meta_buffer))?;

        let mut header = Header::new_gnu();
        header.set_path(META_FILE_NAME)?;
        header.set_size(meta_buffer.len() as u64);
        header.set_cksum();

        archive.append(&header, &meta_buffer[..])?;
    }
    // Archive is now complete
    archive.finish()?;

    let nonce = generate_nonce();
    // Write meta, comments etc.
    let output_file = File::create(&output_file_path)?;

    let str_path: String = output_file_path.to_str().unwrap().parse().unwrap();

    let mut writer = BufWriter::new(output_file);
    let public_meta = PublicInfo {
        name: vault.personal_info.name,
        email_address: vault.personal_info.email_address,
        // Clone the original share_config, so it's the original circles - not the new ones we just made with keys
        share_config: vault.share_config.clone(),
        nonce: Vec::from(nonce.as_slice()),
        path: str_path.clone(),
    };

    let aad = encode_meta(&mut writer, public_meta);

    // Encrypt it - The archive is entirely encrypted deliberately to obscure the file structure
    let encrypted = encrypt_file(&keys.main, &archive.into_inner().unwrap(), &aad, nonce)?;

    writer.write(&encrypted.ciphertext)?;

    // Delete files from FS (internal folder)
    remove_dir_all(files_dir)?;

    return Ok(CreateResponse {
        keys,
        path: str_path,
        cloud_keys: cloud_creds,
    });
}
