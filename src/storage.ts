import { AnyValue, BookmarkSelectionMethod, HistoryRetentionPeriod, IconStyle } from './types.js';

export interface HistoryItem {
    date: string;
    url: string;
    title: string;
}

export interface SyncStorageState {
    includeSubfolders: boolean;
    openInNewTab: boolean;
    reuseTab: boolean;
    selectionMethod: BookmarkSelectionMethod;
    iconStyle: IconStyle;
    folderId: string;
    isHistoryEnabled: boolean;
    historyRetentionPeriod: HistoryRetentionPeriod;
}

export interface LocalStorageState {
    tabId: number | null;
    selectedNodeIds: string[];
    history: HistoryItem[];
}

export const defaultSyncStorageState: SyncStorageState = {
    includeSubfolders: true,
    openInNewTab: true,
    reuseTab: true,
    selectionMethod: BookmarkSelectionMethod.RANDOM,
    iconStyle: IconStyle.GRAY,
    folderId: '0',
    isHistoryEnabled: false,
    historyRetentionPeriod: HistoryRetentionPeriod.TWENTY_FOUR_HOURS
};

export const defaultLocalStorageState: LocalStorageState = {
    tabId: null,
    selectedNodeIds: [],
    history: []
};

type Filter<T> = Partial<AnyValue<T>>;

export function getSyncStorage<T extends Filter<SyncStorageState>>(
    keys: T
): Promise<{ [K in keyof SyncStorageState as undefined extends T[K] ? never : K]: SyncStorageState[K] }>;
export function getSyncStorage(): Promise<SyncStorageState>;
export async function getSyncStorage<T extends Filter<SyncStorageState>>(keys?: T) {
    const filterKeys = Object.keys(keys ?? defaultSyncStorageState);
    const items = await chrome.storage.sync.get(filterKeys);
    const defaultItemValues = Object.fromEntries(
        Object.entries(defaultSyncStorageState).filter(([k]) => filterKeys.includes(k))
    );
    return { ...defaultItemValues, ...items };
}

export function getLocalStorage<T extends Filter<LocalStorageState>>(
    keys: T
): Promise<{ [K in keyof LocalStorageState as undefined extends T[K] ? never : K]: LocalStorageState[K] }>;
export function getLocalStorage(): Promise<LocalStorageState>;
export async function getLocalStorage<T extends Filter<LocalStorageState>>(keys?: T) {
    const filterKeys = Object.keys(keys ?? defaultLocalStorageState);
    const items = await chrome.storage.local.get(filterKeys);
    const defaultItemValues = Object.fromEntries(
        Object.entries(defaultLocalStorageState).filter(([k]) => filterKeys.includes(k))
    );
    return { ...defaultItemValues, ...items };
}

export const updateSyncStorage = <T extends Partial<SyncStorageState>>(state: T): Promise<void> => {
    return chrome.storage.sync.set(state);
};

export const updateLocalStorage = <T extends Partial<LocalStorageState>>(state: T): Promise<void> => {
    return chrome.storage.local.set(state);
};

export const observeHistory = (listener: (oldValue: HistoryItem[], newValue: HistoryItem[]) => void) => {
    chrome.storage.onChanged.addListener(
        (changes: { [key: string]: chrome.storage.StorageChange }, areaName: 'sync' | 'local' | 'managed') => {
            if (areaName !== 'local') return;
            if (!('history' in changes)) return;
            const { oldValue, newValue } = changes.history;
            listener(oldValue ?? [], newValue ?? []);
        }
    );
};
