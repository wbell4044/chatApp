import { useState } from 'react';
import './login.css';
import { toast } from 'react-toastify';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db, googleProvider } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import upload from '../../lib/upload';

const Login = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });
  const [loading, setLoading] = useState(false);

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      toast.error(err.code.split('/')[1].split('-').join(' '));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      const userData = {
        username,
        email,
        avatar: null,
        id: res.user.uid,
        bio: "Hey there! I am using Chat App.",
        blocked: [],
        status: 'online',
      };
      await setDoc(doc(db, "users", res.user.uid), userData);

      if (avatar.file) {
        const imgUrl = await upload(avatar.file);
        await setDoc(doc(db, "users", res.user.uid), {
          ...userData,
          avatar: imgUrl,
        }, { merge: true });
      }

      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });

      toast.success("Account created!");
    } catch (err) {
      toast.error(err.code.split('/')[1].split('-').join(' '));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {      
      await signOut(auth);      
      googleProvider.setCustomParameters({
        prompt: 'select_account',
      });

      // Trigger Google sign-in
      const res = await signInWithPopup(auth, googleProvider);      
      const user = res.user;
      const userData = {
        username: user.displayName,
        email: user.email,
        avatar: user.photoURL,
        id: user.uid,
        bio: "Hey there! I am using Chat App.",
        blocked: [],
        status: 'online',
      };
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        await setDoc(userDocRef, userData);
      }

      toast.success("Signed in with Google!", { autoClose: 3000 });
    } catch (err) {
      toast.error("Google login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="item">
        <h2>Welcome back</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Email" name="email" required />
          <input type="password" placeholder="Password" name="password" required />
          <button disabled={loading}>{loading ? "Loading" : "Sign In with Email"}</button>
          {/* Google Sign In Button */}
      <div className="google-login">
        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#4285F4",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src="./google.png"
            alt="Google Logo"
            style={{ width: "20px", height: "20px", marginRight: "10px" }}
          />
          Sign in with Google
        </button>
      </div>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url || "./avatar.png"} alt="" />
            Upload an image
            <input type="file" id="file" style={{ display: 'none' }} onChange={handleAvatar} />
          </label>
          <input type="text" placeholder="Username" name="username" required />
          <input type="text" placeholder="Email" name="email" required />
          <input type="password" placeholder="Password" name="password" required />
          <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
        </form>
      </div>      
    </div>
  );
};

export default Login;

  /*
  The  Login  component is a functional component that handles user login and registration. It contains two sections: one for login and the other for registration. The user can either sign in with their email and password or create a new account. 
  The  handleLogin  function is responsible for logging in the user. It extracts the email and password from the form data and uses the  signInWithEmailAndPassword  function from Firebase Authentication to authenticate the user. If the login is successful, the user is redirected to the chat page. 
  The  handleRegister  function is responsible for registering a new user. It extracts the username, email, and password from the form data and creates a new user account using the  createUserWithEmailAndPassword  function from Firebase Authentication. It then saves the user data in Firestore, including the user's username, email, avatar, bio, and last seen timestamp. If an avatar image is uploaded, it is stored in Firebase Storage, and the URL is saved in Firestore. 
  The  handleAvatar  function is called when the user selects an avatar image. It updates the  avatar  state with the selected file and URL. 
  The  Login  component renders two forms: one for login and the other for registration. The user can upload an avatar image during registration. 
  The  Login  component uses the  toast  function from the  react-toastify  library to display success and error messages. 
  The  Login  component is exported as the default component. 
  Step 5: Create the Chat Component 
   */