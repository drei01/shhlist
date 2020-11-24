'use strict';

/**
 * The Projects factory handles saving and loading the last active project's key
 * from localStorage
 */
app.factory('ProjectsService', function() {
  var generateCode = function(len){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < len; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  };
    
  return {
    newProject: function(project,uid) {
      return {
          title: project.title,
          code: generateCode(4),//generate a new 
          uid: uid
        };
    },
    getLastActiveKey: function () {
      return window.localStorage.lastActiveProject || 0;
    },
    setLastActiveKey: function (key) {
      window.localStorage.lastActiveProject = key;
    }
  };
});
