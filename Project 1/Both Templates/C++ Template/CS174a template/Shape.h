#pragma once
#include "../CS174a template/Utilities.h"

// *******************************************************
// CS 174a Graphics Example Code
// Shape.h - Each shape manages lists of its own vertex positions, vertex normals, and texture coordinates per vertex.  
// Instantiating a shape automatically calls OpenGL functions to pass each list into a buffer in the graphics card's memory.

struct Shape
	{
	// *******************************************************
	// IMPORTANT: When you extend the Shape class, these are the four arrays you must put values into.  Each shape has a list of vertex positions (here just called vertices), vertex normals 
	// (vectors that point away from the surface for each vertex), texture coordinates (pixel coordintates in the texture picture, scaled down to the range [ 0.0, 1.0 ] to place each vertex 
	// somewhere relative to the picture), and most importantly - indices, a list of index triples defining which three vertices belong to each triangle.  Your class must build these lists
	// and then send them to the graphics card by calling init_buffers().  At some point a simple example will be given of manually building these lists for a shape.

		std::vector < Vector3d > vertices, normals;
		std::vector < Vector2d > texture_coords;
		std::vector < unsigned > indices;
		std::vector < GLuint > graphics_card_buffers;		// Memory addresses of the buffers given to this shape in the graphics card.
		bool indexed;
		GLuint index_buffer;		
		
		Shape() : indexed(true), graphics_card_buffers(4) { }

		void flat_normals_from_triples( unsigned offset )		// This calculates normals automatically for flat shaded elements, assuming that each element is independent (no shared vertices)
		{
			normals.resize( vertices.size() );
			for( unsigned counter = offset; counter < ( indexed ? indices.size() : vertices.size() ) ; counter += 3 )
			{
				Vector3d a = vertices[ indexed ? indices[ counter     ] : counter     ] ;
				Vector3d b = vertices[ indexed ? indices[ counter + 1 ] : counter + 1 ] ;
				Vector3d c = vertices[ indexed ? indices[ counter + 2 ] : counter + 2 ] ;
	
				Vector3d triangleNormal = ( a - b ).cross( c - a ).normalized();	// Cross two edge vectors of this triangle together to get the normal
				if( ( triangleNormal + a ).norm() < a.norm() )
						triangleNormal *= -1;		// Flip the normal if for some point it brings us closer to the origin
				
				if( triangleNormal[0] != triangleNormal[0] || triangleNormal[1] != triangleNormal[1] ||  triangleNormal[2] != triangleNormal[2] )
				{																	// Did we divide by zero?  Handle it
					normals[ indices[ counter     ] ] = Vector3d( 0, 0, 1 );		
					normals[ indices[ counter + 1 ] ] = Vector3d( 0, 0, 1 );
					normals[ indices[ counter + 2 ] ] = Vector3d( 0, 0, 1 );
					return;
				}
				normals[ indices[ counter     ] ] = Vector3d( triangleNormal[0], triangleNormal[1], triangleNormal[2] );
				normals[ indices[ counter + 1 ] ] = Vector3d( triangleNormal[0], triangleNormal[1], triangleNormal[2] );
				normals[ indices[ counter + 2 ] ] = Vector3d( triangleNormal[0], triangleNormal[1], triangleNormal[2] );
			}
		}

		void spherical_texture_coords ( unsigned vert_index )
		{	texture_coords.push_back( Vector2d( .5 + atan2( vertices[vert_index][2], vertices[vert_index][0] ) / 2 / PI, .5 - 2 * asin( vertices[vert_index][1] ) / 2 / PI ) );
		}

		template < class stlVector > void flatten( std::vector< float > &buffer, stlVector &eigenObjects )
		{
			buffer.clear();
			for( auto it = eigenObjects.begin(); it != eigenObjects.end(); it++ )
				for( int i = 0; i < it->size() ; i++ )
					buffer.push_back( float( ( *it ) [i]) );
			glBufferData(GL_ARRAY_BUFFER, buffer.size() * sizeof(float), buffer.data(), GL_STATIC_DRAW );	
		}
		
		void init_buffers()		// Send the completed vertex and index lists to their own buffers in the graphics card.
		{
			std::vector< float > buffer;

			for( int i = 0; i < 4; i++ )
			{
				glGenBuffers( 1, &graphics_card_buffers[i] );
				glBindBuffer(GL_ARRAY_BUFFER, graphics_card_buffers[i]);
				switch(i) {
				case 0: flatten( buffer, vertices ); break;
				case 1: flatten( buffer, normals ); break;
				case 2: flatten( buffer, texture_coords ); break;	}
			}
			
			if( indexed )
			{
				glGenBuffers( 1, &index_buffer );
				glBindBuffer( GL_ELEMENT_ARRAY_BUFFER, index_buffer);
				glBufferData( GL_ELEMENT_ARRAY_BUFFER, indices.size() * sizeof(unsigned), indices.data(), GL_STATIC_DRAW );
			}
		}
	
		void update_uniforms( const GraphicsState& graphicsState, const Matrix4d& model_transform, const Material& material )
		{	
			Matrix4f camera_transform_float				= graphicsState.camera_transform.cast<float>();		 // Send the current matrices to the shader
			Matrix4d camera_model_transform 			= graphicsState.camera_transform * model_transform;
			Matrix4f camera_model_transform_float 		= camera_model_transform.cast<float>();
			Matrix4f projection_camera_model_transform 	= ( graphicsState.projection_transform * camera_model_transform ).cast<float>();
			Matrix3f camera_model_transform_normal		= camera_model_transform.inverse().transpose().topLeftCorner<3, 3>().cast<float>();
				
			glUniformMatrix4fv( g_addrs->camera_transform_loc, 					1, GL_FALSE, camera_transform_float.data() );
			glUniformMatrix4fv( g_addrs->camera_model_transform_loc, 			1, GL_FALSE, camera_model_transform_float.data() );
			glUniformMatrix4fv( g_addrs->projection_camera_model_transform_loc, 1, GL_FALSE, projection_camera_model_transform.data() );
			glUniformMatrix3fv( g_addrs->camera_model_transform_normal_loc,		1, GL_FALSE, camera_model_transform_normal.data() );
				   
			const int N_LIGHTS = 2;
			vector<Vector4f> lightPositions, lightColors;
			vector<float> attenuations;
			float lightPositions_flattened[N_LIGHTS * 4], lightColors_flattened[N_LIGHTS * 4];
			
			lightPositions.push_back( Vector4f( 10 * sin(graphicsState.animation_time), 2, -2, 1 ).normalized() );    
			lightColors.push_back( Vector4f( 0, 1, 0, 1 ) );   
			attenuations.push_back( .0001f );
			
			lightPositions.push_back( Vector4f( 2, 10 * sin(graphicsState.animation_time), -2, 1 ) );  
			lightColors.push_back( Vector4f( 1, 0, 0, 1 ) );   
			attenuations.push_back( .0001f );

			for( unsigned i = 0; i < 4 * N_LIGHTS; i++ )
			{
				lightPositions_flattened[i] = lightPositions[i/4](i%4);
				lightColors_flattened[i]    =    lightColors[i/4](i%4);
			}

			glUniform4fv( g_addrs->lightPosition_loc,      N_LIGHTS, lightPositions_flattened );
			glUniform4fv( g_addrs->lightColor_loc,         N_LIGHTS, lightColors_flattened );
			glUniform4fv( g_addrs->attenuation_factor_loc, N_LIGHTS, attenuations.data() );
			glUniform1f ( g_addrs->ambient_loc,		material.ambient );
			glUniform1f ( g_addrs->diffusivity_loc, material.diffusivity );
			glUniform1f ( g_addrs->shininess_loc,	material.shininess );
			glUniform1f ( g_addrs->smoothness_loc,	material.smoothness );
			glUniform4fv( g_addrs->color_loc, 			1, material.color.data() );	// Send a desired shape-wide color to the graphics card
			glUniform1f	( g_addrs->animation_time_loc, graphicsState.animation_time );
		}

		// The same draw call is used for every shape - the calls draw different things due to the different vertex lists we stored in the graphics card for them.
		void draw( const GraphicsState& graphicsState, const Matrix4d& model_transform, const Material& material )
		{
			update_uniforms( graphicsState, model_transform, material );
			
			if( material.texture_filename.length() )		// Use an empty string parameter to signal that we don't want to texture this shape.
			{
				g_addrs->shader_attributes[2].enabled = true;
				glUniform1f ( g_addrs->USE_TEXTURE_loc,  1 );
				glBindTexture( GL_TEXTURE_2D, textures[material.texture_filename]->id );
			}
			else  { glUniform1f ( g_addrs->USE_TEXTURE_loc,  0 );	g_addrs->shader_attributes[2].enabled = false; }
			
			unsigned i = 0;
			for( auto it = g_addrs->shader_attributes.begin(); it != g_addrs->shader_attributes.end(); it++, i++)
				if( it->enabled == GL_TRUE )
				{
					glEnableVertexAttribArray( it->index );
					glBindBuffer( GL_ARRAY_BUFFER, graphics_card_buffers[i] );
					glVertexAttribPointer( it->index, it->size, it->type, it->normalized, it->stride, it->pointer );
				}
				else
					glDisableVertexAttribArray( it->index );

			if( indexed )			
			{
				glBindBuffer( GL_ELEMENT_ARRAY_BUFFER, index_buffer );
				glDrawElements( GL_TRIANGLES, (GLsizei)indices.size(), GL_UNSIGNED_INT, (GLvoid*)0 );
			}
			else
				glDrawArrays  ( GL_TRIANGLES, 0, (GLsizei)vertices.size() );
		}
	};