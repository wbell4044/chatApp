import './addChatGroup.css';
import { arrayUnion, collection, doc, getDocs, query, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useState, useEffect } from 'react';
import { useUserStore } from '../../../../lib/userStore';
import { toast } from 'react-toastify';

const AddChatGroup = ({ setAddGroupMode }) => {
    const [input, setInput] = useState('');
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [groupsFound, setGroupsFound] = useState(true);
    const { currentUser, isLoading } = useUserStore(); // Use the user store

    useEffect(() => {
        if (isLoading === false && !currentUser) {
            toast.error("You need to be logged in to create or join a group.");
        }
    }, [isLoading, currentUser]);

    const handleSearch = async () => {
        const groupName = input.trim();

        if (groupName === '') {
            setFilteredGroups([]); // Clear group suggestions if input is empty
            setGroupsFound(true);
            return;
        }

        try {
            const groupRef = collection(db, "groups");
            const q = query(groupRef, where("name", "==", groupName));

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setFilteredGroups(querySnapshot.docs.map(doc => doc.data()));
                setGroupsFound(true);
            } else {
                setFilteredGroups([]);
                setGroupsFound(false);
            }
        } catch (err) {
            console.error("Error searching group:", err);
            toast.error("Error searching group: " + err.message);
        }
    };

    const handleCreateGroup = async () => {
        if (!currentUser) {
            toast.error("You need to be logged in to create a group.");
            return;
        }

        const groupName = input.trim();

        if (groupName === '') {
            toast.warn("Please enter a valid group name");
            return;
        }

        try {
            // Create the new group in Firestore
            const groupRef = doc(collection(db, "groups"));
            await setDoc(groupRef, {
                name: groupName,
                createdAt: serverTimestamp(),
                members: [currentUser.id], // Add current user as the first member
            });

            // Add the group to the current user's list of groups
            const userGroupsRef = doc(db, "usergroups", currentUser.id);
            await setDoc(userGroupsRef, { groups: arrayUnion({ groupId: groupRef.id, name: groupName }) }, { merge: true });

            toast.success("Group created successfully!");
            setAddGroupMode(false); // Close the modal or component
        } catch (err) {
            console.error("Error creating group:", err);
            toast.error("Error creating group: " + err.message);
        }
    };

    const handleJoinGroup = async (group) => {
        if (!currentUser || !group) {
            toast.error("You need to be logged in to join a group.");
            return;
        }

        try {
            // Add the group to the current user's list of groups
            const userGroupsRef = doc(db, "usergroups", currentUser.id);
            await setDoc(userGroupsRef, { groups: arrayUnion({ groupId: group.id, name: group.name }) }, { merge: true });

            // Add the current user to the group's member list
            const groupRef = doc(db, "groups", group.id);
            await setDoc(groupRef, { members: arrayUnion(currentUser.id) }, { merge: true });

            toast.success("You joined the group successfully!");
            setAddGroupMode(false); // Close the modal or component
        } catch (err) {
            console.error("Error joining group:", err);
            toast.error("Error joining group: " + err.message);
        }
    };

    return (
        <div className="addChatGroup">
            <div className="close" onClick={() => setAddGroupMode(false)}>X</div>
            <h2>Add/Join Group</h2>
            <form onSubmit={(e) => e.preventDefault()}>
                <input
                    type="text"
                    placeholder="Group Name"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        handleSearch(); // Trigger search on input change
                    }}
                />
            </form>

            {/* Display groups popup when user starts typing */}
            {input && (
                <div className="groupPopup">
                    {groupsFound ? (
                        filteredGroups.map((group) => (
                            <div key={group.id} className="group">
                                <div className="detail">
                                    <span>{group.name}</span>
                                </div>
                                <button onClick={() => handleJoinGroup(group)}>Join Group</button>
                            </div>
                        ))
                    ) : (
                        <div className="noGroupFound">
                            <p>No group found with this name.</p>
                            <button onClick={handleCreateGroup}>Create New Group</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AddChatGroup;
