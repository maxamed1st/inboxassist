import initializeRedis from "./events/index.js";
import initializeServer from "./server.js";

async function main() {
  // initializations
  await initializeRedis();
  initializeServer();
}

main()