import { Color } from "../utils/color";
import { IPoint } from "../utils/i-point";
import { ISize } from "../utils/i-size";

import { PlotterBase } from "./plotter-base";

import { PatternCircle } from "../patterns/pattern-circle";
import { PatternSquare } from "../patterns/pattern-square";

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

    public get isReady(): boolean {
        return true;
    }

    public initialize(backgroundColor: Color): void {
        this.stringParts = [];

        this.stringParts.push(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`);
        this.stringParts.push(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${this._size.width} ${this._size.height}">\n`);

        this.stringParts.push(`\t<rect fill="${backgroundColor}" stroke="none" x="0" y="0" width="${this._size.width}" height="${this._size.height}"/>\n`);
    }

    // tslint:disable-next-line:no-empty
    public finalize(): void {
        this.stringParts.push(`</svg>\n`);
    }

    public drawSquares(squares: PatternSquare[]): void {
        const halfWidth = 0.5 * this._size.width;
        const halfHeight = 0.5 * this._size.height;

        this.stringParts.push(`\t<g stroke="none">\n`);
        for (const square of squares) {
            if (!square.needInitialization) {
                const centerX = square.center.x + halfWidth;
                const centerY = square.center.y + halfHeight;
                const halfSize = 0.5 * square.size;

                this.stringParts.push(`\t\t<rect fill="${square.color}" x="${centerX - halfSize}" y="${centerY - halfSize}" width="${square.size}" height="${square.size}"/>\n`);
            }
        }
        this.stringParts.push(`\t</g>\n`);
    }

    public drawCircles(circles: PatternCircle[]): void {
        const halfWidth = 0.5 * this._size.width;
        const halfHeight = 0.5 * this._size.height;

        this.stringParts.push(`\t<g stroke="none">\n`);
        for (const circle of circles) {
            if (!circle.needInitialization) {
                const centerX = circle.center.x + halfWidth;
                const centerY = circle.center.y + halfHeight;

                this.stringParts.push(`\t\t<circle fill="${circle.color}" cx="${centerX}" cy="${centerY}" r="${circle.radius}"/>\n`);
            }
        }
        this.stringParts.push(`\t</g>\n`);
    }

    public initializeLinesDrawing(color: Color): void {
        this.stringParts.push(`\t\t<g fill="none" stroke-width="1" stroke="${color}">\n`);
    }

    public drawLine(from: IPoint, to: IPoint): void {
        const x1 = from.x + 0.5 * this._size.width;
        const y1 = from.y + 0.5 * this._size.height;
        const x2 = to.x + 0.5 * this._size.width;
        const y2 = to.y + 0.5 * this._size.height;

        this.stringParts.push(`\t\t\t<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>\n`);
    }

    public finalizeLinesDrawing(): void {
        this.stringParts.push(`\t\t</g>\n`);
    }

    public export(): string {
        const result = this.stringParts.join("");
        return result;
    }
}

export { PlotterSVG }
