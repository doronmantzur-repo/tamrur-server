"use strict";

const fs = require("fs");
const path = require("path");
const { Sequelize, DataTypes } = require("sequelize");
const { types } = require("pg");

require("dotenv").config();

// `timestamp without time zone` columns (evacuations.start_time/eta/concluded_at,
// and any other column of this type) store naive wall-clock digits with no
// timezone attached. pg's default parser for this type (OID 1114) builds the
// JS Date by interpreting those digits in *this process's* local timezone —
// so the exact same stored value reads back differently depending on where
// the server happens to be running. Every write in this app is already a
// real UTC instant (toISOString()), so reads need to match: append "Z" to
// force UTC interpretation instead of the process-local default.
types.setTypeParser(1114, (value) => (value === null ? null : new Date(`${value}Z`)));

const basename = path.basename(__filename);
const db = {};

// Supabase's Postgres requires SSL; rejectUnauthorized is disabled because
// Supabase uses a certificate chain that Node doesn't trust by default.
const dialectOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions,
      logging: false,
    })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: "postgres",
      dialectOptions,
      logging: false,
    });

fs.readdirSync(__dirname)
  .filter((file) => {
    return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
