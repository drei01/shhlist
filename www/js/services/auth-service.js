'use strict';

/**
 * The Projects factory handles saving and loading the last active project's key
 * from localStorage
 */
app.factory('AuthService', function($localstorage) {
    return {
        checkAuth: function() {
            return new Promise(function(resolve, reject) {
                var authData = firebase.auth().currentUser;
                if (authData) {
                    resolve(authData);
                    return;
                }

                var user = $localstorage.getObject('user');

                if (user && user.email && user.password) {
                    firebase
                        .auth()
                        .signInWithEmailAndPassword({
                            email: user.email,
                            password: user.password,
                        })
                        .then(authData => {
                            resolve(authData);
                        })
                        .catch(error => reject(error));
                } else {
                    resolve(null);
                }
            });
        },

        register: function(opts) {
            return firebase
                .auth()
                .createUserAndRetrieveDataWithEmailAndPassword(opts.email, opts.password)
                .then(() => {
                    $localstorage.setObject('user', user); //successfully registered, store the email and password for later login
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
                .signInWithEmailAndPassword(email, password)
                .then(user => {
                    $localstorage.setObject('user', user); //store the email and password for later login
                    return user;
                });
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
