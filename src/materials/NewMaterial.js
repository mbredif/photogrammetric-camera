import { Uniform, ShaderMaterial, ShaderChunk, Matrix4, Vector3, Vector4 } from 'three';
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

    this.fragmentShader = `
    ${RadialDistortion.chunks.radial_pars_fragment}
    ${ShaderChunk.packing}
    ${NewMaterialFS}
    `;

  }

  setCamera(camera) {
      camera.getWorldPosition(this.textureCameraPosition);
      this.textureCameraPreTransform.copy(camera.matrixWorldInverse);
      this.textureCameraPreTransform.setPosition(0,0,0);
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
