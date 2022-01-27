import { createOrUpdateHistoryAlarm, registerAlarms } from './alarms.js';
import { localStorageProvider, syncStorageProvider } from './index.js';
import { getHistoryRetentionPeriodConfiguration, getIconPath, shuffleBookmarkSelection } from './shared.js';
import { HistoryItem } from './storage.js';
import { BookmarkSelectionMethod, BookmarkTreeNode, ChromeStorageChanges, Command, Tab } from './types.js';

const appendLeafNodes = (node: BookmarkTreeNode, leafNodes: BookmarkTreeNode[], recurse = false) => {
    if (!node.children) {
        leafNodes.push(node);
    } else if (recurse) {
        for (const child of node.children) {
            appendLeafNodes(child, leafNodes, recurse);
        }
    }
};

const getLeafNodes = (nodes: BookmarkTreeNode[], recurse = false) => {
    let leafNodes: BookmarkTreeNode[] = [];
    for (const node of nodes) {
        appendLeafNodes(node, leafNodes, recurse);
    }
    return leafNodes;
};

const randInt = (min: number, max: number) => {
    return min + Math.floor(Math.random() * max);
};

const getRandomNode = async (
    nodes: BookmarkTreeNode[],
    selectionMethod: BookmarkSelectionMethod,
    selectedNodeIds: string[]
) => {
    if (!nodes.length) return null;
    switch (selectionMethod) {
        case BookmarkSelectionMethod.RANDOM:
            return nodes[randInt(0, nodes.length)];
        case BookmarkSelectionMethod.RANDOM_CONSUME:
            let selectedIds = new Set(selectedNodeIds);

            // Create an array of ids that haven't been selected
            let nodeIds = nodes.map((node) => node.id);
            let unselectedIds = nodeIds.filter((id) => !selectedIds.has(id));

            // Clear our list of visited nodes if we've already visited all of our options
            if (unselectedIds.length === 0) {
                selectedNodeIds = [];
                unselectedIds = nodeIds;

                // If there's more than one option remove the id of the bookmark that was last opened from our list of ids
                // This is to prevent a bookmark being opened back to back
                if (unselectedIds.length > 1) {
                    let lastId = selectedNodeIds[selectedNodeIds.length - 1];
                    unselectedIds = unselectedIds.filter((id) => id !== lastId);
                }
            }

            let id = unselectedIds[randInt(0, unselectedIds.length)];

            // Add the id we've selected to our list of selected ids
            selectedNodeIds.push(id);
            await localStorageProvider.set({ selectedNodeIds });

            // Find the bookmark that has our randomly selected id
            return nodes.find((node) => node.id === id) ?? null;
        case BookmarkSelectionMethod.RANDOM_WEIGHTED:
            throw 'Not implemented';
    }
};

const handleClick = async () => {
    const { includeSubfolders, openInNewTab, reuseTab, selectionMethod, isHistoryEnabled } =
        await syncStorageProvider.get({
            includeSubfolders: true,
            openInNewTab: true,
            reuseTab: true,
            selectionMethod: true,
            isHistoryEnabled: true
        });

    const { selectedNodeIds, tabId, bookmarksFolderId } = await localStorageProvider.get({
        selectedNodeIds: true,
        tabId: true,
        bookmarksFolderId: true
    });

    const nodes = await chrome.bookmarks.getSubTree(bookmarksFolderId);

    if (!nodes[0].children) return;

    const leafNodes = getLeafNodes(nodes[0].children, includeSubfolders);
    const node = await getRandomNode(leafNodes, selectionMethod, selectedNodeIds);
    const url = node?.url;

    if (!url) return;

    let tab: Tab | null = null;

    if (tabId && reuseTab) {
        try {
            tab = await updateTab(url, tabId);
        } catch (err) {
            // Could have failed as the tab with tabId was closed so fallback to opening in a new tab or updating the
            // current tab based on the the user's settings
            if (openInNewTab) {
                tab = await createTab(url);
            } else {
                tab = await updateTab(url, null);
            }
        }
    } else if (openInNewTab) {
        tab = await createTab(url);
    } else {
        tab = await updateTab(url);
    }

    if (tab?.id !== tabId) {
        await localStorageProvider.set({ tabId: tab?.id ?? null });
    }

    if (isHistoryEnabled && node) {
        await updateHistory(node);
    }
};

const updateHistory = async (node: BookmarkTreeNode) => {
    const { history } = await localStorageProvider.get({ history: true });

    if (!node.url) return;

    const item: HistoryItem = {
        date: new Date().toISOString(),
        title: node.title,
        url: node.url
    };

    const newHistory = [item, ...history];
    await localStorageProvider.set({ history: newHistory });
};

/**
 * Update an existing tab opened by this extension, or the current tab if the given
 * tabId is null or undefined. Returns the updated tab.
 */
const updateTab = async (url: string, tabId?: number | null) => {
    return tabId ? chrome.tabs.update(tabId, { url }) : chrome.tabs.update({ url });
};

/**
 * Open a new tab with the given url.
 */
const createTab = (url: string) => {
    return chrome.tabs.create({ url });
};

const handleCommand = async (command: string, tab: Tab) => {
    if (command === Command.SHUFFLE) {
        await shuffleBookmarkSelection();
    } else if (command === Command.OPEN_OPTIONS) {
        chrome.runtime.openOptionsPage();
    }
};

syncStorageProvider
    .get({ iconStyle: true, historyRetentionPeriod: true })
    .then(({ iconStyle, historyRetentionPeriod }) => {
        const path = getIconPath(iconStyle);
        chrome.action.setIcon({ path });
        const { alarmPeriodInMinutes } = getHistoryRetentionPeriodConfiguration(historyRetentionPeriod);
        createOrUpdateHistoryAlarm(alarmPeriodInMinutes);
    });

registerAlarms();

chrome.commands.onCommand.addListener(handleCommand);
chrome.action.onClicked.addListener(handleClick);
