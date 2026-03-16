# Potomac Analyst Workbench - Complete SwiftUI Reconstruction Guide

## Executive Summary

This document provides an exhaustive, step-by-step guide for reconstructing the Potomac Analyst Workbench frontend as a native SwiftUI application. It is designed to be used as both technical documentation and as a comprehensive prompt for AI-assisted development.

**Target Platforms:** iOS 17+, iPadOS 17+, macOS 14+ (Catalyst), watchOS 10+, visionOS 1+  
**Framework:** SwiftUI 5 with Swift 5.9+  
**Architecture:** MVVM (Model-View-ViewModel) with Observation Framework  
**Minimum Deployment:** iPhone 12 / iPad Pro 3rd Gen / Apple Watch Series 9 / Vision Pro

---

## Table of Contents

1. [Project Initialization](#1-project-initialization)
2. [Project Structure](#2-project-structure)
3. [Dependency Management](#3-dependency-management)
4. [Core Data Models](#4-core-data-models)
5. [Network Layer](#5-network-layer)
6. [Authentication System](#6-authentication-system)
7. [State Management](#7-state-management)
8. [Theme & Styling System](#8-theme--styling-system)
9. [Navigation Architecture](#9-navigation-architecture)
10. [Screen-by-Screen Implementation](#10-screen-by-screen-implementation)
11. [AI Chat & Streaming](#11-ai-chat--streaming)
12. [Generative UI Components](#12-generative-ui-components)
13. [File Upload System](#13-file-upload-system)
14. [Watch App Implementation](#14-watch-app-implementation)
15. [Vision Pro Implementation](#15-vision-pro-implementation)
16. [CarPlay Implementation](#16-carplay-implementation)
17. [Testing Strategy](#17-testing-strategy)
18. [App Store Deployment](#18-app-store-deployment)
19. [AI Development Prompt](#19-ai-development-prompt)

---

## 1. Project Initialization

### 1.1 Create Xcode Project

```bash
# Open Xcode and create new project:
# File > New > Project
# - Template: iOS > App
# - Product Name: Analyst
# - Team: [Your Team ID]
# - Organization Identifier: com.potomac
# - Interface: SwiftUI
# - Language: Swift
# - Storage: None (we'll implement custom persistence)
# - Include Tests: Yes
```

### 1.2 Project Settings

```swift
// Target Settings in Xcode:
// - Deployment Target: iOS 17.0
// - Supported Destinations: iPhone, iPad, Mac (Catalyst)
// - Device Orientation: Portrait (iPhone), All (iPad)
// - Status Bar Style: Light Content
// - Requires full screen: No (for iPad multitasking)
```

### 1.3 Info.plist Configuration

```xml
<!-- Info.plist additions -->
<key>UIUserInterfaceStyle</key>
<string>Automatic</string>
<key>NSFaceIDUsageDescription</key>
<string>Face ID is used for secure authentication to your Analyst account.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access is required for voice input to ask Yang questions.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>Speech recognition is used to process your voice commands for Yang.</string>
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
    <string>audio</string>
</array>
<key>Fonts provided by application</key>
<array>
    <string>Rajdhani-Bold.ttf</string>
    <string>Rajdhani-Medium.ttf</string>
    <string>Rajdhani-Regular.ttf</string>
    <string>Rajdhani-SemiBold.ttf</string>
    <string>Quicksand-Bold.ttf</string>
    <string>Quicksand-Medium.ttf</string>
    <string>Quicksand-Regular.ttf</string>
    <string>Quicksand-SemiBold.ttf</string>
    <string>FiraCode-Regular.ttf</string>
    <string>FiraCode-Medium.ttf</string>
</array>
```

### 1.4 Asset Catalog Setup

```
Assets.xcassets/
├── AppIcon.appiconset/
│   └── [All required sizes for iOS, iPad, Mac, Watch]
├── AccentColor.colorset/
│   └── { Potomac Yellow: #FEC00F }
├── Brand Colors/
│   ├── PotomacYellow.colorset/
│   ├── PotomacGray.colorset/
│   ├── PotomacTurquoise.colorset/
│   └── PotomacPink.colorset/
├── Surface Colors/
│   ├── SurfacePrimary.colorset/
│   ├── SurfaceSecondary.colorset/
│   ├── SurfaceInput.colorset/
│   └── BorderDefault.colorset/
├── Images/
│   ├── potomac-icon.imageset/
│   ├── potomac-logo-full.imageset/
│   └── potomac-logo-dark.imageset/
└── Symbols/
    └── [Custom SF Symbols if needed]
```

---

## 2. Project Structure

### 2.1 Folder Hierarchy

```
Analyst/
├── AnalystApp.swift                    // @main entry point
├── ContentView.swift                   // Root navigation container
│
├── Core/
│   ├── Constants/
│   │   ├── APIEndpoints.swift          // All API endpoint definitions
│   │   ├── AppConstants.swift          // Global constants
│   │   └── FeatureFlags.swift          // Feature toggles
│   ├── Extensions/
│   │   ├── Color+Extensions.swift      // Color helpers
│   │   ├── Font+Extensions.swift       // Custom font helpers
│   │   ├── String+Extensions.swift     // String utilities
│   │   ├── Date+Extensions.swift       // Date formatting
│   │   ├── Data+Extensions.swift       // Data helpers
│   │   └── View+Extensions.swift       // View modifiers
│   └── Utilities/
│       ├── Logger.swift                // Unified logging
│       ├── KeychainManager.swift       // Secure storage
│       ├── UserDefaultsManager.swift   // Preferences
│       └── HapticManager.swift         // Haptic feedback
│
├── Models/
│   ├── Auth/
│   │   ├── User.swift                  // User model
│   │   ├── AuthToken.swift             // Token model
│   │   └── AuthResponse.swift          // Login response
│   ├── Chat/
│   │   ├── Conversation.swift          // Conversation model
│   │   ├── Message.swift               // Message model
│   │   ├── MessageRole.swift           // User/Assistant enum
│   │   ├── ToolCall.swift              // Tool call model
│   │   └── StreamEvent.swift           // SSE event types
│   ├── Documents/
│   │   ├── Document.swift              // Knowledge base document
│   │   └── DocumentUpload.swift        // Upload model
│   ├── Backtest/
│   │   ├── BacktestResult.swift        // Backtest metrics
│   │   └── EquityCurve.swift           // Chart data
│   ├── Content/
│   │   ├── Article.swift               // Generated article
│   │   ├── SlideDeck.swift             // Presentation
│   │   └── ChatExport.swift            // Chat export
│   └── Common/
│       ├── APIError.swift              // Error types
│       ├── PaginatedResponse.swift     // Pagination wrapper
│       └── TimestampedModel.swift      // Base model protocol
│
├── ViewModels/
│   ├── AuthViewModel.swift             // Authentication state
│   ├── DashboardViewModel.swift        // Dashboard data
│   ├── ChatViewModel.swift             // Chat logic + streaming
│   ├── AFLViewModel.swift              // AFL code generation
│   ├── KnowledgeViewModel.swift        // Document management
│   ├── BacktestViewModel.swift         // Backtest results
│   ├── ContentViewModel.swift          // Content generation
│   ├── SettingsViewModel.swift         // User preferences
│   └── WatchViewModel.swift            // Watch complications
│
├── Services/
│   ├── Network/
│   │   ├── APIClient.swift             // Main API actor
│   │   ├── APIClientProtocol.swift     // Protocol for DI
│   │   ├── RequestBuilder.swift        // URLRequest construction
│   │   ├── ResponseDecoder.swift       // JSON decoding
│   │   └── NetworkError.swift          // Network error types
│   ├── Streaming/
│   │   ├── SSEClient.swift             // Server-Sent Events
│   │   ├── StreamParser.swift          // SSE parsing
│   │   └── StreamEventProcessor.swift  // Event handling
│   ├── Auth/
│   │   ├── AuthService.swift           // Auth operations
│   │   ├── TokenManager.swift          // Token refresh
│   │   └── BiometricService.swift      // Face ID/Touch ID
│   └── Storage/
│       ├── DocumentStorage.swift       // Local document cache
│       └── ImageCache.swift            // Image caching
│
├── Views/
│   ├── Root/
│   │   ├── SplashView.swift            // Launch screen
│   │   └── MainTabView.swift           // Tab container
│   ├── Auth/
│   │   ├── LoginView.swift             // Login screen
│   │   ├── RegisterView.swift          // Registration
│   │   ├── ForgotPasswordView.swift    // Password reset
│   │   └── Components/
│   │       ├── AuthTextField.swift     // Styled text field
│   │       ├── AuthButton.swift        // Primary/secondary buttons
│   │       └── BiometricButton.swift   // Face ID button
│   ├── Dashboard/
│   │   ├── DashboardView.swift         // Main dashboard
│   │   ├── FeatureCard.swift           // Feature card component
│   │   └── WelcomeHeader.swift         // User greeting
│   ├── Chat/
│   │   ├── ChatView.swift              // Chat container
│   │   ├── ConversationListView.swift  // Conversation list
│   │   ├── MessageView.swift           // Message bubble
│   │   ├── UserMessageView.swift       // User message style
│   │   ├── AssistantMessageView.swift  // Yang message style
│   │   ├── ToolCallView.swift          // Tool call card
│   │   ├── SourceCitationView.swift    // Source citations
│   │   ├── ChatInputView.swift         // Input field
│   │   ├── AttachmentPicker.swift      // File attachments
│   │   └── Components/
│   │       ├── TypingIndicator.swift   // Animated dots
│   │       ├── MessageTimestamp.swift  // Time display
│   │       └── StreamingTextView.swift // Animated text
│   ├── AFL/
│   │   ├── AFLGeneratorView.swift      // AFL main view
│   │   ├── CodeEditorView.swift        // Code display
│   │   ├── PromptInputView.swift       // Strategy input
│   │   └── Components/
│   │       ├── SyntaxHighlighter.swift // Code highlighting
│   │       ├── CodeToolbar.swift       // Copy/share actions
│   │       └── AFLTemplatePicker.swift // Strategy templates
│   ├── Knowledge/
│   │   ├── KnowledgeBaseView.swift     // Document list
│   │   ├── DocumentUploadView.swift    // Upload modal
│   │   ├── DocumentRow.swift           // List row
│   │   └── DocumentDetailView.swift    // Document preview
│   ├── Backtest/
│   │   ├── BacktestView.swift          // Results view
│   │   ├── MetricsGrid.swift           // Metrics cards
│   │   ├── EquityChartView.swift       // Line chart
│   │   └── ResultsUploadView.swift     // JSON upload
│   ├── Content/
│   │   ├── ContentView.swift           // Content tabs
│   │   ├── ArticlesListView.swift      // Generated articles
│   │   ├── SlideDecksView.swift        // Presentations
│   │   ├── ChatExportsView.swift       // Chat exports
│   │   └── DocumentGeneratorView.swift // Doc generation
│   ├── Settings/
│   │   ├── SettingsView.swift          // Settings list
│   │   ├── ProfileSection.swift        // User info
│   │   ├── APIKeysSection.swift        // Key management
│   │   ├── AppearanceSection.swift     // Theme settings
│   │   ├── NotificationsSection.swift  // Alert settings
│   │   └── SecuritySection.swift       // Password/Face ID
│   └── Shared/
│       ├── Components/
│       │   ├── PotomacButton.swift     // Brand button
│       │   ├── PotomacTextField.swift  // Styled input
│       │   ├── CardView.swift          // Card container
│       │   ├── LoadingView.swift       // Loading indicator
│       │   ├── EmptyStateView.swift    // Empty content
│       │   ├── ErrorView.swift         // Error display
│       │   ├── AsyncImageView.swift    // Remote images
│       │   └── ToastView.swift         // Toast notifications
│       └── Modifiers/
│           ├── CardStyle.swift         // Card modifier
│           ├── Shimmer.swift           // Loading shimmer
│           ├── AdaptiveToolbar.swift   // Toolbar modifier
│           └── KeyboardAware.swift     // Keyboard handling
│
├── Theme/
│   ├── AppTheme.swift                  // Theme definitions
│   ├── Colors.swift                    // All color definitions
│   ├── Typography.swift                // Font definitions
│   ├── Spacing.swift                   // Spacing constants
│   ├── CornerRadius.swift              // Corner radius values
│   └── Shadows.swift                   // Shadow styles
│
├── Resources/
│   ├── Fonts/                          // Custom font files
│   │   ├── Rajdhani/
│   │   ├── Quicksand/
│   │   └── FiraCode/
│   └── Sounds/
│       ├── message_sent.caf            // Send sound
│       ├── message_received.caf        // Receive sound
│       └── success.caf                 // Success sound
│
├── WatchApp/                           // watchOS target
│   ├── WatchApp.swift
│   ├── Views/
│   │   ├── WatchDashboardView.swift
│   │   ├── WatchComplicationView.swift
│   │   ├── WatchNotificationView.swift
│   │   └── WatchVoiceInputView.swift
│   └── Complications/
│       ├── PortfolioComplication.swift
│       └── AlertComplication.swift
│
├── VisionApp/                          // visionOS target
│   ├── VisionApp.swift
│   └── Views/
│       ├── SpatialDashboardView.swift
│       ├── SpatialChatView.swift
│       └── SpatialDataVizView.swift
│
├── AnalystTests/                       // Unit tests
│   ├── ViewModels/
│   │   ├── AuthViewModelTests.swift
│   │   ├── ChatViewModelTests.swift
│   │   └── AFLViewModelTests.swift
│   ├── Services/
│   │   ├── APIClientTests.swift
│   │   └── SSEClientTests.swift
│   └── Models/
│       ├── MessageTests.swift
│       └── ConversationTests.swift
│
└── AnalystUITests/                     // UI tests
    ├── AuthFlows.swift
    ├── ChatFlows.swift
    └── NavigationFlows.swift
```

---

## 3. Dependency Management

### 3.1 Package.swift (Swift Package Manager)

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Analyst",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
        .watchOS(.v10),
        .visionOS(.v1)
    ],
    products: [
        .library(name: "AnalystCore", targets: ["AnalystCore"]),
    ],
    dependencies: [
        // MARK: - Networking
        .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),
        
        // MARK: - Code Editor
        .package(url: "https://github.com/simonbs/Runestone.git", from: "0.4.0"),
        
        // MARK: - Charts
        .package(url: "https://github.com/danielgindi/Charts.git", from: "5.0.0"),
        
        // MARK: - Markdown
        .package(url: "https://github.com/apple/swift-markdown.git", from: "0.3.0"),
        
        // MARK: - Keychain
        .package(url: "https://github.com/evgenyneu/keychain-swift.git", from: "21.0.0"),
        
        // MARK: - Logging
        .package(url: "https://github.com/apple/swift-log.git", from: "1.5.0"),
        
        // MARK: - Testing
        .package(url: "https://github.com/pointfreeco/swift-snapshot-testing.git", from: "1.15.0"),
    ],
    targets: [
        .target(
            name: "AnalystCore",
            dependencies: [
                .product(name: "Alamofire", package: "Alamofire"),
                .product(name: "Runestone", package: "Runestone"),
                .product(name: "Charts", package: "Charts"),
                .product(name: "Markdown", package: "swift-markdown"),
                .product(name: "KeychainSwift", package: "keychain-swift"),
                .product(name: "Logging", package: "swift-log"),
            ]
        ),
        .testTarget(
            name: "AnalystCoreTests",
            dependencies: ["AnalystCore", .product(name: "SnapshotTesting", package: "swift-snapshot-testing")]
        ),
    ]
)
```

### 3.2 Alternative: CocoaPods Podfile

```ruby
# Podfile
platform :ios, '17.0'
use_frameworks!

target 'Analyst' do
  # Networking
  pod 'Alamofire', '~> 5.8'
  
  # Code Editor
  pod 'Runestone', '~> 0.4'
  
  # Charts
  pod 'Charts', '~> 5.0'
  
  # Markdown Rendering
  pod 'MarkdownView', '~> 2.0'
  
  # Keychain
  pod 'KeychainSwift', '~> 21.0'
  
  # Image Loading
  pod 'Kingfisher', '~> 7.10'
  
  # Toast Notifications
  pod 'Toast-Swift', '~> 5.0'
  
  # Lottie Animations
  pod 'lottie-ios', '~> 4.3'
  
  target 'AnalystTests' do
    inherit! :search_paths
    pod 'Quick', '~> 7.0'
    pod 'Nimble', '~> 12.0'
  end
end

target 'AnalystWatch' do
  platform :watchos, '10.0'
  pod 'Alamofire', '~> 5.8'
end
```

---

## 4. Core Data Models

### 4.1 User Model

```swift
// Models/Auth/User.swift
import Foundation

struct User: Codable, Identifiable, Hashable {
    let id: String
    let email: String
    let nickname: String?
    let avatarUrl: String?
    let createdAt: Date
    let updatedAt: Date
    let settings: UserSettings?
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case nickname
        case avatarUrl = "avatar_url"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case settings
    }
    
    var displayName: String {
        nickname ?? email.components(separatedBy: "@").first ?? email
    }
    
    var initials: String {
        let name = displayName
        let parts = name.components(separatedBy: " ")
        if parts.count >= 2 {
            return String(parts[0].prefix(1)) + String(parts[1].prefix(1))
        }
        return String(name.prefix(2)).uppercased()
    }
}

struct UserSettings: Codable, Hashable {
    var theme: AppTheme = .system
    var fontSize: FontSize = .medium
    var notificationsEnabled: Bool = true
    var emailAlerts: Bool = true
    var hapticFeedback: Bool = true
    
    enum AppTheme: String, Codable {
        case system, light, dark
    }
    
    enum FontSize: String, Codable {
        case small, medium, large
    }
}
```

### 4.2 Auth Models

```swift
// Models/Auth/AuthToken.swift
import Foundation

struct AuthToken: Codable, Hashable {
    let accessToken: String
    let refreshToken: String?
    let expiresIn: Int
    let tokenType: String
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case tokenType = "token_type"
    }
    
    var expirationDate: Date {
        Date().addingTimeInterval(TimeInterval(expiresIn))
    }
    
    var isExpired: Bool {
        Date() >= expirationDate
    }
}

// Models/Auth/AuthResponse.swift
struct AuthResponse: Codable {
    let user: User
    let token: AuthToken
}
```

### 4.3 Chat Models

```swift
// Models/Chat/Message.swift
import Foundation

struct Message: Identifiable, Codable, Hashable {
    let id: String
    let conversationId: String
    let role: MessageRole
    var content: String
    let createdAt: Date
    var toolCalls: [ToolCall]?
    var sources: [Source]?
    var isStreaming: Bool
    
    enum CodingKeys: String, CodingKey {
        case id
        case conversationId = "conversation_id"
        case role
        case content
        case createdAt = "created_at"
        case toolCalls = "tool_calls"
        case sources
        case isStreaming = "is_streaming"
    }
    
    init(
        id: String = UUID().uuidString,
        conversationId: String,
        role: MessageRole,
        content: String,
        createdAt: Date = Date(),
        toolCalls: [ToolCall]? = nil,
        sources: [Source]? = nil,
        isStreaming: Bool = false
    ) {
        self.id = id
        self.conversationId = conversationId
        self.role = role
        self.content = content
        self.createdAt = createdAt
        self.toolCalls = toolCalls
        self.sources = sources
        self.isStreaming = isStreaming
    }
}

enum MessageRole: String, Codable {
    case user
    case assistant
    case system
}

// Models/Chat/ToolCall.swift
struct ToolCall: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let arguments: [String: AnyCodable]
    let result: AnyCodable?
    
    var displayTitle: String {
        switch name {
        case "stock_analysis":
            return "Stock Analysis"
        case "generate_afl":
            return "AFL Strategy Generated"
        case "web_search":
            return "Web Search"
        case "document_search":
            return "Knowledge Base Search"
        default:
            return name.capitalized
        }
    }
    
    var iconName: String {
        switch name {
        case "stock_analysis": return "chart.line.uptrend.xyaxis"
        case "generate_afl": return "chevron.left.forwardslash.chevron.right"
        case "web_search": return "globe"
        case "document_search": return "doc.text.magnifyingglass"
        default: return "wrench.and.screwdriver"
        }
    }
    
    var iconColor: Color {
        switch name {
        case "stock_analysis": return .green
        case "generate_afl": return .blue
        case "web_search": return .purple
        case "document_search": return .orange
        default: return .gray
        }
    }
}

// Models/Chat/Source.swift
struct Source: Identifiable, Codable, Hashable {
    let id: String
    let title: String
    let url: String?
    let snippet: String?
    let type: SourceType
    
    enum SourceType: String, Codable {
        case document, web, code
    }
}

// Helper for flexible JSON decoding
struct AnyCodable: Codable, Hashable {
    let value: Any
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let string = try? container.decode(String.self) {
            value = string
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues { $0.value }
        } else {
            value = ""
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let string = value as? String {
            try container.encode(string)
        } else if let int = value as? Int {
            try container.encode(int)
        } else if let double = value as? Double {
            try container.encode(double)
        } else if let bool = value as? Bool {
            try container.encode(bool)
        }
    }
    
    init(_ value: Any) {
        self.value = value
    }
}
```

### 4.4 Conversation Model

```swift
// Models/Chat/Conversation.swift
import Foundation

struct Conversation: Identifiable, Codable, Hashable {
    let id: String
    var title: String
    let createdAt: Date
    var updatedAt: Date
    var messageCount: Int
    var lastMessage: String?
    
    enum CodingKeys: String, CodingKey {
        case id, title
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case messageCount = "message_count"
        case lastMessage = "last_message"
    }
    
    var displayTitle: String {
        if title.isEmpty {
            return "New Conversation"
        }
        return title
    }
    
    var formattedDate: String {
        let calendar = Calendar.current
        if calendar.isDateInToday(updatedAt) {
            let formatter = DateFormatter()
            formatter.timeStyle = .short
            return formatter.string(from: updatedAt)
        } else if calendar.isDateInYesterday(updatedAt) {
            return "Yesterday"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "MMM d"
            return formatter.string(from: updatedAt)
        }
    }
}
```

### 4.5 Document Model

```swift
// Models/Documents/Document.swift
import Foundation

struct KnowledgeDocument: Identifiable, Codable, Hashable {
    let id: String
    let filename: String
    let fileType: FileType
    let fileSize: Int64
    let uploadedAt: Date
    let status: DocumentStatus
    let chunkCount: Int?
    
    enum CodingKeys: String, CodingKey {
        case id, filename
        case fileType = "file_type"
        case fileSize = "file_size"
        case uploadedAt = "uploaded_at"
        case status
        case chunkCount = "chunk_count"
    }
    
    enum FileType: String, Codable {
        case pdf, txt, csv, json, md
        
        var iconName: String {
            switch self {
            case .pdf: return "doc.fill"
            case .txt: return "doc.text"
            case .csv: return "tablecells"
            case .json: return "curlybraces"
            case .md: return "doc.richtext"
            }
        }
        
        var color: Color {
            switch self {
            case .pdf: return .red
            case .txt: return .blue
            case .csv: return .green
            case .json: return .orange
            case .md: return .purple
            }
        }
    }
    
    enum DocumentStatus: String, Codable {
        case processing, ready, error
    }
    
    var formattedSize: String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: fileSize)
    }
}
```

### 4.6 Stream Event Model

```swift
// Models/Chat/StreamEvent.swift
import Foundation

enum StreamEvent: Sendable {
    case textDelta(String)
    case toolCallStart(ToolCallStart)
    case toolCallDelta(ToolCallDelta)
    case toolCallComplete(ToolCallComplete)
    case sourceCitation(Source)
    case reasoningStep(String)
    case finished
    case error(Error)
}

struct ToolCallStart: Sendable {
    let id: String
    let name: String
}

struct ToolCallDelta: Sendable {
    let toolCallId: String
    let argumentDelta: String
}

struct ToolCallComplete: Sendable {
    let toolCallId: String
    let result: String
}

struct StreamError: Error, Sendable {
    let message: String
    let code: String?
}
```

---

## 5. Network Layer

### 5.1 API Client Protocol

```swift
// Services/Network/APIClientProtocol.swift
import Foundation

protocol APIClientProtocol: Actor {
    var isAuthenticated: Bool { get }
    
    // Auth
    func login(email: String, password: String) async throws -> AuthResponse
    func register(email: String, password: String, nickname: String?) async throws -> AuthResponse
    func logout() async throws
    func refreshToken() async throws -> AuthToken
    func getCurrentUser() async throws -> User
    
    // Conversations
    func getConversations(page: Int, limit: Int) async throws -> PaginatedResponse<Conversation>
    func createConversation(title: String?) async throws -> Conversation
    func getConversation(id: String) async throws -> Conversation
    func deleteConversation(id: String) async throws
    func renameConversation(id: String, title: String) async throws -> Conversation
    
    // Messages
    func getMessages(conversationId: String, page: Int, limit: Int) async throws -> PaginatedResponse<Message>
    
    // Knowledge Base
    func getDocuments(page: Int, limit: Int) async throws -> PaginatedResponse<KnowledgeDocument>
    func uploadDocument(data: Data, filename: String, fileType: KnowledgeDocument.FileType) async throws -> KnowledgeDocument
    func deleteDocument(id: String) async throws
    
    // Backtest
    func uploadBacktestResult(data: Data) async throws -> BacktestResult
    func getBacktestResults(page: Int, limit: Int) async throws -> PaginatedResponse<BacktestResult>
    
    // Content
    func getGeneratedContent(type: ContentType, page: Int, limit: Int) async throws -> PaginatedResponse<GeneratedContent>
    func generateContent(request: ContentGenerationRequest) async throws -> GeneratedContent
}
```

### 5.2 API Client Implementation

```swift
// Services/Network/APIClient.swift
import Foundation
import Alamofire

actor APIClient: APIClientProtocol {
    static let shared = APIClient()
    
    private let baseURL: URL
    private let session: Session
    private let decoder: JSONDecoder
    private let keychain: KeychainManager
    private let logger: Logger
    
    private(set) var isAuthenticated: Bool = false
    private var accessToken: String?
    
    private init(
        baseURL: URL = URL(string: "https://potomac-analyst-workbench-production.up.railway.app")!,
        keychain: KeychainManager = .shared,
        logger: Logger = .init(label: "com.potomac.analyst.api")
    ) {
        self.baseURL = baseURL
        self.keychain = keychain
        self.logger = logger
        
        // Configure session with interceptors
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 300
        configuration.waitsForConnectivity = true
        
        let interceptor = AuthInterceptor(keychain: keychain)
        self.session = Session(configuration: configuration, interceptor: interceptor)
        
        // Configure decoder
        self.decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Try ISO8601 first
            let iso8601Formatter = ISO8601DateFormatter()
            iso8601Formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = iso8601Formatter.date(from: dateString) {
                return date
            }
            
            // Fallback to other formats
            let formatter = DateFormatter()
            formatter.locale = Locale(identifier: "en_US_POSIX")
            let formats = [
                "yyyy-MM-dd'T'HH:mm:ss.SSSSSSZZZZZ",
                "yyyy-MM-dd'T'HH:mm:ssZZZZZ",
                "yyyy-MM-dd HH:mm:ss"
            ]
            
            for format in formats {
                formatter.dateFormat = format
                if let date = formatter.date(from: dateString) {
                    return date
                }
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date: \(dateString)")
        }
        
        // Check for existing token
        Task {
            if let token = keychain.get(.accessToken), !token.isEmpty {
                self.accessToken = token
                self.isAuthenticated = true
            }
        }
    }
    
    // MARK: - Auth
    
    func login(email: String, password: String) async throws -> AuthResponse {
        let response = try await request(
            .post,
            "/api/v2/auth/login",
            body: ["email": email, "password": password]
        )
        
        let authResponse = try decoder.decode(AuthResponse.self, from: response)
        try storeTokens(authResponse.token)
        isAuthenticated = true
        
        logger.info("User logged in successfully", metadata: ["user_id": .string(authResponse.user.id)])
        
        return authResponse
    }
    
    func register(email: String, password: String, nickname: String?) async throws -> AuthResponse {
        var body: [String: Any] = ["email": email, "password": password]
        if let nickname = nickname {
            body["nickname"] = nickname
        }
        
        let response = try await request(.post, "/api/v2/auth/register", body: body)
        let authResponse = try decoder.decode(AuthResponse.self, from: response)
        try storeTokens(authResponse.token)
        isAuthenticated = true
        
        return authResponse
    }
    
    func logout() async throws {
        _ = try? await request(.post, "/api/v2/auth/logout")
        clearTokens()
        isAuthenticated = false
    }
    
    func refreshToken() async throws -> AuthToken {
        guard let refreshToken = keychain.get(.refreshToken) else {
            throw APIError.unauthorized
        }
        
        let response = try await request(
            .post,
            "/api/v2/auth/refresh",
            body: ["refresh_token": refreshToken]
        )
        
        let token = try decoder.decode(AuthToken.self, from: response)
        try storeTokens(token)
        
        return token
    }
    
    func getCurrentUser() async throws -> User {
        let response = try await request(.get, "/api/v2/auth/me")
        return try decoder.decode(User.self, from: response)
    }
    
    // MARK: - Conversations
    
    func getConversations(page: Int = 1, limit: Int = 20) async throws -> PaginatedResponse<Conversation> {
        let response = try await request(
            .get,
            "/api/v2/conversations",
            queryItems: ["page": page, "limit": limit]
        )
        return try decoder.decode(PaginatedResponse<Conversation>.self, from: response)
    }
    
    func createConversation(title: String? = nil) async throws -> Conversation {
        var body: [String: Any] = [:]
        if let title = title {
            body["title"] = title
        }
        
        let response = try await request(.post, "/api/v2/conversations", body: body)
        return try decoder.decode(Conversation.self, from: response)
    }
    
    func getConversation(id: String) async throws -> Conversation {
        let response = try await request(.get, "/api/v2/conversations/\(id)")
        return try decoder.decode(Conversation.self, from: response)
    }
    
    func deleteConversation(id: String) async throws {
        _ = try await request(.delete, "/api/v2/conversations/\(id)")
    }
    
    func renameConversation(id: String, title: String) async throws -> Conversation {
        let response = try await request(
            .patch,
            "/api/v2/conversations/\(id)",
            body: ["title": title]
        )
        return try decoder.decode(Conversation.self, from: response)
    }
    
    // MARK: - Messages
    
    func getMessages(conversationId: String, page: Int = 1, limit: Int = 50) async throws -> PaginatedResponse<Message> {
        let response = try await request(
            .get,
            "/api/v2/conversations/\(conversationId)/messages",
            queryItems: ["page": page, "limit": limit]
        )
        return try decoder.decode(PaginatedResponse<Message>.self, from: response)
    }
    
    // MARK: - Knowledge Base
    
    func getDocuments(page: Int = 1, limit: Int = 20) async throws -> PaginatedResponse<KnowledgeDocument> {
        let response = try await request(
            .get,
            "/api/v2/brain/documents",
            queryItems: ["page": page, "limit": limit]
        )
        return try decoder.decode(PaginatedResponse<KnowledgeDocument>.self, from: response)
    }
    
    func uploadDocument(data: Data, filename: String, fileType: KnowledgeDocument.FileType) async throws -> KnowledgeDocument {
        let url = baseURL.appendingPathComponent("/api/v2/brain/upload")
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Add file data
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(fileType.mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        let (responseData, _) = try await URLSession.shared.data(for: request)
        return try decoder.decode(KnowledgeDocument.self, from: responseData)
    }
    
    func deleteDocument(id: String) async throws {
        _ = try await request(.delete, "/api/v2/brain/documents/\(id)")
    }
    
    // MARK: - Private Helpers
    
    private func request(
        _ method: HTTPMethod,
        _ path: String,
        body: [String: Any]? = nil,
        queryItems: [String: Any]? = nil
    ) async throws -> Data {
        var url = baseURL.appendingPathComponent(path)
        
        // Add query items
        if let queryItems = queryItems {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)!
            components.queryItems = queryItems.map { URLQueryItem(name: $0.key, value: "\($0.value)") }
            url = components.url!
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        
        // Add body
        if let body = body {
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        
        // Add auth header
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Make request
        let (data, response) = try await session.data(for: request)
        
        // Check for errors
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return data
        case 401:
            // Try to refresh token
            if method != .post || !path.contains("/auth/") {
                _ = try? await refreshToken()
                // Retry request
                return try await self.request(method, path, body: body, queryItems: queryItems)
            }
            throw APIError.unauthorized
        case 403:
            throw APIError.forbidden
        case 404:
            throw APIError.notFound
        case 400...499:
            let errorMessage = (try? JSONDecoder().decode(ErrorResponse.self, from: data))?.message ?? "Request failed"
            throw APIError.clientError(errorMessage)
        case 500...599:
            throw APIError.serverError
        default:
            throw APIError.unknown
        }
    }
    
    private func storeTokens(_ token: AuthToken) throws {
        try keychain.set(token.accessToken, forKey: .accessToken)
        if let refreshToken = token.refreshToken {
            try keychain.set(refreshToken, forKey: .refreshToken)
        }
        self.accessToken = token.accessToken
    }
    
    private func clearTokens() {
        keychain.delete(.accessToken)
        keychain.delete(.refreshToken)
        accessToken = nil
    }
}

// MARK: - Supporting Types

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

struct ErrorResponse: Codable {
    let message: String
    let code: String?
}

enum APIError: Error, LocalizedError {
    case unauthorized
    case forbidden
    case notFound
    case clientError(String)
    case serverError
    case invalidResponse
    case decodingError(Error)
    case unknown
    
    var errorDescription: String? {
        switch self {
        case .unauthorized:
            return "Your session has expired. Please log in again."
        case .forbidden:
            return "You don't have permission to access this resource."
        case .notFound:
            return "The requested resource was not found."
        case .clientError(let message):
            return message
        case .serverError:
            return "A server error occurred. Please try again later."
        case .invalidResponse:
            return "Invalid response from server."
        case .decodingError(let error):
            return "Failed to process response: \(error.localizedDescription)"
        case .unknown:
            return "An unknown error occurred."
        }
    }
}

struct PaginatedResponse<T: Codable>: Codable {
    let items: [T]
    let total: Int
    let page: Int
    let limit: Int
    let hasMore: Bool
    
    enum CodingKeys: String, CodingKey {
        case items
        case total
        case page
        case limit
        case hasMore = "has_more"
    }
}

// MARK: - Auth Interceptor

class AuthInterceptor: RequestInterceptor {
    private let keychain: KeychainManager
    
    init(keychain: KeychainManager) {
        self.keychain = keychain
    }
    
    func adapt(_ urlRequest: URLRequest, for session: Session, completion: @escaping (Result<URLRequest, Error>) -> Void) {
        var request = urlRequest
        
        if let token = keychain.get(.accessToken), !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        completion(.success(request))
    }
    
    func retry(_ request: Request, for session: Session, dueTo error: Error, completion: @escaping (RetryResult) -> Void) {
        guard let response = request.task?.response as? HTTPURLResponse, response.statusCode == 401 else {
            completion(.doNotRetry)
            return
        }
        
        // Token refresh logic would go here
        completion(.doNotRetryWithError(APIError.unauthorized))
    }
}

// MARK: - File Type Extension

extension KnowledgeDocument.FileType {
    var mimeType: String {
        switch self {
        case .pdf: return "application/pdf"
        case .txt: return "text/plain"
        case .csv: return "text/csv"
        case .json: return "application/json"
        case .md: return "text/markdown"
        }
    }
    
    static func from(filename: String) -> Self {
        let ext = (filename as NSString).pathExtension.lowercased()
        switch ext {
        case "pdf": return .pdf
        case "txt": return .txt
        case "csv": return .csv
        case "json": return .json
        case "md", "markdown": return .md
        default: return .txt
        }
    }
}
```

---

## 6. Authentication System

### 6.1 AuthViewModel

```swift
// ViewModels/AuthViewModel.swift
import Foundation
import Observation
import LocalAuthentication

@Observable
final class AuthViewModel {
    // MARK: - Published State
    
    var user: User?
    var isLoading: Bool = true
    var error: AuthError?
    var isBiometricAvailable: Bool = false
    
    // MARK: - Computed Properties
    
    var isAuthenticated: Bool {
        user != nil && !isLoading
    }
    
    var canUseBiometrics: Bool {
        isBiometricAvailable && user != nil
    }
    
    // MARK: - Dependencies
    
    private let apiClient: APIClientProtocol
    private let keychain: KeychainManager
    private let biometricService: BiometricService
    
    // MARK: - Init
    
    init(
        apiClient: APIClientProtocol = APIClient.shared,
        keychain: KeychainManager = .shared,
        biometricService: BiometricService = .shared
    ) {
        self.apiClient = apiClient
        self.keychain = keychain
        self.biometricService = biometricService
        
        Task {
            await checkBiometricAvailability()
            await checkAuth()
        }
    }
    
    // MARK: - Public Methods
    
    @MainActor
    func checkAuth() async {
        isLoading = true
        error = nil
        
        do {
            // Check if we have stored credentials
            guard keychain.contains(.accessToken) else {
                isLoading = false
                return
            }
            
            // Validate token with server
            let user = try await apiClient.getCurrentUser()
            self.user = user
            
            // Log successful auth restoration
            Logger.auth.info("Auth restored for user: \(user.id)")
        } catch {
            // Token is invalid, clear it
            clearStoredCredentials()
            Logger.auth.warning("Auth check failed: \(error.localizedDescription)")
        }
        
        isLoading = false
    }
    
    @MainActor
    func login(email: String, password: String) async throws {
        isLoading = true
        error = nil
        
        defer { isLoading = false }
        
        // Validate input
        guard !email.isEmpty else {
            throw AuthError.emptyEmail
        }
        
        guard !password.isEmpty else {
            throw AuthError.emptyPassword
        }
        
        guard isValidEmail(email) else {
            throw AuthError.invalidEmail
        }
        
        do {
            let response = try await apiClient.login(email: email, password: password)
            user = response.user
            
            // Store credentials for biometric auth
            if isBiometricAvailable {
                try keychain.set(email, forKey: .savedEmail)
            }
            
            Logger.auth.info("User logged in: \(response.user.id)")
        } catch let error as APIError {
            throw AuthError.fromAPI(error)
        }
    }
    
    @MainActor
    func register(email: String, password: String, confirmPassword: String, nickname: String?) async throws {
        isLoading = true
        error = nil
        
        defer { isLoading = false }
        
        // Validate input
        guard !email.isEmpty else {
            throw AuthError.emptyEmail
        }
        
        guard isValidEmail(email) else {
            throw AuthError.invalidEmail
        }
        
        guard password.count >= 8 else {
            throw AuthError.weakPassword
        }
        
        guard password == confirmPassword else {
            throw AuthError.passwordMismatch
        }
        
        do {
            let response = try await apiClient.register(email: email, password: password, nickname: nickname)
            user = response.user
            
            Logger.auth.info("User registered: \(response.user.id)")
        } catch let error as APIError {
            throw AuthError.fromAPI(error)
        }
    }
    
    @MainActor
    func authenticateWithBiometrics() async throws {
        guard isBiometricAvailable else {
            throw AuthError.biometricNotAvailable
        }
        
        isLoading = true
        defer { isLoading = false }
        
        // Attempt biometric authentication
        let success = try await biometricService.authenticate(reason: "Sign in to your Analyst account")
        
        guard success else {
            throw AuthError.biometricFailed
        }
        
        // Retrieve saved credentials
        guard let savedEmail = keychain.get(.savedEmail) else {
            throw AuthError.noSavedCredentials
        }
        
        // For security, we don't store the password
        // Instead, we rely on the stored access token
        // This flow would be for re-authentication when token is still valid
        
        try await checkAuth()
    }
    
    @MainActor
    func logout() async {
        isLoading = true
        
        do {
            try await apiClient.logout()
        } catch {
            // Ignore logout errors - we'll clear local state anyway
            Logger.auth.warning("Logout API call failed: \(error.localizedDescription)")
        }
        
        clearStoredCredentials()
        user = nil
        isLoading = false
        
        Logger.auth.info("User logged out")
    }
    
    @MainActor
    func updateProfile(nickname: String?) async throws {
        guard let user = user else {
            throw AuthError.notAuthenticated
        }
        
        // API call to update profile would go here
        // For now, just update locally
        self.user = User(
            id: user.id,
            email: user.email,
            nickname: nickname,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
            updatedAt: Date(),
            settings: user.settings
        )
    }
    
    // MARK: - Private Helpers
    
    private func checkBiometricAvailability() async {
        isBiometricAvailable = await biometricService.isAvailable
    }
    
    private func clearStoredCredentials() {
        keychain.delete(.accessToken)
        keychain.delete(.refreshToken)
    }
    
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = #"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"#
        return email.range(of: emailRegex, options: .regularExpression) != nil
    }
}

// MARK: - Auth Error

enum AuthError: Error, LocalizedError {
    case notAuthenticated
    case emptyEmail
    case emptyPassword
    case invalidEmail
    case weakPassword
    case passwordMismatch
    case biometricNotAvailable
    case biometricFailed
    case noSavedCredentials
    case apiError(String)
    
    static func fromAPI(_ error: APIError) -> AuthError {
        .apiError(error.errorDescription ?? "An error occurred")
    }
    
    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "You are not signed in."
        case .emptyEmail:
            return "Please enter your email address."
        case .emptyPassword:
            return "Please enter your password."
        case .invalidEmail:
            return "Please enter a valid email address."
        case .weakPassword:
            return "Password must be at least 8 characters."
        case .passwordMismatch:
            return "Passwords do not match."
        case .biometricNotAvailable:
            return "Face ID / Touch ID is not available on this device."
        case .biometricFailed:
            return "Biometric authentication failed."
        case .noSavedCredentials:
            return "No saved credentials found. Please sign in with your password."
        case .apiError(let message):
            return message
        }
    }
}

// MARK: - Logger Extension

extension Logger {
    static let auth = Logger(subsystem: "com.potomac.analyst", category: "auth")
}
```

### 6.2 Biometric Service

```swift
// Services/Auth/BiometricService.swift
import Foundation
import LocalAuthentication

actor BiometricService {
    static let shared = BiometricService()
    
    private let context = LAContext()
    
    var isAvailable: Bool {
        var error: NSError?
        let available = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        return available
    }
    
    var biometricType: LABiometryType {
        context.biometryType
    }
    
    var biometricTypeName: String {
        switch biometricType {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        case .opticID:
            return "Optic ID"
        default:
            return "Biometric"
        }
    }
    
    func authenticate(reason: String) async throws -> Bool {
        guard isAvailable else {
            throw BiometricError.notAvailable
        }
        
        return try await withCheckedThrowingContinuation { continuation in
            context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            ) { success, error in
                if let error = error {
                    continuation.resume(throwing: BiometricError.evaluationFailed(error.localizedDescription))
                } else {
                    continuation.resume(returning: success)
                }
            }
        }
    }
}

enum BiometricError: Error, LocalizedError {
    case notAvailable
    case notEnrolled
    case lockedOut
    case evaluationFailed(String)
    
    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "Biometric authentication is not available."
        case .notEnrolled:
            return "No biometric identities are enrolled."
        case .lockedOut:
            return "Biometric authentication is locked out."
        case .evaluationFailed(let message):
            return message
        }
    }
}
```

---

## 7. State Management

### 7.1 Environment Setup

```swift
// AnalystApp.swift
import SwiftUI

@main
struct AnalystApp: App {
    // MARK: - Global State
    
    @State private var authViewModel = AuthViewModel()
    @State private var settingsViewModel = SettingsViewModel()
    @State private var tabViewModel = TabViewModel()
    
    // MARK: - Body
    
    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(authViewModel)
                .environment(settingsViewModel)
                .environment(tabViewModel)
                .tint(.potomacYellow)
                .preferredColorScheme(settingsViewModel.colorScheme)
                .task {
                    // Preload any necessary data
                    await preloadData()
                }
        }
        
        // MARK: - Commands (macOS)
        
        #if os(macOS)
        Commands {
            CommandGroup(replacing: .newItem) {
                Button("New Conversation") {
                    tabViewModel.selectedTab = .chat
                    // Create new conversation
                }
                .keyboardShortcut("n", modifiers: .command)
            }
            
            CommandGroup(replacing: .textFormatting) {
                Button("Toggle Theme") {
                    settingsViewModel.toggleTheme()
                }
                .keyboardShortcut("t", modifiers: [.command, .shift])
            }
        }
        #endif
    }
    
    // MARK: - Private
    
    private func preloadData() async {
        // Preload fonts, cached data, etc.
    }
}

// MARK: - Root View

struct RootView: View {
    @Environment(AuthViewModel.self) private var auth
    
    var body: some View {
        Group {
            if auth.isLoading {
                SplashView()
            } else if auth.isAuthenticated {
                MainTabView()
            } else {
                NavigationStack {
                    LoginView()
                }
            }
        }
        .animation(.easeInOut(duration: 0.3), value: auth.isAuthenticated)
        .animation(.easeInOut(duration: 0.3), value: auth.isLoading)
    }
}
```

### 7.2 Tab View Model

```swift
// ViewModels/TabViewModel.swift
import Foundation
import Observation

@Observable
final class TabViewModel {
    var selectedTab: Tab = .dashboard
    var previousTab: Tab?
    
    enum Tab: String, CaseIterable {
        case dashboard = "Home"
        case chat = "Chat"
        case afl = "AFL"
        case knowledge = "KB"
        case settings = "More"
        
        var icon: String {
            switch self {
            case .dashboard: return "square.grid.2x2"
            case .chat: return "message"
            case .afl: return "chevron.left.forwardslash.chevron.right"
            case .knowledge: return "cylinder"
            case .settings: return "ellipsis.circle"
            }
        }
        
        var sfSymbol: String {
            return icon
        }
    }
    
    func select(_ tab: Tab) {
        previousTab = selectedTab
        selectedTab = tab
    }
    
    func goBack() {
        if let previous = previousTab {
            selectedTab = previous
            previousTab = nil
        }
    }
}
```

### 7.3 Settings View Model

```swift
// ViewModels/SettingsViewModel.swift
import Foundation
import Observation
import SwiftUI

@Observable
final class SettingsViewModel {
    // MARK: - Theme Settings
    
    var theme: AppTheme {
        didSet { saveSettings() }
    }
    
    var fontSize: FontSize {
        didSet { saveSettings() }
    }
    
    // MARK: - Notification Settings
    
    var notificationsEnabled: Bool {
        didSet { saveSettings() }
    }
    
    var emailAlerts: Bool {
        didSet { saveSettings() }
    }
    
    var pushNotifications: Bool {
        didSet { saveSettings() }
    }
    
    // MARK: - Privacy Settings
    
    var hapticFeedback: Bool {
        didSet { saveSettings() }
    }
    
    var analyticsEnabled: Bool {
        didSet { saveSettings() }
    }
    
    // MARK: - Computed Properties
    
    var colorScheme: ColorScheme? {
        switch theme {
        case .light: return .light
        case .dark: return .dark
        case .system: return nil
        }
    }
    
    // MARK: - Private
    
    private let defaults: UserDefaults
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    
    // MARK: - Init
    
    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        
        // Load saved settings
        self.theme = Self.loadTheme(from: defaults)
        self.fontSize = Self.loadFontSize(from: defaults)
        self.notificationsEnabled = defaults.bool(forKey: Keys.notificationsEnabled)
        self.emailAlerts = defaults.bool(forKey: Keys.emailAlerts)
        self.pushNotifications = defaults.bool(forKey: Keys.pushNotifications)
        self.hapticFeedback = defaults.bool(forKey: Keys.hapticFeedback)
        self.analyticsEnabled = defaults.bool(forKey: Keys.analyticsEnabled)
    }
    
    // MARK: - Public Methods
    
    func toggleTheme() {
        theme = theme.next
    }
    
    func resetToDefaults() {
        theme = .system
        fontSize = .medium
        notificationsEnabled = true
        emailAlerts = true
        pushNotifications = true
        hapticFeedback = true
        analyticsEnabled = true
        saveSettings()
    }
    
    // MARK: - Private Helpers
    
    private func saveSettings() {
        defaults.set(theme.rawValue, forKey: Keys.theme)
        defaults.set(fontSize.rawValue, forKey: Keys.fontSize)
        defaults.set(notificationsEnabled, forKey: Keys.notificationsEnabled)
        defaults.set(emailAlerts, forKey: Keys.emailAlerts)
        defaults.set(pushNotifications, forKey: Keys.pushNotifications)
        defaults.set(hapticFeedback, forKey: Keys.hapticFeedback)
        defaults.set(analyticsEnabled, forKey: Keys.analyticsEnabled)
    }
    
    private static func loadTheme(from defaults: UserDefaults) -> AppTheme {
        guard let rawValue = defaults.string(forKey: Keys.theme),
              let theme = AppTheme(rawValue: rawValue) else {
            return .system
        }
        return theme
    }
    
    private static func loadFontSize(from defaults: UserDefaults) -> FontSize {
        guard let rawValue = defaults.string(forKey: Keys.fontSize),
              let size = FontSize(rawValue: rawValue) else {
            return .medium
        }
        return size
    }
    
    // MARK: - Nested Types
    
    enum AppTheme: String, CaseIterable {
        case system = "System"
        case light = "Light"
        case dark = "Dark"
        
        var next: AppTheme {
            switch self {
            case .system: return .light
            case .light: return .dark
            case .dark: return .system
            }
        }
        
        var iconName: String {
            switch self {
            case .system: return "circle.lefthalf.filled"
            case .light: return "sun.max"
            case .dark: return "moon"
            }
        }
    }
    
    enum FontSize: String, CaseIterable {
        case small = "Small"
        case medium = "Medium"
        case large = "Large"
        
        var scale: CGFloat {
            switch self {
            case .small: return 0.85
            case .medium: return 1.0
            case .large: return 1.15
            }
        }
    }
    
    private enum Keys {
        static let theme = "settings.theme"
        static let fontSize = "settings.fontSize"
        static let notificationsEnabled = "settings.notificationsEnabled"
        static let emailAlerts = "settings.emailAlerts"
        static let pushNotifications = "settings.pushNotifications"
        static let hapticFeedback = "settings.hapticFeedback"
        static let analyticsEnabled = "settings.analyticsEnabled"
    }
}
```

---

## 8. Theme & Styling System

### 8.1 Colors

```swift
// Theme/Colors.swift
import SwiftUI

extension Color {
    // MARK: - Brand Colors
    
    static let potomacYellow = Color(hex: "FEC00F")
    static let potomacYellowLight = Color(hex: "FFD740")
    static let potomacYellowDark = Color(hex: "E5AD00")
    
    static let potomacGray = Color(hex: "212121")
    static let potomacGrayLight = Color(hex: "2E2E2E")
    
    static let potomacTurquoise = Color(hex: "00DED1")
    static let potomacPink = Color(hex: "EB2F5C")
    
    // MARK: - Semantic Colors (Adaptive)
    
    static let surfacePrimary = Color(
        light: Color(hex: "FFFFFF"),
        dark: Color(hex: "121212")
    )
    
    static let surfaceSecondary = Color(
        light: Color(hex: "F8F9FA"),
        dark: Color(hex: "1E1E1E")
    )
    
    static let surfaceTertiary = Color(
        light: Color(hex: "F0F0F0"),
        dark: Color(hex: "262626")
    )
    
    static let surfaceInput = Color(
        light: Color(hex: "F8F8F8"),
        dark: Color(hex: "262626")
    )
    
    static let borderDefault = Color(
        light: Color(hex: "E5E5E5"),
        dark: Color(hex: "2E2E2E")
    )
    
    static let borderStrong = Color(
        light: Color(hex: "CCCCCC"),
        dark: Color(hex: "444444")
    )
    
    static let textPrimary = Color(
        light: Color(hex: "1A1A1A"),
        dark: Color(hex: "E8E8E8")
    )
    
    static let textSecondary = Color(
        light: Color(hex: "555555"),
        dark: Color(hex: "9E9E9E")
    )
    
    static let textMuted = Color(
        light: Color(hex: "888888"),
        dark: Color(hex: "757575")
    )
    
    // MARK: - Status Colors
    
    static let success = Color(hex: "22C55E")
    static let successLight = Color(hex: "22C55E").opacity(0.15)
    
    static let warning = Color(hex: "FEC00F")
    static let warningLight = Color(hex: "FEC00F").opacity(0.15)
    
    static let error = Color(hex: "DC2626")
    static let errorLight = Color(hex: "DC2626").opacity(0.15)
    
    static let info = Color(hex: "3B82F6")
    static let infoLight = Color(hex: "3B82F6").opacity(0.15)
    
    // MARK: - Chart Colors
    
    static let chartGreen = Color(hex: "22C55E")
    static let chartRed = Color(hex: "DC2626")
    static let chartBlue = Color(hex: "3B82F6")
    static let chartPurple = Color(hex: "8B5CF6")
    static let chartOrange = Color(hex: "F97316")
    static let chartPink = Color(hex: "EC4899")
}

// MARK: - Color Initializers

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
    
    init(light: Color, dark: Color) {
        #if os(iOS) || os(visionOS)
        self.init(uiColor: UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark
                ? UIColor(dark)
                : UIColor(light)
        })
        #elseif os(macOS)
        self.init(nsColor: NSColor(name: nil) { appearance in
            appearance.bestMatch(from: [.darkAqua, .aqua], options: []) == .darkAqua
                ? NSColor(dark)
                : NSColor(light)
        })
        #else
        self = light
        #endif
    }
}
```

### 8.2 Typography

```swift
// Theme/Typography.swift
import SwiftUI

extension Font {
    // MARK: - Rajdhani (Headings)
    
    static func rajdhani(_ size: CGFloat, weight: Font.Weight = .bold) -> Font {
        let fontName = rajdhaniFontName(for: weight)
        return .custom(fontName, size: size)
    }
    
    static func rajdhaniBold(_ size: CGFloat) -> Font {
        .custom("Rajdhani-Bold", size: size)
    }
    
    static func rajdhaniSemiBold(_ size: CGFloat) -> Font {
        .custom("Rajdhani-SemiBold", size: size)
    }
    
    static func rajdhaniMedium(_ size: CGFloat) -> Font {
        .custom("Rajdhani-Medium", size: size)
    }
    
    // MARK: - Quicksand (Body)
    
    static func quicksand(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        let fontName = quicksandFontName(for: weight)
        return .custom(fontName, size: size)
    }
    
    static func quicksandBold(_ size: CGFloat) -> Font {
        .custom("Quicksand-Bold", size: size)
    }
    
    static func quicksandSemiBold(_ size: CGFloat) -> Font {
        .custom("Quicksand-SemiBold", size: size)
    }
    
    static func quicksandMedium(_ size: CGFloat) -> Font {
        .custom("Quicksand-Medium", size: size)
    }
    
    static func quicksandRegular(_ size: CGFloat) -> Font {
        .custom("Quicksand-Regular", size: size)
    }
    
    // MARK: - Fira Code (Monospace)
    
    static func firaCode(_ size: CGFloat) -> Font {
        .custom("FiraCode-Regular", size: size)
    }
    
    static func firaCodeMedium(_ size: CGFloat) -> Font {
        .custom("FiraCode-Medium", size: size)
    }
    
    // MARK: - Helper Methods
    
    private static func rajdhaniFontName(for weight: Font.Weight) -> String {
        switch weight {
        case .bold: return "Rajdhani-Bold"
        case .semibold: return "Rajdhani-SemiBold"
        case .medium: return "Rajdhani-Medium"
        default: return "Rajdhani-Regular"
        }
    }
    
    private static func quicksandFontName(for weight: Font.Weight) -> String {
        switch weight {
        case .bold: return "Quicksand-Bold"
        case .semibold: return "Quicksand-SemiBold"
        case .medium: return "Quicksand-Medium"
        default: return "Quicksand-Regular"
        }
    }
}

// MARK: - Text Styles

enum TextStyle {
    case largeTitle
    case title1
    case title2
    case title3
    case headline
    case body
    case callout
    case subheadline
    case footnote
    case caption1
    case caption2
    
    var font: Font {
        switch self {
        case .largeTitle:
            return .rajdhani(34, weight: .bold)
        case .title1:
            return .rajdhani(28, weight: .bold)
        case .title2:
            return .rajdhani(22, weight: .bold)
        case .title3:
            return .rajdhani(18, weight: .semibold)
        case .headline:
            return .rajdhani(16, weight: .semibold)
        case .body:
            return .quicksand(16, weight: .regular)
        case .callout:
            return .quicksand(15, weight: .regular)
        case .subheadline:
            return .quicksand(14, weight: .regular)
        case .footnote:
            return .quicksand(12, weight: .regular)
        case .caption1:
            return .quicksand(11, weight: .regular)
        case .caption2:
            return .quicksand(10, weight: .regular)
        }
    }
}

// MARK: - View Extension

extension View {
    func textStyle(_ style: TextStyle) -> some View {
        font(style.font)
    }
}
```

### 8.3 Spacing & Layout

```swift
// Theme/Spacing.swift
import SwiftUI

enum Spacing: CGFloat {
    case xxxs = 2
    case xxs = 4
    case xs = 6
    case sm = 8
    case md = 12
    case lg = 16
    case xl = 20
    case xxl = 24
    case xxxl = 32
    case huge = 48
}

extension CGFloat {
    static func spacing(_ spacing: Spacing) -> CGFloat {
        spacing.rawValue
    }
}

extension EdgeInsets {
    static func all(_ value: Spacing) -> EdgeInsets {
        EdgeInsets(top: value.rawValue, leading: value.rawValue, bottom: value.rawValue, trailing: value.rawValue)
    }
    
    static func horizontal(_ value: Spacing) -> EdgeInsets {
        EdgeInsets(top: 0, leading: value.rawValue, bottom: 0, trailing: value.rawValue)
    }
    
    static func vertical(_ value: Spacing) -> EdgeInsets {
        EdgeInsets(top: value.rawValue, leading: 0, bottom: value.rawValue, trailing: 0)
    }
}

// Theme/CornerRadius.swift

enum CornerRadius: CGFloat {
    case none = 0
    case xs = 4
    case sm = 6
    case md = 8
    case lg = 12
    case xl = 16
    case xxl = 20
    case full = 999
}

extension View {
    func cornerRadius(_ radius: CornerRadius) -> some View {
        self.cornerRadius(radius.rawValue)
    }
}
```

---

## 9. Navigation Architecture

### 9.1 Main Tab View

```swift
// Views/Root/MainTabView.swift
import SwiftUI

struct MainTabView: View {
    @Environment(TabViewModel.self) private var tabVM
    @Environment(\.horizontalSizeClass) private var sizeClass
    
    var body: some View {
        Group {
            if sizeClass == .compact {
                // iPhone: Bottom tab bar
                iphoneLayout
            } else {
                // iPad/Mac: Sidebar navigation
                ipadLayout
            }
        }
    }
    
    // MARK: - iPhone Layout
    
    @ViewBuilder
    private var iphoneLayout: some View {
        TabView(selection: Binding(
            get: { tabVM.selectedTab },
            set: { tabVM.select($0) }
        )) {
            DashboardView()
                .tabItem {
                    Label(TabViewModel.Tab.dashboard.rawValue, systemImage: TabViewModel.Tab.dashboard.icon)
                }
                .tag(TabViewModel.Tab.dashboard)
            
            ChatView()
                .tabItem {
                    Label(TabViewModel.Tab.chat.rawValue, systemImage: TabViewModel.Tab.chat.icon)
                }
                .tag(TabViewModel.Tab.chat)
            
            AFLGeneratorView()
                .tabItem {
                    Label(TabViewModel.Tab.afl.rawValue, systemImage: TabViewModel.Tab.afl.icon)
                }
                .tag(TabViewModel.Tab.afl)
            
            KnowledgeBaseView()
                .tabItem {
                    Label(TabViewModel.Tab.knowledge.rawValue, systemImage: TabViewModel.Tab.knowledge.icon)
                }
                .tag(TabViewModel.Tab.knowledge)
            
            SettingsView()
                .tabItem {
                    Label(TabViewModel.Tab.settings.rawValue, systemImage: TabViewModel.Tab.settings.icon)
                }
                .tag(TabViewModel.Tab.settings)
        }
        .tint(.potomacYellow)
    }
    
    // MARK: - iPad/Mac Layout
    
    @ViewBuilder
    private var ipadLayout: some View {
        NavigationSplitView {
            SidebarView()
                .navigationSplitViewColumnWidth(min: 200, ideal: 240, max: 300)
        } detail: {
            NavigationStack {
                switch tabVM.selectedTab {
                case .dashboard:
                    DashboardView()
                case .chat:
                    ChatView()
                case .afl:
                    AFLGeneratorView()
                case .knowledge:
                    KnowledgeBaseView()
                case .settings:
                    SettingsView()
                }
            }
        }
        .tint(.potomacYellow)
    }
}

// MARK: - Sidebar View (iPad/Mac)

struct SidebarView: View {
    @Environment(TabViewModel.self) private var tabVM
    @Environment(AuthViewModel.self) private var auth
    
    var body: some View {
        List {
            Section {
                ForEach(TabViewModel.Tab.allCases, id: \.self) { tab in
                    Button {
                        tabVM.select(tab)
                    } label: {
                        Label(tab.rawValue, systemImage: tab.icon)
                    }
                    .listRowBackground(tabVM.selectedTab == tab ? Color.potomacYellow : Color.clear)
                    .foregroundStyle(tabVM.selectedTab == tab ? .black : .primary)
                }
            }
            
            Section {
                Button {
                    // Show profile
                } label: {
                    HStack {
                        if let user = auth.user {
                            Circle()
                                .fill(Color.potomacYellow)
                                .frame(width: 32, height: 32)
                                .overlay {
                                    Text(user.initials)
                                        .font(.quicksandBold(12))
                                        .foregroundStyle(.black)
                                }
                            Text(user.displayName)
                                .font(.quicksandMedium(14))
                        }
                    }
                }
            }
        }
        .listStyle(.sidebar)
        .navigationTitle("Analyst")
    }
}
```

---

## 10. Screen-by-Screen Implementation

### 10.1 Splash View

```swift
// Views/Root/SplashView.swift
import SwiftUI

struct SplashView: View {
    @State private var shimmerOffset: CGFloat = -1
    @State private var logoScale: CGFloat = 0.8
    @State private var logoOpacity: Double = 0
    
    var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()
            
            // Radial glow
            RadialGradient(
                colors: [
                    Color.potomacYellow.opacity(0.08),
                    .clear
                ],
                center: .center,
                startRadius: 0,
                endRadius: 150
            )
            
            VStack(spacing: 20) {
                // Logo
                Image("potomac-icon")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 80, height: 80)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .shadow(color: .potomacYellow.opacity(0.2), radius: 16)
                    .scaleEffect(logoScale)
                    .opacity(logoOpacity)
                
                // Brand text
                VStack(spacing: 6) {
                    Text("ANALYST")
                        .font(.rajdhaniBold(28))
                        .foregroundStyle(.white)
                        .tracking(6)
                    
                    Text("BY POTOMAC")
                        .font(.quicksandSemiBold(10))
                        .foregroundStyle(.potomacYellow)
                        .tracking(5)
                }
                
                // Loading indicator
                Capsule()
                    .fill(Color.white.opacity(0.1))
                    .frame(width: 50, height: 3)
                    .overlay(alignment: .leading) {
                        Capsule()
                            .fill(Color.potomacYellow)
                            .frame(width: 25, height: 3)
                            .offset(x: shimmerOffset * 50)
                    }
                    .padding(.top, 20)
            }
            
            // Version text
            VStack {
                Spacer()
                Text("VERSION 1.0")
                    .font(.quicksandRegular(9))
                    .foregroundStyle(.gray.opacity(0.5))
                    .tracking(2)
                    .padding(.bottom, 50)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                logoScale = 1
                logoOpacity = 1
            }
            
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                shimmerOffset = 1
            }
        }
    }
}

#Preview {
    SplashView()
}
```

### 10.2 Login View

```swift
// Views/Auth/LoginView.swift
import SwiftUI

struct LoginView: View {
    @Environment(AuthViewModel.self) private var auth
    @Environment(\.dismiss) private var dismiss
    
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    @FocusState private var focusedField: Field?
    
    enum Field: Hashable {
        case email, password
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Brand section
                brandSection
                    .padding(.vertical, 48)
                
                // Form section
                formSection
                    .padding(.horizontal, 32)
            }
        }
        .background(Color.surfacePrimary)
        .navigationBarHidden(true)
        .dismissKeyboardOnTap()
    }
    
    // MARK: - Brand Section
    
    @ViewBuilder
    private var brandSection: some View {
        VStack(spacing: 14) {
            Image("potomac-icon")
                .resizable()
                .scaledToFit()
                .frame(width: 64, height: 64)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: .potomacYellow.opacity(0.15), radius: 12)
            
            VStack(spacing: 4) {
                Text("ANALYST")
                    .font(.rajdhaniBold(24))
                    .foregroundStyle(.white)
                    .tracking(4)
                
                Text("BY POTOMAC")
                    .font(.quicksandSemiBold(10))
                    .foregroundStyle(.potomacYellow)
                    .tracking(5)
            }
        }
    }
    
    // MARK: - Form Section
    
    @ViewBuilder
    private var formSection: some View {
        VStack(spacing: 20) {
            Text("WELCOME BACK")
                .font(.rajdhaniBold(28))
                .tracking(2)
                .foregroundStyle(.textPrimary)
            
            // Email field
            VStack(alignment: .leading, spacing: 4) {
                Text("EMAIL ADDRESS")
                    .font(.quicksandSemiBold(9))
                    .foregroundStyle(.textMuted)
                
                TextField("you@example.com", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .autocorrectionDisabled()
                    .focused($focusedField, equals: .email)
                    .padding()
                    .background(Color.surfaceInput)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(focusedField == .email ? Color.potomacYellow : Color.borderDefault, lineWidth: 1)
                    )
            }
            
            // Password field
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("PASSWORD")
                        .font(.quicksandSemiBold(9))
                        .foregroundStyle(.textMuted)
                    
                    Spacer()
                    
                    NavigationLink("Forgot?", destination: ForgotPasswordView())
                        .font(.quicksandSemiBold(10))
                        .foregroundStyle(.potomacYellow)
                }
                
                HStack {
                    Group {
                        if showPassword {
                            TextField("Password", text: $password)
                        } else {
                            SecureField("Password", text: $password)
                        }
                    }
                    .focused($focusedField, equals: .password)
                    
                    Button {
                        showPassword.toggle()
                    } label: {
                        Image(systemName: showPassword ? "eye.slash" : "eye")
                            .foregroundStyle(.textMuted)
                    }
                }
                .padding()
                .background(Color.surfaceInput)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(focusedField == .password ? Color.potomacYellow : Color.borderDefault, lineWidth: 1)
                )
            }
            
            // Error message
            if let error = errorMessage {
                Text(error)
                    .font(.quicksandMedium(12))
                    .foregroundStyle(.error)
                    .padding(.top, 8)
            }
            
            // Sign in button
            Button {
                Task { await handleLogin() }
            } label: {
                HStack(spacing: 10) {
                    if isLoading {
                        ProgressView()
                            .tint(.black)
                    } else {
                        Image(systemName: "arrow.right.circle.fill")
                    }
                    
                    Text("SIGN IN")
                        .font(.rajdhaniBold(14))
                        .tracking(1)
                }
                .frame(maxWidth: .infinity, minHeight: 52)
            }
            .buttonStyle(PotomacPrimaryButtonStyle())
            .disabled(isLoading || email.isEmpty || password.isEmpty)
            .opacity((email.isEmpty || password.isEmpty) ? 0.6 : 1)
            
            // Biometric button
            if auth.canUseBiometrics {
                Button {
                    Task { await handleBiometricLogin() }
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "faceid")
                        Text("Sign in with Face ID")
                            .font(.quicksandMedium(13))
                    }
                    .foregroundStyle(.textSecondary)
                }
                .padding(.top, 12)
            }
            
            // Register link
            HStack(spacing: 4) {
                Text("Don't have an account?")
                    .font(.quicksandRegular(12))
                    .foregroundStyle(.textMuted)
                
                NavigationLink("Create one", destination: RegisterView())
                    .font(.quicksandSemiBold(12))
                    .foregroundStyle(.potomacYellow)
            }
            .padding(.top, 12)
        }
    }
    
    // MARK: - Actions
    
    private func handleLogin() async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await auth.login(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    private func handleBiometricLogin() async {
        do {
            try await auth.authenticateWithBiometrics()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Dismiss Keyboard Extension

extension View {
    func dismissKeyboardOnTap() -> some View {
        self.onTapGesture {
            UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        }
    }
}

#Preview {
    NavigationStack {
        LoginView()
            .environment(AuthViewModel())
    }
    .preferredColorScheme(.dark)
}
```

### 10.3 Dashboard View

```swift
// Views/Dashboard/DashboardView.swift
import SwiftUI

struct DashboardView: View {
    @Environment(AuthViewModel.self) private var auth
    @Environment(TabViewModel.self) private var tabVM
    @State private var viewModel = DashboardViewModel()
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Welcome header
                WelcomeHeader(user: auth.user)
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                
                // Quick actions
                quickActionsSection
                    .padding(.horizontal, 20)
                
                // Feature cards
                featureCardsSection
                    .padding(.horizontal, 20)
                
                // Recent activity
                if !viewModel.recentConversations.isEmpty {
                    recentActivitySection
                        .padding(.horizontal, 20)
                }
            }
            .padding(.bottom, 100)
        }
        .background(Color.surfacePrimary)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    tabVM.select(.settings)
                } label: {
                    if let user = auth.user {
                        Circle()
                            .fill(Color.potomacYellow)
                            .frame(width: 32, height: 32)
                            .overlay {
                                Text(user.initials)
                                    .font(.quicksandBold(12))
                                    .foregroundStyle(.black)
                            }
                    }
                }
            }
        }
        .task {
            await viewModel.loadRecentActivity()
        }
    }
    
    // MARK: - Quick Actions
    
    @ViewBuilder
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("QUICK ACTIONS")
                .font(.rajdhaniSemiBold(12))
                .foregroundStyle(.textMuted)
                .tracking(1)
            
            HStack(spacing: 12) {
                QuickActionButton(
                    title: "Ask Yang",
                    icon: "message.fill",
                    color: .potomacYellow
                ) {
                    tabVM.select(.chat)
                }
                
                QuickActionButton(
                    title: "Generate AFL",
                    icon: "chevron.left.forwardslash.chevron.right",
                    color: .potomacTurquoise
                ) {
                    tabVM.select(.afl)
                }
                
                QuickActionButton(
                    title: "Upload Doc",
                    icon: "doc.badge.plus",
                    color: .potomacPink
                ) {
                    tabVM.select(.knowledge)
                }
            }
        }
    }
    
    // MARK: - Feature Cards
    
    @ViewBuilder
    private var featureCardsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("FEATURES")
                .font(.rajdhaniSemiBold(12))
                .foregroundStyle(.textMuted)
                .tracking(1)
            
            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: 12),
                GridItem(.flexible(), spacing: 12)
            ], spacing: 12) {
                FeatureCard(
                    title: "AI Chat",
                    subtitle: "Ask Yang anything about markets, strategies, or your portfolio",
                    icon: "bubble.left.and.bubble.right.fill",
                    color: .potomacYellow,
                    destination: .chat
                )
                
                FeatureCard(
                    title: "AFL Generator",
                    subtitle: "Generate Amibroker formula language with natural language",
                    icon: "chevron.left.forwardslash.chevron.right",
                    color: .potomacTurquoise,
                    destination: .afl
                )
                
                FeatureCard(
                    title: "Knowledge Base",
                    subtitle: "Upload and search your documents with AI",
                    icon: "cylinder.fill",
                    color: .potomacPink,
                    destination: .knowledge
                )
                
                FeatureCard(
                    title: "Backtest Results",
                    subtitle: "Analyze and visualize your strategy performance",
                    icon: "chart.line.uptrend.xyaxis",
                    color: .chartGreen,
                    destination: .dashboard // Would navigate to backtest
                )
            }
        }
    }
    
    // MARK: - Recent Activity
    
    @ViewBuilder
    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("RECENT CHATS")
                    .font(.rajdhaniSemiBold(12))
                    .foregroundStyle(.textMuted)
                    .tracking(1)
                
                Spacer()
                
                Button("See All") {
                    tabVM.select(.chat)
                }
                .font(.quicksandSemiBold(11))
                .foregroundStyle(.potomacYellow)
            }
            
            ForEach(viewModel.recentConversations.prefix(3)) { conversation in
                ConversationRow(conversation: conversation) {
                    tabVM.select(.chat)
                    // Navigate to specific conversation
                }
            }
        }
    }
}

// MARK: - Welcome Header

struct WelcomeHeader: View {
    let user: User?
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(greeting)
                    .font(.quicksandMedium(14))
                    .foregroundStyle(.textSecondary)
                
                Text(user?.displayName ?? "Analyst")
                    .font(.rajdhaniBold(28))
                    .foregroundStyle(.textPrimary)
            }
            
            Spacer()
        }
    }
    
    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        case 17..<21: return "Good evening"
        default: return "Good night"
        }
    }
}

// MARK: - Quick Action Button

struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.15))
                        .frame(width: 48, height: 48)
                    
                    Image(systemName: icon)
                        .font(.system(size: 20))
                        .foregroundStyle(color)
                }
                
                Text(title)
                    .font(.quicksandSemiBold(11))
                    .foregroundStyle(.textPrimary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color.surfaceSecondary)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

// MARK: - Feature Card

struct FeatureCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    let destination: TabViewModel.Tab
    
    @Environment(TabViewModel.self) private var tabVM
    
    var body: some View {
        Button {
            tabVM.select(destination)
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.15))
                        .frame(width: 44, height: 44)
                    
                    Image(systemName: icon)
                        .font(.system(size: 18))
                        .foregroundStyle(color)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.rajdhaniBold(16))
                        .foregroundStyle(.textPrimary)
                    
                    Text(subtitle)
                        .font(.quicksandRegular(11))
                        .foregroundStyle(.textMuted)
                        .lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(Color.surfaceSecondary)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

// MARK: - Conversation Row

struct ConversationRow: View {
    let conversation: Conversation
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                Circle()
                    .fill(Color.potomacYellow.opacity(0.15))
                    .frame(width: 40, height: 40)
                    .overlay {
                        Image(systemName: "message")
                            .font(.system(size: 14))
                            .foregroundStyle(.potomacYellow)
                    }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(conversation.displayTitle)
                        .font(.quicksandSemiBold(14))
                        .foregroundStyle(.textPrimary)
                        .lineLimit(1)
                    
                    Text(conversation.lastMessage ?? "No messages")
                        .font(.quicksandRegular(12))
                        .foregroundStyle(.textMuted)
                        .lineLimit(1)
                }
                
                Spacer()
                
                Text(conversation.formattedDate)
                    .font(.quicksandRegular(11))
                    .foregroundStyle(.textMuted)
            }
            .padding(12)
            .background(Color.surfaceSecondary)
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
    }
}

// MARK: - Dashboard View Model

@Observable
final class DashboardViewModel {
    var recentConversations: [Conversation] = []
    var isLoading = false
    
    func loadRecentActivity() async {
        isLoading = true
        
        do {
            let response = try await APIClient.shared.getConversations(page: 1, limit: 5)
            recentConversations = response.items
        } catch {
            print("Failed to load recent activity: \(error)")
        }
        
        isLoading = false
    }
}

#Preview {
    DashboardView()
        .environment(AuthViewModel())
        .environment(TabViewModel())
        .preferredColorScheme(.dark)
}
```

---

## 11. AI Chat & Streaming

### 11.1 Chat View

```swift
// Views/Chat/ChatView.swift
import SwiftUI

struct ChatView: View {
    @State private var viewModel: ChatViewModel
    @State private var inputText = ""
    @State private var showConversationList = false
    @FocusState private var isInputFocused: Bool
    
    init() {
        _viewModel = State(initialValue: ChatViewModel())
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Messages list
            messagesListView
            
            // Input area
            chatInputView
        }
        .background(Color.surfacePrimary)
        .navigationTitle(viewModel.currentConversation?.displayTitle ?? "Yang")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    showConversationList = true
                } label: {
                    Image(systemName: "sidebar.left")
                        .foregroundStyle(.textSecondary)
                }
            }
            
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("New Conversation", systemImage: "plus") {
                        Task { await viewModel.createNewConversation() }
                    }
                    
                    Button("Clear Chat", systemImage: "trash", role: .destructive) {
                        viewModel.clearCurrentConversation()
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .foregroundStyle(.textSecondary)
                }
            }
        }
        .sheet(isPresented: $showConversationList) {
            ConversationListView(
                onSelect: { conversation in
                    Task { await viewModel.loadConversation(conversation) }
                    showConversationList = false
                },
                onNew: {
                    Task { await viewModel.createNewConversation() }
                    showConversationList = false
                }
            )
            .presentationDetents([.medium, .large])
        }
        .task {
            if viewModel.messages.isEmpty {
                await viewModel.loadOrCreateConversation()
            }
        }
    }
    
    // MARK: - Messages List
    
    @ViewBuilder
    private var messagesListView: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 16) {
                    // Welcome message if empty
                    if viewModel.messages.isEmpty {
                        welcomeView
                            .padding(.top, 40)
                    } else {
                        ForEach(viewModel.messages) { message in
                            MessageView(message: message)
                                .id(message.id)
                        }
                    }
                    
                    // Typing indicator
                    if viewModel.isStreaming {
                        TypingIndicatorView()
                            .id("typing")
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 8)
            }
            .onChange(of: viewModel.messages.count) { _, _ in
                withAnimation {
                    proxy.scrollTo(viewModel.messages.last?.id ?? "typing", anchor: .bottom)
                }
            }
            .onChange(of: viewModel.isStreaming) { _, isStreaming in
                if isStreaming {
                    withAnimation {
                        proxy.scrollTo("typing", anchor: .bottom)
                    }
                }
            }
        }
    }
    
    // MARK: - Welcome View
    
    @ViewBuilder
    private var welcomeView: some View {
        VStack(spacing: 24) {
            // Avatar
            ZStack {
                Circle()
                    .fill(Color.potomacYellow.opacity(0.15))
                    .frame(width: 80, height: 80)
                
                Image(systemName: "sparkles")
                    .font(.system(size: 32))
                    .foregroundStyle(.potomacYellow)
            }
            
            VStack(spacing: 8) {
                Text("Hello, I'm Yang")
                    .font(.rajdhaniBold(24))
                    .foregroundStyle(.textPrimary)
                
                Text("I can help you with market analysis, AFL code generation, portfolio questions, and more. What would you like to know?")
                    .font(.quicksandRegular(14))
                    .foregroundStyle(.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            
            // Suggested prompts
            VStack(spacing: 12) {
                ForEach(suggestedPrompts, id: \.self) { prompt in
                    Button {
                        inputText = prompt
                        isInputFocused = true
                    } label: {
                        Text(prompt)
                            .font(.quicksandMedium(13))
                            .foregroundStyle(.textPrimary)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .frame(maxWidth: .infinity)
                            .background(Color.surfaceSecondary)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            .padding(.top, 8)
        }
    }
    
    private var suggestedPrompts: [String] {
        [
            "What's the current market outlook?",
            "Help me write an AFL strategy",
            "Analyze my portfolio risk"
        ]
    }
    
    // MARK: - Chat Input
    
    @ViewBuilder
    private var chatInputView: some View {
        VStack(spacing: 0) {
            Divider()
                .background(Color.borderDefault)
            
            HStack(alignment: .bottom, spacing: 12) {
                // Attachment button
                Button {
                    // Show attachment picker
                } label: {
                    Image(systemName: "paperclip")
                        .font(.system(size: 20))
                        .foregroundStyle(.textMuted)
                }
                .padding(.bottom, 8)
                
                // Text field
                HStack(alignment: .bottom) {
                    TextEditor(text: $inputText)
                        .font(.quicksandRegular(15))
                        .focused($isInputFocused)
                        .frame(minHeight: 24, maxHeight: 120)
                        .scrollContentBackground(.hidden)
                        .background(Color.clear)
                    
                    if !inputText.isEmpty {
                        Button {
                            sendMessage()
                        } label: {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.system(size: 28))
                                .foregroundStyle(.potomacYellow)
                        }
                        .padding(.bottom, 2)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.surfaceInput)
                .clipShape(RoundedRectangle(cornerRadius: 20))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(Color.surfacePrimary)
    }
    
    // MARK: - Actions
    
    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        
        inputText = ""
        
        Task {
            await viewModel.sendMessage(text)
        }
    }
}

// MARK: - Message View

struct MessageView: View {
    let message: Message
    
    var body: some View {
        switch message.role {
        case .user:
            UserMessageView(message: message)
        case .assistant:
            AssistantMessageView(message: message)
        case .system:
            EmptyView()
        }
    }
}

// MARK: - User Message View

struct UserMessageView: View {
    let message: Message
    
    var body: some View {
        HStack {
            Spacer()
            
            Text(message.content)
                .font(.quicksandRegular(15))
                .foregroundStyle(.black)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color.potomacYellow)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }
}

// MARK: - Assistant Message View

struct AssistantMessageView: View {
    let message: Message
    @State private var isExpanded = true
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Tool calls
            if let toolCalls = message.toolCalls, !toolCalls.isEmpty {
                ForEach(toolCalls) { toolCall in
                    ToolCallView(toolCall: toolCall, isExpanded: $isExpanded)
                }
            }
            
            // Content
            if !message.content.isEmpty {
                MarkdownTextView(text: message.content)
                    .font(.quicksandRegular(15))
                    .foregroundStyle(.textPrimary)
            }
            
            // Sources
            if let sources = message.sources, !sources.isEmpty {
                SourcesView(sources: sources)
            }
            
            // Timestamp
            HStack {
                Spacer()
                Text(message.createdAt.formatted(date: .omitted, time: .shortened))
                    .font(.quicksandRegular(10))
                    .foregroundStyle(.textMuted)
            }
        }
        .padding(16)
        .background(Color.surfaceSecondary)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Typing Indicator

struct TypingIndicatorView: View {
    @State private var animationOffset: CGFloat = 0
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(Color.potomacYellow)
                    .frame(width: 8, height: 8)
                    .offset(y: animationOffset)
                    .animation(
                        .easeInOut(duration: 0.4)
                            .repeatForever()
                            .delay(Double(index) * 0.15),
                        value: animationOffset
                    )
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.surfaceSecondary)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .onAppear {
            animationOffset = -6
        }
    }
}

// MARK: - Markdown Text View

struct MarkdownTextView: View {
    let text: String
    
    var body: some View {
        Text(attributedText)
            .font(.quicksandRegular(15))
    }
    
    private var attributedText: AttributedString {
        // Simple markdown parsing
        var result = AttributedString(text)
        
        // Bold: **text**
        let boldPattern = "\\*\\*(.+?)\\*\\*"
        if let regex = try? NSRegularExpression(pattern: boldPattern) {
            let range = NSRange(text.startIndex..., in: text)
            for match in regex.matches(in: text, range: range) {
                if let swiftRange = Range(match.range(at: 0), in: text),
                   let attrRange = Range(swiftRange, in: result) {
                    result[attrRange].font = .quicksandBold(15)
                    // Remove the ** markers
                    result.replaceSubrange(attrRange, with: AttributedString(String(text[swiftRange].dropFirst(2).dropLast(2))))
                }
            }
        }
        
        return result
    }
}

#Preview {
    NavigationStack {
        ChatView()
    }
    .preferredColorScheme(.dark)
}
```

### 11.2 Chat ViewModel with Streaming

```swift
// ViewModels/ChatViewModel.swift
import Foundation
import Observation

@Observable
final class ChatViewModel {
    // MARK: - State
    
    var messages: [Message] = []
    var conversations: [Conversation] = []
    var currentConversation: Conversation?
    var isStreaming = false
    var error: Error?
    
    // MARK: - Dependencies
    
    private let apiClient: APIClientProtocol
    private let sseClient: SSEClientProtocol
    private let hapticManager: HapticManager
    
    // MARK: - Init
    
    init(
        apiClient: APIClientProtocol = APIClient.shared,
        sseClient: SSEClientProtocol = SSEClient.shared,
        hapticManager: HapticManager = .shared
    ) {
        self.apiClient = apiClient
        self.sseClient = sseClient
        self.hapticManager = hapticManager
    }
    
    // MARK: - Public Methods
    
    @MainActor
    func loadOrCreateConversation() async {
        do {
            // Try to load recent conversations
            let response = try await apiClient.getConversations(page: 1, limit: 1)
            
            if let conversation = response.items.first {
                await loadConversation(conversation)
            } else {
                await createNewConversation()
            }
        } catch {
            // Create new conversation on error
            await createNewConversation()
        }
    }
    
    @MainActor
    func loadConversation(_ conversation: Conversation) async {
        currentConversation = conversation
        
        do {
            let response = try await apiClient.getMessages(conversationId: conversation.id, page: 1, limit: 100)
            messages = response.items.reversed()
        } catch {
            self.error = error
        }
    }
    
    @MainActor
    func createNewConversation() async {
        do {
            let conversation = try await apiClient.createConversation(title: nil)
            currentConversation = conversation
            messages = []
        } catch {
            self.error = error
        }
    }
    
    @MainActor
    func sendMessage(_ text: String) async {
        guard let conversationId = currentConversation?.id else { return }
        
        // Add user message
        let userMessage = Message(
            conversationId: conversationId,
            role: .user,
            content: text
        )
        messages.append(userMessage)
        
        // Create placeholder for assistant response
        var assistantMessage = Message(
            conversationId: conversationId,
            role: .assistant,
            content: "",
            isStreaming: true
        )
        messages.append(assistantMessage)
        
        isStreaming = true
        
        // Haptic feedback
        hapticManager.impact(.light)
        
        do {
            // Stream response
            let stream = try await sseClient.streamMessage(
                conversationId: conversationId,
                message: text
            )
            
            for try await event in stream {
                await handleStreamEvent(event, message: &assistantMessage)
            }
        } catch {
            self.error = error
            // Remove placeholder on error
            messages.removeAll { $0.id == assistantMessage.id }
        }
        
        // Finalize message
        if let index = messages.firstIndex(where: { $0.id == assistantMessage.id }) {
            messages[index].isStreaming = false
        }
        
        isStreaming = false
        
        // Haptic feedback
        hapticManager.notification(.success)
    }
    
    @MainActor
    func clearCurrentConversation() {
        messages = []
    }
    
    // MARK: - Private Methods
    
    private func handleStreamEvent(_ event: StreamEvent, message: inout Message) async {
        switch event {
        case .textDelta(let delta):
            message.content += delta
            updateMessage(message)
            
        case .toolCallStart(let start):
            let toolCall = ToolCall(
                id: start.id,
                name: start.name,
                arguments: [:],
                result: nil
            )
            if message.toolCalls == nil {
                message.toolCalls = []
            }
            message.toolCalls?.append(toolCall)
            updateMessage(message)
            
        case .toolCallComplete(let complete):
            if let index = message.toolCalls?.firstIndex(where: { $0.id == complete.toolCallId }) {
                message.toolCalls?[index] = ToolCall(
                    id: complete.toolCallId,
                    name: message.toolCalls?[index].name ?? "",
                    arguments: message.toolCalls?[index].arguments ?? [:],
                    result: AnyCodable(complete.result)
                )
            }
            updateMessage(message)
            
        case .sourceCitation(let source):
            if message.sources == nil {
                message.sources = []
            }
            message.sources?.append(source)
            updateMessage(message)
            
        case .finished:
            break
            
        case .error(let error):
            self.error = error
        }
    }
    
    private func updateMessage(_ message: Message) {
        if let index = messages.firstIndex(where: { $0.id == message.id }) {
            messages[index] = message
        }
    }
}
```

### 11.3 SSE Client

```swift
// Services/Streaming/SSEClient.swift
import Foundation

protocol SSEClientProtocol {
    func streamMessage(conversationId: String, message: String) async throws -> AsyncStream<StreamEvent>
}

actor SSEClient: SSEClientProtocol {
    static let shared = SSEClient()
    
    private let baseURL: URL
    private let decoder: JSONDecoder
    private let session: URLSession
    private let keychain: KeychainManager
    
    private init(
        baseURL: URL = URL(string: "https://potomac-analyst-workbench-production.up.railway.app")!,
        keychain: KeychainManager = .shared
    ) {
        self.baseURL = baseURL
        self.keychain = keychain
        
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 300 // 5 minutes for streaming
        configuration.timeoutIntervalForResource = 600
        self.session = URLSession(configuration: configuration)
        
        self.decoder = JSONDecoder()
    }
    
    func streamMessage(conversationId: String, message: String) async throws -> AsyncStream<StreamEvent> {
        let url = baseURL.appendingPathComponent("/api/chat/v6")
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = keychain.get(.accessToken) {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let body: [String: Any] = [
            "conversation_id": conversationId,
            "message": message
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        let (bytes, response) = try await session.bytes(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.serverError
        }
        
        return AsyncStream { continuation in
            Task {
                var buffer = ""
                
                for try await byte in bytes {
                    guard let character = String(bytes: [byte], encoding: .utf8) else { continue }
                    buffer += character
                    
                    // Check for complete events (double newline)
                    while let eventEndIndex = buffer.range(of: "\n\n")?.upperBound {
                        let eventData = String(buffer[..<eventEndIndex])
                        buffer = String(buffer[eventEndIndex...])
                        
                        if let event = parseSSEEvent(eventData) {
                            continuation.yield(event)
                            
                            if case .finished = event {
                                continuation.finish()
                                return
                            }
                        }
                    }
                }
                
                continuation.finish()
            }
        }
    }
    
    private func parseSSEEvent(_ data: String) -> StreamEvent? {
        let lines = data.components(separatedBy: "\n")
        
        var eventType = ""
        var eventData = ""
        
        for line in lines {
            if line.hasPrefix("event:") {
                eventType = String(line.dropFirst(6)).trimmingCharacters(in: .whitespaces)
            } else if line.hasPrefix("data:") {
                eventData = String(line.dropFirst(5)).trimmingCharacters(in: .whitespaces)
            }
        }
        
        guard !eventData.isEmpty else { return nil }
        
        switch eventType {
        case "text-delta":
            if let text = eventData.removingPercentEncoding {
                return .textDelta(text)
            }
            
        case "tool-call-start":
            if let data = eventData.data(using: .utf8),
               let decoded = try? decoder.decode(ToolCallStart.self, from: data) {
                return .toolCallStart(decoded)
            }
            
        case "tool-call-complete":
            if let data = eventData.data(using: .utf8),
               let decoded = try? decoder.decode(ToolCallComplete.self, from: data) {
                return .toolCallComplete(decoded)
            }
            
        case "source":
            if let data = eventData.data(using: .utf8),
               let decoded = try? decoder.decode(Source.self, from: data) {
                return .sourceCitation(decoded)
            }
            
        case "done":
            return .finished
            
        case "error":
            return .error(StreamError(message: eventData, code: nil))
            
        default:
            // Try to parse as text delta
            return .textDelta(eventData)
        }
        
        return nil
    }
}
```

---

## 12. Generative UI Components

### 12.1 Tool Call View

```swift
// Views/Chat/ToolCallView.swift
import SwiftUI

struct ToolCallView: View {
    let toolCall: ToolCall
    @Binding var isExpanded: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isExpanded.toggle()
                }
            } label: {
                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(toolCall.iconColor.opacity(0.15))
                            .frame(width: 32, height: 32)
                        
                        Image(systemName: toolCall.iconName)
                            .font(.system(size: 14))
                            .foregroundStyle(toolCall.iconColor)
                    }
                    
                    Text(toolCall.displayTitle)
                        .font(.quicksandSemiBold(13))
                        .foregroundStyle(.textPrimary)
                    
                    Spacer()
                    
                    Image(systemName: isExpanded ? "chevron.down" : "chevron.right")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.textMuted)
                }
                .padding(12)
                .background(Color.surfaceTertiary)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            
            // Expanded content
            if isExpanded {
                VStack(alignment: .leading, spacing: 8) {
                    if let result = toolCall.result {
                        Text("Result:")
                            .font(.quicksandSemiBold(11))
                            .foregroundStyle(.textMuted)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            Text(String(describing: result.value))
                                .font(.firaCode(12))
                                .foregroundStyle(.textPrimary)
                                .padding(12)
                                .background(Color.surfacePrimary)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
                .padding(.horizontal, 12)
            }
        }
    }
}
```

### 12.2 Sources View

```swift
// Views/Chat/SourceCitationView.swift
import SwiftUI

struct SourcesView: View {
    let sources: [Source]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Sources", systemImage: "doc.text.magnifyingglass")
                .font(.quicksandSemiBold(12))
                .foregroundStyle(.textMuted)
            
            ForEach(sources) { source in
                SourceRow(source: source)
            }
        }
    }
}

struct SourceRow: View {
    let source: Source
    
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.info.opacity(0.15))
                    .frame(width: 28, height: 28)
                
                Image(systemName: source.type == .web ? "globe" : "doc.text")
                    .font(.system(size: 12))
                    .foregroundStyle(.info)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(source.title)
                    .font(.quicksandSemiBold(12))
                    .foregroundStyle(.textPrimary)
                    .lineLimit(1)
                
                if let snippet = source.snippet {
                    Text(snippet)
                        .font(.quicksandRegular(10))
                        .foregroundStyle(.textMuted)
                        .lineLimit(2)
                }
            }
            
            Spacer()
            
            if let url = source.url, let linkURL = URL(string: url) {
                Link(destination: linkURL) {
                    Image(systemName: "arrow.up.right.square")
                        .font(.system(size: 16))
                        .foregroundStyle(.potomacYellow)
                }
            }
        }
        .padding(10)
        .background(Color.surfaceTertiary)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
```

---

## 13. File Upload System

### 13.1 Document Upload View

```swift
// Views/Knowledge/DocumentUploadView.swift
import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

struct DocumentUploadView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = DocumentUploadViewModel()
    @State private var showFilePicker = false
    @State private var selectedItem: PhotosPickerItem?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                // Upload area
                uploadArea
                
                // Selected file info
                if let file = viewModel.selectedFile {
                    selectedFileInfo(file)
                }
                
                // Upload progress
                if viewModel.isUploading {
                    uploadProgress
                }
                
                Spacer()
            }
            .padding(24)
            .navigationTitle("Upload Document")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundStyle(.textSecondary)
                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Upload") {
                        Task { await viewModel.upload() }
                    }
                    .foregroundStyle(.potomacYellow)
                    .disabled(viewModel.selectedFile == nil || viewModel.isUploading)
                }
            }
            .fileImporter(
                isPresented: $showFilePicker,
                allowedContentTypes: [.pdf, .plainText, .commaSeparatedTabularText, .json, .init(filenameExtension: "md")!],
                allowsMultipleSelection: false
            ) { result in
                switch result {
                case .success(let urls):
                    if let url = urls.first {
                        viewModel.selectFile(url: url)
                    }
                case .failure(let error):
                    viewModel.error = error
                }
            }
        }
    }
    
    // MARK: - Upload Area
    
    @ViewBuilder
    private var uploadArea: some View {
        Button {
            showFilePicker = true
        } label: {
            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .stroke(Color.potomacYellow, style: StrokeStyle(lineWidth: 2, dash: [8, 4]))
                        .frame(width: 80, height: 80)
                    
                    Image(systemName: "doc.badge.plus")
                        .font(.system(size: 32))
                        .foregroundStyle(.potomacYellow)
                }
                
                VStack(spacing: 8) {
                    Text("Tap to select a file")
                        .font(.quicksandSemiBold(14))
                        .foregroundStyle(.textPrimary)
                    
                    Text("PDF, TXT, CSV, JSON, MD")
                        .font(.quicksandRegular(12))
                        .foregroundStyle(.textMuted)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 40)
            .background(Color.surfaceSecondary)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }
    
    // MARK: - Selected File Info
    
    @ViewBuilder
    private func selectedFileInfo(_ file: SelectedFile) -> some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(file.type.color.opacity(0.15))
                    .frame(width: 44, height: 44)
                
                Image(systemName: file.type.iconName)
                    .font(.system(size: 18))
                    .foregroundStyle(file.type.color)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(file.name)
                    .font(.quicksandSemiBold(14))
                    .foregroundStyle(.textPrimary)
                    .lineLimit(1)
                
                Text(file.formattedSize)
                    .font(.quicksandRegular(12))
                    .foregroundStyle(.textMuted)
            }
            
            Spacer()
            
            Button {
                viewModel.clearSelection()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(.textMuted)
            }
        }
        .padding(12)
        .background(Color.surfaceSecondary)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    
    // MARK: - Upload Progress
    
    @ViewBuilder
    private var uploadProgress: some View {
        VStack(spacing: 12) {
            ProgressView(value: viewModel.uploadProgress) {
                Text("Uploading...")
                    .font(.quicksandMedium(12))
                    .foregroundStyle(.textSecondary)
            }
            .progressViewStyle(.linear)
            .tint(.potomacYellow)
            
            Text("\(Int(viewModel.uploadProgress * 100))%")
                .font(.quicksandSemiBold(14))
                .foregroundStyle(.potomacYellow)
        }
    }
}

// MARK: - View Model

@Observable
final class DocumentUploadViewModel {
    var selectedFile: SelectedFile?
    var isUploading = false
    var uploadProgress: Double = 0
    var error: Error?
    
    func selectFile(url: URL) {
        let filename = url.lastPathComponent
        let type = KnowledgeDocument.FileType.from(filename: filename)
        
        // Get file size
        let attributes = try? FileManager.default.attributesOfItem(atPath: url.path)
        let size = (attributes?[.size] as? Int64) ?? 0
        
        selectedFile = SelectedFile(
            url: url,
            name: filename,
            type: type,
            size: size
        )
    }
    
    func clearSelection() {
        selectedFile = nil
    }
    
    func upload() async {
        guard let file = selectedFile else { return }
        
        isUploading = true
        uploadProgress = 0
        
        do {
            // Read file data
            let data = try Data(contentsOf: file.url)
            
            // Simulate progress for now (real implementation would use URLSession delegate)
            for i in 0...10 {
                uploadProgress = Double(i) / 10.0
                try? await Task.sleep(nanoseconds: 100_000_000)
            }
            
            // Upload to API
            _ = try await APIClient.shared.uploadDocument(
                data: data,
                filename: file.name,
                fileType: file.type
            )
            
            isUploading = false
            uploadProgress = 1
        } catch {
            self.error = error
            isUploading = false
        }
    }
}

struct SelectedFile {
    let url: URL
    let name: String
    let type: KnowledgeDocument.FileType
    let size: Int64
    
    var formattedSize: String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useKB, .useMB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: size)
    }
}

#Preview {
    DocumentUploadView()
        .preferredColorScheme(.dark)
}
```

---

## 14. Watch App Implementation

### 14.1 Watch App Entry

```swift
// WatchApp/WatchApp.swift
import SwiftUI

@main
struct AnalystWatchApp: App {
    @StateObject private var viewModel = WatchViewModel()
    
    var body: some Scene {
        WindowGroup {
            WatchDashboardView()
                .environmentObject(viewModel)
        }
        
        WKNotificationScene(controller: NotificationController.self, category: "AlertCategory")
    }
}
```

### 14.2 Watch Dashboard

```swift
// WatchApp/Views/WatchDashboardView.swift
import SwiftUI

struct WatchDashboardView: View {
    @EnvironmentObject var viewModel: WatchViewModel
    
    var body: some View {
        TabView {
            // Quick Chat
            WatchVoiceInputView()
            
            // Portfolio Summary
            WatchPortfolioView()
            
            // Recent Alerts
            WatchAlertsView()
        }
        .tabViewStyle(.verticalPage)
    }
}

// MARK: - Voice Input

struct WatchVoiceInputView: View {
    @EnvironmentObject var viewModel: WatchViewModel
    @State private var isRecording = false
    
    var body: some View {
        VStack(spacing: 12) {
            Text("Ask Yang")
                .font(.rajdhaniBold(16))
            
            Button {
                toggleRecording()
            } label: {
                ZStack {
                    Circle()
                        .fill(isRecording ? Color.potomacPink : Color.potomacYellow)
                        .frame(width: 60, height: 60)
                    
                    Image(systemName: isRecording ? "stop.fill" : "mic.fill")
                        .font(.system(size: 24))
                        .foregroundStyle(.black)
                }
            }
            .buttonStyle(.plain)
            
            if isRecording {
                Text("Listening...")
                    .font(.quicksandRegular(10))
                    .foregroundStyle(.textSecondary)
            }
            
            if let response = viewModel.lastResponse {
                Text(response)
                    .font(.quicksandRegular(12))
                    .foregroundStyle(.textPrimary)
                    .lineLimit(5)
                    .multilineTextAlignment(.center)
            }
        }
    }
    
    private func toggleRecording() {
        isRecording.toggle()
        
        if isRecording {
            viewModel.startRecording()
        } else {
            viewModel.stopRecording()
        }
    }
}

// MARK: - Portfolio

struct WatchPortfolioView: View {
    @EnvironmentObject var viewModel: WatchViewModel
    
    var body: some View {
        VStack(spacing: 8) {
            Text("Portfolio")
                .font(.rajdhaniBold(16))
            
            if let summary = viewModel.portfolioSummary {
                VStack(spacing: 4) {
                    Text(summary.totalValue)
                        .font(.rajdhaniBold(24))
                        .foregroundStyle(.textPrimary)
                    
                    HStack(spacing: 4) {
                        Image(systemName: summary.change >= 0 ? "arrow.up.right" : "arrow.down.right")
                        Text(abs(summary.change).formatted(.percent))
                    }
                    .font(.quicksandSemiBold(12))
                    .foregroundStyle(summary.change >= 0 ? .chartGreen : .chartRed)
                }
            } else {
                ProgressView()
                    .tint(.potomacYellow)
            }
        }
    }
}

// MARK: - Alerts

struct WatchAlertsView: View {
    @EnvironmentObject var viewModel: WatchViewModel
    
    var body: some View {
        VStack(spacing: 8) {
            Text("Alerts")
                .font(.rajdhaniBold(16))
            
            if viewModel.alerts.isEmpty {
                VStack(spacing: 4) {
                    Image(systemName: "bell.slash")
                        .font(.system(size: 24))
                        .foregroundStyle(.textMuted)
                    
                    Text("No alerts")
                        .font(.quicksandRegular(12))
                        .foregroundStyle(.textMuted)
                }
            } else {
                ForEach(viewModel.alerts.prefix(3)) { alert in
                    WatchAlertRow(alert: alert)
                }
            }
        }
    }
}

struct WatchAlertRow: View {
    let alert: PortfolioAlert
    
    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(alert.severity == .high ? Color.chartRed : Color.potomacYellow)
                .frame(width: 8, height: 8)
            
            Text(alert.message)
                .font(.quicksandRegular(10))
                .foregroundStyle(.textPrimary)
                .lineLimit(2)
        }
    }
}

// MARK: - View Model

class WatchViewModel: ObservableObject {
    @Published var lastResponse: String?
    @Published var portfolioSummary: PortfolioSummary?
    @Published var alerts: [PortfolioAlert] = []
    @Published var isLoading = false
    
    func startRecording() {
        // Start speech recognition
    }
    
    func stopRecording() {
        // Stop and process
        Task {
            await sendVoiceQuery()
        }
    }
    
    @MainActor
    func sendVoiceQuery() async {
        // Send transcribed text to Yang
        // For demo, just show a placeholder
        lastResponse = "I received your message. For full responses, please use the iPhone app."
    }
}

struct PortfolioSummary {
    let totalValue: String
    let change: Double
}

struct PortfolioAlert: Identifiable {
    let id: String
    let message: String
    let severity: Severity
    
    enum Severity {
        case low, medium, high
    }
}
```

---

## 15. Vision Pro Implementation

### 15.1 Spatial Dashboard

```swift
// VisionApp/Views/SpatialDashboardView.swift
import SwiftUI

#if os(visionOS)
struct SpatialDashboardView: View {
    @Environment(AuthViewModel.self) private var auth
    
    var body: some View {
        ZStack {
            // Background
            Color.clear
            
            // Main content
            HStack(spacing: 32) {
                // Left panel - Chat
                ChatPanel()
                    .frame(width: 600, height: 800)
                
                // Right panel - Data visualization
                DataVisualizationPanel()
                    .frame(width: 800, height: 800)
            }
        }
        .ornament(attachmentAnchor: .scene(.bottom)) {
            QuickActionsToolbar()
        }
    }
}

// MARK: - Chat Panel

struct ChatPanel: View {
    @State private var messages: [Message] = []
    @State private var inputText = ""
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Yang")
                    .font(.rajdhaniBold(24))
                Spacer()
            }
            .padding(24)
            .background(.ultraThinMaterial)
            
            // Messages
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(messages) { message in
                        SpatialMessageView(message: message)
                    }
                }
                .padding(24)
            }
            
            // Input
            HStack(spacing: 12) {
                TextField("Ask Yang...", text: $inputText)
                    .textFieldStyle(.roundedBorder)
                    .frame(width: 400)
                
                Button("Send") {
                    // Send message
                }
            }
            .padding(24)
            .background(.ultraThinMaterial)
        }
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }
}

// MARK: - Data Visualization Panel

struct DataVisualizationPanel: View {
    @State private var selectedMetric: Metric = .performance
    
    enum Metric: String, CaseIterable {
        case performance = "Performance"
        case positions = "Positions"
        case risk = "Risk"
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Tabs
            HStack(spacing: 0) {
                ForEach(Metric.allCases) { metric in
                    Button {
                        selectedMetric = metric
                    } label: {
                        Text(metric.rawValue)
                            .font(.quicksandSemiBold(14))
                            .padding(.vertical, 12)
                            .frame(maxWidth: .infinity)
                            .background(selectedMetric == metric ? Color.potomacYellow.opacity(0.2) : Color.clear)
                    }
                }
            }
            .background(.ultraThinMaterial)
            
            // Content
            ScrollView {
                switch selectedMetric {
                case .performance:
                    PerformanceChart()
                case .positions:
                    PositionsList()
                case .risk:
                    RiskMetrics()
                }
            }
            .padding(24)
        }
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }
}

// MARK: - Quick Actions Toolbar

struct QuickActionsToolbar: View {
    var body: some View {
        HStack(spacing: 24) {
            ToolbarButton(icon: "message", label: "New Chat") {}
            ToolbarButton(icon: "chart.line.uptrend.xyaxis", label: "Analyze") {}
            ToolbarButton(icon: "doc.badge.plus", label: "Upload") {}
        }
        .padding(16)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
    }
}

struct ToolbarButton: View {
    let icon: String
    let label: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                Text(label)
                    .font(.quicksandMedium(12))
            }
            .foregroundStyle(.primary)
            .frame(width: 80, height: 60)
        }
        .buttonStyle(.plain)
    }
}

struct SpatialMessageView: View {
    let message: Message
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            if message.role == .assistant {
                Circle()
                    .fill(Color.potomacYellow)
                    .frame(width: 32, height: 32)
                    .overlay {
                        Image(systemName: "sparkles")
                            .foregroundStyle(.black)
                    }
            }
            
            Text(message.content)
                .font(.quicksandRegular(16))
                .padding(16)
                .background(message.role == .user ? Color.potomacYellow : .ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }
}

// Placeholder views
struct PerformanceChart: View {
    var body: some View {
        Text("Performance Chart")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct PositionsList: View {
    var body: some View {
        Text("Positions")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct RiskMetrics: View {
    var body: some View {
        Text("Risk Metrics")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
#endif
```

---

## 16. CarPlay Implementation

### 16.1 CarPlay Scene Delegate

```swift
// CarPlay/CarPlaySceneDelegate.swift
#if os(iOS)
import CarPlay

class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {
    var interfaceController: CPInterfaceController?
    
    func scene(_ scene: CPTemplateApplicationScene, didConnect interfaceController: CPInterfaceController) {
        self.interfaceController = interfaceController
        
        // Create main template
        let tabTemplate = CPTabBarTemplate(templates: [
            createChatTemplate(),
            createAlertsTemplate()
        ])
        
        interfaceController.setRootTemplate(tabTemplate, animated: true)
    }
    
    func scene(_ scene: CPTemplateApplicationScene, didDisconnect interfaceController: CPInterfaceController) {
        self.interfaceController = nil
    }
    
    private func createChatTemplate() -> CPListTemplate {
        let voiceInputItem = CPListItem(
            text: "Ask Yang",
            detailText: "Tap to speak",
            image: UIImage(systemName: "mic.fill")
        )
        
        voiceInputItem.handler = { item, completion in
            // Start voice input
            completion()
        }
        
        let section = CPListSection(items: [voiceInputItem])
        
        return CPListTemplate(
            title: "Yang",
            sections: [section]
        )
    }
    
    private func createAlertsTemplate() -> CPListTemplate {
        let items: [CPListItem] = [
            CPListItem(text: "Portfolio Alert", detailText: "AAPL crossed $180"),
            CPListItem(text: "Risk Alert", detailText: "Portfolio risk increased")
        ]
        
        let section = CPListSection(items: items)
        
        return CPListTemplate(
            title: "Alerts",
            sections: [section]
        )
    }
}
#endif
```

---

## 17. Testing Strategy

### 17.1 Unit Tests

```swift
// AnalystTests/ViewModels/AuthViewModelTests.swift
import Testing
@testable import Analyst

@Suite("AuthViewModel Tests")
struct AuthViewModelTests {
    
    @Test("Login with valid credentials")
    func testLoginSuccess() async throws {
        let mockAPI = MockAPIClient()
        mockAPI.loginResult = .success(AuthResponse(
            user: User(id: "1", email: "test@test.com", nickname: "Test", avatarUrl: nil, createdAt: Date(), updatedAt: Date(), settings: nil),
            token: AuthToken(accessToken: "token", refreshToken: nil, expiresIn: 3600, tokenType: "Bearer")
        ))
        
        let viewModel = AuthViewModel(apiClient: mockAPI)
        
        try await viewModel.login(email: "test@test.com", password: "password")
        
        #expect(viewModel.isAuthenticated)
        #expect(viewModel.user?.email == "test@test.com")
    }
    
    @Test("Login with invalid email")
    func testLoginInvalidEmail() async throws {
        let viewModel = AuthViewModel()
        
        await #expect(throws: AuthError.invalidEmail) {
            try await viewModel.login(email: "invalid", password: "password")
        }
    }
    
    @Test("Biometric availability check")
    func testBiometricAvailability() async {
        let mockBiometric = MockBiometricService()
        mockBiometric.isAvailable = true
        
        let viewModel = AuthViewModel(biometricService: mockBiometric)
        
        await Task.yield()
        
        #expect(viewModel.isBiometricAvailable)
    }
}

// MARK: - Mocks

actor MockAPIClient: APIClientProtocol {
    var isAuthenticated = false
    var loginResult: Result<AuthResponse, Error>?
    
    func login(email: String, password: String) async throws -> AuthResponse {
        try loginResult!.get()
    }
    
    func register(email: String, password: String, nickname: String?) async throws -> AuthResponse {
        AuthResponse(
            user: User(id: "1", email: email, nickname: nickname, avatarUrl: nil, createdAt: Date(), updatedAt: Date(), settings: nil),
            token: AuthToken(accessToken: "token", refreshToken: nil, expiresIn: 3600, tokenType: "Bearer")
        )
    }
    
    func logout() async throws {}
    func refreshToken() async throws -> AuthToken { AuthToken(accessToken: "token", refreshToken: nil, expiresIn: 3600, tokenType: "Bearer") }
    func getCurrentUser() async throws -> User { User(id: "1", email: "test@test.com", nickname: nil, avatarUrl: nil, createdAt: Date(), updatedAt: Date(), settings: nil) }
    func getConversations(page: Int, limit: Int) async throws -> PaginatedResponse<Conversation> { PaginatedResponse(items: [], total: 0, page: 1, limit: 20, hasMore: false) }
    func createConversation(title: String?) async throws -> Conversation { Conversation(id: "1", title: title ?? "", createdAt: Date(), updatedAt: Date(), messageCount: 0, lastMessage: nil) }
    func getConversation(id: String) async throws -> Conversation { Conversation(id: id, title: "", createdAt: Date(), updatedAt: Date(), messageCount: 0, lastMessage: nil) }
    func deleteConversation(id: String) async throws {}
    func renameConversation(id: String, title: String) async throws -> Conversation { Conversation(id: id, title: title, createdAt: Date(), updatedAt: Date(), messageCount: 0, lastMessage: nil) }
    func getMessages(conversationId: String, page: Int, limit: Int) async throws -> PaginatedResponse<Message> { PaginatedResponse(items: [], total: 0, page: 1, limit: 50, hasMore: false) }
    func getDocuments(page: Int, limit: Int) async throws -> PaginatedResponse<KnowledgeDocument> { PaginatedResponse(items: [], total: 0, page: 1, limit: 20, hasMore: false) }
    func uploadDocument(data: Data, filename: String, fileType: KnowledgeDocument.FileType) async throws -> KnowledgeDocument { KnowledgeDocument(id: "1", filename: filename, fileType: fileType, fileSize: 0, uploadedAt: Date(), status: .ready, chunkCount: nil) }
    func deleteDocument(id: String) async throws {}
    func uploadBacktestResult(data: Data) async throws -> BacktestResult { fatalError() }
    func getBacktestResults(page: Int, limit: Int) async throws -> PaginatedResponse<BacktestResult> { fatalError() }
    func getGeneratedContent(type: ContentType, page: Int, limit: Int) async throws -> PaginatedResponse<GeneratedContent> { fatalError() }
    func generateContent(request: ContentGenerationRequest) async throws -> GeneratedContent { fatalError() }
}

actor MockBiometricService {
    var isAvailable = false
    var shouldSucceed = true
    
    func authenticate(reason: String) async throws -> Bool {
        shouldSucceed
    }
}
```

### 17.2 UI Tests

```swift
// AnalystUITests/AuthFlows.swift
import XCTest

final class AuthFlows: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting"]
        app.launch()
    }
    
    func testLoginFlow() throws {
        // Wait for login screen
        let emailField = app.textFields["Email"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 5))
        
        // Enter credentials
        emailField.tap()
        emailField.typeText("test@test.com")
        
        let passwordField = app.secureTextFields["Password"]
        passwordField.tap()
        passwordField.typeText("password123")
        
        // Tap sign in
        app.buttons["Sign In"].tap()
        
        // Verify navigation to dashboard
        let dashboardTitle = app.staticTexts["Dashboard"]
        XCTAssertTrue(dashboardTitle.waitForExistence(timeout: 5))
    }
    
    func testInvalidLoginShowsError() throws {
        let emailField = app.textFields["Email"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 5))
        
        emailField.tap()
        emailField.typeText("invalid-email")
        
        app.buttons["Sign In"].tap()
        
        // Verify error message
        let errorAlert = app.alerts.firstMatch
        XCTAssertTrue(errorAlert.waitForExistence(timeout: 2))
    }
}
```

---

## 18. App Store Deployment

### 18.1 App Store Connect Configuration

```yaml
# App Store Metadata

App Name: Analyst by Potomac
Subtitle: AI-Powered Trading Intelligence
Category: Finance
Secondary Category: Productivity

Age Rating: 4+
  - No violence, adult content, gambling, or profanity

Keywords: trading, stocks, AI, portfolio, analysis, AFL, amibroker, backtest, investing

Description: |
  Analyst is your AI-powered trading companion. Ask questions about markets, generate trading strategies, and analyze your portfolio with the help of Yang, our intelligent assistant.
  
  FEATURES:
  • AI Chat - Ask Yang anything about markets, stocks, and strategies
  • AFL Generator - Create Amibroker formulas with natural language
  • Knowledge Base - Upload documents and search with AI
  • Portfolio Analysis - Track and analyze your investments
  • Backtest Results - Visualize strategy performance
  
  Designed for professional traders and investors who need instant access to market intelligence.

Privacy Policy URL: https://potomac.ai/privacy
Support URL: https://potomac.ai/support
Marketing URL: https://potomac.ai/analyst

# Screenshots required:
# iPhone 6.7" (iPhone 15 Pro Max): 3-5 screenshots
# iPhone 6.5" (iPhone 14 Plus): 3-5 screenshots
# iPad Pro 12.9": 3-5 screenshots
# iPad Pro 11": 3-5 screenshots
```

### 18.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ios.yml
name: iOS CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: macos-14
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_15.2.app
      
      - name: Cache SPM
        uses: actions/cache@v3
        with:
          path: ~/Library/Developer/Xcode/DerivedData
          key: ${{ runner.os }}-spm-${{ hashFiles('**/Package.resolved') }}
          restore-keys: |
            ${{ runner.os }}-spm-
      
      - name: Build
        run: |
          xcodebuild build \
            -project Analyst.xcodeproj \
            -scheme Analyst \
            -destination 'platform=iOS Simulator,name=iPhone 15 Pro,OS=latest' \
            -quiet
      
      - name: Run Tests
        run: |
          xcodebuild test \
            -project Analyst.xcodeproj \
            -scheme Analyst \
            -destination 'platform=iOS Simulator,name=iPhone 15 Pro,OS=latest' \
            -quiet
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: ~/Library/Developer/Xcode/DerivedData/*/Logs/Test/*.xcresult

  deploy-testflight:
    needs: build-and-test
    runs-on: macos-14
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Apple Certificate
        env:
          CERTIFICATES_BASE64: ${{ secrets.CERTIFICATES_BASE64 }}
          CERTIFICATES_PASSWORD: ${{ secrets.CERTIFICATES_PASSWORD }}
        run: |
          CERTIFICATE_PATH=$RUNNER_TEMP/certificate.p12
          echo -n "$CERTIFICATES_BASE64" | base64 --decode -o $CERTIFICATE_PATH
      
      - name: Build Archive
        run: |
          xcodebuild archive \
            -project Analyst.xcodeproj \
            -scheme Analyst \
            -archivePath $RUNNER_TEMP/Analyst.xcarchive \
            -quiet
      
      - name: Export IPA
        run: |
          xcodebuild -exportArchive \
            -archivePath $RUNNER_TEMP/Analyst.xcarchive \
            -exportOptionsPlist ExportOptions.plist \
            -exportPath $RUNNER_TEMP/build
      
      - name: Upload to TestFlight
        env:
          APP_STORE_CONNECT_API_KEY: ${{ secrets.APP_STORE_CONNECT_API_KEY }}
        run: |
          xcrun altool --upload-app \
            --type ios \
            --file $RUNNER_TEMP/build/Analyst.ipa \
            --apiKey $APP_STORE_CONNECT_API_KEY
```

---

## 19. AI Development Prompt

### Complete Prompt for AI-Assisted Development

```
You are an expert iOS/macOS developer specializing in SwiftUI. I need you to help me reconstruct a React/Next.js web application as a native SwiftUI app.

## Project Overview

**App Name:** Analyst by Potomac  
**Purpose:** AI-powered trading intelligence platform with chat, AFL code generation, knowledge base, and portfolio analysis.  
**Target Platforms:** iOS 17+, iPadOS 17+, macOS 14+, watchOS 10+, visionOS 1+  
**Architecture:** MVVM with Swift Observation Framework  
**Backend:** Existing REST API at https://potomac-analyst-workbench-production.up.railway.app

## Key Features to Implement

1. **Authentication**
   - Email/password login and registration
   - Face ID/Touch ID support
   - JWT token management with Keychain storage
   - Auto-refresh tokens

2. **AI Chat (Yang)**
   - Real-time streaming responses via SSE
   - Message history with pagination
   - Conversation management (create, rename, delete)
   - Tool call visualization
   - Source citations
   - Voice input support

3. **AFL Generator**
   - Natural language to AFL code
   - Syntax highlighting
   - Copy, share, save functionality
   - Template library

4. **Knowledge Base**
   - Document upload (PDF, TXT, CSV, JSON, MD)
   - Document list with status
   - AI-powered search
   - Delete documents

5. **Backtest Results**
   - Upload JSON results
   - Visualize metrics (CAGR, Sharpe, Max DD, etc.)
   - Equity curve charts
   - Trade history

6. **Content Generation**
   - Articles
   - Slide decks
   - Chat exports

## Design System

**Colors:**
- Primary: #FEC00F (Potomac Yellow)
- Background (Dark): #121212
- Background (Light): #FFFFFF
- Surface Secondary: #1E1E1E (dark) / #F8F9FA (light)
- Text Primary: #E8E8E8 (dark) / #1A1A1A (light)
- Text Secondary: #9E9E9E (dark) / #555555 (light)
- Success: #22C55E
- Error: #DC2626
- Info: #3B82F6

**Fonts:**
- Headings: Rajdhani (Bold, SemiBold, Medium)
- Body: Quicksand (Regular, Medium, SemiBold, Bold)
- Code: Fira Code (Regular, Medium)

**Spacing:**
- xxxs: 2pt, xxs: 4pt, xs: 6pt, sm: 8pt, md: 12pt, lg: 16pt, xl: 20pt, xxl: 24pt, xxxl: 32pt

**Corner Radius:**
- xs: 4pt, sm: 6pt, md: 8pt, lg: 12pt, xl: 16pt, xxl: 20pt, full: 999pt

## API Endpoints

### Auth
- POST /api/v2/auth/register - Register new user
- POST /api/v2/auth/login - Login
- POST /api/v2/auth/logout - Logout
- POST /api/v2/auth/refresh - Refresh token
- GET /api/v2/auth/me - Get current user

### Conversations
- GET /api/v2/conversations - List conversations
- POST /api/v2/conversations - Create conversation
- GET /api/v2/conversations/:id - Get conversation
- PATCH /api/v2/conversations/:id - Rename conversation
- DELETE /api/v2/conversations/:id - Delete conversation
- GET /api/v2/conversations/:id/messages - Get messages

### Chat
- POST /api/chat/v6 - Stream chat response (SSE)

### Knowledge Base
- GET /api/v2/brain/documents - List documents
- POST /api/v2/brain/upload - Upload document
- DELETE /api/v2/brain/documents/:id - Delete document

## Code Style Guidelines

1. Use Swift 5.9 features and Swift Concurrency (async/await, actors)
2. Use @Observable macro for view models (iOS 17+)
3. Prefer SwiftUI-native components over UIKit wrappers
4. Use environment objects for dependency injection
5. All network calls should be in actors for thread safety
6. Use Task for async operations in views
7. Handle all errors gracefully with user-friendly messages
8. Add haptic feedback for user interactions
9. Support Dynamic Type for accessibility
10. Use SF Symbols for icons

## File Structure

Follow the structure outlined in Section 2 of this document. Each feature should have:
- Models/ - Data structures
- ViewModels/ - Business logic
- Views/ - SwiftUI views
- Services/ - API and networking

## Testing Requirements

- Unit tests for all ViewModels
- Unit tests for Services/APIClient
- UI tests for critical user flows
- Mock protocols for all dependencies

## Deliverables

For each feature, provide:
1. Complete Swift code for all files
2. Preview providers for SwiftUI views
3. Unit test examples
4. Documentation comments

Start with the authentication flow, then move to the chat feature, then other features one by one.
```

---

## Summary

This guide provides a comprehensive blueprint for reconstructing the Potomac Analyst Workbench frontend as a native SwiftUI application. The document covers:

1. **Complete project setup** - Xcode configuration, dependencies, and project structure
2. **Core infrastructure** - Network layer, authentication, and state management
3. **Design system** - Colors, typography, spacing, and reusable components
4. **Feature implementation** - Detailed code for every screen
5. **Platform-specific features** - Watch, Vision Pro, and CarPlay implementations
6. **Quality assurance** - Testing strategy and CI/CD pipeline
7. **Deployment** - App Store submission and metadata

Use Section 19's AI Development Prompt with any AI coding assistant to generate complete, production-ready code for each feature.
