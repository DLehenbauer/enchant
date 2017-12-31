import { h, Component } from 'preact';
import { RouterProps } from 'preact-router';
import * as style from './style.css';

export interface HomeProps extends RouterProps { }
export interface HomeState { }

export default class Home extends Component<HomeProps, HomeState> {
	render() {
		return (
			<iframe class={style.home} src="/vm"></iframe>
		);
	}
}
