JSx86
-----

This is an **early** and **incomplete** x86 real-mode DOS emulator aimed at running original DOS games.

JSx86 currently only runs a few very simple DOS *.com* apps.

It was written years ago when webpack and ES6 didn't exist so don't be surprised to see it's using `requirejs`, `grunt` and doesn't make use of newer APIs (like TypedArrays) or fancy package managers like `webpack`.

Requirements
------------

 - requirejs
 - grunt
 - karma

 Installation
 ------------

 Type `npm install && grunt` to install require dependencies and start the
 local webserver.

 You can then point your browser to `http://localhost:8000/index.html` to start the emulator.

Usage
-----

Since there is no complete BIOS yet, jsx86 first sets up the CPU components
and then halts execution.

Local test files can be loaded and executed using the `File to run` input.

The `dos_examples` directory contains a few sample *.com* DOS apps.

Tests
-----

Some tests have been written using Karma & Jasmine and can be started by opening the `Tests/X86/X86.html` page.

What's Implemented
------------------

JSx86 in its current shape is barely functionnal, although lots of things have already been implemented:

 - several x86 16bit opcodes, including string ops, mov, aritmetics,..
 - IOHandler that allows peripherals to register IO ports
 - basic interrupt handling
 - PIC & Timer controllers are very basic
 - Some BIOS/DOS interrupts have been simulated in JavaScript

 To Do
 -----

 Lots of things remain to be done for jsx86 to be usable and run more than test-apps:

  1. Update the toolchain with webpack and ES6 modules
  2. Use modern APIs like TypedArrays
  3. Make PIC/Timer actually do something
  4. Load and use a simple external BIOS binary to correctly set up hardware
  5. Develop simple CGA/VGA graphics emulation
