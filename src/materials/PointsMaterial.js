import { Uniform, ShaderMaterial, ShaderLib, ShaderChunk, Matrix4, Color } from 'three';

function pop(options, property, defaultValue) {
    if (options[property] === undefined) return defaultValue;
    const value = options[property];
    delete options[property];
    return value;
}

function popUniform(options, property, defaultValue) {
    const value = pop(options, property, defaultValue);
    if (options.uniforms[property])
        return options.uniforms[property];
    return new Uniform(value);
}

ShaderChunk.common = `${ShaderChunk.common}
#ifdef USE_WORLDPOS
varying vec3 vWorldPosition;
#endif
`

ShaderChunk.worldpos_vertex = `
#if defined( USE_WORLDPOS ) || defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )
  vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
#endif
#ifdef USE_WORLDPOS
  vWorldPosition = worldPosition.xyz;
#endif
`

ShaderChunk.color_pars_fragment = `${ShaderChunk.color_pars_fragment}
#ifdef USE_MAP4

	uniform mat4 uvwTransform;

#endif
`

ShaderChunk.color_fragment = `${ShaderChunk.color_fragment}
#ifdef USE_MAP4

	vec4 uvw= uvwTransform * vec4(vWorldPosition, 1);
  uvw.xyz /= 2. * uvw.w;
  if (all(lessThan(abs(uvw.xyz),vec3(0.5)))) {
    vec4 color = texture2D( map, 0.5 + uvw.xy);
    diffuseColor.rgb = mix(diffuseColor.rgb, color.rgb, color.a);
  }

#endif
`

function definePropertyUniform(object, property, defaultValue) {
    object.uniforms[property] = new Uniform(object[property] || defaultValue);
    Object.defineProperty(object, property, {
        get: () => object.uniforms[property].value,
        set: (value) => {
            if (object.uniforms[property].value != value) {
                object.uniformsNeedUpdate = true;
                object.uniforms[property].value = value;
            }
            console.log(property, value);
        }
    });
}

class PointsMaterial extends ShaderMaterial {
    constructor(options = {}) {
        options.vertexShader = options.vertexShader || ShaderLib.points.vertexShader;
        options.fragmentShader = options.fragmentShader || ShaderLib.points.fragmentShader;
        options.defines = options.defines || {};
        options.defines.USE_WORLDPOS = '';
        options.defines.USE_MAP4 = '';
        if (pop(options, 'alphaMap')) options.defines.USE_ALPHAMAP = '';
        if (pop(options, 'vertexColors')) options.defines.USE_COLOR = '';
        if (pop(options, 'sizeAttenuation')) options.defines.USE_SIZEATTENUATION = '';
        if (pop(options, 'logarithmicDepthBuffer')) options.defines.USE_LOGDEPTHBUF = '';
        const size = pop(options, 'size', 1);
        const diffuse = pop(options, 'color', new Color(0xeeeeee));
        const uvwTransform = pop(options, 'uvwTransform', new Matrix4());
        const map = pop(options, 'map', null);
        const alphaMap = pop(options, 'alphaMap', null);
        const scale = pop(options, 'scale', 1);
        super(options);
        definePropertyUniform(this, 'size', size);
        definePropertyUniform(this, 'diffuse', diffuse);
        definePropertyUniform(this, 'uvwTransform', uvwTransform);
        definePropertyUniform(this, 'opacity', this.opacity);
        definePropertyUniform(this, 'map', map);
        definePropertyUniform(this, 'alphaMap', alphaMap);
        definePropertyUniform(this, 'scale', scale);
    }
}

export default PointsMaterial;
