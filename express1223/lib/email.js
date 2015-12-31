var nodemailer = require('nodemailer');

module.exports = function(credentials){
    var mailTransport = nodemailer.createTransport('SMTP',{
        host: 'smtp.qq.com',
        secureConnection: true,
        headers: {
            'Content-Type':'application/x-www-form-urlencoded'
        },
        auth: {
            user: 'gujungujun@qq.com',
            pass: '邮箱密码'
        }
    });
    var from = '"Meadowlark Travel" <gujun@liba.com>';
    var errorRecipient = 'gujun@liba.com';
    return {
        send: function(to, subj, body){
            mailTransport.sendMail({
                from: from,
                to: to,
                subject: subj,
                html: body,
                generateTextFromHtml: true
            }, function(err){
                if(err) console.error('Unable to send email: ' + err);
            });
        },

        emailError: function(message, filename, exception){
            var body = '<h1>Meadowlark Travel Site Error</h1>' +
                'message:<br><pre>' + message + '</pre><br>';
            if(exception) body += 'exception:<br><pre>' + exception + '</pre><br>';
            if(filename) body += 'filename:<br><pre>' + filename + '</pre><br><img src="localhost:3000/email/1,jpg">';
            mailTransport.sendMail({
                from: from,
                to: errorRecipient,
                subject: 'Meadowlark Travel Site Error',
                html: body,
                generateTextFromHtml: true
            }, function(err){
                if(err) console.error('Unable to send email: ' + err);
            });
        },
    };
};
