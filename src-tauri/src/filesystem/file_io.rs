use std::fs;
use std::path::Path;

#[tauri::command]
pub async fn read_file(file_path: String) -> Result<String, String> {
    // Validate input path to prevent path traversal attacks
    if file_path.contains("..") || file_path.contains('\0') {
        return Err("Invalid file path: path traversal not allowed".to_string());
    }

    let expanded_path = if file_path.starts_with("~/") {
        let home = dirs::home_dir().ok_or_else(|| "Cannot find home directory".to_string())?;
        home.join(&file_path[2..])
    } else {
        Path::new(&file_path).to_path_buf()
    };

    // Canonicalize path to resolve any remaining .. or symlinks
    let canonical_path = expanded_path
        .canonicalize()
        .map_err(|_| "Invalid file path or file does not exist".to_string())?;

    if !canonical_path.exists() || canonical_path.is_dir() {
        return Err("File does not exist or is a directory".to_string());
    }

    // Check file size to prevent reading very large files
    if let Ok(metadata) = fs::metadata(&canonical_path) {
        if metadata.len() > 1024 * 1024 {
            // 1MB limit
            return Err("File is too large to display".to_string());
        }
    }

    match fs::read_to_string(&canonical_path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[tauri::command]
pub async fn write_file(file_path: String, content: String) -> Result<(), String> {
    // Validate input path to prevent path traversal attacks
    if file_path.contains("..") || file_path.contains('\0') {
        return Err("Invalid file path: path traversal not allowed".to_string());
    }

    let expanded_path = if file_path.starts_with("~/") {
        let home = dirs::home_dir().ok_or_else(|| "Cannot find home directory".to_string())?;
        home.join(&file_path[2..])
    } else {
        Path::new(&file_path).to_path_buf()
    };

    // Ensure parent directory exists and is valid
    if let Some(parent) = expanded_path.parent() {
        if !parent.exists() {
            return Err("Parent directory does not exist".to_string());
        }
        // Canonicalize parent to prevent traversal
        parent.canonicalize()
            .map_err(|_| "Invalid parent directory path".to_string())?;
    }

    // Basic safety check: only allow writing to text files
    let extension = expanded_path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|s| s.to_lowercase());

    let is_text_file = match extension.as_deref() {
        Some("txt") | Some("md") | Some("json") | Some("xml") | Some("yaml") | Some("yml")
        | Some("js") | Some("jsx") | Some("ts") | Some("tsx") | Some("rs") | Some("py")
        | Some("java") | Some("cpp") | Some("c") | Some("h") | Some("css") | Some("html")
        | Some("toml") | Some("cfg") | Some("ini") | Some("sh") | Some("log") => true,
        _ => false,
    };

    if !is_text_file {
        return Err("Only text files can be edited".to_string());
    }

    // Prevent writing extremely large files (protect against DoS)
    if content.len() > 10 * 1024 * 1024 {  // 10MB limit
        return Err("File content too large (max 10MB)".to_string());
    }

    match fs::write(&expanded_path, content) {
        Ok(()) => Ok(()),
        Err(e) => Err(format!("Failed to write file: {}", e)),
    }
}
