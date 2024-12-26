use serde::{Deserialize, Serialize};
use shamirsecretsharing::SSSError;
use std::error::Error;
use std::time::SystemTimeError;
use std::{fmt, io, num::TryFromIntError};

// Represents the standard app result, which all commands return.
// Tauri will reject for any error type.
pub type AppResult<T> = Result<T, AppError>;

// App error type
// Provides some basic debugging info, and is serializable so can be returned to the frontend.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AppError {
    pub error_type: String,
    pub message: String,
}

// Format - So it can be printed out
impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "AppError occurred. Type: {}, \nMessage:{}",
            self.error_type, self.message
        )
    }
}

// Convert IO errors to AppError type
impl From<io::Error> for AppError {
    fn from(error: io::Error) -> Self {
        let source = error.source();
        let source_str = if source.is_some() {
            format!("{:?}", source.unwrap())
        } else {
            "".to_string()
        };
        AppError {
            error_type: String::from("io"),
            message: format!("{} ({})", error.to_string(), source_str),
        }
    }
}

// Handle errors when converting from vec to slice.
// This is only done in the crypto file.
impl From<std::array::TryFromSliceError> for AppError {
    fn from(error: std::array::TryFromSliceError) -> Self {
        AppError {
            error_type: String::from("key_length"),
            message: error.to_string(),
        }
    }
}

// Convert serde encoding/serialising errors
impl From<rmp_serde::encode::Error> for AppError {
    fn from(error: rmp_serde::encode::Error) -> Self {
        AppError {
            error_type: String::from("encode"),
            message: error.to_string(),
        }
    }
}

// Convert Shamir's secret sharing errors
impl From<SSSError> for AppError {
    fn from(error: SSSError) -> Self {
        AppError {
            error_type: String::from("SSS"),
            message: error.to_string(),
        }
    }
}

// Convert encryption/decryption errors. The original error type is very opaque (deliberately...)
// So this is unlikely to yield much (or any) useful information
impl From<chacha20poly1305::Error> for AppError {
    fn from(error: chacha20poly1305::Error) -> Self {
        AppError {
            error_type: String::from("crypto"),
            message: error.to_string(),
        }
    }
}

// Convert serde decoding error
impl From<rmp_serde::decode::Error> for AppError {
    fn from(error: rmp_serde::decode::Error) -> Self {
        AppError {
            error_type: String::from("decode"),
            message: error.to_string(),
        }
    }
}

// Convert serde decoding error
impl From<TryFromIntError> for AppError {
    fn from(error: TryFromIntError) -> Self {
        AppError {
            error_type: String::from("int_size"),
            message: error.to_string(),
        }
    }
}

impl From<SystemTimeError> for AppError {
    fn from(error: SystemTimeError) -> Self {
        AppError {
            error_type: String::from("system_time"),
            message: error.to_string(),
        }
    }
}

// Helper function for shorter error creation.
pub fn app_error(message: String) -> AppError {
    return AppError {
        error_type: String::from("unknown"),
        message,
    };
}
pub fn make_error(error_type: &str, message: &str) -> AppError {
    return AppError {
        error_type: error_type.to_string(),
        message: message.to_string(),
    };
}
