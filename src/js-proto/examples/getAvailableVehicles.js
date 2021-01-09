/**
 * Node script that gets all available vehicles from the anonymous API.
 * Write the results to the `../data` folder (you must manually create this directory)
 * and `console.log` some aggregate details about the data returned.
 *
 * If run with `npm run example`, it will proxy traffic for capture using global-agent/mitmproxy.
 */
const fs = require("fs").promises;
const AnonApiData = require("../index.js");

const main = async () => {
  const anonApiData = new AnonApiData();
  try {
    const [
      models,
      options,
      parking,
      homezones,
      cities,
      vehicles,
    ] = await anonApiData.getAll();

    // Extract some aggregate details to log out to the user
    const cityNames = cities.map((obj) => obj.name).join(" - ");
    const parkingSpotCount = parking
      .map((obj) => obj.content.features.length)
      .reduce((a, b) => a + b);
    const numberOfHomezones = homezones[0].zone.features.length;
    const detailString = `
    Received ${cities.length} city/cities: ${cityNames}
    with ${numberOfHomezones} homezones, ${parkingSpotCount} parking spots,
    ${models.length - 1} vehicles models and ${options.length} options.  XD
    `;
    console.log(detailString);

    // Save the available vehicles to the data folder
    const createPathString = (name) =>
      `${process.cwd()}/data/${name}-${Date.now()}.json`;

    console.log("... Saving to data folder ...");
    await fs.writeFile(createPathString("vehicles"), JSON.stringify(vehicles));
    console.log(`Success! ${vehicles.length} vehicles saved to data folder`);
  } catch (e) {
    console.log("");
    console.log("Oops!");
    console.log("");
    console.error(e);
  }
};

main();
