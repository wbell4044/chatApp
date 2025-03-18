import './addChatGroup.css';
import { arrayUnion, collection, doc, getDocs, query, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useState, useEffect } from 'react';
import { useUserStore } from '../../../../lib/userStore';
import { toast } from 'react-toastify';

const AddChatGroup = ({ setAddGroupMode }) => {
    const [group, setGroup] = useState(null);
    const [input, setInput] = useState('');
    const { currentUser, isLoading } = useUserStore(); // Use the user store

    useEffect(() => {
        if (isLoading === false && !currentUser) {
            toast.error("You need to be logged in to create a group.");
        }
    }, [isLoading, currentUser]);

    const handleSearch = async (e) => {
        e.preventDefault();
        const groupName = input.trim();

        if (groupName === '') {
            toast.warn("Please enter a group name");
            return;
        }

        try {
            const groupRef = collection(db, "groups");
            const q = query(groupRef, where("name", "==", groupName));

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setGroup(querySnapshot.docs[0].data());
            } else {
                toast.warn("No group found with this name, you can create a new one.");
                setGroup(null);
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

        try {
            const groupRef = doc(collection(db, "groups"));
            await setDoc(groupRef, {
                name: input,
                createdAt: serverTimestamp(),
                members: [currentUser.id], // Add current user as the first member
            });

            // Add the group to the current user's list of groups
            const userGroupsRef = doc(db, "usergroups", currentUser.id);
            await setDoc(userGroupsRef, { groups: arrayUnion({ groupId: groupRef.id, name: input }) }, { merge: true });

            toast.success("Group created successfully!");
            setAddGroupMode(false); // Close the modal or component
        } catch (err) {
            console.error("Error creating group:", err);
            toast.error("Error creating group: " + err.message);
        }
    };

    const handleJoinGroup = async () => {
        if (!currentUser || !group) {
            toast.error("You need to be logged in to join a group.");
            return;
        }

        try {
            const userGroupsRef = doc(db, "usergroups", currentUser.id);
            await setDoc(userGroupsRef, { groups: arrayUnion({ groupId: group.id, name: group.name }) }, { merge: true });

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
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Group Name"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit">Search</button>
            </form>

            <div className="groupResult">
                {group && (
                    <div className="group">
                        <div className="detail">
                            <span>{group.name}</span>
                        </div>
                        <button onClick={handleJoinGroup}>Join Group</button>
                    </div>
                )}
                {!group && input && (
                    <div className="noGroupFound">
                        <p>No group found with this name.</p>
                        <button onClick={handleCreateGroup}>Create New Group</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddChatGroup;