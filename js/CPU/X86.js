/*

  0-3FF        IVT (Interrupt Vector Table)
  400-5FF      BDA (BIOS Data Area)
  600-9FFFF    ordinary application RAM <-- the place where our programs will be, probably :)
  A0000-BFFFF  Video memory
  C0000-EFFFF  Optional ROMs (the VGA ROM is usually located at C0000)
  F0000-FFFFF  BIOS ROM

*/

define(['MMU', 'Graphics', 'TextDisplay', 'Utils'], function(MMU, Graphics, TextDisplay, Utils) {
    var X86 = {
        // Flags masks
        FLAG_CF: 0x0001,
        FLAG_PF: 0x0004,
        FLAG_AF: 0x0010,
        FLAG_ZF: 0x0040,
        FLAG_SF: 0x0080,
        FLAG_OF: 0x0800,
        FLAG_TF: 0x0100,
        FLAG_IF: 0x0200,
        FLAG_DF: 0x0400,
        FLAG_IOPL: 0x3000,
        FLAG_NT: 0x4000,
        ST_STOPPED: 0,
        ST_RUNNING: 1,
        ST_PAUSED: 2,
        MODE_NORMAL: 0,
        MODE_STEP: 1,
        MODE_STEP_OVER: 2,
        ax: 0,
        bx: 0,
        cx: 0,
        dx: 0,

        si: 0,
        di: 0,
        bp: 0,
        sp: 0,
        ds: 0,	// data segment register
        es: 0,	// extra segment register
        ss: 0,	// stack segment register
        cs: 0,	// code segment
        ip: 0,	// instruction pointer

        ah: function(val){if (arguments.length) { this.ax &= 0x00FF; this.ax |= (val << 8); } else return (this.ax >> 8); },
        al: function(val){if (arguments.length) { this.ax &= 0xFF00; this.ax += val; } else return (this.ax & 0x00FF); },
        bh: function(val){if (arguments.length) { this.bx &= 0x00FF; this.bx |= (val << 8); } else return (this.bx >> 8); },
        bl: function(val){if (arguments.length) { this.bx &= 0xFF00; this.bx += val; } else return (this.bx & 0x00FF); },
        ch: function(val){if (arguments.length) { this.cx &= 0x00FF; this.cx |= (val << 8); } else return (this.cx >> 8); },
        cl: function(val){if (arguments.length) { this.cx &= 0xFF00; this.cx += val; } else return (this.cx & 0x00FF); },
        dh: function(val){if (arguments.length) { this.dx &= 0x00FF; this.dx |= (val << 8); } else return (this.dx >> 8); },
        dl: function(val){if (arguments.length) { this.dx &= 0xFF00; this.dx += val; } else { return (this.dx & 0x00FF); }},

        flags: this.FLAG_IF,	// only interrupt flag is set at startup

        regTable: [
            ['al', 'cl', 'dl', 'bl', 'ah', 'ch', 'dh', 'bh'],	// w == 0
            ['ax', 'cx', 'dx', 'bx', 'sp', 'bp', 'si', 'di'],	// w == 1
            ['es', 'cs', 'ss', 'ds']							// sregs when (mod == 11b)
        ],

        BP: [],	// array of breakpoints

        status: this.ST_STOPPED,
        mode: this.MODE_NORMAL,
        previousOp: null,
        nextOpCode: null,
        cpuConsole: null,

        version: '0.3',
        cycles: 0,

        setOpCodesTable: function(opCodes) {
            this.opCodes = opCodes;
        },

        // resets the CPU
        reset: function()
        {
            console.log('reseting CPU ! Not much for now :)');
            this.flags = this.FLAG_IF;
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

            this.status = this.ST_STOPPED;
            this.mode = this.MODE_NORMAL;
            this.previousOp = null;
            this.nextOpCode = null;

            this.cycles = 0;

            // map cs:ip to FFFFh:0000h, default for 80x86
            this.cs = 0xFFFF;
            this.ip = 0x0000;
        },

        fetchNext: function()
        {
            // TODO: should be hardcoded for each instruction
            this.cycles++;
            // Console.log('Next Op: [IP=' + this.ip.toHex() + '] => ' + MMU.rbs(this.cs, this.ip).toHex());
            return MMU.rbs(this.cs, this.ip);
        },

        // modrm needs w for proper reg: 0 for 8bit, 1 for 16bit ones
        modrm: function(w)
        {
            // get reg
            var modByte = this.ipnext(1);
            var reg = (modByte >> 3) & 0x7;

            return {
                regName: this.regTable[w][reg],
                reg: reg,
                mod: (modByte >> 6) & 0x3,
                rm: modByte & 0x7,
                regName2: this.regTable[w][modByte & 0x7]	// destination reg (may not have any meaning if unused for this opcode)
            };
        },

        push: function(value)
        {
            this.sp -= 2;
            MMU.wws(X86.ss, X86.sp, value, true);
        },

        pop: function(value)
        {
            var value = MMU.rws(X86.ss, X86.sp);
            this.sp += 2;
            return value;
        },

        loadbs: function(seg, addr, reg)
        {
            if (arguments.length < 3)
                throw "loadbs requires two arguments, called with only " + arguments.length;

            try{
                if (typeof this[reg] === 'function') {
                     this[reg](MMU.rbs(seg, addr));
                } else {
                     this[reg] = MMU.rbs(seg, addr);
                }
            }
            catch(err)
            {
                console.log('unknown reg: ' + reg);
            }
        },

        loadws: function(seg, addr, reg)
        {
            if (arguments.length < 3)
                throw "loadws requires two arguments, called with only " + arguments.length;

            try{
                // console.log('reading ' + seg + ':' + addr + ' into ' + reg);
                this[reg] = MMU.rws(seg, addr);
            }
            catch(err)
            {
                console.log('unknown reg: ' + reg);
            }
        },

        getregbs: function(reg, reg2)
        {
            return MMU.rbs(this[reg], this[reg2]);
        },

        getregws: function(reg, reg2)
        {
            return MMU.rws(this[reg], this[reg2]);
        },

        // returns the opadd
        getOpAdd: function(rm, off, seg)
        {
            // console.log('getOpAdd: ' + rm + ', seg = ' + seg + ', off = ' + off.toHex());
            if (!rm)
            {
                throw('getOpAdd: rm = 0 ! => bx << 4 + si ?!');
                return (X86.bx << 4) + X86.si + off;
            }
            else if (rm == 1)
            {
                throw('getOpAdd: rm = 1 ! => bx << 4 + di ?!');
                return (X86.bx << 4) + X86.di + off;
            }
            else if (rm == 2)
            {
                throw('getOpAdd: rm = 2 ! => bp << 4 + si ?!');
                return (X86.bp << 4) + X86.si + off;
            }
            else if (rm == 3)
            {
                throw('getOpAdd: rm = 3 ! => bp << 4 + di ?!');
                return (X86.bp << 4) + X86.di + off;
            }
            else if (rm == 4)
            {
                throw('getOpAdd: rm = 4 ! => ' + seg + ' << 4 + si ?!');
                return (X86[seg] << 4) + X86.si + off;
            }
            else if (rm == 5)
            {
                // throw('getOpAdd, RM == 5');
                return (X86[seg] << 4) + X86.di + off;
            }
            else if (rm == 6)	// seg:[off]	// TODO: unit test this case !!
            {
                // throw('getOpAdd: rm = 6 ! => bp << 4 ?!');
                return (X86[seg] << 4) + off;
                throw('dtc !');
                // return (X86.bp << 4) + off;
            }
            else	// seg:[bx+off]	// TODO: unit test this case !!
            {
                // throw('getOpAdd: rm = 7 ! => bp << 4 ?!');
                // return (X86.bx << 4) + off;
                return (X86[seg] << 4) + X86.bx + off;
            }
        },

        // test
        getOpAdd1: function(rm, off, set)
        {
            switch(rm) {
                case 6:
                    console.log('need to test me!');
                    return ((X86['ss'] << 4) + X86.bp + off);
                break;

                default:
                    throw('rm not implemented not implemented for getOpAdd1');
                break;
            }
        },

        // TODO: check boundaries !!
        sreg: function(reg)
        {
            return this.regTable[2][reg];
        },

        // TODO: check boundaries !!
        regw: function(reg)
        {
            return this.regTable[1][reg];
        },

        // TODO: check boundaries !!
        regb: function(reg)
        {
            return this.regTable[0][reg];
        },

        // NEEDS testing !!
        // TODO: fix overflow !
        incw: function(reg)
        {
            X86[reg]++;
            if (X86[reg] > 0xFFFF)
                X86[reg] = 0;
        },

        addwval: function(val, sum)
        {
            if ((val + sum) > 0xFFFF)
                val = sum - (0x10000 - val);
            else
                val += sum;

            return val;
        },

        addw: function(reg, sum)
        {
            if ((this[reg] + sum) > 0xFFFF)
                this[reg] = sum - (0x10000 - this[reg]);
            else
                this[reg] += sum;

            return this[reg];
        },

        decw: function(reg)
        {
            if (!this[reg])
                this[reg] = 0xFFFF;
            else
                this[reg]--;
        },

        subw: function(reg, dec)
        {
            if (dec > this[reg])
                this[reg] = 0x10000 - (dec - this[reg]);
            else
                this[reg] -= dec;

            return this[reg];
        },

        // upd counters
        // TODO: FLAGS ?!!
        upidx: function()
        {
            if (this.getFlag(this.FLAG_DF))
            {
                this.decw('di');
                this.decw('si');
            }
            else
            {
                this.incw('di');
                this.incw('si');
            }
        },

        // upd counters
        // TODO: FLAGS ?!!
        updi: function()
        {
            if (this.getFlag(this.FLAG_DF))
            {
                this.decw('di');
            }
            else
            {
                this.incw('di');
            }
        },

        upsi: function()
        {
            if (this.getFlag(this.FLAG_DF))
            {
                this.decw('si');
            }
            else
            {
                this.incw('si');
            }
        },

        updiw: function()
        {
            if (this.getFlag(this.FLAG_DF))
            {
                this.subw('di', 2);
            }
            else
            {
                this.addw('di', 2);
            }
        },

        upsiw: function()
        {
            if (this.getFlag(this.FLAG_DF))
            {
                this.subw('si', 2);
            }
            else
            {
                this.addw('si', 2);
            }
        },

        // returns the byte pointed by cs:ip+off
        ipnext: function(off)
        {
            return MMU.rbs(this.cs, this.ip + off);
        },

        // returns the word pointed by cs:ip+off
        ipnextw: function(off)
        {
            return MMU.rws(this.cs, this.ip + off);
        },

        executeOpCode: function(opCode)
        {
            if (!(this.cycles % 55000))
            {
                this.updateCpuConsole();
                console.log(opCode.toHex());
            }

            try
            {
                /*
                if (opCode == 0x8A)
                    OpCodes2[MMU.rbs(X86.cs, X86.ip + 1)]();
                else
                */
                // if (opCode === 128) {
                //     debugger;
                // }
                this.opCodes[opCode]();
            }
            catch(err)
            {
                if (opCode == 0x8A)
                    Graphics.println('unknown Multi OpCode: ' + MMU.rbs(X86.cs, X86.ip + 1).toHex() + ' [cycles=' + X86.cycles + ']');
                else
                    Graphics.println('unknown OpCode: ' + opCode.toHex() + ' [' + err + '] at ' + X86.cs.toHex() + ':' + X86.ip.toHex() + ' [cycles=' + X86.cycles + ']');
                // maybe we should wait for user input ?
                this.stop();
            }
        },

        addBP: function(cs, ip)
        {
            this.BP.push([cs, ip]);
            console.log('BP added to ' + cs.toHex() + ':' + ip.toHex() + ' (' + ((cs << 4) + ip) + ')');
        },

        isBP: function()
        {
            for (var i = 0; i < this.BP.length; i++)
            {
                if ((this.BP[i][0] == X86.cs) && (this.BP[i][1] == X86.ip))
                    return true;
            }
            return false;
        },

        listBP: function()
        {
            if (!this.BP.length)

                console.log('No BP defined.');
            else
                for (var i = 0; i < this.BP.length; i++)
                {
                    console.log(i + '=' + this.BP[i][0].toHex() + ':' + this.BP[i][1].toHex());
                }
        },

        rmBP: function(i)
        {
            console.log('BP ' + this.BP[i][0].toHex() + ':' + this.BP[i][1].toHex() + ' removed');
            this.BP.slice(i, 1);
        },

        updateCpuConsole: function()
        {
            // print out register values
            this.cpuConsole.printAt(0, 4, this.ax.toHex());
            this.cpuConsole.printAt(0, 15, this.si.toHex());
            this.cpuConsole.printAt(0, 26, this.ds.toHex());
            this.cpuConsole.printAt(0, 37, this.es.toHex());
            this.cpuConsole.printAt(0, 48, this.ss.toHex());

            // print out seg regs
            this.cpuConsole.printAt(1, 4, this.bx.toHex());
            this.cpuConsole.printAt(1, 15, this.di.toHex());
            this.cpuConsole.printAt(1, 26, this.cs.toHex());
            this.cpuConsole.printAt(1, 37, this.ip.toHex());

            this.cpuConsole.printAt(2, 4, this.cx.toHex());
            this.cpuConsole.printAt(2, 15, this.bp.toHex());

            // flags
            this.cpuConsole.printAt(2, 23, this.getFlag(this.FLAG_CF));
            this.cpuConsole.printAt(2, 27, this.getFlag(this.FLAG_ZF));
            this.cpuConsole.printAt(2, 31, this.getFlag(this.FLAG_SF));

            this.cpuConsole.printAt(2, 35, this.getFlag(this.FLAG_OF));
            this.cpuConsole.printAt(2, 39, this.getFlag(this.FLAG_AF));
            this.cpuConsole.printAt(2, 43, this.getFlag(this.FLAG_PF));
            this.cpuConsole.printAt(2, 47, this.getFlag(this.FLAG_DF));
            this.cpuConsole.printAt(2, 51, this.getFlag(this.FLAG_IF));
            this.cpuConsole.printAt(2, 55, this.getFlag(this.FLAG_TF));

            this.cpuConsole.printAt(3, 4, this.dx.toHex());
            this.cpuConsole.printAt(3, 15, this.sp.toHex());

            switch(this.status)
            {
                case this.ST_RUNNING:
                    this.cpuConsole.printAt(4, 8, 'Running                   ');
                break;

                case this.ST_PAUSED:
                    this.cpuConsole.printAt(4, 8, 'Press <F9> to continue...');
                break;

                case this.ST_STOPPED:
                    this.cpuConsole.printAt(4, 8, 'Stopped                    ');
                break;

                default:
                    this.cpuConsole.printAt(4, 8, 'Idle                    ');
            }
        },

        runLoop: function()
        {
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
            if (this.status === this.ST_RUNNING)
            {
                this.nextOpCode = this.fetchNext();

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
                setTimeout(this.runLoop.bind(this), 0);
            }
        },

        // starts the execution of the instruction at cs:ip
        start: function()
        {
            console.log('start');

            X86.status = X86.ST_RUNNING;

            this.runLoop();

            return;

            var pending = null;
            if (!this.nextOpCode)
                this.nextOpCode = this.fetchNext();
            // this.status = this.ST_RUNNING;

            /*
            if (this.status === this.ST_RUNNING)
            {
                this.runLoop();
                return;
            }

            throw('oops');
            */

            while (this.status === this.ST_RUNNING)
            {
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
                if (this.mode === this.MODE_STEP || this.isBP())
                {
                    this.updateCpuConsole();
                    Graphics.println('Waiting to Execute: ' + this.nextOpCode.toHex() + ' <1=cont, 2=step, 3=step over>');
                    break;
                }
                else if (this.mode === this.MODE_STEP_OVER && this.lastOp != this.nextOpCode) // only exit if we're not executing REPE stuff in step over
                {
                    this.updateCpuConsole();
                    Graphics.println('Waiting to Execute: ' + this.nextOpCode.toHex() + ' <1=cont, 2=step, 3=step over>');
                    break;
                }
                else if (!(this.cycles % 1000))
                    this.updateCpuConsole();
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

        stop: function()
        {
            this.status = this.ST_STOPPED;
            Graphics.println('Execution STOPPED.');
            this.updateCpuConsole();
        },

        setFlag: function(FLAG, test)
        {
            if (test)
                this.flags |= FLAG;		// sets specified bit
            else
                this.flags &=~ FLAG;	// resets specified bit
        },

        getFlag: function(FLAG)
        {
            return (this.flags & FLAG) ? 1 : 0;
        },

        init: function()
        {
            var that = this;
            Graphics.println("Starting JSx86 v" + this.version);
            Graphics.println("Choose a program and press <GO> to start experimenting ! ;)");

            this.cpuConsole = new TextDisplay('cpu', 5, 58);
            this.cpuConsole.println('AX: 0000   SI: 0000   DS: 0000   ES: 0000   SS: 0000');
            this.cpuConsole.println('BX: 0000   DI: 0000   CS: 0000   IP: 0000');
            this.cpuConsole.println('CX: 0000   BP: 0000   C   Z   S   O   A   P   D   I   T');
            this.cpuConsole.println('DX: 0000   SP: 0000');
            this.cpuConsole.printAt(4, 0, 'Status: Idle');
        },

        saveCtx: function()
        {
            X86.push(X86.flags);
            X86.push(X86.cs);
            X86.push(X86.ip);
        },

        restoreCtx: function()
        {
            X86.ip = X86.pop();
            X86.cs = X86.pop();
            X86.flags = X86.pop();
        }
    };

    // debugging
    window.X86 = X86;
    window.Graphics = Graphics;
    window.MMU = MMU;

    return X86;
});
