/** * Created by William_Koo on 1/22/16.*/
var color='blue';

/*非闭包
function asyncFunction(callback){
    setInterval(callback,1000)
}
*/

//闭包
(function(color) {
    asyncFunction(function () {
        console.log('The color is ' + color)
    });
})(color);

color='green';