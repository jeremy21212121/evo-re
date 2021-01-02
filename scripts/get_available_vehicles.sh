#!/bin/bash

set -e

# Gets the access token and related info. This is called repeatedly instead of using the refresh token for some reason.
# The client_secret is the value we really need to make this work. I have a hunch it is generated at install time and varies between installs but I haven't verified this yet.
function get_new_token() {
	local RESPONSE=$(curl -sXPOST --compressed https://java-us01.vulog.com/auth/realms/BCAA-CAYVR/protocol/openid-connect/token/ -H "Content-Type: application/x-www-form-urlencoded; charset=utf-8" -H "User-Agent: okhttp/3.12.8" --data "scope=&client_id=BCAA-CAYVR_anon&client_secret=dbe490f4-2f4a-4bef-8c0b-52c0ecedb6c8&grant_type=client_credentials");

	# get the token and remove the double quotes
	TOKENTYPE=$(echo -n $RESPONSE | jq '.token_type' | tr -d '"');

	# token is valid for 5 minutes
	ACCESSTOKEN=$(echo -n $RESPONSE | jq '.access_token' | tr -d '"');

	# refresh token is valid for 60 days. I still need to capture a refresh request to see how it is done. Spoiler: It isn't
	REFRESHTOKEN=$(echo -n $RESPONSE | jq '.refresh_token' | tr -d '"');
}

# This is immediately called twice for some reason and the first response is ignored. Either some sort of port knocking/obfuscation or just poor programming. For a variety of reasons, I suspect the latter.
get_new_token && get_new_token



# fetch car models. Doesn't seem to change. Returns an array of 3 objects. We are interested in the first 2, the last one seems to be for testing purposes.
# the vehicle names are used to fetch images such as https://mobile-asset-resources.vulog.center/PROD_US/BCAA-CAYVR/mobile_resources/models/Prius/android/xxhdpi/model.png?f620633d-7098-49ba-88e0-e54f8ef72a18
# the query string from the end of the image url comes the "tokenIconsUrl" prop in this response. Interestingly, only 1/3 succeeds ("Prius"), but this may be because we are not currently logged in.
# The "X-API-Key" header value seems to be hardcoded in the app but I need to verify that it doesn't change.
MODELS=$(curl -s --compressed https://java-us01.vulog.com/apiv5/models -H "Authorization: $TOKENTYPE $ACCESSTOKEN" -H "X-API-Key: f52e5e56-c7db-4af0-acf5-0d8b13ac4bfc" -H "User-Agent: okhttp/3.12.8" -H "Accept: application/json" -H "Content-Type: application/json");

# fetch options. Doesn't seem to change. Returns an empty array. We can ignore the return value, this request remains to simulate the app as faithfully as possible.
curl -s --compressed https://java-us01.vulog.com/apiv5/options -H "Authorization: $TOKENTYPE $ACCESSTOKEN" -H "X-API-Key: f52e5e56-c7db-4af0-acf5-0d8b13ac4bfc" -H "User-Agent: okhttp/3.12.8" -H "Accept: application/json" -H "Content-Type: application/json";

# fetch parking info. Doesn't change often. Returns somewhat complex JSON. We are interested in the "response[0].content.features" array.
PARKING=$(curl -s --compressed https://java-us01.vulog.com/apiv5/mapping/layers -H "Authorization: $TOKENTYPE $ACCESSTOKEN" -H "X-API-Key: f52e5e56-c7db-4af0-acf5-0d8b13ac4bfc" -H "User-Agent: okhttp/3.12.8" -H "Accept: application/json" -H "Content-Type: application/json");

# fetch homezone info. Doesn't change often. Returns somewhat complex JSON. We are interested in the "response[0].zone.features" array.
HOMEZONES=$(curl -s --compressed https://java-us01.vulog.com/apiv5/mapping/homezones -H "Authorization: $TOKENTYPE $ACCESSTOKEN" -H "X-API-Key: f52e5e56-c7db-4af0-acf5-0d8b13ac4bfc" -H "User-Agent: okhttp/3.12.8" -H "Accept: application/json" -H "Content-Type: application/json");

# fetch cities. The bulk is made up of IDs that refer to results from the previous two requests (parking and homezones)
# the response is an array containing a single large object as their service is only offered in one metro area. We need the city ID to request the available cars later.
# This key/value combo is mildly interesting... "termsOfUseUrl": "https://todo.com". I guess anything goes!
CITIES=$(curl -s --compressed https://java-us01.vulog.com/apiv5/cities -H "Authorization: $TOKENTYPE $ACCESSTOKEN" -H "X-API-Key: f52e5e56-c7db-4af0-acf5-0d8b13ac4bfc" -H "User-Agent: okhttp/3.12.8" -H "Accept: application/json" -H "Content-Type: application/json");

# Now we are requesting a token again, same as in the first step. It has only been 3 seconds since the original token was issued, so I don't understand this.
# There should be a refresh endpoint which should be used with the refresh token, which only needs to happen once every 5 minutes. In a well-architected app, the time should be checked pre-request and the token refreshed first if necessary.
# I'm still not sure if this is poor practices or some sort of obscure access control. I'm leaning towards the former since I doubt they created their own non-standard openid connect implementation.
# I suspect they are just getting new tokens over and over because the original developer didn't have a solid understanding of the OpenID Connect protocol.
get_new_token

# Yay we can finally get the available vehicles. Glorius day! The UUID in the url comes from the City ID, but we can be lazy and hardcode it for now.
# We need to include a "user-lat" (15 decimal places) and "user-lon" (14 decimal places) header with this request. Here it is hardcoded to downtown vancouver but in the real implementation will will use the users location.
VEHICLES=$(curl -s --compressed https://java-us01.vulog.com/apiv5/availableVehicles/fc256982-77d1-455c-8ab0-7862c170db6a -H "Authorization: $TOKENTYPE $ACCESSTOKEN" -H "X-API-Key: f52e5e56-c7db-4af0-acf5-0d8b13ac4bfc" -H "user-lat: 49.279844999999995" -H "user-lon: -123.10200666666667" -H "User-Agent: okhttp/3.12.8" -H "Accept: application/json" -H "Content-Type: application/json");

echo $VEHICLES;

exit 0;

