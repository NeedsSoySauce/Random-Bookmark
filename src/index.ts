import {
    LocalStorageProvider,
    LocalStorageState,
    StorageProvider,
    SyncStorageProvider,
    SyncStorageState
} from './storage.js';
import { BookmarkSelectionMethod, HistoryRetentionPeriod, IconStyle } from './types.js';

const defaultSyncStorageState: SyncStorageState = {
    includeSubfolders: true,
    openInNewTab: true,
    reuseTab: true,
    selectionMethod: BookmarkSelectionMethod.RANDOM,
    iconStyle: IconStyle.GRAY,
    isHistoryEnabled: false,
    historyRetentionPeriod: HistoryRetentionPeriod.TWENTY_FOUR_HOURS,
    version: 0
};

const defaultLocalStorageState: LocalStorageState = {
    bookmarksFolderId: '0',
    tabId: null,
    selectedNodeIds: [],
    history: [],
    version: 0
};

export const syncStorageProvider: StorageProvider<SyncStorageState> = new SyncStorageProvider(defaultSyncStorageState);
export const localStorageProvider: StorageProvider<LocalStorageState> = new LocalStorageProvider(
    defaultLocalStorageState
);
