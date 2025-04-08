import { FormControl } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentUser } from "./reducer";
import * as client from "./client";

export default function Profile() {
  const [profile, setProfile] = useState<any>({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state: any) => state.accountReducer);
  const updateProfile = async () => {
    const updatedProfile = await client.updateUser(profile);
    dispatch(setCurrentUser(updatedProfile));
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
            <FormControl defaultValue={profile.dob} id="wd-dob" type="date"
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

          </div>
          <button onClick={updateProfile} className="btn btn-primary w-100 mb-2"> Update </button>
          <button onClick={signout} className="wd-signout-btn btn btn-danger w-100">
            Sign out
          </button>
        </div>
      )}
    </div>);
}