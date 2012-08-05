function buildGurrus(params) {
	var numGurrus = 10, // 15
		numSpikes = 20,
		radius = 45,
		distRadius = 150,
		gurrusObj = new THREE.Object3D(),
		material = new THREE.MeshLambertMaterial({ color: 0x00FF00, shading: THREE.FlatShading });

	for(var i = 0; i < numGurrus; i++) {
		var vertices = [],
			faces = [],
			geometry = new THREE.Geometry(),
			ang = Math.PI * 2 * i / numGurrus,
			px = distRadius * Math.sin(ang),
			py = 0,
			pz = distRadius * Math.cos(ang),
			radiusGurru = radius * (1 + 0.25 * Math.sin(ang * 2));

		for(var j = 0; j < numSpikes; j++) {

			for(k = 0; k < 3; k++) {

				vertices.push( new THREE.Vector3(
					radiusGurru * (Math.random() - Math.random()),
					radiusGurru * (Math.random() - Math.random()),
					radiusGurru * (Math.random() - Math.random())
				));

			}

			var numV = vertices.length - 1;
			faces.push(new THREE.Face3(numV - 2, numV - 1, numV));
		}

		geometry.vertices = vertices;
		geometry.faces = faces;
		geometry.computeFaceNormals();
		var mesh = new THREE.Mesh(geometry, material);
		if(!params.buggyDriver) {
			mesh.doubleSided = true;
		}
		mesh.position.set( px, py, pz );
		
		// The 'mysterious center'
		var centerMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000, shading: THREE.FlatShading }),
			centerGeometry = new THREE.Geometry(),
			centerVertices = [],
			centerFaces = [],
			centerMesh,
			centerRadius = 10;

		centerVertices.push( new THREE.Vector3(-centerRadius, 0, 0) );
		centerVertices.push( new THREE.Vector3(centerRadius, 0, 0)  );
		centerVertices.push( new THREE.Vector3(0, centerRadius, 0)  );
		centerFaces.push( new THREE.Face3(0, 1, 2) );

		centerGeometry.vertices = centerVertices;
		centerGeometry.faces = centerFaces;
		centerGeometry.computeFaceNormals();

		centerMesh = new THREE.Mesh( centerGeometry, centerMaterial );
		if(!params.buggyDriver) {
			centerMesh.doubleSided = true;
		}
		centerMesh.position.set( 0, 0, 0 );
		centerMesh.rotation.set( Math.random(), Math.random(), Math.random() );

		mesh.add( centerMesh );
		
		gurrusObj.add(mesh);
	}




	return gurrusObj;
}

function buildGround(params) {

	var worldLength = params.worldLength || 500,
		len_x = 2 * worldLength, len_z = 2 * worldLength,
		src_x = -0.5 * len_x, src_z = -0.5 * len_z,
		num_x = 300, num_z = num_x, // was 200
		seg_x = len_x / num_x, seg_z = len_z / num_z,
		px, py, pz, px0, px0, pz0, v1, v2, v3,
		face, normal,
		vertices = [], faces = [],
		geometry, material, mesh;

	px = 0;
	py = 0;
	pz = 0;

	function randomHeight() {
		return Math.random() * 1.5;
	}

	for(var j = 0; j < num_z; j++) {
		pz0 = pz;
		pz = src_z + j * seg_z;

		for(var i = 0; i < num_x; i++) {
			py0 = py;
			py = Math.random(0, 4);

			px0 = px;
			px = src_x + i * seg_x;

			if(i > 0 && j > 0) {

				// upper triangle
				vertices.push( new THREE.Vector3( px0, randomHeight(), pz0 ) );
				vertices.push( new THREE.Vector3( px0, randomHeight(), pz ) );
				vertices.push( new THREE.Vector3( px, randomHeight(), pz0 ) );
				
				v3 = vertices.length - 1;
				v2 = v3 - 1;
				v1 = v2 - 1;

				face = new THREE.Face3( v1, v2, v3 );
				faces.push( face );

				// lower triangle
				vertices.push( new THREE.Vector3( px0, randomHeight(), pz ) );
				vertices.push( new THREE.Vector3( px, randomHeight(), pz ) );
				vertices.push( new THREE.Vector3( px, randomHeight(), pz0 ) );
				
				v3 = vertices.length - 1;
				v2 = v3 - 1;
				v1 = v2 - 1;

				face = new THREE.Face3( v1, v2, v3 );
				faces.push( face );


			}
		}
	}

	geometry = new THREE.Geometry();
	geometry.vertices = vertices;
	geometry.faces = faces;
	geometry.computeFaceNormals();

	material = new THREE.MeshLambertMaterial( { color: 0x00ff00, shading: THREE.FlatShading } );

	mesh = new THREE.Mesh(geometry, material);

	if(!params.buggyDriver) {
		mesh.doubleSided = true;
	}
	return mesh;
}

function buildRotabugs() {
	var bugs = new THREE.Object3D(),
		num_bugs = 10,
		num_legs = 20,
		ang_step = Math.PI * 2.0 / num_legs,
		radius = 5,
		dist_radius = 70,
		legMaterial = new THREE.LineBasicMaterial({color: 0x00FF00, linewidth: 1}),
		feetMaterial = new THREE.ParticleBasicMaterial({color: 0x00FF00, size: 0.25});

	for(var i = 0; i < num_bugs; i++) {
		var bug = new THREE.Object3D(),
			legsVertices = [],
			legsGeometry = new THREE.Geometry(),
			feetVertices = [],
			feetGeometry = new THREE.Geometry(),
			originalVertices = [],
			bugRadius = Math.random() * radius + 1,
			sphereGeometry = new THREE.SphereGeometry( bugRadius, num_legs/2, num_legs/2 );
			
		var v0 = new THREE.Vector3(0, 0, 0),
			sphereVertices = sphereGeometry.vertices;
		
		for(var j = 0; j < sphereVertices.length; j++) {
			var v = sphereVertices[j];
			legsVertices.push(v0);
			legsVertices.push(v);
			
			feetVertices.push(v);
			originalVertices.push(v.clone());
			
		}

		legsGeometry.vertices = legsVertices;
		legsGeometry.computeVertexNormals();
		legsGeometry.computeBoundingSphere();
		var legs = new THREE.Line(legsGeometry, legMaterial);
		bug.add(legs);
		
		// "feet"
		feetGeometry.vertices = feetVertices;
		var feet = new THREE.ParticleSystem(feetGeometry, feetMaterial);
		bug.add(feet);
		
		bug.originalVertices = originalVertices;
		bug.legs = legs;
		bug.feet = feet;

		bug.position.x = dist_radius * (Math.random() - Math.random());
		bug.position.y = radius;
		bug.position.z = dist_radius * (Math.random() - Math.random());

		bug.originalPosition = new THREE.Vector3(bug.position.x, bug.position.y, bug.position.z);

		bugs.add(bug);
	}

	return bugs;

}

function buildPlancton(params) {
	var plancton = new THREE.Object3D(),
		num = 2000,
		range = 100,
		material = new THREE.MeshLambertMaterial({ color: 0x00ff00, shading: THREE.FlatShading });

	for(var i = 0; i < num; i++) {
		var vertices = [],
			faces = [],
			geometry = new THREE.Geometry(),
			tri_length = 0.1 + 0.4 * Math.random();

		vertices.push(new THREE.Vector3(0, 0, 0));
		vertices.push(new THREE.Vector3(tri_length, 0, 0));
		vertices.push(new THREE.Vector3(0, tri_length, 0));

		faces.push(new THREE.Face3( 0, 1, 2));

		geometry.vertices = vertices;
		geometry.faces = faces;
		geometry.computeFaceNormals();

		var tri = new THREE.Mesh(geometry, material);

		tri.position.x = UTILS.rangeRand(-range, range);
		tri.position.y= UTILS.rangeRand(-range, range);
		tri.position.z = UTILS.rangeRand(-range, range);

		tri.rotation.x = UTILS.rangeRand(-range, range);
		tri.rotation.y = UTILS.rangeRand(-range, range);
		tri.rotation.z = UTILS.rangeRand(-range, range);

		if(!params.buggyDriver)
			tri.doubleSided = true;

		plancton.add(tri);
	}

	return plancton;
}

