import dateFormat from 'dateformat';
import { createOrUpdateHistoryAlarm } from './alarms.js';
import { ArrayPager } from './pages.js';
import {
    getElement,
    getHistoryRetentionPeriodConfiguration,
    getIconPath,
    MutableState,
    removeChildren,
    setupActionButton,
    setupSelectionButton,
    setupToggleButton,
    shuffleBookmarkSelection
} from './shared.js';
import {
    defaultSyncStorageState,
    getLocalStorage,
    getSyncStorage,
    HistoryItem,
    observeHistory,
    updateLocalStorage,
    updateSyncStorage
} from './storage.js';
import {
    BookmarkSelectionMethod,
    BookmarkTreeNode,
    HistoryRetentionPeriod,
    HistoryRetentionPeriodConfiguration,
    IconStyle
} from './types.js';

enum BookmarkSelectionMethodInput {
    NEW_TAB = 'new-tab',
    CURRENT_TAB = 'current-tab',
    INIT_NEW_TAB = 'init-new-tab',
    INIT_CURRENT_TAB = 'init-current-tab'
}

type VisibilityToggleCallback = (isPrimaryVisible: boolean) => void;

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
    const shuffleButton = document.querySelector<HTMLButtonElement>('#shuffle-button');
    const elem = $('#bookmark-selection-options');

    if (!shuffleButton) throw Error('Failed to find selection method elements');

    setupActionButton(shuffleButton, shuffleBookmarkSelection);

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
    const options = Array.from(document.querySelectorAll<HTMLImageElement>('#icon-options .option'));

    const selectIcon = (iconStyle: IconStyle) => {
        const path = getIconPath(iconStyle);
        chrome.action.setIcon({ path });
        updateSyncStorage({ iconStyle });
        options.forEach((n) => n.classList.remove('selected'));
        const nodes = options.filter((option) => option.getAttribute('data-value') === iconStyle);
        nodes.forEach((node) => node.classList.add('selected'));
    };

    // Select currently selected icon style
    const { iconStyle } = await getSyncStorage({ iconStyle: true });
    selectIcon(iconStyle);
    for (const node of options) {
        const iconStyle = node.getAttribute('data-value') as IconStyle;
        node.addEventListener('click', () => selectIcon(iconStyle));
    }
};

const createHistoryTableRow = (item: HistoryItem) => {
    const row = document.createElement('tr');

    const dateColumn = document.createElement('td');
    dateColumn.textContent = dateFormat(item.date, "d mmm yyyy '@' h:MM TT");
    row.append(dateColumn);

    const nameColumn = document.createElement('td');
    nameColumn.classList.add('name');
    nameColumn.textContent = item.title;
    row.append(nameColumn);

    const urlColumn = document.createElement('td');
    const anchor = document.createElement('a');
    anchor.href = item.url;
    anchor.textContent = item.url;
    urlColumn.append(anchor);
    row.append(urlColumn);

    return row;
};

const createVisibilityToggle =
    (primary: HTMLElement, secondary: HTMLElement): VisibilityToggleCallback =>
    (isPrimaryVisible: boolean) => {
        if (isPrimaryVisible) {
            primary.classList.remove('hidden');
            secondary.classList.add('hidden');
        } else {
            primary.classList.add('hidden');
            secondary.classList.remove('hidden');
        }
    };

const setupHistoryItemPagination = (history: HistoryItem[], container: HTMLElement) => {
    const rows = history.map(createHistoryTableRow);
    const pager = new ArrayPager(rows, 20);
    let page = pager.getPage(0);
    container.append(...page.items);

    const intersectionObserver = new IntersectionObserver(
        (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
            const entry = entries.find((e) => e.isIntersecting);

            if (!entry) return;

            observer.unobserve(entry.target);

            if (!page.hasNext) {
                observer.disconnect();
                return;
            }

            page = pager.getPage(page.pageNumber + 1);
            container.append(...page.items);
            observer.observe(page.items[page.items.length - 1]);
        }
    );

    if (history.length) {
        intersectionObserver.observe(page.items[page.items.length - 1]);
    }
};

const setupHistoryClearButton = (container: HTMLElement, callback: VisibilityToggleCallback) => {
    const clearButton = getElement<HTMLButtonElement>('#clear-history-button');
    setupActionButton(clearButton, async () => {
        await updateLocalStorage({ history: [] });
        callback(false);
        removeChildren(container);
    });
};

const setupHistoryObserver = (
    container: HTMLElement,
    callback: VisibilityToggleCallback,
    isHistoryEnabled: MutableState<boolean>
) => {
    observeHistory((oldValue, newValue) => {
        if (!newValue.length || !isHistoryEnabled.value) return;

        const oldDate = oldValue.length ? new Date(oldValue[0].date) : null;

        if (!oldDate) {
            container.prepend(...newValue.map(createHistoryTableRow));
        } else if (oldDate < new Date(newValue[0].date)) {
            const items = newValue.filter((value) => oldDate < new Date(value.date));
            container.prepend(...items.map(createHistoryTableRow));
        }

        callback(true);
    });
};

const setupHistoryToggleButton = (hint: Element, isHistoryEnabled: MutableState<boolean>) => {
    const toggleButton = getElement<HTMLButtonElement>('#toggle-history-button');
    setupToggleButton(
        toggleButton,
        async (ev, isActive) => {
            await updateSyncStorage({ isHistoryEnabled: isActive });
            isHistoryEnabled.value = isActive;
            if (isActive) {
                toggleButton.textContent = 'On';
                hint.textContent = 'History is enabled. Bookmarks you open with this extension will be recorded below.';
            } else {
                toggleButton.textContent = 'Off';
                hint.textContent =
                    'History is disabled. If enabled, bookmarks you open with this extension will be recorded below.';
            }
        },
        isHistoryEnabled.value
    );
};

const setupHistoryRetentionPeriodButton = (historyRetentionPeriod: HistoryRetentionPeriod) => {
    const button = getElement<HTMLButtonElement>('#history-retention-period-button');
    const label = getElement<HTMLSpanElement>(button, 'span');
    const values: [string, HistoryRetentionPeriod][] = Object.entries(HistoryRetentionPeriodConfiguration).map(
        ([key, value]) => [value.displayName, Number(key)]
    );
    const index = values.findIndex((value) => value[1] === historyRetentionPeriod);
    setupSelectionButton(
        button,
        label,
        async (ev, value) => {
            const config = getHistoryRetentionPeriodConfiguration(value);
            await updateSyncStorage({ historyRetentionPeriod: value });
            createOrUpdateHistoryAlarm(config.alarmPeriodInMinutes);
        },
        values,
        index
    );
};

const setupHistory = async () => {
    const hint = getElement<HTMLDivElement>('#history-empty-hint');
    const table = getElement<HTMLTableElement>('#history-table');
    const tableBody = getElement<HTMLTableSectionElement>(table, 'tbody');

    const { isHistoryEnabled, historyRetentionPeriod } = await getSyncStorage({
        isHistoryEnabled: true,
        historyRetentionPeriod: true
    });
    const { history } = await getLocalStorage({ history: true });
    const setTableVisiblity = createVisibilityToggle(table, hint);
    const state = new MutableState(isHistoryEnabled);

    setupHistoryToggleButton(hint, state);
    setupHistoryItemPagination(history, tableBody);
    setupHistoryClearButton(tableBody, setTableVisiblity);
    setupHistoryObserver(tableBody, setTableVisiblity, state);
    setupHistoryRetentionPeriodButton(historyRetentionPeriod);

    setTableVisiblity(history.length > 0);
};

const main = async () => {
    const root = getDropdownRoot();
    root.innerHTML = '';

    const { folderId } = await getSyncStorage({ folderId: true });
    const nodes = await chrome.bookmarks.getTree();
    buildTree(nodes, root, folderId);

    await setupIncludeSubfoldersToggle();
    await setupOpenInOptions();
    await setupSelectionMethodOptions();
    await setupIconOptions();
    await setupHistory();

    const content = document.querySelector('#content');
    content?.classList.remove('clear');
};

document.addEventListener('DOMContentLoaded', main);
