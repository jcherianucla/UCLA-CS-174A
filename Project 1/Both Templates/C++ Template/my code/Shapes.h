#pragma once
#include "../CS174a template/Utilities.h"
#include "../CS174a template/Shape.h"

// *******************************************************
// CS 174a Graphics Example Code
// Shapes.h - Defines a number of objects that inherit from the Shape class.  Each manages lists of its own vertex positions, vertex normals, and texture coordinates per vertex.  
// Instantiating a shape automatically calls OpenGL functions to pass each list into a buffer in the graphics card's memory.

struct Triangle_Fan_Full : public Shape		// Arrange triangles in a fan.  This version goes all the way around a circle with them.
	{	
		Triangle_Fan_Full( const Matrix4d &points_transform )
		{
			populate( *this, 10, points_transform, -1 );
			init_buffers();
		}
	private:
		static void createCircleVertices ( Shape &recipient, unsigned num_tris ) 
			{	for( unsigned counter = 0; counter <= num_tris; counter++  )
				{
					recipient.vertices.push_back( Vector3d( cos(2 * PI * counter/num_tris), sin(2 * PI * counter/num_tris), -1 ) );	
					recipient.texture_coords.push_back( Vector2d( 1. * counter/num_tris, 1 ) );	
				}
			}
		
		static void initFromSequence ( Shape &recipient, unsigned center_idx, unsigned num_tris, unsigned offset )
			{	
				for( unsigned index = offset; index <= offset + num_tris;	 )
				{
					recipient.indices.push_back( index );
					recipient.indices.push_back( center_idx );
					recipient.indices.push_back( ++index );
				}
				recipient.indices.back() = offset;
			}
	public: 
		static void populate( Shape &recipient, unsigned num_tris, const Matrix4d &points_transform, unsigned center_idx )
			{
				if( center_idx == -1 )			// Not re-using a point?  Create one.
				{
					recipient.vertices.push_back( ( points_transform * Vector4d( 0,0,1,1 ) ).topRows<3>() );
					center_idx = (unsigned)recipient.vertices.size() - 1;
					recipient.texture_coords.push_back( Vector2d( 1, 0 ) );
				}				
				unsigned offset = (unsigned)recipient.vertices.size();		unsigned index_offset = (unsigned)recipient.indices.size();				
			
				createCircleVertices( recipient, num_tris );
				initFromSequence(	  recipient, center_idx, num_tris, offset );
			
				recipient.flat_normals_from_triples( index_offset );	
		
				for( unsigned i = offset; i < recipient.vertices.size(); i++ )
					recipient.vertices[i] = ( points_transform * (Vector4d() << recipient.vertices[ i ], 1).finished() ).topRows<3>();	
			}
	};

struct Triangle_Strip : public Shape		// Arrange triangles in a strip, where the list of vertices alternates sides.
{	
	static void init_from_strip_lists( Shape &recipient, std::vector < Vector3d > &vertices, std::vector < unsigned > &indices )
	{
		unsigned offset = (unsigned)recipient.vertices.size();
			
		for( unsigned counter = 0; counter < vertices.size(); 		)
			recipient.vertices.push_back ( vertices[ counter++ ] );
			
		for( unsigned counter = 0; counter < indices.size() - 2; counter++ )
		{																		// The modulus, used as a conditional here, makes face orientations uniform.
			recipient.indices.push_back( indices[counter + 2 * ((counter+1) % 2 ) ] + offset );		
			recipient.indices.push_back( indices[counter + 1] + offset );
			recipient.indices.push_back( indices[counter + 2 * ( counter    % 2 ) ] + offset );
		}	
	}
};

struct Rectangular_Strip : public Triangle_Strip
{
	Rectangular_Strip( unsigned numRectangles, const Matrix4d &points_transform)
	{
		populate( *this, numRectangles, points_transform );
		init_buffers();
	}

	static void populate( Shape &recipient, unsigned numRectangles, const Matrix4d &points_transform )
		{
			unsigned offset = (unsigned)recipient.vertices.size(),	 index_offset = (unsigned)recipient.indices.size(),
			topIdx = 0,			bottomIdx = numRectangles + 1;
			std::vector < Vector3d > vertices( (numRectangles + 1 ) * 2 );
			std::vector < unsigned > strip_indices;		
			recipient.texture_coords.resize( recipient.texture_coords.size() + (numRectangles + 1 ) * 2 );
			for( unsigned i = 0; i <= numRectangles; i++ )
			{
				vertices[topIdx] 	= Vector3d( 0,  .5, topIdx - .5 * numRectangles );		
					recipient.texture_coords[ topIdx + offset ]    = Vector2d( 1. * topIdx / numRectangles, 1 );
				vertices[bottomIdx] = Vector3d( 0, -.5, topIdx - .5 * numRectangles );		
					recipient.texture_coords[ bottomIdx + offset ] = Vector2d( 1. * topIdx / numRectangles, 0 );
				strip_indices.push_back(topIdx++);
				strip_indices.push_back(bottomIdx++);
			}
					
			init_from_strip_lists(recipient, vertices, strip_indices);
							
			for( unsigned i = offset; i < recipient.vertices.size(); i++ )
				recipient.vertices[i] = ( points_transform * ( Vector4d() << recipient.vertices[i], 1 ).finished() ).topRows<3>();	
			recipient.flat_normals_from_triples( index_offset );
		} 
};



struct Text_Line : public Shape		// Draws a rectangle textured with images of ASCII characters over each quad, spelling out a string.
{
	unsigned max_size;
	Text_Line( unsigned max_size, const Matrix4d &points_transform ) : max_size(max_size)
	{
		Matrix4d object_transform = points_transform;
		for( unsigned i = 0; i < max_size; i++ )
		{
			Rectangular_Strip::populate( *this, 1, object_transform );
			object_transform *= translation(0, 0, -.7);
		}
		init_buffers();
	}

	void set_string( string line )
	{
		for( unsigned i = 0; i < max_size; i++ )
		{
			unsigned row = ( i < line.size() ? line[i] : ' ' ) / 16,
			         col = ( i < line.size() ? line[i] : ' ' ) % 16;
				
			unsigned skip = 3, size = 32, sizefloor = size - skip;
			float dim = size * 16.f, left  = (col * size + skip) / dim, 		top    = (row * size + skip) / dim, 
									right = (col * size + sizefloor) / dim, 	bottom = (row * size + sizefloor + 5) / dim;
			
			texture_coords[ 4 * i ]		= Vector2d( right, top );
			texture_coords[ 4 * i + 1 ] = Vector2d( left, top );
			texture_coords[ 4 * i + 2 ] = Vector2d( right, bottom );
			texture_coords[ 4 * i + 3 ] = Vector2d( left, bottom );
		}

		std::vector< float > buffer;
		glBindBuffer( GL_ARRAY_BUFFER, graphics_card_buffers[2] );
		flatten( buffer, texture_coords );
	}

	void draw_heads_up_display( const GraphicsState &graphicsState, const Matrix4d &model_transform, const Vector4f& color )
	{
		glDisable( GL_DEPTH_TEST );
		Shape::draw( graphicsState, model_transform, Material(color, 1, 0, 0, 0, "text.tga") );	
		glEnable( GL_DEPTH_TEST );
	}
};





struct Cylindrical_Strip : public Triangle_Strip
{
	Cylindrical_Strip( unsigned numRectangles, const Matrix4d &points_transform )
	{
		populate( *this, numRectangles, points_transform );
		init_buffers();
	}

	static void populate( Shape &recipient, unsigned numRectangles, const Matrix4d &points_transform )	
	{	
		std::vector < Vector3d > vertices( numRectangles * 2 );
		std::vector < unsigned > strip_indices;
		unsigned offset = (unsigned)recipient.vertices.size(),	 index_offset = (unsigned)recipient.indices.size(),
			topIdx = 0,			bottomIdx = numRectangles;
						
		recipient.texture_coords.resize( recipient.texture_coords.size() + numRectangles * 2 );
		for( unsigned i = 0; i < numRectangles; i++ )
		{
			vertices[topIdx] 	= Vector3d( cos(2 * PI * topIdx / numRectangles), sin(2 * PI * topIdx / numRectangles), .5 );	
			recipient.texture_coords[topIdx + offset]    = Vector2d(0, 1. * topIdx / numRectangles );
			vertices[bottomIdx] = Vector3d( cos(2 * PI * topIdx / numRectangles), sin(2 * PI * topIdx / numRectangles), -.5 );			
			recipient.texture_coords[bottomIdx + offset] = Vector2d(1, 1. * topIdx / numRectangles );
			strip_indices.push_back(topIdx++);
			strip_indices.push_back(bottomIdx++);
		}
		strip_indices.push_back( 0 );
		strip_indices.push_back( numRectangles );
								
		init_from_strip_lists(recipient, vertices, strip_indices);
							
		for( unsigned i = offset; i < recipient.vertices.size(); i++ )
			recipient.vertices[i] = ( points_transform * (Vector4d() << recipient.vertices[i], 1 ).finished() ).topRows<3>() ;	
		recipient.flat_normals_from_triples( index_offset );
	}
};




struct Cube : public Shape
{
	Cube( const Matrix4d &points_transform )
	{
		populate( *this, points_transform );
		init_buffers();
	}
	static void populate( Shape &recipient, const Matrix4d &points_transform )	
	{	
		for( unsigned i = 0; i < 3; i++ )			// Build a cube by inserting six triangle strips into the lists.
				for( unsigned j = 0; j < 2; j++ )
					Rectangular_Strip::populate( recipient, 1, points_transform * 
						rotation( PI / 2, Vector3d( i==0, i==1, i==2 ) ) *  translation( j - .5, 0, 0 ) );
	}
};

struct Sphere : public Shape		// Build a complicated sphere using subdivision, starting with a simple tetrahedron.
{	
	std::vector < std::vector < unsigned > > indices_LOD;
	GLuint* index_buffer_LOD;
	Sphere( const Matrix4d &points_transform, unsigned max_subdivisions ) : indices_LOD( max_subdivisions + 1 )
	{
		vertices.push_back(		Vector3d(0.0, 0.0, -1.0) 				 );				// Starting tetrahedron
		vertices.push_back(		Vector3d(0.0, 0.942809, 0.333333) 		 );
		vertices.push_back(		Vector3d(-0.816497, -0.471405, 0.333333) );
		vertices.push_back(		Vector3d(0.816497, -0.471405, 0.333333)  );
			
		subdivideTriangle( 0, 1, 2, max_subdivisions);								// Begin recursion to build the sphere (see definition below)
		subdivideTriangle( 3, 2, 1, max_subdivisions);
		subdivideTriangle( 1, 0, 3, max_subdivisions);
		subdivideTriangle( 0, 2, 3, max_subdivisions); 
			
		for( unsigned i = 0; i < vertices.size(); i++ )
		{
			spherical_texture_coords( i );
			normals.push_back( vertices[i] );			// On a sphere, we analytically know what the normals should be - the vector from the origin to the vertex.
		}

		index_buffer_LOD = new GLuint[max_subdivisions + 1];			
		glGenBuffers( max_subdivisions, index_buffer_LOD + 1 );			// Each index list of every detail-level gets its own index buffer in the graphics card

		for( unsigned i = 1; i <= max_subdivisions; i++ )
		{
			glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, index_buffer_LOD[ i ] );
			glBufferData( GL_ELEMENT_ARRAY_BUFFER,  indices_LOD[i].size() * sizeof(unsigned), indices_LOD[i].data(), GL_STATIC_DRAW );
		}
			
		init_buffers();
	}
		
	void populate( Shape &recipient, const Matrix4d &points_transform, unsigned LOD )
	{
		unsigned offset = (unsigned)recipient.vertices.size();
		for( unsigned i = 0; i < vertices.size(); i++ )
		{	
			recipient.normals .push_back( vertices[i] );	
			recipient.vertices.push_back( ( points_transform * (Vector4d() << vertices[i], 1 ).finished() ).topRows<3>() );
			recipient.spherical_texture_coords( i );
		}
		std::vector<unsigned> &this_LOD = LOD ? indices_LOD[ LOD ] : indices;		// Empty index lists for each level-of-detail 
		for( unsigned i = 0; i < indices.size(); i++ )
			recipient.indices.push_back( this_LOD[i] + offset );
	}

	void draw( const GraphicsState &graphicsState, const Matrix4d &model_transform, const Material &material, int LOD )
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

		if( LOD < 0 || LOD + 1 >= (int)indices_LOD.size() )			// Activate the chosen level-of-detail index list and draw it
		{
			glBindBuffer( GL_ELEMENT_ARRAY_BUFFER, index_buffer );
			glDrawElements( GL_TRIANGLES, (GLsizei)indices.size(), GL_UNSIGNED_INT, (GLvoid*)0 );
		}
		else
		{
			glBindBuffer( GL_ELEMENT_ARRAY_BUFFER, index_buffer_LOD[ indices_LOD.size() - 1 - LOD ] );
			glDrawElements( GL_TRIANGLES, (GLsizei)indices_LOD[ indices_LOD.size() - 1 - LOD ].size(), GL_UNSIGNED_INT, (GLvoid*)0 );
		}			
	}		
private:
	// From the starting tetrahedron all the way down to the final sphere, we'll store each level-of-detail sphere in separate index lists, so can also draw coarser spheres later.
	void subdivideTriangle( unsigned a, unsigned b, unsigned c, int count )			// This function will recurse through each level of detail by splitting triangle (a,b,c) into four smaller triangles.
	{	
		( count ? indices_LOD[count] : indices ).push_back(a);		// If "count" is 0, this is the base case of recursion - we've hit the finest level of detail we want.  Add the current
		( count ? indices_LOD[count] : indices ).push_back(b);		// subdivided triangle's index numbers to the master list of triangles.  If we're not at the base case, our current triangle 
		( count ? indices_LOD[count] : indices ).push_back(c);		// represents a lower (coarser) level of detail.  It goes into a list too, corresponding to that detail level.
		if( !count ) return;	// Skipping every fourth vertex index in our list takes you down one level of detail, and so on, due to the way we're building it.		

		Vector3d ab_vert = ( vertices[a] + vertices[b] ).normalized();		// We're not at the base case.  So, 
		Vector3d ac_vert = ( vertices[a] + vertices[c] ).normalized();		// build 3 new vertices at midpoints, and extrude them out to touch the unit sphere (length 1).
		Vector3d bc_vert = ( vertices[b] + vertices[c] ).normalized();	
						
		unsigned ab = (unsigned)vertices.size();		vertices.push_back( ab_vert );		// The indices of the three new vertices
		unsigned ac = (unsigned)vertices.size();		vertices.push_back( ac_vert );
		unsigned bc = (unsigned)vertices.size();		vertices.push_back( bc_vert );	

		subdivideTriangle( a, ab, ac,  count - 1 );			// Recurse on four smaller triangles, and we're done.
		subdivideTriangle( ab, b, bc,  count - 1 );
		subdivideTriangle( ac, bc, c,  count - 1 );
		subdivideTriangle( ab, bc, ac, count - 1 );
	}
};

struct Axis : public Shape
{
	int basis_selection;
	Axis( const Matrix4d &points_transform ) : basis_selection(0)
	{
		populate( *this, points_transform );
		init_buffers();
	}
	// Only draw this set of axes if it is the one selected through the user interface.
	void draw( int current, const GraphicsState &graphicsState, const Matrix4d &model_transform, const Material& material )
		{	if( basis_selection == current ) Shape::draw(graphicsState, model_transform, material );	}

	static void populate( Shape &recipient, const Matrix4d &points_transform )	
	{
		Matrix4d object_transform = Matrix4d::Identity();
		object_transform *= scale( .25, .25, .25 );
		(new Sphere( Matrix4d::Identity(), 3 ) )->populate( recipient, object_transform, 0 );
		object_transform = Matrix4d::Identity();
		drawOneAxis(recipient, object_transform);
		object_transform *= rotation( -PI/2, Vector3d( 1, 0, 0 ) );
		object_transform *= scale( 1, -1, 1 );
		drawOneAxis(recipient, object_transform);
		object_transform *= rotation( PI/2, Vector3d( 0, 1, 0 ) );
		object_transform *= scale( -1, 1, 1 );
		drawOneAxis(recipient, object_transform);
	}
private:	
	static void drawOneAxis( Shape &recipient, const Matrix4d &points_transform )
	{
		Matrix4d original(points_transform), object_transform(points_transform);
		object_transform *= translation( 0, 0, 4 );
		object_transform *= scale( .25, .25, .25 );
		Triangle_Fan_Full::populate ( recipient, 10, object_transform, -1 );
		object_transform = original;
		object_transform *= translation( 1, 1, .5 );
		object_transform *= scale( .1, .1, 1 );
		Cube::populate( recipient, object_transform );
		object_transform = original;
		object_transform *= translation( 1, 0, .5 );
		object_transform *= scale( .1, .1, 1 );
		Cube::populate( recipient, object_transform );
		object_transform = original;
		object_transform *= translation( 0, 1, .5 );
		object_transform *= scale( .1, .1, 1 );
		Cube::populate( recipient, object_transform );
		object_transform = original;			
		object_transform *= translation( 0, 0, 2 );
		object_transform *= scale( .1, .1, 4 );
		Cylindrical_Strip::populate( recipient, 7, object_transform );
	}
};
