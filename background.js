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

const handleClick = tab => {
    chrome.storage.sync.get(['folderId', 'includeSubfolders', 'openInNewTab', 'reuseTab'], syncedItems => {
        let folderId = syncedItems.folderId || '0';
        let includeSubfolders =
            syncedItems.includeSubfolders !== undefined ? syncedItems.includeSubfolders : config.includeSubfolders;
        let openInNewTab = syncedItems.openInNewTab !== undefined ? syncedItems.openInNewTab : config.openInNewTab;
        let reuseTab = syncedItems.reuseTab !== undefined ? syncedItems.reuseTab : config.reuseTab;

        chrome.storage.local.get(['tabId'], localItems => {
            let tabId = localItems.tabId || null;

            if (!folderId) {
                throw 'No bookmarks folder set!';
            }

            chrome.bookmarks.getSubTree(folderId, nodes => {
                let leafNodes = getLeafNodes(nodes[0].children, includeSubfolders);
                let randomNode = leafNodes[Math.floor(Math.random() * leafNodes.length)];
                let url = randomNode.url;

                if (tabId && reuseTab) {
                    chrome.storage.local.get('tabId', items => {
                        tabId = items.tabId || null;
                        updateTab(url, tabId, url => {
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
    });
};

/**
 * Update an existing tab opened by this extension, or the current tab if the given
 * tabId is null or undefined.
 *
 * If an error is encountered (e.g. the tab isn't found) onError(url, tabId) will be called.
 */
const updateTab = (url, tabId, onError) => {
    chrome.tabs.update(tabId, { url }, tab => {
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
const createTab = url => {
    chrome.tabs.create({ url }, tab => {
        chrome.storage.local.set({ tabId: tab.id });
    });
};

chrome.browserAction.onClicked.addListener(handleClick);
