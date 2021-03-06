/**
 *
 * 作者：weich
 * 邮箱：1329555958@qq.com
 * 日期：2018/4/23
 *
 * 未经作者本人同意，不允许将此文件用作其他用途。违者必究。
 *
 * @ngdoc
 * @author          weich
 * @name            Role
 * @description
 */

var express = require('express');
var router = express.Router();
var sessions = require('../service/sessions');
var users = require('../service/users');
var path = require('path');
var hosts = require('../service/hosts');
var urls = require('../service/utils').urls;

router.get('/verifyToken', function (req, res) {
    res.end(sessions.verifyToken(req) ? 'yes' : 'no');
});

router.get('/login', function (req, res, next) {
    if (!hosts.isMaster()) {
        res.redirect(urls.resoleUri(hosts.getMaster(), 'login'));
        return;
    }
    res.sendFile(path.resolve(__dirname, '../html/login.html'));
});
router.get('/logout', function (req, res, next) {
    if (!hosts.isMaster()) {
        res.redirect(urls.resoleUri(hosts.getMaster(), 'logout'));
        return;
    }
    res.clearCookie(sessions.tokenKey);
    sessions.removeToken(req);
    res.redirect(addBaseUrl('/login'));
});

router.post('/login', function (req, res, next) {
    var error = users.verifyUser(req.body.name, req.body.pwd);
    if (!error) {
        var token = sessions.newToken();
        res.cookie(sessions.tokenKey, token, {maxAge: 1000 * 60 * 60 * 24 * 365});
        res.cookie('user', JSON.stringify({name: req.body.name}));
        sessions.getSession(token).userName = req.body.name;
        res.redirect(addBaseUrl('/'));
    } else {
        res.redirect(addBaseUrl('/login?_error=' + error));
    }
});


function addBaseUrl(relativeUrl){
    var baseUrl = hosts.getMaster();
    return urls.resoleUri(baseUrl,relativeUrl);
}

module.exports = router;