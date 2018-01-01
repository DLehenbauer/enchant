import { h, Component } from 'preact';
import * as style from './style.css';
import * as Await from '../../util/await';

export interface EditorProps { compileFn: (source: string) => void }
export interface EditorState { }

export default class Editor extends Component<EditorProps, EditorState> {
	private readonly monacoParent = document.createElement('div');
	private readonly monacoEditor: Promise<monaco.editor.IStandaloneCodeEditor> = Await.script('vs/loader.js')
		.then(() => new Promise<monaco.editor.IStandaloneCodeEditor>(accept => {
			(window as any)['require'](['vs/editor/editor.main'], () => {
				accept(monaco.editor.create(this.monacoParent, {
					value: '',
					language: 'javascript'
				}));
			});
		}));

	private container: Element;

	componentWillMount() {
		this.monacoParent.style.width = '100%';
		this.monacoParent.style.height = '100%';
	}

	private readonly onKeyDownCapture = (e: KeyboardEvent) => {
		if (e.shiftKey && e.keyCode == 13) {
			e.preventDefault();
			this.monacoEditor.then(editor => {
				this.props.compileFn(editor.getValue());
			});
		}
	}

	render() {
		return (
			<div class={style.editor} ref={ element => { this.container = element as HTMLDivElement; } } onKeyDownCapture={ this.onKeyDownCapture } />
		);
	}

	componentDidMount() {
		this.container.appendChild(this.monacoParent);
		this.monacoEditor.then(editor => {
			editor.layout();
		});
	}

	componentDidUpdate() {
		if (this.monacoParent.parentElement !== this.container) {
			this.container.appendChild(this.monacoParent);
			this.monacoEditor.then(editor => {
				editor.layout();
			});
		}
	}
}
