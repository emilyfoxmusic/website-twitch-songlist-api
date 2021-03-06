const dynamo = require('../helpers/dynamo');

const configTableName = process.env.configTableName;

const isAdminRequest = (event) => {
  const user = event.requestContext.authorizer.jwt.claims.preferred_username;
  return userIsAdmin(user);
};

const userIsAdmin = async (user) => {
  const config = await dynamo.getIfExists(
    { ConfigKey: 'AdminUsers' },
    configTableName
  );
  const adminUsers = config ? config.ConfigValue.split(',') : [];
  return adminUsers.includes(user);
};

module.exports = {
  isAdminRequest,
  userIsAdmin,
};
