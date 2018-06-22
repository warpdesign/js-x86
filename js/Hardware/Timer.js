// PC Timer support
// TODO: add a way to reprogram it ?

define(['IOHandler'], function(IOHandler) {
    var PIC_C0_M3 = 0x36,
        PIC_C1_M3 = 0x77,
        TIMER0 = 0x40,
        TIMER1 = 0x41,
        TIMER2 = 0x42,
        TIMER_MODE = 0x43,
        CHAN0 = 0,
        CHAN1 = 1,
        CHAN2 = 2,
        CMD_LATCH = 0,
        CMD_LSB = 1,
        CMD_MSB = 2,
        CMD_LMSB = 3,
        PIT_TICK_RATE = 1193182;

    var Timer = {
        inter:null,
        ticks: 0,
        irqAck: true,
        intNum: 8,	// default int to call on irq (8 as default but could be changed)
        count0: 0,	// channel 0 counter
        count1: 0,	// channel 1 counter
        timers: [],
        interval: 55,	// default interval (55ms)
        lastCmd: null,

        initTimers: function()
        {
            // init timers: see DOSBox sources...
        },

        init: function(intNum)
        {
            this.intNum = intNum;
            var that = this;

            console.log('[Timer] timer init');

            // add control ports
            this.addPorts();

            this.initChannels();
        },

        // TODO: calculates the delay in which to call irq, and setInterval (will be reset each time the channel 0 is reprogrammed)
        startIRQ: function()
        {
            // request to be registered to the IRQ
            /*
            this.inter = setInterval(function() {
                // do not send multiple irq
                // in case jsx86 can't cope with it, we simply drop it
                if (that.irqAck)
                {
                    Console.log('Request from timer !');
                    that.irqAck = false;
                    PIC.req(0);
                }
            }, this.interval);
            */
        },

        decodeCmd: function(cmd)
        {
            return{
                channel: cmd >> 6,
                cmd: (cmd & 0x30) >> 2,
                mode: (cmd & 6) >> 1,
                bcd: cmd & 0x1
            }
        },

        // latch read for the specified port
        readLatch: function(port)
        {
            console.log('get writeLatch: ' + val.toHex());
        },

        // latch write for the specified port
        writeLatch: function(port, val)
        {
            console.log('get writeLatch: ' + val.toHex());
        },

        // sends a cmd to the pit
        writeCmd: function(port, cmd)
        {
            // TODO: get mode/port
            console.log('got cmd: ' + cmd.toHex());
            console.log(this.decodeCmd(cmd));
        },

        // configure all 3 channels with default settings
        initChannels: function()
        {
            // channel 0
            this.timers.push({
                cntr: 0x10000,
                writeState: 3,
                readState: 3,
                readLatch: 0,
                writeLatch: 0,
                mode: 3,
                bcd: false,
                goReadLatch: true,
                counterstatusSet: false,
                updateCount: false
            });

            // channel 1
            this.timers.push({
                cntr: 18,
                writeState: 1,
                readState: 1,
                mode: 2,
                bcd: false,
                goReadLatch: true,
                counterstatusSet: false,
            });

            // channel 2
            this.timers.push({
                cntr: 1320,
                writeState: 3,
                readState: 3,
                readLatch: 1320,
                mode: 3,
                bcd: false,
                goReadLatch: true,
                counterstatusSet: false,
                counting: false
            });

            this.timers[0].delay = (1000.0 / (PIT_TICK_RATE / this.timers[0].cntr));
            this.timers[1].delay = (1000.0 / (PIT_TICK_RATE / this.timers[1].cntr));
            this.timers[2].delay = (1000.0 / (PIT_TICK_RATE / this.timers[2].cntr));
        },

        // Add PIT communication ports
        addPorts: function()
        {
            IOHandler.addReadHandler(0x40, jQuery.proxy(this.readLatch, this));
            IOHandler.addReadHandler(0x41, jQuery.proxy(this.readLatch, this));
            IOHandler.addReadHandler(0x42, jQuery.proxy(this.readLatch, this));

            IOHandler.addWriteHandler(0x40, jQuery.proxy(this.writeLatch, this));
            IOHandler.addWriteHandler(0x42, jQuery.proxy(this.writeLatch, this));
            IOHandler.addWriteHandler(0x43, jQuery.proxy(this.writeCmd, this));
        },

        // called by the PIC once an IRQ has been transferred to the CPU
        irqDone: function()
        {
            this.irqAck = true;
        },

        stop: function()
        {

        }
    };

    return Timer;
});
