/*

 Flags Management

*/

define(['X86', 'Utils'], function(X86, Utils) {
    // TODO: fix me!
    window.lf = {
        res: 0,		// Op result
        resl: 0,	// Op result lower bytes
        res4: 0,	// Op result 4 bits
        var1: 0,	// Op var 1
        var2: 0		// Op var 2
    }

    // TODO: duplicate of OpCodes, fix me!
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


    var Flags = {
        parityLookup: [1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
        0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
        0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
        1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
        0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
        1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
        1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
        0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
        0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
        1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
        1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
        0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
        1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1,
        0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
        0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0,
        1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1],

        doFlagAF: function()
        {
            X86.setFlag(X86.FLAG_AF, (((Utils.lb(lf.var1) ^ Utils.lb(lf.var2)) ^ Utils.lb(lf.res)) & 0x10));
        },


        doFlagZF: function()
        {
            X86.setFlag(X86.FLAG_ZF, (lf.res == 0));
        },

        doFlagZFw: function()
        {
            X86.setFlag(X86.FLAG_ZF, (lf.res == 0));
        },

        doFlagSF: function()
        {
            X86.setFlag(X86.FLAG_SF, (Utils.lb(lf.res) & 0x80));
        },

        doFlagSFw: function()
        {
            X86.setFlag(X86.FLAG_SF, ((lf.res & 0x8000) >> 8));
        },

        doFlagPF: function()
        {
            X86.setFlag(X86.FLAG_PF, this.parityLookup[Utils.lb(lf.res)]);
        },

        // modify flags according to result of last op
        setFlagsFromOp: function(op)
        {

            switch (op)
            {
                case OP_INCW:
                    X86.setFlag(X86.FLAG_AF, ((lf.res & 0x0f) == 0));
                    this.doFlagZF();	// DOFLAG_ZFw
                    this.doFlagSFw();
                    X86.setFlag(X86.FLAG_OF, (lf.res == 0x8000));
                    this.doFlagPF();
                break;

                case OP_DECW:
                    X86.setFlag(X86.FLAG_AF, ((lf.res & 0x0f) == 0x0f));
                    this.doFlagZF();	// DOFLAG_ZFw()
                    this.doFlagSFw();
                    X86.setFlag(X86.FLAG_OF, (lf.res == 0x7fff));
                    this.doFlagPF();
                break;

                case OP_CMPW:
                case OP_SUBW:
                    X86.setFlag(X86.FLAG_CF, (lf.var1 < lf.var2));
                    this.doFlagAF();
                    this.doFlagZF();	// DOFLAG_ZFw()
                    this.doFlagSFw();
                    X86.setFlag(X86.FLAG_OF, (lf.var1 ^ lf.var2) & (lf.var1 ^ lf.res) & 0x8000);
                    this.doFlagPF();
                break;

                case OP_ADDW:
                    X86.setFlag(X86.FLAG_CF, (lf.res < lf.var1));
                    this.doFlagAF();
                    this.doFlagZF(); // DoFlag_ZFw()
                    this.doFlagSFw();
                    X86.setFlag(X86.FLAG_OF, ((lf.var1 ^ lf.var2 ^ 0x8000) & (lf.res ^ lf.var1)) & 0x8000);
                    this.doFlagPF();
                break;

                case OP_XORW:
                    X86.setFlag(X86.FLAG_CF, false);
                    X86.setFlag(X86.FLAG_AF, false);
                    this.doFlagZF();	// doFlagZFw()
                    this.doFlagSFw();
                    X86.setFlag(X86.FLAG_OF, false);
                    this.doFlagPF();
                break;

                case OP_XORB:
                    X86.setFlag(X86.FLAG_CF, false);
                    X86.setFlag(X86.FLAG_AF, false);
                    this.doFlagZF();
                    this.doFlagSF();
                    X86.setFlag(X86.FLAG_OF, false);
                    this.doFlagPF();
                break;

                case OP_NEGW:
                    X86.setFlag(X86.FLAG_CF, (lf.var1 != 0));
                    X86.setFlag(X86.FLAG_AF, (lf.res & 0x0f) != 0);
                    this.doFlagZF();	// zfw
                    this.doFlagSFw();
                    X86.setFlag(X86.FLAG_OF, (lf.var1 == 0x8000));
                    this.doFlagPF();
                break;

                case OP_NEGB:
                    X86.setFlag(X86.FLAG_CF, (lf.var1 != 0));
                    X86.setFlag(X86.FLAG_AF, (lf.res & 0x0f) != 0);
                    this.doFlagZF();	// zfb
                    this.doFlagSF();
                    X86.setFlag(X86.FLAG_OF, (lf.var1 == 0x80));
                    this.doFlagPF();
                break;

                case OP_SUBB:
                case OP_CMPB:
                    X86.setFlag(X86.FLAG_CF, (lf.var1 < lf.var2));
                    this.doFlagAF();
                    this.doFlagZF();
                    this.doFlagSF();
                    X86.setFlag(X86.FLAG_OF, (lf.var1 ^ lf.var2) & (lf.var1 ^ lf.res) & 0x80);
                    this.doFlagPF();
                break;

                case OP_SHLW:
                    if (lf.var2 > 16)
                        X86.setFlag(X86.FLAG_CF, false);
                    else
                        X86.setFlag(X86.FLAG_CF, (lf.var1 >> (16 - lf.var2)) & 1);

                    this.doFlagZF();	// DOFLAG_ZFw;
                    this.doFlagSFw();
                    X86.setFlag(X86.FLAG_OF, (lf.res ^ lf.var1) & 0x8000);
                    this.doFlagPF();
                    X86.setFlag(X86.FLAG_AF, (lf.var2 & 0x1f));
                break;

                case OP_SHRW:
                    X86.setFlag(X86.FLAG_CF, (lf.var1 >> (lf.var2 - 1)) & 1);
                    this.doFlagZF();	// _ZFw;
                    this.doFlagSFw();
                    if ((lf.var2 & 0x1f) == 1)
                        X86.setFlag(X86.FLAG_OF,(lf.var1 >= 0x8000));
                    else
                        X86.setFlag(X86.FLAG_OF, false);

                    this.doFlagPF();
                    X86.setFlag(X86.FLAG_AF, (lf.var2 & 0x1f));
                break;

                // TODO: signed conversion ?!
                case OP_SARW:
                    //X86.setFlag(X86.FLAG_CF,(((Bit16s) lf_var1w) >> (lf_var2b - 1)) & 1);
                    X86.setFlag(X86.FLAG_CF,((lf.var1) >> (lf.var2 - 1)) & 1);
                    this.doFlagZF(); // DOFLAG_ZFw;
                    this.doFlagSFw();
                    X86.setFlag(X86.FLAG_OF, false);
                    this.doFlagPF();
                    X86.setFlag(X86.FLAG_AF, (lf.var2 & 0x1f));
                break;

                case OP_ORW:
                    X86.setFlag(X86.FLAG_CF, false);
                    X86.setFlag(X86.FLAG_AF, false);
                    this.doFlagZF();	// ZFw;
                    this.doFlagSFw();
                    X86.setFlag(X86.FLAG_OF, false);
                    this.doFlagPF();
                break;

                case OP_ANDB:
                    X86.setFlag(X86.FLAG_CF, false);
                    X86.setFlag(X86.FLAG_AF, false);
                    this.doFlagZF();
                    this.doFlagSF();
                    X86.setFlag(X86.FLAG_OF, false);
                    this.doFlagPF();
                break;

                case OP_ANDW:
                    X86.setFlag(X86.FLAG_CF, false);
                    X86.setFlag(X86.FLAG_AF, false);
                    this.doFlagZFw();
                    this.doFlagSFw();
                    X86.setFlag(X86.FLAG_OF, false);
                    this.doFlagPF();
                break;

                default:
                    throw('Unknown flags modification for operation: ' + op);
                    return 0;
            }	// switch(op)
        }
    };

    return Flags;
});
