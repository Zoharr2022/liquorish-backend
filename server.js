
/**
 * Comment goes here
 */

/**
 * Dependencies for the application
 */
const Hapi = require("@hapi/hapi");
const { Connection, Request } = require("tedious");
const { exit } = require("process");

/**
 * API files/functions
 */
const { loginUser } = require('./routes/loginUser')
const { getIngredients } = require('./routes/get/getIngredients')
const { getDob } = require('./routes/get/getDob');
const { getBarsNearUser } = require("./routes/get/getBarsNearUser");
const { updateUserPasswordForm, updateUserPassword } = require("./routes/update/updateUserPassword");
const { updateUserDobForm, updateUserDob } = require("./routes/update/updateUserDob");
const { updateUserCityStateForm, updateUserCityState } = require("./routes/update/updateUserCityState");

/**
 * Gets Azure DB credentials
 */
const DB_SERVER = process.env.DB_SERVER;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_USER_NAME = process.env.DB_USER_NAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const PORT = process.env.PORT || 8080;

/**
 * Creates config object to be passed to tedious upon creation of a
 * new connection
 */
const db_config = {
  server: DB_SERVER,
  database: DB_DATABASE,
  options: {
    database: DB_DATABASE
  },
  authentication: {
    type: "default",
    options: {
      userName: DB_USER_NAME,
      password: DB_PASSWORD,
      port: 1433
    }
  }
};

/**
 * Initializes the database connection.
 * 
 * The connection object is created using the config object above. A callback
 * is provided to be fired on the .on('connect') connect event of the connection.
 * After applying the callback, the connection is established using the
 * connection object.
 * 
 */
function init_db() {
  db_connection = new Connection(db_config);

  db_connection.on("connect", err => {
    if (err) {
      console.error(err);
      exit(-1);
    } else {
      init_server(db_connection);
      console.log("Database connected...");
    }
  });

  db_connection.connect();
}


async function init_server(db_connection) {

  //  Creates Hapi server object that uses the port given by environment variable.
  //  if the environment variable doesn't exist, then 8080 is default.
  console.log("starting on port: " + PORT);
  const server = new Hapi.Server({
    port: PORT,
    state: {
      strictHeader: false
    },
    routes: {
      cors: true
    }
  });

  //  Set the url routes that the API will serve.
  set_routes(server, db_connection);

  await server.start();
};

function set_routes(server, db_connection) {

  /**
   * GET requests
   */

  server.route({
    method: 'GET',
    path: '/login/{username}/{password}',
    handler: (request, reply) => {
      return loginUser(request, db_connection)
    }
  });

  server.route({
    method: 'GET',
    path: '/ingredients',
    handler: (request, reply) => {
      return getIngredients(request, db_connection)
    }
  });

  server.route({
    method: 'GET',
    path: '/dob/{user_id}',
    handler: (request, reply) => {
      return getDob(request, db_connection)
    }
  });

  server.route({
    method: 'GET',
    path: '/bars/{user_id}',
    handler: (request, reply) => {
      return getBarsNearUser(request, db_connection)
    }
  });

  server.route({
    method: "GET",
    path: "/updateUserPasswordForm",
    handler: (req, res) => {
      return updateUserPasswordForm()
    }
  });

  server.route({
    method: "GET",
    path: "/updatedob",
    handler: (req, res) => {
      return updateUserDobForm()
    }
  });

  server.route({
    method: "GET",
    path: "/updateCityState",
    handler: (req, res) => {
      return updateUserCityStateForm()
    }
  });

  /**
   * POST requests
   */

  server.route({
    method: "POST",
    path: "/updateUserPassword",
    handler: async (request, resp) => {
      return updateUserPassword(request, db_connection)
    }
  });

  server.route({
    method: "POST",
    path: "/updatedob",
    handler: async (request, resp) => {
      return updateUserDob(request, db_connection)
    }
  });

  server.route({
    method: "POST",
    path: "/updateCityState",
    handler: async (request, resp) => {
      return updateUserCityState(request, db_connection)
    }
  });

  /**
   * This rout catches all routes that have not been appended above.
   */
  server.route({
    method: 'GET',
    path: '/{path*}',
    handler: function (request, reply) {
      return "They have curved swords!";
    }
  });
}

/**
 * Running inid_db will initialize the database and if it succeeds, it will
 * initialize the API server. If it doesn't succeed, NodeJs will exit.
 */
init_db();
