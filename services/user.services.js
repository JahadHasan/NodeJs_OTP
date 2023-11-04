const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const auth = require("../middlewares/auth.js");
const axiosRequest = require("axios");
//const axios = require("axios");

// Create an Axios instance
const instance = axiosRequest.create();

const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const key = "verysecretkey"; // Key for cryptograpy. Keep it secret
//var msg91 = require("msg91")("1", "1", "1");

//var nodemailer = require("nodemailer");

// app.post('/send-email', function (req, res) {
//     let transporter = nodeMailer.createTransport({
//         host: 'smtp.gmail.com',
//         port: 465,
//         secure: true,
//         auth: {
//              user: 'yetor8080@gmail.com',
//         pass: 'Samraa214177'
//         }
//     });

async function login({ username, password }, callback) {
  const user = await User.findOne({
    username,
  });

  if (user != null) {
    if (bcrypt.compareSync(password, user.password)) {
      const token = auth.generateAccessToken(username);
      // call toJSON method applied during model instantiation
      return callback(null, {
        ...user.toJSON(),
        token,
      });
    } else {
      return callback({
        message: "Invalid Username/Password!",
      });
    }
  } else {
    return callback({
      message: "Invalid Username/Password!",
    });
  }
}

async function register(params, callback) {
  if (params.username === undefined) {
    console.log(params.username);
    return callback(
      {
        message: "Username Required",
      },
      ""
    );
  }

  const user = new User(params);
  user
    .save()
    .then((response) => {
      return callback(null, response);
    })
    .catch((error) => {
      return callback(error);
    });
}

async function createNewOTP(params, callback) {
  try {
    // Generate a 6 digit numeric OTP
    const otp = otpGenerator.generate(6, {
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });
    const ttl = 15 * 60 * 1000; //15 Minutes in miliseconds
    const expires = Date.now() + ttl; //timestamp to 5 minutes in the future
    const data = `${params.phone}.${otp}.${expires}`; // phone.otp.expiry_timestamp
    const hash = crypto.createHmac("sha256", key).update(data).digest("hex"); // creating SHA256 hash of the data
    const fullHash = `${hash}.${expires}`; // Hash.expires, format to send to the user
    // you have to implement the function to send SMS yourself. For demo purpose. let's assume it's called sendSMS
    // sendSMS(phone, `Your OTP is ${otp}. it will expire in 5 minutes`);

    var myString = `${params.phone}`;
    var myNewString = myString.replace("+", "");
    var otpMessage = `Amin OTP is ${otp}. expires in 15 minutes, your mobile is ${myNewString}.`;

    // let transporter = nodemailer.createTransport({
    //     host: 'smtp.gmail.com',
    //     port: 465,
    //     secure: true,
    //     auth: {
    //         user: 'yetor8080@gmail.com',
    //         pass: 'Samraa214177'
    //     }
    // });
    // let  mailOptions = {
    //     from: 'yetor8080@gmail.com',
    //     to: 'ameenbadri7@gmail.com',
    //     subject: `OTP is ${otp}.`,
    //     text: `${otpMessage}`,
    // };

    // transporter.sendMail(mailOptions, function (error, info) {
    //     if (error) {
    //         console.log(error);
    //     } else {
    //         console.log('Email sent: ' + info.response);
    //         console.log(response);
    //     }
    // });

    console.log(
      `OTP is ${otp}. expires in 15 minutes, your mobile is ${myNewString}`
    );

    /*let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "ameenbadri7@gmail.com",
      pass: "oiawgqjszkxduyhi",
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: "yetor8080@gmail.com",
    to: "ameenbadri7@gmail.com",
    subject: `OTP is ${otp}.`,
    text: `${otpMessage}`,
  });

  console.log("Message sent: %s", info.messageId);
*/

    /*console.log(
      "http://www.ciedco-sms.net/api/sendsms.php?username=souhailsawaf@gmail.com&password=1234567890a&mno=${myNewString}&msg=${otpMessage}&sid=ciedco-sms&fl=0&mt=0"
    );*/
    console.log(
      `http://www.ciedco-sms.net/api/sendsms.php?username=souhailsawaf@gmail.com&password=1234567890a&mno=${myNewString}&msg=${otpMessage}&sid=ciedco-sms&fl=0&mt=0`
    );
    const response = await fetchData(
      `http://www.ciedco-sms.net/api/sendsms.php?username=souhailsawaf@gmail.com&password=1234567890a&mno=${myNewString}&msg=${otpMessage}&sid=ciedco-sms&fl=0&mt=0`
    );
    console.log("Data received:", response);

    //console.log("Message sent: %s", url);

    // msg91.send(`+91${params.phone}`, otpMessage, function (err, response) {

    // });
    return callback(null, fullHash);
  } catch (error) {
    // Handle any errors
    console.error("Error fetching data:", error);
    throw error; // Optionally rethrow to allow the caller to handle
  }
}

async function fetchData(urlData) {
  try {
    const url = urlData;

    const response = await instance.get(url);

    // You can now return the response data
    return response.data;
  } catch (error) {
    // Handle any errors
    console.error("Error fetching data:", error);
    throw error; // Optionally rethrow to allow the caller to handle
  }
}

async function verifyOTP(params, callback) {
  // Separate Hash value and expires from the hash returned from the user

  let [hashValue, expires] = params.hash.split(".");

  // Check if expiry time has passed
  let now = Date.now();
  if (now > parseInt(expires)) return callback("OTP Expired");
  // Calculate new hash with the same key and the same algorithm
  let data = `${params.phone}.${params.otp}.${expires}`;
  let newCalculatedHash = crypto
    .createHmac("sha256", key)
    .update(data)
    .digest("hex");
  // Match the hashes
  if (newCalculatedHash === hashValue) {
    return callback(null, "Success");
  }
  return callback("Invalid OTP");
}

module.exports = {
  login,
  register,
  createNewOTP,
  verifyOTP,
};
