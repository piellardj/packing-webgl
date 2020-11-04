interface IPoint {
    x: number;
    y: number;
}

function distance(a: IPoint, b: IPoint): number {
    const dX = a.x - b.x;
    const dY = a.y - b.y;
    return Math.sqrt(dX * dX + dY * dY);
}

function rotate(p: IPoint, angle: number): IPoint {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    return {
        x: p.x * cosAngle - p.y * sinAngle,
        y: p.x * sinAngle + p.y * cosAngle,
    };
}

export { IPoint, distance, rotate }
