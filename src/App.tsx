import React, { useEffect } from 'react';
import { MMU } from '$src/cpu/MMU';
import { FetchBinary } from '$src/utils/FetchBinary';

const init = async () => {
    console.log('[init]');
    MMU.init();

    // MemViewer.init('#viewer');

    // Load BIOS image into 0xf0000-0xfffff, do we need to get another copy elsewhere?

    // $.get('BIOS/BIOS-Bochs.base64').done(function(biosBase64) {
    const buffer = await FetchBinary('/static/BIOS/bios');

    MMU.mapUint8Array(buffer, 0x100000 - buffer.length, buffer.length);
    // $.get('BIOS/pcxtbios.base64').done(function(biosBase64) {
    //     var buffer = Utils.base64DecToArr(biosBase64);

    //     // Map BIOS ROM to end of 1Mb low RAM
    //     // since BIOS size can vary from 8kb to 64kb and up,
    //     // we put it at the end of BIOS data area
    //     MMU.mapUint8Array(buffer, 0x100000 - buffer.length, buffer.length);

    //     // setup interrupts vector
    //     IntServer.init();

    //     DMA.init();

    //     // inits some variables
    //     BIOS.init(IntServer);

    //     JSDOS.init(IntServer);

    //     Utils.installPolyfills();

    //     bindDebuggerEvents();
    // });
};

export default function App() {
    console.log('[App] Hello');
    useEffect(() => {
        init();
    }, []);

    return <div>JSx86</div>;
    // X86.setOpCodesTable(OpCodes);
}
