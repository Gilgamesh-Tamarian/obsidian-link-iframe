import AutoEmbedPlugin from "src/main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { PreviewEmbedModal } from "src/preview-embed-modal";
import { setCssProps } from "./utility";

export enum FallbackOptions {
    ShowErrorMessage,
    EmbedLink,
    Hide,
}

export enum GoogleDocsViewOptions {
    Preview,
    EditMinimal,
    EditDefault,
}

export enum PreloadOptions {
    None,
    Placeholder,
    Placeholder_ClickToLoad,
}

const supportedWebsites = [
    "Twitter/X",
    "Imgur",
    "Reddit",
    "CodePen",
    "Google Docs",
    "SoundCloud",
    "Spotify",
    "Steam",
    "TikTok",
    "Instagram",
    "Mastodon"
] as const;

export type SupportedWebsites = (typeof supportedWebsites)[number];

export type SupportedWebsitesMap = {
    [key in SupportedWebsites]: boolean
};

export interface PluginSettings {

    // General
    darkMode: boolean;
    preloadOption: PreloadOptions;
    suggestEmbed: boolean;

    enabledWebsites: SupportedWebsitesMap;

    // Mastodon instances
    mastodonInstances: string[];
    // Mastodon default embed height
    mastodonDefaultHeight: string;

    // Google Docs
    googleDocsViewOption: GoogleDocsViewOptions;

    // Fallback
    fallbackOptions: FallbackOptions;
    fallbackWidth: string;
    fallbackHeight: string;
    fallbackDefaultLink: string;
    fallbackAutoTitle: boolean;

    // Advanced
    showAdvancedSettings: boolean;
    debug: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    darkMode: true,
    preloadOption: PreloadOptions.Placeholder,
    suggestEmbed: true,

    enabledWebsites: ResetEnabledWebsites(),

    mastodonInstances: [],
    mastodonDefaultHeight: "1000",

    googleDocsViewOption: GoogleDocsViewOptions.Preview,

    fallbackOptions: FallbackOptions.EmbedLink,
    fallbackWidth: "100%",
    fallbackHeight: "500px",
    fallbackDefaultLink: "Link",
    fallbackAutoTitle: true,

    showAdvancedSettings: false,
    debug: false,
}

export class AutoEmbedSettingTab extends PluginSettingTab {

    plugin: AutoEmbedPlugin;

    constructor(app: App, plugin: AutoEmbedPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {

        const {containerEl} = this;
        const plugin = this.plugin;
        const settings = plugin.settings;

        containerEl.empty();

        function ValidateSettings(setting: PluginSettings, plugin: AutoEmbedPlugin) {

            if (setting.enabledWebsites && Object.keys(setting.enabledWebsites).length > 0) {

                const newWebsites = supportedWebsites.filter(
                    website => setting.enabledWebsites[website] === undefined
                );

                if (newWebsites.length > 0) {
                    newWebsites.forEach(
                        website => setting.enabledWebsites[website] = true
                    );
                    void plugin.saveSettings();
                }

            } else {

                setting.enabledWebsites = ResetEnabledWebsites();
                void plugin.saveSettings();

            }
        }

        ValidateSettings(settings, plugin);

        function EnumToRecord<T extends {[key: number]: string | number}>(e: T): Record<string, string>  {

            const recordOutput: Record<string, string> = {};

            for (const option in e) {

                if (!isNaN(Number(option)))
                    continue;

                const displayText =
                    option.replace(
                        /([a-z0-9])([A-Z])/g,
                        (match: string, p1: string, p2: string) =>
                            `${p1} ${p2.toLowerCase()}`
                    );

                recordOutput[option] = displayText;
            }

            return recordOutput;
        }

        function AddPadding(setting: Setting, addBottomBorder = false) {

                setCssProps(setting.settingEl, {
                    paddingLeft: "2em",
                    borderLeft: "1px solid var(--background-modifier-border)"
                });

                if (addBottomBorder) {
                    setCssProps(setting.settingEl, {
                        borderBottom: "1px solid var(--background-modifier-border)"
                    });
                }
        }

        const previewTooltip = "Opens a modal to test embed links";

        new Setting(containerEl)
            .setName("Preview embed")
            .setTooltip(previewTooltip)
            .addButton(btn => btn
                .setButtonText("Preview")
                .setTooltip(previewTooltip)
                .onClick(() => {
                    const modal =
                        new PreviewEmbedModal(
                            plugin,
                            "https://x.com/obsdmd/status/1739667211462316449"
                        );
                    modal.open();
                }));

        new Setting(containerEl)
            .setName("Dark mode")
            .setDesc("Use dark theme for embeds when supported")
            .addToggle(toggle => toggle
                .setValue(settings.darkMode)
                .onChange(async value => {

                    settings.darkMode = value;
                    await plugin.saveSettings();

                }));

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
                .onChange(async value => {

                    settings.preloadOption =
                        PreloadOptions[value as keyof typeof PreloadOptions];

                    await plugin.saveSettings();

                }));

        new Setting(containerEl)
            .setName("Suggest embed")
            .setDesc("Suggest embedding when pasting a link")
            .addToggle(toggle => toggle
                .setValue(settings.suggestEmbed)
                .onChange(async value => {

                    settings.suggestEmbed = value;

                    if (value)
                        plugin.registerSuggest();

                    await plugin.saveSettings();

                }));

        new Setting(containerEl)
            .setName("Supported websites")
            .setHeading()
            .setDesc("Enable or disable embed support for specific websites");

        for (const website in settings.enabledWebsites) {

            const websiteSetting =
                new Setting(containerEl)
                    .setName(website)
                    .addToggle(toggle => toggle
                        .setValue(settings.enabledWebsites[website as SupportedWebsites])
                        .onChange(async value => {

                            settings.enabledWebsites[website as SupportedWebsites] = value;
                            await plugin.saveSettings();

                        }));

            AddPadding(websiteSetting, true);
        }

        /*
        Mastodon instance settings
        */

        new Setting(containerEl)
            .setName("Mastodon instances")
            .setHeading()
            .setDesc("Enter mastodon servers that should be recognized as embeds (one per line). \nNote: mastodon.social is always allowed regardless of settings");

        new Setting(containerEl)
            .setName("Allowed mastodon servers")
            .addTextArea(text => {

                text
                    .setPlaceholder(
                        "Placeholder text."
                    )
                    .setValue(settings.mastodonInstances.join("\n"))
                    .onChange(async value => {

                        settings.mastodonInstances =
                            value
                                .split("\n")
                                .map(v => v.trim())
                                .filter(v => v.length > 0);

                        await plugin.saveSettings();

                    });

                text.inputEl.rows = 6;

            });

        new Setting(containerEl)
            .setName("Mastodon default embed height")
            .setDesc("Set the default height (in px) for mastodon embeds. Standard default: 750.\n\nA larger default height is necessary to correctly render longer posts, but will result in excessive space for smaller posts. You can manually adjust the height for individual embeds if needed.")
            .addText(text => {
                text.setValue(settings.mastodonDefaultHeight)
                    .onChange(async value => {
                        settings.mastodonDefaultHeight = value;
                        await plugin.saveSettings();
                    });
            });

        /*
        Google Docs settings
        */

        new Setting(containerEl)
            .setName("Google Docs")
            .setHeading()
            .setDesc("Settings for Google Docs embeds");

        const googleDocsViewOptions = EnumToRecord(GoogleDocsViewOptions);

        const googleDocsViewSetting =
            new Setting(containerEl)
                .setName("View option")
                .setDesc("Choose how Google Docs are displayed")
                .addDropdown(dropdown => dropdown
                    .addOptions(googleDocsViewOptions)
                    .setValue(GoogleDocsViewOptions[settings.googleDocsViewOption])
                    .onChange(async value => {

                        settings.googleDocsViewOption =
                            GoogleDocsViewOptions[value as keyof typeof GoogleDocsViewOptions];

                        await plugin.saveSettings();

                    }));

        AddPadding(googleDocsViewSetting, true);

        /*
        Fallback settings
        */

        new Setting(containerEl)
            .setName("Fallback")
            .setHeading()
            .setDesc("Settings for unsupported / unrecognized links");

        const fallbackOptionValues = EnumToRecord(FallbackOptions);

        const fallbackOptionSetting =
            new Setting(containerEl)
                .setName("Fallback option")
                .setDesc("Choose how unsupported links are handled")
                .addDropdown(dropdown => dropdown
                    .addOptions(fallbackOptionValues)
                    .setValue(FallbackOptions[settings.fallbackOptions])
                    .onChange(async value => {

                        settings.fallbackOptions =
                            FallbackOptions[value as keyof typeof FallbackOptions];

                        await plugin.saveSettings();

                    }));

        AddPadding(fallbackOptionSetting);

        const fallbackWidthSetting =
            new Setting(containerEl)
                .setName("Fallback width")
                .setDesc("Default width for fallback embeds (CSS value, e.g. 100%)")
                .addText(text => text
                    .setPlaceholder("100%")
                    .setValue(settings.fallbackWidth)
                    .onChange(async value => {

                        settings.fallbackWidth = value;
                        await plugin.saveSettings();

                    }));

        AddPadding(fallbackWidthSetting);

        const fallbackHeightSetting =
            new Setting(containerEl)
                .setName("Fallback height")
                .setDesc("Default height for fallback embeds (CSS value, e.g. 500px)")
                .addText(text => text
                    .setPlaceholder("500px")
                    .setValue(settings.fallbackHeight)
                    .onChange(async value => {

                        settings.fallbackHeight = value;
                        await plugin.saveSettings();

                    }));

        AddPadding(fallbackHeightSetting);

        const fallbackDefaultLinkSetting =
            new Setting(containerEl)
                .setName("Default link text")
                .setDesc("Text to display for the link below a fallback embed when auto title is disabled")
                .addText(text => text
                    .setPlaceholder("Link")
                    .setValue(settings.fallbackDefaultLink)
                    .onChange(async value => {

                        settings.fallbackDefaultLink = value;
                        await plugin.saveSettings();

                    }));

        AddPadding(fallbackDefaultLinkSetting);

        const fallbackAutoTitleSetting =
            new Setting(containerEl)
                .setName("Auto title")
                .setDesc("Automatically fetch and display the page title as the link text below fallback embeds")
                .addToggle(toggle => toggle
                    .setValue(settings.fallbackAutoTitle)
                    .onChange(async value => {

                        settings.fallbackAutoTitle = value;
                        await plugin.saveSettings();

                    }));

        AddPadding(fallbackAutoTitleSetting, true);

        /*
        Advanced settings
        */

        new Setting(containerEl)
            .setName("Advanced")
            .setHeading()
            .addToggle(toggle => toggle
                .setValue(settings.showAdvancedSettings)
                .onChange(async value => {

                    settings.showAdvancedSettings = value;
                    await plugin.saveSettings();
                    this.display();

                }));

        if (settings.showAdvancedSettings) {

            const debugSetting =
                new Setting(containerEl)
                    .setName("Debug mode")
                    .setDesc("Log additional information to the console for troubleshooting")
                    .addToggle(toggle => toggle
                        .setValue(settings.debug)
                        .onChange(async value => {

                            settings.debug = value;
                            await plugin.saveSettings();

                        }));

            AddPadding(debugSetting, true);

        }

        const additionalInfo = new DocumentFragment();

        additionalInfo.appendText("All values use ");
        additionalInfo.appendChild(createEl("a", {
            text: "CSS units",
            href: "https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units#numbers_lengths_and_percentages"
        }));

        additionalInfo.appendChild(createEl("br"));
        additionalInfo.appendText("Reload notes to apply changes.");

        additionalInfo.appendChild(createEl("br"));
        additionalInfo.appendChild(createEl("br"));

        additionalInfo.appendText("Found bugs or want a feature?");
        additionalInfo.appendChild(createEl("br"));

        additionalInfo.appendChild(createEl("a", {
            text: "Create a GitHub issue",
            href: "https://github.com/Gilgamesh-Tamarian/obsidian-auto-embed-plus/issues/new"
        }));

        new Setting(containerEl)
            .setDesc(additionalInfo);
    }
}

function ResetEnabledWebsites(): SupportedWebsitesMap {

    return Object.fromEntries(
        supportedWebsites.map(website => [website, true])
    ) as SupportedWebsitesMap;

}
