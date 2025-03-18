import './addUser.css';
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useState, useEffect } from 'react';
import { useUserStore } from '../../../../lib/userStore';
import { toast } from 'react-toastify';

const AddUser = ({ setAddMode }) => {
    const [user, setUser] = useState(null);
    const { currentUser, isLoading } = useUserStore(); 

    useEffect(() => {
        if (isLoading === false && !currentUser) {
            toast.error("You need to be logged in to add a user.");
        }
    }, [isLoading, currentUser]);

    const handleSearch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');
        try {
            const userRef = collection(db, "users");
            const q = query(userRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setUser(querySnapshot.docs[0].data());
            } else {
                toast.warn("No user found with this username");
            }
        } catch (err) {
            toast.error(err.code.split('/')[1].split('-').join(' '));
        }
    };

    const handleAdd = async () => {        
        if (!user || !currentUser) {
            toast.error("You need to be logged in to add a user.");
            return;
        }        
        if (user.id === currentUser.id) {
            toast.warn("You cannot add yourself.");
            return;
        }
        
        const userChatsRef = doc(db, "userchats", currentUser.id);
        const userChatsSnap = await getDoc(userChatsRef);

        try {            
            if (!userChatsSnap.exists()) {
                await setDoc(userChatsRef, {
                    chats: [],
                });
            }

            const userChatsData = userChatsSnap.data();            
            const userAlreadyAdded = Array.isArray(userChatsData.chats) && userChatsData.chats.some(chat => chat.receiverId === user.id);

            if (userAlreadyAdded) {
                toast.warn("User already added");
                return;
            }
            
            if (Array.isArray(user.blocked) && user.blocked.includes(currentUser.id)) {
                toast.warn("You are blocked by this user.");
                return;
            }
            
            const chatRef = doc(collection(db, "chats"));
            await setDoc(chatRef, {
                createdAt: serverTimestamp(),
                messages: [],
            });
            
            await updateDoc(userChatsRef, {
                chats: arrayUnion({
                    chatId: chatRef.id,
                    lastMessage: "",
                    receiverId: user.id,
                    updatedAt: Date.now(),
                }),
            });
            
            await updateDoc(doc(db, "userchats", user.id), {
                chats: arrayUnion({
                    chatId: chatRef.id,
                    lastMessage: "",
                    receiverId: currentUser.id,
                    updatedAt: Date.now(),
                }),
            });

            toast.success("User added successfully");
            setUser(null);
            setAddMode(false);  
        } catch (err) {
            toast.error(err.code ? err.code.split('/')[1].split('-').join(' ') : 'An error occurred');
        }
    };

    return (
        <div className="addUser">
            <div className="close" onClick={() => setAddMode(false)}>X</div>
            <h2>Add User</h2>
            <form onSubmit={handleSearch}>
                <input type="text" placeholder="Username" name="username" />
                <button>Search</button>
            </form>
            <div className="listUsers">
                {user && (
                    <div className="users">
                        <div className="addd-detail">
                            <img src={user.avatar || "./avatar.png"} alt="" />
                            <span>{user.username}</span>
                        </div>
                        <button onClick={handleAdd}>Add user</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddUser;