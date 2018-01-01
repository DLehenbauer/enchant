import * as Await from '../../util/await';

const runCommand = Await.event(window, 'message', ev => {
	return ev.data.command === 'vm_run'
});

import { h, Component } from 'preact';
import * as style from './style.css';
import { ZVM } from 'ifvms';

export interface VMProps {}
export interface VMState {}

export default class Profile extends Component<VMProps, VMState> {
	
	private readonly glkoteLoaded = Promise.all([
		Await.script('glkote/jquery-1.12.4.min.js')			// Must load jQuery prior to dialog.js
			.then(() => Await.script('glkote/dialog.js')),
		Await.script([
			'glkote/glkote.js',								// Load glkote.js & glkapi.js in parallel
			'glkote/glkapi.js',								// w/each other and dialog.js
		])
	]);
	
	render() {
		return (
			<div id="gameport" class={ style.gameport }>
				<div id="windowport" class={ style.windowport }></div>
				<div id="errorpane" class={ style.errorpane }>
					<div id="errorcontent">...</div>
				</div>
			</div>
		);
	}

	componentDidMount() {
		const vm = new ZVM();
	
		this.glkoteLoaded.then(() => {
			const asAny = window as any;
			const Glk = asAny.Glk;
			const Dialog = asAny.Dialog;
			const options = {
				vm: vm,
				Dialog: Dialog,
				Glk: Glk
			};
	
			runCommand.then((e: any) => {
				vm.prepare(e.data.program, options);

				// This will call vm.init()
				Glk.init(options);
			});
		});
	}	
}
