/*

aaa, aad, aam, aas, adc, add, and, call, cbw, clc, cld, cmc, cmp, cmpsb, cmpsw, cwd, daa, das, dec, div, esc, hlt, idiv, imul, in, inc, into, ja, jae, jb, jbe, jc, jcxz, je, jg, jge, jl, jle, jmp, jna, jnae, jnb, jnbe, jnc, jne, jng, jnge, jnl, jnle, jno, jnp, jns, jnz, jo, jp, jpe, jpo, js, jz, lahf, lds, lea, les, lock, lodsb, lodsw, loop, loope, loopne, loopnz, loopz, mov, movsb, movsw, mul, neg, nop, not, or, rcl, rcr, rep, repe, repne, repnz, repz, ret, rol, ror, sahf, sal, sar, sbb, scasb, scasw, shl, shr, stc, std, sti, stosb, stosw, sub, test, wait, xchg, xlat, xor

*/

define(['Flags', 'MMU', 'IntServer', 'IOHandler'], function(Flags, MMU, IntServer, IOHandler) {
    var X86 = require('X86');

    var OP_INCW = 1,
        OP_ADDW = 2,
        OP_DECW = 3,
        OP_XORW = 4,
        OP_SUBW = 5,
        OP_CMPW = 6,
        OP_NEGW = 7,
        OP_NEGB = 8,
        OP_SUBB = 9,
        OP_CMPB = 10,
        OP_SHRW = 11,
        OP_SALW = 12,
        OP_SHLW = 12,
        OP_SARW = 13,
        OP_ORW  = 14,
        OP_ANDB = 15,
        OP_CMPW = 16,
        OP_ANDW = 17,
        OP_XORB = 18;

    var INTS = X86.INTS;

    var OpCodes = {

        // ADD r/m16, r16
        0x01: function(override)
        {
            var seg = override ? override : 'ds',
            reg = X86.modrm(1);
            // console.log(reg);
            // DEBUG console.log('called 01 with ' + seg);

            if (reg.mod == 0)	// indirect (+ displacement)
            {
                var dest = reg.regName,
                    // off = (reg.rm == 6) ? MMU.rws(X86.ds, X86.ipnextw(2)) : 0,
                    off = (reg.rm == 6) ? X86.ipnextw(2) : 0,
                    srcAddr = X86.getOpAdd(reg.rm, off, seg);

                // DEBUG console.log('reg.mod == 0 !');

                // set x + y
                lf.var2 = X86[reg.regName];
                // DEBUG console.log('reg op2: ' + reg.regName + ' => ' + lf.var2.toHex());
                // DEBUG console.log('src addr = ' + off.toHex() + ' => ' + srcAddr.toHex());

                // get src addr
                lf.var1 = MMU.rw(srcAddr);
                // console.log('var1 = ' + lf.var1.toHex());
                // get result
                lf.res = X86.addwval(lf.var1, lf.var2);
                // console.log('result = ' + lf.res.toHex());

                // write it back to memory
                MMU.ww(srcAddr, lf.res, true);

                if (off)
                    X86.ip += 4;
                else
                    X86.ip += 2;
            }
            else
                throw('Unhandled mod ' + reg.mod.toHex() + ' for opcode 0x01 !');

            Flags.setFlagsFromOp(OP_ADDW);
        },

        // ADD r16, r/m16 => adds r/m16 to r16
        0x03: function()
        {
            var reg = X86.modrm(1);

            // no displacement
            if (reg.mod == 0)
            {
                // abs address ?
                if (reg.rm == 6)
                {
                    lf.var1 = X86[reg.regName];
                    lf.var2 = MMU.rws(X86.ds, X86.ipnextw(2));
                    // *** X86[reg.regName] += MMU.rws(X86.ds, X86.ipnextw(2));
                    lf.res = X86.addw(reg.regName, MMU.rws(X86.ds, X86.ipnextw(2)));
                    X86.ip += 4;
                }
                else	// displacement
                {
                    throw('Unsupported rm displacement for 0x03 !');
                }
            }
            else if (reg.mod == 3)
            {
                lf.var1 = X86[reg.regName];
                lf.var2 = X86[reg.regName2];
                // *** X86[reg.regName] += MMU.rws(X86.ds, X86.ipnextw(2));
                lf.res = X86.addw(reg.regName, lf.var2);
                X86.ip += 2;
            }
            else
                throw('Unsupported mod for 0x03 Opcode: ' + reg.mod);

            /*
            var reg = X86.modrm(1).regName;
            console.log('** 0x03 debug **');
            console.log('reg = ' + reg);
            console.log('dis = ' + X86.ipnextw(2).toHex());
            console.log('rw: ' + MMU.rws(X86.ds, X86.ipnextw(2)).toHex());
            console.log(X86.modrm(1));
            // get rm info
            X86[reg] += MMU.rws(X86.ds, X86.ipnextw(2));
            */

            Flags.setFlagsFromOp(OP_ADDW);
        },

        // ADD AX, <im16>
        0x05: function()
        {
            lf.var1 = X86.ax;
            lf.var2 = MMU.rws(X86.cs, X86.ip + 1);
            lf.res = X86.addw('ax', MMU.rws(X86.cs, X86.ip + 1));

            // console.log('adding: ' + MMU.rws(X86.cs, X86.ip + 1));
            Flags.setFlagsFromOp(OP_ADDW);
            X86.ip += 3;
        },

        // PUSH ES
        0x06: function()
        {
            Ops.pushReg('es');
            X86.ip++;
        },

        // POP ES
        0x07: function()
        {
            Ops.popReg('es');
            X86.ip++;
        },

        // PUSH CS
        0x0E: function()
        {
            Ops.pushReg('cs');
            X86.ip++;
        },

        // PUSH SS
        0x16: function()
        {
            Ops.pushReg('ss');
            X86.ip++;
        },

        // PUSH DS
        0x1E: function()
        {
            Ops.pushReg('ds');
            X86.ip++;
        },

        // POP DS
        0x1F: function()
        {
            Ops.popReg('ds');
            X86.ip++;
        },

        // AND AL, imm8
        0x24: function()
        {
            X86.al(Ops.andb(X86.al(), X86.ipnext(1)));
            Flags.setFlagsFromOp(OP_ANDB);
            X86.ip +=2;
        },

        // PUSH BX
        0x25: function()
        {
            Ops.pushReg('bx');
            X86.ip++;
        },

        // Segment Override => ES
        0x26: function()
        {
            // place IP to the byte so we can get the opcode
            X86.ip++;

            if (!(X86.ipnext(0) & (1|0x8B)))
                throw('ERROR ! Segment override not handled for opcode ' + X86.ipnext(0).toHex());

            // call the opcode with the segment override specified
            OpCodes[X86.ipnext(0)]('es');
        },

        // SUB r/m16, r16 -> r/m16 - r16
        0x29: function()
        {
            var reg = X86.modrm(1);

            switch(reg.mod)
            {
                case 3:
                    lf.var1 = X86[X86.regw(reg.rm)];
                    lf.var2 = X86[reg.regName];
                    lf.res = X86.subw(X86.regw(reg.rm), lf.var2);
                    Flags.setFlagsFromOp(OP_SUBW);
                    X86.ip += 2;
                break;

                default:
                    throw('Unknown MOD for 0x29: ' + reg.mode);
            }
        },

        // SUB r16, r/m16
        0x2B: function()
        {
            var reg = X86.modrm(1);

            switch(reg.mod)
            {
                case 3:
                    // console.log(X86.regw(reg.rm));
                    // console.log(reg.regName);
                    lf.var2 = X86[X86.regw(reg.rm)];
                    lf.var1 = X86[reg.regName];
                    lf.res = X86.subw(reg.regName, lf.var2);
                    Flags.setFlagsFromOp(OP_SUBW);
                    X86.ip += 2;
                break;

                default:
                    throw('Unknown MOD for 0x2B: ' + reg.mode);
            }
        },

        // SUB ax, imm16
        0x2D: function()
        {
            lf.var1 = X86.ax;
            lf.var2 = X86.ipnextw(1);
            console.log(lf.var2.toHex());
            lf.res = X86.subw('ax', lf.var2);
            Flags.setFlagsFromOp(OP_SUBW);
            X86.ip += 3;
        },

        // Segment prefix override: CS
        0x2E: function()
        {
            // place IP to the byte so we can get the opcode
            X86.ip++;

            if (X86.ipnext(0) != 0xFF && X86.ipnext(0) != 0xF6)
                throw('ERROR ! Segment override not handled for opcode ' + X86.ipnext(0).toHex());

            // call the opcode with the segment override specified
            OpCodes[X86.ipnext(0)]('cs');
        },

        // XOR reg16, r/m reg 16
        0x31: function()
        {
            var mod = X86.modrm(1);

            X86[mod.regName2] ^= X86[mod.regName];
            lf.res = X86[mod.regName2];
            Flags.setFlagsFromOp(OP_XORW);

            /*
            var nextOpcode = X86.ipnext(1);

            // XOR,XOR
            if (nextOpcode == 0xC0)
            {
                X86.setFlag(X86.FLAG_ZF, true);
                X86.setFlag(X86.FLAG_PF, true);
                X86.ax = 0;
            }
            else if (nextOpcode == 0xC3)
            {
                X86.bx ^= X86.ax;
                X86.setFlag(X86.FLAG_ZF, (X86.bx == 0));
                X86.setFlag(X86.FLAG_PF, !(X86.bx % 2));
            }
            else if (nextOpcode == 0xC9)
            {
                X86.setFlag(X86.FLAG_ZF, true);
                X86.setFlag(X86.FLAG_PF, true);
                X86.cx = 0;
            }
            else if (nextOpcode == 0xCB)
            {
                X86.bx ^= X86.cx;
                X86.setFlag(X86.FLAG_ZF, (X86.bx == 0));
                X86.setFlag(X86.FLAG_PF, !(X86.bx % 2));
            }
            else if (nextOpcode == 0xD2)
            {
                X86.setFlag(X86.FLAG_ZF, true);
                X86.setFlag(X86.FLAG_PF, true);
                X86.dx = 0;
            }
            else if (nextOpcode == 0xD3)
            {
                X86.bx ^= X86.dx;
                X86.setFlag(X86.FLAG_ZF, (X86.bx == 0));
                X86.setFlag(X86.FLAG_PF, !(X86.bx % 2));
            }
            else if (nextOpcode == 0xDB)
            {
                X86.setFlag(X86.FLAG_ZF, true);
                X86.setFlag(X86.FLAG_PF, true);
                X86.bx = 0;
            }
            */

            X86.ip += 2;
        },

        // XOR r8,r/m8 r8
        0x32: function()
        {
            var mod = X86.modrm(0);
            if (mod.mod == 3)
            {
                var reg1 = X86[mod.regName];
                reg1(reg1() ^ X86[mod.regName2]());
                lf.res = reg1();
                Flags.setFlagsFromOp(OP_XORB);
                X86.ip += 2;
            }
            else
                throw('Unhandled MOD for opcode 0x32: ' + mod.mod.toHex());
        },

        // XOR reg16, r/m reg 16
        0x33: function()
        {
            var mod = X86.modrm(1);

            if (mod.mod == 3)
            {
                X86[mod.regName] ^= X86[mod.regName2];
                lf.res = X86[mod.regName];
                Flags.setFlagsFromOp(OP_XORW);
                X86.ip += 2;
            }
            else
                throw('Unhandled MOD for opcode 0x33: ' + mod.mod.toHex());
        },

        // segment prefix override: SS
        0x36: function()
        {
            // place IP to the byte so we can get the opcode
            X86.ip++;

            if ((X86.ipnext(0) != 0x89) && (X86.ipnext(0) != 0xA3) && (X86.ipnext(0) != 0x8C))
                throw('ERROR ! Segment override not handled for opcode ' + X86.ipnext(0).toHex());

            // call the opcode with the segment override specified
            OpCodes[X86.ipnext(0)]('ss');
        },

        // CMP AL, imm8
        0x3C: function()
        {
            lf.var1 = X86.al();
            lf.var2 = X86.ipnext(1);
            // TODO: sign-extended ?! FIX ME !!
            lf.res = lf.var1 - lf.var2;
            Flags.setFlagsFromOp(OP_CMPB);
            X86.ip += 2;
        },

        // INC BP
        0x45: function()
        {
            // is that ok ??
            lf.var1 = X86.bp;
            lf.var2 = 1;

            X86.incw('bp');
            X86.ip++;

            lf.res = X86.bp;
            Flags.setFlagsFromOp(OP_INCW);
        },

        // INC SI
        0x46: function()
        {
            // is that ok ??
            lf.var1 = X86.si;
            lf.var2 = 1;

            X86.incw('si');
            X86.ip++;

            lf.res = X86.si;
            Flags.setFlagsFromOp(OP_INCW);
        },

        // INC DI
        0x47: function()
        {
            // is that ok ??
            lf.var1 = X86.di;
            lf.var2 = 1;

            X86.incw('di');
            X86.ip++;

            lf.res = X86.di;
            Flags.setFlagsFromOp(OP_INCW);
        },

        // DEC AX
        0x48: function()
        {
            lf.var1 = X86.ax;
            X86.decw('ax', 1);

            lf.res = X86.ax;
            Flags.setFlagsFromOp(OP_DECW);

            X86.ip++;
        },

        // dec SI
        // TODO: handle overflow !!! :)
        0x4E: function()
        {
            lf.var1 = X86.si;
            X86.decw('si', 1);

            lf.res = X86.si;
            Flags.setFlagsFromOp(OP_DECW);

            X86.ip++;
        },

        // dec DI
        0x4F: function()
        {
            lf.var1 = X86.di;
            X86.decw('di', 1);

            lf.res = X86.di;
            Flags.setFlagsFromOp(OP_DECW);

            X86.ip++;
        },

        // PUSH AX
        0x50: function()
        {
            Ops.pushReg('ax');
            X86.ip++;
        },

        // PUSH BP
        0x55: function()
        {
            Ops.pushReg('bp');
            X86.ip++;
        },

        // POP AX
        0x58: function() {
            X86.ax = MMU.pop();
            X86.ip++;
        },

        // POP BP
        0x5D: function() {
            X86.bp = MMU.pop();
            X86.ip++;
        },

        // PUSH <val>
        0x68: function() {
            MMU.push(MMU.rws(X86.cs, X86.ip + 1));
            X86.ip += 3;
        },

        // JC <near>
        0x72: function()
        {
            if (X86.getFlag(X86.FLAG_CF))
            {
                var off = X86.ipnext(1);
                if (off & 0x80)
                    X86.ip -= (0xfe - off);
                else
                    X86.ip += (off + 2);
            }
            else
                X86.ip += 2;
        },

        // JNC <near>
        0x73: function()
        {
            if (!X86.getFlag(X86.FLAG_CF))
            {
                var off = X86.ipnext(1);
                if (off & 0x80)
                    X86.ip -= (0xfe - off);
                else
                    X86.ip += (off + 2);
            }
            else
                X86.ip += 2;
        },

        // JE|JZ <near>
        0x74: function()
        {
            if (X86.getFlag(X86.FLAG_ZF))
            {
                var off = X86.ipnext(1);
                if (off & 0x80)
                    X86.ip -= (0xfe - off);
                else
                    X86.ip += (off + 2);
            }
            else
                X86.ip += 2;
        },

        // JNE|JNZ <near>
        0x75: function()
        {
            if (!X86.getFlag(X86.FLAG_ZF))
            {
                var off = X86.ipnext(1);
                if (off & 0x80)
                    X86.ip -= (0xfe - off);
                else
                    X86.ip += (off + 2);
            }
            else
                X86.ip += 2;
        },

        // POP ES
        0x7F: function()
        {
            Ops.popReg('es');
            X86.ip++;
        },

        // multi opcode
        // 0 ADD r/m8, imm8
        // 1 OR r/m8, imm8
        // 2 ADC r/m8, imm8
        // 3 SBB r/m8, imm8
        // 4 AND r/m8, imm8
        // 5 SUB r/m8, imm8
        // 6 XOR r/m8, imm8
        // 7 CMP r/m8, imm8
        0x80: function(override)
        {
            var reg = X86.modrm(0),
                seg = override ? override : 'ds';

            switch(reg.reg) {
                // 4 AND r/m8, imm8	r/m8
                case 4:
                    var off = X86.ipnextw(2),
                        srcAddr = X86.getOpAdd(reg.rm, off, seg);

                    throw('to do !');
                break;

                default:
                    throw('reg' + reg.reg + ' not implemented for multi-opOcode 0x80!');
                break;
            }
            console.log(reg);
            throw('TODO: implement 0x80 !');
        },

        // 0 ADD r/m16, imm16
        // x ADC r/m16, imm16
        // 7 CMP r/m16, imm16
        0x81: function()
        {
            var reg = X86.modrm(1);

            if (reg.reg == 0)	// ADD r/m16, imm16
            {
                lf.var1 = X86[reg.regName2];
                lf.var2 = X86.ipnextw(2);
                lf.res = X86.addwval(lf.var1, lf.var2);
                Flags.setFlagsFromOp(OP_ADDW);
                X86[reg.regName2] = lf.res;
                X86.ip += 4;
                // throw('unimplemented mod reg 0 for opcode 0x81 !' + reg.regName2);
            }
            else if (reg.reg == 7)	// CMP r/m16, imm16
            {
                lf.var1 = X86[reg.regName2];
                lf.var2 = X86.ipnextw(2);
                lf.res = lf.var1 - lf.var2;
                Flags.setFlagsFromOp(OP_CMPW);
                X86.ip += 4;
            }
            else
            // Need to handle so !!
            throw('unimplemented so for opcode 0x81 !');
        },

        // OR r/m16, imm8 r/m16 or CMP ?!!
        0x83: function()
        {
            var reg = X86.modrm(1);
            // if (reg.mod == 3)
            if (reg.reg == 1)
            {
                lf.var1 = X86[X86.regw(reg.rm)];
                lf.res = X86[X86.regw(reg.rm)] = (lf.var1 | (0xFF00 | X86.ipnext(2)));
                // console.log(lf.var1.toHex() + ' | ' + (0xFF00 | X86.ipnext(2)).toHex());
                Flags.setFlagsFromOp(OP_ORW);
                X86.ip += 3;
            }
            else if (reg.reg == 7)	// CMP r/m16,imm8
            {
                lf.var1 = X86[reg.regName];
                lf.var2 = (0xFF00 | X86.ipnext(2));	// sign extended ?!
                lf.res = lf.var1 - lf.var2;
                Flags.setFlagsFromOp(OP_CMPW);
                X86.ip += 3;
            }
            else if (reg.reg == 4)	// AND
            {
                console.log(reg);
                lf.var1 = X86[reg.regName];
                lf.var2 = 0xFF00 | X86.ipnext(2);
                console.log(lf.var2.toHex());
                X86[reg.regName] = Ops.andw(lf.var1, lf.var2);
                Flags.setFlagsFromOp(OP_ANDW);
                X86.ip += 3;
            }
            else
                throw('Unhandled so for 0x83 opcode !');
        },

        // MOV r/m16, r16
        0x89: function(override)
        {
            var reg = X86.modrm(1),
                seg = override ? override : 'ds',
                off = (reg.rm == 6) ? X86.ipnextw(2) : 0,
                srcAddr = X86.getOpAdd(reg.rm, off, seg);

            MMU.ww(srcAddr, X86[reg.regName], true);

            X86.ip += 4;
        },

        // MOV r8, r/m8
        0x8A: function()
        {
            var reg = X86.modrm(0);

            if (reg.mod == 3)	// reg8 = reg8
            {
                X86[reg.regName](X86[X86.regb(reg.rm)]());
                X86.ip += 2;
            }
            else
                throw('unsupported MOD for 0x8A !');
        },

        // MOV r16, r/m16
        0x8B: function(override)
        {
            var reg = X86.modrm(1),
                seg = override ? override : 'ds';

            if (override)
            {
                console.log(reg);
            }

            switch(reg.mod)
            {
                case 0:	// abs address + DS hardcoded in this case ?? => test !
                    if (reg.rm == 6)
                    {
                        // OK
                        // X86[reg.regName] = MMU.rws(X86[seg], X86.ipnextw(2));
                        var off = X86.ipnextw(2),
                        srcAddr = X86.getOpAdd(reg.rm, off, seg);
                        X86[reg.regName] = MMU.rw(srcAddr);
                        X86.ip += 4;
                    }
                    else
                        throw('Unsupported displacement method for Opcode 0x8B, mod == 0 !');
                break;

                // mod == 1 => 8 bit displacement only
                case 1:
                    console.log(reg);
                    var off = X86.ipnext(2);
                    var srcAddr = X86.getOpAdd1(reg.rm, off, seg);
                    X86[reg.regName] = MMU.rw(srcAddr);
                    X86.ip += 3;
                break;

                case 3:	// second reg
                    X86[reg.regName] = X86[X86.regw(reg.rm)];
                    X86.ip += 2;
                break;

                default:
                    throw('Unsupported MOD for opcode 0x8B: ' + reg.mod);
                break;
            }
        },

        // MOV r/m16, sreg
        // reg gives sreg (es = 0, cs = 1, ss = 2, ds = 3)
        0x8C: function(override)
        {
            /*
            if (X86.ipnext(1) == 0xC0)
                X86.ax = X86.es;
            else
                throw('Unimplemented opcode: 8C' + X86.ipnext(1).toHex());
            */
            var reg = X86.modrm(1),
                seg = override ? override : 'ds';


            // no displacement...
            if (reg.mod == 0x3)
            {
                X86[reg.regName2] = X86[X86.sreg(reg.reg)];
                X86.ip += 2;
            }
            else if (reg.mod == 0)
            {
                /*
                if (!override)
                    throw('WARN: need to check second register is valid !');
                */

                var off = (reg.rm == 6) ? X86.ipnextw(2) : 0,
                srcAddr = X86.getOpAdd(reg.rm, off, seg);

                MMU.ww(srcAddr, X86[X86.sreg(reg.reg)], true);
                X86.ip += 4;
            }
            else
                throw('Opcode 0x8C: unimplemented MOD: ' + reg.mod);

        },

        // MOV sreg, <r/m16>
        // reg gives sreg (es = 0, cs = 1, ss = 2, ds = 3)
        0x8E: function(override)
        {
            if (override)
                throw('warning ! who\'s calling 0x8E with seg override ?');

            var reg = X86.modrm(1),	// I wonder why we have to pass 1 as W since it's supposed to be 0 (8bit wide reg...)
                seg = override ? override : 'ds';

            // no displacement
            if (reg.mod == 0x3)
            {
                X86[X86.sreg(reg.reg)] = X86[reg.regName2];
                X86.ip += 2;
            }
            else if (reg.mod == 0x0)
            {
                // TEST ME ! what does override changes ?!
                var off = (reg.rm == 6) ? X86.ipnextw(2) : 0,
                srcAddr = X86.getOpAdd(reg.rm, off, seg);

                X86[X86.sreg(reg.reg)] = MMU.rw(srcAddr);
                X86.ip += 4;
            }
            else
                throw('Opcode 0x8E: unimplemented MOD: ' + reg.mod);
            /*
            if (reg.mod == 0x3)
            {
                console.log('debug: src = ' + reg.regName2);
                X86.ds = X86[reg.regName2];
            }
            else
                throw('Opcode 0x8E: unimplemented MOD r/m: ' + X86.ipnext(1).toHex());
            */
        },

        // NOP
        0x90: function()
        {
            X86.ip++;
        },

        // CALL ptr16:16
        0x9A: function()
        {
            var destIP = X86.ipnextw(1),
                destCS = X86.ipnextw(3);

            // we need to position the pointer to the next instruction otherwise when
            // getting back from the call we would call it again...
            X86.ip += 5;

            // first push cs & ip
            Ops.pushReg('cs');
            Ops.pushReg('ip');

            // then jump
            X86.cs = destCS;
            X86.ip = destIP;
        },

        // MOV DS:[WORD], AX
        0xA3: function(override)
        {
            var reg = X86.modrm(1),
            seg = override ? override : 'ds';

            MMU.wws(X86[seg], X86.ipnextw(1), X86.ax, true);

            // ** OK MMU.wws(X86.ds, X86.ipnextw(1), X86.ax, true);
            // console.log('0xA3, [' + X86.ipnextw(1).toHex() + ']');
            X86.ip += 3;
        },

        // MOVS
        // TODO: testing !
        0xA4: function()
        {
            Ops.movs();
            X86.ip++;
        },

        // TEST al, imm8
        0xA8: function()
        {
            Ops.andb(X86.al(), X86.ipnext(1));
            Flags.setFlagsFromOp(OP_ANDB);
            X86.ip +=2;
        },

        // stosb
        0xAA: function()
        {
            Ops.stosb();
            X86.ip++;
        },

        // stosw
        0xAB: function()
        {
            Ops.stosw();
            X86.ip++;
        },

        // lodsb
        0xAC: function()
        {
            Ops.lodsb();
            X86.ip++;
        },

        // lodsw
        0xAD: function()
        {
            Ops.lodsw();
            X86.ip++;
        },

        // SCASB
        // TODO: testing !
        0xAE: function()
        {
            Ops.scasb();
            Flags.setFlagsFromOp(OP_CMPB);
            X86.ip++;
        },

        // MOV AL, <val>
        0xB0: function()
        {
            X86.al(MMU.rbs(X86.cs, X86.ip + 1));
            X86.ip += 2;
        },

        // MOV CL, <val>
        0xB1: function()
        {
            X86.cl(MMU.rbs(X86.cs, X86.ip + 1));
            X86.ip += 2;
        },

        // MOV DL, <val>
        0xB2: function()
        {
            X86.dl(MMU.rbs(X86.cs, X86.ip + 1));
            X86.ip += 2;
        },

        // MOV BL, <val>
        0xB3: function()
        {
            X86.bl(MMU.rbs(X86.cs, X86.ip + 1));
            X86.ip += 2;
        },

        // MOV AH, <val>
        0xB4: function()
        {
            X86.ah(MMU.rbs(X86.cs, X86.ip + 1));
            X86.ip += 2;
        },

        // MOV CH, <val>
        0xB5: function()
        {
            X86.ch(MMU.rbs(X86.cs, X86.ip + 1));
            X86.ip += 2;
        },

        // MOV DH, <val>
        0xB6: function()
        {
            X86.dh(MMU.rbs(X86.cs, X86.ip + 1));
            X86.ip += 2;
        },

        // MOV BH, <val>
        0xB7: function()
        {
            X86.bh(MMU.rbs(X86.cs, X86.ip + 1));
            X86.ip += 2;
        },

        // MOV AX, 16m
        0xB8: function()
        {
            Ops.moveW('ax');
            // move onto the next instruction
            X86.ip += 3;
        },

        // MOV CX, 16m
        0xB9: function()
        {
            Ops.moveW('cx');
            X86.ip += 3;
        },

        // MOV DX, 16m
        0xBA: function()
        {
            Ops.moveW('dx');
            // move onto the next instruction
            X86.ip += 3;
        },

        // MOV BX, 16m
        0xBB: function()
        {
            Ops.moveW('bx');
            // move onto the next instruction
            X86.ip += 3;
        },

        // MOV SP, 16m
        0xBC: function()
        {
            Ops.moveW('sp');
            // move onto the next instruction
            X86.ip += 3;
        },

        // MOV BP, 16m
        0xBD: function()
        {
            Ops.moveW('bp');
            // move onto the next instruction
            X86.ip += 3;
        },

        // MOV SI, 16m
        0xBE: function()
        {
            Ops.moveW('si');
            // move onto the next instruction
            X86.ip += 3;
        },

        // MOV DI, 16m
        0xBF: function()
        {
            Ops.moveW('di');
            X86.ip += 3;
        },

        // RET imm16: returns from procedure then pop imm16 bytes from the stack
        0xC2: function()
        {
            var	numToPop = X86.ipnextw(1);
            Ops.popReg('ip');
            X86.sp += numToPop;
        },

        // RET near
        0xC3: function()
        {
            Ops.popReg('ip');
            // IP unchanged since we just switched it
        },

        // MOV rmw,iw
        0xC7: function() {
            var reg = X86.modrm(1);

            debugger;
            if (reg.reg == 0)	// MOV reg, imm16
            {
                lf.var2 = X86.ipnextw(2);
                X86[reg.regName] = lf.var2;
                X86.ip += 4;
            }
        },

        // RETF
        0xCB: function()
        {
            Ops.popReg('ip');
            Ops.popReg('cs');

            // IP unchanged since we just switched it
        },

        // INT <num>
        0xCD: function()
        {
            console.log('INT: executing int');
            var intNum = MMU.rbs(X86.cs, X86.ip + 1),
                method = IntServer.getInterruptMethod(intNum, X86.ah());

            X86.ip += 2;

            if (method) {
                X86.saveCtx();
                method();
                X86.restoreCtx()
            } else {
                X86.saveCtx();
                X86.ip = vec.off;
                X86.cs = vec.seg;
                // we don't need to restore context for native calls since it will be restored when calling IRET
            }
            // IntServer.execute(intNum, X86.ah());
        },

        // IRET
        // TODO: inc IP here ?!
        0xCF: function()
        {
            console.log('IRET: restoring context');
            // we only need to restore context and execution will continue...
            INTS.restoreCtx();
        },

        // SHR|SAL|SHL|... w, CL
        0xD3: function()
        {
            var reg = X86.modrm(1),
            dest = X86.regw(reg.rm);

            // TODO: do we need to set the flags in case src is 0 ?!!
            if (reg.reg == 5)	// SHR dest, CL
            {
                if (lf.var2 = X86.cl())
                {
                    lf.var1 = X86[dest];
                    lf.res = X86[dest] = ((X86[dest] >> lf.var2) & 0xFFFF);
                    Flags.setFlagsFromOp(OP_SHRW);
                }
                X86.ip += 2;
            }
            else if (reg.reg == 7)	// SAR dest, CL
            {
                if (lf.var2 = X86.cl())
                {
                    lf.var1 = X86[dest];
                    if (lf.var2 > 16)
                        lf.var2 > 16;

                    if (lf.var1 & 0x8000)
                    {
                        lf.res = X86[dest] = (lf_var1 >> lf.var2) | (0xffff << (16 - lf.var2));
                    }
                    else
                        lf.res = X86[dest] = lf.var1 >> lf.var2;

                    Flags.setFlagsFromOp(OP_SARW);
                }
                X86.ip += 2;
            }
            else if (reg.reg == 4)	// SHL | SAL
            {
                if (lf.var2 = X86.cl())
                {
                    lf.var1 = X86[dest];
                    lf.res = X86[dest] = (lf.var1 << lf.var2) & 0x0000FFFF;
                    // X86[dest] = (lf.res < 0x10000) ? lf.res : 0;

                    Flags.setFlagsFromOp(OP_SHLW);
                }
                X86.ip += 2;
            }
            else
                throw('Unhandled reg mod for shift bit opcode (0xD3) !');
        },

        // LOOPNE|LOOPNZ rel8
        // TODO: rel can be negative !
        // FIXME !!
        0xE0: function()
        {
            X86.cx--;
            // jmp if count is != 0 or ZF == 0
            if (X86.cx || !X86.getFlag(X86.FLAG_ZF))
            {
                var off = X86.ipnext(1);
                if (off & 0x80)
                    X86.ip -= (0xfe - off);
                else
                    X86.ip += (off + 2);
            }
            else
                X86.ip += 2;
        },

        // LOOPE|LOOPZ rel8
        // TODO: rel can be negative !
        // FIXME !!
        0xE1: function()
        {
            X86.cx--;
            // jmp if count is != 0 or ZF == 0
            if (X86.cx || X86.getFlag(X86.FLAG_ZF))
            {
                var off = X86.ipnext(1);
                if (off & 0x80)
                    X86.ip -= (0xfe - off);
                else
                    X86.ip += (off + 2);
            }
            else
                X86.ip += 2;
        },

        // LOOP rel8
        // TODO: rel can be negative !
        // FIXME !!
        0xE2: function()
        {
            X86.cx--;
            // jmp if count is != 0 or ZF == 0
            if (X86.cx)
            {
                var off = X86.ipnext(1);
                if (off & 0x80)
                {
                    X86.ip -= (0xfe - off);
                }
                else
                    X86.ip += (off + 2);
            }
            else
                X86.ip += 2;
        },

        // JCXZ rel8
        0xE3: function()
        {
            if (!X86.cx)
            {
                var off = X86.ipnext(1);
                if (off & 0x80)
                {
                    X86.ip -= (0xfe - off);
                }
                else
                    X86.ip += (off + 2);
            }
            else
                X86.ip += 2;
        },

        // OUT imm8, AL
        0xE6: function()
        {
            // MMU.outb(X86.ipnext(1), X86.al());
            IOHandler.outb(X86.ipnext(1), X86.al());
            X86.ip += 2;
        },

        // OUT imm8, AX
        0xE7: function()
        {
            // MMU.outw(X86.ipnext(1), X86.ax);
            IOHandler.outw(X86.ipnext(1), X86.ax);
            X86.ip += 2;
        },

        // call rel 16
        0xE8: function()
        {
            // first push the instruction pointer next to the call
            MMU.push(X86.ip + 3);

            var off = X86.ipnextw(1);
            if (off & 0x8000)
                X86.ip -= (0xfffe - off);
            else
                X86.ip += (off + 3);

            //throw('TODO: test me in DOSBox ;)');
        },

        // JMPF: is that correct ?
        0xEA: function() {
            var ip = X86.ipnextw(1);

            X86.cs = X86.ipnextw(3);
            X86.ip = ip;
        },

        // JMP rel8
        0xEB: function()
        {
            var off = X86.ipnext(1);
            if (off & 0x80)
                X86.ip -= (0xfe - off);
            else
                X86.ip += (off + 2);
        },

        0xEC: function()
        {
            throw('opcode not implemented: 0xec');
        },

        // OUT DX, AL
        0xEE: function()
        {
            // TODO: determine size of dx !
            // MMU.outb(X86.dx, X86.al());
            IOHandler.outw(X86.dx, X86.al());
            X86.ip++;
        },

        // OUT DX, AX
        // TODO: test me, plus use swapb ?!
        0xEF: function()
        {
            // MMU.outw(X86.dx, X86.ax);
            IOHandler.outw(X86.dx, X86.ax);
            X86.ip++;
        },

        // REPE MOVS m8,m8
        0xF3: function()
        {
            // returns true when LOOP is over
            // otherwise execute the same instruction again
            if (Ops.str(X86.ipnext(1)))
                X86.ip += 2;
        },

        // CMC
        // TEST ME !
        0xF5: function()
        {
            X86.setFlag(X86.FLAG_CF, !X86.getFlag(X86.FLAG_CF));
            X86.ip++;
        },

        // Multi: (fait: (*))
        // 0 TEST r/m8, imm8
        // 1 TEST r/m8, imm8
        // 2 NOT r/m8
        // 3 NEG r/m8
        // 4 MUL AX, AL, r/m8
        // 5 IMUL AX, AL, r/m8
        // 6 DIV AL, AH,, AX, r/m8
        // 7 IDIV AL, AH, AX, r/m8
        0xF6: function(seg)
        {
            var seg = seg ? seg : 'ds';

            var reg = X86.modrm(1);

            switch(reg.reg) {
                // 0 TEST r/m8, imm8
                case 0:
                    if (reg.rm == 6)
                    {
                        console.log(X86.ipnextw(2).toHex(), X86.ipnext(4).toHex());
                        Ops.andb(MMU.rbs(X86[seg], X86.ipnextw(2)), X86.ipnext(4));
                        Flags.setFlagsFromOp(OP_ANDB);
                        X86.ip += 5;
                        // throw('to do');
                    }
                    else
                        throw('rm', reg.rm, 'not handled for opcode 0xF6 / reg == 0')
                break;
                // 1 TEST r/m8, imm8
                case 1:
                    throw('0xF6 opcode with reg=1 not ready yet ! :)');
                break;
                // 2 NOT r/m8
                case 2:
                    throw('0xF6 opcode with reg=2 not ready yet ! :)');
                break;
                // 3 NEG r/m8
                case 3:
                    throw('0xF6 opcode with reg=3 not ready yet ! :)');
                break;
                // 4 MUL AX, AL, r/m8
                case 4:
                    throw('0xF6 opcode with reg=4 not ready yet ! :)');
                break;
                // 5 IMUL AX, AL, r/m8
                case 5:
                    throw('0xF6 opcode with reg=5 not ready yet ! :)');
                break;
                // 6 DIV AL, AH,, AX, r/m8
                case 6:
                    throw('0xF6 opcode with reg=6 not ready yet ! :)');
                break;
                // 7 IDIV AL, AH, AX, r/m8
                case 7:
                    throw('0xF6 opcode with reg=7 not ready yet ! :)');
                break;

                default:
                    throw('what the ??');
                break;
            }
            // lf.var1 = X86.ax;
            // lf.res = X86.ax = (0xFF & ~X86.ax);
            // throw('0xF6 opcode not ready yet ! :)');
        },

        // NEG r/m16, NOT r/m16
        0xF7: function()
        {
            var reg = X86.modrm(1);
            lf.var1 = X86[X86.regw(reg.rm)];

            if (reg.reg == 2)
            {
                X86[X86.regw(reg.rm)] = (0xFFFF & ~lf.var1);
            }
            else if (reg.reg == 3)
            {
                lf.res = X86[X86.regw(reg.rm)] = (0xFFFF & (0 - lf.var1));
                Flags.setFlagsFromOp(OP_NEGW);
            }
            else
                throw('not implemented rm for opcode 0xF7 !');

            X86.ip += 2;
        },

        // CLC
        // TEST ME !
        0xF8: function()
        {
            X86.setFlag(X86.FLAG_CF, false);
            X86.ip++;
        },

        // STC
        // TEST ME !
        0xF9: function()
        {
            X86.setFlag(X86.FLAG_CF, true);
            X86.ip++;
        },

        // CLI
        0xFA: function()
        {
            X86.setFlag(X86.FLAG_IF, false);
            X86.ip++;
        },

        // STI: enable ints
        0xFB: function() {
            X86.setFlag(X86.FLAG_IF, true);
            X86.ip++;
        },

        // CLD: clears D flag
        0xFC: function()
        {
            X86.setFlag(X86.FLAG_DF, false);
            X86.ip++;
        },

        // STD: sets the DFlag
        0xFD: function()
        {
            X86.setFlag(X86.FLAG_DF, true);
            X86.ip++;
        },

        // Jump far, absolute indirect
        0xFF: function(override)
        {
            var reg = X86.modrm(1),
            seg = override ? override : 'ds';

            if (reg.reg == 5)
            {
                console.log(reg);
                var off = (reg.rm == 6) ? X86.ipnextw(2) : 0,
                srcAddr = X86.getOpAdd(reg.rm, off, seg);
                console.log(MMU.rw(srcAddr).toHex());
                console.log(MMU.rw(srcAddr + 2).toHex());
                X86.cs = MMU.rw(srcAddr + 2);
                X86.ip = MMU.rw(srcAddr);
            }
            else
                throw('unsupported RM for opcode 0xFF !');
        },
    };

    // multiple-byte opcodes
    var OpCodes2 = {
        // MOV AH, [addr]
        0x26: function()
        {
        },

        // MOV AH, [addr + DI]
        0xA5: function()
        {

        }
    };

    var Ops = {
        andb: function(x1, x2)
        {
            lf.res = (x1 & x2);
            return lf.res;
        },

        andw: function(x1, x2)
        {
            lf.Res = (x1 & x2);
            return lf.res;
        },

        moveW: function(destReg)
        {
            X86.loadws(X86.cs, X86.ip + 1, destReg);
        },

        popReg: function(reg)
        {
            X86[reg] = X86.pop();
        },

        pushReg: function(reg)
        {
            X86.push(X86[reg]);
        },

        movsb: function()
        {
            MMU.wbs(X86.es, X86.di, MMU.rbs(X86.ds, X86.si));
            X86.upidx();
        },

        scasb: function()
        {
            lf.var1 = X86.al();
            lf.var2 = MMU.rbs(X86.es, X86.di);
            lf.res = lf.var1 - lf.var2; // (what happens ?!)
            /*
            console.log(lf.var1.toHex() + ' vs ' + lf.var2.toHex());
            console.log('res => ' + lf.res.toHex());
            */
            X86.updi();
            Flags.setFlagsFromOp(OP_CMPB);
        },

        lodsb: function(seg)
        {
            var seg = seg ? seg : 'ds';

            X86.al(MMU.rbs(X86[seg], X86.si));
            X86.upsi();
        },

        lodsw: function()
        {
            X86.ax = MMU.rws(X86.ds, X86.si);
            X86.upsiw();
        },

        stosb: function()
        {
            MMU.wbs(X86.es, X86.di, X86.al());
            X86.updi();
        },

        stosw: function()
        {
            MMU.wws(X86.es, X86.di, X86.ax, true);
            X86.updiw();
        },

        // string operations
        // TODO: check for flag stuff !!
        str: function(op)
        {
            // REPE MOVS m8, m8
            if (op == 0xA4)
            {
                this.movsb();
                X86.cx--;
                // TODO: set flags ?!
                return (!X86.cx);	//  || X86.getFlag(X86.FLAG_ZF)
            }
            else if (op == 0xAE)	// REPE SCASB
            {
                this.scasb();
                X86.cx--;
                return (!X86.cx || !X86.getFlag(X86.FLAG_ZF));
            }
            else if (op == 0xAC)
            {
                this.lodsb();
                X86.cx--;
                // throw('REPE LODSB not finished yet !');
                return (!X86.cx);
            }
            else if (op == 0xAD)
            {
                this.lodsw();
                X86.cx--;	// cx -= 2 ?? => SUBW ! ;)
                // throw('REPE LODSW not finished yet !');
                return (!X86.cx);
            }
            else if (op == 0xAA)
            {
                this.stosb();
                X86.cx--;
                return (!X86.cx);
            }
            else if (op == 0xAB)
            {
                this.stosw();
                X86.cx--;
                return (!X86.cx);
            }
            /*
            else if (op == 0xA5)	// REPE MOVS m16,m16
            {
                while (X86.cx && X86.getFlag(X86.FLAG_ZF))
                {
                    X86.wbs(X86.es, X86.di, X86.rbs(X86.ds, X86.si));
                    X86.cx--;	// check: what if CX is negative before ??! => zf set ?!
                    this.Ops.decw('si');
                    this.Ops.decw('di');
                    // TODO: set flags ?!
                }
            }
            */
            else
                throw('Unsupported sub-opcode for string op 0xF3: ' + op.toHex());
        }
    };

    return OpCodes;
});
