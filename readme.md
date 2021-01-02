# Reverse Engineering of an Undocumented API

This is the first prototype in bash. The API is being reversed engineered from an android app running in an android emulator while capturing traffic using mitmproxy.

The longest part was getting the emulated android environment setup correctly. I have documented the process meticulously and will probably write a blog post.

I noticed one small difference on the response from the availableVehicles endpoint; the JSON response is prefixed with "[]". This is typically done to cause browser JSON parsers to error. I will need to double check to make sure all headers are identical.

# Why?

A service I use discontinued their web interface. Now one is expected to use their terrible app. There are a variety of reasons why I can't and won't use it, so I decided to try and revive the web app.

# How?

The first step is to list the vehicles with a bash script as a proof of concept, using captures of the real apps traffic. Now that is done, the next step is to build a simple web app that will list all the available vehicles. I built one such web app some years back when there was a public-ish API, so I will likely use that as inspiration.

This could potentially all be done client-side, as the API sets the "Access-Control-Allow-Origin" header to "*", allowing a web app on any domain to use it. However, I think I will end up implementing a server-side component to allow greater control over the request headers sent. It also may be necessary to fix out-of-spec JSON responses, which will be easier server-side.

# Todo

- I noticed one small difference on the response from the availableVehicles endpoint; the JSON response is prefixed with "[]". This is typically done to cause browser JSON parsers to error. I will need to double check to make sure all headers are identical.

- I still haven't captured the login and reserving flows, as listing can be done without logging in. At some point, I need to capture and reimplement those flows, I'm just not sure if I will do it in the prototype bash phase or after I make the first web app. Honestly, I'm just tired of trawling through requests in mitmproxy right now.
