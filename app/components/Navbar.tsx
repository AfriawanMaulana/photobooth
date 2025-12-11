"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const links = [
  {
    name: "Home",
    icon: "/assets/page-home.png",
    path: "/#home",
  },
  {
    name: "Join the Journey",
    icon: "/assets/page-about.png",
    path: "/#about",
  },
  {
    name: "Frames",
    icon: "/assets/page-frames.png",
    path: "/frames",
  },
  {
    name: "Create",
    icon: "/assets/page-create.png",
    path: "/frames",
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToElement = ({ path }: { path: string }) => {
    const target = document.getElementById(path);

    target?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="z-50 sticky flex w-full h-[76px] top-0 px-12 justify-between items-center bg-white">
      <Link href={"/"}>
        <Image src={"/assets/logo.png"} alt="" width={200} height={200} />
      </Link>

      <div className="hidden md:flex items-center gap-12">
        {links.map((nav) => (
          <Link
            key={nav.name}
            href={nav.path}
            onClick={() => scrollToElement({ path: nav.path })}
            className={`inline-flex gap-2 items-center font-semibold underline underline-offset-8 decoration-background`}
          >
            <Image src={nav.icon} alt="" width={20} height={20} />
            {nav.name}
          </Link>
        ))}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden cursor-pointer"
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="flex flex-col absolute top-[76px] right-0 w-full bg-white px-8 py-6 shadow-md md:hidden">
          {links.map((nav) => (
            <Link
              key={nav.name}
              href={`/${nav.path}`}
              className="inline-flex gap-2 items-center font-semibold py-2"
              onClick={() => setIsOpen(false)}
            >
              <Image src={nav.icon} alt="" width={20} height={20} />
              {nav.name}
            </Link>
          ))}
        </div>
      )}
      {/* <button className="py-3 px-5 rounded-full bg-background font-semibold">
        Login/Register
      </button> */}
    </nav>
  );
}
