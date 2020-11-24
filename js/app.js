'use strict';
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('shhlist', ['ionic', 'firebase', 'ionic.utils', 'vkEmojiPicker']);

var firebaseConfig = {
    apiKey: 'AIzaSyCrP7LK-Di5YeAA0QBr7Av93TS6DAl1Nn4',
    authDomain: 'shhlist.firebaseapp.com',
    databaseURL: 'https://shhlist.firebaseio.com',
    projectId: 'firebase-shhlist',
    storageBucket: 'firebase-shhlist.appspot.com',
    messagingSenderId: '983786427254',
};

firebase.initializeApp(firebaseConfig);

app.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
        if (typeof analytics !== 'undefined') {
            analytics.startTrackerWithId('UA-58355829-1');
        } else {
            console.log('Google Analytics Unavailable');
        }
    });
});

app.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('app', {
            url: '/app',
            abstract: true,
            controller: 'ContentController',
            templateUrl: 'templates/applayout.html',
        })

        .state('app.tasks', {
            url: '/tasks',
            views: {
                menuContent: {
                    templateUrl: 'templates/centercontent.html',
                },
            },
        })

        .state('app.register', {
            url: '/register',
            templateUrl: 'templates/applayout.html',
            views: {
                menuContent: {
                    templateUrl: 'templates/register.html',
                    controller: 'RegisterController',
                },
            },
        })

        .state('app.login', {
            url: '/login',
            templateUrl: 'templates/applayout.html',
            views: {
                menuContent: {
                    templateUrl: 'templates/login.html',
                    controller: 'LoginController',
                },
            },
        });

    $urlRouterProvider.otherwise('/app/tasks');
});

app.directive('analytics', [
    '$rootScope',
    '$location',
    function ($rootScope, $location) {
        return {
            link: function (scope, elem, attrs, ctrl) {
                $rootScope.$on('$routeChangeSuccess', function (event, currRoute, prevRoute) {
                    if (typeof analytics !== 'undefined') {
                        window.analytics.trackView($location.path());
                    }
                });
            },
        };
    },
]);
