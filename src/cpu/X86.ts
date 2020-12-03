/*

  0-3FF        IVT (Interrupt Vector Table)
  400-5FF      BDA (BIOS Data Area)
  600-9FFFF    ordinary application RAM <-- the place where our programs will be, probably :)
  A0000-BFFFF  Video memory
  C0000-EFFFF  Optional ROMs (the VGA ROM is usually located at C0000)
  F0000-FFFFF  BIOS ROM

*/
import { OpCodesTable } from './OpCodes';
import { MMU } from './MMU';
import { ToHex } from '../utils/ToHex';

export type REG_NAME =
    | 'ax'
    | 'al'
    | 'ah'
    | 'bx'
    | 'bh'
    | 'bl'
    | 'cx'
    | 'ch'
    | 'cl'
    | 'dx'
    | 'dh'
    | 'dl'
    | 'si'
    | 'di'
    | 'bp'
    | 'sp'
    | 'ds'
    | 'cs'
    | 'ss'
    | 'ip';
export type REG_NAME_16 = 'ax' | 'bx' | 'cx' | 'dx' | 'sp' | 'bp' | 'si' | 'di';
export type REG_NAME_8 = 'ah' | 'al' | 'bh' | 'bl' | 'ch' | 'cl' | 'dh' | 'dl';
export type REG_NAME_S = 'es' | 'cs' | 'ss' | 'ds';

export interface CPU_DUMP {
    ax: number;
    bx: number;
    cx: number;
    dx: number;
    cs: number;
    ip: number;
    ss: number;
    si: number;
    di: number;
    ds: number;
    es: number;
    bp: number;
    sp: number;
    cf: number;
    pf: number;
    zf: number;
    af: number;
    sf: number;
    of: number;
    tf: number;
    if: number;
    df: number;
    status: number;
    mode: number;
}

export const FLAG_CF = 0x0001,
    FLAG_PF = 0x0004,
    FLAG_AF = 0x0010,
    FLAG_ZF = 0x0040,
    FLAG_SF = 0x0080,
    FLAG_OF = 0x0800,
    FLAG_TF = 0x0100,
    FLAG_IF = 0x0200,
    FLAG_DF = 0x0400,
    FLAG_IOPL = 0x3000,
    FLAG_NT = 0x4000,
    ST_STOPPED = 0,
    ST_RUNNING = 1,
    ST_PAUSED = 2,
    MODE_NORMAL = 0,
    MODE_STEP = 1,
    MODE_STEP_OVER = 2;

// define(['MMU', 'Graphics', 'TextDisplay', 'Utils'], function(MMU, Graphics, TextDisplay, Utils) {
export const X86 = {
    // Flags masks
    ax: 0,
    bx: 0,
    cx: 0,
    dx: 0,

    si: 0,
    di: 0,
    bp: 0,
    sp: 0,
    ds: 0, // data segment register
    es: 0, // extra segment register
    ss: 0, // stack segment register
    cs: 0, // code segment
    ip: 0, // instruction pointer

    set ah(val) {
        this.ax &= 0x00ff;
        this.ax |= val << 8;
    },
    get ah() {
        return this.ax >> 8;
    },
    set al(val) {
        this.ax &= 0xff00;
        this.ax += val;
    },
    get al() {
        return this.ax & 0x00ff;
    },
    set bh(val) {
        this.bx &= 0x00ff;
        this.bx |= val << 8;
    },
    get bh() {
        return this.bx >> 8;
    },
    set bl(val) {
        this.bx &= 0xff00;
        this.bx += val;
    },
    get bl() {
        return this.bx & 0x00ff;
    },
    set ch(val) {
        this.cx &= 0x00ff;
        this.cx |= val << 8;
    },
    get ch() {
        return this.cx >> 8;
    },
    set cl(val) {
        this.cx &= 0xff00;
        this.cx += val;
    },
    get cl() {
        return this.cx & 0x00ff;
    },
    set dh(val) {
        this.dx &= 0x00ff;
        this.dx |= val << 8;
    },
    get dh() {
        return this.dx >> 8;
    },
    set dl(val) {
        this.dx &= 0xff00;
        this.dx += val;
    },
    get dl() {
        return this.dx & 0x00ff;
    },

    flags: FLAG_IF, // only interrupt flag is set at startup

    regTable: [
        ['al', 'cl', 'dl', 'bl', 'ah', 'ch', 'dh', 'bh'], // w == 0
        ['ax', 'cx', 'dx', 'bx', 'sp', 'bp', 'si', 'di'], // w == 1
        ['es', 'cs', 'ss', 'ds'], // sregs when (mod == 11b)
    ],

    BP: [] as number[][], // array of breakpoints

    status: ST_STOPPED,
    mode: MODE_NORMAL,
    isColdboot: true,
    previousOp: null as number,
    nextOpCode: null as number,
    cpuConsole: null as null,

    version: '0.3',
    cycles: 0,

    // resets the CPU
    reset() {
        console.log('reseting CPU ! Not much for now :)');
        this.flags = FLAG_IF;
        this.ax = 0;
        this.bx = 0;
        this.cx = 0;
        this.dx = 0;
        this.si = 0;
        this.di = 0;
        this.bp = 0;
        this.sp = 0;
        this.ds = 0;
        this.es = 0;
        this.ss = 0;
        this.cs = 0;
        this.ip = 0;

        this.status = ST_STOPPED;
        this.mode = MODE_NORMAL;
        this.previousOp = null;
        this.nextOpCode = null;

        this.cycles = 0;

        // map cs:ip to FFFFh:0000h, default for 80x86
        this.cs = 0xffff;
        this.ip = 0x0000;
    },

    fetchNext() {
        // TODO: should be hardcoded for each instruction
        this.cycles++;
        // Console.log('Next Op: [IP=' + this.ip.toHex() + '] => ' + MMU.rbs(this.cs, this.ip).toHex());
        return MMU.rbs(this.cs, this.ip);
    },

    // modrm needs w for proper reg: 0 for 8bit, 1 for 16bit ones
    modrm: function (w: 0 | 1) {
        // get reg
        const modByte = this.ipnext(1);
        const reg = (modByte >> 3) & 0x7;

        return {
            regName: this.regTable[w][reg],
            reg: reg,
            mod: (modByte >> 6) & 0x3,
            rm: modByte & 0x7,
            regName2: this.regTable[w][modByte & 0x7], // destination reg (may not have any meaning if unused for this opcode)
        };
    },

    push(value: number) {
        this.sp -= 2;
        MMU.wws(X86.ss, X86.sp, value, true);
    },

    pop() {
        const value = MMU.rws(X86.ss, X86.sp);
        this.sp += 2;
        return value;
    },

    loadbs(seg: number, addr: number, reg: REG_NAME_8) {
        if (arguments.length < 3) throw 'loadbs requires two arguments, called with only ' + arguments.length;

        try {
            this[reg] = MMU.rbs(seg, addr);
        } catch (err) {
            console.log('unknown reg: ' + reg);
        }
    },

    loadws(seg: number, addr: number, reg: REG_NAME_16) {
        if (arguments.length < 3) throw 'loadws requires two arguments, called with only ' + arguments.length;

        try {
            // console.log('reading ' + seg + ':' + addr + ' into ' + reg);
            this[reg] = MMU.rws(seg, addr);
        } catch (err) {
            console.log('unknown reg: ' + reg);
        }
    },

    getregbs(reg: REG_NAME_8, reg2: REG_NAME_8) {
        return MMU.rbs(this[reg], this[reg2]);
    },

    getregws(reg: REG_NAME_16, reg2: REG_NAME_16) {
        return MMU.rws(this[reg], this[reg2]);
    },

    // returns the opadd
    getOpAdd(rm: number, off: number, seg: REG_NAME) {
        // console.log('getOpAdd: ' + rm + ', seg = ' + seg + ', off = ' + off.toHex());
        if (!rm) {
            throw 'getOpAdd: rm = 0 ! => bx << 4 + si ?!';
            return (X86.bx << 4) + X86.si + off;
        } else if (rm == 1) {
            throw 'getOpAdd: rm = 1 ! => bx << 4 + di ?!';
            return (X86.bx << 4) + X86.di + off;
        } else if (rm == 2) {
            throw 'getOpAdd: rm = 2 ! => bp << 4 + si ?!';
            return (X86.bp << 4) + X86.si + off;
        } else if (rm == 3) {
            throw 'getOpAdd: rm = 3 ! => bp << 4 + di ?!';
            return (X86.bp << 4) + X86.di + off;
        } else if (rm == 4) {
            throw 'getOpAdd: rm = 4 ! => ' + seg + ' << 4 + si ?!';
            return (X86[seg] << 4) + X86.si + off;
        } else if (rm == 5) {
            // throw('getOpAdd, RM == 5');
            return (X86[seg] << 4) + X86.di + off;
        } else if (rm == 6) {
            // seg:[off]	// TODO: unit test this case !!
            // throw('getOpAdd: rm = 6 ! => bp << 4 ?!');
            return (X86[seg] << 4) + off;
            throw 'dtc !';
            // return (X86.bp << 4) + off;
        } // seg:[bx+off]	// TODO: unit test this case !!
        else {
            // throw('getOpAdd: rm = 7 ! => bp << 4 ?!');
            // return (X86.bx << 4) + off;
            return (X86[seg] << 4) + X86.bx + off;
        }
    },

    // test
    getOpAdd1(rm: number, off: number, set: any) {
        switch (rm) {
            case 6:
                console.log('need to test me!');
                return (X86['ss'] << 4) + X86.bp + off;
                break;

            default:
                throw 'rm not implemented not implemented for getOpAdd1';
                break;
        }
    },

    // TODO: check boundaries !!
    sreg(reg: REG_NAME_S) {
        return this.regTable[2][reg];
    },

    // TODO: check boundaries !!
    regw(reg: REG_NAME_16) {
        return this.regTable[1][reg];
    },

    // TODO: check boundaries !!
    regb(reg: REG_NAME_8) {
        return this.regTable[0][reg];
    },

    // NEEDS testing !!
    // TODO: fix overflow !
    incw(reg: REG_NAME_16) {
        this[reg]++;
        if (this[reg] > 0xffff) {
            this[reg] = 0;
        }
    },

    addwval(a: number, b: number) {
        return a + b > 0xffff ? b - (0x10000 - a) : a + b;
    },

    addw(reg: REG_NAME_16, a: number) {
        return this.addwval(this[reg], a);
    },

    decw(reg: REG_NAME_16) {
        if (!this[reg]) {
            this[reg] = 0xffff;
        } else {
            this[reg]--;
        }
    },

    subw(reg: REG_NAME_16, a: number) {
        const b = this[reg];
        this[reg] = a > b ? 0x10000 - (a - b) : b - a;

        return this[reg];
    },

    // upd counters
    // TODO: FLAGS ?!!
    upidx() {
        if (this.getFlag(this.FLAG_DF)) {
            this.decw('di');
            this.decw('si');
        } else {
            this.incw('di');
            this.incw('si');
        }
    },

    // upd counters
    // TODO: FLAGS ?!!
    updi() {
        if (this.getFlag(this.FLAG_DF)) {
            this.decw('di');
        } else {
            this.incw('di');
        }
    },

    upsi() {
        if (this.getFlag(this.FLAG_DF)) {
            this.decw('si');
        } else {
            this.incw('si');
        }
    },

    updiw() {
        if (this.getFlag(this.FLAG_DF)) {
            this.subw('di', 2);
        } else {
            this.addw('di', 2);
        }
    },

    upsiw() {
        if (this.getFlag(this.FLAG_DF)) {
            this.subw('si', 2);
        } else {
            this.addw('si', 2);
        }
    },

    // returns the byte pointed by cs:ip+off
    ipnext(off: number) {
        return MMU.rbs(this.cs, this.ip + off);
    },

    // returns the word pointed by cs:ip+off
    ipnextw(off: number) {
        return MMU.rws(this.cs, this.ip + off);
    },

    executeOpCode(opCode: number) {
        if (!(this.cycles % 55000)) {
            this.updateCpuConsole();
            // console.log(opCode.toHex());
        }

        try {
            /*
                if (opCode == 0x8A)
                    OpCodes2[MMU.rbs(X86.cs, X86.ip + 1)]();
                else
                */
            // if (opCode === 128) {
            //     debugger;
            // }
            OpCodesTable[opCode]();
        } catch (err) {
            if (opCode === 0x8a)
                Graphics.println(
                    'unknown Multi OpCode: ' + ToHex(MMU.rbs(X86.cs, X86.ip + 1)) + ' [cycles=' + X86.cycles + ']',
                );
            else
                Graphics.println(
                    'unknown OpCode: ' +
                        ToHex(opCode) +
                        ' [' +
                        err +
                        '] at ' +
                        ToHex(X86.cs) +
                        ':' +
                        ToHex(X86.ip) +
                        ' [cycles=' +
                        X86.cycles +
                        ']',
                );
            // maybe we should wait for user input ?
            this.stop();
        }
    },

    addBP(cs: number, ip: number) {
        this.BP.push([cs, ip]);
        console.log('BP added to ' + ToHex(cs) + ':' + ToHex(ip) + ' (' + ((cs << 4) + ip) + ')');
    },

    isBP() {
        return this.BP.some(([segment, pointer]: number[]) => segment === this.cs && pointer === this.ip);
        // for (let i = 0; i < this.BP.length; i++) {
        //     if (this.BP[i][0] == X86.cs && this.BP[i][1] == X86.ip) return true;
        // }
        // return false;
    },

    listBP() {
        if (!this.BP.length) {
            console.log('No BP defined.');
        } else {
            this.BP.foreach(([segment, pointer]: number[], i: number) => {
                console.log(i + '=' + ToHex(segment) + ':' + ToHex(pointer));
            });
        }
    },

    rmBP(i: number) {
        const [segment, pointer] = this.BP[i];
        console.log('BP ' + ToHex(segment) + ':' + ToHex(pointer) + ' removed');
        this.BP.slice(i, 1);
    },

    updateCpuConsole() {
        // print out register values
        // this.cpuConsole.printAt(0, 4, this.ax.toHex());
        // this.cpuConsole.printAt(0, 15, this.si.toHex());
        // this.cpuConsole.printAt(0, 26, this.ds.toHex());
        // this.cpuConsole.printAt(0, 37, this.es.toHex());
        // this.cpuConsole.printAt(0, 48, this.ss.toHex());
        // // print out seg regs
        // this.cpuConsole.printAt(1, 4, this.bx.toHex());
        // this.cpuConsole.printAt(1, 15, this.di.toHex());
        // this.cpuConsole.printAt(1, 26, this.cs.toHex());
        // this.cpuConsole.printAt(1, 37, this.ip.toHex());
        // this.cpuConsole.printAt(2, 4, this.cx.toHex());
        // this.cpuConsole.printAt(2, 15, this.bp.toHex());
        // // flags
        // this.cpuConsole.printAt(2, 23, this.getFlag(this.FLAG_CF));
        // this.cpuConsole.printAt(2, 27, this.getFlag(this.FLAG_ZF));
        // this.cpuConsole.printAt(2, 31, this.getFlag(this.FLAG_SF));
        // this.cpuConsole.printAt(2, 35, this.getFlag(this.FLAG_OF));
        // this.cpuConsole.printAt(2, 39, this.getFlag(this.FLAG_AF));
        // this.cpuConsole.printAt(2, 43, this.getFlag(this.FLAG_PF));
        // this.cpuConsole.printAt(2, 47, this.getFlag(this.FLAG_DF));
        // this.cpuConsole.printAt(2, 51, this.getFlag(this.FLAG_IF));
        // this.cpuConsole.printAt(2, 55, this.getFlag(this.FLAG_TF));
        // this.cpuConsole.printAt(3, 4, this.dx.toHex());
        // this.cpuConsole.printAt(3, 15, this.sp.toHex());
        // switch (this.status) {
        //     case this.ST_RUNNING:
        //         this.cpuConsole.printAt(4, 8, 'Running                   ');
        //         break;
        //     case this.ST_PAUSED:
        //         this.cpuConsole.printAt(4, 8, 'Press <F9> to continue...');
        //         break;
        //     case this.ST_STOPPED:
        //         this.cpuConsole.printAt(4, 8, 'Stopped                    ');
        //         break;
        //     default:
        //         this.cpuConsole.printAt(4, 8, 'Idle                    ');
        // }
    },

    runLoop() {
        /*
            this.executeOpCode(this.nextOpCode);
            this.lastOp = this.nextOpCode;
            // in case of exception, what to do ?!
            this.nextOpCode = this.fetchNext();

            // halt execution if in step mode
            if (this.mode === this.MODE_STEP || this.isBP())
            {
                this.updateCpuConsole();
                Graphics.println('Waiting to Execute: ' + this.nextOpCode.toHex() + ' <1=cont, 2=step, 3=step over>');
                return;
            }
            else if (this.mode === this.MODE_STEP_OVER && this.lastOp != this.nextOpCode) // only exit if we're not executing REPE stuff in step over
            {
                this.updateCpuConsole();
                Graphics.println('Waiting to Execute: ' + this.nextOpCode.toHex() + ' <1=cont, 2=step, 3=step over>');
                return;
            }
            */
        if (this.status === this.ST_RUNNING) {
            this.nextOpCode = this.fetchNext();

            this.executeOpCode(this.nextOpCode);
            this.lastOp = this.nextOpCode;
            // in case of exception, what to do ?!
            this.nextOpCode = this.fetchNext();

            // halt execution if in step mode
            if (this.mode === this.MODE_STEP || this.isBP()) {
                this.updateCpuConsole();
                Graphics.println('Waiting to Execute: ' + ToHex(this.nextOpCode) + ' <1=cont, 2=step, 3=step over>');
                return;
            } else if (this.mode === this.MODE_STEP_OVER && this.lastOp != this.nextOpCode) {
                // only exit if we're not executing REPE stuff in step over
                this.updateCpuConsole();
                Graphics.println('Waiting to Execute: ' + ToHex(this.nextOpCode) + ' <1=cont, 2=step, 3=step over>');
                return;
            }
            setTimeout(this.runLoop.bind(this), 0);
        }
    },

    // starts the execution of the instruction at cs:ip
    start() {
        console.log('start');

        this.status = ST_RUNNING;

        this.runLoop();

        return;

        const pending = null;
        if (!this.nextOpCode) this.nextOpCode = this.fetchNext();
        // this.status = this.ST_RUNNING;

        /*
            if (this.status === this.ST_RUNNING)
            {
                this.runLoop();
                return;
            }

            throw('oops');
            */

        while (this.status === this.ST_RUNNING) {
            // TODO: handle IRQ in priority !!
            // while (pending = PIC.getPending())
            // {
            // 	;
            //	}

            this.executeOpCode(this.nextOpCode);
            this.lastOp = this.nextOpCode;
            // in case of exception, what to do ?!
            this.nextOpCode = this.fetchNext();

            // halt execution if in step mode
            if (this.mode === this.MODE_STEP || this.isBP()) {
                this.updateCpuConsole();
                Graphics.println('Waiting to Execute: ' + this.nextOpCode.toHex() + ' <1=cont, 2=step, 3=step over>');
                break;
            } else if (this.mode === this.MODE_STEP_OVER && this.lastOp != this.nextOpCode) {
                // only exit if we're not executing REPE stuff in step over
                this.updateCpuConsole();
                Graphics.println('Waiting to Execute: ' + this.nextOpCode.toHex() + ' <1=cont, 2=step, 3=step over>');
                break;
            } else if (!(this.cycles % 1000)) this.updateCpuConsole();
        }

        /*
            while (this.status === this.ST_RUNNING)
            {
                // do we have a one-byte opcode ?
                var nextOpCode = this.fetchNext();
                Console.log('exec: ' + nextOpCode.toHex());
                this.executeOpCode(nextOpCode);

                // wait for user input
                if (this.stepByStep && this.status !== this.ST_STOPPED)
                    this.status = this.ST_PAUSED;

                // debug stuff
                this.updateCpuConsole();

                //
                // do we have some pending IRQs ?
                // pending = PIC.getPending();
                // if (pending)
                // 	;
            }
            */
    },

    stop() {
        this.status = ST_STOPPED;
        Graphics.println('Execution STOPPED.');
        this.updateCpuConsole();
    },

    setFlag(FLAG: number, isTest: boolean) {
        if (isTest) {
            this.flags |= FLAG;
        } else {
            // sets specified bit
            this.flags &= ~FLAG; // resets specified bit
        }
    },

    getFlag(FLAG: number) {
        return this.flags & FLAG ? 1 : 0;
    },

    init() {
        Graphics.println('Starting JSx86 v' + this.version);
        Graphics.println('Choose a program and press <GO> to start experimenting ! ;)');

        this.cpuConsole = new TextDisplay('cpu', 5, 58);
        this.cpuConsole.println('AX: 0000   SI: 0000   DS: 0000   ES: 0000   SS: 0000');
        this.cpuConsole.println('BX: 0000   DI: 0000   CS: 0000   IP: 0000');
        this.cpuConsole.println('CX: 0000   BP: 0000   C   Z   S   O   A   P   D   I   T');
        this.cpuConsole.println('DX: 0000   SP: 0000');
        this.cpuConsole.printAt(4, 0, 'Status: Idle');
    },

    saveCtx() {
        this.push(this.flags);
        this.push(this.cs);
        this.push(this.ip);
    },

    restoreCtx() {
        this.ip = this.pop();
        this.cs = this.pop();
        this.flags = this.pop();
    },
};

// debugging
// window.X86 = X86;
// window.Graphics = Graphics;
// window.MMU = MMU;
