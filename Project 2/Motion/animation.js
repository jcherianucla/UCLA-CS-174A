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

var texture_filenames_to_load = [ "text.png", "sky.jpg", "bricks_texture.jpg", "desert_back.gif"];

// *******************************************************	
// When the web page's window loads it creates an "Animation" object.  It registers itself as a displayable object to our other class "GL_Context" -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.

window.onload = function init() {	var anim = new Animation();	}
function Animation()
{
	(function init (self) 
	{
		self.context = new GL_Context( "gl-canvas" );
		self.context.register_display_object( self );

		 gl.clearColor(0.65, 0.67, 0.62, 1);			// Background color

		 for( var i = 0; i < texture_filenames_to_load.length; i++ )
		 	initTexture( texture_filenames_to_load[i], true );

		 self.m_cube = new cube();
		 self.m_obj = new shape_from_file( "teapot.obj" );
		 self.m_cactus = new shape_from_file("Cactus.obj");
		 self.m_axis = new axis();
		 self.m_tetrahedron = new tetrahedron();
		 self.m_pyramid = new pyramid();
		 self.m_particle = new sphere(mat4(), 2);
		 self.m_ground = new ground_mesh();
		 self.m_sphere = new sphere( mat4(), 5 );
		 self.m_sphube = new sphuboid();	
		 self.m_fan = new triangle_fan_full( 10, mat4() );
		 self.m_strip = new rectangular_strip( 1, mat4() );
		 self.m_cylinder = new cylindrical_strip( 10, mat4() );

	// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
	self.graphicsState = new GraphicsState( translation(3, -25,-35), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );
	//self.graphicsState = new GraphicsState( translation(0, -5,-20), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );


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


	shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate;} );

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

//GLOBALS
var desert_back = new Material(vec4(0, 0, 0,1), 0.7,0.5,0.8,40, "desert_back.gif"),
ground_color1 = new Material(vec4(0.867, 0.60, 0.30, 1), 0.8, 0.5, 0.8, 40),
cactus_color = new Material(vec4(0.27, 0.55, 0.22, 1), 0.7, 0.5, 0.8, 40),
head_color = new Material(vec4(1,1,1,1), 0.5, 0.5, 0.8, 40),
eye_color = new Material(vec4(0.03,0.03,0.03,1), 0.5, 0.5, 0.8, 40),
hand_color = new Material(vec4(0.8, 0, 0.2,1), 0.5, 0.5, 0.8, 40 ),
pyramid_color = new Material(vec4(0, 0, 0,1), 0.8, 0.5, 0.8, 40, "bricks_texture.jpg" ),
blade_color = new Material(vec4(0.7, 0.7, 0.6, 1), 0.5, 0.5, 0.8, 40),
sky_color = new Material(vec4(0.65, 0.67, 0.62, 1), 1, 0.5, 0.8, 40),
android_color = new Material(vec4(0.60,0.79,0.15,1), 0.7, 0.5, 0.6, 40),
cacti_vec = [],
pyramids = [],
should_stop = false, should_push = false, should_pull = false,
change_rot = false,
breaker = 0, saved_state = 0,
push_speed = 0, pull_speed = 0,
back_speed = 0, front_speed = 0,
frame_num = 0, anim_frame_num = 0,
should_move = false,
move_cam = 0, animation_speed = 0,
squint = 0;

//Function for quick unscaling
Animation.prototype.unscale = function(model_transform, x, y, z)
{
	model_transform = mult(model_transform, scale(1/x,1/y,1/z));
	return model_transform;
}

//Randomly draws cacti in the backdrop around the scene from a custom object called "cactus.obj"
Animation.prototype.draw_cacti = function(model_transform, num_cacti, cactus_size)
{
	var random_x = -100 + (Math.random() * 200),
	random_z = -40 + (Math.random() * 50),
	random_rot = 20 + (Math.random() * 50),
	start = model_transform;
	if(frame_num == 1)
	{	
		for(var i = 0; i < num_cacti; i++)
		{
			model_transform = start;
			random_rot = 20 + (Math.random() * 50);
			random_x = -150 + (Math.random() * 300);
			while(random_x < 10 && random_x > -10)
			{
				random_x = -150 + (Math.random() * 300);
			}
			random_z = -50 + (Math.random() * 500);
			while(random_z < 10 && random_z > -10)
			{
				random_z = -50 + (Math.random() * 500);

			}

			model_transform = mult(model_transform, translation(random_x, 10, random_z));
			model_transform = mult(model_transform, rotation(random_rot, 0, 1, 0));
			model_transform = mult(model_transform, scale(cactus_size, cactus_size, cactus_size));
			cacti_vec.push(model_transform);
		}
	}
	for(var j = 0; j < cacti_vec.length; j++)
	{
		this.m_cactus.draw(this.graphicsState, cacti_vec[j], cactus_color)
	}
}

//Heirarchical object made from sphubes to represent a hand
Animation.prototype.draw_hand = function(model_transform)
{
	var hand_start_mat = model_transform,
	hand_move_speed = this.graphicsState.animation_time/1000 * breaker, hand_move_rot = 15 * hand_move_speed, move_axis = -1,
	speed_stop = 3,
	hand_start_y = 6, hand_start_z = 0,
	hand_rot = [115,39,55],
	finger_rot = [20, 39],
	thumb_rot = 70,
	palm_l = 3, palm_h = 4, palm_w = 3,
	finger_base_l = 0.5, finger_base_h = 2, finger_base_w = 1,
	finger_mid_l = 0.5, finger_mid_h = 1, finger_mid_w = 1,
	finger_tip_l = 0.4, finger_tip_h = 0.5, finger_tip_w = 1,
	thumb_base_l = 0.7, thumb_base_h = 1.5, thumb_base_w = 1,
	thumb_tip_l = 0.7, thumb_tip_h = 1.5, thumb_tip_w = 0.5;


	//Draw palm

	model_transform = mult(model_transform, translation(0,hand_start_y,hand_start_z));
	model_transform = mult(model_transform, rotation(hand_rot[0], 0 ,1, 0));
	model_transform = mult(model_transform, rotation(hand_rot[1], 1, 0, 0));
	model_transform = mult(model_transform, rotation(hand_rot[2], 0, 0, -1));

	model_transform = mult(model_transform, scale(palm_l, palm_h, palm_w));
	this.m_sphube.draw(this.graphicsState, model_transform, hand_color);

	model_transform = hand_start_mat;

	//Draw fingers front 4 fingers
	for(var i = 0; i < 4; i++)

	{
		model_transform = mult(model_transform, translation(-palm_l - finger_base_l + 0.5 + (finger_base_l * 5.1*i), hand_start_y + palm_h + finger_base_h, -palm_w/2));
		model_transform = mult(model_transform, rotation(finger_rot[0], -1, 0, 0));
		model_transform = mult(model_transform, rotation(finger_rot[1], 0, -1, 0));
		if( hand_move_speed < speed_stop)
		{
			model_transform = mult(model_transform, rotation(hand_move_rot, move_axis, 0, 0));
		}
		else{
			model_transform = mult(model_transform, rotation(speed_stop * (hand_move_rot/hand_move_speed), move_axis, 0, 0));

		}
		model_transform = mult(model_transform, scale(finger_base_l, finger_base_h, finger_base_w));
		this.m_sphube.draw(this.graphicsState, model_transform, hand_color);
		model_transform = this.unscale(model_transform, finger_base_l, finger_base_h, finger_base_w);

		model_transform = mult(model_transform, translation(-finger_mid_l, finger_base_h + finger_mid_h, -finger_mid_w));
		if( hand_move_speed < speed_stop)
		{
			model_transform = mult(model_transform, rotation(hand_move_rot, move_axis, 0, 0));
		}
		else {
			model_transform = mult(model_transform, rotation(speed_stop * (hand_move_rot/hand_move_speed), move_axis, 0, 0));

		}
		model_transform = mult(model_transform, scale(finger_mid_l, finger_mid_h, finger_mid_w));
		this.m_sphube.draw(this.graphicsState, model_transform, hand_color);

		model_transform = this.unscale(model_transform, finger_mid_l, finger_mid_h, finger_mid_w);

		model_transform = mult(model_transform, translation(-finger_tip_l, finger_mid_h + finger_tip_h, -finger_tip_w));
		if( hand_move_speed < speed_stop)
		{
			model_transform = mult(model_transform, rotation(hand_move_rot, move_axis, 0, 0));
		}
		else {
			model_transform = mult(model_transform, rotation(speed_stop * (hand_move_rot/hand_move_speed), move_axis, 0, 0));

		}
		model_transform = mult(model_transform, scale(finger_tip_l, finger_tip_h, finger_tip_w));
		this.m_sphube.draw(this.graphicsState, model_transform, hand_color);

		model_transform = hand_start_mat;
	}

	model_transform = hand_start_mat;

	//Draw thumb
	model_transform = mult(model_transform, translation(-palm_l - thumb_base_l - 0.5, hand_start_y - 3, palm_w + 1));
	model_transform = mult(model_transform, rotation(thumb_rot, 0, 0, 1));
	if(hand_move_speed < speed_stop)
	{
		model_transform = mult(model_transform, rotation(hand_move_rot, 0, move_axis, 0));
	}
	else {
		model_transform = mult(model_transform, rotation(speed_stop * (hand_move_rot/hand_move_speed), 0, move_axis, 0));

	}
	model_transform = mult(model_transform, scale(thumb_base_l, thumb_base_h, thumb_base_w));
	this.m_sphube.draw(this.graphicsState, model_transform, hand_color);

	model_transform = hand_start_mat;

	model_transform = mult(model_transform, translation(-palm_l - thumb_base_l - thumb_tip_l - 2.5, hand_start_y - 2.5 , palm_w));
	model_transform = mult(model_transform, rotation(thumb_rot, 0, 0, 1));
	model_transform = mult(model_transform, rotation(thumb_rot, 0, -1, 0));
	if( hand_move_speed < speed_stop)
	{
		model_transform = mult(model_transform, rotation(hand_move_rot, 0, move_axis, 0));
	}
	else {
		model_transform = mult(model_transform, rotation(speed_stop * (hand_move_rot/hand_move_speed), 0, move_axis, 0));

	}
	model_transform = mult(model_transform, scale(thumb_tip_l, thumb_tip_h, thumb_tip_w));
	this.m_sphube.draw(this.graphicsState, model_transform, hand_color);

}

//Place Sand dunes in the background and generate a sequence of pyramids
Animation.prototype.draw_background_scene = function(model_transform, num_pyramids)
{
	var start = model_transform;

	model_transform = mult(model_transform, translation(0,200,-400));
	model_transform = mult(model_transform, rotation(90, 0, 1, 0));
	model_transform = mult(model_transform, scale(800, 700, 800));
	this.m_strip.draw(this.graphicsState, model_transform, desert_back);

	var pyr_h = 200, pyr_l = 300, pyr_w = 200, pyr_z = -200;
	if(frame_num == 1)
	{
		for(var i = 0; i < num_pyramids; i++)
		{
			model_transform = start;
			model_transform = mult(model_transform, translation(-100 + (i * pyr_l/1.5), 0, pyr_z));
			model_transform = mult(model_transform, rotation(30, 0, 1, 0));
			model_transform = mult(model_transform, scale(pyr_l, pyr_h, pyr_w));
			pyramids.push(model_transform);
		}
	}
	for(var j = 0; j <num_pyramids; j++)
	{
		this.m_pyramid.draw(this.graphicsState, pyramids[j], pyramid_color);
	}
}

//Heirarchical object representing the android monster with ability to move and break!
Animation.prototype.draw_android = function(model_transform)
{
	var start = model_transform,
	break_speed = this.graphicsState.animation_time/1000 * breaker,
	head_rad = 3, head_start = 15,
	ear_l = 0.3, ear_h = 1.5, ear_w = 0.1, ears_x = -2, ears_rot = 20,
	eyes_rad = 0.5, eyes_x = -1.5, eyes_rad_x = eyes_rad,
	bulb_rad = 0.3,
	body_l = 6, body_h = 6, body_w = 6,
	connect_rad = 1, connect_x = -body_l/2,
	arm_l = 3, arm_h = 1, arm_w = 1,
	arm_speed = (Math.sin(this.graphicsState.animation_time/100) + 1) * !breaker, arm_rotation = 50,
	leg_l = 1, leg_h = 3, leg_w = 1,
	leg_speed = Math.sin(this.graphicsState.animation_time/100) * 1.5 * !breaker, leg_rotation = 40,
	multiplier = -1;

	if(squint)
	{
		eyes_rad_x = 1.5;
	}

	//Head
	model_transform = mult(model_transform, translation(0, head_start + break_speed, 0));
	model_transform = mult(model_transform, scale(head_rad, head_rad, head_rad));
	this.m_sphere.draw(this.graphicsState, model_transform, android_color);

	//Eyes
	for(var i = 0;  i < 2; i++)
	{
		model_transform = start;
		if(i == 1)
		{
			eyes_x *= -1;
			break_speed *= -1;
		}	
		model_transform = mult(model_transform, translation(eyes_x + break_speed, head_start + eyes_rad, head_rad - eyes_rad + break_speed));
		model_transform = mult(model_transform, scale(eyes_rad_x, eyes_rad, eyes_rad));
		if(squint)
		{
			this.m_cube.draw(this.graphicsState, model_transform, hand_color);
		}
		else{
			this.m_sphere.draw(this.graphicsState, model_transform, hand_color);
		}
	}
	//Ears
	for(var j = 0; j < 2; j++)
	{
		model_transform = start;
		if(j == 1)
		{
			ears_x *= -1;
			ears_rot *= -1;
			break_speed *= -1;
		}
		model_transform = mult(model_transform, translation(ears_x, head_start + head_rad + ear_h/3 - 0.5, 0 + break_speed));
		model_transform = mult(model_transform, rotation(ears_rot, 0, 0, 1));
		model_transform = mult(model_transform, rotation(break_speed, 1, 0, 1));
		model_transform = mult(model_transform, scale(ear_l, ear_h, ear_w));
		this.m_cube.draw(this.graphicsState, model_transform, android_color);
		model_transform = this.unscale(model_transform, ear_l, ear_h, ear_w);

		model_transform = mult(model_transform, translation(0, ear_h/2 + bulb_rad + break_speed, 0));
		model_transform = mult(model_transform, scale(bulb_rad, bulb_rad, bulb_rad));
		this.m_sphere.draw(this.graphicsState, model_transform, hand_color);
	}

	//Body
	model_transform = start;
	model_transform = mult(model_transform, translation(0,head_start - body_h/2 - 1,0));		
	model_transform = mult(model_transform, rotation(break_speed, -1, 1, 1));
	model_transform = mult(model_transform, scale(body_l, body_h, body_w));
	this.m_cube.draw(this.graphicsState, model_transform, android_color);
	model_transform = this.unscale(model_transform, body_l, body_h, body_w);

	var torso_start = model_transform;

	model_transform = mult(model_transform, translation(0,break_speed/100, body_h/2));
	if(change_rot && should_move)
	{
		model_transform = mult(model_transform, rotation(this.graphicsState.animation_time, 0, 0, -1));
	}	
	model_transform = mult(model_transform, rotation(break_speed * 5, -1, 0, -1));
	model_transform = mult(model_transform, scale(1, 2, 1));
	this.m_pyramid.draw(this.graphicsState, model_transform, blade_color);
	//Arms and connectors
	for(var k = 0; k < 2; k++)
	{
		model_transform = torso_start;

		if(k == 1)
		{
			connect_x *= -1;
			multiplier *= -1;
			break_speed *= -1
		}
		model_transform = mult(model_transform, translation(connect_x , body_l/4 + break_speed/10, 0));
		model_transform = mult(model_transform, scale(connect_rad, connect_rad, connect_rad));
		model_transform = mult(model_transform, rotation(break_speed, -1, -1, 0));
		if(!change_rot && should_move)
		{
			model_transform = mult(model_transform, rotation(arm_rotation * arm_speed, 0, -multiplier, 0));
		}
		else if(change_rot && should_move)
		{
			arm_speed = Math.sin(this.graphicsState.animation_time/100) - 0.5;
			model_transform = mult(model_transform, rotation(arm_rotation * arm_speed, 0, 0, -multiplier));
		}
		this.m_sphere.draw(this.graphicsState, model_transform, android_color);
		model_transform = this.unscale(model_transform, connect_rad, connect_rad, connect_rad);

		model_transform = mult(model_transform, translation(multiplier * connect_rad + (multiplier * arm_l/2),0,break_speed));
		model_transform = mult(model_transform, rotation(break_speed, 1, -1, 0));

		model_transform = mult(model_transform, scale(arm_l, arm_h, arm_w));
		this.m_cube.draw(this.graphicsState, model_transform, android_color);
		model_transform = this.unscale(model_transform, arm_l, arm_h, arm_w);

		model_transform = mult(model_transform, translation(multiplier * arm_l/2 + (multiplier * connect_rad/2), 0, 0));
		model_transform = mult(model_transform, scale(connect_rad/2, connect_rad/2, connect_rad/2));
		this.m_sphere.draw(this.graphicsState, model_transform, android_color);
	}
	break_speed *= -1;

	//Legs and connectors
	for(var l = 0; l < 2; l++)
	{		
		model_transform = torso_start;
		connect_x *= -1;

		model_transform = mult(model_transform, translation(connect_x/2, -body_l/2 + break_speed * 2, 0));
		model_transform = mult(model_transform, rotation(break_speed, 0, -1, 1));

		if(!change_rot && should_move)
		{
			model_transform = mult(model_transform, rotation(leg_rotation * leg_speed, multiplier, 0, 0));
		}
		else if(change_rot && should_move)
		{
			leg_speed = Math.sin(this.graphicsState.animation_time/100);
			model_transform = mult(model_transform, rotation(leg_rotation * leg_speed, 0, 0, multiplier));
		}
		model_transform = mult(model_transform, scale(connect_rad, connect_rad, connect_rad));
		this.m_sphere.draw(this.graphicsState, model_transform, android_color);
		model_transform = this.unscale(model_transform, connect_rad, connect_rad, connect_rad);

		model_transform = mult(model_transform, translation(break_speed/10, -connect_rad - leg_h/2, 0));
		model_transform = mult(model_transform, scale(leg_l, leg_h, leg_w));
		this.m_cube.draw(this.graphicsState, model_transform, android_color);
		model_transform = this.unscale(model_transform, leg_l, leg_h, leg_w);

		model_transform = mult(model_transform, translation(break_speed, -leg_l - connect_rad, break_speed));
		model_transform = mult(model_transform, rotation(break_speed, -1, -1, -1));
		model_transform = mult(model_transform, scale(connect_rad/2, connect_rad/2, connect_rad/2));
		this.m_sphere.draw(this.graphicsState, model_transform, android_color);
		multiplier *= -1;
	}

}

//Function to generate a random explosion of particles
Animation.prototype.particlize = function(model_transform, num_particles, saved_state)
{
	var start = model_transform,
	particle_speed = this.graphicsState.animation_time/100 - saved_state,
	particle_rad = 0.5;
	console.log(particle_speed);
	for(var i = 0; i < num_particles; i++)
	{
		model_transform = mult(model_transform, translation(particle_speed * Math.sin(i * Math.cos(i)), particle_speed * Math.cos(i * Math.sin(i)), particle_speed * Math.sin(i * 6)));
		model_transform = mult(model_transform, scale(particle_rad, particle_rad, particle_rad));
		this.m_particle.draw(this.graphicsState, model_transform, hand_color);
		model_transform = start;
	}
}

//Draws the entire scene
Animation.prototype.draw_scene = function(model_transform)
{
	var origin = model_transform, num_iters = 20,
	x_stretch = 1000,
	z_stretch = 1000,
	y_stretch = 10,
	start_action = 120, interval = 30;
	if(anim_frame_num == 470)
	{
		saved_state = this.graphicsState.animation_time/100;
	}
	if(anim_frame_num > 470 && (!should_push || !should_pull || !breaker))
	{
		animation_speed = this.graphicsState.animation_time/100 - saved_state;
		should_move = true;
	}

	//Draw ground
	model_transform = origin;
	model_transform = mult(model_transform, scale(x_stretch, y_stretch , z_stretch));
	this.m_ground.draw(this.graphicsState, model_transform, ground_color1);

	//Draw the sky
	model_transform = origin;
	model_transform = mult(model_transform, translation(1,1,1));
	model_transform = mult(model_transform, scale(x_stretch, y_stretch * 100, z_stretch));
	this.m_cube.draw(this.graphicsState, model_transform, sky_color);

	//Draw the back scene
	model_transform = origin;
	this.draw_background_scene(model_transform, 5);

	//Draw the cacti
	model_transform = origin;
	this.draw_cacti(model_transform, 20, 2);

	//Draw the android
	model_transform = origin;
	if(this.graphicsState.animation_time/100 >= start_action)
	{
		change_rot = true;
		squint = 0;
		should_push = true;
	}
	if(should_push && this.graphicsState.animation_time/100 >= start_action && this.graphicsState.animation_time/100 < start_action + interval)
	{
		back_speed = 100 * (this.graphicsState.animation_time/100 - start_action)/interval;
	}
	if(this.graphicsState.animation_time/100 >= start_action + interval)
	{
		start_action += interval;
		squint = 0;
		should_push = false;
		should_pull = true;
	}
	if(should_pull && this.graphicsState.animation_time/100 >= start_action && this.graphicsState.animation_time/100 < start_action + interval)
	{
		front_speed = 40 * (this.graphicsState.animation_time/100 - start_action)/interval;
	}

	//Storyline Code
	if(anim_frame_num <= 470 && anim_frame_num > 0)
	{
		animation_speed = 0, back_speed = 0, front_speed = 0;
		should_move = false;
		//Move camera back to show player's hand
		if(anim_frame_num == 100)
		{
			this.graphicsState.camera_transform = mult(translation(3, -15,-100), this.graphicsState.camera_transform);
			this.graphicsState.camera_transform = mult(rotation(10, 1, 0,0), this.graphicsState.camera_transform);
		}
	}
	if(this.graphicsState.animation_time/100 >= start_action + interval)
	{
		start_action += interval;
		move_cam++;
		squint = 0;
		//Move camera to show break
		if(move_cam == 1)
		{
			saved_state = this.graphicsState.animation_time/100;
			this.graphicsState.camera_transform = mult(translation(-80, 10, 70), this.graphicsState.camera_transform);
			this.graphicsState.camera_transform = mult(rotation(60, 0, -1, 0), this.graphicsState.camera_transform);
		}
		should_pull = false;
		//Wait for a while until camera in position
		if(move_cam == 100)
		{		
			breaker = 1;
			should_move = false;
		}

	}
	model_transform = mult(model_transform, translation(0, 6, -50 + animation_speed - back_speed + front_speed));
	this.draw_android(model_transform);
	//Create explosion
	if(breaker == 1)
	{
		this.particlize(model_transform, 150, saved_state);

	}

	//Modify the camera position based on android position
	if(frame_num == 1)
	{
		this.graphicsState.camera_transform = lookAt(vec3(this.graphicsState.camera_transform[0][3] - 5,this.graphicsState.camera_transform[1][3] + 55, this.graphicsState.camera_transform[2][3] + 15 ), vec3(model_transform[0][3], model_transform[1][3], model_transform[2][3]), vec3(0,1,0));
		this.graphicsState.camera_transform = mult(rotation(20, -1, 0, 0),this.graphicsState.camera_transform);
		squint = 0;
	}

	//Draw hand
	model_transform = origin;
	model_transform = mult(model_transform, translation(0, 15, 0));
	//Move hand based on push or pull
	if(should_push && should_move)
	{
		model_transform = mult(model_transform, translation(0,0,-push_speed));
	} else if (should_pull && should_move)
	{
		model_transform = mult(model_transform, translation(0, 0, pull_speed));
	}
	this.draw_hand(model_transform);
}

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
	  frame_num += 1;
	  //Determine if we are ready to push the android
	  if(should_push && push_speed >= 0 && should_move)
	  {
	  	squint = 0;
	  	if(push_speed < 10)
	  	{
	  		push_speed += this.graphicsState.animation_time/10000;
	  	}	
	  }
	  //Determine if we are ready to pull the android
	  if(should_pull && should_move)
	  {
	  	squint = 0
	  	if(pull_speed < 10)
	  	{
	  		pull_speed += this.graphicsState.animation_time/10000;
	  	}
	  }
	  // //Position the camera for the very first fr
	  // if(frame_num == 1)
	  // {
	  // 	this.graphicsState.camera_transform = mult(rotation(20, 1, 0, 0),this.graphicsState.camera_transform);
	  // }
	  //Update anim_fram_num to determine what text to display
	  if(animate)
	  {
	  	squint = 1;
	  	anim_frame_num++;
	  }
	  //Draw the scene
	  this.draw_scene(model_transform);

	}	


Animation.prototype.update_strings = function( debug_screen_strings )		// Strings this particular class contributes to the UI
{
	debug_screen_strings.string_map["time"] = "Frame Rate: " + 1/(this.animation_delta_time / 1000) + "fps";
	debug_screen_strings.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
}
