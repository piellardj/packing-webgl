precision mediump float;

varying vec4 vColor;

void main(void)
{
    // circle made of diamond square of half-diagonal 'a' with 2 half circles of radius c
    const float a = 0.82842712474; // 2 / (1 + sqrt(2))
    const float c = 0.58578643762; // 2 + (2 + sqrt(2))
    const float dV = 0.08578643763; // (2 - (1.5a + c) / 2

    vec2 vLocalCoords = 2.0 * gl_PointCoord - 1.0; // in [-1,-1]^2
    float absX = abs(vLocalCoords.x);

    vec2 toCircleCenter = vec2(1.0 - c, -1.0 + c) - vec2(absX, vLocalCoords.y);
    bool isInCircle = dot(toCircleCenter, toCircleCenter) < (c * c);
    if (!isInCircle) {
        bool isInSquare = (absX + abs(vLocalCoords.y)) < a;
        if (!isInSquare) {
            // bool isOnBorder = max(abs(vLocalCoords.x), abs(vLocalCoords.y)) > 0.95;
            // if (!isOnBorder) {
                discard;
            // }
        }
    }

    gl_FragColor = vColor;
}
