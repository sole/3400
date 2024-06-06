window.onload = function () {
	var debug = true,
		buggyDriver = false,
		displayWidth,
		displayHeight,
		renderer,
		clock,
		scene,
		camera,
		cameraTarget = new THREE.Vector3(0, 0, -10),
		starting = true,
		worldLength = 500,
		worldPadding = 25,
		minY = 4,
		ship,
		shipTarget = new THREE.Vector3(0, 0, 0),
		currentSpeed = new THREE.Vector3(0, 0, 0),
		currentRotationSpeed = new THREE.Vector3(0, 0, 0),
		rotationX = 0,
		rotationY = 0,
		latitude = 0,
		longitude = 0,
		movingForward = false,
		movingBackward = false,
		movingLeft = false,
		movingRight = false,
		movingUp = false,
		movingDown = false,
		rotatingLeft = false,
		rotatingRight = false,
		rotationEnabled = false,
		viewHalfWidth = window.innerWidth / 2,
		viewHalfHeight = window.innerHeight / 2,
		mouseX = viewHalfWidth,
		mouseY = viewHalfHeight,
		point_light,
		rotaBugs,
		plancton,
		gurrus,
		obstacles = [],
		cockpit,
		compassDisplay,
		pitchAndRollDisplay,
		audioContext,
		soundURLs = [
			"data/malstrom1-arpeggio.ogg", // 0
			"data/malstrom2-vocoder.ogg", // 1
			"data/nn-xt1-bass.ogg", // 2
			"data/nn-xt2-guitar.ogg", // 3
			"data/subtractor1-beep.ogg", // 4
		],
		sounds = [],
		loadingText,
		introText;

	function preSetup() {
		var container = document.getElementById("container"),
			intro = document.getElementById("intro"),
			start = document.getElementById("start");

		// Audio API & WebGL?
		if (AudioDetector.detects(["webAudioSupport", "oggSupport"])) {
			if (!Detector.webgl) {
				Detector.addGetWebGLMessage({ parent: container });
				return;
			}
		}

		container.style.visibility = "hidden";

		start.addEventListener("click", function startClick(e) {
			start.removeEventListener("click", startClick);
			intro.className = "loading";
			start.innerHTML = "Please wait while LOADING";
			loadingText = start;
			introText = document.getElementById("intro_wrapper");
			setTimeout(setup, 100);
		});
	}

	function setup() {
		displayWidth = window.innerWidth;
		displayHeight = window.innerHeight;

		clock = new THREE.Clock();

		renderer = new THREE.WebGLRenderer({ antialias: false });
		renderer.setSize(displayWidth, displayHeight);
		renderer.setClearColorHex(0x000000, 1);
		document.body.appendChild(renderer.domElement);

		// ---

		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0x00000, 0.0225);
		scene.fog.far = 10000;

		ship = new THREE.Object3D();

		var radius = 10,
			//ship_geometry = new THREE.SphereGeometry(radius),
			dummy_definitions = [
				["front_left", [-radius, 0, -radius]],
				["front", [0, 0, -radius]],
				["front_right", [radius, 0, -radius]],
				["front_top_left", [-radius, radius, -radius]],
				["front_top_right", [-radius, radius, -radius]],
				["front_down_left", [-radius, -radius, -radius]],
				["front_down_right", [-radius, -radius, -radius]],

				["back", [0, 0, radius]],
				["back_left", [-radius, 0, radius]],
				["back_right", [radius, 0, radius]],
				["back_top_left", [-radius, radius, radius]],
				["back_top_right", [radius, radius, radius]],
				["back_down_left", [-radius, -radius, radius]],
				["back_down_right", [radius, -radius, radius]],

				["left", [-radius, 0, 0]],
				["right", [radius, 0, 0]],

				["up_left", [-radius, radius, 0]],
				["up", [0, radius, 0]],
				["up_right", [-radius, radius, 0]],

				["down_left", [-radius, -radius, 0]],
				["down", [0, -radius, 0]],
				["down_right", [radius, -radius, 0]],
			];

		ship.dummies = {};

		for (var i = 0; i < dummy_definitions.length; i++) {
			var def = dummy_definitions[i],
				dummy = new THREE.Object3D(),
				p = def[1];

			dummy.position.set(p[0], p[1], p[2]);

			ship.add(dummy);
			ship.dummies[def[0]] = dummy;
		}

		camera = new THREE.PerspectiveCamera(
			60,
			displayWidth / displayHeight,
			1,
			10000
		);
		camera.position = new THREE.Vector3(0, 0, 0);
		camera.lookAt(cameraTarget);
		ship.add(camera);

		ship.position = new THREE.Vector3(0, 100, 0);
		scene.add(ship);
		ship.lookAt(shipTarget);

		cockpit = document.getElementById("cockpit");
		var indicatorW = 150;
		compassDisplay = new CompassDisplay(indicatorW, indicatorW);
		cockpit.appendChild(compassDisplay.domElement);

		pitchAndRollDisplay = new PitchAndRollDisplay(indicatorW, indicatorW);
		cockpit.appendChild(pitchAndRollDisplay.domElement);

		point_light = new THREE.PointLight(0xffffff, 1, 70);
		ship.add(point_light);

		// objects: Gurrus, Ground, Rotobichos, Plancton
		var objectParams = { buggyDriver: buggyDriver, worldLength: worldLength };

		gurrus = buildGurrus(objectParams);
		scene.add(gurrus);
		gurrus.updateMatrixWorld();

		scene.add(buildGround(objectParams));

		rotaBugs = buildRotabugs(objectParams);
		scene.add(rotaBugs);
		rotaBugs.updateMatrixWorld();

		plancton = buildPlancton(objectParams);
		scene.add(plancton);

		// obstacles
		for (var i = 0; i < rotaBugs.children.length; i++) {
			var bug = rotaBugs.children[i],
				collisionMesh;

			bug.updateMatrixWorld();

			computeBoundingBoxRecursive(bug.feet);

			var bbox = bug.feet.geometry.boundingBox,
				width = Math.abs(bbox.min.x - bbox.max.x),
				height = Math.abs(bbox.min.y - bbox.max.y),
				depth = Math.abs(bbox.min.z - bbox.max.z),
				m = 1.05,
				cubeGeom = new THREE.CubeGeometry(m * width, m * height, m * depth),
				collisionMesh = new THREE.Mesh(
					cubeGeom,
					new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true })
				);

			collisionMesh.position.set(0, 0, 0);
			bug.add(collisionMesh);

			bug.collisionMesh = collisionMesh;

			collisionMesh.geometry.computeBoundingBox();
			collisionMesh.visible = false;

			obstacles.push(collisionMesh);
		}

		for (var i = 0; i < gurrus.children.length; i++) {
			obstacles.push(gurrus.children[i]);
			gurrus.children[i].geometry.computeBoundingBox();
		}

		// Events
		document.addEventListener("keydown", onKeyDown, false);
		document.addEventListener("keyup", onKeyUp, false);
		document.addEventListener("mousemove", onMouseMove, false);
		document.addEventListener("mousedown", onMouseDown, false);
		document.addEventListener("mouseup", onMouseUp, false);
		document.addEventListener(
			"contextmenu",
			function (event) {
				event.preventDefault();
			},
			false
		);

		// Sound
		setupSound();
	}

	function onKeyDown(event) {
		switch (event.keyCode) {
			case 38: /*up*/
			case 87:
				/*W*/ movingForward = true;
				break;

			case 40: /*down*/
			case 83:
				/*S*/ movingBackward = true;
				break;

			case 37: /*left*/
			case 65:
				/*A*/ rotatingLeft = true;
				break;

			case 39: /*right*/
			case 68:
				/*D*/ rotatingRight = true;
				break;

			case 84:
				/*T*/ movingUp = true;
				break;
			case 71:
				/*G*/ movingDown = true;
				break;
			case 70:
				/*F*/ movingLeft = true;
				break;
			case 72:
				/*H*/ movingRight = true;
				break;
		}
	}

	function onKeyUp(event) {
		switch (event.keyCode) {
			case 38: /*up*/
			case 87:
				/*W*/ movingForward = false;
				break;

			case 40: /*down*/
			case 83:
				/*S*/ movingBackward = false;
				break;

			case 37: /*left*/
			case 65:
				/*A*/ rotatingLeft = false;
				break;

			case 39: /*right*/
			case 68:
				/*D*/ rotatingRight = false;
				break;

			case 84:
				/*T*/ movingUp = false;
				break;
			case 71:
				/*G*/ movingDown = false;
				break;
			case 70:
				/*F*/ movingLeft = false;
				break;
			case 72:
				/*H*/ movingRight = false;
				break;
		}
	}

	function onMouseMove(event) {
		mouseX = event.pageX - viewHalfWidth;
		mouseY = event.pageY - viewHalfHeight;

		rotationEnabled = true;
	}

	function onMouseDown(event) {
		event.preventDefault();
		event.stopPropagation();

		switch (event.button) {
			case 0:
				movingForward = true;
				break;
			case 2:
				movingBackward = true;
				break;
		}
	}

	function onMouseUp(event) {
		event.preventDefault();
		event.stopPropagation();

		switch (event.button) {
			case 0:
				movingForward = false;
				break;
			case 2:
				movingBackward = false;
				break;
		}
	}

	function setupSound() {
		audioContext = new AudioContext();
		for (var i = 0; i < soundURLs.length; i++) {
			sounds.push({ url: soundURLs[i], loaded: false, loading: false });
		}

		loadFile(sounds[0]);
	}

	function loadFile(sound) {
		var request = new XMLHttpRequest();
		request.open("GET", sound.url, true);
		request.responseType = "arraybuffer";
		request.onload = function () {
			audioContext.decodeAudioData(request.response, function (buffer) {
				if (buffer) {
					addSound(sound.url, buffer);
				}
			});
		};

		request.send();
	}

	function addSound(url, buffer) {
		var i, s;

		for (i = 0; i < sounds.length; i++) {
			s = sounds[i];
			if (s.url == url && s.loaded === false) {
				s.loaded = true;
				s.loading = false;
				s.buffer = buffer;
				break;
			}
		}

		var allLoaded = true;
		for (i = 0; i < sounds.length; i++) {
			s = sounds[i];
			if (!s.loaded && !s.loading) {
				loadFile(s);
				allLoaded = false;
				break;
			}
		}

		loadingText.innerHTML += ".";

		if (allLoaded) {
			introText.style.opacity = 0;
			setTimeout(function () {
				introText.style.visibility = "hidden";
				cockpit_wrapper.style.opacity = 1;
				startPlayingAudio();

				animate();

				var ship_tween = new TWEEN.Tween(ship.position)
					.to({ x: 0, y: 10, z: 0 }, 25000)
					.onComplete(function () {
						starting = false;
					})
					.easing(TWEEN.Easing.Quadratic.Out)
					.start();
			}, 1000);
		}
	}

	function startPlayingAudio() {
		var i,
			pos,
			almostNow = audioContext.currentTime + 0.02,
			preCompressorGain,
			compressor;

		preCompressorGain = audioContext.createGain();
		preCompressorGain.gain.value = 0.9;

		if (audioContext.createDynamicsCompressor) {
			compressor = audioContext.createDynamicsCompressor();
			compressor.ratio = 2.0;
		} else {
			compressor = audioContext.createGain();
			compressor.gain.value = 1.4;
		}

		preCompressorGain.connect(compressor);

		compressor.connect(audioContext.destination);

		function placeSound(sound, position, gainAmount) {
			var panner = audioContext.createPanner(),
				source = audioContext.createBufferSource(),
				gain = audioContext.createGain();

			panner.positionX.setValueAtTime(position.x, audioContext.currentTime);
			panner.positionY.setValueAtTime(position.y, audioContext.currentTime);
			panner.positionZ.setValueAtTime(position.z, audioContext.currentTime);
			panner.panningModel = "equalpower"; //"equalpower"; // 'HRTF' not in Firefox Aurora yet

			source.loop = true;
			source.buffer = sound.buffer;
			source.connect(panner);
			panner.connect(gain);

			panner.coneOuterGain = 0.25;
			panner.coneOuterAngle = 250;
			panner.coneInnerAngle = 0;
			panner.orientationX.value = 0;
			panner.orientationY.value = 1.0;
			panner.orientationZ.value = 0;

			sound.buffer.sampleRate = 44100; // XXX

			gain.gain.value = gainAmount;
			gain.connect(preCompressorGain);

			source.start(almostNow);
		}

		placeSound(sounds[2], new THREE.Vector3(0, 15, 0), 0.8);

		var m = 500,
			genGain = 0.9;

		placeSound(sounds[0], new THREE.Vector3(-m, 0, m), genGain);
		placeSound(sounds[0], new THREE.Vector3(m, 0, -m), genGain);
		placeSound(sounds[1], new THREE.Vector3(m, 0, -m), genGain);
		placeSound(sounds[1], new THREE.Vector3(-m, 0, m), genGain);

		// gurrus -> beeps
		var gurruGain = 4.0 / gurrus.children.length;
		for (i = 0; i < gurrus.children.length; i++) {
			pos = gurrus.children[i].matrixWorld.getPosition().clone();
			pos.y += 2;
			placeSound(sounds[4], pos, gurruGain);
		}

		// rotobugs -> guitar
		var rotoGain = 2.0 / rotaBugs.children.length;
		for (i = 0; i < rotaBugs.children.length; i++) {
			pos = rotaBugs.children[i].matrixWorld.getPosition().clone();
			placeSound(sounds[3], pos, rotoGain);
		}

		// This ensures we always play the sounds from the right places
		// Otherwise we start with an attenuated and then attenuated sound as the
		// position is updated in the next render
		updateSoundPositions(audioContext);
	}

	// ~~~

	function render() {
		renderer.render(scene, camera);
	}

	function computeBoundingSphereRecursive(object) {
		var sphere,
			geometry = object.geometry,
			children = object.children;

		geometry.computeBoundingSphere();

		sphere = geometry.boundingSphere;

		for (var i = 0; i < children.length; i++) {
			var child = children[i],
				childGeom = child.geometry;

			if (child.children.length > 0) {
				computeBoundingSphereRecursive(child);
			} else {
				childGeom.computeBoundingSphere();
			}

			sphere.radius = Math.max(sphere.radius, childGeom.boundingSphere.radius);
		}

		geometry.boundingSphere = sphere;
	}

	function computeBoundingBoxRecursive(object) {
		var box = { min: new THREE.Vector3(), max: new THREE.Vector3() },
			geometry = object.geometry,
			children = object.children;

		function minVec(a, b) {
			var out = new THREE.Vector3(0, 0, 0);

			out.x = Math.min(a.x, b.x);
			out.y = Math.min(a.y, b.y);
			out.z = Math.min(a.z, b.z);

			return out;
		}

		function maxVec(a, b) {
			var out = new THREE.Vector3(0, 0, 0);

			out.x = Math.max(a.x, b.x);
			out.y = Math.max(a.y, b.y);
			out.z = Math.max(a.z, b.z);

			return out;
		}

		geometry.computeBoundingBox();

		if (geometry.boundingBox !== null) {
			box = geometry.boundingBox;
		}

		for (var i = 0; i < children.length; i++) {
			var child = children[i],
				childGeom = child.geometry;

			if (child.children.length > 0) {
				computeBoundingBoxRecursive(child);
			} else {
				childGeom.computeBoundingBox();
			}

			box.min = minVec(box.min, childGeom.boundingBox.min);
			box.max = maxVec(box.max, childGeom.boundingBox.max);
		}

		geometry.boundingBox = box;
	}

	function updateShip(delta) {
		var acceleration = 500,
			frictionAcceleration = 100,
			squaredDelta = Math.pow(delta, 2),
			speedIncrease = squaredDelta * acceleration,
			friction = squaredDelta * frictionAcceleration,
			displacementX = 0,
			displacementY = 0,
			displacementZ = 0,
			ship_pos = ship.position;

		if (!starting) {
			// Simulate "friction"
			["x", "y", "z"].forEach(function (k) {
				var value = currentSpeed[k];
				if (Math.abs(value) > 0) {
					value -= value > 0 ? friction : -friction;

					if (Math.abs(value) <= 0.1) {
						value = 0;
					}

					currentSpeed[k] = value;
				}
			});

			// Update speed according to keys + delta^2*acceleration
			if (movingForward) {
				currentSpeed.z -= speedIncrease;
			} else if (movingBackward) {
				currentSpeed.z += speedIncrease;
			}

			if (movingRight) {
				currentSpeed.x += speedIncrease;
			} else if (movingLeft) {
				currentSpeed.x -= speedIncrease;
			}

			if (movingUp) {
				currentSpeed.y += speedIncrease;
			} else if (movingDown) {
				currentSpeed.y -= speedIncrease;
			}

			// For each axis determine collisions and possibly zero speeds
			var dummies = ship.dummies;

			displacementX = currentSpeed.x * delta;
			displacementY = currentSpeed.y * delta;
			displacementZ = currentSpeed.z * delta;

			// Going forward
			if (currentSpeed.z <= 0) {
				if (
					CollisionUtils.collidesMultiple(
						ship_pos,
						dummies.front,
						[
							dummies.front_left,
							dummies.front_right,
							dummies.front_top_left,
							dummies.front_top_right,
							dummies.front_down_left,
							dummies.front_down_right,
						],
						displacementZ,
						obstacles
					)
				) {
					displacementZ = 0;
					currentSpeed.z = 0;
				}
			}
			// Going backward
			else if (currentSpeed.z > 0) {
				if (
					CollisionUtils.collidesMultiple(
						ship_pos,
						dummies.back,
						[
							dummies.back_left,
							dummies.back_right,
							dummies.back_top_left,
							dummies.back_top_right,
							dummies.back_down_left,
							dummies.back_down_right,
						],
						displacementZ,
						obstacles
					)
				) {
					displacementZ = 0;
					currentSpeed.z = 0;
				}
			}

			// Going right
			if (currentSpeed.x >= 0) {
				if (
					CollisionUtils.collidesMultiple(
						ship_pos,
						dummies.right,
						[
							dummies.front_right,
							dummies.back_right,
							dummies.up_right,
							dummies.down_right,
							dummies.back_top_right,
							dummies.front_top_right,
							dummies.back_down_right,
							dummies.front_down_right,
						],
						displacementX,
						obstacles
					)
				) {
					displacementX = 0;
					currentSpeed.x = 0;
				}
			}
			// Going left
			else if (currentSpeed.x < 0) {
				if (
					CollisionUtils.collidesMultiple(
						ship_pos,
						dummies.left,
						[
							dummies.front_left,
							dummies.back_left,
							dummies.front_top_left,
							dummies.front_down_left,
							dummies.back_top_left,
							dummies.back_down_left,
						],
						displacementX,
						obstacles
					)
				) {
					displacementX = 0;
					currentSpeed.x = 0;
				}
			}

			// Going up
			if (currentSpeed.y >= 0) {
				if (
					CollisionUtils.collidesMultiple(
						ship_pos,
						dummies.up,
						[
							dummies.up_left,
							dummies.up_right,
							dummies.front_top_right,
							dummies.front_top_left,
							dummies.back_top_right,
							dummies.back_top_left,
						],
						displacementY,
						obstacles
					)
				) {
					displacementY = 0;
					currentSpeed.y = 0;
				}
			}
			// Going down
			else if (currentSpeed.y < 0) {
				if (
					CollisionUtils.collidesMultiple(
						ship_pos,
						dummies.down,
						[
							dummies.down_left,
							dummies.down_right,
							dummies.front_down_left,
							dummies.front_down_right,
							dummies.back_down_left,
							dummies.back_down_right,
						],
						displacementY,
						obstacles
					)
				) {
					displacementY = 0;
					currentSpeed.y = 0;
				}
			}

			// Rotations
			var rotationFriction = 20 * squaredDelta,
				rotationIncrease = 50 * delta,
				maxRotation = 1,
				maxAngle = Math.PI / 4;

			if (rotatingLeft) {
				longitude -= rotationIncrease;
				rotationY -= rotationIncrease;
			} else if (rotatingRight) {
				longitude += rotationIncrease;
				rotationY -= rotationIncrease;
			}

			var rotationIncrement = delta * 0.05;

			if (rotationEnabled) {
				longitude += mouseX * rotationIncrement;
				rotationY += mouseX * rotationIncrement;

				latitude += mouseY * rotationIncrement;
				//rotationX += mouseX * rotationIncrement;
			}
		}

		latitude = Math.max(-85, Math.min(85, latitude));
		var phi = ((90 - latitude) * Math.PI) / 180,
			theta = (longitude * Math.PI) / 180;

		ship.translateX(displacementX);
		ship.translateY(displacementY);
		ship.translateZ(displacementZ);

		if (ship.position.z + worldPadding >= worldLength) {
			ship.position.z = -worldLength + worldPadding;
		} else if (ship.position.z - worldPadding <= -worldLength) {
			ship.position.z = worldLength - worldPadding;
		}

		if (ship.position.x + worldPadding >= worldLength) {
			ship.position.x = -worldLength + worldPadding;
		} else if (ship.position.x - worldPadding <= -worldLength) {
			ship.position.x = worldLength - worldPadding;
		}

		shipTarget.x = ship.position.x + 100 * Math.sin(phi) * Math.cos(theta);
		shipTarget.y = ship.position.y + 100 * Math.cos(phi);
		shipTarget.z = ship.position.z + 100 * Math.sin(phi) * Math.sin(theta);

		ship.lookAt(shipTarget);

		if (!starting) {
			// 'sea wavy' movement
			ship.position.y +=
				0.02 * Math.sin(Date.now() * 0.001 + Math.random() * 0.01);

			// Plus a tendency to sink down...
			ship.position.y -= 0.25 * delta;

			// Limit camera Y to never go below a minimum
			if (ship.position.y < minY) {
				ship.position.y = minY;
				currentSpeed.y = 0;
			}
		}
	}

	function updateSoundPositions(ac = null) {
		if (ac === null) {
			ac = audioContext;
		}
		let listener = ac.listener;
		let now = ac.currentTime + 0.001;
		var up = ship.up;

		if (listener.positionX) {
			listener.positionX.setValueAtTime(ship.position.x, now);
			listener.positionY.setValueAtTime(ship.position.y, now);
			listener.positionZ.setValueAtTime(ship.position.z, now);
		} else {
			listener.setPosition(ship.position.x, ship.position.y, ship.position.z);
		}

		if (listener.forwardX) {
			listener.forwardX.setValueAtTime(shipTarget.x, now);
			listener.forwardY.setValueAtTime(shipTarget.y, now);
			listener.forwardZ.setValueAtTime(shipTarget.z, now);
			listener.upX.setValueAtTime(up.x, now);
			listener.upY.setValueAtTime(up.y, now);
			listener.upZ.setValueAtTime(up.z, now);
		} else {
			listener.setOrientation(
				shipTarget.x,
				shipTarget.y,
				shipTarget.z,
				up.x,
				up.y,
				up.z
			);
		}

		// Deprecated and removed method
		// audioContext.listener.setVelocity( currentSpeed.x, currentSpeed.y, currentSpeed.z );

		// Sadly also removed
		// audioContext.listener.speedOfSound = 1560 - ship.position.y; // sound is faster the deeper you go
	}

	function animate() {
		requestAnimationFrame(animate);

		TWEEN.update();

		updateShip(clock.getDelta());

		compassDisplay.direction = rotationY;
		pitchAndRollDisplay.pitch = -latitude;

		compassDisplay.update();
		pitchAndRollDisplay.update();

		updateSoundPositions(audioContext);

		// Either with this or with passing the context to updateSoundPositions ... or
		// otherwise I think the context is being garbage collected and the sound just stops!
		// window.ac = audioContext;

		var t = Date.now() * 0.0001,
			t2 = Date.now() * 0.0005;

		// Update rotabugs
		for (var i = 0, numBugs = rotaBugs.children.length; i < numBugs; i++) {
			var bug = rotaBugs.children[i],
				origVertices = bug.originalVertices,
				legs = bug.legs,
				//legGeomVert = legs.geometry.vertices,
				feet = bug.feet,
				feetGeomVert = feet.geometry.vertices;

			for (var j = 0; j < origVertices.length; j++) {
				var origVtx = origVertices[j],
					feetVtx = feetGeomVert[j],
					angle = t + j + i;

				feetVtx.x = origVtx.x + 0.01 * Math.sin(angle);
				feetVtx.z = origVtx.z + 0.01 * Math.cos(angle);
				feetVtx.y = origVtx.y + Math.sin(angle * 2);
			}

			feet.geometry.verticesNeedUpdate = true;
			legs.geometry.verticesNeedUpdate = true;

			bug.position.y = bug.originalPosition.y + 0.5 * Math.sin(i + t2);
		}

		// Plancton
		var tris = plancton.children;
		for (var i = 0, numTris = tris.length; i < numTris; i++) {
			var tri = tris[i];

			tri.rotation.x += 0.01;
			tri.rotation.y += 0.01;
			tri.rotation.z += 0.01;

			tri.position.x += UTILS.rangeRand(-0.001, 0.001);
			tri.position.y += 0.01 * Math.random();
			if (tri.position.y > 300) {
				tri.position.y = -0.25 * Math.random();
			}
		}

		render();
	}

	// GO!
	preSetup();
	// setup();
	// animate();
};
