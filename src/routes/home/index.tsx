import { h, Component } from 'preact';
import { RouterProps } from 'preact-router';
import Editor from '../../components/editor';
import * as style from './style.css';
import * as ZorkScript from 'zorkscript';
import * as Await from '../../util/await';

export interface HomeProps extends RouterProps { }
export interface HomeState { }

export default class Home extends Component<HomeProps, HomeState> {
	private vmFrame: HTMLIFrameElement;

	private readonly compile = (source: string) => {
		let zcode: Uint8Array;

		Await.event(this.vmFrame, 'load').then(() => {
			this.vmFrame.contentWindow.postMessage({
				command: 'vm_run',
				program: zcode
			}, '*');
		});

		this.vmFrame.contentWindow.location.reload(true);

		const program = new ZorkScript.Program();
		ZorkScript.compile(program, source);
		program.main.new_line();
		program.main.quit();
		zcode = program.compile();
	}

	render() {
		return (
			<div class={style.home}> 
				<div class={style.editorPane}>
					<Editor compileFn={ this.compile } />
				</div>
				<iframe class={style.vmPane} src={__webpack_public_path__ + ":vm"} ref={ frame => this.vmFrame = frame as HTMLIFrameElement }></iframe>
			</div>
		);
	}

}
