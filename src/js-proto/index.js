const axios = require("axios");

// Comes from the decompiled android app.
const config = {
  identityBaseUrl:
    "https://java-us01.vulog.com/auth/realms/BCAA-CAYVR/protocol/openid-connect/token",
  anonymousClientId: "BCAA-CAYVR_anon",
  anonymousClientSecret: "dbe490f4-2f4a-4bef-8c0b-52c0ecedb6c8",
  anonymousScope: "",
  anonymousBaseUrl: "https://java-us01.vulog.com/apiv5",
  anonymousApiKey: "f52e5e56-c7db-4af0-acf5-0d8b13ac4bfc",
  secureClientId: "BCAA-CAYVR_secure",
  secureClientSecret: "b3728c6b-43a2-46f1-90c9-e85a31e2c09c",
  secureScope: "",
  secureBaseUrl: "https://java-us01.vulog.com/apiv5",
  secureApiKey: "8bb6d3fd-5cf5-4b72-90f5-01c81a4b89dd",
  userAgent: "okhttp/3.12.8",
};

// This data is sent form-encoded when requesting a token
const tokenData = [
  ["scope", ""],
  ["client_id", config.anonymousClientId],
  ["client_secret", config.anonymousClientSecret],
  ["grant_type", "client_credentials"],
];
/*
 * Class has one public method, get() (async)
 * It keeps track of the expiration and will get a new token automatically (Doesn't currently matter as the expiry time seems to be a lie).
 * For some reason the refresh endpoint isn't used so we just request new tokens as needed.
 */
class AnonApiToken {
  constructor() {
    this._data = tokenData;
    this._tokenType = "";
    this._accessToken = "";
    this._tokenExpiry = 0;
    // fetches and stores token data
    this._fetchNewToken = async () => {
      const params = new URLSearchParams();
      // build form-encoded data
      this._data.forEach((kvArr) => params.append(...kvArr));
      const options = {
        method: "POST",
        headers: {
          // the headers come from the mitmproxy traffic capture
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": config.userAgent,
        },
        data: params,
        url: config.identityBaseUrl,
      };
      const response = await axios(options);
      // extract needed data from response
      this._tokenType = response.data.token_type;
      this._accessToken = response.data.access_token;
      // set token expiry time 50ms before actual to provide a buffer
      this._tokenExpiry = response.data.expires_in * 1000 + Date.now() - 50;
    };
    // returns true if token is not expired
    this._isValid = () => this._tokenExpiry > Date.now();
    // fetches a new token if necessary and returns the token string
    this.get = async () => {
      if (!this._isValid()) {
        // no valid token so fetch one first
        await this._fetchNewToken();
      }
      // returns the token string in the format required for the Authorization header value
      return `${this._tokenType} ${this._accessToken}`;
    };
  }
}

/*
 * Makes use of the AnonApiToken class to make authorized calls to anonymous (not logged in) API endpoints
 */
class AnonApiRequest {
  constructor() {
    // Auth header will be added at call time. Headers are chosen to match android app.
    this._axiosInstance = axios.create({
      baseURL: config.anonymousBaseUrl,
      headers: {
        "user-agent": config.userAgent,
        "X-API-Key": config.anonymousApiKey,
        accept: "application/json",
        "content-type": "application/json",
      },
      // Modified JSON parsing to handle non-standard JSON intended to cause errors
      // We are no longer seeing this but we will keep it for now as it doesn't effect valid JSON.
      transformResponse: (res) => JSON.parse(res.replace(/^\[\](?=\[)/, "")),
    });
    this._token = new AnonApiToken();
    this.refreshToken = this._token._fetchNewToken;
    // method for making API requests
    this.get = async (path, headers = {}) => {
      // gets a valid token string
      const tokenString = await this._token.get();
      // Auth header needs to be added at function run time to ensure it is valid
      const mergedHeaders = Object.assign(
        { authorization: tokenString },
        headers
      );
      const options = { method: "GET", headers: mergedHeaders, url: path };
      const response = await this._axiosInstance(options);
      return response.data;
    };
  }
}

/*
 * Used to get data from the anon API
 * Makes use of the AnonApiRequest class
 * I've been reading too much Java/Kotlin code and now everything is a class :P
 */
class AnonApiData {
  constructor() {
    // lat/lon defaults to downtown vancouver
    this.getAll = async (
      lat = 49.279844999999995,
      lon = -123.10200666666667
    ) => {
      const anonApiRequest = new AnonApiRequest();
      /*
       * Manually request a token twice.
       * For some bizarre reason we have to request two tokens before making any API calls. I guess it is an attempt at security via obscurity.
       */
      await anonApiRequest.refreshToken();
      await anonApiRequest.refreshToken();
      /*
        Fetch car models. Doesn't seem to change frequently. Returns an array of 3 objects. We are interested in the first 2 (Prius, Prius C), the last one seems to be for testing purposes.
       * 
        The vehicle names are used to fetch images such as https://mobile-asset-resources.vulog.center/PROD_US/BCAA-CAYVR/mobile_resources/models/Prius/android/xxhdpi/model.png?f620633d-7098-49ba-88e0-e54f8ef72a18
        The query string from the end of the image url comes the "tokenIconsUrl" prop in this response. Interestingly, only 1/3 succeeded ("Prius"), but this may be because we are not currently logged in.
        It is not necessary, for our purposes, to request the images. They are hosted on a different server and do not currently make up part of the obfuscation process.
       */
      const models = await anonApiRequest.get("/models");
      /*
       * Fetch options. Doesn't seem to change. Returns an empty array. This request remains to simulate the real client app as faithfully as possible.
       */
      const options = await anonApiRequest.get("/options");
      /*
       * Fetch parking location data. Doesn't change often. Returns somewhat complex JSON. We are interested in the "response[0].content.features" array.
       */
      const parking = await anonApiRequest.get("/mapping/layers");
      /*
       * Fetch homezones area data. Doesn't change often. Returns somewhat complex JSON. We are interested in the "response[0].zone.features" array.
       */
      const homezones = await anonApiRequest.get("/mapping/homezones");
      /*
       * Fetch cities. The bulk is made up of IDs that refer to results from the previous two requests (parking and homezones).
       * The response is an array containing a single large object as their service is only offered in one metro area.
       * We need the city ID to request the available cars in the next request.
       */
      const cities = await anonApiRequest.get("/cities");

      // Manually request a new token because that is what the real app does. Probably an attempt at security through obscurity.
      await anonApiRequest.refreshToken();
      /*
       * User lat/lon are included as headers. Defaults to downtown vancouver.
       */
      const vehicles = await anonApiRequest.get(
        `/availableVehicles/${cities[0].id}`,
        { "user-lat": lat, "user-lon": lon }
      );

      return [models, options, parking, homezones, cities, vehicles];
    };
  }
}

module.exports = AnonApiData;
