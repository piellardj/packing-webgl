import { PlotterCanvas2D } from "../plotter/plotter-canvas-2d";
import { PlotterCanvasBase } from "../plotter/plotter-canvas-base";
import { PlotterCanvasWebGL } from "../plotter/plotter-canvas-webgl";

function downloadTextFile(fileName: string, content: string): void {
    const fileType = "text/plain";

    const blob = new Blob([content], { type: fileType });

    if (typeof window.navigator !== "undefined" && typeof window.navigator.msSaveBlob !== "undefined") { // for IE
        window.navigator.msSaveBlob(blob, fileName);
    } else {
        const objectUrl = URL.createObjectURL(blob);

        const linkElement = document.createElement('a');
        linkElement.download = fileName;
        linkElement.href = objectUrl;
        linkElement.dataset.downloadurl = `${fileType}:${linkElement.download}:${linkElement.href}`;
        linkElement.style.display = "none";
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);

        // don't forget to free the objectURL after a few seconds
        setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
        }, 5000);
    }
}

const webgl = true;
function chooseCanvasPlotter(): PlotterCanvasBase {
    return webgl ? new PlotterCanvasWebGL() : new PlotterCanvas2D();
}

export {
    chooseCanvasPlotter,
    downloadTextFile,
}
