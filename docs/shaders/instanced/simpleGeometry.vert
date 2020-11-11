attribute vec2 aVertex; // in [-.5, .5]^2
attribute vec4 aState;
attribute vec4 aColor; // in [0,1]^4

uniform vec2 uScreenSize; // in pixels

varying vec4 vColor;

void main(void)
{
    // unpack the state
    vec2 screenspacePrimitiveCenter = aState.xy;
    float sizeInPixels = aState.z;

    vec2 screenspaceToViewport = 2.0 / uScreenSize * vec2(1,-1);
    vec2 screenspacePosition = screenspacePrimitiveCenter + sizeInPixels * aVertex;
    gl_Position = vec4(screenspacePosition * screenspaceToViewport, 0, 1);

    vColor = aColor;
}