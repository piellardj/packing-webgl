attribute vec4 aState;
attribute vec4 aColor; // in [0,1]^4

uniform vec2 uScreenSize; // in pixels

varying vec4 vColor;
varying vec2 vSize;

void main(void)
{
    // unpack the state
    vec2 screenspacePosition = aState.xy;
    float sizeInPixels = aState.z;
    float aspectRatio = aState.w;

    vec2 screenspaceToViewport = 2.0 / uScreenSize * vec2(1,-1);
    gl_Position = vec4(screenspacePosition * screenspaceToViewport, 0, 1);
    gl_PointSize = sizeInPixels;

    vSize = min(vec2(1.0), vec2(aspectRatio, 1.0 / aspectRatio));
    vColor = aColor;
}
