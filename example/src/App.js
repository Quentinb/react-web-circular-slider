import { useState } from 'react';
import { CircularSlider } from 'react-web-circular-slider';

function padTime(time) {
	if (`${time}`.length < 2) {
		return `0${time}`;
	}

	return time;
}

const formatTime = (time) => {
	const { h, m } = time;
	return `${padTime(h)}:${padTime(m)}`;
};

export const App = () => {
	const [bedTime, setBedTime] = useState('00:00');
	const [wakeTime, setWakeTime] = useState('00:00');
	const [durationHr, setDurationHr] = useState(0);
	const [durationMin, setDurationMin] = useState(0);

	const onStartChange = ({ startTime }) => {
		setBedTime(formatTime(startTime));
	};

	const onEndChange = ({ endTime }) => {
		setWakeTime(formatTime(endTime));
	};

	const onUpdate = ({ durationMinutes }) => {
		const hours = Math.floor(durationMinutes / 60);
		const minutes = durationMinutes - hours * 60;

		setDurationHr(hours);
		setDurationMin(minutes);
	};

	return (
		<div className="App" style={{ display: 'flex', flexDirection: 'column', marginTop: '30%' }}>
			<div style={{ color: 'whitelightgray', display: 'flex', justifyContent: 'space-evenly', marginTop: 20, marginBottom: 20 }}>
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<div style={{ color: '#ff9800' }}>Bedtime</div>
					<div style={{ fontSize: 30 }}>{bedTime}</div>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column' }}>
					<div style={{ color: '#ffcf00' }}>Wake</div>
					<div style={{ fontSize: 30 }}>{wakeTime}</div>
				</div>
			</div>
			<div style={{ display: 'flex', justifyContent: 'center', color: 'white' }}>
				<div style={{ position: 'absolute', justifySelf: 'center', top: '39%' }}>
					<div style={{ display: 'flex' }}>
						<div style={{ fontSize: 40 }}>{durationHr}</div>
						<div style={{ alignSelf: 'end', paddingBottom: 5 }}>HR</div>
						<div style={{ margin: 5 }}></div>

						<div style={{ fontSize: 40 }}>{durationMin}</div>
						<div style={{ alignSelf: 'end', paddingBottom: 5 }}>MIN</div>
					</div>
				</div>

				<CircularSlider onStartUpdate={onStartChange} onEndUpdate={onEndChange} onUpdate={onUpdate} />
			</div>
		</div>
	);
};
