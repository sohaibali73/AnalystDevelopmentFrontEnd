# WinUI 3 Architecture Reference & Visual Diagrams

## Application Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        WinUI 3 Application                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │         Presentation Layer              │
        │  (Views, XAML, User Interactions)      │
        ├─────────────────────────────────────────┤
        │ • MainWindow.xaml                       │
        │ • Pages (Dashboard, Content, Chat...)   │
        │ • Controls & Custom Components          │
        │ • Resources (Brushes, Styles)           │
        └──────────────┬──────────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────────────┐
        │       ViewModel Layer (MVVM)            │
        │  (Data Binding, Commands, Logic)       │
        ├─────────────────────────────────────────┤
        │ • ViewModelBase (ObservableObject)      │
        │ • Page ViewModels                       │
        │ • ObservableProperties                  │
        │ • Commands (Relay, AsyncRelay)          │
        └──────────────┬──────────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────────────┐
        │      Service Layer (Business Logic)     │
        ├─────────────────────────────────────────┤
        │ • AuthService                           │
        │ • ContentService                        │
        │ • ChatService                           │
        │ • BacktestService                       │
        │ • ApiService                            │
        │ • ThemeService                          │
        │ • NotificationService                   │
        │ • StorageService                        │
        └──────────────┬──────────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────────────┐
        │       Data Access Layer (Models)        │
        ├─────────────────────────────────────────┤
        │ • User, AuthToken                       │
        │ • Content Objects                       │
        │ • Chat Messages                         │
        │ • Backtest Results                      │
        │ • API Response Models                   │
        └──────────────┬──────────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────────────┐
        │    External Services & API Layer        │
        ├─────────────────────────────────────────┤
        │ • REST API (HTTP Client)                │
        │ • Local Storage (AppData)                │
        │ • File System                           │
        │ • Network Services                      │
        └─────────────────────────────────────────┘
```

## Data Flow Pattern

```
User Interaction
    │
    ▼
XAML Event Handler / Command Trigger
    │
    ▼
ViewModel Command (IAsyncRelayCommand)
    │
    ▼
Service Method Call
    │
    ▼
Data Processing / API Call
    │
    ▼
Update ViewModel ObservableProperty
    │
    ▼
Property Changed Event Fires
    │
    ▼
Data Binding Updates XAML View
    │
    ▼
User Sees Result
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Start Application                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Check Cached Token         │
        │ in Local Storage           │
        └────────┬──────────┬────────┘
                 │          │
          Valid  │          │ Invalid/None
                 │          │
         ┌───────┘          └──────────┐
         │                             │
         ▼                             ▼
    ┌─────────────┐          ┌──────────────────┐
    │ Navigate to │          │  Show Login Page │
    │  Dashboard  │          └────────┬─────────┘
    └─────────────┘                   │
                                      ▼
                          ┌──────────────────────────┐
                          │ User Enters Credentials  │
                          └────────┬─────────────────┘
                                   │
                                   ▼
                          ┌──────────────────────────┐
                          │ Call AuthService.Login() │
                          │ Send to API              │
                          └────────┬─────────────────┘
                                   │
                        ┌──────────┴──────────┐
                        │                     │
                   Success               Failure
                        │                     │
                        ▼                     ▼
            ┌──────────────────────┐  ┌──────────────────┐
            │ Save Token & User    │  │ Show Error       │
            │ to Local Storage     │  │ Message          │
            └────────┬─────────────┘  └──────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Navigate to Dashboard      │
        └────────────────────────────┘
```

## Page Navigation Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    MainWindow                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Command Bar (Top Navigation)                       │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  NavigationView (Sidebar)                          │  │
│  │  ├─ Dashboard                                      │  │
│  │  ├─ Content                                        │  │
│  │  ├─ Chat                                           │  │
│  │  ├─ AFL Generator                                  │  │
│  │  ├─ Backtest                                       │  │
│  │  ├─ Researcher                                     │  │
│  │  ├─ Knowledge Base                                 │  │
│  │  ├─ Reverse Engineer                               │  │
│  │  └─ Settings                                       │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
        │  │ Frame (ContentFrame)                               │  │
        │  │ ├─ DashboardPage                                   │  │
        │  │ ├─ ContentPage                                     │  │
        │  │ ├─ ChatPage                                        │  │
        │  │ ├─ AFLGeneratorPage                                │  │
        │  │ ├─ BacktestPage                                    │  │
        │  │ ├─ ResearcherPage                                  │  │
        │  │ ├─ KnowledgeBasePage                               │  │
        │  │ ├─ ReverseEngineerPage                             │  │
        │  │ └─ SettingsPage                                    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Dependency Injection Container Setup

```
┌─────────────────────────────────────────────────────────┐
│         Application Startup (App.xaml.cs)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ ConfigureServices()            │
        │ Register Dependencies          │
        └────────────┬───────────────────┘
                     │
        ┌────────────┴──────────────────────┐
        │                                   │
        ▼                                   ▼
    Services                         ViewModels
    ├─ IAuthService                  ├─ LoginViewModel
    ├─ IApiService                   ├─ RegisterViewModel
    ├─ IContentService               ├─ DashboardViewModel
    ├─ IChatService                  ├─ ContentViewModel
    ├─ IBacktestService              ├─ ChatViewModel
    ├─ IThemeService                 ├─ AFLGeneratorViewModel
    ├─ INotificationService          ├─ BacktestViewModel
    ├─ IStorageService               ├─ SettingsViewModel
    ├─ INavigationService            └─ ...
    └─ IDialogService
```

## Component Hierarchy Example: ContentPage

```
┌────────────────────────────────────────────────┐
│              ContentPage                       │
│  (DataContext: ContentViewModel)               │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Header Panel                             │ │
│  │ ├─ Title TextBlock                       │ │
│  │ └─ Search Box                            │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ TabView (Tabs)                           │ │
│  │                                          │ │
│  │ ┌──────────────────────────────────────┐ │ │
│  │ │ Articles Tab                         │ │ │
│  │ │ ├─ ArticlesView Component            │ │ │
│  │ │ └─ ArticleEditorPanel                │ │ │
│  │ └──────────────────────────────────────┘ │ │
│  │                                          │ │
│  │ ┌──────────────────────────────────────┐ │ │
│  │ │ Documents Tab                        │ │ │
│  │ │ ├─ DocumentGridView                  │ │ │
│  │ │ └─ DocumentPreviewPanel               │ │ │
│  │ └──────────────────────────────────────┘ │ │
│  │                                          │ │
│  │ ┌──────────────────────────────────────┐ │ │
│  │ │ Slide Decks Tab                      │ │ │
│  │ │ ├─ SlideDecksView                    │ │ │
│  │ │ └─ SlideEditor                       │ ��� │
│  │ └──────────────────────────────────────┘ │ │
│  │                                          │ │
│  │ ┌──────────────────────────────────────┐ │ │
│  │ │ Skills Tab                           │ │ │
│  │ │ └─ SkillsGridView                    │ │ │
│  │ └──────────────────────────────────────┘ │ │
│  │                                          │ │
│  │ ┌──────────────────────────────────────┐ │ │
│  │ │ Dashboards Tab                       │ │ │
│  │ │ └─ DashboardsListView                │ │ │
│  │ └──────────────────────────────────────┘ │ │
│  │                                          │ │
│  │ ┌──────────────────────────────────────┐ │ │
│  │ │ Templates Tab                        │ │ │
│  │ │ └─ TemplatesPanel                    │ │ │
│  │ └──────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Footer Panel                             │ │
│  │ └─ Status Bar                            │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

## Theme Implementation Architecture

```
┌─────────────────────────────────────────────┐
│         App.xaml (Resources)                │
├─────────────────────────────────────────────┤
│                                             │
│ ┌───────────────────────────────────────┐   │
│ │ Local Resources                       │   │
│ │ ├─ PotemacColors.xaml                 │   │
│ │ ├─ TextStyles.xaml                    │   │
│ │ ├─ ControlStyles.xaml                 │   │
│ │ ├─ FontDefinitions.xaml               │   │
│ │ └─ Converters.xaml                    │   │
│ └────────┬────────────────────────────┬─┘   │
│          │                            │     │
│    Light │                            │ Dark│
│          ▼                            ▼     │
│ ┌──────────────────┐    ┌──────────────────┐│
│ │ Light Theme      │    │ Dark Theme       ││
│ │ Resources/       │    │ Resources/       ││
│ │ ColorPalette     │    │ ColorPalette     ││
│ │ ├─ Background    │    │ ├─ Background    ││
│ │ ├─ Foreground    │    │ ├─ Foreground    ││
│ │ ├─ Accent        │    │ ├─ Accent        ││
│ │ └─ ...           │    │ └─ ...           ││
│ └──────────────────┘    └──────────────────┘│
└─────────────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────────┐
        │ ThemeService.cs         │
        │ ┌──────────────────────┐│
        │ │ ApplyPotemacTheme()  ││
        │ │ ToggleDarkMode()     ││
        │ │ GetCurrentTheme()    ││
        │ └──────────────────────┘│
        └─────────────┬───────────┘
                      │
         ┌────────────┴──────────────┐
         │                           │
         ▼                           ▼
    Light Mode                  Dark Mode
    (RequestedTheme =           (RequestedTheme =
     ElementTheme.Light)         ElementTheme.Dark)
```

## State Management Flow

```
┌─────────────────────────────────────────────┐
│          User Action / Event                │
│    (Button Click, Input Change, etc.)       │
└────────────────────┬────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ ViewModel Command Execute  │
        │ (IAsyncRelayCommand)       │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Validate Input             │
        │ Update IsLoading = true    │
        │ Clear ErrorMessage         │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Call Service Method        │
        │ (Async Operation)          │
        └────────────┬───────────────┘
                     │
        ┌────────────┴──────────┐
        │                       │
    Success               Error/Failure
        │                       │
        ▼                       ▼
   ┌─────────────┐      ┌──────────────────┐
   │ Update      │      │ Set Error        │
   │ Observable  │      │ Message          │
   │ Properties  │      │ IsLoading = false│
   │ IsLoading=  │      └──────────────────┘
   │ false       │
   └──────┬──────┘
          │
          ▼
   ┌──────────────────────┐
   │ INotifyPropertyChanged
   │ Event Fires          │
   └──────────┬───────────┘
              │
              ▼
   ┌──────────────────────┐
   │ Binding Updates XAML │
   │ View (Automatic)     │
   └──────────┬───────────┘
              │
              ▼
   ┌──────────────────────┐
   │ UI Reflects New State│
   │ (UI Refresh)         │
   └──────────────────────┘
```

## API Communication Pattern

```
ViewModelCommand
    │
    ▼
Service.GetDataAsync() - IApiService
    │
    ├─ Add Authorization Header (Bearer Token)
    ├─ Serialize Request Payload
    ├─ Send HTTP Request (GET/POST/PUT/DELETE)
    │
    ├──────────────────────────┐
    │                          │
Success                    Failure
    │                          │
    ▼                          ▼
Deserialize JSON          Return Error Response
    │                          │
    ▼                          ▼
Create Model Object       Log Exception
    │                          │
    ▼                          ▼
Return ApiResponse<T>     Throw/Return Error
    │                          │
    └──────────┬───────────────┘
               │
               ▼
        Update ViewModel
        ObservableProperties
               │
               ▼
        Binding Updates UI
```

## Component Communication (Cross-Page)

```
Page A
├─ ViewModel A
│  └─ Publishes Event/Command
│     │
│     └─ NavigationService.Navigate<ViewModelB>(parameter)
│
Page B
├─ ViewModel B
│  └─ OnNavigatedTo(parameter)
│     └─ Receives and processes parameter
│        └─ Updates ObservableProperties
│           └─ UI Bindings update automatically
```

## Error Handling Flow

```
Try
└─ Execute Operation
   │
   └─ Catch Exception
      │
      ├─ Log Exception
      │  (Debug.WriteLine, File Logging)
      │
      ├─ Set ErrorMessage ObservableProperty
      │
      ├─ Show Dialog/Toast
      │  (Optional)
      │
      └─ Update UI State
         └─ Disable controls
         └─ Show retry button
         └─ Display user-friendly message
Finally
└─ Set IsLoading = false
   └─ Clean up resources
```

## Database/Local Storage Architecture

```
┌─────────────────────────────────────────────┐
│         Local Storage (AppData)             │
├─────────────────────────────────────────────┤
│                                             │
│ %LocalAppData%\PotomacAnalyst\             │
│ ├─ config.json                             │
│ │  └─ User preferences, theme settings      │
│ │                                           │
│ ├─ cache/                                   │
│ │  ├─ tokens/                               │
│ │  │  └─ auth_token.json                    │
│ │  └─ data/                                 │
│ │     ├─ articles_cache.json                │
│ │     ├─ documents_cache.json               │
│ │     └─ ...                                │
│ │                                           │
│ └─ logs/                                    │
│    └─ app.log                               │
│                                             │
└──────────────────────────────────────────────┘
                    │
                    ▼
        ┌────────────────────────────��
        │ StorageService.cs          │
        │ ├─ SaveAsync()             │
        │ ├─ LoadAsync()             │
        │ ├─ DeleteAsync()           │
        │ └─ ClearCacheAsync()       │
        └────────────────────────────┘
```

## Testing Architecture

```
┌─────────────────────────────────────────────────┐
│        Unit Tests (ViewModel Tests)             │
├─────────────────────────────────────────────────┤
│ ✓ Command execution logic                       │
│ ✓ Input validation                              │
│ ✓ ObservableProperty updates                    │
│ ✓ Error handling                                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│     Integration Tests (Service Tests)           │
├─────────────────────────────────────────────────┤
│ ✓ API communication                             │
│ ✓ Authentication flow                           │
│ ✓ Data persistence                              │
│ ✓ Service method interactions                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│    UI Tests (XAML/Control Tests)                │
├─────────────────────────────────────────────────┤
│ ✓ Control rendering                             │
│ ✓ Data binding                                  │
│ ✓ User interaction                              │
│ ✓ Theme switching                               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Performance Tests (Load/Stress)                │
├─────────────────────────────────────────────────┤
│ ✓ Large list virtualization                     │
│ ✓ Memory usage                                  │
│ ✓ API response time                             │
│ ✓ UI responsiveness                             │
└─────────────────────────────────────────────────┘
```

## Build and Deployment Pipeline

```
┌──────────────────────────────────────────────┐
│     Source Code (GitHub)                     │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Build Process              │
        │ • Compile C#               │
        │ • Build XAML               │
        │ • Link Resources           │
        │ • Generate Symbols         │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────��───────────────┐
        │ Run Tests                  │
        │ • Unit Tests               │
        │ • Integration Tests        │
        │ • UI Tests                 │
        └────────────┬───────────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
    Tests Pass                   Tests Fail
        │                           │
        ▼                           ▼
    ┌──────────┐            ┌────────────┐
    │ Package  │            │ Notify Dev │
    │ MSIX     │            │ Revert     │
    └────┬─────┘            └────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ Code Sign Package    │
    └────┬─────────────────┘
         │
         ▼
    ┌──────────────────────────┐
    │ Upload to Microsoft Store │
    │ or Internal Distribution  │
    └──────────────────────────┘
```

---

This reference guide provides a visual understanding of how the WinUI 3 application is structured, how data flows through the system, and how components interact with each other.
