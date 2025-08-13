import { Scene } from "@/components/ui/rubik-s-cube";
import { History, ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen w-screen relative flex overflow-hidden">
      {/* Left side for content */}
      <div className="w-1/3 flex flex-col justify-center items-start p-8 z-10 bg-black bg-opacity-10 backdrop-blur-sm text-balance">
        <h1 className="text-4xl font-bold text-white">
          Rubik&apos;s Cube Solver.
        </h1>
        {/* Add more content here */}
        {/* The Get Started Button */}
        <Link
          href="/solver"
          className="mt-6 px-6 py-3 bg-white text-black rounded-lg transition-colors group"
        >
          Get Started
          <ArrowRightIcon
            className="inline ml-2 group-hover:translate-x-1 transition-transform"
            size={16}
          />
        </Link>
      </div>

      {/* Right side for Scene */}
      <div className="w-2/3">
        <Scene />
      </div>

      {/* History Button */}
      <Link
        href="/history"
        className="absolute top-6 right-6 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors group"
        title="View solve history"
      >
        <History
          size={24}
          className="text-white group-hover:text-blue-300 transition-colors"
        />
      </Link>
    </div>
  );
}
