uniform float size;
#ifdef USE_PROJECTIVE_TEXTURING
varying vec4 vPositionWorld;
varying float vDistanceCamera;
#endif
varying vec4 vColor;

void main() {
    gl_PointSize = size;
    vec4 vPositionImage = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    gl_Position = vPositionImage;

#ifdef USE_PROJECTIVE_TEXTURING
    vPositionWorld = modelMatrix * vec4( position, 1.0 );
    vDistanceCamera = ((vPositionImage.z / vPositionImage.w) + 1.) / 2.;
#endif
    vColor = vec4(color, 1.);
}
