/**
 * Created by weichunhe on 2015/10/21.
 */
require('app').register.controller('appsController', function ($scope, $myhttp, $timeout) {
    $scope.files = [];
    $scope.search = null;
    $scope.pwdSegments = [];
    var Files = [];
    $myhttp.get('/spider/files', function (data) {
        Files = data;
        searchFile();
    });

    function searchFile() {
        var fileMap = {};
        Files.forEach(file => {
            var view = pickFileView(file);
            if (view) {
                fileMap[view.path] = view;
            }
        });
        var searchedFiles = [];
        for (var k in fileMap) {
            searchedFiles.push(fileMap[k]);
        }
        $scope.files = searchedFiles;
    }

    /**
     *
     * @param file
     * @returns {
     *  name: show name,
     *  path:absolute path
     * }
     */
    function pickFileView(file) {
        if (!isInPwd(file)) {
            return null;
        }
        var view = {}, depth = getPwdDepth();
        if (!$scope.search) {
            view.name = file.segments[depth];
            view.path = file.segments.slice(0, depth + 1).join('/');
        } else {
            for (var i = depth; i < file.segments.length; i++) {
                if (file.segments[i].indexOf($scope.search) !== -1) {
                    view.name = file.segments.slice(depth, i + 1).join('/');
                    view.path = file.segments.slice(0, i + 1).join('/');
                    break;
                }
            }
        }
        if (view.name) {
            if (depth === file.segments.length - 1) {
                file.name = view.name;
                view = file;
            }
            return view;
        }
        return null;
    }

    function isInPwd(file) {
        var depth = getPwdDepth();
        return compareArray($scope.pwdSegments, file.segments, depth);
    }

    /**
     * compare two arrays ,before depth should equal
     * @param a1
     * @param a2
     * @param depth
     */
    function compareArray(a1, a2, depth) {
        if (!depth) {
            depth = 0;
        }
        if (!a1 || !a2 || a1.length < depth || a2.length < depth) {
            return false;
        }
        for (var i = 0; i < depth; i++) {
            if (a1[i] !== a2[i]) {
                return false;
            }
        }
        return true;
    }

    function getPwdDepth() {
        return $scope.pwdSegments.length;
    }

    function isFile(name) {
        return !!name.size;
    }


    function changePwd(path) {
        if(!path){
            $scope.pwdSegments = [];
        }else {
            $scope.pwdSegments = path.split('/');
        }
        searchFile();
    }

    function changePwdUseSegments(index) {
        changePwd($scope.pwdSegments.slice(0, index + 1).join('/'));
    }

    $scope.changePwdUseSegments = changePwdUseSegments;
    $scope.changePwd = changePwd;
    $scope.isFile = isFile;
});