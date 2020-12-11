import { Terminal } from 'xterm';
import type { ITerminalOptions } from 'xterm';
import styles from 'node_modules/xterm/css/xterm.css';

export default class Term {
    private instance: Terminal;

    constructor(rootElement, options: ITerminalOptions = {}) {
        this.instance = new Terminal(options);
        this.instance.open(rootElement);
        this.writeln('DTC');
        this.instance.write('\u001B[0;0f');
        this.writeln('Overwrite :)');
        // this.instance.disableCursor();
    }

    writeln(string) {
        this.instance.write(`${string}\r\n`);
    }

    disableCursor() {
        this.instance.write('\u001B[?25l');
    }
}
