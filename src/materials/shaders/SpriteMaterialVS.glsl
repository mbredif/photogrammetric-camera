// M^(-1) -> this.viewProjectionInverse
// C -> uniform vec3 cameraPosition
// M' -> this.textureCameraPostTransform * this.textureCameraPreTransform
// C' -> this.textureCameraPosition
// P -> attribute vec3 position;

uniform float size;
varying vec4 vColor;

uniform vec3 textureCameraPosition;
uniform mat4 textureCameraPreTransform; // Contains the rotation and the intrinsics of the camera, but not the translation
uniform mat4 textureCameraPostTransform;
uniform mat4 viewProjectionInverse;
varying mat4 vH;

void main() {
    gl_PointSize = size;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    // Homography

    mat4 M_prime = textureCameraPostTransform * textureCameraPreTransform;
    vec4 E_prime = M_prime * vec4(cameraPosition - textureCameraPosition, 1.0);
    E_prime.xyz /= E_prime.w;
    vec4 P = modelMatrix * vec4( position, 1.0 );
    P.xyz /= P.w;
    vec3 N = P.xyz - cameraPosition;

    mat3 E_prime_mat = mat3(E_prime.x, 0.0, 0.0,
                            0.0, E_prime.y, 0.0,
                            0.0, 0.0, E_prime.z);

    mat3 N_transpose_mat = mat3(N.x, N.y, N.z,
                                N.x, N.y, N.z,
                                N.x, N.y, N.z);

    mat3 numerator = E_prime_mat * N_transpose_mat;
    float denominator = dot(N, P.xyz - cameraPosition);

    mat3 fraction = ( 1.0 / denominator ) * numerator;


    // TODO: find another way to do this if possible
    M_prime[0][0] += fraction[0][0]; M_prime[0][1] += fraction[0][1]; M_prime[0][2] += fraction[0][2];
    M_prime[1][0] += fraction[1][0]; M_prime[1][1] += fraction[1][1]; M_prime[1][2] += fraction[1][2];
    M_prime[2][0] += fraction[2][0]; M_prime[2][1] += fraction[2][1]; M_prime[2][2] += fraction[2][2];


    vH = M_prime * viewProjectionInverse;


    vColor = vec4(color, 1.);
}
