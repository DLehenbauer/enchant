import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import * as style from './style.css';

export interface HeaderProps { }
export interface HeaderState { }

export default class Header extends Component<HeaderProps, HeaderState> {
	render() {
		return (
			<header class={style.header}>
				<h1>IF</h1>
				<nav>
					<Link activeClassName={style.active} href="/">Home</Link>
				</nav>
			</header>
		);
	}
}
