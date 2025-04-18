import { FormControl } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentUser } from "./reducer";
import * as client from "./client";
//Modified by: Claude3.7

export default function Profile() {
  const [profile, setProfile] = useState<any>({});
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle'); // 'idle', 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state: any) => state.accountReducer);

  const updateProfile = async () => {
    console.log("Setting status to loading");
    setUpdateStatus('loading');
    setErrorMessage('');
    try {
      console.log("Calling client.updateUser");
      const updatedProfile = await client.updateUser(profile);
      console.log("client.updateUser success, dispatching", updatedProfile);
      dispatch(setCurrentUser(updatedProfile));
      console.log("Dispatch complete, setting status to success");
      setUpdateStatus('success');
      console.log("Status set to success, scheduling idle reset");
      // Optionally reset status after a few seconds
      setTimeout(() => {
        console.log("Resetting status to idle after success");
        setUpdateStatus('idle');
      }, 3000);
    } catch (error: any) {
      console.error("Update failed:", error);
      setUpdateStatus('error');
      setErrorMessage(error.message || 'Update failed. Please try again.');
       // Optionally reset status after a few seconds
       setTimeout(() => {
         console.log("Resetting status to idle after error");
         setUpdateStatus('idle');
       }, 5000);
    }
  };


  const fetchProfile = () => {
    if (!currentUser) return navigate("/Kambaz/Account/Signin");
    setProfile(currentUser);
  };


  const signout = async () => {
    await client.signout();
    dispatch(setCurrentUser(null));
    navigate("/Kambaz/Account/Signin");
  };



  useEffect(() => { fetchProfile(); }, []);
  return (
    <div className="wd-profile-screen">
      <h3>Profile</h3>
      {profile && (
        <div>
          <div className="form-group mb-2">
            <label htmlFor="wd-username" className="form-label">Username</label>
            <FormControl defaultValue={profile.username} id="wd-username" 
              onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
          </div>
          
          <div className="form-group mb-2">
            <label htmlFor="wd-password" className="form-label">Password</label>
            <FormControl defaultValue={profile.password} id="wd-password" type="password"
              onChange={(e) => setProfile({ ...profile, password: e.target.value })} />
          </div>
          
          <div className="form-group mb-2">
            <label htmlFor="wd-firstname" className="form-label">First Name</label>
            <FormControl defaultValue={profile.firstName} id="wd-firstname" 
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
          </div>
          
          <div className="form-group mb-2">
            <label htmlFor="wd-lastname" className="form-label">Last Name</label>
            <FormControl defaultValue={profile.lastName} id="wd-lastname" 
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
          </div>
          
          <div className="form-group mb-2">
            <label htmlFor="wd-dob" className="form-label">Date of Birth</label>
            <FormControl
              value={profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : ''}
              id="wd-dob" type="date"
              onChange={(e) => setProfile({ ...profile, dob: e.target.value })} />
          </div>
          
          <div className="form-group mb-2">
            <label htmlFor="wd-email" className="form-label">Email</label>
            <FormControl defaultValue={profile.email} id="wd-email" 
              onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </div>
          
          <div className="form-group mb-2">
            <label htmlFor="wd-role" className="form-label">Role</label>
            {currentUser && currentUser.role === "ADMIN" ? (
              <select 
                value={profile.role || ''}
                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                className="form-control" 
                id="wd-role"
              >
                <option value="" disabled>Select Role</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="FACULTY">Faculty</option>
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
              </select>
            ) : (
              <FormControl 
                defaultValue={profile.role} 
                id="wd-role" 
                disabled 
                className="form-control-plaintext border bg-light p-2"
              />
            )}
            {!currentUser || currentUser.role !== "ADMIN" ? (
              <small className="text-muted">Only administrators can change roles.</small>
            ) : null}
          </div>
          
          {/* Update Status Feedback */}
          {updateStatus === 'loading' && <div className="alert alert-info">Updating...</div>}
          {updateStatus === 'success' && <div className="alert alert-success">Profile updated successfully!</div>}
          {updateStatus === 'error' && <div className="alert alert-danger">Error: {errorMessage}</div>}

          <button onClick={updateProfile} className="btn btn-primary w-100 mb-2" disabled={updateStatus === 'loading'}>
            {updateStatus === 'loading' ? 'Updating...' : 'Update'}
          </button>
          <button onClick={signout} className="wd-signout-btn btn btn-danger w-100">
            Sign out
          </button>
        </div>
      )}
    </div>);
}