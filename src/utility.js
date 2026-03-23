import { __awaiter } from "tslib";
import { normalizePath, requestUrl } from "obsidian";
/**
 * Sets multiple CSS properties on an element.
 * @param el The HTMLElement to modify.
 * @param props An object mapping CSS property names to values.
 */
export function setCssProps(el, props) {
    for (const key in props) {
        const cssKey = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
        el.style.setProperty(cssKey, props[key]);
    }
}
export function isURL(str) {
    let url;
    try {
        url = new URL(str);
    }
    catch (_a) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}
export function isLinkToImage(str) {
    const url = new URL(str);
    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url.pathname);
}
const IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|webp|avif|gif|svg|bmp|tiff?)$/i;
const MASTODON_STATUS_URL_REGEX = /^https:\/\/([^/]+)\/(?:@[A-Za-z0-9_.-]+\/(\d+)|users\/[A-Za-z0-9_.-]+\/statuses\/(\d+))(?:$|[?#])/;
const REDDIT_POST_URL_REGEX = /reddit\.com\/.*\/comments\/([a-z0-9]+)/i;
const TIKTOK_URL_REGEX = /^https:\/\/(?:www\.)?tiktok\.com\//i;
const INSTAGRAM_URL_REGEX = /^https:\/\/(?:(?:www|m)\.)?instagram\.com\/|^https:\/\/instagr\.am\//i;
const FACEBOOK_URL_REGEX = /^https:\/\/(?:(?:www|m|mbasic)\.)?facebook\.com\/|^https:\/\/fb\.watch\//i;
const PINTEREST_URL_REGEX = /^https:\/\/(?:[a-z]{2}\.)?(?:www\.)?pinterest\.[a-z.]+\//i;
const TELEGRAM_POST_URL_REGEX = /^https:\/\/(?:t(?:elegram)?\.me)\/(?:s\/)?[A-Za-z0-9_]{5,}\/\d+(?:$|[?#])/i;
const IMGUR_URL_REGEX = /^https:\/\/(?:i\.)?imgur\.com\//i;
const SOUNDCLOUD_URL_REGEX = /^https:\/\/(?:www\.)?soundcloud\.com\//i;
const SPOTIFY_URL_REGEX = /^https:\/\/(?:open|play|www)\.spotify\.com\//i;
const CODEPEN_URL_REGEX = /^https:\/\/codepen\.io\//i;
const STEAM_APP_URL_REGEX = /store\.steampowered\.com\/app\/(\d+)/i;
const GOOGLE_DOCS_URL_REGEX = /https:\/\/docs\.google\.com\/document(?:\/u\/\d+)?\/d\/(?!e\/)([A-Za-z0-9_-]+)(?!\/pub)/i;
export function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash +=
            (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
}
export function sanitizeFileName(name) {
    const invalidFileNameChars = new Set(["<", ">", ":", '"', "/", "\\", "|", "?", "*"]);
    const sanitized = Array.from(name)
        .map((char) => {
        const code = char.charCodeAt(0);
        if (code >= 0 && code <= 31) {
            return "_";
        }
        return invalidFileNameChars.has(char) ? "_" : char;
    })
        .join("")
        .trim();
    return sanitized || "image";
}
function isLikelyGibberishFileName(name) {
    const normalized = name.replace(/[_\-\s]/g, "");
    if (normalized.length < 6) {
        return true;
    }
    const isHexLike = /^[a-fA-F0-9]{12,}$/.test(normalized);
    if (isHexLike) {
        return true;
    }
    const hasLetters = /[A-Za-z]/.test(normalized);
    const hasDigits = /\d/.test(normalized);
    const isLongAlphaNum = /^[A-Za-z0-9]{18,}$/.test(normalized);
    return hasLetters && hasDigits && isLongAlphaNum;
}
function practicalBaseNameFromUrl(url, rawBase) {
    const candidate = sanitizeFileName(rawBase || "image");
    if (!isLikelyGibberishFileName(candidate) && candidate.toLowerCase() !== "image") {
        return candidate;
    }
    const parsed = new URL(url);
    const hostPart = sanitizeFileName(parsed.hostname.replace(/^www\./, "").replace(/\./g, "-"));
    return `${hostPart}-embed-image`;
}
function extensionFromMime(mimeType) {
    var _a;
    const mimeMap = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/avif": "avif",
        "image/gif": "gif",
        "image/svg+xml": "svg",
        "image/bmp": "bmp",
        "image/tiff": "tiff",
    };
    return (_a = mimeMap[mimeType.toLowerCase()]) !== null && _a !== void 0 ? _a : "png";
}
function fileInfoFromUrl(url, fallbackExtension) {
    const parsed = new URL(url);
    const pathname = decodeURIComponent(parsed.pathname || "");
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments.length > 0 ? segments[segments.length - 1] : "image";
    const extMatch = lastSegment.match(/\.([a-zA-Z0-9]+)$/);
    const extension = (extMatch === null || extMatch === void 0 ? void 0 : extMatch[1]) ? extMatch[1].toLowerCase() : fallbackExtension;
    const rawBase = (extMatch === null || extMatch === void 0 ? void 0 : extMatch.index) ? lastSegment.slice(0, extMatch.index) : lastSegment;
    return {
        baseName: practicalBaseNameFromUrl(url, rawBase),
        extension,
    };
}
export function ensureFolderExists(vault, folderPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const normalized = normalizePath(folderPath);
        const segments = normalized.split("/").filter(Boolean);
        let currentPath = "";
        for (const segment of segments) {
            currentPath = currentPath ? `${currentPath}/${segment}` : segment;
            // Exists check avoids throwing repeatedly in nested folders.
            const exists = yield vault.adapter.exists(currentPath);
            if (!exists) {
                yield vault.createFolder(currentPath);
            }
        }
    });
}
export function saveImageUrlToVault(url_1, vault_1, folderPath_1) {
    return __awaiter(this, arguments, void 0, function* (url, vault, folderPath, debug = false) {
        var _a, _b, _c, _d;
        if (!url || url.startsWith("data:") || !isURL(url)) {
            return url;
        }
        try {
            let mimeType = "";
            let isImage = false;
            const parsed = new URL(url);
            if (IMAGE_EXTENSION_REGEX.test(parsed.pathname)) {
                isImage = true;
            }
            else {
                try {
                    const headResponse = yield requestUrl({ url, method: "HEAD" });
                    mimeType = (_b = (_a = headResponse.headers["content-type"]) === null || _a === void 0 ? void 0 : _a.split(";")[0]) !== null && _b !== void 0 ? _b : "";
                    isImage = mimeType.startsWith("image/");
                }
                catch (_e) {
                    isImage = false;
                }
            }
            if (!isImage) {
                return url;
            }
            yield ensureFolderExists(vault, folderPath);
            const getResponse = yield requestUrl({ url, method: "GET" });
            const responseMime = (_d = (_c = getResponse.headers["content-type"]) === null || _c === void 0 ? void 0 : _c.split(";")[0]) !== null && _d !== void 0 ? _d : mimeType;
            const fallbackExt = extensionFromMime(responseMime || "image/png");
            const fileInfo = fileInfoFromUrl(url, fallbackExt);
            const fileHash = hashString(url);
            const fileName = `${fileInfo.baseName}-${fileHash}.${fileInfo.extension}`;
            const filePath = normalizePath(`${folderPath}/${fileName}`);
            const existingFile = vault.getAbstractFileByPath(filePath);
            if (!existingFile) {
                yield vault.createBinary(filePath, getResponse.arrayBuffer);
                if (debug) {
                    console.debug("[I link therefore iframe] Saved image to vault:", filePath);
                }
            }
            return filePath;
        }
        catch (error) {
            if (debug) {
                console.error("[I link therefore iframe] Failed saving image to vault:", error);
            }
            return url;
        }
    });
}
function getMastodonStatusInfo(url) {
    const match = url.match(MASTODON_STATUS_URL_REGEX);
    if (!match) {
        return null;
    }
    const instance = match[1];
    const statusId = match[2] || match[3];
    if (!instance || !statusId) {
        return null;
    }
    return {
        instance,
        statusId,
    };
}
function getSteamAppInfo(url) {
    const match = url.match(STEAM_APP_URL_REGEX);
    if (!match || !match[1]) {
        return null;
    }
    return {
        appId: match[1],
    };
}
function decodeHtmlUrlEntities(url) {
    return url.replace(/&amp;/g, "&");
}
function asImageUrlOrNull(url) {
    if (!url) {
        return null;
    }
    const normalized = decodeHtmlUrlEntities(url);
    return isURL(normalized) ? normalized : null;
}
function firstImageUrl(candidates) {
    for (const candidate of candidates) {
        const normalized = asImageUrlOrNull(candidate);
        if (normalized) {
            return normalized;
        }
    }
    return null;
}
function resolveAllMastodonImageUrls(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        var _a, _b, _c;
        const mastodonInfo = getMastodonStatusInfo(url);
        if (!mastodonInfo) {
            return [];
        }
        try {
            const apiUrl = `https://${mastodonInfo.instance}/api/v1/statuses/${mastodonInfo.statusId}`;
            const response = yield requestUrl({ url: apiUrl, method: "GET" });
            const status = response.json;
            const attachments = [
                ...((_a = status.media_attachments) !== null && _a !== void 0 ? _a : []),
                ...((_c = (_b = status.reblog) === null || _b === void 0 ? void 0 : _b.media_attachments) !== null && _c !== void 0 ? _c : []),
            ];
            return attachments.flatMap((a) => {
                if (a.type !== "image")
                    return [];
                const u = asImageUrlOrNull(a.url || a.preview_url);
                return u ? [u] : [];
            }).slice(0, 20);
        }
        catch (error) {
            if (debug) {
                console.error("[I link therefore iframe] Failed to resolve Mastodon image:", error);
            }
            return [];
        }
    });
}
function resolveAllRedditImageUrls(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (!REDDIT_POST_URL_REGEX.test(url)) {
            return [];
        }
        try {
            const baseUrl = url.split("?")[0].replace(/\/$/, "");
            const apiUrl = `${baseUrl}.json?raw_json=1`;
            const response = yield requestUrl({ url: apiUrl, method: "GET" });
            const listing = response.json;
            const postData = (_d = (_c = (_b = (_a = listing === null || listing === void 0 ? void 0 : listing[0]) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.children) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.data;
            if (!postData) {
                return [];
            }
            const mediaMetadata = (_e = postData.media_metadata) !== null && _e !== void 0 ? _e : {};
            const galleryItems = (_g = (_f = postData.gallery_data) === null || _f === void 0 ? void 0 : _f.items) !== null && _g !== void 0 ? _g : [];
            if (galleryItems.length > 0) {
                const galleryImages = galleryItems.slice(0, 20).flatMap((item) => {
                    var _a;
                    if (!item.media_id)
                        return [];
                    const meta = mediaMetadata[item.media_id];
                    const u = (meta === null || meta === void 0 ? void 0 : meta.e) === "Image" ? asImageUrlOrNull((_a = meta === null || meta === void 0 ? void 0 : meta.s) === null || _a === void 0 ? void 0 : _a.u) : null;
                    return u ? [u] : [];
                });
                if (galleryImages.length > 0) {
                    return galleryImages;
                }
            }
            // Non-gallery post: return at most one image.
            const single = firstImageUrl([
                postData.url_overridden_by_dest,
                (_l = (_k = (_j = (_h = postData.preview) === null || _h === void 0 ? void 0 : _h.images) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.source) === null || _l === void 0 ? void 0 : _l.url,
                ...Object.values(mediaMetadata)
                    .filter((m) => (m === null || m === void 0 ? void 0 : m.e) === "Image")
                    .map((m) => { var _a; return (_a = m.s) === null || _a === void 0 ? void 0 : _a.u; }),
            ]);
            return single ? [single] : [];
        }
        catch (error) {
            if (debug) {
                console.error("[I link therefore iframe] Failed to resolve Reddit image:", error);
            }
            return [];
        }
    });
}
function resolveOEmbedThumbnail(endpointUrl_1, debugContext_1) {
    return __awaiter(this, arguments, void 0, function* (endpointUrl, debugContext, debug = false) {
        try {
            const response = yield requestUrl({ url: endpointUrl, method: "GET" });
            const data = response.json;
            return firstImageUrl([data.thumbnail_url, data.url]);
        }
        catch (error) {
            if (debug) {
                console.error(`[I link therefore iframe] Failed to resolve ${debugContext} image:`, error);
            }
            return null;
        }
    });
}
function resolveOpenGraphImageUrl(url_1, debugContext_1) {
    return __awaiter(this, arguments, void 0, function* (url, debugContext, debug = false) {
        var _a, _b;
        try {
            const response = yield requestUrl({ url, method: "GET" });
            const html = (_a = response.text) !== null && _a !== void 0 ? _a : "";
            const metaTags = Array.from(html.matchAll(/<meta\s+[^>]*>/gi)).map((m) => m[0]);
            const ogCandidates = [];
            const twitterCandidates = [];
            for (const tag of metaTags) {
                const keyMatch = tag.match(/(?:property|name)=["']([^"']+)["']/i);
                const contentMatch = tag.match(/content=["']([^"']+)["']/i);
                const key = (_b = keyMatch === null || keyMatch === void 0 ? void 0 : keyMatch[1]) === null || _b === void 0 ? void 0 : _b.toLowerCase();
                const content = contentMatch === null || contentMatch === void 0 ? void 0 : contentMatch[1];
                if (!key || !content)
                    continue;
                if (key === "og:image" || key === "og:image:secure_url")
                    ogCandidates.push(content);
                if (key === "twitter:image" || key === "twitter:image:src")
                    twitterCandidates.push(content);
            }
            return firstImageUrl([...ogCandidates, ...twitterCandidates]);
        }
        catch (error) {
            if (debug) {
                console.error(`[I link therefore iframe] Failed to resolve ${debugContext} OpenGraph image:`, error);
            }
            return null;
        }
    });
}
function resolveTikTokImageUrl(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        if (!TIKTOK_URL_REGEX.test(url)) {
            return null;
        }
        return yield resolveOEmbedThumbnail(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, "TikTok", debug);
    });
}
function resolveImgurImageUrl(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        if (!IMGUR_URL_REGEX.test(url)) {
            return null;
        }
        return yield resolveOEmbedThumbnail(`https://api.imgur.com/oembed.json?url=${encodeURIComponent(url)}`, "Imgur", debug);
    });
}
function resolveSoundCloudImageUrl(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        if (!SOUNDCLOUD_URL_REGEX.test(url)) {
            return null;
        }
        return yield resolveOEmbedThumbnail(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`, "SoundCloud", debug);
    });
}
function resolveSpotifyImageUrl(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        if (!SPOTIFY_URL_REGEX.test(url)) {
            return null;
        }
        return yield resolveOEmbedThumbnail(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, "Spotify", debug);
    });
}
function resolveCodepenImageUrl(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        if (!CODEPEN_URL_REGEX.test(url)) {
            return null;
        }
        return yield resolveOEmbedThumbnail(`https://codepen.io/api/oembed?format=json&url=${encodeURIComponent(url)}`, "CodePen", debug);
    });
}
function resolveInstagramImageUrl(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        if (!INSTAGRAM_URL_REGEX.test(url)) {
            return null;
        }
        // Instagram oEmbed may be restricted in some environments, so use it as optional first pass.
        const oembedResult = yield resolveOEmbedThumbnail(`https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`, "Instagram", debug);
        if (oembedResult) {
            return oembedResult;
        }
        // Fall back to OpenGraph scraping across common Instagram host variants.
        const candidates = new Set([url]);
        try {
            const parsed = new URL(url);
            const host = parsed.hostname.toLowerCase();
            if (host.endsWith("instagram.com") || host === "instagr.am") {
                const hostVariants = ["www.instagram.com", "m.instagram.com", "instagr.am"];
                for (const variant of hostVariants) {
                    const variantUrl = new URL(parsed.toString());
                    variantUrl.hostname = variant;
                    candidates.add(variantUrl.toString());
                }
            }
        }
        catch (_a) {
            // Keep original URL if parsing fails.
        }
        for (const candidate of candidates) {
            const resolved = yield resolveOpenGraphImageUrl(candidate, "Instagram", debug);
            if (resolved) {
                return resolved;
            }
        }
        return null;
    });
}
function resolveFacebookImageUrl(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        if (!FACEBOOK_URL_REGEX.test(url)) {
            return null;
        }
        // Facebook has no anonymous oEmbed anymore, so we rely on best-effort HTML metadata.
        const candidates = new Set([url]);
        try {
            const parsed = new URL(url);
            const host = parsed.hostname.toLowerCase();
            if (host.endsWith("facebook.com")) {
                const hostVariants = ["www.facebook.com", "m.facebook.com", "mbasic.facebook.com"];
                for (const variant of hostVariants) {
                    const variantUrl = new URL(parsed.toString());
                    variantUrl.hostname = variant;
                    candidates.add(variantUrl.toString());
                }
            }
        }
        catch (_a) {
            // Ignore parse errors and keep original URL candidate only.
        }
        for (const candidate of candidates) {
            const resolved = yield resolveOpenGraphImageUrl(candidate, "Facebook", debug);
            if (resolved)
                return resolved;
        }
        return null;
    });
}
function resolvePinterestImageUrl(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        if (!PINTEREST_URL_REGEX.test(url)) {
            return null;
        }
        const oembedResult = yield resolveOEmbedThumbnail(`https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`, "Pinterest", debug);
        if (oembedResult) {
            return oembedResult;
        }
        return yield resolveOpenGraphImageUrl(url, "Pinterest", debug);
    });
}
function resolveTelegramImageUrl(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        if (!TELEGRAM_POST_URL_REGEX.test(url)) {
            return null;
        }
        return yield resolveOpenGraphImageUrl(url, "Telegram", debug);
    });
}
function resolveAllSteamImageUrls(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        var _a, _b;
        const steamInfo = getSteamAppInfo(url);
        if (!steamInfo) {
            return [];
        }
        try {
            const apiUrl = `https://store.steampowered.com/api/appdetails?appids=${steamInfo.appId}&l=en`;
            const response = yield requestUrl({ url: apiUrl, method: "GET" });
            const data = response.json;
            const appData = (_a = data === null || data === void 0 ? void 0 : data[steamInfo.appId]) === null || _a === void 0 ? void 0 : _a.data;
            if (!appData) {
                return [];
            }
            const screenshots = ((_b = appData.screenshots) !== null && _b !== void 0 ? _b : [])
                .slice(0, 5)
                .flatMap((s) => {
                const u = asImageUrlOrNull(s.path_full);
                return u ? [u] : [];
            });
            const headerImage = asImageUrlOrNull(appData.header_image);
            return [...screenshots, ...(headerImage ? [headerImage] : [])];
        }
        catch (error) {
            if (debug) {
                console.error("[I link therefore iframe] Failed to resolve Steam image:", error);
            }
            return [];
        }
    });
}
export function resolveAllSocialMediaImageUrls(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, debug = false) {
        const multiResolvers = [
            resolveAllMastodonImageUrls,
            resolveAllRedditImageUrls,
            resolveAllSteamImageUrls,
        ];
        for (const resolver of multiResolvers) {
            const resolved = yield resolver(url, debug);
            if (resolved.length > 0) {
                return resolved;
            }
        }
        const singleResolvers = [
            resolveFacebookImageUrl,
            resolveInstagramImageUrl,
            resolvePinterestImageUrl,
            resolveTelegramImageUrl,
            resolveTikTokImageUrl,
            resolveImgurImageUrl,
            resolveSoundCloudImageUrl,
            resolveSpotifyImageUrl,
            resolveCodepenImageUrl,
        ];
        for (const resolver of singleResolvers) {
            const resolved = yield resolver(url, debug);
            if (resolved) {
                return [resolved];
            }
        }
        return [];
    });
}
export function saveGoogleDocToVault(url_1, vault_1, folderPath_1) {
    return __awaiter(this, arguments, void 0, function* (url, vault, folderPath, debug = false) {
        var _a, _b;
        const match = url.match(GOOGLE_DOCS_URL_REGEX);
        if (!match || !match[1])
            return;
        const documentId = match[1];
        const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=md`;
        try {
            const response = yield requestUrl({ url: exportUrl, method: "GET" });
            const contentType = (_a = response.headers["content-type"]) !== null && _a !== void 0 ? _a : "";
            // If the response is HTML the document is private or inaccessible.
            if (contentType.startsWith("text/html")) {
                if (debug) {
                    console.debug("[I link therefore iframe] Google Doc is not publicly accessible, skipping download:", url);
                }
                return;
            }
            const content = response.text;
            if (!content)
                return;
            // Use the first heading as the filename, falling back to a sortable short-id label.
            const titleMatch = content.match(/^#\s+(.+)/m);
            const title = ((_b = titleMatch === null || titleMatch === void 0 ? void 0 : titleMatch[1]) === null || _b === void 0 ? void 0 : _b.trim()) || `google-doc-${documentId.slice(0, 8)}`;
            const fileHash = hashString(documentId);
            const fileName = `${sanitizeFileName(title)}-${fileHash}.md`;
            yield ensureFolderExists(vault, folderPath);
            const filePath = normalizePath(`${folderPath}/${fileName}`);
            if (!vault.getAbstractFileByPath(filePath)) {
                yield vault.create(filePath, content);
                if (debug) {
                    console.debug("[I link therefore iframe] Saved Google Doc to vault:", filePath);
                }
            }
        }
        catch (error) {
            if (debug) {
                console.error("[I link therefore iframe] Failed to save Google Doc to vault:", error);
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFTLE1BQU0sVUFBVSxDQUFDO0FBRTVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUFDLEVBQWUsRUFBRSxLQUFnQztJQUN6RSxLQUFLLE1BQU0sR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ3RCLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2pFLEVBQUUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM3QyxDQUFDO0FBQ0wsQ0FBQztBQUNELE1BQU0sVUFBVSxLQUFLLENBQUMsR0FBVztJQUM3QixJQUFJLEdBQVEsQ0FBQztJQUViLElBQUksQ0FBQztRQUNELEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBQUMsV0FBTSxDQUFDO1FBQ0wsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDLFFBQVEsS0FBSyxPQUFPLElBQUksR0FBRyxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUM7QUFDakUsQ0FBQztBQUVELE1BQU0sVUFBVSxhQUFhLENBQUMsR0FBVztJQUNyQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN6QixPQUFPLHFDQUFxQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDcEUsQ0FBQztBQW9CRCxNQUFNLHFCQUFxQixHQUFHLGdEQUFnRCxDQUFDO0FBQy9FLE1BQU0seUJB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LENBQUM7UUFDTCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1IsT0FBTyxDQUFDLEtBQUssQ0FBQywrREFBK0QsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxRixDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG5vcm1hbGl6ZVBhdGgsIHJlcXVlc3RVcmwsIFZhdWx0IH0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcblxyXG4vKipcclxuICogU2V0cyBtdWx0aXBsZSBDU1MgcHJvcGVydGllcyBvbiBhbiBlbGVtZW50LlxyXG4gKiBAcGFyYW0gZWwgVGhlIEhUTUxFbGVtZW50IHRvIG1vZGlmeS5cclxuICogQHBhcmFtIHByb3BzIEFuIG9iamVjdCBtYXBwaW5nIENTUyBwcm9wZXJ0eSBuYW1lcyB0byB2YWx1ZXMuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3NzUHJvcHMoZWw6IEhUTUxFbGVtZW50LCBwcm9wczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSkge1xyXG4gICAgZm9yIChjb25zdCBrZXkgaW4gcHJvcHMpIHtcclxuICAgICAgICBjb25zdCBjc3NLZXkgPSBrZXkucmVwbGFjZSgvW0EtWl0vZywgbSA9PiBgLSR7bS50b0xvd2VyQ2FzZSgpfWApO1xyXG4gICAgICAgIGVsLnN0eWxlLnNldFByb3BlcnR5KGNzc0tleSwgcHJvcHNba2V5XSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGlzVVJMKHN0cjogc3RyaW5nKSA6IGJvb2xlYW4ge1xyXG4gICAgbGV0IHVybDogVVJMO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgdXJsID0gbmV3IFVSTChzdHIpO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHA6XCIgfHwgdXJsLnByb3RvY29sID09PSBcImh0dHBzOlwiO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNMaW5rVG9JbWFnZShzdHI6IHN0cmluZykgOiBib29sZWFuIHtcclxuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwoc3RyKTtcclxuICAgIHJldHVybiAvXFwuKGpwZ3xqcGVnfHBuZ3x3ZWJwfGF2aWZ8Z2lmfHN2ZykkLy50ZXN0KHVybC5wYXRobmFtZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGljdGlvbmFyeTxUPiB7XHJcbiAgICBba2V5OiBzdHJpbmddOiBUO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNpemUge1xyXG4gICAgd2lkdGg6IG51bWJlcjtcclxuICAgIGhlaWdodDogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgTWFzdG9kb25TdGF0dXNJbmZvIHtcclxuICAgIGluc3RhbmNlOiBzdHJpbmc7XHJcbiAgICBzdGF0dXNJZDogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgU3RlYW1BcHBJbmZvIHtcclxuICAgIGFwcElkOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IElNQUdFX0VYVEVOU0lPTl9SRUdFWCA9IC9cXC4oanBnfGpwZWd8cG5nfHdlYnB8YXZpZnxnaWZ8c3ZnfGJtcHx0aWZmPykkL2k7XHJcbmNvbnN0IE1BU1RPRE9OX1NUQVRVU19VUkxfUkVHRVggPVxyXG4gICAgL15odHRwczpcXC9cXC8oW14vXSspXFwvKD86QFtBLVphLXowLTlfLi1dK1xcLyhcXGQrKXx1c2Vyc1xcL1tBLVphLXowLTlfLi1dK1xcL3N0YXR1c2VzXFwvKFxcZCspKSg/OiR8Wz8jXSkvO1xyXG5jb25zdCBSRURESVRfUE9TVF9VUkxfUkVHRVggPSAvcmVkZGl0XFwuY29tXFwvLipcXC9jb21tZW50c1xcLyhbYS16MC05XSspL2k7XHJcbmNvbnN0IFRJS1RPS19VUkxfUkVHRVggPSAvXmh0dHBzOlxcL1xcLyg/Ond3d1xcLik/dGlrdG9rXFwuY29tXFwvL2k7XHJcbmNvbnN0IElOU1RBR1JBTV9VUkxfUkVHRVggPSAvXmh0dHBzOlxcL1xcLyg/Oig/Ond3d3xtKVxcLik/aW5zdGFncmFtXFwuY29tXFwvfF5odHRwczpcXC9cXC9pbnN0YWdyXFwuYW1cXC8vaTtcclxuY29uc3QgRkFDRUJPT0tfVVJMX1JFR0VYID0gL15odHRwczpcXC9cXC8oPzooPzp3d3d8bXxtYmFzaWMpXFwuKT9mYWNlYm9va1xcLmNvbVxcL3xeaHR0cHM6XFwvXFwvZmJcXC53YXRjaFxcLy9pO1xyXG5jb25zdCBQSU5URVJFU1RfVVJMX1JFR0VYID0gL15odHRwczpcXC9cXC8oPzpbYS16XXsyfVxcLik/KD86d3d3XFwuKT9waW50ZXJlc3RcXC5bYS16Ll0rXFwvL2k7XHJcbmNvbnN0IFRFTEVHUkFNX1BPU1RfVVJMX1JFR0VYID0gL15odHRwczpcXC9cXC8oPzp0KD86ZWxlZ3JhbSk/XFwubWUpXFwvKD86c1xcLyk/W0EtWmEtejAtOV9dezUsfVxcL1xcZCsoPzokfFs/I10pL2k7XHJcbmNvbnN0IElNR1VSX1VSTF9SRUdFWCA9IC9eaHR0cHM6XFwvXFwvKD86aVxcLik/aW1ndXJcXC5jb21cXC8vaTtcclxuY29uc3QgU09VTkRDTE9VRF9VUkxfUkVHRVggPSAvXmh0dHBzOlxcL1xcLyg/Ond3d1xcLik/c291bmRjbG91ZFxcLmNvbVxcLy9pO1xyXG5jb25zdCBTUE9USUZZX1VSTF9SRUdFWCA9IC9eaHR0cHM6XFwvXFwvKD86b3BlbnxwbGF5fHd3dylcXC5zcG90aWZ5XFwuY29tXFwvL2k7XHJcbmNvbnN0IENPREVQRU5fVVJMX1JFR0VYID0gL15odHRwczpcXC9cXC9jb2RlcGVuXFwuaW9cXC8vaTtcclxuY29uc3QgU1RFQU1fQVBQX1VSTF9SRUdFWCA9IC9zdG9yZVxcLnN0ZWFtcG93ZXJlZFxcLmNvbVxcL2FwcFxcLyhcXGQrKS9pO1xyXG5jb25zdCBHT09HTEVfRE9DU19VUkxfUkVHRVggPSAvaHR0cHM6XFwvXFwvZG9jc1xcLmdvb2dsZVxcLmNvbVxcL2RvY3VtZW50KD86XFwvdVxcL1xcZCspP1xcL2RcXC8oPyFlXFwvKShbQS1aYS16MC05Xy1dKykoPyFcXC9wdWIpL2k7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaGFzaFN0cmluZyh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIGxldCBoYXNoID0gMjE2NjEzNjI2MTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaGFzaCBePSB2YWx1ZS5jaGFyQ29kZUF0KGkpO1xyXG4gICAgICAgIGhhc2ggKz1cclxuICAgICAgICAgICAgKGhhc2ggPDwgMSkgKyAoaGFzaCA8PCA0KSArIChoYXNoIDw8IDcpICsgKGhhc2ggPDwgOCkgKyAoaGFzaCA8PCAyNCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChoYXNoID4+PiAwKS50b1N0cmluZygxNikucGFkU3RhcnQoOCwgXCIwXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVGaWxlTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgaW52YWxpZEZpbGVOYW1lQ2hhcnMgPSBuZXcgU2V0KFtcIjxcIiwgXCI+XCIsIFwiOlwiLCAnXCInLCBcIi9cIiwgXCJcXFxcXCIsIFwifFwiLCBcIj9cIiwgXCIqXCJdKTtcclxuICAgIGNvbnN0IHNhbml0aXplZCA9IEFycmF5LmZyb20obmFtZSlcclxuICAgICAgICAubWFwKChjaGFyKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvZGUgPSBjaGFyLmNoYXJDb2RlQXQoMCk7XHJcbiAgICAgICAgICAgIGlmIChjb2RlID49IDAgJiYgY29kZSA8PSAzMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiX1wiO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gaW52YWxpZEZpbGVOYW1lQ2hhcnMuaGFzKGNoYXIpID8gXCJfXCIgOiBjaGFyO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmpvaW4oXCJcIilcclxuICAgICAgICAudHJpbSgpO1xyXG5cclxuICAgIHJldHVybiBzYW5pdGl6ZWQgfHwgXCJpbWFnZVwiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0xpa2VseUdpYmJlcmlzaEZpbGVOYW1lKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5hbWUucmVwbGFjZSgvW19cXC1cXHNdL2csIFwiXCIpO1xyXG5cclxuICAgIGlmIChub3JtYWxpemVkLmxlbmd0aCA8IDYpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpc0hleExpa2UgPSAvXlthLWZBLUYwLTldezEyLH0kLy50ZXN0KG5vcm1hbGl6ZWQpO1xyXG4gICAgaWYgKGlzSGV4TGlrZSkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGhhc0xldHRlcnMgPSAvW0EtWmEtel0vLnRlc3Qobm9ybWFsaXplZCk7XHJcbiAgICBjb25zdCBoYXNEaWdpdHMgPSAvXFxkLy50ZXN0KG5vcm1hbGl6ZWQpO1xyXG4gICAgY29uc3QgaXNMb25nQWxwaGFOdW0gPSAvXltBLVphLXowLTldezE4LH0kLy50ZXN0KG5vcm1hbGl6ZWQpO1xyXG5cclxuICAgIHJldHVybiBoYXNMZXR0ZXJzICYmIGhhc0RpZ2l0cyAmJiBpc0xvbmdBbHBoYU51bTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHJhY3RpY2FsQmFzZU5hbWVGcm9tVXJsKHVybDogc3RyaW5nLCByYXdCYXNlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgY2FuZGlkYXRlID0gc2FuaXRpemVGaWxlTmFtZShyYXdCYXNlIHx8IFwiaW1hZ2VcIik7XHJcblxyXG4gICAgaWYgKCFpc0xpa2VseUdpYmJlcmlzaEZpbGVOYW1lKGNhbmRpZGF0ZSkgJiYgY2FuZGlkYXRlLnRvTG93ZXJDYXNlKCkgIT09IFwiaW1hZ2VcIikge1xyXG4gICAgICAgIHJldHVybiBjYW5kaWRhdGU7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcGFyc2VkID0gbmV3IFVSTCh1cmwpO1xyXG4gICAgY29uc3QgaG9zdFBhcnQgPSBzYW5pdGl6ZUZpbGVOYW1lKFxyXG4gICAgICAgIHBhcnNlZC5ob3N0bmFtZS5yZXBsYWNlKC9ed3d3XFwuLywgXCJcIikucmVwbGFjZSgvXFwuL2csIFwiLVwiKVxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gYCR7aG9zdFBhcnR9LWVtYmVkLWltYWdlYDtcclxufVxyXG5cclxuZnVuY3Rpb24gZXh0ZW5zaW9uRnJvbU1pbWUobWltZVR5cGU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBtaW1lTWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xyXG4gICAgICAgIFwiaW1hZ2UvanBlZ1wiOiBcImpwZ1wiLFxyXG4gICAgICAgIFwiaW1hZ2UvcG5nXCI6IFwicG5nXCIsXHJcbiAgICAgICAgXCJpbWFnZS93ZWJwXCI6IFwid2VicFwiLFxyXG4gICAgICAgIFwiaW1hZ2UvYXZpZlwiOiBcImF2aWZcIixcclxuICAgICAgICBcImltYWdlL2dpZlwiOiBcImdpZlwiLFxyXG4gICAgICAgIFwiaW1hZ2Uvc3ZnK3htbFwiOiBcInN2Z1wiLFxyXG4gICAgICAgIFwiaW1hZ2UvYm1wXCI6IFwiYm1wXCIsXHJcbiAgICAgICAgXCJpbWFnZS90aWZmXCI6IFwidGlmZlwiLFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gbWltZU1hcFttaW1lVHlwZS50b0xvd2VyQ2FzZSgpXSA/PyBcInBuZ1wiO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaWxlSW5mb0Zyb21VcmwodXJsOiBzdHJpbmcsIGZhbGxiYWNrRXh0ZW5zaW9uOiBzdHJpbmcpOiB7IGJhc2VOYW1lOiBzdHJpbmc7IGV4dGVuc2lvbjogc3RyaW5nIH0ge1xyXG4gICAgY29uc3QgcGFyc2VkID0gbmV3IFVSTCh1cmwpO1xyXG4gICAgY29uc3QgcGF0aG5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQocGFyc2VkLnBhdGhuYW1lIHx8IFwiXCIpO1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBwYXRobmFtZS5zcGxpdChcIi9cIikuZmlsdGVyKEJvb2xlYW4pO1xyXG4gICAgY29uc3QgbGFzdFNlZ21lbnQgPSBzZWdtZW50cy5sZW5ndGggPiAwID8gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0gOiBcImltYWdlXCI7XHJcblxyXG4gICAgY29uc3QgZXh0TWF0Y2ggPSBsYXN0U2VnbWVudC5tYXRjaCgvXFwuKFthLXpBLVowLTldKykkLyk7XHJcbiAgICBjb25zdCBleHRlbnNpb24gPSBleHRNYXRjaD8uWzFdID8gZXh0TWF0Y2hbMV0udG9Mb3dlckNhc2UoKSA6IGZhbGxiYWNrRXh0ZW5zaW9uO1xyXG4gICAgY29uc3QgcmF3QmFzZSA9IGV4dE1hdGNoPy5pbmRleCA/IGxhc3RTZWdtZW50LnNsaWNlKDAsIGV4dE1hdGNoLmluZGV4KSA6IGxhc3RTZWdtZW50O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYmFzZU5hbWU6IHByYWN0aWNhbEJhc2VOYW1lRnJvbVVybCh1cmwsIHJhd0Jhc2UpLFxyXG4gICAgICAgIGV4dGVuc2lvbixcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVGb2xkZXJFeGlzdHModmF1bHQ6IFZhdWx0LCBmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVQYXRoKGZvbGRlclBhdGgpO1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBub3JtYWxpemVkLnNwbGl0KFwiL1wiKS5maWx0ZXIoQm9vbGVhbik7XHJcbiAgICBsZXQgY3VycmVudFBhdGggPSBcIlwiO1xyXG5cclxuICAgIGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xyXG4gICAgICAgIGN1cnJlbnRQYXRoID0gY3VycmVudFBhdGggPyBgJHtjdXJyZW50UGF0aH0vJHtzZWdtZW50fWAgOiBzZWdtZW50O1xyXG5cclxuICAgICAgICAvLyBFeGlzdHMgY2hlY2sgYXZvaWRzIHRocm93aW5nIHJlcGVhdGVkbHkgaW4gbmVzdGVkIGZvbGRlcnMuXHJcbiAgICAgICAgY29uc3QgZXhpc3RzID0gYXdhaXQgdmF1bHQuYWRhcHRlci5leGlzdHMoY3VycmVudFBhdGgpO1xyXG4gICAgICAgIGlmICghZXhpc3RzKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHZhdWx0LmNyZWF0ZUZvbGRlcihjdXJyZW50UGF0aCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZUltYWdlVXJsVG9WYXVsdChcclxuICAgIHVybDogc3RyaW5nLFxyXG4gICAgdmF1bHQ6IFZhdWx0LFxyXG4gICAgZm9sZGVyUGF0aDogc3RyaW5nLFxyXG4gICAgZGVidWcgPSBmYWxzZSxcclxuKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIGlmICghdXJsIHx8IHVybC5zdGFydHNXaXRoKFwiZGF0YTpcIikgfHwgIWlzVVJMKHVybCkpIHtcclxuICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgbGV0IG1pbWVUeXBlID0gXCJcIjtcclxuICAgICAgICBsZXQgaXNJbWFnZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjb25zdCBwYXJzZWQgPSBuZXcgVVJMKHVybCk7XHJcbiAgICAgICAgaWYgKElNQUdFX0VYVEVOU0lPTl9SRUdFWC50ZXN0KHBhcnNlZC5wYXRobmFtZSkpIHtcclxuICAgICAgICAgICAgaXNJbWFnZSA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhlYWRSZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmwsIG1ldGhvZDogXCJIRUFEXCIgfSk7XHJcbiAgICAgICAgICAgICAgICBtaW1lVHlwZSA9IGhlYWRSZXNwb25zZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdPy5zcGxpdChcIjtcIilbMF0gPz8gXCJcIjtcclxuICAgICAgICAgICAgICAgIGlzSW1hZ2UgPSBtaW1lVHlwZS5zdGFydHNXaXRoKFwiaW1hZ2UvXCIpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgICAgIGlzSW1hZ2UgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFpc0ltYWdlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1cmw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCBlbnN1cmVGb2xkZXJFeGlzdHModmF1bHQsIGZvbGRlclBhdGgpO1xyXG5cclxuICAgICAgICBjb25zdCBnZXRSZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmwsIG1ldGhvZDogXCJHRVRcIiB9KTtcclxuICAgICAgICBjb25zdCByZXNwb25zZU1pbWUgPVxyXG4gICAgICAgICAgICBnZXRSZXNwb25zZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdPy5zcGxpdChcIjtcIilbMF0gPz8gbWltZVR5cGU7XHJcbiAgICAgICAgY29uc3QgZmFsbGJhY2tFeHQgPSBleHRlbnNpb25Gcm9tTWltZShyZXNwb25zZU1pbWUgfHwgXCJpbWFnZS9wbmdcIik7XHJcbiAgICAgICAgY29uc3QgZmlsZUluZm8gPSBmaWxlSW5mb0Zyb21VcmwodXJsLCBmYWxsYmFja0V4dCk7XHJcbiAgICAgICAgY29uc3QgZmlsZUhhc2ggPSBoYXNoU3RyaW5nKHVybCk7XHJcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBgJHtmaWxlSW5mby5iYXNlTmFtZX0tJHtmaWxlSGFzaH0uJHtmaWxlSW5mby5leHRlbnNpb259YDtcclxuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7Zm9sZGVyUGF0aH0vJHtmaWxlTmFtZX1gKTtcclxuXHJcbiAgICAgICAgY29uc3QgZXhpc3RpbmdGaWxlID0gdmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZpbGVQYXRoKTtcclxuICAgICAgICBpZiAoIWV4aXN0aW5nRmlsZSkge1xyXG4gICAgICAgICAgICBhd2FpdCB2YXVsdC5jcmVhdGVCaW5hcnkoZmlsZVBhdGgsIGdldFJlc3BvbnNlLmFycmF5QnVmZmVyKTtcclxuICAgICAgICAgICAgaWYgKGRlYnVnKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiW0kgbGluayB0aGVyZWZvcmUgaWZyYW1lXSBTYXZlZCBpbWFnZSB0byB2YXVsdDpcIiwgZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmlsZVBhdGg7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGlmIChkZWJ1Zykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW0kgbGluayB0aGVyZWZvcmUgaWZyYW1lXSBGYWlsZWQgc2F2aW5nIGltYWdlIHRvIHZhdWx0OlwiLCBlcnJvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB1cmw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE1hc3RvZG9uU3RhdHVzSW5mbyh1cmw6IHN0cmluZyk6IE1hc3RvZG9uU3RhdHVzSW5mbyB8IG51bGwge1xyXG4gICAgY29uc3QgbWF0Y2ggPSB1cmwubWF0Y2goTUFTVE9ET05fU1RBVFVTX1VSTF9SRUdFWCk7XHJcblxyXG4gICAgaWYgKCFtYXRjaCkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGluc3RhbmNlID0gbWF0Y2hbMV07XHJcbiAgICBjb25zdCBzdGF0dXNJZCA9IG1hdGNoWzJdIHx8IG1hdGNoWzNdO1xyXG5cclxuICAgIGlmICghaW5zdGFuY2UgfHwgIXN0YXR1c0lkKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBpbnN0YW5jZSxcclxuICAgICAgICBzdGF0dXNJZCxcclxuICAgIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFN0ZWFtQXBwSW5mbyh1cmw6IHN0cmluZyk6IFN0ZWFtQXBwSW5mbyB8IG51bGwge1xyXG4gICAgY29uc3QgbWF0Y2ggPSB1cmwubWF0Y2goU1RFQU1fQVBQX1VSTF9SRUdFWCk7XHJcblxyXG4gICAgaWYgKCFtYXRjaCB8fCAhbWF0Y2hbMV0pIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGFwcElkOiBtYXRjaFsxXSxcclxuICAgIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlY29kZUh0bWxVcmxFbnRpdGllcyh1cmw6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdXJsLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYXNJbWFnZVVybE9yTnVsbCh1cmw6IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIGlmICghdXJsKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IGRlY29kZUh0bWxVcmxFbnRpdGllcyh1cmwpO1xyXG4gICAgcmV0dXJuIGlzVVJMKG5vcm1hbGl6ZWQpID8gbm9ybWFsaXplZCA6IG51bGw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpcnN0SW1hZ2VVcmwoY2FuZGlkYXRlczogQXJyYXk8c3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbD4pOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMpIHtcclxuICAgICAgICBjb25zdCBub3JtYWxpemVkID0gYXNJbWFnZVVybE9yTnVsbChjYW5kaWRhdGUpO1xyXG4gICAgICAgIGlmIChub3JtYWxpemVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBub3JtYWxpemVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUFsbE1hc3RvZG9uSW1hZ2VVcmxzKFxyXG4gICAgdXJsOiBzdHJpbmcsXHJcbiAgICBkZWJ1ZyA9IGZhbHNlLFxyXG4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgICBjb25zdCBtYXN0b2RvbkluZm8gPSBnZXRNYXN0b2RvblN0YXR1c0luZm8odXJsKTtcclxuXHJcbiAgICBpZiAoIW1hc3RvZG9uSW5mbykge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGFwaVVybCA9IGBodHRwczovLyR7bWFzdG9kb25JbmZvLmluc3RhbmNlfS9hcGkvdjEvc3RhdHVzZXMvJHttYXN0b2RvbkluZm8uc3RhdHVzSWR9YDtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmw6IGFwaVVybCwgbWV0aG9kOiBcIkdFVFwiIH0pO1xyXG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHJlc3BvbnNlLmpzb24gYXMge1xyXG4gICAgICAgICAgICBtZWRpYV9hdHRhY2htZW50cz86IEFycmF5PHsgdHlwZT86IHN0cmluZzsgdXJsPzogc3RyaW5nOyBwcmV2aWV3X3VybD86IHN0cmluZyB9PjtcclxuICAgICAgICAgICAgcmVibG9nPzoge1xyXG4gICAgICAgICAgICAgICAgbWVkaWFfYXR0YWNobWVudHM/OiBBcnJheTx7IHR5cGU/OiBzdHJpbmc7IHVybD86IHN0cmluZzsgcHJldmlld191cmw/OiBzdHJpbmcgfT47XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgYXR0YWNobWVudHMgPSBbXHJcbiAgICAgICAgICAgIC4uLihzdGF0dXMubWVkaWFfYXR0YWNobWVudHMgPz8gW10pLFxyXG4gICAgICAgICAgICAuLi4oc3RhdHVzLnJlYmxvZz8ubWVkaWFfYXR0YWNobWVudHMgPz8gW10pLFxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIHJldHVybiBhdHRhY2htZW50cy5mbGF0TWFwKChhKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChhLnR5cGUgIT09IFwiaW1hZ2VcIikgcmV0dXJuIFtdO1xyXG4gICAgICAgICAgICBjb25zdCB1ID0gYXNJbWFnZVVybE9yTnVsbChhLnVybCB8fCBhLnByZXZpZXdfdXJsKTtcclxuICAgICAgICAgICAgcmV0dXJuIHUgPyBbdV0gOiBbXTtcclxuICAgICAgICB9KS5zbGljZSgwLCAyMCk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGlmIChkZWJ1Zykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW0kgbGluayB0aGVyZWZvcmUgaWZyYW1lXSBGYWlsZWQgdG8gcmVzb2x2ZSBNYXN0b2RvbiBpbWFnZTpcIiwgZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVBbGxSZWRkaXRJbWFnZVVybHMoXHJcbiAgICB1cmw6IHN0cmluZyxcclxuICAgIGRlYnVnID0gZmFsc2UsXHJcbik6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICAgIGlmICghUkVERElUX1BPU1RfVVJMX1JFR0VYLnRlc3QodXJsKSkge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGJhc2VVcmwgPSB1cmwuc3BsaXQoXCI/XCIpWzBdLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcclxuICAgICAgICBjb25zdCBhcGlVcmwgPSBgJHtiYXNlVXJsfS5qc29uP3Jhd19qc29uPTFgO1xyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7IHVybDogYXBpVXJsLCBtZXRob2Q6IFwiR0VUXCIgfSk7XHJcbiAgICAgICAgY29uc3QgbGlzdGluZyA9IHJlc3BvbnNlLmpzb24gYXMgQXJyYXk8e1xyXG4gICAgICAgICAgICBkYXRhPzoge1xyXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4/OiBBcnJheTx7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YT86IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsX292ZXJyaWRkZW5fYnlfZGVzdD86IHN0cmluZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlldz86IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlcz86IEFycmF5PHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U/OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybD86IHN0cmluZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfT47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lZGlhX21ldGFkYXRhPzogUmVjb3JkPFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGU/OiBzdHJpbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcz86IHsgdT86IHN0cmluZyB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA+O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnYWxsZXJ5X2RhdGE/OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtcz86IEFycmF5PHsgbWVkaWFfaWQ/OiBzdHJpbmcgfT47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH0+O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0+O1xyXG5cclxuICAgICAgICBjb25zdCBwb3N0RGF0YSA9IGxpc3Rpbmc/LlswXT8uZGF0YT8uY2hpbGRyZW4/LlswXT8uZGF0YTtcclxuICAgICAgICBpZiAoIXBvc3REYXRhKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG1lZGlhTWV0YWRhdGEgPSBwb3N0RGF0YS5tZWRpYV9tZXRhZGF0YSA/PyB7fTtcclxuICAgICAgICBjb25zdCBnYWxsZXJ5SXRlbXMgPSBwb3N0RGF0YS5nYWxsZXJ5X2RhdGE/Lml0ZW1zID8/IFtdO1xyXG5cclxuICAgICAgICBpZiAoZ2FsbGVyeUl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY29uc3QgZ2FsbGVyeUltYWdlcyA9IGdhbGxlcnlJdGVtcy5zbGljZSgwLCAyMCkuZmxhdE1hcCgoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpdGVtLm1lZGlhX2lkKSByZXR1cm4gW107XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRhID0gbWVkaWFNZXRhZGF0YVtpdGVtLm1lZGlhX2lkXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHUgPSBtZXRhPy5lID09PSBcIkltYWdlXCIgPyBhc0ltYWdlVXJsT3JOdWxsKG1ldGE/LnM/LnUpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1ID8gW3VdIDogW107XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAoZ2FsbGVyeUltYWdlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2FsbGVyeUltYWdlcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTm9uLWdhbGxlcnkgcG9zdDogcmV0dXJuIGF0IG1vc3Qgb25lIGltYWdlLlxyXG4gICAgICAgIGNvbnN0IHNpbmdsZSA9IGZpcnN0SW1hZ2VVcmwoW1xyXG4gICAgICAgICAgICBwb3N0RGF0YS51cmxfb3ZlcnJpZGRlbl9ieV9kZXN0LFxyXG4gICAgICAgICAgICBwb3N0RGF0YS5wcmV2aWV3Py5pbWFnZXM/LlswXT8uc291cmNlPy51cmwsXHJcbiAgICAgICAgICAgIC4uLk9iamVjdC52YWx1ZXMobWVkaWFNZXRhZGF0YSlcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoKG0pID0+IG0/LmUgPT09IFwiSW1hZ2VcIilcclxuICAgICAgICAgICAgICAgIC5tYXAoKG0pID0+IG0ucz8udSksXHJcbiAgICAgICAgXSk7XHJcbiAgICAgICAgcmV0dXJuIHNpbmdsZSA/IFtzaW5nbGVdIDogW107XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGlmIChkZWJ1Zykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW0kgbGluayB0aGVyZWZvcmUgaWZyYW1lXSBGYWlsZWQgdG8gcmVzb2x2ZSBSZWRkaXQgaW1hZ2U6XCIsIGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlT0VtYmVkVGh1bWJuYWlsKFxyXG4gICAgZW5kcG9pbnRVcmw6IHN0cmluZyxcclxuICAgIGRlYnVnQ29udGV4dDogc3RyaW5nLFxyXG4gICAgZGVidWcgPSBmYWxzZSxcclxuKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh7IHVybDogZW5kcG9pbnRVcmwsIG1ldGhvZDogXCJHRVRcIiB9KTtcclxuICAgICAgICBjb25zdCBkYXRhID0gcmVzcG9uc2UuanNvbiBhcyB7XHJcbiAgICAgICAgICAgIHRodW1ibmFpbF91cmw/OiBzdHJpbmc7XHJcbiAgICAgICAgICAgIHVybD86IHN0cmluZztcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gZmlyc3RJbWFnZVVybChbZGF0YS50aHVtYm5haWxfdXJsLCBkYXRhLnVybF0pO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBpZiAoZGVidWcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0kgbGluayB0aGVyZWZvcmUgaWZyYW1lXSBGYWlsZWQgdG8gcmVzb2x2ZSAke2RlYnVnQ29udGV4dH0gaW1hZ2U6YCwgZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZU9wZW5HcmFwaEltYWdlVXJsKFxyXG4gICAgdXJsOiBzdHJpbmcsXHJcbiAgICBkZWJ1Z0NvbnRleHQ6IHN0cmluZyxcclxuICAgIGRlYnVnID0gZmFsc2UsXHJcbik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmwsIG1ldGhvZDogXCJHRVRcIiB9KTtcclxuICAgICAgICBjb25zdCBodG1sID0gcmVzcG9uc2UudGV4dCA/PyBcIlwiO1xyXG5cclxuICAgICAgICBjb25zdCBtZXRhVGFncyA9IEFycmF5LmZyb20oaHRtbC5tYXRjaEFsbCgvPG1ldGFcXHMrW14+XSo+L2dpKSkubWFwKChtKSA9PiBtWzBdKTtcclxuICAgICAgICBjb25zdCBvZ0NhbmRpZGF0ZXM6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgY29uc3QgdHdpdHRlckNhbmRpZGF0ZXM6IHN0cmluZ1tdID0gW107XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgdGFnIG9mIG1ldGFUYWdzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGtleU1hdGNoID0gdGFnLm1hdGNoKC8oPzpwcm9wZXJ0eXxuYW1lKT1bXCInXShbXlwiJ10rKVtcIiddL2kpO1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50TWF0Y2ggPSB0YWcubWF0Y2goL2NvbnRlbnQ9W1wiJ10oW15cIiddKylbXCInXS9pKTtcclxuICAgICAgICAgICAgY29uc3Qga2V5ID0ga2V5TWF0Y2g/LlsxXT8udG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGNvbnRlbnRNYXRjaD8uWzFdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFrZXkgfHwgIWNvbnRlbnQpXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChrZXkgPT09IFwib2c6aW1hZ2VcIiB8fCBrZXkgPT09IFwib2c6aW1hZ2U6c2VjdXJlX3VybFwiKVxyXG4gICAgICAgICAgICAgICAgb2dDYW5kaWRhdGVzLnB1c2goY29udGVudCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoa2V5ID09PSBcInR3aXR0ZXI6aW1hZ2VcIiB8fCBrZXkgPT09IFwidHdpdHRlcjppbWFnZTpzcmNcIilcclxuICAgICAgICAgICAgICAgIHR3aXR0ZXJDYW5kaWRhdGVzLnB1c2goY29udGVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmlyc3RJbWFnZVVybChbLi4ub2dDYW5kaWRhdGVzLCAuLi50d2l0dGVyQ2FuZGlkYXRlc10pO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBpZiAoZGVidWcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0kgbGluayB0aGVyZWZvcmUgaWZyYW1lXSBGYWlsZWQgdG8gcmVzb2x2ZSAke2RlYnVnQ29udGV4dH0gT3BlbkdyYXBoIGltYWdlOmAsIGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVUaWtUb2tJbWFnZVVybChcclxuICAgIHVybDogc3RyaW5nLFxyXG4gICAgZGVidWcgPSBmYWxzZSxcclxuKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XHJcbiAgICBpZiAoIVRJS1RPS19VUkxfUkVHRVgudGVzdCh1cmwpKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGF3YWl0IHJlc29sdmVPRW1iZWRUaHVtYm5haWwoXHJcbiAgICAgICAgYGh0dHBzOi8vd3d3LnRpa3Rvay5jb20vb2VtYmVkP3VybD0ke2VuY29kZVVSSUNvbXBvbmVudCh1cmwpfWAsXHJcbiAgICAgICAgXCJUaWtUb2tcIixcclxuICAgICAgICBkZWJ1ZyxcclxuICAgICk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVJbWd1ckltYWdlVXJsKFxyXG4gICAgdXJsOiBzdHJpbmcsXHJcbiAgICBkZWJ1ZyA9IGZhbHNlLFxyXG4pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcclxuICAgIGlmICghSU1HVVJfVVJMX1JFR0VYLnRlc3QodXJsKSkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhd2FpdCByZXNvbHZlT0VtYmVkVGh1bWJuYWlsKFxyXG4gICAgICAgIGBodHRwczovL2FwaS5pbWd1ci5jb20vb2VtYmVkLmpzb24/dXJsPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHVybCl9YCxcclxuICAgICAgICBcIkltZ3VyXCIsXHJcbiAgICAgICAgZGVidWcsXHJcbiAgICApO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlU291bmRDbG91ZEltYWdlVXJsKFxyXG4gICAgdXJsOiBzdHJpbmcsXHJcbiAgICBkZWJ1ZyA9IGZhbHNlLFxyXG4pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcclxuICAgIGlmICghU09VTkRDTE9VRF9VUkxfUkVHRVgudGVzdCh1cmwpKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGF3YWl0IHJlc29sdmVPRW1iZWRUaHVtYm5haWwoXHJcbiAgICAgICAgYGh0dHBzOi8vc291bmRjbG91ZC5jb20vb2VtYmVkP2Zvcm1hdD1qc29uJnVybD0ke2VuY29kZVVSSUNvbXBvbmVudCh1cmwpfWAsXHJcbiAgICAgICAgXCJTb3VuZENsb3VkXCIsXHJcbiAgICAgICAgZGVidWcsXHJcbiAgICApO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlU3BvdGlmeUltYWdlVXJsKFxyXG4gICAgdXJsOiBzdHJpbmcsXHJcbiAgICBkZWJ1ZyA9IGZhbHNlLFxyXG4pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcclxuICAgIGlmICghU1BPVElGWV9VUkxfUkVHRVgudGVzdCh1cmwpKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGF3YWl0IHJlc29sdmVPRW1iZWRUaHVtYm5haWwoXHJcbiAgICAgICAgYGh0dHBzOi8vb3Blbi5zcG90aWZ5LmNvbS9vZW1iZWQ/dXJsPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHVybCl9YCxcclxuICAgICAgICBcIlNwb3RpZnlcIixcclxuICAgICAgICBkZWJ1ZyxcclxuICAgICk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVDb2RlcGVuSW1hZ2VVcmwoXHJcbiAgICB1cmw6IHN0cmluZyxcclxuICAgIGRlYnVnID0gZmFsc2UsXHJcbik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xyXG4gICAgaWYgKCFDT0RFUEVOX1VSTF9SRUdFWC50ZXN0KHVybCkpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYXdhaXQgcmVzb2x2ZU9FbWJlZFRodW1ibmFpbChcclxuICAgICAgICBgaHR0cHM6Ly9jb2RlcGVuLmlvL2FwaS9vZW1iZWQ/Zm9ybWF0PWpzb24mdXJsPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHVybCl9YCxcclxuICAgICAgICBcIkNvZGVQZW5cIixcclxuICAgICAgICBkZWJ1ZyxcclxuICAgICk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVJbnN0YWdyYW1JbWFnZVVybChcclxuICAgIHVybDogc3RyaW5nLFxyXG4gICAgZGVidWcgPSBmYWxzZSxcclxuKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XHJcbiAgICBpZiAoIUlOU1RBR1JBTV9VUkxfUkVHRVgudGVzdCh1cmwpKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5zdGFncmFtIG9FbWJlZCBtYXkgYmUgcmVzdHJpY3RlZCBpbiBzb21lIGVudmlyb25tZW50cywgc28gdXNlIGl0IGFzIG9wdGlvbmFsIGZpcnN0IHBhc3MuXHJcbiAgICBjb25zdCBvZW1iZWRSZXN1bHQgPSBhd2FpdCByZXNvbHZlT0VtYmVkVGh1bWJuYWlsKFxyXG4gICAgICAgIGBodHRwczovL2FwaS5pbnN0YWdyYW0uY29tL29lbWJlZD91cmw9JHtlbmNvZGVVUklDb21wb25lbnQodXJsKX1gLFxyXG4gICAgICAgIFwiSW5zdGFncmFtXCIsXHJcbiAgICAgICAgZGVidWcsXHJcbiAgICApO1xyXG4gICAgaWYgKG9lbWJlZFJlc3VsdCkge1xyXG4gICAgICAgIHJldHVybiBvZW1iZWRSZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmFsbCBiYWNrIHRvIE9wZW5HcmFwaCBzY3JhcGluZyBhY3Jvc3MgY29tbW9uIEluc3RhZ3JhbSBob3N0IHZhcmlhbnRzLlxyXG4gICAgY29uc3QgY2FuZGlkYXRlcyA9IG5ldyBTZXQ8c3RyaW5nPihbdXJsXSk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwYXJzZWQgPSBuZXcgVVJMKHVybCk7XHJcbiAgICAgICAgY29uc3QgaG9zdCA9IHBhcnNlZC5ob3N0bmFtZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICBpZiAoaG9zdC5lbmRzV2l0aChcImluc3RhZ3JhbS5jb21cIikgfHwgaG9zdCA9PT0gXCJpbnN0YWdyLmFtXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgaG9zdFZhcmlhbnRzID0gW1wid3d3Lmluc3RhZ3JhbS5jb21cIiwgXCJtLmluc3RhZ3JhbS5jb21cIiwgXCJpbnN0YWdyLmFtXCJdO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHZhcmlhbnQgb2YgaG9zdFZhcmlhbnRzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2YXJpYW50VXJsID0gbmV3IFVSTChwYXJzZWQudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICB2YXJpYW50VXJsLmhvc3RuYW1lID0gdmFyaWFudDtcclxuICAgICAgICAgICAgICAgIGNhbmRpZGF0ZXMuYWRkKHZhcmlhbnRVcmwudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgICAvLyBLZWVwIG9yaWdpbmFsIFVSTCBpZiBwYXJzaW5nIGZhaWxzLlxyXG4gICAgfVxyXG5cclxuICAgIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMpIHtcclxuICAgICAgICBjb25zdCByZXNvbHZlZCA9IGF3YWl0IHJlc29sdmVPcGVuR3JhcGhJbWFnZVVybChjYW5kaWRhdGUsIFwiSW5zdGFncmFtXCIsIGRlYnVnKTtcclxuICAgICAgICBpZiAocmVzb2x2ZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUZhY2Vib29rSW1hZ2VVcmwoXHJcbiAgICB1cmw6IHN0cmluZyxcclxuICAgIGRlYnVnID0gZmFsc2UsXHJcbik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xyXG4gICAgaWYgKCFGQUNFQk9PS19VUkxfUkVHRVgudGVzdCh1cmwpKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmFjZWJvb2sgaGFzIG5vIGFub255bW91cyBvRW1iZWQgYW55bW9yZSwgc28gd2UgcmVseSBvbiBiZXN0LWVmZm9ydCBIVE1MIG1ldGFkYXRhLlxyXG4gICAgY29uc3QgY2FuZGlkYXRlcyA9IG5ldyBTZXQ8c3RyaW5nPihbdXJsXSk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwYXJzZWQgPSBuZXcgVVJMKHVybCk7XHJcbiAgICAgICAgY29uc3QgaG9zdCA9IHBhcnNlZC5ob3N0bmFtZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICBpZiAoaG9zdC5lbmRzV2l0aChcImZhY2Vib29rLmNvbVwiKSkge1xyXG4gICAgICAgICAgICBjb25zdCBob3N0VmFyaWFudHMgPSBbXCJ3d3cuZmFjZWJvb2suY29tXCIsIFwibS5mYWNlYm9vay5jb21cIiwgXCJtYmFzaWMuZmFjZWJvb2suY29tXCJdO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHZhcmlhbnQgb2YgaG9zdFZhcmlhbnRzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2YXJpYW50VXJsID0gbmV3IFVSTChwYXJzZWQudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICB2YXJpYW50VXJsLmhvc3RuYW1lID0gdmFyaWFudDtcclxuICAgICAgICAgICAgICAgIGNhbmRpZGF0ZXMuYWRkKHZhcmlhbnRVcmwudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgICAvLyBJZ25vcmUgcGFyc2UgZXJyb3JzIGFuZCBrZWVwIG9yaWdpbmFsIFVSTCBjYW5kaWRhdGUgb25seS5cclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzKSB7XHJcbiAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSBhd2FpdCByZXNvbHZlT3BlbkdyYXBoSW1hZ2VVcmwoY2FuZGlkYXRlLCBcIkZhY2Vib29rXCIsIGRlYnVnKTtcclxuICAgICAgICBpZiAocmVzb2x2ZWQpXHJcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlZDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZVBpbnRlcmVzdEltYWdlVXJsKFxyXG4gICAgdXJsOiBzdHJpbmcsXHJcbiAgICBkZWJ1ZyA9IGZhbHNlLFxyXG4pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcclxuICAgIGlmICghUElOVEVSRVNUX1VSTF9SRUdFWC50ZXN0KHVybCkpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBvZW1iZWRSZXN1bHQgPSBhd2FpdCByZXNvbHZlT0VtYmVkVGh1bWJuYWlsKFxyXG4gICAgICAgIGBodHRwczovL3d3dy5waW50ZXJlc3QuY29tL29lbWJlZC5qc29uP3VybD0ke2VuY29kZVVSSUNvbXBvbmVudCh1cmwpfWAsXHJcbiAgICAgICAgXCJQaW50ZXJlc3RcIixcclxuICAgICAgICBkZWJ1ZyxcclxuICAgICk7XHJcblxyXG4gICAgaWYgKG9lbWJlZFJlc3VsdCkge1xyXG4gICAgICAgIHJldHVybiBvZW1iZWRSZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGF3YWl0IHJlc29sdmVPcGVuR3JhcGhJbWFnZVVybCh1cmwsIFwiUGludGVyZXN0XCIsIGRlYnVnKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZVRlbGVncmFtSW1hZ2VVcmwoXHJcbiAgICB1cmw6IHN0cmluZyxcclxuICAgIGRlYnVnID0gZmFsc2UsXHJcbik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xyXG4gICAgaWYgKCFURUxFR1JBTV9QT1NUX1VSTF9SRUdFWC50ZXN0KHVybCkpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYXdhaXQgcmVzb2x2ZU9wZW5HcmFwaEltYWdlVXJsKHVybCwgXCJUZWxlZ3JhbVwiLCBkZWJ1Zyk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVBbGxTdGVhbUltYWdlVXJscyhcclxuICAgIHVybDogc3RyaW5nLFxyXG4gICAgZGVidWcgPSBmYWxzZSxcclxuKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gICAgY29uc3Qgc3RlYW1JbmZvID0gZ2V0U3RlYW1BcHBJbmZvKHVybCk7XHJcbiAgICBpZiAoIXN0ZWFtSW5mbykge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGFwaVVybCA9IGBodHRwczovL3N0b3JlLnN0ZWFtcG93ZXJlZC5jb20vYXBpL2FwcGRldGFpbHM/YXBwaWRzPSR7c3RlYW1JbmZvLmFwcElkfSZsPWVuYDtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmw6IGFwaVVybCwgbWV0aG9kOiBcIkdFVFwiIH0pO1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSByZXNwb25zZS5qc29uIGFzIFJlY29yZDxcclxuICAgICAgICAgICAgc3RyaW5nLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzPzogYm9vbGVhbjtcclxuICAgICAgICAgICAgICAgIGRhdGE/OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyX2ltYWdlPzogc3RyaW5nO1xyXG4gICAgICAgICAgICAgICAgICAgIHNjcmVlbnNob3RzPzogQXJyYXk8eyBwYXRoX2Z1bGw/OiBzdHJpbmcgfT47XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgPjtcclxuXHJcbiAgICAgICAgY29uc3QgYXBwRGF0YSA9IGRhdGE/LltzdGVhbUluZm8uYXBwSWRdPy5kYXRhO1xyXG4gICAgICAgIGlmICghYXBwRGF0YSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzY3JlZW5zaG90cyA9IChhcHBEYXRhLnNjcmVlbnNob3RzID8/IFtdKVxyXG4gICAgICAgICAgICAuc2xpY2UoMCwgNSlcclxuICAgICAgICAgICAgLmZsYXRNYXAoKHMpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHUgPSBhc0ltYWdlVXJsT3JOdWxsKHMucGF0aF9mdWxsKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1ID8gW3VdIDogW107XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBoZWFkZXJJbWFnZSA9IGFzSW1hZ2VVcmxPck51bGwoYXBwRGF0YS5oZWFkZXJfaW1hZ2UpO1xyXG4gICAgICAgIHJldHVybiBbLi4uc2NyZWVuc2hvdHMsIC4uLihoZWFkZXJJbWFnZSA/IFtoZWFkZXJJbWFnZV0gOiBbXSldO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBpZiAoZGVidWcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltJIGxpbmsgdGhlcmVmb3JlIGlmcmFtZV0gRmFpbGVkIHRvIHJlc29sdmUgU3RlYW0gaW1hZ2U6XCIsIGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUFsbFNvY2lhbE1lZGlhSW1hZ2VVcmxzKFxyXG4gICAgdXJsOiBzdHJpbmcsXHJcbiAgICBkZWJ1ZyA9IGZhbHNlLFxyXG4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XHJcbiAgICBjb25zdCBtdWx0aVJlc29sdmVyczogQXJyYXk8KHVybDogc3RyaW5nLCBkZWJ1ZzogYm9vbGVhbikgPT4gUHJvbWlzZTxzdHJpbmdbXT4+ID0gW1xyXG4gICAgICAgIHJlc29sdmVBbGxNYXN0b2RvbkltYWdlVXJscyxcclxuICAgICAgICByZXNvbHZlQWxsUmVkZGl0SW1hZ2VVcmxzLFxyXG4gICAgICAgIHJlc29sdmVBbGxTdGVhbUltYWdlVXJscyxcclxuICAgIF07XHJcblxyXG4gICAgZm9yIChjb25zdCByZXNvbHZlciBvZiBtdWx0aVJlc29sdmVycykge1xyXG4gICAgICAgIGNvbnN0IHJlc29sdmVkID0gYXdhaXQgcmVzb2x2ZXIodXJsLCBkZWJ1Zyk7XHJcbiAgICAgICAgaWYgKHJlc29sdmVkLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzaW5nbGVSZXNvbHZlcnM6IEFycmF5PCh1cmw6IHN0cmluZywgZGVidWc6IGJvb2xlYW4pID0+IFByb21pc2U8c3RyaW5nIHwgbnVsbD4+ID0gW1xyXG4gICAgICAgIHJlc29sdmVGYWNlYm9va0ltYWdlVXJsLFxyXG4gICAgICAgIHJlc29sdmVJbnN0YWdyYW1JbWFnZVVybCxcclxuICAgICAgICByZXNvbHZlUGludGVyZXN0SW1hZ2VVcmwsXHJcbiAgICAgICAgcmVzb2x2ZVRlbGVncmFtSW1hZ2VVcmwsXHJcbiAgICAgICAgcmVzb2x2ZVRpa1Rva0ltYWdlVXJsLFxyXG4gICAgICAgIHJlc29sdmVJbWd1ckltYWdlVXJsLFxyXG4gICAgICAgIHJlc29sdmVTb3VuZENsb3VkSW1hZ2VVcmwsXHJcbiAgICAgICAgcmVzb2x2ZVNwb3RpZnlJbWFnZVVybCxcclxuICAgICAgICByZXNvbHZlQ29kZXBlbkltYWdlVXJsLFxyXG4gICAgXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IHJlc29sdmVyIG9mIHNpbmdsZVJlc29sdmVycykge1xyXG4gICAgICAgIGNvbnN0IHJlc29sdmVkID0gYXdhaXQgcmVzb2x2ZXIodXJsLCBkZWJ1Zyk7XHJcbiAgICAgICAgaWYgKHJlc29sdmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbcmVzb2x2ZWRdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gW107XHJcbn1cclxuXHJcbiAgICBleHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZUdvb2dsZURvY1RvVmF1bHQoXHJcbiAgICAgICAgdXJsOiBzdHJpbmcsXHJcbiAgICAgICAgdmF1bHQ6IFZhdWx0LFxyXG4gICAgICAgIGZvbGRlclBhdGg6IHN0cmluZyxcclxuICAgICAgICBkZWJ1ZyA9IGZhbHNlLFxyXG4gICAgKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSB1cmwubWF0Y2goR09PR0xFX0RPQ1NfVVJMX1JFR0VYKTtcclxuICAgICAgICBpZiAoIW1hdGNoIHx8ICFtYXRjaFsxXSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBkb2N1bWVudElkID0gbWF0Y2hbMV07XHJcbiAgICAgICAgY29uc3QgZXhwb3J0VXJsID0gYGh0dHBzOi8vZG9jcy5nb29nbGUuY29tL2RvY3VtZW50L2QvJHtkb2N1bWVudElkfS9leHBvcnQ/Zm9ybWF0PW1kYDtcclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0VXJsKHsgdXJsOiBleHBvcnRVcmwsIG1ldGhvZDogXCJHRVRcIiB9KTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudFR5cGUgPSByZXNwb25zZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdID8/IFwiXCI7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGUgcmVzcG9uc2UgaXMgSFRNTCB0aGUgZG9jdW1lbnQgaXMgcHJpdmF0ZSBvciBpbmFjY2Vzc2libGUuXHJcbiAgICAgICAgICAgIGlmIChjb250ZW50VHlwZS5zdGFydHNXaXRoKFwidGV4dC9odG1sXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGVidWcpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiW0kgbGluayB0aGVyZWZvcmUgaWZyYW1lXSBHb29nbGUgRG9jIGlzIG5vdCBwdWJsaWNseSBhY2Nlc3NpYmxlLCBza2lwcGluZyBkb3dubG9hZDpcIiwgdXJsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHJlc3BvbnNlLnRleHQ7XHJcbiAgICAgICAgICAgIGlmICghY29udGVudCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgLy8gVXNlIHRoZSBmaXJzdCBoZWFkaW5nIGFzIHRoZSBmaWxlbmFtZSwgZmFsbGluZyBiYWNrIHRvIGEgc29ydGFibGUgc2hvcnQtaWQgbGFiZWwuXHJcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlTWF0Y2ggPSBjb250ZW50Lm1hdGNoKC9eI1xccysoLispL20pO1xyXG4gICAgICAgICAgICBjb25zdCB0aXRsZSA9IHRpdGxlTWF0Y2g/LlsxXT8udHJpbSgpIHx8IGBnb29nbGUtZG9jLSR7ZG9jdW1lbnRJZC5zbGljZSgwLCA4KX1gO1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlSGFzaCA9IGhhc2hTdHJpbmcoZG9jdW1lbnRJZCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVOYW1lID0gYCR7c2FuaXRpemVGaWxlTmFtZSh0aXRsZSl9LSR7ZmlsZUhhc2h9Lm1kYDtcclxuXHJcbiAgICAgICAgICAgIGF3YWl0IGVuc3VyZUZvbGRlckV4aXN0cyh2YXVsdCwgZm9sZGVyUGF0aCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gbm9ybWFsaXplUGF0aChgJHtmb2xkZXJQYXRofS8ke2ZpbGVOYW1lfWApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF2YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZmlsZVBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB2YXVsdC5jcmVhdGUoZmlsZVBhdGgsIGNvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRlYnVnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIltJIGxpbmsgdGhlcmVmb3JlIGlmcmFtZV0gU2F2ZWQgR29vZ2xlIERvYyB0byB2YXVsdDpcIiwgZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgaWYgKGRlYnVnKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW0kgbGluayB0aGVyZWZvcmUgaWZyYW1lXSBGYWlsZWQgdG8gc2F2ZSBHb29nbGUgRG9jIHRvIHZhdWx0OlwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4iXX0=