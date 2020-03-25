const handleClick = tab => {
    chrome.storage.sync.get(['folderId'], syncedItems => {
        // Temporarily hardcoded while I implement configuration options
        let folderId = syncedItems.folderId || '371';

        chrome.storage.local.get(['tabId'], localItems => {
            let tabId = localItems.tabId || null;

            if (!folderId) {
                throw 'No bookmarks folder set!';
            }

            chrome.bookmarks.getChildren(folderId, nodes => {
                let randomNode = nodes[Math.floor(Math.random() * nodes.length)];
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
