# Spotify Import CLI

This app is intended to help with importing tracks exported to CSV from Apple
Music and other websites into Spotify liked list using Spotify API.

## Usage

Build:

```sh
npm run build
```

Run help:

```sh
./dist/spotify-import --help
```

First of all, you will need to grab spotify API token and export it in command
line so this application will be able to talk with Spotify:

1. Login to Spotify in browser
2. Open browser developer console (CMD+Shift+I on mac)
3. Paste script from `userscripts/spotify-dump-token.js`
4. It should show a message with your token, copy it to clipboard
5. Paste on command line: `export SPOTIFY_TOKEN="<paste_your_token>`
6. Now you can run `spotify-import`

Keep in mind, Spotify token is usually valid for 45 mins only. When it expires,
you need to obtain a new token again.

## Export from different resources

### Export from Apple Music

1. Open Apple Music
2. Open Library/Songs
3. Select all (CMD+A)
4. Open Excel
5. Paste
6. Save as CSV for example as `apple-music.csv`

### Export from vk.com

1. Login to vk.com
2. Click music
3. Click "show all"
4. Scroll list from top to bottom to preload whole list
5. Open browser developer console (CMD+Shift+I on mac)
6. Paste script from `userscripts/vk-music-export-list.js`
7. File with list of track should be exported as `vk-music.csv`

### Export from Spotify

1. Login to spotify.com
2. Open browser developer console (CMD+Shift+I on mac)
3. Paste script from `userscripts/spotify-export-liked-list.js`
4. File with list of track should be exported as `spotify-music.json`

### Export folder files

```sh
{
    printf "performer\ttitle\n"
    find ~/Documents/music/vk.com -type file -iname "*.mp3" \
        | sed -e 's/\.mp3//' -e 's!^.*/!!' -e 's!–!-!g' -e 's! - !\t!'
} > folder.tsv
```
