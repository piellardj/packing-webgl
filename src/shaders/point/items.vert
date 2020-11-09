attribute vec4 aState;
attribute vec4 aColor; // in [0,1]^4

uniform vec2 uScreenSize; // in pixels

varying vec4 vColor;

void main(void)
{
    // unpack the state
    vec2 screenspacePosition = aState.xy;
    float sizeInPixels = aState.z;

    vec2 screenspaceToViewport = 2.0 / uScreenSize * vec2(1,-1);
    gl_Position = vec4(screenspacePosition * screenspaceToViewport, 0, 1);
    gl_PointSize = sizeInPixels;

    vColor = aColor;
}
