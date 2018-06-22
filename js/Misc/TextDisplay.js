/*
A DOS-like output TextDisplay for JavaScript.
http://www.codeproject.com/script/Articles/MemberArticles.aspx?amid=3290305

Example usage:
var TextDisplay = new TextDisplay('myTextDisplayDivId', 20, 40);
TextDisplay.println('A TextDisplay window with 20 rows and 40 characters.');
TextDisplay.setCursorPosition(6,6);
TextDisplay.print('Printing in row 6, column 6');

To get user-input, include the URL of PromptWindow.htm in the constructor:
var TextDisplay = new TextDisplay('myTextDisplayDivId', 20, 40);
var yourName = TextDisplay.input('What is your name? ');
TextDisplay.println('Hello, ' + yourName);

*/


define(function() {
    /// <summary>Creates a new TextDisplay in the HTML element with given ID, with the specified rows and columns, and optionally the URL to the PromptWindow if the input() function is used.</summary>
    var TextDisplay = function(elementId, rows, columns, promptWindowUrl)
    {
        // Get a reference to the HTML element which will hold the TextDisplay.
        this.element = document.getElementById(elementId);
        
        if (!this.element)
        {
            alert('No element with the ID ' + elementId + ' was found.');
            return;
        }
        // remove any child nodes of the element
        while (this.element.hasChildNodes())
            this.element.removeChild(this.element.childNodes[0]);
    
        // make sure it acts like a 'pre'
        this.element.style.whiteSpace = 'pre';
        
        this.rows = Math.floor(rows);
        this.columns = Math.floor(columns);
        this.cursorPosition = { row: 0, column: 0 };
        this.charGrid = new Array(this.rows);
        this.promptWindowUrl = promptWindowUrl;
        
        this.bgColor = '#000';
        this.color = '#fff';
        
        // add the TextNode objects
        for (var i = 0; i < rows; i++)
        {
            var textNode = document.createTextNode('');
            this.charGrid[i] = textNode;
            this.element.appendChild(textNode);
            
            // add a line break between each TextNode
            if (i < rows - 1)
                this.element.appendChild(document.createElement('br'));
        }
        
        // clear the TextDisplay screen
        this.cls();
    }
    
    /// <summary>Clears all the characters from the TextDisplay and sets the cursor to 0,0.</summary>
    TextDisplay.prototype.cls = function()
    {
        // go through each row
        for (var row = 0; row < this.rows; row++)
        {	
            // get the text node, make a string with 'col' spaces, and set this row as the string
            var textNode = this.charGrid[row];
            var s = '';
            for (var col = 0; col < this.columns; col++)
                s += ' ';
    
            textNode.data = s;
        }
        // move cursor to 0,0
        this.setCursorPos(0, 0);
    };
    
    /// <summary>Private function - not intended to be used by outside programs. Prints a string at the given row and column, and optionally wraps the text if needed.</summary>
    TextDisplay.prototype.printAt = function(row, column, str, cycle)
    {
        str = str.toString();
    
        // nothing to print
        if (row >= this.rows || row < 0 || column < 0 || !str.length)
            return;
        
        // get the text in the target row
        var oldRow = this.charGrid[row].data;
        
        // tentatively put the new text for the row in newRow. This is probably too long or too short
        var newRow = oldRow.substring(0, column) + str;
        
        if (newRow.length < this.columns)
        {
            // the text was too short, so get the remaining characters from the old string.
            // E.g.: oldRow = "0123456789", printing "hi" over '4' so newRow = "0123hi", then appending "6789" to get "0123hi6789"
            newRow += oldRow.substring(column + str.length);
            // move the cursor to the character after the new string, e.g. just after "hi".
            this.setCursorPos(row, column + str.length);
        }
        else
        {
            // need to wrap to the next row.
            this.setCursorPos(row + 1, 0);
            
            if (cycle && this.cursorPosition.row >= this.rows)
            {
                // moved passed the bottom of the TextDisplay.  Need to delete the first line, and move each line up by one.
                for (var rowIndex = 0; rowIndex < this.rows - 1; rowIndex++)
                    this.charGrid[rowIndex].data = this.charGrid[rowIndex+1].data;
    
                // After moving up, there needs to be a new row at the bottom. Set to empty string.
                var emptyRow = '';
                for (var col = 0; col < this.columns; col++)
                    emptyRow += ' ';
    
                this.charGrid[this.rows-1].data = emptyRow;
                // Cycled the lines up, so the current row should cycle by one as well
                this.cursorPosition.row--;
                row--;
            }
        }
        
        // truncate the text if it is too long
        if (newRow.length > this.columns) {
            newRow = newRow.substring(0, this.columns);
        }
        // set the text to the current row.
        this.charGrid[row].data = newRow;
    };
    
    TextDisplay.prototype.setBgColor = function(str)
    {
        this.bgColor = str;
    };
    
    TextDisplay.prototype.setColor = function(str)
    {
        this.color = str;
    };
    
    /// <summary>Prints the given string at the current cursor position, wrapping text where necessary.</summary>
    TextDisplay.prototype.print = function(str)
    {
    
        // get new location of cursor after text added
        var newColumnPos = this.cursorPosition.column + str.length;
        
        if (newColumnPos > this.columns) {
            // text is too long to fit on one line.  Add as much as possible, then recursively call print with the remainder of the string
            
            var charsLeftOnCurLine = this.columns - this.cursorPosition.column;
            var s = str.substring(0, charsLeftOnCurLine);
            
            // print the first part
            this.print(s);
            
            // print rest of string
            this.print(str.substring(charsLeftOnCurLine));
            
        }
        else
        {
            // print the string at the current cursor position
            this.printAt(this.cursorPosition.row, this.cursorPosition.column, str, true);
        }
    
    };
    
    /// <summary>Prints the given string at the current cursor position, wrapping text where necessary, and appends a line break.</summary>
    TextDisplay.prototype.println = function(str)
    {
        if (!str)
        {
            str = '';
        }
        
        // Actually, we don't add line-breaks. We simply pad out the line with spaces to that the cursor will be forced to the next line.
        var extraSpaces = this.columns - ((this.cursorPosition.column + str.length) % this.columns);
        var s2 = str;
        for (var i = 0; i < extraSpaces; i++)
            s2 += ' ';
    
        this.print(s2);
    };
    
    /// <summary>Sets the cursor position to the given row and column.</summary>
    TextDisplay.prototype.setCursorPos = function(row, column)
    {
        this.cursorPosition.row = row;
        this.cursorPosition.column = column;
    };
    
    // we use TextDisplay for both the debug stuff and real PC 80x25 display, fix me !
    //$(function() {
    //	window.textOutput = new TextDisplay('console', 25, 80);
    //});
    
    return TextDisplay;
});