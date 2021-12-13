import { IconStyle } from './types.js';

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
