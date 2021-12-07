export type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
export type Tab = chrome.tabs.Tab;

export enum BookmarkSelectionMethod {
    RANDOM = 'random',
    RANDOM_CONSUME = 'random-consume',
    RANDOM_WEIGHT = 'random-weighted'
}

export enum IconStyle {
    WHITE = 'white',
    BLACK = 'black',
    ON_WHITE = 'on-white',
    ON_BLACK = 'on-black'
}
