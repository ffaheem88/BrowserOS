/**
 * Applications Index
 * Registers all system applications
 */

import { useAppRegistryStore } from '../../stores/appRegistryStore';
import { CalculatorAppManifest } from './CalculatorApp/CalculatorApp';
import { NotesAppManifest } from './NotesApp/NotesApp';
import { ClockAppManifest } from './ClockApp/ClockApp';

/**
 * Register all system applications
 * This function should be called on app initialization
 */
export function registerSystemApps() {
  const registry = useAppRegistryStore.getState();

  // Register sample applications
  registry.registerApp(CalculatorAppManifest);
  registry.registerApp(NotesAppManifest);
  registry.registerApp(ClockAppManifest);

  console.log('System applications registered:', {
    calculator: CalculatorAppManifest.id,
    notes: NotesAppManifest.id,
    clock: ClockAppManifest.id
  });
}

// Export app manifests for reference
export { CalculatorAppManifest } from './CalculatorApp/CalculatorApp';
export { NotesAppManifest } from './NotesApp/NotesApp';
export { ClockAppManifest } from './ClockApp/ClockApp';

// Export base application framework
export { BaseApplication, useWindowControls } from './base/BaseApplication';
export type { IApplication, FunctionalAppProps } from './base/BaseApplication';
