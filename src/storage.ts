import { AnyValue, BookmarkSelectionMethod, ChromeStorageChanges, HistoryRetentionPeriod, IconStyle } from './types.js';

type Filter<T> = Partial<AnyValue<T>>;

export type Changes<T> = {
    [P in keyof T]?: {
        oldValue?: T[P] | null;
        newValue?: T[P] | null;
    };
};

export type ChangeListener<T> = (changes: Changes<T>) => void;

export interface HistoryItem {
    date: string;
    url: string;
    title: string;
}

export interface StorageState {
    version: number;
}

export interface SyncStorageState extends StorageState {
    includeSubfolders: boolean;
    openInNewTab: boolean;
    reuseTab: boolean;
    selectionMethod: BookmarkSelectionMethod;
    iconStyle: IconStyle;
    isHistoryEnabled: boolean;
    historyRetentionPeriod: HistoryRetentionPeriod;
}

export interface LocalStorageState extends StorageState {
    bookmarksFolderId: string;
    tabId: number | null;
    selectedNodeIds: string[];
    history: HistoryItem[];
}

export abstract class StorageProvider<TState extends StorageState> {
    public abstract observe(listener: ChangeListener<TState>): void;

    public abstract readonly initialState: TState;
    public abstract get<T extends Filter<TState>>(
        keys: T
    ): Promise<{ [K in keyof TState as undefined extends T[K] ? never : K]: TState[K] }>;
    public abstract get(): Promise<TState>;

    public abstract set<T extends Partial<TState>>(state: T): Promise<void>;
}

export class SyncStorageProvider extends StorageProvider<SyncStorageState> {
    public readonly initialState: SyncStorageState;

    public constructor(initialState: SyncStorageState) {
        super();
        this.initialState = initialState;
    }

    public observe(listener: ChangeListener<SyncStorageState>): void {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'sync') return;
            listener(changes);
        });
    }

    public get<T extends Filter<SyncStorageState>>(
        keys: T
    ): Promise<{ [K in keyof SyncStorageState as undefined extends T[K] ? never : K]: SyncStorageState[K] }>;
    public get(): Promise<SyncStorageState>;
    public async get<T extends Filter<SyncStorageState>>(keys?: T) {
        const filterKeys = Object.keys(keys ?? this.initialState);
        const items = await chrome.storage.sync.get(filterKeys);
        const defaultItemValues = Object.fromEntries(
            Object.entries(this.initialState).filter(([k]) => filterKeys.includes(k))
        );
        return { ...defaultItemValues, ...items };
    }

    public set<T extends Partial<SyncStorageState>>(state: T): Promise<void> {
        return chrome.storage.sync.set(state);
    }
}

export class LocalStorageProvider extends StorageProvider<LocalStorageState> {
    public readonly initialState: LocalStorageState;

    public constructor(initialState: LocalStorageState) {
        super();
        this.initialState = initialState;
    }

    public observe(listener: ChangeListener<SyncStorageState>): void {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'local') return;
            listener(changes);
        });
    }

    public get<T extends Filter<LocalStorageState>>(
        keys: T
    ): Promise<{ [K in keyof LocalStorageState as undefined extends T[K] ? never : K]: LocalStorageState[K] }>;
    public get(): Promise<LocalStorageState>;
    public async get<T extends Filter<LocalStorageState>>(keys?: T) {
        const filterKeys = Object.keys(keys ?? this.initialState);
        const items = await chrome.storage.local.get(filterKeys);
        const defaultItemValues = Object.fromEntries(
            Object.entries(this.initialState).filter(([k]) => filterKeys.includes(k))
        );
        return { ...defaultItemValues, ...items };
    }

    public set<T extends Partial<LocalStorageState>>(state: T): Promise<void> {
        return chrome.storage.local.set(state);
    }
}
