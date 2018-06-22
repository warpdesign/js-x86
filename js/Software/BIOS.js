/*

	BIOS Interrupts

*/
define(['X86', 'MMU', 'Timer', 'PIC', 'Graphics'], function(X86, MMU, Timer, PIC, Graphics) {
    var BIOS = {
        deviceList: {},

        // BIOS interrupts
        ints: {
            // HARDWARE Timer interrupt
            // TODO: fixme, 0x006E should be set as well, plus reset if midnight !
            0x08: function()
            {
                console.log('timer interrupt');

                // for now we only increment the counter on each int 8 call as is supposed to do the BIOS
                MMU.wws(0x40, 0x6C, MMU.rws(0x40, 0x006C, 0) + 1);

                // PIC IRQ acknowledge
                PIC.ack();

                // call user clock stuff
                BIOS.ints[0x1C]();
            },

            // Set graphics mode
            0x10: function()
            {


            },

            // USER timer clock interrupt: what to do here ??
            0x1C: function()
            {

            }
        },

        // registers new hardware to be used (interrupts)
        // @id unique id of the device
        // @intList a list of interrupts to add to handle new calls
        // @resetCallback callback to be called on reset
        registerHardware: function(id, intList, resetCallback) {
            var i;

            if (this.deviceList[id]) {
                throw('warning: trying to register already registered ', id);
            } else {
                this.deviceList[id].push(resetCallback || null);
                for (i in intList) {
                    this.ints[i] = intList[i];
                }
                console.log('[BIOS] registered device ', id);
            }
        },

        init: function(IntServer)
        {
            // ** PUTBACK IntServer.registerInterrupts(0, this.ints, 'BIOS');

            // setup PIC which inits all hardware components (timer only for now)
            // ** PUTBACK  PIC.init();

            // ** PUTBACK  Timer.init();

            // sets display to text mode
            Graphics.init();

            // init processor
            X86.init();

            // inits timer value with 0
            // question: is it a word or byte ?
            // ** PUTBACK MMU.wws(0x40, 0x6C, 0);
            // ** PUTBACK MMU.wws(0x40, 0x6E, 0);
        }
    };

    return BIOS;
});
