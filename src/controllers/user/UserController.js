const path = require('path');
const fs = require('fs');
const config = require('config');
const jwt_decode = require('jwt-decode');
const bcrypt = require('bcryptjs');
const transporter = require('../../helpers/nodemailer');
const crypter = require('../../helpers/crypter');
const { User } = require('../../models/User');
const { Otp } = require('../../models/Otp');
const { Country } = require('../../models/Country');
const { BlockedCountry } = require('../../models/BlockedCountry');
const response = require('../../helpers/response');

const url = config.get('APP_URL');
const api = config.get('API_URL');

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validating User
    const user = await User.findOne({ email });
    if (!user) {
      return response.error(res, {}, 'Invalid User!', 401);
    }

    // Validating OTP
    const otpData = await Otp.findOne({ otp, user_id: user.id });
    if (!otpData || otpData.user_id.toString() !== user.id.toString()) {
      return response.error(res, {}, 'Invalid OTP!', 400);
    }
    if (otpData.expire_at < new Date().getTime()) {
      return response.error(res, {}, 'OTP Expired!', 400);
    }

    return response.success(res, {}, 'OTP verified successfully.', 200);
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

// Verify Password
exports.verifyPassword = async (req, res) => {
  try {
    const { user_id } = jwt_decode(req.headers.authorization);
    const { password } = req.body;

    // Validating User
    const user = await User.findOne({ user_id }).select('+password');
    if (!user) {
      return response.error(res, {}, 'Invalid User!', 401);
    }

    // Validating Password
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (user && !isValidPassword) {
      return response.error(res, {}, 'Invalid Password!', 400);
    }

    return response.success(res, {}, 'Password verified successfully.', 200);
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

// User Profile Update
exports.profileUpdate = async (req, res) => {
  try {
    const { user_id } = jwt_decode(req.headers.authorization);

    // Validating User
    const user = await User.findOne({ _id: user_id });
    if (!user) {
      return response.error(res, {}, 'Invalid User!', 401);
    }

    // Update User
    const updatedUser = await User.findOneAndUpdate(
      { _id: user_id },
      { name: req.body.name },
      { new: true },
    );

    return response.success(
      res,
      updatedUser,
      'Profile updated successfully.',
      200,
    );
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

// User Email Update
exports.emailUpdate = async (req, res) => {
  try {
    const { user_id } = jwt_decode(req.headers.authorization);

    // Validating User
    const user = await User.findOne({ _id: user_id });
    if (!user) {
      return response.error(res, {}, 'Invalid User!', 401);
    }

    // is email exist
    const isEmailExist = await User.findOne({ email: req.body.email });
    if (isEmailExist) {
      return response.error(
        res,
        {},
        'Account with this email already exists!',
        400,
      );
    }

    const otpNumber = Math.floor(Math.random() * 99999);
    const otp = new Otp({
      user_id: user.id,
      otp: otpNumber,
      expire_at: new Date(new Date().getTime() + 60 * 5000),
    });
    // save otp to db
    await otp.save();

    // create email
    const mailOptions = {
      from: 'noreplay@galileobox.com',
      to: `${user.email}`,
      subject: 'OTP from GalileoBox',
      text: `Your OTP is: ${otpNumber} This OTP is valid for 5 minutes.
            Or go to this link to verify your account: 
            ${url + api}/user/auth/verify?u=${crypter.encrypt(
        user.email,
      )}&otp=${crypter.encrypt(otpNumber)}`,
    };

    // send email
    transporter.sendMail(mailOptions, error => {
      if (error) {
        return res.status(500).json({ error });
      }
    });

    // Update User
    const updatedEmail = await User.findOneAndUpdate(
      { _id: user_id },
      { email: req.body.email, isVerified: false },
      { new: true },
    );

    return response.success(
      res,
      updatedEmail,
      'The OTP was sent to you new email.',
      200,
    );
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

// User Change Password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { user_id } = jwt_decode(req.headers.authorization);

    // Validating User
    const user = await User.findOne({ _id: user_id }).select('+password');
    if (!user) {
      return response.error(res, {}, 'Invalid User!', 401);
    }

    // Validating Password
    const isValidPassword = bcrypt.compareSync(oldPassword, user.password);
    if (!isValidPassword) {
      return response.error(res, {}, 'Invalid old password!', 400);
    }

    // Update User
    await User.findOneAndUpdate(
      { _id: user_id },
      { password: newPassword },
      { new: true },
    );

    return response.success(res, {}, 'Password updated successfully.', 200);
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

// User Country (Based on REQUEST)
exports.userCountry = async (req, res) => {
  try {
    // Get User IP from Request Body
    let clientIp = '';
    if (req.headers['x-forwarded-for']) {
      clientIp = req.headers['x-forwarded-for'].split(',').shift().trim();
    } else if (
      req.socket &&
      req.socket.remoteAddress &&
      req.socket.remoteAddress !== '::1'
    ) {
      clientIp = req.socket.remoteAddress;
    } else {
      clientIp = req.ip; // IP from ExpressJS using `app.set("trust proxy", true);`
    }

    // Get Country from IP
    const response = await axios.get(`https://ipapi.co/${clientIp}/json/`);
    let countryCode = response.data?.country_code || 'US';

    // Check if country is blocked or not
    const blockedCountryCheck = await BlockedCountry.findOne({
      code: countryCode,
    });
    if (blockedCountryCheck?._id) {
      return response.error(res, {}, 'Country Blocked!', 400);
    }

    // Find country details
    const country = await Country.findOne({ code: countryCode });
    if (!country?._id) {
      return response.error(res, {}, 'Invalid Country!', 400);
    }
    return response.success(res, country, 'Country found successfully.', 200);
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

// Update countries data to database
exports.updateCountries = async (req, res) => {
  const filePath = path.join(
    __dirname,
    '../../../',
    'config',
    'countries.json',
  );

  const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  try {
    await Country.insertMany(jsonData);
    return response.success(
      res,
      {},
      'Country data inserted successfully.',
      200,
    );
  } catch (err) {
    return response.error(
      res,
      err,
      'Error inserting country data.',
      err.status || 500,
    );
  }
};

// Add Blocked Country
exports.addBlockedCountry = async (req, res) => {
  try {
    const { name, dial_code, code } = req.body;
    const blockedCountry = new BlockedCountry({
      name,
      dial_code,
      code,
    });
    await blockedCountry.save();
    return response.success(res, blockedCountry, 'Country blocked.', 201);
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};
