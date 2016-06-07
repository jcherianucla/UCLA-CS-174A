// *******************************************************
// CS 174a Graphics Example Code
// The following string is loaded by our C++ and then used as the Vertex Shader program.  Our C++ sends this code to the graphics card at runtime, where 
// on each run it gets compiled and linked there.  Thereafter, all of your calls to draw shapes will launch the vertex shader program once per vertex in the
// shape (three times per triangle), sending results on to the next phase.  The purpose of this program is to calculate the final resting place of vertices in 
// screen coordinates; each of them starts out in local object coordinates.

const int N_LIGHTS = 2;

attribute vec3 vPosition, vNormal;
attribute vec2 vTexCoord;
varying vec2 fTexCoord;
varying vec3 N, E, pos;

uniform float ambient, diffusivity, shininess, smoothness, attenuation_factor[N_LIGHTS];
uniform bool SOLID, GOURAUD, COLOR_NORMALS, COLOR_VERTICES;		// Flags for alternate shading methods

uniform vec4 lightPosition[N_LIGHTS], lightColor[N_LIGHTS], color, SOLID_COLOR;
varying vec4 VERTEX_COLOR;
varying vec3 L[N_LIGHTS], H[N_LIGHTS];
varying float dist[N_LIGHTS];

uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
uniform mat3 camera_model_transform_normal;

void main()
{
    N = normalize( camera_model_transform_normal * vNormal );
	
	vec4 object_space_pos = vec4(vPosition, 1.0);
    gl_Position = projection_camera_model_transform * object_space_pos;

	if( SOLID || COLOR_NORMALS || COLOR_VERTICES )		// Bypass phong lighting if we're lighting up vertices some other way
	{
		VERTEX_COLOR   = SOLID ? SOLID_COLOR : abs( vec4( N, 1.0 ) );
		VERTEX_COLOR.a = VERTEX_COLOR.w;
		return;
	}

    pos = ( camera_model_transform * object_space_pos ).xyz;
	E = normalize(-pos); 
	
	for( int i = 0; i < N_LIGHTS; i++ )
	{
		L[i] = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * pos );		// Use w = 0 for a directional light -- a vector instead of a point.   
		H[i] = normalize( L[i] + E );
		
		dist[i]  = distance((camera_transform * lightPosition[i]).xyz, pos);
	}

	if( GOURAUD )
	{
		VERTEX_COLOR = vec4( color.xyz * ambient, color.w);
		for(int i = 0; i < N_LIGHTS; i++)
		{
			float attenuation = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i])); 
			float diffuse  = max( dot(L[i], N), 0.0 );
			float specular = pow( max(dot(N, H[i]), 0.0), smoothness );

			VERTEX_COLOR.xyz += attenuation * ( color.xyz * diffusivity * diffuse + lightColor[i].xyz * shininess * specular );
		}
		VERTEX_COLOR.a = VERTEX_COLOR.w;
	}  
	fTexCoord = vTexCoord;  
}