#[derive(serde::Serialize)]
pub struct ProxyResponse {
    pub status: u16,
    pub body: String,
}

/// Proxy a simple HTTP request (GET/POST/PUT/DELETE) to a local endpoint.
/// This bypasses CORS restrictions by routing through the Rust backend.
#[tauri::command]
async fn ollama_proxy(url: String, method: Option<String>, body: Option<String>) -> Result<ProxyResponse, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let http_method = method.unwrap_or_else(|| "GET".to_string()).to_uppercase();
    let mut request = match http_method.as_str() {
        "POST" => client.post(&url),
        "GET" => client.get(&url),
        "DELETE" => client.delete(&url),
        "PUT" => client.put(&url),
        _ => return Err(format!("Unsupported HTTP method: {}", http_method)),
    };

    if let Some(body_str) = body {
        request = request
            .header("Content-Type", "application/json")
            .body(body_str);
    }

    let resp = request.send().await.map_err(|e| format!("HTTP request failed: {}", e))?;
    let status = resp.status().as_u16();
    let body_text = resp.text().await.map_err(|e| format!("Failed to read response body: {}", e))?;

    Ok(ProxyResponse {
        status,
        body: body_text,
    })
}

/// Stream a chat completion from Ollama, sending events back to the frontend.
#[tauri::command]
async fn ollama_proxy_stream(app: tauri::AppHandle, url: String, body: String) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let mut response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .body(body)
        .send()
        .await
        .map_err(|e| format!("Stream request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body_text = response.text().await.unwrap_or_default();
        let err_msg = format!("Ollama returned HTTP {}: {}", status, body_text);
        let _ = tauri::Emitter::emit(&app, "ollama-stream-error", &err_msg);
        return Err(err_msg);
    }

    loop {
        match response.chunk().await {
            Ok(Some(chunk)) => {
                let text = String::from_utf8_lossy(&chunk).to_string();
                if let Err(e) = tauri::Emitter::emit(&app, "ollama-stream-chunk", &text) {
                    let err_msg = format!("Failed to emit stream chunk: {}", e);
                    let _ = tauri::Emitter::emit(&app, "ollama-stream-error", &err_msg);
                    return Err(err_msg);
                }
            }
            Ok(None) => {
                let _ = tauri::Emitter::emit(&app, "ollama-stream-done", "");
                return Ok(());
            }
            Err(e) => {
                let err_msg = format!("Stream read error: {}", e);
                let _ = tauri::Emitter::emit(&app, "ollama-stream-error", &err_msg);
                return Err(err_msg);
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            ollama_proxy,
            ollama_proxy_stream,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
