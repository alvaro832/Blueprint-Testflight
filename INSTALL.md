//! Local SQLite history. Stored in the OS app-data dir. Local-first; never leaves the device.

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Serialize, Deserialize, Clone)]
pub struct HistoryRow {
    #[serde(default)]
    pub id: i64,
    pub created_at: i64,
    pub source: String,
    pub model_id: String,
    pub original_tokens: i64,
    pub optimized_tokens: i64,
    pub saved_usd: f64,
    pub quality_risk: i64,
    pub preview: String,
}

pub struct Db(pub Mutex<Connection>);

pub fn open(path: &std::path::Path) -> Connection {
    let conn = Connection::open(path).expect("open sqlite");
    conn.execute_batch(
        "PRAGMA journal_mode=WAL;
         CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at INTEGER NOT NULL,
            source TEXT NOT NULL,
            model_id TEXT NOT NULL,
            original_tokens INTEGER NOT NULL,
            optimized_tokens INTEGER NOT NULL,
            saved_usd REAL NOT NULL,
            quality_risk INTEGER NOT NULL,
            preview TEXT NOT NULL
         );",
    )
    .expect("init schema");
    conn
}

pub fn insert(conn: &Connection, r: &HistoryRow) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT INTO history (created_at, source, model_id, original_tokens, optimized_tokens, saved_usd, quality_risk, preview)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
        rusqlite::params![
            r.created_at, r.source, r.model_id, r.original_tokens,
            r.optimized_tokens, r.saved_usd, r.quality_risk, r.preview
        ],
    )?;
    Ok(())
}

pub fn list(conn: &Connection) -> rusqlite::Result<Vec<HistoryRow>> {
    let mut stmt = conn.prepare(
        "SELECT id, created_at, source, model_id, original_tokens, optimized_tokens, saved_usd, quality_risk, preview
         FROM history ORDER BY created_at DESC LIMIT 1000",
    )?;
    let rows = stmt
        .query_map([], |row| {
            Ok(HistoryRow {
                id: row.get(0)?,
                created_at: row.get(1)?,
                source: row.get(2)?,
                model_id: row.get(3)?,
                original_tokens: row.get(4)?,
                optimized_tokens: row.get(5)?,
                saved_usd: row.get(6)?,
                quality_risk: row.get(7)?,
                preview: row.get(8)?,
            })
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(rows)
}

pub fn clear(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute("DELETE FROM history", [])?;
    Ok(())
}
