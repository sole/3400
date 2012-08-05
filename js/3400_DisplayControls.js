function CompassDisplay(width, height) {
	var canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d'),
		halfWidth = width / 2,
		halfHeight = height / 2,
		textHeight = Math.round(height / 15);
	canvas.width = width;
	canvas.height = height;

	this.direction = 0; // in radians
	this.domElement = canvas;

	ctx.font = textHeight + 'pt monospace';

	this.update = function() {
		ctx.clearRect(0, 0, width, height);

		ctx.strokeStyle = '#fff';
		var r = Math.min( halfWidth, halfHeight ),
			gap = r * 0.1,
			numDivisions = 32, r2 = r - gap, r1 = r2 - gap;

		var angle = this.direction >= 0 ? this.direction%360 : 360 + this.direction%360,
			txt = StringFormat.pad(Math.floor(angle), 4, '0');
		ctx.fillStyle = '#fff';
		ctx.fillText( txt, halfWidth - ctx.measureText(txt).width/2, halfHeight + textHeight/2 );

		ctx.save();
		ctx.translate(width/2, height/2);
		ctx.rotate( -this.direction * Math.PI / 180); // we're deviating from north not rotating in ITS direction
		
		for(var i = 0, increase = 2 * Math.PI / numDivisions, alpha = 0; i < numDivisions; i++, alpha += increase) {
			var sin = Math.sin(alpha),
				cos = Math.cos(alpha);
		
			if(i % 4 == 0) {
				ctx.lineWidth = 3;
			} else {
				ctx.lineWidth = 0.5;
			}
			ctx.beginPath();
			ctx.moveTo(r1 * sin, r1 * cos);
			ctx.lineTo(r2 * sin, r2 * cos);
			ctx.closePath();
			ctx.stroke();

		}

		ctx.fillText('N', -ctx.measureText('N').width/2, -height/4); // canvas 'Y' go the unexpected way

		ctx.restore();

		// The fixed dial shows where we're pointing to now
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo( halfWidth, halfHeight - textHeight/2 - gap );
		ctx.lineTo( halfWidth, gap );
		ctx.closePath();
		ctx.stroke();
	}
}

function PitchAndRollDisplay(width, height) {
	var canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d'),
		halfWidth = width / 2,
		halfHeight = height / 2,
		horizonWidth = width / 4,
		separationsWidth = width / 20,
		gap = Math.min(width, height) / 10,
		textHeight = height / 20;

	canvas.width = width;
	canvas.height = height;

	this.pitch = 0;
	this.roll = 0;
	this.maximumPitch = 90;

	ctx.font = textHeight + 'pt monospace';
	ctx.fillStyle = 'white';

	this.update = function() {
		ctx.clearRect(0, 0, width, height);


		// define clipping
		ctx.beginPath();
		ctx.moveTo(halfWidth, halfHeight);
		ctx.arc(halfWidth, halfHeight, halfWidth - gap, 0, Math.PI * 2, true);
		ctx.clip();

		ctx.save();
	
		ctx.translate( halfWidth, halfHeight + height * this.pitch / this.maximumPitch );

		// background (earth/sky)
		ctx.save();
		ctx.rotate( this.roll );
		ctx.translate( -halfWidth, 0 );

		// earth
		ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
		ctx.beginPath();
		ctx.fillRect(0, 0, width, height + halfHeight);
		ctx.fill();

		// sky
		ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
		ctx.beginPath();
		ctx.fillRect(0, -height - halfHeight, width, height + halfHeight);
		ctx.fill();


		ctx.restore();

		// horizon line
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 1;
		
		ctx.beginPath();
		ctx.moveTo( -horizonWidth, 0 );
		ctx.lineTo( horizonWidth, 0 );
		ctx.stroke();

		// and more
		var numSeparations = 15 * 2,
			increase = 2 * height / numSeparations;

		ctx.lineWidth = 1;

		for(var i = 0; i <= numSeparations; i++) {
			
			var y = -height + i * increase, w = separationsWidth;

			if(y == 0) {
				continue;
			}

			if(i % 5 == 0) {
				w *= 2;
				var txt;
				txt = Math.floor((Math.abs(y) / height) * this.maximumPitch);
				ctx.fillText(txt, w + textHeight, y + textHeight * 0.5);
			}
			
			ctx.beginPath();
			ctx.moveTo( -w, y );
			ctx.lineTo( w, y );
			ctx.stroke();
		}

		ctx.restore();

		// And where we actually are
		ctx.lineWidth = 3;
		ctx.strokeStyle = 'white';
		ctx.beginPath();
		ctx.moveTo(gap * 2, halfHeight);
		ctx.lineTo(halfWidth - gap, halfHeight);
		ctx.lineTo(halfWidth - gap, halfHeight + gap);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(width - gap * 2, halfHeight);
		ctx.lineTo(halfWidth + gap, halfHeight);
		ctx.lineTo(halfWidth + gap, halfHeight + gap);
		ctx.stroke();

	}

	this.domElement = canvas;
}

