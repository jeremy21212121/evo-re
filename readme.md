# Reverse Engineering of an Undocumented API

This is the first prototype in bash and now the second is being written in JS.

The API is being reversed engineered from an android app running in an android emulator while capturing traffic using [mitmproxy](https://mitmproxy.org/). I've also decompiled the APK with [jadx](https://github.com/skylot/jadx) so I can poke around in the source when needed.

Getting the emulated android environment setup correctly was tedious. I have documented the process meticulously and will probably write it up elsewhere.

# Why?

A service I rely upon discontinued their web interface. Now one is expected to use their terrible app. There are a variety of reasons why I can't and won't use it, so I decided to try to make a web app. At the very least, it will display all the available vehicles on a map, which will allow me to use the service again, albeit not reserve a vehicle in advance. Ideally, I will be able to replicate the login and reservation flows as well, but I haven't captured and analyzed those yet.

# How?

The first step was to simulate the app far enough to list the vehicles with a bash script as a proof of concept, using captures of the real apps traffic. Now that is done, the next step is to build a simple web app that will list all the available vehicles. I built one such web app some years back when there was a public-ish API, so I will likely use that as inspiration.

This could potentially all be done client-side, as the API sets the "Access-Control-Allow-Origin" header to "*", allowing a web app on any domain to use it. However, I think I will end up implementing a server-side component to allow greater control over the request headers sent. It also may be necessary to fix out-of-spec JSON responses, which will be easier server-side.

I'm currently writing a small library which makes calling the API easy, using the bash script and comments as documentation. This is nearly functional and just requires some fine-tuning and ideally proxying through `mitmproxy`

# Todo

- I noticed one small difference on the response from the availableVehicles endpoint; the JSON response is prefixed with "[]". This is typically done to cause browser JSON parsers to error. I will need to double check to make sure all headers are identical. UPDATE: Still a mystery but I am working around it.

- I still haven't captured the login and reserving flows, as listing can be done without logging in. At some point, I need to capture and reimplement those flows, That will be done in the JS version. Honestly, I'm just tired of trawling through requests in mitmproxy right now.
