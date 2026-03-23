import { setCssProps } from "../utility";
import { EmbedBase } from "./embedBase";
import { parseQuizletSetId } from "src/utils/url.utils";
// Sites in this file: Imgur, Steam, Google Calendar, Wikipedia, Geogebra, Quizlet.
export class ImgurEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "Imgur";
        this.regex = new RegExp(/https:\/\/imgur\.com\/(?:(?:a|gallery|(?:t\/\w+))\/)?(\w+)/);
        this.embedOrigin = "https://imgur.com";
    }
    createEmbed(url) {
        const regexMatch = url.match(this.regex);
        if (regexMatch === null)
            return this.onErrorCreatingEmbed(url);
        const imgurId = regexMatch[1];
        const iframe = this.createEmbedIframe({
            src: `https://imgur.com/a/${imgurId}/embed?pub=true`,
            containerClass: "imgur-embed",
            dataset: { imgurId },
            scrolling: "no",
            cacheKey: imgurId,
            cacheWidth: true,
        });
        return iframe;
    }
    onResizeMessage(e) {
        const data = JSON.parse(e.data);
        const href = data.href;
        const regexMatch = href.match(/https:\/\/imgur\.com\/(?:a\/)?(\w+)/);
        if (!regexMatch || regexMatch.length < 2)
            return;
        const imgurId = regexMatch[1];
        const iframes = document.querySelectorAll(`.imgur-embed iframe[data-imgur-id="${imgurId}"`);
        if (iframes.length === 0)
            return;
        for (let i = 0; i < iframes.length; ++i) {
            const iframe = iframes[i];
            if (data.message === "resize_imgur") {
                setCssProps(iframe, { height: data.height + "px" });
                setCssProps(iframe, { width: data.width + "px" });
                this.resizeContainer(iframe, iframe.style.height, iframe.style.width);
                this.cacheSize(imgurId, data.height, data.width);
            }
            else if (data.message === "404_imgur_embed") {
                iframe.src = iframe.src.replace("/a/", "/");
            }
        }
    }
}
export class SteamEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "Steam";
        this.regex = new RegExp(/https:\/\/store\.steampowered\.com\/app\/(\d+)/);
    }
    createEmbed(url) {
        const regexMatch = url.match(this.regex);
        if (regexMatch === null)
            return this.onErrorCreatingEmbed(url);
        return this.createEmbedIframe({
            src: `https://store.steampowered.com/widget/${regexMatch[1]}/`,
            containerClass: "steam-embed",
        });
    }
}
export class GoogleCalendarEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "Google Calendar";
        this.regex = new RegExp(/https:\/\/calendar\.google\.com\/calendar(?:\/(?:u\/\d+))?(?:\/(?:r|embed))?(?:[/?#].*)?/i);
        this.embedOrigin = "https://calendar.google.com";
    }
    decodeGoogleCalendarCid(cid) {
        const normalized = cid.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
        try {
            return atob(padded);
        }
        catch (_a) {
            return cid;
        }
    }
    createEmbed(url) {
        if (!this.regex.test(url))
            return this.onErrorCreatingEmbed(url);
        let calendarId = "";
        try {
            const parsed = new URL(url);
            const srcParam = parsed.searchParams.get("src");
            const cidParam = parsed.searchParams.get("cid");
            if (srcParam)
                calendarId = srcParam;
            else if (cidParam)
                calendarId = this.decodeGoogleCalendarCid(cidParam);
        }
        catch (_a) {
            return this.onErrorCreatingEmbed(url);
        }
        if (!calendarId)
            return this.onErrorCreatingEmbed(url, "Google Calendar link is missing src/cid parameter.");
        const embedUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`;
        return this.createEmbedIframe({
            src: embedUrl,
            containerClass: "google-calendar-embed",
            dataset: { calendarId },
            scrolling: "no",
            cacheKey: calendarId,
        });
    }
}
export class WikipediaEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "Wikipedia";
        this.regex = new RegExp(/https:\/\/([a-z]+-?[a-z]*)\.wikipedia\.org\/wiki\/([^/?#]+)/);
        this.embedOrigin = "https://www.wikipedia.org";
    }
    createEmbed(url) {
        const regexMatch = url.match(this.regex);
        if (regexMatch === null)
            return this.onErrorCreatingEmbed(url);
        const langCode = regexMatch[1];
        const articleTitle = regexMatch[2];
        const embedUrl = `https://${langCode}.wikipedia.org/wiki/${articleTitle}`;
        return this.createEmbedIframe({
            src: embedUrl,
            containerClass: "wikipedia-embed",
            dataset: { articleTitle, langCode },
            cacheKey: `${langCode}:${articleTitle}`,
        });
    }
}
export class GeogebraEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "Geogebra";
        // Supports geogebra.org material URLs: https://www.geogebra.org/m/{id}
        this.regex = new RegExp(/https:\/\/(?:www\.)?geogebra\.org\/m\/(\w+)/i);
        this.embedOrigin = "https://www.geogebra.org";
    }
    createEmbed(url) {
        const regexMatch = url.match(this.regex);
        if (regexMatch === null)
            return this.onErrorCreatingEmbed(url);
        const materialId = regexMatch[1];
        const embedUrl = `https://www.geogebra.org/material/iframe/id/${materialId}`;
        return this.createEmbedIframe({
            src: embedUrl,
            containerClass: "geogebra-embed",
            dataset: { materialId },
            allowFullscreen: true,
            cacheKey: materialId,
        });
    }
}
export class QuizletEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "Quizlet";
        // Match Quizlet links broadly, then parse the set id from varied path shapes.
        this.regex = new RegExp(/https:\/\/(?:www\.)?quizlet\.com\//i);
        this.embedOrigin = "https://quizlet.com";
    }
    createEmbed(url) {
        if (!this.regex.test(url))
            return this.onErrorCreatingEmbed(url);
        const setId = parseQuizletSetId(url);
        if (!setId)
            return this.onErrorCreatingEmbed(url, "Could not parse Quizlet set ID from URL.");
        const embedUrl = `https://quizlet.com/${setId}/flashcards/embed`;
        return this.createEmbedIframe({
            src: embedUrl,
            containerClass: "quizlet-embed",
            dataset: { quizletSetId: setId },
            allowFullscreen: true,
            cacheKey: setId,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pc2MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUV6QyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ3hDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBRXhELG1GQUFtRjtBQUVuRixNQUFNLE9BQU8sVUFBVyxTQUFRLFNBQVM7SUFBekM7O1FBQ0ksU0FBSSxHQUFzQixPQUFPLENBQUM7UUFDbEMsVUFBSyxHQUFHLElBQUksTUFBTSxDQUFDLDREQUE0RCxDQUFDLENBQUM7UUFDakYsZ0JBQVcsR0FBRyxtQkFBbUIsQ0FBQztJQW1EdEMsQ0FBQztJQWpERyxXQUFXLENBQUMsR0FBVztRQUNuQixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QyxJQUFJLFVBQVUsS0FBSyxJQUFJO1lBQ25CLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTFDLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU5QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFDbEMsR0FBRyxFQUFFLHVCQUF1QixPQUFPLGlCQUFpQjtZQUNwRCxjQUFjLEVBQUUsYUFBYTtZQUM3QixPQUFPLEVBQUUsRUFBRSxPQUFPLEVBQUU7WUFDcEIsU0FBUyxFQUFFLElBQUk7WUFDZixRQUFRLEVBQUUsT0FBTztZQUNqQixVQUFVLEVBQUUsSUFBSTtTQUNuQixDQUFDLENBQUM7UUFFSCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBRUQsZUFBZSxDQUFDLENBQWU7UUFDM0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQWMsQ0FBQztRQUNqQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7UUFFckUsSUFBSSxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUM7WUFDcEMsT0FBTztRQUVYLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5QixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsc0NBQXNDLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFFNUYsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUM7WUFDcEIsT0FBTztRQUVYLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDdEMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBc0IsQ0FBQztZQUUvQyxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssY0FBYyxFQUFFLENBQUM7Z0JBQ2xDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNwRCxXQUFXLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFFbEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFFdEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckQsQ0FBQztpQkFDSSxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssaUJBQWlCLEVBQUUsQ0FBQztnQkFDMUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDaEQsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUFFRCxNQUFNLE9BQU8sVUFBVyxTQUFRLFNBQVM7SUFBekM7O1FBQ0ksU0FBSSxHQUFzQixPQUFPLENBQUM7UUFDbEMsVUFBSyxHQUFHLElBQUksTUFBTSxDQUFDLGdEQUFnRCxDQUFDLENBQUM7SUFZekUsQ0FBQztJQVZHLFdBQVcsQ0FBQyxHQUFXO1FBQ25CLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLElBQUksVUFBVSxLQUFLLElBQUk7WUFDbkIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFMUMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFDMUIsR0FBRyxFQUFFLHlDQUF5QyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUc7WUFDOUQsY0FBYyxFQUFFLGFBQWE7U0FDaEMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBRUQsTUFBTSxPQUFPLG1CQUFvQixTQUFRLFNBQVM7SUFBbEQ7O1FBQ0ksU0FBSSxHQUFzQixpQkFBaUIsQ0FBQztRQUM1QyxVQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsMkZBQTJGLENBQUMsQ0FBQztRQUNoSCxnQkFBVyxHQUFHLDZCQUE2QixDQUFDO0lBNENoRCxDQUFDO0lBMUNXLHVCQUF1QixDQUFDLEdBQVc7UUFDdkMsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM3RCxNQUFNLE1BQU0sR0FBRyxVQUFVLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUUxRSxJQUFJLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN4QixDQUFDO1FBQUMsV0FBTSxDQUFDO1lBQ0wsT0FBTyxHQUFHLENBQUM7UUFDZixDQUFDO0lBQ0wsQ0FBQztJQUVELFdBQVcsQ0FBQyxHQUFXO1FBQ25CLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDckIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFMUMsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLElBQUksQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVCLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRWhELElBQUksUUFBUTtnQkFDUixVQUFVLEdBQUcsUUFBUSxDQUFDO2lCQUNyQixJQUFJLFFBQVE7Z0JBQ2IsVUFBVSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBQUMsV0FBTSxDQUFDO1lBQ0wsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUVELElBQUksQ0FBQyxVQUFVO1lBQ1gsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLG9EQUFvRCxDQUFDLENBQUM7UUFFaEcsTUFBTSxRQUFRLEdBQUcsa0RBQWtELGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFFcEcsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFDMUIsR0FBRyxFQUFFLFFBQVE7WUFDYixjQUFjLEVBQUUsdUJBQXVCO1lBQ3ZDLE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRTtZQUN2QixTQUFTLEVBQUUsSUFBSTtZQUNmLFFBQVEsRUFBRSxVQUFVO1NBQ3ZCLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQUVELE1BQU0sT0FBTyxjQUFlLFNBQVEsU0FBUztJQUE3Qzs7UUFDSSxTQUFJLEdBQXNCLFdBQVcsQ0FBQztRQUN0QyxVQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsNkRBQTZELENBQUMsQ0FBQztRQUNsRixnQkFBVyxHQUFHLDJCQUEyQixDQUFDO0lBbUI5QyxDQUFDO0lBakJHLFdBQVcsQ0FBQyxHQUFXO1FBQ25CLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLElBQUksVUFBVSxLQUFLLElBQUk7WUFDbkIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFMUMsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9CLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVuQyxNQUFNLFFBQVEsR0FBRyxXQUFXLFFBQVEsdUJBQXVCLFlBQVksRUFBRSxDQUFDO1FBRTFFLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1lBQzFCLEdBQUcsRUFBRSxRQUFRO1lBQ2IsY0FBYyxFQUFFLGlCQUFpQjtZQUNqQyxPQUFPLEVBQUUsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFO1lBQ25DLFFBQVEsRUFBRSxHQUFHLFFBQVEsSUFBSSxZQUFZLEVBQUU7U0FDMUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBRUQsTUFBTSxPQUFPLGFBQWMsU0FBUSxTQUFTO0lBQTVDOztRQUNJLFNBQUksR0FBc0IsVUFBVSxDQUFDO1FBQ3JDLHVFQUF1RTtRQUN2RSxVQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsOENBQThDLENBQUMsQ0FBQztRQUNuRSxnQkFBVyxHQUFHLDBCQUEwQixDQUFDO0lBbUI3QyxDQUFDO0lBakJHLFdBQVcsQ0FBQyxHQUFXO1FBQ25CLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLElBQUksVUFBVSxLQUFLLElBQUk7WUFDbkIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFMUMsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRWpDLE1BQU0sUUFBUSxHQUFHLCtDQUErQyxVQUFVLEVBQUUsQ0FBQztRQUU3RSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUMxQixHQUFHLEVBQUUsUUFBUTtZQUNiLGNBQWMsRUFBRSxnQkFBZ0I7WUFDaEMsT0FBTyxFQUFFLEVBQUUsVUFBVSxFQUFFO1lBQ3ZCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLFFBQVEsRUFBRSxVQUFVO1NBQ3ZCLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQUVELE1BQU0sT0FBTyxZQUFhLFNBQVEsU0FBUztJQUEzQzs7UUFDSSxTQUFJLEdBQXNCLFNBQVMsQ0FBQztRQUNwQyw4RUFBOEU7UUFDOUUsVUFBSyxHQUFHLElBQUksTUFBTSxDQUFDLHFDQUFxQyxDQUFDLENBQUM7UUFDMUQsZ0JBQVcsR0FBRyxxQkFBcUIsQ0FBQztJQW9CeEMsQ0FBQztJQWxCRyxXQUFXLENBQUMsR0FBVztRQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTFDLE1BQU0sS0FBSyxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxLQUFLO1lBQ04sT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLDBDQUEwQyxDQUFDLENBQUM7UUFFdEYsTUFBTSxRQUFRLEdBQUcsdUJBQXVCLEtBQUssbUJBQW1CLENBQUM7UUFFakUsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFDMUIsR0FBRyxFQUFFLFFBQVE7WUFDYixjQUFjLEVBQUUsZUFBZTtZQUMvQixPQUFPLEVBQUUsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFO1lBQ2hDLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLFFBQVEsRUFBRSxLQUFLO1NBQ2xCLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNldENzc1Byb3BzIH0gZnJvbSBcIi4uL3V0aWxpdHlcIjtcclxuaW1wb3J0IHsgU3VwcG9ydGVkV2Vic2l0ZXMgfSBmcm9tIFwic3JjL3NldHRpbmdzLXRhYlwiO1xyXG5pbXBvcnQgeyBFbWJlZEJhc2UgfSBmcm9tIFwiLi9lbWJlZEJhc2VcIjtcclxuaW1wb3J0IHsgcGFyc2VRdWl6bGV0U2V0SWQgfSBmcm9tIFwic3JjL3V0aWxzL3VybC51dGlsc1wiO1xyXG5cclxuLy8gU2l0ZXMgaW4gdGhpcyBmaWxlOiBJbWd1ciwgU3RlYW0sIEdvb2dsZSBDYWxlbmRhciwgV2lraXBlZGlhLCBHZW9nZWJyYSwgUXVpemxldC5cclxuXHJcbmV4cG9ydCBjbGFzcyBJbWd1ckVtYmVkIGV4dGVuZHMgRW1iZWRCYXNlIHtcclxuICAgIG5hbWU6IFN1cHBvcnRlZFdlYnNpdGVzID0gXCJJbWd1clwiO1xyXG4gICAgcmVnZXggPSBuZXcgUmVnRXhwKC9odHRwczpcXC9cXC9pbWd1clxcLmNvbVxcLyg/Oig/OmF8Z2FsbGVyeXwoPzp0XFwvXFx3KykpXFwvKT8oXFx3KykvKTtcclxuICAgIGVtYmVkT3JpZ2luID0gXCJodHRwczovL2ltZ3VyLmNvbVwiO1xyXG5cclxuICAgIGNyZWF0ZUVtYmVkKHVybDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IHJlZ2V4TWF0Y2ggPSB1cmwubWF0Y2godGhpcy5yZWdleCk7XHJcbiAgICAgICAgaWYgKHJlZ2V4TWF0Y2ggPT09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9uRXJyb3JDcmVhdGluZ0VtYmVkKHVybCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGltZ3VySWQgPSByZWdleE1hdGNoWzFdO1xyXG5cclxuICAgICAgICBjb25zdCBpZnJhbWUgPSB0aGlzLmNyZWF0ZUVtYmVkSWZyYW1lKHtcclxuICAgICAgICAgICAgc3JjOiBgaHR0cHM6Ly9pbWd1ci5jb20vYS8ke2ltZ3VySWR9L2VtYmVkP3B1Yj10cnVlYCxcclxuICAgICAgICAgICAgY29udGFpbmVyQ2xhc3M6IFwiaW1ndXItZW1iZWRcIixcclxuICAgICAgICAgICAgZGF0YXNldDogeyBpbWd1cklkIH0sXHJcbiAgICAgICAgICAgIHNjcm9sbGluZzogXCJub1wiLFxyXG4gICAgICAgICAgICBjYWNoZUtleTogaW1ndXJJZCxcclxuICAgICAgICAgICAgY2FjaGVXaWR0aDogdHJ1ZSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGlmcmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBvblJlc2l6ZU1lc3NhZ2UoZTogTWVzc2FnZUV2ZW50KSB7XHJcbiAgICAgICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoZS5kYXRhKTtcclxuICAgICAgICBjb25zdCBocmVmID0gZGF0YS5ocmVmIGFzIHN0cmluZztcclxuICAgICAgICBjb25zdCByZWdleE1hdGNoID0gaHJlZi5tYXRjaCgvaHR0cHM6XFwvXFwvaW1ndXJcXC5jb21cXC8oPzphXFwvKT8oXFx3KykvKTtcclxuXHJcbiAgICAgICAgaWYgKCFyZWdleE1hdGNoIHx8IHJlZ2V4TWF0Y2gubGVuZ3RoIDwgMilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCBpbWd1cklkID0gcmVnZXhNYXRjaFsxXTtcclxuICAgICAgICBjb25zdCBpZnJhbWVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLmltZ3VyLWVtYmVkIGlmcmFtZVtkYXRhLWltZ3VyLWlkPVwiJHtpbWd1cklkfVwiYCk7XHJcblxyXG4gICAgICAgIGlmIChpZnJhbWVzLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlmcmFtZXMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgY29uc3QgaWZyYW1lID0gaWZyYW1lc1tpXSBhcyBIVE1MSUZyYW1lRWxlbWVudDtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhLm1lc3NhZ2UgPT09IFwicmVzaXplX2ltZ3VyXCIpIHtcclxuICAgICAgICAgICAgICAgIHNldENzc1Byb3BzKGlmcmFtZSwgeyBoZWlnaHQ6IGRhdGEuaGVpZ2h0ICsgXCJweFwiIH0pO1xyXG4gICAgICAgICAgICAgICAgc2V0Q3NzUHJvcHMoaWZyYW1lLCB7IHdpZHRoOiBkYXRhLndpZHRoICsgXCJweFwiIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplQ29udGFpbmVyKGlmcmFtZSwgaWZyYW1lLnN0eWxlLmhlaWdodCwgaWZyYW1lLnN0eWxlLndpZHRoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhY2hlU2l6ZShpbWd1cklkLCBkYXRhLmhlaWdodCwgZGF0YS53aWR0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoZGF0YS5tZXNzYWdlID09PSBcIjQwNF9pbWd1cl9lbWJlZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZnJhbWUuc3JjID0gaWZyYW1lLnNyYy5yZXBsYWNlKFwiL2EvXCIsIFwiL1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN0ZWFtRW1iZWQgZXh0ZW5kcyBFbWJlZEJhc2Uge1xyXG4gICAgbmFtZTogU3VwcG9ydGVkV2Vic2l0ZXMgPSBcIlN0ZWFtXCI7XHJcbiAgICByZWdleCA9IG5ldyBSZWdFeHAoL2h0dHBzOlxcL1xcL3N0b3JlXFwuc3RlYW1wb3dlcmVkXFwuY29tXFwvYXBwXFwvKFxcZCspLyk7XHJcblxyXG4gICAgY3JlYXRlRW1iZWQodXJsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XHJcbiAgICAgICAgY29uc3QgcmVnZXhNYXRjaCA9IHVybC5tYXRjaCh0aGlzLnJlZ2V4KTtcclxuICAgICAgICBpZiAocmVnZXhNYXRjaCA9PT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub25FcnJvckNyZWF0aW5nRW1iZWQodXJsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRW1iZWRJZnJhbWUoe1xyXG4gICAgICAgICAgICBzcmM6IGBodHRwczovL3N0b3JlLnN0ZWFtcG93ZXJlZC5jb20vd2lkZ2V0LyR7cmVnZXhNYXRjaFsxXX0vYCxcclxuICAgICAgICAgICAgY29udGFpbmVyQ2xhc3M6IFwic3RlYW0tZW1iZWRcIixcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEdvb2dsZUNhbGVuZGFyRW1iZWQgZXh0ZW5kcyBFbWJlZEJhc2Uge1xyXG4gICAgbmFtZTogU3VwcG9ydGVkV2Vic2l0ZXMgPSBcIkdvb2dsZSBDYWxlbmRhclwiO1xyXG4gICAgcmVnZXggPSBuZXcgUmVnRXhwKC9odHRwczpcXC9cXC9jYWxlbmRhclxcLmdvb2dsZVxcLmNvbVxcL2NhbGVuZGFyKD86XFwvKD86dVxcL1xcZCspKT8oPzpcXC8oPzpyfGVtYmVkKSk/KD86Wy8/I10uKik/L2kpO1xyXG4gICAgZW1iZWRPcmlnaW4gPSBcImh0dHBzOi8vY2FsZW5kYXIuZ29vZ2xlLmNvbVwiO1xyXG5cclxuICAgIHByaXZhdGUgZGVjb2RlR29vZ2xlQ2FsZW5kYXJDaWQoY2lkOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBjaWQucmVwbGFjZSgvLS9nLCBcIitcIikucmVwbGFjZSgvXy9nLCBcIi9cIik7XHJcbiAgICAgICAgY29uc3QgcGFkZGVkID0gbm9ybWFsaXplZCArIFwiPVwiLnJlcGVhdCgoNCAtIChub3JtYWxpemVkLmxlbmd0aCAlIDQpKSAlIDQpO1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXRvYihwYWRkZWQpO1xyXG4gICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICByZXR1cm4gY2lkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVFbWJlZCh1cmw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICBpZiAoIXRoaXMucmVnZXgudGVzdCh1cmwpKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vbkVycm9yQ3JlYXRpbmdFbWJlZCh1cmwpO1xyXG5cclxuICAgICAgICBsZXQgY2FsZW5kYXJJZCA9IFwiXCI7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gbmV3IFVSTCh1cmwpO1xyXG4gICAgICAgICAgICBjb25zdCBzcmNQYXJhbSA9IHBhcnNlZC5zZWFyY2hQYXJhbXMuZ2V0KFwic3JjXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBjaWRQYXJhbSA9IHBhcnNlZC5zZWFyY2hQYXJhbXMuZ2V0KFwiY2lkXCIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNyY1BhcmFtKVxyXG4gICAgICAgICAgICAgICAgY2FsZW5kYXJJZCA9IHNyY1BhcmFtO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChjaWRQYXJhbSlcclxuICAgICAgICAgICAgICAgIGNhbGVuZGFySWQgPSB0aGlzLmRlY29kZUdvb2dsZUNhbGVuZGFyQ2lkKGNpZFBhcmFtKTtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub25FcnJvckNyZWF0aW5nRW1iZWQodXJsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghY2FsZW5kYXJJZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub25FcnJvckNyZWF0aW5nRW1iZWQodXJsLCBcIkdvb2dsZSBDYWxlbmRhciBsaW5rIGlzIG1pc3Npbmcgc3JjL2NpZCBwYXJhbWV0ZXIuXCIpO1xyXG5cclxuICAgICAgICBjb25zdCBlbWJlZFVybCA9IGBodHRwczovL2NhbGVuZGFyLmdvb2dsZS5jb20vY2FsZW5kYXIvZW1iZWQ/c3JjPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGNhbGVuZGFySWQpfWA7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVtYmVkSWZyYW1lKHtcclxuICAgICAgICAgICAgc3JjOiBlbWJlZFVybCxcclxuICAgICAgICAgICAgY29udGFpbmVyQ2xhc3M6IFwiZ29vZ2xlLWNhbGVuZGFyLWVtYmVkXCIsXHJcbiAgICAgICAgICAgIGRhdGFzZXQ6IHsgY2FsZW5kYXJJZCB9LFxyXG4gICAgICAgICAgICBzY3JvbGxpbmc6IFwibm9cIixcclxuICAgICAgICAgICAgY2FjaGVLZXk6IGNhbGVuZGFySWQsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBXaWtpcGVkaWFFbWJlZCBleHRlbmRzIEVtYmVkQmFzZSB7XHJcbiAgICBuYW1lOiBTdXBwb3J0ZWRXZWJzaXRlcyA9IFwiV2lraXBlZGlhXCI7XHJcbiAgICByZWdleCA9IG5ldyBSZWdFeHAoL2h0dHBzOlxcL1xcLyhbYS16XSstP1thLXpdKilcXC53aWtpcGVkaWFcXC5vcmdcXC93aWtpXFwvKFteLz8jXSspLyk7XHJcbiAgICBlbWJlZE9yaWdpbiA9IFwiaHR0cHM6Ly93d3cud2lraXBlZGlhLm9yZ1wiO1xyXG5cclxuICAgIGNyZWF0ZUVtYmVkKHVybDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IHJlZ2V4TWF0Y2ggPSB1cmwubWF0Y2godGhpcy5yZWdleCk7XHJcbiAgICAgICAgaWYgKHJlZ2V4TWF0Y2ggPT09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9uRXJyb3JDcmVhdGluZ0VtYmVkKHVybCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGxhbmdDb2RlID0gcmVnZXhNYXRjaFsxXTtcclxuICAgICAgICBjb25zdCBhcnRpY2xlVGl0bGUgPSByZWdleE1hdGNoWzJdO1xyXG5cclxuICAgICAgICBjb25zdCBlbWJlZFVybCA9IGBodHRwczovLyR7bGFuZ0NvZGV9Lndpa2lwZWRpYS5vcmcvd2lraS8ke2FydGljbGVUaXRsZX1gO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFbWJlZElmcmFtZSh7XHJcbiAgICAgICAgICAgIHNyYzogZW1iZWRVcmwsXHJcbiAgICAgICAgICAgIGNvbnRhaW5lckNsYXNzOiBcIndpa2lwZWRpYS1lbWJlZFwiLFxyXG4gICAgICAgICAgICBkYXRhc2V0OiB7IGFydGljbGVUaXRsZSwgbGFuZ0NvZGUgfSxcclxuICAgICAgICAgICAgY2FjaGVLZXk6IGAke2xhbmdDb2RlfToke2FydGljbGVUaXRsZX1gLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR2VvZ2VicmFFbWJlZCBleHRlbmRzIEVtYmVkQmFzZSB7XHJcbiAgICBuYW1lOiBTdXBwb3J0ZWRXZWJzaXRlcyA9IFwiR2VvZ2VicmFcIjtcclxuICAgIC8vIFN1cHBvcnRzIGdlb2dlYnJhLm9yZyBtYXRlcmlhbCBVUkxzOiBodHRwczovL3d3dy5nZW9nZWJyYS5vcmcvbS97aWR9XHJcbiAgICByZWdleCA9IG5ldyBSZWdFeHAoL2h0dHBzOlxcL1xcLyg/Ond3d1xcLik/Z2VvZ2VicmFcXC5vcmdcXC9tXFwvKFxcdyspL2kpO1xyXG4gICAgZW1iZWRPcmlnaW4gPSBcImh0dHBzOi8vd3d3Lmdlb2dlYnJhLm9yZ1wiO1xyXG5cclxuICAgIGNyZWF0ZUVtYmVkKHVybDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xyXG4gICAgICAgIGNvbnN0IHJlZ2V4TWF0Y2ggPSB1cmwubWF0Y2godGhpcy5yZWdleCk7XHJcbiAgICAgICAgaWYgKHJlZ2V4TWF0Y2ggPT09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9uRXJyb3JDcmVhdGluZ0VtYmVkKHVybCk7XHJcblxyXG4gICAgICAgIGNvbnN0IG1hdGVyaWFsSWQgPSByZWdleE1hdGNoWzFdO1xyXG5cclxuICAgICAgICBjb25zdCBlbWJlZFVybCA9IGBodHRwczovL3d3dy5nZW9nZWJyYS5vcmcvbWF0ZXJpYWwvaWZyYW1lL2lkLyR7bWF0ZXJpYWxJZH1gO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFbWJlZElmcmFtZSh7XHJcbiAgICAgICAgICAgIHNyYzogZW1iZWRVcmwsXHJcbiAgICAgICAgICAgIGNvbnRhaW5lckNsYXNzOiBcImdlb2dlYnJhLWVtYmVkXCIsXHJcbiAgICAgICAgICAgIGRhdGFzZXQ6IHsgbWF0ZXJpYWxJZCB9LFxyXG4gICAgICAgICAgICBhbGxvd0Z1bGxzY3JlZW46IHRydWUsXHJcbiAgICAgICAgICAgIGNhY2hlS2V5OiBtYXRlcmlhbElkLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUXVpemxldEVtYmVkIGV4dGVuZHMgRW1iZWRCYXNlIHtcclxuICAgIG5hbWU6IFN1cHBvcnRlZFdlYnNpdGVzID0gXCJRdWl6bGV0XCI7XHJcbiAgICAvLyBNYXRjaCBRdWl6bGV0IGxpbmtzIGJyb2FkbHksIHRoZW4gcGFyc2UgdGhlIHNldCBpZCBmcm9tIHZhcmllZCBwYXRoIHNoYXBlcy5cclxuICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cCgvaHR0cHM6XFwvXFwvKD86d3d3XFwuKT9xdWl6bGV0XFwuY29tXFwvL2kpO1xyXG4gICAgZW1iZWRPcmlnaW4gPSBcImh0dHBzOi8vcXVpemxldC5jb21cIjtcclxuXHJcbiAgICBjcmVhdGVFbWJlZCh1cmw6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICBpZiAoIXRoaXMucmVnZXgudGVzdCh1cmwpKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vbkVycm9yQ3JlYXRpbmdFbWJlZCh1cmwpO1xyXG5cclxuICAgICAgICBjb25zdCBzZXRJZCA9IHBhcnNlUXVpemxldFNldElkKHVybCk7XHJcbiAgICAgICAgaWYgKCFzZXRJZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub25FcnJvckNyZWF0aW5nRW1iZWQodXJsLCBcIkNvdWxkIG5vdCBwYXJzZSBRdWl6bGV0IHNldCBJRCBmcm9tIFVSTC5cIik7XHJcblxyXG4gICAgICAgIGNvbnN0IGVtYmVkVXJsID0gYGh0dHBzOi8vcXVpemxldC5jb20vJHtzZXRJZH0vZmxhc2hjYXJkcy9lbWJlZGA7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVtYmVkSWZyYW1lKHtcclxuICAgICAgICAgICAgc3JjOiBlbWJlZFVybCxcclxuICAgICAgICAgICAgY29udGFpbmVyQ2xhc3M6IFwicXVpemxldC1lbWJlZFwiLFxyXG4gICAgICAgICAgICBkYXRhc2V0OiB7IHF1aXpsZXRTZXRJZDogc2V0SWQgfSxcclxuICAgICAgICAgICAgYWxsb3dGdWxsc2NyZWVuOiB0cnVlLFxyXG4gICAgICAgICAgICBjYWNoZUtleTogc2V0SWQsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIl19