/**
 * Base Application Class and Interface
 * Abstract foundation for all BrowserOS applications
 */

import React, { Component } from 'react';
import { WindowConfig, AppComponentProps } from '../../../types/desktop';
import { useWindowStore } from '../../../stores/windowStore';

/**
 * Application Interface
 * All applications must implement this interface
 */
export interface IApplication {
  // Metadata
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly icon: string;

  // Window configuration
  windowConfig: WindowConfig;

  // Lifecycle hooks
  onInit(): void | Promise<void>;
  onMount(): void | Promise<void>;
  onUnmount(): void | Promise<void>;
  onDestroy(): void | Promise<void>;

  // Render
  render(): React.ReactNode;
}

/**
 * Base Application State
 */
interface BaseApplicationState {
  [key: string]: any;
}

/**
 * Base Application Class
 * Provides common functionality for all applications
 */
export abstract class BaseApplication<S extends BaseApplicationState = BaseApplicationState>
  extends Component<AppComponentProps, S>
  implements IApplication
{
  // Abstract properties that must be implemented
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly icon: string;

  // Default window configuration
  windowConfig: WindowConfig = {
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 400, height: 300 },
    resizable: true,
    maximizable: true
  };

  constructor(props: AppComponentProps) {
    super(props);
    this.state = this.getInitialState();
  }

  /**
   * Get initial state
   * Override this to provide custom initial state
   */
  protected getInitialState(): S {
    return {} as S;
  }

  /**
   * Lifecycle: Component initialized
   */
  async componentDidMount() {
    await this.onInit();
    await this.onMount();
  }

  /**
   * Lifecycle: Component will unmount
   */
  async componentWillUnmount() {
    await this.onUnmount();
    await this.onDestroy();
  }

  /**
   * Lifecycle hooks with default implementations
   */
  async onInit() {
    console.log(`${this.name} initialized`);
  }

  async onMount() {
    console.log(`${this.name} mounted`);
  }

  async onUnmount() {
    console.log(`${this.name} unmounting`);
  }

  async onDestroy() {
    console.log(`${this.name} destroyed`);
  }

  /**
   * Window management helpers
   */
  protected updateWindowTitle(title: string) {
    const windowStore = useWindowStore.getState();
    windowStore.updateWindowTitle(this.props.windowId, title);
  }

  protected closeWindow() {
    const windowStore = useWindowStore.getState();
    windowStore.closeWindow(this.props.windowId);
  }

  protected minimizeWindow() {
    const windowStore = useWindowStore.getState();
    windowStore.minimizeWindow(this.props.windowId);
  }

  protected maximizeWindow() {
    const windowStore = useWindowStore.getState();
    windowStore.maximizeWindow(this.props.windowId);
  }

  /**
   * State management helpers
   */
  protected updateState(newState: Partial<S>) {
    this.setState(newState as any);
  }

  protected getState(): Readonly<S> {
    return this.state;
  }

  /**
   * Render method must be implemented by subclass
   */
  abstract render(): React.ReactNode;
}

/**
 * Functional Component Base
 * For applications that prefer hooks over class components
 */
export interface FunctionalAppProps extends AppComponentProps {
  appId: string;
  windowId: string;
}

export function createFunctionalApp(
  AppComponent: React.FC<FunctionalAppProps>,
  metadata: {
    id: string;
    name: string;
    version: string;
    icon: string;
  }
) {
  return function FunctionalAppWrapper(props: AppComponentProps) {
    return <AppComponent {...props} appId={metadata.id} />;
  };
}

/**
 * Hook to access window controls from functional components
 */
export function useWindowControls(windowId: string) {
  const updateTitle = (title: string) => {
    useWindowStore.getState().updateWindowTitle(windowId, title);
  };

  const close = () => {
    useWindowStore.getState().closeWindow(windowId);
  };

  const minimize = () => {
    useWindowStore.getState().minimizeWindow(windowId);
  };

  const maximize = () => {
    useWindowStore.getState().maximizeWindow(windowId);
  };

  const restore = () => {
    useWindowStore.getState().restoreWindow(windowId);
  };

  const focus = () => {
    useWindowStore.getState().focusWindow(windowId);
  };

  return {
    updateTitle,
    close,
    minimize,
    maximize,
    restore,
    focus
  };
}
