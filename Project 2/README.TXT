Name: Jahan Kuruvilla Cherian
Email: jcherian@ucla.edu
UID: 104436427
TA: Garett Ridge
Prof: Diana Ford

Summary:

The idea behind this animation is that you the viewer are in a desert trying to make
his/her way across to some point. In your way stands a little Android that is the gatekeeper
beyond the point you are at. He prevents you from passing but you warn him of the consequences.
The Animation then continues to show him coming right at you and the sequence of you simply
pushing him away and then using 'telekinesis' like abilities pull him back just to 
break him into pieces with a particle explosion.

Hierarchical Objects:

1.) Hand:
	The hand is a heirarchical object made from one of my custom polygons called sphuboids. The
	shape is more like a rounded triangle and is used to create a palm, four fingers and a thumb.
	Each part of the finger is connected to the palm and rotates about the respective axis when
	the "break" of the android happens, by clenching the fist.

2.) Android:
	The android is a pretty thorough heirarchical object with a head, eyes, ears, arms, legs
	and a middle symbol which is a custom pyramid object. The android looks menacing to 
	begin with and then is surprised when the user grabs him. His movements change at this point
	to enact a scared monster. The code for this object uses a factor called 'break_speed' which
	essentially is equal to the animation time if it is time to break the object. Doing so gives
	the effect of the android blowing up into its tiny pieces.

Custom Polygons:

1.) Pyramid:
	This object is essentially 6 triangles built to form a pyramid with a square base. All the
	vertices pushed are done so to create a unit pyramid for uniform scaling. Each triangle has
	its own set of normals that are shared amongst its vertices in order to give it flat shading.
	The pyramid also has accurately mapped texture coordinates for the mapped texture to look good
	on it.

2.) Ground Mesh:
	This object is a tesselated square that is meshed up based on the tesselation factor. This
	is used for the creation of the ground so that it looks more like a sand duned desert. The way
	I created the tesselation was by creating a 2-D array of x and z coordinates that are pushed on
	with random y directions. I also created some simple vector calculation based functions for
	normals and vector subtraction to get the correct normals for flatshading. Thus the floor is
	also flat shaded.
3.) Sphuboid:
	This object is a custom polygon made by interpolated the vertices on a circle to the nearest
	plane. This should have given a rounded cuboid, but I instead focused on the negative planes
	to create a rounded triangle because I believed that this seemed more appropriate to a 
	skeletal structure.

Texture Mapping and Flat Shading:

As mentioned above the pyramid is the main custom polygon that satisfies both of these requirements
by carefully mapping the normals and texture coordinates. Note that the given format of texture
coordinates was initially strange, but I realized that for accurate textures we need vec2's. 
I just changed the vec3 input to emulate the vec2 pattern. This enables for really accurate
texture mapping. Note that for flat shading, the ground mesh satisfies this requirement as well.

Extra Notes:

This project was indeed very fun. The project was completed in a very short amount of time due to 
my initial idea falling through and me having to start from scratch close to the deadline.
Though this project doesn't represent my intial idea, it is something I am proud of. I learnt
a lot about OpenGL through this entire process!
