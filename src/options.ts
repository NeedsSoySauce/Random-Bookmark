import { getIconPath } from './shared.js';
import { defaultSyncStorageState, getSyncStorage, updateSyncStorage } from './storage.js';
import { BookmarkSelectionMethod, BookmarkTreeNode, IconStyle } from './types.js';

enum BookmarkSelectionMethodInput {
    NEW_TAB = 'new-tab',
    CURRENT_TAB = 'current-tab',
    INIT_NEW_TAB = 'init-new-tab',
    INIT_CURRENT_TAB = 'init-current-tab'
}

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
const buildTree = (nodes: BookmarkTreeNode[], parent: HTMLElement, initialSelection: string) => {
    for (const node of nodes) {
        tree(node, parent);
    }

    $('.ui.dropdown').dropdown({
        allowCategorySelection: true,
        clearable: true,
        // @ts-ignore
        placeholder: PLACEHOLDER_TEXT,
        onChange: (value, text, choice) => {
            const folderId = value || defaultSyncStorageState.folderId;
            updateSyncStorage({ folderId });
        }
    });

    $('#dropdown-root').dropdown('set selected', initialSelection);
};

const setupIncludeSubfoldersToggle = async () => {
    $('#subfolders-toggle')
        .checkbox()
        .first()
        .checkbox({
            onChecked: () => {
                updateSyncStorage({ includeSubfolders: true });
            },
            onUnchecked: () => {
                updateSyncStorage({ includeSubfolders: false });
            }
        });

    const { includeSubfolders } = await getSyncStorage({ includeSubfolders: true });
    // @ts-ignore
    $('#subfolders-toggle').checkbox(includeSubfolders ? 'set checked' : 'set unchecked');
};

const handleOpenIn = (value: BookmarkSelectionMethodInput) => {
    let openInNewTab = defaultSyncStorageState.openInNewTab;
    let reuseTab = defaultSyncStorageState.reuseTab;

    switch (value) {
        case BookmarkSelectionMethodInput.NEW_TAB:
            openInNewTab = true;
            reuseTab = false;
            break;
        case BookmarkSelectionMethodInput.CURRENT_TAB:
            openInNewTab = false;
            reuseTab = false;
            break;
        case BookmarkSelectionMethodInput.INIT_NEW_TAB:
            openInNewTab = true;
            reuseTab = true;
            break;
        case BookmarkSelectionMethodInput.INIT_CURRENT_TAB:
            openInNewTab = false;
            reuseTab = true;
            break;
    }

    updateSyncStorage({ openInNewTab, reuseTab });
};

const setupOpenInOptions = async () => {
    const elem = $('#open-in-options');
    elem.find('.ui.radio.checkbox').checkbox({
        onChecked: () => {
            const value = elem.find('.ui.radio.checkbox.checked')[0].dataset['value'];
            if (!value) return;
            handleOpenIn(value as BookmarkSelectionMethodInput);
        }
    });

    const { openInNewTab, reuseTab } = await getSyncStorage({ openInNewTab: true, reuseTab: true });

    let value = BookmarkSelectionMethodInput.NEW_TAB;
    if (openInNewTab) {
        value = reuseTab ? BookmarkSelectionMethodInput.INIT_NEW_TAB : BookmarkSelectionMethodInput.NEW_TAB;
    } else {
        value = reuseTab ? BookmarkSelectionMethodInput.INIT_CURRENT_TAB : BookmarkSelectionMethodInput.CURRENT_TAB;
    }

    elem.find(`.ui.radio.checkbox[data-value='${value}']`).checkbox('set checked');
};

const setupSelectionMethodOptions = async () => {
    let elem = $('#bookmark-selection-options');
    elem.find('.ui.radio.checkbox').checkbox({
        onChecked: () => {
            let selectionMethod = elem.find('.ui.radio.checkbox.checked')[0].dataset[
                'value'
            ] as BookmarkSelectionMethod;
            updateSyncStorage({ selectionMethod });
        }
    });

    const { selectionMethod } = await getSyncStorage({ selectionMethod: true });
    elem.find(`.ui.radio.checkbox[data-value='${selectionMethod}']`).checkbox('set checked');
};

const getDropdownRoot = () => {
    let root = document.getElementById('dropdown-root');
    if (!root) throw Error('Failed to find root');
    return root;
};

const setupIconOptions = async () => {
    const nodes = document.querySelectorAll<HTMLImageElement>('#icon-options .option');

    const selectIcon = (node: HTMLImageElement) => {
        const iconStyle = node.getAttribute('data-value') as IconStyle;
        if (!iconStyle) throw Error('Failed to find icon style');
        const path = getIconPath(iconStyle);
        chrome.action.setIcon({ path });
        updateSyncStorage({ iconStyle });
        nodes.forEach((n) => n.classList.remove('selected'));
        node.classList.add('selected');
    };

    // Select currently selected icon style
    const { iconStyle } = await getSyncStorage({ iconStyle: true });
    const node = Array.from(nodes).find((n) => n.getAttribute('data-value') === iconStyle);
    if (!node) throw Error('Failed to find node');
    selectIcon(node);

    for (const node of nodes) {
        node.addEventListener('click', () => selectIcon(node));
    }
};

const main = async () => {
    let root = getDropdownRoot();
    root.innerHTML = '';

    const { folderId } = await getSyncStorage({ folderId: true });
    const nodes = await chrome.bookmarks.getTree();
    buildTree(nodes, root, folderId);

    await setupIncludeSubfoldersToggle();
    await setupOpenInOptions();
    await setupSelectionMethodOptions();
    setupIconOptions();
};

document.addEventListener('DOMContentLoaded', main);
