const express = require("express");
const VendorsRouter = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("./Db/db");
const jwt = require("jsonwebtoken");
const { promisify } = require('util');
const verifyAsync = promisify(jwt.verify);
const secretKey = 'safarnama';

