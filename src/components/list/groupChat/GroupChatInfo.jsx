import { useState, useEffect } from 'react';
import './groupChatInfo.css';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import { useGroupChatStore } from '../../../lib/GroupChatStore';

const GroupChatInfo = () => {
  const [input, setInput] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [groups, setGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const { changeGroupChat } = useGroupChatStore();
  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              id: user.uid,
              username: userData.username,
              avatar: userData.avatar,
            });
          } else {
            toast.error('User data not found');
          }
        } catch (err) {
          toast.error('Error fetching user data: ' + err.message);
        }
      }
    };
    fetchCurrentUser();
  }, [user]);

  // Fetch groups from Firestore with real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const groupsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setGroups(groupsList); // Update groups list in state
    });
    return () => unsubscribe(); // Cleanup listener
  }, []);

  const filteredGroups = groups.filter((group) =>
    group.groupname && group.groupname.toLowerCase().includes(input.toLowerCase())
  );

  const handleSearchInput = (e) => {
    setInput(e.target.value);
    setAddMode(e.target.value ? true : false);
  };

  const handleCreateGroup = async () => {
    try {
      const newGroupRef = await addDoc(collection(db, 'groups'), {
        groupname: input,
        createdAt: serverTimestamp(),
        creatorId: currentUser.id,
        creator: currentUser.username,
        memberIds: [currentUser.id],
        members: [currentUser.username],
      });
      toast.success('Group created successfully!');
      setInput('');
    } catch (err) {
      toast.error('Error creating group: ' + err.message);
    }
  };

  const isUserInGroup = (group) => {
    return group.members && group.members.includes(currentUser?.username);
  };

  const handleJoinLeaveGroup = async (group) => {
    if (!currentUser) return;

    try {
      const groupRef = doc(db, 'groups', group.id);
      const groupDoc = await getDoc(groupRef);

      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        let updatedMembers = groupData.members; // Array of usernames
        let updatedMemberIds = groupData.memberIds; // Array of user IDs

        if (isUserInGroup(group)) {
          updatedMembers = updatedMembers.filter((member) => member !== currentUser.username);
          updatedMemberIds = updatedMemberIds.filter((id) => id !== currentUser.id);

          if (updatedMembers.length === 0) {
            await deleteDoc(groupRef);
            toast.success('Group has been deleted as it no longer has any members.');
          } else {
            await updateDoc(groupRef, {
              members: updatedMembers,
              memberIds: updatedMemberIds,
            });
            toast.success('You have successfully left the group!');
          }
        } else {
          updatedMembers.push(currentUser.username);
          updatedMemberIds.push(currentUser.id);

          await updateDoc(groupRef, {
            members: updatedMembers,
            memberIds: updatedMemberIds,
          });
          toast.success('You have successfully joined the group!');
        }
      }
    } catch (err) {
      toast.error('Error with group: ' + err.message);
    }
  };

  const handleSelectGroup = (group) => {
    changeGroupChat(group.id); // Update store with selected group

    const isUserInSelectedGroup = group.members.includes(currentUser?.username);
    useGroupChatStore.getState().setInGroupChat(isUserInSelectedGroup);
  };

  return (
    <div className='group-chat-info'>
      <div className='search'>
        <div className='searchBar'>
          <img src='./search.png' alt='Search Icon' />
          <input
            type='text'
            placeholder='Search Groups'
            value={input}
            onChange={handleSearchInput}
          />
        </div>
        <img
          src={addMode ? './minus.png' : './plus.png'}
          alt='Add Icon'
          className='add'
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {addMode && (
        <div className='popup'>
          <button className='close-button' onClick={() => setAddMode(false)}>&times;</button>
          <h3>Groups</h3>
          <div className='search-bar'>
            <input
              type='text'
              placeholder='Search Groups'
              value={input}
              onChange={handleSearchInput}
            />
            {filteredGroups.length > 0 ? (
              <button>Search</button>
            ) : (
              <button onClick={handleCreateGroup}>Create</button>
            )}
          </div>
          {filteredGroups.length > 0 ? (
            <ul className="dropdown">
              {filteredGroups.map((group) => (
                <li
                  key={group.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center', // Ensures avatar, name, and button are vertically aligned
                    pointerEvents: isUserInGroup(group) ? 'auto' : 'none',
                    cursor: isUserInGroup(group) ? 'default' : 'not-allowed',
                  }}
                >
                  {/* Group Avatar and Name Container */}
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    {/* Group Avatar */}
                    <img
                      src={group.groupAvatar || './avatar.png'}
                      alt="Group Avatar"
                      style={{
                        width: '30px',  // Avatar size
                        height: '30px',
                        borderRadius: '50%',  // Make the avatar circular
                        marginRight: '10px',  // 10px space between avatar and group name
                      }}
                    />
                    {/* Group Name */}
                    <span
                      onClick={() => {
                        if (isUserInGroup(group)) {
                          handleSelectGroup(group);
                        }
                      }}
                      style={{
                        color: isUserInGroup(group) ? 'green' : 'red',
                        cursor: isUserInGroup(group) ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {group.groupname}
                    </span>
                  </div>

                  {/* Join/Leave Button on the right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the li onClick
                      handleJoinLeaveGroup(group);
                    }}
                    style={{
                      backgroundColor: isUserInGroup(group) ? 'green' : 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                    }}
                  >
                    {isUserInGroup(group) ? 'Leave' : 'Join'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No groups found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupChatInfo;