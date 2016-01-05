module.exports={
    cookieSecret:'把你的cookie秘要放在这里',
    gmail:{
        use:"your mail username",
        password:"you mail password"
    },
    mongo:{
        development:{connectionString:"mongodb://<dbuser>:<dbpassword>@ds039125.mongolab.com:39125/william_test"},
        production:{connectionString:'mongodb://<dbuser>:<dbpassword>@ds039125.mongolab.com:39125/william_test'}
    }
};