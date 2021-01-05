## First implementation of basic functionality in JS

This is a port of the bash script to JS. When reverse-engineering a client/API I like to do the first attempt in bash as a quick proof of concept.

Now that I know it works, I am using the bash script & comments as documentation to implement it in JS. Then I will reverse the login/booking/cancelling flow and extend the JS version accordingly. Ultimately it will be a TypeScript library that can be reliably used as part of a larger application.

The JS port is now functional. Make sure you create an empty directory (in this directory) called 'data' for saving the JSON files.

### Run it

The command to run if you want to decrypt/capture all traffic with mitmproxy is the following:

```
GLOBAL_AGENT_HTTP_PROXY=http://127.0.0.1:8080 NODE_EXTRA_CA_CERTS=/home/$USER/.mitmproxy/mitmproxy-ca-cert.pem node -r 'global-agent/bootstrap' index.js
```

That command is a doosie!

The first env variable points to the proxy server, the second trusts our `mitmproxy` cert so we can decrypt traffic, the `-r 'global-agent/bootsrap'` part forces all our axios requests through the proxy, without modifying our code.

We could simplify this by using a `.env` file with the `dotenv` npm module to load our environment variables.
