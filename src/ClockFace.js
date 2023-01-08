import React from 'react';

import range from 'lodash.range';

export const ClockFace = (props) => {
	const { r, stroke } = props;
	const faceRadius = r - 5;
	const textRadius = r - 30;

	return (
		<g>
			{range(48).map((i) => {
				const cos = Math.cos(((2 * Math.PI) / 48) * i);
				const sin = Math.sin(((2 * Math.PI) / 48) * i);

				return <line key={i} stroke={stroke} strokeWidth={i % 4 === 0 ? 3 : 1} x1={cos * faceRadius} y1={sin * faceRadius} x2={cos * (faceRadius - 7)} y2={sin * (faceRadius - 7)} />;
			})}

			<g transform="translate(0, 5)">
				{range(12).map((h, i) => (
					<text key={i} fill={stroke} fontSize="16" textAnchor="middle" x={textRadius * Math.cos(((2 * Math.PI) / 12) * i - Math.PI / 2 + Math.PI / 6)} y={textRadius * Math.sin(((2 * Math.PI) / 12) * i - Math.PI / 2 + Math.PI / 6)}>
						{h + 1}
					</text>
				))}
			</g>
		</g>
	);
};
