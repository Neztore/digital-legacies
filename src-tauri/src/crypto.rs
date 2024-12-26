/*
   crypto.rs
   This file provides encryption functionality, including Shamir's secret sharing and authenticated encryption.
   This is done using two libraries: shamirsecretsharing and chacha20poly1305.

   This is so that we get some useful security properties, namely confidentiality and message integrity.

*/
extern crate chacha20poly1305;
extern crate shamirsecretsharing;

use chacha20poly1305::{
    aead::{generic_array::GenericArray, Aead, AeadCore, KeyInit, OsRng, Payload},
    ChaCha20Poly1305, Error, Nonce,
};
use serde::{Deserialize, Serialize};
use shamirsecretsharing::hazmat::{combine_keyshares, create_keyshares, KEYSHARE_SIZE, KEY_SIZE};
use shamirsecretsharing::{combine_shares, create_shares, DATA_SIZE, SHARE_SIZE};
use std::collections::HashSet;

use crate::error::{app_error, make_error, AppResult};
use crate::vault::{Circle, CloudKeyData};

// Values
// The length of our encryption key - the one that is actually used to encrypt the file.
pub const ENCRYPTION_KEY_LEN: usize = 32;

// The length of a keyshare. At time of writing it is, irritatingly, 33.
pub const KEYSHARE_LEN: usize = KEYSHARE_SIZE;
// The length of a full secret KEY_LEN + padding.
const FULL_SECRET_LEN: usize = DATA_SIZE;
// The length of a 'full share', used for individual keys.
const RE_SHARE_LEN: usize = SHARE_SIZE;

// 8 bytes
const READ_ONLY_CLOUD_KEY_LEN: usize = 8;
// 16 bytes
const OWNER_CLOUD_KEY_LEN: usize = 16;

pub type KeyPiece = Vec<u8>;
pub(crate) type Key = [u8; ENCRYPTION_KEY_LEN];

/// Stores an encrypted message with a message authentication tag
#[derive(Debug, Serialize, Deserialize)]
pub struct EncryptedFile {
    // Encrypted contents of the file itself
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
    pub aad: Vec<u8>,
}

// Generation method abstract over the use of osrng for other functions.
/// Generates a key. Type is an abstract over a slice of bytes
pub fn generate_key() -> Key {
    return ChaCha20Poly1305::generate_key(&mut OsRng).into();
}

/// Generates a nonce.
pub fn generate_nonce() -> Nonce {
    return ChaCha20Poly1305::generate_nonce(&mut OsRng);
}

/// Encrypts a file. Takes a nonce, file_contents to encrypt and meta data.
/// The meta_data is signed as AAD, and must be provided at decryption time.
pub fn encrypt_file(
    key: &Key,
    file_contents: &Vec<u8>,
    meta_data: &[u8],
    nonce: Nonce,
) -> AppResult<EncryptedFile> {
    let cipher = ChaCha20Poly1305::new(key.into());

    let payload = Payload {
        aad: meta_data,
        msg: file_contents.as_slice(),
    };
    let ciphertext = cipher.encrypt(&nonce, payload)?;

    return Ok(EncryptedFile {
        ciphertext,
        nonce: Vec::from(nonce.as_slice()),
        aad: Vec::from(meta_data),
    });
}

/// Decrypt a file using the provided key.
/// The meta data (AAD) must match the AAD provided at encryption time.
pub fn decrypt_file(key: &[u8], file: EncryptedFile) -> Result<Vec<u8>, Error> {
    let cipher = ChaCha20Poly1305::new(key.into());

    let payload = Payload {
        aad: &file.aad,
        msg: &file.ciphertext,
    };

    return cipher.decrypt(&GenericArray::from_slice(&file.nonce), payload);
}

/// A padded key is the length first, then the secret, then 0s.
/// The secret sharing function requires secrets of 64 bytes, and the key is 33 bytes.
/// This function fills out the rest with 0s.
fn pad_key(key: Vec<u8>) -> [u8; FULL_SECRET_LEN] {
    let mut result = vec![0u8; FULL_SECRET_LEN];
    result[0] = u8::try_from(key.len()).expect("Key is too large");

    let copied_key = key.clone();
    for counter in 0..key.len() {
        result[counter + 1] = copied_key[counter];
    }
    return result.as_slice().try_into().unwrap();
}

/// Removes padding from a 64-byte secret to produce the key.
/// Uses the first value as the length of the secret, and returns the secret.
fn unpad_key(key: &Vec<u8>) -> AppResult<Vec<u8>> {
    if key.len() != FULL_SECRET_LEN {
        return Err(app_error("Bad secret: Incorrect length".to_string()));
    }

    let length = key[0];
    let length_size = usize::from(length);

    if length_size != KEYSHARE_LEN && length_size != KEY_SIZE {
        return Err(app_error(
            "Bad secret: Must be share or key length.".to_string(),
        ));
    }

    let mut return_key: Vec<u8> = vec![0; length_size];

    for counter in 0..length_size {
        return_key[counter] = key[counter + 1];
    }

    return Ok(return_key);
}

/// Generates a key collection from a given configuration.
/// Takes the circles and returns a new Vector of circles with key information specified. It does not
/// modify the original vector.
/// The returned circles will include keys, each of which will either be of length 32 (length of Key type) or 64.
/// Where a key is 64 bytes, the first 32 will be the individual key and the second the group key.
pub fn generate_circle_keys(
    key: &Key,
    circles: Vec<Circle>,
    required_keys: u8,
) -> AppResult<Vec<Circle>> {
    // Count totals
    let mut required_groups: u8 = 0;
    let mut total_keys = 0;

    for c in circles.iter() {
        if c.required {
            required_groups += 1;
        }
        total_keys += c.key_comments.len();
    }

    let key_splits = required_groups + 1;

    let mut new_circles: Vec<Circle> = vec![];

    // 1   Linear split S with M+1 of M=1 needed (linear/all keys needed)
    let group_keys = create_keyshares(key, key_splits, key_splits)?;
    //         Assign each L_n (n 0..M-1) to a group. The final share L_M is Z, the individual share.
    let z = group_keys[usize::from(required_groups)].clone();
    // 2   Threshold split Z using M of N into z_n (0..N-1)
    // The key must be passed with zero values as create_shares will only accept a slice with 64 bytes.
    let padded_z = pad_key(z);
    // Use the other, higher level keyshare. Returns keys with length 113.
    let individual_shares = create_shares(&padded_z, total_keys.try_into()?, required_keys)?;

    // This is the index of the next key to give.
    let mut z_counter = 0;
    let mut g_counter = 0;

    // key issuing
    for existing_circle in circles {
        let group_key_count = existing_circle.key_comments.len();
        let mut key_vector: Vec<KeyPiece> = vec![Vec::new(); group_key_count];

        // For each circle 'member'
        for key_index in 0..group_key_count {
            if existing_circle.required {
                // 3   Issue keys: Each member of a required group gets their group key L_M and one share of Z z_n.
                let mut group_share = group_keys[g_counter].clone();
                let mut full_share = individual_shares[z_counter].clone();
                full_share.append(&mut group_share);
                key_vector[key_index] = full_share;
            } else {
                // 4   Each non-required gets a share of Z z_n only.
                key_vector[key_index] = individual_shares[z_counter].clone();
            }
            z_counter += 1;
        }
        // Add the circle with keys to the result.
        new_circles.push(Circle {
            required: existing_circle.required,
            key_comments: existing_circle.key_comments.clone(),
            name: existing_circle.name.clone(),
            keys: Some(key_vector),
        });

        if existing_circle.required {
            g_counter += 1;
        }
    }
    return Ok(new_circles);
}

/// Combine a set of keys. This function excepts multi-level keys of either length 113 or length 113 + 33 (146).
/// It will give reasonably descriptive errors to indicate where the issue occurred.
pub fn combine_keys(keys: Vec<Vec<u8>>) -> AppResult<Key> {
    // Identify key types (First 113 is individual key)
    // Use sets so the values are unique. Saves having to check for duplicates manually.
    let mut group_keys: HashSet<Vec<u8>> = HashSet::new();
    let mut individual_keys: HashSet<Vec<u8>> = HashSet::new();

    for key in keys.iter() {
        if key.len() > RE_SHARE_LEN + KEYSHARE_LEN {
            return Err(make_error(
                "combine",
                "Incorrect key length: One or more of the keys are not the correct size.",
            ));
        }
        let individual_key = &key[0..RE_SHARE_LEN];
        individual_keys.insert(individual_key.to_vec());
        if key.len() > RE_SHARE_LEN {
            // It also has a group key
            let group_key = &key[RE_SHARE_LEN..key.len()];
            group_keys.insert(group_key.to_vec());
        }
    }

    // Try combine indiv. keys
    let vec_keys = Vec::from_iter(individual_keys);
    let padded_z = combine_shares(&vec_keys)?.ok_or(make_error(
        "indiv_combine",
        "You have not provided enough keys. Please provide more.",
    ))?;
    let z = unpad_key(&padded_z)?;

    // Now try to combine the circle/group keys
    let mut vec_circle_keys = Vec::from_iter(group_keys);
    vec_circle_keys.push(z);

    let secret = combine_keyshares(&vec_circle_keys).map_err(|e| {
        let error_str = format!(
            "Insufficient circle data: Have you got all of the required participants? ({})",
            e
        );

        make_error("circle_combine", &error_str)
    })?;

    // Unpad it and turn it into a Key/Slice.

    let result_slice: Key = secret[0..KEY_SIZE].try_into()?;
    return Ok(result_slice);
}

/// Generates an encryption key and owner cloud secret.
/// The share_token is the first 8 bytes of the key.
pub fn generate_cloud_creds() -> (Key, CloudKeyData) {
    let key = generate_key();
    let tokens = generate_key();

    let mut share_token: [u8; READ_ONLY_CLOUD_KEY_LEN] = [0; READ_ONLY_CLOUD_KEY_LEN];
    share_token.copy_from_slice(&key[0..READ_ONLY_CLOUD_KEY_LEN]);

    let owner_token = &tokens[0..OWNER_CLOUD_KEY_LEN];

    let creds = CloudKeyData {
        owner_token: owner_token.to_vec(),
        share_token: share_token.to_vec(),
    };

    return (key, creds);
}

// Tests - The rest of this file is tests.
// These are included in the same file as suggested in the Rust book (https://doc.rust-lang.org/book/ch11-01-writing-tests.html)
#[cfg(test)]
pub(crate) mod tests {
    use crate::crypto::{
        combine_keys, decrypt_file, encrypt_file, generate_circle_keys, generate_key,
        generate_nonce, Key, KeyPiece,
    };
    use crate::error::AppError;
    use crate::vault::Circle;
    use std::collections::HashSet;

    pub fn get_basic_combo() -> Vec<Circle> {
        return Vec::from([Circle {
            required: false,
            key_comments: Vec::from([
                "a".to_string(),
                "b".to_string(),
                "c".to_string(),
                "d".to_string(),
                "e".to_string(),
            ]),
            name: "Friends".to_string(),
            keys: None,
        }]);
    }

    #[test]
    fn basic_key_combination() {
        let circles: Vec<Circle> = get_basic_combo();

        test_circle_combination(circles, 3).expect("Failed to do circle test");
    }

    #[test]
    fn one_required_circle() {
        let circles: Vec<Circle> = Vec::from([
            Circle {
                required: false,
                key_comments: Vec::from([
                    "a".to_string(),
                    "b".to_string(),
                    "c".to_string(),
                    "d".to_string(),
                    "e".to_string(),
                ]),
                name: "Friends".to_string(),
                keys: None,
            },
            Circle {
                required: true,
                key_comments: Vec::from(["a".to_string()]),
                name: "Family".to_string(),
                keys: None,
            },
        ]);

        test_circle_combination(circles, 3).expect("Failed to do circle test");
    }

    #[test]
    fn all_circles_required() {
        let circles: Vec<Circle> = Vec::from([
            Circle {
                required: true,
                key_comments: Vec::from([
                    "a".to_string(),
                    "b".to_string(),
                    "c".to_string(),
                    "d".to_string(),
                    "e".to_string(),
                ]),
                name: "Friends".to_string(),
                keys: None,
            },
            Circle {
                required: true,
                key_comments: Vec::from(["a".to_string(), "b".to_string()]),
                name: "Family".to_string(),
                keys: None,
            },
        ]);

        test_circle_combination(circles, 3).expect("Failed to do circle test");
    }

    #[test]
    fn complex() {
        let circles: Vec<Circle> = Vec::from([
            Circle {
                required: true,
                key_comments: Vec::from([
                    "a".to_string(),
                    "b".to_string(),
                    "c".to_string(),
                    "d".to_string(),
                    "e".to_string(),
                ]),
                name: "One".to_string(),
                keys: None,
            },
            Circle {
                required: true,
                key_comments: Vec::from(["a".to_string(), "b".to_string()]),
                name: "Two".to_string(),
                keys: None,
            },
            Circle {
                required: false,
                key_comments: Vec::from(["a".to_string(), "b".to_string(), "e".to_string()]),
                name: "Three".to_string(),
                keys: None,
            },
            Circle {
                required: false,
                key_comments: Vec::from(["a".to_string()]),
                name: "Four".to_string(),
                keys: None,
            },
        ]);

        test_circle_combination(circles, 8).expect("Failed to do circle test");
    }

    #[test]
    fn one() {
        let circles: Vec<Circle> = Vec::from([Circle {
            required: true,
            key_comments: Vec::from(["a".to_string()]),
            name: "One".to_string(),
            keys: None,
        }]);

        test_circle_combination(circles, 1).expect("Failed to do circle test");
    }

    #[test]
    fn two_keys() {
        let circles: Vec<Circle> = Vec::from([Circle {
            required: true,
            key_comments: Vec::from(["a".to_string(), "b".to_string()]),
            name: "One".to_string(),
            keys: None,
        }]);
        test_circle_combination(circles.clone(), 1).expect("Failed to do circle test");
        test_circle_combination(circles, 2).expect("Failed to do circle test");
    }

    #[test]
    fn max_keys_in_one() {
        let mut key_comments = Vec::new();

        for c in 0u8..255 {
            key_comments.push(u8::to_string(&c));
        }

        let all_in_one_circle: Vec<Circle> = Vec::from([Circle {
            required: true,
            key_comments,
            name: "One".to_string(),
            keys: None,
        }]);
        test_circle_combination(all_in_one_circle.clone(), 3).expect("Failed to do circle test");
        test_circle_combination(all_in_one_circle.clone(), 200).expect("Failed to do circle test");
        test_circle_combination(all_in_one_circle, 255).expect("Failed to do circle test");
    }

    // Max keys (255) in many circles.
    // This test is a little silly. But it shows it works.
    #[test]
    fn max_keys_in_lots() {
        let mut circles: Vec<Circle> = Vec::new();

        // 5 keys per circle
        for c in 0u8..(255 / 5) {
            let mut keys = Vec::new();
            for key in 0u8..5 {
                keys.push(format!("Key {}", key));
            }

            let new_circle = Circle {
                required: c % 10 == 0,
                key_comments: keys,
                name: format!("Circle {}", c),
                keys: None,
            };
            circles.push(new_circle);
        }

        test_circle_combination(circles.clone(), 3).expect("Failed to do circle test");
        test_circle_combination(circles.clone(), 200).expect("Failed to do circle test");

        let required_only: Vec<Circle> = circles
            .into_iter()
            .filter(|circle| !circle.required)
            .collect();
        test_circle_combination(required_only.clone(), required_only.len() as u8)
            .expect("Failed to do circle test");
    }

    #[test]
    fn minimum_provided() {
        let circles: Vec<Circle> = Vec::from([Circle {
            required: true,
            key_comments: Vec::from(["a".to_string(), "b".to_string(), "a".to_string()]),
            name: "One".to_string(),
            keys: None,
        }]);
        let threshold: u8 = 2;

        let key = generate_key();
        let circles_with_keys = generate_circle_keys(&key, circles, threshold)
            .expect("Did not receive circles with keys.");
        let mut just_keys: Vec<KeyPiece> = circles_to_keys(circles_with_keys);
        just_keys.remove(0);

        let result_key = combine_keys(just_keys).expect("Failed to combine");
        let zero_key = [0u8; 32];
        assert_ne!(
            result_key, zero_key,
            "Checking the result is not a zero key"
        );
        assert_eq!(key, result_key);
    }

    // Error-case tests. Make sure the correct error is generated.
    #[test]
    fn insufficient_provided() {
        let circles: Vec<Circle> = Vec::from([Circle {
            required: true,
            key_comments: Vec::from(["a".to_string(), "b".to_string(), "a".to_string()]),
            name: "One".to_string(),
            keys: None,
        }]);
        let threshold: u8 = 2;

        let key = generate_key();
        let circles_with_keys = generate_circle_keys(&key, circles, threshold)
            .expect("Did not receive circles with keys.");
        let mut just_keys: Vec<KeyPiece> = circles_to_keys(circles_with_keys);
        // Remove two keys - result is one key, not enough!
        just_keys.remove(0);
        just_keys.remove(0);

        let result = combine_keys(just_keys);
        assert!(result.is_err());
        assert_eq!(
            result
                .expect_err("Expected error value, did not get one.")
                .error_type,
            "indiv_combine".to_string()
        );
    }

    #[test]
    fn wrong_provided() {
        let circles: Vec<Circle> = Vec::from([Circle {
            required: true,
            key_comments: Vec::from(["a".to_string(), "b".to_string(), "a".to_string()]),
            name: "One".to_string(),
            keys: None,
        }]);
        let threshold: u8 = 2;

        let key = generate_key();
        let circles_with_keys = generate_circle_keys(&key, circles, threshold)
            .expect("Did not receive circles with keys.");
        let mut just_keys: Vec<KeyPiece> = circles_to_keys(circles_with_keys);
        // Remove two keys - result is one key, not enough!
        just_keys.remove(0);
        // Add an incorrect key.
        just_keys.push(Vec::from([
            3, 177, 254, 72, 26, 76, 65, 56, 154, 81, 198, 240, 46, 41, 59, 156, 229, 163, 178, 0,
            181, 217, 32, 67, 209, 164, 223, 111, 107, 93, 233, 195, 224, 243, 133, 84, 153, 72,
            213, 16, 150, 218, 72, 14, 97, 82, 10, 179, 160, 181, 182, 126, 240, 136, 253, 152,
            203, 179, 252, 237, 203, 90, 209, 186, 78, 224, 145, 193, 179, 126, 198, 116, 80, 28,
            83, 133, 154, 21, 170, 97, 40, 138, 163, 149, 227, 111, 228, 64, 59, 188, 85, 69, 48,
            146, 61, 229, 132, 127, 235, 235, 32, 186, 60, 24, 31, 49, 244, 40, 110, 126, 176, 47,
            144,
        ]));

        let result = combine_keys(just_keys);
        assert!(result.is_err());
        assert_eq!(
            result
                .expect_err("Expected error value, did not get one.")
                .error_type,
            "indiv_combine".to_string()
        );
    }

    fn test_circle_combination(circles: Vec<Circle>, threshold: u8) -> Result<(), AppError> {
        let key = generate_key();
        let circles_with_keys = generate_circle_keys(&key, circles, threshold)
            .expect("Did not receive circles with keys.");

        let just_keys: Vec<KeyPiece> = circles_to_keys(circles_with_keys);

        keys_are_unique(&just_keys, &key);

        let result = combine_keys(just_keys)?;
        let zero_key = vec![0u8, 32];
        assert_ne!(zero_key, result, "Got zero key result");
        assert_eq!(result, key, "Key does not match input");

        Ok(())
    }

    // Test utility functions
    fn keys_are_unique(keys: &Vec<KeyPiece>, key: &Key) {
        let mut set: HashSet<KeyPiece> = HashSet::from_iter(keys.clone());
        assert_eq!(set.len(), keys.len(), "Non-unique keys");
        set.insert(key.clone().to_vec());
        assert_eq!(
            set.len(),
            keys.len() + 1,
            "Non-unique keys - Main key included."
        );
    }
    fn circles_to_keys(circles: Vec<Circle>) -> Vec<KeyPiece> {
        let mut just_keys: Vec<KeyPiece> = Vec::new();

        for circle in circles {
            let mut keys = circle.keys.expect("Keys not set");
            just_keys.append(&mut keys);
        }

        return just_keys;
    }

    // Encryption/Decryption tests
    #[test]
    fn simple_encryption_decrypt() {
        let key = generate_key();
        let nonce = generate_nonce();

        let test_data = get_test_data();

        let encrypted =
            encrypt_file(&key, &test_data, &[], nonce).expect("Failed to encrypt sample file");

        assert_eq!(encrypted.nonce, Vec::from(nonce.as_slice()));
        assert!(encrypted.ciphertext.len() > 0);

        let decrypted = decrypt_file(&key, encrypted).expect("Failed to decrypt");

        assert_eq!(
            decrypted, test_data,
            "Decrypted data does not match encrypted data"
        );
    }

    #[test]
    fn encrypt_with_aad() {
        let key = generate_key();
        let nonce = generate_nonce();

        let aad = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin hendrerit, nibh non volutpat laoreet, eros lacus placerat lacus, non scelerisque leo eros nec est. Mauris cursus diam hendrerit, finibus felis at, pellentesque sem. ".as_bytes();

        let test_data = get_test_data();

        let encrypted =
            encrypt_file(&key, &test_data, aad, nonce).expect("Failed to encrypt sample file");

        assert_eq!(encrypted.nonce, Vec::from(nonce.as_slice()));
        assert!(encrypted.ciphertext.len() > 0);
        assert_eq!(encrypted.aad, aad);

        let decrypted = decrypt_file(&key, encrypted).expect("Failed to decrypt");

        assert_eq!(
            decrypted, test_data,
            "Decrypted data does not match encrypted data"
        );
    }

    #[test]
    fn wrong_key_gives_error() {
        let key = generate_key();
        let other_key = generate_key();
        let nonce = generate_nonce();

        let test_data = get_test_data();

        let encrypted = encrypt_file(&key, &test_data, &[], nonce).expect("failed to encrypt");

        let decrypted = decrypt_file(&other_key, encrypted);
        assert!(decrypted.is_err());
    }

    fn get_test_data() -> Vec<u8> {
        let rand1 = generate_key();
        let rand2 = generate_key();
        let rand3 = generate_nonce();
        let mut buff: Vec<u8> = Vec::new();
        buff.extend_from_slice(rand1.as_slice());
        buff.extend_from_slice(rand2.as_slice());
        buff.extend_from_slice(rand3.as_slice());

        return buff;
    }
}
