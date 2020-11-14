import { Color } from "../color/color";

import { PatternCircle } from "../patterns/pattern-circle";
import { PatternRectangle } from "../patterns/pattern-rectangle";
import { PatternSquare } from "../patterns/pattern-square";
import { PatternTriangle } from "../patterns/pattern-triangle";

import { ILine } from "../utils/i-line";
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
            const centerX = square.center.x + halfWidth;
            const centerY = square.center.y + halfHeight;
            const halfSize = 0.5 * square.size;

            this.stringParts.push(`\t\t<rect fill="${square.color}" x="${centerX - halfSize}" y="${centerY - halfSize}" width="${square.size}" height="${square.size}"/>\n`);
        }
        this.stringParts.push(`\t</g>\n`);
    }

    public drawCircles(circles: PatternCircle[]): void {
        const halfWidth = 0.5 * this._size.width;
        const halfHeight = 0.5 * this._size.height;

        this.stringParts.push(`\t<g stroke="none">\n`);
        for (const circle of circles) {
            const centerX = circle.center.x + halfWidth;
            const centerY = circle.center.y + halfHeight;

            this.stringParts.push(`\t\t<circle fill="${circle.color}" cx="${centerX}" cy="${centerY}" r="${circle.radius}"/>\n`);
        }
        this.stringParts.push(`\t</g>\n`);
    }

    public drawRectangles(rectangles: PatternRectangle[]): void {
        const halfWidth = 0.5 * this._size.width;
        const halfHeight = 0.5 * this._size.height;

        this.stringParts.push(`\t<g stroke="none">\n`);
        for (const rectangle of rectangles) {
            const centerX = rectangle.center.x + halfWidth;
            const centerY = rectangle.center.y + halfHeight;

            this.stringParts.push(`\t\t<rect fill="${rectangle.color}" x="${centerX - 0.5 * rectangle.width}" y="${centerY - 0.5 * rectangle.height}" width="${rectangle.width}" height="${rectangle.height}"/>\n`);
        }
        this.stringParts.push(`\t</g>\n`);
    }

    public drawTriangles(triangles: PatternTriangle[]): void {
        const halfWidth = 0.5 * this._size.width;
        const halfHeight = 0.5 * this._size.height;

        this.stringParts.push(`\t<g stroke="none">\n`);
        for (const triangle of triangles) {
            const centerX = triangle.center.x + halfWidth;
            const centerY = triangle.center.y + halfHeight;

            this.stringParts.push(`\t\t<polygon fill="${triangle.color}" points="${centerX + triangle.P1.x * triangle.size},${centerY + triangle.P1.y * triangle.size} ${centerX + triangle.P2.x * triangle.size},${centerY + triangle.P2.y * triangle.size} ${centerX + triangle.P3.x * triangle.size},${centerY + triangle.P3.y * triangle.size}"/>\n`);
        }
        this.stringParts.push(`\t</g>\n`);
    }

    public drawLines(lines: ILine[], color: Color): void {
        const path: string[] = [];

        const halfWidth = 0.5 * this._size.width;
        const halfHeight = 0.5 * this._size.height;
        for (const line of lines) {
            const x1 = line.from.x + halfWidth;
            const y1 = line.from.y + halfHeight;
            const x2 = line.to.x + halfWidth;
            const y2 = line.to.y + halfHeight;

            path.push(`M${x1},${y1}L${x2},${y2}`);
        }

        this.stringParts.push(`\t\t\t<path fill="none" stroke-width="1" stroke="${color}" d="${path.join()}"/>\n`);
    }

    public export(): string {
        const result = this.stringParts.join("");
        return result;
    }
}

export { PlotterSVG };
