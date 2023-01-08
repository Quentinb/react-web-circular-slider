import React from 'react';
import { createRoot } from 'react-dom/client';

import { CircularSlider } from '../../../src/CircularSlider';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
	<div>
		<CircularSlider />
	</div>
);
