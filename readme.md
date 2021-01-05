# Reverse Engineering of an Undocumented API

This is a work-in-progress implementation of a carshare API client. The first prototype was a heavily-commented Bash shell script found in `/scripts`.

A subsequent JavaScript implementation can be found in `src/js-proto/`. It is verified to work in node and hopefully works in the browser but I haven't verified that yet.

The API is being reversed engineered from an android app running in an android emulator while capturing traffic using [mitmproxy](https://mitmproxy.org/). I've also decompiled the APK with [jadx](https://github.com/skylot/jadx) so I can poke around in the source when needed.

Getting the emulated android environment setup correctly with HTTPS interception was tedious. I have documented the process meticulously and will probably write it up elsewhere.

# Why?

A service I rely upon discontinued their web interface. Now one is expected to use their terrible app. There are a variety of reasons why I can't and won't use it, so I decided to try to make a web app. At the very least, it will display all the available vehicles on a map, which will allow me to use the service again, albeit not reserve a vehicle in advance. Ideally, I will be able to replicate the login and reservation flows as well, but I haven't captured and analyzed those yet.

# How?

The first step was to simulate the app far enough to list the vehicles with a bash script as a proof of concept, using captures of the real apps traffic. Now that is done, the next step is to build a simple web app that will list all the available vehicles. I built one such web app some years back when there was a public-ish API, so I will likely use that as inspiration.

This could potentially all be done client-side, as the API sets the "Access-Control-Allow-Origin" header to "*", allowing a web app on any domain to use it. However, I think I will end up implementing a server-side component to allow greater control over the request headers sent. It also may be necessary to fix out-of-spec JSON responses, which will be easier server-side.

The JS implementation can be proxied through `mitmproxy` for full traffic capture. See `src/js-proto/readme.md` for details.
# Todo

- ~~~I noticed one small difference on the response from the availableVehicles endpoint; the JSON response is prefixed with "[]". This is typically done to cause browser JSON parsers to error. I will need to double check to make sure all headers are identical.~~~ UPDATE: Still a mystery but I am working around it with custom JSON parsing logic. UPDATE 2: All headers are now correct in the JS version and it no longer happens.

- I still haven't captured the login and reserving flows, as listing can be done without logging in. Next, I need to capture and reimplement those flows. Honestly, I'm just tired of trawling through requests in mitmproxy right now.

- Make TypeScript version. Mostly I just need to write types for all the things (API responses, classes, etc).

- Create the UI of the web interface. I made [this very thing](https://github.com/jeremy21212121/evo-finder) a few years back when there was a public-ish API. Hopefully I will be able to re-use a bunch of code from that.
