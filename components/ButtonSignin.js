/* eslint-disable @next/next/no-img-element */
"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import config from "@/config";

// A simple button to sign in with Clerk.
// It automatically redirects user to callbackUrl (config.auth.callbackUrl) after login, which is normally a private page for users to manage their accounts.
// If the user is already logged in, it will show their profile picture & redirect them to callbackUrl immediately.
const ButtonSignin = ({ text = "Get started", extraStyle }) => {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const handleClick = () => {
    if (user) {
      router.push(config.auth.callbackUrl);
    } else {
      router.push("/sign-in");
    }
  };

  if (!isLoaded) {
    return (
      <button className={`btn ${extraStyle ? extraStyle : ""}`} disabled>
        <span className="loading loading-spinner loading-xs"></span>
      </button>
    );
  }

  if (user) {
    return (
      <Link
        href={config.auth.callbackUrl}
        className={`btn ${extraStyle ? extraStyle : ""}`}
      >
        {user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={user.fullName || "Account"}
            className="w-6 h-6 rounded-full shrink-0"
            referrerPolicy="no-referrer"
            width={24}
            height={24}
          />
        ) : (
          <span className="w-6 h-6 bg-base-300 flex justify-center items-center rounded-full shrink-0">
            {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0)}
          </span>
        )}
        {user.fullName || user.emailAddresses[0]?.emailAddress || "Account"}
      </Link>
    );
  }

  return (
    <button
      className={`btn ${extraStyle ? extraStyle : ""}`}
      onClick={handleClick}
    >
      {text}
    </button>
  );
};

export default ButtonSignin;
