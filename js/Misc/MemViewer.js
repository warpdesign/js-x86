/* Number utils
    TODO: Highlight corresponding character when editing a number, highlight the corresponding number when editing a character
*/
define(['jquery', 'MMU'], function($, MMU) {
    var MemViewer = {
        start: 0,
        end: 16*8,
        $viewport: null,
        $lines: null,
        $view: null,
        mem: null,
        editing: false,
        
        // @sel: element to which we should append the memviewer
        init: function(sel) {
            var that = this;
    
            MMU.addToWatchList(this.start, this.end, $.proxy(this.onMemoryChange, this));
    
            this.$viewport = $('<div/>').appendTo($(sel));
            this.$lines = $('<div class="lines"/>').appendTo(this.$viewport);
            this.$view = $('<div class="view"/>').appendTo(this.$viewport);
            this.$ascii = $('<div class="ascii"/>').appendTo(this.$viewport);
            this.$start = $('<input type="text" name="startOffset" id="startOffset" value="' + this.start + '" />');
            $('<label for="startOffset">startOffset (segment) 0x</label>').append(this.$start).appendTo(this.$viewport);
        
            this.$start.blur(function() {
                that.setViewPort(parseInt($(this).val(), 16), 16 * 8);
            });
            
            this.setViewPort(this.start, this.end);
    
            // Hack auto refresh every second
            setInterval($.proxy(this.refresh, this), 1000);
        },
    
        setMemory: function(offset, value) {
            this.mem.setUint8(offset, value);
            this.onMemoryChange(offset);
        },
    
        setViewPort: function(start, end) {
            this.start = start;
            this.end = end;
    
            this.mem = MMU.getView(MMU.getAbs(this.start, 0), 8 * 16);
            this.refresh();
        },
    
        onMemoryChange: function(addr) {
            var line = Math.floor(addr / 16),
                col = addr % 16,
                memValue = this.mem.getUint8(addr);
    
            this.$lines.find('div:eq(' + line + ')').find('span:eq(' + col +')').html(memValue.toHex());
            this.$ascii.find('div:eq(' + line + ')').find('span:eq(' + col +')').html((memValue <= 126 && memValue >= 32) ? String.fromCharCode(memValue) : '.');
        },
    
        // refresh the whole viewport
        refresh: function() {
            var i = 0,
                j = 0,
                $line = null,
                start = this.start,
                that = this,
                memValue = 0;
    
            // refreshing the display while the user is editing an entry would cancel the editing
            // so we let the user edit its display before refreshing
            if (this.editing === true)
                return;
    
            this.$lines.empty();
            this.$view.empty();
            this.$ascii.empty();
    
            try{
                for (i = 0; i < 8; i++) { 
                    this.$lines.append('<span>' + Number((this.start + (i * 16))).toHex() + '</span>');
                    $line = $('<div/>').data('offset', i * 16);
                    $lineAscii = $('<div/>').data('offset', i * 16);
                    for (j = 0; j < 16; j++) {
                        memValue = this.mem.getUint8((i*16)+j);
                        window.ascii = $lineAscii;
                        
                        $lineAscii.append($('<span contentEditable="true">').data('offset', j).html((memValue <= 126 && memValue >= 32) ? String.fromCharCode(memValue) : '.').blur(function() {
                            that.editing = false;
                            that.setMemory($(this).parent().data('offset') + $(this).data('offset'), $(this).text().charCodeAt(0));
                        }).keydown(function() {
                        }).focus(function() {
                            that.editing = true;
                            var span = this;
                            
                            setTimeout(function() {
                                var sel, range;
                                if (window.getSelection && document.createRange) {
                                    range = document.createRange();
                                    range.selectNodeContents(span);
                                    sel = window.getSelection();
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                } else if (document.body.createTextRange) {
                                    range = document.body.createTextRange();
                                    range.moveToElementText(span);
                                    range.select();
                                }
                            }, 1);
                        }));
                        
                        $line.append($('<span contentEditable="true">').data('offset', j).html(memValue.toHex(true)).blur(function() {
                            that.setMemory($(this).parent().data('offset') + $(this).data('offset'), Number(parseInt($(this).html(), 16)));
                            that.editing = false;
                        }).focus(function() {
                            that.editing = true;
                            var span = this;
                            // selection
                            setTimeout(function() {
                                var sel, range;
                                if (window.getSelection && document.createRange) {
                                    range = document.createRange();
                                    range.selectNodeContents(span);
                                    sel = window.getSelection();
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                } else if (document.body.createTextRange) {
                                    range = document.body.createTextRange();
                                    range.moveToElementText(span);
                                    range.select();
                                }
                            }, 1);
                        }));
                    }
                    this.$view.append($line);
                    this.$ascii.append($lineAscii);
                }
            } catch(err) {
                debugger;
            }
        }
    };
    
    return MemViewer;
});