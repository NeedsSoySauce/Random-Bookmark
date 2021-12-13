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

export type AnyValue<T> = {
    [P in keyof T]: any;
};
