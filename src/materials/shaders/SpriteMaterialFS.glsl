uniform bool diffuseColorGrey;
uniform sampler2D map;
uniform sampler2D depthMap;
varying mat3 vH;
varying vec4 vColor;

void main() {
  vec4 finalColor = vColor;

  if (diffuseColorGrey) {
    finalColor.rgb = vec3(dot(vColor.rgb, vec3(0.333333)));
  }

  // p_texture = H * p_screen
  vec3 texCoord = vH * gl_FragCoord.xyw;
  texCoord /= texCoord.z;
  texCoord = ( texCoord + 1.0 ) / 2.0;

  // TODO: add the shadowMapping
  // vec4 uvw = textureCameraPreTransform * vec4( vPositionWorld.xyz/vPositionWorld.w - textureCameraPosition, 1.0);
  //
  // // For the shadowMapping, which is not distorted
  // vec4 uvwNotDistorted = textureCameraPostTransform * uvw;
  // uvwNotDistorted.xyz /= uvwNotDistorted.w;
  // uvwNotDistorted.xyz = ( uvwNotDistorted.xyz + 1.0 ) / 2.0;
  //
  // // If using ShadowMapMaterial:
  // // float minDist = unpackRGBAToDepth(texture2D(depthMap, uvwNotDistorted.xy));
  //
	// float minDist = texture2D(depthMap, uvwNotDistorted.xy).r;
	// float distanceCamera = uvwNotDistorted.z;
  //
  // vec3 testBorderNotDistorted = min(uvwNotDistorted.xyz, 1. - uvwNotDistorted.xyz);
  //
	// // ShadowMapping
  // if ( all(greaterThan(testBorderNotDistorted,vec3(0.))) && distanceCamera <= minDist + EPSILON ) {
  //
	// // Don't texture if uvw.w < 0
  //   if (uvw.w > 0. && distort_radial(uvw, uvDistortion)) {
  //
  //     uvw = textureCameraPostTransform * uvw;
  //     uvw.xyz /= uvw.w;
  //
  //     // Normalization
  //     uvw.xyz = (uvw.xyz + 1.0) / 2.0;
  //
  //     // If coordinates are valid, they will be between 0 and 1 after normalization
  //     // Test if coordinates are valid, so we can texture
  //     vec3 testBorder = min(uvw.xyz, 1. - uvw.xyz);
  //
  //     if (all(greaterThan(testBorder,vec3(0.))))
  //     {
  //       vec4 color = texture2D(map, uvw.xy);
  //       finalColor.rgb = mix(finalColor.rgb, color.rgb, color.a);
  //     } else {
  //       finalColor.rgb = vec3(0.2);
  //     }
  //   }
  // } else {
	//    finalColor.rgb = vec3(0.2); // shadow color
  // }

  finalColor = texture2D(map, texCoord.xy);

  // vec3 testBorder = min(texCoord.xyz, 1. - texCoord.xyz);
  // if (all(greaterThan(testBorder,vec3(0.)))) {
  //   finalColor = vec4(0.,1.,0.,1.);
  // } else {
  //   finalColor = vec4(1.,0.,0.,1.);
  // }
  //
  // finalColor = vec4(texCoord.x - 1.,texCoord.y - 1.,texCoord.z - 1.,1.);


  gl_FragColor =  finalColor;
}
