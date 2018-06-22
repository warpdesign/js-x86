define(function() {
    var IntServer = {
        // we keep a reference to the 256 ints here,
        // should speed up things
        IVT: new Array(256),
        virtualMap: {

        },

        getIntAddr: function(intNum)
        {
            var IVT = intNum * 4;

            return {
                seg: MMU.rw(IVT + 2),
                off: MMU.rw(IVT)
            };
        },

        setIntAddr: function(intNum, seg, off)
        {
            var IVT = intNum * 4;

            MMU.wws(0, (intNum * 4) + 2, seg);
            MMU.wws(0, intNum * 4, off);
        },

        // inits interrupts table
        init: function()
        {
            // fill in interrupt vector table with 0 for now:
            // 0000:0000 -> 0000:0x03FF
            // TODO: setIntAddr instead ?
            MMU.memset(0, 0x3FF, 0);
            // Essai
            MMU.wws(0, 0, 0x6000);
            MMU.wws(0, 0x2, 0x00F1);
            // /Essai
        },

        registerInterrupts: function(intNum, intMap, name) {
            console.log('[IntServer] registering interrupts: 0x' + intNum.toHex(), name);
            this.virtualMap[intNum] = {
                map: intMap,
                name: name
            };
        },

        // executes the specified interrupt
        // TODO: add the ability to skip similar exceptions if not supported...
        // TODO: disables interrupts when saving ctx
        getInterruptMethod: function(intNum, func)
        {
            // get IntVector
            var vec = this.getIntAddr(intNum),
                intType = null;
                method = null;

            // we assume that interrupt vector of 0000:0000 means native (ie: implemented in JSx86
            // method), otherwise jumps to the specified address...
        if (0 /** PUTBACK  vec.seg === 0 && vec.off === 0 **/) {
                intType = this.virtualMap[intNum] || this.virtualMap[0],
                method = intType.map[func];

                if (!method) {
                    Console.log('unsupported ' + intType.name + ' interrupt, function ' + func.toHex());
                }
            } else {
                console.log('Not a native int!')
            }

            return method;
        //     if (vec.seg == 0 && vec.off == 0)
        //     {
        //         console.log('DOS/BIOS internal interrupt');
        //         // DOS or BIOS interrupt ?
        //         if (intNum & (0x21|0x20))	// 0x20 gots windows functions and a terminate DOS (1.0+) function
        //         {
        //             try{
        //                 console.log('DOS interrupt function n=' + X86.ah().toHex());
        //                 this.saveCtx();
        //                 JSDOS[func]();
        //                 this.restoreCtx();
        //             }
        //             catch(err){
        //                 Console.log('unsupported DOS interrupt, function ' + X86.ah().toHex() + ' (error = ' + err + ')');
        //                 X86.stop();
        //             }
        //         }
        //         else
        //         {
        //             try{
        //                 this.saveCtx();
        //                 BIOS.ints[func]();
        //                 this.restoreCtx();
        //             }
        //             catch(err)
        //             {
        //                 Console.log('unsupported BIOS interrupt: ' + func.toHex());
        //                 X86.stop();
        //             }
        //         }
        //     }
        //     else
        //     {
        //         // jump to specified address
        //         this.saveCtx();
        //         X86.ip = vec.off;
        //         X86.cs = vec.seg;
        //     }
        }
    };

    return IntServer;
});
