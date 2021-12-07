import { config } from './config.js';
import { getIconPath } from './shared.js';
import { BookmarkTreeNode } from './types.js';

const PLACEHOLDER_TEXT = 'All Bookmarks';

const createMenuIcon = () => {
    let icon = document.createElement('i');
    icon.className = 'dropdown icon';
    return icon;
};

const createMenuLabel = (labelText: string) => {
    let label = document.createElement('span');
    label.classList.add('text');
    label.innerText = labelText;
    return label;
};

const createMenu = () => {
    let menu = document.createElement('div');
    menu.className = 'menu right';
    return menu;
};

/**
 * Appends a menu icon, label and menu to the given parent
 * element and returns the new child menu element.
 */
const appendMenuElements = (labelText: string, parent: HTMLElement) => {
    let icon = createMenuIcon();
    let label = createMenuLabel(labelText);
    let menu = createMenu();

    parent.appendChild(icon);
    parent.appendChild(label);
    parent.appendChild(menu);

    return menu;
};

const createMenuItem = (value: string) => {
    let item = document.createElement('div');
    item.classList.add('item');
    setDataValue(item, value);
    return item;
};

const setDataValue = (node: HTMLElement, value: string) => {
    node.setAttribute('data-value', value);
};

const isFolderNode = (node: BookmarkTreeNode) => {
    return Boolean(node.children);
};

/**
 * Returns true if the given bookmark node is the parent of a bookmark
 * folder node.
 */
const isFolderParent = (node: BookmarkTreeNode) => {
    if (!node.children) return false;
    return isFolderNode(node) && node.children.some((child) => isFolderNode(child));
};

const tree = (node: BookmarkTreeNode, parent: HTMLElement) => {
    if (isFolderParent(node)) {
        let menu = appendMenuElements(node.title || PLACEHOLDER_TEXT, parent);

        if (!node.children) return;

        for (const child of node.children) {
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
const buildTree = (nodes: BookmarkTreeNode[], parent: HTMLElement, initialSelection: number) => {
    for (const node of nodes) {
        tree(node, parent);
    }

    $('.ui.dropdown').dropdown({
        allowCategorySelection: true,
        clearable: true,
        // @ts-ignore
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

    chrome.storage.sync.get(['includeSubfolders'], (items) => {
        let includeSubfolders =
            items.includeSubfolders !== undefined ? items.includeSubfolders : config.includeSubfolders;
        // @ts-ignore
        $('#subfolders-toggle').checkbox(includeSubfolders ? 'set checked' : 'set unchecked');
    });
};

const handleOpenIn = (value: string) => {
    let openInNewTab = config.openInNewTab;
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
    let elem = $('#open-in-options');
    elem.find('.ui.radio.checkbox').checkbox({
        onChecked: () => {
            let value = elem.find('.ui.radio.checkbox.checked')[0].dataset['value'];
            if (!value) return;
            handleOpenIn(value);
        }
    });

    chrome.storage.sync.get(['openInNewTab', 'reuseTab'], (items) => {
        let openInNewTab = items.openInNewTab !== undefined ? items.openInNewTab : config.openInNewTab;
        let reuseTab = items.reuseTab !== undefined ? items.reuseTab : config.reuseTab;

        let value = 'new-tab';
        if (openInNewTab) {
            value = reuseTab ? 'init-new-tab' : 'new-tab';
        } else {
            value = reuseTab ? 'init-current-tab' : 'current-tab';
        }

        elem.find(`.ui.radio.checkbox[data-value='${value}']`).checkbox('set checked');
    });
};

const setupSelectionMethodOptions = () => {
    let elem = $('#bookmark-selection-options');
    elem.find('.ui.radio.checkbox').checkbox({
        onChecked: () => {
            let value = elem.find('.ui.radio.checkbox.checked')[0].dataset['value'];
            chrome.storage.sync.set({ selectionMethod: value });
        }
    });

    chrome.storage.sync.get(['selectionMethod'], (items) => {
        let selectionMethod = items.selectionMethod !== undefined ? items.selectionMethod : config.selectionMethod;
        elem.find(`.ui.radio.checkbox[data-value='${selectionMethod}']`).checkbox('set checked');
    });
};

const getDropdownRoot = () => {
    let root = document.getElementById('dropdown-root');
    if (!root) throw Error('Failed to find root');
    return root;
};

const setupIconOptions = () => {
    const nodes = document.querySelectorAll<HTMLImageElement>('#icon-options .option');

    const selectIcon = (node: HTMLImageElement) => {
        const iconStyle = node.getAttribute('data-value');
        if (!iconStyle) throw Error('Failed to find icon style');
        const path = getIconPath(iconStyle);
        chrome.action.setIcon({ path });
        chrome.storage.sync.set({ iconStyle });
        nodes.forEach((n) => n.classList.remove('selected'));
        node.classList.add('selected');
    };

    // Select currently selected icon style
    chrome.storage.sync.get('iconStyle', ({ iconStyle }) => {
        const style = iconStyle ?? config.iconStyle;
        const node = Array.from(nodes).find((n) => n.getAttribute('data-value') === style);
        if (!node) throw Error('Failed to find node');
        selectIcon(node);
    });

    for (const node of nodes) {
        node.addEventListener('click', () => selectIcon(node));
    }
};

const main = () => {
    let root = getDropdownRoot();
    root.innerHTML = '';

    chrome.storage.sync.get(['folderId'], (items) => {
        let folderId = items.folderId || 0;
        chrome.bookmarks.getTree((nodes) => {
            buildTree(nodes, root, folderId);
        });
    });

    setupIncludeSubfoldersToggle();
    setupOpenInOptions();
    setupSelectionMethodOptions();
    setupIconOptions();
};

document.addEventListener('DOMContentLoaded', main);
