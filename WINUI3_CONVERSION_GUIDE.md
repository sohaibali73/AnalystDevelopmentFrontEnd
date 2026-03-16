# Comprehensive Guide: Converting Potomac Analyst to WinUI 3

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current Application Architecture](#current-application-architecture)
3. [Page Structure and Purpose](#page-structure-and-purpose)
4. [UI Component Mapping](#ui-component-mapping)
5. [Color Scheme and Theming](#color-scheme-and-theming)
6. [WinUI 3 Project Organization](#winui-3-project-organization)
7. [Implementation Best Practices](#implementation-best-practices)
8. [Navigation and Interaction Patterns](#navigation-and-interaction-patterns)
9. [Performance Considerations](#performance-considerations)
10. [Migration Timeline](#migration-timeline)

---

## Executive Summary

The Potomac Analyst application is a sophisticated financial analysis and trading strategy platform built with Next.js, React, and TypeScript. Converting it to WinUI 3 will create a native Windows desktop application while maintaining the existing brand identity, user experience, and functionality.

**Key Benefits of WinUI 3 Migration:**
- Native Windows integration with improved performance
- Direct access to Windows APIs
- Fluent Design System alignment
- Enhanced offline capabilities
- Better system resource optimization
- Microsoft Store distribution options

---

## Current Application Architecture

### Technology Stack
- **Frontend Framework:** Next.js 15+ (React 19)
- **Styling:** Tailwind CSS + Custom CSS Variables
- **State Management:** React Context API + Custom Hooks
- **Authentication:** Custom auth with session management
- **Component Library:** shadcn/ui + custom components
- **Font System:** Rajdhani (headings), Quicksand (body), Inter (fallback)
- **Package Manager:** npm/pnpm

### Key Design Systems
**Color Palette:**
```
Primary Brand: Gold/Yellow (#FEC00F - Potomac Yellow)
Secondary Accents: Turquoise (#00DED1), Pink (#EB2F5C)
Neutral: Gray (#212121 - Potomac Gray)
Dark Mode: #0d1117 (background), #f0f0f0 (foreground)
Light Mode: #ffffff (background), #1a1a1a (foreground)
```

**Typography:**
- Headings: Rajdhani (uppercase, letter-spacing: 0.5px)
- Body Text: Quicksand (16px base, line-height: 1.5-1.6)
- Code/Monospace: Fira Code, Consolas, Monaco

**Key Spacing:** 
- Uses Tailwind scale: 0.25rem (4px), 0.5rem (8px), 1rem (16px), etc.

---

## Page Structure and Purpose

### 1. **Authentication Pages**

#### Login Page (`/login`)
**Current Structure:**
- Split-layout design (left branding, right form)
- Responsive: Collapses to single column on mobile
- Components: Email input, Password input, Sign-in button, Password recovery link, Sign-up prompt

**Purpose:** Primary entry point for returning users

**Key Interactions:**
- Email/password validation
- "Forgot password?" navigation
- "Create account" navigation to register
- Form submission with loading state

**WinUI 3 Implementation:**
```csharp
// MainWindow.xaml.cs
public partial class LoginWindow : Window
{
    public LoginWindow()
    {
        this.InitializeComponent();
    }
}

// ViewModel Pattern (MVVM)
public class LoginViewModel : INotifyPropertyChanged
{
    private string _email;
    private string _password;
    public RelayCommand SignInCommand { get; }
    public RelayCommand NavigateToRegisterCommand { get; }
    public RelayCommand ForgotPasswordCommand { get; }
}
```

#### Register Page (`/register`)
**Purpose:** New user account creation

**Key Features:**
- Email validation
- Password strength indicator
- Terms of service acceptance
- Account confirmation option

#### Forgot Password Page (`/forgot-password`)
**Purpose:** Password reset functionality

---

### 2. **Protected/Authenticated Pages**

#### Dashboard Page (`/dashboard`)
**Current Structure:**
- Main hub for user activity
- Analytics overview, quick stats, navigation tiles
- Recent activity feed
- Real-time data updates

**Key Components:**
- Header with user profile
- Sidebar navigation
- Main content grid
- Performance metrics cards
- Charts and visualizations

**WinUI 3 Implementation Notes:**
- Use `NavigationView` for sidebar
- Implement `DataGrid` for table data
- Use `TeachingTip` for onboarding
- Chart integration via WinUI Charting libraries

#### Content Page (`/content`)
**Purpose:** Content management and creation hub

**Tabs/Sections:**
- Articles (article editor, management)
- Documents (document library)
- Slide Decks (presentation builder)
- Skills (knowledge management)
- Dashboards (dashboard builder)
- Templates (reusable templates)

**Key Interactions:**
- Rich text editing
- File uploads
- Preview panels
- Multi-tab interface
- Search functionality

**WinUI 3 Implementation:**
```xaml
<Grid>
    <Grid.RowDefinitions>
        <RowDefinition Height="Auto"/>
        <RowDefinition Height="*"/>
    </Grid.RowDefinitions>
    
    <TabView x:Name="ContentTabs">
        <TabViewItem Header="Articles" />
        <TabViewItem Header="Documents" />
        <TabViewItem Header="Slide Decks" />
        <TabViewItem Header="Skills" />
        <TabViewItem Header="Dashboards" />
        <TabViewItem Header="Templates" />
    </TabView>
    
    <Frame Grid.Row="1" x:Name="ContentFrame"/>
</Grid>
```

#### Chat Page (`/chat`)
**Purpose:** AI-powered conversational interface

**Features:**
- Message history
- Real-time streaming responses
- Syntax highlighting for code
- Markdown rendering
- File attachments
- Voice input support

**WinUI 3 Implementation Considerations:**
- Use `RichEditBox` for markdown support
- Implement virtual scrolling for message lists
- WebView2 for rich content rendering
- Background tasks for AI streaming

#### AFL Generator (`/afl`)
**Purpose:** Generate AFL (Amibroker Formula Language) code

**Features:**
- Code editor with syntax highlighting
- Parameter inputs
- Code generation controls
- Output preview
- Copy/export functionality

**WinUI 3 Implementation:**
```xaml
<Grid>
    <Grid.ColumnDefinitions>
        <ColumnDefinition Width="*"/>
        <ColumnDefinition Width="*"/>
    </Grid.ColumnDefinitions>
    
    <!-- Input Panel -->
    <StackPanel Grid.Column="0">
        <!-- Form controls for AFL parameters -->
    </StackPanel>
    
    <!-- Code Editor -->
    <TextBox Grid.Column="1" x:Name="CodeOutput" 
             IsReadOnly="True" 
             TextWrapping="NoWrap"/>
</Grid>
```

#### Backtest Page (`/backtest`)
**Purpose:** Strategy backtesting and analysis

**Features:**
- Historical data input
- Strategy configuration
- Performance metrics
- Interactive charts
- Results comparison

**Components:**
- `BacktestFilters` - Input parameters
- `BacktestTable` - Results display
- `BacktestCharts` - Visualization
- `BacktestMetricsGrid` - Statistics

#### Researcher Page (`/researcher`)
**Purpose:** Market and company research terminal

**Features:**
- Company information lookup
- News feeds
- Market analysis
- Research note taking

#### Knowledge Base (`/knowledge`)
**Purpose:** User-generated knowledge repository

**Features:**
- Document upload/management
- Full-text search
- Tagging system
- Document previewing
- Knowledge base analytics

#### Reverse Engineer (`/reverse-engineer`)
**Purpose:** Code and strategy analysis

#### Settings Page (`/settings`)
**Purpose:** User preferences and configuration

**Sections:**
- Profile management
- Account settings
- Notification preferences
- API keys management
- Theme preferences
- Font size adjustment

---

## UI Component Mapping

### Form Controls

| Next.js/React Component | Current Implementation | WinUI 3 Equivalent | Notes |
|---|---|---|---|
| `<input type="email">` | Tailwind styled input | `TextBox` | Add validation binding |
| `<input type="password">` | Eye toggle for visibility | `PasswordBox` | Native password masking |
| `<button>` | shadcn Button | `Button` | Use accent colors |
| `<select>` | Custom dropdown | `ComboBox` / `DropDownButton` | Add search filtering |
| `<textarea>` | Rich text area | `TextBox` with multiline or `RichEditBox` | For markdown/code |
| `<checkbox>` | shadcn Checkbox | `CheckBox` | MVVM binding |
| `<radio>` | shadcn Radio | `RadioButton` | Group in StackPanel |
| Form validation | Real-time error display | `TextBlock` below input or Validation Ring | Synchronous validation |

### Navigation

| Element | Current | WinUI 3 | Implementation |
|---|---|---|---|
| Main Navigation | Sidebar (custom) | `NavigationView` | Top nav with pane |
| Page Routing | Next.js Router | `Frame` navigation | URI-based routing |
| Breadcrumbs | Custom links | `BreadcrumbBar` (WinUI 3.1+) | Show current location |
| Tabs | `TabView` component | WinUI `TabView` | Identical API |
| Dialog/Modal | shadcn Dialog | `ContentDialog` | Consistent with Fluent |

### Data Display

| Component | Current | WinUI 3 | Mapping |
|---|---|---|---|
| Tables | Custom Grid | `DataGrid` | Virtualization support |
| Lists | Custom lists | `ListView` with `ItemsControl` | Virtualized scrolling |
| Cards | shadcn Card | Custom `Border` + Acrylic | Grid layout |
| Charts | Recharts | WinUI Community Charts | Windows integration |
| Tree View | Custom file tree | `TreeView` | Native implementation |

### Advanced Components

| Feature | Current | WinUI 3 |
|---|---|---|
| Code Editor | Monaco Editor | CodeEditor from WinUI Community or fork |
| Rich Text Editor | Custom/markdown | `RichEditBox` |
| File Picker | Web input[type="file"] | `FileOpenPicker` / `FileSavePicker` |
| Image Gallery | Custom gallery | `ItemsControl` with virtualization |
| Notifications | Sonner (toast) | `Notification` (deprecated) → custom or 3rd party |
| Accessibility | ARIA attributes | Automation properties, narration support |

---

## Color Scheme and Theming

### Design Token System

#### Core Colors (CSS Variables in globals.css)
```css
/* Root (Light Mode) */
:root {
    --potomac-yellow: #FEC00F;        /* Primary brand accent */
    --potomac-gray: #212121;          /* Dark neutral */
    --potomac-turquoise: #00DED1;     /* Secondary accent */
    --potomac-pink: #EB2F5C;          /* Tertiary accent */
    --background: 0 0% 100%;          /* White */
    --foreground: 224 71.4% 4.1%;     /* Dark gray text */
}

/* Dark Mode */
.dark {
    --potomac-yellow: #FEC00F;        /* Remains bright in dark */
    --potomac-gray: #212121;          /* Dark neutral */
    --background: 224 71.4% 4.1%;     /* Very dark blue-gray */
    --foreground: 210 20% 98%;        /* Almost white text */
}
```

### WinUI 3 Theming Strategy

#### Option 1: Resource Dictionary Approach (Recommended)
```xaml
<!-- Resources/PotemacColors.xaml -->
<ResourceDictionary
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    
    <!-- Brand Colors -->
    <Color x:Key="PotemacYellow">#FEC00F</Color>
    <Color x:Key="PotemacGray">#212121</Color>
    <Color x:Key="PotemacTurquoise">#00DED1</Color>
    <Color x:Key="PotemacPink">#EB2F5C</Color>
    
    <!-- Derived Brushes -->
    <SolidColorBrush x:Key="PrimaryBrush" Color="{StaticResource PotemacYellow}"/>
    <SolidColorBrush x:Key="AccentBrush" Color="{StaticResource PotemacTurquoise}"/>
    
    <!-- Theme Brushes -->
    <SolidColorBrush x:Key="BackgroundBrush" Color="#0D1117"/> <!-- Dark mode -->
    <SolidColorBrush x:Key="ForegroundBrush" Color="#F0F0F0"/>
</ResourceDictionary>
```

#### Option 2: Theme Service (C# Approach)
```csharp
public class ThemeService
{
    public static void ApplyPotemacTheme(ElementTheme theme)
    {
        var app = Application.Current;
        var resources = app.Resources;
        
        if (theme == ElementTheme.Dark)
        {
            resources["Background"] = new SolidColorBrush(Color.FromArgb(255, 13, 17, 23));
            resources["Foreground"] = new SolidColorBrush(Color.FromArgb(255, 240, 240, 240));
        }
        else
        {
            resources["Background"] = new SolidColorBrush(Colors.White);
            resources["Foreground"] = new SolidColorBrush(Colors.Black);
        }
        
        resources["AccentBrush"] = new SolidColorBrush(
            Color.FromArgb(255, 254, 192, 15)
        );
    }
}
```

### Font System Implementation

#### WinUI 3 Font Registration
```xaml
<!-- app.xaml -->
<Application
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    
    <Application.Resources>
        <FontFamily x:Key="RajdhaniFont">ms-appx:///Assets/Fonts/Rajdhani/Rajdhani-Bold.ttf#Rajdhani</FontFamily>
        <FontFamily x:Key="QuicksandFont">ms-appx:///Assets/Fonts/Quicksand/Quicksand-Regular.ttf#Quicksand</FontFamily>
        <FontFamily x:Key="FiraCodeFont">ms-appx:///Assets/Fonts/FiraCode/FiraCode-Regular.ttf#Fira Code</FontFamily>
    </Application.Resources>
</Application>
```

#### Custom Styles
```xaml
<!-- Styles/TextStyles.xaml -->
<Style x:Key="HeadingStyle" TargetType="TextBlock">
    <Setter Property="FontFamily" Value="{StaticResource RajdhaniFont}"/>
    <Setter Property="FontSize" Value="24"/>
    <Setter Property="FontWeight" Value="Bold"/>
    <Setter Property="CharacterSpacing" Value="50"/> <!-- 0.5px equivalent -->
    <Setter Property="TextTransform" Value="Uppercase"/>
</Style>

<Style x:Key="BodyTextStyle" TargetType="TextBlock">
    <Setter Property="FontFamily" Value="{StaticResource QuicksandFont}"/>
    <Setter Property="FontSize" Value="14"/>
    <Setter Property="LineHeight" Value="21"/>
</Style>

<Style x:Key="CodeStyle" TargetType="TextBlock">
    <Setter Property="FontFamily" Value="{StaticResource FiraCodeFont}"/>
    <Setter Property="FontSize" Value="12"/>
</Style>
```

### Implementing Dark Mode Toggle

```csharp
public sealed partial class MainWindow : Window
{
    private ElementTheme _currentTheme = ElementTheme.Dark;
    
    public void ToggleTheme()
    {
        _currentTheme = _currentTheme == ElementTheme.Dark 
            ? ElementTheme.Light 
            : ElementTheme.Dark;
            
        this.Content.RequestedTheme = _currentTheme;
        ThemeService.ApplyPotemacTheme(_currentTheme);
    }
}
```

---

## WinUI 3 Project Organization

### Recommended Directory Structure

```
PotomacAnalyst.WinUI/
│
├── Assets/
│   ├── Fonts/
│   │   ├── Rajdhani/
│   │   │   ├── Rajdhani-Light.ttf
│   │   │   ├── Rajdhani-Regular.ttf
│   │   │   ├── Rajdhani-Bold.ttf
│   │   │   └── Rajdhani-Black.ttf
│   │   ├── Quicksand/
│   │   │   ├── Quicksand-Light.ttf
│   │   │   ├── Quicksand-Regular.ttf
│   │   │   ├── Quicksand-Bold.ttf
│   │   │   └── Quicksand-Black.ttf
│   │   └── FiraCode/
│   │       └── FiraCode-Regular.ttf
│   ├── Images/
│   │   ├── Icons/
│   │   ├── Logos/
│   │   │   └── PotemacLogo.svg
│   │   └── Illustrations/
│   └── Sounds/
│
├── Resources/
│   ├── Brushes.xaml
│   ├── Colors.xaml
│   ├── TextStyles.xaml
│   ├── ControlStyles.xaml
│   ├── Light/
│   │   ├── ColorPalette.xaml
│   │   └── Theme.xaml
│   └── Dark/
│       ├── ColorPalette.xaml
│       └── Theme.xaml
│
├── Views/
│   ├── Windows/
│   │   ├── MainWindow.xaml
│   │   ├── MainWindow.xaml.cs
│   │   ├── LoginWindow.xaml
│   │   ├── LoginWindow.xaml.cs
│   │   └── RegisterWindow.xaml
│   ├── Pages/
│   │   ├── Dashboard/
│   │   │   ├── DashboardPage.xaml
│   │   │   └── DashboardPage.xaml.cs
│   │   ├── Content/
│   │   │   ├── ContentPage.xaml
│   │   │   ├── ContentPage.xaml.cs
│   │   │   ├── ArticlesView.xaml
│   │   │   ├── DocumentsView.xaml
│   │   │   ├── SlideDeckView.xaml
│   │   │   └── SkillsView.xaml
│   │   ├── Chat/
│   │   │   ├── ChatPage.xaml
│   │   │   └── ChatPage.xaml.cs
│   │   ├── AFL/
│   │   │   ├── AFLGeneratorPage.xaml
│   │   │   └── AFLGeneratorPage.xaml.cs
│   │   ├── Backtest/
│   │   ├── Researcher/
│   │   ├── Knowledge/
│   │   ├── ReverseEngineer/
│   │   └── Settings/
│   └── Controls/
│       ├── NavigationView.xaml
│       ├── InputField.xaml
│       ├── CodeEditor.xaml
│       ├── ChartComponent.xaml
│       ├── DataGridView.xaml
│       ├── MarkdownViewer.xaml
│       └── CustomControls.xaml
│
├── ViewModels/
│   ├── ViewModelBase.cs
│   ├── MainViewModel.cs
│   ├── LoginViewModel.cs
│   ├── RegisterViewModel.cs
│   ├── DashboardViewModel.cs
│   ├── ContentViewModel.cs
│   ├── ChatViewModel.cs
│   ├── AFLGeneratorViewModel.cs
│   ├── BacktestViewModel.cs
│   ├── SettingsViewModel.cs
│   └── Navigation/
│       ├── NavigationService.cs
│       ├── DialogService.cs
│       └── WindowService.cs
│
├── Models/
│   ├── User.cs
│   ├── AuthToken.cs
│   ├── Dashboard/
│   │   ├── DashboardData.cs
│   │   └── Metrics.cs
│   ├── Content/
│   │   ├── Article.cs
│   │   ├── Document.cs
│   │   ├── SlideDeck.cs
│   │   └── Skill.cs
│   ├── Chat/
│   │   ├── Message.cs
│   │   ├── Conversation.cs
│   │   └── ChatResponse.cs
│   ├── AFL/
│   │   ├── AFLCode.cs
│   │   └── GenerationRequest.cs
│   ├── Backtest/
│   │   ├── BacktestRequest.cs
│   │   ├── BacktestResult.cs
│   │   └── BacktestMetrics.cs
│   └── Common/
│       ├── ApiResponse.cs
│       └── PaginationData.cs
│
├── Services/
│   ├── IAuthService.cs
│   ├── AuthService.cs
│   ├── IApiService.cs
│   ├── ApiService.cs
│   ├── IChatService.cs
│   ├── ChatService.cs
│   ├── IContentService.cs
│   ├── ContentService.cs
│   ├── IBacktestService.cs
│   ├── BacktestService.cs
│   ├── IThemeService.cs
│   ├── ThemeService.cs
│   ├── INotificationService.cs
│   ├── NotificationService.cs
│   ├── IStorageService.cs
│   ├── StorageService.cs
│   └── Helpers/
│       ├── HttpClientHelper.cs
│       ├── SerializationHelper.cs
│       └── ValidationHelper.cs
│
├── Helpers/
│   ├── RelayCommand.cs
│   ├── AsyncRelayCommand.cs
│   ├── ValueConverters/
│   │   ├── BoolToVisibilityConverter.cs
│   │   ├── NullToVisibilityConverter.cs
│   │   ├── ColorToBrushConverter.cs
│   │   └── EnumToStringConverter.cs
│   ├── Behaviors/
│   │   ├── BindablePasswordBehavior.cs
│   │   └── FocusBehavior.cs
│   └── Extensions/
│       ├── StringExtensions.cs
│       ├── EnumerableExtensions.cs
│       └── DependencyObjectExtensions.cs
│
├── Constants/
│   ├── AppConstants.cs
│   ├── ApiEndpoints.cs
│   ├── Messages.cs
│   └── ValidationRules.cs
│
├── App.xaml
├── App.xaml.cs
├── Package.appxmanifest
├── PotomacAnalyst.WinUI.csproj
└── .gitignore
```

### Project File Configuration (PotomacAnalyst.WinUI.csproj)

```xml
<Project Sdk="Microsoft.NET.Sdk.WindowsDesktop">

    <PropertyGroup>
        <OutputType>WinExe</OutputType>
        <TargetFramework>net8.0-windows10.0.22621.0</TargetFramework>
        <TargetPlatformVersion>10.0.22621.0</TargetPlatformVersion>
        <RuntimeIdentifiers>win-x64;win-x86</RuntimeIdentifiers>
        
        <RootNamespace>PotomacAnalyst.WinUI</RootNamespace>
        <AssemblyName>PotomacAnalyst</AssemblyName>
        <Version>1.0.0</Version>
        
        <UseWinUI>true</UseWinUI>
        <EnableMsixTooling>true</EnableMsixTooling>
        <Deterministic>true</Deterministic>
        
        <!-- Enable XAML Hot Reload -->
        <DebugSymbols>true</DebugSymbols>
        <DebugType>embedded</DebugType>
    </PropertyGroup>

    <ItemGroup>
        <PackageReference Include="Microsoft.WindowsAppSDK" Version="1.5.5" />
        <PackageReference Include="Microsoft.Windows.SDK.BuildTools" Version="10.0.22621.756" />
        <PackageReference Include="CommunityToolkit.Mvvm" Version="8.2.2" />
        <PackageReference Include="CommunityToolkit.WinUI" Version="8.0.240109" />
        <PackageReference Include="System.Net.Http" Version="4.3.4" />
    </ItemGroup>

</Project>
```

---

## Implementation Best Practices

### 1. MVVM Architecture

**ViewModelBase.cs**
```csharp
using Microsoft.Toolkit.Mvvm.ComponentModel;
using System.ComponentModel;

namespace PotomacAnalyst.WinUI.ViewModels
{
    public abstract class ViewModelBase : ObservableObject
    {
        protected bool _isLoading = false;
        protected string _errorMessage = string.Empty;

        public bool IsLoading
        {
            get => _isLoading;
            set => SetProperty(ref _isLoading, value);
        }

        public string ErrorMessage
        {
            get => _errorMessage;
            set => SetProperty(ref _errorMessage, value);
        }

        public virtual async Task OnNavigatedTo()
        {
            // Override in derived classes
            await Task.CompletedTask;
        }

        public virtual async Task OnNavigatedFrom()
        {
            // Override in derived classes
            await Task.CompletedTask;
        }
    }
}
```

### 2. Service Architecture

**IAuthService Interface**
```csharp
public interface IAuthService
{
    Task<AuthResponse> LoginAsync(string email, string password);
    Task<AuthResponse> RegisterAsync(string email, string password, string confirmPassword);
    Task<bool> LogoutAsync();
    Task<User> GetCurrentUserAsync();
    bool IsAuthenticated { get; }
    string? CurrentToken { get; }
    event EventHandler<AuthChangedEventArgs> AuthStateChanged;
}
```

**AuthService Implementation**
```csharp
public class AuthService : IAuthService
{
    private readonly IApiService _apiService;
    private readonly IStorageService _storageService;
    private string? _currentToken;
    private User? _currentUser;

    public event EventHandler<AuthChangedEventArgs>? AuthStateChanged;

    public bool IsAuthenticated => !string.IsNullOrEmpty(_currentToken);
    public string? CurrentToken => _currentToken;

    public AuthService(IApiService apiService, IStorageService storageService)
    {
        _apiService = apiService;
        _storageService = storageService;
        LoadCachedToken();
    }

    public async Task<AuthResponse> LoginAsync(string email, string password)
    {
        try
        {
            var response = await _apiService.PostAsync<AuthResponse>(
                "api/auth/login",
                new { email, password }
            );

            if (response.IsSuccessful)
            {
                _currentToken = response.Data.Token;
                _currentUser = response.Data.User;
                
                await _storageService.SaveAsync("auth_token", _currentToken);
                OnAuthStateChanged(true);
            }

            return response.Data;
        }
        catch (Exception ex)
        {
            // Handle error
            throw;
        }
    }

    private void OnAuthStateChanged(bool isAuthenticated)
    {
        AuthStateChanged?.Invoke(this, new AuthChangedEventArgs { IsAuthenticated = isAuthenticated });
    }
}
```

### 3. Navigation Service

```csharp
public interface INavigationService
{
    void Navigate<TViewModel>(object? parameter = null) where TViewModel : ViewModelBase;
    void GoBack();
    bool CanGoBack { get; }
    event EventHandler<Type> Navigated;
}

public class NavigationService : INavigationService
{
    private readonly Frame _frame;
    private readonly Dictionary<Type, Type> _viewModelPageMappings;

    public NavigationService(Frame frame)
    {
        _frame = frame;
        _viewModelPageMappings = new Dictionary<Type, Type>();
    }

    public void Navigate<TViewModel>(object? parameter = null) where TViewModel : ViewModelBase
    {
        var viewModelType = typeof(TViewModel);
        if (!_viewModelPageMappings.TryGetValue(viewModelType, out var pageType))
        {
            throw new InvalidOperationException($"No mapping found for {viewModelType.Name}");
        }

        _frame.Navigate(pageType, parameter);
        Navigated?.Invoke(this, viewModelType);
    }

    public void GoBack()
    {
        if (CanGoBack)
            _frame.GoBack();
    }

    public bool CanGoBack => _frame.CanGoBack;
    public event EventHandler<Type>? Navigated;
}
```

### 4. Validation Patterns

```csharp
public class ValidationRules
{
    public static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    public static bool IsValidPassword(string password)
    {
        return password.Length >= 8 &&
               password.Any(char.IsUpper) &&
               password.Any(char.IsDigit);
    }

    public static string GetPasswordStrength(string password)
    {
        if (password.Length < 8) return "Weak";
        if (password.Length < 12) return "Medium";
        return "Strong";
    }
}
```

### 5. API Communication Patterns

```csharp
public interface IApiService
{
    Task<ApiResponse<T>> GetAsync<T>(string endpoint);
    Task<ApiResponse<T>> PostAsync<T>(string endpoint, object? data = null);
    Task<ApiResponse<T>> PutAsync<T>(string endpoint, object data);
    Task<ApiResponse<T>> DeleteAsync<T>(string endpoint);
}

public class ApiService : IApiService
{
    private readonly HttpClient _httpClient;
    private readonly IAuthService _authService;

    public ApiService(IAuthService authService)
    {
        _authService = authService;
        _httpClient = new HttpClient { BaseAddress = new Uri("https://api.example.com/") };
    }

    public async Task<ApiResponse<T>> GetAsync<T>(string endpoint)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
            ApplyAuthHeader(request);

            var response = await _httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            return response.IsSuccessStatusCode
                ? JsonSerializer.Deserialize<ApiResponse<T>>(content)
                : new ApiResponse<T> { IsSuccessful = false, Message = content };
        }
        catch (Exception ex)
        {
            return new ApiResponse<T> { IsSuccessful = false, Message = ex.Message };
        }
    }

    private void ApplyAuthHeader(HttpRequestMessage request)
    {
        if (_authService.IsAuthenticated && !string.IsNullOrEmpty(_authService.CurrentToken))
        {
            request.Headers.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _authService.CurrentToken);
        }
    }
}
```

### 6. Async Command Implementation

```csharp
public class AsyncRelayCommand : ICommand
{
    private readonly Func<object?, Task> _execute;
    private readonly Func<object?, bool>? _canExecute;
    private bool _isExecuting = false;

    public AsyncRelayCommand(Func<object?, Task> execute, Func<object?, bool>? canExecute = null)
    {
        _execute = execute;
        _canExecute = canExecute;
    }

    public event EventHandler? CanExecuteChanged;

    public bool CanExecute(object? parameter) => !_isExecuting && (_canExecute?.Invoke(parameter) ?? true);

    public async void Execute(object? parameter)
    {
        if (!CanExecute(parameter))
            return;

        _isExecuting = true;
        CanExecuteChanged?.Invoke(this, EventArgs.Empty);

        try
        {
            await _execute(parameter);
        }
        finally
        {
            _isExecuting = false;
            CanExecuteChanged?.Invoke(this, EventArgs.Empty);
        }
    }
}
```

### 7. Data Binding Best Practices

**Converter Example**
```csharp
public class BoolToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        bool visibility = (bool)value;
        return visibility ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language)
    {
        return (Visibility)value == Visibility.Visible;
    }
}
```

**XAML Usage**
```xaml
<TextBlock Visibility="{Binding IsLoading, Converter={StaticResource BoolToVisibilityConverter}}"/>
```

---

## Navigation and Interaction Patterns

### 1. Main Application Shell

**App.xaml.cs**
```csharp
public partial class App : Application
{
    public new static App Current => (App)Application.Current;

    public MainWindow Window { get; set; }

    public App()
    {
        InitializeComponent();
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        Window = new MainWindow();
        Window.Activate();
    }
}
```

### 2. Login Flow

**LoginWindow Navigation**
```csharp
public partial class LoginWindow : Window
{
    public LoginWindow()
    {
        this.InitializeComponent();
    }

    private void SignInButton_Click(object sender, RoutedEventArgs e)
    {
        // Trigger ViewModel command
        if (this.DataContext is LoginViewModel vm)
        {
            vm.SignInCommand.Execute(null);
        }
    }
}
```

**Post-Login Navigation**
```csharp
public class LoginViewModel : ViewModelBase
{
    private readonly IAuthService _authService;
    private readonly INavigationService _navigationService;

    public IAsyncRelayCommand SignInCommand { get; }

    public LoginViewModel(IAuthService authService, INavigationService navigationService)
    {
        _authService = authService;
        _navigationService = navigationService;

        SignInCommand = new AsyncRelayCommand(OnSignIn);
    }

    private async Task OnSignIn()
    {
        IsLoading = true;
        try
        {
            var result = await _authService.LoginAsync(Email, Password);
            if (result.IsSuccessful)
            {
                // Navigate to main dashboard
                _navigationService.Navigate<DashboardViewModel>();
            }
        }
        finally
        {
            IsLoading = false;
        }
    }
}
```

### 3. Navigation View Setup

**MainWindow.xaml**
```xaml
<Window x:Class="PotomacAnalyst.WinUI.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    
    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <!-- Top Navigation -->
        <CommandBar Grid.Row="0" Background="{ThemeResource ApplicationPageBackgroundThemeBrush}">
            <AppBarButton Icon="Home" Label="Home"/>
            <AppBarButton Icon="Setting" Label="Settings"/>
            <CommandBar.SecondaryCommands>
                <AppBarButton Label="About"/>
                <AppBarButton Label="Logout" Click="Logout_Click"/>
            </CommandBar.SecondaryCommands>
        </CommandBar>

        <!-- Main Content Area with Sidebar Navigation -->
        <Grid Grid.Row="1">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="250"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>

            <!-- Sidebar Navigation -->
            <NavigationView x:Name="MainNavigationView"
                           Grid.Column="0"
                           PaneDisplayMode="Left"
                           IsBackButtonVisible="Visible"
                           ItemInvoked="NavigationView_ItemInvoked">
                <NavigationView.MenuItems>
                    <NavigationViewItem Content="Dashboard" Tag="Dashboard" Icon="Home"/>
                    <NavigationViewItem Content="Content" Tag="Content" Icon="Document"/>
                    <NavigationViewItem Content="Chat" Tag="Chat" Icon="Message"/>
                    <NavigationViewItem Content="AFL Generator" Tag="AFL" Icon="Code"/>
                    <NavigationViewItem Content="Backtest" Tag="Backtest" Icon="TrendingUp"/>
                    <NavigationViewItem Content="Researcher" Tag="Researcher" Icon="Find"/>
                    <NavigationViewItem Content="Knowledge" Tag="Knowledge" Icon="Library"/>
                    <NavigationViewItem Content="Reverse Engineer" Tag="ReverseEngineer" Icon="Plug"/>
                    <NavigationViewItem Content="Settings" Tag="Settings" Icon="Setting"/>
                </NavigationView.MenuItems>
            </NavigationView>

            <!-- Main Frame for Page Content -->
            <Frame x:Name="ContentFrame" Grid.Column="1"/>
        </Grid>
    </Grid>
</Window>
```

### 4. Modal Dialogs

```csharp
public class DialogService : IDialogService
{
    public async Task<ContentDialogResult> ShowAsync(
        string title, 
        string content, 
        string primaryButtonText = "OK",
        string secondaryButtonText = null)
    {
        var dialog = new ContentDialog
        {
            Title = title,
            Content = new TextBlock { Text = content, TextWrapping = TextWrapping.Wrap },
            PrimaryButtonText = primaryButtonText,
            SecondaryButtonText = secondaryButtonText,
            XamlRoot = Window.Current.Content.XamlRoot
        };

        return await dialog.ShowAsync();
    }
}
```

### 5. Page Navigation with Parameters

```csharp
private void NavigationView_ItemInvoked(NavigationView sender, NavigationViewItemInvokedEventArgs args)
{
    if (args.InvokedItemContainer?.Tag is string tag)
    {
        switch (tag)
        {
            case "Dashboard":
                ContentFrame.Navigate(typeof(DashboardPage));
                break;
            case "Content":
                ContentFrame.Navigate(typeof(ContentPage));
                break;
            case "Chat":
                ContentFrame.Navigate(typeof(ChatPage));
                break;
            case "AFL":
                ContentFrame.Navigate(typeof(AFLGeneratorPage));
                break;
            // ... other cases
        }
    }
}
```

---

## Performance Considerations

### 1. Virtualization

For lists with large datasets, use virtualization:

```xaml
<ListView x:Name="ContentList" ItemsSource="{Binding Items}">
    <ListView.ItemTemplate>
        <DataTemplate>
            <TextBlock Text="{Binding Title}"/>
        </DataTemplate>
    </ListView.ItemTemplate>
</ListView>
```

### 2. Lazy Loading

```csharp
private ObservableCollection<Item> _items = new();
private int _pageSize = 20;
private int _currentPage = 0;

public async Task LoadMoreItemsAsync()
{
    IsLoading = true;
    var newItems = await _contentService.GetItemsAsync(_currentPage++, _pageSize);
    foreach (var item in newItems)
    {
        _items.Add(item);
    }
    IsLoading = false;
}
```

### 3. Image Caching

```csharp
public class ImageCacheService
{
    private readonly Dictionary<string, BitmapImage> _cache = new();

    public async Task<BitmapImage> GetImageAsync(string url)
    {
        if (_cache.TryGetValue(url, out var cached))
            return cached;

        var image = new BitmapImage(new Uri(url));
        _cache[url] = image;
        return image;
    }
}
```

### 4. Async Data Loading

```csharp
public async Task OnNavigatedToAsync()
{
    IsLoading = true;
    try
    {
        Items = await _service.GetItemsAsync();
    }
    finally
    {
        IsLoading = false;
    }
}
```

### 5. Code Splitting and Lazy Loading of Features

```csharp
// Implement feature modules that load on demand
public class FeatureModule
{
    public static void Register(IServiceCollection services)
    {
        services.AddScoped<IContentService, ContentService>();
        services.AddScoped<ContentViewModel>();
    }
}
```

---

## Migration Timeline

### Phase 1: Project Setup (1-2 weeks)
- [ ] Create WinUI 3 project structure
- [ ] Set up MVVM framework (CommunityToolkit.Mvvm)
- [ ] Configure themes and resources
- [ ] Implement font system
- [ ] Set up dependency injection

### Phase 2: Core Infrastructure (2-3 weeks)
- [ ] Implement authentication services
- [ ] Create API service layer
- [ ] Build navigation service
- [ ] Create dialog/notification services
- [ ] Implement storage service
- [ ] Set up error handling

### Phase 3: Authentication UI (1-2 weeks)
- [ ] Convert Login page
- [ ] Convert Register page
- [ ] Convert Forgot Password page
- [ ] Implement authentication flow

### Phase 4: Main Shell and Navigation (1-2 weeks)
- [ ] Create main application shell
- [ ] Implement NavigationView
- [ ] Create page templates
- [ ] Set up page routing

### Phase 5: Dashboard Page (2-3 weeks)
- [ ] Convert dashboard layout
- [ ] Implement cards and metrics
- [ ] Create charts component
- [ ] Add real-time updates
- [ ] Performance optimization

### Phase 6: Content Management (3-4 weeks)
- [ ] Implement content page tabs
- [ ] Create rich text editor
- [ ] Build file upload system
- [ ] Implement content preview
- [ ] Add search functionality

### Phase 7: Chat Interface (2-3 weeks)
- [ ] Create chat UI
- [ ] Implement message rendering
- [ ] Add markdown support
- [ ] Create code highlighting
- [ ] Implement streaming responses

### Phase 8: Advanced Features (3-4 weeks)
- [ ] AFL Generator page
- [ ] Backtest analyzer
- [ ] Researcher terminal
- [ ] Knowledge Base
- [ ] Reverse Engineer

### Phase 9: Settings and Polish (1-2 weeks)
- [ ] Settings page
- [ ] Theme switching
- [ ] Font size adjustment
- [ ] Notification preferences
- [ ] API keys management

### Phase 10: Testing and Optimization (2-3 weeks)
- [ ] Unit testing
- [ ] Integration testing
- [ ] Performance testing
- [ ] Accessibility testing
- [ ] UI/UX polish

### Phase 11: Deployment Preparation (1 week)
- [ ] Code signing setup
- [ ] MSIX packaging
- [ ] Microsoft Store preparation
- [ ] Documentation
- [ ] Release notes

---

## Summary and Key Takeaways

### Maintaining Aesthetic While Using WinUI 3

1. **Custom Resource Dictionaries** - Override default brushes and styles with Potomac brand colors
2. **Fluent Design Integration** - Use acrylic backgrounds and light effects while maintaining dark theme
3. **Custom Typography** - Bundle Google Fonts (Rajdhani, Quicksand) for consistent branding
4. **Color System** - Implement CSS variable equivalent using ResourceDictionary and SolidColorBrush

### Project Organization Best Practices

- **Separation of Concerns** - Views, ViewModels, Models, Services
- **Dependency Injection** - Use Microsoft.Extensions.DependencyInjection
- **MVVM Pattern** - Use CommunityToolkit.Mvvm for reduced boilerplate
- **Asset Management** - Centralized resources folder for fonts, icons, images

### Performance Optimization

- Virtualization for large lists
- Lazy loading for content
- Async/await patterns for long-running operations
- Image caching for better responsiveness

### Testing and Quality

- Unit tests for ViewModels and Services
- Integration tests for API communication
- UI automation tests for critical workflows
- Performance profiling for optimization

---

## Additional Resources

- **WinUI 3 Documentation:** https://docs.microsoft.com/en-us/windows/apps/winui/
- **MVVM Toolkit:** https://github.com/CommunityToolkit/MVVM-Samples
- **WinUI Community:** https://github.com/CommunityToolkit/WindowsCommunityToolkit
- **Fluent Design System:** https://www.microsoft.com/design/fluent
- **Windows App SDK:** https://github.com/microsoft/WindowsAppSDK

---

## Appendix: Code Examples

### A. Complete LoginViewModel Example

```csharp
namespace PotomacAnalyst.WinUI.ViewModels
{
    public partial class LoginViewModel : ViewModelBase
    {
        private readonly IAuthService _authService;
        private readonly INavigationService _navigationService;
        private readonly IDialogService _dialogService;

        [ObservableProperty]
        private string email = "";

        [ObservableProperty]
        private string password = "";

        [ObservableProperty]
        private bool isLoading = false;

        [ObservableProperty]
        private string errorMessage = "";

        public IAsyncRelayCommand SignInCommand { get; }
        public RelayCommand ForgotPasswordCommand { get; }
        public RelayCommand CreateAccountCommand { get; }

        public LoginViewModel(
            IAuthService authService,
            INavigationService navigationService,
            IDialogService dialogService)
        {
            _authService = authService;
            _navigationService = navigationService;
            _dialogService = dialogService;

            SignInCommand = new AsyncRelayCommand(SignInAsync, CanSignIn);
            ForgotPasswordCommand = new RelayCommand(ForgotPassword);
            CreateAccountCommand = new RelayCommand(CreateAccount);
        }

        private async Task SignInAsync()
        {
            ErrorMessage = "";

            if (!ValidateInput())
                return;

            IsLoading = true;
            try
            {
                var result = await _authService.LoginAsync(Email, Password);
                
                if (result.IsSuccessful)
                {
                    _navigationService.Navigate<DashboardViewModel>();
                }
                else
                {
                    ErrorMessage = result.Message ?? "Login failed. Please try again.";
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = "An error occurred. Please try again.";
                Debug.WriteLine($"Login error: {ex.Message}");
            }
            finally
            {
                IsLoading = false;
            }
        }

        private bool ValidateInput()
        {
            if (string.IsNullOrWhiteSpace(Email))
            {
                ErrorMessage = "Email is required";
                return false;
            }

            if (!ValidationRules.IsValidEmail(Email))
            {
                ErrorMessage = "Please enter a valid email address";
                return false;
            }

            if (string.IsNullOrWhiteSpace(Password))
            {
                ErrorMessage = "Password is required";
                return false;
            }

            return true;
        }

        private bool CanSignIn()
        {
            return !IsLoading && !string.IsNullOrEmpty(Email) && !string.IsNullOrEmpty(Password);
        }

        private void ForgotPassword()
        {
            _navigationService.Navigate<ForgotPasswordViewModel>();
        }

        private void CreateAccount()
        {
            _navigationService.Navigate<RegisterViewModel>();
        }
    }
}
```

### B. Complete LoginWindow XAML

```xaml
<Window
    x:Class="PotomacAnalyst.WinUI.Views.LoginWindow"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="Potomac Analyst - Sign In"
    Width="1200"
    Height="800"
    Background="{ThemeResource ApplicationPageBackgroundThemeBrush}">

    <Grid ColumnSpacing="0">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="0.4*"/>
            <ColumnDefinition Width="0.6*"/>
        </Grid.ColumnDefinitions>

        <!-- Left Panel - Branding -->
        <Grid Grid.Column="0" Background="#0D1117" Padding="60">
            <StackPanel VerticalAlignment="Center" Spacing="30">
                <!-- Logo -->
                <StackPanel HorizontalAlignment="Center" Spacing="20">
                    <Image Source="/Assets/Images/PotemacLogo.svg" Width="100" Height="100"/>
                    <TextBlock Text="ANALYST" 
                              Style="{StaticResource HeadingStyle}"
                              FontSize="48"
                              Foreground="White"
                              TextAlignment="Center"/>
                </StackPanel>

                <!-- Tagline -->
                <TextBlock Text="BY POTOMAC"
                          Style="{StaticResource BodyTextStyle}"
                          Foreground="#FEC00F"
                          TextAlignment="Center"
                          FontSize="14"
                          CharacterSpacing="100"/>

                <!-- Divider -->
                <Rectangle Height="2" Fill="#FEC00F" Width="100" HorizontalAlignment="Center"/>

                <!-- Description -->
                <TextBlock Text="BREAK THE STATUS QUO"
                          Style="{StaticResource BodyTextStyle}"
                          Foreground="#FEC00F"
                          TextAlignment="Center"
                          FontSize="28"
                          LineHeight="42"/>
            </StackPanel>
        </Grid>

        <!-- Right Panel - Login Form -->
        <Grid Grid.Column="1" Padding="60" VerticalAlignment="Center">
            <StackPanel Spacing="30" MaxWidth="400">
                <!-- Header -->
                <StackPanel Spacing="10">
                    <TextBlock Text="WELCOME BACK"
                              Style="{StaticResource HeadingStyle}"
                              FontSize="32"
                              Foreground="{ThemeResource ApplicationForegroundThemeBrush}"/>
                    <TextBlock Text="Sign in to continue to your dashboard"
                              Foreground="{ThemeResource ApplicationSecondaryForegroundThemeBrush}"
                              FontSize="14"/>
                </StackPanel>

                <!-- Email Input -->
                <StackPanel Spacing="8">
                    <TextBlock Text="EMAIL ADDRESS"
                              Style="{StaticResource BodyTextStyle}"
                              FontSize="12"
                              FontWeight="SemiBold"/>
                    <TextBox x:Name="EmailInput"
                            Text="{Binding Email, Mode=TwoWay, UpdateTrigger=PropertyChanged}"
                            PlaceholderText="you@example.com"
                            Height="40"/>
                </StackPanel>

                <!-- Password Input -->
                <StackPanel Spacing="8">
                    <Grid>
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="*"/>
                            <ColumnDefinition Width="Auto"/>
                        </Grid.ColumnDefinitions>
                        
                        <TextBlock Text="PASSWORD"
                                  Style="{StaticResource BodyTextStyle}"
                                  FontSize="12"
                                  FontWeight="SemiBold"/>
                        <HyperlinkButton Grid.Column="1"
                                        Content="Forgot password?"
                                        Command="{Binding ForgotPasswordCommand}"
                                        Foreground="#FEC00F"
                                        Padding="0"
                                        FontSize="12"/>
                    </Grid>
                    <PasswordBox x:Name="PasswordInput" Height="40"/>
                </StackPanel>

                <!-- Sign In Button -->
                <Button Content="SIGN IN"
                       Command="{Binding SignInCommand}"
                       Background="#FEC00F"
                       Foreground="Black"
                       Height="44"
                       FontWeight="SemiBold"
                       FontSize="14"/>

                <!-- Error Message -->
                <TextBlock Text="{Binding ErrorMessage}"
                          Foreground="#EB2F5C"
                          Visibility="{Binding ErrorMessage, Converter={StaticResource StringToVisibilityConverter}}"
                          TextWrapping="Wrap"
                          FontSize="12"/>

                <!-- Divider -->
                <Grid ColumnSpacing="10">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="Auto"/>
                        <ColumnDefinition Width="*"/>
                    </Grid.ColumnDefinitions>
                    
                    <Rectangle Height="1" Fill="{ThemeResource DividerStrokeColorDefaultBrush}"/>
                    <TextBlock Grid.Column="1"
                              Text="OR"
                              Foreground="{ThemeResource ApplicationSecondaryForegroundThemeBrush}"
                              FontSize="12"/>
                    <Rectangle Grid.Column="2" Height="1" Fill="{ThemeResource DividerStrokeColorDefaultBrush}"/>
                </Grid>

                <!-- Sign Up Link -->
                <TextBlock TextAlignment="Center" FontSize="13">
                    <Run Text="Don't have an account? "/>
                    <Hyperlink Click="CreateAccount_Click" Foreground="#FEC00F">
                        <Run Text="Create one"/>
                    </Hyperlink>
                </TextBlock>

                <!-- Loading Indicator -->
                <ProgressRing IsActive="{Binding IsLoading}"
                             Visibility="{Binding IsLoading, Converter={StaticResource BoolToVisibilityConverter}}"
                             Foreground="#FEC00F"/>
            </StackPanel>
        </Grid>

        <!-- Footer -->
        <TextBlock Grid.ColumnSpan="2"
                  VerticalAlignment="Bottom"
                  HorizontalAlignment="Center"
                  Margin="0,0,0,20"
                  Foreground="#808080"
                  FontSize="11"
                  Text="© 2026 Potomac Fund Management. All rights reserved."/>
    </Grid>
</Window>
```

---

**End of Comprehensive WinUI 3 Conversion Guide**

This guide provides a complete roadmap for converting the Potomac Analyst application from a Next.js/React web application to a native WinUI 3 desktop application while maintaining design consistency, performance, and maintainability.
