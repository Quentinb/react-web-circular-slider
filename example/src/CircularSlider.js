import React, { useEffect, useState, useRef } from 'react';
import { interpolateHcl as interpolateGradient } from 'd3-interpolate';
import range from 'lodash.range';

import { ClockFace } from './ClockFace';

const WAKE_ICON = (
	<g>
		<path
			d="M2,12.9h1.7h3h2.7h3H14c0.4,0,0.7-0.3,0.7-0.7c0-0.4-0.3-0.7-0.7-0.7c-0.9,0-1.7-0.7-1.7-1.7v-4
		c0-2.1-1.5-3.8-3.4-4.2C9,1.6,9,1.4,9,1.3c0-0.5-0.4-1-1-1c-0.5,0-1,0.4-1,1c0,0.2,0,0.3,0.1,0.4c-2,0.4-3.4,2.1-3.4,4.2v4
		c0,0.9-0.7,1.7-1.7,1.7c-0.4,0-0.7,0.3-0.7,0.7C1.3,12.6,1.6,12.9,2,12.9z"
		/>
		<path d="M8,15.7c1.1,0,2.1-0.9,2.1-2.1H5.9C5.9,14.8,6.9,15.7,8,15.7z" />
	</g>
);

const BEDTIME_ICON = (
	<g>
		<path
			d="M11.7,10.5c-3.6,0-6.4-2.9-6.4-6.4c0-0.7,0.1-1.4,0.4-2.1C3.1,2.9,1.2,5.3,1.2,8.1c0,3.6,2.9,6.4,6.4,6.4
		c2.8,0,5.2-1.8,6.1-4.4C13.1,10.4,12.4,10.5,11.7,10.5z"
		/>
		<path d="M8,7.6l2-2.5H8V4.4H11v0.6L9,7.6h2v0.7H8V7.6z" />
		<path d="M11.7,5.4l1.5-1.9h-1.4V3h2.2v0.5l-1.5,1.9h1.5v0.5h-2.2V5.4z" />
		<path d="M9.4,3l1.1-1.4h-1V1.3H11v0.4L9.9,3H11v0.4H9.4V3z" />
	</g>
);

/**
 * Calculates the number of minutes from a given angle on a clock face
 *
 * @param {number} angle - The angle in radians
 * @returns {number} - The number of minutes from the angle
 */
const calculateMinutesFromAngle = (angle) => {
	// Calculate the angle per minute by dividing the total angle around the clock face (2 * Math.PI) by the number of minutes in a day (24 * 60)
	const anglePerMinute = (2 * Math.PI) / (24 * 60);

	// Calculate the number of minutes by dividing the angle by the angle per minute and rounding to the nearest minute
	const minutes = Math.round(angle / anglePerMinute);

	// Return the minutes rounded down to the nearest 5 minutes
	return Math.floor(minutes / 5) * 5;
};

/**
 * Calculates the time (hour and minute) from a given angle on a clock face
 *
 * @param {number} angle - The angle in radians
 * @returns {object} - An object containing the hour and minute
 */
const calculateTimeFromAngle = (angle) => {
	// Calculate the number of minutes from the angle
	const minutes = calculateMinutesFromAngle(angle);

	// Calculate the hour and minute from the minutes
	const h = Math.floor(minutes / 60);
	const m = minutes - h * 60;

	// Return an object with the hour and minute formatted as strings with leading zeros if necessary
	return { h: h === 0 ? '00' : (h < 10 ? '0' + h : h.toString()), m: m < 10 ? '0' + m : m.toString() };
};

const calculateArcColor = (index0, segments, gradientColorFrom, gradientColorTo) => {
	const interpolate = interpolateGradient(gradientColorFrom, gradientColorTo);

	return {
		fromColor: interpolate(index0 / segments),
		toColor: interpolate((index0 + 1) / segments),
	};
};

/**
 * Calculates the start and end points of an arc segment of a circle.
 * @param {number} index0 - The index of the current segment, starting from 0.
 * @param {number} segments - The total number of segments that make up the circle.
 * @param {number} radius - The radius of the circle.
 * @param {number} startAngle0 - The starting angle of the circle in radians (default: 0).
 * @param {number} angleLength0 - The length of the circle in radians (default: 2 * Math.PI).
 * @returns {Object} - An object with the start and end points of the arc segment.
 */
const calculateArcCircle = (index0, segments, radius, startAngle0 = 0, angleLength0 = 2 * Math.PI) => {
	// Ensure the start and angle length are within the 0 - 2 * Math.PI range
	const startAngle = startAngle0 % (2 * Math.PI);
	const angleLength = angleLength0 % (2 * Math.PI);

	// Calculate the index of the current segment, adjusted to start from 1
	const index = index0 + 1;

	// Calculate the start and end angles of the arc segment
	const fromAngle = (angleLength / segments) * (index - 1) + startAngle;
	const toAngle = (angleLength / segments) * index + startAngle;

	// Adjust the start and end angles to fit within the 0 - 2 * Math.PI range
	const fromAngleAdjusted = fromAngle < 0 ? fromAngle + 2 * Math.PI : fromAngle;
	const toAngleAdjusted = toAngle < 0 ? toAngle + 2 * Math.PI : toAngle;

	// Calculate the x and y coordinates of the start and end points of the arc segment
	const fromX = radius * Math.sin(fromAngleAdjusted);
	const fromY = -radius * Math.cos(fromAngleAdjusted);
	const realToX = radius * Math.sin(toAngleAdjusted);
	const realToY = -radius * Math.cos(toAngleAdjusted);

	// Add a small offset to the end point to start drawing a little bit earlier, so that the segments stick together
	const toX = radius * Math.sin(toAngleAdjusted + 0.005);
	const toY = -radius * Math.cos(toAngleAdjusted + 0.005);

	// Return an object containing the start and end points of the arc segment
	return {
		fromX,
		fromY,
		toX,
		toY,
		realToX,
		realToY,
	};
};

/**
 * Parses a time string and returns an object with hours and minutes.
 * @param {string} timeString - The time string to parse (in the format "HH:MM").
 * @returns {Object} - An object with hours and minutes.
 */
const parseTime = (timeString) => {
	// Split the time string into hours and minutes, and convert them to numbers
	const [hours, minutes] = timeString.split(':').map(Number);

	// Return an object with the hours and minutes properties
	return { h: hours, m: minutes };
};

/**
 * Calculates the angle between the hour hand and 12 o'clock on an analog clock, based on the given time.
 * @param {Object} time - An object with hours and minutes properties.
 * @returns {number} - The angle between the hour hand and 12 o'clock, in radians.
 */
const calculateAngleFromTime = (time) => {
	// Extract the hours and minutes from the time object
	const { h, m } = time;

	// Calculate the angle based on the hours and minutes
	let angle = (Math.PI / 12) * (h + m / 60);

	// If the angle is greater than pi radians, subtract 2*pi to make it negative
	if (angle > Math.PI) {
		angle -= 2 * Math.PI;
	}

	// Return the calculated angle
	return angle;
};

/**
 * Calculates the start angle and angle length for a clock face based on the initial start and end times.
 * @param {string} initialStartTime - The initial start time in the format "HH:MM" (default: "18:00").
 * @param {string} initialEndTime - The initial end time in the format "HH:MM" (default: "06:00").
 * @returns {Object} - An object with the start angle and angle length properties.
 */
const getInitialAngles = (initialStartTime = '18:00', initialEndTime = '06:00') => {
	// Parse the initial start and end times into time objects
	const startTime = parseTime(initialStartTime);
	const endTime = parseTime(initialEndTime);

	// Calculate the start and end angles based on the time objects
	const startAngle = calculateAngleFromTime(startTime);
	const endAngle = calculateAngleFromTime(endTime);

	// Calculate the angle length between the start and end angles
	let angleLength;
	if (endAngle >= startAngle) {
		angleLength = endAngle - startAngle;
	} else {
		angleLength = 2 * Math.PI - (startAngle - endAngle);
	}

	// Return an object with the start angle and angle length properties
	return { startAngle, angleLength };
};

const getGradientId = (index) => {
	return `gradient${index}`;
};

export const CircularSlider = (props) => {
	const {
		segments = 5,
		strokeWidth = 40,
		radius = 180,
		bgCircleColor = '#171717',
		gradientColorFrom = '#ff9800',
		gradientColorTo = '#ffcf00',
		showClockFace = true,
		clockFaceColor = '#9d9d9d',
		startIcon = (
			<g scale="1.1" transform="translate(-8, -8)">
				{BEDTIME_ICON}
			</g>
		),
		stopIcon = (
			<g scale="1.1" transform="translate(-8, -8)">
				{WAKE_ICON}
			</g>
		),
		initialStartTime = '18:00',
		initialEndTime = '06:00',
		onUpdate = null,
		onStartUpdate = null,
		onEndUpdate = null,
	} = props;

	useEffect(() => {
		getInitialAngles(initialStartTime, initialEndTime);
		setInitialValues();
	}, [initialStartTime, initialEndTime]);

	const [circleCenterX, setCenterX] = useState(false);
	const [circleCenterY, setCenterY] = useState(false);
	const [angleLength, setAngleLength] = useState(getInitialAngles(initialStartTime, initialEndTime).angleLength);
	const [startAngle, setStartAngle] = useState(getInitialAngles(initialStartTime, initialEndTime).startAngle);

	const _circle = useRef(null);

	const setInitialValues = () => {
		const startTime = parseTime(initialStartTime);
		const endTime   = parseTime(initialEndTime);

		let durationMinutes = (endTime.h * 60 + endTime.m) - (startTime.h * 60 + startTime.m);
		if (durationMinutes < 0) {
			durationMinutes += 24 * 60; // add a full day in minutes
		}

		if (onUpdate !== null) onUpdate({ startAngle, angleLength, startTime, endTime, durationMinutes });
		if (onStartUpdate !== null) onStartUpdate({ startAngle, startTime, durationMinutes });
		if (onEndUpdate !== null) onEndUpdate({ angleLength, endTime, durationMinutes });
	}

	const setCircleCenter = () => {
		const { x, y, width, height } = _circle.current.getBoundingClientRect();

		setCenterX(width / 2 + x);
		setCenterY(height / 2 + y);
	};

	const getContainerWidth = () => {
		return strokeWidth + radius * 2 + 2;
	};

	const handleStartMouseDown = (e) => {
		e = e || window.event;
		e.preventDefault();

		document.onmouseup = () => {
			document.onmouseup = null;
			document.onmousemove = null;
		};

		document.onmousemove = handleStartMove;
	};

	const handleEndMouseDown = (e) => {
		e = e || window.event;
		e.preventDefault();

		document.onmouseup = () => {
			document.onmouseup = null;
			document.onmousemove = null;
		};

		document.onmousemove = handleEndMove;
	};

	const handleStartMove = (e) => {
		e = e || window.event;
		e.preventDefault();

		const currentAngleStop = (startAngle + angleLength) % (2 * Math.PI);
		let newAngle = Math.atan2(e.clientY - circleCenterY, e.clientX - circleCenterX) + Math.PI / 2;
		if (newAngle < 0) newAngle += 2 * Math.PI;

		let newAngleLength = currentAngleStop - newAngle;
		if (newAngleLength < 0) newAngleLength += 2 * Math.PI;

		const startTime = calculateTimeFromAngle(newAngle);
		const endTime = calculateTimeFromAngle((newAngle + newAngleLength) % (2 * Math.PI));
		const durationMinutes = calculateMinutesFromAngle(newAngleLength);

		if (onUpdate !== null) onUpdate({ startAngle: newAngle, angleLength: newAngleLength % (2 * Math.PI), startTime, endTime, durationMinutes });
		if (onStartUpdate !== null) onStartUpdate({ startAngle: newAngle, startTime, durationMinutes });

		setStartAngle(newAngle);
		setAngleLength(newAngleLength % (2 * Math.PI));
	};

	const handleEndMove = (e) => {
		e = e || window.event;
		e.preventDefault();

		let newAngle = Math.atan2(e.clientY - circleCenterY, e.clientX - circleCenterX) + Math.PI / 2;
		let newAngleLength = (newAngle - startAngle) % (2 * Math.PI);
		if (newAngleLength < 0) newAngleLength += 2 * Math.PI;

		const startTime = calculateTimeFromAngle(startAngle);
		const endTime = calculateTimeFromAngle((startAngle + newAngleLength) % (2 * Math.PI));
		const durationMinutes = calculateMinutesFromAngle(newAngleLength);

		if (onUpdate !== null) onUpdate({ startAngle, angleLength: newAngleLength, startTime, endTime, durationMinutes });
		if (onEndUpdate !== null) onEndUpdate({ angleLength: newAngleLength, endTime, durationMinutes });

		setAngleLength(newAngleLength);
	};

	const containerWidth = getContainerWidth();
	const start = calculateArcCircle(0, segments, radius, startAngle, angleLength);
	const stop = calculateArcCircle(segments - 1, segments, radius, startAngle, angleLength);

	useEffect(() => {
		setCircleCenter();
	}, []);

	return (
		<svg height={containerWidth} width={containerWidth} ref={(circle) => (_circle.current = circle)}>
			<defs>
				{range(segments).map((i) => {
					const { fromX, fromY, toX, toY } = calculateArcCircle(i, segments, radius, startAngle, angleLength);
					const { fromColor, toColor } = calculateArcColor(i, segments, gradientColorFrom, gradientColorTo);
					return (
						<linearGradient key={i} id={getGradientId(i)} x1={fromX.toFixed(2)} y1={fromY.toFixed(2)} x2={toX.toFixed(2)} y2={toY.toFixed(2)}>
							<stop offset="0%" stopColor={fromColor} />
							<stop offset="1" stopColor={toColor} />
						</linearGradient>
					);
				})}
			</defs>

			{/* Outer Circle */}
			<g transform={`translate(${strokeWidth / 2 + radius + 1}, ${strokeWidth / 2 + radius + 1})`}>
				<circle r={radius} strokeWidth={strokeWidth} fill="transparent" stroke={bgCircleColor} />

				{/* Clock Face*/}
				{showClockFace && <ClockFace r={radius - strokeWidth / 2} stroke={clockFaceColor} />}

				{/* Circle Fill */}
				{range(segments).map((i) => {
					const { fromX, fromY, toX, toY } = calculateArcCircle(i, segments, radius, startAngle, angleLength);
					const d = `M ${fromX.toFixed(2)} ${fromY.toFixed(2)} A ${radius} ${radius} 0 0 1 ${toX.toFixed(2)} ${toY.toFixed(2)}`;

					return <path d={d} key={i} strokeWidth={strokeWidth} stroke={`url(#${getGradientId(i)})`} fill="transparent" />;
				})}

				{/* Start Icon */}
				<g fill={gradientColorFrom} transform={`translate(${start.fromX}, ${start.fromY})`} onMouseDown={handleStartMouseDown}>
					<circle r={(strokeWidth - 1) / 2} fill={bgCircleColor} stroke={gradientColorFrom} strokeWidth="1" />
					{startIcon}
				</g>

				{/* Stop Icon */}
				<g fill={gradientColorTo} transform={`translate(${stop.toX}, ${stop.toY})`} onMouseDown={handleEndMouseDown}>
					<circle r={(strokeWidth - 1) / 2} fill={bgCircleColor} stroke={gradientColorTo} strokeWidth="1" />
					{stopIcon}
				</g>
			</g>
		</svg>
	);
};
