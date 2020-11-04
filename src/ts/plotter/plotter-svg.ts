import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";
import { PlotterBase } from "./plotter-base";

class PlotterSVG extends PlotterBase {
    private stringParts: string[];
    private readonly _size: ISize;

    public constructor(size: ISize) {
        super();

        this._size = {
            width: size.width,
            height: size.height,
        };
    }

    public get size(): ISize {
        return this._size;
    }

    public initialize(): void {
        this.stringParts = [];

        this.stringParts.push(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`);
        this.stringParts.push(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${this._size.width} ${this._size.height}">\n`);

        this.stringParts.push(`\t<rect fill="black" stroke="none" x="0" y="0" width="${this._size.width}" height="${this._size.height}"/>\n`);
        this.stringParts.push(`\t<g stroke="none">\n`);
    }

    // tslint:disable-next-line:no-empty
    public finalize(): void {
        this.stringParts.push(`\t</g>\n`);
        this.stringParts.push(`</svg>\n`);
    }

    public drawRectangle(center: IPoint, size: ISize, color: string): void {
        const centerX = center.x + 0.5 * this._size.width;
        const centerY = center.y + 0.5 * this._size.height;
        this.stringParts.push(`\t\t<rect fill="${color}" x="${centerX - 0.5 * size.width}" y="${centerY - 0.5 * size.height}" width="${size.width}" height="${size.height}"/>\n`);
    }

    public drawCircle(center: IPoint, radius: number, color: string): void {
        const centerX = center.x + 0.5 * this._size.width;
        const centerY = center.y + 0.5 * this._size.height;
        this.stringParts.push(`\t\t<circle fill="${color}" cx="${centerX}" cy="${centerY}" r="${radius}"/>\n`);
    }

    public export(): string {
        const start = Date.now();
        const result = this.stringParts.join("");
        console.log(`Concatenation took ${Date.now() - start} ms.`);
        return result;
    }
}

export { PlotterSVG }
