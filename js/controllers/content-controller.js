app.controller(
    'ContentController',
    function (
        $scope,
        $ionicModal,
        ProjectsService,
        AuthService,
        $firebaseArray,
        $firebaseObject,
        $ionicLoading,
        $ionicSideMenuDelegate,
        $ionicPopup,
        $timeout,
        $state,
        $rootScope
    ) {
        const TASK_MAX_AGE_MONTHS = 6;

        $scope.isWebapp = !window.cordova;
        $scope.showInstallPrompt = window.showInstallPrompt;

        // Load projects
        var projectRef = firebase.database().ref(),
            firebaseKeyRegEx = /^-\w{19}$/,
            name;

        $scope.modal = {};

        $scope.keyword = '';

        $scope.logout = function () {
            AuthService.logout();
        };

        $scope.hasOpenProject = false;

        $rootScope.$on('app:login', function () {
            init();
        });

        var init = function () {
            AuthService.checkAuth()
                .then(function (user) {
                    if (user) {
                        loadUser(user);
                        Promise.all([loadProjects(user), loadFriendsProjects()]).then($scope.loaded);
                    } else {
                        $scope.hideLoading();
                        $state.go('app.register');
                    }
                })
                .catch(function (error) {
                    $scope.hideLoading();
                    $scope.showAlert(error);
                });
        };

        var loadUser = function (user) {
            //keep track of the logged in user
            return new Promise(function (resolve, reject) {
                var userRef = projectRef.child('users/' + user.uid);
                userRef.on('value', function (snapshot) {
                    $scope.user = snapshot.val();
                });

                resolve();
            });
        };

        var loadProjects = function (authData) {
            return new Promise(function (resolve, reject) {
                $scope.uid = authData.uid;
                $scope.projects = [];

                var listsRef = projectRef.child('lists').startAt($scope.uid).endAt($scope.uid);

                var projectsArray = $firebaseArray(listsRef);
                projectsArray.$loaded().then(function () {
                    for (var key in projectsArray) {
                        if (!isNaN(key)) {
                            var project = projectsArray[key];
                            $scope.projects.push(project);
                        }
                    }
                    resolve();
                });
            });
        };

        var loadFriendsProjects = function () {
            return new Promise(function (resolve, reject) {
                $scope.friendsProjects = [];

                var listsRef = projectRef.child('users/' + $scope.uid + '/friendProjects');

                var projectsArray = $firebaseArray(listsRef);
                projectsArray.$loaded().then(function () {
                    for (var key in projectsArray) {
                        if (!isNaN(key)) {
                            var code = projectsArray[key].code;
                            var id = projectsArray[key].$id;

                            //push the object and the list id
                            $scope.friendsProjects.push({
                                obj: $firebaseObject(projectRef.child('lists/' + code)),
                                id: id,
                            });
                        }
                    }
                    resolve();
                });
            });
        };

        $scope.loaded = function () {
            $scope.hideLoading();
            if ($scope.projects.length > 0) {
                $scope.syncProjectKeys();
                $scope.lastActiveProjectKey = ProjectsService.getLastActiveKey();
                if (firebaseKeyRegEx.test($scope.lastActiveProjectKey)) {
                    $scope.selectProject($scope.lastActiveProjectKey);
                } else {
                    $scope.selectProject($scope.projectKeys[0]);
                }
            } else {
                //user has no projects, ask if they have a code
                $scope.codeDialog().then(function (res) {
                    if (res) {
                        $scope.enterCode();
                    } else {
                        //no code so start a new project
                        $scope.newProject();
                    }
                });
            }
        };

        $scope.codeDialog = function () {
            return $ionicPopup.confirm({
                title: 'Welcome to Shhlist',
                content: 'Did a friend share a list code with you',
                buttons: [
                    {
                        text: 'No Code',
                        type: 'button-default',
                        onTap: function (e) {
                            return false;
                        },
                    },
                    {
                        text: 'Code',
                        type: 'button-positive',
                        onTap: function (e) {
                            return true;
                        },
                    },
                ],
            });
        };

        $scope.enterCodeDialog = function () {
            return $ionicPopup.show({
                template: '<input type="text" ng-model="modal.friendCode">',
                title: "Enter your friend's code",
                subTitle: 'The code your friends sent you unlocks their list.',
                scope: $scope,
                buttons: [
                    { text: 'Cancel' },
                    {
                        text: '<b>Ok</b>',
                        type: 'button-positive',
                        onTap: function (e) {
                            var friendCode = $scope.modal.friendCode;
                            $scope.modal.friendCode = '';
                            return friendCode;
                        },
                    },
                ],
            });
        };

        $scope.syncProjectKeys = function () {
            var keys = [];
            for (var key in $scope.projects) {
                if ($scope.projects[key].$id) {
                    keys.push($scope.projects[key].$id);
                }
            }
            $scope.projectKeys = keys;
        };

        $scope.showLoading = function () {
            $scope.loading = $ionicLoading.show({
                template: '<i class="icon ion-load-c"></i>',
                animation: 'fade-in',
                showBackdrop: true,
                maxWidth: 200,
                showDelay: 500,
            });
        };

        $scope.hideLoading = function () {
            $ionicLoading.hide();
        };

        // Selects the given project by it's code
        $scope.selectProject = function (code) {
            $scope.activeProject = projectRef.child('lists').child(code);

            $scope.activeProject.once('value', function (snapshot) {
                $scope.setActiveProject(snapshot);
            });
        };

        function checkExpiredTasks() {
            //check for tasks over 6 months old
            const maxAge = new Date();
            maxAge.setMonth(maxAge.getMonth() - TASK_MAX_AGE_MONTHS);

            for (key in $scope.activeTasksArray) {
                const task = $scope.activeTasksArray[key];
                if (task.finished && task.toggled_at && task.toggled_at < maxAge.getTime()) {
                    $scope.activeTasksArray.$remove(task);
                }
            }
        }

        $scope.setActiveProject = function (key) {
            $scope.activeProjectObject = $firebaseObject($scope.activeProject);
            $scope.activeTasks = $scope.activeProject.child('tasks');
            $scope.activeTasksArray = $firebaseArray($scope.activeTasks);
            $scope.activeTasksArray.$loaded().then(checkExpiredTasks);
            ProjectsService.setLastActiveKey(key);
            $ionicSideMenuDelegate.toggleLeft(false);
            $scope.hasOpenProject = true;
        };

        // Create our modals
        $ionicModal.fromTemplateUrl(
            'templates/newprojectmodal.html',
            function (modal) {
                $scope.projectModal = modal;
            },
            {
                scope: $scope,
            }
        );

        $ionicModal.fromTemplateUrl(
            'templates/projectsettingsmodal.html',
            function (modal) {
                $scope.projectSettingsModal = modal;
            },
            {
                scope: $scope,
            }
        );

        $scope.createTask = function (task) {
            if (!$scope.activeProject || !task || !task.title) {
                return;
            }

            $scope.showLoading();

            $scope.activeTasksArray
                .$add({
                    title: task.title,
                    icon: task.icon || null,
                    finished: false,
                    uid: $scope.activeProjectObject.uid,
                    created_by: $scope.user.name,
                    created_by_uid: $scope.uid,
                    created_at: new Date().getTime(),
                })
                .then(function (/*ref*/) {
                    $scope.hideLoading();
                })
                .catch(console.log);

            // reset task form title
            task.title = '';
            task.icon = undefined;

            $scope.trackEvent('Projects', 'Task', 'Add', 1);
        };

        $scope.createProject = function (project) {
            if (!project) {
                return;
            }

            $scope.projectModal.hide();
            $scope.showLoading();

            //generate the new project
            var project = ProjectsService.newProject(project, $scope.uid);

            //check that no list exists with that code
            projectRef.child('lists/' + project.code).once('value', function (snapshot) {
                if (snapshot.exists()) {
                    //code already exists, try again
                    $scope.createProject(project);
                    return;
                }

                // store project to firebase projects, upon success make it active project
                var newProjectRef = projectRef.child('lists').child(project.code);
                newProjectRef.set(project, function (error) {
                    if (!error) {
                        //add the new project to our existing list
                        $scope.projects.push($firebaseObject(newProjectRef));
                        //select it as the active project
                        $scope.selectProject(project.code);
                        $scope.hideLoading();
                    }
                });
                newProjectRef.setPriority($scope.uid); //set the priority as the user id so we can look up the list later

                project.title = '';

                $scope.trackEvent('Projects', 'Project', 'Add', 1);
            });
        };

        $scope.newProject = function () {
            $scope.projectModal.show();
        };

        $scope.closeNewProject = function () {
            $scope.projectModal.hide();
        };

        $scope.projectSettings = function () {
            $scope.projectSettingsModal.show();
        };

        $scope.closeProjectSettings = function () {
            $scope.projectSettingsModal.hide();
        };

        $scope.updateProjectSettings = function (settings) {
            $scope.activeProjectObject.$save().catch(function (err) {
                $ionicPopup.alert({
                    title: 'Oops',
                    template: error,
                });
            });
        };

        $scope.showThirdPartyWarning = function () {
            $ionicPopup.alert({
                title: 'Ticked items are public',
                template: `The settings for this list mean that ticked items are visible to the creator.`,
            });
        };

        $scope.toggleProjects = function () {
            $ionicSideMenuDelegate.toggleLeft();
        };

        $scope.toggleTask = function (key) {
            $timeout(function () {
                var clickedTask = $scope.activeTasksArray.$getRecord(key);
                clickedTask.toggled_by = $scope.user.name;
                clickedTask.toggled_by_uid = $scope.uid;
                clickedTask.toggled_at = new Date();
                $scope.activeTasksArray.$save(clickedTask);
            }, 300);

            $scope.trackEvent('Projects', 'Task', 'Toggle', 1);
        };

        $scope.showTask = function (task) {
            return task.uid != $scope.uid;
        };

        $scope.deleteTask = function (key) {
            $ionicPopup
                .confirm({
                    title: 'Delete Item',
                    content: 'You sure?',
                })
                .then(function (res) {
                    if (res) {
                        $scope.activeTasksArray.$remove(key);

                        $scope.trackEvent('Projects', 'Task', 'Delete', 1);
                    } else {
                    }
                });
        };

        $scope.deleteProject = function (code) {
            $ionicPopup
                .confirm({
                    title: 'Delete Project',
                    content: 'You sure?',
                })
                .then(function (res) {
                    if (res) {
                        projectRef.child('lists/' + code).remove(function () {
                            window.location.reload();
                        });
                    } else {
                    }
                });

            $scope.trackEvent('Projects', 'Friend Project', 'Delete', 1);
        };

        $scope.deleteFriendProject = function (code) {
            $ionicPopup
                .confirm({
                    title: 'Delete Friend Project',
                    content: 'You sure?',
                })
                .then(function (res) {
                    if (res) {
                        projectRef.child('users/' + $scope.uid + '/friendProjects/' + code).remove(function () {
                            window.location.reload();
                        });
                    } else {
                    }
                });

            $scope.trackEvent('Projects', 'Project', 'Delete', 1);
        };

        $scope.shareProject = function (project) {
            window.socialmessage.send({
                text: 'Check out my list on Shhlist. Enter code: ' + project.code,
            }); //cordova social message plugin
            $scope.trackEvent('Projects', 'Share', project.code, 1);
        };

        $scope.enterCode = function () {
            $ionicSideMenuDelegate.toggleLeft(false);

            $scope.enterCodeDialog().then(function (code) {
                if (code && code.trim() != '') {
                    var friendProjectRef = projectRef.child('lists/' + code);
                    friendProjectRef.once('value', function (snapshot) {
                        //check that the project actually exists
                        if (snapshot.exists()) {
                            //add the list code
                            newUserPointerRef = projectRef.child('users/' + $scope.uid + '/friendProjects').push();
                            newUserPointerRef.set({ code: code });

                            $scope.friendsProjects.push({
                                obj: $firebaseObject(friendProjectRef),
                                id: code,
                            });
                            $scope.selectProject(code);

                            $scope.trackEvent('Invites', 'Accept', code, 1);
                        } else {
                            $scope
                                .showAlert("Doesn't look like that list exists. Double check the code and try again.")
                                .then(function () {
                                    $scope.enterCode();
                                });
                        }
                    });
                } else {
                    //didn't enter a code or clicked cancel
                }
            });
        };

        $scope.showAlert = function (msg) {
            return $ionicPopup.alert({
                title: 'Oops',
                template: msg,
            });
        };

        $scope.trackEvent = function (Category, Action, Label, Value) {
            if (typeof analytics != 'undefined') {
                window.analytics.trackEvent(Category, Action, Label, Value);
            }
        };

        $scope.showLoading();
        init();
    }
);
