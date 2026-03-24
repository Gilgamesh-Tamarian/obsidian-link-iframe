import { EmbedBase } from "./embedBase";
// Sites in this file: CodePen, Google Workspace (Docs/Slides/Sheets), Google Drive.
export class CodepenEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "CodePen";
        this.regex = new RegExp(/https:\/\/codepen\.io\/([\w-]+)\/pen\/(\w+)(\?.*)?/);
    }
    createEmbed(url) {
        const regexMatch = url.match(this.regex);
        if (regexMatch === null)
            return this.onErrorCreatingEmbed(url);
        return this.createEmbedIframe({
            src: `https://codepen.io/${regexMatch[1]}/embed/${regexMatch[2]}?default-tab=result&editable=true`,
            containerClass: "codepen-embed",
        });
    }
}
export class GoogleDocsEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "Google Docs";
        // Matches standard and user-scoped Docs/Slides/Sheets URLs, but NOT published pages —
        // /d/e/ is the published key prefix, and /pub(/html) marks a published view.
        // Both are treated as regular websites by the generic iframe fallback.
        this.regex = new RegExp(/https:\/\/docs\.google\.com\/(document|presentation|spreadsheets)(?:\/u\/\d+)?\/d\/(?!e\/)([A-Za-z0-9_-]+)(?!\/(?:pub|pubhtml))/i);
    }
    createEmbed(url) {
        const regexMatch = url.match(this.regex);
        if (regexMatch === null)
            return this.onErrorCreatingEmbed(url);
        const resourceType = regexMatch[1];
        const resourceId = regexMatch[2];
        const src = `https://docs.google.com/${resourceType}/d/${resourceId}/preview`;
        return this.createEmbedIframe({
            src,
            containerClass: "google-docs-embed-preview",
        });
    }
}
export class GoogleDriveEmbed extends EmbedBase {
    constructor() {
        super(...arguments);
        this.name = "Google Drive";
        // Supports common Drive file-sharing URLs, e.g.:
        // - https://drive.google.com/file/d/{id}/view?usp=sharing
        // - https://drive.google.com/open?id={id}
        this.regex = new RegExp(/https:\/\/drive\.google\.com\//i);
    }
    parseDriveFileId(url) {
        try {
            const parsed = new URL(url);
            const pathMatch = parsed.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/i);
            if (pathMatch === null || pathMatch === void 0 ? void 0 : pathMatch[1]) {
                return pathMatch[1];
            }
            const queryId = parsed.searchParams.get("id");
            if (queryId) {
                return queryId;
            }
        }
        catch (_a) {
            return null;
        }
        return null;
    }
    createEmbed(url) {
        if (!this.regex.test(url)) {
            return this.onErrorCreatingEmbed(url);
        }
        const fileId = this.parseDriveFileId(url);
        if (!fileId) {
            return this.onErrorCreatingEmbed(url, "Could not parse Google Drive file ID from URL.");
        }
        const src = `https://drive.google.com/file/d/${fileId}/preview`;
        return this.createEmbedIframe({
            src,
            containerClass: "google-drive-embed-preview",
            allow: "autoplay",
            allowFullscreen: true,
            cacheKey: fileId,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2ZG9jcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRldmRvY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUV4QywwREFBMEQ7QUFFMUQsTUFBTSxPQUFPLFlBQWEsU0FBUSxTQUFTO0lBQTNDOztRQUNJLFNBQUksR0FBc0IsU0FBUyxDQUFDO1FBQ3BDLFVBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO0lBWTdFLENBQUM7SUFWRyxXQUFXLENBQUMsR0FBVztRQUNuQixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QyxJQUFJLFVBQVUsS0FBSyxJQUFJO1lBQ25CLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTFDLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1lBQzFCLEdBQUcsRUFBRSxzQkFBc0IsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLFVBQVUsQ0FBQyxDQUFDLENBQUMsbUNBQW1DO1lBQ2xHLGNBQWMsRUFBRSxlQUFlO1NBQ2xDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQUVELE1BQU0sT0FBTyxlQUFnQixTQUFRLFNBQVM7SUFBOUM7O1FBQ0ksU0FBSSxHQUFzQixhQUFhLENBQUM7UUFDeEMsd0VBQXdFO1FBQ3hFLCtFQUErRTtRQUMvRSx1RUFBdUU7UUFDdkUsVUFBSyxHQUFHLElBQUksTUFBTSxDQUFDLDBGQUEwRixDQUFDLENBQUM7SUFlbkgsQ0FBQztJQWJHLFdBQVcsQ0FBQyxHQUFXO1FBQ25CLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLElBQUksVUFBVSxLQUFLLElBQUk7WUFDbkIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFMUMsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sR0FBRyxHQUFHLHNDQUFzQyxVQUFVLFVBQVUsQ0FBQztRQUV2RSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUMxQixHQUFHO1lBQ0gsY0FBYyxFQUFFLDJCQUEyQjtTQUM5QyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFFRCxNQUFNLE9BQU8sZ0JBQWlCLFNBQVEsU0FBUztJQUEvQzs7UUFDSSxTQUFJLEdBQXNCLGNBQWMsQ0FBQztRQUN6QyxpREFBaUQ7UUFDakQsMERBQTBEO1FBQzFELDBDQUEwQztRQUMxQyxVQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsaUNBQWlDLENBQUMsQ0FBQztJQTBDMUQsQ0FBQztJQXhDVyxnQkFBZ0IsQ0FBQyxHQUFXO1FBQ2hDLElBQUksQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRTVCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7WUFDeEUsSUFBSSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDakIsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsQ0FBQztZQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlDLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ1YsT0FBTyxPQUFPLENBQUM7WUFDbkIsQ0FBQztRQUNMLENBQUM7UUFBQyxXQUFNLENBQUM7WUFDTCxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELFdBQVcsQ0FBQyxHQUFXO1FBQ25CLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1YsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLGdEQUFnRCxDQUFDLENBQUM7UUFDNUYsQ0FBQztRQUVELE1BQU0sR0FBRyxHQUFHLG1DQUFtQyxNQUFNLFVBQVUsQ0FBQztRQUVoRSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUMxQixHQUFHO1lBQ0gsY0FBYyxFQUFFLDRCQUE0QjtZQUM1QyxLQUFLLEVBQUUsVUFBVTtZQUNqQixlQUFlLEVBQUUsSUFBSTtZQUNyQixRQUFRLEVBQUUsTUFBTTtTQUNuQixDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdXBwb3J0ZWRXZWJzaXRlcyB9IGZyb20gXCJzcmMvc2V0dGluZ3MtdGFiXCI7XG5pbXBvcnQgeyBFbWJlZEJhc2UgfSBmcm9tIFwiLi9lbWJlZEJhc2VcIjtcblxuLy8gU2l0ZXMgaW4gdGhpcyBmaWxlOiBDb2RlUGVuLCBHb29nbGUgRG9jcywgR29vZ2xlIERyaXZlLlxuXG5leHBvcnQgY2xhc3MgQ29kZXBlbkVtYmVkIGV4dGVuZHMgRW1iZWRCYXNlIHtcbiAgICBuYW1lOiBTdXBwb3J0ZWRXZWJzaXRlcyA9IFwiQ29kZVBlblwiO1xuICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cCgvaHR0cHM6XFwvXFwvY29kZXBlblxcLmlvXFwvKFtcXHctXSspXFwvcGVuXFwvKFxcdyspKFxcPy4qKT8vKTtcblxuICAgIGNyZWF0ZUVtYmVkKHVybDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICAgICAgICBjb25zdCByZWdleE1hdGNoID0gdXJsLm1hdGNoKHRoaXMucmVnZXgpO1xuICAgICAgICBpZiAocmVnZXhNYXRjaCA9PT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9uRXJyb3JDcmVhdGluZ0VtYmVkKHVybCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRW1iZWRJZnJhbWUoe1xuICAgICAgICAgICAgc3JjOiBgaHR0cHM6Ly9jb2RlcGVuLmlvLyR7cmVnZXhNYXRjaFsxXX0vZW1iZWQvJHtyZWdleE1hdGNoWzJdfT9kZWZhdWx0LXRhYj1yZXN1bHQmZWRpdGFibGU9dHJ1ZWAsXG4gICAgICAgICAgICBjb250YWluZXJDbGFzczogXCJjb2RlcGVuLWVtYmVkXCIsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEdvb2dsZURvY3NFbWJlZCBleHRlbmRzIEVtYmVkQmFzZSB7XG4gICAgbmFtZTogU3VwcG9ydGVkV2Vic2l0ZXMgPSBcIkdvb2dsZSBEb2NzXCI7XG4gICAgLy8gTWF0Y2hlcyBzdGFuZGFyZCBhbmQgdXNlci1zY29wZWQgRG9jcyBVUkxzLCBidXQgTk9UIHB1Ymxpc2hlZCBwYWdlcyDigJRcbiAgICAvLyAvZC9lLyBpcyB0aGUgcHVibGlzaGVkLWRvY3VtZW50IGtleSBwcmVmaXgsIGFuZCAvcHViIG1hcmtzIGEgcHVibGlzaGVkIHZpZXcuXG4gICAgLy8gQm90aCBhcmUgdHJlYXRlZCBhcyByZWd1bGFyIHdlYnNpdGVzIGJ5IHRoZSBnZW5lcmljIGlmcmFtZSBmYWxsYmFjay5cbiAgICByZWdleCA9IG5ldyBSZWdFeHAoL2h0dHBzOlxcL1xcL2RvY3NcXC5nb29nbGVcXC5jb21cXC9kb2N1bWVudCg/OlxcL3VcXC9cXGQrKT9cXC9kXFwvKD8hZVxcLykoW0EtWmEtejAtOV8tXSspKD8hXFwvcHViKS9pKTtcblxuICAgIGNyZWF0ZUVtYmVkKHVybDogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICAgICAgICBjb25zdCByZWdleE1hdGNoID0gdXJsLm1hdGNoKHRoaXMucmVnZXgpO1xuICAgICAgICBpZiAocmVnZXhNYXRjaCA9PT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9uRXJyb3JDcmVhdGluZ0VtYmVkKHVybCk7XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRJZCA9IHJlZ2V4TWF0Y2hbMV07XG4gICAgICAgIGNvbnN0IHNyYyA9IGBodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9kb2N1bWVudC9kLyR7ZG9jdW1lbnRJZH0vcHJldmlld2A7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRW1iZWRJZnJhbWUoe1xuICAgICAgICAgICAgc3JjLFxuICAgICAgICAgICAgY29udGFpbmVyQ2xhc3M6IFwiZ29vZ2xlLWRvY3MtZW1iZWQtcHJldmlld1wiLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBHb29nbGVEcml2ZUVtYmVkIGV4dGVuZHMgRW1iZWRCYXNlIHtcbiAgICBuYW1lOiBTdXBwb3J0ZWRXZWJzaXRlcyA9IFwiR29vZ2xlIERyaXZlXCI7XG4gICAgLy8gU3VwcG9ydHMgY29tbW9uIERyaXZlIGZpbGUtc2hhcmluZyBVUkxzLCBlLmcuOlxuICAgIC8vIC0gaHR0cHM6Ly9kcml2ZS5nb29nbGUuY29tL2ZpbGUvZC97aWR9L3ZpZXc/dXNwPXNoYXJpbmdcbiAgICAvLyAtIGh0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS9vcGVuP2lkPXtpZH1cbiAgICByZWdleCA9IG5ldyBSZWdFeHAoL2h0dHBzOlxcL1xcL2RyaXZlXFwuZ29vZ2xlXFwuY29tXFwvL2kpO1xuXG4gICAgcHJpdmF0ZSBwYXJzZURyaXZlRmlsZUlkKHVybDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWQgPSBuZXcgVVJMKHVybCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHBhdGhNYXRjaCA9IHBhcnNlZC5wYXRobmFtZS5tYXRjaCgvXFwvZmlsZVxcL2RcXC8oW0EtWmEtejAtOV8tXSspL2kpO1xuICAgICAgICAgICAgaWYgKHBhdGhNYXRjaD8uWzFdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhNYXRjaFsxXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgcXVlcnlJZCA9IHBhcnNlZC5zZWFyY2hQYXJhbXMuZ2V0KFwiaWRcIik7XG4gICAgICAgICAgICBpZiAocXVlcnlJZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxdWVyeUlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY3JlYXRlRW1iZWQodXJsOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gICAgICAgIGlmICghdGhpcy5yZWdleC50ZXN0KHVybCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9uRXJyb3JDcmVhdGluZ0VtYmVkKHVybCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaWxlSWQgPSB0aGlzLnBhcnNlRHJpdmVGaWxlSWQodXJsKTtcbiAgICAgICAgaWYgKCFmaWxlSWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9uRXJyb3JDcmVhdGluZ0VtYmVkKHVybCwgXCJDb3VsZCBub3QgcGFyc2UgR29vZ2xlIERyaXZlIGZpbGUgSUQgZnJvbSBVUkwuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3JjID0gYGh0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS9maWxlL2QvJHtmaWxlSWR9L3ByZXZpZXdgO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVtYmVkSWZyYW1lKHtcbiAgICAgICAgICAgIHNyYyxcbiAgICAgICAgICAgIGNvbnRhaW5lckNsYXNzOiBcImdvb2dsZS1kcml2ZS1lbWJlZC1wcmV2aWV3XCIsXG4gICAgICAgICAgICBhbGxvdzogXCJhdXRvcGxheVwiLFxuICAgICAgICAgICAgYWxsb3dGdWxsc2NyZWVuOiB0cnVlLFxuICAgICAgICAgICAgY2FjaGVLZXk6IGZpbGVJZCxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19