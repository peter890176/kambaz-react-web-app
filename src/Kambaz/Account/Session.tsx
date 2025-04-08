import * as client from "./client";
import { useEffect, useState } from "react";
import { setCurrentUser } from "./reducer";
import { useDispatch } from "react-redux";
export default function Session({ children }: { children: any }) {
  const [pending, setPending] = useState(true);
  const dispatch = useDispatch();
  const fetchProfile = async () => {
    try {
      const currentUser = await client.profile();
      console.log("Session loaded user:", currentUser);
      if (currentUser && !currentUser.role) {
        // If the user has no role information, set a default role
        console.log("User missing role, setting default");
        currentUser.role = currentUser.role || "USER";
      }
      dispatch(setCurrentUser(currentUser));
    } catch (err: any) {
      console.error("Session error:", err);
    }
    setPending(false);
  };
  useEffect(() => {
    fetchProfile();
  }, []);
  if (!pending) {
    return children;
  }
  // Loading indicator
  return <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>;
}
