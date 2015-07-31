/*jshint multistr: true ,node: true*/
"use strict";

var

    UTIL                = require('util'),

    /* NPM Third Party */
    _                   = require('lodash'),
    NPMLOG              = require('npmlog'),
    MOMENT              = require('moment'),
    NODEMAILER          = require('nodemailer');
    
    /* NPM Paytm */
    
    /* Project Files */

function LGR(opts) {
    this.NPMLOG = NPMLOG;

    this.opts = opts;

    /*
        maintain internal count
    */
    this.count = 0;

    /*
        Log format
        "ram" , "ts" "uptime" "pid"

    */
    this.setLogFormat('<%= ts %> [<%= uptime %>] [<%= count %>] ');

    /*
        npmlog emits log and log.<lvl> event after that
        Hence we put a hook in both the events and change the stream before the log is written
        Since events are sync, this sohuld not be a problem

    */
    NPMLOG.on('log', function(obj){
        this.count++;
        NPMLOG.stream = process.stdout;
    }.bind(this));

    NPMLOG.on('log.error', function(obj){
        NPMLOG.stream = process.stderr;
        /* STDOUT will not get a copy of this erro rmessage */
    }.bind(this));


    /*
        Lets instantiate this variable with empty string.
        We will keep on adding to this string so that we can send a mail
    */
    this.mailPayLoad = '';

   /*
        a basic SMTP Transport structure, if donot get it in 
        opts.EMAIL.SMTPTRANSPORT
   */
    this.SMTPTRANSPORT  =   {
                    service    :   'Gmail',
                    auth       :   {
                                        user: 'vidur.khanna@paytm.com',
                                        pass: 'Jaltarang#1'
                                    }
                };


    /* lets see if mail config is there */
    if(_.get(this, 'opts.EMAIL', 1)) {

       //console.log("options are :: " + this.opts.EMAIL.SUBJECT);

        this._email = {
            'transport'         : NODEMAILER.createTransport('SMTP', _.get(this,'opts.EMAIL.SMTPTRANSPORT',this.SMTPTRANSPORT)),
            'specifications'    : {
                from        : _.get(opts,'EMAIL.FROM',   'Vidur Khanna<vidur.khanna@paytm.com>'),
                to          : _.get(opts,'EMAIL.TO',     'Vidur Khanna<vidur.khanna@paytm.com>'),
                replyTo     : _.get(opts,'EMAIL.REPLYTO','Vidur Khanna<vidur.khanna@paytm.com>'),
                subject     : _.get(opts,'EMAIL.SUBJECT', new Date()) + ' :: ' + new Date(),
                //headers     : _.get(opts,'EMAIL.HEADERS', ''),
                text        : ''            
            },
        };


        /*
            Start a setInterval process which will send emails periodically
        */
        setInterval(function(){
            // check if something to send
            if( this.mailPayLoad.length > 0) {
                this._sendMails();
            }
        }.bind(this), _.get(opts, 'EMAIL.setTimeoutTime', 10000));
    } // if email

}

// Override ALL LEVELS ... to have timestamp
Object.keys(NPMLOG.levels).forEach(function(k){
    LGR.prototype[k] = function(){
        arguments[0] = this._p() + arguments[0];
        return this.NPMLOG[k].apply(this, arguments);
    };
});

LGR.prototype.log = function(){
    arguments[0] = this._p() + arguments[0];
    return this.NPMLOG['info'].apply(this, arguments);
};

/*
    setting data
*/
LGR.prototype.email = function(data, sendImmediately){
    if(sendImmediately === undefined) sendImmediately = false;

    this.mailPayLoad += this._p() + data + '\n';

    if(sendImmediately === true) this._sendMails();
};


/*
    Send eMails periodically
*/
LGR.prototype._sendMails = function() {

    //sending the electronic mail with specified config
    this._email.specifications.text = _.cloneDeep(this.mailPayLoad);
    this.mailPayLoad = '';
    this._email.transport.sendMail(this._email.specifications,function(err, res) {});        

};


/* Sets log format for a user */
LGR.prototype.setLogFormat = function(val){
    this.logFormat =  _.template(val);
};

/* returns log prefix */
LGR.prototype._p = function(){
    return this.logFormat({
        "ram"       :  JSON.stringify(process.memoryUsage()),
        "ts"        :  MOMENT().format("YYYY-MM-DD HH:MM:ss"),
        "uptime"    : process.uptime(),
        "pid"       : process.pid,
        "count"     : this.count,
    });
};

LGR.prototype.setLevel = function(level){
    this.level = level;
    this.NPMLOG.level = level;
};

/*module.exports = new LGR();  */

module.exports = function(argumen){

    var x = new LGR(argumen);
    return x;
};