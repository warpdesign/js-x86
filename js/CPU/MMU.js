// Memory Management related methods

define(['Utils'], function(Utils) {
    var PORT_PIC_CMD = 0x20,
        PORT_PIC_DATA = 0x21,
        PORT_PIC2_CMD = 0xA0,
        PORT_PIC2_DATA = 0xA1,
        PORT_TIMER_CMD = 0x43,
        PORT_TIMER_DATA = 0x40,
        PORT_DAC = 0x00,
        PORT_RTC = 0x00,
        PORT_KB = 0x00;

    var MMU = {
        mem: null,	// 1Mb RAM for 16bit x86
        vga: null,							// VGA memory is mapped at 0xa1000
        mem8: null,							// view for 8bit accesses
        mem16: null,						// view for 16 bit accesses without 16bit alignement
        watchList: [],					// watchList

        init: function() {
            this.mem = new ArrayBuffer(1024 * 1024)
            this.vga = new Uint8Array(MMU.mem, 0xa000 << 4, 64*1024);
            this.mem8 = new Uint8Array(MMU.mem);
            this.mem16 = new DataView(MMU.mem);
        },

        // reads a byte from specified address
        rb: function(addr)
        {
            try{
                return this.mem8[addr];
            }
            catch(err)
            {
                Console.log('mem range error: ' + addr);
                return 0;
            }
        },

        mapUint8Array: function(buffer, addr, size) {
            var arr = new Uint8Array(this.mem, addr, size);

            arr.set(buffer);
        },

        // reads a byte from specified address
        rbs: function(seg, addr)
        {
            if (arguments.length < 2)
                throw "rbs requires two arguments, called with only " + arguments.length;

            return this.rb((seg << 4) + addr);
        },

        // writes a byte to the specified address
        wb: function(addr, value)
        {
            try{
                this.mem8[addr] = value;
            }
            catch(err)
            {
                Console.log('mem range error: ' + addr);
            }
        },

        // writes a byte to the specified address
        wbs: function(seg, addr, value)
        {
            if (arguments.length < 3)
                throw "wbs requires two arguments, called with only " + arguments.length;

            this.wb((seg << 4) + addr, value);
        },

        // reads a word from the specified address
        rw: function(addr)
        {
            try{
                /*
                var h = this.mem[addr];
                var l = this.mem[addr + 1];

                return (h + (l << 8));
                */

                // TODO: use little/bigEndian ?!
                return this.mem16.getUint16(addr, true);
            }
            catch(err)
            {
                Console.log('mem range error: ' + addr);
                return 0;
            }
        },

        rws: function(seg, addr)
        {
            if (arguments.length < 2)
                throw "rws requires two arguments, called with only " + arguments.length;

            // TODO: test endianess
            // invert both
            return this.rw((seg << 4) + addr);
        },

        // writes a word to the specified address
        ww: function(addr, value, swap)
        {
            try{
                /*
                this.mem[addr++] = Utils.hb(value);
                this.mem[addr] = Utils.lb(value);
                */
                this.mem16.setUint16(addr, value, swap === true);
            }
            catch(err)
            {
                Console.log('mem range error: ' + addr);
            }
        },

        // writes a word to the specified seg:address
        wws: function(seg, addr, value, swap)
        {
            if (arguments.length < 3)
                throw "wws requires two arguments, called with only " + arguments.length;

            this.ww((seg << 4) + addr, value, swap);
        },

        // reads a string terminated by '$' at the specified address
        rs: function(addr)
        {
            str = '';
            try{
                while(this.mem8[addr] != 0x24)	// '$' marks the end of string
                    str += String.fromCharCode(this.mem8[addr++]);
            }
            catch(err)
            {
            }
            return str;
        },

        // reads a string terminated by '$' at the specified seg:address
        rss: function(seg, addr)
        {
            if (arguments.length < 2)
                throw "rss requires two arguments, called with only " + arguments.length;

            return this.rs((seg << 4) + addr);
        },

        // copies data from source to seg_num, addr
        memcpy: function(source, seg_num, addr, size_b)
        {

        },

        memset: function(source, size_b, value)
        {
            var mem = this.mem8;

            for (var i = 0; i < size_b; i++)
                mem[source++] = value;
        },

        // returns seg + offset of specified absolute address
        getSeg: function(absoluteAddr)
        {
            var addrInt = parseInt(absoluteAddr);

            return {
                seg: addrInt >> 4,
                off: addrInt & 0x00FF
            };
        },

        // returns the absolute address of a seg+off
        getAbs: function(seg, offset)
        {
            return (seg << 4) + offset;
        },

        addToWatchList: function(start, end, cb) {
            this.watchList.push({
                start: start,
                end: end,
                cb: cb
            });
        },

        checkList: function(addr, word) {
            var i = 0,
                watched = null;

            for (i = 0; i < this.watchList.length; i++) {
                watched = this.watchList[i];
                if (addr <= watched.end || addr >= watched.start) {
                    watched.cb(addr);
                }
            }
        },

        getView: function(start, length) {
            return new DataView(this.mem, start, length);
        }
    };

    return MMU;
});
