ionic cordova build android --release

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore android.jks /Users/matthewreid/Dropbox/shhlist/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk shhlist

zipalign -v 4 /Users/matthewreid/Dropbox/shhlist/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk shhlist-release-2020-TODAYS_DATE.apk
