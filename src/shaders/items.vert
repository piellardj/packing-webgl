attribute vec2 aCoords; // in pixels, centered on {0,0}
attribute float aSize; // in pixels
attribute vec4 aColor; // in [0,1]^4, alpha == 0 to hide point

uniform vec2 uScreenSize; // in pixels

varying vec4 vColor;

void main(void)
{
    const vec2 OUT_OF_SCREEN = vec2(1000000, 10000000);

    float isPointHidden = step(aColor.a, 0.5);

    vec2 realPosition = 2.0 * aCoords / uScreenSize * vec2(1,-1);
    vec2 position = realPosition + isPointHidden * OUT_OF_SCREEN;
    gl_Position = vec4(position, 0, 1);
    gl_PointSize = aSize;

    vColor = aColor;
}
