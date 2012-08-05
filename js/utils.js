UTILS = {
	getAxis: function(range) {
		range = range || 1000;
		var axis = [ 
			{ points: [ [0, 0, 0], [range, 0, 0] ], color: 0xFF0000}, // +X
			{ points: [ [0, 0, 0], [-range, 0, 0] ], color: 0x800000}, // -X
			{ points: [ [0, 0, 0], [0, range, 0] ], color: 0x00FF00}, // +Y
			{ points: [ [0, 0, 0], [0, -range, 0] ], color: 0x008000}, // -Y
			{ points: [ [0, 0, 0], [0, 0, range] ], color: 0x0000FF}, // +Z
			{ points: [ [0, 0, 0], [0, 0, -range] ], color: 0x000080} // -Z

		]
		
		var axisObject = new THREE.Object3D();
		
		for(var m = 0; m < axis.length; m++) {
			var ax = axis[m],
				geom = new THREE.Geometry();
			for(var j = 0; j < ax.points.length; j++) {
				var p = ax.points[j];
				geom.vertices.push(new THREE.Vector3(p[0], p[1], p[2] ));
			}
			var mat = new THREE.LineBasicMaterial({color: ax.color, linewidth: 2 });
			var ax_line = new THREE.Line(geom, mat);
			ax_line.position.x = 0;
			ax_line.position.y = 0;
			ax_line.position.z = 0;
			axisObject.add(ax_line);
		}
		
		return axisObject;
	},

	rangeRand: function(lowerBound, upperBound) {
		lowerBound = lowerBound || -1;
		upperBound = upperBound || 1;

		var diff = (upperBound - lowerBound);

		return lowerBound + Math.random() * diff;
		//return lowerBound + diff * (0.5 + Math.random());
	}
}
