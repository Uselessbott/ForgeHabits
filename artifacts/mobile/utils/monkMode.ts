import { NativeModules, Platform } from 'react-native';

/**
 * Thin TypeScript bridge to MonkModeModule (Kotlin).
 *
 * On Android, NativeModules.MonkModeModule is the instance registered
 * by MonkModePackage. On iOS/web it is undefined, so every function
 * is a safe no-op.
 *
 * startMonkMode  — starts the foreground service with initial remaining count
 * updateMonkMode — updates the notification text in-place (no restart)
 * stopMonkMode   — stops the service and removes the notification
 */

const { MonkModeModule } = NativeModules;

function isAvailable(): boolean {
  return Platform.OS === 'android' && !!MonkModeModule;
}

export function startMonkMode(remaining: number): void {
  if (isAvailable()) {
    MonkModeModule.startMonkMode(remaining);
  }
}

export function updateMonkMode(remaining: number): void {
  if (isAvailable()) {
    MonkModeModule.updateMonkMode(remaining);
  }
}

export function stopMonkMode(): void {
  if (isAvailable()) {
    MonkModeModule.stopMonkMode();
  }
}