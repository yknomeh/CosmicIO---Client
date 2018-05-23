module.exports =
{
    send:function (contents,duration)
    {
        socket.emit('alert',infoAlert={message:contents,duration: duration});
    }
}