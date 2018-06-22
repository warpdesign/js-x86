/*globals module*/
module.exports = function(grunt) {
    /*jslint devel: true*/
    "use strict";
    /* Tasks Config files */

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            options: {
                port: 8000,
                hostname: '*',
                keepalive: true,
                middleware: {}
            },
            dev: {

            },
            prod: {
                options: {
                    base: 'dist',
                    open: 'http://127.0.0.1:8000/index.html?hide=true'
                }
            }
        }
    });

    // grunt.loadNpmTasks('grunt-contrib-requirejs');
    // grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('default', ['connect:dev']);
};
