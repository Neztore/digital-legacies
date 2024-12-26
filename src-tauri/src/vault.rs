// Vault typings - rust version. VaultInfo.tsx contains TypeScript typings.
use crate::crypto::KeyPiece;
use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Deserialize, Serialize, Clone, PartialEq, Debug)]
pub enum VaultType {
    Offline,
    Cloud,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct PersonalInfo {
    pub(crate) name: String,
    pub(crate) email_address: String,
    pub(crate) full_legal_name: Option<String>,
    pub(crate) phone_number: Option<String>,
    pub(crate) guidance_doc: Option<String>,
    pub(crate) address: Option<String>,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct ShareConfiguration {
    pub(crate) required: u8,
    pub(crate) circles: Vec<Circle>,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct Circle {
    pub required: bool,
    pub key_comments: Vec<String>,
    pub name: String,
    pub keys: Option<Vec<KeyPiece>>,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct Vault {
    pub vault_type: VaultType,
    pub personal_info: PersonalInfo,
    pub share_config: ShareConfiguration,
    pub vault_folder: String,
    pub alert_duration: u32,
    pub reminder_period: u8,
    // The presence of these indicates it is an existing vault being updated
    // Only difference in behaviour is that it will use these keys instead of making new ones.
    pub keys: Option<KeyCollection>,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CloudKeyData {
    // 16 bytes
    pub(crate) owner_token: Vec<u8>,
    // 8 bytes
    pub(crate) share_token: Vec<u8>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KeyCollection {
    pub share_keys: Vec<Circle>,
    pub main: crate::crypto::Key,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct PublicInfo {
    pub share_config: ShareConfiguration,
    pub(crate) name: String,
    pub(crate) email_address: String,
    pub nonce: Vec<u8>,
    // Internal application path
    pub path: String,
}

// Vault toString converter (Read more: https://doc.rust-lang.org/rust-by-example/conversion/string.html)
impl fmt::Display for Vault {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "Vault {} owned by {}\n\tAlert duration: {}\n\tReminder period: {}",
            self.vault_folder, self.personal_info.name, self.alert_duration, self.reminder_period
        )
    }
}
