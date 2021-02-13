precision mediump float;

varying vec4 vColor;
varying vec2 vLocalCoords; // in [-1,-1]^2

void main(void)
{
    // circle made of diamond square of half-diagonal 'a' with 2 half circles of radius c
    const float a = 0.82842712474; // 2 / (1 + sqrt(2))
    const float c = 0.58578643762; // 2 + (2 + sqrt(2))

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
