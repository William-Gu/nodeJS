/**
 * Created by William_Koo on 1/12/16.
 */
module.exports = function (req, res) {
    res.send('The views directory is ' + req.app.get('views'));
};