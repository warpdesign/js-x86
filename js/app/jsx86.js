require(['jquery', 'BIOS', 'X86', 'OpCodes', 'MemViewer', 'MMU', 'JSDOS', 'IntServer', 'DMA', 'Utils'], function($, BIOS, X86, OpCodes, MemViewer, MMU, JSDOS, IntServer, DMA, Utils) {
    var EventManager = Utils.EventManager;

    function bindDebuggerEvents()
    {
        // debugger stuff: move that elsewhere !
        $('#offset').blur(function()
        {
            var val = MMU.rbs(parseInt($('#seg').val()), parseInt($('#offset').val()));
            $('#val1').html(val);
        });

        $('#addr').blur(function()
        {
            var val = MMU.rb(parseInt($('#addr').val()));
            $('#val2').html(val);
        });

        $('#go').click(function()
        {
            var exePath = $('#executable').val(),
            mode = ($('#normal').attr('checked')) ? 0 : 1;

            console.log('execing ' + exePath + '!!');
            console.log('mode = ' + mode);

            // Attempt to load a DOS COM file
            /* PUT BACK
            if (JSDOS.loadAndExecute(exePath))
            {
                X86.mode = mode;
                X86.status = X86.ST_RUNNING;
                X86.start();
            }
            */

            X86.mode = mode;

            X86.reset();
            X86.start();

            return false;
        });

        $('#stop').click(function()
        {
            console.log('stopping !');
            X86.status = STATUS_STOPPED;
            return false;
        });

        $('#pause').click(function()
        {
            console.log('pausing !');
            X86.status = STATUS_PAUSED;
            return false;
        });

        $('#reset').click(function()
        {
            console.log('reset !');
            X86.reset();
            return false;
        });

        // Debugger key events
        // events
        EventManager.init();
        EventManager.bindKey(97, function() { X86.mode = X86.MODE_NORMAL; X86.status = X86.ST_RUNNING; X86.start(); });
        EventManager.bindKey(98, function() { X86.mode = X86.MODE_STEP; X86.status = X86.ST_RUNNING; X86.start(); });
        EventManager.bindKey(99, function() { X86.mode = X86.MODE_STEP_OVER; X86.status = X86.ST_RUNNING; X86.start(); });
        EventManager.bindKey(100, function() { /* X86.mode = X86.MODE_STEP_OVER; X86.status = X86.ST_RUNNING; X86.start();*/ console.log('TODO: implement SKIP current OPCODE !'); });
    }

    $(document).ready(function()
    {
        X86.setOpCodesTable(OpCodes);

        MMU.init();

        MemViewer.init('#viewer');

        // Load BIOS image into 0xf0000-0xfffff, do we need to get another copy elsewhere?
        // $.get('BIOS/BIOS-Bochs.base64').done(function(biosBase64) {
        $.get('BIOS/pcxtbios.base64').done(function(biosBase64) {
            var buffer = Utils.base64DecToArr(biosBase64);

			// Map BIOS ROM to end of 1Mb low RAM
			// since BIOS size can vary from 8kb to 64kb and up,
			// we put it at the end of BIOS data area
            MMU.mapUint8Array(buffer, 0x100000 - buffer.length, buffer.length);

            // setup interrupts vector
            IntServer.init();

            DMA.init();

            // inits some variables
            BIOS.init(IntServer);

            JSDOS.init(IntServer);

            Utils.installPolyfills();

            bindDebuggerEvents();
        });


    });
});
