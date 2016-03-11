/*--------------------- Important Variable and Constants ---------------------*/

var platform = document.getElementById('platform'),
platformAngle = 0;

const PLATFORM_CRX = 11.5, PLATFORM_CRY = 225,
// x- and y-coordinates of platform's center of rotation
PLATFORM_CX = PLATFORM_CRX, PLATFORM_CY = PLATFORM_CRY - 0.750036327,
// x- and y-coordinates of platform's center when platformAngle = 0
PLATFORM_L = 7.5, PLATFORM_H = 1.15648170572;
// half of platform's length and height

platform.setAttributeNS(null, 'x', PLATFORM_CRX);
platform.setAttributeNS(null, 'y', PLATFORM_CRY);


var Z = document.getElementById('Z');

const Z_L1 = 0.85242070115,
// horizontal distance between Z's leftmost point and his center of rotation
Z_L2 = 0.94757929883,
// horizontal distance between Z's rightmost point and his center of rotation
Z_H = 1.09081803005;
// vertical distance between Z's bottom-most point and his center of rotation

Z.setAttributeNS(null, 'x', PLATFORM_CX - Z_L2 / 2 + Z_L1 / 2);
Z.setAttributeNS(null, 'y', PLATFORM_CY - PLATFORM_H - Z_H);

/*----------------------------- Platform Control -----------------------------*/

var svg = document.getElementById('canvas'),
pointGrabbed = svg.createSVGPoint(),
pointDraggedTo = svg.createSVGPoint();

function change_platform_angle() {
	pointDraggedTo =
	pointDraggedTo.matrixTransform(svg.getScreenCTM().inverse());

	platformAngle +=
	Math.atan2(
		pointDraggedTo.y - PLATFORM_CRY, pointDraggedTo.x - PLATFORM_CRX
		) -
	Math.atan2(
		pointGrabbed.y - PLATFORM_CRY, pointGrabbed.x - PLATFORM_CRX
		);
	platform.setAttributeNS(
		null, 'transform',
		'rotate(' + platformAngle * 180 / Math.PI + ' ' + PLATFORM_CRX + ' ' +
		PLATFORM_CRY + ')'
		);

	pointGrabbed.x = pointDraggedTo.x;
	pointGrabbed.y = pointDraggedTo.y;
}

function drag_platform_mouse(evt) {
	pointDraggedTo.x = evt.clientX;
	pointDraggedTo.y = evt.clientY;
	change_platform_angle();
}

function drag_platform_touch(evt) {
	pointDraggedTo.x = evt.touches[0].clientX;
	pointDraggedTo.y = evt.touches[0].clientY;
	change_platform_angle();
}

function drop_platform_mouse(evt) {
	document.onmousemove = null;
	document.onmouseup = null;

	svg.style.cursor = 'url(\'static/hand1.cur\'),auto'; // open palm
	platform.style.cursor = 'url(\'static/hand2.cur\'),auto'; // half-open palm
}

function drop_platform_touch(evt) {
	document.ontouchmove = null;
	document.ontouchend = null;
}

platform.addEventListener('mousedown', function (evt) {
	pointGrabbed.x = evt.clientX;
	pointGrabbed.y = evt.clientY;
	pointGrabbed =
	pointGrabbed.matrixTransform(svg.getScreenCTM().inverse());

	document.onmousemove = drag_platform_mouse;
	document.onmouseup = drop_platform_mouse;

	svg.style.cursor = 'url(\'static/hand3.cur\'),auto'; // closed palm
	platform.style.cursor = 'url(\'static/hand3.cur\'),auto'; // closed palm
});

platform.addEventListener('touchstart', function (evt) {
	pointGrabbed.x = evt.touches[0].clientX;
	pointGrabbed.y = evt.touches[0].clientY;
	pointGrabbed =
	pointGrabbed.matrixTransform(svg.getScreenCTM().inverse());

	document.ontouchmove = drag_platform_touch;
	document.ontouchend = drop_platform_touch;
});

/*--------------------------------- Z Motion ---------------------------------*/

const FORWARD = 1, BACKWARD = -1;

var Zdirection = FORWARD,
// Z starts off facing FORWARD
Zx = parseInt(Z.getAttributeNS(null, 'x')),
Zy = parseInt(Z.getAttributeNS(null, 'y')),
// x- and y-coordinates of Z's center of mass (center of rotation)
Zvx = 0, Zvy = 0,
// x- and y-components of the velocity of Z's center of mass
Zangle = 0,
// Z's current angle relative to the horizontal in rad
Zanglev = 0,
// Z's current angular velocity in rad/s
Zpower = 0;
// Z's current maximum power output in J/s

const FRONT_WHEEL_DX = 0.56393989983, FRONT_WHEEL_DY = 0.71018363939,
// x- and y-coordinates of the front wheel's center relative to the center of
// mass when Zangle is 0
BACK_WHEEL_DX = -0.46878130217, BACK_WHEEL_DY = 0.71018363939,
// x- and y-coordinates of the back wheel's center relative to the center of
// mass when Zangle is 0
WHEEL_R = 0.36060100166,
// radius of the front and back wheels in m
Z_VITALS_DX = 0.22, Z_VITALS_DY = -0.2, Z_VITALS_R = 0.75,
// define a circle covering all of Z's vital organs
Z_MASS = 82.150, Z_MOMENT_OF_INERTIA = 8.515,
// source: http://dc.uwm.edu/cgi/viewcontent.cgi?article=1990&context=etd
// Z's total mass (bike included) in kg, Z's moment of inertia about center of
// mass in kg*m^2 (Z is assumed to be in an "Aerobars" position)
MS_PER_STEP = 1000 / 60,
// 1000 ms per 60 steps
TIME_STEP = MS_PER_STEP / 1000.0,
// length in seconds of each step
GRAVITY = 9.81;
// gravitational acceleration in m/s^2

// Returns a number representing the platform's edge with which the circle
// with radius r centered at cxPrime, cyPrime (prime meaning that the
// coordinates are given relative to the platform when platformAngle is 0) is
// colliding. A collision is considered to be when the wheel intersects with the
// platform (tangential contact does not count).
const NO_EDGE = 0, TOP_EDGE = 1, LEFT_EDGE = 2, RIGHT_EDGE = 3, BOTTOM_EDGE = 4;
function circlePlatformCollisionEdge(cxPrime, cyPrime, r) {
	var dx = Math.abs(cxPrime - PLATFORM_CX);
	var dy = Math.abs(cyPrime - PLATFORM_CY);

	console.log('dx = ' + dx + ', dy = ' + dy + ", h + r = " + (PLATFORM_H + r));
	if (dx >= PLATFORM_L + r)       { return NO_EDGE;     }
	if (dy >= PLATFORM_H + r)       { return NO_EDGE;     }

	if (dx < PLATFORM_L) {
		if (cyPrime < PLATFORM_CY)  { return TOP_EDGE;    }
		else                        { return BOTTOM_EDGE; }
	}
	if (dy < PLATFORM_H) {
		if (cxPrime < PLATFORM_CX)  { return LEFT_EDGE;   }
		else                        { return RIGHT_EDGE;  }
	}

	dx -= PLATFORM_L;
	dy -= PLATFORM_H;
	if (dx * dx + dy * dy < r * r) {
		if (cyPrime < PLATFORM_CY) {
			if (cxPrime < PLATFORM_CX) {
				if (cyPrime + cxPrime <
					PLATFORM_CX - PLATFORM_L + PLATFORM_CY - PLATFORM_H)
					 { return TOP_EDGE;    }
				else { return LEFT_EDGE;   }
			}
			else {
				if (cyPrime + cxPrime <
					PLATFORM_CX + PLATFORM_L + PLATFORM_CY - PLATFORM_H)
					 { return TOP_EDGE;    }
				else { return RIGHT_EDGE;  }
			}
		}
		else {
			if (cxPrime < PLATFORM_CX) {
				if (cyPrime + cxPrime <
					PLATFORM_CX - PLATFORM_L + PLATFORM_CY + PLATFORM_H)
					 { return BOTTOM_EDGE; }
				else { return LEFT_EDGE;   }
			}
			else {
				if (cyPrime + cxPrime <
					PLATFORM_CX + PLATFORM_L + PLATFORM_CY + PLATFORM_H)
					 { return BOTTOM_EDGE; }
				else { return RIGHT_EDGE;  }
			}
		}
	}
	else { return NO_EDGE; }
}

function platformActOnWheel(cx, cy) {
	var cxPrime =
	Math.cos(-platformAngle) * (cx - PLATFORM_CRX) -
	Math.sin(-platformAngle) * (cy - PLATFORM_CRY) + PLATFORM_CRX;
	var cyPrime =
	Math.sin(-platformAngle) * (cx - PLATFORM_CRX) +
	Math.cos(-platformAngle) * (cy - PLATFORM_CRY) + PLATFORM_CRY;

	var collisionEdge = circlePlatformCollisionEdge(cxPrime, cyPrime, WHEEL_R);
	if (collisionEdge == NO_EDGE) {
		return;
	}

	alert(Zvx + ', ' + Zvy + ' ' + collisionEdge);

	var vNeedsChange = false,
	curvxPrime =
	Math.cos(-platformAngle) * Zvx - Math.sin(-platformAngle) * Zvy,
	curvyPrime =
	Math.sin(-platformAngle) * Zvx + Math.cos(-platformAngle) * Zvy,
	newvxPrime, newvyPrime, vChange, forceAngle, cpTocmx, cpTocmy;
	// cpTocm stands for "collision point to center of mass"
	switch (collisionEdge) {
		case TOP_EDGE:
			var maxvyPrime =
			-(WHEEL_R - PLATFORM_CY + PLATFORM_H + cyPrime) / TIME_STEP;
			if (curvyPrime > maxvyPrime) {
				vNeedsChange = true;
				newvxPrime = curvxPrime;
				newvyPrime = maxvyPrime;
				vChange = maxvyPrime - curvyPrime;
				forceAngle = 3 * Math.PI / 2;

				cpTocmx = Math.cos(-platformAngle) * (Zx - PLATFORM_CRX) -
				Math.sin(-platformAngle) * (Zy - PLATFORM_CRY) + PLATFORM_CRX -
				cxPrime;
				cpTocmy = Math.sin(-platformAngle) * (Zx - PLATFORM_CRX) +
				Math.cos(-platformAngle) * (Zy - PLATFORM_CRY) + PLATFORM_CRY -
				(cyPrime + WHEEL_R);
			}
			break;
		case LEFT_EDGE:
			var maxvxPrime =
			-(WHEEL_R - PLATFORM_CX + PLATFORM_L + cxPrime) / TIME_STEP;
			if (curvxPrime > maxvxPrime) {
				vNeedsChange = true;
				newvxPrime = maxvxPrime;
				newvyPrime = curvyPrime;
				vChange = maxvxPrime - curvxPrime;
				forceAngle = Math.PI;

				cpTocmx = Math.cos(-platformAngle) * (Zx - PLATFORM_CRX) -
				Math.sin(-platformAngle) * (Zy - PLATFORM_CRY) + PLATFORM_CRX -
				(cxPrime + WHEEL_R);
				cpTocmy = Math.sin(-platformAngle) * (Zx - PLATFORM_CRX) +
				Math.cos(-platformAngle) * (Zy - PLATFORM_CRY) + PLATFORM_CRY -
				cyPrime;
			}
			break;
		case RIGHT_EDGE:
			var minvxPrime =
			(WHEEL_R - cxPrime + PLATFORM_CX + PLATFORM_L) / TIME_STEP;
			if (curvxPrime < minvxPrime) {
				vNeedsChange = true;
				newvxPrime = minvxPrime;
				newvyPrime = curvyPrime;
				vChange = minvxPrime - curvxPrime;
				forceAngle = 0;

				cpTocmx = Math.cos(-platformAngle) * (Zx - PLATFORM_CRX) -
				Math.sin(-platformAngle) * (Zy - PLATFORM_CRY) + PLATFORM_CRX -
				(cxPrime - WHEEL_R);
				cpTocmy = Math.sin(-platformAngle) * (Zx - PLATFORM_CRX) +
				Math.cos(-platformAngle) * (Zy - PLATFORM_CRY) + PLATFORM_CRY -
				cyPrime;
			}
			break;
		default: // BOTTOM_EDGE
			var minvyPrime =
			(WHEEL_R - cyPrime + PLATFORM_CY + PLATFORM_H) / TIME_STEP;
			if (curvyPrime < minvyPrime) {
				vNeedsChange = true;
				newvxPrime = curvxPrime;
				newvyPrime = minvyPrime;
				vChange = minvyPrime - curvyPrime;
				forceAngle = Math.PI / 2;

				cpTocmx = Math.cos(-platformAngle) * (Zx - PLATFORM_CRX) -
				Math.sin(-platformAngle) * (Zy - PLATFORM_CRY) + PLATFORM_CRX -
				cxPrime;
				cpTocmy = Math.sin(-platformAngle) * (Zx - PLATFORM_CRX) +
				Math.cos(-platformAngle) * (Zy - PLATFORM_CRY) + PLATFORM_CRY -
				(cyPrime - WHEEL_R);
			}
	}

	if (vNeedsChange) {
		// Change the translational velocity.
		Zvx = Math.cos(platformAngle) * newvxPrime -
		Math.sin(platformAngle) * newvyPrime;
		Zvy = Math.sin(platformAngle) * newvxPrime +
		Math.cos(platformAngle) * newvyPrime;

		// Change the angular velocity.
		// omega = torque * time / momentOfInertia
		// torque = ||force|| * ||radius|| * Math.sin(theta)
		// force = impulse / time
		// impulse = mass * (vFinal - vInitial)
		// (Note that "* time" and "/ time" cancel out.)
		Zanglev += Z_MASS * vChange / Z_MOMENT_OF_INERTIA *
		Math.sqrt(cpTocmx * cpTocmx + cpTocmy * cpTocmy) *
		Math.sin(Math.atan2(cpTocmy, cpTocmx) - forceAngle);
	}
}

function platformActOnZ() {
	var cx =
	Math.cos(Zangle) * Z_VITALS_DX - Math.sin(Zangle) * Z_VITALS_DY + Zx;
	var cy =
	Math.sin(Zangle) * Z_VITALS_DX + Math.cos(Zangle) * Z_VITALS_DY + Zy;
	if (
		circlePlatformCollisionEdge(
			Math.cos(-platformAngle) * (cx - PLATFORM_CRX) -
			Math.sin(-platformAngle) * (cy - PLATFORM_CRY) + PLATFORM_CRX,
			Math.sin(-platformAngle) * (cx - PLATFORM_CRX) +
			Math.cos(-platformAngle) * (cy - PLATFORM_CRY) + PLATFORM_CRY,
			Z_VITALS_R
			) != NO_EDGE
		) {
		alert('You killed Mr. Z!');
	}
	platformActOnWheel(
		Math.cos(Zangle) * FRONT_WHEEL_DX -
		Math.sin(Zangle) * FRONT_WHEEL_DY + Zx,
		Math.sin(Zangle) * FRONT_WHEEL_DX +
		Math.cos(Zangle) * FRONT_WHEEL_DY + Zy
		);
	platformActOnWheel(
		Math.cos(Zangle) * BACK_WHEEL_DX -
		Math.sin(Zangle) * BACK_WHEEL_DY + Zx,
		Math.sin(Zangle) * BACK_WHEEL_DX +
		Math.cos(Zangle) * BACK_WHEEL_DY + Zy
		);
}

function moveZ() {
	Zvy += 0.5 * GRAVITY * TIME_STEP * TIME_STEP;
	platformActOnZ();

	Zx += Zvx * TIME_STEP;
	Zy += Zvy * TIME_STEP;
	Zangle += Zanglev * TIME_STEP;

	Z.setAttributeNS(null, 'x', Zx);
	Z.setAttributeNS(null, 'y', Zy);
	Z.setAttributeNS(
		null, 'transform',
		'rotate(' + Zangle + ' ' + Zx + ' ' + Zy + ')'
		);
}

moveZ();
setInterval(moveZ, MS_PER_STEP);
