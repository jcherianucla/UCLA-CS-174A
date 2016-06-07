// *******************************************************
// CS 174a Graphics Example Code
// Animation.cpp - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

#include "../CS174a template/Utilities.h"
#include "../CS174a template/Shape.h"
#include "../CS174a template/GLUT_Port.h"
#include "Shapes.h"
// *******************************************************
// IMPORTANT -- In the line below, add the filenames of any new images you want to include for textures!

		const unsigned num_textures = 3;
		string texture_list[num_textures] = { "stars.tga", "earth.tga", "text.tga" };

#define CURRENT_BASIS_IS_WORTH_SHOWING axis->draw( basis_id++, graphicsState, model_transform, Material( Vector4f(.8f,.3f,.8f,1), .5f, 1, 1, 40, "" ) );

int g_width = 800, g_height = 800 ;

// *******************************************************	
// When main() is called it creates an "Animation" object.  It registers itself as a displayable object to our other class "GLUT_Port" -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.
class Animation : public Displayable
{		
	Vector3d thrust;
	Triangle_Fan_Full* m_fan;
	Rectangular_Strip* m_strip;
	Text_Line* m_text;
	Cylindrical_Strip* m_tube;
	Cube* m_cube;
	Sphere* m_sphere;
	Axis* axis;
	
	KeyMap<Animation> keys;
	GLUT_Port g;
	bool looking, animate, gouraud, color_normals, solid;
	float animation_delta_time;
	int basis_id;
	GraphicsState graphicsState;

public:
	// Making the projection_transform:  The matrix that determines how depth is treated. It projects 3D points onto a plane.
	Animation() : graphicsState( Matrix4d::Identity(), perspective( 45, float(g_width)/g_height, .1f, 1000 ), 0 ),		
		g( Vector2i(800, 20), Vector2i(g_width, g_height), "CS174a Template Code"), looking(0), animate(0), 	
		gouraud(0), color_normals(0), solid(0), thrust( Vector3d::Zero() )
	{			
		g.registerDisplayableObject(*this);
		g.init( "vshader.glsl", "fshader.glsl" );
			
		glClearColor( .0f, .0f, .0f, 1 );								// Background color
		
		for( unsigned i = 0; i < num_textures; i++ )
			textures[ texture_list[i] ] = new Texture( ( string("../my code/") + texture_list[i] ).c_str(), true );

		m_fan = new Triangle_Fan_Full( Matrix4d::Identity() );
		m_strip = new Rectangular_Strip( 1, Matrix4d::Identity() );
		m_text = new Text_Line( 6, Matrix4d::Identity() );
		m_text->set_string( "normal" );
		m_tube = new Cylindrical_Strip( 10, Matrix4d::Identity() );
		m_cube = new Cube( Matrix4d::Identity() );
		m_sphere = new Sphere( Matrix4d::Identity(), 3 );
		axis = new Axis( Matrix4d::Identity() );
	}
	
	void update_camera( float animation_delta_time, const Vector2d &window_steering )
	{
		const unsigned leeway = 70, border = 50;
		float degrees_per_frame = .005f * animation_delta_time;
		float meters_per_frame  = 10.f * animation_delta_time;
																									// Determine camera rotation movement first
		Vector2f movement_plus  ( window_steering[0] + leeway, window_steering[1] + leeway );		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		Vector2f movement_minus ( window_steering[0] - leeway, window_steering[1] - leeway );
		bool outside_border = false;
	
		for( int i = 0; i < 2; i++ )
			if ( abs( window_steering[i] ) > g.get_window_size()[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.

		for( int i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
		{
			float angular_velocity = ( ( movement_minus[i] > 0) * movement_minus[i] + ( movement_plus[i] < 0 ) * movement_plus[i] ) * degrees_per_frame;	// Use movement's quantity conditionally
			graphicsState.camera_transform = rotation( angular_velocity, Vector3d( i, 1-i, 0 ) ) * graphicsState.camera_transform;			// On X step, rotate around Y axis, and vice versa.			
		}
		graphicsState.camera_transform = translation( meters_per_frame * thrust ) * graphicsState.camera_transform;		// Now translation movement of camera, applied in local camera coordinate frame
	}
	
	// *******************************************************	
	// display(): called once per frame, whenever OpenGL decides it's time to redraw.
	virtual void display( float animation_delta_time, Vector2d &window_steering )
	{		
		if( animate ) graphicsState.animation_time += animation_delta_time;

		update_camera( animation_delta_time , window_steering );
		this->animation_delta_time = animation_delta_time;

		basis_id = 0;

		Matrix4d model_transform = Matrix4d::Identity();
		
		// Materials: Declare new ones as needed in every function.
		// 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
		Material purplePlastic( Vector4f( .9f,.5f,.9f,1 ), .2f, .8f, .5f, 40, "" ), 	// Supply an empty string if you want no texture
			     greyPlastic( Vector4f( .5f,.5f,.5f,1 ), .2f, .8f, .5f, 20, "" ),
			     earth( Vector4f( .2f,.2f,.2f,1 ), .5f, 1, .5f, 40, "earth.tga" ),
			     stars( Vector4f( .2f,.2f,.2f,1 ), .5f, 1, 1, 40, "stars.tga" );
				 
		/**********************************
		Start coding here!!!!
		**********************************/
		

		model_transform *= translation( 0, 3, -25 );		// Position the next shape by post-multiplying another matrix onto the current matrix product															
		m_cube->draw ( graphicsState, model_transform, purplePlastic );		// Draw a cube, passing in the current matrices
		CURRENT_BASIS_IS_WORTH_SHOWING										// How to draw a set of axes, conditionally displayed - cycle through by pressing p and m		

		model_transform *= translation( 0, -2, 0 );
		m_fan->draw    ( graphicsState, model_transform, greyPlastic );			// Cone
		CURRENT_BASIS_IS_WORTH_SHOWING
	
		model_transform *= translation( 0, -4, 0 );
		m_tube->draw ( graphicsState, model_transform, greyPlastic );			// Tube
		CURRENT_BASIS_IS_WORTH_SHOWING

		model_transform *= translation( 0, -3, 0 );												// Example Translate
		model_transform *= rotation( graphicsState.animation_time * 50 * PI/180, Vector3d( 0, 1, 0 ) );		// Example Rotate.  1st parameter is scalar for angle, 2nd is axis of rotation.
		model_transform *= scale( 5, 1, 5 );															// Example Scale
		m_sphere->draw( graphicsState, model_transform, earth, 3 );				// Sphere

		model_transform *= translation( 0, -2, 0 );
		m_strip->draw  ( graphicsState, model_transform, stars );				// Rectangle
		CURRENT_BASIS_IS_WORTH_SHOWING

	}


	virtual void update_debug_strings( std::map< std::string, std::string >&	 debug_screen_strings )		// Strings this particular class contributes to the UI
	{ 
		debug_screen_strings["animation time:"] = "Animation time:  " + std::to_string( graphicsState.animation_time ); 
		debug_screen_strings["showing basis "] = "Showing basis " + std::to_string( axis->basis_selection );
		debug_screen_strings["animate:"] = "Animation " + string( animate ? "on" : "off" ); 
		
		stringstream stream; stream << fixed << setprecision(2) << thrust[0] << ' ' << thrust[1] << " " << thrust[2];
		debug_screen_strings["thrust"] = "Thrust: " + stream.str();
	}
	
	void left()  { thrust[0] =  1; }     void up()    { thrust[1] = -1; }	void forward() { thrust[2] =  1; }
	void right() { thrust[0] = -1; }     void down()  { thrust[1] =  1; }	void back()    { thrust[2] = -1; }
	void stopX() { thrust[0] =  0; }     void stopY() { thrust[1] =  0; }   void stopZ()   { thrust[2] =  0; }
	void toggleLooking() { looking = !looking; }
	void next_basis() { axis->basis_selection++; }	void prev_basis() { axis->basis_selection--; }
	void reset() { graphicsState.camera_transform = Matrix4d::Identity(); }
	void roll_left() { graphicsState.camera_transform  *= rotation( 3 * PI /180, Vector3d( 0, 0,  1 ) ); }
	void roll_right() { graphicsState.camera_transform *= rotation( 3 * PI /180, Vector3d( 0, 0, -1 ) ); }
	void toggleAnimate() { animate = !animate; }
	void toggleColorNormals() { color_normals = !color_normals; glUniform1i( g_addrs->COLOR_NORMALS_loc, color_normals); }
	void toggleGouraud()	  { gouraud = !gouraud;				glUniform1i( g_addrs->GOURAUD_loc, gouraud);}
	void toggleSolid()		  { solid = !solid;					glUniform1i( g_addrs->SOLID_loc, solid); 
									glUniform4fv( g_addrs->SOLID_COLOR_loc, 1, Vector4f(Vector4f::Random()).data() );}
	
	// *******************************************************	
	// init_keys():  Define any extra keyboard shortcuts here
	virtual	void init_keys() 
	{
		keys.addHandler		( 'w', 0,					Callback<Animation>( &Animation::forward , this ) );
		keys.addHandler		( 'a', 0,					Callback<Animation>( &Animation::left    , this ) );
		keys.addHandler		( 's', 0,					Callback<Animation>( &Animation::back    , this ) );
		keys.addHandler		( 'd', 0,					Callback<Animation>( &Animation::right   , this ) );
		keys.addHandler		( ' ', 0,					Callback<Animation>( &Animation::up      , this ) );
		keys.addHandler		( 'z', 0,					Callback<Animation>( &Animation::down    , this ) );
		
		keys.addHandler		( 'w', GLUT_Port::RELEASE,  Callback<Animation>( &Animation::stopZ , this ) );
		keys.addHandler		( 'a', GLUT_Port::RELEASE,  Callback<Animation>( &Animation::stopX , this ) );
		keys.addHandler		( 's', GLUT_Port::RELEASE,  Callback<Animation>( &Animation::stopZ , this ) );
		keys.addHandler		( 'd', GLUT_Port::RELEASE,  Callback<Animation>( &Animation::stopX , this ) );
		keys.addHandler		( ' ', GLUT_Port::RELEASE,  Callback<Animation>( &Animation::stopY , this ) );
		keys.addHandler		( 'z', GLUT_Port::RELEASE,  Callback<Animation>( &Animation::stopY , this ) );
		
		keys.addHandler		( '.', 0,                   Callback<Animation>( &Animation::roll_left , this ) );
		keys.addHandler		( ',', 0,                   Callback<Animation>( &Animation::roll_right , this ) );
		keys.addHandler		( 'r', 0,                   Callback<Animation>( &Animation::reset , this ) );
		keys.addHandler		( 'f', 0,                   Callback<Animation>( &Animation::toggleLooking , this ) );
		keys.addHandler		( 'p', 0,                   Callback<Animation>( &Animation::next_basis , this ) );
		keys.addHandler		( 'm', 0,                   Callback<Animation>( &Animation::prev_basis , this ) );
		
		keys.addHandler		( 'n', GLUT_Port::ALT,      Callback<Animation>( &Animation::toggleColorNormals , this ) );
		keys.addHandler		( 'g', GLUT_Port::ALT,      Callback<Animation>( &Animation::toggleGouraud , this ) );
		keys.addHandler		( 's', GLUT_Port::ALT,      Callback<Animation>( &Animation::toggleSolid , this ) );
		keys.addHandler		( 'a', GLUT_Port::ALT,      Callback<Animation>( &Animation::toggleAnimate , this ) );

		update_controls< Animation >( keys );
	}
	// This must go in every class that has its own KeyMap and keyboard shortcuts
	virtual void handle_key( unsigned char key, unsigned char mods )	{	if( keys.hasHandler( key, mods ) )		keys.getHandler( key, mods )	();		}
	
};

int main() 
{
	cout << "Controlling this Graphics Window: \n\tAnimation is paused when this program starts, so first you should press ALT+a to play or pause animation. \n\t" <<
			"Fly around the scene to adjust your vantage point using the keys w a s d to move in the plane that's along the \n" << 
			"ground, and the keys space and z to float up and down.  At any time press r to reset the camera back to its initial \nvantage point. \n\t" <<
			"The f key unfreezes the camera's rotation setting so you can aim it around while flying or sitting still.  Move\nthe mouse around away from the " <<
			"center of the window to steer, and press f again to stop this and to freeze the steering\nagain.  Any roll rotation is controlled " << 
			"separately with the comma and period keys.  \n\t" << "The keys ALT+n, ALT+g, and ALT+s switch shading behaviors.  ALT+n directly shows you normal vectors on shapes\n" <<
			"by interpreting X,Y,Z vectors as R,G,B colors.  ALT+g toggles Gouraud shading vs Smooth Phong shading with textures,\nand ALT+s colors everything a random solid color. \n\t" <<
			"Press 1 and 2 to cycle through a live feed of important strings and values of the program -- each Displayable\nobject has a function where it can provide these. \n\t" <<
			"The keys p and m cycle through a list of the coordinate axes (bases) you have listed down as worth drawing (at\nvarious points within your drawing routine). \n\t" <<
			"Press ESC on the graphics window to exit.  Other ways of stopping the program can be unstable.  Have fun." << endl;
	
	Animation a;
	glutMainLoop();		// Run the OpenGL event loop forever
}