import { localStorageProvider, syncStorageProvider } from './index.js';
import { getHistoryRetentionPeriodConfiguration } from './shared.js';

const HISTORY_ALARM = 'CLEANUP_HISTORY_ALARM';

const handleAlarm = async (alarm: chrome.alarms.Alarm) => {
    if (alarm.name !== HISTORY_ALARM) return;
    const { historyRetentionPeriod } = await syncStorageProvider.get({ historyRetentionPeriod: true });
    const { history } = await localStorageProvider.get({ history: true });
    const { milliseconds } = getHistoryRetentionPeriodConfiguration(historyRetentionPeriod);
    const now = Date.now();
    const newHistory = history.filter((item) => now - new Date(item.date).getTime() < milliseconds);
    await localStorageProvider.set({ history: newHistory });
};

export const createOrUpdateHistoryAlarm = (periodInMinutes = 60) => {
    return chrome.alarms.create(HISTORY_ALARM, { periodInMinutes });
};

export const registerAlarms = () => {
    chrome.alarms.onAlarm.addListener(handleAlarm);
    createOrUpdateHistoryAlarm();
};
