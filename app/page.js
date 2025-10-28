import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";

export default function Page() {
  return (
    <>
      <header className="p-4 flex justify-end max-w-7xl mx-auto">
        <ButtonSignin text="Login" />
      </header>
      <main>
        <section className="flex flex-col items-center justify-center text-center gap-12 px-8 py-24">
          <h1 className="text-3xl font-extrabold">
            Wryda<span className="text-[#DC143C]">.ai</span> 🎬
          </h1>

          <p className="text-lg opacity-80">
            AI-Powered Screenplay Writing & Video Generation
          </p>

          <Link
            className="btn btn-primary"
            href="/dashboard"
          >
            Get Started{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
                clipRule="evenodd"
              />
            </svg>
          </Link>

          <p className="text-sm opacity-60">
            Transform your screenplay into professional videos with AI
          </p>
        </section>
      </main>
    </>
  );
}
