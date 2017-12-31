import { h, Component } from 'preact';
import { RouterProps } from 'preact-router';
import * as style from './style.css';

export interface ProfileProps extends RouterProps {
	user?: string;
}
	
export interface ProfileState {
	time: number;
	count: number;
}

export default class Profile extends Component<ProfileProps, ProfileState> {
	timer: number;
	state = {
		time: Date.now(),
		count: 10
	};

	// gets called when this route is navigated to
	componentDidMount() {
		// start a timer for the clock:
		this.timer = window.setInterval(this.updateTime, 1000);
	}

	// gets called just before navigating away from the route
	componentWillUnmount() {
		clearInterval(this.timer);
	}

	// update the current time
	updateTime = () => {
		this.setState({ time: Date.now() });
	};

	increment = () => {
		this.setState({ count: this.state.count+1 });
	};

	// Note: `user` comes from the URL, courtesy of our router
	render(props: ProfileProps, state: ProfileState) {
		return (
			<div class={style.profile}>
				<h1>Profile: {props.user}</h1>
				<p>This is the user profile for a user named { props.user }.</p>

				<div>Current time: {new Date(state.time).toLocaleString()}</div>

				<p>
					<button onClick={this.increment}>Click Me</button>
					{' '}
					Clicked {state.count} times.
				</p>
			</div>
		);
	}
}
