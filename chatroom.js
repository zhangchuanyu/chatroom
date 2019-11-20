/*zhangchuanyuzhang
100988193*/
		$(document).ready(function(){
		
			var userName = prompt("What's your name?")||"User";
			
			var socket = io(); //connect to the server that sent this page
			socket.on('connect', function(){
				socket.emit("intro", userName);
			});
			
			$('#inputText').keypress(function(ev){
					if(ev.which===13){
						//send message
						socket.emit("message",$(this).val());
						ev.preventDefault(); //if any
						$("#chatLog").append((new Date()).toLocaleTimeString()+", "+userName+": "+$(this).val()+"\n")
						$(this).val(""); //empty the input
					}
			});
			socket.on("privateMessage",function(data){
				
			    var tmp = JSON.parse(data);
			    var user = tmp.username;
			    var message = tmp.message;
			    
			    console.log("sender:" + user);
			    console.log ("private message received:" + message);
			    
			    message=prompt(user + "send a private message: \n" + message +"\nreply:");
			    
			    console.log("reply messages:" + message) ||" ";
			    if(message !==null && message !== "")
			    {
			      socket.emit("privateMessage",JSON.stringify({username:user,message: message}));
			    }
			});
			socket.on("message",function(data){
				$("#chatLog").append(data+"\n");
				$('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight; //scroll to the bottom
			});
			socket.on('userList', function(data){
				$("#userList").empty();
				console.log(data);
				for(var i=0;i<data.users.length;i++)
				{

					var  li=$("<li id='user"+i+"'>"+data.users[i]+"</li>");
					$("#userList").append(li);
					$("#user"+i).dblclick(function(e){
						var user = $(this).text();
						console.log ("receiver:" + user);
						
						var ctrlKey = e.ctrlKey;
						console.log("ctrlKey pressed:" + ctrlKey);
						if(ctrlKey)
						{
						  socket.emit("blockUser",JSON.stringify({username:user, message: message}));	
						}
						else
						{
						var message = prompt("message:") ||"";
						
						console.log ("private message:" + message);
						
						if(message !==null && message !== "")
						{
							socket.emit("privateMessage",JSON.stringify({username: user, message: message}));   
						}
						}
					});
				}	
			});
		});
