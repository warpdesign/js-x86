        require.config({
            baseUrl: 'js/',
            paths: {
                // the left side is the module ID,
                // the right side is the path to
                // the jQuery file, relative to baseUrl.
                // Also, the path should NOT include
                // the '.js' file extension. This example
                // is using jQuery 1.9.0 located at
                // js/lib/jquery-1.9.0.js, relative to
                // the HTML page.
                jquery:         'lib/jquery-2.0.2.min',
                app:            'app/jsx86',
                X86:            'CPU/X86',
                MMU:            'CPU/MMU',
                IntServer:      'CPU/IntServer',
                JSDOS:          'Software/DOS',
                BIOS:           'Software/BIOS',
                Flags:          'CPU/Flags',
                OpCodes:        'CPU/OpCodes',
                MemViewer:      'Misc/MemViewer',
                Utils:          'Misc/Utils',
                BinFileReader:  'Misc/BinFileReader',
                Graphics:       'Hardware/Graphics',
                Timer:          'Hardware/Timer',
                PIC:            'Hardware/PIC',
                IOHandler:      'Hardware/IOHandler',
                DMA:            'Hardware/DMA',
                TextDisplay:    'Misc/TextDisplay'
            }
        });
