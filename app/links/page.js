"use client";

export default function LinksPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Navigation Links</h1>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Login Pages</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <a 
                href="/login" 
                className="text-blue-500 hover:underline"
              >
                Original Login
              </a>
            </li>
            <li>
              <a 
                href="/simple-login" 
                className="text-blue-500 hover:underline"
              >
                Simple Login
              </a>
            </li>
            <li>
              <a 
                href="/direct-login" 
                className="text-blue-500 hover:underline"
              >
                Direct Login
              </a>
            </li>
            <li>
              <a 
                href="/standalone-login" 
                className="text-blue-500 hover:underline"
              >
                Standalone Login
              </a>
            </li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6">Dashboard Pages</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <a 
                href="/dashboard" 
                className="text-blue-500 hover:underline"
              >
                Original Dashboard
              </a>
            </li>
            <li>
              <a 
                href="/dashboard/test" 
                className="text-blue-500 hover:underline"
              >
                Dashboard Test Page
              </a>
            </li>
            <li>
              <a 
                href="/standalone-dashboard" 
                className="text-blue-500 hover:underline"
              >
                Standalone Dashboard
              </a>
            </li>
          </ul>
          
          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Use these links to navigate between different versions of the login and dashboard pages.
              The standalone versions are completely independent and don't rely on any existing components.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
