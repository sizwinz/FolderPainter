use crate::commands::folder_icon;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct UndoEntry {
    #[serde(default)]
    pub id: String,
    pub folder_path: String,
    #[serde(default)]
    pub folder_name: String,
    pub previous_icon: Option<String>,
    pub new_icon: Option<String>,
    #[serde(default)]
    pub action_type: String,
    #[serde(default)]
    pub recursive: bool,
    #[serde(default)]
    pub timestamp: u64,
    #[serde(default)]
    pub preview_data_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UndoStateInfo {
    pub can_undo: bool,
    pub can_redo: bool,
    pub undo_count: usize,
    pub redo_count: usize,
    pub last_undo: Option<UndoEntry>,
    pub last_redo: Option<UndoEntry>,
    pub undo_stack: Vec<UndoEntry>,
    pub redo_stack: Vec<UndoEntry>,
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

    pub fn push_action(
        &mut self,
        folder: String,
        prev: Option<String>,
        new: Option<String>,
        recursive: bool,
    ) {
        if self.undo_stack.len() >= 50 {
            self.undo_stack.remove(0);
        }
        let folder_name = Path::new(&folder)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(&folder)
            .to_string();

        let action_type = if new.is_some() {
            "apply".to_string()
        } else {
            "restore".to_string()
        };

        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let id = format!("{}_{}", timestamp, self.undo_stack.len() + 1);

        let preview_data_url = if let Some(icon_path) = &new {
            crate::commands::icon_convert::get_icon_preview_data_url(icon_path.clone()).ok()
        } else if let Some(prev_path) = &prev {
            crate::commands::icon_convert::get_icon_preview_data_url(prev_path.clone()).ok()
        } else {
            crate::commands::color_icons::get_default_folder_preview().ok()
        };

        self.undo_stack.push(UndoEntry {
            id,
            folder_path: folder,
            folder_name,
            previous_icon: prev,
            new_icon: new,
            action_type,
            recursive,
            timestamp,
            preview_data_url,
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

    pub fn undo_entry_by_id(&mut self, entry_id: &str) -> Option<UndoEntry> {
        if let Some(pos) = self.undo_stack.iter().position(|e| e.id == entry_id) {
            let entry = self.undo_stack.remove(pos);
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
            last_undo: self.undo_stack.last().cloned(),
            last_redo: self.redo_stack.last().cloned(),
            undo_stack: self.undo_stack.clone(),
            redo_stack: self.redo_stack.clone(),
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
            fs::write(path, json).map_err(|e| format!("Failed to write history file: {}", e))?;
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
    recursive: Option<bool>,
    state: State<'_, UndoManagerState>,
) -> Result<u32, String> {
    let folder = Path::new(&folder_path);
    if !folder.exists() {
        return Err(format!("Folder does not exist: {}", folder_path));
    }

    let is_rec = recursive.unwrap_or(false);
    let prev = folder_icon::get_current_icon(folder_path.clone())?;
    let count = folder_icon::apply_icon_tree(folder, &icon_path, is_rec)?;

    let mut manager = state.lock().map_err(|e| e.to_string())?;
    manager.push_action(folder_path, prev, Some(icon_path), is_rec);
    Ok(count)
}

#[tauri::command]
pub fn restore_icon_tracked(
    folder_path: String,
    recursive: Option<bool>,
    state: State<'_, UndoManagerState>,
) -> Result<u32, String> {
    let folder = Path::new(&folder_path);
    if !folder.exists() {
        return Err(format!("Folder does not exist: {}", folder_path));
    }

    let is_rec = recursive.unwrap_or(false);
    let prev = folder_icon::get_current_icon(folder_path.clone())?;
    let count = folder_icon::restore_icon_tree(folder, is_rec)?;

    let mut manager = state.lock().map_err(|e| e.to_string())?;
    manager.push_action(folder_path, prev, None, is_rec);
    Ok(count)
}

#[tauri::command]
pub fn undo_last(state: State<'_, UndoManagerState>) -> Result<Option<UndoEntry>, String> {
    let mut manager = state.lock().map_err(|e| e.to_string())?;
    if let Some(entry) = manager.undo() {
        let folder = Path::new(&entry.folder_path);
        if folder.exists() {
            if let Some(prev) = &entry.previous_icon {
                let _ = folder_icon::apply_icon_tree(folder, prev, entry.recursive);
            } else {
                let _ = folder_icon::restore_icon_tree(folder, entry.recursive);
            }
            crate::shell::notify::refresh_folder(folder);
            crate::shell::notify::broadcast_icon_repair();
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
        let folder = Path::new(&entry.folder_path);
        if folder.exists() {
            if let Some(new_icon) = &entry.new_icon {
                let _ = folder_icon::apply_icon_tree(folder, new_icon, entry.recursive);
            } else {
                let _ = folder_icon::restore_icon_tree(folder, entry.recursive);
            }
            crate::shell::notify::refresh_folder(folder);
            crate::shell::notify::broadcast_icon_repair();
        }
        Ok(Some(entry))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn undo_specific(
    entry_id: String,
    state: State<'_, UndoManagerState>,
) -> Result<Option<UndoEntry>, String> {
    let mut manager = state.lock().map_err(|e| e.to_string())?;
    if let Some(entry) = manager.undo_entry_by_id(&entry_id) {
        let folder = Path::new(&entry.folder_path);
        if folder.exists() {
            if let Some(prev) = &entry.previous_icon {
                let _ = folder_icon::apply_icon_tree(folder, prev, entry.recursive);
            } else {
                let _ = folder_icon::restore_icon_tree(folder, entry.recursive);
            }
            crate::shell::notify::refresh_folder(folder);
            crate::shell::notify::broadcast_icon_repair();
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
            false,
        );

        let info = manager.get_info();
        assert!(info.can_undo);
        assert!(!info.can_redo);
        assert_eq!(info.undo_count, 1);

        let undone = manager.undo().unwrap();
        assert_eq!(undone.folder_path, r"C:\TestFolder");
        assert_eq!(undone.new_icon, Some(r"C:\Icons\red.ico".to_string()));
        assert_eq!(undone.previous_icon, None);
        assert!(!undone.recursive);

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

    #[test]
    fn test_visual_undo_entries_metadata() {
        let mut manager = UndoManager {
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
        };

        manager.push_action(
            r"C:\Users\User\Projects".to_string(),
            None,
            Some(r"C:\Icons\blue.ico".to_string()),
            true,
        );

        let info = manager.get_info();
        assert!(info.last_undo.is_some());
        let last = info.last_undo.unwrap();
        assert_eq!(last.folder_name, "Projects");
        assert_eq!(last.action_type, "apply");
        assert!(last.recursive);
        assert!(!last.id.is_empty());
        assert_eq!(info.undo_stack.len(), 1);
    }

    #[test]
    fn test_undo_entry_by_id_specifically() {
        let mut manager = UndoManager {
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
        };

        // Push three entries: A, B, C
        manager.push_action(r"C:\FolderA".to_string(), None, Some(r"C:\iconA.ico".to_string()), false);
        manager.push_action(r"C:\FolderB".to_string(), None, Some(r"C:\iconB.ico".to_string()), false);
        manager.push_action(r"C:\FolderC".to_string(), None, Some(r"C:\iconC.ico".to_string()), false);

        assert_eq!(manager.undo_stack.len(), 3);
        let target_b_id = manager.undo_stack[1].id.clone();
        assert_eq!(manager.undo_stack[1].folder_name, "FolderB");

        // Specific undo on FolderB (item in the middle)
        let undone = manager.undo_entry_by_id(&target_b_id).expect("Should find and undo FolderB");
        assert_eq!(undone.folder_name, "FolderB");

        // Remaining in undo stack should be FolderA and FolderC
        assert_eq!(manager.undo_stack.len(), 2);
        assert_eq!(manager.undo_stack[0].folder_name, "FolderA");
        assert_eq!(manager.undo_stack[1].folder_name, "FolderC");

        // Redo stack should now contain FolderB
        assert_eq!(manager.redo_stack.len(), 1);
        assert_eq!(manager.redo_stack[0].folder_name, "FolderB");
    }
}
