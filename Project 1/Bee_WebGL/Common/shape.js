// *******************************************************
// CS 174a Graphics Example Code
// Shape.js - Each shape manages lists of its own vertex positions, vertex normals, and texture coordinates per vertex.  
// Instantiating a shape automatically calls OpenGL functions to pass each list into a buffer in the graphics card's memory.

// A few utility functions come next and then we will describe the shape class:

var textures = {};
function initTexture(filename, bool_mipMap) 
	{
		textures[filename] = {} ;
		textures[filename].id 				= gl.createTexture();
		textures[filename].image 			= new Image();    
		textures[filename].image.onload 	= (	function (texture, bool_mipMap) {
			return function( ) {			
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.bindTexture(gl.TEXTURE_2D, texture.id);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				if(bool_mipMap)
					{	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);	gl.generateMipmap(gl.TEXTURE_2D);	}
				else
						gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				texture.loaded = true;
			}
		}	) (textures[filename], bool_mipMap);
		textures[filename].image.src 		= filename;
	}

function inherit(subType, superType)
	{
		var p = Object.create(superType.prototype);
		p.constructor = subType;
		subType.prototype = p;
	}
function mult_vec(M, v)
{
	v_4 = v.length == 4 ? v : vec4( v, 0 );
	v_new = vec4();
	v_new[0] = dot( M[0], v_4 );
	v_new[1] = dot( M[1], v_4 );
	v_new[2] = dot( M[2], v_4 );
	v_new[3] = dot( M[3], v_4 );
	return v_new;
}

function toMat3( mat4_affine )
	{
		var m = [];
		m.push( mat4_affine[0].slice( 0, 3 ) );
		m.push( mat4_affine[1].slice( 0, 3 ) );
		m.push( mat4_affine[2].slice( 0, 3 ) );
		m.matrix = true;
		return m;
	}
	
	
function Material( color, ambient, diffusivity, shininess, smoothness, texture_filename )
	{
		this.color = color;	this.ambient = ambient;  this.diffusivity = diffusivity; this.shininess = shininess; 
		this.smoothness = smoothness; this.texture_filename = texture_filename;
	}
	
// *******************************************************
// IMPORTANT: When you extend the Shape class, these are the four arrays you must put values into.  Each shape has a list of vertex positions (here just called vertices), vertex normals 
// (vectors that point away from the surface for each vertex), texture coordinates (pixel coordintates in the texture picture, scaled down to the range [ 0.0, 1.0 ] to place each vertex 
// somewhere relative to the picture), and most importantly - indices, a list of index triples defining which three vertices belong to each triangle.  Your class must build these lists 
// and then send them to the graphics card by calling init_buffers().  At some point a simple example will be given of manually building these lists for a shape.
function shape()
	{
		this.vertices = [];
		this.normals = [];
		this.texture_coords = [];
		this.indices = [];
		this.indexed = true;
	}
		
	shape.prototype.flat_normals_from_triples = function( offset )		// This calculates normals automatically for flat shaded elements, assuming that each element is independent (no shared vertices)
		{
			this.normals.length = this.vertices.length;
			for( var counter = offset; counter < ( this.indexed ? this.indices.length : this.vertices.length ) ; counter += 3 )
			{
				var a = this.vertices[ this.indexed ? this.indices[ counter     ] : counter ] ;
				var b = this.vertices[ this.indexed ? this.indices[ counter + 1 ] : counter + 1 ] ;
				var c = this.vertices[ this.indexed ? this.indices[ counter + 2 ] : counter + 2 ] ;
						
				var triangleNormal = normalize( cross( subtract(a, b), subtract(c, a)) );		// Cross two edge vectors of this triangle together to get the normal
				if( length( add( triangleNormal, a) ) < length(a) )
						scale_vec( -1, triangleNormal );										// Flip the normal if for some point it brings us closer to the origin
				
				this.normals[ this.indices[ counter     ] ] = vec3( triangleNormal[0], triangleNormal[1], triangleNormal[2] );
				this.normals[ this.indices[ counter + 1 ] ] = vec3( triangleNormal[0], triangleNormal[1], triangleNormal[2] );
				this.normals[ this.indices[ counter + 2 ] ] = vec3( triangleNormal[0], triangleNormal[1], triangleNormal[2] );
			}
		};
	
	shape.prototype.spherical_texture_coords = function( vert_index )
		{	this.texture_coords.push( vec2( .5 + Math.atan2( this.vertices[vert_index][2], this.vertices[vert_index][0] ) / 2 / Math.PI, .5 - 2 * Math.asin( this.vertices[vert_index][1] ) / 2 / Math.PI ) );
		}
	
	shape.prototype.init_buffers = function()			// Send the completed vertex and index lists to their own buffers in the graphics card.
		{
			this.graphics_card_buffers = [];	// Memory addresses of the buffers given to this shape in the graphics card.
			for( var i = 0; i < 4; i++ )
			{
				this.graphics_card_buffers.push( gl.createBuffer() );
				gl.bindBuffer(gl.ARRAY_BUFFER, this.graphics_card_buffers[i] );
				switch(i) {
					case 0: gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW); break;
					case 1: gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW); break;
					case 2: gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texture_coords), gl.STATIC_DRAW); break;	}
			}
			
			if( this.indexed )
			{
				this.index_buffer = gl.createBuffer();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
			}
		};
	
	
	shape.prototype.update_uniforms = function( graphicsState, model_transform, material )			// Send the current matrices to the shader
		{
				var camera_model_transform 				= mult( graphicsState.camera_transform, model_transform );
				var projection_camera_model_transform 	= mult( graphicsState.projection_transform, camera_model_transform );
				var camera_model_transform_normal		= toMat3( transpose( inverse( camera_model_transform ) ) );
				
				gl.uniformMatrix4fv( g_addrs.camera_transform_loc, 					false, flatten( graphicsState.camera_transform ) );
				gl.uniformMatrix4fv( g_addrs.camera_model_transform_loc, 			false, flatten( camera_model_transform ) );
				gl.uniformMatrix4fv( g_addrs.projection_camera_model_transform_loc, false, flatten( projection_camera_model_transform ) );
				gl.uniformMatrix3fv( g_addrs.camera_model_transform_normal_loc, 	false, flatten( camera_model_transform_normal ) );
				   
				var N_LIGHTS = 2, lightPositions = [], lightColors = [], attenuations = [], 
                lightPositions_flattened = [], lightColors_flattened = [];
				lightPositions.push( vec4( 10 * Math.sin(graphicsState.animation_time/1000), 2, -2, 1 ) );    
				lightColors.push( vec4( 0, 1, 0, 1 ) );   
				attenuations.push( .0001 );

				lightPositions.push( vec4( 2, 10 * Math.sin(graphicsState.animation_time/1000), -2, 1 ) );    
				lightColors.push( vec4( 1, 0, 0, 1 ) );   
				attenuations.push( .0001 );

				for( var i = 0; i < 4 * N_LIGHTS; i++ )
				{
					   lightPositions_flattened[i] = lightPositions[ Math.floor(i/4) ][i%4];
					   lightColors_flattened[i]    =    lightColors[ Math.floor(i/4) ][i%4];
				}
				gl.uniform4fv( g_addrs.lightPosition_loc,     lightPositions_flattened );
				gl.uniform4fv( g_addrs.lightColor_loc,     lightColors_flattened );   
				gl.uniform1fv( g_addrs.attenuation_factor_loc,     attenuations );   
									   
				   
				gl.uniform4fv( g_addrs.color_loc, 			material.color );		// Send a desired shape-wide color to the graphics card
				gl.uniform1f ( g_addrs.ambient_loc, material.ambient );
				gl.uniform1f ( g_addrs.diffusivity_loc,  material.diffusivity );
				gl.uniform1f ( g_addrs.shininess_loc, material.shininess );
				gl.uniform1f ( g_addrs.smoothness_loc, material.smoothness );
				gl.uniform1f ( g_addrs.animation_time_loc, graphicsState.animation_time / 1000 );
		};
		
		// The same draw call is used for every shape - the calls draw different things due to the different vertex lists we stored in the graphics card for them.
	shape.prototype.draw = function( graphicsState, model_transform, material )
		{
			this.update_uniforms( graphicsState, model_transform, material );
			
			if( material.texture_filename && textures[ material.texture_filename ].loaded )			// Use a non-existent texture string parameter to signal that we don't want to texture this shape.
			{
				g_addrs.shader_attributes[2].enabled = true;
				gl.uniform1f ( g_addrs.USE_TEXTURE_loc, 1 );
				gl.bindTexture(gl.TEXTURE_2D, textures[ material.texture_filename ].id);
			}
			else
				{	gl.uniform1f ( g_addrs.USE_TEXTURE_loc, 0 );		g_addrs.shader_attributes[2].enabled = false;	}
			
			for( var i = 0, it = g_addrs.shader_attributes[0]; i < g_addrs.shader_attributes.length, it = g_addrs.shader_attributes[i]; i++ )
				if( it.enabled )
				{
					gl.enableVertexAttribArray( it.index );
					gl.bindBuffer( gl.ARRAY_BUFFER, this.graphics_card_buffers[i] );
					gl.vertexAttribPointer( it.index, it.size, it.type, it.normalized, it.stride, it.pointer );
				}
				else
					gl.disableVertexAttribArray( it.index );
			
			if( this.indexed )			
			{
				gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer );
				gl.drawElements( gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0 );
			}
			else
				gl.drawArrays  ( gl.TRIANGLES, 0, this.vertices.length );
		};