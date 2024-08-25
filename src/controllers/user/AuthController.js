const config = require('config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const transporter = require('../../helpers/nodemailer');
const crypter = require('../../helpers/crypter');
const sendSms = require('../../helpers/sendSms');
const { User } = require('../../models/User');
const { Otp } = require('../../models/Otp');
const response = require('../../helpers/response');
const { Country } = require('../../models/Country');
const axios = require('axios');
const checkOtpRateLimit = require('../../helpers/checkOtpRateLimit');
const checkUserSuspension = require('../../helpers/checkUserSuspension');
const createDefaultList = require('../../helpers/createDefaultList');

const url = config.get('APP_URL');
const api = config.get('API_URL');

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
    const getIp = await axios.get(`https://ipapi.co/${clientIp}/json/`);
    let countryCode = getIp.data?.country_code || 'US';

    // Check if country is blocked or not
    const countryCheck = await Country.findOne({
      code: countryCode,
    });
    if (countryCheck?._id && countryCheck.status === false) {
      return response.error(res, {}, 'Country Blocked!', 400);
    }

    if (!countryCheck?._id) {
      return response.error(res, {}, 'Invalid Country!', 400);
    }
    return response.success(
      res,
      countryCheck,
      'Country found successfully.',
      200,
    );
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

// send otp
exports.sendOtp = async (req, res) => {
  const { countryCode, number } = req.body;
  const phoneNumber = countryCode + number;

  // find out all otps with this phoneNumber the latest one first
  const existingOtps = await Otp.find({ number: phoneNumber }).sort({
    createdAt: -1,
  });

  if (existingOtps.length > 0) {
    if (!checkOtpRateLimit(existingOtps?.length, existingOtps[0]?.created_at)) {
      return response.error(
        res,
        {},
        'You have reached the maximum limit of OTPs. Please try again later.',
        400,
      );
    }
  }

  // create otp
  const otpNumber = Math.floor(Math.random() * 999999);
  const otp = new Otp({
    number: phoneNumber,
    otp: otpNumber,
    expire_at: new Date(new Date().getTime() + 60 * 5000),
  });
  // save otp to db
  await otp.save();

  // send otp sms
  sendSms(
    phoneNumber,
    `Your OTP is: ${otpNumber}. This OTP is valid for 5 minutes`,
  );

  return response.success(
    res,
    {
      phoneNumber,
    },
    'OTP has been sent to your phone.',
    201,
  );
};

exports.login = async (req, res) => {
  try {
    const { iso, countryCode, number, otp } = req.body;

    const phoneNumber = countryCode + number;

    // Validating OTP
    const otpData = await Otp.findOne({ otp, number: phoneNumber });

    if (!otpData?._id || otpData.number !== phoneNumber) {
      return response.error(res, {}, 'Invalid OTP.', 400);
    }

    // check user
    const user = await User.findOneAndUpdate(
      { number: phoneNumber },
      {
        iso,
        number: phoneNumber,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    await createDefaultList(user._id);

    if (!user?._id) {
      return response.error(res, {}, 'Authentication Field!', 401);
    }

    if (!checkUserSuspension(user?.suspension_expire)) {
      return response.error(res, {}, 'User Suspended!', 400);
    }

    // generate a token
    const token = jwt.sign(
      {
        user_id: user.id,
        number: user.number,
        iso: user.iso,
      },
      process.env.JWT_SECRET,
      { expiresIn: '99y' },
    );

    return response.success(
      res,
      {
        user,
        token,
      },
      'Login Successfully!',
      200,
    );
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.verifyByLink = async (req, res) => {
  try {
    const { u, otp } = req.query;

    const decodeEmail = crypter.decrypt(u);
    const decodeOtp = crypter.decrypt(otp);

    // Validating User
    const user = await User.findOne({ email: decodeEmail });
    if (!user) {
      return res.send('<h2 style="text-align:center;">Invalid User</h2>');
    }
    if (user.isVerified) {
      return res.send(
        '<h2 style="text-align:center;">User Already Verified</h2>',
      );
    }

    // Validating OTP
    const otpData = await Otp.findOne({ otp: decodeOtp, user_id: user.id });
    if (!otpData || otpData.user_id.toString() !== user.id.toString()) {
      return res.send('<h2 style="text-align:center;">Invalid OTP</h2>');
    }
    if (otpData.expire_at < new Date().getTime()) {
      return res.send(
        '<h2 style="text-align:center;">The link is expired.</h2>',
      );
    }

    // Update User
    await User.findOneAndUpdate(
      { email: decodeEmail },
      { isVerified: true },
      { new: true },
    );

    // Delete OTP
    await Otp.findOneAndDelete({ otp: decodeOtp, user_id: user.id });

    return res.send(
      '<h2 style="text-align:center;">Your account is verified successfully. Please login to continue.</h2>',
    );
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.verifyByOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Validating User
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return response.error(res, {}, 'Invalid User', 400);
    }
    if (user.isVerified) {
      return response.error(res, {}, 'User Already Verified', 400);
    }

    // Validating OTP
    const otpData = await Otp.findOne({ otp, user_id: user.id });
    if (!otpData || otpData.user_id.toString() !== user.id.toString()) {
      return response.error(res, {}, 'Invalid OTP.', 400);
    }
    if (otpData.expire_at < new Date().getTime()) {
      return response.error(res, {}, 'OTP is expired.', 400);
    }

    // Update User
    await User.findOneAndUpdate(
      { _id: userId },
      { isVerified: true },
      { new: true },
    );

    // Delete OTP
    await Otp.findOneAndDelete({ otp, user_id: user.id });

    // generate a token
    const token = jwt.sign(
      {
        user_id: user.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '99y' },
    );

    return response.success(
      res,
      {
        user: {
          userId: user.id,
          phoneNumber: user.phoneNumber,
        },
        token,
      },
      'Your account is verified successfully.',
      200,
    );
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.verifyResend = async (req, res) => {
  try {
    const { email } = req.body;

    // Validating User
    const user = await User.findOne({ email });
    if (!user) {
      return response.error(
        res,
        {},
        "You don't have any user ID please register.",
        400,
      );
    }
    if (user.isVerified === true) {
      return response.error(res, {}, 'You are already verified.', 400);
    }

    // generate Otp
    const otpNumber = Math.floor(Math.random() * 9999);

    // update otp and save to db
    await Otp.findOneAndUpdate(
      { user_id: user.id },
      { otp: otpNumber, expire_at: new Date(new Date().getTime() + 60 * 5000) },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

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

    return response.success(
      res,
      {},
      'Otp was sent to your email. Please verify your email to activate your account.',
      200,
    );
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validating User
    const user = await User.findOne({ email });
    if (!user) {
      return response.error(res, {}, "You don't have any user ID.", 400);
    }

    // generate Otp
    const otpNumber = Math.floor(Math.random() * 9999);

    // update otp and save to db
    await Otp.findOneAndUpdate(
      { user_id: user.id },
      { otp: otpNumber, expire_at: new Date(new Date().getTime() + 60 * 5000) },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    // create email
    const mailOptions = {
      from: 'noreplay@galileobox.com',
      to: `${user.email}`,
      subject: 'OTP from GalileoBox',
      text: `Your OTP is: ${otpNumber} This OTP is valid for 5 minutes.`,
    };

    // send email
    transporter.sendMail(mailOptions, error => {
      if (error) {
        return res.status(500).json({ error });
      }
    });

    return response.success(
      res,
      {},
      'OTP was sent to your email. Do not share this OTP with anyone.',
      200,
    );
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    // Validating User
    const user = await User.findOne({ email });
    if (!user) {
      return response.error(res, {}, "You don't have any user ID.", 400);
    }

    // Validating OTP
    const otpData = await Otp.findOne({ otp, user_id: user.id });
    if (!otpData || otpData.user_id.toString() !== user.id.toString()) {
      return response.error(res, {}, 'Invalid OTP.', 400);
    }
    if (otpData.expire_at < new Date().getTime()) {
      return response.error(res, {}, 'OTP is expired.', 400);
    }

    // Update User
    await User.findOneAndUpdate(
      { email },
      { password: bcrypt.hashSync(password, 10) },
      { new: true },
    );

    // Delete OTP
    await Otp.findOneAndDelete({ otp, user_id: user.id });

    return response.success(res, {}, 'Password updated successfully.', 200);
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};
