"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  X,
  BookOpen,
} from "lucide-react";

export interface BookPage {
  title?: string;
  content: React.ReactNode;
  backContent?: React.ReactNode;
  pageNumber: number;
}

export interface InteractiveBookProps {
  coverImage: string;
  bookTitle?: string;
  bookAuthor?: string;
  pages: BookPage[];
  className?: string;
  width?: number | string;
  height?: number | string;
}

export default function InteractiveBook({
  coverImage,
  bookTitle = "Book Title",
  bookAuthor = "Author Name",
  pages,
  className,
  width = 350,
  height = 500,
}: InteractiveBookProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(-1);

  const handleOpenBook = () => setIsOpen(true);

  const handleCloseBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setCurrentPageIndex(-1);
  };

  const nextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const prevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPageIndex >= 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const restartBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPageIndex(-1);
  };

  const [isHovering, setIsHovering] = useState(false);

  const coverVariants = {
    closed: {
      rotateY: 0,
      zIndex: 100,
      transition: {
        rotateY: { duration: 0.8, ease: [0.645, 0.045, 0.355, 1] as const },
        zIndex: { delay: 0.8 },
      },
    },
    hoverClosed: {
      rotateY: -15,
      zIndex: 100,
      transition: {
        rotateY: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const },
        zIndex: { delay: 0 },
      },
    },
    open: {
      rotateY: -180,
      zIndex: 0,
      transition: {
        rotateY: { duration: 0.8, ease: [0.645, 0.045, 0.355, 1] as const },
        zIndex: { delay: 0.8 },
      },
    },
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center perspective-[2000px]",
        className
      )}
      style={{
        width: typeof width === "number" ? width * 2 + 100 : "100%",
        height: typeof height === "number" ? height + 150 : "auto",
        perspective: "2000px",
      }}
    >
      <div
        className={cn(
          "relative preserve-3d transition-transform duration-1000 ease-in-out",
          isOpen ? "translate-x-[50%]" : ""
        )}
        style={{ width, height }}
      >
        <motion.div
          className="absolute inset-0 h-full w-full origin-left"
          initial="closed"
          animate={isOpen ? "open" : isHovering ? "hoverClosed" : "closed"}
          variants={coverVariants}
          style={{ transformStyle: "preserve-3d" }}
          onClick={!isOpen ? handleOpenBook : undefined}
          onHoverStart={() => !isOpen && setIsHovering(true)}
          onHoverEnd={() => setIsHovering(false)}
        >
          <div
            className="absolute inset-0 h-full w-full cursor-pointer overflow-hidden rounded-r-md rounded-l-sm shadow-2xl backface-hidden group"
            style={{ transform: "translateZ(0.5px)" }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${coverImage})` }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-10 left-6 right-6 text-white">
              <h1 className="mb-2 font-serif text-3xl font-bold tracking-wide drop-shadow-lg">
                {bookTitle}
              </h1>
              <p className="font-sans text-sm uppercase tracking-widest opacity-90">
                {bookAuthor}
              </p>
            </div>

            <div className="absolute bottom-0 left-0 top-0 w-4 bg-gradient-to-r from-white/30 to-transparent opacity-40" />
            <div className="absolute left-[12px] bottom-0 top-0 w-[1px] bg-black/30" />
          </div>

          <div
            className="absolute inset-0 flex h-full w-full rotate-y-180 flex-col rounded-l-md rounded-r-sm border-r border-neutral-200 bg-[#fdfbf7] p-8 shadow-md backface-hidden"
            style={{ transform: "rotateY(180deg) translateZ(0.5px)" }}
          >
            <div className="flex flex-1 flex-col items-center justify-center text-center opacity-80">
              <h2 className="mb-2 text-2xl tracking-wide text-neutral-800 font-serif">
                {bookTitle}
              </h2>
              <div className="mb-3 h-[1px] w-8 bg-neutral-300" />
              <p className="text-xs uppercase tracking-widest text-neutral-500">
                Interactive Edition
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCloseBook}
              className="absolute left-4 top-4 p-2 text-neutral-400 transition-colors hover:text-neutral-800"
              title="Close Book"
            >
              <X size={18} />
            </motion.button>
          </div>
        </motion.div>

        <div
          className="absolute inset-0 h-full w-full z-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {pages.map((page, index) => {
            const isFlipped = index <= currentPageIndex;
            const isBuriedLeft = index < currentPageIndex;

            const variants = {
              flipped: {
                rotateY: -180,
                zIndex: index + 1,
                opacity: isBuriedLeft ? 0 : 1,
                transition: {
                  rotateY: {
                    duration: 0.6,
                    ease: [0.645, 0.045, 0.355, 1] as const,
                  },
                  zIndex: { delay: 0.6 },
                  opacity: {
                    delay: 0.5,
                    duration: 0.4,
                    ease: [0.2, 0.8, 0.2, 1] as const,
                  },
                },
              },
              unflipped: {
                rotateY: 0,
                zIndex: pages.length - index,
                opacity: 1,
                transition: {
                  rotateY: {
                    duration: 0.6,
                    ease: [0.645, 0.045, 0.355, 1] as const,
                  },
                  zIndex: { delay: 0 },
                  opacity: { delay: 0, duration: 0.2 },
                },
              },
            };

            return (
              <motion.div
                key={index}
                className="absolute inset-0 h-full w-full origin-left rounded-r-md rounded-l-sm border border-neutral-100 bg-[#fdfbf7] shadow-sm"
                style={{ transformStyle: "preserve-3d" }}
                initial="unflipped"
                animate={isOpen && isFlipped ? "flipped" : "unflipped"}
                variants={variants}
              >
                <div
                  className="absolute inset-0 flex h-full w-full flex-col bg-[#fdfbf7] p-8 backface-hidden"
                  style={{ transform: "translateZ(0.5px)" }}
                >
                  <div className="flex-1">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="prose prose-neutral flex h-full max-w-none flex-col font-serif leading-relaxed text-neutral-700 prose-sm"
                    >
                      <div className="mb-6 text-right font-sans text-xs tracking-wider text-neutral-400">
                        PAGE {page.pageNumber * 2 - 1}
                      </div>
                      {page.title && (
                        <h3 className="mb-8 text-center text-xl tracking-tight text-neutral-800 font-medium">
                          {page.title}
                        </h3>
                      )}
                      <div className="flex-1">{page.content}</div>
                    </motion.div>
                  </div>
                  <div className="pointer-events-none absolute left-0 bottom-0 top-0 w-6 bg-gradient-to-r from-black/5 to-transparent mix-blend-multiply" />
                  <div className="absolute left-[1px] bottom-0 top-0 w-[1px] bg-black/10" />
                </div>

                <div
                  className="absolute inset-0 flex h-full w-full rotate-y-180 flex-col overflow-hidden border-r border-neutral-200 bg-[#fdfbf7] p-8 backface-hidden"
                  style={{ transform: "rotateY(180deg) translateZ(0.5px)" }}
                >
                  <div className="pointer-events-none absolute right-0 bottom-0 top-0 w-6 bg-gradient-to-l from-black/5 to-transparent mix-blend-multiply" />
                  <div className="absolute right-[1px] bottom-0 top-0 w-[1px] bg-black/10" />

                  <div className="flex-1 overflow-hidden">
                    <div className="prose prose-neutral flex h-full max-w-none flex-col font-serif leading-relaxed text-neutral-700 prose-sm">
                      <div className="mb-6 text-left font-sans text-xs tracking-wider text-neutral-400">
                        PAGE {page.pageNumber * 2}
                      </div>
                      {page.backContent ? (
                        <div className="flex-1">{page.backContent}</div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center select-none opacity-[0.03]">
                          <span className="font-serif text-8xl italic font-bold text-black">
                            {page.pageNumber * 2}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          <div
            className="absolute inset-0 h-full w-full rounded-r-md rounded-l-sm border border-neutral-200 bg-[#fdfbf7] shadow-xl"
            style={{ transform: "translateZ(-1px)", zIndex: -1 }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-40">
              <p className="font-serif italic text-neutral-500">The End</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={restartBook}
                className="relative z-50 mt-4 flex cursor-pointer items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-200"
              >
                <RefreshCcw size={14} /> Read Again
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const }}
              className="absolute -bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-6 rounded-full border border-neutral-200/50 bg-white/90 px-8 py-4 shadow-2xl backdrop-blur-md dark:border-neutral-700/50 dark:bg-neutral-900/90"
            >
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
                whileTap={{ scale: 0.9 }}
                onClick={prevPage}
                disabled={currentPageIndex < 0}
                className="rounded-full p-2 text-neutral-700 transition-colors disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-200"
                title="Previous Page"
              >
                <ChevronLeft size={20} />
              </motion.button>

              <div className="flex min-w-[80px] flex-col items-center">
                <span className="font-serif text-sm font-medium tracking-widest text-neutral-800 dark:text-neutral-200">
                  {currentPageIndex < 0
                    ? "START"
                    : currentPageIndex >= pages.length - 1
                      ? "END"
                      : `${currentPageIndex + 2} / ${pages.length + 1}`}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                  {currentPageIndex < 0 ? "Cover" : "Reading"}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
                whileTap={{ scale: 0.9 }}
                onClick={nextPage}
                disabled={currentPageIndex >= pages.length - 1}
                className="rounded-full p-2 text-neutral-700 transition-colors disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-200"
                title="Next Page"
              >
                <ChevronRight size={20} />
              </motion.button>

              <div className="mx-2 h-8 w-[1px] bg-neutral-200 dark:bg-neutral-700" />

              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255,0,0,0.1)" }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseBook}
                className="rounded-full p-2 text-neutral-400 transition-colors hover:text-red-500"
                title="Close Book"
              >
                <BookOpen size={18} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 text-sm font-light uppercase tracking-widest text-neutral-400"
        >
          Click to Open
        </motion.div>
      )}
    </div>
  );
}
