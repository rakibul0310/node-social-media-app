const List = require('../../models/List');
const jwt_decode = require('jwt-decode');
const response = require('../../helpers/response');

// create a List
exports.createList = async (req, res) => {
  try {
    const { list_name } = req.body;
    const { user_id } = jwt_decode(req.headers.authorization);
    const list = new List({
      user: user_id,
      list_name,
      contacts: [],
    });
    await list.save();
    response.success(res, list, 'List created successfully', 201);
  } catch (err) {
    response.error(res, err, 'Error creating list');
  }
};

// get all lists
exports.getAllLists = async (req, res) => {
  try {
    const { user_id } = jwt_decode(req.headers.authorization);
    const lists = await List.find({ user: user_id }).populate('contacts');
    response.success(res, lists, 'Lists retrieved successfully');
  } catch (err) {
    response.error(res, err, 'Error retrieving lists');
  }
};

// get a single list
exports.getList = async (req, res) => {
  try {
    const { id } = req.params;
    const list = await List.findById(id).populate('contacts');
    response.success(res, list, 'List retrieved successfully');
  } catch (err) {
    response.error(res, err, 'Error retrieving list');
  }
};

// add a contact to a list
exports.addContactToList = async (req, res) => {
  try {
    const { contact_id } = req.body;
    const { id } = req.params;
    const list = await List.findById(id).populate('contacts');
    list.contacts.push(contact_id);
    await list.save();
    response.success(res, list, 'Contact added to list successfully');
  } catch (err) {
    response.error(res, err, 'Error adding contact to list');
  }
};

// remove a contact from a list
exports.removeContactFromList = async (req, res) => {
  try {
    const { contact_id } = req.body;
    const { id } = req.params;
    const list = await List.findOneAndUpdate(
      { _id: id },
      { $pull: { contacts: contact_id } },
      { new: true },
    ).populate('contacts');
    response.success(res, list, 'Contact removed from list successfully');
  } catch (err) {
    response.error(res, err, 'Error removing contact from list');
  }
};
