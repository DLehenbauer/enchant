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
			editor.setValue(`// Prints primes between 2 and 50
// https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes

// Array(n) statically allocates a region of 'n' bytes in the dynamic memory
// section of the z-code file.  (Arrays are never freed.)
//
// Use loadb/storeb or loadw/storew intrinsics to access the contents of the
// array.  Note that there is currently no no bounds checking.
const sieve = Array(51);
const max = 50;

function printPrimes() {
	for (let i = 2; i <= max; ++i) {
		const isMarked = loadb(sieve, i);
		if (isMarked != true) {
			print(' '); print(i);
			for (let j = i * 2; j <= max; j += i) {
				storeb(sieve, j, 1);
			}
		}
	}
}

print('primes: '); printPrimes(); print('\\n');
`);
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
