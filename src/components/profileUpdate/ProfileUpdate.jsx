import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [uid, setUid] = useState('');
  const [prevImage, setPrevImage] = useState('');

  const profileUpdate = async (e) => {
    e.preventDefault();
    try {      
      if (!image && !prevImage) {
        toast.error('Please upload a profile picture');
        return;
      }

      const docref = doc(db, 'users', uid);
      if (image) {        
        const imgUrl = await upload(image);
        await updateDoc(docref, {
          username: name,
          bio,
          avatar: imgUrl,
        });
      } else {        
        await updateDoc(docref, {
          username: name,
          bio,
        });
      }
      toast.success('Profile updated successfully!');      
      navigate('/chat');     
      window.location.reload();
    } catch (err) {
      toast.error('Error updating profile!');
      console.error(err);
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid); 
        const docref = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docref);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.username) setName(data.username);
          if (data.bio) setBio(data.bio);
          if (data.avatar) setPrevImage(data.avatar);
        }
      } else {
        navigate('/');
      }
    });
  }, [navigate]);

  return (
    <div className="profile">
      <div className="profile-container">
        <form onSubmit={profileUpdate}>
          <h3>Profile Details</h3>
          <label htmlFor="avatar">
            <input
              onChange={(e) => setImage(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <img
              src={image ? URL.createObjectURL(image) : prevImage || './avatar.png'}
              alt="Profile Picture"
            />
            Upload Profile Picture
          </label>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            placeholder="Your Username"
            required
          />
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write Profile Bio"
            required
          ></textarea>
          <button type="submit">Save Changes</button>
        </form>
        <img
          className="profile-pic"
          src={image ? URL.createObjectURL(image) : prevImage || './avatar.png'}
          alt="Profile Picture"
        />                
      </div>
    </div>
  );
};

export default ProfileUpdate;