import { NativeModules } from 'react-native';

const { MonkModeModule } = NativeModules;

export const startMonkModeSession = async (habits: any[]): Promise<any> => {
  try {
    return await MonkModeModule.startMonkModeSession(habits);
  } catch (error) {
    console.error('Error starting Monk Mode:', error);
    throw error;
  }
};

export const syncMonkModeSession = async (habits: any[]): Promise<any> => {
  try {
    return await MonkModeModule.syncMonkModeSession(habits);
  } catch (error) {
    console.error('Error syncing Monk Mode:', error);
    throw error;
  }
};

export const stopMonkModeSession = async (): Promise<any> => {
  try {
    return await MonkModeModule.stopMonkModeSession();
  } catch (error) {
    console.error('Error stopping Monk Mode:', error);
    throw error;
  }
};

export const getMonkModeSessionState = async (): Promise<any> => {
  try {
    return await MonkModeModule.getMonkModeSessionState();
  } catch (error) {
    console.error('Error getting Monk Mode state:', error);
    throw error;
  }
};
