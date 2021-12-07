import { config } from './config.js';
import { BookmarkTreeNode, Tab } from './types.js';

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

const getRandomNode = (nodes: BookmarkTreeNode[], selectionMethod: string, selectedNodeIds: string[]) => {
    switch (selectionMethod) {
        case 'random':
            return nodes[randInt(0, nodes.length)];
        case 'random-consume':
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
            chrome.storage.sync.set({ selectedNodeIds });

            // Find the bookmark that has our randomly selected id
            // We could use chrome.bookmark.get() to do this, but this method is easier
            return nodes.find((node) => node.id === id) ?? null;
        case 'random-weighted':
            throw 'Not implemented';
    }
    throw Error(`Invalid selection method ${selectionMethod}`);
};

const handleClick = () => {
    chrome.storage.sync.get(
        ['folderId', 'includeSubfolders', 'openInNewTab', 'reuseTab', 'selectionMethod', 'selectedNodeIds'],
        (syncedItems) => {
            const folderId = syncedItems.folderId || '0';
            const includeSubfolders =
                syncedItems.includeSubfolders !== undefined ? syncedItems.includeSubfolders : config.includeSubfolders;
            const openInNewTab =
                syncedItems.openInNewTab !== undefined ? syncedItems.openInNewTab : config.openInNewTab;
            const reuseTab = syncedItems.reuseTab !== undefined ? syncedItems.reuseTab : config.reuseTab;
            const selectionMethod =
                syncedItems.selectionMethod !== undefined ? syncedItems.selectionMethod : config.selectionMethod;
            const selectedNodeIds = syncedItems.selectedNodeIds || [];

            chrome.storage.local.get(['tabId'], (localItems) => {
                let tabId = localItems.tabId || null;

                if (!folderId) {
                    throw 'No bookmarks folder set!';
                }

                chrome.bookmarks.getSubTree(folderId, (nodes) => {
                    if (!nodes[0].children) return;

                    const leafNodes = getLeafNodes(nodes[0].children, includeSubfolders);

                    if (leafNodes.length === 0) return;

                    const randomNode = getRandomNode(leafNodes, selectionMethod, selectedNodeIds);

                    const url = randomNode?.url;

                    if (url) {
                        if (tabId && reuseTab) {
                            chrome.storage.local.get('tabId', (items) => {
                                tabId = items.tabId || null;
                                updateTab(url, tabId, (url) => {
                                    if (openInNewTab) {
                                        createTab(url);
                                    } else {
                                        updateTab(url, null);
                                    }
                                });
                            });
                        } else if (openInNewTab) {
                            createTab(url);
                        } else {
                            updateTab(url);
                        }
                    }
                });
            });
        }
    );
};

/**
 * Update an existing tab opened by this extension, or the current tab if the given
 * tabId is null or undefined.
 *
 * If an error is encountered (e.g. the tab isn't found) onError(url, tabId) will be called.
 */
const updateTab = (url: string, tabId?: number | null, onError?: (url: string, tabId?: number | null) => void) => {
    const callback = (tab?: Tab) => {
        if (chrome.runtime.lastError && onError) {
            onError(url, tabId);
        } else {
            chrome.storage.local.set({ tabId: tab?.id });
        }
    };

    if (tabId) {
        chrome.tabs.update(tabId, { url }, callback);
    } else {
        chrome.tabs.update({ url }, callback);
    }
};

/**
 * Open a new tab with the given url.
 */
const createTab = (url: string) => {
    chrome.tabs.create({ url }, (tab) => {
        chrome.storage.local.set({ tabId: tab.id });
    });
};

chrome.action.onClicked.addListener(handleClick);
