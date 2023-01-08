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

const calculateMinutesFromAngle = (angle) => {
	return Math.round(angle / ((2 * Math.PI) / (12 * 12))) * 5;
};

const calculateTimeFromAngle = (angle) => {
	const minutes = calculateMinutesFromAngle(angle);
	const h = Math.floor(minutes / 60);
	const m = minutes - h * 60;

	return { h: h === 0 ? 12 : h, m };
};

const calculateArcColor = (index0, segments, gradientColorFrom, gradientColorTo) => {
	const interpolate = interpolateGradient(gradientColorFrom, gradientColorTo);

	return {
		fromColor: interpolate(index0 / segments),
		toColor: interpolate((index0 + 1) / segments),
	};
};

const calculateArcCircle = (index0, segments, radius, startAngle0 = 0, angleLength0 = 2 * Math.PI) => {
	// Add 0.0001 to the possible angle so when start = stop angle, whole circle is drawn
	const startAngle = startAngle0 % (2 * Math.PI);
	const angleLength = angleLength0 % (2 * Math.PI);
	const index = index0 + 1;
	const fromAngle = (angleLength / segments) * (index - 1) + startAngle;
	const toAngle = (angleLength / segments) * index + startAngle;
	const fromX = radius * Math.sin(fromAngle);
	const fromY = -radius * Math.cos(fromAngle);
	const realToX = radius * Math.sin(toAngle);
	const realToY = -radius * Math.cos(toAngle);

	// add 0.005 to start drawing a little bit earlier so segments stick together
	const toX = radius * Math.sin(toAngle + 0.005);
	const toY = -radius * Math.cos(toAngle + 0.005);

	return {
		fromX,
		fromY,
		toX,
		toY,
		realToX,
		realToY,
	};
};

const getGradientId = (index) => {
	return `gradient${index}`;
};

export const CircularSlider = (props) => {
	const {
		segments = 5,
		strokeWidth = 40,
		radius = 145,
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
		onUpdate = null,
		onStartUpdate = null,
		onEndUpdate = null,
	} = props;

	const [circleCenterX, setCenterX] = useState(false);
	const [circleCenterY, setCenterY] = useState(false);
	const [angleLength, setAngleLength] = useState((Math.PI * 6) / 6);
	const [startAngle, setStartAngle] = useState((Math.PI * 9) / 6);
	const _circle = useRef(null);

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
