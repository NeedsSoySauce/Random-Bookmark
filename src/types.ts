export type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
export type Tab = chrome.tabs.Tab;

export enum BookmarkSelectionMethod {
    RANDOM = 'random',
    RANDOM_CONSUME = 'random-consume',
    RANDOM_WEIGHTED = 'random-weighted'
}

export enum IconStyle {
    WHITE = 'white',
    BLACK = 'black',
    GRAY = 'gray',
    ON_WHITE = 'on-white',
    ON_BLACK = 'on-black',
    ON_GRAY = 'on-gray'
}

export enum HistoryRetentionPeriod {
    'FIVE_MINUTES',
    'TWENTY_FOUR_HOURS',
    'SEVEN_DAYS',
    'THIRTY_DAYS',
    'NINETY_DAYS'
}

export const HistoryRetentionPeriodConfiguration: Record<
    HistoryRetentionPeriod,
    { displayName: string; milliseconds: number; alarmPeriodInMinutes: number }
> = {
    [HistoryRetentionPeriod.FIVE_MINUTES]: {
        displayName: '5 Minutes',
        milliseconds: 300000,
        alarmPeriodInMinutes: 1
    },
    [HistoryRetentionPeriod.TWENTY_FOUR_HOURS]: {
        displayName: '24 Hours',
        milliseconds: 86400 * 1000,
        alarmPeriodInMinutes: 60
    },
    [HistoryRetentionPeriod.SEVEN_DAYS]: {
        displayName: '7 Days',
        milliseconds: 86400 * 1000 * 7,
        alarmPeriodInMinutes: 60
    },
    [HistoryRetentionPeriod.THIRTY_DAYS]: {
        displayName: '30 Days',
        milliseconds: 86400 * 1000 * 30,
        alarmPeriodInMinutes: 60
    },
    [HistoryRetentionPeriod.NINETY_DAYS]: {
        displayName: '90 Days',
        milliseconds: 86400 * 1000 * 90,
        alarmPeriodInMinutes: 60
    }
};

export enum Command {
    SHUFFLE = 'shuffle',
    OPEN_OPTIONS = 'open-options'
}

export type AnyValue<T> = {
    [P in keyof T]: any;
};
