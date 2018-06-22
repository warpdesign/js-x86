/***
TODO: implement missing attributes: memory size, cursor position, columns,...
TEST: scrolling sur DOSBox: il se passe quoi ?!
===========================================================================
Format of BIOS Data Segment at segment 40h:
                {items in curly braces not documented by IBM}
Offset  Size    Description
  . . .
 49h    BYTE    Video current mode
 4Ah    WORD    Video columns on screen
 4Ch    WORD    Video page (regen buffer) size in bytes
 4Eh    WORD    Video current page start address in regen buffer
 50h 16 BYTEs   Video cursor position (col, row) for eight pages,
                0 based
 60h    WORD    Video cursor type, 6845 compatible, hi=startline,
                lo=endline
 62h    BYTE    Video current page number
 63h    WORD    Video CRT controller base address: color=03D4h,
                mono=03B4h
 65h    BYTE    Video current setting of mode select register
                03D8h/03B8h
 66h    BYTE    Video current setting of CGA palette register 03D9h
===========================================================================
***/

define(['jquery', 'MMU', 'IOHandler'], function($, MMU, IOHandler) {

    // Display hardware management
    var TEXT_MODE   = 0x3,		// 80x25x16 col
        VGA_13H_MODE = 0x13,
        textColorTable = {
            0x07: {
                c: 'white',
                bg: 'black'
            }
        },
        WHITE_BLACK = 0x10,
        MY_COLOR = 0x10,
        VGA_DEFAULT_TEXT_PALETTE = [
            '#000000',  '#0000C0',  '#00C000', '#00C0C0', '#C00000', '#C000C0', '#C08000', '#C0C0C0',
            '#808080',  '#0000FF',  '#0000FF', '#00FFFF', '#FF0000', '#FF00FF', '#FFFF00', '#FFFFFF'
        ],
        VGA_DEFAULT_13H_PALETTE = new Uint8Array(256 * 3);
        // set RGB: 24 | (33 << 6) | 47 << 12
        // get RGB => [x&0x3f, x >> 6 &0x3f, x >> 12 & 0x3f]
        // + conversion 64 => 255 pour val RGB
    
    // TEST: first index, r=255, b=g=0
    VGA_DEFAULT_13H_PALETTE[0] = 255;
    VGA_DEFAULT_13H_PALETTE[1] = 0;
    VGA_DEFAULT_13H_PALETTE[2] = 0;
    
    var Graphics =
    {
        currentMode: 0,
        pixelWidth: 0,
        pixelHeight: 0,
        currentPalette: null,
        textModeBase: MMU.getAbs(0xB800, 0x0000),	// Is it B800 or B000 ?!
        textAttributesBase: MMU.getAbs(0x40, 0x49),
        vgaModeBase: null,
        consoleScreen: null,
        modeDesc: null,
        activeScreen: null,
        isActive: false,
        textCtx: null,
        vgaCtx: null,
        textModes: {
            0x3: [80, 25, VGA_DEFAULT_TEXT_PALETTE]
        },
        graphicModes: {
            0x13: [320, 200, VGA_DEFAULT_13H_PALETTE]
        },
        getColors: function(byte) {
            return [
                byte >> 4,
                byte & 0x0F
            ];
        },
        cursorPosition: 0,
        toColors: function(backColour, frontColour) {
            return (backColour << 4) | (frontColour & 0x0F);
        },
        measureText: function() {
            // This global variable is used to cache repeated calls with the same arguments
            var str = 'P';

            var div = document.createElement('DIV');
                div.innerHTML = str;
                div.style.position = 'absolute';
                div.style.top = '-100px';
                div.style.left = '-100px';
                div.style.font = this.textCtx.font;

            document.body.appendChild(div);

            var size = [div.offsetWidth, div.offsetHeight];

            document.body.removeChild(div);

            return size;
        },
        init: function()
        {
            // add control ports
            this.addPorts();

            this.initTextMode();

            this.initVGAMode();

            this.isActive = true;

            // sets text mode: should be set by the BIOS ?
            this.setGfxMode(TEXT_MODE);

            this.setTextColor(1, 15);
        },

        initTextMode: function() {
            var canvas = $('<canvas/>').attr('id', 'textDisplay').attr('width', 640).attr('height', 350).get(0);

            // text screen
            this.consoleScreen = $('#display');

            this.consoleScreen.append(canvas);

            this.textCtx = canvas.getContext('2d');
            this.textCtx.font = '14px Lucida Console, Lucida, Courier New, Courier';
            this.textCtx.textBaseline = 'bottom';

            this.characterSize = this.measureText();
        },

        initVGAMode: function() {
            var canvas = $('<canvas/>').attr('id', 'vgaDisplay').attr('width', 320).attr('height', 200).hide().get(0);

            // text screen
            this.graphicsScreen = $('#display');

            this.graphicsScreen.append(canvas);

            this.vgaCtx = canvas.getContext('2d');
            
            this.vgaModeBase = MMU.vga;
        },

        addPorts: function()
        {
            // CGA control ports
            IOHandler.addReadHandler(0x3D4, $.proxy(this.sendControl, this));
        },

        // sends some command to the graphics chip
        sendControl: function(port, val)
        {
            console.log('got command: ', port, val.toHex());
        },

        setGfxMode: function(mode)
        {
            console.log('[GraphicsBoard] switching to mode ' + mode.toHex());
            if (mode && mode !== this.currentMode) {

                // stop current mode render loop first
                if (this.requestId) {
                    cancelAnimationFrame(this.requestId);
                }
                
                switch(mode) {
                    case TEXT_MODE:
                        this.textInit(mode);
                    break;

                    case VGA_13H_MODE:
                        this.graphicsInit(mode);
                    break;
                        
                    default:
                        console.log('Warning: unknown graphics mode: ', mode.toHex());
                        mode = 0;
                    break;
                }

                this.currentMode = mode;
            }
        },

        /*********** TEXT MODE *************/
        // TODO: set this.palettes[MODE] with the one in memory ?
        // or should we set it when accessing registers ?
        textInit: function(mode) {
            this.modeDesc = this.textModes[0x3];
            this.maxChars = this.modeDesc[0] * this.modeDesc[1];

            // palette
            this.currentPalette = this.modeDesc[2].slice();            
            
            // clear the display
            this.clear();
            MMU.wbs(0x40, 0x49, mode);					     // set video mode
            MMU.wws(0x40, 0x4A, 0x80);						// set columns on screen
            MMU.memset(this.textAttributesBase + 7, 16);	// set Video cursor pos (x, y) for 8 pages (ie: 2 * 8 = 16 bytes)
            MMU.wws(0x40, 0x60, 0);							// ??	=> DOSBox
            MMU.wbs(0x40, 0x62, 0);							// current Video page num
            MMU.wws(0x40, 0x63, 0x3D4);						// CRT controller base adress
            MMU.wbs(0x40, 0x65, 0x3D8);						// Current setting, mode select register
            MMU.wbs(0x40, 0x66, 0x3D9);						// Current setting, mode select register	?? => DOSBox

            // TODO: should be set by bios

            this.refreshText();
        },
        
        graphicsInit: function(mode) {
            this.modeDesc = this.graphicModes[mode];
            
            // 13h 320x200x8 for now
            this.pixelWidth = this.modeDesc[0];
            this.pixelHeight = this.modeDesc[1]

            // palette: TODO, copy palette ?
            this.currentPalette = this.modeDesc[2];
            
            this.pixelData = this.vgaCtx.createImageData(this.pixelWidth, this.pixelHeight);
            
            this.refreshVGA13H();
            // TODO: registers controls...
        },

        setCursorPos: function(l, c) {
            c = c || 0;

            var pos = l * this.modeDesc[0] + c;

            if (pos > this.maxChars) {
                this.cursorPosition = pos % (this.maxChars);
            } else {
                this.cursorPosition = pos;
            }
        },

        setTextColor: function(backIdx, frontIdx) {
            this.currentColor = this.toColors(backIdx, frontIdx);
            this.currentColorIndex = [backIdx, frontIdx];
        },

        // TODO: use cursor position + handle paging
        outputText: function(str)
        {
            var base = this.textModeBase,
                i = 0,
                max;

            if (typeof str == 'undefined')
                return;

            // every character takes 2 bytes in memory
            base += this.cursorPosition * 2;

             // Add text to memory
            for (i = 0, max = str.length; i < max; i++) {
                MMU.wb(base++, this.currentColor);
                MMU.wb(base++, str.charCodeAt(i));
                this.cursorPosition++;
                if (this.cursorPosition > 1999) {
                    this.cursorPosition = 0;
                }
            }
        },

        // TODO: remove hardcoded values
        println: function(str) {
            // only goto newline if we're in the middle of a line
            if (this.cursorPosition > 1920) {
                this.setCursorPos(0, 0);
            } else if (this.cursorPosition % this.modeDesc[0]) {
                this.setCursorPos(Math.floor(this.cursorPosition / this.modeDesc[0]) + 1, 0);
            }
            this.outputText(str);
        },

        // TODO: do not hardcode carWidth/Height
        refreshText: function() {
            if (this.isActive) {
                this.requestId = requestAnimationFrame(this.refreshText.bind(this));
            }

            var base = this.textModeBase,
                palette = this.currentPalette,
                maxCol = this.modeDesc[0],
                maxLine = this.modeDesc[1],
                carWidth = this.characterSize[0],
                carHeight = this.characterSize[1],
                col = 0,
                line = 0,
                car = '',
                x = y = 0,
                textColor = 0;

            if (this.currentMode === TEXT_MODE) {
                for (line = 0; line < maxLine; line++) {
                    for (col = 0; col < maxCol; col++) {
                        x = col * carWidth;
                        y = line * carHeight;
                        colors = this.getColors(MMU.rb(base++));
                        car = String.fromCharCode(MMU.rb(base++));

                        // draw background
                        this.textCtx.fillStyle = palette[colors[0]];
                        this.textCtx.fillRect(x, y, carWidth, carHeight);

                        // draw text
                        this.textCtx.fillStyle = palette[colors[1]];
                        this.textCtx.fillText(car, x, y + carHeight);
                    }
                }
            }
        },

        refreshVGA13H: function() {
            if (this.isActive) {
                this.requestId = requestAnimationFrame(this.refreshVGA13H.bind(this));
            }
            
            var base = this.vgaModeBase,
                palette = this.currentPalette,
                width = this.pixelWidth,
                height = this.pixelHeight,
                max = width * height,
                pixelData = this.pixelData,
                paletteIndex,
                dataIndex;

            if (this.currentMode === VGA_13H_MODE) {
                for (i = 0; i < max; i++) {
                    // since we store each rgb in palette we need to skip r/g/b
                    paletteIndex = base[i] * 3;
                    dataIndex = i * 4;
                    
                    pixelData.data[dataIndex] = palette[paletteIndex];
                    pixelData.data[dataIndex + 1] = palette[paletteIndex + 1];
                    pixelData.data[dataIndex + 2] = palette[paletteIndex + 2];
                    pixelData.data[dataIndex + 3] = 255;
                }
                
                this.vgaCtx.putImageData(pixelData, 0, 0);
            }
        },

        // TODO: handle current screen size + paging
        clear: function(color)
        {
            // Should clear reset cursor position ?

            color = color || 0x0;

            var maxCars = this.maxChars,
                base = this.textModeBase,
                i = 0;

            for (i = 0; i < maxCars; i++) {
                MMU.wb(base++, color);
                MMU.wb(base++, 0x20);
            }
        }

        /*********** CGA MODE *************/
    };

    return Graphics;
});
