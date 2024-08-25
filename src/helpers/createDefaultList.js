const List = require('../models/List');

const createDefaultList = async id => {
  const existingFamilyList = await List.findOne({
    user: id,
    list_name: 'Family',
  });
  const existingFriendsList = await List.findOne({
    user: id,
    list_name: 'Friends',
  });
  const existingWorkList = await List.findOne({ user: id, list_name: 'Work' });

  if (!existingFamilyList) {
    const familyList = new List({
      user: id,
      list_name: 'Family',
      contacts: [],
    });
    await familyList.save();
  }

  if (!existingFriendsList) {
    const friendsList = new List({
      user: id,
      list_name: 'Friends',
      contacts: [],
    });
    await friendsList.save();
  }

  if (!existingWorkList) {
    const workList = new List({
      user: id,
      list_name: 'Work',
      contacts: [],
    });
    await workList.save();
  }
};

module.exports = createDefaultList;
