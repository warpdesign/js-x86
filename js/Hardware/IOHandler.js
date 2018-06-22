// Handles all I/O handlers
// TODO: add type of port (Byte/Word)
define(function() {
    var READ_HANDLER = 1,
        WRITE_HANDLER = 2;
    
    var IOHandler = {
        readHandlers: {},	// format:
        writeHandlers: {},
    
        addReadHandler: function(port, callback)
        {
            if (this.readHandlers.hasOwnProperty(port.toString()))
            {
                console.log('WARN: readHandler already defined for port: ' + port.toHex());
                return false;
            }
            else
            {
                this.readHandlers[port] = callback;
                return true;
            }
    
        },
    
        addWriteHandler: function(port, callback)
        {
            if (this.writeHandlers.hasOwnProperty(port.toString()))
            {
                console.log('WARN: readHandler already defined for port: ' + port.toHex());
                return false;
            }
            else
            {
                this.writeHandlers[port] = callback;
                return true;
            }
        },
    
        removeReadHandler: function(port)
        {
            delete this.readHandlers[port];
        },
    
        removeWriteHandler: function(port)
        {
            delete this.writeHandlers[port];
        },
    
        inb: function(port)
        {
            try
            {
                return this.readHandlers[port]();
            }
            catch(err)
            {
                console.log('WARN: unknown port ' + port.toHex() + ' for reading byte');
            }
        },
    
        inw: function(port)
        {
            try
            {
                return this.readHandlers[port]();
            }
            catch(err)
            {
                console.log('WARN: unknown port ' + port.toHex() + ' for reading word');
            }
        },
    
        outb: function(port, valb)
        {
            try
            {
                return this.writeHandlers[port](port, valb);
            }
            catch(err)
            {
                console.log('WARN: unknown port ' + port.toHex() + ' for writing byte');
            }
        },
    
        outw: function(port, valw)
        {
            try
            {
                return this.writeHandlers[port](port, valw);
            }
            catch(err)
            {
                console.log('WARN: unknown port ' + port.toHex() + ' for writing word');
            }
        },
    };
    
    return IOHandler;
});