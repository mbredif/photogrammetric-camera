import { Uniform, ShaderMaterial, Matrix4, Vector3, Vector4 } from 'three';
import { default as RadialDistortion } from '../cameras/distortions/RadialDistortion';
import NewMaterialVS from './shaders/NewMaterialVS.glsl';
import NewMaterialFS from './shaders/NewMaterialFS.glsl';

function pop(options, property, defaultValue) {
    if (options[property] === undefined) return defaultValue;
    const value = options[property];
    delete options[property];
    return value;
}

function definePropertyUniform(object, property, defaultValue) {
    object.uniforms[property] = new Uniform(object[property] || defaultValue);
    Object.defineProperty(object, property, {
        get: () => object.uniforms[property].value,
        set: (value) => {
            if (object.uniforms[property].value != value) {
                object.uniformsNeedUpdate = true;
                object.uniforms[property].value = value;
            }
        }
    });
}

class NewMaterial extends ShaderMaterial {
  constructor(options = {}) {
    const size = pop(options, 'size', 1);
    const textureCameraPosition = pop(options, 'textureCameraPosition', new Vector3());
    const textureCameraPreTransform = pop(options, 'textureCameraPreTransform', new Matrix4());
    const textureCameraPostTransform = pop(options, 'uvwPostTransform', new Matrix4());
    const uvDistortion = pop(options, 'uvDistortion', {R: new Vector4(), C: new Vector3()});
    const map = pop(options, 'map', null);
    const depthMap = pop(options, 'depthMap', null);
    const diffuseColorGrey = pop(options, 'diffuseColorGrey', true);

    options.defines = options.defines || {};
    options.defines.USE_COLOR = '';
    if (map) {
        options.defines.USE_PROJECTIVE_TEXTURING = '';
        options.defines.EPSILON = 1e-3;
    }

    super(options);

    definePropertyUniform(this, 'size', size);
    definePropertyUniform(this, 'textureCameraPosition', textureCameraPosition);
    definePropertyUniform(this, 'textureCameraPreTransform', textureCameraPreTransform);
    definePropertyUniform(this, 'textureCameraPostTransform', textureCameraPostTransform);
    definePropertyUniform(this, 'uvDistortion', uvDistortion);
    definePropertyUniform(this, 'map', map);
    definePropertyUniform(this, 'depthMap', depthMap);
    definePropertyUniform(this, 'diffuseColorGrey', diffuseColorGrey);

    this.vertexShader = NewMaterialVS;
//     this.vertexShader = `
//         uniform float size;
// #ifdef USE_PROJECTIVE_TEXTURING
//         varying vec4 vPositionWorld;
//         varying float vDistanceCamera;
// #endif
//         varying vec4 vColor;
//
//         void main() {
//             gl_PointSize = size;
//             vec4 vPositionImage = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
//             gl_Position = vPositionImage;
//
// #ifdef USE_PROJECTIVE_TEXTURING
//             vPositionWorld = modelMatrix * vec4( position, 1.0 );
//             vDistanceCamera = ((vPositionImage.z / vPositionImage.w) + 1.) / 2.;
// #endif
//             vColor = vec4(color, 1.);
//         }
//     `;

    this.fragmentShader = `
    ${RadialDistortion.chunks.radial_pars_fragment}
    ${NewMaterialFS}
    `;
//     this.fragmentShader = `
//     ${RadialDistortion.chunks.radial_pars_fragment}
//         uniform bool diffuseColorGrey;
// #ifdef USE_PROJECTIVE_TEXTURING
//         uniform vec3 textureCameraPosition;
//         uniform mat4 textureCameraPreTransform; // Contains the rotation and the intrinsics of the camera, but not the translation
//         uniform mat4 textureCameraPostTransform;
//         uniform RadialDistortion uvDistortion;
//         varying vec4 vPositionWorld;
//         varying float vDistanceCamera;
//         uniform sampler2D map;
//         uniform sampler2D depthMap;
// #endif
//         varying vec4 vColor;
//
//         void main() {
//           vec4 finalColor = vColor;
//
//           if (diffuseColorGrey) {
//             finalColor.rgb = vec3(dot(vColor.rgb, vec3(0.333333)));
//           }
//
// #ifdef USE_PROJECTIVE_TEXTURING
//         // Project the point in the texture image
//         // p' = M' * (P - C')
//         // p': uvw
//         // M': textureCameraPreTransform
//         // P : vPositionWorld
//         // C': textureCameraPosition
//
//
//         vec4 uvw = textureCameraPreTransform * ( vPositionWorld - vec4(textureCameraPosition, 0.0) );
//
//
//         // For the shadowMapping, which is not distorted
//         vec4 uvwNotDistorted = textureCameraPostTransform * uvw;
//         uvwNotDistorted.xyz /= uvwNotDistorted.w;
//         uvwNotDistorted.xyz = ( uvwNotDistorted.xyz + vec3(1.0) ) / 2.0;
//         float minDist = texture2D(depthMap, uvwNotDistorted.xy);
//
//         // ShadowMapping
//         if ( (vDistanceCamera >= (minDist - EPSILON)) && (vDistanceCamera <= (minDist + EPSILON)) ) {
//
//           // Don't texture if uvw.w < 0
//           if (uvw.w > 0. && distort_radial(uvw, uvDistortion)) {
//
//             uvw = textureCameraPostTransform * uvw;
//             uvw.xyz /= uvw.w;
//
//             // Normalization
//             uvw.xyz = (uvw.xyz + vec3(1.0)) / 2.0;
//
//             // If coordinates are valid, they will be between 0 and 1 after normalization
//             // Test if coordinates are valid, so we can texture
//             vec3 testBorder = min(uvw.xyz, 1. - uvw.xyz);
//
//             if (all(greaterThan(testBorder,vec3(0.)))) {
//               vec4 color = texture2D(map, uvw.xy);
//               finalColor.rgb = mix(finalColor.rgb, color.rgb, color.a);
//             }
//           }
//         }
// #endif
//
//           gl_FragColor = finalColor;
//         }
//
//     `;
  }

  setCamera(camera) {
      camera.getWorldPosition(this.textureCameraPosition);
      this.textureCameraPreTransform.copy(camera.matrixWorldInverse);
      this.textureCameraPreTransform.setPosition({x:0,y:0,z:0});
      this.textureCameraPreTransform.premultiply(camera.preProjectionMatrix);
      this.textureCameraPostTransform.copy(camera.postProjectionMatrix);

      if (camera.distos && camera.distos.length == 1 && camera.distos[0].type === 'ModRad') {
          this.uvDistortion = camera.distos[0];
      } else {
          this.uvDistortion = { C: new THREE.Vector2(), R: new THREE.Vector4() };
          this.uvDistortion.R.w = Infinity;
      }
  }
}

export default NewMaterial;
