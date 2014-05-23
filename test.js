#!/usr/bin/env node

var exec = require('child_process').exec;

exec('echo "hello world"', function(error, stdout, stderr){
    console.log(stdout);
});