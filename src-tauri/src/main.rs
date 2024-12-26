// Josh Muir - Securing Digital Legacies - March 2024.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Window};
// Import commands
use crate::commands::create::create;
use crate::commands::loadmeta::{get_file_path, load_meta};
use crate::commands::open::open;
use crate::commands::unlock::{unlock, unlock_cloud};

// Import all other files
mod constants;
mod crypto;
mod error;
mod meta;
mod util;
mod vault;

// Define module structure - allows command files to be imported.
mod commands {
    pub mod create;
    pub mod loadmeta;
    pub mod open;
    pub mod unlock;
}

// Removes the splashscreen when the program finishes loading
// This is called when React componentDidMount completes for the App.
#[tauri::command]
async fn close_splashscreen(window: Window) {
    // Close splashscreen
    let wind = window.get_window("splashscreen");
    if wind.is_some() {
        wind.expect("no window labeled 'splashscreen' found")
            .close()
            .unwrap();
        // Show main window
        window
            .get_window("main")
            .expect("no window labeled 'main' found")
            .show()
            .unwrap();
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_context_menu::init())
        .invoke_handler(tauri::generate_handler![
            create,
            load_meta,
            unlock,
            open,
            close_splashscreen,
            unlock_cloud,
            get_file_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
