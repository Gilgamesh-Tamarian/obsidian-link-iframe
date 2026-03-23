import { __awaiter } from "tslib";
import { hasProvider, extract } from 'oembed-parser';
import * as DOMPurify from 'dompurify';
const buildDefaultIframe = (url) => {
    return `<iframe src="${url}" allow="fullscreen" allowfullscreen style="height:100%;width:100%; aspect-ratio: 16 / 9; "></iframe>`;
};
const extractIframelyHostedIframe = (html) => {
    const match = html.match(/data-iframely-url="([^"]+)"/i);
    const iframeUrl = match === null || match === void 0 ? void 0 : match[1];
    if (!iframeUrl) {
        return null;
    }
    return `<iframe src="${iframeUrl}" allow="fullscreen" allowfullscreen style="height:100%;width:100%; aspect-ratio: 16 / 9; "></iframe>`;
};
export const getIframeGeneratorFromSanitize = (sanitize) => (url, options, fetchIframelyHtml) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const defaultHtml = buildDefaultIframe(url);
    const cleanedIframelyKey = (_a = options === null || options === void 0 ? void 0 : options.iframelyApiKey) === null || _a === void 0 ? void 0 : _a.trim();
    if (hasProvider(url)) {
        try {
            // Get the Oemb
            const oembedData = yield extract(url);
            if (oembedData && oembedData.type !== 'rich' && oembedData.type !== 'video') {
                throw new Error(`Not a rich or video type: ${JSON.stringify(oembedData)}`);
            }
            // Both Rich and Video types have an html property
            const html = oembedData === null || oembedData === void 0 ? void 0 : oembedData.html;
            // We only allow an iframe
            const cleanedHtml = sanitize(html, { ALLOWED_TAGS: ["iframe"] });
            if (cleanedHtml.startsWith('<iframe')) {
                return cleanedHtml;
            }
            throw new Error(`Not an iframe, we currently do not support this: ${html}`);
        }
        catch (e) {
            console.warn(`Could not get oembed data for ${url}`, e);
        }
    }
    if ((options === null || options === void 0 ? void 0 : options.enableIframelyFallback) && cleanedIframelyKey && fetchIframelyHtml) {
        try {
            const iframelyHtml = yield fetchIframelyHtml(url, cleanedIframelyKey);
            if (iframelyHtml) {
                const cleanedHtml = sanitize(iframelyHtml, { ALLOWED_TAGS: ["iframe"] });
                if (cleanedHtml.startsWith('<iframe')) {
                    return cleanedHtml;
                }
                const hostedIframe = extractIframelyHostedIframe(iframelyHtml);
                if (hostedIframe) {
                    return hostedIframe;
                }
            }
        }
        catch (e) {
            console.warn(`Could not get Iframely data for ${url}`, e);
        }
    }
    return defaultHtml;
});
const boundSanitize = DOMPurify.sanitize.bind(DOMPurify);
export const getIframe = getIframeGeneratorFromSanitize(boundSanitize);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWZyYW1lX2dlbmVyYXRvci51dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImlmcmFtZV9nZW5lcmF0b3IudXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFnQixNQUFNLGVBQWUsQ0FBQTtBQUNsRSxPQUFPLEtBQUssU0FBUyxNQUFNLFdBQVcsQ0FBQTtBQVd0QyxNQUFNLGtCQUFrQixHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUU7SUFDdkMsT0FBTyxnQkFBZ0IsR0FBRyx1R0FBdUcsQ0FBQTtBQUNySSxDQUFDLENBQUE7QUFFRCxNQUFNLDJCQUEyQixHQUFHLENBQUMsSUFBWSxFQUFpQixFQUFFO0lBQ2hFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUN6RCxNQUFNLFNBQVMsR0FBRyxLQUFLLGFBQUwsS0FBSyx1QkFBTCxLQUFLLENBQUcsQ0FBQyxDQUFDLENBQUM7SUFFN0IsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2IsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELE9BQU8sZ0JBQWdCLFNBQVMsdUdBQXVHLENBQUM7QUFDNUksQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLE1BQU0sOEJBQThCLEdBQUcsQ0FDMUMsUUFBbUMsRUFDckMsRUFBRSxDQUFDLENBQ0QsR0FBVyxFQUNYLE9BQStCLEVBQy9CLGlCQUF1QyxFQUN4QixFQUFFOztJQUNqQixNQUFNLFdBQVcsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM1QyxNQUFNLGtCQUFrQixHQUFHLE1BQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLGNBQWMsMENBQUUsSUFBSSxFQUFFLENBQUM7SUFFM0QsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUM7WUFDRCxlQUFlO1lBQ2YsTUFBTSxVQUFVLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFdEMsSUFBRyxVQUFVLElBQUksVUFBVSxDQUFDLElBQUksS0FBSyxNQUFNLElBQUksVUFBVSxDQUFDLElBQUksS0FBSSxPQUFPLEVBQUUsQ0FBQztnQkFDeEUsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDOUUsQ0FBQztZQUVELGtEQUFrRDtZQUNsRCxNQUFNLElBQUksR0FBSSxVQUE0QixhQUE1QixVQUFVLHVCQUFWLFVBQVUsQ0FBb0IsSUFBSSxDQUFDO1lBRWpELDBCQUEwQjtZQUMxQixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsWUFBWSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUMsQ0FBQyxDQUFBO1lBRS9ELElBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxPQUFPLFdBQVcsQ0FBQTtZQUN0QixDQUFDO1lBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUMvRSxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNULE9BQU8sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVELENBQUM7SUFDTCxDQUFDO0lBRUQsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxzQkFBc0IsS0FBSSxrQkFBa0IsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO1FBQzdFLElBQUksQ0FBQztZQUNELE1BQU0sWUFBWSxHQUFHLE1BQU0saUJBQWlCLENBQUMsR0FBRyxFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDdEUsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDZixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsWUFBWSxFQUFFLEVBQUUsWUFBWSxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUV4RSxJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDcEMsT0FBTyxXQUFXLENBQUM7Z0JBQ3ZCLENBQUM7Z0JBRUQsTUFBTSxZQUFZLEdBQUcsMkJBQTJCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQy9ELElBQUksWUFBWSxFQUFFLENBQUM7b0JBQ2YsT0FBTyxZQUFZLENBQUM7Z0JBQ3hCLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDVCxPQUFPLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO0lBQ0wsQ0FBQztJQUVELE9BQU8sV0FBVyxDQUFBO0FBQ3RCLENBQUMsQ0FBQSxDQUFBO0FBRUQsTUFBTSxhQUFhLEdBQThCLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3BGLE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRyw4QkFBOEIsQ0FBQyxhQUFhLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGhhc1Byb3ZpZGVyLCBleHRyYWN0LCBWaWRlb1R5cGVEYXRhfSBmcm9tICdvZW1iZWQtcGFyc2VyJ1xyXG5pbXBvcnQgKiBhcyBET01QdXJpZnkgZnJvbSAnZG9tcHVyaWZ5J1xyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSWZyYW1lRmFsbGJhY2tPcHRpb25zIHtcclxuICAgIGVuYWJsZUlmcmFtZWx5RmFsbGJhY2s/OiBib29sZWFuO1xyXG4gICAgaWZyYW1lbHlBcGlLZXk/OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIElmcmFtZWx5SHRtbEZldGNoZXIgPSAodXJsOiBzdHJpbmcsIGFwaUtleTogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZyB8IG51bGw+O1xyXG5cclxuXHJcbmNvbnN0IGJ1aWxkRGVmYXVsdElmcmFtZSA9ICh1cmw6IHN0cmluZykgPT4ge1xyXG4gICAgcmV0dXJuIGA8aWZyYW1lIHNyYz1cIiR7dXJsfVwiIGFsbG93PVwiZnVsbHNjcmVlblwiIGFsbG93ZnVsbHNjcmVlbiBzdHlsZT1cImhlaWdodDoxMDAlO3dpZHRoOjEwMCU7IGFzcGVjdC1yYXRpbzogMTYgLyA5OyBcIj48L2lmcmFtZT5gXHJcbn1cclxuXHJcbmNvbnN0IGV4dHJhY3RJZnJhbWVseUhvc3RlZElmcmFtZSA9IChodG1sOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsID0+IHtcclxuICAgIGNvbnN0IG1hdGNoID0gaHRtbC5tYXRjaCgvZGF0YS1pZnJhbWVseS11cmw9XCIoW15cIl0rKVwiL2kpO1xyXG4gICAgY29uc3QgaWZyYW1lVXJsID0gbWF0Y2g/LlsxXTtcclxuXHJcbiAgICBpZiAoIWlmcmFtZVVybCkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBgPGlmcmFtZSBzcmM9XCIke2lmcmFtZVVybH1cIiBhbGxvdz1cImZ1bGxzY3JlZW5cIiBhbGxvd2Z1bGxzY3JlZW4gc3R5bGU9XCJoZWlnaHQ6MTAwJTt3aWR0aDoxMDAlOyBhc3BlY3QtcmF0aW86IDE2IC8gOTsgXCI+PC9pZnJhbWU+YDtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGdldElmcmFtZUdlbmVyYXRvckZyb21TYW5pdGl6ZSA9IChcclxuICAgIHNhbml0aXplOiB0eXBlb2YgRE9NUHVyaWZ5LnNhbml0aXplLFxyXG4pID0+IGFzeW5jIChcclxuICAgIHVybDogc3RyaW5nLFxyXG4gICAgb3B0aW9ucz86IElmcmFtZUZhbGxiYWNrT3B0aW9ucyxcclxuICAgIGZldGNoSWZyYW1lbHlIdG1sPzogSWZyYW1lbHlIdG1sRmV0Y2hlcixcclxuKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcclxuICAgIGNvbnN0IGRlZmF1bHRIdG1sID0gYnVpbGREZWZhdWx0SWZyYW1lKHVybCk7XHJcbiAgICBjb25zdCBjbGVhbmVkSWZyYW1lbHlLZXkgPSBvcHRpb25zPy5pZnJhbWVseUFwaUtleT8udHJpbSgpO1xyXG5cclxuICAgIGlmIChoYXNQcm92aWRlcih1cmwpKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gR2V0IHRoZSBPZW1iXHJcbiAgICAgICAgICAgIGNvbnN0IG9lbWJlZERhdGEgPSBhd2FpdCBleHRyYWN0KHVybCk7XHJcblxyXG4gICAgICAgICAgICBpZihvZW1iZWREYXRhICYmIG9lbWJlZERhdGEudHlwZSAhPT0gJ3JpY2gnICYmIG9lbWJlZERhdGEudHlwZSAhPT0ndmlkZW8nKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vdCBhIHJpY2ggb3IgdmlkZW8gdHlwZTogJHtKU09OLnN0cmluZ2lmeShvZW1iZWREYXRhKX1gKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBCb3RoIFJpY2ggYW5kIFZpZGVvIHR5cGVzIGhhdmUgYW4gaHRtbCBwcm9wZXJ0eVxyXG4gICAgICAgICAgICBjb25zdCBodG1sID0gKG9lbWJlZERhdGEgYXMgVmlkZW9UeXBlRGF0YSk/Lmh0bWw7XHJcblxyXG4gICAgICAgICAgICAvLyBXZSBvbmx5IGFsbG93IGFuIGlmcmFtZVxyXG4gICAgICAgICAgICBjb25zdCBjbGVhbmVkSHRtbCA9IHNhbml0aXplKGh0bWwsIHsgQUxMT1dFRF9UQUdTOiBbXCJpZnJhbWVcIl19KVxyXG5cclxuICAgICAgICAgICAgaWYoY2xlYW5lZEh0bWwuc3RhcnRzV2l0aCgnPGlmcmFtZScpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2xlYW5lZEh0bWxcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBOb3QgYW4gaWZyYW1lLCB3ZSBjdXJyZW50bHkgZG8gbm90IHN1cHBvcnQgdGhpczogJHtodG1sfWApXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYENvdWxkIG5vdCBnZXQgb2VtYmVkIGRhdGEgZm9yICR7dXJsfWAsIGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucz8uZW5hYmxlSWZyYW1lbHlGYWxsYmFjayAmJiBjbGVhbmVkSWZyYW1lbHlLZXkgJiYgZmV0Y2hJZnJhbWVseUh0bWwpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBpZnJhbWVseUh0bWwgPSBhd2FpdCBmZXRjaElmcmFtZWx5SHRtbCh1cmwsIGNsZWFuZWRJZnJhbWVseUtleSk7XHJcbiAgICAgICAgICAgIGlmIChpZnJhbWVseUh0bWwpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNsZWFuZWRIdG1sID0gc2FuaXRpemUoaWZyYW1lbHlIdG1sLCB7IEFMTE9XRURfVEFHUzogW1wiaWZyYW1lXCJdfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNsZWFuZWRIdG1sLnN0YXJ0c1dpdGgoJzxpZnJhbWUnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjbGVhbmVkSHRtbDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBob3N0ZWRJZnJhbWUgPSBleHRyYWN0SWZyYW1lbHlIb3N0ZWRJZnJhbWUoaWZyYW1lbHlIdG1sKTtcclxuICAgICAgICAgICAgICAgIGlmIChob3N0ZWRJZnJhbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaG9zdGVkSWZyYW1lO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYENvdWxkIG5vdCBnZXQgSWZyYW1lbHkgZGF0YSBmb3IgJHt1cmx9YCwgZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBkZWZhdWx0SHRtbFxyXG59XHJcblxyXG5jb25zdCBib3VuZFNhbml0aXplOiB0eXBlb2YgRE9NUHVyaWZ5LnNhbml0aXplID0gRE9NUHVyaWZ5LnNhbml0aXplLmJpbmQoRE9NUHVyaWZ5KTtcclxuZXhwb3J0IGNvbnN0IGdldElmcmFtZSA9IGdldElmcmFtZUdlbmVyYXRvckZyb21TYW5pdGl6ZShib3VuZFNhbml0aXplKTtcclxuXHJcbiJdfQ==