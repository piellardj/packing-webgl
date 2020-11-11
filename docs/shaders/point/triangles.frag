precision mediump float;

varying vec4 vColor;
varying vec2 vCosSinAngle;

float sign(vec2 p1, vec2 p2, vec2 p3)
{
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

void main(void)
{
    vec2 pos = gl_PointCoord - vec2(0.5);

    float cosAngle = vCosSinAngle.x;
    float sinAngle = vCosSinAngle.y;
    vec2 rotatedPos = vec2(
        cosAngle * pos.x - sinAngle * pos.y,
        sinAngle * pos.x + cosAngle * pos.y
    );

    const vec2 p1 = vec2(0, -0.5);
    const vec2 p2 = vec2(-0.43301270189, 0.25);
    const vec2 p3 = vec2(0.43301270189, 0.25);
    
    float d1 = sign(rotatedPos, p1, p2);
    float d2 = sign(rotatedPos, p2, p3);
    float d3 = sign(rotatedPos, p3, p1);

    float min = min(d1, min(d2, d3));
    float max = max(d1, max(d2, d3));

    if (min * max < 0.0) {
        discard;
    }

    gl_FragColor = vColor;
}
