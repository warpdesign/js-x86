// PC DMA 8237 emulation

define(['IOHandler'], function(IOHandler) {
    var DMA_8237 = {
        mode: 0,
        channels: [{
            mode: 0
        },
        {
            mode: 0
        }
        ],
        init: function(intNum)
        {
            console.log('[DMA (8237)] timer init');

            // add control ports
            this.addPorts();
        },


// Bit(s)	Description	(Table P0485)
//  7-6	transfer mode
// 	00  demand mode
// 	01  single mode
// 	10  block mode
// 	11  cascade mode
//  5	direction
// 	0  address increment select
// 	1  address decrement select
//  4	autoinitialisation enabled
//  3-2	operation
// 	00  verify operation
// 	01  write to memory
// 	10  read from memory
// 	11  reserved
//  1-0	channel number
// 	00  channel 4 select
// 	01  channel 5 select
// 	10  channel 6 select
// 	11  channel 7 select

        // Add 8237 communication ports
        addPorts: function()
        {
            // first 8237: channels 0-3
            IOHandler.addReadHandler(0x000d, this.tempRegister.bind(this));
            // second 8237 (later computers), channels 4-7
            IOHandler.addReadHandler(0x00da, this.tempRegister.bind(this));


            IOHandler.addWriteHandler(0x000d, this.reset.bind(this));
            IOHandler.addWriteHandler(0x00da, this.reset.bind(this));

            // mode register
            IOHandler.addWriteHandler(0x00d6, this.modeRegister.bind(this));
        },

        modeRegister: function(port, modeByte) {
            var port = (port === 0x00d6) ? this.channels[1] : this.channels[0],
                desc = {
                    transferMode: modeByte & 0xC0 >> 6,
                    direction: modeByte & 0x20 >> 5,
                    autoInit: modeByte & 0x10 >> 4,
                    operation: modeByte & 0x0c >> 2,
                    channel: modeByte & 0x3
                };

            debugger;
            console.log('[DMA] Mode set for ctrl', port, desc);
        },

        tempRegister: function() {
            console.log('[DMA] tempRegister')
        },

        reset: function(port, cmd)
        {
            debugger;
            console.log('[DMA] reset() - ' + (port == 0x00da ? 'ctrl 2' : 'ctrl 1'));
        }
    };

    return DMA_8237;
});
