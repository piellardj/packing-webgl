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

function registerPadStartPolyfill(): void {
    if (typeof String.prototype.padStart !== "function") {
        String.prototype.padStart = function padStart(maxLength: number, fillString?: string): string {
            if (this.length > maxLength) {
                return String(this);
            }

            if (!fillString) {
                fillString = " ";
            }

            const nbRepeats = Math.ceil((maxLength - this.length) / fillString.length);
            let result = "";
            for (let i = 0; i < nbRepeats; i++) {
                result += fillString;
            }
            return result + this;
        }
    }
}
registerPadStartPolyfill(); // for IE11

function randomHexColor(): string {
    const randInt = Math.floor(256 * 256 * 256 * Math.random());
    return "#" + randInt.toString(16).padStart(6, "0");
}

export { downloadTextFile, randomHexColor }
