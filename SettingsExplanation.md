# Settings
This is an explanation of all the settings that the plugin has.

## General

### Preview Embed
Opens a modal to let you test embed links before using them in notes.
![Preview embed](/readme-assets/settings/Preview-Settings.png)

### Dark Mode
Enables dark theme for embeds that support it:
- Reddit
- Twitter/X

### Preload Options
Controls how embeds behave while loading:
- **None** – The embed loads immediately with no placeholder.
- **Placeholder** – Shows a placeholder while the embed loads.
- **Placeholder + Click To Load** – Shows a placeholder that you must click to start loading the embed (saves bandwidth).

### Suggest Embed
When enabled, pasting a URL triggers a suggestion to convert it into an embed.

## Supported Websites
Toggle embed support on or off for each individual website. Disabling a website causes its links to be treated as plain links or handled by the fallback setting.

## Mastodon Instances

### Allowed Mastodon Servers
A list of Mastodon server hostnames (one per line) that should be recognized and embedded. `mastodon.social` is always recognized regardless of this list.

### Mastodon Default Embed Height
The default height in pixels for Mastodon post embeds. The standard Mastodon default is 750 px. Increasing this value helps render longer posts without clipping, but adds extra whitespace below shorter ones. You can override the height for individual embeds using the `height` option in the embed syntax.

## Google Docs

### View Option
Controls how Google Docs are displayed when embedded:
- **Preview** – Read-only preview mode (default).
- **Edit Minimal** – Edit mode with a minimal UI.
- **Edit Default** – Edit mode with the full Google Docs UI.

## Fallback
Settings that apply to links the plugin does not specifically recognise (i.e. unsupported websites).

### Fallback Option
Determines what happens when an unsupported link is encountered:
- **Show Error Message** – Displays an error message instead of an embed.
- **Embed Link** – Embeds the page in an iframe (default).
- **Hide** – Hides the embed entirely.

### Fallback Width
The default CSS width of the fallback iframe (e.g. `100%`).

### Fallback Height
The default CSS height of the fallback iframe (e.g. `500px`).

### Default Link Text
The text shown for the link displayed below a fallback embed when **Auto Title** is disabled.

### Auto Title
When enabled, the plugin fetches the page's `<title>` tag and uses it as the link text below the fallback embed.

## Advanced

### Debug Mode
Logs additional information to the browser console. Useful for troubleshooting embed issues. 