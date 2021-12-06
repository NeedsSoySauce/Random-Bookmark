![Random-Bookmark-Options](https://user-images.githubusercontent.com/30617834/77842447-b9b4a400-71ee-11ea-9f95-6c4cb18e38c5.PNG)

# Random Bookmark

Random Bookmark is a small chrome extension that opens a random bookmark.

But why, you may ask? I find most of the music I listen to through YouTube, so I like to keep a bookmarks folder of all the songs I like. Sometimes I can't decide what I want to listen to, so that's where this extension comes in handy.

The extension is available [here](https://chrome.google.com/webstore/detail/random-bookmark/eeoohjpijemgnlcegchbabgdbnikdcpd) on the Chrome Web Store.

## Features

This extension is pretty minimal and includes only a few config options.

* Set the folder to pick a random bookmark from
* Toggle whether to include bookmarks in subfolders
* Set where bookmarks should be opened

## Dependencies

Big thanks to [Fomantic-UI](https://fomantic-ui.com/) and [material.io](https://material.io/resources/icons/?style=baseline) for the UI elements and icons.

## Development

Install dependencies:

```
npm install
```

Setup Fomantic-UI (default settings are fine):

```bash
cd node_modules/fomantic-ui
npx gulp install
npx gulp build
```

Build:

```
npm run build
```