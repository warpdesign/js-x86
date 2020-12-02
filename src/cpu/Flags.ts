/*

 Flags Management

*/
import { X86 } from './X86';
import {
    OP_INCW,
    OP_ADDW,
    OP_DECW,
    OP_XORW,
    OP_SUBW,
    OP_CMPW,
    OP_NEGW,
    OP_NEGB,
    OP_SUBB,
    OP_CMPB,
    OP_SHRW,
    OP_SALW,
    OP_SHLW,
    OP_SARW,
    OP_ORW,
    OP_ANDB,
    OP_CMPW,
    OP_ANDW,
    OP_XORB,
} from './OpCodes';
// define(['X86', 'Utils'], function(X86, Utils) {
// TODO: fix me!
// window.lf = {
//     res: 0,		// Op result
//     resl: 0,	// Op result lower bytes
//     res4: 0,	// Op result 4 bits
//     var1: 0,	// Op var 1
//     var2: 0		// Op var 2
// }

// TODO: duplicate of OpCodes, fix me!

export const LastOp = {
    res: 0, // Op result
    resl: 0, // Op result lower bytes
    res4: 0, // Op result 4 bits
    var1: 0, // Op var 1
    var2: 0, // Op var 2
};

const parityLookupTable = [
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
];

const setFlagAF = () =>
    X86.setFlag(X86.FLAG_AF, (Utils.lb(lastOp.var1) ^ Utils.lb(lastOp.var2) ^ Utils.lb(lastOp.res)) & 0x10);

const setFlagZF = () => X86.setFlag(X86.FLAG_ZF, lastOp.res == 0);

const setFlagZFw = () => X86.setFlag(X86.FLAG_ZF, lastOp.res == 0);

const setFlagSF = () => X86.setFlag(X86.FLAG_SF, Utils.lb(lastOp.res) & 0x80);

const setFlagSFw = () => X86.setFlag(X86.FLAG_SF, (lastOp.res & 0x8000) >> 8);

const setFlagPF = () => X86.setFlag(X86.FLAG_PF, parityLookupTable[Utils.lb(lastOp.res)]);

// modify flags according to result of last op
export const setFlagsFromOp = (op: number): void => {
    switch (op) {
        case OP_INCW:
            X86.setFlag(X86.FLAG_AF, (lastOp.res & 0x0f) == 0);
            setFlagZF(); // DOFLAG_ZFw
            setFlagSFw();
            X86.setFlag(X86.FLAG_OF, lastOp.res == 0x8000);
            setFlagPF();
            break;

        case OP_DECW:
            X86.setFlag(X86.FLAG_AF, (lastOp.res & 0x0f) == 0x0f);
            setFlagZF(); // DOFLAG_ZFw()
            setFlagSFw();
            X86.setFlag(X86.FLAG_OF, llastOpf.res == 0x7fff);
            setFlagPF();
            break;

        case OP_CMPW:
        case OP_SUBW:
            X86.setFlag(X86.FLAG_CF, lastOp.var1 < lastOp.var2);
            setFlagAF();
            setFlagZF(); // DOFLAG_ZFw()
            setFlagSFw();
            X86.setFlag(X86.FLAG_OF, (lastOp.var1 ^ lastOp.var2) & (lastOp.var1 ^ lastOp.res) & 0x8000);
            setFlagPF();
            break;

        case OP_ADDW:
            X86.setFlag(X86.FLAG_CF, lastOp.res < lastOp.var1);
            setFlagAF();
            setFlagZF(); // DoFlag_ZFw()
            setFlagSFw();
            X86.setFlag(X86.FLAG_OF, (lastOp.var1 ^ lastOp.var2 ^ 0x8000) & (lastOp.res ^ lastOp.var1) & 0x8000);
            setFlagPF();
            break;

        case OP_XORW:
            X86.setFlag(X86.FLAG_CF, false);
            X86.setFlag(X86.FLAG_AF, false);
            setFlagZF(); // doFlagZFw()
            setFlagSFw();
            X86.setFlag(X86.FLAG_OF, false);
            setFlagPF();
            break;

        case OP_XORB:
            X86.setFlag(X86.FLAG_CF, false);
            X86.setFlag(X86.FLAG_AF, false);
            setFlagZF();
            setFlagSF();
            X86.setFlag(X86.FLAG_OF, false);
            setFlagPF();
            break;

        case OP_NEGW:
            X86.setFlag(X86.FLAG_CF, lastOp.var1 != 0);
            X86.setFlag(X86.FLAG_AF, (lastOp.res & 0x0f) != 0);
            setFlagZF(); // zfw
            setFlagSFw();
            X86.setFlag(X86.FLAG_OF, lastOp.var1 == 0x8000);
            setFlagPF();
            break;

        case OP_NEGB:
            X86.setFlag(X86.FLAG_CF, lastOp.var1 != 0);
            X86.setFlag(X86.FLAG_AF, (lastOp.res & 0x0f) != 0);
            setFlagZF(); // zfb
            setFlagSF();
            X86.setFlag(X86.FLAG_OF, lastOp.var1 == 0x80);
            setFlagPF();
            break;

        case OP_SUBB:
        case OP_CMPB:
            X86.setFlag(X86.FLAG_CF, lastOp.var1 < lastOp.var2);
            setFlagAF();
            setFlagZF();
            setFlagSF();
            X86.setFlag(X86.FLAG_OF, (lastOp.var1 ^ lastOp.var2) & (lastOp.var1 ^ lastOp.res) & 0x80);
            setFlagPF();
            break;

        case OP_SHLW:
            if (lastOp.var2 > 16) X86.setFlag(X86.FLAG_CF, false);
            else X86.setFlag(X86.FLAG_CF, (lastOp.var1 >> (16 - lastOp.var2)) & 1);

            setFlagZF(); // DOFLAG_ZFw;
            setFlagSFw();
            X86.setFlag(X86.FLAG_OF, (lastOp.res ^ lastOp.var1) & 0x8000);
            setFlagPF();
            X86.setFlag(X86.FLAG_AF, lastOp.var2 & 0x1f);
            break;

        case OP_SHRW:
            X86.setFlag(X86.FLAG_CF, (lastOp.var1 >> (lastOp.var2 - 1)) & 1);
            setFlagZF(); // _ZFw;
            setFlagSFw();
            if ((lastOp.var2 & 0x1f) == 1) X86.setFlag(X86.FLAG_OF, lastOp.var1 >= 0x8000);
            else X86.setFlag(X86.FLAG_OF, false);

            setFlagPF();
            X86.setFlag(X86.FLAG_AF, lastOp.var2 & 0x1f);
            break;

        // TODO: signed conversion ?!
        case OP_SARW:
            //X86.setFlag(X86.FLAG_CF,(((Bit16s) lf_var1w) >> (lf_var2b - 1)) & 1);
            X86.setFlag(X86.FLAG_CF, (lastOp.var1 >> (lastOp.var2 - 1)) & 1);
            setFlagZF(); // DOFLAG_ZFw;
            setFlagSFw();
            X86.setFlag(X86.FLAG_OF, false);
            setFlagPF();
            X86.setFlag(X86.FLAG_AF, lastOp.var2 & 0x1f);
            break;

        case OP_ORW:
            X86.setFlag(X86.FLAG_CF, false);
            X86.setFlag(X86.FLAG_AF, false);
            setFlagZF(); // ZFw;
            setFlagSFw();
            X86.setFlag(X86.FLAG_OF, false);
            setFlagPF();
            break;

        case OP_ANDB:
            X86.setFlag(X86.FLAG_CF, false);
            X86.setFlag(X86.FLAG_AF, false);
            setFlagZF();
            setFlagSF();
            X86.setFlag(X86.FLAG_OF, false);
            setFlagPF();
            break;

        case OP_ANDW:
            X86.setFlag(X86.FLAG_CF, false);
            X86.setFlag(X86.FLAG_AF, false);
            setFlagZFw();
            setFlagSFw();
            X86.setFlag(X86.FLAG_OF, false);
            setFlagPF();
            break;

        default:
            throw 'Unknown flags modification for operation: ' + op;
            return 0;
    } // switch(op)
};
