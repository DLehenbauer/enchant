/* GlkAPI -- a Javascript Glk API for IF interfaces
 * Designed by Andrew Plotkin <erkyrath@eblong.com>
 * <http://eblong.com/zarf/glk/glkote.html>
 * 
 * This Javascript library is copyright 2010 by Andrew Plotkin. You may
 * copy and distribute it freely, by any means and under any conditions,
 * as long as the code and documentation is not changed. You may also
 * incorporate this code into your own program and distribute that, or
 * modify this code and use and distribute the modified version, as long
 * as you retain a notice in your program or documentation which mentions
 * my name and the URL shown above.
 *
 * This file is a Glk API compatibility layer for glkote.js. It offers a 
 * set of Javascript calls which closely match the original C Glk API;
 * these work by means of glkote.js operations.
 *
 * This API was built for Quixe, which is a pure-Javascript Glulx
 * interpreter. Therefore, the API is a little strange. Notably, it
 * accepts string data in the form of an array of integers, not a 
 * Javascript string. There are a few extra calls (glk_put_jstring,
 * etc) which work in the more intuitive way.
 *
 * If you are writing an application in pure Javascript, you can use
 * this layer (along with glkote.js). If you are writing a web app which
 * is the front face of a server-side Glk app, ignore this file -- use
 * glkote.js directly.
 */


/* Known problems:

   Some places in the library get confused about Unicode characters
   beyond 0xFFFF. They are handled correctly by streams, but grid windows
   will think they occupy two characters rather than one, which will
   throw off the grid spacing. 

   Also, the glk_put_jstring() function can't handle them at all. Quixe
   printing operations that funnel through glk_put_jstring() -- meaning, 
   most native string printing -- will break up three-byte characters 
   into a UTF-16-encoded pair of two-byte characters. This will come
   out okay in a buffer window, but it will again mess up grid windows,
   and will also double the write-count in a stream.
*/

/* The VM interface object. */
var VM = null;

var event_generation = 0;

/* Initialize the library, initialize the VM, and set it running. (It will 
   run until the first glk_select() or glk_exit() call.)

   The argument must be an appropriate VM interface object. (For example, 
   Quixe.) It must have init() and resume() methods. 
*/
function init(vm_api) {
    VM = vm_api;
    if (window.GiDispa)
        GiDispa.set_vm(VM);
    //### the 4 spacing here should come from somewhere else
    GlkOte.init({ accept: accept_ui_event, spacing: 4 });
}

function accept_ui_event(obj) {
    var box;

    qlog("### accept_ui_event: " + obj.type + ", gen " + obj.gen);

    if (obj.gen != event_generation) {
      GlkOte.log('Input event had wrong generation number: got ' + obj.gen + ', currently at ' + event_generation);
      return;
    }
    event_generation += 1;

    switch (obj.type) {
    case 'init':
        content_metrics = obj.metrics;
        VM.init();
        break;

    case 'char':
        //###
        break;

    case 'line':
        handle_line_input(obj.window, obj.value);
        break;

    case 'arrange':
        content_metrics = obj.metrics;
        geometry_changed = true;
        box = {
            left: content_metrics.outspacingx,
            top: content_metrics.outspacingy,
            right: content_metrics.width-content_metrics.outspacingx,
            bottom: content_metrics.height-content_metrics.outspacingy,
        };
        if (gli_rootwin)
            gli_window_rearrange(gli_rootwin, box);
        update();
        break;
    }
}

function handle_line_input(disprock, input) {
    var ix;

    if (!gli_selectref)
        return;

    var win = null;
    for (win=gli_windowlist; win; win=win.next) {
        if (win.disprock == disprock) 
            break;
    }
    if (!win || !win.line_request)
        return;

    if (input.length > win.linebuf.length)
        input = input.slice(0, win.linebuf.length);

    ix = win.style;
    gli_set_style(win.str, Const.style_Input);
    gli_window_put_string(win, input+"\n"); 
    gli_set_style(win.str, ix);
    //### wrong for grid window?

    for (ix=0; ix<input.length; ix++)
        win.linebuf[ix] = input.charCodeAt(ix);

    gli_selectref.set_field(0, Const.evtype_LineInput);
    gli_selectref.set_field(1, win);
    gli_selectref.set_field(2, input.length);
    gli_selectref.set_field(3, 0);

    if (window.GiDispa)
        GiDispa.unretain_array(win.linebuf);
    win.line_request = false;
    win.line_request_uni = false;
    win.input_generation = null;
    win.linebuf = null;

    if (window.GiDispa)
        GiDispa.prepare_resume(gli_selectref);
    gli_selectref = null;
    VM.resume();
}

function update() {
    var dataobj = { type: 'update', gen: event_generation };
    var winarray = null;
    var contentarray = null;
    var inputarray = null;
    var win, obj, useobj, lineobj, ls, ix, cx, lastpos, laststyle;

    if (geometry_changed) {
        geometry_changed = false;
        winarray = [];
        for (win=gli_windowlist; win; win=win.next) {
            if (win.type == Const.wintype_Pair)
                continue;

            obj = { id: win.disprock, rock: win.rock };
            winarray.push(obj);

            switch (win.type) {
            case Const.wintype_TextBuffer:
                obj.type = 'buffer';
                break;
            case Const.wintype_TextGrid:
                obj.type = 'grid';
                obj.gridwidth = win.gridwidth;
                obj.gridheight = win.gridheight;
                break;
            }

            obj.left = win.bbox.left;
            obj.top = win.bbox.top;
            obj.width = win.bbox.right - win.bbox.left;
            obj.height = win.bbox.bottom - win.bbox.top;
        }
    }

    for (win=gli_windowlist; win; win=win.next) {
        useobj = false;
        obj = { id: win.disprock };
        if (contentarray == null)
            contentarray = [];

        switch (win.type) {
        case Const.wintype_TextBuffer:
            gli_window_buffer_deaccumulate(win);
            if (win.content.length) {
                obj.text = win.content.slice(0);
                win.content.length = 0;
                useobj = true;
            }
            break;
        case Const.wintype_TextGrid:
            if (win.gridwidth == 0 || win.gridheight == 0)
                break;
            obj.lines = [];
            for (ix=0; ix<win.gridheight; ix++) {
                lineobj = win.lines[ix];
                if (!lineobj.dirty)
                    continue;
                lineobj.dirty = false;
                ls = [];
                lastpos = 0;
                for (cx=0; cx<win.gridwidth; ) {
                    laststyle = lineobj.styles[cx];
                    for (; cx<win.gridwidth && lineobj.styles[cx] == laststyle; cx++) { }
                    if (lastpos < cx) {
                        ls.push(StyleNameMap[laststyle]);
                        ls.push(lineobj.chars.slice(lastpos, cx).join(''));
                        lastpos = cx;
                    }
                }
                qlog("### grid line " + ix + ": " + qobjdump(ls));
                obj.lines.push({ line:ix, content:ls });
            }
            useobj = obj.lines.length;
            break;
        }

        if (useobj)
            contentarray.push(obj);
    }

    inputarray = [];
    for (win=gli_windowlist; win; win=win.next) {
        if (win.char_request) {
            obj = { id: win.disprock, type: 'char', gen: win.input_generation };
            inputarray.push(obj);
        }
        if (win.line_request) {
            obj = { id: win.disprock, type: 'line', gen: win.input_generation,
                    maxlen: win.linebuf.length, initial: ''};
            //### get initial right
            inputarray.push(obj);
        }
    }

    dataobj.windows = winarray;
    dataobj.content = contentarray;
    dataobj.input = inputarray;

    GlkOte.update(dataobj);
}


/* All the numeric constants used by the Glk interface. We push these into
   an object, for tidiness. */

var Const = {
    gestalt_Version : 0,
    gestalt_CharInput : 1,
    gestalt_LineInput : 2,
    gestalt_CharOutput : 3,
      gestalt_CharOutput_CannotPrint : 0,
      gestalt_CharOutput_ApproxPrint : 1,
      gestalt_CharOutput_ExactPrint : 2,
    gestalt_MouseInput : 4,
    gestalt_Timer : 5,
    gestalt_Graphics : 6,
    gestalt_DrawImage : 7,
    gestalt_Sound : 8,
    gestalt_SoundVolume : 9,
    gestalt_SoundNotify : 10,
    gestalt_Hyperlinks : 11,
    gestalt_HyperlinkInput : 12,
    gestalt_SoundMusic : 13,
    gestalt_GraphicsTransparency : 14,
    gestalt_Unicode : 15,

    evtype_None : 0,
    evtype_Timer : 1,
    evtype_CharInput : 2,
    evtype_LineInput : 3,
    evtype_MouseInput : 4,
    evtype_Arrange : 5,
    evtype_Redraw : 6,
    evtype_SoundNotify : 7,
    evtype_Hyperlink : 8,

    style_Normal : 0,
    style_Emphasized : 1,
    style_Preformatted : 2,
    style_Header : 3,
    style_Subheader : 4,
    style_Alert : 5,
    style_Note : 6,
    style_BlockQuote : 7,
    style_Input : 8,
    style_User1 : 9,
    style_User2 : 10,
    style_NUMSTYLES : 11,

    wintype_AllTypes : 0,
    wintype_Pair : 1,
    wintype_Blank : 2,
    wintype_TextBuffer : 3,
    wintype_TextGrid : 4,
    wintype_Graphics : 5,

    winmethod_Left  : 0x00,
    winmethod_Right : 0x01,
    winmethod_Above : 0x02,
    winmethod_Below : 0x03,
    winmethod_DirMask : 0x0f,

    winmethod_Fixed : 0x10,
    winmethod_Proportional : 0x20,
    winmethod_DivisionMask : 0xf0,

    fileusage_Data : 0x00,
    fileusage_SavedGame : 0x01,
    fileusage_Transcript : 0x02,
    fileusage_InputRecord : 0x03,
    fileusage_TypeMask : 0x0f,

    fileusage_TextMode   : 0x100,
    fileusage_BinaryMode : 0x000,

    filemode_Write : 0x01,
    filemode_Read : 0x02,
    filemode_ReadWrite : 0x03,
    filemode_WriteAppend : 0x05,

    seekmode_Start : 0,
    seekmode_Current : 1,
    seekmode_End : 2,

    stylehint_Indentation : 0,
    stylehint_ParaIndentation : 1,
    stylehint_Justification : 2,
    stylehint_Size : 3,
    stylehint_Weight : 4,
    stylehint_Oblique : 5,
    stylehint_Proportional : 6,
    stylehint_TextColor : 7,
    stylehint_BackColor : 8,
    stylehint_ReverseColor : 9,
    stylehint_NUMHINTS : 10,

      stylehint_just_LeftFlush : 0,
      stylehint_just_LeftRight : 1,
      stylehint_just_Centered : 2,
      stylehint_just_RightFlush : 3,
};

var StyleNameMap = {
    0 : 'normal',
    1 : 'emphasized',
    2 : 'preformatted',
    3 : 'header',
    4 : 'subheader',
    5 : 'alert',
    6 : 'note',
    7 : 'blockquote',
    8 : 'input',
    9 : 'user1',
    10 : 'user2',
};

/* Convert a 32-bit Unicode value to a JS string. */
function CharToString(val) {
    if (val < 0x10000) {
        return String.fromCharCode(val);
    }
    else {
        val -= 0x10000;
        return String.fromCharCode(0xD800 + (val >> 10), 0xDC00 + (val & 0x3FF));
    }
}

/* Given an array, return an array of the same length with all the values
   trimmed to the range 0-255. This may be the same array. */
function TrimArrayToBytes(arr) {
    var ix, newarr;
    var len = arr.length;
    for (ix=0; ix<len; ix++) {
        if (arr[ix] < 0 || arr[ix] >= 0x100) 
            break;
    }
    if (ix == len) {
        return arr;
    }
    newarr = Array(len);
    for (ix=0; ix<len; ix++) {
        newarr[ix] = (arr[ix] & 0xFF);
    }
    return newarr;
}

/* Convert an array of 8-bit values to a JS string, trimming if
   necessary. */
function ByteArrayToString(arr) {
    var ix, newarr;
    var len = arr.length;
    if (len == 0)
        return '';
    for (ix=0; ix<len; ix++) {
        if (arr[ix] < 0 || arr[ix] >= 0x100) 
            break;
    }
    if (ix == len) {
        return String.fromCharCode.apply(this, arr);
    }
    newarr = Array(len);
    for (ix=0; ix<len; ix++) {
        newarr[ix] = String.fromCharCode(arr[ix] & 0xFF);
    }
    return newarr.join('');
}

/* Convert an array of 32-bit Unicode values to a JS string. If they're
   all in the 16-bit range, this is easy; otherwise we have to do
   some munging. */
function UniArrayToString(arr) {
    var ix, val, newarr;
    var len = arr.length;
    if (len == 0)
        return '';
    for (ix=0; ix<len; ix++) {
        if (arr[ix] >= 0x10000) 
            break;
    }
    if (ix == len) {
        return String.fromCharCode.apply(this, arr);
    }
    newarr = Array(len);
    for (ix=0; ix<len; ix++) {
        val = arr[ix];
        if (val < 0x10000) {
            newarr[ix] = String.fromCharCode(val);
        }
        else {
            val -= 0x10000;
            newarr[ix] = String.fromCharCode(0xD800 + (val >> 10), 0xDC00 + (val & 0x3FF));
        }
    }
    return newarr.join('');
}

/* Log the message in the browser's error log, if it has one. (This shows
   up in Safari, in Opera, and in Firefox if you have Firebug installed.)
*/
function qlog(msg) {
    if (window.console && console.log)
        console.log(msg);
    else if (window.opera && opera.postError)
        opera.postError(msg);
}

function qobjdump(obj, depth) {
    var key, proplist;

    if (obj instanceof Array) {
        if (depth)
            depth--;
        var ls = obj.map(function(v) {return qobjdump(v, depth);});
        return ("[" + ls.join(",") + "]");
    }
    if (!(obj instanceof Object))
        return (""+obj);

    proplist = [ ];
    for (key in obj) {
        var val = obj[key];
        if (depth && val instanceof Object)
            val = qobjdump(val, depth-1);
        proplist.push(key + ":" + val);
    }
    return "{ " + proplist.join(", ") + " }";
}

/* RefBox: Simple class used for "call-by-reference" Glk arguments. The object
   is just a box containing a single value, which can be written and read.
*/
function RefBox() {
    this.value = undefined;
    this.set_value = function(val) {
        this.value = val;
    }
    this.get_value = function() {
        return this.value;
    }
}

/* RefStruct: Used for struct-type Glk arguments. After creating the
   object, you should call push_field() the appropriate number of times,
   to set the initial field values. Then set_field() can be used to
   change them, and get_fields() retrieves the list of all fields.

   (The usage here is loose, since Javascript is forgiving about arrays.
   Really the caller could call set_field() instead of push_field() --
   or skip that step entirely, as long as the Glk function later calls
   set_field() for each field. Which it should.)
*/
function RefStruct(numels) {
    this.fields = [];
    this.push_field = function(val) {
        this.fields.push(val);
    }
    this.set_field = function(pos, val) {
        this.fields[pos] = val;
    }
    this.get_field = function(pos) {
        return this.fields[pos];
    }
    this.get_fields = function() {
        return this.fields;
    }
}

/* Dummy return value, which means that the Glk call is still in progress,
   or will never return at all. This is used by glk_exit() and glk_select().
*/
var DidNotReturn = { dummy: 'Glk call has not yet returned' };

/* This returns a hint for whether the Glk call (by selector number)
   might block or never return. True for glk_exit() and glk_select().
*/
function call_may_not_return(id) {
    if (id == 1 || id == 192)
        return true;
    else
        return false;
}

var strtype_File = 1;
var strtype_Window = 2;
var strtype_Memory = 3;

/* Beginning of linked list of windows. */
var gli_windowlist = null;
var gli_rootwin = null;
/* Set when any window is created, destroyed, or resized. */
var geometry_changed = true; 
/* Received from GlkOte; describes the window size. */
var content_metrics = null;

/* Beginning of linked list of streams. */
var gli_streamlist = null;
/* Beginning of linked list of filerefs. */
var gli_filereflist = null;

/* The current output stream. */
var gli_currentstr = null;

/* During a glk_select() block, this is the RefStruct which will contain
   the result. */
var gli_selectref = null;

/* This is used to assigned disprock values to windows, when there is
   no GiDispa layer to provide them. */
var gli_api_display_rocks = 1;

function gli_new_window(type, rock) {
    var win = {};
    win.type = type;
    win.rock = rock;
    win.disprock = undefined;

    win.parent = null;
    win.str = gli_stream_open_window(win);
    win.echostr = null;
    win.style = Const.style_Normal;

    win.input_generation = null;
    win.linebuf = null;
    win.char_request = false;
    win.line_request = false;
    win.char_request_uni = false;
    win.line_request_uni = false;

    /* window-type-specific info is set up in glk_window_open */

    win.prev = null;
    win.next = gli_windowlist;
    gli_windowlist = win;
    if (win.next)
        win.next.prev = win;

    if (window.GiDispa)
        GiDispa.class_register('window', win);
    else
        win.disprock = gli_api_display_rocks++;
    /* We need to assign a disprock even if there's no GiDispa layer,
       because GlkOte differentiates windows by their disprock. */
    geometry_changed = true;

    return win;
}

function gli_delete_window(win) {
    var prev, next;

    if (window.GiDispa)
        GiDispa.class_unregister('window', win);
    geometry_changed = true;
    
    win.echostr = null;
    if (win.str) {
        gli_delete_stream(win.str);
        win.str = null;
    }

    prev = win.prev;
    next = win.next;
    win.prev = null;
    win.next = null;

    if (prev)
        prev.next = next;
    else
        gli_windowlist = next;
    if (next)
        next.prev = prev;

    win.parent = null;
}

function gli_windows_unechostream(str) {
    var win;
    
    for (win=gli_windowlist; win; win=win.next) {
        if (win.echostr === str)
            win.echostr = null;
    }
}

/* Add a (Javascript) string to the given window's display. */
function gli_window_put_string(win, val) {
    var ix, ch;

    //### might be efficient to split the implementation up into
    //### gli_window_buffer_put_string(), etc, since many functions
    //### know the window type when they call this
    switch (win.type) {
    case Const.wintype_TextBuffer:
        if (win.style != win.accumstyle)
            gli_window_buffer_deaccumulate(win);
        win.accum.push(val);
        break;
    case Const.wintype_TextGrid:
        for (ix=0; ix<val.length; ix++) {
            ch = val[ix];

            /* Canonicalize the cursor position. That is, the cursor may have
               been left outside the window area; wrap it if necessary. */
            if (win.cursorx < 0)
                win.cursorx = 0;
            else if (win.cursorx >= win.gridwidth) {
                win.cursorx = 0;
                win.cursory++;
            }
            if (win.cursory < 0)
                win.cursory = 0;
            else if (win.cursory >= win.gridheight)
                break; /* outside the window */

            if (ch == "\n") {
                /* a newline just moves the cursor. */
                win.cursory++;
                win.cursorx = 0;
                continue;
            }

            lineobj = win.lines[win.cursory];
            lineobj.dirty = true;
            lineobj.chars[win.cursorx] = ch;
            lineobj.styles[win.cursorx] = win.style;

            win.cursorx++;
            /* We can leave the cursor outside the window, since it will be
               canonicalized next time a character is printed. */
        }
        break;
    }
}

/* Take the accumulation of strings (since the last style change) and
   assemble them into a buffer window update. This must be called
   after each style change; it must also be called right before 
   GlkOte.update(). (Actually we call it right before win.accum.push
   if the style has changed -- there's no need to call for *every* style
   change if no text is being pushed out in between.)
*/
function gli_window_buffer_deaccumulate(win) {
    var conta = win.content;
    var stylename = StyleNameMap[win.accumstyle];
    var text, ls, ix, obj;

    if (win.accum.length) {
        text = win.accum.join('');
        ls = text.split('\n');
        for (ix=0; ix<ls.length; ix++) {
            if (ix == 0) {
                if (ls[ix]) {
                    if (conta.length == 0) {
                        conta.push({ content: [stylename, ls[ix]], append: true });
                    }
                    else {
                        obj = conta[conta.length-1];
                        if (!obj.content) {
                            obj.content = [stylename, ls[ix]];
                        }
                        else {
                            obj = obj.content;
                            obj.push(stylename);
                            obj.push(ls[ix]);
                        }
                    }
                }
            }
            else {
                if (ls[ix])
                    conta.push({ content: [stylename, ls[ix]] });
                else
                    conta.push({ });
            }
        }
    }

    win.accum.length = 0;
    win.accumstyle = win.style;
}

function gli_window_rearrange(win, box) {
    var width, height, oldwidth, oldheight;
    var min, max, diff, splitwid, ix, cx, lineobj;
    var box1, box2, ch1, ch2;

    qlog("### window_rearrange rock="+win.rock+", box="+qobjdump(box));
    win.bbox = box;

    switch (win.type) {

    case Const.wintype_TextGrid:
        /* Compute the new grid size. */
        width = box.right - box.left;
        height = box.bottom - box.top;
        oldheight = win.gridheight;
        win.gridwidth = Math.max(0, Math.floor((width-content_metrics.gridmarginx) / content_metrics.gridcharwidth));
        win.gridheight = Math.max(0, Math.floor((height-content_metrics.gridmarginy) / content_metrics.gridcharheight));

        /* Now we have to resize the win.lines array, in two dimensions. */
        if (oldheight > win.gridheight) {
            win.lines.length = win.gridheight;
        }
        else if (oldheight < win.gridheight) {
            for (ix=oldheight; ix<win.gridheight; ix++) {
                win.lines[ix] = { chars:[], styles:[], dirty:true };
            }
        }
        for (ix=0; ix<win.gridheight; ix++) {
            lineobj = win.lines[ix];
            oldwidth = lineobj.chars.length;
            if (oldwidth > win.gridwidth) {
                lineobj.dirty = true;
                lineobj.chars.length = win.gridwidth;
                lineobj.styles.length = win.gridwidth;
            }
            else if (oldwidth < win.gridwidth) {
                lineobj.dirty = true;
                for (cx=oldwidth; cx<win.gridwidth; cx++) {
                    lineobj.chars[cx] = ' ';
                    lineobj.styles[cx] = Const.style_Normal;
                }
            }
        }
        break;

    case Const.wintype_Pair:
        if (win.pair_vertical) {
            min = win.bbox.left;
            max = win.bbox.right;
            splitwid = content_metrics.inspacingx;
        }
        else {
            min = win.bbox.top;
            max = win.bbox.bottom;
            splitwid = content_metrics.inspacingy;
        }
        diff = max - min;

        if (win.pair_division == Const.winmethod_Proportional) {
            split = Math.floor((diff * win.pair_size) / 100);
        }
        else if (win.pair_division == Const.winmethod_Fixed) {
            split = 0;
            if (win.pair_key && win.pair_key.type == Const.wintype_TextBuffer) {
                if (win.pair_vertical) 
                    split = (win.pair_size * content_metrics.buffercharheight + content_metrics.buffermarginy);
                else
                    split = (win.pair_size * content_metrics.buffercharwidth + content_metrics.buffermarginx);
            }
            if (win.pair_key && win.pair_key.type == Const.wintype_TextGrid) {
                if (win.pair_vertical) 
                    split = (win.pair_size * content_metrics.gridcharheight + content_metrics.gridmarginy);
                else
                    split = (win.pair_size * content_metrics.gridcharwidth + content_metrics.gridmarginx);
            }
            split = Math.ceil(split);
        }
        else {
            /* default behavior for unknown division method */
            split = Math.floor(diff / 2);
        }

        /* Split is now a number between 0 and diff. Convert that to a number
           between min and max; also apply upside-down-ness. */
        if (!win.pair_backward) {
            split = max-split-splitwid;
        }
        else {
            split = min+split;
        }

        /* Make sure it's really between min and max. */
        if (min >= max) {
            split = min;
        }
        else {
            split = Math.min(Math.max(split, min), max-splitwid);
        }

        win.pair_splitpos = split;
        win.pair_splitwidth = splitwid;
        if (win.pair_vertical) {
            box1 = {
                left: win.bbox.left,
                right: win.pair_splitpos,
                top: win.bbox.top,
                bottom: win.bbox.bottom,
            };
            box2 = {
                left: box1.right + win.pair_splitwidth,
                right: win.bbox.right,
                top: win.bbox.top,
                bottom: win.bbox.bottom,
            };
        }
        else {
            box1 = {
                top: win.bbox.top,
                bottom: win.pair_splitpos,
                left: win.bbox.left,
                right: win.bbox.right,
            };
            box2 = {
                top: box1.bottom + win.pair_splitwidth,
                bottom: win.bbox.bottom,
                left: win.bbox.left,
                right: win.bbox.right,
            };
        }
        if (!win.pair_backward) {
            ch1 = win.child1;
            ch2 = win.child2;
        }
        else {
            ch1 = win.child2;
            ch2 = win.child1;
        }

        gli_window_rearrange(ch1, box1);
        gli_window_rearrange(ch2, box2);
        break;

    }
}

function gli_new_stream(type, readable, writable, rock) {
    var str = {};
    str.type = type;
    str.rock = rock;
    str.disprock = undefined;

    str.unicode = false;
    str.win = null;
    str.file = null;
    str.buf = null;
    str.bufpos = 0;
    str.buflen = 0;
    str.bufeof = 0;

    str.readcount = 0;
    str.writecount = 0;
    str.readable = readable;
    str.writable = writable;

    str.prev = null;
    str.next = gli_streamlist;
    gli_streamlist = str;
    if (str.next)
        str.next.prev = str;

    if (window.GiDispa)
        GiDispa.class_register('stream', str);

    return str;
}

function gli_delete_stream(str) {
    var prev, next;
    
    if (str === gli_currentstr) {
        gli_currentstr = null;
    }

    gli_windows_unechostream(str);

    if (str.type == strtype_Memory) {
        if (window.GiDispa)
            GiDispa.unretain_array(str.buf);
    }

    if (window.GiDispa)
        GiDispa.class_unregister('stream', str);

    prev = str.prev;
    next = str.next;
    str.prev = null;
    str.next = null;

    if (prev)
        prev.next = next;
    else
        gli_streamlist = next;
    if (next)
        next.prev = prev;

    str.buf = null;
    str.readable = false;
    str.writable = false;
    str.win = null;
    str.file = null;
}

function gli_stream_open_window(win) {
    var str;
    str = gli_new_stream(strtype_Window, false, true, 0);
    str.unicode = true;
    str.win = win;
    return str;
}

/* Write one character (given as a Unicode value) to a stream.
   This is called by both the one-byte and four-byte character APIs.
*/
function gli_put_char(str, ch) {
    if (!str || !str.writable)
        throw('gli_put_char: invalid stream');

    if (!str.unicode)
        ch = ch & 0xFF;

    str.writecount += 1;
    
    switch (str.type) {
    case strtype_Memory:
        if (str.bufpos < str.buflen) {
            str.buf[str.bufpos] = ch;
            str.bufpos += 1;
            if (str.bufpos > str.bufeof)
                str.bufeof = str.bufpos;
        }
        break;
    case strtype_Window:
        if (str.win.line_request)
            throw('gli_put_char: window has pending line request');
        gli_window_put_string(str.win, CharToString(ch));
        if (str.win.echostr)
            gli_put_char(str.win.echostr, ch);
        break;
    case strtype_File:
        throw('gli_put_char: file streams not supported');
    }
}

/* Write characters (given as an array of Unicode values) to a stream.
   This is called by both the one-byte and four-byte character APIs.
   The "allbytes" argument is a hint that all the array values are
   already in the range 0-255.
*/
function gli_put_array(str, arr, allbytes) {
    var ix, len, val;

    if (!str || !str.writable)
        throw('gli_put_array: invalid stream');

    if (!str.unicode && !allbytes) {
        arr = TrimArrayToBytes(arr);
        allbytes = true;
    }

    str.writecount += arr.length;
    
    switch (str.type) {
    case strtype_Memory:
        len = arr.length;
        if (len > str.buflen-str.bufpos)
            len = str.buflen-str.bufpos;
        for (ix=0; ix<len; ix++)
            str.buf[str.bufpos+ix] = arr[ix];
        str.bufpos += len;
        if (str.bufpos > str.bufeof)
            str.bufeof = str.bufpos;
        break;
    case strtype_Window:
        if (str.win.line_request)
            throw('gli_put_array: window has pending line request');
        if (allbytes)
            val = String.fromCharCode.apply(this, arr);
        else
            val = UniArrayToString(arr);
        gli_window_put_string(str.win, val);
        if (str.win.echostr)
            gli_put_array(str.win.echostr, arr, allbytes);
        break;
    case strtype_File:
        throw('gli_put_array: file streams not supported');
    }
}

function gli_stream_fill_result(str, result) {
    if (!result)
        return;
    result.set_field(0, str.readcount);
    result.set_field(1, str.writecount);
}

function glk_put_jstring(val) {
    glk_put_jstring_stream(gli_currentstr, val);
}

function glk_put_jstring_stream(str, val) {
    var ix, len;

    if (!str || !str.writable)
        throw('gli_put_jstring: invalid stream');

    str.writecount += val.length;
    
    switch (str.type) {
    case strtype_Memory:
        len = val.length;
        if (len > str.buflen-str.bufpos)
            len = str.buflen-str.bufpos;
        if (str.unicode) {
            for (ix=0; ix<len; ix++)
                str.buf[str.bufpos+ix] = val.charCodeAt(ix);
        }
        else {
            for (ix=0; ix<len; ix++)
                str.buf[str.bufpos+ix] = val.charCodeAt(ix) & 0xFF;
        }
        str.bufpos += len;
        if (str.bufpos > str.bufeof)
            str.bufeof = str.bufpos;
        break;
    case strtype_Window:
        if (str.win.line_request)
            throw('gli_put_jstring: window has pending line request');
        gli_window_put_string(str.win, val);
        if (str.win.echostr)
            glk_put_jstring_stream(str.win.echostr, val);
        break;
    case strtype_File:
        throw('gli_put_jstring: file streams not supported');
    }
}

function gli_set_style(str, val) {
    if (!str || !str.writable)
        throw('gli_set_style: invalid stream');

    if (val >= Const.style_NUMSTYLES)
        val = 0;

    if (str.type == strtype_Window) {
        str.win.style = val;
        if (str.win.echostr)
            gli_set_style(str.win.echostr, val);
    }
}

/* The catalog of Glk API functions. */

function glk_exit() {
    //### set a library-exited flag?
    gli_selectref = null;
    return DidNotReturn;
}

function glk_tick() {
    /* Do nothing. */
}

function glk_gestalt(a1, a2) { /*###*/ }
function glk_gestalt_ext(a1, a2, a3) { /*###*/ }

function glk_window_iterate(win, rockref) {
    if (!win)
        win = gli_windowlist;
    else
        win = win.next;

    if (win) {
        if (rockref)
            rockref.set_value(win.rock);
        return win;
    }

    if (rockref)
        rockref.set_value(0);
    return null;
}

function glk_window_get_rock(win) {
    if (!win)
        throw('glk_window_get_rock: invalid window');
    return win.rock;
}

function glk_window_get_root() {
    return gli_rootwin;
}

function glk_window_open(splitwin, method, size, wintype, rock) {
    var oldparent, box, val;
    var pairwin, newwin;

    if (!gli_rootwin) {
        if (splitwin)
            throw('glk_window_open: splitwin must be null for first window');

        oldparent = null;
        box = {
            left: content_metrics.outspacingx,
            top: content_metrics.outspacingy,
            right: content_metrics.width-content_metrics.outspacingx,
            bottom: content_metrics.height-content_metrics.outspacingy,
        };
    }
    else {
        if (!splitwin)
            throw('glk_window_open: splitwin must not be null');

        val = (method & Const.winmethod_DivisionMask);
        if (val != Const.winmethod_Fixed && val != Const.winmethod_Proportional)
            throw('glk_window_open: invalid method (not fixed or proportional)');

        val = (method & Const.winmethod_DirMask);
        if (val != Const.winmethod_Above && val != Const.winmethod_Below 
            && val != Const.winmethod_Left && val != Const.winmethod_Right) 
            throw('glk_window_open: invalid method (bad direction)');
        
        box = splitwin.bbox;

        oldparent = splitwin.parent;
        if (oldparent && oldparent.type != Const.wintype_Pair) 
            throw('glk_window_open: parent window is not Pair');
    }

    newwin = gli_new_window(wintype, rock);

    switch (newwin.type) {
    case Const.wintype_TextBuffer:
        /* accum is a list of strings of a given style; newly-printed text
           is pushed onto the list. accumstyle is the style of that text.
           Anything printed in a different style triggers a call to
           gli_window_buffer_deaccumulate, which cleans out accum and
           adds the results to the content array. The content is in
           GlkOte format.
        */
        newwin.accum = [];
        newwin.accumstyle = null;
        newwin.content = [];
        break;
    case Const.wintype_TextGrid:
        /* lines is a list of line objects. A line looks like
           { chars: [...], styles: [...], dirty: bool }.
        */
        newwin.gridwidth = 0;
        newwin.gridheight = 0;
        newwin.lines = [];
        newwin.cursorx = 0;
        newwin.cursory = 0;
        break;
    case Const.wintype_Blank:
        break;
    case Const.wintype_Pair:
        throw('glk_window_open: cannot open pair window directly')
    default:
        /* Silently return null */
        gli_delete_window(newwin);
        return null;
    }

    if (!splitwin) {
        gli_rootwin = newwin;
        gli_window_rearrange(newwin, box);
    }
    else {
        /* create pairwin, with newwin as the key */
        pairwin = gli_new_window(Const.wintype_Pair, 0);
        pairwin.pair_dir = method & Const.winmethod_DirMask;
        pairwin.pair_division = method & Const.winmethod_DivisionMask;
        pairwin.pair_key = newwin;
        pairwin.pair_keydamage = false;
        pairwin.pair_size = size;
        pairwin.pair_vertical = (pairwin.pair_dir == Const.winmethod_Left || pairwin.pair_dir == Const.winmethod_Right);
        pairwin.pair_backward = (pairwin.pair_dir == Const.winmethod_Left || pairwin.pair_dir == Const.winmethod_Above);

        pairwin.child1 = splitwin;
        pairwin.child2 = newwin;
        splitwin.parent = pairwin;
        newwin.parent = pairwin;
        pairwin.parent = oldparent;

        if (oldparent) {
            if (oldparent.child1 == splitwin)
                oldparent.child1 = pairwin;
            else
                oldparent.child2 = pairwin;
        }
        else {
            gli_rootwin = pairwin;
        }

        gli_window_rearrange(pairwin, box);
    }

    return newwin;
}

function glk_window_close(a1, a2) { /*###*/ }
function glk_window_get_size(a1, a2, a3) { /*###*/ }
function glk_window_set_arrangement(a1, a2, a3, a4) { /*###*/ }
function glk_window_get_arrangement(a1, a2, a3, a4) { /*###*/ }

function glk_window_get_type(win) {
    if (!win)
        throw('glk_window_get_type: invalid window');
    return win.type;
}

function glk_window_get_parent(win) {
    if (!win)
        throw('glk_window_get_parent: invalid window');
    return win.parent;
}

function glk_window_clear(a1) { /*###*/ }

function glk_window_move_cursor(win, xpos, ypos) {
    if (!win)
        throw('glk_window_move_cursor: invalid window');
    
    if (win.type == Const.wintype_TextGrid) {
        /* No bounds-checking; we canonicalize when we print. */
        win.cursorx = xpos;
        win.cursory = ypos;
    }
    else {
        throw('glk_window_move_cursor: not a grid window');
    }
}

function glk_window_get_stream(a1) { /*###*/ }
function glk_window_set_echo_stream(a1, a2) { /*###*/ }
function glk_window_get_echo_stream(a1) { /*###*/ }

function glk_set_window(win) {
    if (!win)
        gli_currentstr = null;
    else
        gli_currentstr = win.str;
}

function glk_window_get_sibling(a1) { /*###*/ }

function glk_stream_iterate(str, rockref) {
    if (!str)
        str = gli_streamlist;
    else
        str = str.next;

    if (str) {
        if (rockref)
            rockref.set_value(str.rock);
        return str;
    }

    if (rockref)
        rockref.set_value(0);
    return null;
}

function glk_stream_get_rock(str) {
    if (!str)
        throw('glk_stream_get_rock: invalid stream');
    return str.rock;
}

function glk_stream_open_file(fref, fmode, rock) {
    throw('glk_stream_open_file: file streams not supported');
}

function glk_stream_open_memory(buf, fmode, rock) {
    var str;

    if (fmode != Const.filemode_Read 
        && fmode != Const.filemode_Write 
        && fmode != Const.filemode_ReadWrite) 
        throw('glk_stream_open_memory: illegal filemode');

    str = gli_new_stream(strtype_Memory, 
        (fmode != Const.filemode_Write), 
        (fmode != Const.filemode_Read), 
        rock);
    str.unicode = false;

    if (buf) {
        str.buf = buf;
        str.buflen = buf.length;
        str.bufpos = 0;
        if (fmode == Const.filemode_Write)
            str.bufeof = 0;
        else
            str.bufeof = str.buflen;
        if (window.GiDispa)
            GiDispa.retain_array(buf);
    }

    return str;
}

function glk_stream_close(str, result) {
    if (!str)
        throw('glk_stream_close: invalid stream');

    if (str.type == strtype_Window)
        throw('glk_stream_close: cannot close window stream');

    gli_stream_fill_result(str, result);
    gli_delete_stream(str);
}

function glk_stream_set_position(a1, a2, a3) { /*###*/ }
function glk_stream_get_position(a1) { /*###*/ }

function glk_stream_set_current(str) {
    gli_currentstr = str;
}

function glk_stream_get_current() {
    return gli_currentstr;
}

function glk_fileref_create_temp(a1, a2) { /*###*/ }
function glk_fileref_create_by_name(a1, a2, a3) { /*###*/ }
function glk_fileref_create_by_prompt(a1, a2, a3) { /*###*/ }
function glk_fileref_destroy(a1) { /*###*/ }
function glk_fileref_iterate(a1, a2) { /*###*/ }
function glk_fileref_get_rock(a1) { /*###*/ }
function glk_fileref_delete_file(a1) { /*###*/ }
function glk_fileref_does_file_exist(a1) { /*###*/ }
function glk_fileref_create_from_fileref(a1, a2, a3) { /*###*/ }

function glk_put_char(ch) {
    gli_put_char(gli_currentstr, ch & 0xFF);
}

function glk_put_char_stream(str, ch) {
    gli_put_char(str, ch & 0xFF);
}

function glk_put_string(arr) {
    arr = TrimArrayToBytes(arr);
    gli_put_array(gli_currentstr, arr, true);
}

function glk_put_string_stream(str, arr) {
    arr = TrimArrayToBytes(arr);
    gli_put_array(str, arr, true);
}

// function glk_put_buffer(arr) { }
glk_put_buffer = glk_put_string;
// function glk_put_buffer_stream(str, arr) { }
glk_put_buffer_stream = glk_put_string_stream;

function glk_set_style(val) {
    gli_set_style(gli_currentstr, val);
}

function glk_set_style_stream(str, val) {
    gli_set_style(str, val);
}

function glk_get_char_stream(a1) { /*###*/ }
function glk_get_line_stream(a1, a2) { /*###*/ }
function glk_get_buffer_stream(a1, a2) { /*###*/ }

function glk_char_to_lower(val) {
    if (val >= 0x41 && val <= 0x5A)
        return val + 0x20;
    if (val >= 0xC0 && val <= 0xDE && val != 0xD7)
        return val + 0x20;
    return val;
}

function glk_char_to_upper(val) {
    if (val >= 0x61 && val <= 0x7A)
        return val - 0x20;
    if (val >= 0xE0 && val <= 0xFE && val != 0xF7)
        return val - 0x20;
    return val;
}

function glk_stylehint_set(a1, a2, a3, a4) { /*###*/ }
function glk_stylehint_clear(a1, a2, a3) { /*###*/ }
function glk_style_distinguish(a1, a2, a3) { /*###*/ }
function glk_style_measure(a1, a2, a3, a4) { /*###*/ }

function glk_select(ref) {
    gli_selectref = ref;
    return DidNotReturn;
}

function glk_select_poll(a1) { /*###*/ }

function glk_request_line_event(win, buf, initlen) {
    if (!win)
        throw('glk_request_line_event: invalid window');
    if (win.char_request || win.line_request)
        throw('glk_request_line_event: window already has keyboard request');

    if (win.type == Const.wintype_TextBuffer 
        || win.type == Const.wintype_TextGrid) {
        win.line_request = true;
        win.line_request_uni = false;
        win.input_generation = event_generation;
        win.linebuf = buf;
        //### grab initlen chars, stash in input of update object
        if (window.GiDispa)
            GiDispa.retain_array(buf);
    }
    else {
        throw('glk_request_line_event: window does not support keyboard input');
    }
}

function glk_cancel_line_event(a1, a2) { /*###*/ }

function glk_request_char_event(win) {
    if (!win)
        throw('glk_request_char_event: invalid window');
    if (win.char_request || win.line_request)
        throw('glk_request_char_event: window already has keyboard request');

    if (win.type == Const.wintype_TextBuffer 
        || win.type == Const.wintype_TextGrid) {
        win.char_request = true;
        win.char_request_uni = false;
    }
    else {
        throw('glk_request_char_event: window does not support keyboard input');
    }
}

function glk_cancel_char_event(a1) { /*###*/ }
function glk_request_mouse_event(a1) { /*###*/ }
function glk_cancel_mouse_event(a1) { /*###*/ }
function glk_request_timer_events(a1) { /*###*/ }
function glk_image_get_info(a1, a2, a3) { /*###*/ }
function glk_image_draw(a1, a2, a3, a4) { /*###*/ }
function glk_image_draw_scaled(a1, a2, a3, a4, a5, a6) { /*###*/ }
function glk_window_flow_break(a1) { /*###*/ }
function glk_window_erase_rect(a1, a2, a3, a4, a5) { /*###*/ }
function glk_window_fill_rect(a1, a2, a3, a4, a5, a6) { /*###*/ }
function glk_window_set_background_color(a1, a2) { /*###*/ }
function glk_schannel_iterate(a1, a2) { /*###*/ }
function glk_schannel_get_rock(a1) { /*###*/ }
function glk_schannel_create(a1) { /*###*/ }
function glk_schannel_destroy(a1) { /*###*/ }
function glk_schannel_play(a1, a2) { /*###*/ }
function glk_schannel_play_ext(a1, a2, a3, a4) { /*###*/ }
function glk_schannel_stop(a1) { /*###*/ }
function glk_schannel_set_volume(a1, a2) { /*###*/ }
function glk_sound_load_hint(a1, a2) { /*###*/ }
function glk_set_hyperlink(a1) { /*###*/ }
function glk_set_hyperlink_stream(a1, a2) { /*###*/ }
function glk_request_hyperlink_event(a1) { /*###*/ }
function glk_cancel_hyperlink_event(a1) { /*###*/ }
function glk_buffer_to_lower_case_uni(a1, a2) { /*###*/ }
function glk_buffer_to_upper_case_uni(a1, a2) { /*###*/ }
function glk_buffer_to_title_case_uni(a1, a2, a3) { /*###*/ }

function glk_put_char_uni(ch) {
    gli_put_char(gli_currentstr, ch);
}

function glk_put_string_uni(arr) {
    gli_put_array(gli_currentstr, arr, false);
}

// function glk_put_buffer_uni(a1) { }
glk_put_buffer_uni = glk_put_string_uni;

function glk_put_char_stream_uni(str, ch) {
    gli_put_char(str, ch);
}

function glk_put_string_stream_uni(str, arr) {
    gli_put_array(str, arr, false);
}

// function glk_put_buffer_stream_uni(str, arr) { }
glk_put_buffer_stream_uni = glk_put_string_stream_uni;

function glk_get_char_stream_uni(a1) { /*###*/ }
function glk_get_buffer_stream_uni(a1, a2) { /*###*/ }
function glk_get_line_stream_uni(a1, a2) { /*###*/ }

function glk_stream_open_file_uni(fref, fmode, rock) {
    throw('glk_stream_open_file_uni: file streams not supported');
}

function glk_stream_open_memory_uni(buf, fmode, rock) {
    var str;

    if (fmode != Const.filemode_Read 
        && fmode != Const.filemode_Write 
        && fmode != Const.filemode_ReadWrite) 
        throw('glk_stream_open_memory: illegal filemode');

    str = gli_new_stream(strtype_Memory, 
        (fmode != Const.filemode_Write), 
        (fmode != Const.filemode_Read), 
        rock);
    str.unicode = true;

    if (buf) {
        str.buf = buf;
        str.buflen = buf.length;
        str.bufpos = 0;
        if (fmode == Const.filemode_Write)
            str.bufeof = 0;
        else
            str.bufeof = str.buflen;
        if (window.GiDispa)
            GiDispa.retain_array(buf);
    }

    return str;
}

function glk_request_char_event_uni(win) {
    if (!win)
        throw('glk_request_char_event: invalid window');
    if (win.char_request || win.line_request)
        throw('glk_request_char_event: window already has keyboard request');

    if (win.type == Const.wintype_TextBuffer 
        || win.type == Const.wintype_TextGrid) {
        win.char_request = true;
        win.char_request_uni = true;
    }
    else {
        throw('glk_request_char_event: window does not support keyboard input');
    }
}

function glk_request_line_event_uni(win, buf, initlen) {
    if (!win)
        throw('glk_request_line_event: invalid window');
    if (win.char_request || win.line_request)
        throw('glk_request_line_event: window already has keyboard request');

    if (win.type == Const.wintype_TextBuffer 
        || win.type == Const.wintype_TextGrid) {
        win.line_request = true;
        win.line_request_uni = true;
        win.linebuf = buf;
        //### grab initlen chars
        if (window.GiDispa)
            GiDispa.retain_array(buf);
    }
    else {
        throw('glk_request_line_event: window does not support keyboard input');
    }
}

/* ### change to a namespace */
Glk = {
    init : init,
    update : update,
    Const : Const,
    RefBox : RefBox,
    RefStruct : RefStruct,
    DidNotReturn : DidNotReturn,
    call_may_not_return : call_may_not_return,

    glk_put_jstring : glk_put_jstring,
    glk_put_jstring_stream : glk_put_jstring_stream,

    glk_exit : glk_exit,
    glk_tick : glk_tick,
    glk_gestalt : glk_gestalt,
    glk_gestalt_ext : glk_gestalt_ext,
    glk_window_iterate : glk_window_iterate,
    glk_window_get_rock : glk_window_get_rock,
    glk_window_get_root : glk_window_get_root,
    glk_window_open : glk_window_open,
    glk_window_close : glk_window_close,
    glk_window_get_size : glk_window_get_size,
    glk_window_set_arrangement : glk_window_set_arrangement,
    glk_window_get_arrangement : glk_window_get_arrangement,
    glk_window_get_type : glk_window_get_type,
    glk_window_get_parent : glk_window_get_parent,
    glk_window_clear : glk_window_clear,
    glk_window_move_cursor : glk_window_move_cursor,
    glk_window_get_stream : glk_window_get_stream,
    glk_window_set_echo_stream : glk_window_set_echo_stream,
    glk_window_get_echo_stream : glk_window_get_echo_stream,
    glk_set_window : glk_set_window,
    glk_window_get_sibling : glk_window_get_sibling,
    glk_stream_iterate : glk_stream_iterate,
    glk_stream_get_rock : glk_stream_get_rock,
    glk_stream_open_file : glk_stream_open_file,
    glk_stream_open_memory : glk_stream_open_memory,
    glk_stream_close : glk_stream_close,
    glk_stream_set_position : glk_stream_set_position,
    glk_stream_get_position : glk_stream_get_position,
    glk_stream_set_current : glk_stream_set_current,
    glk_stream_get_current : glk_stream_get_current,
    glk_fileref_create_temp : glk_fileref_create_temp,
    glk_fileref_create_by_name : glk_fileref_create_by_name,
    glk_fileref_create_by_prompt : glk_fileref_create_by_prompt,
    glk_fileref_destroy : glk_fileref_destroy,
    glk_fileref_iterate : glk_fileref_iterate,
    glk_fileref_get_rock : glk_fileref_get_rock,
    glk_fileref_delete_file : glk_fileref_delete_file,
    glk_fileref_does_file_exist : glk_fileref_does_file_exist,
    glk_fileref_create_from_fileref : glk_fileref_create_from_fileref,
    glk_put_char : glk_put_char,
    glk_put_char_stream : glk_put_char_stream,
    glk_put_string : glk_put_string,
    glk_put_string_stream : glk_put_string_stream,
    glk_put_buffer : glk_put_buffer,
    glk_put_buffer_stream : glk_put_buffer_stream,
    glk_set_style : glk_set_style,
    glk_set_style_stream : glk_set_style_stream,
    glk_get_char_stream : glk_get_char_stream,
    glk_get_line_stream : glk_get_line_stream,
    glk_get_buffer_stream : glk_get_buffer_stream,
    glk_char_to_lower : glk_char_to_lower,
    glk_char_to_upper : glk_char_to_upper,
    glk_stylehint_set : glk_stylehint_set,
    glk_stylehint_clear : glk_stylehint_clear,
    glk_style_distinguish : glk_style_distinguish,
    glk_style_measure : glk_style_measure,
    glk_select : glk_select,
    glk_select_poll : glk_select_poll,
    glk_request_line_event : glk_request_line_event,
    glk_cancel_line_event : glk_cancel_line_event,
    glk_request_char_event : glk_request_char_event,
    glk_cancel_char_event : glk_cancel_char_event,
    glk_request_mouse_event : glk_request_mouse_event,
    glk_cancel_mouse_event : glk_cancel_mouse_event,
    glk_request_timer_events : glk_request_timer_events,
    glk_image_get_info : glk_image_get_info,
    glk_image_draw : glk_image_draw,
    glk_image_draw_scaled : glk_image_draw_scaled,
    glk_window_flow_break : glk_window_flow_break,
    glk_window_erase_rect : glk_window_erase_rect,
    glk_window_fill_rect : glk_window_fill_rect,
    glk_window_set_background_color : glk_window_set_background_color,
    glk_schannel_iterate : glk_schannel_iterate,
    glk_schannel_get_rock : glk_schannel_get_rock,
    glk_schannel_create : glk_schannel_create,
    glk_schannel_destroy : glk_schannel_destroy,
    glk_schannel_play : glk_schannel_play,
    glk_schannel_play_ext : glk_schannel_play_ext,
    glk_schannel_stop : glk_schannel_stop,
    glk_schannel_set_volume : glk_schannel_set_volume,
    glk_sound_load_hint : glk_sound_load_hint,
    glk_set_hyperlink : glk_set_hyperlink,
    glk_set_hyperlink_stream : glk_set_hyperlink_stream,
    glk_request_hyperlink_event : glk_request_hyperlink_event,
    glk_cancel_hyperlink_event : glk_cancel_hyperlink_event,
    glk_buffer_to_lower_case_uni : glk_buffer_to_lower_case_uni,
    glk_buffer_to_upper_case_uni : glk_buffer_to_upper_case_uni,
    glk_buffer_to_title_case_uni : glk_buffer_to_title_case_uni,
    glk_put_char_uni : glk_put_char_uni,
    glk_put_string_uni : glk_put_string_uni,
    glk_put_buffer_uni : glk_put_buffer_uni,
    glk_put_char_stream_uni : glk_put_char_stream_uni,
    glk_put_string_stream_uni : glk_put_string_stream_uni,
    glk_put_buffer_stream_uni : glk_put_buffer_stream_uni,
    glk_get_char_stream_uni : glk_get_char_stream_uni,
    glk_get_buffer_stream_uni : glk_get_buffer_stream_uni,
    glk_get_line_stream_uni : glk_get_line_stream_uni,
    glk_stream_open_file_uni : glk_stream_open_file_uni,
    glk_stream_open_memory_uni : glk_stream_open_memory_uni,
    glk_request_char_event_uni : glk_request_char_event_uni,
    glk_request_line_event_uni : glk_request_line_event_uni,
};

