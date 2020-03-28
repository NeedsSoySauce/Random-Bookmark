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

const main = () => {
    let root = document.getElementById('dropdown-root');
    root.innerHTML = '';

    chrome.storage.sync.get(['folderId'], items => {
        let folderId = items.folderId || 0;
        chrome.bookmarks.getTree(nodes => {
            buildTree(nodes, root, folderId);
        });
    });
};

window.onload = main;
