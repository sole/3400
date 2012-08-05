var CollisionUtils = {
	collides : function( shipPosition, dummyCenter, dummyA, dummyB, displacement, obstacles) {
		var center = dummyCenter.matrixWorld.getPosition().clone(),
			a = dummyA.matrixWorld.getPosition().clone(),
			b = dummyB.matrixWorld.getPosition().clone(),
			directionVector = this.getDirectionVector(shipPosition, dummyCenter),
			rayA = new THREE.Ray(a, directionVector),
			rayB = new THREE.Ray(b, directionVector),
			intersections = [],
			intersectionsA = rayA.intersectObjects( obstacles ),
			intersectionsB = rayB.intersectObjects( obstacles );

		if(intersectionsA.length == 0 && intersectionsB.length > 0) {
			intersections = intersectionsB;
		} else if(intersectionsB.length == 0 && intersectionsA.length > 0) {
			intersections = intersectionsA;
		} else if(intersectionsA.length > 0 && intersectionsB.length > 0) {
			if(intersectionsA[0].distance > intersectionsB[0].distance) {
				intersections = intersectionsB;
			} else {
				intersections = intersectionsA;
			}
		}

		if( intersections.length > 0 ) {
			var obstacle = intersections[0];
				
			if( obstacle.distance <= Math.abs(displacement) ) {
				return true;
			}
		}

		return false;

	},
	
	collidesMultiple : function( shipPosition, dummyCenter, dummyPoints, displacement, obstacles) {
		var center = dummyCenter.matrixWorld.getPosition().clone(),
			directionVector = this.getDirectionVector(shipPosition, dummyCenter);

		for(var i = 0; i < dummyPoints.length; i++) {
			var p = dummyPoints[i].matrixWorld.getPosition().clone(),
				ray = new THREE.Ray(p, directionVector),
				intersections = ray.intersectObjects( obstacles );

			if(intersections !== undefined && intersections.length > 0) {
				var obstacle = intersections[0];
				if(obstacle.distance <= Math.abs(displacement)) {
					return true;
				}
			}
		}

		return false;

	},

	getDirectionVector : function(shipPosition, centerDummy) {
		return centerDummy.matrixWorld.getPosition().clone().subSelf(shipPosition).normalize();
	}
};
