// *******************************************************
// CS 174a Graphics Example Code
// Shapes.js - Defines a number of objects that inherit from the Shape class.  Each manages lists of its own vertex positions, vertex normals, and texture coordinates per vertex.  
// Instantiating a shape automatically calls OpenGL functions to pass each list into a buffer in the graphics card's memory.

function triangle_fan_full( num_tris, points_transform )		// Arrange triangles in a fan.  This version goes all the way around a circle with them.
{	
	shape.call(this);	

	this.createCircleVertices = function( recipient, num_tris ) 
	{	
		for( var counter = 0; counter++ <= num_tris;   )
		{
			recipient.vertices.push( vec3( Math.cos(2 * Math.PI * counter/num_tris), Math.sin(2 * Math.PI * counter/num_tris), -1 ) );		
			recipient.texture_coords.push( vec2( counter/num_tris, 1 ) );	
		}
	}

	this.initFromSequence = function( recipient, center_idx, num_tris, offset )
	{	
		for(var index = offset; index <= offset + num_tris;	 )
		{
			recipient.indices.push( index );
			recipient.indices.push( center_idx );
			recipient.indices.push( ++index );
		}
		recipient.indices.pop(); 
		recipient.indices.push( offset );
	}

		if( !arguments.length) return;	// Pass no arguments if you just want to make a dummy object that inherits everything, for making static calls
		this.populate( this, num_tris, points_transform );
		this.init_buffers();
	}
	inherit(triangle_fan_full, shape);

	triangle_fan_full.prototype.populate = function( recipient, num_tris, points_transform, center_idx )
	{
			if( center_idx === undefined )			// Not re-using a point?  Create one.
			{
				center_idx = recipient.vertices.push( vec3( mult_vec( points_transform, vec4( 0,0,1,1 ) ) ) ) - 1;
				recipient.texture_coords.push( vec2( 1, 0 ) );
			}				
			var offset = recipient.vertices.length;		var index_offset = recipient.indices.length;				
			
			this.createCircleVertices( recipient, num_tris );
			this.initFromSequence(	   recipient, center_idx, num_tris, offset );
			
			recipient.flat_normals_from_triples( index_offset );	

			for( var i = offset; i < recipient.vertices.length; i++ )
				recipient.vertices[i] = vec3( mult_vec( points_transform, vec4( recipient.vertices[ i ], 1 ) ) );	
		};

		//Custom tetrahedron for Center of Android
		function tetrahedron() {
			shape.call(this); 
			this.populate();
			this.init_buffers();
		}
		inherit(tetrahedron, shape);
		tetrahedron.prototype.populate = function() 
		{
			var a = 1/Math.sqrt(3);

			this.vertices.push( vec3(0,0,0), vec3(0,1,0), vec3(1,0,0) ); 
			this.vertices.push( vec3(0,0,0), vec3(0,1,0), vec3(0,0,1) ); 
			this.vertices.push( vec3(0,0,0), vec3(1,0,0), vec3(0,0,1) ); 
			this.vertices.push( vec3(0,0,1), vec3(0,1,0), vec3(1,0,0) );

			this.normals.push( vec3(0,0,1), vec3(0,0,1), vec3(0,0,1) ); 
			this.normals.push( vec3(1,0,0), vec3(1,0,0), vec3(1,0,0) ); 
			this.normals.push( vec3(0,1,0), vec3(0,1,0), vec3(0,1,0) ); 
			this.normals.push( vec3(a,a,a), vec3(a,a,a), vec3(a,a,a) );

			this.texture_coords.push( vec3(0,0,0), vec3(0,1,0), vec3(1,0,0) ); 
			this.texture_coords.push( vec3(0,0,0), vec3(0,1,0), vec3(1,0,0) ); 
			this.texture_coords.push( vec3(0,0,0), vec3(0,1,0), vec3(1,0,0) ); 
			this.texture_coords.push( vec3(0,0,0), vec3(0,1,0), vec3(1,0,0) );
			this.indices.push( 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ); 
		}

		//Custom pyramid for the backdrop
		function pyramid()
		{
			shape.call(this);
			this.populate();
			this.init_buffers();
		}

		inherit(pyramid, shape);

		pyramid.prototype.populate = function()
		{
			var a = 1/Math.sqrt(3);

			this.vertices.push( vec3(-0.5,-0.5,0.5), vec3(0,0.5,0), vec3(0.5,-0.5,0.5) ); 
			this.vertices.push( vec3(0,0.5,0), vec3(0.5,-0.5,-0.5), vec3(0.5,-0.5,0.5) ); 
			this.vertices.push( vec3(0.5,-0.5,-0.5), vec3(0,0.5,0), vec3(-0.5,-0.5,-0.5) ); 
			this.vertices.push( vec3(-0.5,-0.5,-0.5), vec3(0,0.5,0), vec3(-0.5,-0.5,0.5) );
			this.vertices.push( vec3(-0.5,-0.5,0.5), vec3(-0.5,-0.5,-0.5),vec3(0.5,-0.5,0.5) ); 
			this.vertices.push( vec3(-0.5,-0.5,-0.5), vec3(0.5,-0.5,-0.5), vec3(0.5,-0.5,0.5) ); 

			this.normals.push( vec3(0,0,1), vec3(0,0,1), vec3(0,0,1) ); 
			this.normals.push( vec3(1,0,0), vec3(1,0,0), vec3(1,0,0) ); 
			this.normals.push( vec3(0,0,-1), vec3(0,0,-1), vec3(0,0,-1) ); 
			this.normals.push(vec3(-1,0,0), vec3(-1,0,0), vec3(-1,0,0) );
			this.normals.push(vec3(0,-1,0), vec3(0,-1,0), vec3(0,-1,0) );
			this.normals.push( vec3(0,-1,0), vec3(0,-1,0), vec3(0,-1, 0));

			this.texture_coords.push( vec3(0,0,0.5), vec3(1,1,0) ); 
			this.texture_coords.push( vec3(0.5,1,1), vec3(0,0,0) ); 
			this.texture_coords.push( vec3(0,0,0.5), vec3(1,1,0) );
			this.texture_coords.push( vec3(0,0,0.5), vec3(1,1,0) );
			this.texture_coords.push( vec3(0,0,0), vec3(1,1,0) ); 
			this.texture_coords.push( vec3(0,1,1), vec3(1,1,0) ); 

			this.indices.push( 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17);
		}

		//Custom tesselated ground for the scene
		function ground_mesh()
		{
			shape.call(this);
			this.populate();
			this.init_buffers();
		}

		inherit(ground_mesh, shape);

		function cross_product(vector1, vector2)
		{
			var n_x = (vector1[1] * vector2[2]) - (vector1[2] * vector2[1]);
			var n_y = (vector1[2] * vector2[0]) - (vector1[0] * vector2[2]);
			var n_z = (vector1[0] * vector2[1]) - (vector1[1] * vector2[0]);

			var normal = vec3(n_x, n_y, n_z);

			return normal;
		}

		var seed = 1.1;
		function custom_random()
		{
			var y = Math.cos(seed++) * 1000;
			return y - Math.floor(y);
		}

		function vector_subtract(vertex1, vertex2)
		{
			var sub = vec3(vertex2[0] - vertex1[0], vertex2[1] - vertex1[1], vertex2[2] - vertex1[2]);
			return sub;
		}

		ground_mesh.prototype.populate = function()
		{
			var k = 0,
			tesselation_factor = 40,
			vertex_arr = new Array(tesselation_factor),
			iter_x = -0.5, iter_z = -0.5;
	//Array creation
	for(var v = 0; v < vertex_arr.length; v++)
	{
		vertex_arr[v] = new Array(tesselation_factor);
	}
	//Array of vertices init
	for(var z = 0; z < tesselation_factor; z++, iter_z += 0.1)
	{
		for(var x = 0, iter_x = -0.5; x < tesselation_factor; x++, iter_x += 0.1)
		{
			seed += 1.5;
			var rand = custom_random() * 2;
			var vertex1 = vec3(iter_x,rand, iter_z);
			
			vertex_arr[x][z] = vertex1;
		}
	}
	//Push vertices into shape
	for(var i = 0; i < tesselation_factor-1; i++)
	{
		for(var j = 0; j < tesselation_factor-1; j++)
		{
			this.vertices.push(  vertex_arr[j][i],   vertex_arr[j+1][i], vertex_arr[j][i+1] );
			this.vertices.push(  vertex_arr[j+1][i+1], vertex_arr[j+1][i], vertex_arr[j][i+1] );

			var norm1 = cross_product(vector_subtract(vertex_arr[j+1][i],vertex_arr[j][i]), vector_subtract(vertex_arr[j][i+1],vertex_arr[j][i])),
			norm2 = cross_product(vector_subtract(vertex_arr[j][i],vertex_arr[j+1][i]), vector_subtract(vertex_arr[j][i+1],vertex_arr[j+1][i])),
			norm3 = cross_product(vector_subtract(vertex_arr[j][i+1],vertex_arr[j][i]), vector_subtract(vertex_arr[j][i+1],vertex_arr[j+1][i])),
			norm4 = cross_product(vector_subtract(vertex_arr[j+1][i+1],vertex_arr[j][i+1]), vector_subtract(vertex_arr[j+1][i+1],vertex_arr[j+1][i]));

			this.normals.push(  norm1  , norm2, norm3  );
			this.normals.push(  norm2, norm4, norm3  );

			this.texture_coords.push(  vec3(0,0,0), vec3(0,1,0), vec3(1,0,0)  );
			this.texture_coords.push(  vec3(0,0,0), vec3(0,1,0), vec3(1,0,0)  );

			this.indices.push(k, k+1, k+2, k+3, k+4, k+5);
			k+= 6;
		}
	}
}


function triangle_strip()						// Arrange triangles in a strip, where the list of vertices alternates sides.
{	shape.call(this);	};
inherit(triangle_strip, shape);

triangle_strip.prototype.init_from_strip_lists = function( recipient, vertices, indices )
{			
	var offset = recipient.vertices.length;
	[].push.apply( recipient.vertices, vertices );

	for( var counter = 0; counter < indices.length - 2; counter++ )
	{
				recipient.indices.push( indices[counter + 2 * ((counter+1) % 2 ) ] + offset );		// The modulus, used as a conditional here, makes face orientations uniform.
				recipient.indices.push( indices[counter + 1] + offset );
				recipient.indices.push( indices[counter + 2 * ( counter    % 2 ) ] + offset );
			}
		};
		
		function rectangular_strip( numRectangles, points_transform )
		{
			triangle_strip.call(this);	
		if( !arguments.length) return;	// Pass no arguments if you just want to make a dummy object that inherits everything, for making static calls
		this.populate( this, numRectangles, points_transform );
		this.init_buffers();
	}
	inherit(rectangular_strip, triangle_strip);

	rectangular_strip.prototype.populate = function( recipient, numRectangles, points_transform )	
	{	
		var offset = recipient.vertices.length;		var index_offset = recipient.indices.length;
		var vertices = [];
		var strip_indices = [];
		var topIdx = 0; var bottomIdx = numRectangles + 1;						

		for( var i = 0; i <= numRectangles; i++ )
		{
			vertices[topIdx] 	= vec3( 0,  .5, topIdx - .5 * numRectangles );		recipient.texture_coords[ topIdx + offset ]    = vec2( topIdx / numRectangles, 1 );
			vertices[bottomIdx] = vec3( 0, -.5, topIdx - .5 * numRectangles );		recipient.texture_coords[ bottomIdx + offset ] = vec2( topIdx / numRectangles, 0 );
			strip_indices.push(topIdx++);
			strip_indices.push(bottomIdx++);
		}

		this.init_from_strip_lists(recipient, vertices, strip_indices);

		for( var i = offset; i < recipient.vertices.length; i++ )
			recipient.vertices[i] = vec3( mult_vec( points_transform, vec4( recipient.vertices[i], 1 ) ) );						
		recipient.flat_normals_from_triples( index_offset );

	}

	function cylindrical_strip( numRectangles, points_transform )
	{
		triangle_strip.call(this);	
		if( !arguments.length) return;	// Pass no arguments if you just want to make a dummy object that inherits everything, for making static calls	
		this.populate( this, numRectangles, points_transform );
		this.init_buffers();
	}
	inherit(cylindrical_strip, triangle_strip);

	cylindrical_strip.prototype.populate = function( recipient, numRectangles, points_transform )	
	{	
		var vertices = [];
		var strip_indices = [];
		var offset = recipient.vertices.length;		var index_offset = recipient.indices.length;
		var topIdx = 0; var bottomIdx = numRectangles;

		for( var i = 0; i < numRectangles; i++ )
		{
			vertices[topIdx] 	= vec3( Math.cos(2 * Math.PI * topIdx / numRectangles), Math.sin(2 * Math.PI * topIdx / numRectangles), .5 );	
			recipient.texture_coords[topIdx + offset]    = vec2(0, topIdx / numRectangles );
			vertices[bottomIdx] = vec3( Math.cos(2 * Math.PI * topIdx / numRectangles), Math.sin(2 * Math.PI * topIdx / numRectangles), -.5 );			
			recipient.texture_coords[bottomIdx + offset] = vec2(1, topIdx / numRectangles );
			strip_indices.push(topIdx++);
			strip_indices.push(bottomIdx++);
		}
		strip_indices.push(0);
		strip_indices.push( numRectangles );

		this.init_from_strip_lists(recipient, vertices, strip_indices);

		for( var i = offset; i < recipient.vertices.length; i++ )
			recipient.vertices[i] = vec3( mult_vec( points_transform, vec4( recipient.vertices[i], 1 ) ) );					
		recipient.flat_normals_from_triples( index_offset );
	}

function shape_from_file(filename)		// Begin downloading the mesh, and once it completes return control to our webGLStart function
{
	shape.call(this);

	this.draw = function( graphicsState, model_transform, material ) 	{
		if( this.ready ) shape.prototype.draw.call(this, graphicsState, model_transform, material );		}	
		
		this.filename = filename;

		this.webGLStart = function(meshes)
		{
			for( var j = 0; j < meshes.mesh.vertices.length/3; j++ )
			{
				this.vertices.push( vec3( meshes.mesh.vertices[ 3*j ], meshes.mesh.vertices[ 3*j + 1 ], meshes.mesh.vertices[ 3*j + 2 ] ) );
				this.texture_coords.push( vec2(meshes.mesh.textures[ 2*j ],meshes.mesh.textures[ 2*j + 1 ]));
			}
			this.indices  = meshes.mesh.indices;	  
			this.normals  = meshes.mesh.vertexNormals;
			this.init_buffers();
			this.ready = true;
		}
		OBJ.downloadMeshes( { 'mesh' : filename }, (function(self) { return self.webGLStart.bind(self) }(this) ) );
	}
	inherit(shape_from_file, shape);


	function cube( points_transform )		
	{
		shape.call(this);
		this.populate( this, mat4() );
		this.init_buffers();
	}
	inherit(cube, shape);

	cube.prototype.populate = function( recipient, points_transform )
	{
		var m_strip = new rectangular_strip(); 
			for( var i = 0; i < 3; i++ )										// Build a cube by inserting six triangle strips into the lists.
				for( var j = 0; j < 2; j++ )
					m_strip.populate( recipient, 1, mult( points_transform, mult( rotation( 90, vec3( i==0, i==1, i==2 ) ), translation( j - .5, 0, 0 ) ) ) );
			}

			function lowest(points_arr)
			{
				points_arr.sort(function(a,b) {
					return a - b;
				})
				return points_arr[0];
			}

			function sphuboid(points_transform)
			{
				shape.call(this);
				this.populate(this, mat4());
				this.init_buffers();
			}
			inherit(sphuboid, shape);

			//Custom "sphube" for hand creation
			sphuboid.prototype.populate = function(points_transform)
			{
				this.m_sphere = new sphere();
				this.m_sphere.populate(this, mat4(), 4);
				for(var i = 0; i < this.vertices.length; i++)
				{
		//Check if points are close to x,-x, y, -y, z, -z plane
		//If the distance is 0, do nothing else interpolate to said plane
		var dist_y = 1 - this.vertices[i][1],
		dist_y_neg = -1 + this.vertices[i][1],
		dist_x = 1 - this.vertices[i][0],
		dist_x_neg = -1 + this.vertices[i][0],
		dist_z = 1 - this.vertices[i][2],
		dist_z_neg = -1 + this.vertices[i][2];
		var points_arr = [dist_y, dist_y_neg, dist_x, dist_x_neg, dist_z, dist_z_neg];

		var low_point = lowest(points_arr);
		if(low_point == dist_y)
		{
			this.vertices[i][1] = dist_y;
		} else if(low_point == dist_y_neg)
		{
			this.vertices[i][1] = dist_y_neg;
		} else if(low_point == dist_x)
		{
			this.vertices[i][0] = dist_x;
		} else if(low_point == dist_x_neg)
		{
			this.vertices[i][0] = dist_x_neg;
		} else if(low_point == dist_z)
		{
			this.vertices[i][2] = dist_z;
		} else if(low_point == dist_z_neg)
		{
			this.vertices[i][2] = dist_z_neg;
		} else
		{
			this.vertices[i] = vec3(low_point, low_point, low_point);
		}

	}
}



function sphere( points_transform, max_subdivisions )		// Build a complicated sphere using subdivision, starting with a simple tetrahedron.  
{	
	shape.call(this);	
									// From the starting tetrahedron all the way down to the final sphere, we'll store each level-of-detail sphere in separate index lists, so can also draw coarser spheres later.
		this.subdivideTriangle = function( a, b, c, recipient, count )		// This function will recurse through each level of detail by splitting triangle (a,b,c) into four smaller triangles.
		{	
			if( count <= 0)	// Base case of recursion - we've hit the finest level of detail we want.  Add the current subdivided triangle's index numbers to the master list of triangles.
			{		
				recipient.indices.push(a,b,c);		// Skipping every fourth vertex index in our list takes you down one level of detail, and so on, due to the way we're building it.			
				return;	
			}
			else if( recipient.indices_LOD && recipient.indices_LOD[count] )		// If we're not at the base case, our current triangle represents a lower (coarser) level of detail.
				recipient.indices_LOD[count].push(a,b,c);							// It goes into a list too, corresponding to that detail level.
			
			var ab_vert = normalize( mix( recipient.vertices[a], recipient.vertices[b], 0.5) );			// We're not at the base case.  So,
			var ac_vert = normalize( mix( recipient.vertices[a], recipient.vertices[c], 0.5) );			// build 3 new vertices at midpoints, and extrude them out to touch the unit sphere (length 1).
			var bc_vert = normalize( mix( recipient.vertices[b], recipient.vertices[c], 0.5) );	

			var ab = recipient.vertices.length;		recipient.vertices.push( ab_vert );			// The indices of the three new vertices
			var ac = recipient.vertices.length;		recipient.vertices.push( ac_vert );	
			var bc = recipient.vertices.length;		recipient.vertices.push( bc_vert );	

			this.subdivideTriangle( a, ab, ac,  recipient, count - 1 );			// Recurse on four smaller triangles, and we're done.
			this.subdivideTriangle( ab, b, bc,  recipient, count - 1 );
			this.subdivideTriangle( ac, bc, c,  recipient, count - 1 );
			this.subdivideTriangle( ab, bc, ac, recipient, count - 1 );
		}
		
		if( !arguments.length) return;	// Pass no arguments if you just want to make a dummy object that inherits everything, for making static calls
		
		this.indices_LOD = [];
		this.index_buffer_LOD = [];
		for( var i = 1; i <= max_subdivisions; i++ )		// Empty index lists for each level-of-detail 
			this.indices_LOD[i] = [];
		
		this.populate( this, points_transform, max_subdivisions );
		
		for( var i = 1; i <= max_subdivisions; i++ )		// Each index list of every detail-level gets its own index buffer in the graphics card
		{
			this.index_buffer_LOD[i] = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer_LOD[ i ] );
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( this.indices_LOD[ i ] ), gl.STATIC_DRAW);
		}
		
		this.draw = function( graphicsState, model_transform, material, LOD ) 	
		{ 	
			this.update_uniforms( graphicsState, model_transform, material );

			if( material.texture_filename && textures[ material.texture_filename ].loaded )			// Omit the texture string parameter to signal that we don't want to texture this shape.
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
				
			if( LOD === undefined || LOD < 0 || LOD + 1 >= this.indices_LOD.length )		// Activate the chosen level-of-detail index list and draw it
			{
				gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer );
				gl.drawElements( gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0 );
			}
			else
			{
				gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer_LOD[ this.indices_LOD.length - 1 - LOD ] );
				gl.drawElements( gl.TRIANGLES, this.indices_LOD[ this.indices_LOD.length - 1 - LOD ].length, gl.UNSIGNED_SHORT, 0 );
			}			
		}
		this.init_buffers();
	}
	inherit(sphere, shape);

	sphere.prototype.populate = function ( recipient, points_transform, max_subdivisions ) 
	{	
			var offset = recipient.vertices.length;									// Starting tetrahedron
			recipient.vertices.push(		vec3(0.0, 0.0, -1.0) 				 );
			recipient.vertices.push(		vec3(0.0, 0.942809, 0.333333) 		 );
			recipient.vertices.push(		vec3(-0.816497, -0.471405, 0.333333) );
			recipient.vertices.push(		vec3(0.816497, -0.471405, 0.333333)  );
			
			this.subdivideTriangle( 0 + offset, 1 + offset, 2 + offset, recipient, max_subdivisions);	// Begin recursion
			this.subdivideTriangle( 3 + offset, 2 + offset, 1 + offset, recipient, max_subdivisions);
			this.subdivideTriangle( 1 + offset, 0 + offset, 3 + offset, recipient, max_subdivisions);
			this.subdivideTriangle( 0 + offset, 2 + offset, 3 + offset, recipient, max_subdivisions); 
			
			for( var i = offset; i < recipient.vertices.length; i++ )
			{
				recipient.spherical_texture_coords( i );
				recipient.normals[i] = recipient.vertices[i].slice();		// On a sphere, we analytically know what the normals should be - the vector from the origin to the vertex.
				recipient.vertices[i] = vec3( mult_vec( points_transform, vec4( recipient.vertices[i], 1 ) ) );	
			}
		};



		function axis()
		{
			shape.call(this);

			this.basis_selection = 0;
			this.drawOneAxis = function(object_transform)
			{
				var original = object_transform;
				object_transform = mult( object_transform, translation(0, 0, 4));
				object_transform = mult( object_transform, scale(.25, .25, .25));
				this.m_fan.populate ( this, 10, object_transform );
				object_transform = original;
				object_transform = mult( object_transform, translation(1, 1, .5));
				object_transform = mult( object_transform, scale(.1, .1, 1));
				this.m_cube.populate( this, object_transform );
				object_transform = original;
				object_transform = mult( object_transform, translation(1, 0, .5));
				object_transform = mult( object_transform, scale(.1, .1, 1));
				this.m_cube.populate( this, object_transform );
				object_transform = original;
				object_transform = mult( object_transform, translation(0, 1, .5));
				object_transform = mult( object_transform, scale(.1, .1, 1));
				this.m_cube.populate( this, object_transform );
				object_transform = original;			
				object_transform = mult( object_transform, translation(0, 0, 2));
				object_transform = mult( object_transform, scale(.1, .1, 4));
				this.m_cylinder.populate( this, 7, object_transform );
			}

			this.populate = ( function (self) 
			{	
				self.m_sphere = new sphere(); self.m_cube = new cube(); self.m_cylinder = new cylindrical_strip(); self.m_fan = new triangle_fan_full;
				var stack = [];				
				var object_transform = mat4();
				object_transform = mult( object_transform, scale(.25, .25, .25));
				self.m_sphere.populate( self, object_transform, 3 );
				object_transform = mat4();
				self.drawOneAxis(object_transform);
				object_transform = mult( object_transform, rotation(-90, vec3(1,0,0)));
				object_transform = mult( object_transform, scale(1, -1, 1));
				self.drawOneAxis(object_transform);
				object_transform = rotation(90, vec3(0,1,0));
				object_transform = mult( object_transform, scale(-1, 1, 1));
				self.drawOneAxis(object_transform);				
			} )(this);
			
																													// Only draw this set of axes if it is the one selected through the user interface.
																													this.draw = function( current, graphicsState, model_transform, material ) 	{ 	
																														if( this.basis_selection == current ) shape.prototype.draw.call(this, graphicsState, model_transform, material );	}	

																														this.init_buffers();
																													}
																													inherit(axis, shape);



function text_line( string_size )		// Draws a rectangle textured with images of ASCII characters over each quad, spelling out a string.
{
	shape.call(this);

	this.populate = ( function ( self, max_size ) 
	{	
		self.max_size = max_size;
		var object_transform = mat4();
		for( var i = 0; i < max_size; i++ )
		{
			rectangular_strip.prototype.populate( self, 1, object_transform );
			object_transform = mult( object_transform, translation( 0, 0, -.7 ));
		}
	} )( this, string_size );

	this.init_buffers();

	this.draw = function( graphicsState, model_transform, heads_up_display, color ) 
	{
		if( heads_up_display )			{	gl.disable( gl.DEPTH_TEST );	var temp_camera_transform = graphicsState.camera_transform;	graphicsState.camera_transform = mat4();	}
		shape.prototype.draw.call(this, graphicsState, model_transform, new Material( color, 1, 0, 0, 40, "text.png" ) );	
		if( heads_up_display )			{	gl.enable(  gl.DEPTH_TEST );		graphicsState.camera_transform = temp_camera_transform;	}
	}

	this.set_string = function( line )
	{
		for( var i = 0; i < this.max_size; i++ )
		{
			var row = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) / 16 ),
			col = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) % 16 );

			var skip = 3, size = 32, sizefloor = size - skip;
			var dim = size * 16, 	left  = (col * size + skip) / dim, 			top    = (row * size + skip) / dim, 
			right = (col * size + sizefloor) / dim, 	bottom = (row * size + sizefloor + 5) / dim;

			this.texture_coords[ 4 * i ]	 = vec2( right, 1 - top );
			this.texture_coords[ 4 * i + 1 ] = vec2( left,  1 - top );
			this.texture_coords[ 4 * i + 2 ] = vec2( right, 1 - bottom );
			this.texture_coords[ 4 * i + 3 ] = vec2( left,  1 - bottom );
		}

		gl.bindBuffer( gl.ARRAY_BUFFER, this.graphics_card_buffers[2]);
		gl.bufferData( gl.ARRAY_BUFFER, flatten(this.texture_coords), gl.STATIC_DRAW );
	}

}
inherit(text_line, shape);
