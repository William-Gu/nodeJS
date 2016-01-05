var load=require('loadtest');
var expect=require('chai').expect;
suite('Stress tests',function(){
    test('HomePage should handle 100 requests in a second',function(done){
        var options={
            url:'http://localhost:3000',
            concurrency:4,
            maxRequests:100
        };

        loadtest.loadTest(options,function(err,result){
            expect(!err);
            expect(result.totalsecond<1);
            done();
        });
    });
});