import { h, Component } from 'preact';
import { Router, RouterOnChangeArgs } from 'preact-router';
import { Match } from 'preact-router/match';

import Header from './header';
import Home from '../routes/home';
import VM from '../routes/vm';
// import Home from 'async!../routes/home';
// import Profile from 'async!../routes/profile';

interface AppProps { }
interface AppState { }
interface MatchResult { matches: any, path: string, url: string }

export default class App extends Component<AppProps, AppState> {
	currentUrl: any;

	/** Gets fired when the route changes.
	 *	@param {Object} event		"change" event from [preact-router](http://git.io/preact-router)
	 *	@param {string} event.url	The newly routed URL
	 */
	handleRoute = (e: RouterOnChangeArgs) => {
		this.currentUrl = e.url;
	};

	render() {
		const base = __webpack_public_path__;
		return (
			<div id="app">
				<Match path="/">
					{ (result: MatchResult) => !result.url.match(/vm/) && (<Header />) }
				</Match>
				<Router onChange={this.handleRoute}>
					<Home path={base} />
					<VM path={`${base}:vm`} />
				</Router>
			</div>
		);
	}
}
