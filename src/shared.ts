import { updateLocalStorage } from './storage.js';
import { HistoryRetentionPeriod, HistoryRetentionPeriodConfiguration, IconStyle } from './types.js';

export const getIconPath = (iconStyle: IconStyle) => {
    switch (iconStyle) {
        case IconStyle.BLACK:
            return 'images/shuffle-black/128.png';
        case IconStyle.WHITE:
            return 'images/shuffle-white/128.png';
        case IconStyle.GRAY:
            return 'images/shuffle-gray/128.png';
        case IconStyle.ON_BLACK:
            return 'images/shuffle-on-black/128.png';
        case IconStyle.ON_WHITE:
            return 'images/shuffle-on-white/128.png';
        case IconStyle.ON_GRAY:
            return 'images/shuffle-on-gray/128.png';
        default:
            return 'images/shuffle-black/128.png';
    }
};

export const getHistoryRetentionPeriodConfiguration = (historyRetentionPeriod: HistoryRetentionPeriod) => {
    return HistoryRetentionPeriodConfiguration[historyRetentionPeriod];
};

export const shuffleBookmarkSelection = () => updateLocalStorage({ selectedNodeIds: [] });

export const delay = (milliseconds: number = 1000) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const setupActionButton = (button: HTMLButtonElement, listener: (ev: MouseEvent) => Promise<any>) => {
    const initialText = button.textContent;

    const icon = document.createElement('i');
    icon.classList.add('check', 'icon');

    let disabled = false;

    button.style.width = `${button.clientWidth}px`;
    button.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        if (disabled) return;
        disabled = true;
        button.classList.add('loading');
        await listener(ev);
        button.textContent = null;
        button.classList.add('green', 'icon');
        button.appendChild(icon);
        setTimeout(() => {
            button.textContent = initialText;
            button.classList.remove('green', 'icon');
            disabled = false;
        }, 1000);
        button.classList.remove('loading');
    });
};

export const setupToggleButton = (
    button: HTMLButtonElement,
    listener: (ev: MouseEvent | null, isActive: boolean) => Promise<any>,
    initialState: boolean = false
) => {
    let isActive = initialState;

    const updateState = async (active: boolean) => {
        button.classList.add('loading');
        await listener(null, active);
        if (active) {
            button.classList.add('green');
        } else {
            button.classList.remove('green');
        }
        button.classList.remove('loading');
    };

    button.addEventListener('click', async (ev) => {
        isActive = !isActive;
        updateState(isActive);
    });

    updateState(isActive);
};

export const setupSelectionButton = <T>(
    button: HTMLButtonElement,
    label: Element,
    listener: (ev: MouseEvent, value: T) => Promise<any>,
    values: [string, T][],
    initialValueIndex: number
) => {
    if (initialValueIndex > values.length || initialValueIndex < 0) throw Error('Invalid index');
    let index = initialValueIndex;
    let value = values[index];
    label.textContent = value[0];

    button.addEventListener('click', async (ev) => {
        console.log('click');
        button.classList.add('loading');
        index = (index + 1) % values.length;
        value = values[index];
        console.log(index), value;
        await listener(ev, value[1]);
        label.textContent = value[0];
        button.classList.remove('loading');
    });
};

export const removeChildren = (element: Element) => {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
};

export function getElement<T extends Element>(query: string, required?: true): T;
export function getElement<T extends Element>(query: string, required: false): T | null;
export function getElement<T extends Element>(parentNode: ParentNode, query: string, required?: true): T;
export function getElement<T extends Element>(parentNode: ParentNode, query: string, required: false): T | null;
export function getElement<T extends Element>(
    queryOrParentNode: ParentNode | string,
    queryOrRequired?: string | boolean,
    required?: boolean
) {
    let parentNode: ParentNode;
    let isRequired: boolean | undefined;
    let query: string;

    // Typescript does not support narrowing on multiple parameters so we have to check the type of every parameter
    // We could use a discriminated union, but that would require us to use an object as our input (which I don't want)
    if (typeof queryOrParentNode === 'string' && typeof queryOrRequired !== 'string') {
        parentNode = document;
        query = queryOrParentNode;
        isRequired = queryOrRequired;
    } else if (typeof queryOrParentNode !== 'string' && typeof queryOrRequired === 'string') {
        parentNode = queryOrParentNode;
        query = queryOrRequired;
        isRequired = required;
    } else {
        throw Error('Invalid argument(s)');
    }

    const element = parentNode.querySelector<T>(query);
    if (!element && (isRequired ?? true)) throw Error(`Failed to find element for query '${query}'`);
    return element;
}

export class MutableState<T> {
    public value: T;

    public constructor(initialValue: T) {
        this.value = initialValue;
    }
}
