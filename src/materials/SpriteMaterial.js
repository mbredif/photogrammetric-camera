import { Uniform, ShaderMaterial, Vector3, Vector4, Matrix4 } from 'three';
import SpriteMaterialVS from './shaders/SpriteMaterialVS.glsl';
import SpriteMaterialFS from './shaders/SpriteMaterialFS.glsl';


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

// M^(-1) -> this.viewProjectionInverse
// C -> uniform vec3 cameraPosition
// M' -> this.textureCameraPostTransform * this.textureCameraPreTransform
// C' -> this.textureCameraPosition
// P -> attribute vec3 position;

class SpriteMaterial extends ShaderMaterial {
  constructor() {
    super();

    definePropertyUniform(this, 'size', 3);
    definePropertyUniform(this, 'textureCameraPosition', new Vector3());
    definePropertyUniform(this, 'textureCameraPreTransform', new Matrix4());
    definePropertyUniform(this, 'textureCameraPostTransform', new Matrix4());
    definePropertyUniform(this, 'viewProjectionInverse', new Matrix4());
    definePropertyUniform(this, 'uvDistortion', {R: new Vector4(), C: new Vector3()});
    definePropertyUniform(this, 'map', null);
    definePropertyUniform(this, 'depthMap', null);
    definePropertyUniform(this, 'diffuseColorGrey', null);

    this.defines.USE_COLOR = '';

    this.vertexShader = SpriteMaterialVS;

    this.fragmentShader = SpriteMaterialFS;
  }

  setCamera(camera) {
      camera.getWorldPosition(this.textureCameraPosition);
      this.textureCameraPreTransform.copy(camera.matrixWorldInverse);
      this.textureCameraPreTransform.setPosition(0, 0, 0);
      this.textureCameraPreTransform.premultiply(camera.preProjectionMatrix);
      this.textureCameraPostTransform.copy(camera.postProjectionMatrix);

      if (camera.distos && camera.distos.length == 1 && camera.distos[0].type === 'ModRad') {
          this.uvDistortion = camera.distos[0];
      } else {
          this.uvDistortion = { C: new THREE.Vector2(), R: new THREE.Vector4() };
          this.uvDistortion.R.w = Infinity;
      }
  }

  setViewCamera(camera) {
    var viewProjectionTransform = new Matrix4();
    viewProjectionTransform.copy(camera.matrixWorldInverse);
    viewProjectionTransform.setPosition(0, 0, 0);
    viewProjectionTransform.premultiply(camera.preProjectionMatrix);
    viewProjectionTransform.premultiply(camera.postProjectionMatrix);

    this.viewProjectionInverse.copy(viewProjectionTransform).invert();
  }
}

export default SpriteMaterial;
