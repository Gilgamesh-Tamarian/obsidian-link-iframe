import { __awaiter } from "tslib";
import { Notice, PluginSettingTab, Setting } from "obsidian";
import { PreviewEmbedModal } from "src/preview-embed-modal";
export var PreloadOptions;
(function (PreloadOptions) {
    PreloadOptions[PreloadOptions["None"] = 0] = "None";
    PreloadOptions[PreloadOptions["Placeholder"] = 1] = "Placeholder";
    PreloadOptions[PreloadOptions["Placeholder_ClickToLoad"] = 2] = "Placeholder_ClickToLoad";
})(PreloadOptions || (PreloadOptions = {}));
export const supportedWebsites = [
    "Twitter/X",
    "Imgur",
    "Reddit",
    "CodePen",
    "Google Docs",
    "Google Drive",
    "Google Calendar",
    "Google Maps",
    "Wikipedia",
    "Geogebra",
    "Quizlet",
    "OpenStreetMap",
    "SoundCloud",
    "Spotify",
    "Apple Music",
    "Tidal",
    "Deezer",
    "Steam",
    "YouTube",
    "Vimeo",
    "Dailymotion",
    "VK Video",
    "Twitch",
    "TikTok",
    "Instagram",
    "Facebook",
    "Pinterest",
    "Telegram",
    "Mastodon",
    "Threads",
];
export const DEFAULT_SETTINGS = {
    darkMode: true,
    preloadOption: PreloadOptions.Placeholder,
    showOriginalLink: true,
    saveImagesToVault: false,
    saveSocialMediaImagesToVault: false,
    imageFolderPath: "linked-iframe-images",
    googleDocsFolderPath: "linked-iframe-docs",
    saveGoogleDocsToVault: false,
    saveQuizletCardsToVault: false,
    saveQuizletImagesToVault: false,
    saveQuizletAsSeparateNotes: false,
    quizletFolderPath: "linked-iframe-quizlet",
    debug: false,
};
export class AutoEmbedSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        const plugin = this.plugin;
        const settings = plugin.settings;
        containerEl.empty();
        function EnumToRecord(e) {
            const recordOutput = {};
            for (const option in e) {
                if (!isNaN(Number(option)))
                    continue;
                const displayText = option.replace(/([a-z0-9])([A-Z])/g, (match, p1, p2) => `${p1} ${p2.toLowerCase()}`);
                recordOutput[option] = displayText;
            }
            return recordOutput;
        }
        function createCollapsibleSection(title, description) {
            const details = containerEl.createEl("details");
            details.classList.add("auto-embed-settings-section");
            const summary = details.createEl("summary");
            summary.classList.add("auto-embed-settings-section-summary");
            summary.setText(title);
            const desc = details.createDiv("auto-embed-settings-section-desc");
            desc.setText(description);
            return details.createDiv("auto-embed-settings-section-content");
        }
        function addVisualDivider(parent) {
            parent.createEl("hr", { cls: "auto-embed-settings-divider" });
        }
        // ── General settings ──────────────────────────────────────────────────
        const previewTooltip = "Opens a modal to test embed links";
        new Setting(containerEl)
            .setName("Preview embed")
            .setTooltip(previewTooltip)
            .addButton(btn => btn
            .setButtonText("Preview")
            .setTooltip(previewTooltip)
            .onClick(() => {
            const modal = new PreviewEmbedModal(plugin, "https://x.com/obsdmd/status/1739667211462316449");
            modal.open();
        }));
        new Setting(containerEl)
            .setName("Dark mode")
            .setDesc("Use dark theme for embeds when supported")
            .addToggle(toggle => toggle
            .setValue(settings.darkMode)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            settings.darkMode = value;
            yield plugin.saveSettings();
        })));
        const preloadOptions = EnumToRecord(PreloadOptions);
        Object.entries(preloadOptions).forEach(([key, value]) => {
            preloadOptions[key] = value.replace("_", " + ");
        });
        new Setting(containerEl)
            .setName("Preload options")
            .setDesc("Choose how the embed behaves before loading")
            .addDropdown(dropdown => dropdown
            .addOptions(preloadOptions)
            .setValue(PreloadOptions[settings.preloadOption])
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            settings.preloadOption =
                PreloadOptions[value];
            yield plugin.saveSettings();
        })));
        new Setting(containerEl)
            .setName("Show original link under embed")
            .setDesc("Display an \"Open original link\" footer below generated embeds")
            .addToggle(toggle => toggle
            .setValue(settings.showOriginalLink)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            settings.showOriginalLink = value;
            yield plugin.saveSettings();
        })));
        addVisualDivider(containerEl);
        // ── Generic download settings ──────────────────────────────────────────
        new Setting(containerEl)
            .setName("Save image embeds to vault")
            .setDesc("Download direct image URLs and replace embed links with local vault files")
            .addToggle(toggle => toggle
            .setValue(settings.saveImagesToVault)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            settings.saveImagesToVault = value;
            yield plugin.saveSettings();
        })));
        new Setting(containerEl)
            .setName("Save social media images to vault")
            .setDesc("For supported platforms (Instagram, Facebook, Pinterest, Telegram, Mastodon, Reddit, TikTok, Imgur, SoundCloud, Spotify, CodePen, Steam), fetch available media images and save them locally")
            .addToggle(toggle => toggle
            .setValue(settings.saveSocialMediaImagesToVault)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            settings.saveSocialMediaImagesToVault = value;
            yield plugin.saveSettings();
        })));
        new Setting(containerEl)
            .setName("Save Google Docs to vault")
            .setDesc("Download a local Markdown copy of the document when embedding a Google Doc (requires the document to be shared with anyone with the link)")
            .addToggle(toggle => toggle
            .setValue(settings.saveGoogleDocsToVault)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            settings.saveGoogleDocsToVault = value;
            yield plugin.saveSettings();
        })));
        new Setting(containerEl)
            .setName("Image folder path")
            .setDesc("Folder inside your vault used for downloaded image content")
            .addText(text => text
            .setPlaceholder("linked-iframe-images")
            .setValue(settings.imageFolderPath)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            settings.imageFolderPath = value.trim() || "linked-iframe-images";
            yield plugin.saveSettings();
        })));
        new Setting(containerEl)
            .setName("Google Docs folder path")
            .setDesc("Folder inside your vault used for downloaded Google Docs Markdown files")
            .addText(text => text
            .setPlaceholder("linked-iframe-docs")
            .setValue(settings.googleDocsFolderPath)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            settings.googleDocsFolderPath = value.trim() || "linked-iframe-docs";
            yield plugin.saveSettings();
        })));
        addVisualDivider(containerEl);
        // ── Quizlet settings (collapsible) ────────────────────────────────────
        const quizletContent = createCollapsibleSection("Quizlet", "Configure Quizlet card exports and update behavior");
        const quizletModeDescription = new DocumentFragment();
        quizletModeDescription.appendText("When enabled, create one folder per set and one Markdown note per card for ");
        quizletModeDescription.appendChild(createEl("a", {
            text: "Yanki",
            href: "obsidian://show-plugin?id=yanki",
        }));
        quizletModeDescription.appendText(" compatibility. When disabled, save one Markdown file per Quizlet set using the older export format.");
        const quizletSaveDescription = new DocumentFragment();
        quizletSaveDescription.appendText("Best-effort export of public Quizlet flashcards to local Markdown when card data is accessible. ");
        quizletSaveDescription.appendChild(createEl("strong", { text: "Performance warning:" }));
        quizletSaveDescription.appendText(" this setting has general plugin performance implications, and will especially cause stutter when embedding larger Quizlet sets.");
        new Setting(quizletContent)
            .setName("Save Quizlet cards to vault")
            .setDesc(quizletSaveDescription)
            .addToggle(toggle => toggle
            .setValue(settings.saveQuizletCardsToVault)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            settings.saveQuizletCardsToVault = value;
            yield plugin.saveSettings();
        })));
        new Setting(quizletContent)
            .setName("Quizlet: save card images to vault")
            .setDesc("When enabled, download card images found in Quizlet sets and embed them locally in exported notes")
            .addToggle(toggle => toggle
            .setValue(settings.saveQuizletImagesToVault)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            settings.saveQuizletImagesToVault = value;
            yield plugin.saveSettings();
        })));
        new Setting(quizletContent)
            .setName("Quizlet: save as separate notes")
            .setDesc(quizletModeDescription)
            .addToggle(toggle => toggle
            .setValue(settings.saveQuizletAsSeparateNotes)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            settings.saveQuizletAsSeparateNotes = value;
            yield plugin.saveSettings();
        })));
        new Setting(quizletContent)
            .setName("Quizlet folder path")
            .setDesc("Folder inside your vault used for downloaded Quizlet card exports")
            .addText(text => text
            .setPlaceholder("linked-iframe-quizlet")
            .setValue(settings.quizletFolderPath)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            settings.quizletFolderPath = value.trim() || "linked-iframe-quizlet";
            yield plugin.saveSettings();
        })));
        new Setting(quizletContent)
            .setName("Update all saved Quizlet cards")
            .setDesc("Primary action: refresh every Quizlet set that has a stored quizlet:source marker in your vault.")
            .addButton(button => {
            let isUpdating = false;
            button
                .setButtonText("Update all Quizlet cards")
                .setCta()
                .onClick(() => __awaiter(this, void 0, void 0, function* () {
                if (isUpdating) {
                    return;
                }
                isUpdating = true;
                button.setDisabled(true);
                button.setButtonText("Updating...");
                new Notice("I link therefore iframe: updating all saved Quizlet cards...");
                try {
                    const result = yield plugin.updateAllSavedQuizletCards();
                    new Notice(`I link therefore iframe: refreshed ${result.refreshedSetCount}/${result.uniqueSetCount} Quizlet sets (` +
                        `saved ${result.savedCount}, updated ${result.updatedCount}, unchanged ${result.unchangedCount}, ` +
                        `no-cards ${result.noCardsCount}, not-html ${result.notHtmlCount}, errors ${result.errorCount}).`, 12000);
                }
                catch (_a) {
                    new Notice("I link therefore iframe: failed to update all saved Quizlet cards.");
                }
                finally {
                    isUpdating = false;
                    button.setDisabled(false);
                    button.setButtonText("Update all Quizlet cards");
                }
            }));
        });
        // ── Footer ────────────────────────────────────────────────────────────
        const additionalInfo = new DocumentFragment();
        additionalInfo.appendText("Found bugs or want a feature?");
        additionalInfo.appendChild(createEl("br"));
        additionalInfo.appendChild(createEl("a", {
            text: "Create a GitHub issue",
            href: "https://github.com/Gilgamesh-Tamarian/obsidian-link-iframe/issues/new"
        }));
        new Setting(containerEl)
            .setDesc(additionalInfo);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MtdGFiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2V0dGluZ3MtdGFiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLEVBQU8sTUFBTSxFQUFFLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUNsRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUU1RCxNQUFNLENBQU4sSUFBWSxjQUlYO0FBSkQsV0FBWSxjQUFjO0lBQ3RCLG1EQUFJLENBQUE7SUFDSixpRUFBVyxDQUFBO0lBQ1gseUZBQXVCLENBQUE7QUFDM0IsQ0FBQyxFQUpXLGNBQWMsS0FBZCxjQUFjLFFBSXpCO0FBRUQsTUFBTSxDQUFDLE1BQU0saUJBQWlCLEdBQUc7SUFDN0IsV0FBVztJQUNYLE9BQU87SUFDUCxRQUFRO0lBQ1IsU0FBUztJQUNULGFBQWE7SUFDYixjQUFjO0lBQ2QsaUJBQWlCO0lBQ2pCLGFBQWE7SUFDYixXQUFXO0lBQ1gsVUFBVTtJQUNWLFNBQVM7SUFDVCxlQUFlO0lBQ2YsWUFBWTtJQUNaLFNBQVM7SUFDVCxhQUFhO0lBQ2IsT0FBTztJQUNQLFFBQVE7SUFDUixPQUFPO0lBQ1AsU0FBUztJQUNULE9BQU87SUFDUCxhQUFhO0lBQ2IsVUFBVTtJQUNWLFFBQVE7SUFDUixRQUFRO0lBQ1IsV0FBVztJQUNYLFVBQVU7SUFDVixXQUFXO0lBQ1gsVUFBVTtJQUNWLFVBQVU7SUFDVixTQUFTO0NBQ0gsQ0FBQztBQTBCWCxNQUFNLENBQUMsTUFBTSxnQkFBZ0IsR0FBbUI7SUFDNUMsUUFBUSxFQUFFLElBQUk7SUFDZCxhQUFhLEVBQUUsY0FBYyxDQUFDLFdBQVc7SUFDekMsZ0JBQWdCLEVBQUUsSUFBSTtJQUV0QixpQkFBaUIsRUFBRSxLQUFLO0lBQ3hCLDRCQUE0QixFQUFFLEtBQUs7SUFDbkMsZUFBZSxFQUFFLHNCQUFzQjtJQUN2QyxvQkFBb0IsRUFBRSxvQkFBb0I7SUFDMUMscUJB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QUFNLENBQUMsWUFBWSxZQUFZLE1BQU0sQ0FBQyxVQUFVLElBQUksRUFDakcsS0FBSyxDQUNSLENBQUM7Z0JBQ04sQ0FBQztnQkFBQyxXQUFNLENBQUM7b0JBQ0wsSUFBSSxNQUFNLENBQUMsb0VBQW9FLENBQUMsQ0FBQztnQkFDckYsQ0FBQzt3QkFBUyxDQUFDO29CQUNQLFVBQVUsR0FBRyxLQUFLLENBQUM7b0JBQ25CLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzFCLE1BQU0sQ0FBQyxhQUFhLENBQUMsMEJBQTBCLENBQUMsQ0FBQztnQkFDckQsQ0FBQztZQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7UUFDWCxDQUFDLENBQUMsQ0FBQztRQUVQLHlFQUF5RTtRQUV6RSxNQUFNLGNBQWMsR0FBRyxJQUFJLGdCQUFnQixFQUFFLENBQUM7UUFFOUMsY0FBYyxDQUFDLFVBQVUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1FBQzNELGNBQWMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFM0MsY0FBYyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ3JDLElBQUksRUFBRSx1QkFBdUI7WUFDN0IsSUFBSSxFQUFFLHVFQUF1RTtTQUNoRixDQUFDLENBQUMsQ0FBQztRQUVKLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQzthQUNuQixPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDakMsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEF1dG9FbWJlZFBsdWdpbiBmcm9tIFwic3JjL21haW5cIjtcclxuaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHsgUHJldmlld0VtYmVkTW9kYWwgfSBmcm9tIFwic3JjL3ByZXZpZXctZW1iZWQtbW9kYWxcIjtcclxuXHJcbmV4cG9ydCBlbnVtIFByZWxvYWRPcHRpb25zIHtcclxuICAgIE5vbmUsXHJcbiAgICBQbGFjZWhvbGRlcixcclxuICAgIFBsYWNlaG9sZGVyX0NsaWNrVG9Mb2FkLFxyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgc3VwcG9ydGVkV2Vic2l0ZXMgPSBbXHJcbiAgICBcIlR3aXR0ZXIvWFwiLFxyXG4gICAgXCJJbWd1clwiLFxyXG4gICAgXCJSZWRkaXRcIixcclxuICAgIFwiQ29kZVBlblwiLFxyXG4gICAgXCJHb29nbGUgRG9jc1wiLFxyXG4gICAgXCJHb29nbGUgRHJpdmVcIixcclxuICAgIFwiR29vZ2xlIENhbGVuZGFyXCIsXHJcbiAgICBcIkdvb2dsZSBNYXBzXCIsXHJcbiAgICBcIldpa2lwZWRpYVwiLFxyXG4gICAgXCJHZW9nZWJyYVwiLFxyXG4gICAgXCJRdWl6bGV0XCIsXHJcbiAgICBcIk9wZW5TdHJlZXRNYXBcIixcclxuICAgIFwiU291bmRDbG91ZFwiLFxyXG4gICAgXCJTcG90aWZ5XCIsXHJcbiAgICBcIkFwcGxlIE11c2ljXCIsXHJcbiAgICBcIlRpZGFsXCIsXHJcbiAgICBcIkRlZXplclwiLFxyXG4gICAgXCJTdGVhbVwiLFxyXG4gICAgXCJZb3VUdWJlXCIsXHJcbiAgICBcIlZpbWVvXCIsXHJcbiAgICBcIkRhaWx5bW90aW9uXCIsXHJcbiAgICBcIlZLIFZpZGVvXCIsXHJcbiAgICBcIlR3aXRjaFwiLFxyXG4gICAgXCJUaWtUb2tcIixcclxuICAgIFwiSW5zdGFncmFtXCIsXHJcbiAgICBcIkZhY2Vib29rXCIsXHJcbiAgICBcIlBpbnRlcmVzdFwiLFxyXG4gICAgXCJUZWxlZ3JhbVwiLFxyXG4gICAgXCJNYXN0b2RvblwiLFxyXG4gICAgXCJUaHJlYWRzXCIsXHJcbl0gYXMgY29uc3Q7XHJcblxyXG5leHBvcnQgdHlwZSBTdXBwb3J0ZWRXZWJzaXRlcyA9ICh0eXBlb2Ygc3VwcG9ydGVkV2Vic2l0ZXMpW251bWJlcl07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBsdWdpblNldHRpbmdzIHtcclxuXHJcbiAgICAvLyBHZW5lcmFsXHJcbiAgICBkYXJrTW9kZTogYm9vbGVhbjtcclxuICAgIHByZWxvYWRPcHRpb246IFByZWxvYWRPcHRpb25zO1xyXG4gICAgc2hvd09yaWdpbmFsTGluazogYm9vbGVhbjtcclxuXHJcbiAgICAvLyBEb3dubG9hZCBmcm9tIGVtYmVkXHJcbiAgICBzYXZlSW1hZ2VzVG9WYXVsdDogYm9vbGVhbjtcclxuICAgIHNhdmVTb2NpYWxNZWRpYUltYWdlc1RvVmF1bHQ6IGJvb2xlYW47XHJcbiAgICBpbWFnZUZvbGRlclBhdGg6IHN0cmluZztcclxuICAgIGdvb2dsZURvY3NGb2xkZXJQYXRoOiBzdHJpbmc7XHJcbiAgICBzYXZlR29vZ2xlRG9jc1RvVmF1bHQ6IGJvb2xlYW47XHJcbiAgICBzYXZlUXVpemxldENhcmRzVG9WYXVsdDogYm9vbGVhbjtcclxuICAgIHNhdmVRdWl6bGV0SW1hZ2VzVG9WYXVsdDogYm9vbGVhbjtcclxuICAgIHNhdmVRdWl6bGV0QXNTZXBhcmF0ZU5vdGVzOiBib29sZWFuO1xyXG4gICAgcXVpemxldEZvbGRlclBhdGg6IHN0cmluZztcclxuXHJcbiAgICAvLyBBZHZhbmNlZFxyXG4gICAgZGVidWc6IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBQbHVnaW5TZXR0aW5ncyA9IHtcclxuICAgIGRhcmtNb2RlOiB0cnVlLFxyXG4gICAgcHJlbG9hZE9wdGlvbjogUHJlbG9hZE9wdGlvbnMuUGxhY2Vob2xkZXIsXHJcbiAgICBzaG93T3JpZ2luYWxMaW5rOiB0cnVlLFxyXG5cclxuICAgIHNhdmVJbWFnZXNUb1ZhdWx0OiBmYWxzZSxcclxuICAgIHNhdmVTb2NpYWxNZWRpYUltYWdlc1RvVmF1bHQ6IGZhbHNlLFxyXG4gICAgaW1hZ2VGb2xkZXJQYXRoOiBcImxpbmtlZC1pZnJhbWUtaW1hZ2VzXCIsXHJcbiAgICBnb29nbGVEb2NzRm9sZGVyUGF0aDogXCJsaW5rZWQtaWZyYW1lLWRvY3NcIixcclxuICAgIHNhdmVHb29nbGVEb2NzVG9WYXVsdDogZmFsc2UsXHJcbiAgICBzYXZlUXVpemxldENhcmRzVG9WYXVsdDogZmFsc2UsXHJcbiAgICBzYXZlUXVpemxldEltYWdlc1RvVmF1bHQ6IGZhbHNlLFxyXG4gICAgc2F2ZVF1aXpsZXRBc1NlcGFyYXRlTm90ZXM6IGZhbHNlLFxyXG4gICAgcXVpemxldEZvbGRlclBhdGg6IFwibGlua2VkLWlmcmFtZS1xdWl6bGV0XCIsXHJcblxyXG4gICAgZGVidWc6IGZhbHNlLFxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQXV0b0VtYmVkU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xyXG5cclxuICAgIHBsdWdpbjogQXV0b0VtYmVkUGx1Z2luO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEF1dG9FbWJlZFBsdWdpbikge1xyXG4gICAgICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcclxuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcclxuICAgIH1cclxuXHJcbiAgICBkaXNwbGF5KCk6IHZvaWQge1xyXG5cclxuICAgICAgICBjb25zdCB7Y29udGFpbmVyRWx9ID0gdGhpcztcclxuICAgICAgICBjb25zdCBwbHVnaW4gPSB0aGlzLnBsdWdpbjtcclxuICAgICAgICBjb25zdCBzZXR0aW5ncyA9IHBsdWdpbi5zZXR0aW5ncztcclxuXHJcbiAgICAgICAgY29udGFpbmVyRWwuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gRW51bVRvUmVjb3JkPFQgZXh0ZW5kcyB7W2tleTogbnVtYmVyXTogc3RyaW5nIHwgbnVtYmVyfT4oZTogVCk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlY29yZE91dHB1dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xyXG5cclxuICAgICAgICAgICAgZm9yIChjb25zdCBvcHRpb24gaW4gZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghaXNOYU4oTnVtYmVyKG9wdGlvbikpKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlUZXh0ID1cclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24ucmVwbGFjZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyhbYS16MC05XSkoW0EtWl0pL2csXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChtYXRjaDogc3RyaW5nLCBwMTogc3RyaW5nLCBwMjogc3RyaW5nKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYCR7cDF9ICR7cDIudG9Mb3dlckNhc2UoKX1gXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZWNvcmRPdXRwdXRbb3B0aW9uXSA9IGRpc3BsYXlUZXh0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVjb3JkT3V0cHV0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlQ29sbGFwc2libGVTZWN0aW9uKHRpdGxlOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRldGFpbHMgPSBjb250YWluZXJFbC5jcmVhdGVFbChcImRldGFpbHNcIik7XHJcbiAgICAgICAgICAgIGRldGFpbHMuY2xhc3NMaXN0LmFkZChcImF1dG8tZW1iZWQtc2V0dGluZ3Mtc2VjdGlvblwiKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHN1bW1hcnkgPSBkZXRhaWxzLmNyZWF0ZUVsKFwic3VtbWFyeVwiKTtcclxuICAgICAgICAgICAgc3VtbWFyeS5jbGFzc0xpc3QuYWRkKFwiYXV0by1lbWJlZC1zZXR0aW5ncy1zZWN0aW9uLXN1bW1hcnlcIik7XHJcbiAgICAgICAgICAgIHN1bW1hcnkuc2V0VGV4dCh0aXRsZSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBkZXNjID0gZGV0YWlscy5jcmVhdGVEaXYoXCJhdXRvLWVtYmVkLXNldHRpbmdzLXNlY3Rpb24tZGVzY1wiKTtcclxuICAgICAgICAgICAgZGVzYy5zZXRUZXh0KGRlc2NyaXB0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBkZXRhaWxzLmNyZWF0ZURpdihcImF1dG8tZW1iZWQtc2V0dGluZ3Mtc2VjdGlvbi1jb250ZW50XCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYWRkVmlzdWFsRGl2aWRlcihwYXJlbnQ6IEhUTUxFbGVtZW50KTogdm9pZCB7XHJcbiAgICAgICAgICAgIHBhcmVudC5jcmVhdGVFbChcImhyXCIsIHsgY2xzOiBcImF1dG8tZW1iZWQtc2V0dGluZ3MtZGl2aWRlclwiIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8g4pSA4pSAIEdlbmVyYWwgc2V0dGluZ3Mg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXHJcblxyXG4gICAgICAgIGNvbnN0IHByZXZpZXdUb29sdGlwID0gXCJPcGVucyBhIG1vZGFsIHRvIHRlc3QgZW1iZWQgbGlua3NcIjtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiUHJldmlldyBlbWJlZFwiKVxyXG4gICAgICAgICAgICAuc2V0VG9vbHRpcChwcmV2aWV3VG9vbHRpcClcclxuICAgICAgICAgICAgLmFkZEJ1dHRvbihidG4gPT4gYnRuXHJcbiAgICAgICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIlByZXZpZXdcIilcclxuICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKHByZXZpZXdUb29sdGlwKVxyXG4gICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vZGFsID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFByZXZpZXdFbWJlZE1vZGFsKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1Z2luLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJodHRwczovL3guY29tL29ic2RtZC9zdGF0dXMvMTczOTY2NzIxMTQ2MjMxNjQ0OVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kYWwub3BlbigpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJEYXJrIG1vZGVcIilcclxuICAgICAgICAgICAgLnNldERlc2MoXCJVc2UgZGFyayB0aGVtZSBmb3IgZW1iZWRzIHdoZW4gc3VwcG9ydGVkXCIpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHNldHRpbmdzLmRhcmtNb2RlKVxyXG4gICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jIHZhbHVlID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3MuZGFya01vZGUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBjb25zdCBwcmVsb2FkT3B0aW9ucyA9IEVudW1Ub1JlY29yZChQcmVsb2FkT3B0aW9ucyk7XHJcblxyXG4gICAgICAgIE9iamVjdC5lbnRyaWVzKHByZWxvYWRPcHRpb25zKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcclxuXHJcbiAgICAgICAgICAgIHByZWxvYWRPcHRpb25zW2tleV0gPSB2YWx1ZS5yZXBsYWNlKFwiX1wiLCBcIiArIFwiKTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIlByZWxvYWQgb3B0aW9uc1wiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcIkNob29zZSBob3cgdGhlIGVtYmVkIGJlaGF2ZXMgYmVmb3JlIGxvYWRpbmdcIilcclxuICAgICAgICAgICAgLmFkZERyb3Bkb3duKGRyb3Bkb3duID0+IGRyb3Bkb3duXHJcbiAgICAgICAgICAgICAgICAuYWRkT3B0aW9ucyhwcmVsb2FkT3B0aW9ucylcclxuICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShQcmVsb2FkT3B0aW9uc1tzZXR0aW5ncy5wcmVsb2FkT3B0aW9uXSlcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyB2YWx1ZSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNldHRpbmdzLnByZWxvYWRPcHRpb24gPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBQcmVsb2FkT3B0aW9uc1t2YWx1ZSBhcyBrZXlvZiB0eXBlb2YgUHJlbG9hZE9wdGlvbnNdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJTaG93IG9yaWdpbmFsIGxpbmsgdW5kZXIgZW1iZWRcIilcclxuICAgICAgICAgICAgLnNldERlc2MoXCJEaXNwbGF5IGFuIFxcXCJPcGVuIG9yaWdpbmFsIGxpbmtcXFwiIGZvb3RlciBiZWxvdyBnZW5lcmF0ZWQgZW1iZWRzXCIpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHNldHRpbmdzLnNob3dPcmlnaW5hbExpbmspXHJcbiAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgdmFsdWUgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy5zaG93T3JpZ2luYWxMaW5rID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG5cclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgYWRkVmlzdWFsRGl2aWRlcihjb250YWluZXJFbCk7XHJcblxyXG4gICAgICAgIC8vIOKUgOKUgCBHZW5lcmljIGRvd25sb2FkIHNldHRpbmdzIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJTYXZlIGltYWdlIGVtYmVkcyB0byB2YXVsdFwiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcIkRvd25sb2FkIGRpcmVjdCBpbWFnZSBVUkxzIGFuZCByZXBsYWNlIGVtYmVkIGxpbmtzIHdpdGggbG9jYWwgdmF1bHQgZmlsZXNcIilcclxuICAgICAgICAgICAgLmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXHJcbiAgICAgICAgICAgICAgICAuc2V0VmFsdWUoc2V0dGluZ3Muc2F2ZUltYWdlc1RvVmF1bHQpXHJcbiAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgdmFsdWUgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy5zYXZlSW1hZ2VzVG9WYXVsdCA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIlNhdmUgc29jaWFsIG1lZGlhIGltYWdlcyB0byB2YXVsdFwiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcIkZvciBzdXBwb3J0ZWQgcGxhdGZvcm1zIChJbnN0YWdyYW0sIEZhY2Vib29rLCBQaW50ZXJlc3QsIFRlbGVncmFtLCBNYXN0b2RvbiwgUmVkZGl0LCBUaWtUb2ssIEltZ3VyLCBTb3VuZENsb3VkLCBTcG90aWZ5LCBDb2RlUGVuLCBTdGVhbSksIGZldGNoIGF2YWlsYWJsZSBtZWRpYSBpbWFnZXMgYW5kIHNhdmUgdGhlbSBsb2NhbGx5XCIpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHNldHRpbmdzLnNhdmVTb2NpYWxNZWRpYUltYWdlc1RvVmF1bHQpXHJcbiAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgdmFsdWUgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy5zYXZlU29jaWFsTWVkaWFJbWFnZXNUb1ZhdWx0ID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG5cclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiU2F2ZSBHb29nbGUgRG9jcyB0byB2YXVsdFwiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcIkRvd25sb2FkIGEgbG9jYWwgTWFya2Rvd24gY29weSBvZiB0aGUgZG9jdW1lbnQgd2hlbiBlbWJlZGRpbmcgYSBHb29nbGUgRG9jIChyZXF1aXJlcyB0aGUgZG9jdW1lbnQgdG8gYmUgc2hhcmVkIHdpdGggYW55b25lIHdpdGggdGhlIGxpbmspXCIpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHNldHRpbmdzLnNhdmVHb29nbGVEb2NzVG9WYXVsdClcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyB2YWx1ZSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNldHRpbmdzLnNhdmVHb29nbGVEb2NzVG9WYXVsdCA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIkltYWdlIGZvbGRlciBwYXRoXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFwiRm9sZGVyIGluc2lkZSB5b3VyIHZhdWx0IHVzZWQgZm9yIGRvd25sb2FkZWQgaW1hZ2UgY29udGVudFwiKVxyXG4gICAgICAgICAgICAuYWRkVGV4dCh0ZXh0ID0+IHRleHRcclxuICAgICAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcImxpbmtlZC1pZnJhbWUtaW1hZ2VzXCIpXHJcbiAgICAgICAgICAgICAgICAuc2V0VmFsdWUoc2V0dGluZ3MuaW1hZ2VGb2xkZXJQYXRoKVxyXG4gICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jIHZhbHVlID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3MuaW1hZ2VGb2xkZXJQYXRoID0gdmFsdWUudHJpbSgpIHx8IFwibGlua2VkLWlmcmFtZS1pbWFnZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJHb29nbGUgRG9jcyBmb2xkZXIgcGF0aFwiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcIkZvbGRlciBpbnNpZGUgeW91ciB2YXVsdCB1c2VkIGZvciBkb3dubG9hZGVkIEdvb2dsZSBEb2NzIE1hcmtkb3duIGZpbGVzXCIpXHJcbiAgICAgICAgICAgIC5hZGRUZXh0KHRleHQgPT4gdGV4dFxyXG4gICAgICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwibGlua2VkLWlmcmFtZS1kb2NzXCIpXHJcbiAgICAgICAgICAgICAgICAuc2V0VmFsdWUoc2V0dGluZ3MuZ29vZ2xlRG9jc0ZvbGRlclBhdGgpXHJcbiAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgdmFsdWUgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy5nb29nbGVEb2NzRm9sZGVyUGF0aCA9IHZhbHVlLnRyaW0oKSB8fCBcImxpbmtlZC1pZnJhbWUtZG9jc1wiO1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGFkZFZpc3VhbERpdmlkZXIoY29udGFpbmVyRWwpO1xyXG5cclxuICAgICAgICAvLyDilIDilIAgUXVpemxldCBzZXR0aW5ncyAoY29sbGFwc2libGUpIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxyXG5cclxuICAgICAgICBjb25zdCBxdWl6bGV0Q29udGVudCA9IGNyZWF0ZUNvbGxhcHNpYmxlU2VjdGlvbihcclxuICAgICAgICAgICAgXCJRdWl6bGV0XCIsXHJcbiAgICAgICAgICAgIFwiQ29uZmlndXJlIFF1aXpsZXQgY2FyZCBleHBvcnRzIGFuZCB1cGRhdGUgYmVoYXZpb3JcIlxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHF1aXpsZXRNb2RlRGVzY3JpcHRpb24gPSBuZXcgRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIHF1aXpsZXRNb2RlRGVzY3JpcHRpb24uYXBwZW5kVGV4dChcIldoZW4gZW5hYmxlZCwgY3JlYXRlIG9uZSBmb2xkZXIgcGVyIHNldCBhbmQgb25lIE1hcmtkb3duIG5vdGUgcGVyIGNhcmQgZm9yIFwiKTtcclxuICAgICAgICBxdWl6bGV0TW9kZURlc2NyaXB0aW9uLmFwcGVuZENoaWxkKGNyZWF0ZUVsKFwiYVwiLCB7XHJcbiAgICAgICAgICAgIHRleHQ6IFwiWWFua2lcIixcclxuICAgICAgICAgICAgaHJlZjogXCJvYnNpZGlhbjovL3Nob3ctcGx1Z2luP2lkPXlhbmtpXCIsXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICAgIHF1aXpsZXRNb2RlRGVzY3JpcHRpb24uYXBwZW5kVGV4dChcIiBjb21wYXRpYmlsaXR5LiBXaGVuIGRpc2FibGVkLCBzYXZlIG9uZSBNYXJrZG93biBmaWxlIHBlciBRdWl6bGV0IHNldCB1c2luZyB0aGUgb2xkZXIgZXhwb3J0IGZvcm1hdC5cIik7XHJcblxyXG4gICAgICAgIGNvbnN0IHF1aXpsZXRTYXZlRGVzY3JpcHRpb24gPSBuZXcgRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIHF1aXpsZXRTYXZlRGVzY3JpcHRpb24uYXBwZW5kVGV4dChcIkJlc3QtZWZmb3J0IGV4cG9ydCBvZiBwdWJsaWMgUXVpemxldCBmbGFzaGNhcmRzIHRvIGxvY2FsIE1hcmtkb3duIHdoZW4gY2FyZCBkYXRhIGlzIGFjY2Vzc2libGUuIFwiKTtcclxuICAgICAgICBxdWl6bGV0U2F2ZURlc2NyaXB0aW9uLmFwcGVuZENoaWxkKGNyZWF0ZUVsKFwic3Ryb25nXCIsIHsgdGV4dDogXCJQZXJmb3JtYW5jZSB3YXJuaW5nOlwiIH0pKTtcclxuICAgICAgICBxdWl6bGV0U2F2ZURlc2NyaXB0aW9uLmFwcGVuZFRleHQoXCIgdGhpcyBzZXR0aW5nIGhhcyBnZW5lcmFsIHBsdWdpbiBwZXJmb3JtYW5jZSBpbXBsaWNhdGlvbnMsIGFuZCB3aWxsIGVzcGVjaWFsbHkgY2F1c2Ugc3R1dHRlciB3aGVuIGVtYmVkZGluZyBsYXJnZXIgUXVpemxldCBzZXRzLlwiKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcocXVpemxldENvbnRlbnQpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiU2F2ZSBRdWl6bGV0IGNhcmRzIHRvIHZhdWx0XCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKHF1aXpsZXRTYXZlRGVzY3JpcHRpb24pXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHNldHRpbmdzLnNhdmVRdWl6bGV0Q2FyZHNUb1ZhdWx0KVxyXG4gICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jIHZhbHVlID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3Muc2F2ZVF1aXpsZXRDYXJkc1RvVmF1bHQgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhxdWl6bGV0Q29udGVudClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJRdWl6bGV0OiBzYXZlIGNhcmQgaW1hZ2VzIHRvIHZhdWx0XCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFwiV2hlbiBlbmFibGVkLCBkb3dubG9hZCBjYXJkIGltYWdlcyBmb3VuZCBpbiBRdWl6bGV0IHNldHMgYW5kIGVtYmVkIHRoZW0gbG9jYWxseSBpbiBleHBvcnRlZCBub3Rlc1wiKVxyXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKHRvZ2dsZSA9PiB0b2dnbGVcclxuICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShzZXR0aW5ncy5zYXZlUXVpemxldEltYWdlc1RvVmF1bHQpXHJcbiAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgdmFsdWUgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5ncy5zYXZlUXVpemxldEltYWdlc1RvVmF1bHQgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhxdWl6bGV0Q29udGVudClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJRdWl6bGV0OiBzYXZlIGFzIHNlcGFyYXRlIG5vdGVzXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKHF1aXpsZXRNb2RlRGVzY3JpcHRpb24pXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHNldHRpbmdzLnNhdmVRdWl6bGV0QXNTZXBhcmF0ZU5vdGVzKVxyXG4gICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jIHZhbHVlID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3Muc2F2ZVF1aXpsZXRBc1NlcGFyYXRlTm90ZXMgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBwbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyhxdWl6bGV0Q29udGVudClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJRdWl6bGV0IGZvbGRlciBwYXRoXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFwiRm9sZGVyIGluc2lkZSB5b3VyIHZhdWx0IHVzZWQgZm9yIGRvd25sb2FkZWQgUXVpemxldCBjYXJkIGV4cG9ydHNcIilcclxuICAgICAgICAgICAgLmFkZFRleHQodGV4dCA9PiB0ZXh0XHJcbiAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJsaW5rZWQtaWZyYW1lLXF1aXpsZXRcIilcclxuICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShzZXR0aW5ncy5xdWl6bGV0Rm9sZGVyUGF0aClcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyB2YWx1ZSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNldHRpbmdzLnF1aXpsZXRGb2xkZXJQYXRoID0gdmFsdWUudHJpbSgpIHx8IFwibGlua2VkLWlmcmFtZS1xdWl6bGV0XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgcGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG5cclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcocXVpemxldENvbnRlbnQpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiVXBkYXRlIGFsbCBzYXZlZCBRdWl6bGV0IGNhcmRzXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFwiUHJpbWFyeSBhY3Rpb246IHJlZnJlc2ggZXZlcnkgUXVpemxldCBzZXQgdGhhdCBoYXMgYSBzdG9yZWQgcXVpemxldDpzb3VyY2UgbWFya2VyIGluIHlvdXIgdmF1bHQuXCIpXHJcbiAgICAgICAgICAgIC5hZGRCdXR0b24oYnV0dG9uID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBpc1VwZGF0aW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgYnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJVcGRhdGUgYWxsIFF1aXpsZXQgY2FyZHNcIilcclxuICAgICAgICAgICAgICAgICAgICAuc2V0Q3RhKClcclxuICAgICAgICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1VwZGF0aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzVXBkYXRpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBidXR0b24uc2V0RGlzYWJsZWQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5zZXRCdXR0b25UZXh0KFwiVXBkYXRpbmcuLi5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJJIGxpbmsgdGhlcmVmb3JlIGlmcmFtZTogdXBkYXRpbmcgYWxsIHNhdmVkIFF1aXpsZXQgY2FyZHMuLi5cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcGx1Z2luLnVwZGF0ZUFsbFNhdmVkUXVpemxldENhcmRzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBJIGxpbmsgdGhlcmVmb3JlIGlmcmFtZTogcmVmcmVzaGVkICR7cmVzdWx0LnJlZnJlc2hlZFNldENvdW50fS8ke3Jlc3VsdC51bmlxdWVTZXRDb3VudH0gUXVpemxldCBzZXRzIChgICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgc2F2ZWQgJHtyZXN1bHQuc2F2ZWRDb3VudH0sIHVwZGF0ZWQgJHtyZXN1bHQudXBkYXRlZENvdW50fSwgdW5jaGFuZ2VkICR7cmVzdWx0LnVuY2hhbmdlZENvdW50fSwgYCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYG5vLWNhcmRzICR7cmVzdWx0Lm5vQ2FyZHNDb3VudH0sIG5vdC1odG1sICR7cmVzdWx0Lm5vdEh0bWxDb3VudH0sIGVycm9ycyAke3Jlc3VsdC5lcnJvckNvdW50fSkuYCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxMjAwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZShcIkkgbGluayB0aGVyZWZvcmUgaWZyYW1lOiBmYWlsZWQgdG8gdXBkYXRlIGFsbCBzYXZlZCBRdWl6bGV0IGNhcmRzLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVXBkYXRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5zZXREaXNhYmxlZChmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b24uc2V0QnV0dG9uVGV4dChcIlVwZGF0ZSBhbGwgUXVpemxldCBjYXJkc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8g4pSA4pSAIEZvb3RlciDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcclxuXHJcbiAgICAgICAgY29uc3QgYWRkaXRpb25hbEluZm8gPSBuZXcgRG9jdW1lbnRGcmFnbWVudCgpO1xyXG5cclxuICAgICAgICBhZGRpdGlvbmFsSW5mby5hcHBlbmRUZXh0KFwiRm91bmQgYnVncyBvciB3YW50IGEgZmVhdHVyZT9cIik7XHJcbiAgICAgICAgYWRkaXRpb25hbEluZm8uYXBwZW5kQ2hpbGQoY3JlYXRlRWwoXCJiclwiKSk7XHJcblxyXG4gICAgICAgIGFkZGl0aW9uYWxJbmZvLmFwcGVuZENoaWxkKGNyZWF0ZUVsKFwiYVwiLCB7XHJcbiAgICAgICAgICAgIHRleHQ6IFwiQ3JlYXRlIGEgR2l0SHViIGlzc3VlXCIsXHJcbiAgICAgICAgICAgIGhyZWY6IFwiaHR0cHM6Ly9naXRodWIuY29tL0dpbGdhbWVzaC1UYW1hcmlhbi9vYnNpZGlhbi1saW5rLWlmcmFtZS9pc3N1ZXMvbmV3XCJcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhhZGRpdGlvbmFsSW5mbyk7XHJcbiAgICB9XHJcbn1cclxuIl19