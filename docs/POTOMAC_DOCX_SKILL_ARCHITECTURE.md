# Potomac DOCX Skill System Architecture
## Technical Reference for Swift Implementation

---

## Overview
This document describes the complete architecture, state flow, and routing logic for the Potomac DOCX generation skill. All timing values, state transitions, and patterns are exactly implemented as shown in the production TypeScript codebase.

---

## 1. Skill Registration & Auto-Detection

### Detection Logic
The skill system uses **content-based routing**, not explicit identifiers:

| Trigger Condition | Routes To |
|-------------------|-----------|
| Tool name contains `docx`, `word`, or `document` | DOCX skill |
| Input payload contains `.docx` or `word` | DOCX skill |
| Any of 27 registered aliases (create_document, generate_docx, etc.) | DOCX skill |

### Swift Implementation
```swift
public enum DocumentType: String, CaseIterable {
    case docx, pptx, xlsx, pdf, afl, datapack, generic
    
    public static func detect(toolName: String, input: [String: Any]) -> DocumentType {
        let name = toolName.lowercased()
        let inputStr = String(describing: input).lowercased()
        
        // DOCX Detection
        if name.contains("docx") || name.contains("word") || name.contains("document") {
            return .docx
        }
        if inputStr.contains(".docx") || inputStr.contains("word") {
            return .docx
        }
        
        // PPTX Detection
        if name.contains("pptx") || name.contains("powerpoint") || name.contains("presentation") {
            return .pptx
        }
        
        // Default fallback
        return .generic
    }
}
```

---

## 2. State Machine Definition

### 4 Valid States
All components must implement exactly these states:

| State | Description | Behavior |
|-------|-------------|----------|
| `input-streaming` | LLM is still generating request | Start progress simulation |
| `input-available` | Complete request received | Backend generation started |
| `output-available` | File ready for download | Snap to 100% complete |
| `output-error` | Generation failed | Show error state |

### DOCX Generation Phases
```swift
let docxPhases = [
    "Analysing content requirements",
    "Structuring document outline",
    "Writing document content",
    "Applying formatting and styles",
    "Generating DOCX file",
    "Finalising document"
]
```

---

## 3. Progress Simulation Engine

### ✅ No Backend Polling Required
The frontend runs a deterministic simulation:
- Progress increments **0.3% - 1.5%** every **800-1200ms**
- Capped at **88%** until backend confirmation arrives
- Phase index calculated as `floor((progress / 85) * totalPhases)`
- Automatically advances phases based on progress value

### Timing Specification
| Parameter | Value |
|-----------|-------|
| Minimum increment | 0.3% |
| Maximum increment | 1.5% |
| Interval range | 800ms - 1200ms |
| Cap before confirmation | 88% |
| Completion snap duration | 600ms |
| Completion easing | `1 - pow(1 - t, 3)` |

---

## 4. Event Injection Routing System

### ✅ Zero Polling Architecture
This is the most important pattern:

```
1. Backend sends `file_download` events OUT-OF-BAND through SSE stream
2. ChatPage catches events in `onData` stream hook
3. Events cached in dictionary keyed by filename
4. DocumentGenerationCard receives injected URL via `externalOutput`
5. Card IMMEDIATELY snaps to complete state
```

### Swift Implementation Pattern
Use `NotificationCenter` for cross-component event routing:

```swift
// Define notification name
extension Notification.Name {
    static let documentGenerationComplete = Notification.Name("DocumentGenerationComplete")
}

// When file download event arrives
NotificationCenter.default.post(
    name: .documentGenerationComplete,
    object: nil,
    userInfo: [
        "filename": filename,
        "download_url": url,
        "file_id": fileId,
        "file_size": size
    ]
)

// In generation card view model
init() {
    NotificationCenter.default.addObserver(
        forName: .documentGenerationComplete,
        object: nil,
        queue: .main
    ) { [weak self] notification in
        guard let self = self,
              let url = notification.userInfo?["download_url"] as? String else { return }
        
        self.downloadUrl = url
        self.markAsComplete()
    }
}
```

---

## 5. Download Handling Logic

### URL Resolution
```swift
func resolveUrl(_ path: String) -> URL {
    let baseUrl = ProcessInfo.processInfo.environment["API_URL"] 
        ?? "https://developer-potomaac.up.railway.app"
    
    if path.starts(with: "/") {
        return URL(string: baseUrl + path)!
    }
    return URL(string: path)!
}
```

### Authentication Injection
- Always include Bearer token in request headers
- Use auth token from secure storage
- Handle 401 responses appropriately

### Blob Download Pattern
```swift
func handleDownload() async throws {
    var request = URLRequest(url: downloadUrl)
    request.addValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
    
    let (data, response) = try await URLSession.shared.data(for: request)
    
    let tempUrl = FileManager.default.temporaryDirectory
        .appendingPathComponent(filename)
    
    try data.write(to: tempUrl)
    
    // Present share sheet
    await MainActor.run {
        let activityVC = UIActivityViewController(
            activityItems: [tempUrl],
            applicationActivities: nil
        )
        present(activityVC, animated: true)
    }
}
```

---

## 6. Safety & Edge Cases

### ✅ Critical Safety Features
1. **2 Minute Timeout** - Show warning if stuck at 88% for >120s
2. **Auto-Cleanup** - All timers/invalidation on view disappear
3. **No Network When Hidden** - Pause all operations if not visible
4. **Graceful Degradation** - Works offline with cached state
5. **Idempotent Transitions** - State changes can be applied multiple times safely

### Error Handling
- All network operations have 30 second timeout
- 3 retry attempts with exponential backoff
- User visible error messages with retry button
- Never crash on invalid payloads

---

## 7. Swift Implementation Checklist

✅ **Required Components:**
- [ ] 4-state state machine with exact transitions
- [ ] 6-phase progress simulation with random timing
- [ ] Out-of-band event injection system
- [ ] URL resolution with auth header injection
- [ ] Blob based download handling
- [ ] Preview support using WKWebView
- [ ] 2 minute safety timeout
- [ ] All animation curves and timing values matching specification

---

## Reference Values

| Parameter | Exact Value |
|-----------|-------------|
| DOCX primary color | `#2B579A` |
| DOCX gradient | `linear-gradient(135deg, #2B579A 0%, #3B7DD8 100%)` |
| Progress animation interval | 800ms + random(0..400ms) |
| Completion snap duration | 600ms |
| Safety timeout | 120000ms |
| Card border radius | 14px |
| Icon size | 20pt |

---

*This document was generated directly from the production TypeScript implementation. All values are exact and should be reproduced precisely in Swift.*