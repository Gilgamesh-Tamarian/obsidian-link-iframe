import { EmbedBase } from "./embedBase";
// Sites in this file: Spotify, Apple Music, Tidal, Deezer, SoundCloud.
export class SpotifyEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "Spotify";
        this.regex = new RegExp(/https:\/\/(?:open|play|www)\.spotify\.com\/(\w+)\/(\w+)(?:\?highlight=spotify:track:(\w+))?/);
    }
    createEmbed(url) {
        const regexMatch = url.match(this.regex);
        if (regexMatch === null)
            return this.onErrorCreatingEmbed(url);
        const container = createDiv();
        container.classList.add(this.autoEmbedCssClass);
        container.dataset.containerClass = "spotify-embed-container";
        if (regexMatch[1] === "playlist" || regexMatch[1] === "album" || regexMatch[1] === "artist")
            container.classList.add("spotify-playlist-embed");
        this.createEmbedIframe({
            src: `https://open.spotify.com/embed/${regexMatch[1]}/${regexMatch[2]}?utm_source=oembed` +
                (regexMatch[3] !== undefined ? ("&highlight=spotify:track:" + regexMatch[3]) : ""),
            parent: container,
            allowFullscreen: true,
            allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
        });
        return container;
    }
}
export class AppleMusicEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "Apple Music";
        // Matches /locale/type/ where locale is 2-5 letters optionally followed by -xx (e.g. zh-cn, pt-br)
        this.regex = new RegExp(/https:\/\/music\.apple\.com\/([a-z]{2,5}(?:-[a-z]{2})?)\/([a-z-]+)\//i);
        this.embedOrigin = "https://embed.music.apple.com";
    }
    createEmbed(url) {
        let embedUrl;
        let embedType = "album";
        let isSingleSong = false;
        try {
            const parsed = new URL(url);
            if (!this.regex.test(url))
                return this.onErrorCreatingEmbed(url);
            // Extract locale and type from the path
            const pathMatch = parsed.pathname.match(/^\/([a-z]{2,5}(?:-[a-z]{2})?)\/([a-z-]+)\/(?:[^/]+\/)?(\d+|pl\.[a-zA-Z0-9_-]+)\/?$/i);
            if (!pathMatch)
                return this.onErrorCreatingEmbed(url);
            const [, locale, type, id] = pathMatch;
            embedType = type.toLowerCase();
            // Build clean embed URL using only locale/type/id (no slug)
            // This avoids issues with percent-encoded or non-ASCII characters in the slug
            const cleanUrl = new URL(`https://embed.music.apple.com/${locale}/${type}/${id}`);
            // Preserve ?i= (specific song track within an album)
            const trackId = parsed.searchParams.get("i");
            if (trackId) {
                cleanUrl.searchParams.set("i", trackId);
                isSingleSong = true;
            }
            embedUrl = cleanUrl.toString();
        }
        catch (_a) {
            return this.onErrorCreatingEmbed(url);
        }
        return this.createEmbedIframe({
            src: embedUrl,
            containerClass: "apple-music-embed",
            classNames: [
                embedType === "playlist" ? "apple-music-playlist-embed" : "",
                isSingleSong ? "apple-music-song-embed" : "",
            ].filter(Boolean),
            allow: "autoplay *; encrypted-media *; fullscreen *; clipboard-write",
            allowFullscreen: true,
        });
    }
}
export class TidalEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "Tidal";
        this.regex = new RegExp(/https:\/\/(?:listen\.)?tidal\.com\/(?:browse\/)?(album|track|playlist|video)\/([A-Za-z0-9-]+)/i);
        this.embedOrigin = "https://embed.tidal.com";
    }
    createEmbed(url) {
        const regexMatch = url.match(this.regex);
        if (regexMatch === null)
            return this.onErrorCreatingEmbed(url);
        const type = regexMatch[1].toLowerCase();
        const id = regexMatch[2];
        const embedTypeMap = {
            album: "albums",
            track: "tracks",
            playlist: "playlists",
            video: "videos",
        };
        const embedType = embedTypeMap[type];
        if (!embedType)
            return this.onErrorCreatingEmbed(url);
        return this.createEmbedIframe({
            src: `https://embed.tidal.com/${embedType}/${id}`,
            containerClass: "tidal-embed",
            classNames: [type === "track" ? "tidal-track-embed" : ""].filter(Boolean),
            allow: "autoplay; encrypted-media; clipboard-write",
            allowFullscreen: true,
        });
    }
}
export class DeezerEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "Deezer";
        this.regex = new RegExp(/https:\/\/(?:www\.|open\.)?deezer\.com\/(?:[a-z]{2}\/)?(track|album|playlist|artist)\/(\d+)/i);
        this.embedOrigin = "https://widget.deezer.com";
    }
    createEmbed(url) {
        const regexMatch = url.match(this.regex);
        if (regexMatch === null)
            return this.onErrorCreatingEmbed(url);
        const type = regexMatch[1].toLowerCase();
        const id = regexMatch[2];
        const theme = this.plugin.settings.darkMode ? "dark" : "light";
        return this.createEmbedIframe({
            src: `https://widget.deezer.com/widget/${theme}/${type}/${id}`,
            containerClass: "deezer-embed",
            classNames: [type === "track" ? "deezer-track-embed" : ""].filter(Boolean),
            allow: "autoplay; encrypted-media; clipboard-write",
            allowFullscreen: true,
        });
    }
}
export class SoundCloudEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "SoundCloud";
        this.regex = new RegExp(/https:\/\/(?:www\.)?soundcloud\.com\/(.*)/i);
    }
    createEmbed(url) {
        const regexMatch = url.match(this.regex);
        if (regexMatch === null)
            return this.onErrorCreatingEmbed(url);
        return this.createEmbedIframe({
            src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(`https://soundcloud.com/${regexMatch[1]}`)}`,
            containerClass: "soundcloud-embed",
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZWRpYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBRXhDLHVFQUF1RTtBQUV2RSxNQUFNLE9BQU8sWUFBYSxTQUFRLFNBQVM7SUFBM0M7O1FBQ0ksU0FBSSxHQUFzQixTQUFTLENBQUM7UUFDcEMsVUFBSyxHQUFHLElBQUksTUFBTSxDQUFDLDZGQUE2RixDQUFDLENBQUM7SUF1QnRILENBQUM7SUFyQkcsV0FBVyxDQUFDLEdBQVc7UUFDbkIsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekMsSUFBSSxVQUFVLEtBQUssSUFBSTtZQUNuQixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUUxQyxNQUFNLFNBQVMsR0FBRyxTQUFTLEVBQUUsQ0FBQztRQUM5QixTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNoRCxTQUFTLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyx5QkFBeUIsQ0FBQztRQUM3RCxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxVQUFVLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUTtZQUN2RixTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBRXRELElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUNuQixHQUFHLEVBQUUsa0NBQWtDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLG9CQUFvQjtnQkFDckYsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FB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LEtBQUssSUFBSTtZQUNuQixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUUxQyxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUMxQixHQUFHLEVBQUUsd0NBQXdDLGtCQUFrQixDQUFDLDBCQUEwQixVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQzVHLGNBQWMsRUFBRSxrQkFBa0I7U0FDckMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU3VwcG9ydGVkV2Vic2l0ZXMgfSBmcm9tIFwic3JjL3NldHRpbmdzLXRhYlwiO1xyXG5pbXBvcnQgeyBFbWJlZEJhc2UgfSBmcm9tIFwiLi9lbWJlZEJhc2VcIjtcclxuXHJcbi8vIFNpdGVzIGluIHRoaXMgZmlsZTogU3BvdGlmeSwgQXBwbGUgTXVzaWMsIFRpZGFsLCBEZWV6ZXIsIFNvdW5kQ2xvdWQuXHJcblxyXG5leHBvcnQgY2xhc3MgU3BvdGlmeUVtYmVkIGV4dGVuZHMgRW1iZWRCYXNlIHtcclxuICAgIG5hbWU6IFN1cHBvcnRlZFdlYnNpdGVzID0gXCJTcG90aWZ5XCI7XHJcbiAgICByZWdleCA9IG5ldyBSZWdFeHAoL2h0dHBzOlxcL1xcLyg/Om9wZW58cGxheXx3d3cpXFwuc3BvdGlmeVxcLmNvbVxcLyhcXHcrKVxcLyhcXHcrKSg/OlxcP2hpZ2hsaWdodD1zcG90aWZ5OnRyYWNrOihcXHcrKSk/Lyk7XHJcblxyXG4gICAgY3JlYXRlRW1iZWQodXJsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XHJcbiAgICAgICAgY29uc3QgcmVnZXhNYXRjaCA9IHVybC5tYXRjaCh0aGlzLnJlZ2V4KTtcclxuICAgICAgICBpZiAocmVnZXhNYXRjaCA9PT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub25FcnJvckNyZWF0aW5nRW1iZWQodXJsKTtcclxuXHJcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gY3JlYXRlRGl2KCk7XHJcbiAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQodGhpcy5hdXRvRW1iZWRDc3NDbGFzcyk7XHJcbiAgICAgICAgY29udGFpbmVyLmRhdGFzZXQuY29udGFpbmVyQ2xhc3MgPSBcInNwb3RpZnktZW1iZWQtY29udGFpbmVyXCI7XHJcbiAgICAgICAgaWYgKHJlZ2V4TWF0Y2hbMV0gPT09IFwicGxheWxpc3RcIiB8fCByZWdleE1hdGNoWzFdID09PSBcImFsYnVtXCIgfHwgcmVnZXhNYXRjaFsxXSA9PT0gXCJhcnRpc3RcIilcclxuICAgICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJzcG90aWZ5LXBsYXlsaXN0LWVtYmVkXCIpO1xyXG5cclxuICAgICAgICB0aGlzLmNyZWF0ZUVtYmVkSWZyYW1lKHtcclxuICAgICAgICAgICAgc3JjOiBgaHR0cHM6Ly9vcGVuLnNwb3RpZnkuY29tL2VtYmVkLyR7cmVnZXhNYXRjaFsxXX0vJHtyZWdleE1hdGNoWzJdfT91dG1fc291cmNlPW9lbWJlZGAgK1xyXG4gICAgICAgICAgICAgICAgKHJlZ2V4TWF0Y2hbM10gIT09IHVuZGVmaW5lZCA/IChcIiZoaWdobGlnaHQ9c3BvdGlmeTp0cmFjazpcIiArIHJlZ2V4TWF0Y2hbM10pIDogXCJcIiksXHJcbiAgICAgICAgICAgIHBhcmVudDogY29udGFpbmVyLFxyXG4gICAgICAgICAgICBhbGxvd0Z1bGxzY3JlZW46IHRydWUsXHJcbiAgICAgICAgICAgIGFsbG93OiBcImF1dG9wbGF5OyBjbGlwYm9hcmQtd3JpdGU7IGVuY3J5cHRlZC1tZWRpYTsgZnVsbHNjcmVlbjsgcGljdHVyZS1pbi1waWN0dXJlXCIsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBjb250YWluZXI7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBcHBsZU11c2ljRW1iZWQgZXh0ZW5kcyBFbWJlZEJhc2Uge1xyXG4gICAgbmFtZTogU3VwcG9ydGVkV2Vic2l0ZXMgPSBcIkFwcGxlIE11c2ljXCI7XHJcbiAgICAvLyBNYXRjaGVzIC9sb2NhbGUvdHlwZS8gd2hlcmUgbG9jYWxlIGlzIDItNSBsZXR0ZXJzIG9wdGlvbmFsbHkgZm9sbG93ZWQgYnkgLXh4IChlLmcuIHpoLWNuLCBwdC1icilcclxuICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cCgvaHR0cHM6XFwvXFwvbXVzaWNcXC5hcHBsZVxcLmNvbVxcLyhbYS16XXsyLDV9KD86LVthLXpdezJ9KT8pXFwvKFthLXotXSspXFwvL2kpO1xyXG4gICAgZW1iZWRPcmlnaW4gPSBcImh0dHBzOi8vZW1iZWQubXVzaWMuYXBwbGUuY29tXCI7XHJcblxyXG4gICAgY3JlYXRlRW1iZWQodXJsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XHJcbiAgICAgICAgbGV0IGVtYmVkVXJsOiBzdHJpbmc7XHJcbiAgICAgICAgbGV0IGVtYmVkVHlwZSA9IFwiYWxidW1cIjtcclxuICAgICAgICBsZXQgaXNTaW5nbGVTb25nID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsKTtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlZ2V4LnRlc3QodXJsKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9uRXJyb3JDcmVhdGluZ0VtYmVkKHVybCk7XHJcblxyXG4gICAgICAgICAgICAvLyBFeHRyYWN0IGxvY2FsZSBhbmQgdHlwZSBmcm9tIHRoZSBwYXRoXHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGhNYXRjaCA9IHBhcnNlZC5wYXRobmFtZS5tYXRjaChcclxuICAgICAgICAgICAgICAgIC9eXFwvKFthLXpdezIsNX0oPzotW2Etel17Mn0pPylcXC8oW2Etei1dKylcXC8oPzpbXi9dK1xcLyk/KFxcZCt8cGxcXC5bYS16QS1aMC05Xy1dKylcXC8/JC9pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmICghcGF0aE1hdGNoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub25FcnJvckNyZWF0aW5nRW1iZWQodXJsKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IFssIGxvY2FsZSwgdHlwZSwgaWRdID0gcGF0aE1hdGNoO1xyXG4gICAgICAgICAgICBlbWJlZFR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBCdWlsZCBjbGVhbiBlbWJlZCBVUkwgdXNpbmcgb25seSBsb2NhbGUvdHlwZS9pZCAobm8gc2x1ZylcclxuICAgICAgICAgICAgLy8gVGhpcyBhdm9pZHMgaXNzdWVzIHdpdGggcGVyY2VudC1lbmNvZGVkIG9yIG5vbi1BU0NJSSBjaGFyYWN0ZXJzIGluIHRoZSBzbHVnXHJcbiAgICAgICAgICAgIGNvbnN0IGNsZWFuVXJsID0gbmV3IFVSTChgaHR0cHM6Ly9lbWJlZC5tdXNpYy5hcHBsZS5jb20vJHtsb2NhbGV9LyR7dHlwZX0vJHtpZH1gKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFByZXNlcnZlID9pPSAoc3BlY2lmaWMgc29uZyB0cmFjayB3aXRoaW4gYW4gYWxidW0pXHJcbiAgICAgICAgICAgIGNvbnN0IHRyYWNrSWQgPSBwYXJzZWQuc2VhcmNoUGFyYW1zLmdldChcImlcIik7XHJcbiAgICAgICAgICAgIGlmICh0cmFja0lkKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhblVybC5zZWFyY2hQYXJhbXMuc2V0KFwiaVwiLCB0cmFja0lkKTtcclxuICAgICAgICAgICAgICAgIGlzU2luZ2xlU29uZyA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVtYmVkVXJsID0gY2xlYW5VcmwudG9TdHJpbmcoKTtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub25FcnJvckNyZWF0aW5nRW1iZWQodXJsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVtYmVkSWZyYW1lKHtcclxuICAgICAgICAgICAgc3JjOiBlbWJlZFVybCxcclxuICAgICAgICAgICAgY29udGFpbmVyQ2xhc3M6IFwiYXBwbGUtbXVzaWMtZW1iZWRcIixcclxuICAgICAgICAgICAgY2xhc3NOYW1lczogW1xyXG4gICAgICAgICAgICAgICAgZW1iZWRUeXBlID09PSBcInBsYXlsaXN0XCIgPyBcImFwcGxlLW11c2ljLXBsYXlsaXN0LWVtYmVkXCIgOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgaXNTaW5nbGVTb25nID8gXCJhcHBsZS1tdXNpYy1zb25nLWVtYmVkXCIgOiBcIlwiLFxyXG4gICAgICAgICAgICBdLmZpbHRlcihCb29sZWFuKSxcclxuICAgICAgICAgICAgYWxsb3c6IFwiYXV0b3BsYXkgKjsgZW5jcnlwdGVkLW1lZGlhICo7IGZ1bGxzY3JlZW4gKjsgY2xpcGJvYXJkLXdyaXRlXCIsXHJcbiAgICAgICAgICAgIGFsbG93RnVsbHNjcmVlbjogdHJ1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRpZGFsRW1iZWQgZXh0ZW5kcyBFbWJlZEJhc2Uge1xyXG4gICAgbmFtZTogU3VwcG9ydGVkV2Vic2l0ZXMgPSBcIlRpZGFsXCI7XHJcbiAgICByZWdleCA9IG5ldyBSZWdFeHAoL2h0dHBzOlxcL1xcLyg/Omxpc3RlblxcLik/dGlkYWxcXC5jb21cXC8oPzpicm93c2VcXC8pPyhhbGJ1bXx0cmFja3xwbGF5bGlzdHx2aWRlbylcXC8oW0EtWmEtejAtOS1dKykvaSk7XHJcbiAgICBlbWJlZE9yaWdpbiA9IFwiaHR0cHM6Ly9lbWJlZC50aWRhbC5jb21cIjtcclxuXHJcbiAgICBjcmVhdGVFbWJlZCh1cmw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICBjb25zdCByZWdleE1hdGNoID0gdXJsLm1hdGNoKHRoaXMucmVnZXgpO1xyXG4gICAgICAgIGlmIChyZWdleE1hdGNoID09PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vbkVycm9yQ3JlYXRpbmdFbWJlZCh1cmwpO1xyXG5cclxuICAgICAgICBjb25zdCB0eXBlID0gcmVnZXhNYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGNvbnN0IGlkID0gcmVnZXhNYXRjaFsyXTtcclxuICAgICAgICBjb25zdCBlbWJlZFR5cGVNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgICAgICAgICAgIGFsYnVtOiBcImFsYnVtc1wiLFxyXG4gICAgICAgICAgICB0cmFjazogXCJ0cmFja3NcIixcclxuICAgICAgICAgICAgcGxheWxpc3Q6IFwicGxheWxpc3RzXCIsXHJcbiAgICAgICAgICAgIHZpZGVvOiBcInZpZGVvc1wiLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IGVtYmVkVHlwZSA9IGVtYmVkVHlwZU1hcFt0eXBlXTtcclxuICAgICAgICBpZiAoIWVtYmVkVHlwZSlcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9uRXJyb3JDcmVhdGluZ0VtYmVkKHVybCk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVtYmVkSWZyYW1lKHtcclxuICAgICAgICAgICAgc3JjOiBgaHR0cHM6Ly9lbWJlZC50aWRhbC5jb20vJHtlbWJlZFR5cGV9LyR7aWR9YCxcclxuICAgICAgICAgICAgY29udGFpbmVyQ2xhc3M6IFwidGlkYWwtZW1iZWRcIixcclxuICAgICAgICAgICAgY2xhc3NOYW1lczogW3R5cGUgPT09IFwidHJhY2tcIiA/IFwidGlkYWwtdHJhY2stZW1iZWRcIiA6IFwiXCJdLmZpbHRlcihCb29sZWFuKSxcclxuICAgICAgICAgICAgYWxsb3c6IFwiYXV0b3BsYXk7IGVuY3J5cHRlZC1tZWRpYTsgY2xpcGJvYXJkLXdyaXRlXCIsXHJcbiAgICAgICAgICAgIGFsbG93RnVsbHNjcmVlbjogdHJ1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERlZXplckVtYmVkIGV4dGVuZHMgRW1iZWRCYXNlIHtcclxuICAgIG5hbWU6IFN1cHBvcnRlZFdlYnNpdGVzID0gXCJEZWV6ZXJcIjtcclxuICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cCgvaHR0cHM6XFwvXFwvKD86d3d3XFwufG9wZW5cXC4pP2RlZXplclxcLmNvbVxcLyg/OlthLXpdezJ9XFwvKT8odHJhY2t8YWxidW18cGxheWxpc3R8YXJ0aXN0KVxcLyhcXGQrKS9pKTtcclxuICAgIGVtYmVkT3JpZ2luID0gXCJodHRwczovL3dpZGdldC5kZWV6ZXIuY29tXCI7XHJcblxyXG4gICAgY3JlYXRlRW1iZWQodXJsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XHJcbiAgICAgICAgY29uc3QgcmVnZXhNYXRjaCA9IHVybC5tYXRjaCh0aGlzLnJlZ2V4KTtcclxuICAgICAgICBpZiAocmVnZXhNYXRjaCA9PT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub25FcnJvckNyZWF0aW5nRW1iZWQodXJsKTtcclxuXHJcbiAgICAgICAgY29uc3QgdHlwZSA9IHJlZ2V4TWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcclxuICAgICAgICBjb25zdCBpZCA9IHJlZ2V4TWF0Y2hbMl07XHJcbiAgICAgICAgY29uc3QgdGhlbWUgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kYXJrTW9kZSA/IFwiZGFya1wiIDogXCJsaWdodFwiO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFbWJlZElmcmFtZSh7XHJcbiAgICAgICAgICAgIHNyYzogYGh0dHBzOi8vd2lkZ2V0LmRlZXplci5jb20vd2lkZ2V0LyR7dGhlbWV9LyR7dHlwZX0vJHtpZH1gLFxyXG4gICAgICAgICAgICBjb250YWluZXJDbGFzczogXCJkZWV6ZXItZW1iZWRcIixcclxuICAgICAgICAgICAgY2xhc3NOYW1lczogW3R5cGUgPT09IFwidHJhY2tcIiA/IFwiZGVlemVyLXRyYWNrLWVtYmVkXCIgOiBcIlwiXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgICAgICAgICAgIGFsbG93OiBcImF1dG9wbGF5OyBlbmNyeXB0ZWQtbWVkaWE7IGNsaXBib2FyZC13cml0ZVwiLFxyXG4gICAgICAgICAgICBhbGxvd0Z1bGxzY3JlZW46IHRydWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTb3VuZENsb3VkRW1iZWQgZXh0ZW5kcyBFbWJlZEJhc2Uge1xyXG4gICAgbmFtZTogU3VwcG9ydGVkV2Vic2l0ZXMgPSBcIlNvdW5kQ2xvdWRcIjtcclxuICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cCgvaHR0cHM6XFwvXFwvKD86d3d3XFwuKT9zb3VuZGNsb3VkXFwuY29tXFwvKC4qKS9pKTtcclxuXHJcbiAgICBjcmVhdGVFbWJlZCh1cmw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICBjb25zdCByZWdleE1hdGNoID0gdXJsLm1hdGNoKHRoaXMucmVnZXgpO1xyXG4gICAgICAgIGlmIChyZWdleE1hdGNoID09PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vbkVycm9yQ3JlYXRpbmdFbWJlZCh1cmwpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFbWJlZElmcmFtZSh7XHJcbiAgICAgICAgICAgIHNyYzogYGh0dHBzOi8vdy5zb3VuZGNsb3VkLmNvbS9wbGF5ZXIvP3VybD0ke2VuY29kZVVSSUNvbXBvbmVudChgaHR0cHM6Ly9zb3VuZGNsb3VkLmNvbS8ke3JlZ2V4TWF0Y2hbMV19YCl9YCxcclxuICAgICAgICAgICAgY29udGFpbmVyQ2xhc3M6IFwic291bmRjbG91ZC1lbWJlZFwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==