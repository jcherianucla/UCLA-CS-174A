// *******************************************************
// CS 174a Graphics Example Code
// GLUT_Port - This class performs all the setup of doing graphics.   It informs OpenGL of which functions to call during events - such as a key getting pressed or it being time to redraw.  
// It also displays any strings requested, and the key controls. 

// *******************************************************
// IMPORTANT -- Any new shader variables you define need to have a line added to class Graphics_Addresses in this file, so their addresses can be retrieved.
#pragma once

#include "../CS174a template/Utilities.h"
#include "../my code/Shapes.h"
#include "KeyMap.h"

struct Displayable
{
	virtual void display( float animation_delta_time, Vector2d &window_steering ) = 0;

	virtual	void init_keys() { }
		
	virtual void handle_key( unsigned char key, unsigned char mods ) = 0;

	virtual void update_debug_strings( map< string, string >&	 debug_screen_strings ) { }
};

set<string> all_controls;
template <class T>	void update_controls( const KeyMap<T>& keymap ) ;

// *******************************************************
// Debug_Screen - Displays the text of the user interface
struct Debug_Screen : public Displayable
{
	KeyMap<Debug_Screen> keys;
	int start_index;
	map< string, string > debug_screen_strings;
	Text_Line* m_text;
	GraphicsState graphicsState;	
	bool visible;
	Debug_Screen() : start_index( 0 ), m_text(0), visible(1), graphicsState( Matrix4d::Identity(), Matrix4d::Identity(), 0 ) { }

	void next() { start_index++; if( start_index >= (int)debug_screen_strings.size() ) start_index = 0; }
	void prev() { start_index--; if( start_index < 0 ) start_index = (int)debug_screen_strings.size() - 1; }
	void toggle() { visible = !visible; }
	void display( float animation_delta_time, Vector2d &window_steering )
	{
		if( !m_text ) m_text = new Text_Line ( 22,  Matrix4d::Identity()  );		// Define a max string size
		if( !visible ) return;
		Matrix4d model_transform  = rotation( -PI/2, Vector3d( 0, 1, 0 ) );
		model_transform *= translation( .1, -.7, .9 );
		model_transform *= scale( 1, .075, .05 );
		auto it = debug_screen_strings.begin(); 
		for( int i = 0; i < start_index && i < (int)debug_screen_strings.size(); i++, it++ ) ;
		for( int i = 0; i < 3; i++, it++ )
		{
			if( it == debug_screen_strings.end() ) 	it = debug_screen_strings.begin();
			m_text->set_string( it->second );
			m_text->draw_heads_up_display( graphicsState, model_transform, Vector4f(0,0,0,1) );					// Comment this out to not display any strings on the UI
			model_transform *= translation( 0, -1, 0 );
		}
		model_transform *= translation( 0, 25, -32 );
		m_text->set_string( "Controls:" );
		m_text->draw_heads_up_display( graphicsState, model_transform, Vector4f(0,0,0,1) );
		for( auto s : all_controls )
		{
			model_transform *= translation( 0, -1, 0 );
			m_text->set_string( s );
			m_text->draw_heads_up_display( graphicsState, model_transform, Vector4f(0,0,0,1) );					// Comment this out to not list out any controls on the UI		
		}
	}

	void init_keys()
	{
		keys.addHandler		( '1', 0,					Callback<Debug_Screen>( &Debug_Screen::prev , this ) );
		keys.addHandler		( '2', 0,					Callback<Debug_Screen>( &Debug_Screen::next , this ) );
		keys.addHandler		( 'v', 0,					Callback<Debug_Screen>( &Debug_Screen::toggle , this ) );
		update_controls< Debug_Screen >( keys );
	}
		
	void handle_key( unsigned char key, unsigned char mods )	{	if( keys.hasHandler( key, mods ) )		keys.getHandler( key, mods )	();		}

	void update_debug_strings( map< string, string >&	 debug_screen_strings )			// Strings this particular class contributes to the UI
	{
		static unsigned tick = 0;		
		debug_screen_strings["Frame"] = "Frame:  " + std::to_string( tick++ ); 
	}
};

// *******************************************************
// Find out the memory addresses internal to the graphics card of each of its variables, and store them here locally for the C++ program to use
Graphics_Addresses::Graphics_Addresses( GLuint program )
{
	shader_attributes.push_back( Shader_Attribute( glGetAttribLocation( program, "vPosition"), 3, GL_FLOAT, GL_TRUE, GL_FALSE, 0, (GLvoid*)0 ) );
	shader_attributes.push_back( Shader_Attribute( glGetAttribLocation( program, "vNormal"  ), 3, GL_FLOAT, GL_TRUE, GL_FALSE, 0, (GLvoid*)0 ) );
	shader_attributes.push_back( Shader_Attribute( glGetAttribLocation( program, "vTexCoord"), 2, GL_FLOAT, GL_FALSE, GL_FALSE, 0, (GLvoid*)0 ) );
	shader_attributes.push_back( Shader_Attribute( glGetAttribLocation( program, "vColor"   ), 3, GL_FLOAT, GL_FALSE, GL_FALSE, 0, (GLvoid*)0 ) );

	camera_transform_loc 					= glGetUniformLocation( program, "camera_transform" );
	camera_model_transform_loc 				= glGetUniformLocation( program, "camera_model_transform" );
	projection_camera_model_transform_loc 	= glGetUniformLocation( program, "projection_camera_model_transform" );
	camera_model_transform_normal_loc 		= glGetUniformLocation( program, "camera_model_transform_normal" );

	color_loc              = glGetUniformLocation(program, "color" );
	lightColor_loc         = glGetUniformLocation(program, "lightColor" );
	ambient_loc            = glGetUniformLocation(program, "ambient" );
	diffusivity_loc        = glGetUniformLocation(program, "diffusivity" );
	shininess_loc          = glGetUniformLocation(program, "shininess" );
	smoothness_loc         = glGetUniformLocation(program, "smoothness" );
	animation_time_loc     = glGetUniformLocation(program, "animation_time" );
	
	attenuation_factor_loc = glGetUniformLocation(program, "attenuation_factor");
	lightPosition_loc      = glGetUniformLocation(program, "lightPosition");
	COLOR_NORMALS_loc      = glGetUniformLocation(program, "COLOR_NORMALS");
	GOURAUD_loc            = glGetUniformLocation(program, "GOURAUD");
	SOLID_loc              = glGetUniformLocation(program, "SOLID");
	SOLID_COLOR_loc        = glGetUniformLocation(program, "SOLID_COLOR");
	COLOR_VERTICES_loc     = glGetUniformLocation(program, "COLOR_VERTICES");
	USE_TEXTURE_loc        = glGetUniformLocation(program, "USE_TEXTURE");
}

class GLUT_Port
{
	Debug_Screen debug_screen;
	Vector2i window_size, window_position;
	KeyMap<GLUT_Port> keys;
	
	Vector2d window_steering;

	int window_id;
	string title;
	static float prev_time;

	static map<int, GLUT_Port*> all_windows;	
	static GLUT_Port* active_port()	{	return all_windows[ glutGetWindow() ];	}

public:
	vector< Displayable* > displayList;

	GLUT_Port( const Vector2i & window_position, const Vector2i & window_size, string title )
		: window_position(window_position), window_size(window_size), title(title), window_steering( Vector2d::Identity() )
	{
		static int i = 0;
		if( i == 0/*!glutGet( GLUT_INIT_STATE )*/ )
		{
			i++;
			int count = 1;	char* test = new char[20]();	strcpy( test, string("Fake path").c_str() );
			glutInit(&count, &test);
		}
		glutInitDisplayMode (GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH);
	}
	~GLUT_Port()	{		glutDestroyWindow(window_id);	all_windows.erase(window_id);	}

	static void reshape(int width, int height)	{	glViewport(0,0,width,height);	active_port()->window_size << width, height;	}

	int get_window_id() { return window_id; }

	int init( const char* vShader, const char* fShader )
	{
		glutInitWindowPosition ( window_position[0], window_position[1]);
		glutInitWindowSize( window_size[0], window_size[1] );

		window_id = glutCreateWindow( title.c_str() );
		all_windows[ window_id ] = this;
		
		#if !defined(__APPLE__)
			glewExperimental = GL_TRUE;
			glewInit();
		#endif			
		//    std::cout << "GL version " << glGetString(GL_VERSION) << '\n';
																																	// Load shaders and use the resulting shader program
		GLuint program = LoadShaders( ( string("../my code/") + vShader ).c_str(), ( string("../my code/") + fShader ).c_str() );
			
		g_addrs = new Graphics_Addresses( program );		
		
		glEnable( GL_DEPTH_TEST );
		glEnable( GL_BLEND );
		glBlendFunc( GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA );

		glutReshapeFunc( reshape );
		glutKeyboardFunc( keydown );
		glutKeyboardUpFunc( keyup );
		glutPassiveMotionFunc( passiveMouseMotion );
		glutIdleFunc( idle ) ;
		glutDisplayFunc( display );

		registerDisplayableObject( debug_screen );
		
		return window_id;
	}

	void registerDisplayableObject( Displayable& d )	{	displayList.push_back( &d );	d.init_keys();	 }
	void removeDisplayableObject  ( Displayable& d )	{	displayList.erase( find( displayList.begin(), displayList.end(), &d ) );	}

	void handle_key( unsigned char key, unsigned char mods )	{	if( keys.hasHandler( key, mods ) )		keys.getHandler( key, mods )	();		}

	static void idle()		// idle() is called whenever the OpenGL event queue is empty.
	{		
		int old_window_id = glutGetWindow();
		for( auto it = all_windows.begin(); it != all_windows.end(); it++ )
		{
			glutSetWindow( it->first);
			glutPostRedisplay();				// Request that a redraw happen again for all windows as soon as all other OpenGL events are processed.
		}
		glutSetWindow( 1 );
	}
	
	static void display()		// We have registered this function with OpenGL as its official function to draw or re-draw each frame.
	{
		float time = TM.GetElapsedTime();
		float animation_delta_time = time - prev_time;
		prev_time = time;
		GLUT_Port& p = *all_windows[glutGetWindow()]; 

		glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );
			
		for(auto i = p.displayList.begin(); i != p.displayList.end(); i++)
		{
			(*i)->update_debug_strings( p.debug_screen.debug_screen_strings );
			(*i)->display( animation_delta_time, p.window_steering );
		}

		glFlush();
		glutSwapBuffers();
	}
	
	typedef unsigned char byte;
	static const byte SHIFT		= 0x01;
	static const byte CTRL		= 0x02;
	static const byte ALT		= 0x04;	
	static const byte RELEASE   = 0x08;
	static const byte UNFOCUSED = 0x10;

	static void keydown(unsigned char key, int x, int y )		// More callback functions registered with OpenGL for handling events:
	{
		if( key == 27 )		exit(0);
		int window_id = glutGetWindow();
		unsigned char mods = 0;
    
		if( glutGetModifiers() & GLUT_ACTIVE_SHIFT )	mods |= SHIFT;

		if( glutGetModifiers() & GLUT_ACTIVE_CTRL )		mods |= CTRL;

		if( glutGetModifiers() & GLUT_ACTIVE_ALT )		mods |= ALT;
		
		for( auto it = all_windows.begin(); it != all_windows.end(); it++ )
		{
			if ( window_id != it->first ) mods |= UNFOCUSED;	else mods &= ~UNFOCUSED;

			GLUT_Port& p = *it->second;

			p.handle_key(key, mods);

			for(auto i = p.displayList.begin(); i != p.displayList.end(); i++)
				(*i)->handle_key(key, mods);
		}
	}

	static void keyup(unsigned char key, int x, int y )
	{
		unsigned char mods = RELEASE;
		
		int window_id = glutGetWindow();
		for( auto it = all_windows.begin(); it != all_windows.end(); it++ )
		{
			if ( window_id != it->first ) mods |= UNFOCUSED;	else mods &= ~UNFOCUSED;
			GLUT_Port& p = *it->second;

			p.handle_key(key, mods);

			for(auto i = p.displayList.begin(); i != p.displayList.end(); i++)
				(*i)->handle_key(key, mods);
		}
	}

	static void passiveMouseMotion( int x, int y )	
	{
		for( auto it = all_windows.begin(); it != all_windows.end(); it++ )
		{
			GLUT_Port& p = *it->second;
			p.window_steering <<	x - p.window_size[0] / 2,	 y - p.window_size[1] / 2;
		}
	}

	Vector2i get_window_size() const { return window_size; }; 
};
float GLUT_Port::prev_time = 0;
map<int, GLUT_Port*> GLUT_Port::all_windows;

template <class T>
	void update_controls( const KeyMap<T>& keymap ) 
	{
		for( auto modifiedKey : keymap.my_map )
			all_controls.insert(
				( (modifiedKey.first >> 8 ) & GLUT_Port::SHIFT ? string("SHIFT+"):string("") ) +
				( (modifiedKey.first >> 8 ) & GLUT_Port::CTRL  ? string("CTRL+") :string("") ) +
				( (modifiedKey.first >> 8 ) & GLUT_Port::ALT   ? string("ALT+")  :string("") ) + '\'' + (const char) modifiedKey.first  + '\'' );
	}
