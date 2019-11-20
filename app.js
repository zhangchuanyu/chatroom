/*SocketIO based chat room. Extended to not echo messages
to the client that sent them.


zhangchuanyuzhang
100988193*/

var http = require('http').createServer(handler);
var io = require('socket.io')(http);
var fs = require('fs');
var mime = require('mime-types');
var url = require('url');
const ROOT = "./files";

http.listen(2406);

console.log("Chat server listening on port 2406");


function handler(req,res){
	//process the request
	console.log(req.method+" request for: "+req.url);
	
	//parse the url
	var urlObj = url.parse(req.url,true);
	var filename = ROOT+urlObj.pathname;

	fs.stat(filename,function(err, stats){
		if(err){   //try and open the file and handle the error, handle the error
			respondErr(err);
		}else{
			if(stats.isDirectory())	filename+="/index.html";
			
			fs.readFile(filename,"utf8",function(err, data){
				if(err)respondErr(err);
				else respond(200,data);
			});
		}
	});			

	//locally defined helper function
	//serves 404 files 
	function serve404(){
		fs.readFile(ROOT+"/404.html","utf8",function(err,data){ //async
			if(err)respond(500,err.message);
			else respond(404,data);
		});
	}	
	function respondErr(err){
		console.log("Handling error: ",err);
		if(err.code==="ENOENT"){
			serve404();
		}else{
			respond(500,err.message);
		}
	}
		
	//locally defined helper function
	//sends off the response message
	function respond(code, data){
		// content header
		res.writeHead(code, {'content-type': mime.lookup(filename)|| 'text/html'});
		// write message and signal communication is complete
		res.end(data);
	}	
};
var clients=[];
io.on("connection", function(socket){
	console.log("Got a connection");
	var username;
	
	socket.on("intro",function(data){
		socket.username = data;
		socket.bList = [];
		clients.push(socket);
		socket.broadcast.emit("message", timestamp()+": "+socket.username+" has entered the chatroom.");
		socket.emit("message","Welcome, "+socket.username+".");
		io.emit("userList",{users:getUserList()});
	});
		
	socket.on("message", function(data){
		console.log("got message: "+data);
		socket.broadcast.emit("message",timestamp()+", "+socket.username+": "+data);
		
	});
	socket.on("blockUser", function(data){
		console.log("blockuser:" + data);
		var tmp = JSON.parse(data);
		var username = tmp.username;
		console.log("call dao");
		var index = socket. bList.indexOf(username);
		
		if(index >=0)
		{
			socket.bList = socket.bList.filter(function(ele){  
			       return ele!==username;
			});
			console.log("user:" + socket.username + ":is going to unblock another user:"+ username);
			socket.emit("message", timestamp() + ": you unblock the user:" + username);
		}
		else
		{
			socket.bList.push(username);
			console.log ("user: " + socket.username + "is to block user:" + username);
			socket.emit ("message", timestamp()+ ":you block the user:" + username);
		}
	});
	/*
	socket.on("userList", function(){
		console.log("sending userList");
		io.emit("userList",{uesrs:getUserList()});
		
	});*/
    socket.on("privateMessage",function(data){
    	console.log("privateMessage"+data);
    	var tmp = JSON.parse(data);
    	
    	var username = tmp.username;
    	var message = tmp.message;
    	
    	console.log ("username:" + username);
    	console.log("message:"+ message);
    	
    	var recSocket = null;
        for (var i =0; i <clients.length; i ++)
        {
           if(clients[i].username === username)
           {
        	 recSocket = clients[i];   
           }
        }
        if(recSocket===null)
        {
          console.log ("could not find the socket for the receiver" + username);
          return;
        }
        for(var i =0;i<recSocket.bList.length; i++)
        {
         if(recSocket.bList[i] ===socket.username)
         {
            console.log("reveiver has blocked sender:"); 
            return;
         }

        }
        
        recSocket.emit("privateMessage",JSON.stringify({username:socket.username, message:message}));

        
    });
	socket.on("disconnect", function(){
		console.log(socket.username+" disconnected");
		io.emit("message", timestamp()+": "+socket.username+" disconnected.");
		clients = clients.filter(function(ele){  
			return ele!==socket;
		});
		//io.emit("userList",{uesrs:getUserList()});
	});
	
});

function timestamp(){
	return new Date().toLocaleTimeString();
}
function getUserList(){
    var ret = [];
    for(var i=0;i<clients.length;i++){
        ret.push(clients[i].username);
    }
    return ret;
}