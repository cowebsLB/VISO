"use client";

import { publicAsset } from "@/lib/basePath";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

const CREDITS_URL = "https://cowebslb.com";

export function FooterChibiPeek() {
  const [hover, setHover] = useState(false);
  const [touchOpen, setTouchOpen] = useState(false);

  const toggleTouch = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) {
      setTouchOpen((v) => !v);
    }
  }, []);

  const open = hover || touchOpen;

  return (
    <div
      className="relative flex w-full cursor-pointer justify-center rounded-t-lg border-t border-transparent outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={toggleTouch}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setTouchOpen((v) => !v);
        }
      }}
      tabIndex={0}
      aria-expanded={open}
      aria-label="Credits — made by COwebs.lb"
    >
      <div
        className={`relative w-full max-w-lg overflow-hidden transition-[max-height] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "max-h-[min(55vh,360px)] duration-[750ms]" : "max-h-14 duration-[700ms]"
        }`}
      >
        <div
          className={`flex items-end justify-center gap-3 px-4 pb-2 pt-0 transition-[flex-direction] duration-500 motion-reduce:transition-none ${
            open ? "flex-row" : "flex-col"
          }`}
        >
          <div
            className={`relative shrink-0 transition-[width,opacity,margin] duration-500 motion-reduce:transition-none ${
              open
                ? "order-1 w-auto max-w-[200px] opacity-100"
                : "order-2 h-0 w-0 overflow-hidden opacity-0"
            }`}
          >
            <div className="relative z-[1] rounded-2xl border border-primary/20 bg-white px-3 py-2.5 text-left text-xs leading-snug text-slate-700 shadow-lg ring-1 ring-primary/10">
              <p>
                made by{" "}
                <Link
                  href={CREDITS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary-600 underline decoration-primary-300 underline-offset-2 hover:text-primary-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  COwebs.lb
                </Link>
                <span className="text-slate-500"> (cowebslb.com)</span>
              </p>
              <span
                className="absolute right-[-5px] top-1/2 z-0 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border border-primary/20 border-b-0 border-l-0 bg-white"
                aria-hidden
              />
            </div>
          </div>

          <div
            className={`relative flex shrink-0 justify-center ${open ? "order-2" : "order-1"}`}
          >
            <Image
              src={publicAsset("/made-by-chibi.png")}
              alt=""
              width={140}
              height={280}
              className="h-auto w-[118px] select-none object-contain object-top sm:w-[132px]"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
