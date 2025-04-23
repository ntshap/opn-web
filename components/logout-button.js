"use client";

export default function LogoutButton() {
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('direct_token');
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('token_type');
    localStorage.removeItem('login_time');
    
    sessionStorage.removeItem('direct_token');
    sessionStorage.removeItem('is_logged_in');
    sessionStorage.removeItem('token_type');
    sessionStorage.removeItem('login_time');
    
    // Redirect to login
    window.location.href = '/direct-login';
  };
  
  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
    >
      Logout
    </button>
  );
}
