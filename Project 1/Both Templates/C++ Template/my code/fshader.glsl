// *******************************************************
// CS 174a Graphics Example Code
// The following string is loaded by our C++ and then used as the Fragment Shader program, which gets sent to the graphics card at runtime.  The fragment shader runs once
// all vertices in a triangle / element finish their vertex shader programs, and thus have finished finding out where they land on the screen.  The fragment shader fills 
// in (shades) every pixel (fragment) overlapping where the triangle landed.  At each pixel it interpolates different values from the three extreme points of the triangle, and 
// uses them in formulas to determine color.

const int N_LIGHTS = 2;

uniform vec4 lightColor[N_LIGHTS], color;
varying vec3 L[N_LIGHTS], H[N_LIGHTS];
varying float dist[N_LIGHTS];
varying vec4 VERTEX_COLOR;

uniform float ambient, diffusivity, shininess, smoothness, animation_time, attenuation_factor[N_LIGHTS];

varying vec2 fTexCoord;		// per-fragment interpolated values from the vertex shader
varying vec3 N, E, pos;

uniform sampler2D texture; 
uniform bool SOLID, GOURAUD, COLOR_NORMALS, COLOR_VERTICES, USE_TEXTURE;

void main()
{    
	if( SOLID || GOURAUD || COLOR_NORMALS )		// Bypass phong lighting if we're only interpolating predefined colors across vertices
	{
		gl_FragColor = VERTEX_COLOR;
		return;
	}
	
	vec4 tex_color = texture2D( texture, fTexCoord );
	gl_FragColor = tex_color * (USE_TEXTURE ? ambient : 0.0) + vec4(color.xyz * ambient, USE_TEXTURE ? color.w * tex_color.w : color.w );
	for( int i = 0; i < N_LIGHTS; i++ )
	{
		float attenuation = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i])); 
		float diffuse  = max( dot(L[i], N), 0.0 );
		float specular = pow( max(dot(N, H[i]), 0.0), smoothness );
	
		gl_FragColor.xyz += attenuation * (color.xyz * diffusivity * diffuse  + lightColor[i].xyz * shininess * specular );
	}
	gl_FragColor.a = gl_FragColor.w;
}