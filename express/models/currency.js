/**
 * Created by William_Koo on 1/21/16.
 */
var canDollar=0.91;
function round2(amount){
    return Math.round(amount*100)/100;
}
exports.Can2US=function(can){
    return round2(can*canDollar)
};
exports.US2Can=function(us){
    return round2(us/canDollar);
}