use crate::commands::folder_icon;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct UndoEntry {
    pub folder_path: String,
    pub previous_icon: Option<String>,
    pub new_icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UndoStateInfo {
    pub can_undo: bool,
    pub can_redo: bool,
    pub undo_count: usize,
    pub redo_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UndoManager {
    pub undo_stack: Vec<UndoEntry>,
    pub redo_stack: Vec<UndoEntry>,
}

impl Default for UndoManager {
    fn default() -> Self {
        Self::new()
    }
}

impl UndoManager {
    pub fn new() -> Self {
        let mut manager = Self {
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
        };
        let _ = manager.load();
        manager
    }

    pub fn push_action(&mut self, folder: String, prev: Option<String>, new: Option<String>) {
        if self.undo_stack.len() >= 50 {
            self.undo_stack.remove(0);
        }
        self.undo_stack.push(UndoEntry {
            folder_path: folder,
            previous_icon: prev,
            new_icon: new,
        });
        self.redo_stack.clear();
        let _ = self.save();
    }

    pub fn undo(&mut self) -> Option<UndoEntry> {
        if let Some(entry) = self.undo_stack.pop() {
            self.redo_stack.push(entry.clone());
            let _ = self.save();
            Some(entry)
        } else {
            None
        }
    }

    pub fn redo(&mut self) -> Option<UndoEntry> {
        if let Some(entry) = self.redo_stack.pop() {
            self.undo_stack.push(entry.clone());
            let _ = self.save();
            Some(entry)
        } else {
            None
        }
    }

    pub fn get_info(&self) -> UndoStateInfo {
        UndoStateInfo {
            can_undo: !self.undo_stack.is_empty(),
            can_redo: !self.redo_stack.is_empty(),
            undo_count: self.undo_stack.len(),
            redo_count: self.redo_stack.len(),
        }
    }

    fn get_history_file() -> Option<PathBuf> {
        let base = dirs::data_local_dir()?.join("FolderPainter");
        if !base.exists() {
            let _ = fs::create_dir_all(&base);
        }
        Some(base.join("history.json"))
    }

    fn save(&self) -> Result<(), String> {
        if let Some(path) = Self::get_history_file() {
            let json = serde_json::to_string_pretty(self)
                .map_err(|e| format!("Failed to serialize history: {}", e))?;
            fs::write(path, json)
                .map_err(|e| format!("Failed to write history file: {}", e))?;
        }
        Ok(())
    }

    fn load(&mut self) -> Result<(), String> {
        if let Some(path) = Self::get_history_file() {
            if path.exists() {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(data) = serde_json::from_str::<UndoManager>(&content) {
                        self.undo_stack = data.undo_stack;
                        self.redo_stack = data.redo_stack;
                    }
                }
            }
        }
        Ok(())
    }
}

pub type UndoManagerState = Mutex<UndoManager>;

#[tauri::command]
pub fn apply_icon_tracked(
    folder_path: String,
    icon_path: String,
    state: State<'_, UndoManagerState>,
) -> Result<(), String> {
    let prev = folder_icon::get_current_icon(folder_path.clone())?;
    folder_icon::apply_icon(folder_path.clone(), icon_path.clone())?;

    let mut manager = state.lock().map_err(|e| e.to_string())?;
    manager.push_action(folder_path, prev, Some(icon_path));
    Ok(())
}

#[tauri::command]
pub fn restore_icon_tracked(
    folder_path: String,
    state: State<'_, UndoManagerState>,
) -> Result<(), String> {
    let prev = folder_icon::get_current_icon(folder_path.clone())?;
    folder_icon::restore_icon(folder_path.clone())?;

    let mut manager = state.lock().map_err(|e| e.to_string())?;
    manager.push_action(folder_path, prev, None);
    Ok(())
}

#[tauri::command]
pub fn undo_last(state: State<'_, UndoManagerState>) -> Result<Option<UndoEntry>, String> {
    let mut manager = state.lock().map_err(|e| e.to_string())?;
    if let Some(entry) = manager.undo() {
        if let Some(prev) = &entry.previous_icon {
            folder_icon::apply_icon(entry.folder_path.clone(), prev.clone())?;
        } else {
            folder_icon::restore_icon(entry.folder_path.clone())?;
        }
        Ok(Some(entry))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn redo_last(state: State<'_, UndoManagerState>) -> Result<Option<UndoEntry>, String> {
    let mut manager = state.lock().map_err(|e| e.to_string())?;
    if let Some(entry) = manager.redo() {
        if let Some(new_icon) = &entry.new_icon {
            folder_icon::apply_icon(entry.folder_path.clone(), new_icon.clone())?;
        } else {
            folder_icon::restore_icon(entry.folder_path.clone())?;
        }
        Ok(Some(entry))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn get_undo_state(state: State<'_, UndoManagerState>) -> Result<UndoStateInfo, String> {
    let manager = state.lock().map_err(|e| e.to_string())?;
    Ok(manager.get_info())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_undo_and_redo_stack_flow() {
        let mut manager = UndoManager {
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
        };

        assert!(!manager.get_info().can_undo);
        assert!(!manager.get_info().can_redo);

        manager.push_action(
            r"C:\TestFolder".to_string(),
            None,
            Some(r"C:\Icons\red.ico".to_string()),
        );

        let info = manager.get_info();
        assert!(info.can_undo);
        assert!(!info.can_redo);
        assert_eq!(info.undo_count, 1);

        let undone = manager.undo().unwrap();
        assert_eq!(undone.folder_path, r"C:\TestFolder");
        assert_eq!(undone.new_icon, Some(r"C:\Icons\red.ico".to_string()));
        assert_eq!(undone.previous_icon, None);

        let info_after_undo = manager.get_info();
        assert!(!info_after_undo.can_undo);
        assert!(info_after_undo.can_redo);

        let redone = manager.redo().unwrap();
        assert_eq!(redone.folder_path, r"C:\TestFolder");
        assert_eq!(redone.new_icon, Some(r"C:\Icons\red.ico".to_string()));

        let info_after_redo = manager.get_info();
        assert!(info_after_redo.can_undo);
        assert!(!info_after_redo.can_redo);
    }
}
