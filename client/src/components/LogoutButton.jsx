import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function LogoutButton({ className = "" }) {
  const nav = useNavigate();

  async function onLogout() {
    await signOut(auth);
    nav("/login", { replace: true });
  }

  return (
    <button type="button" onClick={onLogout} className={className}>
      Logout
    </button>
  );
}
