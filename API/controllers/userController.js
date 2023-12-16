import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import Specialist from '../models/specialistModel.js';
import Customer from '../models/customerModel.js'

const getAllUser = asyncHandler(async (req, res) => {
  const results = await User.find();
  return res.json(results);
});

// @desc    Auth user & get token
// @route   POST /api/users/auth
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  // Get values - destructure
  const { email, password } = req.body;

  let specialist;
  let customer;
  let user;

  if (email) {
    specialist = await Specialist.findOne({ email });
    customer = await Customer.findOne({ email });
    user = await User.findOne({ email });
  }

  if (specialist && (await specialist.matchPassword(password))) {
    generateToken(res, specialist._id);
    res.json(specialist);
  } else if (customer && (await customer.matchPassword(password))) {
    generateToken(res, customer._id);
    res.json(customer);
  } else if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);
    res.json(user);
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});


// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('UserName already exists');
  }

  const user = await User.create({
    userName,
    email,
    password,
  });

  if (user) {
    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      userName: user.userName,
      email: user.email,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  try {
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to logout' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      userName: user.userName,
      email: user.email,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.userName = req.body.userName || user.userName;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      userName: updatedUser.userName,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export {
  getAllUser,
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
};