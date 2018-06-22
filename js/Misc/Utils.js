/* Number utils */
define(['jquery'], function($) {
    Number.prototype.toHex = function(tiny)
    {
        var val = this.valueOf();
        var str = '';

        if (val == 0)
            str = (tiny !== undefined) ? '00' : '0000';
        else if (val > 255)
        {
            var upper = (val >> 8).toString(16);
            var lower = (val & 0x00FF).toString(16);
            str = ((upper.length > 1) ? upper : ('0' + upper)) + ((lower.length > 1) ? lower : ('0' + lower));
        }
        else
        {
            str = val.toString(16);
            if (val < 16)
                str = '0' + str;
        }

        if (tiny === undefined && str.length < 4)
            str = '00' + str;

        return str.toUpperCase();
    }

    var Utils = {
        hb: function(val) {
            return (val >> 8);
        },

        lb: function(val) {
            return (val & 0x00FF);
        },

        // revert high/low bytes
        swapb: function(val) {
            return ((this.lb(val) << 8) + this.hb(val));
        },

        mkw: function(h, l) {
            return (h + (l << 8));
        },

        mkdw: function(h, l) {
            return (h + (l << 16));
        },

        bin2bcd: function(val) {
            var temp = val % 10 + (((val/10)%10)<<4)+ (((val/100)%10)<<8) + (((val/1000)%10)<<12);
            return temp;
        },

        bcd2bin: function(val) {
            var temp = (val&0x0f) +((val>>4)&0x0f) *10 +((val>>8)&0x0f) *100 +((val>>12)&0x0f) *1000;
            return temp;
        },

        EventManager: {
            KEY_1: 97,
            KEY_2: 98,
            KEY_3: 99,
            keyCode: null,
            bindings: {},

            init: function()
            {
                var that = this;
                $(function() {
                    $(document).bind('keyup', function(event){
                    that.keyCode = event.keyCode;
                    try{
                        that.bindings[event.keyCode]();
                    }
                    catch(err) { /* console.log(err); */ }
                    }); // bind
                });
            },

            bindKey: function(keyCode, cb)
            {
                this.bindings[keyCode] = cb;
            },

            getLastKey: function()
            {
                var keyCode = (this.keyCode !== null) ? this.keyCode : 0;
                this.keyCode = null;

                return keyCode;
            }
        },
        installPolyfills: function() {
            // shim layer with setTimeout fallback
            // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
            // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

            // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

            // MIT license

            (function() {
                var lastTime = 0;
                var vendors = ['ms', 'moz', 'webkit', 'o'];
                for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
                    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                               || window[vendors[x]+'CancelRequestAnimationFrame'];
                }

                if (!window.requestAnimationFrame)
                    window.requestAnimationFrame = function(callback, element) {
                        var currTime = new Date().getTime();
                        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                        var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                          timeToCall);
                        lastTime = currTime + timeToCall;
                        return id;
                    };

                if (!window.cancelAnimationFrame)
                    window.cancelAnimationFrame = function(id) {
                        clearTimeout(id);
                    };
            }());
        },
        base64DecToArr: function (sBase64, nBlocksSize) {
            function b64ToUint6 (nChr) {
                return nChr > 64 && nChr < 91 ?
                nChr - 65
                : nChr > 96 && nChr < 123 ?
                nChr - 71
                : nChr > 47 && nChr < 58 ?
                nChr + 4
                : nChr === 43 ?
                62
                : nChr === 47 ?
                63
                :
                0;
            }

          var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
                nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

          for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
            nMod4 = nInIdx & 3;
            nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
            if (nMod4 === 3 || nInLen - nInIdx === 1) {
              for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
              }
              nUint24 = 0;

            }
          }

          return taBytes;
        }

    };

    return Utils;
});
