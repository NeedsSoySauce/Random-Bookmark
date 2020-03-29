const PLACEHOLDER_TEXT = 'All Bookmarks';

const createMenuIcon = () => {
    let icon = document.createElement('i');
    icon.className = 'dropdown icon';
    return icon;
};

const createMenuLabel = labelText => {
    let label = document.createElement('span');
    label.classList.add('text');
    label.innerText = labelText;
    return label;
};

const createMenu = labelText => {
    let menu = document.createElement('div');
    menu.className = 'menu right';
    return menu;
};

/**
 * Appends a menu icon, label and menu to the given parent
 * element and returns the new child menu element.
 */
const appendMenuElements = (labelText, parent) => {
    let icon = createMenuIcon();
    let label = createMenuLabel(labelText);
    let menu = createMenu();

    parent.appendChild(icon);
    parent.appendChild(label);
    parent.appendChild(menu);

    return menu;
};

const createMenuItem = value => {
    let item = document.createElement('div');
    item.classList.add('item');
    setDataValue(item, value);
    return item;
};

const setDataValue = (node, value) => {
    node.setAttribute('data-value', value);
};

const isFolderNode = node => {
    return Boolean(node.children);
};

/**
 * Returns true if the given bookmark node is the parent of a bookmark
 * folder node.
 */
const isFolderParent = node => {
    return isFolderNode(node) && node.children.some(child => isFolderNode(child));
};

const tree = (node, parent) => {
    if (isFolderParent(node)) {
        let menu = appendMenuElements(node.title || PLACEHOLDER_TEXT, parent);

        for (child of node.children) {
            if (isFolderNode(child)) {
                let menuItem = createMenuItem(child.id);
                menu.appendChild(menuItem);

                tree(child, menuItem);
            }
        }
    } else if (isFolderNode(node)) {
        let label = createMenuLabel(node.title);
        parent.appendChild(label);
        setDataValue(parent, node.id);
    }
};

/**
 * Generates a nested dropdown menu.
 */
const buildTree = (nodes, parent, initialSelection) => {
    for (node of nodes) {
        tree(node, parent);
    }

    $('.ui.dropdown').dropdown({
        allowCategorySelection: true,
        clearable: true,
        placeholder: PLACEHOLDER_TEXT,
        onChange: (value, text, choice) => {
            let folderId = value || 0;
            chrome.storage.sync.set({ folderId });
        }
    });

    $('#dropdown-root').dropdown('set selected', initialSelection);
};

const setupIncludeSubfoldersToggle = () => {
    $('#subfolders-toggle')
        .checkbox()
        .first()
        .checkbox({
            onChecked: () => {
                chrome.storage.sync.set({ includeSubfolders: true });
            },
            onUnchecked: () => {
                chrome.storage.sync.set({ includeSubfolders: false });
            }
        });

    chrome.storage.sync.get(['includeSubfolders'], items => {
        let includeSubfolders =
            items.includeSubfolders !== undefined ? items.includeSubfolders : config.includeSubfolders;
        $('#subfolders-toggle').checkbox(includeSubfolders ? 'set checked' : 'set unchecked');
    });
};

const handleOpenIn = value => {
    console.log(value)
    let openInNewTab = config.openInNewtab;
    let reuseTab = config.reuseTab;

    switch (value) {
        case 'new-tab':
            openInNewTab = true;
            reuseTab = false;
            break;
        case 'current-tab':
            openInNewTab = false;
            reuseTab = false;
            break;
        case 'init-new-tab':
            openInNewTab = true;
            reuseTab = true;
            break;
        case 'init-current-tab':
            openInNewTab = false;
            reuseTab = true;
            break;
    }

    chrome.storage.sync.set({ openInNewTab, reuseTab });
};

const setupOpenInOptions = () => {
    $('.ui.radio.checkbox').checkbox({
        onChecked: a => {
            let value = $('.ui.radio.checkbox.checked')[0].dataset['value'];
            handleOpenIn(value);
        }
    });

    chrome.storage.sync.get(['openInNewTab', 'reuseTab'], items => {
        let openInNewTab = items.openInNewTab !== undefined ? items.openInNewTab : config.openInNewTab;
        let reuseTab = items.reuseTab !== undefined ? items.reuseTab : config.reuseTab;

        let value = 'new-tab';
        if (openInNewTab) {
            value = reuseTab ? 'init-new-tab' : 'new-tab';
        } else {
            value = reuseTab ? 'init-current-tab' : 'current-tab';
        }

        $(`.ui.radio.checkbox[data-value='${value}']`).checkbox('set checked');
    });
};

const main = () => {
    let root = document.getElementById('dropdown-root');
    root.innerHTML = '';

    chrome.storage.sync.get(['folderId'], items => {
        let folderId = items.folderId || 0;
        chrome.bookmarks.getTree(nodes => {
            buildTree(nodes, root, folderId);
        });
    });

    setupIncludeSubfoldersToggle();
    setupOpenInOptions();
};

window.onload = main;
