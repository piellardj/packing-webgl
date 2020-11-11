attribute vec2 aCoords; // in pixels, centered on {0,0}

uniform vec2 uScreenSize; // in pixels

void main(void)
{
    gl_Position = vec4(2.0 * aCoords / uScreenSize * vec2(1,-1), 0, 1);
}
