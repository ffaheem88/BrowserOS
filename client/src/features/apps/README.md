# BrowserOS Applications Framework

This directory contains the application framework and sample applications for BrowserOS.

## Overview

BrowserOS applications are React components that run within managed windows. The framework provides a base class and hooks for building applications that integrate seamlessly with the desktop environment.

## Architecture

### Base Application Class

All applications can extend `BaseApplication` for class-based components or use the functional component pattern with hooks.

#### Class-Based Applications

```typescript
import { BaseApplication, AppComponentProps } from '../base/BaseApplication';

export class MyApp extends BaseApplication {
  readonly id = 'my-app';
  readonly name = 'My Application';
  readonly version = '1.0.0';
  readonly icon = '📱';

  windowConfig = {
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 400, height: 300 },
    resizable: true,
    maximizable: true
  };

  async onInit() {
    // Initialize app state, load data
    console.log('App initializing...');
  }

  async onMount() {
    // Component mounted, set up event listeners
    console.log('App mounted');
  }

  async onUnmount() {
    // Clean up before unmount
    console.log('App unmounting');
  }

  async onDestroy() {
    // Final cleanup
    console.log('App destroyed');
  }

  render() {
    return (
      <div className="p-4">
        <h1>{this.name}</h1>
        <button onClick={() => this.closeWindow()}>Close</button>
      </div>
    );
  }
}
```

#### Functional Applications

```typescript
import { AppComponentProps, useWindowControls } from '../base/BaseApplication';

export function MyApp({ windowId, appId }: AppComponentProps) {
  const { updateTitle, close, minimize } = useWindowControls(windowId);

  useEffect(() => {
    updateTitle('My Custom Title');
  }, []);

  return (
    <div className="p-4">
      <h1>My Application</h1>
      <button onClick={close}>Close</button>
      <button onClick={minimize}>Minimize</button>
    </div>
  );
}
```

### App Manifest

Every application must have a manifest that describes its metadata and configuration:

```typescript
export const MyAppManifest: AppManifest = {
  id: 'my-app',
  name: 'My Application',
  version: '1.0.0',
  description: 'A sample application',
  author: 'BrowserOS Team',
  icon: '📱',
  category: 'Productivity',
  permissions: ['storage', 'network'],
  windowConfig: {
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 400, height: 300 },
    maxSize: { width: 1920, height: 1080 },
    resizable: true,
    maximizable: true
  },
  component: MyApp
};
```

### Application Registration

Applications must be registered with the app registry to be available for launch:

```typescript
import { useAppRegistryStore } from '../../stores/appRegistryStore';
import { MyAppManifest } from './MyApp';

// Register on app initialization
useAppRegistryStore.getState().registerApp(MyAppManifest);
```

## Sample Applications

### 1. Calculator App

A fully functional calculator with basic arithmetic operations.

**Features:**
- Addition, subtraction, multiplication, division
- Decimal support
- Clear function
- Operation history display
- Fixed size window (non-resizable)

**File:** `CalculatorApp/CalculatorApp.tsx`

**Window Config:**
- Size: 320x480 (fixed)
- Non-resizable, non-maximizable
- Category: Utilities

### 2. Notes App

A simple notepad for quick text notes with auto-save.

**Features:**
- Text editing with auto-save (1s debounce)
- Word and character count
- Export to .txt file
- Clear all content
- Persistent storage via localStorage

**File:** `NotesApp/NotesApp.tsx`

**Window Config:**
- Default: 600x500
- Min: 400x300
- Resizable and maximizable
- Category: Productivity

### 3. Clock App

Digital and analog clock with world time zones.

**Features:**
- Real-time clock updates
- Toggle between analog and digital display
- Date display with week number
- World time zones (New York, London, Tokyo)
- Beautiful gradient background

**File:** `ClockApp/ClockApp.tsx`

**Window Config:**
- Default: 500x600
- Min: 400x500
- Resizable and maximizable
- Category: Utilities

## Lifecycle Hooks

Applications can implement lifecycle hooks to manage initialization and cleanup:

### onInit()
Called once when the application instance is created.
- Load initial data
- Initialize state
- Set up connections

### onMount()
Called when the component is mounted to the DOM.
- Set up event listeners
- Start timers or intervals
- Focus initial elements

### onUnmount()
Called before the component is unmounted.
- Remove event listeners
- Clear timers or intervals
- Save state

### onDestroy()
Called when the application instance is destroyed.
- Final cleanup
- Close connections
- Release resources

## Window Controls

Applications can control their window using helper methods:

### Class-Based
```typescript
this.updateWindowTitle('New Title');
this.closeWindow();
this.minimizeWindow();
this.maximizeWindow();
```

### Functional
```typescript
const { updateTitle, close, minimize, maximize, restore, focus } =
  useWindowControls(windowId);

updateTitle('New Title');
close();
minimize();
```

## State Management

### Internal State (Class-Based)

```typescript
class MyApp extends BaseApplication {
  getInitialState() {
    return {
      count: 0,
      items: []
    };
  }

  handleIncrement = () => {
    this.updateState({ count: this.state.count + 1 });
  };

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.handleIncrement}>Increment</button>
      </div>
    );
  }
}
```

### Internal State (Functional)

```typescript
function MyApp({ windowId }: AppComponentProps) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### Persistent State

Use localStorage or the persistence hooks:

```typescript
import { usePersistence } from '../../hooks/usePersistence';

function MyApp({ windowId, appId }: AppComponentProps) {
  const [data, setData] = useState({});

  usePersistence(data, {
    key: `app-${appId}-data`,
    debounceMs: 1000,
    onSave: async (data) => {
      // Save to backend
      await fetch('/api/app-data', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onLoad: async () => {
      // Load from backend
      const response = await fetch('/api/app-data');
      return await response.json();
    }
  });

  return <div>...</div>;
}
```

## Communication Between Apps

### Via Window Store

Applications can communicate by accessing shared state through the window store:

```typescript
import { useWindowStore } from '../../stores/windowStore';

// App A: Send message
function AppA() {
  const updateWindowTitle = useWindowStore(state => state.updateWindowTitle);

  const sendMessage = () => {
    // Update metadata that other apps can read
    updateWindowTitle(windowId, 'Message: Hello from App A');
  };
}

// App B: Receive message
function AppB() {
  const windows = useWindowStore(state => state.windows);
  const appAWindow = Object.values(windows).find(w => w.appId === 'app-a');

  // Read the message from title
  const message = appAWindow?.title;
}
```

### Via Custom Events (Future)

```typescript
// App A: Emit event
window.dispatchEvent(new CustomEvent('app-message', {
  detail: { from: 'app-a', message: 'Hello' }
}));

// App B: Listen for event
useEffect(() => {
  const handleMessage = (e: CustomEvent) => {
    console.log('Received:', e.detail);
  };

  window.addEventListener('app-message', handleMessage);
  return () => window.removeEventListener('app-message', handleMessage);
}, []);
```

## Styling Applications

### Using Tailwind CSS

All sample apps use Tailwind CSS for styling:

```typescript
export function MyApp() {
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="px-4 py-2 bg-white dark:bg-gray-800 border-b">
        <h1 className="text-xl font-bold">My App</h1>
      </header>
      <main className="flex-1 p-4 overflow-auto">
        {/* Content */}
      </main>
      <footer className="px-4 py-2 bg-white dark:bg-gray-800 border-t text-sm">
        Status bar
      </footer>
    </div>
  );
}
```

### Full Height Applications

Apps render inside window content area. Use `h-full` to fill the entire space:

```typescript
<div className="h-full">
  {/* App content fills window */}
</div>
```

### Dark Mode Support

Applications should support both light and dark themes:

```typescript
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  {/* Theme-aware content */}
</div>
```

## Best Practices

### 1. Always Clean Up Resources

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // Update something
  }, 1000);

  return () => clearInterval(interval); // Cleanup
}, []);
```

### 2. Handle Errors Gracefully

```typescript
try {
  await fetchData();
} catch (error) {
  console.error('Failed to load data:', error);
  // Show user-friendly error message
}
```

### 3. Optimize Performance

```typescript
// Memoize expensive computations
const processedData = useMemo(() => {
  return expensiveOperation(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething();
}, []);
```

### 4. Use Proper TypeScript Types

```typescript
interface MyAppProps extends AppComponentProps {
  customProp?: string;
}

export function MyApp({ windowId, appId, customProp }: MyAppProps) {
  // Fully typed
}
```

## Testing Applications

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyApp } from './MyApp';

describe('MyApp', () => {
  it('renders correctly', () => {
    render(<MyApp windowId="test-1" appId="my-app" />);
    expect(screen.getByText('My App')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    render(<MyApp windowId="test-1" appId="my-app" />);
    const button = screen.getByText('Click Me');
    fireEvent.click(button);
    // Assert expected behavior
  });
});
```

### Integration Tests

Test applications within the full desktop environment to ensure proper integration with window management, state persistence, etc.

## Creating New Applications

### Step 1: Create App Component

```typescript
// src/features/apps/MyNewApp/MyNewApp.tsx
import { AppComponentProps } from '../base/BaseApplication';

export function MyNewApp({ windowId }: AppComponentProps) {
  return (
    <div className="h-full p-4">
      <h1>My New App</h1>
    </div>
  );
}

export const MyNewAppManifest = {
  id: 'my-new-app',
  name: 'My New App',
  version: '1.0.0',
  description: 'Description here',
  author: 'Your Name',
  icon: '🎨',
  category: 'Utilities',
  permissions: [],
  windowConfig: {
    defaultSize: { width: 800, height: 600 },
    resizable: true,
    maximizable: true
  },
  component: MyNewApp
};
```

### Step 2: Register App

```typescript
// src/features/apps/index.ts
import { MyNewAppManifest } from './MyNewApp/MyNewApp';

export function registerSystemApps() {
  const registry = useAppRegistryStore.getState();
  registry.registerApp(MyNewAppManifest);
}
```

### Step 3: Launch App

```typescript
import { useAppRegistry } from '../../hooks/useAppRegistry';

function Desktop() {
  const { launchApp } = useAppRegistry();

  const handleLaunch = async () => {
    await launchApp('my-new-app');
  };

  return <button onClick={handleLaunch}>Launch My App</button>;
}
```

## Future Enhancements

1. **App Store**: Install/uninstall apps dynamically
2. **App Permissions**: Request and manage permissions
3. **Inter-App Communication**: Message passing between apps
4. **App Settings**: Per-app configuration UI
5. **App Sandboxing**: Isolate app code and data
6. **Hot Reload**: Update apps without restart
7. **App Marketplace**: Discover and install third-party apps
