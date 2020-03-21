let folderId = '371';
let tabId = null;

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.get('id', items => {
        folderId = items.id || folderId;
    });

    chrome.storage.sync.set({ id: folderId });

    chrome.browserAction.onClicked.addListener(handleClick);
});

const handleClick = tab => {
    chrome.bookmarks.getChildren(folderId, nodes => {
        let randomNode = nodes[Math.floor(Math.random() * nodes.length)];

        if (tabId) {
            updateTab(randomNode.url);
        } else {
            createTab(randomNode.url);
        }
    });
};

// Update an existing tab opened by this extension, or create a new one if no such tab exists
const updateTab = url => {
    chrome.tabs.update(tabId, { url }, tab => {
        // No tab with the given ID (the tab may have been closed)
        if (chrome.runtime.lastError) {
            createTab(url);
        }
    });
};

// Open a new tab with the given url
const createTab = url => {
    chrome.tabs.create({ url }, tab => {
        tabId = tab.id;
    });
};
