export default function App() {
  return (
    <>
      <div className="bg-zinc-900 h-screen flex">
        <div className="container mx-auto flex flex-col justify-center items-center space-y-4">
          <img src="/Logo.png" />
          <p className="text-5xl text-white">TMU Planner</p>
          <p className="text-xl text-white">Coming Soon!</p>
          <p className="text-md text-white pt-20">
            A project by{' '}
            <a
              className="text-blue-500 underline-offset-2 underline hover:text-blue-300"
              href="https://brndn.ly"
              target="_blank"
            >
              Brandon Ly
            </a>
          </p>
          <div className="container flex justify-center items-center space-x-2 pt-2">
            <p className="text-white">Check it out </p>
            <a href="https://github.com/brandonnly/tmu-planner" target="_blank">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-github text-white hover:text-grey-200"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
