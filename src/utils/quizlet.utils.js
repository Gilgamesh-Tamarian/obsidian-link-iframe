import { __awaiter } from "tslib";
import { normalizePath, requestUrl, TFile } from "obsidian";
import { ensureFolderExists, hashString, isURL, sanitizeFileName, saveImageUrlToVault } from "src/utility";
import { parseQuizletSetId } from "src/utils/url.utils";
const QUIZLET_USER_NOTES_START = "<!-- quizlet:user-notes:start -->";
const QUIZLET_USER_NOTES_END = "<!-- quizlet:user-notes:end -->";
const QUIZLET_STALE_MARKER = "<!-- quizlet:stale=true -->";
const QUIZLET_SOURCE_PREFIX = "<!-- quizlet:source=";
const QUIZLET_SET_ID_PROPERTY = "QuizletSetId";
const QUIZLET_CARD_ID_PROPERTY = "QuizletCardId";
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function yamlQuote(value) {
    return JSON.stringify(value);
}
function upsertFrontmatterValue(frontmatter, key, value) {
    const normalized = frontmatter.trimEnd();
    const pattern = new RegExp(`^${escapeRegExp(key)}:\\s*.*$`, "m");
    const replacement = `${key}: ${yamlQuote(value)}`;
    if (!normalized) {
        return replacement;
    }
    if (pattern.test(normalized)) {
        return normalized.replace(pattern, replacement);
    }
    return `${normalized}\n${replacement}`;
}
function withQuizletFrontmatterProperties(frontmatter, metadata) {
    let nextFrontmatter = upsertFrontmatterValue(frontmatter, QUIZLET_SET_ID_PROPERTY, metadata.setId);
    if (metadata.cardId) {
        nextFrontmatter = upsertFrontmatterValue(nextFrontmatter, QUIZLET_CARD_ID_PROPERTY, metadata.cardId);
    }
    return nextFrontmatter;
}
function readFrontmatterValue(frontmatter, key) {
    const match = frontmatter.match(new RegExp(`^${escapeRegExp(key)}:\\s*(.+)$`, "m"));
    if (!(match === null || match === void 0 ? void 0 : match[1])) {
        return undefined;
    }
    const rawValue = match[1].trim();
    if (!rawValue) {
        return undefined;
    }
    if ((rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
        try {
            return JSON.parse(rawValue.replace(/^'/, '"').replace(/'$/, '"'));
        }
        catch (_a) {
            return rawValue.slice(1, -1);
        }
    }
    return rawValue;
}
function buildQuizletSingleFileContent(title, cards, setId, originalUrl, frontmatter = "", userNotes = "") {
    const lines = [];
    const managedFrontmatter = withQuizletFrontmatterProperties(frontmatter, {
        setId,
    });
    if (managedFrontmatter.trim()) {
        lines.push("---");
        lines.push(managedFrontmatter.trimEnd());
        lines.push("---");
        lines.push("");
    }
    lines.push(`# ${title}`);
    lines.push("");
    lines.push(`**Source:** ${originalUrl}  `);
    lines.push(`**Cards:** ${cards.length}`);
    lines.push("");
    lines.push("---");
    lines.push("");
    for (const card of cards) {
        lines.push(`**${card.term}**`);
        lines.push(card.definition);
        if (card.localImagePath) {
            lines.push("");
            lines.push(`![[${card.localImagePath}]]`);
        }
        lines.push("");
    }
    lines.push(`${QUIZLET_SOURCE_PREFIX}${originalUrl} -->`);
    lines.push(QUIZLET_USER_NOTES_START);
    if (userNotes.trim()) {
        lines.push(userNotes.trimEnd());
    }
    lines.push(QUIZLET_USER_NOTES_END);
    lines.push("");
    return lines.join("\n");
}
function saveQuizletSetAsSingleFile(vault, folderPath, title, setId, originalUrl, cards) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield ensureFolderExists(vault, folderPath);
        const filePath = normalizePath(`${folderPath}/${sanitizeFileName(title)}-${hashString(setId)}.md`);
        const existingFile = (_a = yield findExistingQuizletSingleFile(vault, folderPath, setId)) !== null && _a !== void 0 ? _a : vault.getAbstractFileByPath(filePath);
        if (existingFile instanceof TFile) {
            const existingContent = yield vault.cachedRead(existingFile);
            const { frontmatter } = parseExistingFrontmatter(existingContent);
            const userNotes = parseQuizletUserNotes(existingContent);
            const nextContent = buildQuizletSingleFileContent(title, cards, setId, originalUrl, frontmatter, userNotes);
            if (existingContent !== nextContent) {
                yield vault.modify(existingFile, nextContent);
                return {
                    status: "updated",
                    filePath: existingFile.path,
                    cardCount: cards.length,
                    createdCount: 0,
                    updatedCount: 1,
                    unchangedCount: 0,
                };
            }
            return {
                status: "unchanged",
                filePath: existingFile.path,
                cardCount: cards.length,
                createdCount: 0,
                updatedCount: 0,
                unchangedCount: 1,
            };
        }
        const content = buildQuizletSingleFileContent(title, cards, setId, originalUrl);
        yield vault.create(filePath, content);
        return {
            status: "saved",
            filePath,
            cardCount: cards.length,
            createdCount: 1,
            updatedCount: 0,
            unchangedCount: 0,
        };
    });
}
function findExistingQuizletSingleFile(vault, folderPath, setId) {
    return __awaiter(this, void 0, void 0, function* () {
        const normalizedFolderPath = normalizePath(folderPath);
        const candidates = vault.getMarkdownFiles().filter(file => { var _a; return ((_a = file.parent) === null || _a === void 0 ? void 0 : _a.path) === normalizedFolderPath; });
        for (const file of candidates) {
            try {
                const content = yield vault.cachedRead(file);
                const metadata = parseQuizletMetadata(content);
                if (metadata.setId === setId && !metadata.cardId) {
                    return file;
                }
            }
            catch (_a) {
                // Ignore unreadable files while looking for an existing single-file export.
            }
        }
        return null;
    });
}
function stripHtmlTags(text) {
    return text
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function normalizeQuizletText(value) {
    if (typeof value !== "string") {
        return "";
    }
    return stripHtmlTags(value
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim());
}
function pushQuizletCard(cards, termValue, definitionValue) {
    const term = normalizeQuizletText(termValue);
    const definition = normalizeQuizletText(definitionValue);
    if (!term || !definition) {
        return;
    }
    cards.push({ term, definition });
}
function collectQuizletCards(value, cards) {
    if (!value) {
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            collectQuizletCards(item, cards);
        }
        return;
    }
    if (typeof value !== "object") {
        return;
    }
    const obj = value;
    pushQuizletCard(cards, obj.term, obj.definition);
    pushQuizletCard(cards, obj.word, obj.definition);
    const questionText = obj.text ||
        obj.name ||
        obj.question;
    let answerText = undefined;
    if (typeof obj.acceptedAnswer === "object" && obj.acceptedAnswer) {
        answerText = obj.acceptedAnswer.text;
    }
    if (!answerText && typeof obj.suggestedAnswer === "object" && obj.suggestedAnswer) {
        answerText = obj.suggestedAnswer.text;
    }
    if (!answerText && typeof obj.answer === "object" && obj.answer) {
        answerText = obj.answer.text;
    }
    if (!answerText) {
        answerText = obj.description;
    }
    pushQuizletCard(cards, questionText, answerText);
    for (const nestedValue of Object.values(obj)) {
        collectQuizletCards(nestedValue, cards);
    }
}
function dedupeQuizletCards(cards) {
    const deduped = new Map();
    for (const card of cards) {
        const key = `${card.term}\n${card.definition}`.toLowerCase();
        if (!deduped.has(key)) {
            deduped.set(key, card);
        }
    }
    return Array.from(deduped.values());
}
function parseQuizletCardsFromHtml(html) {
    const cards = [];
    const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        const raw = (match[1] || "").trim();
        if (!raw) {
            continue;
        }
        try {
            const parsed = JSON.parse(raw);
            collectQuizletCards(parsed, cards);
        }
        catch (_a) {
            // Ignore malformed json-ld blocks.
        }
    }
    return dedupeQuizletCards(cards);
}
function parseJsonEscapedString(value) {
    try {
        return JSON.parse(`"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
    }
    catch (_a) {
        return value;
    }
}
function parseQuizletCardsFromScripts(html) {
    var _a;
    const cards = [];
    const scripts = (_a = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi)) !== null && _a !== void 0 ? _a : [];
    const pairPatterns = [
        /"term"\s*:\s*"((?:\\.|[^"\\])+)"[\s\S]{0,1000}?"definition"\s*:\s*"((?:\\.|[^"\\])+)"/g,
        /"word"\s*:\s*"((?:\\.|[^"\\])+)"[\s\S]{0,1000}?"definition"\s*:\s*"((?:\\.|[^"\\])+)"/g,
        /"word"\s*:\s*\{[\s\S]{0,80}?"text"\s*:\s*"((?:\\.|[^"\\])+)"[\s\S]{0,500}?"definition"\s*:\s*\{[\s\S]{0,80}?"text"\s*:\s*"((?:\\.|[^"\\])+)"/g,
    ];
    for (const scriptTag of scripts) {
        for (const pattern of pairPatterns) {
            let match;
            while ((match = pattern.exec(scriptTag)) !== null) {
                const term = normalizeQuizletText(parseJsonEscapedString(match[1] || ""));
                const definition = normalizeQuizletText(parseJsonEscapedString(match[2] || ""));
                if (term && definition) {
                    cards.push({ term, definition });
                }
            }
        }
    }
    return dedupeQuizletCards(cards);
}
function mapQuizletStudiableItems(items) {
    var _a;
    const cards = [];
    for (const item of items) {
        if (typeof item !== "object" || !item)
            continue;
        const obj = item;
        if (!Array.isArray(obj.cardSides))
            continue;
        let term = "";
        let definition = "";
        let imageUrl = undefined;
        for (const side of obj.cardSides) {
            if (typeof side !== "object" || !side)
                continue;
            const s = side;
            if (!Array.isArray(s.media))
                continue;
            for (const med of s.media) {
                if (typeof med !== "object" || !med)
                    continue;
                const m = med;
                if (!imageUrl && (m.type === 2 || m.type === 5) && typeof m.url === "string" && m.url) {
                    imageUrl = m.url;
                }
                if (m.type !== 1)
                    continue;
                const text = normalizeQuizletText((_a = m.plainText) !== null && _a !== void 0 ? _a : "");
                if (s.label === "word" && text)
                    term = text;
                else if (s.label === "definition" && text)
                    definition = text;
            }
        }
        const rawCardId = typeof obj.id === "number" || typeof obj.id === "string"
            ? String(obj.id)
            : undefined;
        if (term && definition)
            cards.push({ cardId: rawCardId, term, definition, imageUrl });
    }
    return dedupeQuizletCards(cards);
}
function extractStudiableItems(obj, depth = 0) {
    if (depth > 12 || !obj || typeof obj !== "object")
        return null;
    if (Array.isArray(obj)) {
        if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null) {
            const first = obj[0];
            if (Array.isArray(first.cardSides))
                return obj;
        }
        for (const item of obj) {
            const found = extractStudiableItems(item, depth + 1);
            if (found)
                return found;
        }
        return null;
    }
    const record = obj;
    for (const key of ["studiableItems", "studiableItem"]) {
        const val = record[key];
        if (Array.isArray(val) && val.length > 0)
            return val;
    }
    for (const val of Object.values(record)) {
        const found = extractStudiableItems(val, depth + 1);
        if (found)
            return found;
    }
    return null;
}
function parseQuizletCardsFromNextData(html) {
    const nextDataMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    if (!(nextDataMatch === null || nextDataMatch === void 0 ? void 0 : nextDataMatch[1]))
        return [];
    let data;
    try {
        data = JSON.parse(nextDataMatch[1].trim());
    }
    catch (_a) {
        return [];
    }
    const tryDehydrated = (obj, d = 0) => {
        if (d > 8 || typeof obj !== "object" || !obj)
            return null;
        const record = obj;
        if (typeof record.dehydratedReduxStateKey === "string") {
            try {
                const inner = JSON.parse(JSON.parse(record.dehydratedReduxStateKey));
                const items = extractStudiableItems(inner);
                if (items && items.length > 0)
                    return items;
            }
            catch ( /* continue */_a) { /* continue */ }
        }
        for (const val of Object.values(record)) {
            const found = tryDehydrated(val, d + 1);
            if (found)
                return found;
        }
        return null;
    };
    const dehydratedItems = tryDehydrated(data);
    if (dehydratedItems && dehydratedItems.length > 0) {
        const mapped = mapQuizletStudiableItems(dehydratedItems);
        if (mapped.length > 0)
            return mapped;
    }
    const directItems = extractStudiableItems(data);
    if (directItems && directItems.length > 0) {
        const mapped = mapQuizletStudiableItems(directItems);
        if (mapped.length > 0)
            return mapped;
    }
    const cards = [];
    collectQuizletCards(data, cards);
    return dedupeQuizletCards(cards);
}
function parseQuizletCardsFromQuizletVars(html) {
    const patterns = [
        /window\.Quizlet\["setPageData"\]\s*=\s*([\s\S]+?);\s*QLoad\("Quizlet\.setPageData"\)/,
        /window\.Quizlet\["cardsModeData"\]\s*=\s*([\s\S]+?);\s*QLoad\("Quizlet\.cardsModeData"\)/,
        /window\.Quizlet\["assistantModeData"\]\s*=\s*([\s\S]+?);\s*QLoad\("Quizlet\.assistantModeData"\)/,
    ];
    for (const pattern of patterns) {
        const m = html.match(pattern);
        if (!(m === null || m === void 0 ? void 0 : m[1]))
            continue;
        try {
            const data = JSON.parse(m[1].trim());
            const items = extractStudiableItems(data);
            if (items && items.length > 0) {
                const mapped = mapQuizletStudiableItems(items);
                if (mapped.length > 0)
                    return mapped;
            }
            const fallbackCards = [];
            collectQuizletCards(data, fallbackCards);
            if (fallbackCards.length > 0) {
                return dedupeQuizletCards(fallbackCards);
            }
        }
        catch ( /* Try next pattern */_a) { /* Try next pattern */ }
    }
    return [];
}
function tryQuizletRestApi(setId, fetchHeaders) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const apiUrl = `https://quizlet.com/webapi/3.9/studiable-item-documents` +
            `?filters%5BstudiableContainerId%5D=${setId}` +
            `&filters%5BstudiableContainerType%5D=1&perPage=1000&page=1`;
        try {
            const resp = yield requestUrl({
                url: apiUrl,
                method: "GET",
                headers: Object.assign(Object.assign({}, fetchHeaders), { "Accept": "application/json" }),
            });
            const ct = (_a = resp.headers["content-type"]) !== null && _a !== void 0 ? _a : "";
            if (!ct.includes("json"))
                return [];
            const data = (_b = resp.json) !== null && _b !== void 0 ? _b : JSON.parse(resp.text);
            const items = extractStudiableItems(data);
            if (items && items.length > 0) {
                const mapped = mapQuizletStudiableItems(items);
                if (mapped.length > 0)
                    return mapped;
            }
            const fallbackCards = [];
            collectQuizletCards(data, fallbackCards);
            return dedupeQuizletCards(fallbackCards);
        }
        catch (_c) {
            return [];
        }
    });
}
function tryQuizletSetTitleApi(setId, fetchHeaders) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        const apiUrl = `https://quizlet.com/webapi/3.9/sets/${setId}`;
        try {
            const resp = yield requestUrl({
                url: apiUrl,
                method: "GET",
                headers: Object.assign(Object.assign({}, fetchHeaders), { "Accept": "application/json" }),
            });
            const ct = (_a = resp.headers["content-type"]) !== null && _a !== void 0 ? _a : "";
            if (!ct.includes("json"))
                return null;
            const data = ((_b = resp.json) !== null && _b !== void 0 ? _b : JSON.parse(resp.text));
            const title = (_g = (_f = (_e = (_d = (_c = data.responses) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.models) === null || _e === void 0 ? void 0 : _e.set) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.title;
            return typeof title === "string" && title.trim() ? title.trim() : null;
        }
        catch (_h) {
            return null;
        }
    });
}
function parseQuizletCardsFromVisibleText(html) {
    const text = normalizeQuizletText(html.replace(/<[^>]+>/g, "\n"));
    const markerMatch = text.match(/Terms in this set\s*\(\d+\)([\s\S]{0,40000})/i);
    if (!markerMatch || !markerMatch[1]) {
        return [];
    }
    const section = markerMatch[1]
        .split(/Additional Links|Created by|Students also studied/i)[0]
        .trim();
    const tokens = section
        .split(/\s{2,}|\n+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 4000);
    const cards = [];
    for (let i = 0; i + 1 < tokens.length; i += 2) {
        const term = normalizeQuizletText(tokens[i]);
        const definition = normalizeQuizletText(tokens[i + 1]);
        if (!term || !definition) {
            continue;
        }
        if (term.length > 200 || definition.length > 600) {
            continue;
        }
        cards.push({ term, definition });
    }
    return dedupeQuizletCards(cards);
}
function quizletTitleFromHtml(html, fallback) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (!titleMatch || !titleMatch[1]) {
        return fallback;
    }
    const cleaned = normalizeQuizletText(titleMatch[1].replace(/\s*\|\s*Quizlet\s*$/i, ""));
    return cleaned || fallback;
}
function slugifyForFileName(value, fallback) {
    const slug = sanitizeFileName(value)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/_+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
    return slug || fallback;
}
function parseExistingFrontmatter(content) {
    var _a;
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) {
        return { frontmatter: "", body: content };
    }
    return {
        frontmatter: (_a = match[1]) !== null && _a !== void 0 ? _a : "",
        body: content.slice(match[0].length),
    };
}
function parseQuizletUserNotes(content) {
    const explicitMatch = content.match(/<!--\s*quizlet:user-notes:start\s*-->\r?\n?([\s\S]*?)\r?\n?<!--\s*quizlet:user-notes:end\s*-->/i);
    if (explicitMatch && explicitMatch[1] !== undefined) {
        return explicitMatch[1].trimEnd();
    }
    const legacyMatch = content.match(/<!--\s*quizlet:source=.*?-->\s*([\s\S]*)$/i);
    if (!legacyMatch || !legacyMatch[1]) {
        return "";
    }
    return legacyMatch[1].replace(new RegExp(`\n?${escapeRegExp(QUIZLET_STALE_MARKER)}\\s*$`), "").trimEnd();
}
function parseQuizletCardUserNotes(content) {
    var _a, _b, _c, _d, _e, _f;
    const explicitMatches = Array.from(content.matchAll(/<!--\s*quizlet:user-notes:start\s*-->\r?\n?([\s\S]*?)\r?\n?<!--\s*quizlet:user-notes:end\s*-->/gi));
    if (explicitMatches.length >= 2) {
        return {
            front: ((_b = (_a = explicitMatches[0]) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : "").trimEnd(),
            back: ((_d = (_c = explicitMatches[1]) === null || _c === void 0 ? void 0 : _c[1]) !== null && _d !== void 0 ? _d : "").trimEnd(),
        };
    }
    if (explicitMatches.length === 1) {
        return {
            front: "",
            back: ((_f = (_e = explicitMatches[0]) === null || _e === void 0 ? void 0 : _e[1]) !== null && _f !== void 0 ? _f : "").trimEnd(),
        };
    }
    return {
        front: "",
        back: parseQuizletUserNotes(content),
    };
}
function parseQuizletMetadata(content) {
    const { frontmatter } = parseExistingFrontmatter(content);
    return {
        setId: readFrontmatterValue(frontmatter, QUIZLET_SET_ID_PROPERTY),
        cardId: readFrontmatterValue(frontmatter, QUIZLET_CARD_ID_PROPERTY),
    };
}
function findExistingQuizletSetFolder(vault, folderPath, setId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const normalizedFolderPath = normalizePath(folderPath);
        const candidates = vault.getMarkdownFiles().filter(file => file.path.startsWith(`${normalizedFolderPath}/`));
        for (const file of candidates) {
            try {
                const content = yield vault.cachedRead(file);
                const metadata = parseQuizletMetadata(content);
                if (metadata.setId === setId && metadata.cardId) {
                    return (_b = (_a = file.parent) === null || _a === void 0 ? void 0 : _a.path) !== null && _b !== void 0 ? _b : null;
                }
            }
            catch (_c) {
                // Ignore unreadable files while looking for an existing set folder.
            }
        }
        return null;
    });
}
function buildQuizletCardFileName(card, index, effectiveCardId) {
    const prefix = String(index + 1).padStart(3, "0");
    const slug = slugifyForFileName(card.term, `card-${prefix}`);
    const idSuffix = slugifyForFileName(effectiveCardId, hashString(effectiveCardId)).slice(-12);
    return `${prefix}-${slug}-${idSuffix}.md`;
}
function buildQuizletCardNoteContent(card, setId, originalUrl, frontmatter = "", userNotes = { front: "", back: "" }) {
    var _a;
    const sections = [];
    const managedFrontmatter = withQuizletFrontmatterProperties(frontmatter, {
        setId,
        cardId: (_a = card.cardId) !== null && _a !== void 0 ? _a : hashString(`${card.term}\n${card.definition}`),
    });
    if (managedFrontmatter.trim()) {
        sections.push("---");
        sections.push(managedFrontmatter.trimEnd());
        sections.push("---");
        sections.push("");
    }
    sections.push(card.term.trim());
    sections.push("");
    sections.push(QUIZLET_USER_NOTES_START);
    if (userNotes.front.trim()) {
        sections.push(userNotes.front.trimEnd());
    }
    sections.push(QUIZLET_USER_NOTES_END);
    sections.push("");
    sections.push("---");
    sections.push("");
    sections.push(card.definition.trim());
    if (card.localImagePath) {
        sections.push("");
        sections.push(`![[${card.localImagePath}]]`);
    }
    sections.push("");
    sections.push(QUIZLET_USER_NOTES_START);
    if (userNotes.back.trim()) {
        sections.push(userNotes.back.trimEnd());
    }
    sections.push(QUIZLET_USER_NOTES_END);
    sections.push("");
    sections.push(`${QUIZLET_SOURCE_PREFIX}${originalUrl} -->`);
    sections.push("");
    return sections.join("\n");
}
function localizeQuizletCardImages(cards, vault, assetFolderPath, debug) {
    return __awaiter(this, void 0, void 0, function* () {
        const localizedCards = [];
        for (const card of cards) {
            if (!card.imageUrl) {
                localizedCards.push(card);
                continue;
            }
            const savedImagePath = yield saveImageUrlToVault(card.imageUrl, vault, assetFolderPath, debug);
            localizedCards.push(Object.assign(Object.assign({}, card), { localImagePath: isURL(savedImagePath) ? undefined : normalizePath(savedImagePath) }));
        }
        return localizedCards;
    });
}
export function saveQuizletSetToVault(url_1, vault_1, folderPath_1) {
    return __awaiter(this, arguments, void 0, function* (url, vault, folderPath, saveAsSeparateNotes = false, saveImagesToVault = true, debug = false) {
        var _a, _b;
        const setId = parseQuizletSetId(url);
        if (!setId) {
            return { status: "not-quizlet" };
        }
        const fetchHeaders = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        };
        try {
            let cards = yield tryQuizletRestApi(setId, fetchHeaders);
            if (debug && cards.length > 0) {
                console.debug(`[I link therefore iframe] Quizlet REST API returned ${cards.length} cards for set:`, setId);
            }
            let html = null;
            if (cards.length === 0) {
                const flashcardsUrl = `https://quizlet.com/${setId}/flashcards`;
                const embedUrl = `https://quizlet.com/${setId}/flashcards/embed`;
                for (const fetchUrl of [url, flashcardsUrl, embedUrl]) {
                    try {
                        const resp = yield requestUrl({ url: fetchUrl, method: "GET", headers: fetchHeaders });
                        if (((_a = resp.headers["content-type"]) === null || _a === void 0 ? void 0 : _a.includes("text/html")) && resp.text) {
                            html = resp.text;
                            break;
                        }
                    }
                    catch ( /* Try next URL */_c) { /* Try next URL */ }
                }
                if (html) {
                    cards = parseQuizletCardsFromNextData(html);
                    if (cards.length === 0)
                        cards = parseQuizletCardsFromQuizletVars(html);
                    if (cards.length === 0)
                        cards = parseQuizletCardsFromHtml(html);
                    if (cards.length === 0)
                        cards = parseQuizletCardsFromScripts(html);
                    if (cards.length === 0)
                        cards = parseQuizletCardsFromVisibleText(html);
                }
            }
            if (cards.length === 0) {
                if (debug) {
                    console.debug("[I link therefore iframe] Could not find exportable Quizlet cards with any method for set:", setId);
                }
                return { status: html ? "no-cards" : "not-html" };
            }
            const title = (html ? quizletTitleFromHtml(html, "") : "") ||
                (yield tryQuizletSetTitleApi(setId, fetchHeaders)) ||
                `quizlet-${setId}`;
            if (!saveAsSeparateNotes) {
                const assetFolderPath = normalizePath(`${folderPath}/quizlet-${hashString(setId)}-assets`);
                const cardsWithImages = saveImagesToVault
                    ? yield localizeQuizletCardImages(cards, vault, assetFolderPath, debug)
                    : cards;
                const singleFileResult = yield saveQuizletSetAsSingleFile(vault, folderPath, title, setId, url, cardsWithImages);
                if (debug) {
                    console.debug("[I link therefore iframe] Quizlet single-file export completed:", {
                        setId,
                        filePath: singleFileResult.filePath,
                        status: singleFileResult.status,
                        cardCount: cards.length,
                    });
                }
                return singleFileResult;
            }
            const existingSetFolderPath = yield findExistingQuizletSetFolder(vault, folderPath, setId);
            const setFolderName = `${sanitizeFileName(title)}-${hashString(setId)}`;
            const setFolderPath = existingSetFolderPath !== null && existingSetFolderPath !== void 0 ? existingSetFolderPath : normalizePath(`${folderPath}/${setFolderName}`);
            yield ensureFolderExists(vault, setFolderPath);
            const cardsWithImages = saveImagesToVault
                ? yield localizeQuizletCardImages(cards, vault, setFolderPath, debug)
                : cards;
            const existingManagedFiles = vault
                .getMarkdownFiles()
                .filter((file) => file.path.startsWith(`${setFolderPath}/`));
            const filesByCardId = new Map();
            for (const file of existingManagedFiles) {
                try {
                    const content = yield vault.cachedRead(file);
                    const metadata = parseQuizletMetadata(content);
                    if (metadata.setId === setId && metadata.cardId) {
                        filesByCardId.set(metadata.cardId, file);
                    }
                }
                catch (_d) {
                    // Ignore unreadable files in the target folder.
                }
            }
            let createdCount = 0;
            let updatedCount = 0;
            let unchangedCount = 0;
            const currentCardIds = new Set();
            for (const [index, rawCard] of cardsWithImages.entries()) {
                const effectiveCardId = (_b = rawCard.cardId) !== null && _b !== void 0 ? _b : hashString(`${rawCard.term}\n${rawCard.definition}`);
                currentCardIds.add(effectiveCardId);
                const card = Object.assign(Object.assign({}, rawCard), { cardId: effectiveCardId });
                const existingFile = filesByCardId.get(effectiveCardId);
                if (existingFile) {
                    const existingContent = yield vault.cachedRead(existingFile);
                    const { frontmatter } = parseExistingFrontmatter(existingContent);
                    const userNotes = parseQuizletCardUserNotes(existingContent);
                    const nextContent = buildQuizletCardNoteContent(card, setId, url, frontmatter, userNotes);
                    if (existingContent !== nextContent) {
                        yield vault.modify(existingFile, nextContent);
                        updatedCount++;
                    }
                    else {
                        unchangedCount++;
                    }
                    continue;
                }
                const fileName = buildQuizletCardFileName(card, index, effectiveCardId);
                const filePath = normalizePath(`${setFolderPath}/${fileName}`);
                const content = buildQuizletCardNoteContent(card, setId, url);
                yield vault.create(filePath, content);
                createdCount++;
            }
            for (const [cardId, file] of filesByCardId.entries()) {
                if (currentCardIds.has(cardId)) {
                    continue;
                }
                const existingContent = yield vault.cachedRead(file);
                if (!existingContent.includes(QUIZLET_STALE_MARKER)) {
                    yield vault.modify(file, `${existingContent.trimEnd()}\n${QUIZLET_STALE_MARKER}\n`);
                    updatedCount++;
                }
            }
            if (debug) {
                console.debug("[I link therefore iframe] Quizlet card export completed:", {
                    setId,
                    setFolderPath,
                    createdCount,
                    updatedCount,
                    unchangedCount,
                    cardCount: cardsWithImages.length,
                });
            }
            if (createdCount > 0) {
                return {
                    status: updatedCount > 0 ? "updated" : "saved",
                    filePath: setFolderPath,
                    cardCount: cardsWithImages.length,
                    createdCount,
                    updatedCount,
                    unchangedCount,
                };
            }
            if (updatedCount > 0) {
                return {
                    status: "updated",
                    filePath: setFolderPath,
                    cardCount: cardsWithImages.length,
                    createdCount,
                    updatedCount,
                    unchangedCount,
                };
            }
            return {
                status: "unchanged",
                filePath: setFolderPath,
                cardCount: cardsWithImages.length,
                createdCount,
                updatedCount,
                unchangedCount,
            };
        }
        catch (error) {
            if (debug) {
                console.error("[I link therefore iframe] Failed to save Quizlet card export:", error);
            }
            return { status: "error" };
        }
    });
}
function parseQuizletSourceUrl(content) {
    const match = content.match(/<!--\s*quizlet:source=(.*?)\s*-->/i);
    if (!(match === null || match === void 0 ? void 0 : match[1])) {
        return null;
    }
    const sourceUrl = match[1].trim();
    return sourceUrl || null;
}
export function updateAllQuizletSetsFromStoredSources(vault_1, folderPath_1, saveAsSeparateNotes_1, saveImagesToVault_1) {
    return __awaiter(this, arguments, void 0, function* (vault, folderPath, saveAsSeparateNotes, saveImagesToVault, debug = false) {
        const files = vault.getMarkdownFiles();
        const uniqueSetSources = new Map();
        let sourceMentions = 0;
        for (const file of files) {
            let content = "";
            try {
                content = yield vault.cachedRead(file);
            }
            catch (_a) {
                continue;
            }
            const sourceUrl = parseQuizletSourceUrl(content);
            if (!sourceUrl) {
                continue;
            }
            sourceMentions++;
            const setId = parseQuizletSetId(sourceUrl);
            if (!setId) {
                continue;
            }
            if (!uniqueSetSources.has(setId)) {
                uniqueSetSources.set(setId, sourceUrl);
            }
        }
        const result = {
            scannedFiles: files.length,
            sourceMentions,
            uniqueSetCount: uniqueSetSources.size,
            refreshedSetCount: 0,
            savedCount: 0,
            updatedCount: 0,
            unchangedCount: 0,
            noCardsCount: 0,
            notHtmlCount: 0,
            errorCount: 0,
        };
        for (const sourceUrl of uniqueSetSources.values()) {
            const exportResult = yield saveQuizletSetToVault(sourceUrl, vault, folderPath, saveAsSeparateNotes, saveImagesToVault, debug);
            result.refreshedSetCount++;
            if (exportResult.status === "saved") {
                result.savedCount++;
            }
            else if (exportResult.status === "updated") {
                result.updatedCount++;
            }
            else if (exportResult.status === "unchanged") {
                result.unchangedCount++;
            }
            else if (exportResult.status === "no-cards") {
                result.noCardsCount++;
            }
            else if (exportResult.status === "not-html") {
                result.notHtmlCount++;
            }
            else if (exportResult.status === "error" || exportResult.status === "not-quizlet") {
                result.errorCount++;
            }
        }
        return result;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpemxldC51dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInF1aXpsZXQudXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBUyxNQUFNLFVBQVUsQ0FBQztBQUNuRSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUMzRyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQTBDeEQsTUFBTSx3QkFBd0IsR0FBRyxtQ0FBbUMsQ0FBQztBQUNyRSxNQUFNLHNCQUFzQixHQUFHLGlDQUFpQyxDQUFDO0FBQ2pFLE1BQU0sb0JBQW9CLEdBQUcsNkJBQTZCLENBQUM7QUFDM0QsTUFBTSxxQkFBcUIsR0FBRyxzQkFBc0IsQ0FBQztBQUNyRCxNQUFNLHVCQUF1QixHQUFHLGNBQWMsQ0FBQztBQUMvQyxNQUFNLHdCQUF3QixHQUFHLGVBQWUsQ0FBQztBQUVqRCxTQUFTLFlBQVksQ0FBQyxLQUFhO0lBQy9CLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBRUQsU0FBUyxTQUFTLENBQUMsS0FBYTtJQUM1QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakMsQ0FBQztBQUVELFNBQVMsc0JBQXNCLENBQUMsV0FBbUIsRUFBRSxHQUFXLEVBQUUsS0FBYTtJQUMzRSxNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDekMsTUFBTSxPQUFPLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxZQUFZLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNqRSxNQUFNLFdBQVcsR0FBRyxHQUFHLEdBQUcsS0FB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LENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBub3JtYWxpemVQYXRoLCByZXF1ZXN0VXJsLCBURmlsZSwgVmF1bHQgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHsgZW5zdXJlRm9sZGVyRXhpc3RzLCBoYXNoU3RyaW5nLCBpc1VSTCwgc2FuaXRpemVGaWxlTmFtZSwgc2F2ZUltYWdlVXJsVG9WYXVsdCB9IGZyb20gXCJzcmMvdXRpbGl0eVwiO1xyXG5pbXBvcnQgeyBwYXJzZVF1aXpsZXRTZXRJZCB9IGZyb20gXCJzcmMvdXRpbHMvdXJsLnV0aWxzXCI7XHJcblxyXG5pbnRlcmZhY2UgUXVpemxldENhcmQge1xyXG4gICAgY2FyZElkPzogc3RyaW5nO1xyXG4gICAgdGVybTogc3RyaW5nO1xyXG4gICAgZGVmaW5pdGlvbjogc3RyaW5nO1xyXG4gICAgaW1hZ2VVcmw/OiBzdHJpbmc7XHJcbiAgICBsb2NhbEltYWdlUGF0aD86IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIFBhcnNlZFF1aXpsZXRNZXRhZGF0YSB7XHJcbiAgICBzZXRJZD86IHN0cmluZztcclxuICAgIGNhcmRJZD86IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIFBhcnNlZFF1aXpsZXRDYXJkVXNlck5vdGVzIHtcclxuICAgIGZyb250OiBzdHJpbmc7XHJcbiAgICBiYWNrOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUXVpemxldEV4cG9ydFJlc3VsdCB7XHJcbiAgICBzdGF0dXM6IFwibm90LXF1aXpsZXRcIiB8IFwibm90LWh0bWxcIiB8IFwibm8tY2FyZHNcIiB8IFwic2F2ZWRcIiB8IFwidXBkYXRlZFwiIHwgXCJ1bmNoYW5nZWRcIiB8IFwiZXJyb3JcIjtcclxuICAgIGZpbGVQYXRoPzogc3RyaW5nO1xyXG4gICAgY2FyZENvdW50PzogbnVtYmVyO1xyXG4gICAgY3JlYXRlZENvdW50PzogbnVtYmVyO1xyXG4gICAgdXBkYXRlZENvdW50PzogbnVtYmVyO1xyXG4gICAgdW5jaGFuZ2VkQ291bnQ/OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUXVpemxldEJ1bGtVcGRhdGVSZXN1bHQge1xyXG4gICAgc2Nhbm5lZEZpbGVzOiBudW1iZXI7XHJcbiAgICBzb3VyY2VNZW50aW9uczogbnVtYmVyO1xyXG4gICAgdW5pcXVlU2V0Q291bnQ6IG51bWJlcjtcclxuICAgIHJlZnJlc2hlZFNldENvdW50OiBudW1iZXI7XHJcbiAgICBzYXZlZENvdW50OiBudW1iZXI7XHJcbiAgICB1cGRhdGVkQ291bnQ6IG51bWJlcjtcclxuICAgIHVuY2hhbmdlZENvdW50OiBudW1iZXI7XHJcbiAgICBub0NhcmRzQ291bnQ6IG51bWJlcjtcclxuICAgIG5vdEh0bWxDb3VudDogbnVtYmVyO1xyXG4gICAgZXJyb3JDb3VudDogbnVtYmVyO1xyXG59XHJcblxyXG5jb25zdCBRVUlaTEVUX1VTRVJfTk9URVNfU1RBUlQgPSBcIjwhLS0gcXVpemxldDp1c2VyLW5vdGVzOnN0YXJ0IC0tPlwiO1xyXG5jb25zdCBRVUlaTEVUX1VTRVJfTk9URVNfRU5EID0gXCI8IS0tIHF1aXpsZXQ6dXNlci1ub3RlczplbmQgLS0+XCI7XHJcbmNvbnN0IFFVSVpMRVRfU1RBTEVfTUFSS0VSID0gXCI8IS0tIHF1aXpsZXQ6c3RhbGU9dHJ1ZSAtLT5cIjtcclxuY29uc3QgUVVJWkxFVF9TT1VSQ0VfUFJFRklYID0gXCI8IS0tIHF1aXpsZXQ6c291cmNlPVwiO1xyXG5jb25zdCBRVUlaTEVUX1NFVF9JRF9QUk9QRVJUWSA9IFwiUXVpemxldFNldElkXCI7XHJcbmNvbnN0IFFVSVpMRVRfQ0FSRF9JRF9QUk9QRVJUWSA9IFwiUXVpemxldENhcmRJZFwiO1xyXG5cclxuZnVuY3Rpb24gZXNjYXBlUmVnRXhwKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcclxufVxyXG5cclxuZnVuY3Rpb24geWFtbFF1b3RlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdXBzZXJ0RnJvbnRtYXR0ZXJWYWx1ZShmcm9udG1hdHRlcjogc3RyaW5nLCBrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBub3JtYWxpemVkID0gZnJvbnRtYXR0ZXIudHJpbUVuZCgpO1xyXG4gICAgY29uc3QgcGF0dGVybiA9IG5ldyBSZWdFeHAoYF4ke2VzY2FwZVJlZ0V4cChrZXkpfTpcXFxccyouKiRgLCBcIm1cIik7XHJcbiAgICBjb25zdCByZXBsYWNlbWVudCA9IGAke2tleX06ICR7eWFtbFF1b3RlKHZhbHVlKX1gO1xyXG5cclxuICAgIGlmICghbm9ybWFsaXplZCkge1xyXG4gICAgICAgIHJldHVybiByZXBsYWNlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocGF0dGVybi50ZXN0KG5vcm1hbGl6ZWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQucmVwbGFjZShwYXR0ZXJuLCByZXBsYWNlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGAke25vcm1hbGl6ZWR9XFxuJHtyZXBsYWNlbWVudH1gO1xyXG59XHJcblxyXG5mdW5jdGlvbiB3aXRoUXVpemxldEZyb250bWF0dGVyUHJvcGVydGllcyhcclxuICAgIGZyb250bWF0dGVyOiBzdHJpbmcsXHJcbiAgICBtZXRhZGF0YTogeyBzZXRJZDogc3RyaW5nOyBjYXJkSWQ/OiBzdHJpbmcgfSxcclxuKTogc3RyaW5nIHtcclxuICAgIGxldCBuZXh0RnJvbnRtYXR0ZXIgPSB1cHNlcnRGcm9udG1hdHRlclZhbHVlKGZyb250bWF0dGVyLCBRVUlaTEVUX1NFVF9JRF9QUk9QRVJUWSwgbWV0YWRhdGEuc2V0SWQpO1xyXG4gICAgaWYgKG1ldGFkYXRhLmNhcmRJZCkge1xyXG4gICAgICAgIG5leHRGcm9udG1hdHRlciA9IHVwc2VydEZyb250bWF0dGVyVmFsdWUobmV4dEZyb250bWF0dGVyLCBRVUlaTEVUX0NBUkRfSURfUFJPUEVSVFksIG1ldGFkYXRhLmNhcmRJZCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV4dEZyb250bWF0dGVyO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWFkRnJvbnRtYXR0ZXJWYWx1ZShmcm9udG1hdHRlcjogc3RyaW5nLCBrZXk6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XHJcbiAgICBjb25zdCBtYXRjaCA9IGZyb250bWF0dGVyLm1hdGNoKG5ldyBSZWdFeHAoYF4ke2VzY2FwZVJlZ0V4cChrZXkpfTpcXFxccyooLispJGAsIFwibVwiKSk7XHJcbiAgICBpZiAoIW1hdGNoPy5bMV0pIHtcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJhd1ZhbHVlID0gbWF0Y2hbMV0udHJpbSgpO1xyXG4gICAgaWYgKCFyYXdWYWx1ZSkge1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKChyYXdWYWx1ZS5zdGFydHNXaXRoKCdcIicpICYmIHJhd1ZhbHVlLmVuZHNXaXRoKCdcIicpKSB8fCAocmF3VmFsdWUuc3RhcnRzV2l0aChcIidcIikgJiYgcmF3VmFsdWUuZW5kc1dpdGgoXCInXCIpKSkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHJhd1ZhbHVlLnJlcGxhY2UoL14nLywgJ1wiJykucmVwbGFjZSgvJyQvLCAnXCInKSk7XHJcbiAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgIHJldHVybiByYXdWYWx1ZS5zbGljZSgxLCAtMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByYXdWYWx1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRRdWl6bGV0U2luZ2xlRmlsZUNvbnRlbnQoXHJcbiAgICB0aXRsZTogc3RyaW5nLFxyXG4gICAgY2FyZHM6IFF1aXpsZXRDYXJkW10sXHJcbiAgICBzZXRJZDogc3RyaW5nLFxyXG4gICAgb3JpZ2luYWxVcmw6IHN0cmluZyxcclxuICAgIGZyb250bWF0dGVyID0gXCJcIixcclxuICAgIHVzZXJOb3RlcyA9IFwiXCIsXHJcbik6IHN0cmluZyB7XHJcbiAgICBjb25zdCBsaW5lczogc3RyaW5nW10gPSBbXTtcclxuICAgIGNvbnN0IG1hbmFnZWRGcm9udG1hdHRlciA9IHdpdGhRdWl6bGV0RnJvbnRtYXR0ZXJQcm9wZXJ0aWVzKGZyb250bWF0dGVyLCB7XHJcbiAgICAgICAgc2V0SWQsXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAobWFuYWdlZEZyb250bWF0dGVyLnRyaW0oKSkge1xyXG4gICAgICAgIGxpbmVzLnB1c2goXCItLS1cIik7XHJcbiAgICAgICAgbGluZXMucHVzaChtYW5hZ2VkRnJvbnRtYXR0ZXIudHJpbUVuZCgpKTtcclxuICAgICAgICBsaW5lcy5wdXNoKFwiLS0tXCIpO1xyXG4gICAgICAgIGxpbmVzLnB1c2goXCJcIik7XHJcbiAgICB9XHJcblxyXG4gICAgbGluZXMucHVzaChgIyAke3RpdGxlfWApO1xyXG4gICAgbGluZXMucHVzaChcIlwiKTtcclxuICAgIGxpbmVzLnB1c2goYCoqU291cmNlOioqICR7b3JpZ2luYWxVcmx9ICBgKTtcclxuICAgIGxpbmVzLnB1c2goYCoqQ2FyZHM6KiogJHtjYXJkcy5sZW5ndGh9YCk7XHJcbiAgICBsaW5lcy5wdXNoKFwiXCIpO1xyXG4gICAgbGluZXMucHVzaChcIi0tLVwiKTtcclxuICAgIGxpbmVzLnB1c2goXCJcIik7XHJcblxyXG4gICAgZm9yIChjb25zdCBjYXJkIG9mIGNhcmRzKSB7XHJcbiAgICAgICAgbGluZXMucHVzaChgKioke2NhcmQudGVybX0qKmApO1xyXG4gICAgICAgIGxpbmVzLnB1c2goY2FyZC5kZWZpbml0aW9uKTtcclxuICAgICAgICBpZiAoY2FyZC5sb2NhbEltYWdlUGF0aCkge1xyXG4gICAgICAgICAgICBsaW5lcy5wdXNoKFwiXCIpO1xyXG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAhW1ske2NhcmQubG9jYWxJbWFnZVBhdGh9XV1gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGluZXMucHVzaChcIlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBsaW5lcy5wdXNoKGAke1FVSVpMRVRfU09VUkNFX1BSRUZJWH0ke29yaWdpbmFsVXJsfSAtLT5gKTtcclxuICAgIGxpbmVzLnB1c2goUVVJWkxFVF9VU0VSX05PVEVTX1NUQVJUKTtcclxuICAgIGlmICh1c2VyTm90ZXMudHJpbSgpKSB7XHJcbiAgICAgICAgbGluZXMucHVzaCh1c2VyTm90ZXMudHJpbUVuZCgpKTtcclxuICAgIH1cclxuICAgIGxpbmVzLnB1c2goUVVJWkxFVF9VU0VSX05PVEVTX0VORCk7XHJcbiAgICBsaW5lcy5wdXNoKFwiXCIpO1xyXG5cclxuICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzYXZlUXVpemxldFNldEFzU2luZ2xlRmlsZShcclxuICAgIHZhdWx0OiBWYXVsdCxcclxuICAgIGZvbGRlclBhdGg6IHN0cmluZyxcclxuICAgIHRpdGxlOiBzdHJpbmcsXHJcbiAgICBzZXRJZDogc3RyaW5nLFxyXG4gICAgb3JpZ2luYWxVcmw6IHN0cmluZyxcclxuICAgIGNhcmRzOiBRdWl6bGV0Q2FyZFtdLFxyXG4pOiBQcm9taXNlPFF1aXpsZXRFeHBvcnRSZXN1bHQ+IHtcclxuICAgIGF3YWl0IGVuc3VyZUZvbGRlckV4aXN0cyh2YXVsdCwgZm9sZGVyUGF0aCk7XHJcblxyXG4gICAgY29uc3QgZmlsZVBhdGggPSBub3JtYWxpemVQYXRoKGAke2ZvbGRlclBhdGh9LyR7c2FuaXRpemVGaWxlTmFtZSh0aXRsZSl9LSR7aGFzaFN0cmluZyhzZXRJZCl9Lm1kYCk7XHJcbiAgICBjb25zdCBleGlzdGluZ0ZpbGUgPSBhd2FpdCBmaW5kRXhpc3RpbmdRdWl6bGV0U2luZ2xlRmlsZSh2YXVsdCwgZm9sZGVyUGF0aCwgc2V0SWQpID8/IHZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmaWxlUGF0aCk7XHJcblxyXG4gICAgaWYgKGV4aXN0aW5nRmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XHJcbiAgICAgICAgY29uc3QgZXhpc3RpbmdDb250ZW50ID0gYXdhaXQgdmF1bHQuY2FjaGVkUmVhZChleGlzdGluZ0ZpbGUpO1xyXG4gICAgICAgIGNvbnN0IHsgZnJvbnRtYXR0ZXIgfSA9IHBhcnNlRXhpc3RpbmdGcm9udG1hdHRlcihleGlzdGluZ0NvbnRlbnQpO1xyXG4gICAgICAgIGNvbnN0IHVzZXJOb3RlcyA9IHBhcnNlUXVpemxldFVzZXJOb3RlcyhleGlzdGluZ0NvbnRlbnQpO1xyXG4gICAgICAgIGNvbnN0IG5leHRDb250ZW50ID0gYnVpbGRRdWl6bGV0U2luZ2xlRmlsZUNvbnRlbnQodGl0bGUsIGNhcmRzLCBzZXRJZCwgb3JpZ2luYWxVcmwsIGZyb250bWF0dGVyLCB1c2VyTm90ZXMpO1xyXG4gICAgICAgIGlmIChleGlzdGluZ0NvbnRlbnQgIT09IG5leHRDb250ZW50KSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHZhdWx0Lm1vZGlmeShleGlzdGluZ0ZpbGUsIG5leHRDb250ZW50KTtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHN0YXR1czogXCJ1cGRhdGVkXCIsXHJcbiAgICAgICAgICAgICAgICBmaWxlUGF0aDogZXhpc3RpbmdGaWxlLnBhdGgsXHJcbiAgICAgICAgICAgICAgICBjYXJkQ291bnQ6IGNhcmRzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGNyZWF0ZWRDb3VudDogMCxcclxuICAgICAgICAgICAgICAgIHVwZGF0ZWRDb3VudDogMSxcclxuICAgICAgICAgICAgICAgIHVuY2hhbmdlZENvdW50OiAwLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3RhdHVzOiBcInVuY2hhbmdlZFwiLFxyXG4gICAgICAgICAgICBmaWxlUGF0aDogZXhpc3RpbmdGaWxlLnBhdGgsXHJcbiAgICAgICAgICAgIGNhcmRDb3VudDogY2FyZHMubGVuZ3RoLFxyXG4gICAgICAgICAgICBjcmVhdGVkQ291bnQ6IDAsXHJcbiAgICAgICAgICAgIHVwZGF0ZWRDb3VudDogMCxcclxuICAgICAgICAgICAgdW5jaGFuZ2VkQ291bnQ6IDEsXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjb250ZW50ID0gYnVpbGRRdWl6bGV0U2luZ2xlRmlsZUNvbnRlbnQodGl0bGUsIGNhcmRzLCBzZXRJZCwgb3JpZ2luYWxVcmwpO1xyXG4gICAgYXdhaXQgdmF1bHQuY3JlYXRlKGZpbGVQYXRoLCBjb250ZW50KTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RhdHVzOiBcInNhdmVkXCIsXHJcbiAgICAgICAgZmlsZVBhdGgsXHJcbiAgICAgICAgY2FyZENvdW50OiBjYXJkcy5sZW5ndGgsXHJcbiAgICAgICAgY3JlYXRlZENvdW50OiAxLFxyXG4gICAgICAgIHVwZGF0ZWRDb3VudDogMCxcclxuICAgICAgICB1bmNoYW5nZWRDb3VudDogMCxcclxuICAgIH07XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZpbmRFeGlzdGluZ1F1aXpsZXRTaW5nbGVGaWxlKHZhdWx0OiBWYXVsdCwgZm9sZGVyUGF0aDogc3RyaW5nLCBzZXRJZDogc3RyaW5nKTogUHJvbWlzZTxURmlsZSB8IG51bGw+IHtcclxuICAgIGNvbnN0IG5vcm1hbGl6ZWRGb2xkZXJQYXRoID0gbm9ybWFsaXplUGF0aChmb2xkZXJQYXRoKTtcclxuICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSB2YXVsdC5nZXRNYXJrZG93bkZpbGVzKCkuZmlsdGVyKGZpbGUgPT4gZmlsZS5wYXJlbnQ/LnBhdGggPT09IG5vcm1hbGl6ZWRGb2xkZXJQYXRoKTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgY2FuZGlkYXRlcykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB2YXVsdC5jYWNoZWRSZWFkKGZpbGUpO1xyXG4gICAgICAgICAgICBjb25zdCBtZXRhZGF0YSA9IHBhcnNlUXVpemxldE1ldGFkYXRhKGNvbnRlbnQpO1xyXG4gICAgICAgICAgICBpZiAobWV0YWRhdGEuc2V0SWQgPT09IHNldElkICYmICFtZXRhZGF0YS5jYXJkSWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgIC8vIElnbm9yZSB1bnJlYWRhYmxlIGZpbGVzIHdoaWxlIGxvb2tpbmcgZm9yIGFuIGV4aXN0aW5nIHNpbmdsZS1maWxlIGV4cG9ydC5cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0cmlwSHRtbFRhZ3ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0ZXh0XHJcbiAgICAgICAgLnJlcGxhY2UoLzxbXj5dKz4vZywgXCIgXCIpXHJcbiAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXHJcbiAgICAgICAgLnRyaW0oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbm9ybWFsaXplUXVpemxldFRleHQodmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzdHJpcEh0bWxUYWdzKFxyXG4gICAgICAgIHZhbHVlXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC8mbmJzcDsvZywgXCIgXCIpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC8mYW1wOy9nLCBcIiZcIilcclxuICAgICAgICAgICAgLnJlcGxhY2UoLyZsdDsvZywgXCI8XCIpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC8mIzM5Oy9nLCBcIidcIilcclxuICAgICAgICAgICAgLnRyaW0oKSxcclxuICAgICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHB1c2hRdWl6bGV0Q2FyZChjYXJkczogUXVpemxldENhcmRbXSwgdGVybVZhbHVlOiB1bmtub3duLCBkZWZpbml0aW9uVmFsdWU6IHVua25vd24pIHtcclxuICAgIGNvbnN0IHRlcm0gPSBub3JtYWxpemVRdWl6bGV0VGV4dCh0ZXJtVmFsdWUpO1xyXG4gICAgY29uc3QgZGVmaW5pdGlvbiA9IG5vcm1hbGl6ZVF1aXpsZXRUZXh0KGRlZmluaXRpb25WYWx1ZSk7XHJcblxyXG4gICAgaWYgKCF0ZXJtIHx8ICFkZWZpbml0aW9uKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNhcmRzLnB1c2goeyB0ZXJtLCBkZWZpbml0aW9uIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb2xsZWN0UXVpemxldENhcmRzKHZhbHVlOiB1bmtub3duLCBjYXJkczogUXVpemxldENhcmRbXSk6IHZvaWQge1xyXG4gICAgaWYgKCF2YWx1ZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdmFsdWUpIHtcclxuICAgICAgICAgICAgY29sbGVjdFF1aXpsZXRDYXJkcyhpdGVtLCBjYXJkcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG9iaiA9IHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG5cclxuICAgIHB1c2hRdWl6bGV0Q2FyZChjYXJkcywgb2JqLnRlcm0sIG9iai5kZWZpbml0aW9uKTtcclxuICAgIHB1c2hRdWl6bGV0Q2FyZChjYXJkcywgb2JqLndvcmQsIG9iai5kZWZpbml0aW9uKTtcclxuXHJcbiAgICBjb25zdCBxdWVzdGlvblRleHQgPVxyXG4gICAgICAgIChvYmoudGV4dCBhcyBzdHJpbmcgfCB1bmRlZmluZWQpIHx8XHJcbiAgICAgICAgKG9iai5uYW1lIGFzIHN0cmluZyB8IHVuZGVmaW5lZCkgfHxcclxuICAgICAgICAob2JqLnF1ZXN0aW9uIGFzIHN0cmluZyB8IHVuZGVmaW5lZCk7XHJcblxyXG4gICAgbGV0IGFuc3dlclRleHQ6IHVua25vd24gPSB1bmRlZmluZWQ7XHJcbiAgICBpZiAodHlwZW9mIG9iai5hY2NlcHRlZEFuc3dlciA9PT0gXCJvYmplY3RcIiAmJiBvYmouYWNjZXB0ZWRBbnN3ZXIpIHtcclxuICAgICAgICBhbnN3ZXJUZXh0ID0gKG9iai5hY2NlcHRlZEFuc3dlciBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikudGV4dDtcclxuICAgIH1cclxuICAgIGlmICghYW5zd2VyVGV4dCAmJiB0eXBlb2Ygb2JqLnN1Z2dlc3RlZEFuc3dlciA9PT0gXCJvYmplY3RcIiAmJiBvYmouc3VnZ2VzdGVkQW5zd2VyKSB7XHJcbiAgICAgICAgYW5zd2VyVGV4dCA9IChvYmouc3VnZ2VzdGVkQW5zd2VyIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KS50ZXh0O1xyXG4gICAgfVxyXG4gICAgaWYgKCFhbnN3ZXJUZXh0ICYmIHR5cGVvZiBvYmouYW5zd2VyID09PSBcIm9iamVjdFwiICYmIG9iai5hbnN3ZXIpIHtcclxuICAgICAgICBhbnN3ZXJUZXh0ID0gKG9iai5hbnN3ZXIgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pLnRleHQ7XHJcbiAgICB9XHJcbiAgICBpZiAoIWFuc3dlclRleHQpIHtcclxuICAgICAgICBhbnN3ZXJUZXh0ID0gb2JqLmRlc2NyaXB0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIHB1c2hRdWl6bGV0Q2FyZChjYXJkcywgcXVlc3Rpb25UZXh0LCBhbnN3ZXJUZXh0KTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IG5lc3RlZFZhbHVlIG9mIE9iamVjdC52YWx1ZXMob2JqKSkge1xyXG4gICAgICAgIGNvbGxlY3RRdWl6bGV0Q2FyZHMobmVzdGVkVmFsdWUsIGNhcmRzKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGVkdXBlUXVpemxldENhcmRzKGNhcmRzOiBRdWl6bGV0Q2FyZFtdKTogUXVpemxldENhcmRbXSB7XHJcbiAgICBjb25zdCBkZWR1cGVkID0gbmV3IE1hcDxzdHJpbmcsIFF1aXpsZXRDYXJkPigpO1xyXG4gICAgZm9yIChjb25zdCBjYXJkIG9mIGNhcmRzKSB7XHJcbiAgICAgICAgY29uc3Qga2V5ID0gYCR7Y2FyZC50ZXJtfVxcbiR7Y2FyZC5kZWZpbml0aW9ufWAudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICBpZiAoIWRlZHVwZWQuaGFzKGtleSkpIHtcclxuICAgICAgICAgICAgZGVkdXBlZC5zZXQoa2V5LCBjYXJkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gQXJyYXkuZnJvbShkZWR1cGVkLnZhbHVlcygpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VRdWl6bGV0Q2FyZHNGcm9tSHRtbChodG1sOiBzdHJpbmcpOiBRdWl6bGV0Q2FyZFtdIHtcclxuICAgIGNvbnN0IGNhcmRzOiBRdWl6bGV0Q2FyZFtdID0gW107XHJcbiAgICBjb25zdCBzY3JpcHRSZWdleCA9IC88c2NyaXB0W14+XSp0eXBlPVtcIiddYXBwbGljYXRpb25cXC9sZFxcK2pzb25bXCInXVtePl0qPihbXFxzXFxTXSo/KTxcXC9zY3JpcHQ+L2dpO1xyXG5cclxuICAgIGxldCBtYXRjaDogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcclxuICAgIHdoaWxlICgobWF0Y2ggPSBzY3JpcHRSZWdleC5leGVjKGh0bWwpKSAhPT0gbnVsbCkge1xyXG4gICAgICAgIGNvbnN0IHJhdyA9IChtYXRjaFsxXSB8fCBcIlwiKS50cmltKCk7XHJcbiAgICAgICAgaWYgKCFyYXcpIHtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdyk7XHJcbiAgICAgICAgICAgIGNvbGxlY3RRdWl6bGV0Q2FyZHMocGFyc2VkLCBjYXJkcyk7XHJcbiAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgIC8vIElnbm9yZSBtYWxmb3JtZWQganNvbi1sZCBibG9ja3MuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBkZWR1cGVRdWl6bGV0Q2FyZHMoY2FyZHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZUpzb25Fc2NhcGVkU3RyaW5nKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShgXCIke3ZhbHVlLnJlcGxhY2UoL1xcXFwvZywgXCJcXFxcXFxcXFwiKS5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJyl9XCJgKTtcclxuICAgIH0gY2F0Y2gge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VRdWl6bGV0Q2FyZHNGcm9tU2NyaXB0cyhodG1sOiBzdHJpbmcpOiBRdWl6bGV0Q2FyZFtdIHtcclxuICAgIGNvbnN0IGNhcmRzOiBRdWl6bGV0Q2FyZFtdID0gW107XHJcbiAgICBjb25zdCBzY3JpcHRzID0gaHRtbC5tYXRjaCgvPHNjcmlwdFtePl0qPihbXFxzXFxTXSo/KTxcXC9zY3JpcHQ+L2dpKSA/PyBbXTtcclxuXHJcbiAgICBjb25zdCBwYWlyUGF0dGVybnMgPSBbXHJcbiAgICAgICAgL1widGVybVwiXFxzKjpcXHMqXCIoKD86XFxcXC58W15cIlxcXFxdKSspXCJbXFxzXFxTXXswLDEwMDB9P1wiZGVmaW5pdGlvblwiXFxzKjpcXHMqXCIoKD86XFxcXC58W15cIlxcXFxdKSspXCIvZyxcclxuICAgICAgICAvXCJ3b3JkXCJcXHMqOlxccypcIigoPzpcXFxcLnxbXlwiXFxcXF0pKylcIltcXHNcXFNdezAsMTAwMH0/XCJkZWZpbml0aW9uXCJcXHMqOlxccypcIigoPzpcXFxcLnxbXlwiXFxcXF0pKylcIi9nLFxyXG4gICAgICAgIC9cIndvcmRcIlxccyo6XFxzKlxce1tcXHNcXFNdezAsODB9P1widGV4dFwiXFxzKjpcXHMqXCIoKD86XFxcXC58W15cIlxcXFxdKSspXCJbXFxzXFxTXXswLDUwMH0/XCJkZWZpbml0aW9uXCJcXHMqOlxccypcXHtbXFxzXFxTXXswLDgwfT9cInRleHRcIlxccyo6XFxzKlwiKCg/OlxcXFwufFteXCJcXFxcXSkrKVwiL2csXHJcbiAgICBdO1xyXG5cclxuICAgIGZvciAoY29uc3Qgc2NyaXB0VGFnIG9mIHNjcmlwdHMpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGFpclBhdHRlcm5zKSB7XHJcbiAgICAgICAgICAgIGxldCBtYXRjaDogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcclxuICAgICAgICAgICAgd2hpbGUgKChtYXRjaCA9IHBhdHRlcm4uZXhlYyhzY3JpcHRUYWcpKSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGVybSA9IG5vcm1hbGl6ZVF1aXpsZXRUZXh0KHBhcnNlSnNvbkVzY2FwZWRTdHJpbmcobWF0Y2hbMV0gfHwgXCJcIikpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVmaW5pdGlvbiA9IG5vcm1hbGl6ZVF1aXpsZXRUZXh0KHBhcnNlSnNvbkVzY2FwZWRTdHJpbmcobWF0Y2hbMl0gfHwgXCJcIikpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRlcm0gJiYgZGVmaW5pdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhcmRzLnB1c2goeyB0ZXJtLCBkZWZpbml0aW9uIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBkZWR1cGVRdWl6bGV0Q2FyZHMoY2FyZHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBRdWl6bGV0U3R1ZGlhYmxlSXRlbXMoaXRlbXM6IHVua25vd25bXSk6IFF1aXpsZXRDYXJkW10ge1xyXG4gICAgY29uc3QgY2FyZHM6IFF1aXpsZXRDYXJkW10gPSBbXTtcclxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgaXRlbSAhPT0gXCJvYmplY3RcIiB8fCAhaXRlbSkgY29udGludWU7XHJcbiAgICAgICAgY29uc3Qgb2JqID0gaXRlbSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkob2JqLmNhcmRTaWRlcykpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICBsZXQgdGVybSA9IFwiXCI7XHJcbiAgICAgICAgbGV0IGRlZmluaXRpb24gPSBcIlwiO1xyXG4gICAgICAgIGxldCBpbWFnZVVybDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIGZvciAoY29uc3Qgc2lkZSBvZiBvYmouY2FyZFNpZGVzIGFzIHVua25vd25bXSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNpZGUgIT09IFwib2JqZWN0XCIgfHwgIXNpZGUpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBjb25zdCBzID0gc2lkZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHMubWVkaWEpKSBjb250aW51ZTtcclxuICAgICAgICAgICAgZm9yIChjb25zdCBtZWQgb2Ygcy5tZWRpYSBhcyB1bmtub3duW10pIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWVkICE9PSBcIm9iamVjdFwiIHx8ICFtZWQpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbSA9IG1lZCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICAgICAgICAgICAgICAgIGlmICghaW1hZ2VVcmwgJiYgKG0udHlwZSA9PT0gMiB8fCBtLnR5cGUgPT09IDUpICYmIHR5cGVvZiBtLnVybCA9PT0gXCJzdHJpbmdcIiAmJiBtLnVybCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGltYWdlVXJsID0gbS51cmw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobS50eXBlICE9PSAxKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBub3JtYWxpemVRdWl6bGV0VGV4dChtLnBsYWluVGV4dCA/PyBcIlwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChzLmxhYmVsID09PSBcIndvcmRcIiAmJiB0ZXh0KSB0ZXJtID0gdGV4dDtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHMubGFiZWwgPT09IFwiZGVmaW5pdGlvblwiICYmIHRleHQpIGRlZmluaXRpb24gPSB0ZXh0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHJhd0NhcmRJZCA9IHR5cGVvZiBvYmouaWQgPT09IFwibnVtYmVyXCIgfHwgdHlwZW9mIG9iai5pZCA9PT0gXCJzdHJpbmdcIlxyXG4gICAgICAgICAgICA/IFN0cmluZyhvYmouaWQpXHJcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xyXG4gICAgICAgIGlmICh0ZXJtICYmIGRlZmluaXRpb24pIGNhcmRzLnB1c2goeyBjYXJkSWQ6IHJhd0NhcmRJZCwgdGVybSwgZGVmaW5pdGlvbiwgaW1hZ2VVcmwgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGRlZHVwZVF1aXpsZXRDYXJkcyhjYXJkcyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGV4dHJhY3RTdHVkaWFibGVJdGVtcyhvYmo6IHVua25vd24sIGRlcHRoID0gMCk6IHVua25vd25bXSB8IG51bGwge1xyXG4gICAgaWYgKGRlcHRoID4gMTIgfHwgIW9iaiB8fCB0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgaWYgKG9iai5sZW5ndGggPiAwICYmIHR5cGVvZiBvYmpbMF0gPT09IFwib2JqZWN0XCIgJiYgb2JqWzBdICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpcnN0ID0gb2JqWzBdIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShmaXJzdC5jYXJkU2lkZXMpKSByZXR1cm4gb2JqO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygb2JqKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gZXh0cmFjdFN0dWRpYWJsZUl0ZW1zKGl0ZW0sIGRlcHRoICsgMSk7XHJcbiAgICAgICAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGZvdW5kO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZWNvcmQgPSBvYmogYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBbXCJzdHVkaWFibGVJdGVtc1wiLCBcInN0dWRpYWJsZUl0ZW1cIl0pIHtcclxuICAgICAgICBjb25zdCB2YWwgPSByZWNvcmRba2V5XTtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpICYmIHZhbC5sZW5ndGggPiAwKSByZXR1cm4gdmFsIGFzIHVua25vd25bXTtcclxuICAgIH1cclxuICAgIGZvciAoY29uc3QgdmFsIG9mIE9iamVjdC52YWx1ZXMocmVjb3JkKSkge1xyXG4gICAgICAgIGNvbnN0IGZvdW5kID0gZXh0cmFjdFN0dWRpYWJsZUl0ZW1zKHZhbCwgZGVwdGggKyAxKTtcclxuICAgICAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZDtcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZVF1aXpsZXRDYXJkc0Zyb21OZXh0RGF0YShodG1sOiBzdHJpbmcpOiBRdWl6bGV0Q2FyZFtdIHtcclxuICAgIGNvbnN0IG5leHREYXRhTWF0Y2ggPSBodG1sLm1hdGNoKC88c2NyaXB0W14+XSppZD1bXCInXV9fTkVYVF9EQVRBX19bXCInXVtePl0qPihbXFxzXFxTXSo/KTxcXC9zY3JpcHQ+L2kpO1xyXG4gICAgaWYgKCFuZXh0RGF0YU1hdGNoPy5bMV0pIHJldHVybiBbXTtcclxuXHJcbiAgICBsZXQgZGF0YTogdW5rbm93bjtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UobmV4dERhdGFNYXRjaFsxXS50cmltKCkpO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHRyeURlaHlkcmF0ZWQgPSAob2JqOiB1bmtub3duLCBkID0gMCk6IHVua25vd25bXSB8IG51bGwgPT4ge1xyXG4gICAgICAgIGlmIChkID4gOCB8fCB0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiIHx8ICFvYmopIHJldHVybiBudWxsO1xyXG4gICAgICAgIGNvbnN0IHJlY29yZCA9IG9iaiBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICAgICAgICBpZiAodHlwZW9mIHJlY29yZC5kZWh5ZHJhdGVkUmVkdXhTdGF0ZUtleSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5uZXI6IHVua25vd24gPSBKU09OLnBhcnNlKEpTT04ucGFyc2UocmVjb3JkLmRlaHlkcmF0ZWRSZWR1eFN0YXRlS2V5KSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtcyA9IGV4dHJhY3RTdHVkaWFibGVJdGVtcyhpbm5lcik7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbXMgJiYgaXRlbXMubGVuZ3RoID4gMCkgcmV0dXJuIGl0ZW1zO1xyXG4gICAgICAgICAgICB9IGNhdGNoIHsgLyogY29udGludWUgKi8gfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGNvbnN0IHZhbCBvZiBPYmplY3QudmFsdWVzKHJlY29yZCkpIHtcclxuICAgICAgICAgICAgY29uc3QgZm91bmQgPSB0cnlEZWh5ZHJhdGVkKHZhbCwgZCArIDEpO1xyXG4gICAgICAgICAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGRlaHlkcmF0ZWRJdGVtcyA9IHRyeURlaHlkcmF0ZWQoZGF0YSk7XHJcbiAgICBpZiAoZGVoeWRyYXRlZEl0ZW1zICYmIGRlaHlkcmF0ZWRJdGVtcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY29uc3QgbWFwcGVkID0gbWFwUXVpemxldFN0dWRpYWJsZUl0ZW1zKGRlaHlkcmF0ZWRJdGVtcyk7XHJcbiAgICAgICAgaWYgKG1hcHBlZC5sZW5ndGggPiAwKSByZXR1cm4gbWFwcGVkO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGRpcmVjdEl0ZW1zID0gZXh0cmFjdFN0dWRpYWJsZUl0ZW1zKGRhdGEpO1xyXG4gICAgaWYgKGRpcmVjdEl0ZW1zICYmIGRpcmVjdEl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBjb25zdCBtYXBwZWQgPSBtYXBRdWl6bGV0U3R1ZGlhYmxlSXRlbXMoZGlyZWN0SXRlbXMpO1xyXG4gICAgICAgIGlmIChtYXBwZWQubGVuZ3RoID4gMCkgcmV0dXJuIG1hcHBlZDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjYXJkczogUXVpemxldENhcmRbXSA9IFtdO1xyXG4gICAgY29sbGVjdFF1aXpsZXRDYXJkcyhkYXRhLCBjYXJkcyk7XHJcbiAgICByZXR1cm4gZGVkdXBlUXVpemxldENhcmRzKGNhcmRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VRdWl6bGV0Q2FyZHNGcm9tUXVpemxldFZhcnMoaHRtbDogc3RyaW5nKTogUXVpemxldENhcmRbXSB7XHJcbiAgICBjb25zdCBwYXR0ZXJucyA9IFtcclxuICAgICAgICAvd2luZG93XFwuUXVpemxldFxcW1wic2V0UGFnZURhdGFcIlxcXVxccyo9XFxzKihbXFxzXFxTXSs/KTtcXHMqUUxvYWRcXChcIlF1aXpsZXRcXC5zZXRQYWdlRGF0YVwiXFwpLyxcclxuICAgICAgICAvd2luZG93XFwuUXVpemxldFxcW1wiY2FyZHNNb2RlRGF0YVwiXFxdXFxzKj1cXHMqKFtcXHNcXFNdKz8pO1xccypRTG9hZFxcKFwiUXVpemxldFxcLmNhcmRzTW9kZURhdGFcIlxcKS8sXHJcbiAgICAgICAgL3dpbmRvd1xcLlF1aXpsZXRcXFtcImFzc2lzdGFudE1vZGVEYXRhXCJcXF1cXHMqPVxccyooW1xcc1xcU10rPyk7XFxzKlFMb2FkXFwoXCJRdWl6bGV0XFwuYXNzaXN0YW50TW9kZURhdGFcIlxcKS8sXHJcbiAgICBdO1xyXG5cclxuICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucykge1xyXG4gICAgICAgIGNvbnN0IG0gPSBodG1sLm1hdGNoKHBhdHRlcm4pO1xyXG4gICAgICAgIGlmICghbT8uWzFdKSBjb250aW51ZTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhOiB1bmtub3duID0gSlNPTi5wYXJzZShtWzFdLnRyaW0oKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gZXh0cmFjdFN0dWRpYWJsZUl0ZW1zKGRhdGEpO1xyXG4gICAgICAgICAgICBpZiAoaXRlbXMgJiYgaXRlbXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWFwcGVkID0gbWFwUXVpemxldFN0dWRpYWJsZUl0ZW1zKGl0ZW1zKTtcclxuICAgICAgICAgICAgICAgIGlmIChtYXBwZWQubGVuZ3RoID4gMCkgcmV0dXJuIG1hcHBlZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBmYWxsYmFja0NhcmRzOiBRdWl6bGV0Q2FyZFtdID0gW107XHJcbiAgICAgICAgICAgIGNvbGxlY3RRdWl6bGV0Q2FyZHMoZGF0YSwgZmFsbGJhY2tDYXJkcyk7XHJcbiAgICAgICAgICAgIGlmIChmYWxsYmFja0NhcmRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkZWR1cGVRdWl6bGV0Q2FyZHMoZmFsbGJhY2tDYXJkcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIHsgLyogVHJ5IG5leHQgcGF0dGVybiAqLyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gW107XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHRyeVF1aXpsZXRSZXN0QXBpKHNldElkOiBzdHJpbmcsIGZldGNoSGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IFByb21pc2U8UXVpemxldENhcmRbXT4ge1xyXG4gICAgY29uc3QgYXBpVXJsID1cclxuICAgICAgICBgaHR0cHM6Ly9xdWl6bGV0LmNvbS93ZWJhcGkvMy45L3N0dWRpYWJsZS1pdGVtLWRvY3VtZW50c2AgK1xyXG4gICAgICAgIGA/ZmlsdGVycyU1QnN0dWRpYWJsZUNvbnRhaW5lcklkJTVEPSR7c2V0SWR9YCArXHJcbiAgICAgICAgYCZmaWx0ZXJzJTVCc3R1ZGlhYmxlQ29udGFpbmVyVHlwZSU1RD0xJnBlclBhZ2U9MTAwMCZwYWdlPTFgO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCByZXNwID0gYXdhaXQgcmVxdWVzdFVybCh7XHJcbiAgICAgICAgICAgIHVybDogYXBpVXJsLFxyXG4gICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgLi4uZmV0Y2hIZWFkZXJzLCBcIkFjY2VwdFwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IGN0ID0gcmVzcC5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdID8/IFwiXCI7XHJcbiAgICAgICAgaWYgKCFjdC5pbmNsdWRlcyhcImpzb25cIikpIHJldHVybiBbXTtcclxuICAgICAgICBjb25zdCBkYXRhOiB1bmtub3duID0gcmVzcC5qc29uID8/IEpTT04ucGFyc2UocmVzcC50ZXh0KTtcclxuICAgICAgICBjb25zdCBpdGVtcyA9IGV4dHJhY3RTdHVkaWFibGVJdGVtcyhkYXRhKTtcclxuICAgICAgICBpZiAoaXRlbXMgJiYgaXRlbXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBtYXBwZWQgPSBtYXBRdWl6bGV0U3R1ZGlhYmxlSXRlbXMoaXRlbXMpO1xyXG4gICAgICAgICAgICBpZiAobWFwcGVkLmxlbmd0aCA+IDApIHJldHVybiBtYXBwZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGZhbGxiYWNrQ2FyZHM6IFF1aXpsZXRDYXJkW10gPSBbXTtcclxuICAgICAgICBjb2xsZWN0UXVpemxldENhcmRzKGRhdGEsIGZhbGxiYWNrQ2FyZHMpO1xyXG4gICAgICAgIHJldHVybiBkZWR1cGVRdWl6bGV0Q2FyZHMoZmFsbGJhY2tDYXJkcyk7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHRyeVF1aXpsZXRTZXRUaXRsZUFwaShzZXRJZDogc3RyaW5nLCBmZXRjaEhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcclxuICAgIGNvbnN0IGFwaVVybCA9IGBodHRwczovL3F1aXpsZXQuY29tL3dlYmFwaS8zLjkvc2V0cy8ke3NldElkfWA7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCByZXF1ZXN0VXJsKHtcclxuICAgICAgICAgICAgdXJsOiBhcGlVcmwsXHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcclxuICAgICAgICAgICAgaGVhZGVyczogeyAuLi5mZXRjaEhlYWRlcnMsIFwiQWNjZXB0XCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc3QgY3QgPSByZXNwLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl0gPz8gXCJcIjtcclxuICAgICAgICBpZiAoIWN0LmluY2x1ZGVzKFwianNvblwiKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgY29uc3QgZGF0YSA9IChyZXNwLmpzb24gPz8gSlNPTi5wYXJzZShyZXNwLnRleHQpKSBhcyB7XHJcbiAgICAgICAgICAgIHJlc3BvbnNlcz86IEFycmF5PHsgbW9kZWxzPzogeyBzZXQ/OiBBcnJheTx7IHRpdGxlPzogdW5rbm93biB9PiB9IH0+O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3QgdGl0bGUgPSBkYXRhLnJlc3BvbnNlcz8uWzBdPy5tb2RlbHM/LnNldD8uWzBdPy50aXRsZTtcclxuICAgICAgICByZXR1cm4gdHlwZW9mIHRpdGxlID09PSBcInN0cmluZ1wiICYmIHRpdGxlLnRyaW0oKSA/IHRpdGxlLnRyaW0oKSA6IG51bGw7XHJcbiAgICB9IGNhdGNoIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VRdWl6bGV0Q2FyZHNGcm9tVmlzaWJsZVRleHQoaHRtbDogc3RyaW5nKTogUXVpemxldENhcmRbXSB7XHJcbiAgICBjb25zdCB0ZXh0ID0gbm9ybWFsaXplUXVpemxldFRleHQoaHRtbC5yZXBsYWNlKC88W14+XSs+L2csIFwiXFxuXCIpKTtcclxuICAgIGNvbnN0IG1hcmtlck1hdGNoID0gdGV4dC5tYXRjaCgvVGVybXMgaW4gdGhpcyBzZXRcXHMqXFwoXFxkK1xcKShbXFxzXFxTXXswLDQwMDAwfSkvaSk7XHJcbiAgICBpZiAoIW1hcmtlck1hdGNoIHx8ICFtYXJrZXJNYXRjaFsxXSkge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzZWN0aW9uID0gbWFya2VyTWF0Y2hbMV1cclxuICAgICAgICAuc3BsaXQoL0FkZGl0aW9uYWwgTGlua3N8Q3JlYXRlZCBieXxTdHVkZW50cyBhbHNvIHN0dWRpZWQvaSlbMF1cclxuICAgICAgICAudHJpbSgpO1xyXG5cclxuICAgIGNvbnN0IHRva2VucyA9IHNlY3Rpb25cclxuICAgICAgICAuc3BsaXQoL1xcc3syLH18XFxuKy8pXHJcbiAgICAgICAgLm1hcCgoaXRlbSkgPT4gaXRlbS50cmltKCkpXHJcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKVxyXG4gICAgICAgIC5zbGljZSgwLCA0MDAwKTtcclxuXHJcbiAgICBjb25zdCBjYXJkczogUXVpemxldENhcmRbXSA9IFtdO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgKyAxIDwgdG9rZW5zLmxlbmd0aDsgaSArPSAyKSB7XHJcbiAgICAgICAgY29uc3QgdGVybSA9IG5vcm1hbGl6ZVF1aXpsZXRUZXh0KHRva2Vuc1tpXSk7XHJcbiAgICAgICAgY29uc3QgZGVmaW5pdGlvbiA9IG5vcm1hbGl6ZVF1aXpsZXRUZXh0KHRva2Vuc1tpICsgMV0pO1xyXG5cclxuICAgICAgICBpZiAoIXRlcm0gfHwgIWRlZmluaXRpb24pIHtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGVybS5sZW5ndGggPiAyMDAgfHwgZGVmaW5pdGlvbi5sZW5ndGggPiA2MDApIHtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjYXJkcy5wdXNoKHsgdGVybSwgZGVmaW5pdGlvbiB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZGVkdXBlUXVpemxldENhcmRzKGNhcmRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcXVpemxldFRpdGxlRnJvbUh0bWwoaHRtbDogc3RyaW5nLCBmYWxsYmFjazogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IHRpdGxlTWF0Y2ggPSBodG1sLm1hdGNoKC88dGl0bGU+KFtePF0rKTxcXC90aXRsZT4vaSk7XHJcbiAgICBpZiAoIXRpdGxlTWF0Y2ggfHwgIXRpdGxlTWF0Y2hbMV0pIHtcclxuICAgICAgICByZXR1cm4gZmFsbGJhY2s7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY2xlYW5lZCA9IG5vcm1hbGl6ZVF1aXpsZXRUZXh0KHRpdGxlTWF0Y2hbMV0ucmVwbGFjZSgvXFxzKlxcfFxccypRdWl6bGV0XFxzKiQvaSwgXCJcIikpO1xyXG4gICAgcmV0dXJuIGNsZWFuZWQgfHwgZmFsbGJhY2s7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNsdWdpZnlGb3JGaWxlTmFtZSh2YWx1ZTogc3RyaW5nLCBmYWxsYmFjazogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IHNsdWcgPSBzYW5pdGl6ZUZpbGVOYW1lKHZhbHVlKVxyXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCItXCIpXHJcbiAgICAgICAgLnJlcGxhY2UoL18rL2csIFwiLVwiKVxyXG4gICAgICAgIC5yZXBsYWNlKC8tKy9nLCBcIi1cIilcclxuICAgICAgICAucmVwbGFjZSgvXi18LSQvZywgXCJcIilcclxuICAgICAgICAuc2xpY2UoMCwgNjApO1xyXG4gICAgcmV0dXJuIHNsdWcgfHwgZmFsbGJhY2s7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlRXhpc3RpbmdGcm9udG1hdHRlcihjb250ZW50OiBzdHJpbmcpOiB7IGZyb250bWF0dGVyOiBzdHJpbmc7IGJvZHk6IHN0cmluZyB9IHtcclxuICAgIGNvbnN0IG1hdGNoID0gY29udGVudC5tYXRjaCgvXi0tLVxccj9cXG4oW1xcc1xcU10qPylcXHI/XFxuLS0tXFxyP1xcbj8vKTtcclxuICAgIGlmICghbWF0Y2gpIHtcclxuICAgICAgICByZXR1cm4geyBmcm9udG1hdHRlcjogXCJcIiwgYm9keTogY29udGVudCB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZnJvbnRtYXR0ZXI6IG1hdGNoWzFdID8/IFwiXCIsXHJcbiAgICAgICAgYm9keTogY29udGVudC5zbGljZShtYXRjaFswXS5sZW5ndGgpLFxyXG4gICAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VRdWl6bGV0VXNlck5vdGVzKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICBjb25zdCBleHBsaWNpdE1hdGNoID0gY29udGVudC5tYXRjaChcclxuICAgICAgICAvPCEtLVxccypxdWl6bGV0OnVzZXItbm90ZXM6c3RhcnRcXHMqLS0+XFxyP1xcbj8oW1xcc1xcU10qPylcXHI/XFxuPzwhLS1cXHMqcXVpemxldDp1c2VyLW5vdGVzOmVuZFxccyotLT4vaSxcclxuICAgICk7XHJcbiAgICBpZiAoZXhwbGljaXRNYXRjaCAmJiBleHBsaWNpdE1hdGNoWzFdICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gZXhwbGljaXRNYXRjaFsxXS50cmltRW5kKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbGVnYWN5TWF0Y2ggPSBjb250ZW50Lm1hdGNoKC88IS0tXFxzKnF1aXpsZXQ6c291cmNlPS4qPy0tPlxccyooW1xcc1xcU10qKSQvaSk7XHJcbiAgICBpZiAoIWxlZ2FjeU1hdGNoIHx8ICFsZWdhY3lNYXRjaFsxXSkge1xyXG4gICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsZWdhY3lNYXRjaFsxXS5yZXBsYWNlKG5ldyBSZWdFeHAoYFxcbj8ke2VzY2FwZVJlZ0V4cChRVUlaTEVUX1NUQUxFX01BUktFUil9XFxcXHMqJGApLCBcIlwiKS50cmltRW5kKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlUXVpemxldENhcmRVc2VyTm90ZXMoY29udGVudDogc3RyaW5nKTogUGFyc2VkUXVpemxldENhcmRVc2VyTm90ZXMge1xyXG4gICAgY29uc3QgZXhwbGljaXRNYXRjaGVzID0gQXJyYXkuZnJvbShjb250ZW50Lm1hdGNoQWxsKFxyXG4gICAgICAgIC88IS0tXFxzKnF1aXpsZXQ6dXNlci1ub3RlczpzdGFydFxccyotLT5cXHI/XFxuPyhbXFxzXFxTXSo/KVxccj9cXG4/PCEtLVxccypxdWl6bGV0OnVzZXItbm90ZXM6ZW5kXFxzKi0tPi9naSxcclxuICAgICkpO1xyXG5cclxuICAgIGlmIChleHBsaWNpdE1hdGNoZXMubGVuZ3RoID49IDIpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBmcm9udDogKGV4cGxpY2l0TWF0Y2hlc1swXT8uWzFdID8/IFwiXCIpLnRyaW1FbmQoKSxcclxuICAgICAgICAgICAgYmFjazogKGV4cGxpY2l0TWF0Y2hlc1sxXT8uWzFdID8/IFwiXCIpLnRyaW1FbmQoKSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChleHBsaWNpdE1hdGNoZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZnJvbnQ6IFwiXCIsXHJcbiAgICAgICAgICAgIGJhY2s6IChleHBsaWNpdE1hdGNoZXNbMF0/LlsxXSA/PyBcIlwiKS50cmltRW5kKCksXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGZyb250OiBcIlwiLFxyXG4gICAgICAgIGJhY2s6IHBhcnNlUXVpemxldFVzZXJOb3Rlcyhjb250ZW50KSxcclxuICAgIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlUXVpemxldE1ldGFkYXRhKGNvbnRlbnQ6IHN0cmluZyk6IFBhcnNlZFF1aXpsZXRNZXRhZGF0YSB7XHJcbiAgICBjb25zdCB7IGZyb250bWF0dGVyIH0gPSBwYXJzZUV4aXN0aW5nRnJvbnRtYXR0ZXIoY29udGVudCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHNldElkOiByZWFkRnJvbnRtYXR0ZXJWYWx1ZShmcm9udG1hdHRlciwgUVVJWkxFVF9TRVRfSURfUFJPUEVSVFkpLFxyXG4gICAgICAgIGNhcmRJZDogcmVhZEZyb250bWF0dGVyVmFsdWUoZnJvbnRtYXR0ZXIsIFFVSVpMRVRfQ0FSRF9JRF9QUk9QRVJUWSksXHJcbiAgICB9O1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBmaW5kRXhpc3RpbmdRdWl6bGV0U2V0Rm9sZGVyKHZhdWx0OiBWYXVsdCwgZm9sZGVyUGF0aDogc3RyaW5nLCBzZXRJZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XHJcbiAgICBjb25zdCBub3JtYWxpemVkRm9sZGVyUGF0aCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyUGF0aCk7XHJcbiAgICBjb25zdCBjYW5kaWRhdGVzID0gdmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpLmZpbHRlcihmaWxlID0+IGZpbGUucGF0aC5zdGFydHNXaXRoKGAke25vcm1hbGl6ZWRGb2xkZXJQYXRofS9gKSk7XHJcblxyXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGNhbmRpZGF0ZXMpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdmF1bHQuY2FjaGVkUmVhZChmaWxlKTtcclxuICAgICAgICAgICAgY29uc3QgbWV0YWRhdGEgPSBwYXJzZVF1aXpsZXRNZXRhZGF0YShjb250ZW50KTtcclxuICAgICAgICAgICAgaWYgKG1ldGFkYXRhLnNldElkID09PSBzZXRJZCAmJiBtZXRhZGF0YS5jYXJkSWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlLnBhcmVudD8ucGF0aCA/PyBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgIC8vIElnbm9yZSB1bnJlYWRhYmxlIGZpbGVzIHdoaWxlIGxvb2tpbmcgZm9yIGFuIGV4aXN0aW5nIHNldCBmb2xkZXIuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcblxyXG5mdW5jdGlvbiBidWlsZFF1aXpsZXRDYXJkRmlsZU5hbWUoY2FyZDogUXVpemxldENhcmQsIGluZGV4OiBudW1iZXIsIGVmZmVjdGl2ZUNhcmRJZDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IHByZWZpeCA9IFN0cmluZyhpbmRleCArIDEpLnBhZFN0YXJ0KDMsIFwiMFwiKTtcclxuICAgIGNvbnN0IHNsdWcgPSBzbHVnaWZ5Rm9yRmlsZU5hbWUoY2FyZC50ZXJtLCBgY2FyZC0ke3ByZWZpeH1gKTtcclxuICAgIGNvbnN0IGlkU3VmZml4ID0gc2x1Z2lmeUZvckZpbGVOYW1lKGVmZmVjdGl2ZUNhcmRJZCwgaGFzaFN0cmluZyhlZmZlY3RpdmVDYXJkSWQpKS5zbGljZSgtMTIpO1xyXG4gICAgcmV0dXJuIGAke3ByZWZpeH0tJHtzbHVnfS0ke2lkU3VmZml4fS5tZGA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ1aWxkUXVpemxldENhcmROb3RlQ29udGVudChcclxuICAgIGNhcmQ6IFF1aXpsZXRDYXJkLFxyXG4gICAgc2V0SWQ6IHN0cmluZyxcclxuICAgIG9yaWdpbmFsVXJsOiBzdHJpbmcsXHJcbiAgICBmcm9udG1hdHRlciA9IFwiXCIsXHJcbiAgICB1c2VyTm90ZXM6IFBhcnNlZFF1aXpsZXRDYXJkVXNlck5vdGVzID0geyBmcm9udDogXCJcIiwgYmFjazogXCJcIiB9LFxyXG4pOiBzdHJpbmcge1xyXG4gICAgY29uc3Qgc2VjdGlvbnM6IHN0cmluZ1tdID0gW107XHJcbiAgICBjb25zdCBtYW5hZ2VkRnJvbnRtYXR0ZXIgPSB3aXRoUXVpemxldEZyb250bWF0dGVyUHJvcGVydGllcyhmcm9udG1hdHRlciwge1xyXG4gICAgICAgIHNldElkLFxyXG4gICAgICAgIGNhcmRJZDogY2FyZC5jYXJkSWQgPz8gaGFzaFN0cmluZyhgJHtjYXJkLnRlcm19XFxuJHtjYXJkLmRlZmluaXRpb259YCksXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAobWFuYWdlZEZyb250bWF0dGVyLnRyaW0oKSkge1xyXG4gICAgICAgIHNlY3Rpb25zLnB1c2goXCItLS1cIik7XHJcbiAgICAgICAgc2VjdGlvbnMucHVzaChtYW5hZ2VkRnJvbnRtYXR0ZXIudHJpbUVuZCgpKTtcclxuICAgICAgICBzZWN0aW9ucy5wdXNoKFwiLS0tXCIpO1xyXG4gICAgICAgIHNlY3Rpb25zLnB1c2goXCJcIik7XHJcbiAgICB9XHJcblxyXG4gICAgc2VjdGlvbnMucHVzaChjYXJkLnRlcm0udHJpbSgpKTtcclxuICAgIHNlY3Rpb25zLnB1c2goXCJcIik7XHJcbiAgICBzZWN0aW9ucy5wdXNoKFFVSVpMRVRfVVNFUl9OT1RFU19TVEFSVCk7XHJcbiAgICBpZiAodXNlck5vdGVzLmZyb250LnRyaW0oKSkge1xyXG4gICAgICAgIHNlY3Rpb25zLnB1c2godXNlck5vdGVzLmZyb250LnRyaW1FbmQoKSk7XHJcbiAgICB9XHJcbiAgICBzZWN0aW9ucy5wdXNoKFFVSVpMRVRfVVNFUl9OT1RFU19FTkQpO1xyXG4gICAgc2VjdGlvbnMucHVzaChcIlwiKTtcclxuICAgIHNlY3Rpb25zLnB1c2goXCItLS1cIik7XHJcbiAgICBzZWN0aW9ucy5wdXNoKFwiXCIpO1xyXG4gICAgc2VjdGlvbnMucHVzaChjYXJkLmRlZmluaXRpb24udHJpbSgpKTtcclxuICAgIGlmIChjYXJkLmxvY2FsSW1hZ2VQYXRoKSB7XHJcbiAgICAgICAgc2VjdGlvbnMucHVzaChcIlwiKTtcclxuICAgICAgICBzZWN0aW9ucy5wdXNoKGAhW1ske2NhcmQubG9jYWxJbWFnZVBhdGh9XV1gKTtcclxuICAgIH1cclxuICAgIHNlY3Rpb25zLnB1c2goXCJcIik7XHJcbiAgICBzZWN0aW9ucy5wdXNoKFFVSVpMRVRfVVNFUl9OT1RFU19TVEFSVCk7XHJcbiAgICBpZiAodXNlck5vdGVzLmJhY2sudHJpbSgpKSB7XHJcbiAgICAgICAgc2VjdGlvbnMucHVzaCh1c2VyTm90ZXMuYmFjay50cmltRW5kKCkpO1xyXG4gICAgfVxyXG4gICAgc2VjdGlvbnMucHVzaChRVUlaTEVUX1VTRVJfTk9URVNfRU5EKTtcclxuICAgIHNlY3Rpb25zLnB1c2goXCJcIik7XHJcbiAgICBzZWN0aW9ucy5wdXNoKGAke1FVSVpMRVRfU09VUkNFX1BSRUZJWH0ke29yaWdpbmFsVXJsfSAtLT5gKTtcclxuICAgIHNlY3Rpb25zLnB1c2goXCJcIik7XHJcblxyXG4gICAgcmV0dXJuIHNlY3Rpb25zLmpvaW4oXCJcXG5cIik7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGxvY2FsaXplUXVpemxldENhcmRJbWFnZXMoXHJcbiAgICBjYXJkczogUXVpemxldENhcmRbXSxcclxuICAgIHZhdWx0OiBWYXVsdCxcclxuICAgIGFzc2V0Rm9sZGVyUGF0aDogc3RyaW5nLFxyXG4gICAgZGVidWc6IGJvb2xlYW4sXHJcbik6IFByb21pc2U8UXVpemxldENhcmRbXT4ge1xyXG4gICAgY29uc3QgbG9jYWxpemVkQ2FyZHM6IFF1aXpsZXRDYXJkW10gPSBbXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGNhcmQgb2YgY2FyZHMpIHtcclxuICAgICAgICBpZiAoIWNhcmQuaW1hZ2VVcmwpIHtcclxuICAgICAgICAgICAgbG9jYWxpemVkQ2FyZHMucHVzaChjYXJkKTtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzYXZlZEltYWdlUGF0aCA9IGF3YWl0IHNhdmVJbWFnZVVybFRvVmF1bHQoY2FyZC5pbWFnZVVybCwgdmF1bHQsIGFzc2V0Rm9sZGVyUGF0aCwgZGVidWcpO1xyXG4gICAgICAgIGxvY2FsaXplZENhcmRzLnB1c2goe1xyXG4gICAgICAgICAgICAuLi5jYXJkLFxyXG4gICAgICAgICAgICBsb2NhbEltYWdlUGF0aDogaXNVUkwoc2F2ZWRJbWFnZVBhdGgpID8gdW5kZWZpbmVkIDogbm9ybWFsaXplUGF0aChzYXZlZEltYWdlUGF0aCksXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGxvY2FsaXplZENhcmRzO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZVF1aXpsZXRTZXRUb1ZhdWx0KFxyXG4gICAgdXJsOiBzdHJpbmcsXHJcbiAgICB2YXVsdDogVmF1bHQsXHJcbiAgICBmb2xkZXJQYXRoOiBzdHJpbmcsXHJcbiAgICBzYXZlQXNTZXBhcmF0ZU5vdGVzID0gZmFsc2UsXHJcbiAgICBzYXZlSW1hZ2VzVG9WYXVsdCA9IHRydWUsXHJcbiAgICBkZWJ1ZyA9IGZhbHNlLFxyXG4pOiBQcm9taXNlPFF1aXpsZXRFeHBvcnRSZXN1bHQ+IHtcclxuICAgIGNvbnN0IHNldElkID0gcGFyc2VRdWl6bGV0U2V0SWQodXJsKTtcclxuICAgIGlmICghc2V0SWQpIHtcclxuICAgICAgICByZXR1cm4geyBzdGF0dXM6IFwibm90LXF1aXpsZXRcIiB9O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZldGNoSGVhZGVyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcclxuICAgICAgICBcIlVzZXItQWdlbnRcIjogXCJNb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV83KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIFNhZmFyaS81MzcuMzZcIixcclxuICAgICAgICBcIkFjY2VwdFwiOiBcInRleHQvaHRtbCxhcHBsaWNhdGlvbi94aHRtbCt4bWwsYXBwbGljYXRpb24veGh0bWwreG1sO3E9MC45LCovKjtxPTAuOFwiLFxyXG4gICAgICAgIFwiQWNjZXB0LUxhbmd1YWdlXCI6IFwiZW4tVVMsZW47cT0wLjlcIixcclxuICAgIH07XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBsZXQgY2FyZHMgPSBhd2FpdCB0cnlRdWl6bGV0UmVzdEFwaShzZXRJZCwgZmV0Y2hIZWFkZXJzKTtcclxuICAgICAgICBpZiAoZGVidWcgJiYgY2FyZHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbSSBsaW5rIHRoZXJlZm9yZSBpZnJhbWVdIFF1aXpsZXQgUkVTVCBBUEkgcmV0dXJuZWQgJHtjYXJkcy5sZW5ndGh9IGNhcmRzIGZvciBzZXQ6YCwgc2V0SWQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGh0bWw6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgICAgIGlmIChjYXJkcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgY29uc3QgZmxhc2hjYXJkc1VybCA9IGBodHRwczovL3F1aXpsZXQuY29tLyR7c2V0SWR9L2ZsYXNoY2FyZHNgO1xyXG4gICAgICAgICAgICBjb25zdCBlbWJlZFVybCA9IGBodHRwczovL3F1aXpsZXQuY29tLyR7c2V0SWR9L2ZsYXNoY2FyZHMvZW1iZWRgO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGZldGNoVXJsIG9mIFt1cmwsIGZsYXNoY2FyZHNVcmwsIGVtYmVkVXJsXSkge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwID0gYXdhaXQgcmVxdWVzdFVybCh7IHVybDogZmV0Y2hVcmwsIG1ldGhvZDogXCJHRVRcIiwgaGVhZGVyczogZmV0Y2hIZWFkZXJzIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwLmhlYWRlcnNbXCJjb250ZW50LXR5cGVcIl0/LmluY2x1ZGVzKFwidGV4dC9odG1sXCIpICYmIHJlc3AudGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBodG1sID0gcmVzcC50ZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHsgLyogVHJ5IG5leHQgVVJMICovIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGh0bWwpIHtcclxuICAgICAgICAgICAgICAgIGNhcmRzID0gcGFyc2VRdWl6bGV0Q2FyZHNGcm9tTmV4dERhdGEoaHRtbCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2FyZHMubGVuZ3RoID09PSAwKSBjYXJkcyA9IHBhcnNlUXVpemxldENhcmRzRnJvbVF1aXpsZXRWYXJzKGh0bWwpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNhcmRzLmxlbmd0aCA9PT0gMCkgY2FyZHMgPSBwYXJzZVF1aXpsZXRDYXJkc0Zyb21IdG1sKGh0bWwpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNhcmRzLmxlbmd0aCA9PT0gMCkgY2FyZHMgPSBwYXJzZVF1aXpsZXRDYXJkc0Zyb21TY3JpcHRzKGh0bWwpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNhcmRzLmxlbmd0aCA9PT0gMCkgY2FyZHMgPSBwYXJzZVF1aXpsZXRDYXJkc0Zyb21WaXNpYmxlVGV4dChodG1sKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGNhcmRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICBpZiAoZGVidWcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJbSSBsaW5rIHRoZXJlZm9yZSBpZnJhbWVdIENvdWxkIG5vdCBmaW5kIGV4cG9ydGFibGUgUXVpemxldCBjYXJkcyB3aXRoIGFueSBtZXRob2QgZm9yIHNldDpcIiwgc2V0SWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB7IHN0YXR1czogaHRtbCA/IFwibm8tY2FyZHNcIiA6IFwibm90LWh0bWxcIiB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdGl0bGUgPVxyXG4gICAgICAgICAgICAoaHRtbCA/IHF1aXpsZXRUaXRsZUZyb21IdG1sKGh0bWwsIFwiXCIpIDogXCJcIikgfHxcclxuICAgICAgICAgICAgKGF3YWl0IHRyeVF1aXpsZXRTZXRUaXRsZUFwaShzZXRJZCwgZmV0Y2hIZWFkZXJzKSkgfHxcclxuICAgICAgICAgICAgYHF1aXpsZXQtJHtzZXRJZH1gO1xyXG5cclxuICAgICAgICBpZiAoIXNhdmVBc1NlcGFyYXRlTm90ZXMpIHtcclxuICAgICAgICAgICAgY29uc3QgYXNzZXRGb2xkZXJQYXRoID0gbm9ybWFsaXplUGF0aChgJHtmb2xkZXJQYXRofS9xdWl6bGV0LSR7aGFzaFN0cmluZyhzZXRJZCl9LWFzc2V0c2ApO1xyXG4gICAgICAgICAgICBjb25zdCBjYXJkc1dpdGhJbWFnZXMgPSBzYXZlSW1hZ2VzVG9WYXVsdFxyXG4gICAgICAgICAgICAgICAgPyBhd2FpdCBsb2NhbGl6ZVF1aXpsZXRDYXJkSW1hZ2VzKGNhcmRzLCB2YXVsdCwgYXNzZXRGb2xkZXJQYXRoLCBkZWJ1ZylcclxuICAgICAgICAgICAgICAgIDogY2FyZHM7XHJcbiAgICAgICAgICAgIGNvbnN0IHNpbmdsZUZpbGVSZXN1bHQgPSBhd2FpdCBzYXZlUXVpemxldFNldEFzU2luZ2xlRmlsZShcclxuICAgICAgICAgICAgICAgIHZhdWx0LFxyXG4gICAgICAgICAgICAgICAgZm9sZGVyUGF0aCxcclxuICAgICAgICAgICAgICAgIHRpdGxlLFxyXG4gICAgICAgICAgICAgICAgc2V0SWQsXHJcbiAgICAgICAgICAgICAgICB1cmwsXHJcbiAgICAgICAgICAgICAgICBjYXJkc1dpdGhJbWFnZXMsXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGVidWcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJbSSBsaW5rIHRoZXJlZm9yZSBpZnJhbWVdIFF1aXpsZXQgc2luZ2xlLWZpbGUgZXhwb3J0IGNvbXBsZXRlZDpcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIHNldElkLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBzaW5nbGVGaWxlUmVzdWx0LmZpbGVQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogc2luZ2xlRmlsZVJlc3VsdC5zdGF0dXMsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FyZENvdW50OiBjYXJkcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHNpbmdsZUZpbGVSZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBleGlzdGluZ1NldEZvbGRlclBhdGggPSBhd2FpdCBmaW5kRXhpc3RpbmdRdWl6bGV0U2V0Rm9sZGVyKHZhdWx0LCBmb2xkZXJQYXRoLCBzZXRJZCk7XHJcbiAgICAgICAgY29uc3Qgc2V0Rm9sZGVyTmFtZSA9IGAke3Nhbml0aXplRmlsZU5hbWUodGl0bGUpfS0ke2hhc2hTdHJpbmcoc2V0SWQpfWA7XHJcbiAgICAgICAgY29uc3Qgc2V0Rm9sZGVyUGF0aCA9IGV4aXN0aW5nU2V0Rm9sZGVyUGF0aCA/PyBub3JtYWxpemVQYXRoKGAke2ZvbGRlclBhdGh9LyR7c2V0Rm9sZGVyTmFtZX1gKTtcclxuXHJcbiAgICAgICAgYXdhaXQgZW5zdXJlRm9sZGVyRXhpc3RzKHZhdWx0LCBzZXRGb2xkZXJQYXRoKTtcclxuICAgICAgICBjb25zdCBjYXJkc1dpdGhJbWFnZXMgPSBzYXZlSW1hZ2VzVG9WYXVsdFxyXG4gICAgICAgICAgICA/IGF3YWl0IGxvY2FsaXplUXVpemxldENhcmRJbWFnZXMoY2FyZHMsIHZhdWx0LCBzZXRGb2xkZXJQYXRoLCBkZWJ1ZylcclxuICAgICAgICAgICAgOiBjYXJkcztcclxuXHJcbiAgICAgICAgY29uc3QgZXhpc3RpbmdNYW5hZ2VkRmlsZXMgPSB2YXVsdFxyXG4gICAgICAgICAgICAuZ2V0TWFya2Rvd25GaWxlcygpXHJcbiAgICAgICAgICAgIC5maWx0ZXIoKGZpbGUpID0+IGZpbGUucGF0aC5zdGFydHNXaXRoKGAke3NldEZvbGRlclBhdGh9L2ApKTtcclxuXHJcbiAgICAgICAgY29uc3QgZmlsZXNCeUNhcmRJZCA9IG5ldyBNYXA8c3RyaW5nLCBURmlsZT4oKTtcclxuICAgICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZXhpc3RpbmdNYW5hZ2VkRmlsZXMpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB2YXVsdC5jYWNoZWRSZWFkKGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWV0YWRhdGEgPSBwYXJzZVF1aXpsZXRNZXRhZGF0YShjb250ZW50KTtcclxuICAgICAgICAgICAgICAgIGlmIChtZXRhZGF0YS5zZXRJZCA9PT0gc2V0SWQgJiYgbWV0YWRhdGEuY2FyZElkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZXNCeUNhcmRJZC5zZXQobWV0YWRhdGEuY2FyZElkLCBmaWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZ25vcmUgdW5yZWFkYWJsZSBmaWxlcyBpbiB0aGUgdGFyZ2V0IGZvbGRlci5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGNyZWF0ZWRDb3VudCA9IDA7XHJcbiAgICAgICAgbGV0IHVwZGF0ZWRDb3VudCA9IDA7XHJcbiAgICAgICAgbGV0IHVuY2hhbmdlZENvdW50ID0gMDtcclxuICAgICAgICBjb25zdCBjdXJyZW50Q2FyZElkcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IFtpbmRleCwgcmF3Q2FyZF0gb2YgY2FyZHNXaXRoSW1hZ2VzLmVudHJpZXMoKSkge1xyXG4gICAgICAgICAgICBjb25zdCBlZmZlY3RpdmVDYXJkSWQgPSByYXdDYXJkLmNhcmRJZCA/PyBoYXNoU3RyaW5nKGAke3Jhd0NhcmQudGVybX1cXG4ke3Jhd0NhcmQuZGVmaW5pdGlvbn1gKTtcclxuICAgICAgICAgICAgY3VycmVudENhcmRJZHMuYWRkKGVmZmVjdGl2ZUNhcmRJZCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNhcmQ6IFF1aXpsZXRDYXJkID0geyAuLi5yYXdDYXJkLCBjYXJkSWQ6IGVmZmVjdGl2ZUNhcmRJZCB9O1xyXG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ0ZpbGUgPSBmaWxlc0J5Q2FyZElkLmdldChlZmZlY3RpdmVDYXJkSWQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGV4aXN0aW5nRmlsZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdDb250ZW50ID0gYXdhaXQgdmF1bHQuY2FjaGVkUmVhZChleGlzdGluZ0ZpbGUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeyBmcm9udG1hdHRlciB9ID0gcGFyc2VFeGlzdGluZ0Zyb250bWF0dGVyKGV4aXN0aW5nQ29udGVudCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VyTm90ZXMgPSBwYXJzZVF1aXpsZXRDYXJkVXNlck5vdGVzKGV4aXN0aW5nQ29udGVudCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0Q29udGVudCA9IGJ1aWxkUXVpemxldENhcmROb3RlQ29udGVudChjYXJkLCBzZXRJZCwgdXJsLCBmcm9udG1hdHRlciwgdXNlck5vdGVzKTtcclxuICAgICAgICAgICAgICAgIGlmIChleGlzdGluZ0NvbnRlbnQgIT09IG5leHRDb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdmF1bHQubW9kaWZ5KGV4aXN0aW5nRmlsZSwgbmV4dENvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZWRDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB1bmNoYW5nZWRDb3VudCsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVOYW1lID0gYnVpbGRRdWl6bGV0Q2FyZEZpbGVOYW1lKGNhcmQsIGluZGV4LCBlZmZlY3RpdmVDYXJkSWQpO1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7c2V0Rm9sZGVyUGF0aH0vJHtmaWxlTmFtZX1gKTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGJ1aWxkUXVpemxldENhcmROb3RlQ29udGVudChjYXJkLCBzZXRJZCwgdXJsKTtcclxuICAgICAgICAgICAgYXdhaXQgdmF1bHQuY3JlYXRlKGZpbGVQYXRoLCBjb250ZW50KTtcclxuICAgICAgICAgICAgY3JlYXRlZENvdW50Kys7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IFtjYXJkSWQsIGZpbGVdIG9mIGZpbGVzQnlDYXJkSWQuZW50cmllcygpKSB7XHJcbiAgICAgICAgICAgIGlmIChjdXJyZW50Q2FyZElkcy5oYXMoY2FyZElkKSkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nQ29udGVudCA9IGF3YWl0IHZhdWx0LmNhY2hlZFJlYWQoZmlsZSk7XHJcbiAgICAgICAgICAgIGlmICghZXhpc3RpbmdDb250ZW50LmluY2x1ZGVzKFFVSVpMRVRfU1RBTEVfTUFSS0VSKSkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdmF1bHQubW9kaWZ5KGZpbGUsIGAke2V4aXN0aW5nQ29udGVudC50cmltRW5kKCl9XFxuJHtRVUlaTEVUX1NUQUxFX01BUktFUn1cXG5gKTtcclxuICAgICAgICAgICAgICAgIHVwZGF0ZWRDb3VudCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZGVidWcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIltJIGxpbmsgdGhlcmVmb3JlIGlmcmFtZV0gUXVpemxldCBjYXJkIGV4cG9ydCBjb21wbGV0ZWQ6XCIsIHtcclxuICAgICAgICAgICAgICAgIHNldElkLFxyXG4gICAgICAgICAgICAgICAgc2V0Rm9sZGVyUGF0aCxcclxuICAgICAgICAgICAgICAgIGNyZWF0ZWRDb3VudCxcclxuICAgICAgICAgICAgICAgIHVwZGF0ZWRDb3VudCxcclxuICAgICAgICAgICAgICAgIHVuY2hhbmdlZENvdW50LFxyXG4gICAgICAgICAgICAgICAgY2FyZENvdW50OiBjYXJkc1dpdGhJbWFnZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjcmVhdGVkQ291bnQgPiAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXM6IHVwZGF0ZWRDb3VudCA+IDAgPyBcInVwZGF0ZWRcIiA6IFwic2F2ZWRcIixcclxuICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBzZXRGb2xkZXJQYXRoLFxyXG4gICAgICAgICAgICAgICAgY2FyZENvdW50OiBjYXJkc1dpdGhJbWFnZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgY3JlYXRlZENvdW50LFxyXG4gICAgICAgICAgICAgICAgdXBkYXRlZENvdW50LFxyXG4gICAgICAgICAgICAgICAgdW5jaGFuZ2VkQ291bnQsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodXBkYXRlZENvdW50ID4gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBcInVwZGF0ZWRcIixcclxuICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBzZXRGb2xkZXJQYXRoLFxyXG4gICAgICAgICAgICAgICAgY2FyZENvdW50OiBjYXJkc1dpdGhJbWFnZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgY3JlYXRlZENvdW50LFxyXG4gICAgICAgICAgICAgICAgdXBkYXRlZENvdW50LFxyXG4gICAgICAgICAgICAgICAgdW5jaGFuZ2VkQ291bnQsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdGF0dXM6IFwidW5jaGFuZ2VkXCIsXHJcbiAgICAgICAgICAgIGZpbGVQYXRoOiBzZXRGb2xkZXJQYXRoLFxyXG4gICAgICAgICAgICBjYXJkQ291bnQ6IGNhcmRzV2l0aEltYWdlcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGNyZWF0ZWRDb3VudCxcclxuICAgICAgICAgICAgdXBkYXRlZENvdW50LFxyXG4gICAgICAgICAgICB1bmNoYW5nZWRDb3VudCxcclxuICAgICAgICB9O1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBpZiAoZGVidWcpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIltJIGxpbmsgdGhlcmVmb3JlIGlmcmFtZV0gRmFpbGVkIHRvIHNhdmUgUXVpemxldCBjYXJkIGV4cG9ydDpcIiwgZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyBzdGF0dXM6IFwiZXJyb3JcIiB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZVF1aXpsZXRTb3VyY2VVcmwoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XHJcbiAgICBjb25zdCBtYXRjaCA9IGNvbnRlbnQubWF0Y2goLzwhLS1cXHMqcXVpemxldDpzb3VyY2U9KC4qPylcXHMqLS0+L2kpO1xyXG4gICAgaWYgKCFtYXRjaD8uWzFdKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc291cmNlVXJsID0gbWF0Y2hbMV0udHJpbSgpO1xyXG4gICAgcmV0dXJuIHNvdXJjZVVybCB8fCBudWxsO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlQWxsUXVpemxldFNldHNGcm9tU3RvcmVkU291cmNlcyhcclxuICAgIHZhdWx0OiBWYXVsdCxcclxuICAgIGZvbGRlclBhdGg6IHN0cmluZyxcclxuICAgIHNhdmVBc1NlcGFyYXRlTm90ZXM6IGJvb2xlYW4sXHJcbiAgICBzYXZlSW1hZ2VzVG9WYXVsdDogYm9vbGVhbixcclxuICAgIGRlYnVnID0gZmFsc2UsXHJcbik6IFByb21pc2U8UXVpemxldEJ1bGtVcGRhdGVSZXN1bHQ+IHtcclxuICAgIGNvbnN0IGZpbGVzID0gdmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xyXG4gICAgY29uc3QgdW5pcXVlU2V0U291cmNlcyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XHJcbiAgICBsZXQgc291cmNlTWVudGlvbnMgPSAwO1xyXG5cclxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xyXG4gICAgICAgIGxldCBjb250ZW50ID0gXCJcIjtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb250ZW50ID0gYXdhaXQgdmF1bHQuY2FjaGVkUmVhZChmaWxlKTtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzb3VyY2VVcmwgPSBwYXJzZVF1aXpsZXRTb3VyY2VVcmwoY29udGVudCk7XHJcbiAgICAgICAgaWYgKCFzb3VyY2VVcmwpIHtcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzb3VyY2VNZW50aW9ucysrO1xyXG4gICAgICAgIGNvbnN0IHNldElkID0gcGFyc2VRdWl6bGV0U2V0SWQoc291cmNlVXJsKTtcclxuICAgICAgICBpZiAoIXNldElkKSB7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF1bmlxdWVTZXRTb3VyY2VzLmhhcyhzZXRJZCkpIHtcclxuICAgICAgICAgICAgdW5pcXVlU2V0U291cmNlcy5zZXQoc2V0SWQsIHNvdXJjZVVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlc3VsdDogUXVpemxldEJ1bGtVcGRhdGVSZXN1bHQgPSB7XHJcbiAgICAgICAgc2Nhbm5lZEZpbGVzOiBmaWxlcy5sZW5ndGgsXHJcbiAgICAgICAgc291cmNlTWVudGlvbnMsXHJcbiAgICAgICAgdW5pcXVlU2V0Q291bnQ6IHVuaXF1ZVNldFNvdXJjZXMuc2l6ZSxcclxuICAgICAgICByZWZyZXNoZWRTZXRDb3VudDogMCxcclxuICAgICAgICBzYXZlZENvdW50OiAwLFxyXG4gICAgICAgIHVwZGF0ZWRDb3VudDogMCxcclxuICAgICAgICB1bmNoYW5nZWRDb3VudDogMCxcclxuICAgICAgICBub0NhcmRzQ291bnQ6IDAsXHJcbiAgICAgICAgbm90SHRtbENvdW50OiAwLFxyXG4gICAgICAgIGVycm9yQ291bnQ6IDAsXHJcbiAgICB9O1xyXG5cclxuICAgIGZvciAoY29uc3Qgc291cmNlVXJsIG9mIHVuaXF1ZVNldFNvdXJjZXMudmFsdWVzKCkpIHtcclxuICAgICAgICBjb25zdCBleHBvcnRSZXN1bHQgPSBhd2FpdCBzYXZlUXVpemxldFNldFRvVmF1bHQoXHJcbiAgICAgICAgICAgIHNvdXJjZVVybCxcclxuICAgICAgICAgICAgdmF1bHQsXHJcbiAgICAgICAgICAgIGZvbGRlclBhdGgsXHJcbiAgICAgICAgICAgIHNhdmVBc1NlcGFyYXRlTm90ZXMsXHJcbiAgICAgICAgICAgIHNhdmVJbWFnZXNUb1ZhdWx0LFxyXG4gICAgICAgICAgICBkZWJ1ZyxcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICByZXN1bHQucmVmcmVzaGVkU2V0Q291bnQrKztcclxuXHJcbiAgICAgICAgaWYgKGV4cG9ydFJlc3VsdC5zdGF0dXMgPT09IFwic2F2ZWRcIikge1xyXG4gICAgICAgICAgICByZXN1bHQuc2F2ZWRDb3VudCsrO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZXhwb3J0UmVzdWx0LnN0YXR1cyA9PT0gXCJ1cGRhdGVkXCIpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnVwZGF0ZWRDb3VudCsrO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZXhwb3J0UmVzdWx0LnN0YXR1cyA9PT0gXCJ1bmNoYW5nZWRcIikge1xyXG4gICAgICAgICAgICByZXN1bHQudW5jaGFuZ2VkQ291bnQrKztcclxuICAgICAgICB9IGVsc2UgaWYgKGV4cG9ydFJlc3VsdC5zdGF0dXMgPT09IFwibm8tY2FyZHNcIikge1xyXG4gICAgICAgICAgICByZXN1bHQubm9DYXJkc0NvdW50Kys7XHJcbiAgICAgICAgfSBlbHNlIGlmIChleHBvcnRSZXN1bHQuc3RhdHVzID09PSBcIm5vdC1odG1sXCIpIHtcclxuICAgICAgICAgICAgcmVzdWx0Lm5vdEh0bWxDb3VudCsrO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZXhwb3J0UmVzdWx0LnN0YXR1cyA9PT0gXCJlcnJvclwiIHx8IGV4cG9ydFJlc3VsdC5zdGF0dXMgPT09IFwibm90LXF1aXpsZXRcIikge1xyXG4gICAgICAgICAgICByZXN1bHQuZXJyb3JDb3VudCsrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59Il19