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
    chrome.storage.sync.get(['folderId', 'includeSubfolders'], syncedItems => {
        let folderId = syncedItems.folderId || '0';
        let includeSubfolders =
            syncedItems.includeSubfolders !== undefined ? syncedItems.includeSubfolders : config.includeSubfolders;

        chrome.storage.local.get(['tabId'], localItems => {
            let tabId = localItems.tabId || null;

            if (!folderId) {
                throw 'No bookmarks folder set!';
            }

            chrome.bookmarks.getSubTree(folderId, nodes => {
                let leafNodes = getLeafNodes(nodes[0].children, includeSubfolders);
                let randomNode = leafNodes[Math.floor(Math.random() * leafNodes.length)];
                let url = randomNode.url;

                if (tabId) {
                    updateTab(url);
                } else {
                    createTab(url);
                }
            });
        });
    });
};

// Update an existing tab opened by this extension, or create a new one if no such tab exists
const updateTab = url => {
    chrome.storage.local.get('tabId', items => {
        tabId = items.tabId || null;

        chrome.tabs.update(tabId, { url }, tab => {
            // If there's no tab with the given ID (the tab may have been closed)
            if (chrome.runtime.lastError) {
                createTab(url);
            }
        });
    });
};

// Open a new tab with the given url
const createTab = url => {
    chrome.tabs.create({ url }, tab => {
        chrome.storage.local.set({ tabId: tab.id });
    });
};

chrome.browserAction.onClicked.addListener(handleClick);
