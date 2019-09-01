'use strict';

/**
 * The Projects factory handles saving and loading the last active project's key
 * from localStorage
 */
app.factory('AuthService', function($localstorage) {
    return {
        checkAuth: function() {
            return new Promise(function(resolve, reject) {
                firebase.auth().onAuthStateChanged(resolve);
            });
        },

        register: function(opts) {
            return firebase
                .auth()
                .createUserAndRetrieveDataWithEmailAndPassword(opts.email, opts.password)
                .then(() => {
                    firebase
                        .child('users')
                        .child(userData.uid)
                        .set({
                            name: opts.name,
                        });
                    resolve(userData);
                });
        },

        login: function(email, password) {
            return firebase
                .auth()
                .signInWithEmailAndPassword(email, password);
        },

        logout: function() {
            firebase
                .auth()
                .signOut() //un auth from firebase
                .then(() => {
                    $localstorage.setObject('user', null); //remove local data
                    window.location.reload(); //reload the page
                });
        },

        passwordReset: function(email) {
            return firebase.auth().sendPasswordResetEmail(email);
        },
    };
});
