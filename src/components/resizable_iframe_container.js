import { defaultHeight } from "src/constant";
import { setCssProps } from "src/utility";
import { swapRatio } from "src/utils/ratio.utils";
import { getAutoAspectRatioForUrl } from "src/utils/native_embed_markup.utils";
export function createIframeContainerEl(contentEl, iframeHtml) {
    // Container to keep a min height for the iframe to keep the content visible
    const iframeContainer = contentEl.createEl('div');
    iframeContainer.className = "iframe__container space-y";
    // Inline styling to make sure that the created iframe will keep the style even without the plugin
    const doc = new DOMParser().parseFromString(iframeHtml.trim(), "text/html");
    const rootEl = doc.body.firstElementChild;
    if (!rootEl) {
        throw new Error('Embed markup does not contain a root element');
    }
    const iframe = rootEl instanceof HTMLIFrameElement
        ? rootEl
        : rootEl.querySelector('iframe');
    if (!iframe) {
        throw new Error('Embed markup does not contain an iframe');
    }
    iframeContainer.appendChild(rootEl);
    const defaultAspectRatio = iframe.style.getPropertyValue("aspect-ratio") || iframe.style.aspectRatio;
    const defaultHeight = iframe.style.getPropertyValue("height") || iframe.style.height;
    const defaultMinHeight = iframe.style.getPropertyValue("min-height") || iframe.style.minHeight;
    const applyDefaultSizing = () => {
        setCssProps(iframe, { width: "100%" });
        if (defaultAspectRatio) {
            setCssProps(iframe, { aspectRatio: defaultAspectRatio });
        }
        else {
            iframe.style.removeProperty("aspect-ratio");
        }
        if (defaultHeight) {
            setCssProps(iframe, { height: defaultHeight });
        }
        else {
            iframe.style.removeProperty("height");
        }
        if (defaultMinHeight) {
            setCssProps(iframe, { minHeight: defaultMinHeight });
        }
        else {
            iframe.style.removeProperty("min-height");
        }
    };
    const resetToDefaultWidth = () => {
        applyDefaultSizing();
    };
    resetToDefaultWidth();
    // Always allow full screen
    // TODO make it an option
    iframe.allowFullscreen = true;
    iframe.allow = 'fullscreen';
    return {
        iframeContainer,
        updateAspectRatio: (value) => {
            if (value === "auto") {
                applyDefaultSizing();
                return;
            }
            setCssProps(iframe, { width: "100%" });
            iframe.style.removeProperty("height");
            if (defaultMinHeight) {
                setCssProps(iframe, { minHeight: defaultMinHeight });
            }
            else {
                iframe.style.removeProperty("min-height");
            }
            if (value === "none") {
                iframe.style.removeProperty("aspect-ratio");
                return;
            }
            setCssProps(iframe, { aspectRatio: value });
        },
        outputHtml: () => {
            return rootEl.outerHTML;
        },
        resetToDefaultWidth,
    };
}
// Electron < 12 doesn't support the aspect ratio. We need to use a fancy div container with a padding bottom
export function createIframeContainerElLegacy(contentEl, iframeHtml) {
    // Inline styling to make sure that the created iframe will keep the style even without the plugin
    var _a, _b;
    // This container can be resized
    const iframeContainer = contentEl.createEl('div');
    iframeContainer.className = "iframe__container__legacy space-y";
    setCssProps(iframeContainer, {
        overflow: 'auto',
        resize: 'both',
        height: defaultHeight,
    });
    // This container enforce the aspect ratio. i.e. it's height is based on the width * ratio
    const ratioContainer = iframeContainer.createEl('div');
    setCssProps(ratioContainer, {
        display: 'block',
        position: 'relative',
        width: '100%',
    });
    // The height is determined by the padding which respect the ratio
    // See https://www.benmarshall.me/responsive-iframes/
    setCssProps(ratioContainer, {
        height: "0px",
        '--aspect-ratio': '9/16',
        paddingBottom: 'calc(var(--aspect-ratio) * 100%)',
    });
    const iframe = ratioContainer.createEl('iframe');
    const doc = new DOMParser().parseFromString(iframeHtml.trim(), "text/html");
    const sourceIframe = doc.querySelector('iframe');
    const sourceUrl = (_a = sourceIframe === null || sourceIframe === void 0 ? void 0 : sourceIframe.getAttribute("src")) !== null && _a !== void 0 ? _a : "about:blank";
    const autoAspectRatio = getAutoAspectRatioForUrl(sourceUrl);
    iframe.src = (_b = sourceIframe === null || sourceIframe === void 0 ? void 0 : sourceIframe.getAttribute('src')) !== null && _b !== void 0 ? _b : 'about:blank';
    iframe.allow = "fullscreen";
    setCssProps(iframe, {
        position: 'absolute',
        top: '0px',
        left: '0px',
        height: '100%',
        width: '100%',
    });
    const resolvedInitialRatio = autoAspectRatio === "none" ? "16/9" : autoAspectRatio;
    setCssProps(ratioContainer, { '--aspect-ratio': swapRatio(resolvedInitialRatio) });
    // Recompute the iframe height with the ratio to avoid any empty space
    setCssProps(iframeContainer, { height: `${ratioContainer.offsetHeight}px` });
    return {
        iframeContainer,
        updateAspectRatio: (value) => {
            const resolvedValue = value === "auto" ? autoAspectRatio : value;
            if (resolvedValue === 'none') {
                setCssProps(ratioContainer, {
                    paddingBottom: '0px',
                    height: '100%',
                });
            }
            else {
                setCssProps(ratioContainer, {
                    paddingBottom: 'calc(var(--aspect-ratio) * 100%)',
                    height: '0px',
                    '--aspect-ratio': swapRatio(resolvedValue),
                });
            }
        },
        outputHtml: () => {
            iframeContainer.className = "";
            // Recompute the height to remove the possible empty space
            setCssProps(iframeContainer, { height: `${ratioContainer.offsetHeight}px` });
            return ratioContainer.outerHTML;
        },
        resetToDefaultWidth: () => {
            setCssProps(iframeContainer, {
                width: '100%',
                height: `${ratioContainer.offsetHeight}px`,
            });
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXphYmxlX2lmcmFtZV9jb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXNpemFibGVfaWZyYW1lX2NvbnRhaW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFMUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQ2xELE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLHFDQUFxQyxDQUFDO0FBVS9FLE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxTQUFzQixFQUFFLFVBQWtCO0lBQ2pGLDRFQUE0RTtJQUM1RSxNQUFNLGVBQWUsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xELGVBQWUsQ0FBQyxTQUFTLEdBQUcsMkJBQTJCLENBQUE7SUFFdkQsa0dBQWtHO0lBQ2xHLE1BQU0sR0FBRyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUU1RSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGlCQUF1QyxDQUFDO0lBQ2hFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsOENBQThDLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxZQUFZLGlCQUFpQjtRQUNqRCxDQUFDLENBQUMsTUFBTTtRQUNSLENBQUMsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRWxDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMseUNBQXlDLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsZUFBZSxD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V0FBVyxDQUFDLGNBQWMsRUFBRTtvQkFDM0IsYUFBYSxFQUFFLGtDQUFrQztvQkFDakQsTUFBTSxFQUFFLEtBQUs7b0JBQ2IsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLGFBQWEsQ0FBQztpQkFDMUMsQ0FBQyxDQUFDO1lBQ0ssQ0FBQztRQUNMLENBQUM7UUFDRCxVQUFVLEVBQUUsR0FBRyxFQUFFO1lBQ3RCLGVBQWUsQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBQy9CLDBEQUEwRDtZQUMxRCxXQUFXLENBQUMsZUFBZSxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsY0FBYyxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM3RSxPQUFPLGNBQWMsQ0FBQyxTQUFTLENBQUM7UUFFM0IsQ0FBQztRQUNELG1CQUFtQixFQUFFLEdBQUcsRUFBRTtZQUUvQixXQUFXLENBQUMsZUFBZSxFQUFFO2dCQUM1QixLQUFLLEVBQUUsTUFBTTtnQkFDYixNQUFNLEVBQUUsR0FBRyxjQUFjLENBQUMsWUFBWSxJQUFJO2FBQzFDLENBQUMsQ0FBQztRQUNFLENBQUM7S0FDUCxDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRlZmF1bHRIZWlnaHQgfSBmcm9tIFwic3JjL2NvbnN0YW50XCI7XHJcbmltcG9ydCB7IHNldENzc1Byb3BzIH0gZnJvbSBcInNyYy91dGlsaXR5XCI7XHJcbmltcG9ydCB7IEFzcGVjdFJhdGlvVHlwZSB9IGZyb20gXCJzcmMvdHlwZXMvYXNwZWN0LXJhdGlvXCI7XHJcbmltcG9ydCB7IHN3YXBSYXRpbyB9IGZyb20gXCJzcmMvdXRpbHMvcmF0aW8udXRpbHNcIjtcclxuaW1wb3J0IHsgZ2V0QXV0b0FzcGVjdFJhdGlvRm9yVXJsIH0gZnJvbSBcInNyYy91dGlscy9uYXRpdmVfZW1iZWRfbWFya3VwLnV0aWxzXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElSZXNpemFibGVJZnJhbWVDb250YWluZXJPdXRwdXQge1xyXG4gICAgaWZyYW1lQ29udGFpbmVyOiBIVE1MRWxlbWVudCxcclxuICAgIG91dHB1dEh0bWw6ICgpID0+IHN0cmluZyxcclxuICAgIHVwZGF0ZUFzcGVjdFJhdGlvOiAoYXNwZWN0UmF0aW86IEFzcGVjdFJhdGlvVHlwZSkgPT4gdm9pZCxcclxuICAgIHJlc2V0VG9EZWZhdWx0V2lkdGg6ICgpID0+IHZvaWQsXHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSWZyYW1lQ29udGFpbmVyRWwoY29udGVudEVsOiBIVE1MRWxlbWVudCwgaWZyYW1lSHRtbDogc3RyaW5nKTogSVJlc2l6YWJsZUlmcmFtZUNvbnRhaW5lck91dHB1dHtcclxuXHQvLyBDb250YWluZXIgdG8ga2VlcCBhIG1pbiBoZWlnaHQgZm9yIHRoZSBpZnJhbWUgdG8ga2VlcCB0aGUgY29udGVudCB2aXNpYmxlXHJcblx0Y29uc3QgaWZyYW1lQ29udGFpbmVyID0gY29udGVudEVsLmNyZWF0ZUVsKCdkaXYnKTtcclxuXHRpZnJhbWVDb250YWluZXIuY2xhc3NOYW1lID0gXCJpZnJhbWVfX2NvbnRhaW5lciBzcGFjZS15XCJcclxuXHJcblx0Ly8gSW5saW5lIHN0eWxpbmcgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGNyZWF0ZWQgaWZyYW1lIHdpbGwga2VlcCB0aGUgc3R5bGUgZXZlbiB3aXRob3V0IHRoZSBwbHVnaW5cclxuXHRjb25zdCBkb2MgPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKGlmcmFtZUh0bWwudHJpbSgpLCBcInRleHQvaHRtbFwiKTtcclxuXHJcblx0Y29uc3Qgcm9vdEVsID0gZG9jLmJvZHkuZmlyc3RFbGVtZW50Q2hpbGQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xyXG5cdGlmICghcm9vdEVsKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0VtYmVkIG1hcmt1cCBkb2VzIG5vdCBjb250YWluIGEgcm9vdCBlbGVtZW50Jyk7XHJcblx0fVxyXG5cclxuXHRjb25zdCBpZnJhbWUgPSByb290RWwgaW5zdGFuY2VvZiBIVE1MSUZyYW1lRWxlbWVudFxyXG5cdFx0PyByb290RWxcclxuXHRcdDogcm9vdEVsLnF1ZXJ5U2VsZWN0b3IoJ2lmcmFtZScpO1xyXG5cclxuXHRpZiAoIWlmcmFtZSkge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdFbWJlZCBtYXJrdXAgZG9lcyBub3QgY29udGFpbiBhbiBpZnJhbWUnKTtcclxuXHR9XHJcblxyXG5cdGlmcmFtZUNvbnRhaW5lci5hcHBlbmRDaGlsZChyb290RWwpO1xyXG5cdGNvbnN0IGRlZmF1bHRBc3BlY3RSYXRpbyA9IGlmcmFtZS5zdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKFwiYXNwZWN0LXJhdGlvXCIpIHx8IGlmcmFtZS5zdHlsZS5hc3BlY3RSYXRpbztcclxuXHRjb25zdCBkZWZhdWx0SGVpZ2h0ID0gaWZyYW1lLnN0eWxlLmdldFByb3BlcnR5VmFsdWUoXCJoZWlnaHRcIikgfHwgaWZyYW1lLnN0eWxlLmhlaWdodDtcclxuXHRjb25zdCBkZWZhdWx0TWluSGVpZ2h0ID0gaWZyYW1lLnN0eWxlLmdldFByb3BlcnR5VmFsdWUoXCJtaW4taGVpZ2h0XCIpIHx8IGlmcmFtZS5zdHlsZS5taW5IZWlnaHQ7XHJcblxyXG5cdGNvbnN0IGFwcGx5RGVmYXVsdFNpemluZyA9ICgpID0+IHtcclxuXHRcdHNldENzc1Byb3BzKGlmcmFtZSwgeyB3aWR0aDogXCIxMDAlXCIgfSk7XHJcblxyXG5cdFx0aWYgKGRlZmF1bHRBc3BlY3RSYXRpbykge1xyXG5cdFx0XHRzZXRDc3NQcm9wcyhpZnJhbWUsIHsgYXNwZWN0UmF0aW86IGRlZmF1bHRBc3BlY3RSYXRpbyB9KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGlmcmFtZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShcImFzcGVjdC1yYXRpb1wiKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZGVmYXVsdEhlaWdodCkge1xyXG5cdFx0XHRzZXRDc3NQcm9wcyhpZnJhbWUsIHsgaGVpZ2h0OiBkZWZhdWx0SGVpZ2h0IH0pO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWZyYW1lLnN0eWxlLnJlbW92ZVByb3BlcnR5KFwiaGVpZ2h0XCIpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChkZWZhdWx0TWluSGVpZ2h0KSB7XHJcblx0XHRcdHNldENzc1Byb3BzKGlmcmFtZSwgeyBtaW5IZWlnaHQ6IGRlZmF1bHRNaW5IZWlnaHQgfSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRpZnJhbWUuc3R5bGUucmVtb3ZlUHJvcGVydHkoXCJtaW4taGVpZ2h0XCIpO1xyXG5cdFx0fVxyXG5cdH07XHJcblxyXG5cdGNvbnN0IHJlc2V0VG9EZWZhdWx0V2lkdGggPSAoKSA9PiB7XHJcblx0XHRhcHBseURlZmF1bHRTaXppbmcoKTtcclxuXHR9O1xyXG5cdFxyXG5cdHJlc2V0VG9EZWZhdWx0V2lkdGgoKTtcclxuXHJcblx0Ly8gQWx3YXlzIGFsbG93IGZ1bGwgc2NyZWVuXHJcblx0Ly8gVE9ETyBtYWtlIGl0IGFuIG9wdGlvblxyXG5cdGlmcmFtZS5hbGxvd0Z1bGxzY3JlZW4gPSB0cnVlO1xyXG5cdGlmcmFtZS5hbGxvdz0gJ2Z1bGxzY3JlZW4nXHJcblxyXG5cdHJldHVybiB7XHJcbiAgICAgICAgaWZyYW1lQ29udGFpbmVyLFxyXG4gICAgICAgIHVwZGF0ZUFzcGVjdFJhdGlvOiAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBcImF1dG9cIikge1xyXG5cdFx0XHRcdGFwcGx5RGVmYXVsdFNpemluZygpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0c2V0Q3NzUHJvcHMoaWZyYW1lLCB7IHdpZHRoOiBcIjEwMCVcIiB9KTtcclxuXHRcdFx0aWZyYW1lLnN0eWxlLnJlbW92ZVByb3BlcnR5KFwiaGVpZ2h0XCIpO1xyXG5cclxuXHRcdFx0aWYgKGRlZmF1bHRNaW5IZWlnaHQpIHtcclxuXHRcdFx0XHRzZXRDc3NQcm9wcyhpZnJhbWUsIHsgbWluSGVpZ2h0OiBkZWZhdWx0TWluSGVpZ2h0IH0pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGlmcmFtZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShcIm1pbi1oZWlnaHRcIik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICh2YWx1ZSA9PT0gXCJub25lXCIpIHtcclxuXHRcdFx0XHRpZnJhbWUuc3R5bGUucmVtb3ZlUHJvcGVydHkoXCJhc3BlY3QtcmF0aW9cIik7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzZXRDc3NQcm9wcyhpZnJhbWUsIHsgYXNwZWN0UmF0aW86IHZhbHVlIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3V0cHV0SHRtbDogKCkgPT4ge1xyXG5cdFx0XHRcdHJldHVybiByb290RWwub3V0ZXJIVE1MO1xyXG5cclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlc2V0VG9EZWZhdWx0V2lkdGgsXHJcblx0fTtcclxufVxyXG5cclxuLy8gRWxlY3Ryb24gPCAxMiBkb2Vzbid0IHN1cHBvcnQgdGhlIGFzcGVjdCByYXRpby4gV2UgbmVlZCB0byB1c2UgYSBmYW5jeSBkaXYgY29udGFpbmVyIHdpdGggYSBwYWRkaW5nIGJvdHRvbVxyXG5cdGV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJZnJhbWVDb250YWluZXJFbExlZ2FjeShjb250ZW50RWw6IEhUTUxFbGVtZW50LCBpZnJhbWVIdG1sOiBzdHJpbmcpOiBJUmVzaXphYmxlSWZyYW1lQ29udGFpbmVyT3V0cHV0e1xyXG5cdC8vIElubGluZSBzdHlsaW5nIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBjcmVhdGVkIGlmcmFtZSB3aWxsIGtlZXAgdGhlIHN0eWxlIGV2ZW4gd2l0aG91dCB0aGUgcGx1Z2luXHJcblxyXG5cdC8vIFRoaXMgY29udGFpbmVyIGNhbiBiZSByZXNpemVkXHJcblx0Y29uc3QgaWZyYW1lQ29udGFpbmVyID0gY29udGVudEVsLmNyZWF0ZUVsKCdkaXYnKTtcclxuXHRpZnJhbWVDb250YWluZXIuY2xhc3NOYW1lID0gXCJpZnJhbWVfX2NvbnRhaW5lcl9fbGVnYWN5IHNwYWNlLXlcIlxyXG5cdHNldENzc1Byb3BzKGlmcmFtZUNvbnRhaW5lciwge1xyXG5cdFx0b3ZlcmZsb3c6ICdhdXRvJyxcclxuXHRcdHJlc2l6ZTogJ2JvdGgnLFxyXG5cdFx0aGVpZ2h0OiBkZWZhdWx0SGVpZ2h0LFxyXG5cdH0pO1xyXG5cclxuXHQvLyBUaGlzIGNvbnRhaW5lciBlbmZvcmNlIHRoZSBhc3BlY3QgcmF0aW8uIGkuZS4gaXQncyBoZWlnaHQgaXMgYmFzZWQgb24gdGhlIHdpZHRoICogcmF0aW9cclxuXHRjb25zdCByYXRpb0NvbnRhaW5lciA9IGlmcmFtZUNvbnRhaW5lci5jcmVhdGVFbCgnZGl2Jyk7XHJcblx0c2V0Q3NzUHJvcHMocmF0aW9Db250YWluZXIsIHtcclxuXHRcdGRpc3BsYXk6ICdibG9jaycsXHJcblx0XHRwb3NpdGlvbjogJ3JlbGF0aXZlJyxcclxuXHRcdHdpZHRoOiAnMTAwJScsXHJcblx0fSk7XHJcblx0Ly8gVGhlIGhlaWdodCBpcyBkZXRlcm1pbmVkIGJ5IHRoZSBwYWRkaW5nIHdoaWNoIHJlc3BlY3QgdGhlIHJhdGlvXHJcblx0Ly8gU2VlIGh0dHBzOi8vd3d3LmJlbm1hcnNoYWxsLm1lL3Jlc3BvbnNpdmUtaWZyYW1lcy9cclxuXHRzZXRDc3NQcm9wcyhyYXRpb0NvbnRhaW5lciwge1xyXG5cdFx0aGVpZ2h0OiBcIjBweFwiLFxyXG5cdFx0Jy0tYXNwZWN0LXJhdGlvJzogJzkvMTYnLFxyXG5cdFx0cGFkZGluZ0JvdHRvbTogJ2NhbGModmFyKC0tYXNwZWN0LXJhdGlvKSAqIDEwMCUpJyxcclxuXHR9KTtcclxuXHJcblx0Y29uc3QgaWZyYW1lID0gcmF0aW9Db250YWluZXIuY3JlYXRlRWwoJ2lmcmFtZScpO1xyXG5cclxuXHRjb25zdCBkb2MgPSBuZXcgRE9NUGFyc2VyKCkucGFyc2VGcm9tU3RyaW5nKGlmcmFtZUh0bWwudHJpbSgpLCBcInRleHQvaHRtbFwiKTtcclxuXHRjb25zdCBzb3VyY2VJZnJhbWUgPSBkb2MucXVlcnlTZWxlY3RvcignaWZyYW1lJyk7XHJcblx0Y29uc3Qgc291cmNlVXJsID0gc291cmNlSWZyYW1lPy5nZXRBdHRyaWJ1dGUoXCJzcmNcIikgPz8gXCJhYm91dDpibGFua1wiO1xyXG5cdGNvbnN0IGF1dG9Bc3BlY3RSYXRpbyA9IGdldEF1dG9Bc3BlY3RSYXRpb0ZvclVybChzb3VyY2VVcmwpO1xyXG5cdGlmcmFtZS5zcmMgPSBzb3VyY2VJZnJhbWU/LmdldEF0dHJpYnV0ZSgnc3JjJykgPz8gJ2Fib3V0OmJsYW5rJztcclxuXHRpZnJhbWUuYWxsb3cgPSBcImZ1bGxzY3JlZW5cIlxyXG5cdHNldENzc1Byb3BzKGlmcmFtZSwge1xyXG5cdFx0cG9zaXRpb246ICdhYnNvbHV0ZScsXHJcblx0XHR0b3A6ICcwcHgnLFxyXG5cdFx0bGVmdDogJzBweCcsXHJcblx0XHRoZWlnaHQ6ICcxMDAlJyxcclxuXHRcdHdpZHRoOiAnMTAwJScsXHJcblx0fSk7XHJcblxyXG5cdGNvbnN0IHJlc29sdmVkSW5pdGlhbFJhdGlvID0gYXV0b0FzcGVjdFJhdGlvID09PSBcIm5vbmVcIiA/IFwiMTYvOVwiIDogYXV0b0FzcGVjdFJhdGlvO1xyXG5cdHNldENzc1Byb3BzKHJhdGlvQ29udGFpbmVyLCB7ICctLWFzcGVjdC1yYXRpbyc6IHN3YXBSYXRpbyhyZXNvbHZlZEluaXRpYWxSYXRpbykgfSk7XHJcblxyXG5cdC8vIFJlY29tcHV0ZSB0aGUgaWZyYW1lIGhlaWdodCB3aXRoIHRoZSByYXRpbyB0byBhdm9pZCBhbnkgZW1wdHkgc3BhY2VcclxuXHRzZXRDc3NQcm9wcyhpZnJhbWVDb250YWluZXIsIHsgaGVpZ2h0OiBgJHtyYXRpb0NvbnRhaW5lci5vZmZzZXRIZWlnaHR9cHhgIH0pO1xyXG5cclxuXHRyZXR1cm4ge1xyXG4gICAgICAgIGlmcmFtZUNvbnRhaW5lcixcclxuICAgICAgICB1cGRhdGVBc3BlY3RSYXRpbzogKHZhbHVlKSA9PiB7XHJcblx0XHRcdGNvbnN0IHJlc29sdmVkVmFsdWUgPSB2YWx1ZSA9PT0gXCJhdXRvXCIgPyBhdXRvQXNwZWN0UmF0aW8gOiB2YWx1ZTtcclxuXHJcblx0XHRcdGlmIChyZXNvbHZlZFZhbHVlID09PSAnbm9uZScpIHtcclxuXHRcdFx0XHRzZXRDc3NQcm9wcyhyYXRpb0NvbnRhaW5lciwge1xyXG5cdFx0XHRcdFx0cGFkZGluZ0JvdHRvbTogJzBweCcsXHJcblx0XHRcdFx0XHRoZWlnaHQ6ICcxMDAlJyxcclxuXHRcdFx0XHR9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuXHRcdFx0XHRzZXRDc3NQcm9wcyhyYXRpb0NvbnRhaW5lciwge1xyXG5cdFx0XHRcdFx0cGFkZGluZ0JvdHRvbTogJ2NhbGModmFyKC0tYXNwZWN0LXJhdGlvKSAqIDEwMCUpJyxcclxuXHRcdFx0XHRcdGhlaWdodDogJzBweCcsXHJcblx0XHRcdFx0XHQnLS1hc3BlY3QtcmF0aW8nOiBzd2FwUmF0aW8ocmVzb2x2ZWRWYWx1ZSksXHJcblx0XHRcdFx0fSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG91dHB1dEh0bWw6ICgpID0+IHtcclxuXHRcdFx0aWZyYW1lQ29udGFpbmVyLmNsYXNzTmFtZSA9IFwiXCI7XHJcblx0XHRcdC8vIFJlY29tcHV0ZSB0aGUgaGVpZ2h0IHRvIHJlbW92ZSB0aGUgcG9zc2libGUgZW1wdHkgc3BhY2VcclxuXHRcdFx0c2V0Q3NzUHJvcHMoaWZyYW1lQ29udGFpbmVyLCB7IGhlaWdodDogYCR7cmF0aW9Db250YWluZXIub2Zmc2V0SGVpZ2h0fXB4YCB9KTtcclxuXHRcdFx0cmV0dXJuIHJhdGlvQ29udGFpbmVyLm91dGVySFRNTDtcclxuXHJcbiAgICAgICAgfSxcclxuICAgICAgICByZXNldFRvRGVmYXVsdFdpZHRoOiAoKSA9PiB7XHJcblxyXG5cdFx0XHRzZXRDc3NQcm9wcyhpZnJhbWVDb250YWluZXIsIHtcclxuXHRcdFx0XHR3aWR0aDogJzEwMCUnLFxyXG5cdFx0XHRcdGhlaWdodDogYCR7cmF0aW9Db250YWluZXIub2Zmc2V0SGVpZ2h0fXB4YCxcclxuXHRcdFx0fSk7XHJcbiAgICAgICAgfSxcclxuXHR9O1xyXG59XHJcbiJdfQ==