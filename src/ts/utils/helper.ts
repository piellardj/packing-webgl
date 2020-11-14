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

function getQueryStringValue(name: string): string | null {
    const url = window.location.href;
    const queryStringStart = url.indexOf("?");
    if (queryStringStart >= 0) {
        const queryString = url.substring(queryStringStart + 1);
        if (queryString.length > 0) {
            const parameters = queryString.split("&");
            for (const parameter of parameters) {
                const keyValue = parameter.split("=");
                if (keyValue.length === 2) {
                    const decodedKey = decodeURIComponent(keyValue[0]);
                    if (decodedKey === name) {
                        return decodeURIComponent(keyValue[1]);
                    }
                }
            }
        }
    }

    return null;
}

export {
    downloadTextFile,
    getQueryStringValue,
};
