import { getHistoryRetentionPeriodConfiguration } from './shared.js';
import { getLocalStorage, getSyncStorage, updateLocalStorage } from './storage.js';

const HISTORY_ALARM = 'CLEANUP_HISTORY_ALARM';

const handleAlarm = async (alarm: chrome.alarms.Alarm) => {
    if (alarm.name !== HISTORY_ALARM) return;
    const { historyRetentionPeriod } = await getSyncStorage({ historyRetentionPeriod: true });
    const { history } = await getLocalStorage({ history: true });
    const { milliseconds } = getHistoryRetentionPeriodConfiguration(historyRetentionPeriod);
    const now = Date.now();
    const newHistory = history.filter((item) => now - new Date(item.date).getTime() < milliseconds);
    await updateLocalStorage({ history: newHistory });
    console.log(alarm);
};

export const createOrUpdateHistoryAlarm = (periodInMinutes = 60) => {
    return chrome.alarms.create(HISTORY_ALARM, { periodInMinutes });
};

export const registerAlarms = () => {
    chrome.alarms.onAlarm.addListener(handleAlarm);
    createOrUpdateHistoryAlarm();
};
