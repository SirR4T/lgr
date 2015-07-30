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


    this.mailPayLoad = '';

    
    


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
LGR.prototype.email = function(data,cb){

    // appending data to payload
    this.mailPayLoad += data;

    //setting time out for shooting mail
    setTimeout(function(cb){
     sendMAIL(cb);
     this.mailPayLoad = '';
    }, opts.EMAIL.setTimeoutTime);

};

/*
    Send an eMail
*/
LGR.prototype.sendMAIL = function(cb){
        //creating smtp transport
        function tranporterFunction() {
            return NODEMAILER.createTransport('SMTP', opts.EMAIL.SMTPTRANSPORT);
        }
        
        //email specifics to be sent
        function mailSpecificsFunction(data) {
                return {
                    from        : opts.EMAIL.FROM,
                    to          : opts.EMAIL.TO,
                    replyTo     : opts.EMAIL.REPLYTO,
                    subject     : opts.EMAIL.SUBJECT + " : " + new Date(),
                    headers     : opts.EMAIL.HEADERS,
                    text        : this.mailPayLoad            
                  };
        }

        /*
            validating the opts(config)
        */
        //config not valid .... return the callback function

        if(!(opts && opts.EMAIL && opts.EMAIL.SMTPTRANSPORT && opts.EMAIL.TO))
            if(cb && typeof(cb) == 'function')  return cb("Incorrect config");
            else                                return;

        var
                tranporter      = tranporterFunction(),
                mailSpecifics   = mailSpecificsFunction(data);

        //sending the electronic mail with specified config
        return tranporter.sendMail(mailSpecifics, function(err, res) {
                console.log('Email Sent to : '  + JSON.stringify(opts.EMAIL.SMTPTRANSPORT)    +
                        '\nMail Subject '       + mail.subject                                  +
                        '\nError: '             + err                                           +
                        '\nResponse: '          + JSON.stringify(res));

                //return the callback function
                if(cb && typeof(cb) == 'function')  return cb(err, res);
                else                                return;
        });        

}



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

module.exports = new LGR();




       