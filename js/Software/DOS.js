/*

	DOS + DOS Interrupts

*/
/*
function DOS_MCB(seg) {
	this.seg = seg;
	this.size = 0;
	this.type = 0x4d;
	this.pspSeg = 0;
	this.filename = '';
}
*/
/*
public:
	DOS_MCB(Bit16u seg) { SetPt(seg); }
	void SetFileName(char const * const _name) { MEM_BlockWrite(pt+offsetof(sMCB,filename),_name,8); }
	void GetFileName(char * const _name) { MEM_BlockRead(pt+offsetof(sMCB,filename),_name,8);_name[8]=0;}
	void SetType(Bit8u _type) { sSave(sMCB,type,_type);}
	void SetSize(Bit16u _size) { sSave(sMCB,size,_size);}
	void SetPSPSeg(Bit16u _pspseg) { sSave(sMCB,psp_segment,_pspseg);}
	Bit8u GetType(void) { return (Bit8u)sGet(sMCB,type);}
	Bit16u GetSize(void) { return (Bit16u)sGet(sMCB,size);}
	Bit16u GetPSPSeg(void) { return (Bit16u)sGet(sMCB,psp_segment);}
private:
	#ifdef _MSC_VER
	#pragma pack (1)
	#endif
	struct sMCB {
		Bit8u type;
		Bit16u psp_segment;
		Bit16u size;
		Bit8u unused[3];
		Bit8u filename[8];
	} GCC_ATTRIBUTE(packed);
	#ifdef _MSC_VER
	#pragma pack ()
	#endif

};
*/

define(['X86', 'MMU', 'Graphics', 'BinFileReader', 'Utils'], function(X86, MMU, Graphics, BinFileReader, Utils) {
    var JSDOS = {
        welcomeMessage: 'JSDOS - Very Simple DOS Reimplementation\nType help for a list of available commands',
        fileName: '',
        file: null,
        memList: [],		// keeps track of allocated memory
        fileHandles: [],	// keeps track of all file handles
        internalCommands: [
            { names: 'dir|ls',		description: 'list current directory' },
            { names: 'cd',			description: 'change current directory' },
            { names: 'type|cat',	description: 'display the contents of selected file' },
            { names: 'help',		description: 'display a list of available commands' }
        ],

        DOS_MEM_START: 0x196,		//First Segment that DOS can use 0x16f
        IntServer: null,

        init: function(IntServer) {
            this.IntServer = IntServer;
            // ** PUTBACK IntServer.registerInterrupts(0x20, JSDOS, 'DOS');
            // ** PUTBACK IntServer.registerInterrupts(0x21, JSDOS, 'DOS');

            this.startPrompt();
        },

        // header of current file
        exeHeader: {
            signature: 0,							// 'MZ' or 'ZM': 0x4D5A or 0x5A4D
            bytesLastBlock: 0,
            blocksInFile: 0,
            numRelocs: 0,
            headerParagraphs: 0,					// size of header in paragraphs
            minExtraParagraphs: 0,					//
            maxExtraParagraphs: 0,
            ss: 0,
            sp: 0,
            checksum: 0,
            ip: 0,
            cs: 0,
            relocTableOffset: 0,
            overlayNumber: 0
        },

        // fill-in default information here!
        PSP: {
            topMemory: Utils.mkw(0x09, 0xff),
            memStart: 0,
            cmdLine: ''
        },

        DOSVersion: 5,	// we'll say we emulate DOS 5

        /******* FILES SUPPORT ********/
        // TODO: optimize !
        fillExeHeader: function()
        {
            var i;

            this.exeHeader =
            {
                signature: Utils.mkw(this.file.readByteAt(0x00),	this.file.readByteAt(0x01)),
                bytesLastBlock: Utils.mkw(this.file.readByteAt(0x02),	this.file.readByteAt(0x03)),
                blocksInFile: Utils.mkw(this.file.readByteAt(0x04),	this.file.readByteAt(0x05)),
                numRelocs: Utils.mkw(this.file.readByteAt(0x06),	this.file.readByteAt(0x07)),
                headerParagraphs: Utils.mkw(this.file.readByteAt(0x08),	this.file.readByteAt(0x09)),	// size of header in paragraphs
                minExtraParagraphs: Utils.mkw(this.file.readByteAt(0x0a),	this.file.readByteAt(0x0b)),	//
                maxExtraParagraphs: Utils.mkw(this.file.readByteAt(0x0c),	this.file.readByteAt(0x0d)),	//
                ss: Utils.mkw(this.file.readByteAt(0x0e),	this.file.readByteAt(0x0f)),
                sp: Utils.mkw(this.file.readByteAt(0x10),	this.file.readByteAt(0x11)),
                checksum: Utils.mkw(this.file.readByteAt(0x12),	this.file.readByteAt(0x13)),
                ip: Utils.mkw(this.file.readByteAt(0x14),	this.file.readByteAt(0x15)),
                cs: Utils.mkw(this.file.readByteAt(0x16),	this.file.readByteAt(0x17)),
                relocTableOffset: Utils.mkw(this.file.readByteAt(0x18),	this.file.readByteAt(0x19)),
                overlayNumber: Utils.mkw(this.file.readByteAt(0x1a),	this.file.readByteAt(0x1b))
            };

            for (i in this.exeHeader)
            {
                console.log(i + '=' + this.exeHeader[i].toHex());
            }
        },

        loadBinary: function(binOffset, destAbs)
        {
            // get binary offset

        },

        // returns the location of the first block of size sizeB...
        memGetFirstBlock: function(sizeB)
        {

        },

        setupPSP: function(memStart)
        {
            this.PSP.memStart = memStart;
            // int 20h instruction
            MMU.ww(memStart, 0xCD20);

            // top of Memory segment
            MMU.ww(memStart + 2, 0xFF9F);

            // reserved
            MMU.wb(memStart + 4, 0);

            // int 21h ?
            MMU.wb(memStart + 5, 0xEA);

            // available memory
            MMU.ww(memStart + 6, 0xFFFF);

            // reserved
            MMU.ww(memStart + 8, 0xADDE);

            // TODO: PSP + 0x80 = length of cmd arguments
            // then PSP + 0x81 = argument string ended by '0x0d'
            // for now we hardcode no argument
            MMU.wb(memStart + 0x80, 0);
            MMU.wb(memStart + 0x81, 0x0D);
            // NOTE: string souyld end add 0xFF, nothin more

            // more to do !
            // TODO: add environment segment at PSP + 0x2C ! (environment should be set
            // before the PSP
            // first MCB:
            // Z|P
            // PSPSeg
            //
        },

        /********** MEMORY **********/
        // allocates a block and returns the blockNum
        // TODO: hardcoded for now, fix me !
        allocate: function(sizeB)
        {
            this.memList[this.memList.length] = {
                start: 0x197 * 16,
                sizeB: sizeB
            };
            return (this.memList.length - 1);
        },

        // TODO: be sure that blockNum is deleted from the array ! (splice ?)
        free: function(blockNum)
        {
            try{
                this.memList.splice(blockNum, 1);
            }
            catch(err)
            {
                console.log('Segmentation Fault when trying to free block ' + blockNum);
            }
        },

        // TODO: allocate needed memory in DOS.memList
        loadCOM: function()
        {
            var size = this.file.getFileSize();

            // TODO: fill in PSP with correct DATA, at least what we know about for now...
            // we're only dealing with COM files now which only contain a single segment for data/code and are executed from off 100h
            // we'll start from 0x197:0x100 which is the start of user RAM)
            var start = MMU.getAbs(0x197, 0);
            start += 0x100;

            // loads the seg into 0x100
            // TODO: optimize ! :)
            for (var i = 0; i < size; i++, start++)
            {
                // console.log('writing...' + this.file.readByteAt(i));
                MMU.wb(start, this.file.readByteAt(i));
            }

            // prepare CPU registers
            // ds = cs = 0x197
            X86.ds = X86.cs = X86.ss = X86.es = X86.dx = 0x197;

            // NOTE: ip is relative to cs !
            X86.ip = 0x100;

            // stack init
            X86.sp = 0xFFFE;
            MMU.wws(X86.ss, X86.sp, 0);

            return true;
        },

        prepareRegisters: function()
        {
            // stack
            X86.ss = this.exeHeader.ss + 0x10 + 0x197;
            X86.sp = this.exeHeader.sp;

            // ip
            X86.cs = this.exeHeader.cs + 0x10 + 0x197;
            X86.ip = this.exeHeader.ip;

            X86.ds = X86.es = X86.dx = 0x197;	// hardcoded for now: FIX ME !!

            X86.ax = X86.bx = 0; X86.cx = 0xff;

            // Old DOS stack stuff
            X86.bp = 0x91C;

            X86.di = X86.ip;
            X86.si = X86.sp;

            // clear test flags and set CF
            X86.setFlag(X86.FLAG_CF, false);
        },

        // TODO: allocate memory in DOS.memList
        // TODO: make sure segstart is 16b aligned !
        loadEXE: function()
        {
            Graphics.println('Attempt to load MZ executable!');

            var size = this.file.getFileSize(),
            memStart = 0,
            exeStart = 0,
            binarySize = 0,
            blockNum;

            // fill-in the header
            this.fillExeHeader();
            binarySize = (this.exeHeader.blocksInFile * 512);
            //- (this.exeHeader.headerParagraphs * 16);
            console.log('got exe header !');
            // console.log(this.exeHeader);

            // allocate the memory
            // ** Generates MCB on the previous seg...
            // ** HARDCODED: test for now !!!
            // last block ?!
            MMU.wbs(0x196, 0x0, 0x5A);
            MMU.wws(0x196, 0x1, Utils.mkw(0x01, 0x97));	// PSP is at 0x197
            MMU.wws(0x196, 0x3, Utils.mkw(0x68, 0x9e));	// MCB size (paragraphes)
            MMU.wbs(0x196, 0x5, 0);	// 3
            MMU.wbs(0x196, 0x6, 0);	// 3
            MMU.wbs(0x196, 0x7, 0);	// 3
            MMU.wbs(0x196, 0x8, 'P'.charCodeAt(0));
            MMU.wbs(0x196, 0x9, 'R'.charCodeAt(0));
            MMU.wbs(0x196, 0xA, 'I'.charCodeAt(0));
            MMU.wbs(0x196, 0xB, 'N'.charCodeAt(0));
            MMU.wbs(0x196, 0xC, 'C'.charCodeAt(0));
            MMU.wbs(0x196, 0xD, 'E'.charCodeAt(0));
            MMU.wbs(0x196, 0xE, 0);
            MMU.wbs(0x196, 0xF, 0);
            // ** /Generates MCB

            blockNum = this.allocate(binarySize);

            exeStart = this.exeHeader.headerParagraphs * 16;
            memStart = this.memList[blockNum].start;

            this.setupPSP(memStart);

            // Seems like DOSBox starts at 0x100 even for .EXE files, not only COM files
            // so we'll do the same. PSP should be set at 0000 -> 00FF
            memStart += 0x100;

            /*
            console.log('reading ' + binarySize + ' bytes to ' + memStart.toHex());
            console.log('exeStart = ' + exeStart);
            */
            // reads the whole binary into memory previously allocated
            for (var i = exeStart; i < binarySize; i++, memStart++)
            {
                /*
                if (i > (100000))
                {
                    console.log('writing...' + this.file.readByteAt(i).toHex() + ' to ' + memStart);
                }
                */
                MMU.wb(memStart, this.file.readByteAt(i));
            }

            // TODO: save the caller's CS:IP when we'll have one (Overlay, or DOS prompt)

            // now prepare registers
            this.prepareRegisters();

            // TEST :)
            X86.updateCpuConsole();

            return true;
        },

        loadAndExecute: function(fileName)
        {
            this.fileName = fileName;
            var success = false;

            console.log('loadAndExecute: ' + this.fileName);
            Graphics.println("Loading " + this.fileName + '...');
            // loads a new file using ajax and tries to execute it...
            try{
                this.file = new BinFileReader(this.fileName);
            }
            catch(err)
            {
                console.log('Error loading binary file');
                return false;
            }

            console.log('successfully loaded file: ' + this.file.getFileSize() + ' bytes');

            // get header
            switch(this.file.readString(2, 0))
            {
                case 'MZ':
                case 'ZM': // some compilers weren't little endian aware it seems !
                    success = this.loadEXE();
                break;

                default:
                    success = this.loadCOM();
                break;
            }

            return success;
        },

        /******** COMMAND.COM **********/
        startPrompt: function() {
            // TODO: check that text mode is set ?!
            // Graphics.clear();
            Graphics.outputText(this.welcomeMessage);
        },

        /******** DOS INTERRUPTS *******/

        // outputs a character to the current cursor position
        // dl: char
        0x2: function()
        {

        },

        // outputs a string terminated by $
        // dx: pointer
        0x9: function()
        {
            console.log('[DOS/Int] 0x9: displaying string');
            // test: getting string :)
            var str = MMU.rss(X86.ds, X86.dx);
            console.log('got ' + str);
            Graphics.println(str);
        },

        // Get DOS version, AH = minor, AL = major
        0x20: function()
        {
            console.log('[DOS/Int] 0x20: Get DOS version');
            X86.ax = this.DOSVersion;
        },

        // Set interrupt vector of int AL
        // DS:DX, new interrupt handler
        //
        0x25: function()
        {
            console.log('[DOS/Int] 0x25: set int vector');
            JSDOS.IntServer.setIntAddr(X86.al(), Utils.swapb(X86.ds), Utils.swapb(X86.dx));
            // TODO: check that it works for intNum > 0 !
            // throw('0x25 DOS function not implemented, see FreeDOS or DOSBox sources !');
        },

        // Get DOS versions
        0x30: function()
        {
            console.log('[DOS/Int] 0x30: get DOS versions');
            X86.ax = JSDOS.DOSVersion;
            X86.bx = 0x0000;	// minor version ?!
            console.log('set version to ' + JSDOS.DOSVersion);
        },

        // Get interrupt vector for AL int
        // Res in ES:BX
        0x35: function()
        {
            console.log('[DOS/Int] 0x35: get int vector');
            // TODO: check bounds !
            var intNum = X86.al();
            console.log('need to get int vec for ' + intNum.toHex());
            console.log(JSDOS.IntServer.getIntAddr(intNum));
            var intAddr = JSDOS.IntServer.getIntAddr(intNum);
            X86['bx'] = intAddr.off;
            X86['es'] = intAddr.seg;
            // throw('0x35 DOS function not implemented, see FreeDOS or DOSBox sources !');
        },

        // Get device information, BX = handle
        // Res in DX = device information word
        // AX = destroyed
        0x44: function()
        {
            throw('0x44 DOS function not implemented, see FreeDOS or DOSBox sources !');
        },

        // resize memory block
        // @ES: Segment (ie: MCB header == (Segment - 1) ?)
        // @BX: New wanted size
        //
        // Result: CF == 0 if success, CF == 1 if error
        // HARDCODED for NOW !
        0x4a: function()
        {
            console.log('[DOS/Int] 0x4a: resize memory block');
            var pspSeg = X86.es,
                wantedPara = X86.bx;

            MMU.wws(pspSeg - 1, 0x3, Utils.swapb(wantedPara));
            MMU.wbs(pspSeg - 1, 0x0, 0x4D);

            console.log('need to set size of ' + pspSeg.toHex() + ' to para = ' + wantedPara.toHex());
            X86.setFlag(X86.FLAG_CF, false);
        },

        // MSDOS Exec function: should be used when loading/execing .EXE/.COM files when it's ready !
        // AH = 4BH
        // AL = 00H (load child program)
        // DS:DX Pathname for child program
        // ES:BX Parameter block
        //		Environment block seg (2 bytes)
        //		Command Tail (4 bytes: xxxx xxxx off, seg)
        //		Two FCB (2 * 4 = 8 bytes)
        0x4b: function()
        {

        },

        0x4c: function()
        {
            console.log('[DOS/Int] 0x4c: exit to DOS');
            // exits to DOS
            Grphics.println('got DOS exit code, halting CPU :)');
            X86.stop();
        }
    };

    return JSDOS;
});
