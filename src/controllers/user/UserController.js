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
const { ReportedUser } = require('../../models/ReportedUser');
const { BlockedUser } = require('../../models/BlockedUser');
const csvtojsonV2 = require('csvtojson/v2');
const { Contact } = require('../../models/Contact');

const url = config.get('APP_URL');
const api = config.get('API_URL');

// Link email to account
exports.linkEmail = async (req, res) => {};

// report an user
exports.reportUser = async (req, res) => {
  try {
    const { user_id: reported_by } = jwt_decode(req.headers.authorization);
    const { user_id, reason } = req.body;

    // Validating User
    const reportingUser = await User.findOne({ _id: user_id });
    const user = await User.findOne({ _id: reported_by });
    if (!user || !reportingUser) {
      return response.error(res, {}, 'Invalid User!', 401);
    }

    // Report User
    const reported = new ReportedUser({
      user: user_id,
      reported_by,
      reason,
    });
    await reported.save();

    return response.success(res, reported, 'User reported successfully.', 201);
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

// block an user
exports.blockUser = async (req, res) => {
  try {
    const { user_id } = jwt_decode(req.headers.authorization);
    const { blocked_user } = req.body;

    // Validating User
    const user = await User.findOne({ _id: user_id });
    const blockingUser = await User.findOne({ _id: blocked_user });
    if (!user || !blockingUser) {
      return response.error(res, {}, 'Invalid User!', 401);
    }

    // Block User
    const blocked = await BlockedUser.findOneAndUpdate(
      {
        user: user_id,
      },
      {
        $push: {
          blocked_user: blocked_user,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    return response.success(res, blocked, 'User blocked successfully.', 201);
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

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
exports.blockCountry = async (req, res) => {
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

// upload contact list
exports.uploadContactList = async (req, res) => {
  try {
    const file = req.file?.path;
    const { user_id } = jwt_decode(req.headers.authorization);
    if (!file) {
      return response.error(res, {}, 'File not found.', 404);
    }
    const contactArray = await csvtojsonV2().fromFile(file);
    if (contactArray?.length <= 0 && !contactArray[0]?.number) {
      return response.error(res, {}, 'Invalid file format.', 400);
    }

    await Promise.all(
      contactArray.map(async contact => {
        const user = await User.findOne({ number: contact.number });
        // if user already exist in the requester contact list then skip to the next loop
        const isContactExist = await Contact.findOne({
          $and: [{ user: user_id }, { recipient: user?._id }],
        });
        if (isContactExist?._id) {
          return;
        }
        if (
          user?._id &&
          user_id !== user?._id.toString() &&
          user?.type === 'private'
        ) {
          const currentUserContact = await Contact.findOne({
            $and: [{ user: user?._id }, { recipient: user_id }],
          });
          if (currentUserContact?._id) {
            await Contact.create({
              user: user_id,
              recipient: user?._id,
              status: true,
            });
            await Contact.findOneAndUpdate(
              { _id: currentUserContact?._id },
              { status: true },
              { new: true },
            );
          } else {
            await Contact.create({
              user: user_id,
              recipient: user?._id,
              status: false,
            });
          }
        }
        if (
          user?._id &&
          user_id !== user?._id.toString() &&
          user?.type === 'public'
        ) {
          await Contact.create({
            user: user_id,
            recipient: user?._id,
            status: true,
          });
        }
      }),
    );

    const allContacts = await Contact.find({ user: user_id })
      .populate('user')
      .populate('recipient');

    return response.success(
      res,
      allContacts,
      'File uploaded successfully.',
      200,
    );
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};
