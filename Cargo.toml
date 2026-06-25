//! Secure API-key storage via the OS keychain (Windows Credential Manager, macOS Keychain,
//! Linux Secret Service). Keys are never written to disk in plaintext and never logged.

use keyring::Entry;

const SERVICE: &str = "blueprint-token-optimizer";

fn entry(provider: &str) -> keyring::Result<Entry> {
    Entry::new(SERVICE, provider)
}

pub fn save(provider: &str, key: &str) -> Result<(), String> {
    entry(provider).and_then(|e| e.set_password(key)).map_err(|e| e.to_string())
}

pub fn read(provider: &str) -> Option<String> {
    entry(provider).ok().and_then(|e| e.get_password().ok())
}

pub fn has(provider: &str) -> bool {
    read(provider).is_some()
}

pub fn delete(provider: &str) -> Result<(), String> {
    match entry(provider).and_then(|e| e.delete_credential()) {
        Ok(_) => Ok(()),
        // treat "not found" as success so deletes are idempotent
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

pub fn delete_all(providers: &[&str]) {
    for p in providers {
        let _ = delete(p);
    }
}
