import React from 'react';

import range from 'lodash.range';

export const ClockFace = (props) => {
	const { r, stroke } = props;
	const faceRadius = r - 5;
	const textRadius = r - 30;

	return (
		<g>
			{
				range(48).map(i => {
					const cos = Math.cos(2 * Math.PI / 48 * i);
					const sin = Math.sin(2 * Math.PI / 48 * i);

					return (
						<line
							key={i}
							stroke={stroke}
							strokeWidth={i % 2 === 0 ? 2 : 1}
							x1={cos * faceRadius}
							y1={sin * faceRadius}
							x2={cos * (faceRadius - 7)}
							y2={sin * (faceRadius - 7)}
						/>
					);
				})
			}
			<g transform={{translate: "0, -9"}}>
				{
					range(24).map((h, i) => (
						<text
							key={i}
							fill={stroke}
							fontSize="11"
							textAnchor="middle"
							x={textRadius * Math.cos(Math.PI / 12 * i - Math.PI / 1.33  + Math.PI / 4)}
							y={textRadius * Math.sin(Math.PI / 12 * i - Math.PI / 1.33 + Math.PI / 4)}
						>
							{ h }
						</text>
					))
				}
			</g>
		</g>
	);
};
