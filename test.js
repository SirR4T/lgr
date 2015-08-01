(function(){
	    
        

		var options  = {
			EMAIL : {
				FROM 	 	   :   'vidur.khanna@paytm.com',
				TO  		   :   'vidur.khanna@paytm.com',
				REPLYTO   	   :   'vidur.khanna@paytm.com',
				SUBJECT   	   :   'subject',
				// /HEADERS  	   :   '',
				setTimeoutTime :   '0',
				SMTPTRANSPORT  :   {
                    service    :   'Gmail',
					auth       :   {
						             	user: 'username@paytm.com',
						             	pass: 'password'
						            }
				}
			}
		};


		var text = 'hey';

		var Email = require('./index.js')(options);

		
		
		//console.log("yellow");
		//console.log(Email);
	    //Email.LGR(options)
		Email.email(text,true);
    
	       setTimeout(
	       	function(){
	       		process.exit(0);
	       	},10000
       	);


	
	
}());
