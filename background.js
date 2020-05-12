const appendLeafNodes = (node, leafNodes, recurse) => {
    if (!node.children) {
        leafNodes.push(node);
    } else if (recurse) {
        for (child of node.children) {
            appendLeafNodes(child, leafNodes, recurse);
        }
    }
};

const getLeafNodes = (nodes, recurse = false) => {
    let leafNodes = [];
    for (node of nodes) {
        appendLeafNodes(node, leafNodes, recurse);
    }
    return leafNodes;
};

const randInt = (min, max) => {
    return min + Math.floor(Math.random() * max);
};

const getRandomNode = (nodes, selectionMethod, selectedNodeIds) => {
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
            }

            let id = unselectedIds[randInt(0, unselectedIds.length)];

            // Add the id we've selected to our list of selected ids
            selectedNodeIds.push(id);
            chrome.storage.sync.set({ selectedNodeIds });

            // Find the bookmark that has our randomly selected id
            // We could use chrome.bookmark.get() to do this, but this method is easier
            return nodes.find((node) => node.id === id);
        case 'random-weighted':
            throw 'Not implemented';
            break;
    }
};

const handleClick = (tab) => {
    chrome.storage.sync.get(
        ['folderId', 'includeSubfolders', 'openInNewTab', 'reuseTab', 'selectionMethod', 'selectedNodeIds'],
        (syncedItems) => {
            let folderId = syncedItems.folderId || '0';
            let includeSubfolders =
                syncedItems.includeSubfolders !== undefined ? syncedItems.includeSubfolders : config.includeSubfolders;
            let openInNewTab = syncedItems.openInNewTab !== undefined ? syncedItems.openInNewTab : config.openInNewTab;
            let reuseTab = syncedItems.reuseTab !== undefined ? syncedItems.reuseTab : config.reuseTab;
            let selectionMethod =
                syncedItems.selectionMethod !== undefined ? syncedItems.selectionMethod : config.selectionMethod;
            let selectedNodeIds = syncedItems.selectedNodeIds || [];

            chrome.storage.local.get(['tabId'], (localItems) => {
                let tabId = localItems.tabId || null;

                if (!folderId) {
                    throw 'No bookmarks folder set!';
                }

                chrome.bookmarks.getSubTree(folderId, (nodes) => {
                    let leafNodes = getLeafNodes(nodes[0].children, includeSubfolders);

                    if (leafNodes.length === 0) return;

                    let randomNode = getRandomNode(leafNodes, selectionMethod, selectedNodeIds);
                    let url = randomNode.url;

                    if (tabId && reuseTab) {
                        chrome.storage.local.get('tabId', (items) => {
                            tabId = items.tabId || null;
                            updateTab(url, tabId, (url) => {
                                if (openInNewTab) {
                                    createTab(url);
                                } else {
                                    updateTab(url);
                                }
                            });
                        });
                    } else if (openInNewTab) {
                        createTab(url);
                    } else {
                        updateTab(url);
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
const updateTab = (url, tabId, onError) => {
    chrome.tabs.update(tabId, { url }, (tab) => {
        // If there's no tab with the given ID (the tab may have been closed)
        if (chrome.runtime.lastError && onError) {
            onError(url, tabId);
        } else {
            chrome.storage.local.set({ tabId: tab.id });
        }
    });
};

/**
 * Open a new tab with the given url.
 */
const createTab = (url) => {
    chrome.tabs.create({ url }, (tab) => {
        chrome.storage.local.set({ tabId: tab.id });
    });
};

chrome.browserAction.onClicked.addListener(handleClick);
