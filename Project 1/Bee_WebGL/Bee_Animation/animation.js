// *******************************************************
// CS 174a Graphics Bee Animation code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
var gouraud = false, color_normals = false, solid = false;
function CURRENT_BASIS_IS_WORTH_SHOWING(self, model_transform) { self.m_axis.draw( self.basis_id++, self.graphicsState, model_transform, new Material( vec4( .8,.3,.8,1 ), .5, 1, 1, 40, "" ) ); }


// *******************************************************
// IMPORTANT -- In the line below, add the filenames of any new images you want to include for textures!

var texture_filenames_to_load = [ "stars.png", "text.png", "earth.gif" ];

// *******************************************************	
// When the web page's window loads it creates an "Animation" object.  It registers itself as a displayable object to our other class "GL_Context" -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.

window.onload = function init() {	var anim = new Animation();	}
function Animation()
{
	( function init (self) 
	  {
		  self.context = new GL_Context( "gl-canvas" );
		  self.context.register_display_object( self );

		  gl.clearColor( 0.61, 0.75, 0.30, 1 );			// Background color

		  for( var i = 0; i < texture_filenames_to_load.length; i++ )
		initTexture( texture_filenames_to_load[i], true );

	self.m_cube = new cube();
	self.m_obj = new shape_from_file( "teapot.obj" )
		self.m_axis = new axis();
	self.m_sphere = new sphere( mat4(), 4 );	
	self.m_fan = new triangle_fan_full( 10, mat4() );
	self.m_strip = new rectangular_strip( 1, mat4() );
	self.m_cylinder = new cylindrical_strip( 10, mat4() );

	// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
	self.graphicsState = new GraphicsState( translation(0, -11,-40), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );

	gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);

	self.context.render();	
	  } ) ( this );	

	canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here
Animation.prototype.init_keys = function()
{
	shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; } );
	shortcut.add( ",",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0,  1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0, -1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;

	shortcut.add( "r",     ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; } );

	shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	
}

function update_camera( self, animation_delta_time )
{
	var leeway = 70, border = 50;
	var degrees_per_frame = .0002 * animation_delta_time;
	var meters_per_frame  = .01 * animation_delta_time;
	// Determine camera rotation movement first
	var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
	var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
	var outside_border = false;

	for( var i = 0; i < 2; i++ )
		if ( Math.abs( movement[i] ) > canvas_size[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.

	for( var i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
	{
		var velocity = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
		self.graphicsState.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), self.graphicsState.camera_transform );			// On X step, rotate around Y axis, and vice versa.
	}
	self.graphicsState.camera_transform = mult( translation( scale_vec( meters_per_frame, thrust ) ), self.graphicsState.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
}

// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.


Animation.prototype.display = function(time)
{
	if(!time) time = 0;
	this.animation_delta_time = time - prev_time;
	if(animate) this.graphicsState.animation_time += this.animation_delta_time;
	prev_time = time;

	update_camera( this, this.animation_delta_time );

	this.basis_id = 0;

	var model_transform = mat4();

	// Materials: Declare new ones as needed in every function.
	// 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.

	/**********************************
	  Start coding here!!!!
	 **********************************/

	//Draw the flower
	this.flower_draw(model_transform, 3, 10, 8, stem_color, bulb_color);
	//Draw the bee
	this.draw_bee(model_transform);

}	
//Global variables
var stem_height = 3,	//The height of each stem cell
	body_length = 5,
	body_width = 2,
	body_height = 2,
	bounce_factor = 5,
	rot_angle = 8,	//The angle of rotation of the flower in Degrees
	stem_color = new Material(vec4(1.49, 0.96, 0.36,1), 0.5, 0.5, 0.8, 40),
	bulb_color = new Material(vec4(1,0,0,1), 0.5,0.8,0.3,20),
	body_color = new Material(vec4(0.80, 0.80, 0.80,1), 0.5, 0.1, 0.1, 40),
	back_color = new Material(vec4(2.24, 2.24, 0, 1), 0.5, 0.1, 0.1, 40),
	head_color= new Material(vec4(0.88, 0.60, 1.49, 1) ,0.5, 0.1, 0.1, 40);

//Repeatedly draw multiple stem_cells to form the trunk of the flower
Animation.prototype.stem_draw = function (model_transform, num_cells, radians_rotation, graphics_time)
{
	for(var i = 1; i < num_cells; i++)
	{
		model_transform = mult(model_transform, translation(0,stem_height/2,0));
		model_transform = mult(model_transform, rotation(graphics_time * rot_angle, 0,0,1));
		model_transform = mult(model_transform, translation(0,stem_height/2,0));
		model_transform = mult(model_transform, scale(1,stem_height,1));
		this.m_cube.draw(this.graphicsState, model_transform, stem_color);
		model_transform = mult(model_transform, scale(1, 1/stem_height, 1));
	}
	return model_transform;
}

//Draw the bulb of the flower
Animation.prototype.bulb_draw = function (model_transform, radians_rotation, graphics_time)
{
	model_transform = mult(model_transform, translation((-stem_height/2)*Math.sin(graphics_time*radians_rotation),stem_height + stem_height/2 * Math.cos(graphics_time*radians_rotation), 0));
	model_transform = mult(model_transform, scale(stem_height, stem_height, stem_height));
	this.m_sphere.draw(this.graphicsState, model_transform, bulb_color);
}

//Draw the flower
Animation.prototype.flower_draw = function (model_transform, num_cells)
{
	//Draw the base cell of the flower's stem
	var head_matrix = model_transform;
	model_transform = mult(model_transform, scale(1,stem_height,1));
	this.m_cube.draw(this.graphicsState, model_transform, stem_color);
	model_transform = head_matrix;

	//Define the angle of rotation in radians, and the graphics animation time
	var rot_r = rot_angle * (Math.PI/180),
		graphics = Math.sin(this.graphicsState.animation_time/2000);

	//Draw the stem of the flower
	model_transform = this.stem_draw(model_transform, 8, rot_r, graphics);
	//Draw the upper bulb of the flower
	this.bulb_draw(model_transform, rot_r, graphics);
}

Animation.prototype.bee_head = function(model_transform)
{
	//Bee head is a sphere of radius 1
	var	head_size = 1;
	model_transform = mult(model_transform, translation(-(body_length/2 + head_size),0,0));
	model_transform = mult(model_transform, scale(head_size, head_size, head_size));
	this.m_sphere.draw(this.graphicsState, model_transform, head_color);
}

Animation.prototype.bee_back = function(model_transform)
{
	//Back is oval with x variation is 3
	var back_size = 4;
	model_transform = mult(model_transform, translation(body_length/2 + back_size,0,0));
	model_transform = mult(model_transform, scale(back_size, back_size/2,back_size/2));
	this.m_sphere.draw(this.graphicsState, model_transform, back_color);
}

Animation.prototype.bee_body = function (model_transform)
{
	var graphics = (this.graphicsState.animation_time/2000) % 360,
		body_displace_x = -15*Math.sin(graphics),
		body_displace_z = 15*Math.cos(graphics),
		body_displace_y = 7,
		rotation_deg = graphics * (180/Math.PI),
		rotation_axis = -1;
	
	//Bee body
	model_transform = mult(model_transform, translation(body_displace_x,body_displace_y,body_displace_z));
	model_transform = mult(model_transform, translation(0, bounce_factor*Math.sin(graphics*2),0));
	model_transform = mult(model_transform, rotation(rotation_deg, 0, rotation_axis,0));
	model_transform = mult(model_transform, scale(body_length,body_height,body_width));
	this.m_cube.draw(this.graphicsState, model_transform, body_color);
	model_transform = mult(model_transform, scale(1/body_length,1/body_height,1/body_width));
	//Body reference point
	var body_start = model_transform;

	//Bee head
	this.bee_head(model_transform);
	model_transform = body_start;

	//Bee back
	this.bee_back(model_transform);
	return body_start;
}

Animation.prototype.bee_wings = function (model_transform, right_wing)
{
	var wing_height = 0.2,
		wing_width = 5,
		wing_length = 3,
		rotation_angle = 90,
		rotation_axis = 1,
		flapping_angle = Math.sin(this.graphicsState.animation_time/500) * 0.7,
		bod_w = body_width;
	if(right_wing)
	{
		bod_w *= -1;
		rotation_axis = -1;
		wing_width *= -1;
	}
	model_transform = mult(model_transform, translation(0, body_height/2, bod_w/2));
	model_transform = mult(model_transform, rotation(rotation_angle * flapping_angle, rotation_axis,0,0));
	model_transform = mult(model_transform, translation(0, wing_height/2, wing_width/2));
	model_transform = mult(model_transform, scale(wing_length, wing_height, wing_width));
	this.m_cube.draw(this.graphicsState, model_transform, body_color);
	model_transform = mult(model_transform, scale(1/body_length, 1/wing_height, 1/wing_width));
}

Animation.prototype.bee_legs = function (model_transform, index, separator)
{
	var leg_h = 2,
		leg_l = 0.5,
		leg_swing_angle = (Math.sin(this.graphicsState.animation_time/800)+1 )* 0.5,
		leg_w = 0.5,
		rotation_axis = 1,
		bod_w = body_width,
		u_rotation_angle = 30,
		l_rotation_angle = 50;

	//For right side legs we push the legs backwards in the z direction and rotate it around an inverted axis
	if(index % 2 != 0)
	{
		bod_w *= -1;
		rotation_axis = -1;
		leg_w *= -1;
	}
	
	//Draw upper part of leg - separator determines the distance between each consecutive leg
	model_transform = mult(model_transform, translation(-leg_l + separator, -body_height/2, bod_w/2));
	model_transform = mult(model_transform, rotation(u_rotation_angle * leg_swing_angle, rotation_axis, 0, 0));
	model_transform = mult(model_transform, translation(0, -leg_h/2, leg_w/2));
	model_transform = mult(model_transform, scale(leg_l, leg_h, leg_w));
	this.m_cube.draw(this.graphicsState, model_transform, body_color);
	model_transform = mult(model_transform, scale(1/leg_l, 1/leg_h, 1/leg_w));

	//Draw lower leg
	model_transform = mult(model_transform, translation(0, -leg_h/2, -leg_w/2));
	model_transform = mult(model_transform, rotation(l_rotation_angle *leg_swing_angle, rotation_axis, 0, 0));
	model_transform = mult(model_transform, translation(0, -leg_h/2, leg_w/2));
	model_transform = mult(model_transform, scale(leg_l, leg_h, leg_w));
	this.m_cube.draw(this.graphicsState, model_transform, body_color);
}

Animation.prototype.draw_bee = function (model_transform)
{
	model_transform = this.bee_body(model_transform);
	//Draw everything around the central body
	var body_start = model_transform;

	//Draw the two wings, left and right
	for(var i = 1; i >= 0; i--)
	{
		this.bee_wings(model_transform, i);
		model_transform = body_start;
	}	
	var leg_separator =	-body_length/5;

	//Draw legs
	for(var i = 0; i < 6; i++)
	{
		this.bee_legs(model_transform, i, leg_separator);
		model_transform = body_start;
		if(i % 2 == 1)
		{
			leg_separator += body_length/5 + 0.5;
		}
	}
}


Animation.prototype.update_strings = function( debug_screen_strings )		// Strings this particular class contributes to the UI
{
	debug_screen_strings.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	debug_screen_strings.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_strings.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	debug_screen_strings.string_map["thrust"] = "Thrust: " + thrust;
}
