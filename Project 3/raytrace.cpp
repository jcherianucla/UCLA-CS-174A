//
// raytrace.cpp
//

#define _CRT_SECURE_NO_WARNINGS
#include "matm.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <cmath>
#include <cfloat>
#include <vector>
using namespace std;

#define RAY_ORIGINAL 0
#define RAY_SHADOW 1
#define RAY_REFLECTION 2
#define MIN_SHADOW_TIME 0.0001f
#define REFLECTION_DEPTH 3

int g_width;
int g_height;

struct Ray
{
    vec4 origin;
    vec4 dir;
};

//Sphere Object
struct Sphere
{
	//Sphere Constructor
	Sphere(vec3 pos, vec3 scale, vec3 color, float ka, float kd, float ks, float kr, float n)
		:M(Translate(pos) * Scale(scale)), m_pos(pos), m_color(color), k_a(ka), k_d(kd), k_s(ks), k_r(kr), n(n)
	{
		//Pre-Cache the Inverse matrix to avoid expensive operations
		if(!InvertMatrix(M, M_inv)) { cout << "Matrix Inversion failed." << endl; }
	}
	vec3 m_color, m_pos;
	float k_a, k_d, k_r, k_s, n;
	mat4 M, M_inv;
};

//Light Object
struct Light
{
	//Light Constructor
	Light(vec3 pos, vec3 intensity)
		: m_pos(pos), m_intensity(intensity)
	{}
	vec3 m_pos, m_intensity;
};

//Intersection Object
struct Intersection
{
	//Default Intersection Constructor
	Intersection()
		:m_did_intersect(false), m_pos(vec3(0,0,0)), m_norm(vec4(0,0,0,0)), m_sphere(nullptr), m_time(FLT_MAX)
	{}
	bool m_did_intersect;
	Sphere* m_sphere;
	vec3 m_pos;
	vec4 m_norm;
	float m_time;
};

vector<vec4> g_colors;
vector<Sphere> spheres;
vector<Light> lights;

float g_left;
float g_right;
float g_top;
float g_bottom;
float g_near;

vec4 background_color;
vec3 ambient_color;
string out_filename;

// -------------------------------------------------------------------
// Input file parsing

vec4 toVec4(const string& s1, const string& s2, const string& s3)
{
    stringstream ss(s1 + " " + s2 + " " + s3);
    vec4 result;
    ss >> result.x >> result.y >> result.z;
    result.w = 1.0f;
    return result;
}

//Converts a string to a float
float toFloat(const string& s)
{
    stringstream ss(s);
    float f;
    ss >> f;
    return f;
}

//Grab the relevant fields from the input file and set them to respective values
void parseLine(const vector<string>& vs)
{
    if (vs[0] == "RES")
    {
        g_width = (int)toFloat(vs[1]);
        g_height = (int)toFloat(vs[2]);
        g_colors.resize(g_width * g_height);
    }
    if(vs[0] == "OUTPUT") { out_filename = vs[1]; }
    if(vs[0] == "NEAR") { g_near = toFloat(vs[1]); }
    if(vs[0] == "LEFT") { g_left = toFloat(vs[1]); }
    if(vs[0] == "RIGHT") { g_right = toFloat(vs[1]); }
    if(vs[0] == "BOTTOM") { g_bottom = toFloat(vs[1]); }
    if(vs[0] == "TOP") { g_top = toFloat(vs[1]); }
    if(vs[0] == "AMBIENT") { ambient_color = vec3( toFloat(vs[1]), toFloat(vs[2]), toFloat(vs[3])); }
    if(vs[0] == "BACK") { background_color = vec4( toFloat(vs[1]), toFloat(vs[2]), toFloat(vs[3]), 1); }
    if(vs[0] == "SPHERE")
	{
		spheres.push_back(Sphere( vec3(toFloat(vs[2]), toFloat(vs[3]), toFloat(vs[4])),
								  vec3(toFloat(vs[5]), toFloat(vs[6]), toFloat(vs[7])),
								  vec3(toFloat(vs[8]), toFloat(vs[9]), toFloat(vs[10])),
								  toFloat(vs[11]), toFloat(vs[12]), toFloat(vs[13]), toFloat(vs[14]), toFloat(vs[15])));
	}
	if(vs[0] == "LIGHT")
	{
		lights.push_back(Light(	vec3(toFloat(vs[2]), toFloat(vs[3]), toFloat(vs[4])),
								vec3(toFloat(vs[5]), toFloat(vs[6]), toFloat(vs[7]))));
	}
}

void loadFile(const char* filename)
{
    ifstream is(filename);
    if (is.fail())
    {
        cout << "Could not open file " << filename << endl;
        exit(1);
    }
    string s;
    vector<string> vs;
    while(!is.eof())
    {
        vs.clear();
        getline(is, s);
        istringstream iss(s);
        while (!iss.eof())
        {
            string sub;
            iss >> sub;
            vs.push_back(sub);
        }
        parseLine(vs);
    }
}


// -------------------------------------------------------------------
// Utilities

void setColor(int ix, int iy, const vec4& color)
{
    int iy2 = g_height - iy - 1; // Invert iy coordinate.
    g_colors[iy2 * g_width + ix] = color;
}

//Convert to Vec3 from Vec4
vec3 toVec3(vec4 input)
{
	return vec3(input[0], input[1], input[2]);
}

//Check for whether a ray intersects with a sphere, and return the closest intersection
Intersection intersect(const Ray& ray, int type)
{
	Intersection closest_intersect = Intersection();
	//Go through all spheres
	for(int i = 0; i < spheres.size(); i++)
	{
		Intersection intersect = Intersection();
		//Step 1 - Put ray into unit sphere coordinate space
		Ray inv_ray = { spheres[i].M_inv * ray.origin, spheres[i].M_inv * ray.dir };

		//Step 2 - Apply the quadratic formula
		float c_sq = dot(toVec3(inv_ray.dir), toVec3(inv_ray.dir));
		float s_dot_c = dot(toVec3(inv_ray.origin), toVec3(inv_ray.dir));
		float s_sq_min_one = dot(toVec3(inv_ray.origin), toVec3(inv_ray.origin)) - 1;
		float descriminant = (s_dot_c * s_dot_c) - (c_sq * (s_sq_min_one));

		//If we hit a sphere
		if(descriminant >= 0.0f) 
		{ 
			float t1 = -(s_dot_c/c_sq) + sqrt(descriminant)/c_sq;
			float t2 = -(s_dot_c/c_sq) - sqrt(descriminant)/c_sq;
			float t;
			switch(type)
			{
				//Case for original ray, takes into account the near plane at a distance of 1
				case RAY_ORIGINAL:
					t = t1;
					if(t <= 1.0f || (t1 > t2 && t2 > 1.0f)) { t = t2;}
					if(t <= 1.0f) { continue; }
					break;
				//Set the minimum boundary point to 0.0001f to prevent rounding errors
				case RAY_SHADOW:
					t = t2;
					if(t <= MIN_SHADOW_TIME && t < 1.0f) { t = t1; }
					if(t <= MIN_SHADOW_TIME && t < 1.0f) { continue; }
					break;
				//Set the minimum boundary point to really low to account for fine reflections!
				case RAY_REFLECTION:
					t = t1;
					if(t <= MIN_SHADOW_TIME || (t1 > t2 && t2 > MIN_SHADOW_TIME)) { t = t2;}
					if(t <= MIN_SHADOW_TIME) { continue; }
					break;
				default:
					break;	
			}
			intersect.m_pos = toVec3(ray.origin + t * ray.dir);
			intersect.m_time = t;
			//Find the closest intersection
			if(closest_intersect.m_did_intersect == false || intersect.m_time < closest_intersect.m_time)
			{
				closest_intersect.m_did_intersect = true;
				//Intersection point
				closest_intersect.m_pos = intersect.m_pos;
				closest_intersect.m_time = intersect.m_time;
				closest_intersect.m_sphere = &spheres[i];
				//Calculate the normal at the intersection point
				closest_intersect.m_norm = transpose(spheres[i].M_inv) * (inv_ray.origin + t * inv_ray.dir);
			}
		}
	}
	return closest_intersect;
}

//Recursively trace through each pixel to create the scene
vec4 trace(const Ray& ray, int refl_level = 0)
{
	//The number of reflections are limited by the Reflection depth
	if(refl_level >= REFLECTION_DEPTH)
		return vec4();

	Intersection hit;
	//Start ray is original, everything else is a relfection
	if(refl_level == 0)
	{
		hit = intersect(ray, RAY_ORIGINAL);
	} else
	{
		hit = intersect(ray, RAY_REFLECTION);
	}
	//Do the tracing only if we have an intersection
	if(hit.m_did_intersect)
	{
		//Get the closest sphere
		Sphere closest = *hit.m_sphere;
		//Start computing the pixel color
		vec4 pix_color = vec4((closest.k_a * closest.m_color * ambient_color), 1);
		vec3 n = normalize(toVec3(hit.m_norm));
		vec3 v = normalize(toVec3(ray.origin) - hit.m_pos);
		//Compute the shadow ray for every light sources
		for(int j = 0; j < lights.size(); j++)
		{
			vec4 light_origin = vec4(hit.m_pos, 1.0f); 
			vec4 light_dir = vec4((lights[j].m_pos - hit.m_pos), 0);
			Ray light_ray = { light_origin, light_dir };
			Intersection light_hit = intersect(light_ray, RAY_SHADOW);

			//Shadow Rays
			if(!light_hit.m_did_intersect)
			{
				vec3 l = normalize(toVec3(light_dir));
				float n_dot_l = dot(n, l);
				vec3 r = normalize(2 * n * n_dot_l - l);
				float r_dot_v = dot(r, v);
				//Diffuse
				if(n_dot_l > 0.0f)
				{
					pix_color += closest.k_d * lights[j].m_intensity * n_dot_l * closest.m_color;
				}
				//Specular
				if(r_dot_v > 0.0f)
				{
					pix_color += closest.k_s * lights[j].m_intensity * pow(r_dot_v, closest.n);
				}
			}
		}
		//Reflection Rays
		Ray refl = { vec4(hit.m_pos, 1), normalize(vec4((2 * n * dot(n, v) - v), 0)) };
		pix_color += closest.k_r * trace(refl, refl_level + 1);

		return pix_color;
	}
	//Return the background colour only if its the first ray
	if(refl_level == 0)
		return background_color;
	else
		return vec4();
}

//Get the direction of the ray for that pixel based on the interpolation
vec4 getDir(int ix, int iy)
{
	float alpha = 1.*ix/g_width, beta = 1.*iy/g_height;
	float x = g_left + (alpha * (g_right - g_left));
	float y = g_bottom + (beta * (g_top - g_bottom));
	float z = -g_near;
	return normalize(vec4(x, y, z, 0.0f));
}

void renderPixel(int ix, int iy)
{
	Ray ray;
	ray.origin = vec4(0.0f, 0.0f, 0.0f, 1.0f);
	ray.dir = getDir(ix, iy);
	vec4 color = trace(ray);
	setColor(ix, iy, color);
}

void render()
{
	for (int iy = 0; iy < g_height; iy++)
		for (int ix = 0; ix < g_width; ix++)
			renderPixel(ix, iy);
}


// -------------------------------------------------------------------
// PPM saving

void savePPM(int Width, int Height, char* fname, unsigned char* pixels) 
{
	FILE *fp;
	const int maxVal=255;

	printf("Saving image %s: %d x %d\n", fname, Width, Height);
	fp = fopen(fname,"wb");
	if (!fp) {
		printf("Unable to open file '%s'\n", fname);
		return;
	}
	fprintf(fp, "P6\n");
	fprintf(fp, "%d %d\n", Width, Height);
	fprintf(fp, "%d\n", maxVal);

	for(int j = 0; j < Height; j++) {
		fwrite(&pixels[j*Width*3], 3, Width, fp);
	}

	fclose(fp);
}

void saveFile()
{
	// Convert color components from floats to unsigned chars.
	unsigned char* buf = new unsigned char[g_width * g_height * 3];
	for (int y = 0; y < g_height; y++)
		for (int x = 0; x < g_width; x++)
			for (int i = 0; i < 3; i++)
			{
				//Clamp the color values to between 0 and 1
				if( ((float*)g_colors[y*g_width+x])[i] < 0 ) { ((float*)g_colors[y*g_width+x])[i] *= -1; }
				if( ((float*)g_colors[y*g_width+x])[i] > 1 ) { ((float*)g_colors[y*g_width+x])[i] = 1; } 
				buf[y*g_width*3+x*3+i] = (unsigned char)(((float*)g_colors[y*g_width+x])[i] * 255.9f);
			}

	//Get the output file name from the input file
	char* temp_filename = new char[out_filename.size() + 1];
	strcpy(temp_filename, out_filename.c_str());
	savePPM(g_width, g_height, temp_filename, buf);
	delete[] buf;
	delete [] temp_filename;
}


// -------------------------------------------------------------------
// Main

int main(int argc, char* argv[])
{
	if (argc < 2)
	{
		cout << "Usage: ./raytrace <input_file.txt>" << endl;
		exit(1);
	}
	loadFile(argv[1]);    
	render();
	saveFile();
	return 0;
}

