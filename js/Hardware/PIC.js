/*

	PIC: IRQ management

*/
define(['Timer'], function(Timer) {
    var IRQ_TIMER = 0x01,
        IRQ_KB = 0x02,
        IRQ_COM1 = 0x08,
        IRQ_COM2 = 0x10,
        IRQ_SB = 0x20;

    var PIC = {
        IRQ: [
            { desc: 'sys timer', callback: null, intr: null, pri: 0, on: false},
            { desc: 'keyboard', callback: null, intr: null , pri: 1, on: false},
            { desc: 'COM 2', callback: null, intr: null, pri: 11, on: false },
            { desc: 'COM 1', callback: null, intr: null, pri: 12, on: false },
            { desc: null, callback: null, intr: null, pri: 13, on: false },
            { desc: 'floppy', callback: null, intr: null, pri: 14, on: false },
            { desc: 'LPT 1', callback: null, intr: null, pri: 15, on: false },
            { desc: 'RTC', callback: null, intr: null, pri: 2, on: false },
            { desc: null, callback: null, intr: null, pri: 3, on: false },
            { desc: null, callback: null, intr: null, pri: 4, on: false },
            { desc: null, callback: null, intr: null, pri: 5, on: false },
            { desc: 'PS/2', callback: null, intr: null, pri: 6, on: false },
            { desc: 'FPU', callback: null, intr: null, pri: 7, on: false },
            { desc: 'IDE 1', callback: null, intr: null, pri: 8, on: false },
            { desc: 'IDE 2', callback: null, intr: null, pri: 9, on: false }
        ],

        // TODO: what happens when an interrupt gets executed while another one is already in progress ?
        inProgress: null,	// IRQ being triggered

        pendingReq: [],
        lastCmd: null,

        // init all interrupts
        init: function()
        {
            this.reg(0, 8, Timer);
        },

        // register several ints using a mask interrupt
        regm: function(mask)
        {
            if (~mask & IRQ_TIMER)
                this.reg(0, 8, Timer);
            else if (~mask & IRQ_KB)
                this.reg(0, 8, Timer);
        },

        reg: function(irq, intr, callback)
        {
            try{
                this.IRQ[irq].callback = callback;
                this.IRQ[irq].intr = intr;
                this.IRQ[irq].on = true;
                console.log('[PIC] registered ' + this.IRQ[irq].desc + ' IRQ');
            }
            catch(err)
            {
                console.log('unknown IRQ: ' + irq);
            }
        },

        unreg: function(irq)
        {
            try{
                this.IRQ[irq].on = false;
            }
            catch(err)
            {
                console.log('unknown IRQ: ' + irq);
            }
        },

        req: function(irq)
        {
            this.pendingReq.push(irq);
        },

        ack: function()
        {
            this.inProgress.callback.irqDone();
            this.inProgress = null;
        },

        // returns the higher priority pending IRQ
        getPending: function()
        {
            var num = 16;
            if (this.pendingReq.length)
                for (var i = 0; i < this.pendingReq.length; i++)
                    if (this.pendingReq[i] < num)
                        num = i;

            if (num < 16)
            {
                this.inProgress = this.IRQ[num];
                return this.IRQ[num].intr;
            }
            else
                return null;
        },
    };

    return PIC;
});
