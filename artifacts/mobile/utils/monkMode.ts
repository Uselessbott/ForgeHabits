import { NativeModules, Platform } from 'react-native';

const { MonkModeModule } = NativeModules;

function isAvailable(): boolean {
  return Platform.OS === 'android' && !!MonkModeModule;
}

export interface MonkHabitData {
  id: string;
  name: string;
  completed: boolean;
}

export interface MonkModeSessionState {
  isActive: boolean;
  sessionDate: string;
  habits: MonkHabitData[];
  completedCount: number;
  totalCount: number;
  startedAt: number;
}

// Legacy API

export function startMonkMode(_remaining: number): void {}

export function updateMonkMode(_remaining: number): void {}

export function stopMonkMode(): void {
  if (isAvailable()) {
    MonkModeModule.stopMonkMode();
  }
}

// DataStore-backed API

export async function startMonkModeSession(
  habits: MonkHabitData[],
): Promise<void> {
  if (isAvailable()) {
    await MonkModeModule.startMonkModeSession(habits);
  }
}

export async function syncMonkModeSession(
  habits: MonkHabitData[],
): Promise<void> {
  if (isAvailable()) {
    await MonkModeModule.syncMonkModeSession(habits);
  }
}

export async function getMonkModeSessionState(): Promise<MonkModeSessionState | null> {
  if (isAvailable()) {
    return MonkModeModule.getMonkModeSessionState();
  }
  return null;
}

export async function stopMonkModeSession(): Promise<void> {
  if (isAvailable()) {
    await MonkModeModule.stopMonkModeSession();
  }
}
