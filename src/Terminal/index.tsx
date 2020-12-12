import { Terminal } from 'xterm';
import type { ITerminalOptions } from 'xterm';
import styles from 'node_modules/xterm/css/xterm.css';

export enum COLORS {
    BLACK = `\u001B[30m`,
    RED = `\u001B[31m`,
    GREEN = `\u001B[32m`,
    YELLOW = `\u001B[33m`,
    BLUE = `\u001B[34m`,
    MAGENTA = `\u001B[35m`,
    CYAN = `\u001B[36m`,
    GRAY = `\u001B[37m`,
    DARK_GRAY = `\u001B[90m`,
    LIGHT_RED = `\u001B[91m`,
    LIGHT_GREEN = `\u001B[92m`,
    LIGHT_YELLOW = `\u001B[93m`,
    LIGHT_BLUE = `\u001B[94m`,
    LIGHT_MAGENTA = `\u001B[95m`,
    LIGHT_CYAN = `\u001B[96m`,
    WHITE = `\u001B[97m`,
    DEFAULT = `\u001B[97m`,
}

export enum BG_COLORS {
    BLACK = `\u001B[40m`,
    RED = `\u001B[41m`,
    GREEN = `\u001B[42m`,
    YELLOW = `\u001B[43m`,
    BLUE = `\u001B[44m`,
    MAGENTA = `\u001B[45m`,
    CYAN = `\u001B[46m`,
    GRAY = `\u001B[47m`,
    DARK_GRAY = `\u001B[100m`,
    LIGHT_RED = `\u001B[101m`,
    LIGHT_GREEN = `\u001B[102m`,
    LIGHT_YELLOW = `\u001B[103m`,
    LIGHT_BLUE = `\u001B[104m`,
    LIGHT_MAGENTA = `\u001B[105m`,
    LIGHT_CYAN = `\u001B[106m`,
    WHITE = `\u001B[107m`,
    DEFAULT = `\u001B[40m`,
}

export default class Term {
    private instance: Terminal;
    private color = COLORS.WHITE;
    private bgColor = BG_COLORS.BLACK;

    constructor(rootElement, options: ITerminalOptions = {}) {
        this.instance = new Terminal(options);
        this.instance.open(rootElement);
        this.instance.setOption('fontSize', 25);
        this.writeLn('DTC');
        // this.instance.write('\u001B[0;0f]');
        this.moveCursor(0, 0);
        this.writeLn('Overwrite :)', this.color, BG_COLORS.BLUE);
        // this.moveCursor(15, 0);
        this.writeLnTo('Red', 15, 0, COLORS.RED);
        this.resetColors();
        this.writeLn('yo !');
        // this.instance.disableCursor();
    }

    resetColors() {
        this.instance.write('\u001B[0m');
    }

    resetBgColor() {
        this.instance.write(BG_COLORS.DEFAULT);
    }

    setColor(color = this.color, bgColor = this.bgColor) {
        if (this.color !== color) {
            this.color = color;
            this.write(color);
        }
        if (this.bgColor !== bgColor) {
            this.bgColor = bgColor;
            this.write(bgColor);
        }
    }

    write(string = '', color = this.color, bgColor = this.bgColor) {
        this.setColor(color, bgColor);
        this.instance.write(string);
    }

    writeLn(string = '', color = this.color, bgColor = this.bgColor) {
        this.write(`${string}\r\n`, color, bgColor);
    }

    writeTo(string = '', x: number, y: number, color = this.color, bgColor = this.bgColor) {
        this.moveCursor(x, y);
        this.write(string, color, bgColor);
    }

    writeLnTo(string = '', x: numner, y: number, color: COLORS, bgColor: BG_COLORS) {
        this.writeTo(`${string}\r\n`, x, y, color, bgColor);
    }

    moveCursor(x: number, y: number) {
        if (x !== this.instance.buffer.cursorX || y !== this.instance.buffer.cursorY) {
            this.instance.write(`\u001B[${y};${x}f`);
        }
    }

    disableCursor() {
        this.instance.write('\u001B[?25l');
    }
}
