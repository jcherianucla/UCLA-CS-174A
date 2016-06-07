// *******************************************************
// CS 174a Graphics Example Code
// Utilities.h - Includes the Eigen matrix / vector library for C++ which we will use for all matrices - lots of documentation online for how it works.   Also includes a number of 
// standard library files plus some helper functions.


// *******************************************************
// IMPORTANT -- Any new shader variables you define need to have a declaration added to class Graphics_Addresses at the bottom of this file.

#pragma once

#ifdef __APPLE__
#define glGenVertexArrays glGenVertexArraysAPPLE
#define glBindVertexArray glBindVertexArrayAPPLE
#endif

#define GLEW_STATIC
#define GL_GLEXT_PROTOTYPES
#define _CRT_SECURE_NO_DEPRECATE
#ifdef _WIN32
#include "..\GL\glew.h"

#ifdef _WIN64
#pragma comment(lib, "../GL/x64/freeglut.lib")
#pragma comment(lib, "../GL/x64/glew32s.lib")
#pragma comment(lib, "../GL/x64/glew32mxs.lib")
#else
#pragma comment(lib, "../GL/Win32/freeglut.lib")
#pragma comment(lib, "../GL/Win32/glew32s.lib")
#pragma comment(lib, "../GL/Win32/glew32mxs.lib")
#endif

#include <Windows.h>

#pragma comment(lib, "winmm.lib")
class Timer
{
	LONGLONG cur_time, perf_cnt, last_time;

	DWORD time_count;
	bool perf_flag;
	float time_scale;
public:
	Timer() : last_time()
	{
		if(QueryPerformanceFrequency((LARGE_INTEGER*) &perf_cnt))
		{
			perf_flag=true;
			time_count=DWORD(perf_cnt); //perf_cnt counts per second
			QueryPerformanceCounter((LARGE_INTEGER*) &last_time);
			time_scale=1.0f/perf_cnt;
		}
		else
		{
			perf_flag=false;
			last_time=timeGetTime();
			time_scale=.001f;
			time_count=33;
		}
	}

	float Timer::GetElapsedTime()	//In seconds. Courtesy Alan Gasperini
	{
		if(perf_flag)
			QueryPerformanceCounter((LARGE_INTEGER*) &cur_time);
		else
			cur_time=timeGetTime();
				
		return (cur_time-last_time)*time_scale;
	}

	inline void Reset()	{	last_time = cur_time;	}
} TM;

#else
#include <sys/time.h>
class Timer
{
	timeval cur_time;
public:
	Timer() { Reset(); }
	inline void Reset() { gettimeofday(&cur_time, 0); }
	float GetElapsedTime()
	{
		float dif;
		timeval newtime;
		gettimeofday(&newtime, 0);
		return (newtime.tv_sec-cur_time.tv_sec) + (newtime.tv_usec-cur_time.tv_usec)/1000000.0;
	}
} TM;
#endif

#include "../GL/freeglut.h"

#include <iostream>
#include <iomanip>
#include <fstream>
#include <cassert>
#include <stack>
#include <vector>
#include <map>
#include <set>
#include <unordered_map>
#include <array>
using namespace std;

struct TgaImage				// Textures
{   int width, height;
    unsigned char byteCount, *data;
	TgaImage(const char *filename) : data(0), width(), height(), byteCount()
	{
		if( !filename ) return;
		unsigned char type[4], info[6];				//image type either 2 (color) or 3 (greyscale)
		FILE *file = fopen(filename, "rb");			assert(file);													
		fread (&type, sizeof (char), 3, file);		assert (type[1] == 0 && (type[2] == 2 || type[2] == 3));		fseek (file, 12, SEEK_SET);
		fread (&info, sizeof (char), 6, file);		

		width  = info[0] + info[1] * 256;
		height = info[2] + info[3] * 256;
		byteCount = info[4] / 8;						assert (byteCount == 3 || byteCount == 4);
		long imageSize = width * height * byteCount;
		
		data = new unsigned char[imageSize];
		fread(data, sizeof(unsigned char), imageSize, file);		fclose(file);
	}
    ~TgaImage()		{	delete[] data;		data = 0;	 }
};


static char* readShaderFile(const char* shaderFile)
{
	std::ifstream file(shaderFile, std::ios::in|std::ios::binary|std::ios::ate);
	assert(file.is_open());
	std::streampos size = file.tellg();
    char* memblock = new char [(long)size + 1];
    file.seekg ( 0, std::ios::beg );
    file.read ( memblock, size );
    file.close();
	memblock[ (int)size ] = '\0';
    return memblock;
}						// Helper function to load vertex and fragment shader files; Create a NULL-terminated string by reading the provided file.

GLuint LoadShaders(const char* vShaderFile, const char* fShaderFile)			// Create a GLSL program object from vertex and fragment shader files.
{
    struct Shader {	const char*	filename;	GLenum	type;	GLchar*		source;    }  
		shaders[2] = {	{		vShaderFile,		GL_VERTEX_SHADER,	NULL },	
						{		fShaderFile,		GL_FRAGMENT_SHADER, NULL }    };

    GLuint program = glCreateProgram();
	GLint  compiled, linked, logSize;
    
    for ( int i = 0; i < 2; i++ ) 
	{
		Shader& s = shaders[i];

		s.source = readShaderFile( s.filename );

		assert ( shaders[i].source && "FAILED TO LOCATE A SHADER'S FILE" );

		GLuint shader = glCreateShader( s.type );
		glShaderSource( shader, 1, (const GLchar**) &s.source, NULL );
		glCompileShader( shader );

		glGetShaderiv( shader, GL_COMPILE_STATUS, &compiled );
		if ( !compiled && std::cerr << s.filename << " failed to compile:" << '\n' ) 
		{
			glGetShaderiv( shader, GL_INFO_LOG_LENGTH, &logSize );
			char* logMsg = new char[logSize];
			glGetShaderInfoLog( shader, logSize, NULL, logMsg );
			std::cerr << logMsg << '\n';		
			assert( false && "A SHADER FAILED TO COMPILE; SEE ABOVE DETAILS" );
		}
		delete [] s.source;

		glAttachShader( program, shader );
    }

    glLinkProgram(program);		// Link  and error check.

    glGetProgramiv( program, GL_LINK_STATUS, &linked );
    if ( !linked && std::cerr << "Shader program failed to link" << '\n' )  
	{
		glGetProgramiv( program, GL_INFO_LOG_LENGTH, &logSize);
		char* logMsg = new char[logSize];
		glGetProgramInfoLog( program, logSize, NULL, logMsg );
		std::cerr << logMsg << '\n';			
		assert( false && "SHADER PROGRAMS FAILED TO LINK; SEE ABOVE FOR DETAILS");
    }

    glUseProgram(program);
    return program;
}

#include <cmath>
#include "../Eigen/Core"
#include "../Eigen/Geometry"
#include "../Eigen/StdVector"
EIGEN_DEFINE_STL_VECTOR_SPECIALIZATION(Eigen::Vector2d)
EIGEN_DEFINE_STL_VECTOR_SPECIALIZATION(Eigen::Vector3d)
EIGEN_DEFINE_STL_VECTOR_SPECIALIZATION(Eigen::Vector4d)
EIGEN_DEFINE_STL_VECTOR_SPECIALIZATION(Eigen::Vector4f)
EIGEN_DEFINE_STL_VECTOR_SPECIALIZATION(Eigen::Matrix4d)
using namespace Eigen;



struct Texture  
	{ 
		GLuint id;
		TgaImage img;
		Texture( std::string filename, bool mipmap )
			: img(filename.c_str())
		{
			glGenTextures( 1, &id );
			glBindTexture( GL_TEXTURE_2D, id );
			glPixelStorei(GL_UNPACK_ALIGNMENT, img.byteCount );
			glTexImage2D( GL_TEXTURE_2D, 0, GL_RGBA, img.width, img.height, 0, ( img.byteCount == 3 ) ? GL_BGR : GL_BGRA, GL_UNSIGNED_BYTE, img.data );
			glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
			if( mipmap )
				{	glTexParameterf( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);	glGenerateMipmap(GL_TEXTURE_2D);	}
			else
					glTexParameterf( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
		}
	};
std::map< std::string, Texture* > textures;

const double PI = 4 * atan(1);
const GLfloat  DegreesToRadians = float(PI / 180);

inline Matrix4d perspective( const GLfloat fovy, const GLfloat aspect,  const GLfloat zNear, const GLfloat zFar )
{	Matrix4d c;
    GLfloat top   = tan(fovy*DegreesToRadians/2) * zNear, right = top * aspect;
	c << zNear	/	right, 0, 0, 0,
		 0, zNear	/	top,  0, 0,
		 0, 0, -(zFar + zNear)	/	(zFar - zNear), -1,
		 0, 0, -2*zFar*zNear		/	(zFar - zNear), 0;
    return c.transpose();
}


inline Matrix4d lookAt( const Vector3d& eye, const Vector3d& at, const Vector3d& up )
{
    Vector3d n = (eye - at).normalized();
	Vector3d u = up.cross(n).normalized();
    Vector3d v = n.cross(u).normalized();
	Matrix4d result = Matrix4d::Identity();
	result.block<3,1>(0,0) = u;
	result.block<3,1>(0,1) = v;
	result.block<3,1>(0,2) = n;
	return result * Affine3d( Translation3d( -eye )).matrix();
}

inline Matrix4d translation( double x, double y, double z )	{	return Affine3d( Translation3d( x, y, z )).matrix();	 }
inline Matrix4d translation( const Vector3d& v )	{	return Affine3d( Translation3d( v )).matrix();	 }
inline Matrix4d rotation( double angle, const Vector3d& axis )	{	return Affine3d( AngleAxisd( angle, axis ) ).matrix();	 }
inline Matrix4d scale( double x, double y, double z )	{	return Vector4d( x, y, z, 1 ).asDiagonal();	 }
inline Matrix4d scale( const Vector3d& v )	{	return ( Vector4d() << v, 1 ).finished().asDiagonal();	 }

struct GraphicsState 
	{ 
		Matrix4d camera_transform, projection_transform; 		float animation_time;
		GraphicsState(const Matrix4d& camera_transform, const Matrix4d& projection_transform, float animation_time ) 
			: camera_transform(camera_transform), projection_transform(projection_transform), animation_time(animation_time) { }
	};

struct Material
	{
		Vector4f color;
		float ambient, diffusivity, shininess, smoothness;
		string texture_filename; 
		Material( const Vector4f& color, float ambient, float diffusivity, float shininess, float smoothness, string texture_filename )
			: color(color), ambient(ambient), diffusivity(diffusivity), shininess(shininess), smoothness(smoothness), texture_filename(texture_filename) { }
	};


struct Shader_Attribute
{
	GLuint index; GLint size; GLenum type; GLboolean enabled, normalized; GLsizei stride; const void *pointer;
	Shader_Attribute( GLuint index, GLint size, GLenum type, GLboolean enabled, GLboolean normalized, GLsizei stride, const void *pointer )
		: index(index), size(size), type(type), enabled(enabled), normalized(normalized), stride(stride), pointer(pointer) { }
};
	
struct Graphics_Addresses
	{
		vector<struct Shader_Attribute> shader_attributes;
		GLint camera_transform_loc, camera_model_transform_loc, projection_camera_model_transform_loc, camera_model_transform_normal_loc,
			color_loc, lightColor_loc,	ambient_loc, diffusivity_loc, shininess_loc, smoothness_loc, animation_time_loc, lightPosition_loc, attenuation_factor_loc,
			COLOR_NORMALS_loc, GOURAUD_loc, SOLID_loc, SOLID_COLOR_loc, COLOR_VERTICES_loc, USE_TEXTURE_loc;

		Graphics_Addresses( GLuint program );
	};
Graphics_Addresses* g_addrs;
